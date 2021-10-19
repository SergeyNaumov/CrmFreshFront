import Vue from 'vue'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css';
import Vuetify from 'vuetify/lib'
import colors from 'vuetify/lib/util/colors'


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

//import Login from './components/Login.vue';
//Vue.component('login',Login);
Vue.component('login',()=> import('./components/Login.vue'));
Vue.component('register',()=> import('./components/Register.vue'));
Vue.component('remember',()=> import('./components/Remember.vue'));
Vue.component('const', ()=> import('./components/Const.vue'));


//import EditForm from './components/EditForm.vue';
//Vue.component('edit-form',EditForm);
Vue.component('edit-form', ()=> import('./components/EditForm'));
Vue.component('admin-tree', ()=> import('./components/AdminTree'));
Vue.component('admin-table', ()=> import('./components/AdminTable'));
Vue.component('parser-excel', ()=> import('./components/ParserExcel'));
Vue.component('documentation', ()=> import('./components/Documentation/Documentation'));
Vue.component('VideoList', ()=> import('./components/VideoList/VideoList'));

Vue.component('field-accordion', ()=> import('./components/fields/accordion'));
Vue.component('field-table', ()=> import('./components/fields/table'));
Vue.component('field-chart', ()=> import('./components/fields/chart'));

import FormBlock from './components/EditForm/FormBlock';
Vue.component('form-block',FormBlock);

/*import DynamicLoader from './components/EditForm/DynamicLoader';
Vue.component('dynamic-loader',DynamicLoader);*/


import TextField from './components/fields/text';
Vue.component('field-text',TextField);



import InExtUrlField from './components/fields/in_ext_url';
Vue.component('field-in_ext_url',InExtUrlField);

import CheckboxField from './components/fields/checkbox';
Vue.component('field-checkbox',CheckboxField);

import SelectField from './components/fields/select';
Vue.component('field-select',SelectField);

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

import FontAwesome from './components/fields/font-awesome';
Vue.component('field-font-awesome',FontAwesome);


Vue.component('field-memo',() => import('./components/fields/memo'));
Vue.component('field-1_to_m',() => import('./components/fields/1_to_m'));
Vue.component('field-docpack',() => import('./components/fields/docpack'));


import Multiconnect from './components/fields/multiconnect';
Vue.component('field-multiconnect',Multiconnect);


import Code from './components/fields/code';
Vue.component('field-code',Code);


Vue.component('field-file',()=>import('./components/fields/file'))


Vue.component('field-wysiwyg',() => import('./components/fields/wysiwyg'))


// FIELDS END
// для вывода блока с ошибками (в разных компонентах может быть свой)
import Errors from './components/errors';
Vue.component('errors',Errors);

new Vue({
  vuetify,
  render: h => h(App)
}).$mount('#app')
