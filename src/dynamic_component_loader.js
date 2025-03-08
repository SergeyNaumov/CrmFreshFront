import { defineAsyncComponent } from 'vue';

export const dynamic_component_loader = (app) => {
  app.component('errors', defineAsyncComponent(() => import('./components/errors.vue')));
  app.component('login', defineAsyncComponent(() => import('./components/Login.vue')));
  app.component('register', defineAsyncComponent(() => import('./components/Register.vue')));
  app.component('remember', defineAsyncComponent(() => import('./components/Remember.vue')));
  app.component('const', defineAsyncComponent(() => import('./components/Const.vue')));

  // Остальные компоненты
  app.component('edit-form', defineAsyncComponent(() => import('./components/EditForm')));
  app.component('admin-tree', defineAsyncComponent(() => import('./components/AdminTree')));
  app.component('admin-table', defineAsyncComponent(() => import('./components/AdminTable')));
  app.component('transfere-cards', defineAsyncComponent(() => import('./components/TransfereCards/TransfereCards')));
  app.component('parser-excel', defineAsyncComponent(() => import('./components/ParserExcel/ParserExcel')));
  app.component('documentation', defineAsyncComponent(() => import('./components/Documentation/Documentation')));
  app.component('table_component', defineAsyncComponent(() => import('./components/Table')));
  app.component('VideoList', defineAsyncComponent(() => import('./components/VideoList/VideoList')));
  app.component('Schedule', defineAsyncComponent(() => import('./components/Schedule/Schedule')));
  app.component('Messenger', defineAsyncComponent(() => import('./components/Messenger/Messenger')));

  // Остальные компоненты
  app.component('field-select', defineAsyncComponent(() => import('./components/fields/select')));
  app.component('field-1_to_m', defineAsyncComponent(() => import('./components/fields/1_to_m')));
  app.component('field-accordion', defineAsyncComponent(() => import('./components/fields/accordion')));
  app.component('field-chart', defineAsyncComponent(() => import('./components/fields/chart')));
  app.component('field-checkbox', defineAsyncComponent(() => import('./components/fields/checkbox')));
  app.component('field-code', defineAsyncComponent(() => import('./components/fields/code')));
  app.component('field-docpack', defineAsyncComponent(() => import('./components/fields/docpack')));
  app.component('field-file', defineAsyncComponent(() => import('./components/fields/file')));
  app.component('field-font-awesome', defineAsyncComponent(() => import('./components/fields/font-awesome')));
  app.component('field-memo', defineAsyncComponent(() => import('./components/fields/memo')));
  app.component('field-multiconnect', defineAsyncComponent(() => import('./components/fields/multiconnect')));
  app.component('field-table', defineAsyncComponent(() => import('./components/fields/table')));
  app.component('field-time_table', defineAsyncComponent(() => import('./components/fields/time_table')));
  app.component('field-wysiwyg', defineAsyncComponent(() => import('./components/fields/wysiwyg')));
  app.component('field-component', defineAsyncComponent(() => import('./components/fields/component')));

  // Фильтры
  const filter_dir = './components/AdminTable/filters';
  app.component('filter-text', defineAsyncComponent(() => import(`${filter_dir}/text.vue`)));
  app.component('filter-in_ext_url', defineAsyncComponent(() => import(`${filter_dir}/in_ext_url.vue`)));
  app.component('filter-file', defineAsyncComponent(() => import(`${filter_dir}/file.vue`)));
  app.component('filter-multiconnect', defineAsyncComponent(() => import(`${filter_dir}/multiconnect.vue`)));
  app.component('filter-memo', defineAsyncComponent(() => import(`${filter_dir}/memo.vue`)));
  app.component('filter-yearmon', defineAsyncComponent(() => import(`${filter_dir}/yearmon.vue`)));
  app.component('filter-datetime', defineAsyncComponent(() => import(`${filter_dir}/datetime.vue`)));
  app.component('filter-time', defineAsyncComponent(() => import(`${filter_dir}/time.vue`)));
  app.component('filter-date', defineAsyncComponent(() => import(`${filter_dir}/date.vue`)));
  app.component('filter-select', defineAsyncComponent(() => import(`${filter_dir}/select.vue`)));
};