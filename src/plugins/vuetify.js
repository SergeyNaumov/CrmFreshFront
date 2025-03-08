import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import colors from 'vuetify/util/colors';
import '@/styles/colors/blue2.scss'; // Импорт SCSS стилей



//import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { aliases, fa } from 'vuetify/iconsets/fa4'

let color_scheme = 'blue'; // Цветовая схема
let main_color = colors[color_scheme];

let color_set = {
  primary: '#253a5d',
  lighten1: main_color.lighten1,
  lighten2: main_color.lighten2,
  lighten3: main_color.lighten3,
  lighten4: main_color.lighten4,
  lighten5: main_color.lighten5,
};
const theme = {
  defaultTheme: 'light', // Тема по умолчанию
  themes: {
    light: color_set, // Светлая тема
    dark: {
      primary: colors.blue.lighten3, // Тёмная тема
    },
  },
};

export default createVuetify({
  components,
  directives,
  theme,
  icons: {
    //defaultSet: 'mdi', // Используем Material Design Icons
    defaultSet: 'fa',
    sets: {
      fa
    },
  },
});