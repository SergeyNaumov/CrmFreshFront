# Page Constructor (конструктор страниц)

> Load when: меняешь блок/вариант/параметр в конструкторе страниц, рендер `engine/render.js`, превью (iframe), оси темы, редактор `BlockEditor.vue` / `PageConstructor.vue`.
> Canonical for: модель документа v2, слои `engine/*`, схема блоков и её CLI-интроспектор, конвейер превью, каскад темы, эндпоинты, deep-link маршруты, точки касания «добавить блок».

Правила компонента (структура, backend-контракт, процедуры обновления) — [RULES.md](../src/components/svcmsAdmin/page_constructor/RULES.md). Скиллы с командами: `pc-schema`, `pc-block`, `pc-preview`, `pc-editor`, `pc-theme` (`.opencode/skills/`).

## Слои

```
data/schema.js|.json   схема: типы → варианты → параметры/поля items  (АВТОГЕНЕРИТСЯ, руками не править)
engine/map.js          тип → { css[], extraJs[], dataKey, kind } — контракт превью
engine/render.js       блок → HTML (1985 стр., 104 функции, 56 записей RENDER)
engine/preview.js      HTML → документ <iframe srcdoc>
engine/search.js       поиск блоков в палитре (ru/en)
engine/export.js       нормализация и сериализация v2 + localStorage
PageConstructor.vue    хост: список страниц, тема, превью, маршруты      (1112 стр.)
editor/BlockEditor.vue весь UI редактора блоков и его состояние        (1095 стр.)
theme_defs.js          поля и CSS-генераторы 4 осей темы
ThemeAxes/ThemeTool/ThemePreview.vue  панель осей / полноэкранный редактор оси / мини-витрина
data/template/         css/ js/ images/ — копия templates/<t> для превью
public/page_constructor/  ГЕНЕРИРУЕТСЯ `npm run constructor:pack` (в git не хранится)
```

Все файлы движка — IIFE, кладут API в глобалы (`PC`, `PC_PREVIEW_MAP`, `PAGE_CONSTRUCTOR_SCHEMA`) и в `module.exports` для node-тестов. `engine/index.js` — единственная точка входа: `import { SCHEMA, PC, PREVIEW_MAP } from './engine'`.

## Модель документа (v2)

```json
{ "schema": "svcms.page_blocks", "version": 2,
  "blocks": [ { "type": "text", "variant": "prose", "fill": "", "anim": "", "bleed": false,
                "params": { "header": "О нас" }, "items": [ {} ] } ] }
```

- Плоский список блоков, без дерева и без per-block id. `_uid` — только UI, на экспорте снимается.
- Конверт (`schema.envelope.fields`): `type`, `variant`, `fill`, `anim`, `bleed`. `fill` → `block--fill-N`, `anim` → `block--anim-zoom|clip|no-anim`, `bleed` → `block--bleed` (`envelope.class_map`).
- Контентный блок рендерится как `<section class="section …"> > .container` — паритет с прод-страницами `templates/t1/page/*.html`. `raw: true` (`slider`, `header`, `footer`, `page_contacts`, `custom`) идёт без обёртки.
- `items` выбрасываются при экспорте, если тип помечен `items_are_data` или список пуст (`export.js:38` `normalizeBlock`).
- Хранится в `domain_page.blocks`; шапка/подвал — отдельно на домен (`domain_constructor.header_blocks/footer_blocks`).
- Локальный черновик редактора — `localStorage['svcms.page_constructor.v1']`; это не сохранение на сервере.

## Схема: не читать файлы, спрашивать CLI

`data/schema.js` — 11k строк / 376 КБ автогенерируемый дамп (`agent-doc/tools/gen_page_constructor.py` из репозитория `svcms-templates`), `data/schema.json` — его побайтово равное зеркало. Верхний уровень: `version`, `schema_id`, `comment`, `envelope`, `types`. Сейчас **56 типов / 102 варианта / 217 contract_classes / 12 групп**.

```shell
P=.opencode/skills/pc-schema/scripts/pc.mjs
node $P groups                        # группы и счётчики
node $P types --group Медиа           # список типов: id, группа, дефолт, title, флаги
node $P type slider                   # варианты + params + items.fields + contract_classes + запись map.js
node $P type slider --json            # сырой объект типа
node $P param page_head               # обратный индекс: где встречается параметр
node $P classes product_detail        # паритет contract_classes с data/template/css
node $P check                         # все типы рендерятся? все есть в map.js?
node $P diff HEAD                     # что изменилось в схеме относительно рефы
```

Разы работает из любого каталога. `engine/index.js` в node **не импортируется** — `data/demo/*.js` требуют DOM; CLI грузит `schema.js` + `map.js` + `render.js` по отдельности.

