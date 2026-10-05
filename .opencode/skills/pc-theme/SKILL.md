---
name: pc-theme
description: Use when working on the page constructor theme — the four axes color/style/layout/font in theme_defs.js, ThemeAxes/ThemeTool/ThemePreview.vue, theme schemes in DB (domain_theme_*), custom CSS generation, cascade order, LAYOUT_PRESETS, decor tokens, or the site link theme/<domain_id>/styles.css.
---

# Тема конструктора страниц

Оси `color`, `style`, `layout`, `font`. Схемы живут в БД, статические пресеты — в CSS
шаблона, генераторы — в `theme_defs.js`.

```
theme_defs.js    AXES: поля осей + facts (cssVar → поле) + build_color/style/layout/font,
                 LAYOUT_PRESETS (7 компоновок), DECOR_CSS/DECOR_RESET, default_values,
                 SHOWCASE_CSS/HTML (превью-витрина)
ThemeAxes.vue    4 селекта + tune + предупреждение о несохранённом
ThemeTool.vue    полноэкранный редактор одной оси, список схем из БД, drag-resize
ThemePreview.vue мини-витрина темы в iframe
```

## Оси и поля

| Ось | Поля (id → токен/эффект) |
|---|---|
| `color` | `base` light\|dark, `primary` `--primary`, `secondary`, `accent`, `cart`, `body-bg`, `surface`, `body-color`, `heading`, `muted`, `strip` |
| `style` | `radius` `--radius`, `radius-lg`, `border` `--border-width`, `shadow-i` `--shadow-color`, `shadow` none\|soft\|hard, `padx` `--btn-pad-x`, `cardpad` `--card-pad`, `corner`/`corner-w` → `--corner-tick`/`--corner-tick-width`, `hover` lift\|none\|press, `decor` (украшение `.section-title`) |
| `layout` | `preset` (из `LAYOUT_PRESETS`), `container` `--container`, `gutter`, `section-gap`, `header-height`, `grid-gap`, `head-gap`, `head-space`, `h1`/`h2`/`h3`/`base`, `hw`, `grid-size` |
| `font` | `body` `--font`, `heading` `--font-heading`, `size` `--font-size-base`, `lh`, `hw`, `ls` |

Пресеты компоновки: `standard`, `industrial`, `elegant`, `editorial`, `wide`, `compact`,
`technical` — зеркалят `data/template/css/themes/layout/*.css`.
Цвета 16 схем в `css/themes/colors/`, стили 12 в `css/themes/style/`.
`@font-face` — `css/fonts.css`; пресеты шрифтов — `FONTS` в `engine/preview.js`.

## Каскад

**color → layout → style → font**, затем `customCss`. Тот же порядок в бэкенде
(`THEME_ORDER`), сайт подключает `<link …/page-constructor/theme/<domain_id>/styles.css>`.
`decor` живёт в оси `style` и префиксуется `DECOR_RESET`, чтобы гасить оформление
заголовков, пришедшее от пресета компоновки. Токены вне осей — `css/tokens/_tokens-base.css`.

Где применяется CSS:

- в редакторе оси — `ThemeTool` строит `css = AXES[axis].build(values)` и вставляет в iframe превью;
- кастомные схемы хранят этот CSS в БД, и `PageConstructor.build_custom_css` склеивает
  css всех кастомных осей в `config.customCss`, который превью вставляет после осей;
- пресеты схем подключаются файлами по имени (`map.js`: `css/themes/<axis>/<name>.css`).

## Сохранение (двухфазное)

Выбор схемы только помечает ось (`theme_dirty`/`theme_pending`) и пересобирает превью;
`save_theme()` батчит `POST /theme/save {domain_id, axis, name, css, scope}` по всем грязным
осям. Уход без сохранения спрашивает: `leave_theme_guard` + `beforeRouteLeave` + `beforeunload`,
диалоги `theme_confirm*`. Пустой `css` = просто выбрать пресет.

`scope: 'shared'` («Общая схема для всех доменов») пишет в `domain_id=0`, `domain` — в
схему домена; одноимённая индивидуальная перекрывает общую, ключ схемы — `header`.

Таблицы: `domain_theme_color|style|layout|font`, PK `(domain_id, header)`, поля
`label, short, descr, css, sort, is_default, is_custom`. Выбор осей домена — `domain_constructor`.
Дефолты бэкенда: `color=digitalstrateg`, `style=soft`, `layout=standard`, `font=inter`.

## Правки

1. **Новое поле оси** — `AXES.<axis>.fields` + генератор `build_<axis>()`; если поле
   приходит из CSS-схемы, продублируй дефолт в `LAYOUT_PRESETS` (для layout).
2. **Новая схема** — файл `templates/<t>/css/themes/<axis>/<name>.css` в `svcms-templates` →
   импорт в `domain_theme_<axis>` (`domain_id=0`) → зеркало `data/template/css` →
   `npm run constructor:pack` → превью/сайт подхватят файл по имени.
3. Правку в `data/template/css` видно только после `npm run constructor:pack`
   (`?nc=` из `asset-rev.json`).
4. `ThemeTool` — Vuetify 3: заголовок группы списка задаётся как
   `{ props: { header, disabled }, title }`, а не `{ header }` (иначе `[object Object]`).

Контекст: `agent-doc/page-constructor.md`, `RULES.md` компонента.