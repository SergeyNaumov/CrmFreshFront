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
| `parser-excel` | `components/ParserExcel/*` | Excel import (+ references dialog) |
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
| `field-project_clone` | `svcmsAdmin/ProjectClone.vue` | кнопка+диалог клонирования проекта (тип поля `project_clone`) |
| `field-project_export` / `field-project_struct` / `field-project_sitemap` | `svcmsAdmin/{ProjectExport,ProjectCreateStruct,ProjectSitemap}.vue` | инструменты проекта в карточке |
| `field-domain_sync` | `svcmsAdmin/DomainSync.vue` | перенос/копирование настроек конструктора на другой домен (тип поля `domain_sync`) |

### Поля-компоненты (`field-<type>`)

Виртуальные поля карточек: `form.fields[].type` → `EditForm/FormBlock.vue`
(`case '<type>'` → `field-<type>`) → `dynamic_component_loader.js`
(`app.component('field-<type>', defineAsyncComponent(...))`). Пропсы —
`form` (у него `form.id` = `work_table_id` записи) и `field`. В БД такие поля не
сохраняются. Типы: `project_clone`, `project_export`, `project_struct`,
`project_sitemap`, `domain_sync`, `page_blocks`.

Инструменты-страницы (не карточки) подключаются иначе: роут в `router/index.js` +
маппинг `value → URL` в `LeftMenu.get_link` + пункт меню в `admin_menu_new`
(`type='vue'`). Примеры: `svcmsadmin-createproject`, `svcmsadmin-domainsync`.

## AdminTable

`AdminTable.vue`: `GET /get-filters/<config>` (`:312`), `POST /get-result` (`:438`, `:502`), `eval(D.javascript)` (`:343`, `:524`), navigate to edit_form (`:551`). Subcomponents `FindResults.vue`, `OnFilters.vue` (drag&drop `vuedraggable`), `ResultsMultiAction.vue`, `result_objects/{form.vue,file_uploader.vue,FindResultsMethods.js}`. On `config` change the filter state resets (watch `params`, remount `OnFilters` via `:key`).

Tool links from the backend `search_plugin` (export/import etc.) render above the filters. When the backend sets `search_plugin_panel: true` (config flag, see [backend-contract.md](backend-contract.md)), they collapse into an «Инструменты (N)» panel (`v-toolbar` + `v-show` + chevron, same pattern as the filters panel) instead of the flat `.search_plugin` list; open/closed state is remembered per config in `localStorage` (`admintable_plugins_open:<config>`). A click on an item with `link` goes through `$router.push`, otherwise `go_search_plugin()`; login redirect uses the shared axios interceptor (see [architecture.md](architecture.md)).

## AdminTree

- `AdminTree.vue`, `AdminTree/{branch.vue,__item.vue,FormInBranch.vue}`; `branch.vue` — recursive `nested-draggable` (`vuedraggable`; v4 needs `item-key` + `#item="{ element }"`, `:options="{group}"` → `group` prop, `handle` a plain attribute).
- `changed_in_tree`: title/pencil click opens the `FormInBranch` dialog (same form engine, full field set); prop `tree_form` = tree object, `item` = node. Pencil (`edit`) opens a new tab (`edit_in_new_tab`); the title click is gated by `form.changed_in_tree`.
- `view_type=='gallery'` (backend also accepts `galery`): flat "photo + title" gallery (`el.photo`, edit/delete on hover); whole-card dragging only when `form.sort`, else Sortable `disabled`. `eval(D.javascript)` at `AdminTree.vue:115`.

## ParserExcel

`ParserExcel.vue` + `methods.js`, route `/vue/parser-excel/<config>`. Single endpoint `POST /parser-excel/<config>`, action-driven from `methods.js`:

- `init` → `d.parser` (`fields` get `selected:-1`; optional `refs`, `require_any_of`, `before_load_fields`). `autofill_preload` maps a column to a field when `header === field.description`.
- `preload` (base64 `src`) → `loaded_filename` + preview rows; user picks the first data row (`data_line_number`).
- `check_refs` — only when `parser.refs` is set: sent before `load`; returns `refs:[{key,label,missing,bad_ids,unresolved,no_ref}]`. Non-empty `missing`/`bad_ids` opens the references dialog.
- dialog buttons: **Создать и продолжить** → `create_refs {ref, names}` per ref, then `load`; **Продолжить без создания** → `load` directly.
- `create_refs` `{ref, names}` → creates missing reference values in the current project.
- `load` → `message` with the summary/notes; success dialog.
- `cancel` resets `uploading`, `refs_dialog`, `refs_check`, `loaded_filename` and calls `remove_tmp_file`.

`all_fields_selected` (computed) requires every field with `required !== 0` to have a column, plus at least one column per `require_any_of` group. No tool-specific logic lives in the component — behavior is driven by the parser config and the `init`/`check_refs` responses.

## Endpoints

| File | Endpoints |
|---|---|
| `StatTool.vue` | `/stat-tool/<config>` (`:120`), `/stat-tool/<config>/search` (`:165`) |
| `Notifications.vue` | `/mainpage/notifications`, `.../update/<id>`, `.../set-readed/<id>/<readed>` |
| `BirthDays.vue` | `/mainpage/birthdays` |
| `MP/ManagerLoad.vue` | `/mainpage/manager-load/init`, `.../save/<v>` |
| `GPTAssist.vue` | `/gpt-assist/init`, `/gpt-assist/send-task` |
| `Register.vue` | `/register` |
| `FileNavigator/FileNavigator.vue` | `/filenavigator/<config>` (`?dir=&charset=`) + `/readir`, `/readfile`, `/writefile`, `/mkdir`, `/delete`, `/move`, `/rename`, `/raw` ([backend-contract.md](backend-contract.md)); виды список/плитка, иконки по типу, контекстное меню, drag&drop файлов/папок, popup-фотогалерея со стрелками/клавишами по всем фото папки, файлы правит через `field-codelist` |
| `svcmsAdmin/PageConstructor.vue` | `/page-constructor/:domain_id` (+ `/:view(page|structure)`, `/page/:page_id`, `/page/:page_id/block/:block_id`, `/theme/:axis`, те же пути под `/vue/` в shell — deep-link состояние); список страниц `template_page` (сортировка кликом по заголовкам «название/url», переход в редактор по названию и url, кнопка «создать базовый набор страниц») + селекты темы «Цвет/Стиль/Компоновка/Шрифт» (двухфазное сохранение) + общие для шаблона «Шапка и подвал» + **нативный** редактор блоков (`page_constructor/editor/BlockEditor.vue`, движок и данные — `page_constructor/{engine,data}`); бэк `POST /svcmsadmin/page-constructor/init`, `GET /page/<id>`, `POST /page/save`, `POST /page/<id>/delete`, `POST /base-pages`, `GET /structure/<id>`, `POST /structure/save`, `GET/POST /theme*`, `/theme-schemes*` ([backend-contract.md](backend-contract.md), [page-constructor.md](page-constructor.md), [RULES.md](../src/components/svcmsAdmin/page_constructor/RULES.md)) |
| AdminTree / EditForm / Messenger | `/admin-tree/<config>` ([backend-contract.md](backend-contract.md)) · `/edit-form/*`, `/ajax/*` ([form-engine.md](form-engine.md)) · `/messenger/*` ([messenger.md](messenger.md)) |

Vuetify 2 → 3 replacements: [migration-vue3.md](migration-vue3.md). AdminTree/AdminTable spacing: [design-system.md](design-system.md).
