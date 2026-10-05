# Page Constructor — правила и структура

Конструктор страниц шаблона: список страниц + **нативный** редактор блоков + конструкторы темы.
Компонент самодостаточен: код и данные конструктора живут здесь, схемы темы — в БД.
Источник разметки/стилей шаблона — репозиторий `svcms-templates` (правки блоков первичны там; затем код/данные переносятся сюда).

## Структура компонента (`src/components/svcmsAdmin/page_constructor/`)

```
PageConstructor.vue          список страниц + панель темы + живое превью + хост редактора
ThemeAxes.vue                панель осей темы (цвет/стиль/компоновка/шрифт), общая для списка и редактора
ThemeTool.vue                полноэкранный конструктор одной оси (схемы из БД)
ThemePreview.vue             мини-витрина темы
theme_defs.js               поля/генераторы CSS 4 осей
editor/BlockEditor.vue       нативный редактор блоков (Vue3)
editor/constructor.css       стили инструмента
engine/index.js              точка входа: импортирует слои и отдаёт SCHEMA/PC/PREVIEW_MAP
engine/render.js             рендер блока в HTML          (было render-preview.js)
engine/preview.js            сборка iframe-документа      (было preview-frame.js)
engine/map.js                тип блока → CSS/JS шаблона   (было preview-map.js)
engine/search.js             поиск блоков (ru/en)         (было search.js)
engine/export.js             сериализация v2, нормализация (было export.js)
data/schema.js|json          метаданные блоков             (было block-schema.js)
data/demo/*.js               демо-данные превью           (было js/data/*)
data/template/               «шаблонный пакет» для превью: css/, js/, images/ (из templates/<t>)
data/examples/*.json         примеры page_list для кнопки «Пример»
RULES.md                     этот файл
```

Справочник движка и документация изменений — `agent-doc/page-constructor.md`;
команды интроспекции схемы — `.opencode/skills/pc-schema/scripts/pc.mjs` (скиллы
`pc-schema`, `pc-block`, `pc-preview`, `pc-editor`, `pc-theme`).

`public/page_constructor/template/` — **генерируется** из `data/template/` скриптом
`npm run constructor:pack` (запускается автоматически перед `dev/serve/build*`).
Туда же `data/demo/*.js` копируются в `public/page_constructor/js/data/` — их
подгружает превью по `data-url` (демо-данные слайдера/каталога/товаров/новостей).
`PAGE_CONSTRUCTOR_CONFIG.dataBase` указывает на этот каталог (иначе `data-url`
резолвился в несуществующий путь). В репозитории `data/template` и `data/demo` —
источник; `public/...` в git не хранится. Там же `constructor:pack` пишет
`js/data/asset-rev.json` (карта `путь → mtime`), который превью подставляет как
`?nc=` — без этого отредактированные css/js не видны до пересборки пака.

## Слои

1. **Схема блоков** — типы/варианты/параметры/элементы (`data/schema.js`).
2. **Рендер блока** — блок → HTML (`engine/render.js`).
3. **Карта превью** — какой CSS/JS шаблона и какие демо-данные нужны блоку (`engine/map.js`).
4. **Сборка превью** — документ для `<iframe>` (`engine/preview.js`).
5. **Редактор** — список блоков, формы, drag&drop (`editor/BlockEditor.vue`).
6. **Тема** — цвет/стиль/компоновка/шрифт: схемы в БД, выбор на домен (`theme_defs.js`, `Theme*.vue`, таблицы БД).

## Конверт блоков в превью

- Контентные блоки рендерятся как `<section class="section …modifiers">` — как в prod-страницах `templates/t1/page/*.html` (а не как карточки `.block`). Модификаторы заливки/анимации/bleed остаются (`block--fill-*`, `block--anim-*`, `block--bleed`).
- `raw: true` (`slider`, `header`, `footer`, `page_contacts`, `custom`) идут мимо `.section`-обёртки.
- `page_head` / `page_head_hidden` печатает сам `renderBlock`: `.page-head` с `h1.page-head__title`, хлебные крошки и опциональный `.page-head__sub` (или скрытый `h1`), секция получает `section--page`. После этого `section-head` блока не печатается, у товара/статьи уходит свой H2 — блок с `page_head` не должен дублировать заголовок.
- Структурные `header`/`footer` дополняются схемными дефолтами (`withDefaults`) — если параметр не задан в блоке, берётся `default` из схемы (nav/favorite/cart/phone… = `true`), иначе header рендерится пустым.
- Иконки преимуществ используют модификатор `adv-card__icon--{delivery|shield|payment|support}` (маска `--icon-src` из `css/advantages-icons.css`), иначе `::before`-глиф не рисуется.
- Превью-картинки берутся из `data/template/images/` (подборка). Пропущенные наборы (напр. `images/preview/service/`) дают «нет фото» — при расхождении синхронизировать из `templates/t1/images/`.
- Типы без записи в `engine/map.js` (`about`, `page_contacts`) рендерятся как `static` без своих css/данных — молча, без ошибки.
- Типы с `items_are_data` теряют `items` при экспорте: в проде они приходят из запроса, в превью — из `data/demo/*.js` (`dataKey` в `map.js`) или `sampleItems` схемы.

