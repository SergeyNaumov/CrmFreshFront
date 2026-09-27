# Отладка (бэкенд, БД, стенд)

## Окружение

- Frontend dev: `npm run dev` (Vite, `0.0.0.0:8081`). База/тенант — mode в `vite.config.js`.
- Backend (стенд): `~/projects/CrmFreshBackend-python-async`, запущен на `http://dev-crm.test/backend` (FastAPI, uvicorn), reload включён — правки конфигов подхватываются без перезапуска.
- Runtime-конфиг фронта: `public/configure.js` (`config.BackendBase`, `MessengerWS`, `TinyMCE_BaseUrl`, `config.schema`).

## Backend: конфиги форм можно править

Конфиги тенанта `svcms` лежат в `configs/svcmsmanager/<config>/__init__.py` (в `~/projects/CrmFreshBackend-python-async`). Форма — Python-словарь `form = {...}` с `fields`, `cols`, `tabs`, `ajax`.

Зависимости полей описываются на бэке:

```python
{
  'description':'...', 'name':'action', 'type':'checkbox',
  'frontend': {'fields_dependence': 'v=>{ ... return [name, obj, ...] }'},  # JS-строка, считается на клиенте
  'frontend': {'ajax': {'name':'gen_slug','timeout':200}},                   # POST /ajax/<config>/<name>
}
```
`ajax`-контроллер: `form['ajax']={'gen_slug': async def(form,values): return [name,obj,...]}`. Подробности контракта — `form-engine.md`, `field-dependencies.md`.

Тестовый конфиг зависимостей: `configs/svcmsmanager/test2` (локальные dep, цикл `x↔y`, ajax-цикл `title↔slug`), доступен как `/edit_form/test2`.

## База данных MySQL

```shell
mysql -u svcms svcms          # интерактивно
mysql -u svcms svcms -e "show tables;"
mysql -u svcms svcms -e "select * from test2 limit 5;"
```

Рабочие таблицы форм — `work_table` из конфига (напр. `test2`, `struct_5830_good`). Тестовая таблица зависимостей `test2` создана для проверки движка.

## Быстрая проверка

- Проверить ответ бэка: `curl -sS -X POST http://dev-crm.test/backend/edit-form/<config> -H 'Content-Type: application/json' -d '{"cgi_params":{}}'`.
- Smoke UI — puppeteer (Chrome): открывать `http://localhost:8081/<route>`, собирать console/pageerror. Чеклист — `verification.md`.
- Тенант: backend `/config` отдаёт `BaseUrl`/`controllers.left_menu`; фронт собирается по mode (`default|trade|svcms`).
