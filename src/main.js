import { createApp, computed } from 'vue';
import App from './App.vue';
import store from './store'

import mitt from 'mitt'; // Импортируем mitt

import vuetify from './plugins/vuetify'; // Импорт Vuetify из plugins/vuetify.js
import themePlugin from './plugins/theme';

import VueTheMask from 'vue-the-mask';

// import { useTheme } from 'vuetify'; // Импортируем useTheme

import { dynamic_component_loader } from './dynamic_component_loader.js'; // Ваш кастомный загрузчик компонентов


// begin FA
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons'; // Solid icons
import { far } from '@fortawesome/free-regular-svg-icons'; // Regular icons
import { fab } from '@fortawesome/free-brands-svg-icons'; // Brand icons
library.add(fas, far, fab);

// end FA


// Создаём экземпляр приложения Vue 3
const app = createApp(App);
// Регистрируем компонент fa для fontawesome

app.component('fa', FontAwesomeIcon);

const bus = mitt();
app.config.globalProperties.$bus = bus;


app.config.globalProperties.$theme = {
  rounded: true // или другое значение
};

app.config.globalProperties.$isMobile = () => {
  if (document.body.clientWidth < 1000) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// axios
import axios from 'axios';
//app.config.globalProperties.$http = axios;
const apiClient = axios.create({
  baseURL: '', // Замените на ваш API URL
  timeout: 10000, // Таймаут запроса
});
apiClient.interceptors.response.use(
  (response) => {
    // Успешный ответ
    return response;
  },
  (error) => {
    // Обработка ошибок при получении ответа
    if (error.response) {
      // Сервер вернул ошибку (например, 404, 500)
      console.error(`Ошибка ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // Запрос был отправлен, но ответ не получен
      console.error('Нет ответа от сервера:', error.request);
    } else {
      // Произошла ошибка при настройке запроса
      console.error('Ошибка:', error.message);
    }

    // Возвращаем ошибку дальше, чтобы компоненты могли её обработать
    return Promise.reject(error);
  }
);
app.config.globalProperties.$http = apiClient;

// vuedraggable
import draggable from 'vuedraggable';
app.component('draggable', draggable);

// Динамическая загрузка компонентов
dynamic_component_loader(app);

// import Password from '../fields/password';

// Регистрация компонентов
import FormBlock from './components/EditForm/FormBlock.vue';
app.component('form-block', FormBlock);

import PasswordField from './components/fields/password.vue';
app.component('field-password', PasswordField);

import TextField from './components/fields/text.vue';
app.component('field-text', TextField);

import InExtUrlField from './components/fields/in_ext_url.vue';
app.component('field-in_ext_url', InExtUrlField);

import DateField from './components/fields/date.vue';
app.component('field-date', DateField);

import TimeField from './components/fields/time.vue';
app.component('field-time', TimeField);

import DateTimeField from './components/fields/datetime.vue';
app.component('field-datetime', DateTimeField);

import YearMonField from './components/fields/yearmon.vue';
app.component('field-yearmon', YearMonField);

import DayMonField from './components/fields/daymon.vue';
app.component('field-daymon', DayMonField);

import GPTAssist from './components/GPTAssist/GPTAssist.vue';
app.component('GPTAssist', GPTAssist);

//import Errors from './components/errors';
//app.component('errors', Errors);

//app.component('font-awesome-icon', FontAwesomeIcon);
// Подключение Vuetify и монтирование приложения
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false;
app.use(vuetify);
app.use(themePlugin); // Подключаем плагин $theme
app.use(VueTheMask);
app.use(store)

app.mount('#app');