import { createApp, h } from 'vue'
import App from './App.vue'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases as mdiAliases } from 'vuetify/iconsets/mdi'
import { ru, en } from 'vuetify/locale'
import mitt from 'mitt'
import axios from 'axios'

import { dynamic_component_loader } from './dynamic_component_loader.js'
import { schemes, getScheme } from './theme/schemes.js'

import '@fontsource/inter/400.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'

// Event bus с сохранением Vue2-API ($on/$off/$emit)
const emitter = mitt()
export const bus = {
  $on: emitter.on,
  $off: emitter.off,
  $emit: emitter.emit,
  all: emitter.all,
}

window.log = console.log
window.bus = bus
window.BaseUrl = import.meta.env.BASE_URL

// Кастомный набор иконок: MDI (mdi-*) + FontAwesome (fa*) + Material Icons лигатуры (голое имя)
const LegacyIcon = (props) => {
  const icon = props.icon
  if (typeof icon !== 'string') return h(props.tag, { class: ['mdi'] })
  if (/^(fa|fas|far|fab|fal|fad)\s/.test(icon)) return h(props.tag, { class: [icon] })
  if (/^fa-[a-z0-9-]+$/i.test(icon)) return h(props.tag, { class: ['fa', icon] })
  if (/^mdi-/.test(icon)) return h(props.tag, { class: ['mdi', icon] })
  return h(props.tag, { class: ['material-icons'] }, icon)
}

// Схема выбирается фронтенд-конфигом: public/configure.js -> config.schema
// (+ dev-override ?schema=N для проверки)
const schemaOverride = new URLSearchParams(window.location.search).get('schema')
const schemaId = schemaOverride != null ? schemaOverride : (window.config && window.config.schema)
const scheme = getScheme(schemaId)

const themes = {}
for (const s of schemes) {
  const { treeLevels, ...colors } = s.colors
  themes['s' + s.id] = { dark: !!s.dark, colors }
}

const theme = {
  defaultTheme: 's' + scheme.id,
  themes,
}

const schemeDefaults = (() => {
  const d = scheme.field
  const base = { variant: d.variant, density: d.density, rounded: d.rounded }
  const ctrlDensity = d.density === 'default' ? 'default' : 'compact'
  return {
    VTextField: { ...base },
    VTextarea: { ...base },
    VSelect: { ...base },
    VAutocomplete: { ...base },
    VCombobox: { ...base },
    VFileInput: { ...base },
    VCheckbox: { density: ctrlDensity },
    VSwitch: { density: ctrlDensity },
  }
})()

const vuetify = createVuetify({
  theme,
  icons: {
    defaultSet: 'legacy',
    sets: {
      legacy: { component: LegacyIcon, aliases: mdiAliases },
    },
  },
  defaults: schemeDefaults,
  locale: {
    locale: 'ru',
    fallback: 'en',
    messages: { ru, en },
  },
})

// Токены схемы -> CSS-переменные (шрифт, размеры, отступы, радиусы)
function applyScheme(s) {
  const root = document.documentElement
  root.setAttribute('data-scheme', s.name)
  root.style.setProperty('--app-font-family', s.fontFamily)
  root.style.setProperty('--app-font-h1', s.typography.h1)
  root.style.setProperty('--app-font-h1w', String(s.typography.h1w))
  root.style.setProperty('--app-font-h2', s.typography.h2)
  root.style.setProperty('--app-font-h2w', String(s.typography.h2w))
  root.style.setProperty('--app-font-value', s.typography.value)
  root.style.setProperty('--app-font-label', s.typography.label)
  root.style.setProperty('--app-font-desc', s.typography.desc)
  root.style.setProperty('--app-font-help', s.typography.help)
  root.style.setProperty('--app-space-unit', s.spacing.unit)
  root.style.setProperty('--app-space-field', s.spacing.field)
  root.style.setProperty('--app-space-section', s.spacing.section)
  root.style.setProperty('--app-space-inline', s.spacing.inline)
  root.style.setProperty('--app-radius-field', s.radii.field)
  root.style.setProperty('--app-radius-card', s.radii.card)
  root.style.setProperty('--app-radius-btn', s.radii.btn)
  root.style.setProperty('--app-radius-chip', s.radii.chip)
  root.style.setProperty('--app-tint', s.tint)
  root.style.setProperty('--app-stripe', s.stripe)
}
applyScheme(scheme)

theme.rounded = scheme.field.rounded

const app = createApp(App)

app.config.globalProperties.$color = scheme.colors
app.config.globalProperties.$theme = theme
app.config.globalProperties.$scheme = scheme
app.config.globalProperties.$schemeDefaults = schemeDefaults
window.scheme = scheme
app.config.globalProperties.$http = axios
app.config.globalProperties.$toDate = function (v) {
  if (!v) return null
  if (v instanceof Date) return v
  const m = String(v).match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0))
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}
app.config.globalProperties.$toIso = function (d) {
  if (!d) return ''
  const x = d instanceof Date ? d : new Date(d)
  if (isNaN(x.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`
}
app.config.globalProperties.$isMobile = function () {
  if (document.body.clientWidth < 1000) return true
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) return true
  return false
}

// оставляем глобал для серверного eval
window.Vue = app

import draggable from 'vuedraggable'
app.component('draggable', draggable)

dynamic_component_loader(app)

import FormBlock from './components/EditForm/FormBlock'
app.component('form-block', FormBlock)

import TextField from './components/fields/text'
app.component('field-text', TextField)

import InExtUrlField from './components/fields/in_ext_url'
app.component('field-in_ext_url', InExtUrlField)

import DateField from './components/fields/date'
app.component('field-date', DateField)

import TimeField from './components/fields/time'
app.component('field-time', TimeField)

import DateTimeField from './components/fields/datetime'
app.component('field-datetime', DateTimeField)

import YearMonField from './components/fields/yearmon'
app.component('field-yearmon', YearMonField)

import DayMonField from './components/fields/daymon'
app.component('field-daymon', DayMonField)

import GPTAssist from './components/GPTAssist/GPTAssist'
app.component('GPTAssist', GPTAssist)

// Vuetify labs-компоненты (в 3.5 не входят в стабильный набор)
import { VTimePicker } from 'vuetify/labs/VTimePicker'
import { VTreeview } from 'vuetify/labs/VTreeview'
import { VCalendar } from 'vuetify/labs/VCalendar'
app.component('VTimePicker', VTimePicker)
app.component('VTreeview', VTreeview)
app.component('VCalendar', VCalendar)

import Errors from './components/errors.vue'
app.component('errors', Errors)

app.use(vuetify)
app.mount('#app')
