# CRMFreshFront — CRM panel

Branch `main` = Vue 2 / Vuetify 2 / Vue CLI; `vue3` = Vue 3 / Vuetify 3 / Vite (migration done, runtime check pending).

## Quick start

```shell
npm install
npm run dev          # Vite, 0.0.0.0:8081
npm run build        # mode default, base /
npm run build_trade  # mode trade,   base /CrmFresh/
npm run build_svcms  # mode svcms,   base /manager/
```

Tenant = `mode` in `vite.config.js`; runtime config = `public/configure.js`.

## Agent rules

- Never read all of `src/`, `node_modules`, `dist`. Open only the file(s) named by the topic below.
- `rg` a symbol before editing a large file.
- Page constructor: ask `.opencode/skills/pc-schema/scripts/pc.mjs`, never read `page_constructor/data/schema.js` (11k lines) — [page-constructor.md](agent-doc/page-constructor.md).
- Skills `pc-schema`, `pc-block`, `pc-preview`, `pc-editor`, `pc-theme` in `.opencode/skills/`.
- Do not change the backend contract or `eval()` sites without an explicit request — [security.md](agent-doc/security.md).
- Do not change icon versions (`@mdi/font@4.9.95`, `public/dist/fontawesome`).
- No comments in code.
- Plan: `plan.md`. Branch diff: `git diff main..vue3`.

## Docs

Globals, bus, startup — [architecture.md](agent-doc/architecture.md) · routes, layouts — [router.md](agent-doc/router.md) · backend JSON, gaps — [backend-contract.md](agent-doc/backend-contract.md) · form engine — [form-engine.md](agent-doc/form-engine.md) · field dependencies — [field-dependencies.md](agent-doc/field-dependencies.md) · fields, filters — [fields.md](agent-doc/fields.md) · components, endpoints — [components.md](agent-doc/components.md) · page constructor, blocks, theme — [page-constructor.md](agent-doc/page-constructor.md) · messenger — [messenger.md](agent-doc/messenger.md) · build, tenants, Docker — [build-and-tenant.md](agent-doc/build-and-tenant.md) · packages — [dependencies.md](agent-doc/dependencies.md) · icons — [icon-system.md](agent-doc/icon-system.md) · schemes, tokens — [design-system.md](agent-doc/design-system.md) · `eval`, `v-html` — [security.md](agent-doc/security.md) · Vue 3 migration — [migration-vue3.md](agent-doc/migration-vue3.md) · verification — [verification.md](agent-doc/verification.md) · debugging stand — [debugging.md](agent-doc/debugging.md).

## Invariants

- Globals `BackendBase`, `BaseUrl`, `config`, `window.app`, `window.EditForm`, `window.bus` — used by server `eval`.
- Bus API `bus.$on/$emit/$off`.
- Build output `dist/{js,css,index.html,fonts}`.
- Mixed icon sets: MDI + FontAwesome + Material Icons.
- Form/field JSON contract.

## Backend response format

```json
{ "success": true,  "data": { }, "errors": [] }
{ "success": false, "errors": ["..."] }
```
