# Components

> Load when: locating a component, its registration, or its API endpoints.
> Canonical for: the component registry, top-level purposes, AdminTable/AdminTree internals, endpoints.

Backend config → component mapping: [backend-contract.md](backend-contract.md). Fields/filters: [fields.md](fields.md).

## Registry

`src/dynamic_component_loader.js`. Lazy components are wrapped in `defineAsyncComponent` — in Vue 3 `app.component(name, () => import())` is **not** async and renders as `[object Promise]`.

| Global name | File(s) | Purpose |
|---|---|---|
| `edit-form` | `components/EditForm.vue` | [form-engine.md](form-engine.md) |
| `admin-table` | `components/AdminTable.vue`, `AdminTable/` | table + filters + bulk actions |
| `admin-tree` | `components/AdminTree.vue`, `AdminTree/` | section tree, drag&drop |
| `stat-tool` | `components/StatTool/StatTool.vue` | statistics; `eval(d.javascript)` |
| `Messenger` | `components/Messenger/*` | WS chat ([messenger.md](messenger.md)) |
| `documentation` | `components/Documentation/*` | `item_menu`/`item_content`/`links` |
| `parser-excel` | `components/ParserExcel/*` | Excel import |
| `Schedule` | `components/Schedule/Schedule.vue` | schedule (`v-calendar`, labs) |
| `VideoList` | `components/VideoList/VideoList.vue` | video |
| `transfere-cards` | `components/TransfereCards/TransfereCards.vue` | transfer cards |
| `GPTAssist` (eager) | `components/GPTAssist/GPTAssist.vue` + `functions.js` | GPT helper |
| `table_component` | `components/Table.vue` | arbitrary table |
| `const` | `components/Const.vue` | constants/dictionaries |
| `login` / `register` / `remember` | `components/{Login,Register,Remember}.vue` | auth |
| `errors` (eager) | `components/errors.vue` | error output |
| `notifications`, `birth-days` | `components/{Notifications,BirthDays}.vue` | `/mainpage/...` |
| `link-telegram`, `manager-load` | `components/MP/{LinkTelegram,ManagerLoad}.vue` | main-page blocks |
| `mainpage`, `left_menu` (local, `App.vue`) | `MainPage.vue`, `LeftMenu.vue` | shell |
| TextPage | `components/TextPage.vue` | text page |

## AdminTable

`AdminTable.vue`: `GET /get-filters/<config>` (`:312`), `POST /get-result` (`:438`, `:502`), `eval(D.javascript)` (`:343`, `:524`), navigate to edit_form (`:551`). Subcomponents `FindResults.vue`, `OnFilters.vue` (drag&drop `vuedraggable`), `ResultsMultiAction.vue`, `result_objects/{form.vue,file_uploader.vue,FindResultsMethods.js}`. On `config` change the filter state resets (watch `params`, remount `OnFilters` via `:key`).

## AdminTree

- `AdminTree.vue`, `AdminTree/{branch.vue,__item.vue,FormInBranch.vue}`; `branch.vue` — recursive `nested-draggable` (`vuedraggable`; v4 needs `item-key` + `#item="{ element }"`, `:options="{group}"` → `group` prop, `handle` a plain attribute).
- `changed_in_tree`: title/pencil click opens the `FormInBranch` dialog (same form engine, full field set); prop `tree_form` = tree object, `item` = node. Pencil (`edit`) opens a new tab (`edit_in_new_tab`); the title click is gated by `form.changed_in_tree`.
- `view_type=='gallery'` (backend also accepts `galery`): flat "photo + title" gallery (`el.photo`, edit/delete on hover); whole-card dragging only when `form.sort`, else Sortable `disabled`. `eval(D.javascript)` at `AdminTree.vue:115`.

## Endpoints

| File | Endpoints |
|---|---|
| `StatTool.vue` | `/stat-tool/<config>` (`:120`), `/stat-tool/<config>/search` (`:165`) |
| `Notifications.vue` | `/mainpage/notifications`, `.../update/<id>`, `.../set-readed/<id>/<readed>` |
| `BirthDays.vue` | `/mainpage/birthdays` |
| `MP/ManagerLoad.vue` | `/mainpage/manager-load/init`, `.../save/<v>` |
| `GPTAssist.vue` | `/gpt-assist/init`, `/gpt-assist/send-task` |
| `Register.vue` | `/register` |
| AdminTree / EditForm / Messenger | `/admin-tree/<config>` ([backend-contract.md](backend-contract.md)) · `/edit-form/*`, `/ajax/*` ([form-engine.md](form-engine.md)) · `/messenger/*` ([messenger.md](messenger.md)) |

Vuetify 2 → 3 replacements: [migration-vue3.md](migration-vue3.md). AdminTree/AdminTable spacing: [design-system.md](design-system.md).
