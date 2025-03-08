// import { createVuetify } from 'vuetify';
// import * as components from 'vuetify/components';
// import * as directives from 'vuetify/directives';

// //import '@mdi/font/css/materialdesignicons.css';

// import 'vuetify/styles'

import 'vuetify/styles'


import colors from 'vuetify/util/colors';
import '@/styles/colors/blue2.scss'; // Импорт SCSS стилей



// //import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
// import { aliases, fa } from 'vuetify/iconsets/fa4'

// let color_scheme = 'blue'; // Цветовая схема
// let main_color = colors[color_scheme];

// let color_set = {
//   primary: '#253a5d',
//   lighten1: main_color.lighten1,
//   lighten2: main_color.lighten2,
//   lighten3: main_color.lighten3,
//   lighten4: main_color.lighten4,
//   lighten5: main_color.lighten5,
// };
// const theme = {
//   defaultTheme: 'light', // Тема по умолчанию
//   themes: {
//     light: color_set, // Светлая тема
//     dark: {
//       primary: colors.blue.lighten3, // Тёмная тема
//     },
//   },
// };

// export default createVuetify({
//   components,
//   directives,
//   //theme,
//   icons: {
//     //defaultSet: 'mdi', // Используем Material Design Icons
//     defaultSet: 'fa',
//     sets: {
//       fa
//     },
//   },
// });

import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles' // Добавьте эту строку
import '@mdi/font/css/materialdesignicons.css' // И эту
import '@fortawesome/fontawesome-free/css/all.css';
import { aliases, mdi } from 'vuetify/iconsets/mdi'; // Импорт Material Design Icons
import { fa } from 'vuetify/iconsets/fa';


// Импортируем FontAwesome иконки
// import { library } from '@fortawesome/fontawesome-svg-core';
// import { fas } from '@fortawesome/free-solid-svg-icons';
// import { far } from '@fortawesome/free-regular-svg-icons';
// import { fab } from '@fortawesome/free-brands-svg-icons';
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';


export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light:{
        dark: false, // Указываем, что это светлая тема (false) или тёмная (true)
        colors: {
          primary: '#2196F3', // Основной цвет
          lighten1: '#90CAF9', // Светлый оттенок 1
          lighten2: '#64B5F6', // Светлый оттенок 2
          lighten3: '#90CAF9', // Светлый оттенок 3
          lighten4: '#BBDEFB', // Светлый оттенок 4
          lighten5: '#E3F2FD', // Светлый оттенок 5
          darken1: '#1E88E5', // Тёмный оттенок 1
          darken2: '#1976D2', // Тёмный оттенок 2
          darken3: '#1565C0', // Тёмный оттенок 3
          darken4: '#0D47A1', // Тёмный оттенок 4
          light: '#FFFFFF', // Белый цвет
          error: '#FF0000', // Цвет ошибки
        },
          variables: {
    'border-color': '#000000',
    'border-opacity': 0.12,
    'high-emphasis-opacity': 0.87,
    'medium-emphasis-opacity': 0.60,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.04,
    'hover-opacity': 0.04,
    'focus-opacity': 0.12,
    'selected-opacity': 0.08,
    'activated-opacity': 0.12,
    'pressed-opacity': 0.12,
    'dragged-opacity': 0.08,
    'theme-kbd': '#212529',
    'theme-on-kbd': '#FFFFFF',
    'theme-code': '#F5F5F5',
    'theme-on-code': '#000000',
  }
      },



    },
  },
  icons: {
    defaultSet: 'mdi',
  },
  sets:{
    fa, mdi
  }
})