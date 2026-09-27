# Сборка и тенанты

> На ветке `vue3` сборка идёт через **Vite**. Vue CLI (`build/config/*`) — legacy для ветки `main`.

## npm-скрипты (ветка `vue3`)

| Скрипт | Действие | base |
|---|---|---|
| `dev` | `vite` (port 8081, host 0.0.0.0) | `/` |
| `serve` | `vite --host 0.0.0.0 --port 8081` | `/` |
| `build` | `vite build --mode default` | `/` |
| `build_trade` | `vite build --mode trade` | `/CrmFresh/` |
| `build_svcms` | `vite build --mode svcms` | `/manager/` |
| `preview` | `vite preview` | — |

`base` по mode задаётся в `vite.config.js` (`bases`). Раньше: `VUE_CLI_SERVICE_CONFIG_PATH=... vue-cli-service`.

## Legacy: `build/config/*.js` (ветка main)

3 файла: `default.js` (`/`), `trade.js` (`/CrmFresh`), `svcms.js` (`/manager`), все `runtimeCompiler: true`. `strateg.js` отсутствует.

## `build/<tenant>` — deploy-скрипты

Bash-скрипты, запускающие npm build и копирующие результат:

| Скрипт | npm-команда |
|---|---|
| `adminbot.assist-ant.su`, `dostavka`, `fas`, `ls_rental`, `svcms.admin` | `npm run build` |
| `trade` | `npm run build_trade` |
| `assyst-ant.manager`, `beyeezy.manager`, `crimea.manager`, `svcms.manager`, `translab.manager` | `npm run build_svcms` |

Шаблон скрипта:
```bash
npm run build[_x]
basedir="/mnt/.../target"
rm -rf "$basedir/css" "$basedir/js" "$basedir/index.html" "$basedir/fonts"
cp -R dist/{js,css,index.html,fonts} "$basedir/"
```

Вывод сборки обязан раскладываться в `dist/js`, `dist/css`, `dist/fonts` + `dist/index.html`. **Это критично при переходе на Vite** — либо воспроизвести структуру (`build.rollupOptions.output`), либо обновить все deploy-скрипты (см. `migration-vue3.md`).

`copy_to_fresh` — аналогичный внешний скрипт копирования в `/mnt/stg_w02/var/www/fresh/`.
`copy_to/<tenant>/` — пустые каталоги-заглушки, на сборку не влияют.

## `build/.env*`

- `.env`: `BACKEND_BASE='/backend'`
- `.env.development`: `BACKEND_BASE='http://dev-crm.test/backend'`
- `.env.production`: `BACKEND_BASE='/backend'`

Vue CLI по умолчанию грузит `.env` из корня проекта, не из `build/`. Эти файлы, вероятно, не используются; реальный backend-адрес задаётся в `public/configure.js`.

## Runtime-конфиг

`public/configure.js` (копируется как есть) + inline-скрипт в `public/index.html` задают `config`, `BaseUrl`, `BackendBase`. При смене сервера правится `public/configure.js`, не сборка.

## Docker

- `Dockerfile`: `node:16`, `npm install`, `CMD npm run serve`.
- `docker-compose.yml`: порт `127.0.0.1:8081:8081`, volume `.` + анонимный `/app/node_modules`, `NODE_ENV=development`.

## Git/артефакты

- `dist/` частично в репозитории (240 файлов), но `.gitignore` исключает `dist/js`, `dist/css`, `dist/files`.
- `public/dist/` содержит tinymce, fontawesome, qrcode, googleapis css — публичные статики.

## Vite (факт, ветка vue3)

- `base` по mode: `default /`, `trade /CrmFresh/`, `svcms /manager/` (`vite.config.js`, `bases`).
- `public/` копируется как есть (`configure.js`, `dist/`, favicon).
- `index.html` в корне; пути `/...` автоматически префиксуются base (проверено на всех 3 mode).
- `BaseUrl = import.meta.env.BASE_URL` выставляется в `src/main.js`.
- Output через `build.rollupOptions.output`: `js/[name].js`, `css/*`, `fonts/*` → сохранён контракт deploy-скриптов (`dist/{js,css,index.html,fonts}`), менять `build/<tenant>` и `copy_to_fresh` не нужно.
