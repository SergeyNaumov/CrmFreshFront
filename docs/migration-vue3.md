# Миграция на Vue 3 + Vite + Vuetify 3

## Решения

- Ветка `vue3`; `main` остаётся рабочим на Vue 2.
- JavaScript (без TypeScript).
- Options API сохраняется.
- Backend не меняется: `eval` серверного JS, глобалы и runtime-компилятор сохраняются.
- Сохранить все три системы иконок (`icon-system.md`).
- Сохранить структуру вывода `dist/{js,css,index.html,fonts}`.
- Обновить несовместимые с Vue3 библиотеки (`dependencies.md`).

## Этап 0. Подготовка

- `git checkout -b vue3`, тег на текущий `main`.
- Зафиксировать baseline: `npm ci`, `npm run build`, сохранить `dist/` для сравнения.
- Ручной smoke-чеклист — `verification.md`.

## Этап 1. Vite

- Добавить: `vite`, `@vitejs/plugin-vue`, `vite-plugin-vuetify`, `sass`.
- Удалить: `@vue/cli-*`, `vue-template-compiler`, `vue-cli-plugin-vuetify`, `vuetify-loader`, `sass-loader`, `stylus*`, `css-loader`, `style-loader`.
- `vite.config.js`:
  - `base` по mode: `default → /`, `trade → /CrmFresh/`, `svcms → /manager/`.
  - alias `@ → src`; `plugins: [vue(), vuetify({ autoImport: true })]`.
  - `server: { host: true, port: 8081 }` (сохранить текущий dev-порт).
  - `resolve.alias`: `vue → vue/dist/vue.esm-bundler.js` (runtime-компилятор для `eval`).
- `index.html` перенести в корень; заменить `<%= BASE_URL %>`:
  - `BaseUrl`/`BackendBase` выставлять в `src/main.js` до `mount` из `import.meta.env.BASE_URL` и `config.BackendBase`.
  - `process.env.BASE_URL` → `import.meta.env.BASE_URL` (`src/App.vue:107`, `src/js/app.js:24-25`).
- npm-скрипты: `dev`, `build`, `build:trade`, `build:svcms`, `serve` (совместимость).
- `build/config/*.js` больше не нужны — заменить на `--mode`.
- Удалить `babel.config.js`/`postcss` при необходимости (Vite postcss — CSS-переменные и autoprefixer).

## Этап 2. Ядро Vue 3

- `main.js`: `createApp(App)`; `app.config.globalProperties.$http/$isMobile/$color/$theme`; `app.component(...)` вместо `Vue.component`.
- `dynamic_component_loader(Vue)` → принимает `app`.
- Заменить `new Vue()` на `app`.
- **Event bus**: `new Vue()` запрещён. Ввести shim на `mitt` с сохранением `$on/$emit/$off` (25+ файлов):
  ```js
  const emitter = mitt()
  export const bus = {
    $on: emitter.on, $emit: emitter.emit,
    $off: emitter.off,
  }
  ```
- Оставить `window.Vue`, `window.EditForm`, `window.app`, `window.log`, `BackendBase`, `BaseUrl` — используются серверным `eval` и кодом.
- `$vuetify.breakpoint` (`App.vue:275`) → `this.$vuetify.display` / `useDisplay`.
- `Vue.prototype.*` (66 вхождений) → `app.config.globalProperties.*`.

## Этап 3. Катогориальные правки API

Автоматизируемо (`rg` + замена):
- `beforeDestroy` → `beforeUnmount` (12), `destroyed` → `unmounted`.
- `.sync` → `v-model:<prop>` (5: `fields/select.vue`, `filters/{select,text}.vue`).
- `$listeners`/`$children`/`$scopedSlots` — 0 вхождений, правок не нужно.
- `filters:`/`Vue.filter` — не используются.

## Этап 4. Vuetify 2 → 3

Замены (см. также `components.md`):

| Vuetify 2 | Vuetify 3 |
|---|---|
| `v-layout` / `v-flex` (9/34) | `v-row` / `v-col` или flex-CSS |
| `v-tabs-items` / `v-tab-item` | `v-window` / `v-window-item` |
| `v-simple-table` (4) | `v-table` |
| `v-expansion-panel-header` / `-content` | `v-expansion-panel-title` / `-text` |
| `v-list-item-content` (2) | слоты `v-list-item` |
| `v-subheader` (2) | `v-list-subheader` |
| `v-treeview` (6) | `vuetify/labs/VTreeview` (иной API) |
| `v-btn text` | `v-btn variant="text"` |
| `v-icon small/x-small` | `size="small"/"x-small"` |
| классы `headline` (19) | `text-h5`/`text-h6` |
| `white--text` (1) | `text-white` |
| `red darken-1` | `red-darken-1` |

