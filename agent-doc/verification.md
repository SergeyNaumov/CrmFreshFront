# Verification

> Load when: validating a change, or re-running the migration smoke pass.
> Canonical for: baseline steps, smoke checklist, grep guards, build/doc-link checks.

No automated tests exist; verification is manual plus grep guards.

## Baseline

```shell
npm ci
npm run build            # or build_trade, build_svcms — must build before any change
```

Keep `dist/` for comparison (structure `js/`, `css/`, `fonts/`, `index.html`).

## Smoke checklist (dev server, `npm run serve` / `npm run dev`)

1. Auth: `/login`, `/register`, `/remember`.
2. Shell: left menu, item switching, iframe (`/src:...`), footer, logout.
3. Main page: `/` → `mainpage` (notifications, birthdays, link-telegram, manager-load).
4. Form: `/edit_form/<config>` and `/edit_form/<config>/<id>` — blocks/tabs, save, field dependencies, frontend buttons.
5. Fields one by one from [fields.md](fields.md) (select, multiconnect, date/datetime/time, file+crop, wysiwyg, memo, 1_to_m, docpack, chart, code).
6. AdminTable: filters, sorting, results, bulk actions.
7. AdminTree: tree, drag&drop, form in a branch.
8. StatTool, ParserExcel, Schedule, VideoList, Documentation, TransfereCards, Const.
9. Messenger: chat list, chat window, send, WS signal, reconnect.
10. Icons: bare (`edit`, `delete`), `mdi-*`, `fa fa-*` ([icon-system.md](icon-system.md)).
11. Schemes `?schema=0..3` ([design-system.md](design-system.md)).
12. Browser console: no Vue/Vuetify/Vite errors.

## Grep guards

```bash
# Vue 2 API
rg -n '\$on\(|\$off\(|\$once\(|new Vue\(|Vue\.prototype|Vue\.component|Vue\.extend' src
rg -n 'beforeDestroy|destroyed\s*\(' src
rg -n '\.sync' src --glob '*.vue'

# Vuetify 2 components/classes
rg -n 'v-layout|v-flex|v-tabs-items|v-tab-item|v-simple-table|v-subheader|v-list-item-content|v-expansion-panel-(header|content)' src --glob '*.vue'
rg -n 'headline|white--text|--text\b' src --glob '*.vue'

# Vite-incompatible
rg -n "import\(['\"\`][^'\"\`]*\+|import\(`" src   # dynamic template strings
rg -n 'process\.env' src
```

## Build and doc checks

```bash
npm run build && ls -R dist | head -50          # expected: dist/{js,css,fonts,index.html}
rg -o '\]\((agent-doc/[^)]+)\)' AGENTS.md       # every path must exist
```

Backend stand, MySQL, curl checks: [debugging.md](debugging.md). Open `http://localhost:8081/<route>`.