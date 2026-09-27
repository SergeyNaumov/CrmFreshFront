# CRMFreshFront — CRM панель

Frontend CRM. Ветка `main` — Vue 2 / Vuetify 2 / Vue CLI; ветка `vue3` — Vue 3 / Vuetify 3 / Vite (миграция выполнена, идёт рантайм-проверка, см. `docs/migration-vue3.md`).

## Стек (ветка vue3)

| | Сейчас | Было (main) |
|---|---|---|
| Framework | Vue 3.4 | Vue 2.6 |
| UI | Vuetify 3.5 | Vuetify 2.5 |
| Build | Vite 4 | Vue CLI 3 |
| HTTP | Axios 1 | Axios 0.19 |
| Rich text | TinyMCE 5.9 (raw) | TinyMCE 5.9 |
| Charts | вендоренный `src/js/chart.js` | без изменений |
| DnD | vuedraggable 4 | vuedraggable 2 |

## Быстрый старт

```shell
npm install
npm run dev                         # vite, port 8081, host 0.0.0.0
npm run serve                       # то же (совместимость)
npm run build                       # mode default, base /
npm run build_trade                 # mode trade,   base /CrmFresh/
npm run build_svcms                 # mode svcms,   base /manager/
```

Рантайм-настройки (backend, WS, tinymce) — в `public/configure.js`, не в сборке.
Тенант задаётся mode в `vite.config.js` (`bases`).


## Правила для агентов (экономия контекста)

- Не читать весь `src/` и `node_modules`/`dist`/`public/dist`. Открывать только файл(ы) из нужного раздела ниже.
- Задача → документ: форма → `docs/form-engine.md`; поле → `docs/fields.md`; экран → `docs/components.md`; сборка → `docs/build-and-tenant.md`; иконки → `docs/icon-system.md`; Vue3 → `docs/migration-vue3.md`; проверка → `docs/verification.md`.
- Перед правкой большого файла — точечный `rg` по нужному символу, не полное чтение.
- Не менять backend-контракт и все `eval()`-точки без явного запроса (см. `docs/security.md`).
- Не трогать версии иконок `@mdi/font@4.9.95` и `public/dist/fontawesome`.
- Комментарии в код не добавлять.

## Карта репозитория

```
vite.config.js                 # base по mode, alias @ и vue (runtime compiler), output js/css/fonts
index.html                     # корневой (Vite); configure.js + иконки + BaseUrl/BackendBase
src/
  main.js                      # createApp: bus(mitt), Vuetify, $http, icon set, router, глобальные компоненты
  router/index.js              # vue-router: /vue/* (shell) и /* (full-screen), alias'ы
  App.vue                      # layout по route.meta.blank: shell (меню) или full-screen
  js/app.js                    # legacy get_headapp (не используется, для совместимости)
  dynamic_component_loader.js  # ленивая регистрация компонентов (поля)
  LeftMenu.vue, MainPage.vue
  components/                  # EditForm, AdminTable, AdminTree, StatTool, Messenger, fields, FallbackRoute, ...
  styles/                      # main.scss, variables.scss, colors/
public/
  configure.js                 # config.BackendBase / MessengerWS / TinyMCE_BaseUrl
  dist/                        # tinymce, fontawesome, qrcode, material icons css
build/
  config/{default,trade,svcms}.js   # legacy Vue CLI (не используются на vue3)
  <tenant>                     # bash deploy-скрипты (копируют dist/{js,css,index.html,fonts})
docs/                          # подробное описание разделов
```

## Документация

| Раздел | Файл |
|---|---|
| Архитектура: вход, глобалы, bus, App.vue, URL-роутинг | [docs/architecture.md](docs/architecture.md) |
| Form Engine: JSON-контракт, EditForm/FormBlock, `js/edit_form.js` | [docs/form-engine.md](docs/form-engine.md) |
| Зависимости полей (движок, циклы, ajax/TTL) | [docs/dependencies.md](docs/dependencies.md) |
| Поля и фильтры (20+ типов) | [docs/fields.md](docs/fields.md) |
| Компоненты и их API | [docs/components.md](docs/components.md) |
| Messenger (WebSocket-чат) | [docs/messenger.md](docs/messenger.md) |
| Сборка, тенанты, деплой, Docker | [docs/build-and-tenant.md](docs/build-and-tenant.md) |
| Зависимости и целевые версии | [docs/dependencies.md](docs/dependencies.md) |
| Система иконок (MDI + FontAwesome + Material) | [docs/icon-system.md](docs/icon-system.md) |
| Безопасность: `eval`, `v-html` | [docs/security.md](docs/security.md) |
| Миграция на Vue 3 / Vite / Vuetify 3 | [docs/migration-vue3.md](docs/migration-vue3.md) |
| Проверка и smoke-чеклист | [docs/verification.md](docs/verification.md) |

## Инварианты (нельзя ломать)

- Глобалы `BackendBase`, `BaseUrl`, `config`, `window.EditForm`, `window.app` (используются серверным `eval` и кодом).
- Event bus API `bus.$on/$emit/$off`.
- Структура вывода сборки `dist/{js,css,index.html,fonts}`.
- Смешанный набор иконок (MDI, FontAwesome, Material Icons).
- Контракт JSON формы и полей (`docs/form-engine.md`).

## Формат ответов backend (кратко)

```json
{ "success": true,  "data": { }, "errors": [] }
{ "success": false, "errors": ["..."] }
```

## Примечания

- Миграция на Vue 3 / Vite / Vuetify 3 идёт в ветке `vue3`; план — `plan.md`, детали — `docs/migration-vue3.md`.
- `src/plugins/vuetify.js` удалён (был мёртвым). `babel.config.js` удалён.
- Кастомный набор иконок определён в `src/main.js` (`LegacyIcon`), сохраняет MDI, FontAwesome и голые имена.
- Event bus — `mitt`-shim в `src/main.js` с API `bus.$on/$off/$emit`.
- Изменения смотрите по `git diff main..vue3`.