Поля варианта: `params` (массив) либо `params_ref` → `type.shared_params[ref]`; `items.fields` либо `type.items_shared.fields`; `items.default` — демо-данные превью. `kind` параметра: `text`, `textarea`, `number`, `select`, `bool`, `image`. Флаги типа: `structural`, `once` (единственный в структуре), `data`, `items_are_data`, `partial`, `status`, `check`, `views`.

## Конвейер превью

```
PC.renderAll(blocks)            блоки → HTML (render.js:1973, renderBlock:1909)
  → data-data-key="x"          разметка помечает, откуда взять данные
PC.buildPreviewDoc(markup, t)  документ iframe (preview.js:122)
  → resolveDataKeys             data-data-key → абсолютный data-url = js/data/<key>.js
  → <base href=templateBase>    + ?nc=<mtime из asset-rev.json> на каждый css/js
  → css base → оси темы → customCss → NO_NAV_SCRIPT → сборщик window.__pcErrors
```

- Каскад осей: **color → layout → style → font**, затем `customCss` (`preview.js`). Порядок совпадает с `THEME_ORDER` в бэкенде.
- `NO_NAV_SCRIPT` гасит в iframe переходы (`A`/`AREA`/`FORM`, `auxclick`, `submit`, Enter) — превью не уходит на 404.
- `window.__pcErrors` — ошибки CSS/JS превью; смотреть в консоли iframe.
- Три iframe: aside (выбранный блок, debounce 300 мс), модалка блока, модалка страницы. Атрибут `data-pc-frame` = `aside|modal|page`; `guardFrame` (700 мс) + `restoreFrame` пересобирают `srcdoc`, если документ сменился.
- Демо-данные: `data/demo/*.js` → `public/page_constructor/js/data/` (`dataKey` в `map.js`), либо `sampleItems` из схемы.
- `window.PAGE_CONSTRUCTOR_CONFIG` (`templateBase`, `dataBase`, `filesBase`, `api`, `domain_id`, оси, `customCss`) ставит хост; `window.PC_ASSET_REV` — из `page_constructor/js/data/asset-rev.json`.
- Правки `data/template/{css,js}` видны только после `npm run constructor:pack` (иначе `?nc=` ссылается на старый mtime).

## Редактор и хост

`PageConstructor.vue` — `view` = `list | editor | structure`, владеет списком страниц, панелями темы, превью списка, диалогами (метаданные, удаление, полноэкранная тема, правка битого JSON). `BlockEditor.vue` — вся работа с блоками.

| Что | Где |
|---|---|
| `blocks[]` (`_uid`, `type`, `variant`, `params`, `items`), `editingUid`, drag&drop | `BlockEditor.vue:414` `data()` |
| форма параметров | `formParams(block)` `:565` + `variantParams(block.type, block.variant)` |
| «Вид блока» — select с именем `show|view|display`, важнее `variants` | `viewParam` `:635` |
| поля items | `itemFields` / `hasItems` |
| события | `change` (автосохранение в хосте, без POST), `save` (явное) → `applySaveResult(ok, msg)`, `edit-structure`, `edit-block` (deep-link на индекс блока) |
| `allowCustom` у select | `CUSTOM = '__custom__'`, `onSelect` возвращает исходный тип опции (иначе сохранялось `"false"`) |
| режим Б (запрос данных) | `isQueryMode` (`source === 'block_query'`), `formParams` прячет `varname` |
| aside | `aside_w` + drag-resize (`localStorage pc_constructor_aside_w`), `toggleJson` — preview/JSON в одной колонке |
| роль редактора | `role="page"` (header/footer вынесены в props) и `role="structure"` (только `structural`-типы) |

Маршруты (`router/index.js:69-86`, дважды: `/vue/…` в shell и `/…` blank):

```
/page-constructor/:domain_id                                        список страниц
/page-constructor/:domain_id/:view(page|structure)                 редактор / шапка-подвал
/page-constructor/:domain_id/page/:page_id                         редактор страницы
/page-constructor/:domain_id/page/:page_id/block/:block_id         открыть и раскрыть блок
/page-constructor/:domain_id/theme/:axis(color|style|layout|font)   конструктор оси
```

Хост держит URL синхронным с состоянием (`apply_route`/`read_route`, `?preview=<id>`, `?theme=<axis>`). Тема сохраняется **двумя фазами**: выбор схемы → `theme_dirty`/`theme_pending`, `save_theme()` батчит POST по всем грязным осям; `leave_theme_guard` + `beforeRouteLeave` + `beforeunload` предупреждают об уходе. Битый `blocks` (`blocks_error`/`blocks_raw` с бэкенда) → баннер `.pc_broken` + модалка ручной правки JSON.