- Иконки: кастомный набор из `icon-system.md`.
- Тема: `createVuetify({ theme: { themes: { light: { colors: {...} } } } })`; `rounded: true` не поддерживается.
- Проверить `v-app-bar`, `v-navigation-drawer`, `v-main`, `v-tabs` (API в целом совместим, но слоты/пропсы деталей различаются).
- Проверить кастомные SCSS-селекторы `.v-input__slot`, `.v-select-list`, `.v-text-field--rounded` — DOM Vuetify 3 другой.

## Этап 5. Динамические импорты

- `src/components/EditForm/DynamicLoader.vue:35` — `import('../fields/'+type)` → `import.meta.glob('../fields/*.vue')` + карта.
- `src/dynamic_component_loader.js:43-53` — `import(\`${filter_dir}/...\`)` (template-строка) → статические `import()` или `import.meta.glob`.
- Остальные динамические `import('./components/...')` — литеральные, Vite обрабатывает.

## Этап 6. Библиотеки

- `vuedraggable@2 → @4` (AdminTree, AdminTable/OnFilters, fields/1_to_m).
- `vue-advanced-cropper@0.15 → @2` (`fields/file.vue`).
- `axios@0.19 → @1`.
- Удалить неиспользуемые: `@tinymce/tinymce-vue`, `chart.js`, `vue-chartjs`, `stylus*`.
- `chart.vue`: вендоренный `js/chart.js` (API v2) либо оставить как есть, либо переписать под `chart.js@4` — отдельным шагом.
- `wysiwyg.vue` менять минимально (raw `tinymce@5`, `config.TinyMCE_BaseUrl`).

## Этап 7. Сборка и деплой

- Настроить `build.rollupOptions.output`:
  - `entryFileNames: 'js/[name].js'`, `chunkFileNames: 'js/[name].js'`, `assetFileNames`: `css/*` для `.css`, `fonts/*` для шрифтов, прочее в `js/`.
  - Это сохранит контракт deploy-скриптов `build/<tenant>` и `copy_to_fresh`.
- Либо (альтернатива) обновить все `build/<tenant>` и `copy_to_fresh` под `dist/assets`.
- `public/` копируется как есть (`configure.js`, `dist/`, favicon).

## Этап 8. Проверка

- `npm run build` для всех трёх mode, сверка структуры `dist/`.
- Smoke по `verification.md` + проверка рендера серверного `javascript`/`jscode` (риск: серверный JS может использовать Vue2 API).
- Ручная проверка каждой группы полей из `fields.md`.

## Риски

1. Серверный `eval` может обращаться к Vue 2 API (`new Vue`, `Vue.extend`, `$on`) — потребуется совместимость или правка backend (запрещена).
2. Нестандартный рендер иконок — визуальные регрессии (митигируется кастомным набором).
3. `dist`-структура и относительные пути (`BaseUrl`) — митигируется настройкой Vite.
4. `v-layout`/`v-flex` — большая, но механическая переработка вёрстки.

## Статус

В работе (ветка `vue3`). Каркас и кодовая миграция выполнены, сборка зелёная; требуется рантайм-проверка.

### Сделано

