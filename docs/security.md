# Безопасность

## eval серверного JavaScript

Сервер присылает JS, исполняемый на клиенте. Backend менять нельзя (решение по миграции), поэтому `eval` сохраняется, но фиксируется как риск.

| Файл:строка | Источник |
|---|---|
| `src/components/js/edit_form.js:127` | `eval(obj.jscode)` — `jscode` из AJAX-ответа |
| `src/components/js/edit_form.js:166` | `eval('dep='+front.fields_dependence)` — зависимость поля |
| `src/components/EditForm.vue:285` | `eval(data.javascript)` — из ответа `/edit-form/...` |
| `src/components/EditForm.vue:399` | `eval(block.on_show)` — из данных блока |
| `src/components/StatTool/StatTool.vue:133` | `eval(d.javascript)` |
| `src/components/AdminTable.vue:343` | `eval(D.javascript)` |
| `src/components/AdminTable.vue:524` | `eval(d.javascript)` |
| `src/components/AdminTree.vue:115` | `eval(D.javascript)` |
| `src/components/fields/select.vue:286` | `eval(rule+'.test(this.value)')` — regex-правило |
| `src/components/fields/field_functions.js:57` | `eval('self.value.replace('+rule+",'"+rep+"')")` |
| `src/components/fields/field_functions.js:70` | `eval(`${rule}.test(self.value)`)` |
| `src/components/fields/component.vue:107` | `eval(`obj=${r.data}`)` |

Следствия для миграции: нужен runtime-компилятор Vue (`vue/dist/vue.esm-bundler.js`) и доступные глобалы (`Vue`, `bus`, `BackendBase`, `BaseUrl`, `window.EditForm`).

## Динамические скрипты

- `src/components/EditForm.vue:289-294` — `data.javascript_static[]` → создание `<script src=...>` в `<head>`.
- `src/components/fields/text_subtypes/qr_call.vue:86-88` — подключение внешнего скрипта.

## v-html (64 вхождения)

Данные приходят с сервера; это потенциальный XSS. Источники: `form.title`, `tab.description`, `field.description/before_html/after_html`, `log`, `errors`, `message.message`, `header.h`, `item.body`, `d.body`, `plugin_out`, `dialog_html`, ячейки таблиц.

Примеры: `EditForm.vue:28,29,38,55,87`, `FormBlock.vue:8,34,52`, `AdminTable.vue:22,39,40,127`, `Table.vue:9,45,70`, `Messenger/ChatWindow.vue:17`, `Notifications.vue:32`, `Documentation/item_content.vue:37`.

Хардненинг (не в этой задаче): DOMPurify или серверная санитизация. При миграции поведение не менять, чтобы не сломать вёрстку форм.

## Прочее

- `navigator.userAgent` (`main.js:55`) используется только локально для `$isMobile`, на сервер не передаётся — не уязвимость.
- `BackendBase`/`MessengerWS` включают `http://`/`ws://` в `public/configure.js` — в продакшене задавать относительные/`wss`.
- `runtimeCompiler: true` — необходимость, связанная с `eval` (см. `migration-vue3.md`).
