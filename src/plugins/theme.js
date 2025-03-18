export default {
    install(app) {
      app.config.globalProperties.$theme = {
        rounded: true, // Устанавливаем rounded в false
      };
    },
};