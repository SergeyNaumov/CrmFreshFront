# Компоненты

> Как бэкенд-конфиг превращается в компонент (меню, AdminTable/AdminTree/Const,
> фильтры, пробелы) — `backend-contract.md`.

## Регистрация (`src/dynamic_component_loader.js`)

| Глобальное имя | Путь |
|---|---|
| `errors` | `components/errors.vue` |
| `login` | `components/Login.vue` |
| `register` | `components/Register.vue` |
| `remember` | `components/Remember.vue` |
| `const` | `components/Const.vue` |
| `edit-form` | `components/EditForm` (→ `EditForm.vue`) |
| `admin-tree` | `components/AdminTree` |
| `admin-table` | `components/AdminTable` |
| `transfere-cards` | `components/TransfereCards/TransfereCards` |
| `parser-excel` | `components/ParserExcel/ParserExcel` |
| `documentation` | `components/Documentation/Documentation` |
| `table_component` | `components/Table` |
| `VideoList` | `components/VideoList/VideoList` |
| `Schedule` | `components/Schedule/Schedule` |
| `Messenger` | `components/Messenger/Messenger` |
| `stat-tool` | `components/StatTool/StatTool` |
| поля и фильтры | см. `fields.md` |

`App.vue` дополнительно локально: `mainpage` (`MainPage.vue`), `left_menu` (`LeftMenu.vue`).
`MainPage.vue` локально: `birth-days`, `notifications`, `link-telegram`, `manager-load`.

## Компоненты верхнего уровня

| Компонент | Файл(ы) | Назначение |
|---|---|---|
| EditForm | `components/EditForm.vue` | см. `form-engine.md` |
| AdminTable | `components/AdminTable.vue`, `AdminTable/` | таблица данных + фильтры + массовые действия |
| AdminTree | `components/AdminTree.vue`, `AdminTree/` | дерево разделов; drag&drop |
| StatTool | `components/StatTool/StatTool.vue` | статистика/аналитика; `eval(d.javascript)` |
| Messenger | `components/Messenger/*` | WS-чат (см. `messenger.md`) |
| Documentation | `components/Documentation/*` | docs (item_menu/item_content/links) |
| ParserExcel | `components/ParserExcel/*` | импорт Excel |
| Schedule | `components/Schedule/Schedule.vue` | расписание |
| VideoList | `components/VideoList/VideoList.vue` | видео |
| TransfereCards | `components/TransfereCards/TransfereCards.vue` | карточки переносов |
| GPTAssist | `components/GPTAssist/GPTAssist.vue` + `functions.js` | GPT-помощник (`/gpt-assist/...`) |
| Table | `components/Table.vue` | произвольная таблица (`v-simple-table`) |
| Notifications | `components/Notifications.vue` | `/mainpage/notifications...` |
| BirthDays | `components/BirthDays.vue` | `/mainpage/birthdays` |
| MP | `components/MP/LinkTelegram.vue`, `MP/ManagerLoad.vue` | блоки главной |
| Login/Register/Remember | `components/{Login,Register,Remember}.vue` | авторизация/регистрация |
| Const | `components/Const.vue` | константы/справочники |
| TextPage | `components/TextPage.vue` | текстовая страница |
| errors | `components/errors.vue` | вывод ошибок |

## AdminTable

- `AdminTable.vue`: `GET /get-filters/<config>` (`:312`), `POST /get-result` (`:438`, `:502`), `eval(D.javascript)` (`:343`, `:524`), переход в edit_form (`:551`).
- Подкомпоненты: `FindResults.vue`, `OnFilters.vue` (drag&drop `vuedraggable`), `ResultsMultiAction.vue`, `result_objects/{form.vue,file_uploader.vue,FindResultsMethods.js}`.

## AdminTree

- `AdminTree.vue`, `AdminTree/{branch.vue,__item.vue,FormInBranch.vue}`.
- `branch.vue` — рекурсивный `nested-draggable` (`vuedraggable`).
- `changed_in_tree`: клик по названию/карандашу открывает модалку `FormInBranch` (тот же form-engine: `form_controller.js` + `FormBody.vue`, полный набор полей). Проп `tree_form` — объект дерева, `item` — узел.
- `view_type=='gallery'` (бэк также принимает `galery`): `branch.vue` рисует плоскую галерею «фото + название» (`el.photo` из `admin-tree`, кнопки edit/delete по hover). Перетаскивание всей карточки включается только при `form.sort`, иначе Sortable `disabled`.
- `eval(D.javascript)` в `AdminTree.vue:115`.

## Прочие точки API

- `StatTool.vue`: `/stat-tool/<config>` (`:120`), `/stat-tool/<config>/search` (`:165`).
- `Notifications.vue`: `/mainpage/notifications`, `.../update/<id>`, `.../set-readed/<id>/<readed>`.
- `BirthDays.vue`: `/mainpage/birthdays`.
- `MP/ManagerLoad.vue`: `/mainpage/manager-load/init`, `.../save/<v>`.
- `GPTAssist.vue`: `/gpt-assist/init`, `/gpt-assist/send-task`.
- `Register.vue`: `/register`.

## Миграция (Vuetify 3)

| Компонент Vuetify 2 | Замена |
|---|---|
| `v-simple-table` | `v-table` |
| `v-tabs-items` | `v-window` |
| `v-tab-item` | `v-window-item` |
| `v-expansion-panel-header` | `v-expansion-panel-title` |
| `v-expansion-panel-content` | `v-expansion-panel-text` |
| `v-list-item-content` | содержимое `v-list-item` |
| `v-subheader` | `v-list-subheader` |
| `v-treeview` | `vuetify/labs/VTreeview` (иной API) |

Плюс глобально: `v-layout`/`v-flex` → `v-row`/`v-col`; классы `headline` → `text-h*`; `white--text` → `text-white`; цвет `red darken-1` → `red-darken-1`; `v-btn text` → `variant="text"`; `v-icon small` → `size="small"`.
