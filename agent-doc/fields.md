# Form fields

> Load when: adding or fixing a field type, or an AdminTable filter.
> Canonical for: field/filter registration and the `type` → file catalogue.

Catalogue dir `src/components/fields/`. Backend `type` → component: [backend-contract.md](backend-contract.md). Engine: [form-engine.md](form-engine.md).

## Registration

- Eager in `src/main.js`: `field-text`, `field-in_ext_url`, `field-date`, `field-time`, `field-datetime`, `field-yearmon`, `field-daymon`.
- Lazy in `src/dynamic_component_loader.js` (`defineAsyncComponent`): `field-select`, `field-1_to_m`, `field-accordion`, `field-chart`, `field-checkbox`, `field-code`, `field-codelist`, `field-docpack`, `field-file`, `field-font-awesome`, `field-memo`, `field-multiconnect`, `field-table`, `field-time_table`, `field-wysiwyg`, `field-component`, `field-project_sitemap`, `field-project_export`, `field-project_clone`, `field-project_struct`.
- `field-password` is registered locally in `FormBlock.vue` (`FieldPassword`).

## Types

| type | File | Notes |
|---|---|---|
| `text` / `textarea` | `text.vue` | subtypes in `text_subtypes/` (`email.vue`, `qr_call.vue`); uses `js/qrcode.min.js` |
| `checkbox` / `switch` | `checkbox.vue` | |
| `select` | `select.vue` | `:search-input.sync`, `POST /autocomplete/<config>` |
| `multiconnect` | `multiconnect.vue` | `/multiconnect/<config>/<field>` |
| `date` / `datetime` / `time` / `yearmon` / `daymon` | `date.vue`, `datetime.vue`, `time.vue`, `yearmon.vue`, `daymon.vue` | picker: [design-system.md](design-system.md) |
| `memo` | `memo.vue` | CRUD `/memo/...` |
| `accordion` / `in_ext_url` | `accordion.vue`, `in_ext_url.vue` | |
| `file` | `file.vue` | `vue-advanced-cropper` (`Cropper`), `navigator.clipboard`; `fa-eye`/`fa-eye-slash` use `color="primary"` |
| `wysiwyg` | `wysiwyg.vue` | raw `tinymce/tinymce` (not `@tinymce/tinymce-vue`), `tinymce.baseURL=config.TinyMCE_BaseUrl`; `tinymce/upload.js` |
| `code` | `code.vue` | legacy inline code viewer |
| `codelist` | `codelist.vue` | CodeMirror 6 editor (Perl default). Languages: perl, python/js (modern), sql/shell/css/xml/ruby/lua/clike (legacy). Props: `form`, `field`, `parent`, `refresh`, `error_messages`. Uses lazy language loads and Vuetify theme integration. Registered as `field-codelist` (lazy). Attribute `field.fast_rules` = `[{header,url}]` renders a «быстрое правило» select + «применить» button: `GET url` → `{success, data}` writes `data` into the doc. In `1_to_m` the dialog is `fullscreen` (`.one_to_m_form_wide`) when a child field is `codelist` — `form.vue` `is_wide_dialog`. Editor has a mini-toolbar (`mdi-magnify`/undo/redo/fold/unfold/wrap, `mdi-dots-horizontal` — подсветка пробелов и табов через `highlightWhitespace()`, `mdi-keyboard-tab` — отступы пробелами/табами через `indentUnit`) and word autocompletion; defaults `field.show_whitespace`, `field.indent_with_tabs`, `field.indent_size`; `<pre>` slide/AdminTable render is capped (140px/120px). |
| `password` | `password.vue` | `POST /password/<config>/<field>/<id>` |
| `font-awesome` | `font-awesome.vue` | `GET BaseUrl+'dist/json/awesome.json'` |
| `chart` | `chart.vue` | local `src/js/chart.js` (Chart.js v2 API); title `f.subtype` forced to `'bar'` |
| `time_table` | `time_table.vue` | `/time_table/<config>/getList|addEvent`; `v-calendar` labs, view-mode/events |
| `1_to_m` | `1_to_m.vue` + `1_to_m/` | `form.vue`, `slide.vue`, `ChangeInSlide.vue`; drag&drop `vuedraggable`; `codelist` in the dialog is fullscreen |
| `docpack` | `docpack.vue` + `docpack/` | `docpack_new.vue`, `dogovor.vue`, `acts_for_bill.vue`, `tech_and_bills.vue` |
| `component` | `component.vue` | `eval('obj='+r.data)` (`:107`), `table.vue` for arbitrary tables |
| `table` | `table.vue` | `v-simple-table` |

## Common

- `field_functions.js` — validation/dependencies; uses `eval(...)` (`:57`, `:70`), see [security.md](security.md).
- `field_style.js` — narrow-field `max-width` rules ([design-system.md](design-system.md)).
- `frontend/buttons.vue` — buttons invoked from fields (`bus` / `frontend_button_process`).
- Fields receive props `:form` and `:field`, write through `bus` ([architecture.md](architecture.md)).

## AdminTable filters

`src/components/AdminTable/filters/`: `text.vue`, `in_ext_url.vue`, `file.vue`, `multiconnect.vue`, `memo.vue`, `yearmon.vue`, `datetime.vue`, `time.vue`, `date.vue`, `select.vue`.

Registered in `dynamic_component_loader.js`; on `vue3` via static `import()` (a template string breaks Vite analysis). Backend `type` → `filter-*`: [backend-contract.md](backend-contract.md). `:search-input.sync` in `filters/{text,select}.vue`.

A `codelist` column in the results is rendered read-only as `pre.codelist_result` (`FindResults.vue`). The backend sends `type:'html'` for every field without `make_change_in_search`, so the real type is resolved by `result_type(td)` in `result_objects/FindResultsMethods.js` via the `filters` prop — checking `td.type` alone would never match.