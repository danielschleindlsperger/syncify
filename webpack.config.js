const path = require('path')
const webpack = require('webpack')

// currently this has to be an exported object instead of a functions because "node-hot-loader" requires is
module.exports = {
  mode: 'development',
  entry: './src/server.ts',
  target: 'node',
  node: {
    global: true,
    __filename: true,
    __dirname: true,
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'app.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: { configFile: 'tsconfig.server.json', transpileOnly: true },
      },
    ],
  },
  plugins: [
    // suppress warnings from webpack about not being able to statically analyze some dependencies
    // https://github.com/kevinbeaty/any-promise/issues/31#issuecomment-562901581
    new webpack.ContextReplacementPlugin(/(any-promise|formidable)/),
    // fix error with transient dependency "formidable" of "koa-body"
    // https://github.com/node-formidable/formidable/issues/452#issuecomment-587501695
    new webpack.DefinePlugin({ 'global.GENTLY': false }),
  ],
}
