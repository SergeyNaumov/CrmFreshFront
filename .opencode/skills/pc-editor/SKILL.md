---
name: pc-editor
description: Use when working on the page constructor UI — PageConstructor.vue, editor/BlockEditor.vue, editor/constructor.css, block canvas/inspector forms, save flow, deep-link routes /page-constructor/:domain_id/..., broken-JSON dialog, aside preview/JSON panel, ThemeAxes panel.
---

# Интерфейс конструктора страниц

Два компонента: хост и редактор. Правки в интерфейсе — здесь.

```
PageConstructor.vue     хост: список страниц, панель темы, превью списка, диалоги,
                       синхронизация URL, три экземпляра <block-editor>
editor/BlockEditor.vue  весь UI работы с блоками и всё его состояние (1095 стр.)
editor/constructor.css  только обвязка инструмента (appbar, canvas, карточки, aside, модалки)
```

## Хост

- `view` = `list | editor | structure`; редактор монтируется в двух местах —
  `:doc="current_doc"` (роль `page`) и `:doc="structure_doc"` (`role="structure"`).
- Состояние: список страниц, кэш документов (`preview_docs`), оси темы, панели
  (`panel_theme_hidden`, `panel_pages_hidden`), модалки (метаданные, удаление,
  полноэкранная тема, правка битого JSON).
- База API: `BackendBase + '/svcmsadmin/page-constructor'` (`PageConstructor.vue:352`).
  Таблица эндпоинтов — `agent-doc/page-constructor.md`.
- `window.PAGE_CONSTRUCTOR_CONFIG` и `window.PC_ASSET_REV` ставит хост; ими пользуется
  превью — см. `pc-preview`.

## Редактор (BlockEditor)

Options API. Ключевое состояние (`data()`):

```jsc
blocks: [{ _uid, type, variant, fill, anim, bleed, params: {}, items: [] }],  // _uid только UI
pageHeader, pageFooter,     // структура при role="page"
editingUid,                 // какой блок раскрыт (форма инлайн в карточке)
savedSnapshot, saveState, saving, isDirty, lastSavedAt,
aside_w, jsonVisible, dragIndex, dragOverIndex,
showAddModal, addQuery, previewUid, showPagePreview, picker, toast
```

Панели: appbar (кнопки предпросмотр/пример/очистить/сохранить), холст плоского списка
карточек с drag&drop, инлайн-форма параметров внутри карточки блока, правый aside
(iframe превью блока ↔ JSON, drag-resize, `localStorage pc_constructor_aside_w`),
модалка палитры блоков (поиск `PC.search`), модалки превью блока и страницы, пикер
картинок/эмодзи.

Контракт наружу:

| Событие | Когда | Что делает хост |
|---|---|---|
| `change` | каждое изменение блоков | присваивает `current_doc` — **без** POST (локальная автосохранка) |
| `save` | кнопка «Сохранить» | `POST /page/save`, затем `applySaveResult(ok, msg)` |
| `edit-structure` | клик по плейсхолдеру шапки/подвала | открывает `role="structure"` |
| `edit-block` | раскрытие блока | хост пишет индекс в URL (`/block/<n>`) |

Прочие правила:

- `blocks` глубоко смотрится → `change`; `POST` только из `save`. Хост после сохранения
  **не** перезагружает список/тему — иначе сбрасывался выбор схемы.
- Палитра в `role="structure"` фильтруется по флагу `structural`.
- «Вид блока» — `viewParam` (`BlockEditor.vue:635`), select с именем `show|view|display`,
  приоритетнее `variants`. `formParams` (`:565`) = `PC.variantParams` минус этот параметр.
- `allowCustom`-поля: `CUSTOM = '__custom__'`, `onSelect` возвращает исходный тип опции —
  иначе `false` сохранялся строкой `"false"`.
- Режим Б (запрос данных): `isQueryMode` (`source === 'block_query'`), `formParams` прячет `varname`.
- Merge дефолтов при загрузке — `mergeParamDefaults` для всех типов (не только структурных),
  попутно выводит `where` для товаров из `varname` (`sale_goods_list` → `action=1` и т. п.).
- Новые иконки/картинки: `/block-images` + `/block-images/upload` (`FormData`, `fetch`, не `$http`).

## Маршруты (deep-link)

```
/page-constructor/:domain_id                                     список
/page-constructor/:domain_id/:view(page|structure)              редактор / структура
/page-constructor/:domain_id/page/:page_id                      редактор страницы
/page-constructor/:domain_id/page/:page_id/block/:block_id      открыть и раскрыть блок
/page-constructor/:domain_id/theme/:axis(color|style|layout|font)
```

Наборы продублированы с префиксом `/vue/` (в shell, `router/index.js:69-86`), у blank-вариантов
`meta: { blank: true }`. Хост синхронизирует URL сам (`apply_route`/`read_route`/`on_route_change`,
`?preview=<id>`, `?theme=<axis>`), переход по URL открывает нужный вид, повторный вход
в редактор — на тот же блок.

## Битый JSON

Бэкенд отдаёт `blocks_error`/`blocks_raw`: хост показывает баннер `.pc_broken` и модалку
ручной правки (`open_json_fix`/`apply_json_fix`), нормализуя документ по `BLOCKS_EMPTY`.

Правила: не менять формат v2 и `schema` без миграции; `POST /page/save` ждёт `blocks`
строкой `JSON.stringify(doc)`, а `POST /structure/save` — объектами блоков.

Схема блоков — `pc-schema`, тема — `pc-theme`, превью — `pc-preview`.