# Debugging (backend, DB, stand)

> Load when: reproducing a bug against the backend stand, editing form configs, or querying MySQL.
> Canonical for: stand addresses, editable backend config paths, DB access commands.

## Environment

| Item | Value |
|---|---|
| Frontend dev | `npm run dev` (Vite, `0.0.0.0:8081`); base/tenant = `mode` in `vite.config.js` ([build-and-tenant.md](build-and-tenant.md)) |
| Backend stand | `~/projects/CrmFreshBackend-python-async` on `http://dev-crm.test/backend` (FastAPI, uvicorn), reload on — config edits apply without a restart |
| Frontend runtime config | `public/configure.js` ([architecture.md](architecture.md)) |

Backend `/config` returns `BaseUrl` and `controllers.left_menu`. Modes: `default|trade|svcms`.

## Backend configs are editable

Tenant `svcms` configs live in `configs/svcmsmanager/<config>/__init__.py`. A form is a Python dict `form = {...}` with `fields`, `cols`, `tabs`, `ajax`. `frontend` syntax and the `ajax` controller signature: [field-dependencies.md](field-dependencies.md). Client contract: [form-engine.md](form-engine.md).

Dependency test config `configs/svcmsmanager/test2` — local deps, cycle `x↔y`, ajax cycle `title↔slug`; reachable as `/edit_form/test2`.

## MySQL

```shell
mysql -u svcms svcms          # interactive
mysql -u svcms svcms -e "show tables;"
mysql -u svcms svcms -e "select * from test2 limit 5;"
```

Form working tables come from the config's `work_table` (e.g. `test2`, `struct_5830_good`).

## Quick checks

```shell
curl -sS -X POST http://dev-crm.test/backend/edit-form/<config> \
  -H 'Content-Type: application/json' -d '{"cgi_params":{}}'
```

- UI smoke — puppeteer/Chrome: open `http://localhost:8081/<route>`, collect console/pageerror. Checklist: [verification.md](verification.md).
- Drive a field from the console: `window.EditForm.get_field_by_name(name)` + `window.bus.$emit('change_field', field)`.
