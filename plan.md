# План перехода CRMFreshFront на Vue 3 + Vite + Vuetify 3

Источник деталей: `docs/migration-vue3.md`, `docs/icon-system.md`, `docs/build-and-tenant.md`. Исполняемый чеклист.

Легенда: `[x]` выполнено, `[ ]` осталось (требует браузера/сервера).

## Решения (зафиксированы)

- Ветка `vue3`, `main` остаётся на Vue 2. Откат — `git checkout main`.
- JavaScript, Options API.
- Backend не меняется: `eval`-точки, глобалы, runtime-компилятор.
- Иконки: MDI + FontAwesome + Material.
- Вывод сборки: `dist/{js,css,index.html,fonts}`.

## Этап 0. Подготовка

- [x] Ветка `vue3`, тег `pre-vue3`.
- [x] Baseline `npm run build` (Vue CLI) — успешен, зафиксирован.
- [x] Smoke на Vue2 — сравнение с baseline (Vue2-билд) на ключевых экранах.
- [x] Список проверяемых экранов — `docs/verification.md`.

## Этап 1. Vite

- [x] `vite`, `@vitejs/plugin-vue`, `vite-plugin-vuetify`, `sass`.
- [x] `vite.config.js`: alias `@`, vue esm-bundler, `server 8081`, output `js/css/fonts`.
- [x] `index.html` в корень; `BaseUrl` из `import.meta.env.BASE_URL` в `main.js`.
- [x] `process.env.BASE_URL` убран.
- [x] Скрипты `dev/serve/build/build_trade/build_svcms` через `--mode`.
- [x] `public/` подключён как есть.
- [x] Сборки default/trade/svcms проходят, base корректный.

## Этап 2. Ядро Vue 3

- [x] `vue@3`, `vuetify@3`, `mitt`.
- [x] `main.js`: `createApp`, `globalProperties`, `app.component`.
- [x] `dynamic_component_loader(app)`.
- [x] bus-shim `$on/$off/$emit`.
- [x] Глобалы `window.Vue/EditForm/app`, `BackendBase`, `BaseUrl`.
- [x] Alias `vue/dist/vue.esm-bundler.js`.
- [x] `$vuetify.breakpoint` → `$vuetify.display`.

## Этап 3. API codemods

- [x] `beforeDestroy`→`beforeUnmount`, `destroyed`→`unmounted`.
- [x] `.sync` → `v-model:search`.
- [x] Grep-защиты по Vue2 API чисты (кроме комментариев).

## Этап 4. Vuetify 2 → 3

- [x] `v-layout/v-flex` → `v-row/v-col` (+ grid-атрибуты `xs12/md6/...`).
- [x] `v-tabs-items/v-tab-item` → `v-window/v-window-item`.
- [x] `v-simple-table` → `v-table`.
- [x] `v-expansion-panel-header/content` → `title/text`.
- [x] `v-list-item-content` убран, `v-subheader` → `v-list-subheader`.
- [x] Классы `headline`→`text-h5`, `white--text`→`text-white`; `red darken-1`→`red-darken-1`.
- [x] `v-btn text`→`variant`, `v-icon/v-btn small`→`size`.
- [x] Кастомный icon set (`LegacyIcon` в `main.js`).
- [x] `createVuetify({ theme, icons })`.
- [x] `v-treeview` под API v3, `item-text`→`item-title`.
- [x] Рантайм-проверка (puppeteer): shell + Form Engine (12 полей), date/time picker — 0 предупреждений.
- [x] Ревизия SCSS-селекторов Vuetify2 в браузере (выполнена).

### Найдено и исправлено рантаймом

- [x] Ленивые компоненты → `defineAsyncComponent` (в Vue 3 фабрика `() => import()` не async).
- [x] `@change` → `@update:model-value` у form-компонентов Vuetify 3.
- [x] `v-menu` активатор: `{ on }`+`v-on="on"` → `{ props }`+`v-bind="props"`.
- [x] Vuetify 3.5.13 + labs `VTimePicker`/`VTreeview` (в 3.4.11 time-picker отсутствовал).
- [x] Иконки: нормализация `fa-<name>` → `fa fa-<name>` (иначе FontAwesome-семейство терялось).
- [x] `vuedraggable@4`: `item-key` + слот `#item`, `:options`→`group`/`handle` (branch, OnFilters, slide).
- [x] `FormBlock.vue`: пустой `<component :is>` под `v-if` (устранён «Invalid vnode type»).
- [x] «Голые» вложенные `<template>` убраны (Vue 3 рендерит их как нативный `<template>`); чинило листья левого меню.
- [x] Шапка: стили `.v-toolbar-title` + белый цвет ссылки/иконки (Vuetify 3 `a{color:primary}`).
- [x] Реальный smoke на `build_svcms` + живом бэке: shell (15 верхних пунктов), edit_form/good+news, admin_tree direction/vendor, admin_table news/good/cert/manager, const — 0 ошибок/предупреждений.

