# Page Constructor — правила и структура

Конструктор страниц шаблона: список страниц + **нативный** редактор блоков + конструкторы темы.
Компонент самодостаточен: код и данные конструктора живут здесь, схемы темы — в БД.
Источник разметки/стилей шаблона — репозиторий `svcms-templates` (правки блоков первичны там; затем код/данные переносятся сюда).

## Структура компонента (`src/components/svcmsAdmin/page_constructor/`)

```
PageConstructor.vue          список страниц + панель темы + живое превью + хост редактора
ThemeAxes.vue                панель осей темы (цвет/стиль/компоновка/шрифт), общая для списка и редактора
editor/BlockEditor.vue       нативный редактор блоков (Vue3)
editor/constructor.css       стили инструмента
engine/index.js              точка входа: импортирует слои и отдаёт SCHEMA/PC/PREVIEW_MAP
engine/render.js             рендер блока в HTML          (было render-preview.js)
engine/preview.js            сборка iframe-документа      (было preview-frame.js)
engine/map.js                тип блока → CSS/JS шаблона   (было preview-map.js)
engine/search.js             поиск блоков (ru/en)         (было search.js)
engine/export.js             сериализация v2, нормализация (было export.js)
data/schema.js               метаданные блоков            (было block-schema.js)
data/demo/*.js               демо-данные превью           (было js/data/*)
data/template/               «шаблонный пакет» для превью: css/, js/, images/ (из templates/<t>)
data/examples/*.json         примеры page_list для кнопки «Пример»
theme/ThemeTool.vue          конструктор оси темы (схемы из БД)
theme/ThemePreview.vue       мини-витрина превью
theme/theme_defs.js          поля/генераторы CSS 4 осей
RULES.md                     этот файл
```

`public/page_constructor/template/` — **генерируется** из `data/template/` скриптом
`npm run constructor:pack` (запускается автоматически перед `dev/serve/build*`).
Туда же `data/demo/*.js` копируются в `public/page_constructor/js/data/` — их
подгружает превью по `data-url` (демо-данные слайдера/каталога/товаров/новостей).
`PAGE_CONSTRUCTOR_CONFIG.dataBase` указывает на этот каталог (иначе `data-url`
резолвился в несуществующий путь). В репозитории `data/template` и `data/demo` —
источник; `public/...` в git не хранится.

## Слои

1. **Схема блоков** — типы/варианты/параметры/элементы (`data/schema.js`).
2. **Рендер блока** — блок → HTML (`engine/render.js`).
3. **Карта превью** — какой CSS/JS шаблона и какие демо-данные нужны блоку (`engine/map.js`).
4. **Сборка превью** — документ для `<iframe>` (`engine/preview.js`).
5. **Редактор** — дерево блоков, формы, drag&drop (`editor/BlockEditor.vue`).
6. **Тема** — цвет/стиль/компоновка/шрифт: схемы в БД, выбор на шаблон (`theme/`, таблицы БД).

## Конверт блоков в превью

- Контентные блоки рендерятся как `<section class="section …modifiers">` — как в prod-страницах `templates/t1/page/*.html` (а не как карточки `.block`). Модификаторы заливки/анимации/bleed остаются (`block--fill-*`, `block--anim-*`, `block--bleed`).
- Структурные `header`/`footer` дополняются схемными дефолтами (`withDefaults`) — если параметр не задан в блоке, берётся `default` из схемы (nav/favorite/cart/phone… = `true`), иначе header рендерится пустым.
- Иконки преимуществ используют модификатор `adv-card__icon--{delivery|shield|payment|support}` (маска `--icon-src` из `css/advantages-icons.css`), иначе `::before`-глиф не рисуется.
- Превью-картинки берутся из `data/template/images/` (подборка). Пропущенные наборы (напр. `images/preview/service/`) дают «нет фото» — при расхождении синхронизировать из `templates/t1/images/`.

## Формат документа страницы (blocks)

