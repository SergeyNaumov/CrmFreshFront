# CRMFreshFront — CRM панель (Vue 2 / Vuetify)

## Описание проекта

CRMFreshFront — это **Customer Relationship Management (CRM)** панель, написанная на **Vue.js 2** с использованием фреймворка **Vuetify 2.5**.

### Стек технологий

| Компонент | Технология |
|-----------|-----------|
| **Vue** | v2.6.12 |
| **UI** | Vuetify 2.5.0 + Material Design Icons |
| **HTTP** | Axios 0.19.2 |
| **Charts** | Chart.js 3.4 + vue-chartjs 3.5 |
| **Rich Text** | TinyMCE 5.9 |
| **DnD** | vuedraggable v 2.24 |
| **Build** | Vue CLI Service v 3.11 + Babel |

---

## Архитектура системы

### 1. Multi-tenant архитектура

Система поддерживает **19+ tenant'ов**, каждый из которых имеет собственную конфигурацию сборки:

```
build/config/
├── adminbot.js       # Тенант "AdminBot"
├── assyst-ant.js     # Тенант "Assist-Ant"
├── beyeezy.js
├── crimea.js         # Тенант "Crimea"
├── dostavka.js       # Тенант "Dostavka"
├── fas.js            # Тенант "FAS"
├── ls_rental.js      # Тенант "LS Rental"
├── svcms.admin.js    # Тенант "FreshAdmin"
├── svms.manager.js
├── trade.js          # Тенант "Trade"
├── strateg.js        # Тенант "Strateg"
└── translab.js       # Тенант "TransLab"
```

Каждый тенант настраивает свой домен через переменную `BackendBase` и `BaseUrl`.

#### Дебаг-тулзу для быстрой смены тента:
```shell
VUE_CLI_SERVICE_CONFIG_PATH=$PWD/build/config/trade.js vue-cli-service serve --port 8081
```

---

### 2. Vue CLI 3 Service

Vue CLI 3 в `build/` позволяет запускать проект без установки зависимостей с `node_modules`. Файлы конфигураций размещены в `build/config/`.

---

### 3. Vue Bus (Event Bus)

Используется для IPC между компонентами в `src/main.js`:
```javascript
export const bus = new Vue();
```

Типовая схема:
- `bus.$on('event_name', callback)` — подписка
- `bus.$emit('event_name', data)` — событие

---

### 4. Dynamic Component Loader

Компоненты загружаются лениво через `Vue.component('name', () => import(...))`. Все компоненты определены и загружены в файле `/src/js/dynamic_component_loader.js`.

---

## Структура файлов

```
/home/sv/projects/CrmFreshFront/
├── src/
│   ├── main.js                           # Точка входа
│   ├── App.vue                           # Корневой компонент (меню + контент)
│   ├── dynamic_component_loader.js       # Ленивая регистрация компонентов
│   ├── LeftMenu.vue                      # Нижняя навигация + профиль пользователя
│   ├── Pages/                             # Страницы (MainPage и др.)
│   ├── components/
│   │   ├── EditForm.vue                  # Форма редактирования (Tabs, Fields, Deps)
│   │   ├── Admin.vue                     # Управление менеджерами/агентами
│   │   ├── Auth.js                       # Логика авторизации
│   │   ├── FormBlock.vue                 # Базовый блок поля формы
│   │   ├── Table.vue                     # Таблица данных (AdminTable)
│   │   ├── StatTool.vue                  # Статистика / аналитика
│   │   ├── Messenger/                    # WebSocket-чат (ChatList, ChatWindow, MessengerFunc.js)
│   │   └── GPTAssist/                    # GPT-ассистент для вёрстки форм
│   ├── fields/                            # 20+ типов полей формы (text, select, wysiwyg, 1_to_m и др.)
│   └── js/                                # JS-библиотеки проекта
├── build/
│   └── config/                            # 19+ JS-файлов с конфигурацией тентов
├── docker-compose.yml                     # Docker compose для Vue dev (port 8081)
├── Dockerfile                             # node:16
└── .gitignore
```

---

