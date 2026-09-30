# Backend contract (`CrmFreshBackend-python-async`)

> Load when: mapping a backend config to a screen, field, or filter.
> Canonical for: menu contract, `type` → component maps, AdminTree/Const payloads, known gaps.

The frontend is a renderer: the backend sends JSON describing an administrable table (config) and the component draws fields/filters/tree. No background scripts are described in a config. User-facing version: `CrmFreshBackend-python-async/docs-developer/17-frontend-contract.md`.

## Menu

`GET {BackendBase}<left_menu_controller>` → `{left_menu:[...], success}`. Item: `{header, type, value, params, icon, child[]}`.

| type/value | Route | Component |
|---|---|---|
| `vue` + `admin-table` | `/vue/admin_table/<params.config>` | `AdminTable.vue` |
| `vue` + `admin-tree` | `/vue/admin_tree/<params.config>` | `AdminTree.vue` |
| `vue` + `const` | `/vue/const/<params.config>` | `Const.vue` |
| `src` / `newtab` | — | arbitrary page / URL |

Files: `LeftMenu.vue`, `left_menu_item.vue`, `App.vue`, `router/index.js`. Routing: [router.md](router.md).

## EditForm: `type` → component

`FormBlock.vue:dynamic_component`; the `1_to_1_` prefix is stripped first. Runtime flow: [form-engine.md](form-engine.md). Field files: [fields.md](fields.md).

| backend `type` | component |
|---|---|
| `text`, `textarea` | `field-text` |
| `checkbox`, `switch`, `1_to_1_checkbox` | `field-checkbox` |
| `select` | `field-select` |
| `multiconnect` | `field-multiconnect` |
| `date`, `time`, `datetime`, `yearmon`, `daymon` | `field-<type>` |
| `wysiwyg`, `password`, `code`, `memo`, `1_to_m`, `file`, `docpack`, `in_ext_url`, `time_table`, `font-awesome`, `component`, `accordion` | `field-<type>` |
| `project_sitemap`, `project_export`, `project_clone`, `project_struct` | `field-project_*` |
| `save_button` | draws the save button |

`is_only_field`: `checkbox|switch`, or read_only `date|datetime` — no description wrapper.

## AdminTable: filters

`OnFilters.vue:dynamic_component`:

| backend type | component |
|---|---|
| `text`, `textarea`, `wysiwyg` | `filter-text` |
| `checkbox`, `switch` | `filter-checkbox` |
| `file`, `select`, `date`, `datetime`, `yearmon`, `memo`, `in_ext_url`, `multiconnect` | `filter-<type>` |

`AdminTable.vue:333-341`: `checkbox`/`switch` without `values` becomes a `select` «Не использовать/Да/Нет».

## AdminTree

`GET`/`POST /admin-tree/<config>` → `{form, tree}`.

- `form.*`: `title, config, header_field, tree_use, sort, sort_field, max_level, not_create, read_only, make_delete, changed_in_tree, view_type, cols, wide_form, card_format`.
- `item.*`: `id, header, sort, childs, photo`.

See [components.md](components.md) and backend docs `11`/`17`.

## Const

`Const.vue` understands `header`, `text`, `textarea`, `wysiwyg`, `file`, `checkbox`, `switch`, `select`.

## Known gaps

- No `filter_extend_*` support (0 occurrences in `src/`). The backend emits such fields in `/get-filters` (except `filter_extend_checkbox/switch/datetime`, which are not converted), but `OnFilters.dynamic_component` returns `''` → the filter is not drawn.
- `filter-checkbox` is referenced in `OnFilters.vue` but not registered in `dynamic_component_loader.js`/`main.js`.
- `field-chart` and `field-table` are registered but `FormBlock` never selects them — only `field-accordion` uses them.
- `filter-time` is registered, but the type `time` is absent from the filter switch.

See `CrmFreshBackend-python-async/agent-doc/10-known-issues.md`.