```json
{ "schema": "svcms.page_blocks", "version": 2, "blocks": [ { "type": "...", "variant": "...", "params": {}, "items": [], "fill": "1", "anim": "" } ] }
```
Хранится в `domain_page.blocks`; совместим с автономным конструктором (`export.js`).

## Шапка и подвал (уровень домена)

- Хранятся отдельно от страниц: `domain_constructor.header_blocks/footer_blocks` (JSON блока v2). Эндпоинты `GET /structure/<domain_id>`, `POST /structure/save` (тело `{domain_id, header, footer}`).
- Если колонки пусты, структура берётся из первой страницы домена (fallback).
- `POST /structure/save` дополнительно раскладывает шапку/подвал по всем `domain_page` домена (fan-out), пока сайт-рендер читает `blocks`.
- `POST /page/save` при сохранении страницы заменяет присланные header/footer канонической структурой.
- В `BlockEditor.vue` вызывается с `role="structure"` (только structural-блоки) и `role="page"` (контент; header/footer отфильтрованы и подмешиваются в превью/экспорт из props `header`/`footer`).
- Список страниц: селекты осей темы сохраняются сразу (`POST /theme/save {domain_id, axis, name, css:''}`), иконка «tune» открывает `ThemeTool`; колонки сортируются кликом по заголовку (по умолчанию — по названию).
- Миграция БД: `CrmFreshBackend-python-async/routes/svcmsadmin/page_constructor/domain_migration.sql`.

## Тема

- Схемы: `domain_theme_color/style/layout/font` (`domain_id, header` — составной PK, `label, short, descr, css, sort, is_default, is_custom`). `domain_id=0` — общий пресет, `>0` — индивидуальный схема домена.
- Выбор на домен: `domain_constructor` (`domain_id PK`, имена осей). Кастом сохраняется в таблицу схем домена (`is_custom=1`); общая схема не перетирается — индивидуальный домен заводит свою копию. В `ThemeTool` чекбокс «Общая схема (для всех доменов)» → `scope: shared`.
- Эндпоинты: `GET /theme-schemes/<axis>?domain_id=`, `GET /theme-schemes/<axis>/<name>?domain_id=`, `GET /theme-schemes/<axis>/<name>/file.css`, `POST /theme-schemes/save`, `POST /theme-schemes/<axis>/<name>/delete`, `GET/POST /theme/<domain_id>`, `GET /theme/<domain_id>/styles.css`. Список отдаёт общие + индивидуальные схемы домена, одноимённая индивидуальная перекрывает общую; ключ схемы — `header`.
- Сайт подключает: `<link rel="stylesheet" href="…/page-constructor/theme/<domain_id>/styles.css">`.
- В интерфейсе `ThemeAxes.vue` (4 селекта + `tune`) доступен и в списке (слева, с живым превью), и в редакторе страницы (кнопка «Тема»). Смена сохраняется сразу (`POST /theme/save`) и обновляет `window.PAGE_CONSTRUCTOR_CONFIG` + `theme_rev`.
- `BlockEditor` проп `configRev` → пересобирает открытые превью (aside/страница/блок). Список пересобирает `list_preview_src` из закэшированного документа выбранной страницы.
- В холсте блоков: при hover подсвечивается заголовок (`.pcb-card:hover .pcb-head`), при раскрытии блок автоматически прокручивается в зону видимости (`scrollToBlock`, `scroll-margin-top`).

## Процедуры обновления

### Изменился код/разметка блока в шаблоне
1. В `svcms-templates` перегенерировать `page_constructor/schema/block-schema.json` → скопировать в `data/schema.js`.
2. Пересобрать `page_constructor/js/{render-preview,preview-map,preview-frame,search,export}.js` → скопировать в `engine/`.
3. Обновить `data/demo/*` и, при изменении стилей, `data/template/{css,js,images}` (копия `templates/<t>`).
4. Проверить превью блока/страницы и редактор.

### Добавился тип блока
1. Схема (п.1).
2. Запись в `engine/map.js` (`css`, `extraJs`, `kind`, `dataKey`).
3. Данные в `data/demo`, если блок с данными.

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
