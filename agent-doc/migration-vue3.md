# Migration to Vue 3 + Vite + Vuetify 3

> Load when: continuing migration work, or hitting a Vue 3 / Vuetify 3 / Vite runtime gotcha.
> Canonical for: decisions, Vuetify 2 → 3 replacements, verified status, pending list.

Stage checklist: `plan.md`. Branch diff: `git diff main..vue3`. All 9 stages are executed; only runtime verification is open.

## Decisions

Branch `vue3`; `main` stays on Vue 2 (rollback `git checkout main`). JavaScript, no TypeScript, Options API kept. Backend unchanged: server-JS `eval`, globals, runtime compiler preserved ([security.md](security.md)). All three icon systems preserved ([icon-system.md](icon-system.md)). Output stays `dist/{js,css,index.html,fonts}` ([build-and-tenant.md](build-and-tenant.md)). Vue3-incompatible libraries updated ([dependencies.md](dependencies.md)).

Open follow-ups: `chart.vue` still uses vendored `src/js/chart.js` (Chart.js v2 API) — a rewrite for `chart.js@4` is a separate step; `wysiwyg.vue` changed minimally (raw `tinymce@5`, `config.TinyMCE_BaseUrl`).

## Stages → result

| Stage | Result |
|---|---|
| 0 Prepare | `vue3` branch, tag `pre-vue3`; baseline `npm ci` + `npm run build` + saved `dist/`; smoke list ([verification.md](verification.md)) |
| 1 Vite | `vite.config.js`: `base` per mode, alias `@`, `vue → vue/dist/vue.esm-bundler.js`, `server: { host: true, port: 8081 }`, `plugins: [vue(), vuetify({ autoImport: true })]`; `index.html` in repo root; `<%= BASE_URL %>` → `BaseUrl = import.meta.env.BASE_URL` ([build-and-tenant.md](build-and-tenant.md)); `process.env.BASE_URL` removed; `build/config/*.js` → `--mode`; `babel.config.js`/stylus removed |
| 2 Vue 3 core | `createApp(App)`; `app.config.globalProperties.*`; `app.component(...)`; `dynamic_component_loader(app)`; `$vuetify.breakpoint` → `this.$vuetify.display` / `useDisplay` ([architecture.md](architecture.md)) |
| 3 Categorical API | `beforeDestroy→beforeUnmount` (12), `destroyed→unmounted` (1), `.sync→v-model:<prop>` (5). `$listeners`/`$children`/`$scopedSlots`, `filters:`/`Vue.filter` unused |
| 4 Vuetify 3 | replacements below; custom icon set ([icon-system.md](icon-system.md)); `createVuetify({ theme: { themes: { light: { colors: {...} } } } })`; `rounded: true` unsupported |
| 5 Dynamic imports | `DynamicLoader.vue` → `import.meta.glob('../fields/*.vue')`; `dynamic_component_loader.js:43-53` template strings → static `import()` |
| 6 Libraries | `vuedraggable@2→@4`, `vue-advanced-cropper@0.15→@2`, `axios@0.19→@1`; removed `@tinymce/tinymce-vue`, `chart.js`, `vue-chartjs`, `stylus*` ([dependencies.md](dependencies.md)) |
| 7 Build/deploy | `build.rollupOptions.output` preserves `dist/{js,css,fonts}`; `build/<tenant>` and `copy_to_fresh` unchanged |
| 8 Verify | all 3 modes build; smoke per [verification.md](verification.md) |

## Event bus shim

`new Vue()` is banned in Vue 3; `mitt` keeps `$on/$off/$emit` for 25+ files:

```js
const emitter = mitt()
export const bus = { $on: emitter.on, $emit: emitter.emit, $off: emitter.off }
```

`window.Vue`, `window.EditForm`, `window.app`, `window.log`, `BackendBase`, `BaseUrl` stay — used by server `eval` and project code.

## Vuetify 2 → 3

| Vuetify 2 | Vuetify 3 |
|---|---|
| `v-layout` / `v-flex` (9/34) | `v-row` / `v-col` or flex CSS |
| `v-tabs-items` / `v-tab-item` | `v-window` / `v-window-item` |
| `v-simple-table` (4) | `v-table` |
| `v-expansion-panel-header` / `-content` | `v-expansion-panel-title` / `-text` |
| `v-list-item-content` (2) | `v-list-item` slots |
| `v-subheader` (2) | `v-list-subheader` |
| `v-treeview` (6) | `vuetify/labs/VTreeview` (different API) |
| `v-btn text` | `variant="text"` |
| `v-icon small/x-small` | `size="small"/"x-small"` |
| class `headline` (19) | `text-h5`/`text-h6` |
| `white--text` (1) | `text-white` |
| `red darken-1` | `red-darken-1` |
| `item-text` | `item-title` |
| grid attrs `xs12/md6/...` | `cols`/`md`/... |

