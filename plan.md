# План перехода CRMFreshFront на Vue 3 + Vite + Vuetify 3

Источник деталей: `agent-doc/migration-vue3.md`, `agent-doc/icon-system.md`, `agent-doc/build-and-tenant.md`. Исполняемый чеклист.

Легенда: `[x]` выполнено, `[ ]` осталось (требует браузера/сервера).

## Решения (зафиксированы)

- Ветка `vue3`, `main` остаётся на Vue 2. Откат — `git checkout main`.
- JavaScript, Options API.
- Backend не меняется: `eval`-точки, глобалы, runtime-компилятор.
- Иконки: MDI + FontAwesome + Material.
- Вывод сборки: `dist/{js,css,index.html,fonts}`.

## Этап 0. Подготовка

- [x] Ветка `vue3`, тег `pre-vue3`.
- [x] Baseline `npm run build` (Vue CLI) — успешен, зафиксирован.
- [x] Smoke на Vue2 — сравнение с baseline (Vue2-билд) на ключевых экранах.
- [x] Список проверяемых экранов — `agent-doc/verification.md`.

## Этап 1. Vite

- [x] `vite`, `@vitejs/plugin-vue`, `vite-plugin-vuetify`, `sass`.
- [x] `vite.config.js`: alias `@`, vue esm-bundler, `server 8081`, output `js/css/fonts`.
- [x] `index.html` в корень; `BaseUrl` из `import.meta.env.BASE_URL` в `main.js`.
- [x] `process.env.BASE_URL` убран.
- [x] Скрипты `dev/serve/build/build_trade/build_svcms` через `--mode`.
- [x] `public/` подключён как есть.
- [x] Сборки default/trade/svcms проходят, base корректный.

## Этап 2. Ядро Vue 3

- [x] `vue@3`, `vuetify@3`, `mitt`.
- [x] `main.js`: `createApp`, `globalProperties`, `app.component`.
- [x] `dynamic_component_loader(app)`.
- [x] bus-shim `$on/$off/$emit`.
- [x] Глобалы `window.Vue/EditForm/app`, `BackendBase`, `BaseUrl`.
- [x] Alias `vue/dist/vue.esm-bundler.js`.
- [x] `$vuetify.breakpoint` → `$vuetify.display`.

## Этап 3. API codemods

- [x] `beforeDestroy`→`beforeUnmount`, `destroyed`→`unmounted`.
- [x] `.sync` → `v-model:search`.
- [x] Grep-защиты по Vue2 API чисты (кроме комментариев).

## Этап 4. Vuetify 2 → 3

- [x] `v-layout/v-flex` → `v-row/v-col` (+ grid-атрибуты `xs12/md6/...`).
- [x] `v-tabs-items/v-tab-item` → `v-window/v-window-item`.
- [x] `v-simple-table` → `v-table`.
- [x] `v-expansion-panel-header/content` → `title/text`.
- [x] `v-list-item-content` убран, `v-subheader` → `v-list-subheader`.
- [x] Классы `headline`→`text-h5`, `white--text`→`text-white`; `red darken-1`→`red-darken-1`.
- [x] `v-btn text`→`variant`, `v-icon/v-btn small`→`size`.
- [x] Кастомный icon set (`LegacyIcon` в `main.js`).
- [x] `createVuetify({ theme, icons })`.
- [x] `v-treeview` под API v3, `item-text`→`item-title`.
- [x] Рантайм-проверка (puppeteer): shell + Form Engine (12 полей), date/time picker — 0 предупреждений.
- [x] Ревизия SCSS-селекторов Vuetify2 в браузере (выполнена).

### Найдено и исправлено рантаймом

