# Security

> Load when: touching `eval`, `v-html`, or server-provided scripts.
> Canonical for: the full list of `eval` sites, dynamic `<script>` injection, `v-html` sources.

The backend must not be changed, so `eval` is kept and tracked as a risk. Globals available to server JS: [architecture.md](architecture.md). Migration constraints: [migration-vue3.md](migration-vue3.md).

## Server JavaScript `eval`

| File:line | Source |
|---|---|
| `src/components/js/edit_form.js:127` | `eval(obj.jscode)` — `jscode` from an ajax response |
| `src/components/js/edit_form.js:166` | `eval('dep='+front.fields_dependence)` — field dependency |
| `src/components/EditForm.vue:285` | `eval(data.javascript)` — from the `/edit-form/...` response |
| `src/components/EditForm.vue:399` | `eval(block.on_show)` — from block data |
| `src/components/StatTool/StatTool.vue:133` | `eval(d.javascript)` |
| `src/components/AdminTable.vue:343` | `eval(D.javascript)` |
| `src/components/AdminTable.vue:524` | `eval(d.javascript)` |
| `src/components/AdminTree.vue:115` | `eval(D.javascript)` |
| `src/components/fields/select.vue:286` | `eval(rule+'.test(this.value)')` — regex rule |
| `src/components/fields/field_functions.js:57` | `eval('self.value.replace('+rule+",'"+rep+"')")` |
| `src/components/fields/field_functions.js:70` | ``eval(`${rule}.test(self.value)`)`` |
| `src/components/fields/component.vue:107` | ``eval(`obj=${r.data}`)`` |

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