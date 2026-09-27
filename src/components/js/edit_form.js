import { bus } from '../../main'

// ============================================================================
// Зависимости полей (frontend).
//
// Поле может иметь:
//   field.frontend.fields_dependence - JS-строка с функцией v=>[...] (локально, из бэка)
//   field.frontend.ajax              - { name, timeout } -> POST /ajax/<config>/<name>
//
// Изменения применяются движком (см. ниже) с детектом изменений и visited-хешами,
// чтобы не зацикливаться и не "долбить" бэк.
// ============================================================================

const AJAX_CACHE_TTL = 1000 // мс: кэш одинаковых ajax-запросов
const ENGINE_MAX_STEPS = 300 // предохранитель от циклов

let ENGINE = null
const AJAX_CACHE = new Map()

function field_of(self, name) {
  return (self.form.fields || []).find(f => f.name === name)
}

// Хеш состояния поля: сравнение "изменилось ли реально"
function state_hash(f) {
  let v = f.value
  if (v === undefined || v === null) v = ''
  if (f.type === 'select') v = String(v)
  return JSON.stringify([
    v,
    f.hide ? 1 : 0,
    f.error ? 1 : 0,
    (f.values || []).length,
    f.description || '',
    f.warning_message || '',
    f.before_html || '',
    f.after_html || '',
  ])
}

// --- применение одного объекта-зависимости к полю (без bus.change_field) ---
function apply_dep_to_field(self, name, obj) {
  if (!obj) return
  for (const f of self.form.fields) {
    if (f.name !== name) continue

    if ('fields' in obj) {
      f.fields = obj.fields
      bus.$emit(`1_to_m/slide_${f.name}:update_fields`, f.fields)
    }
    if ('value' in obj && f.value != obj.value) f.value = obj.value

    if ('instead_of_empty' in obj && !f.begin_value) f.value = obj.instead_of_empty

    if ('values' in obj) {
      if (typeof obj.values === 'object') f.values = obj.values
      else if (typeof obj.values === 'string') {
        try { f.values = JSON.parse(obj.values) } catch (e) { f.values = [] }
      } else f.values = []
    }
    if ('hide' in obj) f.hide = obj.hide
    if ('error' in obj) {
      f.error_message = obj.error
      f.error = f.error_message ? true : false
    }
    if ('warning' in obj) f.warning_message = obj.warning
    if ('after_html' in obj) f.after_html = obj.after_html
    if ('before_html' in obj) f.before_html = obj.before_html
    if ('description' in obj) f.description = obj.description
  }
}

function apply_result_array(self, result) {
  if (!Array.isArray(result)) return
  for (let i = 0; i < result.length; i += 2) {
    const name = result[i], obj = result[i + 1]
    if (!name || !obj) continue
    apply_dep_to_field(self, name, obj)
    if (obj.jscode) {
      try { eval(obj.jscode) } catch (e) { console.warn('dep jscode error', e) }
    }
  }
}

function compile_dependence(f) {
  if (f._dep_fn !== undefined) return f._dep_fn
  let fn = null
  if (f.frontend && f.frontend.fields_dependence) {
    try { fn = eval('(' + f.frontend.fields_dependence + ')') }
    catch (e) { console.warn('fields_dependence compile error', f.name, e) }
  }
  f._dep_fn = fn
  return fn
}

// --- движок ---
function eng_begin(self) {
  if (ENGINE) return ENGINE
  ENGINE = { self, steps: 0, queue: [], inflight: 0, timers: {}, inflight_keys: {}, last: new Map() }
  for (const f of self.form.fields) ENGINE.last.set(f.name, state_hash(f))
  return ENGINE
}

function eng_enqueue(E, name) {
  if (name && E.queue.indexOf(name) < 0) E.queue.push(name)
}

// сравнить состояние всех полей с последним известным -> обновить UI и очередь
function eng_diff(E) {
  let changed = 0
  for (const f of E.self.form.fields) {
    const h = state_hash(f)
    if (E.last.get(f.name) !== h) {
      E.last.set(f.name, h)
      bus.$emit('field-update:' + f.name, f)
      eng_enqueue(E, f.name)
      changed++
    }
  }
  return changed
}

