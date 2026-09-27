# Зависимости (npm, ветка vue3)

> Про зависимости **полей** (движок, циклы, ajax/TTL) — `field-dependencies.md`.

## Основные (используются)

| Пакет | Версия | Где |
|---|---|---|
| `vue` | ^3.4 | весь проект |
| `vue-router` | ^4 | `src/router/index.js` |
| `vuetify` | 3.5.13 | UI (+ `vite-plugin-vuetify`) |
| `@mdi/font` | 4.9.95 | MDI-иконки (не менять версию) |
| `axios` | ^1 | `this.$http` (main.js) |
| `mitt` | ^3 | event bus (main.js) |
| `vuedraggable` | ^4 | AdminTree/OnFilters/1_to_m |
| `vue-advanced-cropper` | ^2 | `fields/file.vue` |
| `tinymce` | ^5.9.2 | `fields/wysiwyg.vue` (raw, `config.TinyMCE_BaseUrl`) |
| `@fontsource/inter`, `@fontsource/nunito` | ^5 | шрифты схем (main.js) |

Dev: `vite@4`, `@vitejs/plugin-vue@4`, `sass`, `vite-plugin-vuetify@1`.

## Вендоренные (не npm)

- `src/js/chart.js` (Chart.js v2 API, используется `fields/chart.vue`).
- `src/js/qrcode.min.js`.
- `public/dist/{tinymce,fontawesome,googleapis.com-Material-plus-Icons.css,webfonts}`.

## Было в `main` и удалено при миграции

`@vue/cli-*`, `vue-template-compiler`, `vue-cli-plugin-vuetify`, `vuetify-loader`, `babel.config.js`, `sass-loader@7`, `stylus*`, `css-loader`, `style-loader`, `core-js@2`, а также неиспользуемые `chart.js`/`vue-chartjs` (chart field берёт вендоренный файл) и `@tinymce/tinymce-vue` (wysiwyg работает с raw tinymce).

## Примечания

- `vue` алиасится на `vue/dist/vue.esm-bundler.js` (runtime-компилятор для серверного `eval`) — см. `migration-vue3.md`.
- Версии иконок `@mdi/font` и `public/dist/fontawesome` не трогать.
