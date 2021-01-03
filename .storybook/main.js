const path = require('path')

module.exports = {
  stories: ['../src/**/*.stories.tsx'],
  addons: [],
  webpackFinal: async (config) => {
    // Typescript transpilation with babel
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      loader: require.resolve('babel-loader'),
    })
    config.resolve.extensions.push('.ts', '.tsx')

    // Exclude svg icons from being loaded by the file-loader since we want to use the svgr loader
    const fileLoaderRule = config.module.rules.find((rule) => rule.test.test('.svg'))
    const svgFolderPath = path.resolve(__dirname, '../src/icons')
    fileLoaderRule.exclude = svgFolderPath

    return config
  },
}