function eng_local(E, name) {
  const f = field_of(E.self, name)
  if (!f || !f.frontend || !f.frontend.fields_dependence) return
  const fn = compile_dependence(f)
  if (!fn) return
  try {
    const res = fn(E.self.values)
    apply_result_array(E.self, res)
  } catch (e) {
    console.warn('fields_dependence run error', name, e)
  }
}

function eng_ajax(E, name) {
  const f = field_of(E.self, name)
  if (!f || !f.frontend || !f.frontend.ajax) return
  const a = f.frontend.ajax
  if (E.timers[name]) clearTimeout(E.timers[name])
  E.timers[name] = setTimeout(() => {
    delete E.timers[name]
    eng_do_ajax(E, name, a)
  }, a.timeout || 600)
}

function eng_do_ajax(E, name, a) {
  const self = E.self
  if (!self.params || !self.params.config) return

  const payload = { values: self.values, id: self.form.id }
  const key = self.params.config + '|' + a.name + '|' + JSON.stringify(self.values)
  const now = Date.now()

  const cached = AJAX_CACHE.get(key)
  if (cached && now - cached.t < AJAX_CACHE_TTL) {
    apply_result_array(self, cached.result)
    eng_continue(E)
    return
  }
  if (E.inflight_keys[key]) return // такой же запрос уже в полёте

  E.inflight_keys[key] = true
  E.inflight++

  const url = BackendBase + '/ajax/' + self.params.config + '/' + a.name
  self.$http.post(url, payload).then(r => {
    E.inflight--
    delete E.inflight_keys[key]
    const d = r.data
    if (d.success) {
      AJAX_CACHE.set(key, { t: Date.now(), result: d.result })
      apply_result_array(self, d.result)
    }
    if (d.errors && d.errors.length) alert(d.errors[0])
    eng_continue(E)
  }).catch(e => {
    E.inflight--
    delete E.inflight_keys[key]
    if (!/Network Error|timeout/i.test(String(e))) alert('frontend_process (ajax field_name: ' + name + ' url: ' + url + '): ' + e)
    eng_continue(E)
  })
}

// обработка очереди (синхронные зависимости + постановка ajax)
function eng_after(E) {
  while (E.queue.length && E.steps < ENGINE_MAX_STEPS) {
    const name = E.queue.shift()
    E.steps++
    calc_values(E.self)
    eng_local(E, name)
    calc_values(E.self)
    eng_ajax(E, name)
    eng_diff(E)
  }
  if (E.steps >= ENGINE_MAX_STEPS) {
    console.warn('dependency engine: step limit reached (возможен цикл зависимостей)')
  }
  eng_maybe_reset(E)
}

// после асинхронного ответа: пересчитать, прогнать очередь
function eng_continue(E) {
  calc_values(E.self)
  eng_diff(E)
  eng_after(E)
}

function eng_maybe_reset(E) {
  const idle = !E.queue.length && E.inflight === 0 && Object.keys(E.timers).length === 0
  if (idle && ENGINE === E) {
    ENGINE = null
    // периодически чистим кэш
    const now = Date.now()
    for (const [k, v] of AJAX_CACHE) if (now - v.t > AJAX_CACHE_TTL) AJAX_CACHE.delete(k)
  }
}

// Точка входа: поле изменилось (пользователь/программа)
export function eng_notify(self, name) {
  const E = eng_begin(self)
  E.steps = 0
  eng_enqueue(E, name)
  eng_after(E)
}

// --- совместимость (используется в EditForm/кнопках) ---
export function on_dependence(self, name, obj, not_frontend_process) {
  const before = field_of(self, name) ? state_hash(field_of(self, name)) : null
  apply_dep_to_field(self, name, obj)
  const f = field_of(self, name)
  return before !== null && f && state_hash(f) !== before
}

