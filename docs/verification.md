# Проверка

Автоматических тестов в проекте нет. Проверка ручная + grep-защиты.

## Baseline

- `npm ci`
- `npm run build` (или `build_trade`, `build_svcms`) — должен собираться до изменений.
- Сохранить `dist/` (структура `js/`, `css/`, `fonts/`, `index.html`).

## Smoke-чеклист (dev-сервер, `npm run serve` / `npm run dev`)

1. Авторизация: `/login`, `/register`, `/remember`.
2. Shell: левое меню, переключение пунктов, iframe (`/src:...`), footer, выход.
3. Главная: `/` → `mainpage` (notifications, birthdays, link-telegram, manager-load).
4. Форма: `/edit_form/<config>` и `/edit_form/<config>/<id>` — все блоки/табы, сохранение, зависимости полей, кнопки переднего плана.
5. Поля по одному из `fields.md` (select, multiconnect, date/datetime/time, file+crop, wysiwyg, memo, 1_to_m, docpack, chart, code).
6. AdminTable: фильтры, сортировка, результаты, массовые действия.
7. AdminTree: дерево, drag&drop, форма в ветке.
8. StatTool, ParserExcel, Schedule, VideoList, Documentation, TransfereCards, Const.
9. Messenger: список чатов, окно чата, отправка, WS-сигнал, reconnect.
10. Иконки: голые (`edit`, `delete`), `mdi-*`, `fa fa-*` — визуально.
11. Консоль браузера: нет ошибок Vue/Vuetify/Vite.

## Grep-защиты после миграции

```bash
# Vue2 API
rg -n '\$on\(|\$off\(|\$once\(|new Vue\(|Vue\.prototype|Vue\.component|Vue\.extend' src
rg -n 'beforeDestroy|destroyed\s*\(' src
rg -n '\.sync' src --glob '*.vue'

# Vuetify 2 компоненты/классы
rg -n 'v-layout|v-flex|v-tabs-items|v-tab-item|v-simple-table|v-subheader|v-list-item-content|v-expansion-panel-(header|content)' src --glob '*.vue'
rg -n 'headline|white--text|--text\b' src --glob '*.vue'

# Vite-несовместимое
rg -n "import\(['\"\`][^'\"\`]*\+|import\(`" src   # динамические template-строки
rg -n 'process\.env' src
```

## Проверка сборки

```bash
npm run build && ls -R dist | head -50
# ожидается dist/{js,css,fonts,index.html}
```

## Проверка ссылок документации

```bash
rg -o '\]\((docs/[^)]+)\)' AGENTS.md
# каждый путь должен существовать
```
