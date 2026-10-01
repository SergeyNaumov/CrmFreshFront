import { cpSync, rmSync, mkdirSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, extname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const base = resolve(here, '../src/components/svcmsAdmin/page_constructor/data')

const tplSrc = resolve(base, 'template')
const tplDst = resolve(here, '../public/page_constructor/template')
rmSync(tplDst, { recursive: true, force: true })
mkdirSync(tplDst, { recursive: true })
cpSync(tplSrc, tplDst, { recursive: true })
console.log('constructor pack ->', tplDst)

const demoDir = resolve(base, 'demo')
const dataDst = resolve(here, '../public/page_constructor/js/data')
rmSync(dataDst, { recursive: true, force: true })
mkdirSync(dataDst, { recursive: true })
for (const file of readdirSync(demoDir)) {
  if (extname(file) !== '.js') continue
  cpSync(resolve(demoDir, file), resolve(dataDst, file))
}
console.log('constructor data ->', dataDst)