## Формат документа страницы (blocks)

```json
{ "schema": "svcms.page_blocks", "version": 2, "blocks": [ { "type": "...", "variant": "...", "params": {}, "items": [], "fill": "1", "anim": "" } ] }
```
Хранится в `domain_page.blocks`; совместим с автономным конструктором (`export.js`).
Плоский список блоков без per-block id; `_uid` — только для UI, на экспорте снимается.
В `blocks` для `POST /page/save` уходит строка `JSON.stringify(doc)`, а для
`POST /structure/save` — объекты блоков.

## Шапка и подвал (уровень домена)

- Хранятся отдельно от страниц: `domain_constructor.header_blocks/footer_blocks` (JSON блока v2). Эндпоинты `GET /structure/<domain_id>`, `POST /structure/save` (тело `{domain_id, header, footer}`).
- Если колонки пусты, структура берётся из первой страницы домена (fallback).
- `POST /structure/save` дополнительно раскладывает шапку/подвал по всем `domain_page` домена (fan-out), пока сайт-рендер читает `blocks`.
- `POST /page/save` при сохранении страницы заменяет присланные header/footer канонической структурой.
- В `BlockEditor.vue` вызывается с `role="structure"` (только structural-блоки) и `role="page"` (контент; header/footer отфильтрованы и подмешиваются в превью/экспорт из props `header`/`footer`).
- Список страниц: колонки сортируются кликом по заголовку (по умолчанию — по названию), иконка «tune» открывает `ThemeTool`.
- Миграция БД: `CrmFreshBackend-python-async/routes/svcmsadmin/page_constructor/domain_migration.sql`.

## Маршруты и deep-link

Хост держит URL синхронным с состоянием (`apply_route`/`read_route`/`on_route_change`,
`?preview=<id>`, `?theme=<axis>`); повторный вход по URL открывает нужную страницу,
`/block/<n>` — раскрытый блок. Наборы маршрутов в `src/router/index.js`:
`/vue/page-constructor/:domain_id/…` (в shell) и `/page-constructor/:domain_id/…`
(blank), где `…` = `` | `:view(page|structure)` | `page/:page_id` |
`page/:page_id/block/:block_id` | `theme/:axis(color|style|layout|font)`.

## Сохранение и восстановление

- `BlockEditor` шлёт `change` (локально, без POST) на каждое изменение и `save` по
  кнопке; хост отвечает `applySaveResult(ok, msg)`. `POST /page/save` больше не
  перезагружает список — иначе сбрасывался выбор темы.
- Битый JSON в `domain_page.blocks` приходит как `blocks_error`/`blocks_raw`:
  хост показывает баннер `.pc_broken` и модалку ручной правки (нормализует документ
  по `BLOCKS_EMPTY`).
- Локальный черновик редактора — `localStorage['svcms.page_constructor.v1']`.

## Тема