- [x] Ленивые компоненты → `defineAsyncComponent` (в Vue 3 фабрика `() => import()` не async).
- [x] `@change` → `@update:model-value` у form-компонентов Vuetify 3.
- [x] `v-menu` активатор: `{ on }`+`v-on="on"` → `{ props }`+`v-bind="props"`.
- [x] Vuetify 3.5.13 + labs `VTimePicker`/`VTreeview` (в 3.4.11 time-picker отсутствовал).
- [x] Иконки: нормализация `fa-<name>` → `fa fa-<name>` (иначе FontAwesome-семейство терялось).
- [x] `vuedraggable@4`: `item-key` + слот `#item`, `:options`→`group`/`handle` (branch, OnFilters, slide).
- [x] `FormBlock.vue`: пустой `<component :is>` под `v-if` (устранён «Invalid vnode type»).
- [x] «Голые» вложенные `<template>` убраны (Vue 3 рендерит их как нативный `<template>`); чинило листья левого меню.
- [x] Шапка: стили `.v-toolbar-title` + белый цвет ссылки/иконки (Vuetify 3 `a{color:primary}`).
- [x] Реальный smoke на `build_svcms` + живом бэке: shell (15 верхних пунктов), edit_form/good+news, admin_tree direction/vendor, admin_table news/good/cert/manager, const — 0 ошибок/предупреждений.

### Стили и цветовые схемы

- [x] Sass `@import` → `@use`; варнинг `legacy-js-api` отключён; `@import` в проекте нет.
- [x] Единый источник палитры `src/theme/palette.js`; `src/styles/colors/` и `variables.scss` удалены.
- [x] SCSS-цвета → CSS-переменные Vuetify `rgb(var(--v-theme-*))` (22 файла).
- [x] Глобальный цвет ссылок `.v-application a`.
- [x] Аудит Vuetify2-селекторов (`.v-card__*`, `.v-toolbar__*`, `.v-input__slot`, `.v-input--selection-controls`, `.theme--light`, treeview и т.д.).
- [x] `App.vue`: `.v-field*` вместо `.v-input__slot`/`.v-select__*`.
- [x] AdminTable: чекбоксы фильтров через `:model-value`+`@update:model-value` — кнопка «искать» появляется.
- [x] Грид-атрибуты `sm12/lg7` → `sm/lg`; `:outlined`→`variant`.
- [x] AdminTree: плюсы/минусы `x-small` + отступ.
- [x] Проверено: сборки 0 варнингов; smoke 0 ошибок; фильтры/таблицы/дерево/шапка ок.

## Этап 5. Динамические импорты

- [x] `DynamicLoader.vue` → `import.meta.glob`.
- [x] Фильтры `dynamic_component_loader.js` → статические `import()`.

## Этап 6. Библиотеки

- [x] `vuedraggable@4`, `vue-advanced-cropper@2`, `axios@1`.
- [x] Удалены неиспользуемые зависимости.
- [x] `chart.vue` оставлен на вендоренном `js/chart.js`.
- [x] wysiwyg (TinyMCE) проверен; DnD/кроп — вручную.

## Этап 7. Сборка и деплой

- [x] Output `js/css/fonts` + `index.html`.
- [x] `build/build_trade/build_svcms` — структура совпадает с контрактом.
- [ ] Прогон реального deploy-скрипта `build/<tenant>` (нужен стенд).
- [ ] Обновить Dockerfile (опционально).

## Этап 8. Проверка и релиз

- [x] Реальный smoke на живом бэке (shell, формы, деревья, таблицы, const) — 0 ошибок/предупреждений.
- [x] save (update) проверен на живом бэкенде; insert/файлы/1_to_m/drag и multiconnect treeview — на стенде.
- [ ] Проверить `eval`-точки `agent-doc/security.md` на стенде (формы с regexp-правилами исправлены без eval).
- [x] Grep-защиты (Vue2 API / Vuetify2 / `process.env`).
- [ ] PR `vue3 → main`.

## Этап 9. Поле `codelist` (CodeMirror 6) и подчёркивание ссылок

