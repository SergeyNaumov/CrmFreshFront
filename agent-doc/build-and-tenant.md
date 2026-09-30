# Build and tenants

> Load when: building, serving, or deploying a tenant variant.
> Canonical for: npm scripts, `base` per mode, deploy scripts, `dist/` layout, `.env`, Docker.

On branch `vue3` the build runs through **Vite**; Vue CLI (`build/config/*`) is legacy for branch `main`.

## npm scripts (branch `vue3`)

| Script | Command | base |
|---|---|---|
| `dev` | `vite` (port 8081, host 0.0.0.0) | `/` |
| `serve` | `vite --host 0.0.0.0 --port 8081` | `/` |
| `build` | `vite build --mode default` | `/` |
| `build_trade` | `vite build --mode trade` | `/CrmFresh/` |
| `build_svcms` | `vite build --mode svcms` | `/manager/` |
| `preview` | `vite preview` | — |

`base` per mode is set in `vite.config.js` (`bases`); previously `VUE_CLI_SERVICE_CONFIG_PATH=... vue-cli-service`. Also: `public/` copied as is (`configure.js`, `dist/`, favicon); `index.html` in the repo root, `/...` auto-prefixed with `base` (verified for all 3 modes); `BaseUrl = import.meta.env.BASE_URL` set in `src/main.js`; output via `build.rollupOptions.output` (`js/[name].js`, `css/*`, `fonts/*`); alias `@` → `src`, `vue` → `vue/dist/vue.esm-bundler.js` (runtime compiler for server `eval`).

## Legacy `build/config/*.js` (branch `main`)

3 files: `default.js` (`/`), `trade.js` (`/CrmFresh`), `svcms.js` (`/manager`), all with `runtimeCompiler: true`. `strateg.js` does not exist.

## `build/<tenant>` — deploy scripts

| Script | npm command |
|---|---|
| `adminbot.assist-ant.su`, `dostavka`, `fas`, `ls_rental`, `svcms.admin` | `npm run build` |
| `trade` | `npm run build_trade` |
| `assyst-ant.manager`, `beyeezy.manager`, `crimea.manager`, `svcms.manager`, `translab.manager` | `npm run build_svcms` |

```bash
npm run build[_x]
basedir="/mnt/.../target"
rm -rf "$basedir/css" "$basedir/js" "$basedir/index.html" "$basedir/fonts"
cp -R dist/{js,css,index.html,fonts} "$basedir/"
```

Output **must** land in `dist/js`, `dist/css`, `dist/fonts` + `dist/index.html` — critical for Vite: either reproduce the layout (`build.rollupOptions.output`) or update every deploy script.

- `copy_to_fresh` — analogous external copy script to `/mnt/stg_w02/var/www/fresh/`.
- `copy_to/<tenant>/` — empty stub directories, no effect on the build.

## `build/.env*`

`.env`: `BACKEND_BASE='/backend'` · `.env.development`: `BACKEND_BASE='http://dev-crm.test/backend'` · `.env.production`: `BACKEND_BASE='/backend'`. Vue CLI loads `.env` from the project root, not `build/`; these files are probably unused — the real address comes from `public/configure.js` ([architecture.md](architecture.md)).

## Docker

`Dockerfile`: `node:16`, `npm install`, `CMD npm run serve`. `docker-compose.yml`: port `127.0.0.1:8081:8081`, volume `.` + anonymous `/app/node_modules`, `NODE_ENV=development`.

## Git / artifacts

- `dist/` is partly committed (~240 files); `.gitignore` excludes `dist/js`, `dist/css`, `dist/files`.
- `public/dist/` holds tinymce, fontawesome, qrcode, googleapis css ([icon-system.md](icon-system.md)).