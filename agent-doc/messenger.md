# Messenger (WebSocket chat)

> Load when: chat UI, the WS connection, or messenger endpoints.
> Canonical for: messenger files, WS lifecycle, `/messenger/*` endpoints, module globals.

## Files

`src/components/Messenger/Messenger.vue` (container, in the `App.vue` app-bar) · `ChatList.vue` (chat list) · `ChatWindow.vue` (chat window) · `MessengerFunc.js` (HTTP + WS logic).

## Settings (`public/configure.js`)

All `configure.js` keys: [architecture.md](architecture.md). Messenger-specific:

- `config.BackendBase` — HTTP base.
- `config.MessengerWS` — WS base, e.g. `ws://localhost:5000/messenger/ws`.
- `config.MessengerSignal` — sound path (`/messenger/sms.ogg`), played via `document.getElementById('sms_messenger').play()`.

## WebSocket lifecycle (`MessengerFunc.js`)

1. `init_websocket(t)`: `GET config.BackendBase + '/messenger/get-socket-name'` → socket name; `ws_url = config.MessengerWS + '/' + websocket_name`; `new WebSocket(ws_url)`.
2. `onmessage` — parses `event.data` with the regex `chat_id:(\d+):(\d+)`; plays the signal; increments `new_messages`; updates the chat list or loads more messages.
3. `onopen`/`onclose` set the `sockets` flag.
4. Auto-reconnect every 5 s (`setInterval`) while `!sockets`.

## HTTP endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/messenger` | new message count (`get_new_messages`) |
| GET | `/messenger/chatlist` | chat list (`get_chatlist`) |
| GET | `/messenger/chat-forward/<chat_id>/<last_message_id>` | load more messages (`load_forward`) |
| GET | `/messenger/chat/<chat_id>` | chat messages (`load_chat`) |
| POST | `/messenger/send` | send `{chat_id, message, last_chat_message_id}` |

## Module state

`messenger_app_object`, `chat_list_object`, `chat_window_object` — component references so the WS callback can update them directly; keep the initialization order during migration.

## Notes

- Logic is bound to no Vue API except `t.$http`; it ports unchanged.
- `v-list-item-content` and other Vuetify 2 components in ChatList/ChatWindow need Vuetify 3 fixes ([migration-vue3.md](migration-vue3.md)).
- Currently disabled in `App.vue` (`v-if="false"`) — pending list in [migration-vue3.md](migration-vue3.md).