## Критические уязвимости (CRITICAL)

### 1. eval() в EditForm.js

**Файл:** `src/components/EditForm/js/edit_form.js` (строки 127 и 166)
**Тип:** Серверная XSS — `eval()`

```javascript
// 2 строки с eval-ом:
if(obj.jscode){
  eval(obj.jscode)                              // строка 127: результат AJAX
}
...
eval('dep='+front.fields_dependence);          // строка 166: frontend dependence
```

Сервер отправляет JavaScript, который выполняется с помощью `eval()`. Опасность при передаче `jscode` через AJAX.

**Помечено для исправления.**

---

## Средние проблемы (MEDIUM)

| # | Файл | Проблема | Описание |
|---|------|----------|----------|
| 4 | `/build/config/*.js` | Устаревшие зависимости | axios@^0.19.2, vue-cli@3 — могут быть уязвимости |
| 5 | `/docker-compose.yml` | `--host=0.0.0.0` / порт 8081 | Dev-сервер доступен через хост-IP, не localhost |
| 6 | `/src/MainPage.vue` | Неактивный component | Используется в App.vue без `data/`, зависимость от MainPage |

---

## Дополнительные наблюдения

### Структура (положительная)
- **Библиотека полей (`src/fields/`)** — 20+ типов (text, select, wysiwyg, file, 1_to_m, docpack).
- **Динамический загрузочный компонент** через `dynamic_component_loader.js`.
- **Bus Event** для IPC между компонентами.

### Архитектурные паттерны
1. **Form Engine (`EditForm.vue`)** — сервер отправляет JSON со структурой (tabs, fields, deps, actions), клиент парсит и рендерит.
2. **iframe для внешних ссылок** в навигации меню.
3. **WebSocket Messenger** — `MessengerFunc.js`, `ChatList`, `ChatWindow` для чатов в реальном времени.

### Примечание: navigator.userAgent (не является уязвимостью)
- **Файл:** `/src/main.js`, строка 55 (детекция десктоп/мобильность).
- Данные `userAgent` используются только локально для определения мобильной платформы (`$isMobile`). Не передаются на сервер.

---

## Зависимости

### Основные зависимости

- Vue 2.6.x / Vuetify 2.5.x
- Axios 0.19.x (старый)
- Vue CLI Service v3.11 (EOL)

### Утилиты

| Компонент | Зависимость | Описание |
|---|---|---|
| Rich Text Editor | tiny_mce@5 / @tinymce/tinymce-vue@3.2 | Rich Text + Vue binding |
| Drag and Drop | vuedraggable@2.24 | Sortable lists, drag-and-drop |
| Charts | chart.js@3.4 + vue-chartjs@3.5 | Chart API for Vue 2 |

### Рекомендуемые изменения

1. Переписать `main.js` и компоненты в TypeScript.
2. Использовать Composition API (`ref`, `reactive`, `computed`) вместо Options API.
3. Заменить Vuex store на Pinia (Vue 3).
4. Обновить зависимости: axios → fetch/Webpack Loader, Vuetify → Vue 3.

---

## Файлы

- `/home/sv/projects/CrmFreshFront/src/main.js` — точка входа (Vue, Axios, Vuetify, bus, theme)
- `/home/sv/projects/CrmFreshFront/src/App.vue` — корневой компонент (меню + контент)
- `/home/sv/projects/CrmFreshFront/src/Pages/MainPage.vue` — страница "Главная"
- `/home/sv/projects/CrmFreshFront/build/src/js/edit_form.js:234` — устаревший компонент

---

## Форматы данных в JSON-ответах

### Успешный ответ
```json
{
  "success": true,
  "data": { ... },
  "errors": []
}
```

### Уведомление об ошибке
```json
{
  "success": false,
  "errors": ["Уведомление: ..."]
}
```

---

## Примечания

- **Vue 2** имеет EOL с ноября 2023 года (поддержка Vue 3).
- Рекомендуется перейти на **Vue 3** для безопасности и поддержки.
- Файловый путь: `src/components/ErrorPages.vue` — отображение ошибок (404, 500, etc.).
