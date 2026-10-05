---
name: pc-schema
description: Use when working with the page constructor block schema (src/components/svcmsAdmin/page_constructor) — questions like "what fields does block X have", "which blocks use param page_head", "list block types/groups/variants", "add a variant to schema.json", or editing schema.js/schema.json. Never read those files (11k lines, 376 KB) — query them through the bundled CLI.
---

# Схема блоков конструктора страниц

`data/schema.js` (11k строк, 376 КБ) — автогенерируемый дамп, читать его нельзя.
`data/schema.json` — его побайтово равное зеркало, годное под `require`.
Всё, что нужно о схеме, отдаёт CLI: **работает из любого каталога**.

```shell
P=.opencode/skills/pc-schema/scripts/pc.mjs

node $P groups                       # 12 групп + счётчики типов
node $P types                        # все типы: id, группа, дефолтный вариант, title, флаги
node $P types --group Медиа          # фильтр по группе (или --flags — только с флагами)
node $P type slider                  # ВСЁ про тип: варианты, params, items.fields, contract_classes, map.js
node $P type slider --json           # сырой объект типа
node $P variants галерея             # только имена вариантов (fuzzy по id/title) + счётчики
node $P param page_head              # обратный индекс: где встречается параметр
node $P classes product_detail       # contract_classes + паритет с data/template/css
node $P grep хлебные                 # поиск по id/title/keywords/label параметров (ru/en)
node $P envelope                     # поля конверта блока: fill, anim, bleed, class_map
node $P check                        # все типы рендерятся? все есть в engine/map.js?
node $P diff HEAD                    # что изменилось в схеме относительно git-рефы
```

## Формат

Сверху ровно 5 ключей: `version`, `schema_id` (`svcms.page_blocks`), `comment`, `envelope`, `types`.
Сейчас **56 типов / 102 варианта / 217 contract_classes / 12 групп**.

```jsonc
types.<id> = {
  title, group, default_variant, status, check,      // 'strict' | 'preview'
  partial: "block/<name>.html",                       // партиал в svcms-templates
  structural, once, data, items_are_data, views,      // флаги поведения
  shared_params: { <ref>: [ {name,label,kind,default,options?,hint?,allowCustom?} ] },
  items_shared:    { fields: [...], default: [ {...} ] },
  contract_classes: ["note", "custom-block"],             // обязаны существовать в CSS
  keywords: [...],
  variants: { <variant>: { title, params|[params_ref], items: { fields, default, note? } } }
}
```

`kind` параметра: `text` · `textarea` · `number` · `select` (`options:[{value,label}]`) · `bool` · `image`.
`itemFields` и `sampleItems` разрешаются так же, как в движке: `items.fields` → `items_shared.fields`.

Флаги, которые меняют поведение движка:

| Флаг | Смысл |
|---|---|
| `structural` | блок уровня домена (шапка/подвал); палитра в `role="structure"` показывает только их |
| `once` | максимум один на страницу |
| `data` | у блока есть источник данных |
| `items_are_data` | `items` приходят из запроса и **выбрасываются при экспорте** (`export.js` `normalizeBlock`) |
| `partial` | путь партиала-первоисточника в `svcms-templates` |

Конверт блока (`envelope.fields`): `type`, `variant`, `fill` (`""`…`fill-5`), `anim` (`""`/`anim-zoom`/`anim-clip`/`no-anim`), `bleed`.
`class_map`: `fill` → `block--<value>`, `anim` → `block--<value>`, `bleed` → `block--bleed`.

## Правка схемы

`schema.js` и `schema.json` — **зеркала**: правишь оба (или генератор
`agent-doc/tools/gen_page_constructor.py` в `svcms-templates`, он первоисточник —
`svcms-templates/page_constructor/schema/block-schema.json`).

1. `node $P type <id>` — посмотреть текущее состояние.
2. Правка `data/schema.json` + синхронно `data/schema.js` (внутри — JSON-литерал, отступы 2).
3. `node $P diff HEAD` — убедиться, что затронуто только нужное.
4. `node $P check` — все типы должны рендериться.

Осторожно: `engine/render.js` (диспетчер `RENDER`, 56 записей) и `engine/map.js`
должны знать про новый тип/вариант, иначе он не появится в превью — см. скилл
`pc-block`. Поля параметров редактор рисует сам (`formParams` → `PC.variantParams`),
отдельных компонентов под каждый тип нет.

Дальше: слои движка, превью, редактор, тема — `agent-doc/page-constructor.md`,
`src/components/svcmsAdmin/page_constructor/RULES.md`.