# Backend contract (`CrmFreshBackend-python-async`)

> Load when: mapping a backend config to a screen, field, or filter.
> Canonical for: menu contract, `type` → component maps, AdminTree/Const payloads, known gaps.

The frontend is a renderer: the backend sends JSON describing an administrable table (config) and the component draws fields/filters/tree. No background scripts are described in a config. User-facing version: `CrmFreshBackend-python-async/docs-developer/17-frontend-contract.md`.

## Menu

`GET {BackendBase}<left_menu_controller>` → `{left_menu:[...], success}`. Item: `{header, type, value, params, icon, open, child[]}`. `open` = expand the branch on load (`admin_menu_new.open`); `show` = same flag in legacy SV-CMS project menus.

| type/value | Route | Component |
|---|---|---|
| `vue` + `admin-table` | `/vue/admin_table/<params.config>` | `AdminTable.vue` |
| `vue` + `admin-tree` | `/vue/admin_tree/<params.config>` | `AdminTree.vue` |
| `vue` + `const` | `/vue/const/<params.config>` | `Const.vue` |
| `src` / `newtab` | — | arbitrary page / URL |

Files: `LeftMenu.vue`, `left_menu_item.vue`, `App.vue`, `router/index.js`. Routing: [router.md](router.md).

## EditForm: `type` → component

`FormBlock.vue:dynamic_component`; the `1_to_1_` prefix is stripped first. Runtime flow: [form-engine.md](form-engine.md). Field files: [fields.md](fields.md).

| backend `type` | component |
|---|---|
| `text`, `textarea` | `field-text` |
| `checkbox`, `switch`, `1_to_1_checkbox` | `field-checkbox` |
| `select` | `field-select` |
| `multiconnect` | `field-multiconnect` |
| `date`, `time`, `datetime`, `yearmon`, `daymon` | `field-<type>` |
| `wysiwyg`, `password`, `code`, `memo`, `1_to_m`, `file`, `docpack`, `in_ext_url`, `time_table`, `font-awesome`, `component`, `accordion` | `field-<type>` |
| `project_sitemap`, `project_export`, `project_clone`, `project_struct` | `field-project_*` |
| `save_button` | draws the save button |

`is_only_field`: `checkbox|switch`, or read_only `date|datetime` — no description wrapper.

## AdminTable: filters

`OnFilters.vue:dynamic_component`:

| backend type | component |
|---|---|
| `text`, `textarea`, `wysiwyg` | `filter-text` |
| `checkbox`, `switch` | `filter-checkbox` |
| `file`, `select`, `date`, `datetime`, `yearmon`, `memo`, `in_ext_url`, `multiconnect` | `filter-<type>` |

`AdminTable.vue:333-341`: `checkbox`/`switch` without `values` becomes a `select` «Не использовать/Да/Нет».

## AdminTree

`GET`/`POST /admin-tree/<config>` → `{form, tree}`.

- `form.*`: `title, config, header_field, tree_use, sort, sort_field, max_level, not_create, read_only, make_delete, changed_in_tree, view_type, cols, wide_form, card_format`.
- `item.*`: `id, header, sort, childs, photo`.

See [components.md](components.md) and backend docs `11`/`17`.

## Const

`Const.vue` understands `header`, `text`, `textarea`, `wysiwyg`, `file`, `checkbox`, `switch`, `select`.

## FileNavigator

`FileNavigator.vue` → `BackendBase+'/filenavigator/<config>'`. Config sets `root_directory` (`configs/svcmsadmin/filenavigator/__init__.py`, `'./'` → cwd бэкенда); chroot защищает пути. Ответы: `{success, error:[...]}` (успех — `error: []`), кроме GET.

| Method | Path | Body | Success payload |
|---|---|---|---|
| GET | `/<config>` | — | голая строка root (`"./"`) |
| GET | `/<config>/raw` | `?dir&download=1` | `FileResponse` (предпросмотр/скачивание; `inline`/`attachment`) |
| POST | `/<config>/readir` | `{dir}` | `{list:[{name,type:"dir"|"file",size,mtime}]}` (`size` — байты для файлов/`null` для папок, `mtime` — unix-секунды) |
| POST | `/<config>/readfile` | `{dir,charset="utf-8"}` | `{body}` (декод в `charset`; ошибка кодировки → `success:false`) |
| POST | `/<config>/writefile` | `{dir,body,charset="utf-8"}` | — (создаёт/перезаписывает; родитель должен существовать) |
| POST | `/<config>/mkdir` | `{dir}` | — (создаёт каталог; родитель должен существовать) |
| POST | `/<config>/delete` | `{dir,name}` | — (папки рекурсивно) |
| POST | `/<config>/move` | `{from_dir,to_dir,name}` | — |
| POST | `/<config>/rename` | `{dir,name,new_name}` | — |

