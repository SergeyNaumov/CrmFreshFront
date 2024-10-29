// компоненты, загружаемые автоматически
export const dynamic_component_loader=(Vue)=>{
	Vue.component('errors',()=> import('./components/errors.vue'));
	Vue.component('login',()=> import('./components/Login.vue'));
	Vue.component('register',()=> import('./components/Register.vue'));
	Vue.component('remember',()=> import('./components/Remember.vue'));
	Vue.component('const', ()=> import('./components/Const.vue'));

	Vue.component('edit-form', ()=> import('./components/EditForm'));
	Vue.component('admin-tree', ()=> import('./components/AdminTree'));
	Vue.component('admin-table', ()=> import('./components/AdminTable'));
	Vue.component('transfere-cards', ()=> import('./components/TransfereCards/TransfereCards'));
	Vue.component('parser-excel', ()=> import('./components/ParserExcel/ParserExcel'));
	Vue.component('documentation', ()=> import('./components/Documentation/Documentation'));
	Vue.component('table_component', ()=> import('./components/Table'));
	Vue.component('VideoList', ()=> import('./components/VideoList/VideoList'));
	Vue.component('Schedule', ()=> import('./components/Schedule/Schedule'));
	Vue.component('Messenger', ()=> import('./components/Messenger/Messenger'));

	// инструмент статистики
	Vue.component('stat-tool', ()=> import('./components/StatTool/StatTool'));
	/*
import SelectField from './components/fields/select';
Vue.component('field-select',SelectField);
	*/
	Vue.component('field-select',() => import('./components/fields/select'));
	Vue.component('field-1_to_m',() => import('./components/fields/1_to_m'));
	Vue.component('field-accordion', ()=> import('./components/fields/accordion'));
	Vue.component('field-chart', ()=> import('./components/fields/chart'));
	Vue.component('field-checkbox',()=>import('./components/fields/checkbox'))
	Vue.component('field-code',() => import('./components/fields/code'))	
	Vue.component('field-docpack',() => import('./components/fields/docpack'));
	Vue.component('field-file',()=>import('./components/fields/file'))
	Vue.component('field-font-awesome',()=>import('./components/fields/font-awesome'));
	Vue.component('field-memo',() => import('./components/fields/memo'));
	Vue.component('field-multiconnect',() => import('./components/fields/multiconnect'));
	Vue.component('field-table', ()=> import('./components/fields/table'));
	Vue.component('field-time_table', ()=> import('./components/fields/time_table'));
	Vue.component('field-wysiwyg',() => import('./components/fields/wysiwyg'))
	Vue.component('field-component',()=>import('./components/fields/component'))

// Фильтры:
	const filter_dir='./components/AdminTable/filters'
	Vue.component('filter-text',() => import(`${filter_dir}/text.vue`))	
	Vue.component('filter-in_ext_url',() => import(`${filter_dir}/in_ext_url.vue`))	
	Vue.component('filter-file',() => import(`${filter_dir}/file.vue`))
	Vue.component('filter-multiconnect',() => import(`${filter_dir}/multiconnect.vue`))
	Vue.component('filter-memo',() => import(`${filter_dir}/memo.vue`))
	Vue.component('filter-yearmon',() => import(`${filter_dir}/yearmon.vue`))
	Vue.component('filter-datetime',() => import(`${filter_dir}/datetime.vue`))
	Vue.component('filter-time',() => import(`${filter_dir}/time.vue`))
	Vue.component('filter-date',() => import(`${filter_dir}/date.vue`))
	Vue.component('filter-select',() => import(`${filter_dir}/select.vue`))


	/*
import FontAwesome from './components/fields/font-awesome';


import Multiconnect from ;
Vue.component('field-multiconnect',Multiconnect);

import Code from './components/fields/code';
Vue.component('field-code',Code);


		import CheckboxField from './components/fields/checkbox';
		Vue.component('field-checkbox',CheckboxField);
	*/
}