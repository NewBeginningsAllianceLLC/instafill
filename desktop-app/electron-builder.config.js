const path = require('path');

module.exports = {
  entry: './src/main/main.ts',
  output: {
    path: path.resolve(__dirname, 'dist-electron'),
    filename: 'main.js',
  },
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
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
};
