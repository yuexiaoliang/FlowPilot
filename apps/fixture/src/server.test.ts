import type { AddressInfo } from 'node:net';

import { afterEach, describe, expect, it } from 'vitest';

import { FIXTURE_SCENARIOS } from './model';
import {
  DEFAULT_FIXTURE_PORT,
  FIXTURE_HOST,
  createFixtureServer,
  parseFixturePort,
} from './server';

const openServers = new Set<ReturnType<typeof createFixtureServer>>();

afterEach(async () => {
  await Promise.all(
    [...openServers].map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error !== undefined) {
              reject(error);
              return;
            }
            resolve();
          });
        }),
    ),
  );
  openServers.clear();
});

async function startTestServer(): Promise<string> {
  const server = createFixtureServer();
  openServers.add(server);

  await new Promise<void>((resolve) => {
    server.listen(0, FIXTURE_HOST, resolve);
  });

  const address = server.address() as AddressInfo;
  return `http://${FIXTURE_HOST}:${address.port}`;
}

describe('fixture server', () => {
  it('uses a fixed uncommon default port and validates explicit overrides', () => {
    expect(DEFAULT_FIXTURE_PORT).toBe(43_128);
    expect(parseFixturePort(undefined)).toBe(43_128);
    expect(parseFixturePort('54321')).toBe(54_321);

    for (const invalidPort of ['', '43128.5', '80', '43127', '65536', 'not-a-port']) {
      expect(() => parseFixturePort(invalidPort)).toThrow(/1024–65535.*43127/u);
    }
  });

  it('serves the manifest, every stable scenario, and strict security headers', async () => {
    const origin = await startTestServer();
    const health = await fetch(`${origin}/health`);
    expect(await health.json()).toEqual({ ok: true });

    const manifest = await fetch(`${origin}/manifest`);
    expect((await manifest.json()).scenarios).toHaveLength(FIXTURE_SCENARIOS.length);

    for (const scenario of FIXTURE_SCENARIOS) {
      const response = await fetch(`${origin}/fixture/${scenario.version}/${scenario.variant}`);
      const html = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(html).toContain(`data-fixture-state="${scenario.initialState}"`);
    }
  });

  it('serves only committed static assets and rejects unknown or mutating routes', async () => {
    const origin = await startTestServer();

    const fakeCover = await fetch(`${origin}/assets/fake-cover.svg`);
    expect(fakeCover.headers.get('content-type')).toBe('image/svg+xml; charset=utf-8');
    expect(await fakeCover.text()).toContain('FlowPilot fake cover');

    expect((await fetch(`${origin}/fixture/v4/normal`)).status).toBe(404);
    expect((await fetch(`${origin}/../../package.json`)).status).toBe(404);
    expect((await fetch(`${origin}/manifest`, { method: 'POST' })).status).toBe(405);
  });
});
