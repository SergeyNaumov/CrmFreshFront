const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  configureWebpack: {
    plugins: [
      // Используйте встроенный ProgressPlugin из Webpack 5
      new (require('webpack')).ProgressPlugin(),
    ],
    resolve: {
      fallback: {
        http: require.resolve("stream-http"), // Полифил для http
        https: require.resolve("https-browserify"), // Полифил для https
        stream: require.resolve("stream-browserify"), // Полифил для stream
        os: require.resolve("os-browserify/browser"), // Полифил для os
        url: require.resolve("url/"), // Полифил для url
      },
    },
  },
});