- `package.json`: `vue@3.4`, `vuetify@3.4.11`, `vite@4`, `@vitejs/plugin-vue@4`, `vite-plugin-vuetify@1`, `sass`, `mitt`, `axios@1`, `vuedraggable@4`, `vue-advanced-cropper@2`. Удалены Vue CLI, `babel.config.js`, неиспользуемые `chart.js`/`vue-chartjs`/`@tinymce/tinymce-vue`/`stylus*`.
- `vite.config.js`: `base` по mode (`default /`, `trade /CrmFresh/`, `svcms /manager/`), alias `@` и `vue/dist/vue.esm-bundler.js`, output `js/`, `css/`, `fonts/`.
- `index.html` в корне вместо `public/index.html`; `BaseUrl = import.meta.env.BASE_URL` выставляется в `main.js`.
- `main.js`: `createApp`, `globalProperties` (`$http/$isMobile/$color/$theme`), `app.component`, bus-shim на `mitt` с `$on/$off/$emit`, кастомный icon set `legacy` (MDI + FontAwesome + голые имена), тема с primary и производными цветами.
- `dynamic_component_loader.js` переведён на `app.component`; динамические фильтры — статические `import()`.
- `DynamicLoader.vue` — `import.meta.glob`.
- Codemods: `beforeDestroy→beforeUnmount` (12), `destroyed→unmounted` (1), `.sync→v-model:search`, `item-text→item-title`, grid-атрибуты `xs12/md6/...` → `cols/md/...`, `v-layout/v-flex→v-row/v-col`, `v-tabs-items/v-tab-item→v-window/v-window-item`, `v-simple-table→v-table`, `v-expansion-panel-header/content→title/text`, `v-subheader→v-list-subheader`, `v-list-item-content` убран, `v-btn text→variant`, `v-btn/v-icon small→size`, `headline→text-h5`, `white--text→text-white`, цвета `red darken-1→red-darken-1`, `v-treeview` под API v3.
- Сборка `default/trade/svcms` проходит; структура `dist/{js,css,index.html,fonts}` сохранена.

### Проверено в рантайме (puppeteer + Chrome)

Локально с мок-бэкендом:
- Shell монтируется: `.v-application`, меню, футер; Vue-предупреждений 0.
- Form Engine (`/edit_form/test`): 12 полей отрендерены; `v-date-picker` и labs `v-time-picker` открываются в `v-menu`.

На прод-сборке `build_svcms` против живого бэкенда (`dev-crm.test/backend`):
- Shell `/manager/`: 20 пунктов меню, 0 сломанных иконок, 0 ошибок/предупреждений.
- `edit_form/good` (33 поля), `edit_form/news` (10) — чисто.
- `admin_tree/direction`, `admin_tree/vendor` (244 иконки) — чисто.
- `admin_table/news|good|cert|manager`: фильтры, «Найдено записей», данные — чисто.
- `const/template_const` — чисто.

Ключевые фиксы, найденные рантаймом:

- Ленивые глобальные компоненты оборачиваются в `defineAsyncComponent` (`dynamic_component_loader.js`). В Vue 3 `app.component(name, () => import())` **не** async-компонент (в отличие от Vue 2) и рендерился как `[object Promise]`.
- Vuetify 3 не эмитит `@change` у form-компонентов → заменено на `@update:model-value`.
- Активатор `v-menu`: `v-slot:activator="{ on }"` + `v-on="on"` → `v-slot:activator="{ props }"` + `v-bind="props"`.
- Иконки (`LegacyIcon` в `main.js`): `fa-<name>` без пробела → `fa fa-<name>` (иначе терялось семейство FontAwesome и иконка не рисовалась); `fa[srlb] <name>` как есть; `mdi-*` как есть; голое имя → `mdi-<name>`.
- `vuedraggable@4`: обязательны `item-key` и слот `#item="{ element }"`; `:options="{group}"` → прямой проп `group`, `handle` — прямой атрибут. Файлы: `AdminTree/branch.vue`, `AdminTable/OnFilters.vue`, `fields/1_to_m/slide.vue`.
- `FormBlock.vue`: пустой `<component :is="dynamic_component(f)">` (для `save_button` и пр.) давал «Invalid vnode type» — обёрнут в `v-if`; `<template if=...>` → `v-if`.
- «Голый» `<template>` без директивы в Vue 3 рендерится как нативный `<template>` и скрывает содержимое. Вложенные обёртки убраны в `left_menu_item.vue`, `fields/multiconnect.vue`, `fields/datetime.vue`, `fields/text_subtypes/qr_call.vue`, `AdminTable/filters/{file,in_ext_url}.vue`, `Table.vue` (из-за этого пропадали листья левого меню). `v-show` на `<template>` (`fields/wysiwyg.vue`) тоже даёт нативный `<template>` — заменено на `v-if` (из-за этого не выводилось поле wysiwyg и кнопка «в режим редактирования»/TinyMCE).
- `EditForm`/`FormBlock`: поля выровнены по левой линии заголовка — убраны `div.field{margin:0 20px}`, горизонтальный padding карточки и вложенных `v-col` (`div.field [class*="v-col"]{padding-left/right:0}`). `h1.form_header{margin-top:15px}`; `.v-field--variant-outlined{border-radius:5px}`; textarea — `padding:8px 5px` (иначе floating-label «наезжал» на текст).
- Date-фильтр: колонки «С/По» `md="auto"`, поля `width:220px`, `.v-row{gap:16px}` (зазор был ~190px).
- AdminTable: пустые обёртки `v-col` вокруг `search_links`/`log`/`before_filters_html` выводились безусловно (под `v-if="1"`) и давали отступ ~99px между «Добавить» и фильтрами — обёрнуты в `v-if` (стало ~31px, у Vue2 ~24px).
- Тулбары фильтров — белые (`.filters .v-toolbar`); пагинация — квадратные кнопки 32px с рамкой, активная — `primary`/белый текст.
- `AdminTable/filters/multiconnect.vue`: `field.value=false` нормализуется в `[]` (иначе выводился чип «false»).
- `v-calendar` (labs): `Schedule.vue` и `fields/time_table.vue` переведены на `view-mode` и `events` вида `{title,start:Date,end:Date,color}`; `$toDate` теперь парсит и дату-время (`YYYY-MM-DD HH:mm:ss`). Labs-VCalendar не поддерживает `event-color`, `event-overlap-mode`, `first-interval`, `@click:event`, поэтому клик по событию (попап редактирования/удаления) недоступен — добавление событий и остальной UI работают. Компоненты в svcms-меню отсутствуют.
- Сохранение формы проверено на живом бэкенде: `POST /backend/edit-form/news/1 → 200 success:true`.
- Шапка: Vuetify 3 задаёт `a { color: rgb(var(--v-theme-primary)) }`, а классы Vuetify 2 `.v-toolbar__title` больше не существуют. В `App.vue` стили переведены на `.v-toolbar-title`, ссылке и иконке задан белый (`!important`).

