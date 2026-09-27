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
import { palette } from './theme/palette.js'

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

const theme = {
  defaultTheme: 'light',
  themes: {
    light: {
      colors: {
        ...palette,
        'red-darken-1': '#d32f2f',
        'green-darken-1': '#388e3c',
        'grey-lighten-4': '#f5f5f5',
      },
    },
    dark: {
      colors: {
        primary: '#64b5f6',
      },
    },
  },
}

const vuetify = createVuetify({
  theme,
  icons: {
    defaultSet: 'legacy',
    sets: {
      legacy: { component: LegacyIcon, aliases: mdiAliases },
    },
  },
  defaults: {
    VTextField: { variant: 'outlined', density: 'compact' },
    VTextarea: { variant: 'outlined', density: 'compact' },
    VSelect: { variant: 'outlined', density: 'compact' },
    VAutocomplete: { variant: 'outlined', density: 'compact' },
    VCombobox: { variant: 'outlined', density: 'compact' },
    VFileInput: { variant: 'outlined', density: 'compact' },
    VCheckbox: { density: 'compact' },
    VSwitch: { density: 'compact' },
  },
  locale: {
    locale: 'ru',
    fallback: 'en',
    messages: { ru, en },
  },
})

theme.rounded = false

const app = createApp(App)

app.config.globalProperties.$color = palette
app.config.globalProperties.$theme = theme
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