`v-app-bar`, `v-navigation-drawer`, `v-main`, `v-tabs` are broadly compatible but differ in slots/props. Converted SCSS → [design-system.md](design-system.md).

## Runtime gotchas found (puppeteer + Chrome)

- `defineAsyncComponent` is required in `dynamic_component_loader.js`: Vue 3 `app.component(name, () => import())` is **not** async and renders as `[object Promise]`.
- Vuetify 3 form components do not emit `@change` → `@update:model-value`. `v-menu` activator: `v-slot:activator="{ on }"` + `v-on="on"` → `v-slot:activator="{ props }"` + `v-bind="props"`.
- `vuedraggable@4`: `item-key` and slot `#item="{ element }"` mandatory; `:options="{group}"` → `group` prop; `handle` a plain attribute. Files: `AdminTree/branch.vue`, `AdminTable/OnFilters.vue`, `fields/1_to_m/slide.vue`.
- `FormBlock.vue`: an empty `<component :is="dynamic_component(f)">` (for `save_button` etc.) gave "Invalid vnode type" → wrapped in `v-if`; `<template if=...>` → `v-if`.
- A bare `<template>` without a directive renders as a native `<template>` and hides its content; `v-show` on `<template>` does the same. Fixed in `left_menu_item.vue`, `fields/multiconnect.vue`, `fields/datetime.vue`, `fields/text_subtypes/qr_call.vue`, `AdminTable/filters/{file,in_ext_url}.vue`, `Table.vue`, `fields/wysiwyg.vue` (the last hid the field and its "edit mode"/TinyMCE button).
- `v-calendar` is labs: `Schedule.vue` and `fields/time_table.vue` use `view-mode` and `events` `{title, start:Date, end:Date, color}`; `$toDate` parses date-time (`YYYY-MM-DD HH:mm:ss`). Missing `event-color`, `event-overlap-mode`, `first-interval`, `@click:event` → event click (edit/delete popup) unavailable; adding events and the rest of the UI work. Both absent from the svcms menu.
- Icons (`LegacyIcon` in `main.js`): `fa-<name>` without a space → `fa fa-<name>`; `fa[srlb] <name>` and `mdi-*` pass through; bare names → Material Icons ligature ([icon-system.md](icon-system.md)).
- `AdminTable/filters/multiconnect.vue`: `field.value=false` → `[]` (else a «false» chip shows); `result_objects/form.vue`: `class="row"` → `d-flex align-center` (no `.row` in v3).
- `v-color-picker` in `fields/text.vue` still works (`hide-canvas/hide-sliders/hide-inputs` exist in v3).
- Vuetify pinned to `3.5.13`; `v-time-picker`/`v-treeview` only in labs (`vuetify/labs/VTimePicker`, `vuetify/labs/VTreeview`), registered in `main.js` (3.4.11 had no `v-time-picker`).
- `field_functions.js` regex-rule bug, also on `main` → [security.md](security.md).

## Status

Code migration and build done (`default`/`trade`/`svcms` build, `dist/{js,css,index.html,fonts}` preserved); runtime verification in progress.

Verified. Mock backend: shell mounts (`.v-application`, menu, footer), 0 Vue warnings; `/edit_form/test` renders 12 fields; `v-date-picker` and labs `v-time-picker` open in `v-menu`. Production build `build_svcms` against `dev-crm.test/backend`: shell `/manager/` — 20 menu items, 0 broken icons, 0 errors/warnings; `edit_form/good` (33 fields), `edit_form/news` (10); `admin_tree/direction`, `admin_tree/vendor` (244 icons); `admin_table/news|good|cert|manager`; `const/template_const`; `POST /backend/edit-form/news/1 → 200 success:true`. Full smoke: all 19 menu items and every `edit_form/<config>` — 0 errors/warnings.

Pending on a real stand: `insert`, file uploads, 1_to_m drag-sort, multiconnect treeview (own configs); Messenger (WS) — disabled in `App.vue` (`v-if="false"`); StatTool/ParserExcel/VideoList/Documentation/TransfereCards/Schedule — absent from the svcms menu; server `eval` / `jscode` against the real backend ([security.md](security.md)); deploy scripts `build/<tenant>`; PR `vue3 → main`.

## Risks

1. Server `eval` may call Vue 2 APIs (`new Vue`, `Vue.extend`, `$on`) → needs a compat shim or a backend change (forbidden).
2. Non-standard icon rendering → visual regressions, mitigated by the custom icon set.
3. `dist` layout and relative paths (`BaseUrl`) → mitigated by the Vite output config.
4. `v-layout`/`v-flex` → large but mechanical layout rework.