- [x] Зависимости: `@codemirror/{view,state,commands,language,search,autocomplete}`, `lang-python`, `lang-javascript`, `legacy-modes` (без мета-пакета `codemirror`).
- [x] `src/components/fields/codelist.vue`: редактор, тема из Vuetify-токенов, `rows`, read-only, `field-buttons`, ошибки.
- [x] Язык только из конфига: `field.language` → `lang` → `mode` → `perl`; python/js и legacy-режимы грузятся динамически (`Compartment` + token-защита от гонки).
- [x] Регистрация: `dynamic_component_loader.js` (`field-codelist`), `EditForm/FormBlock.vue` (свитч + full-width).
- [x] `1_to_m/form.vue`: редактор в диалоге + `codelist` в whitelist `create_edit_fields`; `1_to_m/slide.vue`: обрезанный `<pre>` в list/table + `codelist` в `get_value_for_slide`.
- [x] `AdminTable/FindResults.vue`: read-only ячейка `pre.codelist_result`.
- [x] Ссылки: `main.scss` underline + исключения (`.v-btn`/`.v-card`/`.v-list-item`/`.v-chip`/`.v-breadcrumb-item`, иконки, сортировка, шапка); токены `--app-font-mono`, `--app-font-code`.
- [x] Сборки default/trade/svcms; чанк `dist/js/codelist.js` 368 kB (120 kB gzip), ленивый.
- [x] `FindResults.vue` + `result_type(td)`: реальный тип колонки ищется в `filters` (бэк отдаёт `type='html'`); ветка `pre.codelist_result` иначе недостижима.
- [x] Диалог `1_to_m` с `codelist` — `fullscreen` (`.one_to_m_form_wide`, `is_wide_dialog`); остальные 1_to_m остались 752px.
- [x] `field.fast_rules` (`[{header,url}]`) → select «быстрое правило» + кнопка «применить»: `GET url` → `{success,data}` пишем в doc.
- [x] Скролл: `CM_THEME '&' {height:100%}` — `.codelist_box` фикс. высота, колесо/полоса прокрутки работают (проверено реальным wheel через CDP).
- [x] Высота по умолчанию: `rows` 12 → 20.
- [x] Тулбар редактора: поиск/замена, undo/redo, свернуть/развернуть всё, перенос строк; автодополнение (`autocompletion` + `completeAnyWord`, языковые источники для python/js).
- [x] Тулбар редактора: подсветка пробелов/табов (`highlightWhitespace()`) и переключение отступов пробелы/табы (`indentUnit`); дефолты `field.show_whitespace`/`indent_with_tabs`/`indent_size`.
- [x] `1_to_m` при сохранении правки (update) окно не закрывает, показывает «сохранено» (~1.5с); insert закрывает как раньше.
- [x] Smoke через CDP (без скриншотов): `edit_form/template/2504` (слайд + диалог 1600×1000 + выбор правила + payload сохранения), `edit_form/struct/12841`, `edit_form/fast_rule`, `vue/admin_table/fast_rule` — 0 ошибок консоли.
- [ ] Ручная проверка в браузере: undo/поиск по Ctrl+Z/Ctrl+F, тёмная тема, планшетная ширина.

## Этап 10. Файловый навигатор

- [x] `src/components/FileNavigator/FileNavigator.vue`: список/навигация (breadcrumbs, вверх/в корень), просмотр+правка файлов через `field-codelist` (язык по расширению, иначе `plain`), создание/переименование/перемещение/удаление, вывод `error`-списка.
- [x] Виды список/плитка (localStorage `filenavigator_view`), иконки по типу файла, размер/дата (`readir` отдаёт `size`/`mtime`), создание папок (`/mkdir`).
- [x] Drag&drop файлов и папок на папки и хлебные крошки (нативный HTML5), guard от переноса папки в себя/потомка.
- [x] `?dir=<folder>` — корень навигатора (chroot), `?charset=<cp>` (дефолт utf-8) в read/write; `/raw` для предпросмотра/скачивания; фото и pdf в popup, прочие бинарные — скачивание; контекстное меню (правый клик) и увеличенные иконки/шрифты.
- [x] Фото в popup — фотогалерея со стрелками и клавишами ←/→ по всем изображениям текущей папки (счётчик, циклический переход).
- [x] Корень навигатора также задаётся путём: `/filenavigator/<config>/<path>` (роуты `:base(.*)*`, shell и full-screen, alias `file-navigator`) в дополнение к `?dir=`.
- [x] Роуты: `/vue/filenavigator/:config` (shell) и `/filenavigator/:config` (full-screen, alias `/file-navigator`); маппинг `value=='filenavigator'` в `LeftMenu.get_link`.
- [x] Smoke через CDP на `/filenavigator/filenavigator`: корень `./`, вход в `configs`, open/save (`readfile`/`writefile`), rename, move, delete, ошибки списком — 0 ошибок консоли.

## Этап 11. Конструктор страниц (page_constructor)

