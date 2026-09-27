# CRMFreshFront — CRM панель

Frontend CRM. Ветка `main` — Vue 2 / Vuetify 2 / Vue CLI; ветка `vue3` — Vue 3 / Vuetify 3 / Vite (миграция выполнена, идёт рантайм-проверка).

## Быстрый старт

```shell
npm install
npm run dev                 # Vite, 0.0.0.0:8081
npm run build               # mode default, base /
npm run build_trade         # mode trade,   base /CrmFresh/
npm run build_svcms         # mode svcms,   base /manager/
```

Runtime-конфиг фронта — `public/configure.js` (`config.BackendBase`, `MessengerWS`, `TinyMCE_BaseUrl`, `config.schema`).
Тенант — mode в `vite.config.js`.

## Правила для агентов (экономия контекста)

- Не читать весь `src/` и `node_modules`/`dist`. Открывать только файл(ы) из нужного раздела ниже.
- Задача → документ: экран → `agent-doc/components.md`; форма → `agent-doc/form-engine.md`; зависимости полей → `agent-doc/field-dependencies.md`; поле → `agent-doc/fields.md`; роутинг → `agent-doc/router.md`; сборка → `agent-doc/build-and-tenant.md`; иконки → `agent-doc/icon-system.md`; схемы/дизайн → `agent-doc/design-system.md`; Vue3 → `agent-doc/migration-vue3.md`; проверка → `agent-doc/verification.md`.
- Перед правкой большого файла — точечный `rg` по символу.
- Не менять backend-контракт и `eval()`-точки без явного запроса (`agent-doc/security.md`).
- Не трогать версии иконок (`@mdi/font@4.9.95`, `public/dist/fontawesome`).
- Комментарии в код не добавлять.

## Отладка

- Backend-стенд: `~/projects/CrmFreshBackend-python-async`, `http://dev-crm.test/backend` (reload включён).
- **Можно править конфиги бэка**: `configs/svcmsmanager/<config>/__init__.py` (форма, `fields`, `ajax`, зависимости).
- **Можно править БД**: `mysql -u svcms svcms` (таблицы форм = `work_table`; тестовая `test2`).
- UI smoke — Chrome/puppeteer: `http://localhost:8081/<route>`, собирать console/pageerror.
- Детали — `agent-doc/debugging.md`.

## Документация (`agent-doc/`)

| Раздел | Файл |
|---|---|
| Архитектура: вход, глобалы, bus, App.vue | [architecture.md](agent-doc/architecture.md) |
| Роутинг (Vue Router, shell/full-screen, /src:) | [router.md](agent-doc/router.md) |
| Form Engine: JSON-контракт, EditForm/FormBlock | [form-engine.md](agent-doc/form-engine.md) |
| Зависимости полей (движок, циклы, ajax/TTL) | [field-dependencies.md](agent-doc/field-dependencies.md) |
| Поля и фильтры (20+ типов) | [fields.md](agent-doc/fields.md) |
| Компоненты и их API | [components.md](agent-doc/components.md) |
| Messenger (WebSocket-чат) | [messenger.md](agent-doc/messenger.md) |
| Сборка, тенанты, деплой, Docker | [build-and-tenant.md](agent-doc/build-and-tenant.md) |
| npm-зависимости и целевые версии | [dependencies.md](agent-doc/dependencies.md) |
| Система иконок (MDI + FontAwesome + Material) | [icon-system.md](agent-doc/icon-system.md) |
| Дизайн-система: схемы, токены | [design-system.md](agent-doc/design-system.md) |
| Безопасность: `eval`, `v-html` | [security.md](agent-doc/security.md) |
| Миграция на Vue 3 / Vite / Vuetify 3 | [migration-vue3.md](agent-doc/migration-vue3.md) |
| Проверка и smoke-чеклист | [verification.md](agent-doc/verification.md) |
| Отладка: бэкенд, БД, стенд | [debugging.md](agent-doc/debugging.md) |

## Инварианты

- Глобалы `BackendBase`, `BaseUrl`, `config`, `window.app`, `window.EditForm`, `window.bus` (используются серверным `eval`).
- Event bus API `bus.$on/$emit/$off`.
- Структура вывода сборки `dist/{js,css,index.html,fonts}`.
- Смешанный набор иконок (MDI, FontAwesome, Material Icons).
- Контракт JSON формы и полей.

## Формат ответов backend

```json
{ "success": true,  "data": { }, "errors": [] }
{ "success": false, "errors": ["..."] }
```

## Примечания

- План миграции/статус — `plan.md`, детали — `agent-doc/migration-vue3.md`.
- Изменения смотреть по `git diff main..vue3`.
