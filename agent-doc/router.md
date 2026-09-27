# Роутинг (Vue Router)

Источник: `src/router/index.js`, `src/App.vue`, `src/LeftMenu.vue`, `src/components/FallbackRoute.vue`.

## Layout'ы

Layout выбирается по `route.meta.blank`:

- `meta.blank !== true` → **shell** (`App.vue`): `v-navigation-drawer` + `LeftMenu`, `v-app-bar`, `v-main` с `<router-view>`, `v-footer`. В `created` грузится `/startpage` (left_menu, manager, title, copyright, bottom_menu).
- `meta.blank === true` → **full-screen**: `<v-app><router-view/></v-app>` без меню.

`App.vue` — корень: `<v-defaults-provider>` (схема) → один из двух `v-app`.

## Маршруты

Shell (`/vue/...`):

| URL | Компонент |
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

Full-screen (`meta.blank`, URL без `/vue`): `/edit_form/:config/:id?`, `/admin_table/:config`, `/admin_tree/:config`, `/table/:config`, `/const/:config`, `/transfere_cards/:config`, `/stat-tool/:config`, `/memo-aggregate/:config`, `/parser-excel/:config`, `/documentation/:config`, `/Schedule/:config`, `/VideoList/:config`, `/login`, `/register`, `/remember`.

- Пропсы страниц передаются фабриками `shellProps`/`blankProps` (`params`, для full-screen — `is_headapp: '1'`).
- **Alias'ы** (совместимость): `/edit-form`, `/admin-table`, `/admin-tree`, `/transfere-cards`.
- **Catch-all** `/:pathMatch(.*)*` → `FallbackRoute`: `/src:<url>` рендерит iframe внутри shell; иначе редирект на `/`.
- `history: createWebHistory(import.meta.env.BASE_URL)` — база тенанта (`/`, `/CrmFresh/`, `/manager/`).

## Меню

- `LeftMenu.get_link(item)` строит путь (`/vue/...`, `/`, `/src:<url>`); `go_link` → `router.push/replace` (тип `newtab` → `window.open`).
- Активный пункт: `left_menu_item.vue` сравнивает `get_link(item)` с `$route.path`; родитель подсвечивается/раскрывается по `hasActiveChild`.
- При смене `config` у `AdminTable` состояние фильтров сбрасывается (watch `params`, ремаунт `OnFilters` через `:key`).

## Прочее

- `EditForm` после сохранения делает `router.replace('/edit_form/<config>/<id>')`.
- `Login`/`Register` — переходы через `$router`.
- Глобалы для серверного `eval` сохранены: `window.app`, `window.EditForm`, `window.BaseUrl`, `window.BackendBase`, `window.bus`.
- Для прод-deep-links нужен fallback на nginx: `try_files $uri $uri/ /index.html`.
