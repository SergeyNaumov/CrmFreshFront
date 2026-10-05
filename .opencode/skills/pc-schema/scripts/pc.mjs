#!/usr/bin/env node
/**
 * pc.mjs — интроспектор конструктора страниц (page_constructor).
 *
 * Заменяет чтение data/schema.js (376 КБ) и engine/render.js (139 КБ):
 * те же ответы — короткими таблицами из консоли.
 *
 *   node .opencode/skills/pc-schema/scripts/pc.mjs groups
 *   node .opencode/skills/pc-schema/scripts/pc.mjs types --group Медиа
 *   node .opencode/skills/pc-schema/scripts/pc.mjs type slider
 *   node .opencode/skills/pc-schema/scripts/pc.mjs type slider --json
 *   node .opencode/skills/pc-schema/scripts/pc.mjs variants note
 *   node .opencode/skills/pc-schema/scripts/pc.mjs param page_head
 *   node .opencode/skills/pc-schema/scripts/pc.mjs classes product_detail
 *   node .opencode/skills/pc-schema/scripts/pc.mjs grep хлебные
 *   node .opencode/skills/pc-schema/scripts/pc.mjs envelope
 *   node .opencode/skills/pc-schema/scripts/pc.mjs check
 *   node .opencode/skills/pc-schema/scripts/pc.mjs diff HEAD
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const MARK = 'src/components/svcmsAdmin/page_constructor'

function findRoot() {
  const i = process.argv.indexOf('--root')
  if (i > -1 && process.argv[i + 1]) {
    const r = resolve(process.argv[i + 1])
    if (existsSync(join(r, MARK, 'data', 'schema.json'))) return r
  }
  let dir = dirname(fileURLToPath(import.meta.url))
  for (let n = 0; n < 8; n++) {
    if (existsSync(join(dir, MARK, 'data', 'schema.json'))) return dir
    dir = dirname(dir)
  }
  return process.cwd()
}

const root = findRoot()
const pcDir = join(root, MARK)
const SCHEMA_REL = `${MARK}/data/schema.json`

const argv = process.argv.slice(2)
const FLAGS = new Set(['--json', '--flags', '--help'])
const OPTS = ['--root', '--group', '--grep']
const opt = name => {
  const i = argv.indexOf(name)
  return i > -1 ? argv[i + 1] || '' : null
}
const has = f => argv.includes(f)
const words = argv.filter((a, i) => {
  if (a.startsWith('--')) return false
  if (FLAGS.has(a)) return false
  if (OPTS.includes(argv[i - 1])) return false
  return true
})

const cmd = words[0] || 'help'
const pad = (s, n) => String(s == null || s === '' ? '-' : s).padEnd(n)

async function loadEngine() {
  globalThis.window = globalThis
  globalThis.self = globalThis
  const url = p => pathToFileURL(join(pcDir, p)).href
  await import(url('data/schema.js'))
  await import(url('engine/map.js'))
  await import(url('engine/render.js'))
  return { S: globalThis.PAGE_CONSTRUCTOR_SCHEMA, PM: globalThis.PC_PREVIEW_MAP, PC: globalThis.PC }
}

const paramsOf = (t, v) => Array.isArray(v.params) ? v.params
  : v.params_ref ? (t.shared_params || {})[v.params_ref] || [] : []
const itemsOf = (t, v) => v.items && Array.isArray(v.items.fields) ? v.items.fields
  : t.items_shared && Array.isArray(t.items_shared.fields) ? t.items_shared.fields : []
const FLAG_KEYS = ['structural', 'once', 'data', 'partial', 'items_are_data', 'check', 'views']
const flagsOf = t => FLAG_KEYS
  .filter(f => t[f] !== undefined && t[f] !== false && t[f] !== null)
  .map(f => f + (t[f] === true ? '' : '=' + JSON.stringify(t[f])))
const brief = p => {
  let s = `${p.name}:${p.kind}`
  if (p.default !== undefined && p.default !== null && p.default !== '') s += '=' + JSON.stringify(p.default)
  if (p.allowCustom) s += '*'
  if (p.options) s += `(${p.options.length})`
  return s
}

let cssSet = null
function cssClasses() {
  if (cssSet) return cssSet
  cssSet = new Set()
  const walk = d => {
    let ents = []
    try { ents = readdirSync(d, { withFileTypes: true }) } catch { return }
    for (const e of ents) {
      const full = join(d, e.name)
      if (e.isDirectory()) { walk(full); continue }
      if (!e.name.endsWith('.css')) continue
      for (const m of readFileSync(full, 'utf8').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) cssSet.add(m[1])
    }
  }
  walk(join(pcDir, 'data', 'template', 'css'))
  return cssSet
}

function findType(S, q) {
  const rows = Object.entries(S.types)
  const exact = rows.find(([id]) => id === q)
  if (exact) return exact
  const low = String(q || '').toLowerCase()
  const fuzzy = rows.filter(([id, t]) => id.toLowerCase().includes(low) || (t.title || '').toLowerCase().includes(low))
  if (fuzzy.length === 1) return fuzzy[0]
  if (fuzzy.length > 1) {
    console.log('несколько совпадений: ' + fuzzy.map(([id]) => id).join(', '))
    process.exit(1)
  }
  console.log('тип не найден: ' + q)
  process.exit(1)
}

const HELP = `pc.mjs — интроспектор конструктора страниц. Корень: ${root}

  groups                     группы блоков и счётчики
  types [подстрока]          список типов: id, группа, дефолтный вариант, title, флаги
      --group <группа>       фильтр по группе            --flags   только типы с флагами
  type <id> [--json]         варианты, параметры, поля items, contract_classes, запись map.js
  variants <id>              имена вариантов + число параметров/items
  param <имя>                обратный индекс: где встречается параметр
  classes <id>               contract_classes + паритет с data/template/css
  grep <текст>               поиск по id/title/keywords/label (ru/en)
  envelope                   поля блока: fill, anim, bleed, class_map
  check                      все типы рендерятся и присутствуют в engine/map.js
  diff <git-ref>             схема <git-ref> vs рабочее дерево (например HEAD)
`

if (cmd === 'help' || has('--help')) { console.log(HELP); process.exit(0) }

const { S, PM, PC } = await loadEngine()
const rows = Object.entries(S.types)

if (cmd === 'envelope') {
  console.log(JSON.stringify(S.envelope, null, 1))
} else if (cmd === 'groups') {
  const g = {}
  for (const [, t] of rows) (g[t.group || '—'] ||= []).push(t)
  for (const [name, list] of Object.entries(g).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${pad(name, 18)} ${String(list.length).padStart(2)}  ${list.map(t => t.title).join(' · ')}`)
  }
  console.log(`\nтипов: ${rows.length} | групп: ${Object.keys(g).length}`)
} else if (cmd === 'types') {
  const q = (words[1] || opt('--grep') || '').toLowerCase()
  const grp = (opt('--group') || '').toLowerCase()
  let list = rows
  if (grp) list = list.filter(([, t]) => (t.group || '').toLowerCase().includes(grp))
  if (q) list = list.filter(([id, t]) => id.toLowerCase().includes(q) || (t.title || '').toLowerCase().includes(q))
  if (has('--flags')) list = list.filter(([, t]) => flagsOf(t).length)
  for (const [id, t] of list) {
    console.log(`${pad(id, 20)} ${pad(t.group, 14)} ${pad(t.default_variant, 12)} ${pad(t.title, 32)} ${flagsOf(t).join(' ')}`)
  }
  console.log(`\n${list.length} из ${rows.length}`)
} else if (cmd === 'variants') {
  const [id, t] = findType(S, words[1])
  console.log(`${id} — ${t.title} (группа ${t.group || '—'}, дефолт ${t.default_variant})`)
  for (const [vn, v] of Object.entries(t.variants || {})) {
    console.log(`  ${pad(vn, 14)} params=${String(paramsOf(t, v).length).padStart(2)} items=${String(itemsOf(t, v).length).padStart(2)}` +
      (v.params_ref ? ` ref=${v.params_ref}` : '') + (v.title ? `  ${v.title}` : ''))
  }
} else if (cmd === 'type') {
  const [id, t] = findType(S, words[1])
  if (has('--json')) { console.log(JSON.stringify(t, null, 1)); process.exit(0) }
  const m = PM.type[id]
  console.log(`${id} — ${t.title}`)
  console.log(`  группа: ${t.group || '—'} | дефолт: ${t.default_variant} | ${flagsOf(t).join(' ') || 'флагов нет'}`)
  if (t.status) console.log(`  status: ${t.status} | check: ${t.check || '—'} | views: ${!!t.views}`)
  if (t.partial) console.log(`  partial: ${JSON.stringify(t.partial)}`)
  console.log(`  map.js: ${m ? JSON.stringify(m) : 'ЗАПИСИ НЕТ → превью без своих css/js'}`)
  console.log(`  contract_classes: ${(t.contract_classes || []).join(', ') || '—'}`)
  for (const [vn, v] of Object.entries(t.variants || {})) {
    const P = paramsOf(t, v), I = itemsOf(t, v)
    console.log(`\n  [${vn}]${v.title ? ' ' + v.title : ''}${v.params_ref ? ` (params_ref=${v.params_ref})` : ''}`)
    console.log(`    params (${P.length}): ${P.map(brief).join(', ') || '—'}`)
    if (I.length) console.log(`    items.fields (${I.length}): ${I.map(brief).join(', ')}`)
    if (v.items && v.items.note) console.log(`    items.note: ${v.items.note}`)
  }
  const sample = PC.sampleItems(id, t.default_variant)
  if (Array.isArray(sample) && sample.length) console.log(`\n  sampleItems (${sample.length}): ${JSON.stringify(sample[0]).slice(0, 220)}`)
} else if (cmd === 'param') {
  const q = words[1]
  if (!q) { console.log('нужно имя параметра'); process.exit(1) }
  const hit = [], ks = new Set()
  for (const [id, t] of rows) {
    for (const [vn, v] of Object.entries(t.variants || {})) {
      const P = paramsOf(t, v), I = itemsOf(t, v)
      for (const p of P) if (p.name === q) { hit.push(`${id}/${vn}`); ks.add(p.kind) }
      for (const f of I) if (f.name === q) { hit.push(`${id}/${vn} (item)`); ks.add(f.kind) }
    }
  }
  console.log(`${q} — kind: ${[...ks].join(',') || '?'} | вхождений: ${hit.length}`)
  console.log(hit.join('\n') || '(нет)')
} else if (cmd === 'classes') {
  const [id, t] = findType(S, words[1])
  const have = cssClasses()
  const cc = t.contract_classes || []
  console.log(`${id} — contract_classes: ${cc.length}`)
  for (const c of cc) console.log(`  ${have.has(c) ? 'ok  ' : 'MISS'} .${c}`)
  const miss = cc.filter(c => !have.has(c))
  console.log(miss.length ? `\nнет селектора в data/template/css: ${miss.join(', ')}` : '\nвсе классы найдены в CSS')
} else if (cmd === 'grep') {
  const q = (words[1] || '').toLowerCase()
  if (!q) { console.log('нужна строка поиска'); process.exit(1) }
  let n = 0
  for (const [id, t] of rows) {
    const where = []
    if (id.toLowerCase().includes(q)) where.push('id')
    if ((t.title || '').toLowerCase().includes(q)) where.push('title')
    if ((t.keywords || []).some(k => String(k).toLowerCase().includes(q))) where.push('keywords')
    const params = []
    for (const [vn, v] of Object.entries(t.variants || {})) {
      for (const p of [...paramsOf(t, v), ...itemsOf(t, v)]) {
        if (p.name.toLowerCase().includes(q) || (p.label || '').toLowerCase().includes(q)) params.push(`${vn}.${p.name} — ${p.label}`)
      }
    }
    if (!where.length && !params.length) continue
    n++
    console.log(`\n${id} — ${t.title} [${where.join(', ')}${params.length ? ', params' : ''}]`)
    for (const p of params) console.log('    ' + p)
  }
  console.log(`\nсовпадений: ${n}`)
} else if (cmd === 'check') {
  const ids = rows.map(([id]) => id)
  const noMap = ids.filter(id => !(id in PM.type))
  const thrown = [], empty = [], noDemo = []
  for (const id of ids) {
    const t = S.types[id]
    const dv = t.default_variant
    const v = (t.variants || {})[dv] || {}
    const sample = PC.sampleItems(id, dv) || []
    const block = { type: id, variant: dv, params: {}, items: sample }
    for (const p of paramsOf(t, v)) if (p.default !== undefined) block.params[p.name] = p.default
    try {
      const html = PC.renderBlock(block)
      if (!html || !html.trim()) empty.push(id)
      const m = PM.type[id] || {}
      if (!sample.length && !m.dataKey && (m.kind || 'static') === 'static') noDemo.push(id)
    } catch (e) { thrown.push(`${id}: ${e.message}`) }
  }
  console.log(`типов: ${ids.length} | вариантов: ${ids.reduce((n, id) => n + Object.keys(S.types[id].variants || {}).length, 0)} | contract_classes: ${ids.reduce((n, id) => n + (S.types[id].contract_classes || []).length, 0)}`)
  console.log(`render.js исключения: ${thrown.length ? thrown.join(' | ') : 'нет'} | пустой HTML: ${empty.length ? empty.join(', ') : 'нет'}`)
  console.log(`map.js без записи: ${noMap.length ? noMap.join(', ') : 'нет'}`)
  console.log(`demo: нет ни sampleItems, ни dataKey/kind (для static-блоков обычно норма): ${noDemo.length ? noDemo.join(', ') : 'нет'}`)
} else if (cmd === 'diff') {
  const ref = words[1] || 'HEAD'
  let raw
  try { raw = execFileSync('git', ['show', `${ref}:${SCHEMA_REL}`], { cwd: root, maxBuffer: 1 << 28 }).toString() }
  catch { console.log(`не читается ${ref}:${SCHEMA_REL}`); process.exit(1) }
  const oldS = JSON.parse(raw)
  const oT = oldS.types || {}, nT = S.types
  const added = Object.keys(nT).filter(k => !(k in oT))
  const removed = Object.keys(oT).filter(k => !(k in nT))
  console.log(`${ref} → worktree: типов ${Object.keys(oT).length} → ${Object.keys(nT).length}`)
  if (added.length) console.log(`+ типы: ${added.join(', ')}`)
  if (removed.length) console.log(`- типы: ${removed.join(', ')}`)
  const cc = o => Object.values(o).reduce((n, t) => n + (t.contract_classes || []).length, 0)
  console.log(`contract_classes: ${cc(oT)} → ${cc(nT)}`)
  if (JSON.stringify(oldS.envelope) !== JSON.stringify(S.envelope)) console.log('~ envelope изменён')
  for (const id of added) console.log(`\n+ ${id} — ${nT[id].title} (группа ${nT[id].group || '—'}, варианты: ${Object.keys(nT[id].variants || {}).join(', ')})`)
  for (const [id, b] of Object.entries(nT)) {
    if (!(id in oT)) continue
    const a = oT[id]
    const av = Object.keys(a.variants || {}), bv = Object.keys(b.variants || {})
    const gone = av.filter(v => !bv.includes(v)), fresh = bv.filter(v => !av.includes(v))
    const fa = flagsOf(a).join(' '), fb = flagsOf(b).join(' ')
    const d = []
    for (const vn of bv.filter(v => av.includes(v))) {
      const pa = new Set(paramsOf(a, a.variants[vn]).map(p => p.name))
      const pb = paramsOf(b, b.variants[vn])
      const plus = pb.filter(p => !pa.has(p.name)).map(p => p.name)
      const minus = [...pa].filter(n => !pb.some(p => p.name === n))
      if (plus.length || minus.length) d.push(`${vn}: +${plus.join(',') || '—'} -${minus.join(',') || '—'}`)
    }
    if (!gone.length && !fresh.length && fa === fb && !d.length) continue
    console.log(`\n~ ${id}`)
    if (fresh.length) console.log(`  + варианты: ${fresh.join(', ')}`)
    if (gone.length) console.log(`  - варианты: ${gone.join(', ')}`)
    if (fa !== fb) console.log(`  флаги: [${fa}] → [${fb}]`)
    for (const x of d) console.log('  params ' + x)
  }
} else {
  console.log('неизвестная команда: ' + cmd + '\n')
  console.log(HELP)
  process.exit(1)
}
