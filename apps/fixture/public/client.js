const fixtureBody = document.body;
const fixtureStatus = document.querySelector('[data-fixture-status]');

function setFixtureState(state, message) {
  fixtureBody.dataset.fixtureState = state;
  fixtureStatus.dataset.fixtureState = state;
  fixtureStatus.textContent = message;
}

document.querySelector('[data-action="normal-publish"]')?.addEventListener('click', () => {
  document.querySelector('[data-confirmation]')?.removeAttribute('hidden');
  setFixtureState('CONFIRMATION_REQUIRED', 'CONFIRMATION_REQUIRED');
});

document.querySelector('[data-action="confirm-normal"]')?.addEventListener('click', () => {
  setFixtureState('PUBLISH_SUCCEEDED', 'PUBLISH_SUCCEEDED · local fixture only');
});

document.querySelector('[data-action="publish-success"]')?.addEventListener('click', () => {
  setFixtureState('PUBLISH_SUCCEEDED', 'PUBLISH_SUCCEEDED · deterministic postcondition');
});

document.querySelector('[data-action="publish-failure"]')?.addEventListener('click', () => {
  setFixtureState('PUBLISH_FAILED', 'PUBLISH_FAILED · deterministic postcondition');
});

document.querySelector('[data-upload-input]')?.addEventListener('change', (event) => {
  const selectedFile = event.currentTarget.files?.[0];
  const uploadSummary = document.querySelector('[data-upload-summary]');

  if (selectedFile === undefined || uploadSummary === null) {
    setFixtureState('UPLOAD_REQUIRED', 'UPLOAD_REQUIRED');
    return;
  }

  uploadSummary.textContent = `${selectedFile.name} · ${selectedFile.type} · ${selectedFile.size} bytes`;
  setFixtureState('UPLOAD_READY', 'UPLOAD_READY · committed fake asset');
});
