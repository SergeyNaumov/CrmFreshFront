// компоненты, загружаемые автоматически
import { defineAsyncComponent } from 'vue'

export const dynamic_component_loader = (app) => {
	app.component('login', defineAsyncComponent(() => import('./components/Login.vue')));
	app.component('register', defineAsyncComponent(() => import('./components/Register.vue')));
	app.component('remember', defineAsyncComponent(() => import('./components/Remember.vue')));
	app.component('const', defineAsyncComponent(() => import('./components/Const.vue')));

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

	// инструмент статистики
	app.component('stat-tool', defineAsyncComponent(() => import('./components/StatTool/StatTool.vue')));

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
	app.component('field-multiconnect_old', defineAsyncComponent(() => import('./components/fields/multiconnect_old.vue')));
	app.component('field-table', defineAsyncComponent(() => import('./components/fields/table.vue')));
	app.component('field-time_table', defineAsyncComponent(() => import('./components/fields/time_table.vue')));
	app.component('field-wysiwyg', defineAsyncComponent(() => import('./components/fields/wysiwyg.vue')));
	app.component('field-component', defineAsyncComponent(() => import('./components/fields/component.vue')));

	// Поля-приложения админ-панели svcms (группа svcmsAdmin)
	app.component('field-project_sitemap', defineAsyncComponent(() => import('./components/svcmsAdmin/ProjectSitemap.vue')));
	app.component('field-project_export', defineAsyncComponent(() => import('./components/svcmsAdmin/ProjectExport.vue')));
	app.component('field-project_clone', defineAsyncComponent(() => import('./components/svcmsAdmin/ProjectClone.vue')));
	app.component('field-project_struct', defineAsyncComponent(() => import('./components/svcmsAdmin/ProjectCreateStruct.vue')));

	// Фильтры:
	app.component('filter-text', defineAsyncComponent(() => import('./components/AdminTable/filters/text.vue')));
	app.component('filter-in_ext_url', defineAsyncComponent(() => import('./components/AdminTable/filters/in_ext_url.vue')));
	app.component('filter-file', defineAsyncComponent(() => import('./components/AdminTable/filters/file.vue')));
	app.component('filter-multiconnect', defineAsyncComponent(() => import('./components/AdminTable/filters/multiconnect.vue')));
	app.component('filter-memo', defineAsyncComponent(() => import('./components/AdminTable/filters/memo.vue')));
	app.component('filter-yearmon', defineAsyncComponent(() => import('./components/AdminTable/filters/yearmon.vue')));
	app.component('filter-datetime', defineAsyncComponent(() => import('./components/AdminTable/filters/datetime.vue')));
	app.component('filter-time', defineAsyncComponent(() => import('./components/AdminTable/filters/time.vue')));
	app.component('filter-date', defineAsyncComponent(() => import('./components/AdminTable/filters/date.vue')));
	app.component('filter-select', defineAsyncComponent(() => import('./components/AdminTable/filters/select.vue')));
}
