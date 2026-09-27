# Архитектура

## Точка входа и глобалы

1. `public/index.html` — подключает:
   - `dist/googleapis.com-Material-plus-Icons.css`, `dist/fontawesome/all.css` (иконки, см. `icon-system.md`).
   - `configure.js` → глобальный объект `config`.
   - inline-скрипт: `var BaseUrl='<%= BASE_URL %>', BackendBase=config.BackendBase`.
2. `public/configure.js` — рантайм-конфиг (не собирается):
   - `BackendBase`, `MessengerWS`, `MessengerSignal`, `TinyMCE_BaseUrl`, `UrlPrefix`.
3. `src/main.js` — создаёт `bus`, Vuetify, глобальные прототипы, регистрирует компоненты.
4. `src/App.vue` — корень.

> `BaseUrl`/`BackendBase` — глобальные переменные (через `window`), а не импорты. В коде используются напрямую (`BackendBase+'/...'`). При миграции на Vite это надо сохранить (см. `migration-vue3.md`).

## `src/main.js`

- `export const bus = new Vue()` — event bus (см. ниже).
- `let color_scheme='blue'` + импорт `@/styles/colors/blue2.scss` — цветовая тема; `Vue.prototype.$color`, `Vue.prototype.$theme`.
- `window.Vue=Vue`, `window.log=console.log`.
- `Vue.prototype.$isMobile` — по ширине `document.body.clientWidth<1000` и `navigator.userAgent` (локально, на сервер не уходит).
- `Vue.prototype.$http = require('axios')`.
- `Vue.component('draggable', vuedraggable)`.
- `dynamic_component_loader(Vue)` — ленивая регистрация (см. `components.md`).
- Eager-регистрируются: `form-block`, `field-text`, `field-in_ext_url`, `field-date`, `field-time`, `field-datetime`, `field-yearmon`, `field-daymon`, `GPTAssist`, `errors`.
- Итог: `new Vue({ vuetify, render: h => h(App) }).$mount('#app')`.

## Event bus

`bus` из `src/main.js` (Vue 2 instance). Используется в 25+ файлах.
Схема: `bus.$on('event', cb)` / `bus.$emit('event', data)` / `bus.$off(...)`.

Основные события (grep `bus.$emit|bus.$on`):
- `change_field` — поле изменилось (`components/js/edit_form.js:48`).
- `field-update:<name>` — точечное обновление поля.
- `save_field_1_to_m`, `1_to_m:upload_values:<name>`, `1_to_m:slide_<name>:update_fields`, `1_to_m:change_in_slide:<...>`.
- `frontend_button_process`.
- `file:<name>` — результат загрузки файла (`EditForm.vue`).

> В Vue 3 у Vue-инстанса нет `$on/$emit/$off`. Нужен shim (mitt) с тем же API — `migration-vue3.md`.

## `src/App.vue` — два layout'а (Vue Router)

Layout выбирается по `route.meta.blank` (см. `src/router/index.js`):

1. **`meta.blank !== true`** — shell: `v-navigation-drawer` + `LeftMenu`, `v-app-bar` + `Messenger`, `v-main` с `<router-view>`, `v-footer`. Загрузка `/startpage` (left_menu, manager, title, copyright) — в `App.created`.
2. **`meta.blank === true`** — full-screen: `<v-app><router-view/></v-app>` без меню (формы, деревья/таблицы headapp, логин).

Маршруты: `/vue/*` — shell; `/*` (без `/vue`) — full-screen. Катч-олл `/:pathMatch(.*)*` обрабатывает `/src:<url>` (iframe в shell) и неизвестные пути (→ на главную). Дефисные алиасы (`/edit-form`, `/admin-table`, `/admin-tree`) сохранены.

Активный пункт меню — по совпадению `get_link(item)` с `$route.path` (`left_menu_item.vue`).

### Загрузка данных shell

- `GET BackendBase + '/startpage'`: `bottom_menu`, `left_menu`, `left_menu_controller`, `manager`, `startpage`, `app_components`, `redirect`, `copyright`, `title`, `errors`.
- `load_menu(url)`: `GET BackendBase + url` → `left_menu` (парсинг `params` из JSON-строки).
- `app_components.navigator` передаётся в `<Messenger :config=...>`.

## Стили и цветовые схемы

- Единый источник палитры — `src/theme/palette.js`; он же передаётся в тему Vuetify (`main.js`), которая генерирует CSS-переменные `--v-theme-*` (значения — RGB-каналы).
- В SCSS цвет берётся через `rgb(var(--v-theme-<key>))` (например `rgb(var(--v-theme-primary))`, `rgb(var(--v-theme-primary-lighten-4))`, `rgb(var(--v-theme-text-on-primary))`). SCSS-переменных палитры (`$primary` и т.п.) больше нет — `src/styles/colors/` и `variables.scss` удалены.
- `src/styles/main.scss` — общие стили (таблицы, формы, глобальный цвет ссылок `.v-application a`). Подключается через `@use` в `App.vue` (глобально) и в `Messenger/ChatList|ChatWindow`.
- Никаких Sass `@import` в проекте: только `@use`. В `vite.config.js` отключён варнинг `legacy-js-api`.
- Добавить цвет: ключ в `palette.js` → доступен и как `color="key"` в шаблонах, и как `rgb(var(--v-theme-key))` в SCSS.


## Известные особенности

- `runtimeCompiler: true` во всех `build/config/*` — нужен из-за серверного `eval` JS и, возможно, шаблонов.
- `dynamic_component_loader.js` использует динамические `import()` с template-строками — Vite это не статически анализирует (см. `migration-vue3.md`).
