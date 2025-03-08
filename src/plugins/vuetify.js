import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

//import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { aliases, fa } from 'vuetify/iconsets/fa4'

export default createVuetify({
  components,
  directives,
  icons: {
    //defaultSet: 'mdi', // Используем Material Design Icons
    defaultSet: 'fa',
    sets: {
      fa
    },
  },
});