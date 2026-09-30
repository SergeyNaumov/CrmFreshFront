# Design system

> Load when: spacing, colors, field look, scheme-dependent styling.
> Canonical for: schemes 0..3, `--app-*` tokens, per-screen spacing.

Color mechanism (`src/theme/palette.js`, `rgb(var(--v-theme-*)`), scheme application, link color → [architecture.md](architecture.md). Converted Vuetify-2 selectors and default-field look → [migration-vue3.md](migration-vue3.md).

## Schemes

Scheme number = `public/configure.js` → `config.schema` (0..3, static per tenant), read in `src/main.js` (`getScheme`), applied before `mount`; dev switch `?schema=N`. Definitions in `src/theme/schemes.js`: typography incl. font, spacing, radii, field style, elevation, colors, mode.

| | 0 default | 1 compact | 2 soft | 3 dark |
|---|---|---|---|---|
| Mode / font | light / Roboto | light / Inter | light / Nunito | dark / Inter |
| h1 / h2 | 28/20 | 22/18 | 30/22 | 28/20 |
| label/value/desc | 12/14/12 | 11/13/11 | 13/15/13 | 12/14/12 |
| field gap | 16 | 12 | 20 | 16 |
| section gap | 24 | 16 | 32 | 24 |
| radius field/card/btn | 5/8/4 | 4/4/2 | 10/16/999 | 8/8/4 |
| field | outlined compact | outlined compact | filled default + rounded | outlined compact |
| primary | `#253a5d` | `#1565c0` | `#6a1b9a` | `#90caf9` |

Fonts self-hosted: `@fontsource/inter`, `@fontsource/nunito`; Roboto is the system font.

Applied as: colors `createVuetify({ themes: { s0..s3 } })` + `theme.global.name = 's'+id`; tokens `--app-*` set by `main.js` on `documentElement`, defaults in `:root` of `main.scss` (**not** `.v-application`, else they override JS); field style `createVuetify({ defaults })` + `<v-defaults-provider :defaults="$schemeDefaults">` in `App.vue` (provider wins over global defaults); tree colors `AdminTree/branch.vue:cur_color` from `$scheme.colors.treeLevels`.

## Tokens

`--app-space-unit` (4px) · `--app-space-field` (between fields) · `--app-space-section` (between blocks) · `--app-space-inline` (inside groups) · `--app-field-height` (40 compact / 56 soft) · `--app-radius-field/card/btn/chip` · `--app-font-family/h1/h2/value/label/desc` · `--app-tint` (neutral background for row striping, handles, underlays; low-alpha primary rgba, works in dark).

## EditForm

- `.field { margin-bottom: var(--app-space-field) }`; `.field .v-input { margin-bottom: 0 }`; description `margin: 0 0 4px`; clear link `margin-top: 4`; blocks toolbar 40 / body 16, `var(--app-space-section)` between blocks.
- Cards (`FormBody.vue`) `.v-card.block`/`.v-card.block_card`: border `rgba(var(--v-theme-on-surface), .14)`, radius `var(--app-radius-card)`, soft shadow; `.block_body { padding: 16px 20px 12px }`; `framed=false` (`FormInBranch`) → flat card.
- Field icon (`FormBlock.vue`): square left of the control (`.control_row` → `.field_icon` + `.control_body`), size `--app-field-height`, aligned with `.v-field`, background `var(--app-tint)`; MDI/FA/bare names.
- Narrow fields (`date`/`time`/`datetime`/`daymon`/`yearmon`): `max-width` from `field.style`/`field.width`, default 200px (`fields/field_style.js`); `date` clearing = `clearable` cross (`click:clear`), not a link.
- Container `width:100%; max-width:1200px; margin:0 auto`; `:class="'md'+N"` → `:md="N"`; `text-lg-center` is a class.
- Left edges aligned to the header: no `div.field{margin:0 20px}`; no horizontal padding on the card/nested `v-col` (`div.field [class*="v-col"]{padding-left/right:0}`); `h1.form_header{margin-top:15px}`; `.v-field--variant-outlined{border-radius:5px}`; textarea `padding:8px 5px`.
- Vuetify 3 defaults to `filled` 56px vs Vue 2 outlined ~40px → `variant:'outlined', density:'compact'` in `createVuetify({ defaults })` for `VTextField`/`VTextarea`/`VSelect`/`VAutocomplete`/`VCombobox`/`VFileInput`, `density:'compact'` for `VCheckbox`/`VSwitch`, `theme.rounded=false` (4px).
- Current selectors `.v-field`, `.v-field__input`, `.v-field__prepend-inner`, `.v-field-label--floating` (10px, `rgb(var(--v-theme-primary))`). All Vuetify 2 selectors (`.v-input__slot`, `.v-select__slot`, `.v-card__title`, `.v-toolbar__title`, `.v-treeview-node__*`, …) are gone; `:deep()` for internals in scoped styles.