### Стили и цветовые схемы

- [x] Sass `@import` → `@use`; варнинг `legacy-js-api` отключён; `@import` в проекте нет.
- [x] Единый источник палитры `src/theme/palette.js`; `src/styles/colors/` и `variables.scss` удалены.
- [x] SCSS-цвета → CSS-переменные Vuetify `rgb(var(--v-theme-*))` (22 файла).
- [x] Глобальный цвет ссылок `.v-application a`.
- [x] Аудит Vuetify2-селекторов (`.v-card__*`, `.v-toolbar__*`, `.v-input__slot`, `.v-input--selection-controls`, `.theme--light`, treeview и т.д.).
- [x] `App.vue`: `.v-field*` вместо `.v-input__slot`/`.v-select__*`.
- [x] AdminTable: чекбоксы фильтров через `:model-value`+`@update:model-value` — кнопка «искать» появляется.
- [x] Грид-атрибуты `sm12/lg7` → `sm/lg`; `:outlined`→`variant`.
- [x] AdminTree: плюсы/минусы `x-small` + отступ.
- [x] Проверено: сборки 0 варнингов; smoke 0 ошибок; фильтры/таблицы/дерево/шапка ок.

## Этап 5. Динамические импорты

- [x] `DynamicLoader.vue` → `import.meta.glob`.
- [x] Фильтры `dynamic_component_loader.js` → статические `import()`.

## Этап 6. Библиотеки

- [x] `vuedraggable@4`, `vue-advanced-cropper@2`, `axios@1`.
- [x] Удалены неиспользуемые зависимости.
- [x] `chart.vue` оставлен на вендоренном `js/chart.js`.
- [x] wysiwyg (TinyMCE) проверен; DnD/кроп — вручную.

## Этап 7. Сборка и деплой

- [x] Output `js/css/fonts` + `index.html`.
- [x] `build/build_trade/build_svcms` — структура совпадает с контрактом.
- [ ] Прогон реального deploy-скрипта `build/<tenant>` (нужен стенд).
- [ ] Обновить Dockerfile (опционально).

## Этап 8. Проверка и релиз

- [x] Реальный smoke на живом бэке (shell, формы, деревья, таблицы, const) — 0 ошибок/предупреждений.
- [x] save (update) проверен на живом бэкенде; insert/файлы/1_to_m/drag и multiconnect treeview — на стенде.
- [ ] Проверить `eval`-точки `docs/security.md` на стенде (формы с regexp-правилами исправлены без eval).
- [x] Grep-защиты (Vue2 API / Vuetify2 / `process.env`).
- [ ] PR `vue3 → main`.

## Риски и митигации

| Риск | Митигация |
|---|---|
| Серверный `eval` использует Vue2 API | runtime-компилятор + глобалы; дым-тест всех `eval` |
| Регрессии date/time picker и select | рантайм-проверка, при необходимости `v-autocomplete`/адаптеры |
| Визуальные регрессии иконок | кастомный icon set, ручная проверка трёх систем |
| Пути/структура `dist` | output настроен, сверено на 3 mode |

## Изменённые/созданные файлы (ключевые)

- `package.json`, `package-lock.json`, `vite.config.js`, `index.html`
- `src/main.js`, `src/dynamic_component_loader.js`
- `src/App.vue`, `src/js/app.js`
- codemods и правки в ~50 `*.vue`
- `public/index.html`, `babel.config.js`, `src/plugins/vuetify.js` — удалены
- docs: `AGENTS.md`, `plan.md`, `docs/*`

## Критерий готовности

- Ветка `vue3` собирается в 3 mode с контрактом `dist/{js,css,index.html,fonts}`. [x]
- Smoke пройден, серверный JS исполняется, иконки сохранены. [ ]
- `main` не затронут. [x]
