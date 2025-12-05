const path = require('path');

module.exports = [
  {
    mode: process.env.NODE_ENV || 'production',
    entry: './src/main/main.ts',
    target: 'electron-main',
    output: {
      path: path.resolve(__dirname, 'dist-electron'),
      filename: 'main.js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.electron.json',
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
  },
  {
    mode: process.env.NODE_ENV || 'production',
    entry: './src/main/preload.ts',
    target: 'electron-preload',
    output: {
      path: path.resolve(__dirname, 'dist-electron'),
      filename: 'preload.js',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.electron.json',
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
  },
];
