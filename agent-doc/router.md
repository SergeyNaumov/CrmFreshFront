# Routing (Vue Router)

> Load when: adding a route, changing the layout, debugging navigation.
> Canonical for: layouts, route tables, aliases, catch-all, history base, menu navigation.

Sources: `src/router/index.js`, `src/App.vue`, `src/LeftMenu.vue`, `src/components/FallbackRoute.vue`. Shell data loading: [architecture.md](architecture.md). Backend menu contract: [backend-contract.md](backend-contract.md).

## Layouts

Selected by `route.meta.blank`:

- `meta.blank !== true` → **shell** (`App.vue`): `v-navigation-drawer` + `LeftMenu`, `v-app-bar`, `v-main` with `<router-view>`, `v-footer`; `App.created` loads `/startpage` (left_menu, manager, title, copyright, bottom_menu).
- `meta.blank === true` → **full-screen**: `<v-app><router-view/></v-app>`, no menu (forms, headapp trees/tables, login).

`App.vue` is the root: `<v-defaults-provider>` (scheme) → one of the two `v-app`.

## Routes

Shell (`/vue/...`):

| URL | Component |
|---|---|
| `/` | MainPage |
| `/vue/admin_table/:config` | AdminTable |
| `/vue/admin_tree/:config` | AdminTree |
| `/vue/const/:config` | Const |
| `/vue/documentation/:config` | Documentation |
| `/vue/video_list/:config` | VideoList |
| `/vue/stat-tool/:config` | StatTool |
| `/vue/parser-excel/:config` | ParserExcel |
| `/vue/Schedule/:config` | Schedule |
| `/vue/table/:config` | Table |
| `/vue/filenavigator/:config/:base(.*)*` | FileNavigator |
| `/vue/page-constructor/:domain_id[/view/:page_id[/block/:block_id]]` | PageConstructor (данные привязаны к домену) |
| `/vue/svcmsadmin-createproject` | CreateProject (создание проекта) |
| `/vue/svcmsadmin-domainsync` | DomainSync (перенос настроек конструктора на другой домен) |

Full-screen (`meta.blank`, URLs without `/vue`): `/edit_form/:config/:id?`, `/admin_table/:config`, `/admin_tree/:config`, `/table/:config`, `/const/:config`, `/transfere_cards/:config`, `/stat-tool/:config`, `/memo-aggregate/:config`, `/parser-excel/:config`, `/documentation/:config`, `/Schedule/:config`, `/VideoList/:config`, `/filenavigator/:config/:base(.*)*` (alias `/file-navigator`), `/page-constructor/:domain_id`, `/svcmsadmin-createproject`, `/svcmsadmin-domainsync`, `/login`, `/register`, `/remember`.

`filenavigator` base dir: `:base` segments (e.g. `/filenavigator/<config>/files/sub`) or `?dir=<path>` become the navigator root (chroot); `?charset=` sets the file encoding (default utf-8).

- Page props come from the `shellProps`/`blankProps` factories (`params`; full-screen also `is_headapp: '1'`).
- **Aliases** (compatibility): `/edit-form`, `/admin-table`, `/admin-tree`, `/transfere-cards`.
- **Catch-all** `/:pathMatch(.*)*` → `FallbackRoute`: `/src:<url>` renders an iframe inside the shell; anything else redirects to `/`.
- `history: createWebHistory(import.meta.env.BASE_URL)` — tenant base (`/`, `/CrmFresh/`, `/manager/`).

## Menu

- `LeftMenu.get_link(item)` builds the path (`/vue/...`, `/`, `/src:<url>`); `go_link` → `router.push/replace` (type `newtab` → `window.open`).
- Active item: `left_menu_item.vue` compares `get_link(item)` with `$route.path`; a parent is highlighted/expanded by `hasActiveChild`.
- A branch is expanded on the first render when the backend sends a true `open` (`is_open`: `true|1|'1'|'true'`, MySQL tinyint) — editor checkbox «Сразу показывать подпункты», `admin_menu_new.open`. Legacy key `show` (hand-written SV-CMS project menus) is honored too.
- On `config` change in `AdminTable` the filter state resets (watch `params`, remount `OnFilters` via `:key`).

## Login return

`link_prev_login` (localStorage) is written by the axios interceptor / the shell `redirect` check ([architecture.md](architecture.md)). After a successful `POST /login`, `Login.vue` normalizes the stored URL, strips the tenant base with `toRouterPath` (exported from `router/index.js`, also used by `LeftMenu`) and `$router.push`es it, then emits `bus.$emit('auth:login')` so `App.loadStartpage()` refreshes the menu. `toRouterPath` is required because the stored value is a full URL with the base (`/manager/vue/...`) while `router.push` expects a base-less path — otherwise it matches only the catch-all and `FallbackRoute` sends the user to `/`. If the target is not a Vue route (resolve matches only `fallback`) or is `/login`, it falls back to a full `location.href` navigation.

## Other

- After save, `EditForm` does `router.replace('/edit_form/<config>/<id>')`; `Login`/`Register` navigate through `$router`.
- Globals for server `eval` preserved: `window.app`, `window.EditForm`, `window.BaseUrl`, `window.BackendBase`, `window.bus`.
- Production deep links need an nginx fallback: `try_files $uri $uri/ /index.html`.