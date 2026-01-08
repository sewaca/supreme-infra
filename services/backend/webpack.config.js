const fs = require('node:fs');
const path = require('node:path');
const nodeExternals = require('webpack-node-externals');
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

const MONOREPO_PACKAGE = /^@supreme-int\/([a-z]|-)+/;

module.exports = (options) => {
  const packagesDir = path.resolve(__dirname, '../../packages');

  // Динамически создаём алиасы для всех пакетов в packages/
  const packageAliases = {};
  if (fs.existsSync(packagesDir)) {
    const packages = fs.readdirSync(packagesDir);
    for (const pkg of packages) {
      const pkgPath = path.join(packagesDir, pkg);
      const srcPath = path.join(pkgPath, 'src');
      if (fs.existsSync(srcPath)) {
        packageAliases[`@supreme-int/${pkg}`] = srcPath;
      }
    }
  }

  return {
    ...options,
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: swcDefaultConfig,
          },
        },
      ],
    },
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
        ...packageAliases,
      },
      extensions: ['.ts', '.js', '.json', ...(options.resolve?.extensions || [])],
    },
    externals: [nodeExternals({ allowlist: [MONOREPO_PACKAGE] })],
  };
};
