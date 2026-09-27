# Дизайн-система

## Схемы

Номер схемы задаётся во фронтенд-конфиге `public/configure.js` → `config.schema` (0..3, статично; тенант/деплой).
Читается в `src/main.js` (`getScheme`), применяется до `mount`. Dev-переключатель: `?schema=N` в URL.

Каждая схема (`src/theme/schemes.js`): типографика (в т.ч. шрифт), отступы, радиусы, стиль полей, elevation, цвета, режим.

| | 0 default | 1 compact | 2 soft | 3 dark |
|---|---|---|---|---|
| Режим | light | light | light | dark |
| Шрифт | Roboto | Inter | Nunito | Inter |
| h1 / h2 | 28/20 | 22/18 | 30/22 | 28/20 |
| label/value/desc | 12/14/12 | 11/13/11 | 13/15/13 | 12/14/12 |
| gap полей | 16 | 12 | 20 | 16 |
| section gap | 24 | 16 | 32 | 24 |
| radius field/card/btn | 5/8/4 | 4/4/2 | 10/16/999 | 8/8/4 |
| поле | outlined compact | outlined compact | filled default + rounded | outlined compact |
| primary | `#253a5d` | `#1565c0` | `#6a1b9a` | `#90caf9` |

Шрифты подключены self-hosted: `@fontsource/inter`, `@fontsource/nunito` (Roboto — системный).

## Как применяется

- Цвета: `createVuetify({ themes: { s0..s3 } })`, `theme.global.name = 's'+id`; SCSS читает `rgb(var(--v-theme-*))`.
- Токены (шрифт/размеры/отступы/радиусы): `main.js` выставляет CSS-переменные `--app-*` на `documentElement`; дефолты — в `:root` (`main.scss`). Важно: дефолты должны быть в `:root`, а не в `.v-application`, иначе перекрывают значения из JS.
- Стиль полей: `createVuetify({ defaults })` + `<v-defaults-provider :defaults="$schemeDefaults">` в `App.vue` (глобальные дефолты Vuetify перекрываются провайдером).
- Цвета уровней дерева: `AdminTree/branch.vue:cur_color` из `$scheme.colors.treeLevels`.

## Токены и правила отступов

| Токен | Смысл |
|---|---|
| `--app-space-unit` | базовый шаг (4px) |
| `--app-space-field` | вертикальный шаг между полями формы |
| `--app-space-section` | между блоками/секциями |
| `--app-space-inline` | внутри групп (чекбоксы, строки) |
| `--app-radius-field/card/btn/chip` | радиусы |
| `--app-font-family/h1/h2/value/label/desc` | типографика |

**EditForm (с блоками и без)**
- Один источник шага: `.field { margin-bottom: var(--app-space-field) }`; `.field .v-input { margin-bottom: 0 }`.
- Описание: `margin: 0 0 4px`; clear/«очистить» `margin-top: 4`.
- Блоки: тулбар 40, тело 16, между блоками `var(--app-space-section)`.

**AdminTable**
- h1 → «Добавить» 8; «Добавить» → фильтры ≈16; строка фильтра 36; результаты header/строка 40; пагинация 32.
- У `v-col` без класса `v-col` (только `v-col-md-4` и т.п.) селектор — `[class*="v-col"]`.

**Фильтры (date/datetime/memo)**
- `.description { margin: 5px 0 4px }`; `.v-input__details` в фильтре скрыт (`:deep`), иначе пустые `v-messages` дают ~22px снизу.

**AdminTree**
- Строка 44, gap 4, indent 24/уровень, plus/minus 16, цвета — из схемы.

## Проверка
- `?schema=0..3` на `shell`, `admin_table/news`, `admin_tree/catalog`, `edit_form/news/1`: `--v-theme-primary`, шрифт, h1, радиусы, вариант поля и `--app-space-field`.
- Сборки `default/trade/svcms` + smoke (0 ошибок/предупреждений).
