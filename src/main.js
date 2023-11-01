import Vue from 'vue'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css';
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/lib/util/colors'
import { dynamic_component_loader } from './dynamic_component_loader.js'

let color_scheme='blue'; // цветовую гамму меняем тут
import '@/styles/colors/blue2.scss'; // и тут



export const bus = new Vue();
// green light-green cyanvv
let main_color=colors[color_scheme];
//main_color.base='#253a5d'
//console.log('BVA')
Vue.prototype.$color = main_color;
let color_set={ // текущий набор
  //primary: main_color.base, //'#253a5d',
  primary: '#253a5d',
  lighten1: main_color['lighten-1'],
  lighten2: main_color['lighten-2'],
  lighten3: main_color['lighten-3'],
  lighten4: main_color['lighten-4'],
  lighten5: main_color['lighten-5'],
};

let theme={
  rounded: true,
  themes: {
    light: color_set,
    dark: {
      primary: colors.blue.lighten3,
    },
  },
};

const vuetify = new Vuetify({
  theme: theme
});
//bus.colors_primary=colors.indigo;
window.log=console.log

Vue.prototype.$theme=theme
Vue.use(Vuetify)

Vue.prototype.$isMobile=function(){
  if(document.body.clientWidth<1000)
    return true;

  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
     return true;
   
  return false;
   
};

// axios
Vue.prototype.$http = require('axios');
Vue.config.productionTip = false

import draggable from "vuedraggable";
Vue.component('draggable',draggable);


dynamic_component_loader(Vue)

import FormBlock from './components/EditForm/FormBlock';
Vue.component('form-block',FormBlock);




import TextField from './components/fields/text';
Vue.component('field-text',TextField);



import InExtUrlField from './components/fields/in_ext_url';
Vue.component('field-in_ext_url',InExtUrlField);

//import CheckboxField from './components/fields/checkbox';
//veVue.component('field-checkbox',CheckboxField);



import DateField from './components/fields/date';
Vue.component('field-date',DateField);

import TimeField from './components/fields/time';
Vue.component('field-time',TimeField);

import DateTimeField from './components/fields/datetime';
Vue.component('field-datetime',DateTimeField);

import YearMonField from './components/fields/yearmon';
Vue.component('field-yearmon',YearMonField);

import DayMonField from './components/fields/daymon';
Vue.component('field-daymon',DayMonField);
















// FIELDS END
// для вывода блока с ошибками (в разных компонентах может быть свой)
import Errors from './components/errors';
Vue.component('errors',Errors);

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
