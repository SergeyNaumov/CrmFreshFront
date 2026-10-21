import { createRouter, createWebHistory } from 'vue-router'

// Хелперы пропсов: компоненты страниц ожидают props 'params' и (для full-screen) 'is_headapp'.
const shellProps = (route) => ({ params: { config: route.params.config, base: route.params.base || [] } })
const blankProps = (route) => ({
  params: {
    config: route.params.config,
    id: route.params.id != null ? route.params.id : null,
    action: route.params.id != null ? 'edit' : 'new',
    base: route.params.base || [],
  },
  is_headapp: '1',
})

// Разбор конструктора: view/page_id — для переходов внутри конструктора
// (/page/<id>, /structure, /theme/<axis>), см. PageConstructor.apply_route().
const pageConstructorProps = (route) => ({
  params: {
    domain_id: route.params.domain_id,
    view: route.params.view || '',
    page_id: route.params.page_id || '',
    block_id: route.params.block_id || '',
    axis: route.params.axis || ''
  },
  is_headapp: '1',
})
const shellPageConstructorProps = (route) => ({
  params: {
    domain_id: route.params.domain_id,
    view: route.params.view || '',
    page_id: route.params.page_id || '',
    block_id: route.params.block_id || '',
    axis: route.params.axis || ''
  },
})

const MainPage = () => import('../MainPage.vue')
const AdminTable = () => import('../components/AdminTable.vue')
const AdminTree = () => import('../components/AdminTree.vue')
const EditForm = () => import('../components/EditForm.vue')
const Const = () => import('../components/Const.vue')
const Documentation = () => import('../components/Documentation/Documentation.vue')
const VideoList = () => import('../components/VideoList/VideoList.vue')
const StatTool = () => import('../components/StatTool/StatTool.vue')
const ParserExcel = () => import('../components/ParserExcel/ParserExcel.vue')
const Schedule = () => import('../components/Schedule/Schedule.vue')
const TransfereCards = () => import('../components/TransfereCards/TransfereCards.vue')
const TableComponent = () => import('../components/Table.vue')
const FileNavigator = () => import('../components/FileNavigator/FileNavigator.vue')
const PageConstructor = () => import('../components/svcmsAdmin/PageConstructor.vue')
const CreateProject = () => import('../components/svcmsAdmin/CreateProject.vue')
const DomainSync = () => import('../components/svcmsAdmin/DomainSync.vue')
const ProjectDataTransfer = () => import('../components/svcmsManager/ProjectDataTransfer.vue')
const ProjectApi = () => import('../components/svcmsManager/ProjectApi.vue')
const Login = () => import('../components/Login.vue')
const Register = () => import('../components/Register.vue')
const Remember = () => import('../components/Remember.vue')
const Fallback = () => import('../components/FallbackRoute.vue')

