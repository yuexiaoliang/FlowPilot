const path = require('node:path');

const config = {
  packagerConfig: {
    asar: true,
    executableName: 'FlowPilot',
    ignore: [
      /^\/(?:e2e|scripts|src)(?:\/|$)/,
      /^\/\.flowpilot-package-node-modules(?:\/|$)/,
      /^\/(?:playwright-report|test-results|profiles|user-data)(?:\/|$)/,
      /^\/(?:forge\.config\.cjs|index\.html|playwright\.config\.ts|tsconfig(?:\.[^.]+)?\.json|vite\.config\.mts)$/,
      /(?:^|\/)\.env(?:\..*)?$/,
      /\.(?:pem|key|db|db-shm|db-wal|sqlite|sqlite3)$/i,
      /(?:^|\/)(?:storage-state|auth-state).*\.json$/i,
    ],
  },
  makers: [],
  outDir: path.resolve(__dirname, '../../out/desktop'),
};

module.exports = config;
