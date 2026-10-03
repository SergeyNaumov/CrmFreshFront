<template>
  <div class="tt">
    <div class="tt_head">
      <v-btn-toggle v-model="mode" density="compact" variant="outlined" mandatory>
        <v-btn value="preset" size="small">Готовая схема</v-btn>
        <v-btn value="custom" size="small">Своя схема</v-btn>
      </v-btn-toggle>
      <span v-if="saving" class="tt_state">сохранение…</span>
      <span v-else-if="saved_flag" class="tt_ok">сохранено</span>
      <v-spacer />
      <v-btn color="primary" size="small" :loading="saving" @click="save">Сохранить</v-btn>
    </div>

    <div class="tt_body">
      <div class="tt_controls">
        <template v-if="mode == 'preset' && axis != 'font'">
          <v-select
            v-model="preset"
            :items="scheme_items"
            item-title="label"
            item-value="header"
            label="Схема"
            density="compact"
            variant="outlined"
            hide-details
          />
          <p v-if="preset_short" class="tt_short">{{ preset_short }}</p>
          <v-btn variant="text" size="small" @click="make_custom">настроить вручную</v-btn>
        </template>

        <template v-else>
          <template v-for="f in fields" :key="f.id">
            <v-select
              v-if="f.type == 'select'"
              v-model="values[f.id]"
              :items="select_items(f)"
              :label="f.label"
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-select
              v-else-if="f.type == 'preset'"
              v-model="values[f.id]"
              :items="preset_items"
              label="Пресет"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="apply_layout_preset"
            />
            <v-text-field
              v-else-if="f.type == 'text'"
              v-model="values[f.id]"
              :label="f.label"
              density="compact"
              variant="outlined"
              hide-details
            />
            <v-text-field
              v-else-if="f.type == 'number'"
              v-model.number="values[f.id]"
              type="number"
              :label="f.label + (f.unit ? ', ' + f.unit : '')"
              :min="f.min"
              :max="f.max"
              :step="f.step || 1"
              density="compact"
              variant="outlined"
              hide-details
            />
            <div v-else-if="f.type == 'range'" class="tt_field">
              <label>{{ f.label }}: <b>{{ values[f.id] }}{{ f.unit || '' }}</b></label>
              <input type="range" v-model.number="values[f.id]" :min="f.min" :max="f.max" :step="f.step || 1">
            </div>
            <div v-else-if="f.type == 'color'" class="tt_field">
              <label>{{ f.label }}</label>
              <div class="tt_color">
                <input type="color" v-model="values[f.id]">
                <input type="text" class="tt_hex" v-model="values[f.id]" spellcheck="false">
              </div>
            </div>
            <v-checkbox
              v-else-if="f.type == 'checkbox'"
              v-model="values[f.id]"
              :label="f.label"
              density="compact"
              hide-details
            />
          </template>
          <v-checkbox
            v-model="shared_scope"
            label="Общая схема (для всех доменов)"
            density="compact"
            hide-details
          />
          <v-btn v-if="axis != 'font'" variant="text" size="small" @click="mode = 'preset'">вернуться к готовым</v-btn>
        </template>

        <div class="tt_out">
          <div class="tt_out_head">Результат (CSS)</div>
          <textarea class="tt_css" readonly :value="css"></textarea>
        </div>
      </div>

      <div class="tt_preview">
        <theme-preview :template-base="template_base" :styles="preview_styles" />
      </div>
    </div>
  </div>
</template>
<script>
import ThemePreview from './ThemePreview.vue'
import { AXES, LAYOUT_PRESETS, default_values } from './theme_defs'

const DEFAULTS = { color: 'digitalstrateg', style: 'soft', layout: 'standard', font: 'inter' }

