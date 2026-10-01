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
Хранится в `template_page.blocks`; совместим с автономным конструктором (`export.js`).

## Шапка и подвал (уровень шаблона)

- Хранятся отдельно от страниц: `template_constructor.header_blocks/footer_blocks` (JSON блока v2). Эндпоинты `GET /structure/<template_id>`, `POST /structure/save` (тело `{template_id, header, footer}`).
- Если колонки пусты, структура берётся из первой страницы шаблона (обратная совместимость).
- `POST /structure/save` дополнительно раскладывает шапку/подвал по всем `template_page` (fan-out), пока сайт-рендер читает `blocks`.
- `POST /page/save` при сохранении страницы заменяет присланные header/footer канонической структурой.
- В `BlockEditor.vue` вызывается с `role="structure"` (только structural-блоки) и `role="page"` (контент; header/footer отфильтрованы и подмешиваются в превью/экспорт из props `header`/`footer`).
- Список страниц: селекты осей темы сохраняются сразу (`POST /theme/save {axis, name, css:''}`), иконка «tune» открывает `ThemeTool`; колонки сортируются кликом по заголовку (по умолчанию — по названию).
- Миграция БД: `CrmFreshBackend-python-async/routes/svcmsadmin/page_constructor/structure_migration.sql`.

## Тема

- Схемы: `template_theme_color/style/layout/font` (`name PK, label, short, descr, css, sort, is_default, is_custom`).
- Выбор на шаблон: `template_constructor` (`template_id PK`, имена осей). Кастом сохраняется в таблицу схем (`is_custom=1`).
- Эндпоинты: `GET /theme-schemes/<axis>`, `GET /theme-schemes/<axis>/<name>`, `GET /theme-schemes/<axis>/<name>/file.css`, `POST /theme-schemes/save`, `POST /theme-schemes/<axis>/<name>/delete`, `GET/POST /theme/<id>`, `GET /theme/<id>/styles.css`.
- Сайт подключает: `<link rel="stylesheet" href="…/page-constructor/theme/<template_id>/styles.css">`.
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
2. Импорт в `template_theme_<axis>` (`name,label,short,descr,css,sort`).

## Правила совместимости
- Не менять формат v2 без миграции `template_page.blocks`.
- Пресеты/кастомы хранят полный набор токенов; шрифт — CSS `:root{--font…}`.
- `name` схемы — идентификатор (латиница/дефисы) в URL.
- `PAGE_CONSTRUCTOR_CONFIG` (глобал) задаёт `templateBase`, оси темы и `customCss` для превью.
