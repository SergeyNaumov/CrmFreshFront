const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true, // Транспиляция зависимостей
  configureWebpack: {
    plugins: [
      new (require('webpack').DefinePlugin)({
        __VUE_OPTIONS_API__: JSON.stringify(true), // Включаем Options API
        __VUE_PROD_DEVTOOLS__: JSON.stringify(false), // Отключаем DevTools в production
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false), // Отключаем подробности о несоответствиях при гидратации
      }),
    ],
  },
});