export default {
  components: { ThemePreview },
  props: {
    axis: { type: String, required: true },
    domain_id: { type: Number, required: true },
    template_base: { type: String, default: '' },
    theme: { type: Object, default: () => ({}) },
    saved: { type: Object, default: () => ({}) }
  },
  emits: ['saved'],
  data() {
    return {
      mode: 'preset',
      preset: '',
      values: default_values(this.axis),
      schemes: [],
      scheme_cache: {},
      shared_scope: false,
      preview_styles: [],
      saving: false,
      saved_flag: false
    }
  },
  computed: {
    api() { return BackendBase + '/svcmsadmin/page-constructor' },
    def() { return AXES[this.axis] },
    fields() { return this.def.fields },
    scheme_items() {
      return this.schemes.map(s => ({ header: s.header, label: s.label || s.header }))
    },
    preset_short() {
      const s = this.schemes.find(x => x.header === this.preset)
      return s ? (s.short || '') : ''
    },
    preset_items() {
      return Object.keys(LAYOUT_PRESETS).map(k => ({ value: k, title: k }))
    },
    css() { return this.def.build(this.values) }
  },
  created() {
    this.load_schemes()
    this.sync_from_saved()
    this.refresh_preview()
  },
  watch: {
    saved() { this.sync_from_saved(); this.refresh_preview() },
    axis() {
      this.values = default_values(this.axis)
      this.preset = ''
      this.shared_scope = false
      this.schemes = []
      this.scheme_cache = {}
      this.load_schemes()
      this.sync_from_saved()
      this.refresh_preview()
    },
    preset() { this.refresh_preview() },
    mode() { this.refresh_preview() },
    css() { if (this.mode === 'custom' || this.axis === 'font') this.refresh_preview() }
  },
  methods: {
    load_schemes() {
      this.$http.get(this.api + '/theme-schemes/' + this.axis + '?domain_id=' + this.domain_id).then(r => {
        const d = r.data || {}
        this.schemes = d.schemes || []
        if (!this.preset) {
          const def = this.schemes.find(s => s.is_default) || this.schemes[0]
          this.preset = def ? def.header : ''
        }
      }).catch(() => { this.schemes = [] })
    },
    scheme_css(axis, name) {
      if (!name) return Promise.resolve('')
      const key = axis + '/' + name
      if (this.scheme_cache[key] !== undefined) return Promise.resolve(this.scheme_cache[key])
      const url = this.api + '/theme-schemes/' + axis + '/' + encodeURIComponent(name)
      return this.$http.get(url + '?domain_id=' + this.domain_id).then(r => {
        const css = ((r.data || {}).scheme || {}).css || ''
        this.scheme_cache[key] = css
        return css
      }).catch(() => '')
    },
    // Опция ['#', 'Заголовок'] превращается в группу — длинные списки
    // (например, украшения заголовка) читаются по разделам.
    select_items(f) {
      return (f.options || []).map(o => o[0] === '#'
        ? { header: o[1] }
        : { value: o[0], title: o[1] })
    },
    async refresh_preview() {
      const order = ['color', 'style', 'layout', 'font']
      const out = {}
      for (const ax of order) {
        if (ax === this.axis) {
          out[ax] = (this.mode === 'custom' || ax === 'font') ? this.css : await this.scheme_css(ax, this.preset)
        } else {
          const t = this.theme[ax] || {}
          out[ax] = t.css ? t.css : await this.scheme_css(ax, t.name || DEFAULTS[ax])
        }
      }
      this.preview_styles = order.map(k => out[k]).filter(Boolean)
    },
    sync_from_saved() {
      const s = this.saved || {}
      if (s.custom) {
        this.mode = 'custom'
        if (s.name) this.values.name = s.name
      } else {
        this.mode = this.axis === 'font' ? 'custom' : 'preset'
        if (s.name) this.preset = s.name
      }
    },
    async make_custom() {
      const css = await this.scheme_css(this.axis, this.preset)
      const map = this.def.facts || {}
      const vars = {}
      const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi
      let m
      while ((m = re.exec(css)) !== null) vars['--' + m[1]] = m[2].trim()
      Object.keys(map).forEach(cssVar => {
        if (vars[cssVar] === undefined) return
        const f = this.fields.find(x => x.id === map[cssVar])
        if (!f) return
        let v = vars[cssVar]
        if (f.type === 'number' || f.type === 'range') v = parseFloat(v)
        this.values[map[cssVar]] = v
      })
      // Поля без CSS-токена (facts их не покрывают) берём из пресета,
      // иначе decor сбрасывается в base и украшение заголовка теряется.
      const preset = LAYOUT_PRESETS[this.preset]
      if (preset) this.fields.forEach(f => {
        if (map['--' + f.id] !== undefined) return
        if (preset[f.id] !== undefined) this.values[f.id] = preset[f.id]
      })
      if (this.preset) this.values.name = this.preset + '-custom'
      this.mode = 'custom'
    },
    apply_layout_preset(id) {
      const p = LAYOUT_PRESETS[id]
      if (!p) return
      Object.keys(p).forEach(k => { this.values[k] = p[k] })
    },
    save() {
      this.saving = true
      this.saved_flag = false
      const is_font = this.axis === 'font'
      const preset = this.mode === 'preset' && !is_font
      const body = {
        domain_id: this.domain_id,
        axis: this.axis,
        name: preset ? this.preset : (this.values.name || this.axis),
        css: preset ? '' : this.css,
        scope: this.mode === 'custom' && this.shared_scope ? 'shared' : 'domain'
      }
      this.$http.post(this.api + '/theme/save', body).then(r => {
        this.saving = false
        const d = r.data || {}
        if (!d.success) return
        this.saved_flag = true
        clearTimeout(this._t)
        this._t = setTimeout(() => { this.saved_flag = false }, 1500)
        this.load_schemes()
        this.$emit('saved', { axis: this.axis, name: d.name, custom: d.custom, css: body.css })
      }).catch(() => { this.saving = false })
    }
  }
}
</script>
<style scoped lang="scss">
  .tt {display: flex; flex-direction: column; height: 100%;}
  .tt_head {display: flex; align-items: center; gap: 10px; margin-bottom: 12px;}
  .tt_state {color: rgba(var(--v-theme-on-surface), .6);}
  .tt_ok {color: rgb(var(--v-theme-success)); font-weight: bold;}
  .tt_body {display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 20px; flex: 1 1 auto; min-height: 0;}
  .tt_controls {display: flex; flex-direction: column; gap: 10px; overflow: auto;}
  .tt_field {display: flex; flex-direction: column; gap: 4px; font-size: 13px;}
  .tt_field > label {font-weight: 600; color: rgba(var(--v-theme-on-surface), .8);}
  .tt_field input[type="range"] {width: 100%;}
  .tt_color {display: flex; gap: 6px; align-items: center;}
  .tt_color input[type="color"] {flex: 0 0 46px; width: 46px; height: 34px; padding: 2px; border: 1px solid rgba(var(--v-theme-on-surface), .24); border-radius: var(--app-radius-field); cursor: pointer; background: transparent;}
  .tt_hex {flex: 1 1 auto; min-width: 0; padding: 7px 9px; font-family: var(--app-font-mono, monospace); font-size: 13px; color: inherit; background: transparent; border: 1px solid rgba(var(--v-theme-on-surface), .24); border-radius: var(--app-radius-field);}
  .tt_short {font-size: var(--app-font-desc); color: rgba(var(--v-theme-on-surface), .6); margin: 0;}
  .tt_out {margin-top: 6px;}
  .tt_out_head {font-size: var(--app-font-desc); color: rgba(var(--v-theme-on-surface), .6); margin-bottom: 4px;}
  .tt_css {width: 100%; min-height: 160px; padding: 10px; font-family: var(--app-font-mono, monospace); font-size: 12px; line-height: 1.5; white-space: pre; overflow: auto; color: rgba(var(--v-theme-on-surface), .85); background: var(--app-tint); border: 1px solid rgba(var(--v-theme-on-surface), .18); border-radius: var(--app-radius-field);}
  .tt_preview {min-height: 0; height: 100%;}
  @media (max-width: 991px) { .tt_body {grid-template-columns: 1fr;} }
</style>
