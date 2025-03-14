import 'vuetify/styles';
import colors from 'vuetify/util/colors';
import '@/styles/colors/blue2.scss'; // Импорт SCSS стилей

import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { h } from 'vue'; // Импортируем функцию h из Vue

//import '@fortawesome/fontawesome-free/css/all.css'; // Импорт FontAwesome

// material Design Icons (нужен для базовых компонентов)
import '@mdi/font/css/materialdesignicons.min.css';


export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        rounded:true,
        colors: {
          primary: '#253a5d',
          lighten1: '#5C6BC0',
          lighten2: '#7986CB',
          lighten3: '#9FA8DA',
          lighten4: '#C5CAE9',
          lighten5: '#E3F2FD',
          darken1: '#253a5d',
          darken2: '#1976d2',
          darken3: '#1565C0',
          darken4: '#0D47A1',
          light: '#FFFFFF',
          error: '#FF0000',
          text_on_primary: '#ffffff'
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
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi', // По умолчанию используется FontAwesome
    sets: {

      // fa: {
      //   component: (props) => {
      //     // Возвращаем HTML-элемент для FontAwesome иконок
      //     const iconClass = `fa ${props.icon}`;
      //     return h('i', { class: iconClass });
      //   },
      // },
      md: {
        // Определение компонента для Material Design Icons
        component: (props) => {
          const iconClass = `mdi ${props.icon}`;
          return h('i', { class: iconClass });
        },
      },
    },
  },
});