## Date/time picker

- Month/year grids `.v-date-picker-months/years__content` 3 columns; picker buttons need `margin:0` (global `button { margin: 1rem }` breaks the layout, adds horizontal scroll); day grid `repeat(7, minmax(0,1fr))`, day button 32px; 12px after the colored header; months `height:auto`, years fixed height + scroll.
- `main.scss`: `.v-picker-title`, `.v-date-picker-header__content`, `.v-picker__header`, `.v-date-picker-header` hidden; `.v-picker` column `minmax(0,1fr)`; `.v-date-picker-month__days` `repeat(7,34px)`, days 34×34 (button 28px), width 340px, `overflow:hidden`. Controls: `__month` = ‹ › arrows (32px), `__month-btn` = month, `__mode-btn` = year (28px).
- Colors from the scheme: `color="primary"` on the pickers, `.v-date-picker-controls` background `primary`, controls `on-primary`. Locale `createVuetify.locale` = `{ locale: 'ru', fallback: 'en', messages: { ru, en } }` (`vuetify/locale`; without `messages` → `$vuetify.*` warnings); `locale="ru-RU"` on `v-date-picker` is ignored. Vuetify 3.5 needs a `Date`, not a string → `:model-value="$toDate(x)"` + `@update:model-value="x=$toIso($event); handler"`.

## AdminTable

- h1 → «Добавить» 8; «Добавить» → filters ≈16; filter row 36; results header/row 40; pagination 32 (32×32 squares with border, active `primary` + white text, `gap:2px`, `margin:0.1rem`); filter toolbars white (`.filters .v-toolbar`).
- `FindResults`: `.results thead tr` → `rgb(var(--v-theme-primary-lighten-4))`, even rows `.results tbody tr:nth-child(2n+1)` → `primary-lighten-5`; dark: header `rgba(primary,.2)`, rows `var(--app-tint)`; `th` color `primary`.
- `v-col` without a bare `v-col` class needs `[class*="v-col"]`; `result_objects/form.vue`: `class="row"` → `d-flex align-center`; grid attrs `sm12/lg7` fixed; `:outlined` → `variant`; `filters/multiconnect.vue` must normalize `field.value=false` → `[]`.
- Filter checkboxes `:model-value` + `@update:model-value="filter_toggle(f, $event)"` (a `v-model` conflict hid the «искать» button). `.filter_block.v-input{display:flex;align-items:center}`, `.v-label{margin-bottom:0}`, `.v-input__details` hidden (`:deep`, else ~22px empty `v-messages`); used filters `.onfilter .v-field`/`.v-field__input` `min-height:40px`, padding 6px; card `margin-top:10px`.
- Drag handle `.drag_area`: 22px bar + 18×18 round icon (OnFilters variant 14px + 14×14). Date filter «С/По»: `md="auto"`, field `width:220px`, `.v-row{gap:16px}`.

## AdminTree

Row 44, gap 4, indent 24/level, plus/minus 16 (`size="x-small"`), colors from the scheme, `.plus-icon{margin-right:6px; vertical-align:middle}`.

## Verification

`?schema=0..3` on `shell`, `admin_table/news`, `admin_tree/catalog`, `edit_form/news/1`: `--v-theme-primary`, font, h1, radii, field variant, `--app-space-field`; plus builds `default/trade/svcms` + smoke → [verification.md](verification.md).