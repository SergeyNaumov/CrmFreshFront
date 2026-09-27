# Form Engine (EditForm)

Сервер присылает JSON со структурой формы; клиент рендерит табы/блоки/поля и обрабатывает зависимости.

## Файлы

| Файл | Роль |
|---|---|
| `src/components/EditForm.vue` | контейнер формы, `name:'edit-form'`; табы/колонки/блоки, save, файлы |
| `src/components/EditForm/FormBlock.vue` | блок формы; рендерит поля (type → глобальный компонент) |
| `src/components/EditForm/DynamicLoader.vue` | динамический `import('../fields/'+type)` (практически не используется) |
| `src/components/js/edit_form.js` | бизнес-логика: зависимости, изменение/сохранение полей, ajax, CGI |
| `src/components/fields/*` | реализации полей (см. `fields.md`) |

`dynamic_component_loader.js` регистрирует `edit-form` как `import('./components/EditForm')` → резолвится в `EditForm.vue`.

## Загрузка формы (`EditForm.vue: Init`)

1. `get_params(self)` (`edit_form.js:229`) парсит `location.pathname`:
   - `/edit_form/<config>/<id>` → `POST BackendBase/edit-form/<config>/<id>`
   - `/edit_form/<config>` → `POST BackendBase/edit-form/<config>`
2. POST body: `{ cgi_params: get_cgi_params() }` (`edit_form.js:217`).
3. Ответ (`data`):
   - `log`, `redirect`, `success`, `title`, `fields`, `cols`, `tabs`, `read_only`, `errors`, `javascript`, `javascript_static`.
4. `data.javascript` → `eval(data.javascript)` (`EditForm.vue:285`).
5. `data.javascript_static[]` → `<script src>` в `<head>` (`EditForm.vue:289-294`).
6. `calc_values(this)` (`edit_form.js:250`) заполняет `values`, `disabled_form` (если у поля `error`), инициализирует select.

## Сохранение (`EditForm.vue: save`)

- `POST BackendBase/edit-form/<config>[/<id>]` с `{action:'update'|'insert', id, values, cgi_params}`.
- При успехе: `save_files()` (загрузка `type:'file'`), `history.pushState`, повторный `Init()`.

## `js/edit_form.js`

| Функция | Назначение |
|---|---|
| `on_dependence(self,name,obj,not_frontend_process)` | применяет серверный объект-зависимость к полю (`value`, `values`, `hide`, `error`, `warning`, `before_html`, `after_html`, `fields`), эмитит `change_field` |
| `change_field(self,field,...)` | пишет `self.values[field.name]`, эмитит `field-update:<name>`, вызывает `calc_values` и `frontend_process` |
| `save_field_1_to_m` | сохранение подполя 1_to_m |
| `frontend_result_process` | разбирает `result` (пары `[name, obj]`), вызывает `on_dependence` и `eval(obj.jscode)` (`:127`) |
| `frontend_button_process` | ajax-кнопка формы (`POST .../ajax/<config>/<button.ajax>`) |
| `frontend_process` | обработка `field.frontend`: `eval('dep='+front.fields_dependence)` (`:166`) и отложенный ajax поля |
| `get_cgi_params` / `get_params` | разбор query/path |
| `calc_values` | пересчёт `values` |

## Контракт серверного JSON

Форма (верхний уровень):
```
{ config, id, title, read_only, fields:[], cols:[[]], tabs:[{name,description,style}],
  errors:[], log:[], javascript, javascript_static:[], redirect }
```
Поле (`field`):
```
{ name, type, value, values, description, full_str, hide, error, error_message,
  before_html, after_html, frontend, frontend_button, jscode, tab, style,
  read_only, not_description, begin_value }
```
Зависимость (`frontend`):
```
{ fields_dependence: '<JS-выражение>', ajax: { name, timeout } }
```

## Типы полей и маппинг (`FormBlock.vue: dynamic_component`)

- `1_to_1_<type>` → снимается префикс, далее как `<type>`.
- `text`/`textarea` → `field-text`.
- `checkbox`/`switch` → `field-checkbox`.
- `component`, `multiconnect`, `select`, `date`, `time`, `datetime`, `yearmon`, `daymon`, `font-awesome`, `wysiwyg`, `password`, `code`, `accordion`, `memo`, `1_to_m`, `file`, `docpack`, `in_ext_url`, `time_table` → `field-<type>`.
- `save_button` — рисует кнопку сохранения.
- `is_only_field`: `checkbox|switch` или read_only `date|datetime` — без обёртки description.

## URL / CGI

- Форма: `/edit_form/<config>[/<id>]` (regex также принимает `edit-form`).
- Параметры в query: `get_cgi_params()` кладёт все в `cgi_params`.

## Риски при миграции

- `eval` серверного JS требует runtime-компилятора Vue и глобалов (`Vue`, `bus`, `BackendBase`) — сохранять (см. `security.md`, `migration-vue3.md`).
- `v-layout`/`v-flex` в `EditForm.vue`/`FormBlock.vue` удалены в Vuetify 3.
