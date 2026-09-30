# Icon system

> Load when: adding or fixing an icon, or migrating icon rendering.
> Canonical for: the three icon sources, notation, the custom Vuetify icon set, icon TODOs.

Package versions: [dependencies.md](dependencies.md).

## Sources

| System | Loading | Notation |
|---|---|---|
| MDI | `import '@mdi/font/css/materialdesignicons.css'` in `main.js` | `<name>` (bare) or `mdi-<name>` |
| FontAwesome 5 | `public/index.html` → `dist/fontawesome/all.css` | `fa fa-<name>`, `fas`, `far` |
| Material Icons | `public/index.html` → `dist/googleapis.com-Material-plus-Icons.css` | ligatures (`.material-icons`); css loaded but Vuetify adds no class → effectively unused |

`src/plugins/vuetify.js` (with `iconfont: 'mdi'`) is **never imported**; the Vuetify instance in `main.js` has no `icons` block, so under Vuetify 2 bare `edit` → `mdi mdi-edit`, explicit `mdi-close` → `mdi mdi-mdi-close` (broken), `fa fa-trash` → `mdi mdi-fa fa-trash` (unstable). That is why the custom set below exists.

Names in use: bare `edit`, `delete`, `keyboard_arrow_up`/`keyboard_arrow_down`, `insert_drive_file`, `filter_list` + dynamic `{{item.icon}}`, `{{td.value}}`, `{{sp.icon}}`, `{{selected_icon}}`, `{{full_icon_name(l)}}`; `mdi-close|delete|pencil|heart|folder|dots-vertical`; FontAwesome `fa fa-trash|save|pencil-alt|minus|search|plus|home|comments|phone|question|bomb`, `fa-user-alt`, `fa-user-edit`, `fa-calendar-alt`, `fa-eye`, `fa-eye-slash`, `fas fa-file-upload`, `far fa-window-close`, `far fa-paper-plane`, `fa-{{show?'chevron-down':'chevron-right'}}`.

`fields/font-awesome.vue` loads `BaseUrl + 'dist/json/awesome.json'` — the FA name list for the form picker.

## Custom icon set (keeps all three systems on Vuetify 3)

Vuetify 3 also defaults to `mdi-${icon}`, so explicit `mdi-close` becomes `mdi-mdi-close` and `fa fa-*` is unsupported. Fix: a custom set passed as `createVuetify({ icons: { defaultSet: 'legacy', sets: { legacy } } })`.

```js
// src/main.js — LegacyIcon
const legacy = {
  component: (props) => {
    const i = props.icon
    if (/^(fa|fas|far|fab|fal|fad)\s/.test(i)) return h('i', { class: i })          // 'fa fa-home', 'fas fa-x'
    if (/^fa-[a-z0-9-]+$/i.test(i))             return h('i', { class: ['fa', i] })  // 'fa-trash' → 'fa fa-trash'
    if (/^mdi-/.test(i))                        return h('i', { class: ['mdi', i] })
    return h('i', { class: ['material-icons'] }, i)                                 // bare name → Material Icons ligature
  },
}
```

- Bare names (`edit`, `delete`, `keyboard_arrow_up`, `filter_list`, `insert_drive_file`) must render as **Material Icons ligatures** (self-hosted `public/dist/font.ttf`) — they do not exist in `@mdi/font@4.9.95` (`mdi-edit`, `mdi-keyboard_arrow_up` absent). Same as Vue 2 (iconfont `md`).
- `fa-<name>` without a space must get the base class `fa`, else the browser does not apply the FontAwesome family.
- `mdi-*` only for real MDI names (Vuetify aliases such as `$close` → `mdi-close`).
- Do not change `@mdi/font@4.9.95`, `public/dist/fontawesome`, `public/dist/googleapis.com-Material-plus-Icons.css`.
- Check in the browser that server-provided names (`{{item.icon}}`) render and which set they are expected in; add a Material Icons branch (`<i class="material-icons">{{icon}}</i>`) if needed.

## TODO

- Fate of `src/plugins/vuetify.js` (delete as dead code, or make it work).
- `v-icon small|x-small` → `size="small"|"x-small"`.
- `.v-icon {font-size: ...}` in SCSS (`left_menu_item.vue`) may conflict with the Vuetify 3 DOM.