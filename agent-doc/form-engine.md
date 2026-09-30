# Form Engine (EditForm)

> Load when: form load/save, the scoped controller, the server JSON contract.
> Canonical for: EditForm files, load/save flow, `edit_form.js` API, server form/field/frontend JSON shapes.

Dependency engine: [field-dependencies.md](field-dependencies.md). Fields: [fields.md](fields.md). `eval` sites: [security.md](security.md). `type` → component: [backend-contract.md](backend-contract.md).

## Files

| File | Role |
|---|---|
| `src/components/EditForm.vue` | form container, `name:'edit-form'`; tabs/columns/blocks, save, files |
| `src/components/EditForm/form_controller.js` | mixin: load/save, `provide('formController')`, bus bridge |
| `src/components/EditForm/FormBody.vue` | presentational body (cols/tabs/blocks), shared with the dialog |
| `src/components/EditForm/FormBlock.vue` | form block; renders fields (`type` → global component) |
| `src/components/EditForm/DynamicLoader.vue` | dynamic field import (practically unused; `import.meta.glob`) |
| `src/components/fields/field_access.js` | global mixin: `this.emitChange/emitSaveField1ToM/emitFrontendButton` via inject or bus |
| `src/components/js/edit_form.js` | dependencies, field change/save, ajax, CGI |

`dynamic_component_loader.js` registers `edit-form` as `import('./components/EditForm')` → resolves to `EditForm.vue`.

## Scoped controller and form isolation

- `form_controller.js` provides `provide('formController')` with `changeField/saveField1ToM/runFrontendButton/getField`; fields get it through `inject` (mixin `fields/field_access.js`) and call it directly.
- This isolates forms: concurrently mounted controllers (EditForm, Const, `AdminTree/FormInBranch`) do not intercept each other's events.
- While not all fields are migrated, and for server `javascript_static`, a **bus bridge** is kept in the controller's `created` (`change_field`/`save_field_1_to_m`/`frontend_button_process`) and on `window.bus`.
- `AdminTree/FormInBranch.vue` (`changed_in_tree`) is the same form in a `v-dialog`: same mixin + `FormBody`; prop `tree_form` = tree object, `item` = edited node.

## Loading (`EditForm.vue: Init` → `form_controller.js: load_form`)

1. `get_params(self)` (`edit_form.js:229`) parses `location.pathname`: `/edit_form/<config>/<id>` → `POST BackendBase/edit-form/<config>/<id>`; `/edit_form/<config>` → `POST BackendBase/edit-form/<config>`; body `{ cgi_params: get_cgi_params() }` (`edit_form.js:217`).
2. Response `data`: `log`, `redirect`, `success`, `title`, `fields`, `cols`, `tabs`, `read_only`, `errors`, `javascript`, `javascript_static`. `data.javascript` → `eval(...)` (`EditForm.vue:285`); `javascript_static[]` → `<script src>` in `<head>` (`:289-294`).
3. `calc_values(this)` (`edit_form.js:250`) fills `values`, sets `disabled_form` (if a field has `error`), initializes selects.

## Saving (`EditForm.vue: save`)

`POST BackendBase/edit-form/<config>[/<id>]` with `{action:'update'|'insert', id, values, cgi_params}`; on success `save_files()` (uploads of `type:'file'`), `history.pushState`, re-run `Init()`, then `router.replace('/edit_form/<config>/<id>')`.

## `js/edit_form.js`

| Function | Purpose |
|---|---|
| `on_dependence(self,name,obj,not_frontend_process)` | applies a server dependency object to a field (`value`, `values`, `hide`, `error`, `warning`, `before_html`, `after_html`, `fields`), emits `change_field` |
| `change_field(self,field,...)` | writes `self.values[field.name]`, emits `field-update:<name>`, calls `calc_values` and `frontend_process` |
| `save_field_1_to_m` | saves a 1_to_m subfield |
| `frontend_result_process` | parses `result` (pairs `[name, obj]`), calls `on_dependence` and `eval(obj.jscode)` (`:127`) |
| `frontend_button_process` | form ajax button (`POST .../ajax/<config>/<button.ajax>`) |
| `frontend_process` | handles `field.frontend`: `eval('dep='+front.fields_dependence)` (`:166`) and the field's deferred ajax |
| `get_cgi_params` / `get_params` | query/path parsing |
| `calc_values` | recomputes `values` |

## Server JSON contract

```
form: { config, id, title, read_only, fields:[], cols:[[]], tabs:[{name,description,style}],
        errors:[], log:[], javascript, javascript_static:[], redirect }
field: { name, type, value, values, description, full_str, hide, error, error_message,
         before_html, after_html, frontend, frontend_button, jscode, tab, style,
         read_only, not_description, begin_value }
frontend: { fields_dependence: '<JS expression>', ajax: { name, timeout } }
```

URL/CGI: `/edit_form/<config>[/<id>]` (regex also accepts `edit-form`); `get_cgi_params()` puts all query params into `cgi_params`.

## Risks

- Server-JS `eval` requires the Vue runtime compiler and globals (`Vue`, `bus`, `BackendBase`).
- `v-layout`/`v-flex` removed from `EditForm.vue`/`FormBlock.vue` in Vuetify 3.