# Architecture

> Load when: app startup, globals, event bus, shell layout.
> Canonical for: entry chain, global names, bus events, `/startpage` loading, palette/style mechanics.

## Entry chain

1. `public/index.html` — loads `dist/googleapis.com-Material-plus-Icons.css`, `dist/fontawesome/all.css`, `configure.js`; inline `var BaseUrl='<%= BASE_URL %>', BackendBase=config.BackendBase`.
2. `public/configure.js` (runtime, not bundled) — `BackendBase`, `MessengerWS`, `MessengerSignal`, `TinyMCE_BaseUrl`, `UrlPrefix`.
3. `src/main.js` — `bus`, Vuetify, globals, component registration. 4. `src/App.vue` — root.

`BaseUrl`/`BackendBase` are `window` globals, not imports — used directly as `BackendBase+'/...'`.

## `src/main.js`

`export const bus` · `$http` = `axios` · `$isMobile` from `document.body.clientWidth<1000` and `navigator.userAgent` (local only, never sent to the server) · `$color`, `$theme`, `$scheme`, `$schemeDefaults` from `src/theme/palette.js` ([design-system.md](design-system.md)) · `$toDate`, `$toIso` (date-picker glue) · `window.Vue`, `window.log=console.log` (used by server `eval`) · globals `draggable`, `VTimePicker`, `VTreeview`, `VCalendar` ([dependencies.md](dependencies.md)).

Lazy registration: `dynamic_component_loader(Vue/app)` ([components.md](components.md)); eager list: [fields.md](fields.md). Branch `main` equivalents: `Vue.prototype.*`, `Vue.component(...)`, `bus = new Vue()`, `new Vue({ vuetify, render: h => h(App) }).$mount('#app')`.

## Event bus

`bus.$on('event', cb)` / `bus.$emit('event', data)` / `bus.$off(...)`; `bus` is used in 25+ files.

| Event | Meaning |
|---|---|
| `change_field` | field changed (`components/js/edit_form.js:48`) |
| `field-update:<name>` | point update of one field |
| `save_field_1_to_m` | 1_to_m subfield saved |
| `1_to_m:upload_values:<name>` | 1_to_m values uploaded |
| `1_to_m:slide_<name>:update_fields` | slide fields refresh |
| `1_to_m:change_in_slide:<...>` | change inside a slide |
| `frontend_button_process` | form frontend button |
| `file:<name>` | file upload result (`EditForm.vue`) |

Consumer engine: [field-dependencies.md](field-dependencies.md). Vue 3 has no `$on/$emit/$off` → `mitt` shim ([migration-vue3.md](migration-vue3.md)).

## `src/App.vue`

Layout by `route.meta.blank`; routes, aliases, menu highlight: [router.md](router.md). `App.created` loads shell data:

- `GET BackendBase + '/startpage'` → `bottom_menu`, `left_menu`, `left_menu_controller`, `manager`, `startpage`, `app_components`, `redirect`, `copyright`, `title`, `errors`.
- `load_menu(url)`: `GET BackendBase + url` → `left_menu`; `params` parsed from a JSON string.
- `app_components.navigator` → `<Messenger :config=...>` ([messenger.md](messenger.md)).

## Styles

- Palette source `src/theme/palette.js` → Vuetify theme in `main.js` → `--v-theme-*` (RGB channels). SCSS color access `rgb(var(--v-theme-<key>))`, e.g. `rgb(var(--v-theme-primary))`, `rgb(var(--v-theme-primary-lighten-4))`, `rgb(var(--v-theme-text-on-primary))`; `var(...)` without `rgb()` is invalid for `color`. A new key in `palette.js` works as `color="key"` and `rgb(var(--v-theme-key))`.
- No `$primary`-style SCSS vars remain (`src/styles/colors/`, `variables.scss` deleted).
- `src/styles/main.scss` — tables, forms, global `.v-application a { color: rgb(var(--v-theme-primary)); }` (Vuetify 3 does not color links). `@use`d in `App.vue`, `Messenger/ChatList|ChatWindow`; no Sass `@import` anywhere, `legacy-js-api` warning disabled in `vite.config.js`.
- Scheme tokens `--app-*` and per-screen spacing: [design-system.md](design-system.md).

## Notes

- `runtimeCompiler: true` in `build/config/*` — required by server `eval` ([security.md](security.md)).
- `dynamic_component_loader.js` uses `import()` with template strings — Vite cannot analyze them statically.