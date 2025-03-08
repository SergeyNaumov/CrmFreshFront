import { createApp } from 'vue';
import App from './App.vue';
import mitt from 'mitt'; // Импортируем mitt

import '@mdi/font/css/materialdesignicons.css'; // Импорт Material Design Icons
import '@fortawesome/fontawesome-free/css/all.css'; // Импорт Font Awesome

import vuetify from './plugins/vuetify'; // Импорт Vuetify из plugins/vuetify.js
import colors from 'vuetify/util/colors'; // Импорт цветов из Vuetify 3
import 'vuetify/styles'; // Импорт стилей Vuetify

import { dynamic_component_loader } from './dynamic_component_loader.js'; // Ваш кастомный загрузчик компонентов

let color_scheme = 'blue'; // Цветовая схема
import '@/styles/colors/blue2.scss'; // Импорт SCSS стилей

// Создаём экземпляр приложения Vue 3
const app = createApp(App);

// Создаём шину событий
const bus = mitt();
app.config.globalProperties.$bus = bus;

// Настройка цветовой схемы
let main_color = colors[color_scheme];
let color_set = {
  primary: '#253a5d',
  lighten1: main_color.lighten1,
  lighten2: main_color.lighten2,
  lighten3: main_color.lighten3,
  lighten4: main_color.lighten4,
  lighten5: main_color.lighten5,
};

// Глобальные свойства и методы
app.config.globalProperties.$color = main_color;
app.config.globalProperties.$theme = color_set;

app.config.globalProperties.$isMobile = () => {
  if (document.body.clientWidth < 1000) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// axios
import axios from 'axios';
app.config.globalProperties.$http = axios;
// Глобальный обработчик ошибок для Axios
// axios.interceptors.response.use(
//   (response) => {
//     // Если запрос успешен, просто возвращаем ответ
//     return response;
//   },
//   (error) => {
//     // Обрабатываем ошибку
//     if (error.response) {
//       // Ошибка с ответом от сервера (например, 4xx или 5xx)
//       console.error('Ошибка сервера:', error.response.status, error.response.data);
//     } else if (error.request) {
//       // Ошибка сети (например, нет ответа от сервера)
//       console.error('Ошибка сети:', error.message);
//     } else {
//       // Другие ошибки
//       console.error('Ошибка:', error.message);
//     }

//     // Возвращаем отклонённый промис, чтобы ошибка не "всплывала" дальше
//     return Promise.reject(error);
//   }
// );



// vuedraggable
import draggable from 'vuedraggable';
app.component('draggable', draggable);

// Динамическая загрузка компонентов
dynamic_component_loader(app);

// Регистрация компонентов
import FormBlock from './components/EditForm/FormBlock';
app.component('form-block', FormBlock);

import TextField from './components/fields/text';
app.component('field-text', TextField);

import InExtUrlField from './components/fields/in_ext_url';
app.component('field-in_ext_url', InExtUrlField);

import DateField from './components/fields/date';
app.component('field-date', DateField);

import TimeField from './components/fields/time';
app.component('field-time', TimeField);

import DateTimeField from './components/fields/datetime';
app.component('field-datetime', DateTimeField);

import YearMonField from './components/fields/yearmon';
app.component('field-yearmon', YearMonField);

import DayMonField from './components/fields/daymon';
app.component('field-daymon', DayMonField);

import GPTAssist from './components/GPTAssist/GPTAssist';
app.component('GPTAssist', GPTAssist);

import Errors from './components/errors';
app.component('errors', Errors);

// Подключение Vuetify и монтирование приложения
app.use(vuetify).mount('#app');