`dir` — относительный путь от chroot (`.` — корень). Компонент правит файлы через `field-codelist` (язык по расширению, иначе `plain`); виды список/плитка, иконки по типу, контекстное меню (правый клик), drag&drop файлов и папок на папки и хлебные крошки. Запуск `/filenavigator/<config>/<path>` или `/filenavigator/<config>?dir=<folder>` (плюс `?charset=<cp>`, по умолчанию `utf-8`) — этот путь становится корнем навигатора (chroot), `charset` применяется к чтению/записи; изображения и pdf открываются в popup, прочие бинарные — только скачивание.

Нет эндпоинтов create-folder и upload. `dir` — относительный путь от chroot (`.` — корень). Компонент правит файлы через `field-codelist` (язык по расширению, иначе `plain`).

## PageConstructor

`PageConstructor.vue` → `BackendBase+'/svcmsadmin/page-constructor'`. Привязка к `domain_id` (не `template_id`); роут `/page-constructor/:domain_id`. Страницы в таблице `domain_page` (`id, domain_id, url UNIQUE(domain_id,url), header, blocks`); `blocks` — JSON-строка формата v2 (`{schema:"svcms.page_blocks", version:2, blocks:[...]}`, как в автономном `page_constructor/js/export.js`). Формат ответов `{success, errors}`.

