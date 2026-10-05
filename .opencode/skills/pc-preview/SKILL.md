---
name: pc-preview
description: Use when debugging the page constructor preview — block renders empty, unstyled, without data or images, iframe blank/white, stale CSS after editing data/template, iframe errors. Covers the render → srcdoc pipeline, data-url resolution, ?nc= cache-busting, window.__pcErrors, and the causes that fail silently.
---

# Отладка превью конструктора

Превью — не отдельная вкладка движка: `render.js` даёт только HTML, документ
собирает `engine/preview.js`. Поломка в одной части выглядит как «пустое превью».

```
PC.renderAll(blocks) / PC.renderBlock(block)   блоки → HTML
  → data-data-key="<key>"                      рендер помечает, откуда данные
PC.buildPreviewDoc(markup, type|type[])          preview.js:122 — документ iframe
  → resolveDataKeys → абсолютный data-url = <dataBase>/js/data/<key>.js
  → <base href="<templateBase>"> + ?nc=<mtime из asset-rev.json> на каждый css/js
  → css base → оси темы (color → layout → style → font) → customCss
  → NO_NAV_SCRIPT (гасит переходы) + сборщик window.__pcErrors
```

Три iframe: aside (выбранный блок, debounce 300 мс), модалка блока, модалка страницы.
Метка — атрибут `data-pc-frame` (`aside|modal|page`); `guardFrame` (опрос 700 мс) и
`restoreFrame` пересобирают `srcdoc`, если документ в iframe сменился (например превью
уехало по ссылке).

## Диагностика по симптому

| Симптом | Причина / что делать |
|---|---|
| Блок пустой, без своих стилей | нет записи в `engine/map.js` → `kind: static`, свои css/js не подключены. `pc.mjs check` покажет список таких типов (сейчас `about`, `page_contacts`) |
| Блок без данных/картинок списка | нет `dataKey` и `sampleItems` в схеме; проверь файл `data/demo/<key>.js` и `resolveDataKeys` |
| Правка `data/template/css/*.css` не видна | не выполнен `npm run constructor:pack` — превью грузит `public/page_constructor/template`, а `?nc=` берётся из `asset-rev.json` (пишется тем же скриптом) |
| 404 на css/js в iframe | неверный `templateBase`: хост берёт `d.templateBase` из `POST /init`, фолбэк `BaseUrl + 'page_constructor/template/'`. Проверь `window.PAGE_CONSTRUCTOR_CONFIG` |
| Ошибки JS/CSS превью | в консоли iframe: `window.__pcErrors` |
| iframe белый / уехал на 404 | это нормально ловится `NO_NAV_SCRIPT`; если уехал — сработал `restoreFrame` |
| Шапка/подвал пустые | структурные блоки требуют схемных дефолтов (`withDefaults`: nav/favorite/cart/phone = `true`); в `role="page"` берутся из props |
| Стили схемы не те | каскад color → layout → style → font, потом `customCss`; проверить, что не перекрыла ось `style` (`decor` + `DECOR_RESET`) |

Быстрый срез без UI:

```shell
npm run constructor:pack
node .opencode/skills/pc-schema/scripts/pc.mjs type <id>       # что подключит превью (map.js) и какие поля
node .opencode/skills/pc-schema/scripts/pc.mjs classes <id>    # все ли классы есть в CSS
node .opencode/skills/pc-schema/scripts/pc.mjs check
```

Прогнать рендер одного блока в node (быстрее, чем в браузере): CLI умеет
`pc.mjs type <id>`; для «а что получится в HTML» — `PC.renderBlock` из
`engine/render.js` подгружается тем же способом, что и в CLI (в node нельзя импортировать
`engine/index.js`: `data/demo/*.js` требуют DOM).

## Правки превью

- `preview.js` резолвит `templateBase` и добавляет `?nc=` (`assetRev`) — не убирай,
  иначе правки css/js перестанут доезжать без жёсткой перезагрузки.
- Демо-данные лежат в `data/demo/*.js` и копируются в `public/page_constructor/js/data/`
  (в git не хранится) — правь источник, не копию.
- Превью картинок берутся из `data/template/images/`; расхождения с `templates/t1/images/`
  лечатся синхронизацией оттуда.
- Смена темы пересобирает превью через проп `configRev` (хост бампает `theme_rev`).

Контекст: `agent-doc/page-constructor.md`, `RULES.md` компонента, скилл `pc-block`.