- Схемы: `domain_theme_color/style/layout/font` (`domain_id, header` — составной PK, `label, short, descr, css, sort, is_default, is_custom`). `domain_id=0` — общий пресет, `>0` — индивидуальный схема домена.
- Выбор на домен: `domain_constructor` (`domain_id PK`, имена осей). Кастом сохраняется в таблицу схем домена (`is_custom=1`); общая схема не перетирается — индивидуальный домен заводит свою копию. В `ThemeTool` чекбокс «Общая схема (для всех доменов)» → `scope: shared`.
- Эндпоинты: `GET /theme-schemes/<axis>?domain_id=`, `GET /theme-schemes/<axis>/<name>?domain_id=`, `GET /theme-schemes/<axis>/<name>/file.css`, `POST /theme-schemes/save`, `POST /theme-schemes/<axis>/<name>/delete`, `GET/POST /theme/<domain_id>`, `GET /theme/<domain_id>/styles.css`. Список отдаёт общие + индивидуальные схемы домена, одноимённая индивидуальная перекрывает общую; ключ схемы — `header`.
- Сайт подключает: `<link rel="stylesheet" href="…/page-constructor/theme/<domain_id>/styles.css">`.
- В интерфейсе `ThemeAxes.vue` (4 селекта + `tune`) доступен и в списке (слева, с живым превью), и в редакторе страницы (кнопка «Тема»). Сохранение **двухфазное**: выбор схемы только помечает ось (`theme_dirty`/`theme_pending`), `save_theme()` батчит `POST /theme/save` по всем грязным осям; уход без сохранения спрашивает (`leave_theme_guard`, `beforeRouteLeave`, `beforeunload`). После сохранения обновляются `window.PAGE_CONSTRUCTOR_CONFIG` и `theme_rev`.
- Порядок каскада осей в превью и на сайте: **color → layout → style → font**, затем `customCss`. `decor` (украшение заголовков) живёт в оси `style` и сбрасывает оформление компоновки через `DECOR_RESET`.
- `@font-face` — `data/template/css/fonts.css`, пресеты шрифтов — `FONTS` в `engine/preview.js`; генератор `build_font` выдаёт только `--font*` в `:root`.
- `BlockEditor` проп `configRev` → пересобирает открытые превью (aside/страница/блок). Список пересобирает `list_preview_src` из закэшированного документа выбранной страницы.
- В холсте блоков: при hover подсвечивается заголовок (`.pcb-card:hover .pcb-head`), при раскрытии блок автоматически прокручивается в зону видимости (`scrollToBlock`, `scroll-margin-top`).
- Токены вне осей (`_tokens-base.css`): масштаб, `--container`, `--header-sticky-offset`, `--z-1..400`. Оси добавляют свои `--radius`, `--shadow`, `--corner-tick`, `--font-*` и т. п.

## Процедуры обновления

### Изменился код/разметка блока в шаблоне
1. В `svcms-templates` перегенерировать `page_constructor/schema/block-schema.json` →
   скопировать в `data/schema.js` **и** в `data/schema.json` (зеркало, его читают
   через `require`).
2. Пересобрать `page_constructor/js/{render-preview,preview-map,preview-frame,search,export}.js` → скопировать в `engine/`.
3. Обновить `data/demo/*` и, при изменении стилей, `data/template/{css,js,images}` (копия `templates/<t>`).
4. `npm run constructor:pack`, затем `node .opencode/skills/pc-schema/scripts/pc.mjs check`.
5. Проверить превью блока/страницы и редактор.

### Добавился тип блока
1. Схема (п.1 выше): тип, варианты, `params`/`shared_params`, `contract_classes`.
2. Функция рендера + запись `RENDER[<type>] = { raw, fn }` в `engine/render.js`
   (диспетчер на 56 типов, лишние/пропущенные записи — источник тихих багов).
3. Запись в `engine/map.js` (`css`, `extraJs`, `kind`, `dataKey`) — без неё блок
   рендерится как `static` без своих стилей и данных.
4. Данные в `data/demo`, если блок с данными; тип с запросом — `items_are_data: true`.
5. Классы разметки должны существовать в `data/template/css`: `pc.mjs classes <id>`.
6. `npm run constructor:pack` → `pc.mjs check`.

### Добавилась/изменилась схема темы
1. В `svcms-templates`: `templates/<t>/css/themes/<axis>/<name>.css` (шрифт — JS `FONTS`).
2. Импорт в `domain_theme_<axis>` (`domain_id,header,label,short,descr,css,sort`; `domain_id=0` — общий).
3. Зеркало в компоненте: `data/template/css|js` → копия `templates/<t>/css|js`; для
   оси `layout` — пресет в `theme_defs.js` (`LAYOUT_PRESETS`) и новое поле
   акцента в `AXES.layout.fields` + генератор в `build_layout()`, если схема
   приносит структурное правило (например `.section-title::before`).
4. `npm run constructor:pack` из корня админки (агент делает сам): `data/template` →
   `public/page_constructor/template`, иначе превью конструктора отдаёт старые файлы.
   Проверка: `git status --porcelain public/page_constructor` (эти пути в `.gitignore`).

## Правила совместимости
- Не менять формат v2 без миграции `domain_page.blocks`.
- Пресеты/кастомы хранят полный набор токенов; шрифт — CSS `:root{--font…}`.
- `name` схемы — идентификатор (латиница/дефисы) в URL.
- `PAGE_CONSTRUCTOR_CONFIG` (глобал) задаёт `templateBase`, оси темы и `customCss` для превью.
