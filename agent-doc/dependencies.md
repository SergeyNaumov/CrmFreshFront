# Dependencies (npm, branch `vue3`)

> Load when: adding, upgrading, or removing a package.
> Canonical for: package names and pinned versions, vendored (non-npm) assets, packages removed in the migration.

Field dependency engine is unrelated: [field-dependencies.md](field-dependencies.md). Replacement rationale: [migration-vue3.md](migration-vue3.md).

## Main (in use)

| Package | Version | Where |
|---|---|---|
| `vue` | ^3.4 | whole project |
| `vue-router` | ^4 | `src/router/index.js` |
| `vuetify` | 3.5.13 | UI (+ `vite-plugin-vuetify`) |
| `@mdi/font` | 4.9.95 | MDI icons — do not change |
| `axios` | ^1 | `this.$http` (main.js) |
| `mitt` | ^3 | event bus (main.js) |
| `vuedraggable` | ^4 | AdminTree / OnFilters / 1_to_m |
| `vue-advanced-cropper` | ^2 | `fields/file.vue` |
| `tinymce` | ^5.9.2 | `fields/wysiwyg.vue` (raw, `config.TinyMCE_BaseUrl`) |
| `@codemirror/view`, `state`, `commands`, `language`, `search`, `autocomplete` | ^6 | `fields/codelist.vue` (CodeMirror 6, granular imports) |
| `@codemirror/lang-python`, `@codemirror/lang-javascript` | ^6.2 | `fields/codelist.vue` (lazy `import()`) |
| `@codemirror/legacy-modes` | ^6.5.4 | `fields/codelist.vue` (perl static, sql/shell/css/xml/ruby/lua/clike lazy) |
| `@fontsource/inter`, `@fontsource/nunito` | ^5 | scheme fonts (main.js) |

Dev: `vite@4`, `@vitejs/plugin-vue@4`, `sass`, `vite-plugin-vuetify@1`.

Labs components come from `vuetify/labs/`: `VTimePicker`, `VTreeview`, `VCalendar` — registered in `main.js` (in 3.4.11 `v-time-picker` was absent).

## Vendored (not npm)

`src/js/chart.js` (Chart.js v2 API, used by `fields/chart.vue`) · `src/js/qrcode.min.js` · `public/dist/{tinymce,fontawesome,googleapis.com-Material-plus-Icons.css,webfonts}`.

## Removed during the migration (present on `main`)

`@vue/cli-*`, `vue-template-compiler`, `vue-cli-plugin-vuetify`, `vuetify-loader`, `babel.config.js`, `sass-loader@7`, `stylus*`, `css-loader`, `style-loader`, `core-js@2`, and the unused `chart.js`/`vue-chartjs` (chart field uses the vendored file) and `@tinymce/tinymce-vue` (wysiwyg drives raw tinymce).

## Notes

- `vue` is aliased to `vue/dist/vue.esm-bundler.js` — runtime compiler for server `eval` ([security.md](security.md)).
- Do not change the icon versions `@mdi/font@4.9.95` and `public/dist/fontawesome` ([icon-system.md](icon-system.md)).
