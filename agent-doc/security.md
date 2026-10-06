# Security

> Load when: touching `eval`, `v-html`, or server-provided scripts.
> Canonical for: the full list of `eval` sites, dynamic `<script>` injection, `v-html` sources.

The backend must not be changed, so `eval` is kept and tracked as a risk. Globals available to server JS: [architecture.md](architecture.md). Migration constraints: [migration-vue3.md](migration-vue3.md).

## Server JavaScript `eval`

| File:line | Source |
|---|---|
| `src/components/js/edit_form.js:80,279` | `eval(obj.jscode)` — `jscode` from an ajax response |
| `src/components/js/edit_form.js:89` | `eval('('+f.frontend.fields_dependence+')')` — field dependency |
| `src/components/EditForm/form_controller.js:128` | `eval(data.javascript)` — from the `/edit-form/...` response |
| `src/components/EditForm/form_controller.js:215` | `eval(block.on_show)` — from block data |
| `src/components/EditForm/FormBody.vue:81` | `eval(block.on_show)` |
| `src/components/StatTool/StatTool.vue:133` | `eval(d.javascript)` |
| `src/components/AdminTable.vue:354,537` | `eval(D.javascript)` |
| `src/components/AdminTree.vue:115` | `eval(D.javascript)` |
| `src/components/fields/component.vue:107` | ``eval(`obj=${r.data}`)`` — JS-литерал из ответа |
| `src/components/svcmsAdmin/page_constructor/data/template/js/good_list.js:62,64` | `eval(gkey)` — шаблонный JS (бандл конструктора) |

`select.vue` и `field_functions.js` переведены на `new RegExp(rule)` (без `eval`) — см. пояснение ниже.

Шум Rollup по `EVAL` и парный `SOURCEMAP_ERROR` («Can't resolve original location») глушится в `vite.config.js` (`build.rollupOptions.onwarn`) — eval при этом не убирается.

Consequence for migration: the Vue runtime compiler (`vue/dist/vue.esm-bundler.js`) and the globals (`Vue`, `bus`, `BackendBase`, `BaseUrl`, `window.EditForm`) must stay available.

`field_functions.js:57,70`: the backend sends `regexp_rules` as strings without slashes (`"^.+$"`), so `eval("^.+$.test(...)")` threw `Unexpected token '^'` (`feedback_form`, `send_request_form`); switched to `new RegExp(rule)` (plus `/.../flags`) with try/catch. The bug also exists on branch `main`.

## Dynamic scripts

- `src/components/EditForm.vue:289-294` — `data.javascript_static[]` creates `<script src=...>` in `<head>`.
- `src/components/fields/text_subtypes/qr_call.vue:86-88` — loads an external script.

## `v-html` (64 occurrences)

Data comes from the server; potential XSS. Sources: `form.title`, `tab.description`, `field.description/before_html/after_html`, `log`, `errors`, `message.message`, `header.h`, `item.body`, `d.body`, `plugin_out`, `dialog_html`, table cells.

Examples: `EditForm.vue:28,29,38,55,87`, `FormBlock.vue:8,34,52`, `AdminTable.vue:22,39,40,127`, `Table.vue:9,45,70`, `Messenger/ChatWindow.vue:17`, `Notifications.vue:32`, `Documentation/item_content.vue:37`.

Hardening (out of scope): DOMPurify or server-side sanitization. Do not change the behaviour during migration — it would break form markup.

## Other

- `navigator.userAgent` (`main.js:55`) is used only locally for `$isMobile` and never sent to the server — not a vulnerability.
- `BackendBase`/`MessengerWS` include `http://`/`ws://` in `public/configure.js` — use relative URLs/`wss` in production.
- `runtimeCompiler: true` is a requirement driven by `eval` ([build-and-tenant.md](build-and-tenant.md)).