- [x] Бэк `routes/svcmsadmin/page_constructor/__init__.py`: `POST /init` (template, `templateBase`/`config`, pages), `GET /page/<id>`, `POST /page/save` (upsert, `unique(template_id,url)`), `POST /page/<id>/delete`; таблица `template_page`, блоки — JSON v2.
- [x] Frontend `src/components/svcmsAdmin/PageConstructor.vue`: список страниц (создание/параметры/удаление, сортировка по названию/url), редактор блоков в iframe.
- [x] Редактор — автономный `svcms-templates/page_constructor` (первоисточник), вендорится скриптом `sync_to_admin.sh` в `public/page_constructor/`; обмен блоками через `localStorage`, `templateBase` из `/init` (пока `file://`).
- [x] Роуты `/page-constructor/:template_id` (full-screen) и `/vue/page-constructor/:template_id` (shell); опциональный проп `open_mode` + комментарий (п.8).
- [x] Инструкция по синхронизации: `svcms-templates/page_constructor/SYNC_TO_ADMIN.md`.
- [x] Smoke через CDP: init, создание/сортировка/удаление страниц, iframe-конструктор смонтировался с `templateBase`, добавление блока и сохранение в БД, 0 ошибок консоли.
- [x] Кнопка «создать базовый набор страниц»: бэк `POST /base-pages` сеет 19 страниц (`/`, `/galery`, `/favorites`, `/catalog` (`rubric_list`), `/goodlist` (`product_list`), `/good/{id}`, `/services/{id}`, `/news/{id}`, `/article/{id}`, `/contacts`, `/basket`, `/news`, `/certificates`, `/about`, `/reviews`, `/compare`, `/articles`, `/404`, `/services`) из таблицы `template_pages_base`, идемпотентно (существующие пропускает).
- [x] Таблица `template_pages_base` (`url, header, sort, blocks`), сидируется из `base_pages.json`.
- [x] Живой предпросмотр починен: `sync_to_admin.sh` копирует шаблон в `public/page_constructor/template/`, фронт использует http-`templateBase` от бэка, иначе локальную копию (каталог gitignored). Проверено: предпросмотр блока галереи и страницы рендерятся, 0 ошибок/404.
- [x] Конструкторы темы: таблица `template_constructor` (одна строка на шаблон: `color/style/layout/font` + `*_css`), эндпоинты `GET /theme/<id>`, `POST /theme/save`, `GET /theme/<id>/styles.css` (combined CSS для сайта).
- [x] Нативный порт 4 конструкторов (`ThemeTool.vue` + `ThemePreview.vue` + `theme_defs.js`, пресеты/`facts` из `theme-catalog.js`): кнопки «Цвет/Стиль/Компоновка/Шрифт» в тулбаре `PageConstructor`, самодостаточная мини-витрина, сохранение пресета (имя) или кастомной схемы (CSS). Кастомный CSS применяется в превью страниц (`PAGE_CONSTRUCTOR_CONFIG.customCss`).
- [x] Схемы темы в БД: таблицы `template_theme_{color,style,layout,font}` (импорт 48 схем), эндпоинты `/theme-schemes/*`, `styles.css` из БД, кастомы сохраняются как схемы (`is_custom=1`); `ThemeTool` читает схемы из БД.
- [x] Вынос конструктора из `svcms-templates`: движок и данные перенесены в компонент (`engine/`, `data/schema.js`, `data/demo`, `data/template`, `data/examples`), редактор блоков — **нативный** `editor/BlockEditor.vue` (без iframe); `public/page_constructor/template` генерируется из `data/template` скриптом `constructor:pack` (predev/prebuild). Правила — `RULES.md`.

## Риски и митигации

| Риск | Митигация |
|---|---|
| Серверный `eval` использует Vue2 API | runtime-компилятор + глобалы; дым-тест всех `eval` |
| Регрессии date/time picker и select | рантайм-проверка, при необходимости `v-autocomplete`/адаптеры |
| Визуальные регрессии иконок | кастомный icon set, ручная проверка трёх систем |
| Пути/структура `dist` | output настроен, сверено на 3 mode |

## Изменённые/созданные файлы (ключевые)

- `package.json`, `package-lock.json`, `vite.config.js`, `index.html`
- `src/main.js`, `src/dynamic_component_loader.js`
- `src/App.vue`, `src/js/app.js`
- codemods и правки в ~50 `*.vue`
- `public/index.html`, `babel.config.js`, `src/plugins/vuetify.js` — удалены
- docs: `AGENTS.md`, `plan.md`, `agent-doc/*`

