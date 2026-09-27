# Messenger (WebSocket-чат)

## Файлы

- `src/components/Messenger/Messenger.vue` — контейнер (в `App.vue` в app-bar).
- `src/components/Messenger/ChatList.vue` — список чатов.
- `src/components/Messenger/ChatWindow.vue` — окно чата.
- `src/components/Messenger/MessengerFunc.js` — HTTP + WS логика.

## Настройки (`public/configure.js`)

- `config.BackendBase` — HTTP база.
- `config.MessengerWS` — WS база (например `ws://localhost:5000/messenger/ws`).
- `config.MessengerSignal` — путь к звуку (`/messenger/sms.ogg`), воспроизводится через `document.getElementById('sms_messenger').play()`.

## WebSocket lifecycle (`MessengerFunc.js`)

1. `init_websocket(t)`:
   - `GET config.BackendBase + '/messenger/get-socket-name'` → имя сокета.
   - `ws_url = config.MessengerWS + '/' + websocket_name`.
   - `new WebSocket(ws_url)`.
2. `onmessage`: парсит `event.data` регуляркой `chat_id:(\d+):(\d+)`; играет сигнал; обновляет счётчик `new_messages`; обновляет список чатов или подгружает новые сообщения.
3. `onopen`/`onclose` — флаг `sockets`.
4. Авто-reconnect каждые 5 c (`setInterval`), если `!sockets`.

## HTTP endpoints

| Метод | Endpoint | Назначение |
|---|---|---|
| GET | `/messenger` | число новых сообщений (`get_new_messages`) |
| GET | `/messenger/chatlist` | список чатов (`get_chatlist`) |
| GET | `/messenger/chat-forward/<chat_id>/<last_message_id>` | догрузка сообщений (`load_forward`) |
| GET | `/messenger/chat/<chat_id>` | сообщения чата (`load_chat`) |
| POST | `/messenger/send` | отправка `{chat_id, message, last_chat_message_id}` |

## Глобальное состояние модуля

`messenger_app_object`, `chat_list_object`, `chat_window_object` — ссылки на компоненты, чтобы WS-колбэк мог обновлять их напрямую. При миграции сохранить порядок инициализации.

## Миграция

- Логика не привязана к Vue API (кроме `t.$http`), переносится без изменений.
- `v-list-item-content` и др. Vuetify-компоненты в ChatList/ChatWindow требуют правок под Vuetify 3.
