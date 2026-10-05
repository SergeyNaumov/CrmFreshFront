---
name: pc-block
description: Use when adding, changing or reviewing a block type / variant / parameter of the page constructor — edits in engine/render.js, engine/map.js, data/schema.json, contract_classes, demo data. Covers the full touch-point checklist (schema → render → map → CSS → demo) and the verification commands.
---

# Добавить или изменить блок конструктора

Блок проходит через 5 слоёв. Пропуск любого = тихая поломка в превью
(блок без стилей, без данных или вообще не отрендерится).

```
data/schema.json|.json   объявление: тип, варианты, параметры, contract_classes
engine/render.js         RENDER[type] = { raw, fn } + функция рендера блока
engine/map.js            type: { css[], extraJs[], dataKey, kind }  — что подключить в превью
data/template/css/*.css  классы разметки (и images/ для картинок)
data/demo/*.js           демо-данные превью, если блок с данными
```

## Порядок работы

1. **Осмотреться.** `node .opencode/skills/pc-schema/scripts/pc.mjs type <id>` — какие
   поля уже есть. Похожий тип найти так: `pc.mjs types --group <группа>`, `pc.mjs grep <слово>`.
2. **Схема.** Добавить/изменить вариант в `data/schema.json` и зеркально в `data/schema.js`
   (или в `svcms-templates/page_constructor/schema/block-schema.json` и перегенерировать —
   это первоисточник, движок сюда приходит автогенерацией).
3. **Рендер.** Открыть `engine/render.js` по `rg` (файл 1985 строк — целиком не читать):
   - сама функция рендера в стиле остальных — `var` + IIFE, HTML собирается строками через
     `el(tag, attrs, inner)`, текст экранируется `esc`/`escapeHtml`;
   - запись в диспетчер: `var RENDER = { … }` (`render.js:1817`), одна на тип, 56 записей;
   - `raw: true` — без обёртки `<section class="section"><div class="container">`, иначе
     обёртку добавляет `renderBlock` (`render.js:1909`), он же печатает `.page-head`
     (H1 + крошки) и `section-head`;
   - один тип может рендериться функцией другого (как `page_video` → `renderVideo`).
4. **Карта превью.** `engine/map.js`: добавить запись `type: { css: ['css/<file>.css'], kind: 'static', dataKey?: '<file>' }`.
   Нет записи — `kind` молча станет `static` без своих css/js. `dataKey` → файл
   `data/demo/<file>.js`, который превью подтянет по `data-url`. `extraJs` — если блоку
   нужен свой JS из шаблона. Глобальные `cssBase`/`commonJs` — то, что нужно всем страницам.
5. **CSS.** Каждый класс разметки должен существовать в `data/template/css`.
   Проверка: `node .opencode/skills/pc-schema/scripts/pc.mjs classes <id>` — `ok`/`MISS`.
6. **Данные.** Тип с запросом помечай `items_are_data: true` (тогда `items` не сохраняются)
   и положи демо-данные в `data/demo/`.
7. **Проверить.**

```shell
npm run constructor:pack                 # data/template|data/demo → public/page_constructor + asset-rev.json
node .opencode/skills/pc-schema/scripts/pc.mjs check
```

`check` печатает: типы/варианты/contract_classes, исключения и пустой HTML из `render.js`,
типы без записи в `map.js`.

## Параметры и поведение

- Виджет поля выбирается по `kind`: `text`/`textarea`/`number` (`v-model.number`)/`select`
  (+ `allowCustom` → опция `__custom__`)/`bool`. Нет отдельной формы под тип — всё рисует
  `formParams(block)` в `BlockEditor.vue:565` через `PC.variantParams`.
- «Вид блока» — это select с именем `show|view|display` и он важнее `variants`
  (`viewParam`, `BlockEditor.vue:635`). Не называй обычные параметры так.
- `page_head` / `page_head_hidden` печатают H1 страницы и крошки и гасят `section-head`
  блока. Если вешаешь `page_head` — не рисуй заголовок ещё раз в разметке.
- Данные типа-компонента: `kind` в `map.js` (`hero-slider`, `catalog-block`, `goods-block`,
  `carousel`, `news-list`, `good-list`, `good-in`, `catalog-projects`) говорит рендеру, куда
  подставить демо-данные.
- Конверт (`fill`, `anim`, `bleed`) лежит рядом с `params`, не внутри; на экспорте
  `compactParams` выкидывает `null`/`''`.

## Правка чужого блока

- Формат документа v2 (`svcms.page_blocks`, `version: 2`) и `domain_page.blocks` не менять
  без миграции.
- Первичные правки разметки — в `svcms-templates`, потом перенос в `engine/` и `data/template/`.
- `engine/map.js` содержит дубли ключей (`photo_gallery`, `brands_grid`, `tabs`,
  `history_timeline`, `org_chart`, `reports`) — при правке проверь, что не осталось второго
  дубля, побеждает последний.

Детали рендера, превью и документации — `agent-doc/page-constructor.md`, отладка превью —
скилл `pc-preview`.