## Критерий готовности

- Ветка `vue3` собирается в 3 mode с контрактом `dist/{js,css,index.html,fonts}`. [x]
- Smoke пройден, серверный JS исполняется, иконки сохранены. [ ]
- `main` не затронут. [x]

## Правки 05.10.2026

### Пикер иконок: набор не переключает список

`src/components/fields/font-awesome.vue` — `@input` на `v-select` не работает в Vuetify 3 (`VSelect` эмитит только `update:modelValue`). Список оставался на `fa`, а префикс брался из нового набора: `brands` (`fab fa-address-book`) давал пустые глифы, `far` — частично. Правки: watcher по `cur_struct` вместо `@input`, `fonts_struct` → `font_struct`, восстановление набора из сохранённого значения в `load()`, `v-progress-linear` через `v-if`.

Проверено (headless Chrome, `/edit_form/admin_menu/2`): набор из значения — `fas`/956; brands — 252, `fab fa-500px`, `Font Awesome 5 Brands`; far — 151; fa — 687; выбор даёт `fab fa-github`. Ошибок консоли нет.

### Левое меню: раскрытие ветки по `open`

`src/components/left_menu_item.vue` — бэкенд уже шлёт `open` (`left_menu_admin.py`, SELECT `amn.open`; редактор — чекбокс «Сразу показывать подпункты»), а компонент смотрел только на `show`, которого этот эндпоинт не отдаёт. Добавлен `is_open(item)` (`true|1|'1'|'true'`), `show` и `hasActiveChild` сохранены.

Проверено (headless Chrome, `/`): «Сайты» (`open=1`) раскрыта при загрузке — 14 подпунктов, `fa fa-chevron-down`; «Хостинг»/«Другое» (`open=0`) свёрнуты, `fa fa-chevron-right`; клик сворачивает. Ошибок консоли нет.

Docs: `agent-doc/router.md` (Menu), `agent-doc/backend-contract.md` (Menu).

### Списки: отступы, обнулённые ресетом Vuetify 3

`/edit_form/rkn_template/1` — в тексте (wysiwyg, `div.read_only`) маркеры `ul` ложились на первые символы: Vuetify 3 содержит `ress.css` (`node_modules/vuetify/lib/styles/main.css:2382`) `* { padding: 0; margin: 0 }`, которого не было в Vuetify 2. Правка в `src/styles/main.scss`: `ul, ol { padding-left: 1.5em }` + `padding-left: 0` для `.v-pagination__list` (её `v-pagination` рисует голым `<ul>`).

Проверено (headless Chrome, `/edit_form/rkn_template/1`, снимок 298..458 px, анализ пикселей): после фикса маркер — отдельная полоса чернил на css 16..20 при начале текста на 32; до фикса текст начинался на 10 (на краю `ul`), маркер рисовался поверх символов. Каскад: `ul`/`ol` — 21px (disc/decimal), `ul.v-pagination__list` — 0px, `ul.v-breadcrumbs` — 12px, `ul.v-list` — 0px. Пикер иконок (`/edit_form/admin_menu/2`) — 956 иконок на месте. Ошибок консоли нет.

### Быстрое создание проекта (`svcmsadmin-createproject`)

Аналог legacy `legacy/svcms-admin/fast_create.pl` на новом каркасе. Поле «место хранения» убрано, создание менеджера — опционально.

Backend (новый модуль `routes/svcmsadmin/project_create.py`, синхронный):
- `GET /svcmsadmin/project/create/templates` — шаблоны `type=6` (маркер DS Конструктора; колонка `template.ds_constructor` удалена миграцией `routes/svcmsadmin/project_create.sql`).
- `POST /svcmsadmin/project/create/start` — `project` → `admin_project` → `domain(server_type=4, not_cache_nginx=1)` → `const` (имена из проекта-эталона `5837` из `fast_create.source_project_id`, значения пустые) → опц. `manager` + `manager_project_access` → конструктор (`domain_constructor` с осями темы эталона и header/footer из `page_constructor/base_pages.json`; `domain_page` из `template_pages_base`) → при `demo=true` копирование `ds_*` эталона и каталогов `sites/files/project_<id>`, `sites/projects/project_<id>`, `conf_projects/project_<id>`. Компенсирующий откат при ошибке.

