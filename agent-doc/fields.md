# Поля формы

Каталог: `src/components/fields/`. Маппинг `field.type` → глобальный компонент делается в `src/components/EditForm/FormBlock.vue:dynamic_component`.

> Контракт с бэкендом (меню, AdminTable/AdminTree/Const, `filter_extend_*`) —
> `backend-contract.md`.

## Регистрация

Eager в `src/main.js`:
`field-text`, `field-in_ext_url`, `field-date`, `field-time`, `field-datetime`, `field-yearmon`, `field-daymon`.

Лениво в `src/dynamic_component_loader.js`:
`field-select`, `field-1_to_m`, `field-accordion`, `field-chart`, `field-checkbox`, `field-code`, `field-docpack`, `field-file`, `field-font-awesome`, `field-memo`, `field-multiconnect`, `field-table`, `field-time_table`, `field-wysiwyg`, `field-component`.

`field-password` регистрируется локально в `FormBlock.vue` (`FieldPassword`).

## Типы

| type | Файл | Примечание |
|---|---|---|
| `text` / `textarea` | `text.vue` | подтипы в `text_subtypes/` (`email.vue`, `qr_call.vue`); использует `js/qrcode.min.js` |
| `checkbox` / `switch` | `checkbox.vue` | |
| `select` | `select.vue` | `:search-input.sync` (Vue2 `.sync`), `POST /autocomplete/<config>` |
| `multiconnect` | `multiconnect.vue` | `/multiconnect/<config>/<field>` |
| `date` | `date.vue` | |
| `datetime` | `datetime.vue` | |
| `time` | `time.vue` | |
| `yearmon` | `yearmon.vue` | |
| `daymon` | `daymon.vue` | |
| `memo` | `memo.vue` | CRUD `/memo/...` |
| `file` | `file.vue` | `vue-advanced-cropper` (`Cropper`), `navigator.clipboard` |
| `wysiwyg` | `wysiwyg.vue` | напрямую `tinymce/tinymce` (не `@tinymce/tinymce-vue`), `tinymce.baseURL=config.TinyMCE_BaseUrl`; `tinymce/upload.js` |
| `code` | `code.vue` | (codemirror только в закомментированном виде) |
| `accordion` | `accordion.vue` | |
| `password` | `password.vue` | `POST /password/<config>/<field>/<id>` |
| `font-awesome` | `font-awesome.vue` | `GET BaseUrl+'dist/json/awesome.json'` (проверить наличие файла) |
| `chart` | `chart.vue` | локальный `src/js/chart.js` (Chart.js v2 API); заголовок `f.subtype` принудительно `'bar'` |
| `in_ext_url` | `in_ext_url.vue` | |
| `time_table` | `time_table.vue` | `/time_table/<config>/getList|addEvent` |
| `1_to_m` | `1_to_m.vue` + `1_to_m/` | `form.vue`, `slide.vue`, `ChangeInSlide.vue`; drag&drop `vuedraggable` |
| `docpack` | `docpack.vue` + `docpack/` | `docpack_new.vue`, `dogovor.vue`, `acts_for_bill.vue`, `tech_and_bills.vue` |
| `component` | `component.vue` | `eval('obj='+r.data)` (`:107`), `table.vue`, `table.vue` для произвольных таблиц |
| `table` | `table.vue` | `v-simple-table` |

## Общее

- `field_functions.js` — валидация/зависимости; использует `eval(...)` (`:57`, `:70`).
- `frontend/buttons.vue` — кнопки, вызываемые из полей (`bus` / `frontend_button_process`).
- Поля получают пропсы `:form` и `:field`, пишут через `bus` (см. `architecture.md`).

## Фильтры AdminTable

`src/components/AdminTable/filters/`: `text.vue`, `in_ext_url.vue`, `file.vue`, `multiconnect.vue`, `memo.vue`, `yearmon.vue`, `datetime.vue`, `time.vue`, `date.vue`, `select.vue`.
Регистрируются в `dynamic_component_loader.js` через `import(\`${filter_dir}/...\`)` (template-строка → проблема для Vite).
`:search-input.sync` встречается в `filters/{text,select}.vue`.

## Миграция

- `vuedraggable@2` (1_to_m, AdminTree) → v4 (Vue3).
- `vue-advanced-cropper@0.15` (file.vue) → v1/v2 (Vue3).
- `.sync` → `v-model:search-input` (Vue3).
- `v-simple-table` → `v-table` (`table.vue`).
- Динамические фильтры → `import.meta.glob` (Vite).
