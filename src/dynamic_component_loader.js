import { defineAsyncComponent } from 'vue';

export const dynamic_component_loader = (app) => {
  // Регистрация основных компонентов
  app.component('errors', defineAsyncComponent(() => import('./components/errors.vue')));
  app.component('login', defineAsyncComponent(() => import('./components/Login.vue')));
  app.component('register', defineAsyncComponent(() => import('./components/Register.vue')));
  app.component('remember', defineAsyncComponent(() => import('./components/Remember.vue')));
  app.component('const', defineAsyncComponent(() => import('./components/Const.vue')));

  // Остальные компоненты
  app.component('edit-form', defineAsyncComponent(() => import('./components/EditForm.vue')));
  app.component('admin-tree', defineAsyncComponent(() => import('./components/AdminTree.vue')));
  app.component('admin-table', defineAsyncComponent(() => import('./components/AdminTable.vue')));
  app.component('transfere-cards', defineAsyncComponent(() => import('./components/TransfereCards/TransfereCards.vue')));
  app.component('parser-excel', defineAsyncComponent(() => import('./components/ParserExcel/ParserExcel.vue')));
  app.component('documentation', defineAsyncComponent(() => import('./components/Documentation/Documentation.vue')));
  app.component('table_component', defineAsyncComponent(() => import('./components/Table.vue')));
  app.component('VideoList', defineAsyncComponent(() => import('./components/VideoList/VideoList.vue')));
  app.component('Schedule', defineAsyncComponent(() => import('./components/Schedule/Schedule.vue')));
  app.component('Messenger', defineAsyncComponent(() => import('./components/Messenger/Messenger.vue')));
  app.component('email', defineAsyncComponent(() => import('./components/fields/text_subtypes/email.vue')));
  app.component('qr_call', defineAsyncComponent(() => import('./components/fields/text_subtypes/qr_call.vue')));

  // Инструмент статистики
  app.component('stat-tool-result', defineAsyncComponent(() => import('./components/StatTool/StatToolResult.vue')));
  app.component('stat-tool', defineAsyncComponent(() => import('./components/StatTool/StatTool.vue')));

  // Остальные компоненты
  app.component('field-select', defineAsyncComponent(() => import('./components/fields/select.vue')));
  app.component('field-1_to_m', defineAsyncComponent(() => import('./components/fields/1_to_m.vue')));
  app.component('field-accordion', defineAsyncComponent(() => import('./components/fields/accordion.vue')));
  app.component('field-chart', defineAsyncComponent(() => import('./components/fields/chart.vue')));
  app.component('field-checkbox', defineAsyncComponent(() => import('./components/fields/checkbox.vue')));
  app.component('field-code', defineAsyncComponent(() => import('./components/fields/code.vue')));
  app.component('field-docpack', defineAsyncComponent(() => import('./components/fields/docpack.vue')));
  app.component('field-file', defineAsyncComponent(() => import('./components/fields/file.vue')));
  app.component('field-font-awesome', defineAsyncComponent(() => import('./components/fields/font-awesome.vue')));
  app.component('field-memo', defineAsyncComponent(() => import('./components/fields/memo.vue')));
  app.component('field-multiconnect', defineAsyncComponent(() => import('./components/fields/multiconnect.vue')));
  app.component('field-table', defineAsyncComponent(() => import('./components/fields/table.vue')));
  app.component('field-time_table', defineAsyncComponent(() => import('./components/fields/time_table.vue')));
  app.component('field-wysiwyg', defineAsyncComponent(() => import('./components/fields/wysiwyg.vue')));
  app.component('field-component', defineAsyncComponent(() => import('./components/fields/component.vue')));

  // Фильтры
  const filterComponents = import.meta.glob('./components/AdminTable/filters/*.vue');

  app.component('filter-text', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/text.vue']()));
  app.component('filter-in_ext_url', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/in_ext_url.vue']()));
  app.component('filter-file', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/file.vue']()));
  app.component('filter-multiconnect', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/multiconnect.vue']()));
  app.component('filter-memo', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/memo.vue']()));
  app.component('filter-yearmon', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/yearmon.vue']()));
  app.component('filter-daymon', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/daymon.vue']()));
  app.component('filter-datetime', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/datetime.vue']()));
  app.component('filter-time', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/time.vue']()));
  app.component('filter-date', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/date.vue']()));
  app.component('filter-select', defineAsyncComponent(() => filterComponents['./components/AdminTable/filters/select.vue']()));
};