Frontend: `src/components/svcmsAdmin/CreateProject.vue` (форма: название, домен, шаблон, чекбокс менеджера, чекбокс демо, результат со ссылками), роуты `/vue/svcmsadmin-createproject` и `/svcmsadmin-createproject`, ветка в `LeftMenu.get_link()`, пункт меню `admin_menu_new` (id=8) включён миграцией.

Проверено: `GET /templates` → `2504`; создание без менеджера/демо (project 5852/domain 9721: 38 `const`, 1 `domain_constructor`, 19 `domain_page`, `server_type=4`); с менеджером и демо (project 5854/domain 9723: `manager`+access, `ds_good`=54, `ds_catalog`=21, `ds_slider`=5, каталоги файлов проекта скопированы); негативные кейсы (домен-дубль, шаблон не type=6, пустой логин). Headless Chrome: страница `/vue/svcmsadmin-createproject` рендерится, шаблон и проект-эталон `#5837` подтягиваются. Тестовые проекты и каталоги удалены. `npm run build_svcms` — успешно.

### Совместимость паролей с MySQL 8

MySQL 8 удалил `ENCRYPT()`, из-за чего SQL-проверка `password=encrypt(%s,password)` в `lib/session.py` падала, и вход в админку/панель сайта не работал (на dev маскировался debug-обходом). Существующие записи: `admin` — DES/ENCRYPT (13 символов), `manager` — md5 (32) и DES (13), новые — sha2 (64).

Добавлен `lib/password.py`:
- `verify_password(plain, stored)` — plaintext, sha2-256, md5 и crypt (DES/ENCRYPT + `$1$/$5$/$6$`);
- `hash_password(plain, method)` — `mysql_encrypt` → DES-совместимый crypt, `mysql_sha2` → sha2-256.

`lib/session.py` (`session_create`) после SQL-проверки делает резервную Python-проверку по строке из БД. Хэширование на запись: создание менеджера в `routes/svcmsadmin/project_create.py`, поле `password` в `lib/CRM/form/save_form.py` (insert и update), смена пароля в `routes/password.py`.

Проверено: вход `POST /login` (svcmsadmin) с legacy DES-паролем — `success:true`, неверный пароль — отказ; пароль нового менеджера из fast-create хэшируется в 13-символьный DES и проходит `verify_password`; unit-проверки форматов. Тестовые записи удалены.

### Обязательные поля с многострочным значением

`/edit_form/pxls/1` (поле `body` типа `codelist`) при правке выдавало «Поле обязательно для заполнения», хотя текст есть. Причина: правило `regexp_rules: ['/^.+$/', ...]` в JS не матчит многострочное значение (`.` не проходит через `\n`), а `check_fld` вызывается только при вводе — поэтому ошибка всплывала при первой же правке. Существующие хэши/значения не при чём.

`src/components/fields/field_functions.js`: `to_regex(rule, dotall)` — для `regexp_rules` заякоренные правила с точкой (`^...+$`) получают флаг `s` (dotAll); `replace_rules` не затронуты. `src/components/fields/select.vue`: `regexp_check()` переведён с `eval(rule+'.test(...)')` на общий `to_regex` (eval падал на правилах-строках без слэшей).

Проверено (headless Chrome, `/edit_form/pxls/1`): правка больше не даёт ошибки; очистка поля — ошибка «Поле обязательно для заполнения» появляется; `npm run build_svcms` — ок.

### FileNavigator: симлинки внутри chroot

`/filenavigator/filenavigator?dir=templates/2026/ds-constructor` ругался «путь вне chroot», хотя `templates` — симлинк на `/var/www/svcms-async/sites/templates` в корне навигатора. Причина: `_safe_path`/`_safe_child` в `routes/filenavigator/__init__.py` использовали `Path.resolve()`, который раскрывает симлинк и сравнивает уже реальный путь с chroot.

Правка: проверка лексическая (`os.path.normpath`, без раскрытия симлинков), абсолютные пути запрещены; в `move` вместо `resolve()` — `_safe_child`. Симлинки внутри chroot разрешены и раскрываются при доступе к ФС.