### Стили и цветовые схемы (после перехода)

- Sass: всех `@import` → `@use`; варнинг `legacy-js-api` отключён в `vite.config.js`; палитра вынесена в `src/theme/palette.js`, а `src/styles/colors/` и `variables.scss` удалены.
- Цвета в SCSS — только через CSS-переменные Vuetify: `rgb(var(--v-theme-<key>))` (Vuetify хранит каналы RGB, поэтому `var(...)` без `rgb()` для `color` невалиден). Кастомные ключи (`primary-lighten-1..5`, `primary-darken-1..4`, `text-on-primary`, `light`) заданы в теме.
- Vuetify 3 не красит ссылки: добавлено глобальное `.v-application a { color: rgb(var(--v-theme-primary)); }` (`main.scss`).
- Vuetify2-селекторы переведены/удалены: `.v-card__title|__text`, `.v-toolbar__title`, `.v-select__slot`, `.v-input__slot`, `.v-input__control`, `.v-input__prepend-outer`, `.v-input__icon--clear`, `.v-input--selection-controls`, `.v-btn.v-size--small`, `.theme--light`, `.v-treeview-node__*`, `.application`. Внутренние элементы Vuetify внутри scoped-стилей — при необходимости через `:deep()`.
- `App.vue`: поля переведены на `.v-field`, `.v-field__input`, `.v-field-label--floating`, `.v-field__prepend-inner`.
- AdminTable: чекбоксы фильтров — `:model-value` + `@update:model-value="filter_toggle(f, $event)"` (устранён конфликт с `v-model`, из-за которого не появлялась кнопка «искать»). Исправлены грид-атрибуты `sm12/lg7`, `:outlined` → `variant`.
- AdminTree: плюсы/минусы `size="x-small"` (16px) и отступ `.plus-icon{margin-right:6px; vertical-align:middle}`.
- Дефолт полей: Vuetify 3 по умолчанию `filled` (высота 56px). В Vuetify 2 поля были outlined с рамкой, небольшим скруглением и высотой ~40px → `variant: 'outlined', density: 'compact'` в `createVuetify({ defaults })` для VTextField/VTextarea/VSelect/VAutocomplete/VCombobox/VFileInput (и `density: 'compact'` для VCheckbox/VSwitch); `theme.rounded = false` (радиус 4px). Это вернуло компактность форм (`/edit_form/*`) как в Vue2.
- Date-picker: строки/локаль/размер. Глобально в `main.scss`: скрыты `.v-picker-title` и `.v-date-picker-header__content`, `.v-picker` grid-колонка `minmax(0,1fr)`, `.v-date-picker-month__days` — фиксированные `repeat(7,34px)`, дни 34×34 (кнопка 28px), ширина 340px, `overflow:hidden`. Контролы: `__month` — это стрелки ‹ › (32px), `__month-btn` — текущий месяц (открывает выбор месяца/года), `__mode-btn` — год (28px). Локаль — из `createVuetify.locale` (русские месяцы).
- Поля в «Используемых фильтрах»: `.onfilter .v-field`/`.v-field__input` — `min-height:40px`, padding 6px (в v3 по умолчанию 56px).
- Хэндл фильтра `.drag_area` — полоса 22px с круглой иконкой 18×18 (была 14px, иконка не помещалась).
- `AdminTree/branch.vue`: карандаш (`edit`) открывает форму в новой вкладке (`edit_in_new_tab`), клик по названию — по условию `form.changed_in_tree` (inline-диалог `FormInBranch`).
- Пагинация: глобально уменьшены кнопки до 32×32, `gap:2px`, `margin:0.1rem` (в v3 кнопки были ~88px).
- Фильтры AdminTable: `.filter_block.v-input{display:flex;align-items:center}`, `.v-label{margin-bottom:0}` — чекбокс выровнен по центру с названием; `.v-input__details` скрыт.
- OnFilters: `.drag_area` — тонкая полоса-хэндл (14px) с круглой иконкой 14×14; карточка `.onfilter` с `margin-top:10px`.
- Локаль: `locale: { locale: 'ru', fallback: 'en', messages: { ru, en } }` (`vuetify/locale`). Без `messages` были варнинги `$vuetify.*` not found. Дата-пикер берёт локаль оттуда же (русские месяцы), проп `locale="ru-Ru"` на `v-date-picker` игнорируется.
- Floating label: `.v-field-label--floating { font-size:10px; color: rgb(var(--v-theme-primary)) }` (в v3 по умолчанию чёрный/крупнее).
- `fields/file.vue`: иконки `fa-eye`/`fa-eye-slash` получили `color="primary"`.
- `EditForm`: `container` снова `width:100%; max-width:1200px; margin:0 auto`; динамический `:class="'md'+N"` → `:md="N"`; `text-lg-center` attr → class; плотность полей уменьшена.
- `AdminTable/result_objects/form.vue`: `class="row"` → `d-flex align-center` (в v3 `.row` нет).
- `v-color-picker` в `fields/text.vue` — актуален (`hide-canvas/hide-sliders/hide-inputs` есть в v3).
- Иконки: «голые» имена (`edit`, `delete`, `keyboard_arrow_up`, `filter_list`, `insert_drive_file`) рисуются как **Material Icons лигатуры**, а не `mdi-*` (в `@mdi/font@4.9.95` их нет). `fa-<name>` получает базовый класс `fa`.
- `v-date-picker` (Vuetify 3.5) требует `Date`, а не строку (`comparing.getDate is not a function`). Добавлены глобальные `$toDate/$toIso`; все `v-date-picker` переведены на `:model-value="$toDate(x)"` + `@update:model-value="x=$toIso($event); handler"`.
- Labs-компоненты зарегистрированы в `main.js`: `VTimePicker`, `VTreeview`, `VCalendar` (`v-calendar` в v3 — labs, API урезан; `Schedule`/`time_table` требуют отдельной доработки под `view-mode`/`events`).
- Vuetify обновлён до `3.5.13`; `v-time-picker` и `v-treeview` — только в labs (`vuetify/labs/VTimePicker`, `vuetify/labs/VTreeview`), регистрируются в `main.js` (в 3.4.11 `v-time-picker` отсутствовал).

### Требует проверки на реальном стенде

- `insert`/загрузка файлов/1_to_m drag-sort и multiconnect treeview (на своих конфигах).
- Messenger (WS) — в `App.vue` отключён (`v-if="false"`).
- StatTool/ParserExcel/VideoList/Documentation/TransfereCards/Schedule — в svcms-меню отсутствуют.
- Серверный `eval`/`jscode` (см. `security.md`).
- Deploy-скрипты `build/<tenant>`, PR `vue3 → main`.

### Найдено в финальном прогоне

- `fields/field_functions.js` (`check_fld`): правила `regexp_rules` отдаются бэкендом как строки без слэшей (`"^.+$"`), а код делал `eval("^.+$.test(...)")` — падало с `Unexpected token '^'` (`feedback_form`, `send_request_form`). Переведено на `new RegExp(rule)` (+ поддержка формы `/.../flags`), с try/catch. Баг есть и в ветке `main`.
- Полный smoke: все 19 пунктов меню и все `edit_form/<config>` — 0 ошибок/предупреждений.

## Раньше: план (для истории)

Ниже — исходный роадмап, по которому выполнялась миграция.

