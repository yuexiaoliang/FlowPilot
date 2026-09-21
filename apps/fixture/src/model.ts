export const FIXTURE_VERSIONS = ['v1', 'v2', 'v3'] as const;
export type FixtureVersion = (typeof FIXTURE_VERSIONS)[number];

export const FIXTURE_VARIANTS = [
  'normal',
  'dom-change',
  'ambiguity',
  'interstitial',
  'auth-expired',
  'security-challenge',
  'upload',
  'publish-success',
  'publish-failure',
] as const;
export type FixtureVariant = (typeof FIXTURE_VARIANTS)[number];

export type FixtureState =
  | 'EDITOR_READY'
  | 'EDITOR_READY_DOM_CHANGED'
  | 'TARGET_AMBIGUOUS'
  | 'INTERSTITIAL_REQUIRED'
  | 'AUTH_REQUIRED'
  | 'SECURITY_CHALLENGE'
  | 'UPLOAD_REQUIRED'
  | 'PUBLISH_READY';

export type FixtureScenario = Readonly<{
  initialState: FixtureState;
  variant: FixtureVariant;
  version: FixtureVersion;
}>;

export const FIXTURE_SCENARIOS = Object.freeze([
  { version: 'v1', variant: 'normal', initialState: 'EDITOR_READY' },
  { version: 'v1', variant: 'upload', initialState: 'UPLOAD_REQUIRED' },
  { version: 'v1', variant: 'publish-success', initialState: 'PUBLISH_READY' },
  { version: 'v1', variant: 'publish-failure', initialState: 'PUBLISH_READY' },
  { version: 'v2', variant: 'dom-change', initialState: 'EDITOR_READY_DOM_CHANGED' },
  { version: 'v2', variant: 'ambiguity', initialState: 'TARGET_AMBIGUOUS' },
  { version: 'v2', variant: 'interstitial', initialState: 'INTERSTITIAL_REQUIRED' },
  { version: 'v3', variant: 'auth-expired', initialState: 'AUTH_REQUIRED' },
  { version: 'v3', variant: 'security-challenge', initialState: 'SECURITY_CHALLENGE' },
] satisfies readonly FixtureScenario[]);

const scenarioByRoute = new Map(
  FIXTURE_SCENARIOS.map((scenario) => [
    `/fixture/${scenario.version}/${scenario.variant}`,
    scenario,
  ]),
);

export function findFixtureScenario(pathname: string): FixtureScenario | undefined {
  return scenarioByRoute.get(pathname);
}

function renderEditorFields(version: FixtureVersion, variant: FixtureVariant): string {
  const fields = `
    <label>
      Article title
      <input name="title" autocomplete="off" value="Deterministic fixture article">
    </label>
    <label>
      Article body
      <textarea name="body" rows="7">A local-only article body used for deterministic tests.</textarea>
    </label>`;

  if (variant === 'dom-change') {
    return `
      <div class="editor-grid" data-layout-revision="v2">
        <section class="editor-primary" aria-label="Article fields">${fields}</section>
        <aside class="editor-sidebar" aria-label="Publication summary">
          <p>Semantic controls are unchanged even though the DOM and layout moved.</p>
        </aside>
      </div>`;
  }

  return `<section class="editor-fields" data-layout-revision="${version}">${fields}</section>`;
}

function renderEditor(
  version: FixtureVersion,
  variant: FixtureVariant,
  action: 'normal-publish' | 'publish-failure' | 'publish-success' | null,
): string {
  const actionButton =
    action === null
      ? ''
      : `<button type="button" class="primary" data-action="${action}">Prepare publication</button>`;

  return `
    <form aria-label="Article editor" data-fixture-editor>
      ${renderEditorFields(version, variant)}
      ${actionButton}
    </form>`;
}

function renderVariantContent(scenario: FixtureScenario): string {
  switch (scenario.variant) {
    case 'normal':
      return `${renderEditor(scenario.version, scenario.variant, 'normal-publish')}
        <section data-confirmation hidden aria-label="Publication confirmation">
          <h2>Confirm local publication simulation</h2>
          <p>This changes only deterministic fixture state.</p>
          <button type="button" data-action="confirm-normal">Confirm simulation</button>
        </section>`;
    case 'dom-change':
      return renderEditor(scenario.version, scenario.variant, null);
    case 'ambiguity':
      return `
        <section aria-labelledby="ambiguity-title">
          <h2 id="ambiguity-title">Two publish actions match</h2>
          <p>Automation must report ambiguity instead of guessing.</p>
          <button type="button">Publish article</button>
          <button type="button">Publish article</button>
        </section>`;
    case 'interstitial':
      return `
        <section role="dialog" aria-modal="true" aria-labelledby="interstitial-title">
          <h2 id="interstitial-title">Review updated test terms</h2>
          <p>This deterministic interstitial blocks the editor until a person decides.</p>
          <button type="button">Stop and review</button>
        </section>`;
    case 'auth-expired':
      return `
        <section role="alert" aria-labelledby="auth-title">
          <h2 id="auth-title">Session expired</h2>
          <p>Authentication is required. The fixture never stores a real credential.</p>
          <button type="button">Sign in manually</button>
        </section>`;
    case 'security-challenge':
      return `
        <section role="alert" aria-labelledby="challenge-title">
          <h2 id="challenge-title">Security check required</h2>
          <p>Automation must stop. This fixture does not solve or bypass the challenge.</p>
        </section>`;
    case 'upload':
      return `${renderEditor(scenario.version, scenario.variant, null)}
        <label>
          Cover image
          <input type="file" name="cover" accept="image/svg+xml" data-upload-input>
        </label>
        <output data-upload-summary>No fake asset selected.</output>`;
    case 'publish-success':
      return renderEditor(scenario.version, scenario.variant, 'publish-success');
    case 'publish-failure':
      return renderEditor(scenario.version, scenario.variant, 'publish-failure');
  }
}

export function renderFixturePage(scenario: FixtureScenario): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FlowPilot Fixture · ${scenario.version} · ${scenario.variant}</title>
    <link rel="stylesheet" href="/fixture.css">
    <script src="/client.js" defer></script>
  </head>
  <body
    data-fixture-version="${scenario.version}"
    data-fixture-variant="${scenario.variant}"
    data-fixture-state="${scenario.initialState}"
  >
    <header>
      <strong>FlowPilot deterministic fixture</strong>
      <span>${scenario.version} / ${scenario.variant}</span>
    </header>
    <main data-page-layout="${scenario.version}">
      <p class="eyebrow">Local fixture · no external service</p>
      <h1>Article publishing test surface</h1>
      <p data-fixture-status role="status">${scenario.initialState}</p>
      ${renderVariantContent(scenario)}
    </main>
  </body>
</html>`;
}

export function createFixtureManifest() {
  return {
    schemaVersion: 1,
    scenarios: FIXTURE_SCENARIOS.map((scenario) => ({
      ...scenario,
      route: `/fixture/${scenario.version}/${scenario.variant}`,
    })),
  } as const;
}