## Эндпоинты

База: `BackendBase + '/svcmsadmin/page-constructor'` (`PageConstructor.vue:352`).

| Метод | Путь | Тело / что даёт |
|---|---|---|
| POST | `/init` | `{domain_id}` → `domain, templateBase, theme, structure, pages, config` |
| GET | `/page/:id` | `{page:{id,url,header,blocks,blocks_error?,blocks_raw?}}` |
| POST | `/page/save` | `{id, domain_id, url, header, blocks}`; **`blocks` — строка `JSON.stringify(doc)`** |
| POST | `/page/:id/delete` | — |
| POST | `/base-pages` | `{domain_id}` — создать базовый набор страниц |
| GET/POST | `/structure/<domain_id>`, `/structure/save` | `{domain_id, header, footer}` — объекты блоков, не строка |
| GET/POST | `/theme/:domain_id`, `/theme/save` | `{domain_id, axis, name, css, scope:'domain'|'shared'}` |
| GET | `/theme-schemes/<axis>[/<name>]?domain_id=` | список схем / схема с `css` |
| GET | `/theme/:domain_id/styles.css` | конкатенация осей для сайта (фронт не зовёт) |
| GET/POST | `/block-images?domain_id=&folder=`, `/block-images/upload` | `FormData {domain_id, folder, file}` — `fetch`, не `$http` |

`template_id` фронт не передаёт: бэкенд резолвит его в `templateBase` по `domain.template_id` → папка шаблона; фронт берёт только `d.templateBase`, иначе фолбэк `BaseUrl + 'page_constructor/template/'`.

## Тема

Оси `color`, `style`, `layout`, `font` (`theme_defs.js:353` `AXES`): поля → токены `:root`, генераторы `build_color`/`build_style`/`build_layout`/`build_font`, `facts` — карта cssVar → поле. Пресеты компоновки `LAYOUT_PRESETS` (`standard`, `industrial`, `elegant`, `editorial`, `wide`, `compact`, `technical`) зеркалят `css/themes/layout/*.css`; цвета 16 схем в `css/themes/colors/`, стили 12 в `css/themes/style/`; `@font-face` — в `css/fonts.css`, пресеты шрифтов — `FONTS` (`preview.js:17`).

Схемы лежат в БД (`domain_theme_color|style|layout|font`, PK `(domain_id, header)`, `domain_id=0` — общий пресет, `is_custom` — сгенерированный CSS). Сайт подключает `<link …/theme/<domain_id>/styles.css>`.

Новый тип блока: 1) схема (в `svcms-templates`, регенерация → `data/schema.{js,json}`) → 2) `RENDER[type]` в `render.js` → 3) запись в `map.js` → 4) демо-данные при `items_are_data` → 5) contract_classes должны найтись в CSS (`pc.mjs classes <id>`) → 6) `pc.mjs check`.

## Грабли

- `page_head`/`page_head_hidden` на блоке выводят H1 + крошки и класс `section--page`; после этого `section-head` блока не печатается, а у товара/статьи уходит свой H2. Вынесено в 47 вариантов 22 типов (`page_head_hidden` — в 6) — проверяй `pc.mjs param page_head`.
- Контент `<section>` не должен дублировать заголовок, который рисует `page_head`.
- В `map.js` у `header` нет своих `css/header-search.css` и поиска — они в `commonJs`/`cssBase` для всех страниц.
- Типы без записи в `map.js` молча рендерятся как `static` без своих css/js — сейчас это `about`, `page_contacts`.
- `map.js` содержит дубли ключей (`photo_gallery`, `brands_grid`, `tabs`, `history_timeline`, `org_chart`, `reports`) — побеждает последний.
- `fill`/`anim`/`bleed` живут рядом с `params`, не внутри; `compactParams` выкидывает `null`/`''`.
- `public/page_constructor/**` и `data/schema.js` генерируемые/автогенер — ручная правка перетирается `constructor:pack` или генератором.
- `POST /page/save` ждёт `blocks` строкой; структура шапки/подвала — объектами.

## Проверка

```shell
node .opencode/skills/pc-schema/scripts/pc.mjs check   # 56 типов, рендер без исключений, покрытие map.js
npm run constructor:pack && git status --porcelain public/page_constructor   # должно быть пусто (в .gitignore)
npm run build
```

UI-смоук: открыть `http://localhost:8081/page-constructor/<domain_id>/page/<page_id>/block/0`, в консоли iframe проверить `window.__pcErrors`, консоль/console браузера ([verification.md](verification.md)).
