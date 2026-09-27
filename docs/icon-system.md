# Система иконок

## Источники

| Система | Как подключается | Нотация в коде | Пример |
|---|---|---|---|
| MDI | `import '@mdi/font/css/materialdesignicons.css'` в `main.js` | `<имя>` (голое) или `mdi-<имя>` | `<v-icon>edit</v-icon>`, `<v-icon>mdi-close</v-icon>` |
| FontAwesome 5 | `public/index.html` → `dist/fontawesome/all.css` | `fa fa-<имя>`, `fas`, `far` | `<v-icon>fa fa-trash</v-icon>` |
| Material Icons | `public/index.html` → `dist/googleapis.com-Material-plus-Icons.css` | лигатуры (`.material-icons`) | css подключён, но класс Vuetify не ставит → фактически не используется |

Важно: `src/plugins/vuetify.js` (с `iconfont: 'mdi'`) **нигде не импортируется**. Реальную Vuetify-инстанцию создаёт `main.js` без блока `icons`, поэтому действует дефолт Vuetify 2 `iconfont: 'mdi'`:
- голое имя `edit` → CSS-класс `mdi mdi-edit`;
- явное `mdi-close` → `mdi mdi-mdi-close` (ломается);
- `fa fa-trash` → классы `mdi mdi-fa fa-trash` + текст (`fa fa-trash`) — рендер нестабилен.

## Что реально встречается

По grep `src/**/*.vue`:
- Голые (MDI): `edit` (8), `keyboard_arrow_up`/`keyboard_arrow_down` (по 4), `delete` (4), `insert_drive_file`, `filter_list`, плюс динамические `{{item.icon}}`, `{{td.value}}`, `{{sp.icon}}`, `{{selected_icon}}`, `{{full_icon_name(l)}}`.
- `mdi-*`: `mdi-close`, `mdi-delete`, `mdi-pencil`, `mdi-heart`, `mdi-folder`, `mdi-dots-vertical`.
- FontAwesome: `fa fa-trash`, `fa fa-save`, `fa fa-pencil-alt`, `fa fa-minus`, `fa fa-search`, `fa fa-plus`, `fa fa-home`, `fa fa-comments`, `fa fa-phone`, `fa fa-question`, `fa fa-bomb`, `fa-user-alt`, `fa-user-edit`, `fa-calendar-alt`, `fa-eye`, `fa-eye-slash`, `fas fa-file-upload`, `far fa-window-close`, `far fa-paper-plane`, `fa-{{show?'chevron-down':'chevron-right'}}`.

`fields/font-awesome.vue` загружает `BaseUrl + 'dist/json/awesome.json'` — список имён FA для выбора в форме.

## Цель: сохранить все три системы на Vuetify 3

Vuetify 3 по умолчанию тоже использует набор `mdi` (`mdi-${icon}`), но:
- явный `mdi-close` превратится в `mdi-mdi-close`;
- `fa fa-*` не поддержан.

Решение — кастомный icon set (например `src/plugins/icons.js`), передаваемый в `createVuetify({ icons: { defaultSet: 'legacy', sets: { legacy } } })`:

```js
// src/main.js — LegacyIcon
const legacy = {
  component: (props) => {
    const i = props.icon
    if (/^(fa|fas|far|fab|fal|fad)\s/.test(i)) return h('i', { class: i })          // 'fa fa-home', 'fas fa-x'
    if (/^fa-[a-z0-9-]+$/i.test(i))             return h('i', { class: ['fa', i] })  // 'fa-trash' → 'fa fa-trash'
    if (/^mdi-/.test(i))                        return h('i', { class: ['mdi', i] })
    return h('i', { class: ['material-icons'] }, i)                                 // голое имя → Material Icons лигатура
  },
}
```

Важно:
- Голые имена (`edit`, `delete`, `keyboard_arrow_up`, `filter_list`, `insert_drive_file`) рисуются как **Material Icons лигатуры** (self-hosted `public/dist/font.ttf`), потому что в `@mdi/font@4.9.95` их нет (`mdi-edit`, `mdi-keyboard_arrow_up` и т.п. отсутствуют). Так было и в Vuetify 2 (iconfont `md`).
- `fa-<name>` без пробела обязательно получает базовый класс `fa` — иначе браузер не применяет семейство FontAwesome.
- `mdi-*` — только реальные имена MDI (алиасы Vuetify, напр. `$close` → `mdi-close`).

- Библиотеки не меняем: `@mdi/font@4.9.95`, `public/dist/fontawesome`, `public/dist/googleapis.com-Material-plus-Icons.css`.
- Проверить в браузере, рендерятся ли `{{item.icon}}` (серверные имена) и что для них ожидается (MDI vs Material Icons) — при необходимости добавить ветку Material Icons (`<i class="material-icons">{{icon}}</i>`).

## TODO при миграции

- Решить судьбу `src/plugins/vuetify.js` (удалить как мёртвый или сделать рабочим).
- `v-icon small|x-small` → `size="small"|"x-small"`.
- Проверить размеры: `.v-icon {font-size: ...}` в SCSS (`left_menu_item.vue`) может конфликтовать с новым DOM Vuetify 3.
