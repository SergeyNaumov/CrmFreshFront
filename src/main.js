import { createApp, computed } from 'vue';
import App from './App.vue';
import mitt from 'mitt'; // Импортируем mitt

import vuetify from './plugins/vuetify'; // Импорт Vuetify из plugins/vuetify.js

import { useTheme } from 'vuetify'; // Импортируем useTheme

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

// Настройка цветовой схемы
// let main_color = colors[color_scheme];
// let color_set = {
//   primary: '#253a5d',
//   lighten1: main_color.lighten1,
//   lighten2: main_color.lighten2,
//   lighten3: main_color.lighten3,
//   lighten4: main_color.lighten4,
//   lighten5: main_color.lighten5,
// };

// // Глобальные свойства и методы
// app.config.globalProperties.$color = main_color;
// app.config.globalProperties.$theme = color_set;
app.config.globalProperties.$theme = {
  rounded: true // или другое значение
};

app.config.globalProperties.$isMobile = () => {
  if (document.body.clientWidth < 1000) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// axios
import axios from 'axios';
app.config.globalProperties.$http = axios;



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

//import Errors from './components/errors';
//app.component('errors', Errors);

//app.component('font-awesome-icon', FontAwesomeIcon);
// Подключение Vuetify и монтирование приложения
app.use(vuetify).mount('#app');