| Method | Path | Body | Payload |
|---|---|---|---|
| POST | `/init` | `{domain_id}` | `{domain:{id,domain,template_id,header,folder}, templateBase, config:{templateBase,filesBase,color,style,layout,font,engine}, theme, structure:{header,footer}, base_set_id, base_sets:[{id,name,sort,is_default,pages}], pages:[{id,url,header}]}. `filesBase` — относительный `/files/project_<id>/` |
| GET | `/page/<id>` | — | `{page:{id,domain_id,url,header,blocks}}` (`blocks` — parsed) |
| POST | `/page/save` | `{id?, domain_id, url, header, blocks}` | upsert, `{id}` (url обязателен, уникален в рамках домена); header/footer в `blocks` заменяются канонической структурой домена |
| POST | `/page/<id>/delete` | — | — |
| GET | `/structure/<domain_id>` | — | `{structure:{header,footer}}` — общие для домена шапка/подвал (блоки v2 или `null`); хранятся в `domain_constructor.header_blocks/footer_blocks`, при пустых — берутся из первой страницы домена |
| POST | `/structure/save` | `{domain_id, header, footer}` | upsert доменных header/footer в `domain_constructor` + раскладка по всем `domain_page` домена (fan-out, пока сайт читает `blocks`) |
| POST | `/base-pages` | `{domain_id, set_id?, overwrite?}` | `{set_id, set_name, created:[url], updated:[url], skipped:[url]}` — копирует страницы набора `base_pages_set` → `domain_page`: существующие по `url` пропускает, при `overwrite=true` обновляет `header/blocks`; кастомные страницы не трогает. `set_id` без значения — дефолтный набор. Запоминает набор в `domain_constructor.base_set_id` |
| GET | `/base-sets` | — | `{sets:[{id,name,sort,is_default,pages}], default_set_id}` |
| POST | `/base-sets/create` | `{name, domain_id?}` | `{set:{id,name,pages}}` — новый набор; с `domain_id` копирует страницы домена, иначе пустой |
| POST | `/base-sets/rename` | `{set_id, name}` | — |
| POST | `/base-sets/update-from-domain` | `{set_id, domain_id}` | `{set_id, set_name, pages}` — заменяет содержимое набора страницами домена |
| POST | `/base-sets/delete` | `{set_id}` | — ; запрещено для `is_default=1` и последнего набора |
| GET | `/theme/<domain_id>` | — | `{theme:{color,style,layout,font}}`, каждый `{name,custom,css}`; нет строки → дефолты |
| POST | `/theme/save` | `{domain_id, axis, name, css, scope?}` | upsert оси в `domain_constructor`; кастомный `css` кладётся в `domain_theme_<axis>` (`is_custom=1`) — в домен (`scope=domain`, по умолчанию) или в общие (`scope=shared` → `domain_id=0`); общая схема не перетирается, домен заводит свою копию |
| GET | `/theme/<domain_id>/styles.css` | — | combined `text/css`: `color → style → layout → font` из таблиц `domain_theme_*` (индивидуальная схема приоритетнее общей) |
| GET | `/theme-schemes/<axis>?domain_id=` | — | список схем (`header,label,short,descr,is_default,is_custom,domain_id`): общие (`domain_id=0`) + индивидуальные домена, одноимённая индивидуальная перекрывает общую |
| GET | `/theme-schemes/<axis>/<name>?domain_id=` | — | схема с `css` (индивидуальная, иначе общая) |
| GET | `/theme-schemes/<axis>/<name>/file.css` | — | CSS схемы (для сайта, `text/css`) |
| POST | `/theme-schemes/save` | `{axis,name,label,short,descr,css,domain_id?,scope?}` | upsert схемы (`is_custom=1` для новых); `scope=shared` → `domain_id=0` |
| POST | `/theme-schemes/<axis>/<name>/delete?domain_id=` | — | удалить админскую схему (`is_custom=1`): общую (`domain_id=0`) или доменную; системные (`is_custom=0`) и выбранные в `domain_constructor.<axis>` (любым доменом для общей) — нельзя |

Редактор блоков — автономный конструктор из `svcms-templates/page_constructor/`, копируется скриптом `sync_to_admin.sh` в `public/page_constructor/` и грузится в iframe. Обмен блоков через `localStorage` (`svcms.page_constructor.v1`), `templateBase` из `/init`: если http(s) — используется он, иначе локальная копия `public/page_constructor/template/` (её тоже кладёт `sync_to_admin.sh`, каталог gitignored). Базовый набор страниц — именованные наборы `base_pages_set` (`id,name,sort,is_default`) + строки `template_pages_base` (`set_id,url,header,sort,blocks`, `UNIQUE(set_id,url)`), сидируются из `base_pages.json`; текущий набор — `etalon-1` (`is_default=1`). Кнопка «Базовый набор» (диалог) выбирает набор и перезаписывает/дополняет страницы домена; управление: создать (пустой или из домена), переименовать, обновить из домена, удалить. Миграция — `routes/svcmsadmin/page_constructor/base_sets_migration.sql`. Шапка/подвал и тема в набор не входят. Тема — таблица `domain_constructor` (`domain_id PK`, имена осей на домен) + таблицы схем `domain_theme_{color,style,layout,font}` (составной PK `domain_id,header`; полный CSS схем, `is_custom`; `domain_id=0` — общий пресет, `>0` — индивидуальный домена); `/init` отдаёт тему в `theme`/`config`, кастомный CSS прокидывается в превью через `PAGE_CONSTRUCTOR_CONFIG.customCss` (поддержка в `preview-frame.js`). Сайт подключает `theme/<id>/styles.css` или `theme-schemes/<axis>/<name>/file.css`. Шапка и подвал домена — `domain_constructor.header_blocks/footer_blocks` (JSON блока v2), правятся один раз на домен (эндпоинты `/structure/*`); на страницах в редакторе они не редактируются, а показываются плашками и подмешиваются в превью/сохранение. Миграция: `routes/svcmsadmin/page_constructor/domain_migration.sql`.

## CreateProject (быстрое создание проекта)

`CreateProject.vue` (пункт меню `svcmsadmin-createproject`, роут `/vue/svcmsadmin-createproject`) → `BackendBase+'/svcmsadmin/project/create'`. Аналог legacy `legacy/svcms-admin/fast_create.pl`; поле «место хранения» убрано, менеджер опционален. Создание синхронное, ответы `{success, errors}`.

| Method | Path | Body | Payload |
|---|---|---|---|
| GET | `/templates` | — | `{templates:[{template_id,header,folder,type}], source_project_id}` — только шаблоны `type=6` (DS Конструктор) |
| POST | `/start` | `{header, domain, template_id, create_manager?, login?, password?, demo?, source_project_id?}` | `{project_id, domain_id, template_id, template_folder, login, password, pages, demo, source_project_id, warnings}` |

Порядок: `project` → `admin_project` (текущий админ) → `domain` (`template_id`, `server_type=4`, `not_cache_nginx=1`) → `const` (имена из проекта-эталона, значения пустые) → опц. `manager` + `manager_project_access` (пустой пароль генерируется на бэкенде, 8 символов; хэшируется через `lib/password.py` — для `mysql_encrypt` в ENCRYPT/DES-совместимый crypt, для `mysql_sha2` — sha2-256) → конструктор (`domain_constructor` с осями темы из эталона и header/footer из `page_constructor/base_pages.json`; `domain_page` из `template_pages_base`) → при `demo=true` копируются `ds_*` проекта-эталона и каталоги `sites/files/project_<id>`, `sites/projects/project_<id>`, `conf_projects/project_<id>`.

Проект-эталон по умолчанию — `config_svcms_admin.py → fast_create.source_project_id` (`5837`); пути — `paths.engine_root`, `paths.conf_projects`. При ошибке выполняется компенсирующий откат (транзакций в `FreshDB` нет). Валидация: шаблон существует и `type=6`, домен и логин уникальны. Миграция: `routes/svcmsadmin/project_create.sql` (drop `template.ds_constructor`, enable пункта меню).

## Known gaps

- No `filter_extend_*` support (0 occurrences in `src/`). The backend emits such fields in `/get-filters` (except `filter_extend_checkbox/switch/datetime`, which are not converted), but `OnFilters.dynamic_component` returns `''` → the filter is not drawn.
- `filter-checkbox` is referenced in `OnFilters.vue` but not registered in `dynamic_component_loader.js`/`main.js`.
- `field-chart` and `field-table` are registered but `FormBlock` never selects them — only `field-accordion` uses them.
- `filter-time` is registered, but the type `time` is absent from the filter switch.

See `CrmFreshBackend-python-async/agent-doc/10-known-issues.md`.
