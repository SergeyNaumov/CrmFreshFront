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
| `/vue/page-constructor/:template_id` | PageConstructor |
| `/vue/svcmsadmin-createproject` | CreateProject (быстрое создание проекта) |

Full-screen (`meta.blank`, URLs without `/vue`): `/edit_form/:config/:id?`, `/admin_table/:config`, `/admin_tree/:config`, `/table/:config`, `/const/:config`, `/transfere_cards/:config`, `/stat-tool/:config`, `/memo-aggregate/:config`, `/parser-excel/:config`, `/documentation/:config`, `/Schedule/:config`, `/VideoList/:config`, `/filenavigator/:config/:base(.*)*` (alias `/file-navigator`), `/page-constructor/:template_id`, `/svcmsadmin-createproject`, `/login`, `/register`, `/remember`.

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

## Other

- After save, `EditForm` does `router.replace('/edit_form/<config>/<id>')`; `Login`/`Register` navigate through `$router`.
- Globals for server `eval` preserved: `window.app`, `window.EditForm`, `window.BaseUrl`, `window.BackendBase`, `window.bus`.
- Production deep links need an nginx fallback: `try_files $uri $uri/ /index.html`.