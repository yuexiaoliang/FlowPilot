import { readFile } from 'node:fs/promises';
import { createServer, type Server, type ServerResponse } from 'node:http';
import path from 'node:path';

import { createFixtureManifest, findFixtureScenario, renderFixturePage } from './model';

export const FIXTURE_HOST = '127.0.0.1';
export const DEFAULT_FIXTURE_PORT = 43_128;

const publicRoot = path.resolve(__dirname, '../public');
const staticFiles = new Map([
  [
    '/client.js',
    { path: path.join(publicRoot, 'client.js'), contentType: 'text/javascript; charset=utf-8' },
  ],
  [
    '/fixture.css',
    { path: path.join(publicRoot, 'fixture.css'), contentType: 'text/css; charset=utf-8' },
  ],
  [
    '/assets/fake-cover.svg',
    {
      path: path.join(publicRoot, 'assets/fake-cover.svg'),
      contentType: 'image/svg+xml; charset=utf-8',
    },
  ],
]);

const securityHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
} as const;

export function parseFixturePort(rawPort: string | undefined): number {
  if (rawPort === undefined) {
    return DEFAULT_FIXTURE_PORT;
  }

  if (!/^\d{4,5}$/u.test(rawPort)) {
    throw new Error('FLOWPILOT_FIXTURE_PORT 必须是 1024–65535 之间且非 43127 的整数。');
  }

  const port = Number(rawPort);
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65_535 || port === 43_127) {
    throw new Error('FLOWPILOT_FIXTURE_PORT 必须是 1024–65535 之间且非 43127 的整数。');
  }

  return port;
}

function send(
  response: ServerResponse,
  statusCode: number,
  body: string | Buffer,
  contentType: string,
  headOnly: boolean,
): void {
  response.writeHead(statusCode, {
    ...securityHeaders,
    'Content-Type': contentType,
  });
  response.end(headOnly ? undefined : body);
}

export function createFixtureServer(): Server {
  return createServer(async (request, response) => {
    try {
      const method = request.method ?? 'GET';
      if (method !== 'GET' && method !== 'HEAD') {
        response.writeHead(405, { ...securityHeaders, Allow: 'GET, HEAD' });
        response.end();
        return;
      }

      const requestUrl = new URL(request.url ?? '/', 'http://fixture.local');
      const headOnly = method === 'HEAD';

      if (requestUrl.pathname === '/health') {
        send(
          response,
          200,
          JSON.stringify({ ok: true }),
          'application/json; charset=utf-8',
          headOnly,
        );
        return;
      }

      if (requestUrl.pathname === '/manifest') {
        send(
          response,
          200,
          JSON.stringify(createFixtureManifest()),
          'application/json; charset=utf-8',
          headOnly,
        );
        return;
      }

      const staticFile = staticFiles.get(requestUrl.pathname);
      if (staticFile !== undefined) {
        send(response, 200, await readFile(staticFile.path), staticFile.contentType, headOnly);
        return;
      }

      const scenario = findFixtureScenario(requestUrl.pathname);
      if (scenario !== undefined) {
        send(response, 200, renderFixturePage(scenario), 'text/html; charset=utf-8', headOnly);
        return;
      }

      send(response, 404, 'Fixture route not found.', 'text/plain; charset=utf-8', headOnly);
    } catch {
      send(response, 500, 'Fixture server failed.', 'text/plain; charset=utf-8', false);
    }
  });
}

function startFromCommandLine(): void {
  const port = parseFixturePort(process.env.FLOWPILOT_FIXTURE_PORT);
  const server = createFixtureServer();

  server.once('error', (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  server.listen(port, FIXTURE_HOST, () => {
    console.log(`FlowPilot fixture listening on http://${FIXTURE_HOST}:${port}`);
  });

  const stop = () => {
    server.close((error) => {
      if (error !== undefined) {
        console.error(error);
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

if (require.main === module) {
  startFromCommandLine();
}
