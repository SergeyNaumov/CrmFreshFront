# Зависимости

## Фактически используемые

| Пакет | Версия | Где |
|---|---|---|
| `vue` | ^2.6.12 | весь проект |
| `vuetify` | ^2.5.0 | UI |
| `@mdi/font` | ^4.9.95 | MDI-иконки (`import '@mdi/font/css/materialdesignicons.css'`) |
| `axios` | ^0.19.2 | `Vue.prototype.$http` |
| `vuedraggable` | ^2.24.3 | AdminTree, AdminTable/OnFilters, fields/1_to_m |
| `vue-advanced-cropper` | ^0.15.3 | `fields/file.vue` (кроп) |
| `tinymce` | ^5.9.2 | `fields/wysiwyg.vue` (напрямую) |

Вендоренные (не npm): `src/js/chart.js` (Chart.js v2 API, используется `fields/chart.vue`), `src/js/qrcode.min.js`, `public/dist/tinymce`, `public/dist/fontawesome`, `public/dist/googleapis.com-Material-plus-Icons.css`.

## Объявлены, но не используются

Проверено grep по `src`:
- `@tinymce/tinymce-vue` — wysiwyg работает с raw `tinymce`, биндинг не нужен.
- `chart.js`, `vue-chartjs` — chart.vue использует вендоренный `js/chart.js`.
- `stylus`, `stylus-loader` — `.styl` файлов нет.
- `css-loader`, `style-loader` — нужны только внутренностям Vue CLI.

`core-js`/`regenerator` — полифиллы под Babel preset `@vue/app`.

## Dev-зависимости Vue CLI

`@vue/cli-service ^3.11`, `@vue/cli-plugin-babel ^3.11`, `vue-template-compiler ^2.6.12`, `sass ~1.32.12`, `sass-loader ^7.3.1`, `vue-cli-plugin-vuetify ^0.6.3`, `vuetify-loader ^1.7.1`.

## Целевой стек (Vue 3 / Vite)

| Сейчас | Замена | Комментарий |
|---|---|---|
| `vue@2` | `vue@3` | Options API сохраняем |
| `vuetify@2` | `vuetify@3.5.13` + `vite-plugin-vuetify@1` | см. `migration-vue3.md` |
| `@vue/cli-service@3` | `vite` + `@vitejs/plugin-vue` | |
| `vuedraggable@2` | `vuedraggable@4` (или `vue-draggable-plus`) | только Vue3-версия |
| `vue-advanced-cropper@0.15` | `vue-advanced-cropper@2` | Vue3 |
| `axios@0.19` | `axios@1` | API совместим |
| `@tinymce/tinymce-vue@3` | удалить либо `@tinymce/tinymce-vue@6` | сейчас не используется |
| `chart.js@3` + `vue-chartjs@3` | удалить либо `chart.js@4` | `chart.vue` переписать под v4 API |
| `tinymce@5` | оставить 5.9 | `config.TinyMCE_BaseUrl` |
| `sass-loader@7` | `sass` (dart-sass) | Vite сам компилирует SCSS |
| `stylus*`, `css-loader`, `style-loader` | удалить | не используются |
| `core-js@2` | `core-js@3` или `@vitejs/plugin-legacy` | если нужны старые браузеры |

`vue-codemirror` в проекте не установлен (только закомментированные импорты) — обновлять нечего.