const routes = [
  // ---------- Shell (внутри App: меню + контент), URL /vue/... ----------
  { path: '/', name: 'mainpage', component: MainPage },
  { path: '/vue/admin_table/:config', name: 'shell-admin-table', component: AdminTable, props: shellProps },
  { path: '/vue/admin_tree/:config', name: 'shell-admin-tree', component: AdminTree, props: shellProps },
  { path: '/vue/const/:config', name: 'shell-const', component: Const, props: shellProps },
  { path: '/vue/documentation/:config', name: 'shell-documentation', component: Documentation, props: shellProps },
  { path: '/vue/video_list/:config', name: 'shell-video-list', component: VideoList, props: shellProps },
  { path: '/vue/stat-tool/:config', name: 'shell-stat-tool', component: StatTool, props: shellProps },
  { path: '/vue/parser-excel/:config', name: 'shell-parser-excel', component: ParserExcel, props: shellProps },
  { path: '/vue/Schedule/:config', name: 'shell-schedule', component: Schedule, props: shellProps },
  { path: '/vue/table/:config', name: 'shell-table', component: TableComponent, props: shellProps },
  { path: '/vue/filenavigator/:config/:base(.*)*', name: 'shell-filenavigator', component: FileNavigator, props: shellProps },
  { path: '/vue/page-constructor/:domain_id', name: 'shell-page-constructor', component: PageConstructor, props: shellPageConstructorProps },
  { path: '/vue/page-constructor/:domain_id/:view(page|structure)', name: 'shell-page-constructor-view', component: PageConstructor, props: shellPageConstructorProps },
  { path: '/vue/page-constructor/:domain_id/:view(page)/:page_id', name: 'shell-page-constructor-page', component: PageConstructor, props: shellPageConstructorProps },
  { path: '/vue/page-constructor/:domain_id/:view(page)/:page_id/block/:block_id', name: 'shell-page-constructor-block', component: PageConstructor, props: shellPageConstructorProps },
  { path: '/vue/page-constructor/:domain_id/theme/:axis(color|style|layout|font)', name: 'shell-page-constructor-theme', component: PageConstructor, props: shellPageConstructorProps },
  { path: '/vue/svcmsadmin-createproject', name: 'shell-create-project', component: CreateProject, props: shellProps },
  { path: '/vue/svcmsadmin-domainsync', name: 'shell-domain-sync', component: DomainSync, props: shellProps },
  { path: '/vue/ds-data', name: 'shell-ds-data', component: ProjectDataTransfer, props: shellProps },
  { path: '/vue/ds-api', name: 'shell-ds-api', component: ProjectApi, props: shellProps },

  // ---------- Full-screen (без меню), URL /... ----------
  { path: '/edit_form/:config/:id?', name: 'edit-form', component: EditForm, props: blankProps, alias: ['/edit-form/:config/:id?'], meta: { blank: true } },
  { path: '/transfere_cards/:config', name: 'transfere-cards', component: TransfereCards, props: blankProps, alias: ['/transfere-cards/:config'], meta: { blank: true } },
  { path: '/admin_table/:config', name: 'headapp-admin-table', component: AdminTable, props: blankProps, alias: ['/admin-table/:config'], meta: { blank: true } },
  { path: '/admin_tree/:config', name: 'headapp-admin-tree', component: AdminTree, props: blankProps, alias: ['/admin-tree/:config'], meta: { blank: true } },
  { path: '/table/:config', name: 'headapp-table', component: TableComponent, props: blankProps, meta: { blank: true } },
  { path: '/filenavigator/:config/:base(.*)*', name: 'file-navigator', component: FileNavigator, props: blankProps, alias: ['/file-navigator/:config/:base(.*)*'], meta: { blank: true } },
  { path: '/page-constructor/:domain_id', name: 'page-constructor', component: PageConstructor, props: pageConstructorProps, meta: { blank: true } },
  { path: '/page-constructor/:domain_id/:view(page|structure)', name: 'page-constructor-view', component: PageConstructor, props: pageConstructorProps, meta: { blank: true } },
  { path: '/page-constructor/:domain_id/:view(page)/:page_id', name: 'page-constructor-page', component: PageConstructor, props: pageConstructorProps, meta: { blank: true } },
  { path: '/page-constructor/:domain_id/:view(page)/:page_id/block/:block_id', name: 'page-constructor-block', component: PageConstructor, props: pageConstructorProps, meta: { blank: true } },
  { path: '/page-constructor/:domain_id/theme/:axis(color|style|layout|font)', name: 'page-constructor-theme', component: PageConstructor, props: pageConstructorProps, meta: { blank: true } },
  { path: '/svcmsadmin-createproject', name: 'headapp-create-project', component: CreateProject, props: blankProps, meta: { blank: true } },
  { path: '/svcmsadmin-domainsync', name: 'headapp-domain-sync', component: DomainSync, props: blankProps, meta: { blank: true } },
  { path: '/ds-data', name: 'headapp-ds-data', component: ProjectDataTransfer, props: blankProps, meta: { blank: true } },
  { path: '/ds-api', name: 'headapp-ds-api', component: ProjectApi, props: blankProps, meta: { blank: true } },
  { path: '/const/:config', name: 'headapp-const', component: Const, props: blankProps, meta: { blank: true } },
  { path: '/stat-tool/:config', name: 'headapp-stat-tool', component: StatTool, props: blankProps, meta: { blank: true } },
  { path: '/memo-aggregate/:config', name: 'memo-aggregate', component: Fallback, props: blankProps, meta: { blank: true } },
  { path: '/parser-excel/:config', name: 'headapp-parser-excel', component: ParserExcel, props: blankProps, meta: { blank: true } },
  { path: '/documentation/:config', name: 'headapp-documentation', component: Documentation, props: blankProps, meta: { blank: true } },
  { path: '/Schedule/:config', name: 'headapp-schedule', component: Schedule, props: blankProps, meta: { blank: true } },
  { path: '/VideoList/:config', name: 'headapp-video-list', component: VideoList, props: blankProps, meta: { blank: true } },
  { path: '/login', name: 'login', component: Login, meta: { blank: true } },
  { path: '/register', name: 'register', component: Register, meta: { blank: true } },
  { path: '/remember', name: 'remember', component: Remember, meta: { blank: true } },

  // ---------- Неизвестные URL: iframe (/src:...) или главная ----------
  { path: '/:pathMatch(.*)*', name: 'fallback', component: Fallback },
]

// Срезает base сборки ('/manager/') с пути, отданного бэкендом/хранилищем:
// vue-router сам добавляет base, поэтому push() ждёт путь без него.
export function toRouterPath(link) {
  link = link || ''
  const b1 = window.BaseUrl || import.meta.env.BASE_URL || '/'
  const b0 = b1.replace(/\/$/, '')
  if (b1 !== '/' && link.indexOf(b1) === 0)
    return '/' + link.slice(b1.length)
  if (b0 && link.indexOf(b0) === 0)
    return link.slice(b0.length) || '/'
  return link
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
