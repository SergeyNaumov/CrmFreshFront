# Зависимости полей (frontend)

Реализация: `src/components/js/edit_form.js`. Логика описана здесь; контракт с бэкендом — в `form-engine.md`.

## Как зависимости описываются на бэке

У поля формы может быть объект `frontend`:

```python
{
  'description':'...', 'name':'action', 'type':'checkbox',
  'frontend': {'fields_dependence': 'v=>{ ... return [name, obj, ...] }'}
}
```

- `fields_dependence` — **строка с JS-функцией** `v => ...`, где `v` — словарь `values` (name → value). Выполняется на клиенте через `eval`. Возвращает **плоский массив** `[name, obj, name2, obj2, ...]` и/или **мутирует поля напрямую** (например через `window.EditForm.get_field_by_name(...)`).
- `ajax` — `{ name, timeout }`: `POST {BackendBase}/ajax/{config}/{name}` с `{values, id}`. Бэкенд возвращает `{success, errors, result}`, где `result` — такой же плоский массив `[name, obj, ...]`.

`obj` для поля может содержать: `value`, `instead_of_empty`, `values`, `hide`, `error`, `warning`, `after_html`, `before_html`, `description`, `fields`, `jscode`.

Пример (`configs/svcmsmanager/test2`): `dep1` через `fields_dependence` управляет `dep2/dep3/dep4`; `title` через ajax `gen_slug` заполняет `slug`.

## Старая логика и найденные ошибки

Поток был: пользователь меняет поле → bus `change_field` → `change_field()` → `frontend_process()`:
- локальная зависимость: `eval('dep=' + fields_dependence)` → `result` → `frontend_result_process`;
- `ajax`: debounce → `frontend_result_process(d.result)`;
- `frontend_result_process` → `on_dependence()` для каждой пары, а `on_dependence` **безусловно** эмитил `change_field`, что снова запускало `frontend_process`.

Ошибки:
1. **Нет детекта изменений** — `on_dependence` эмитил событие, даже если значение/состояние не изменилось: каждый ответ сервера = новый виток.
2. **Нет контекста/посещённых** — пользовательский ввод и распространение зависимостей шли одним событием `change_field`, без visited-множества и лимита шагов.
3. **`not_frontend_process` глушит только поле-источник** (`proc_name==name`), а изменение «соседнего» поля запускало его `frontend_process` → цикл A→B→A.
4. **Ajax без защиты** — только per-field debounce; нет дедупликации одинаковых запросов и защиты от устаревших ответов → бэк «долбили» повторно.
5. `fields_dependence` вычислялся через `eval` на каждый вызов (не компилировался один раз).

## Новая логика (движок)

В `edit_form.js` добавлен движок:

- **Детект изменений**: `state_hash(field)` = value + hide + error + длина values + description + warning + before/after_html. Поле считается изменённым, только если хеш отличается.
- **Очередь + дифф**: после любого изменения движок сравнивает состояние всех полей с последним (`eng_diff`), для реально изменившихся — эмитит `field-update:<name>` (UI) и ставит поле в очередь.
- **Локальные зависимости**: компилируются один раз (`compile_dependence`, кэш `field._dep_fn`), применяются через `apply_result_array`; изменения всплывают через дифф.
- **Циклы**: сходятся, потому что повторное применение того же значения не меняет хеш и не переставляет поле в очередь. Дополнительно — `ENGINE_MAX_STEPS` (300) как предохранитель, с `console.warn`.
- **Ajax**: per-field debounce (`timeout`), **дедупликация одинаковых запросов в полёте** (`inflight_keys` по хешу payload), **TTL-кэш 1с** (`AJAX_CACHE`) — одинаковый запрос не уходит повторно в пределах секунды (данные на бэке могут измениться, поэтому TTL, а не вечный кэш).
- **Синхронизация с UI**: `field-update:<name>` остаётся публичным событием; компоненты полей по нему синхронизируют `value`/опции.
- Контекст `ENGINE` живёт, пока есть очередь, таймеры или запросы; затем сбрасывается (и чистит устаревший кэш).

Точка входа — `eng_notify(self, name)`; `change_field` вызывает её для пользовательских изменений. `frontend_result_process` (результаты кнопок/`frontend_button_process`) применяет пары и запускает тот же движок.

## Ошибки в JS-зависимостях (исправлено в движке)

- Пустые `value` у `select` нормализуются (`calc_values`), `values` селекта приводятся к строкам.
- `obj.values` может прийти строкой (JSON) — парсим с try/catch.
- Ошибки компиляции/исполнения `fields_dependence` не роняют страницу: `console.warn`, движок продолжает.

## Проверка

Тестовый конфиг: `~/projects/CrmFreshBackend-python-async/configs/svcmsmanager/test2` (таблица `test2` в БД `svcms`), доступен как `/edit_form/test2`.

Проверено (puppeteer):
- `dep1=1` → `dep2/dep3/dep4` скрыты; `dep1=4` → показаны с новыми значениями.
- цикл `x→y`, `y→x`: `x=abc` → `y=abc`, распространение останавливается (0 предупреждений, без «step limit»).
- `title="Привет Мир"` → ajax `gen_slug` → `slug="privet_mir"`; цикл `title↔slug` сходится, число POST `/ajax/*` ограничено (3), повторов в пределах TTL нет.

Инструмент: `window.EditForm.get_field_by_name(name)` + `window.bus.$emit('change_field', field)` для эмуляции ввода.
