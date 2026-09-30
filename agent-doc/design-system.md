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
| `--app-field-height` | высота контрола (40px компакт, 56px soft) — для иконок/выравнивания |
| `--app-radius-field/card/btn/chip` | радиусы |
| `--app-font-family/h1/h2/value/label/desc` | типографика |
| `--app-tint` | нейтральный фон для чередования строк, плашек-хэндлов, подложек (схема задаёт rgba primary с низкой альфой; работает и в dark) |

**EditForm (с блоками и без)**
- Один источник шага: `.field { margin-bottom: var(--app-space-field) }`; `.field .v-input { margin-bottom: 0 }`.
- Описание: `margin: 0 0 4px`; clear/«очистить» `margin-top: 4`.
- Блоки: тулбар 40, тело 16, между блоками `var(--app-space-section)`.
- Карточки (`FormBody.vue`): `.v-card.block` / `.v-card.block_card` — граница `rgba(var(--v-theme-on-surface), .14)`, радиус `var(--app-radius-card)`, мягкая тень; тело `.block_body` — `padding: 16px 20px 12px` (поля не прилипают к краям). Проп `framed=false` (модалка `FormInBranch`) делает карточку «плоской» (без границы/тени/фона) — чтобы не было карточки в карточке.
- Иконка поля: `field.icon` (`FormBlock.vue`) — квадрат слева от контрола (`.control_row` → `.field_icon` + `.control_body`), высота/ширина = `--app-field-height` (40px компакт, 56px soft), верх/низ совпадают с `.v-field`; фон `var(--app-tint)`. Поддерживаются MDI/FontAwesome/голые имена.
- Узкие поля (`date`/`time`/`datetime`/`daymon`/`yearmon`): `max-width` из `field.style` или `field.width`, по умолчанию 200px (`fields/field_style.js`).
- Date picker (режимы месяца/года): сетки `.v-date-picker-months/years__content` — 3 колонки, кнопки внутри пикера без `margin` (иначе глобальный `button { margin: 1rem }` ломает раскладку и появляется горизонтальный скролл), `main.scss`. Сетка дней месяца растянута на всю ширину (`repeat(7, minmax(0,1fr))`), кнопка дня — 100% ширины, высота 32px; отступ после цветной шапки — 12px (`padding` у `.v-date-picker-month` / `.v-date-picker-months` / `.v-date-picker-years`); месяцы — `height:auto` (без скролла), годы — фиксированная высота с вертикальным скроллом.
- Поле `date`: очистка — `clearable`-крестик внутри поля (`click:clear`), а не ссылка «очистить».
- Цвета date/time picker — из схемы: на `<v-date-picker>`/`<v-time-picker>` передан `color="primary"`; шапка — цветная строка `.v-date-picker-controls` (фон `primary`, контролы `on-primary`); `.v-picker__header`/`.v-date-picker-header` скрыты, чтобы шапка не перекрывала сетку (`main.scss`).

**AdminTable**
- h1 → «Добавить» 8; «Добавить» → фильтры ≈16; строка фильтра 36; результаты header/строка 40; пагинация 32.
- `FindResults`: заголовок `.results thead tr` — `rgb(var(--v-theme-primary-lighten-4))` (насыщеннее строк), чётные строки `.results tbody tr:nth-child(2n+1)` — `primary-lighten-5` (как `$lighten5` в Vuetify 2); для тёмной схемы: шапка `rgba(primary,.2)`, строки `var(--app-tint)`; `th` — цвет `primary`.
- У `v-col` без класса `v-col` (только `v-col-md-4` и т.п.) селектор — `[class*="v-col"]`.

**Фильтры (date/datetime/memo)**
- `.description { margin: 5px 0 4px }`; `.v-input__details` в фильтре скрыт (`:deep`), иначе пустые `v-messages` дают ~22px снизу.

**AdminTree**
- Строка 44, gap 4, indent 24/уровень, plus/minus 16, цвета — из схемы.

## Проверка
- `?schema=0..3` на `shell`, `admin_table/news`, `admin_tree/catalog`, `edit_form/news/1`: `--v-theme-primary`, шрифт, h1, радиусы, вариант поля и `--app-space-field`.
- Сборки `default/trade/svcms` + smoke (0 ошибок/предупреждений).
