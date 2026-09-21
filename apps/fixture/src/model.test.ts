import { describe, expect, it } from 'vitest';

import {
  FIXTURE_SCENARIOS,
  FIXTURE_VARIANTS,
  FIXTURE_VERSIONS,
  createFixtureManifest,
  findFixtureScenario,
  renderFixturePage,
} from './model';

describe('deterministic fixture registry', () => {
  it('covers every required version and variant exactly once', () => {
    expect(FIXTURE_VERSIONS).toEqual(['v1', 'v2', 'v3']);
    expect(FIXTURE_VARIANTS).toEqual([
      'normal',
      'dom-change',
      'ambiguity',
      'interstitial',
      'auth-expired',
      'security-challenge',
      'upload',
      'publish-success',
      'publish-failure',
    ]);
    expect(FIXTURE_SCENARIOS.map(({ variant }) => variant).sort()).toEqual(
      [...FIXTURE_VARIANTS].sort(),
    );
    expect(new Set(FIXTURE_SCENARIOS.map(({ version }) => version))).toEqual(
      new Set(FIXTURE_VERSIONS),
    );
  });

  it('maps only explicit stable routes', () => {
    for (const scenario of FIXTURE_SCENARIOS) {
      expect(findFixtureScenario(`/fixture/${scenario.version}/${scenario.variant}`)).toBe(
        scenario,
      );
    }

    expect(findFixtureScenario('/fixture/v4/normal')).toBeUndefined();
    expect(findFixtureScenario('/fixture/v1/security-challenge')).toBeUndefined();
    expect(findFixtureScenario('/fixture/v1/normal/extra')).toBeUndefined();
  });

  it('renders stable semantic state without time, randomness, credentials, or external URLs', () => {
    for (const scenario of FIXTURE_SCENARIOS) {
      const firstRender = renderFixturePage(scenario);
      const secondRender = renderFixturePage(scenario);

      expect(firstRender).toBe(secondRender);
      expect(firstRender).toContain(`data-fixture-version="${scenario.version}"`);
      expect(firstRender).toContain(`data-fixture-variant="${scenario.variant}"`);
      expect(firstRender).toContain(`data-fixture-state="${scenario.initialState}"`);
      expect(firstRender).not.toMatch(/https?:\/\//u);
      expect(firstRender).not.toMatch(/password|bearer|api[_-]?key|cookie/iu);
    }
  });

  it('publishes a deterministic manifest for every route', () => {
    expect(createFixtureManifest()).toEqual({
      schemaVersion: 1,
      scenarios: FIXTURE_SCENARIOS.map((scenario) => ({
        ...scenario,
        route: `/fixture/${scenario.version}/${scenario.variant}`,
      })),
    });
  });
});
