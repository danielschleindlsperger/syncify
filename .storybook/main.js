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
    return config
  },
}
