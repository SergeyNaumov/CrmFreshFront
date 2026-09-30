# Field dependencies (frontend)

> Load when: cross-field dependencies, `frontend` handling, ajax-driven field updates.
> Canonical for: `frontend` semantics, the dependency engine and its constants, the test config.

Implementation `src/components/js/edit_form.js`. JSON shapes: [form-engine.md](form-engine.md). Test config/MySQL: [debugging.md](debugging.md).

## Declaration on the backend

```python
{
  'description':'...', 'name':'action', 'type':'checkbox',
  'frontend': {'fields_dependence': 'v=>{ ... return [name, obj, ...] }'}
}
```

- `fields_dependence` — **string holding a JS function** `v => ...`, `v` = `values` dict (name → value). Executed client-side via `eval`. Returns a **flat array** `[name, obj, name2, obj2, ...]` and/or **mutates fields directly** (e.g. `window.EditForm.get_field_by_name(...)`).
- `ajax` — `{ name, timeout }`: `POST {BackendBase}/ajax/{config}/{name}` with `{values, id}`; response `{success, errors, result}`, `result` being the same flat array.
- `obj` may contain `value`, `instead_of_empty`, `values`, `hide`, `error`, `warning`, `after_html`, `before_html`, `description`, `fields`, `jscode`.

Example (`configs/svcmsmanager/test2`): `dep1` via `fields_dependence` drives `dep2/dep3/dep4`; `title` via ajax `gen_slug` fills `slug`.

## Engine (in `edit_form.js`)

Old flow (kept for reference): user changes field → bus `change_field` → `change_field()` → `frontend_process()` → `frontend_result_process` → `on_dependence()`, which **unconditionally** emitted `change_field` again. Each countermeasure below exists because of a defect of that loop (no change detection, no visited set, `not_frontend_process` muting only the source field, ajax without dedup, `eval` per call).

- **Change detection** `state_hash(field)` = value + hide + error + length of `values` + description + warning + before/after_html; a field counts as changed only if the hash differs.
- **Queue + diff**: after any change all field states are diffed against the last (`eng_diff`); only changed fields emit `field-update:<name>` (UI) and are queued.
- **Local dependencies**: compiled once (`compile_dependence`, cache `field._dep_fn`), applied via `apply_result_array`; changes bubble up through the diff.
- **Cycles** converge: re-applying the same value does not change the hash and does not re-queue. Fuse `ENGINE_MAX_STEPS` (300) with `console.warn`.
- **Ajax**: per-field debounce (`timeout`), **dedup of identical in-flight requests** (`inflight_keys` by payload hash), **1s TTL cache** (`AJAX_CACHE`) — identical requests are not resent within a second (backend data may change, hence a TTL, not a permanent cache).
- **UI sync**: `field-update:<name>` is the public event; field components sync `value`/options on it.
- `ENGINE` context lives while there is a queue, timers, or requests, then resets and drops the stale cache.

Entry point `eng_notify(self, name)`, called by `change_field` for user edits; `frontend_result_process` (button results) applies pairs and starts the same engine.

Handled JS-dependency errors: empty `value` on `select` normalized (`calc_values`), select `values` coerced to strings; `obj.values` arriving as a JSON string parsed with try/catch; compile/run errors of `fields_dependence` only `console.warn`, engine continues.

## Verification

Test config `~/projects/CrmFreshBackend-python-async/configs/svcmsmanager/test2` (table `test2` in DB `svcms`), reachable as `/edit_form/test2`. Verified with puppeteer:

- `dep1=1` → `dep2/dep3/dep4` hidden; `dep1=4` → shown with new values.
- cycle `x→y`, `y→x`: `x=abc` → `y=abc`, propagation stops (0 warnings, no step-limit message).
- `title="Привет Мир"` → ajax `gen_slug` → `slug="privet_mir"`; the `title↔slug` cycle converges, `POST /ajax/*` count bounded (3), no repeats within the TTL.

Tooling: `window.EditForm.get_field_by_name(name)` + `window.bus.$emit('change_field', field)`.