Проверено: `readir`/`readfile` по `templates/2026/ds-constructor` работают, `../../etc` и `/etc` по-прежнему отвергаются; браузер открывает страницу без ошибки и показывает файлы.

### Форма на всю ширину при `form.wide_form`

`/edit_form/project/5837`: бэкенд отдаёт `wide_form: 1`, но контейнер `.container_wide` ограничен `max-width: 1440px`. В `src/components/EditForm.vue` для `form.wide_form` добавлен модификатор `container_full` (`max-width: none`); формы с несколькими колонками без `wide_form` по-прежнему 1440px.

Проверено (headless Chrome, viewport 1920): `container_wide container_full`, ширина 1920; `npm run build_svcms` — ок.

### Ссылка на конструктор в блоке «Домены» и ширина карточки

`configs/svcmsadmin/project/__init__.py`, `domain_slide_code`: для домена, у которого `template.type=6`, в строку админ-ссылок добавлена «конструктор» → `/page-constructor/<domain_id>` (full-screen, новая вкладка). Тип шаблона читается запросом `SELECT type FROM template WHERE template_id=%s` по `data.template_id`.

`src/components/fields/1_to_m/slide.vue`: `field.cols` ранее игнорировался, карточка всегда `display:inline-block`. Добавлен `list_item_style`: `cols=1` → карточка на всю ширину (`display:block; width:100%`), `cols>1` → ширина по колонкам. Для списков без `cols` поведение прежнее.

Проверено: `domain_slide` проекта 5837 содержит `/page-constructor/9706`; у проекта с `template.type<>6` ссылки нет; в браузере карточка домена = ширина колонки (882px, display:block), ссылка ведёт на `/page-constructor/9706`.

### Наборы базовых страниц конструктора + document.title

- `document.title` конструктора = `Конструктор шаблона <домен>` (+ `· Тема` / `· <страница>` / `· Шапка и подвал`); прежний title возвращается при уходе (`PageConstructor.vue`).
- Мультинаборы: таблица `base_pages_set` (`id,name,sort,is_default`), `template_pages_base.set_id` (`UNIQUE(set_id,url)`), `domain_constructor.base_set_id`. Текущий набор — `etalon-1` (`is_default=1`). Миграция — `routes/svcmsadmin/page_constructor/base_sets_migration.sql`.
- Backend: `GET /base-sets`, `POST /base-sets/create|rename|update-from-domain|delete`; `POST /base-pages` теперь `{domain_id,set_id?,overwrite?}` — существующие по `url` при `overwrite` обновляются, кастомные страницы целы; `/init` отдаёт `base_sets` и `base_set_id`. Удаление запрещено для дефолтного/последнего набора.
- Frontend: кнопка «Базовый набор» открывает диалог — выбор набора, галочка «Перезаписать», плюс управление (создать из домена/пустой, переименовать, обновить из домена, удалить).
- Fast-create берёт страницы дефолтного набора (`project_create.py`).

Проверено: py_compile + build_svcms; `/base-sets` → etalon-1 (19); создание из домена, переименование, guard-удаление, apply (skipped/created); в headless Chrome заголовок `Конструктор шаблона demo1.digitalstrateg.ru`, диалог открывается, создание набора из UI работает; тестовые наборы и добавленные страницы удалены.

### Удаление админских схем темы

`POST /theme-schemes/<axis>/<name>/delete?domain_id=<0|домен>` (`page_constructor/__init__.py`): теперь удаляет любую админскую схему (`is_custom=1`) — и общую (`domain_id=0`), и доменную; системные (`is_custom=0`) и используемые в `domain_constructor.<axis>` (для общей — любым доменом) запрещены с понятной ошибкой. Заодно в `SchemeSaveIn` добавлен `domain_id` (эндпоинт `/theme-schemes/save` падал 500).

`ThemeTool.vue` (режим «Готовая схема»): кнопка-корзина рядом с выбором схемы, активна только для `is_custom=1`; confirm → удаление → перезагрузка списка.

Проверено: system `color/digitalstrateg` — «системную нельзя»; используемая `style/armit` — «используется в 1 домене(ах)»; созданная общая/доменная схемы удаляются; в headless Chrome у системной корзина disabled, у админской активна, confirm и удаление из UI работают. Тестовые схемы удалены (в БД только `style/armit`).