export function change_field(self, field, not_frontend_process) {
  if (!field) return
  let v = field.value
  if (field.type == 'checkbox' || field.type == 'switch') {
    v = parseInt(v) ? true : false
  }
  if (field.type == '1_to_m') {
    for (let f of self.form.fields) {
      if (f.name == field.name) {
        f.values = field.values
        f.fields = field.fields
      }
    }
  }
  self.values[field.name] = v
  bus.$emit('field-update:' + field.name, field)
  calc_values(self)
  if (!not_frontend_process) eng_notify(self, field.name)
}

export function save_field_1_to_m(self, data) {
  if (!self.form.id) return

  let url = BackendBase + '/1_to_m/update_field/' + self.form.config + '/' + data.field + '/' + data.subfield + '/' + self.form.id
  let emit_key = '1_to_m:change_in_slide:' + data.field + ':' + data.subfield + ':' + data.id

  self.$http.post(url, { cur_id: data.id, value: data.value }).then(r => {
    let D = r.data
    if (D.success) {
      bus.$emit('1_to_m:upload_values:' + data.field, D.values)
      bus.$emit(emit_key, { save_ok: true })
    }
    bus.$emit(emit_key, { errors: D.errors })
  }).catch(e => { /* alert(e) */ })
}

export function frontend_result_process(self, result, proc_name) {
  if (!result) return
  const E = eng_begin(self)
  let i = 0
  while (i < result.length) {
    let name = result[i], obj = result[i + 1]
    apply_dep_to_field(self, name, obj)
    if (obj && obj.jscode) {
      try { eval(obj.jscode) } catch (e) { console.warn('dep jscode error', e) }
    }
    eng_enqueue(E, name)
    i += 2
  }
  eng_after(E)
}

export const frontend_button_process = (self, f, button, success_function) => {
  if (button.ajax) {
    self.$http.post(
      BackendBase + '/ajax/' + self.params.config + '/' + button.ajax,
      { values: self.values, id: self.form.id }
    ).then(r => {
      let d = r.data
      if (d.success) {
        frontend_result_process(self, d.result, f.name)
        success_function()
      }
      if (d.errors.length) alert(d.errors[0])
    }).catch(e => {
      alert('frontend_process (ajax): ' + e)
    })
  }
}

// оставляем для обратной совместимости: запускает зависимости конкретного поля
export function frontend_process(self, f) {
  if (!f) return
  if (!f.frontend) return
  eng_notify(self, f.name)
}

export function get_cgi_params() {
  let data = location.search.replace(/^\?/, '')
  let cgi_params = {}

  for (let j of data.split(/&/)) {
    let arr = j.split(/=/)
    cgi_params[arr[0]] = arr[1]
  }
  return cgi_params
}

export function get_params(self) { // получаем параметры из url-а
  let url = location.pathname; let to_url = ''
  if (/\/edit[\-_]form\/([^\/]+)\/(\d+)$/.test(url)) {
    let arr = url.match(/\/edit[\-_]form\/([^\/]+)\/(\d+)$/);
    self.params = { config: arr[1], id: arr[2], action: 'edit' }
    return BackendBase + '/edit-form/' + self.params.config + '/' + self.params.id
  } else if (/\/edit[\-_]form\/([^\/]+)?$/.test(url)) {
    let arr = url.match(/\/edit[\-_]form\/([^\/]+)$/);
    self.params = { config: arr[1], action: 'new' }
    return BackendBase + '/edit-form/' + self.params.config
  } else {
    self.fatal_errors = [`url должен быть в формате ${BaseUrl}/edit_form/[config] или /edit_form/[config]/id`]
    return false
  }
}

export function calc_values(self) {
  let values = {}
  let block = false

  for (let f of self.form.fields) {
    if (f.error) block = true

    if (f.type == 'select') {
      if (!f.value) f.value = ''
      f.value += ''
      for (let v of (f.values || [])) v.v = v.v + ''
    }

    if (f.type != 'file') {
      let v = f.value
      if (v === undefined) v = ''
      if (f.type == 'checkbox' || f.type == 'switch') v = v ? 1 : 0
      values[f.name] = v
    }
  }

  self.disabled_form = block
  self.values = values
  if (self.init_color_selects) self.init_color_selects()
}
