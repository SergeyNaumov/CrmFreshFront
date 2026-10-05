import { cpSync, rmSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, extname, join, relative } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const base = resolve(here, '../src/components/svcmsAdmin/page_constructor/data')

const tplSrc = resolve(base, 'template')
const tplDst = resolve(here, '../public/page_constructor/template')
rmSync(tplDst, { recursive: true, force: true })
mkdirSync(tplDst, { recursive: true })
cpSync(tplSrc, tplDst, { recursive: true })
console.log('constructor pack ->', tplDst)

// Карта «относительный путь ассета -> mtime (YYYYMMDDhhmmss)» для превью:
// tplAsset добавляет ?nc=<mtime файла>, чтобы браузер не держал старый css/js.
function stamp(date) {
  const p = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
         `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
}
const assetRev = {}
for (const sub of ['css', 'js']) {
  const root = join(tplDst, sub)
  const walk = (dir) => {
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, ent.name)
      if (ent.isDirectory()) { walk(full); continue }
      if (!/\.(css|js)$/i.test(ent.name)) continue
      const rel = relative(tplDst, full).replace(/\\/g, '/')
      assetRev[rel] = stamp(statSync(full).mtime)
    }
  }
  try { walk(root) } catch { /* папки может не быть */ }
}

const demoDir = resolve(base, 'demo')
const dataDst = resolve(here, '../public/page_constructor/js/data')
rmSync(dataDst, { recursive: true, force: true })
mkdirSync(dataDst, { recursive: true })
for (const file of readdirSync(demoDir)) {
  if (extname(file) !== '.js') continue
  cpSync(resolve(demoDir, file), resolve(dataDst, file))
}
writeFileSync(join(dataDst, 'asset-rev.json'), JSON.stringify(assetRev))
console.log('constructor data ->', dataDst, '| asset-rev:', Object.keys(assetRev).length)
