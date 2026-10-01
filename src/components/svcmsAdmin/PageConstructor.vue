<template>
  <div class="is_headapp page_constructor">
    <errors :errors="errors"/>

    <!-- ===== список страниц ===== -->
    <template v-if="view == 'list'">
      <header class="pc_head">
        <div class="pc_head__titles">
          <h1>Страницы шаблона</h1>
          <div v-if="template.header" class="pc_head__sub">{{ template.header }}</div>
        </div>
        <v-spacer />
        <div class="pc_head__actions">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="open_page_meta(null)">Создать страницу</v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-auto-fix" :loading="base_loading" @click="create_base_pages">Базовый набор</v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-page-layout-header-footer" @click="open_structure()">Шапка и подвал</v-btn>
        </div>
      </header>

      <div v-if="base_result" class="pc_base_result">{{ base_result }}</div>

      <div class="pc_list">
        <section class="pc_list__theme">
          <theme-axes
            :theme="theme"
            :scheme-lists="scheme_lists"
            :saving="theme_saving"
            @set-axis="set_axis"
            @edit-axis="open_theme"
          />
          <div class="pc_preview">
            <div class="pc_preview__head">
              <span>Превью: <b>{{ preview_page ? (preview_page.header || preview_page.url) : 'страница не выбрана' }}</b></span>
              <v-spacer />
              <v-progress-circular v-if="preview_loading" indeterminate size="16" width="2" color="primary" />
            </div>
            <iframe
              v-if="list_preview_src"
              class="pc_preview__frame"
              :srcdoc="list_preview_src"
              title="Превью страницы"
            />
            <div v-else class="pc_preview__empty">Выберите страницу в таблице справа</div>
          </div>
        </section>

        <section class="pc_list__pages">
          <table v-if="sorted_pages.length" class="pc_pages">
            <thead>
              <tr>
                <th class="pc_th" :class="sort_class('header')" @click="sort_by('header')">
                  название <span class="pc_arrow">{{ arrow('header') }}</span>
                </th>
                <th class="pc_th pc_th--url" :class="sort_class('url')" @click="sort_by('url')">
                  url <span class="pc_arrow">{{ arrow('url') }}</span>
                </th>
                <th class="pc_actions_col"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in sorted_pages"
                :key="p.id"
                class="pc_row"
                :class="{ 'is-selected': p.id === preview_id }"
                @click="select_preview(p)"
              >
                <td class="pc_name">
                  <a href="#" @click.stop.prevent="select_preview(p)">{{ p.header || '—' }}</a>
                </td>
                <td class="pc_url">
                  <a href="#" @click.stop.prevent="select_preview(p)">{{ p.url }}</a>
                </td>
                <td class="pc_actions">
                  <span class="pc_act pc_act--open" data-tip="Открыть редактор" @click.stop="open_page(p)"><v-icon size="22">mdi-square-edit-outline</v-icon></span>
                  <span class="pc_act pc_act--edit" data-tip="Параметры страницы" @click.stop="open_page_meta(p)"><v-icon size="22">mdi-pencil</v-icon></span>
                  <span class="pc_act pc_act--del" data-tip="Удалить страницу" @click.stop="del_ask(p)"><v-icon size="22">mdi-trash-can-outline</v-icon></span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="pc_empty">Страниц пока нет. Создайте первую или «базовый набор».</div>
        </section>
      </div>
    </template>

    <!-- ===== редактор страницы ===== -->
    <template v-else-if="view == 'editor'">
      <div class="pc_bar">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="back_to_list">К списку</v-btn>
        <span class="pc_current">{{ current.header || current.url }}</span>
        <span class="pc_current_url">{{ current.url }}</span>
        <span v-if="saved" class="pc_saved">сохранено</span>
        <v-spacer />
        <v-btn
          variant="outlined"
          prepend-icon="mdi-palette"
          :class="{ 'is-active': editor_theme_open }"
          @click="editor_theme_open = !editor_theme_open"
        >Тема</v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-page-layout-header-footer" @click="open_structure()">Шапка и подвал</v-btn>
        <v-btn variant="text" prepend-icon="mdi-settings" @click="open_page_meta(current)">Параметры</v-btn>
        <v-btn color="primary" prepend-icon="mdi-content-save" :loading="saving" @click="save_page">Сохранить</v-btn>
      </div>

      <theme-axes
        v-if="editor_theme_open"
        :theme="theme"
        :scheme-lists="scheme_lists"
        :saving="theme_saving"
        @set-axis="set_axis"
        @edit-axis="open_theme"
      />

      <block-editor
        v-if="current_doc"
        :key="current.id"
        :doc="current_doc"
        :header="structure.header"
        :footer="structure.footer"
        :config-rev="theme_rev"
        @change="on_editor_change"
        @edit-structure="open_structure"
      />
    </template>

    <!-- ===== редактор шапки/подвала ===== -->
    <template v-else>
      <div class="pc_bar">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="back_to_list">К списку</v-btn>
        <span class="pc_current">Шапка и подвал</span>
        <span class="pc_current_url">общие для всех страниц шаблона</span>
        <span v-if="structure_saved" class="pc_saved">сохранено</span>
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-content-save" :loading="structure_saving" @click="save_structure">Сохранить</v-btn>
      </div>
      <block-editor
        v-if="structure_doc"
        key="structure"
        role="structure"
        :doc="structure_doc"
        @change="on_structure_change"
      />
    </template>

    <v-dialog v-model="meta_open" max-width="520">
      <v-card>
        <v-card-title class="text-h5">{{ meta_form.id ? 'Параметры страницы' : 'Новая страница' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="meta_form.url" label="url страницы" density="compact" variant="outlined" hide-details class="mb-3" />
          <v-text-field v-model="meta_form.header" label="название страницы" density="compact" variant="outlined" hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="meta_open = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!meta_form.url" :loading="meta_saving" @click="save_page_meta">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="del_open" max-width="480">
      <v-card>
        <v-card-title class="text-h5">Удаление страницы</v-card-title>
        <v-card-text>Удалить страницу «{{ del_page ? (del_page.header || del_page.url) : '' }}»?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="del_open = false">Отмена</v-btn>
          <v-btn color="error" @click="del_do">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="theme_open" fullscreen>
      <v-card class="pc_theme_dialog">
        <div class="pc_theme_head">
          <span class="pc_theme_title">{{ theme_title }}</span>
          <v-spacer />
          <v-btn variant="text" @click="theme_open = false">Закрыть</v-btn>
        </div>
        <theme-tool
          v-if="theme_open"
          :key="theme_axis"
          :axis="theme_axis"
          :template_id="template_id"
          :template_base="effective_template_base"
          :theme="theme"
          :saved="theme[theme_axis] || {}"
          @saved="on_theme_saved"
        />
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import ThemeTool from './page_constructor/ThemeTool.vue'
import ThemeAxes from './page_constructor/ThemeAxes.vue'
import BlockEditor from './page_constructor/editor/BlockEditor.vue'
import { PC } from './page_constructor/engine'
const BLOCKS_EMPTY = { schema: 'svcms.page_blocks', version: 2, blocks: [] }
const THEME_TITLES = { color: 'Цветовая схема', style: 'Стиль', layout: 'Компоновка', font: 'Шрифт' }

export default {
  components: { ThemeTool, ThemeAxes, BlockEditor },
  props: {
    params: { type: Object, default: () => ({}) },
    is_headapp: { type: String, default: '' },
    // Режим доступа/встраивания: 'page' (по умолчанию) | 'embedded'.
    open_mode: { type: String, default: 'page' }
  },
  data() {
    return {
      errors: [],
      template: {},
      template_base: '',
      pc_config: {},
      theme: {},
      structure: { header: null, footer: null },
      pages: [],
      sort_key: 'url',
      sort_dir: 'asc',
      view: 'list',
      current: {},
      current_doc: null,
      saving: false,
      saved: false,
      base_loading: false,
      base_result: '',
      theme_open: false,
      theme_axis: 'color',
      theme_saving: '',
      theme_rev: 0,
      editor_theme_open: false,
      scheme_lists: { color: [], style: [], layout: [], font: [] },
      preview_id: null,
      preview_page: null,
      preview_docs: {},
      preview_loading: false,
      list_preview_src: '',
      structure_doc: null,
      structure_saving: false,
      structure_saved: false,
      meta_open: false,
      meta_saving: false,
      meta_form: { id: null, url: '', header: '' },
      del_open: false,
      del_page: null
    }
  },
  computed: {
    template_id() {
      return parseInt(this.params.template_id)
    },
    api() {
      return BackendBase + '/svcmsadmin/page-constructor'
    },
    // templateBase для предпросмотра: http(s) от бэка, иначе локальная копия шаблона
    effective_template_base() {
      const b = this.template_base || (this.pc_config && this.pc_config.templateBase) || ''
      if (/^https?:\/\//i.test(b)) return b
      return BaseUrl + 'page_constructor/template/'
    },
    sorted_pages() {
      const key = this.sort_key === 'url' ? 'url' : 'header'
      const dir = this.sort_dir === 'desc' ? -1 : 1
      return this.pages.slice().sort((a, b) =>
        dir * String(a[key] || '').localeCompare(String(b[key] || ''), 'ru')
      )
    },
    theme_title() {
      return 'Тема шаблона · ' + (THEME_TITLES[this.theme_axis] || this.theme_axis)
    }
  },
  created() {
    this.init()
  },
  methods: {
    build_custom_css(theme) {
      const t = theme || this.theme || {}
      let out = ''
      ;['color', 'style', 'layout', 'font'].forEach(a => {
        if (t[a] && t[a].custom && t[a].css) out += t[a].css + '\n'
      })
      return out
    },
    set_errors(d) {
      const e = d && d.errors
      this.errors = Array.isArray(e) ? e.map(String) : (e ? [String(e)] : [])
    },
    init() {
      if (!this.template_id) { this.errors = ['не указан template_id']; return }
      this.$http.post(this.api + '/init', { template_id: this.template_id }).then(r => {
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.template = d.template || {}
        this.template_base = d.templateBase || ''
        this.theme = d.theme || {}
        this.structure = d.structure || { header: null, footer: null }
        this.pc_config = Object.assign({}, d.config || {}, { customCss: this.build_custom_css(d.theme) })
        this.apply_pc_config()
        this.pages = d.pages || []
        this.load_scheme_lists()
        this.ensure_preview()
      }).catch(e => { this.errors = ['ошибка запроса: ' + e] })
    },
    ensure_preview() {
      if (this.preview_id && this.pages.some(p => p.id === this.preview_id)) {
        const page = this.preview_docs[this.preview_id]
        if (page) this.render_list_preview(page)
        else this.select_preview(this.pages.find(p => p.id === this.preview_id))
        return
      }
      const def = this.pages.find(p => p.url === '/') || this.pages[0]
      if (def) this.select_preview(def)
      else { this.preview_id = null; this.preview_page = null; this.list_preview_src = '' }
    },
    select_preview(p) {
      if (!p) return
      this.preview_id = p.id
      this.preview_page = p
      const cached = this.preview_docs[p.id]
      if (cached) { this.render_list_preview(cached); return }
      this.preview_loading = true
      this.$http.get(this.api + '/page/' + p.id).then(r => {
        this.preview_loading = false
        const d = r.data || {}
        if (!d.success) return
        this.preview_docs[p.id] = d.page
        if (this.preview_id === p.id) this.render_list_preview(d.page)
      }).catch(e => { this.preview_loading = false; this.errors = ['ошибка запроса: ' + e] })
    },
    preview_blocks(page) {
      const all = (page && page.blocks && page.blocks.blocks) ? page.blocks.blocks : ((page && page.blocks) || [])
      const h = all.filter(b => b.type === 'header')[0] || this.structure.header
      const f = all.filter(b => b.type === 'footer')[0] || this.structure.footer
      const content = all.filter(b => b.type !== 'header' && b.type !== 'footer')
      return [h, ...content, f].filter(Boolean)
    },
    render_list_preview(page) {
      if (!page) { this.list_preview_src = ''; return }
      try {
        const blocks = this.preview_blocks(page)
        this.list_preview_src = PC.buildPreviewDoc(PC.renderAll(blocks), blocks.map(b => b.type))
      } catch (e) { this.list_preview_src = '' }
    },
    on_theme_changed() {
      this.apply_pc_config()
      this.theme_rev += 1
      const page = this.preview_docs[this.preview_id]
      if (page) this.render_list_preview(page)
    },
    load_scheme_lists() {
      ;['color', 'style', 'layout', 'font'].forEach(axis => {
        this.$http.get(this.api + '/theme-schemes/' + axis).then(r => {
          const d = r.data || {}
          if (!d.success) return
          this.scheme_lists = Object.assign({}, this.scheme_lists, { [axis]: d.schemes || [] })
        }).catch(() => {})
      })
    },
    set_axis(axis, name) {
      const cur = this.theme[axis] || {}
      if (!name || name === cur.name) return
      this.theme_saving = axis
      this.$http.post(this.api + '/theme/save', { template_id: this.template_id, axis, name, css: '' }).then(r => {
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) { this.theme_saving = ''; return }
        const scheme = (this.scheme_lists[axis] || []).find(s => s.name === name) || {}
        const apply = (css) => {
          this.theme = Object.assign({}, this.theme, {
            [axis]: { name: d.name || name, custom: !!scheme.is_custom, css: css || '' }
          })
          this.pc_config = Object.assign({}, this.pc_config, {
            [axis]: d.name || name,
            customCss: this.build_custom_css(this.theme)
          })
          this.on_theme_changed()
          this.theme_saving = ''
        }
        if (scheme.is_custom) {
          this.$http.get(this.api + '/theme-schemes/' + axis + '/' + encodeURIComponent(name)).then(sr => {
            apply(((sr.data || {}).scheme || {}).css || '')
          }).catch(() => apply(''))
        } else {
          apply('')
        }
      }).catch(e => { this.theme_saving = ''; this.errors = ['ошибка запроса: ' + e] })
    },
    open_theme(axis) {
      this.theme_axis = axis
      this.theme_open = true
    },
    on_theme_saved(res) {
      if (!this.theme[res.axis]) this.theme[res.axis] = {}
      this.theme[res.axis] = { name: res.name, custom: !!res.custom, css: res.css || '' }
      this.pc_config = Object.assign({}, this.pc_config, {
        [res.axis]: res.name,
        customCss: this.build_custom_css(this.theme)
      })
      this.on_theme_changed()
    },
    load_pages() {
      this.init()
    },
    create_base_pages() {
      this.base_loading = true
      this.base_result = ''
      this.$http.post(this.api + '/base-pages', { template_id: this.template_id }).then(r => {
        this.base_loading = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        const created = d.created || []
        const skipped = d.skipped || []
        this.base_result = 'создано: ' + created.length + ', пропущено: ' + skipped.length
        this.preview_docs = {}
        clearTimeout(this._base_timer)
        this._base_timer = setTimeout(() => { this.base_result = '' }, 5000)
        this.load_pages()
      }).catch(e => { this.base_loading = false; this.errors = ['ошибка запроса: ' + e] })
    },
    sort_by(key) {
      if (this.sort_key === key) {
        this.sort_dir = this.sort_dir === 'asc' ? 'desc' : 'asc'
      } else {
        this.sort_key = key
        this.sort_dir = 'asc'
      }
    },
    sort_class(key) { return { 'is-sorted': this.sort_key === key } },
    arrow(key) {
      if (this.sort_key !== key) return '↕'
      return this.sort_dir === 'asc' ? '↑' : '↓'
    },
    open_page(p) {
      this.$http.get(this.api + '/page/' + p.id).then(r => {
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        const page = d.page || {}
        const doc = (page.blocks && page.blocks.blocks) ? page.blocks : Object.assign({}, BLOCKS_EMPTY, { blocks: page.blocks || [] })
        this.current = page
        this.current_doc = doc
        this.saved = false
        this.apply_pc_config()
        this.view = 'editor'
      }).catch(e => { this.errors = ['ошибка запроса: ' + e] })
    },
    apply_pc_config() {
      window.PAGE_CONSTRUCTOR_CONFIG = Object.assign({}, this.pc_config, {
        templateBase: this.effective_template_base,
        dataBase: BaseUrl + 'page_constructor/js/data/',
        customCss: this.build_custom_css()
      })
    },
    on_editor_change(doc) {
      this.current_doc = doc
    },
    save_page() {
      this.saving = true
      const blocks = this.current_doc ? JSON.stringify(this.current_doc) : JSON.stringify(BLOCKS_EMPTY)
      this.$http.post(this.api + '/page/save', {
        id: this.current.id,
        template_id: this.template_id,
        url: this.current.url,
        header: this.current.header,
        blocks
      }).then(r => {
        this.saving = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.saved = true
        delete this.preview_docs[this.current.id]
        clearTimeout(this._saved_timer)
        this._saved_timer = setTimeout(() => { this.saved = false }, 1500)
        this.load_pages()
      }).catch(e => { this.saving = false; this.errors = ['ошибка запроса: ' + e] })
    },
    open_structure() {
      const blocks = [this.structure.header, this.structure.footer].filter(Boolean)
      this.structure_doc = { schema: 'svcms.page_blocks', version: 2, blocks }
      this.structure_saved = false
      this.view = 'structure'
    },
    on_structure_change(doc) {
      this.structure_doc = doc
    },
    save_structure() {
      const doc = this.structure_doc || { blocks: [] }
      const header = (doc.blocks || []).find(b => b.type === 'header') || null
      const footer = (doc.blocks || []).find(b => b.type === 'footer') || null
      this.structure_saving = true
      this.$http.post(this.api + '/structure/save', {
        template_id: this.template_id,
        header,
        footer
      }).then(r => {
        this.structure_saving = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.structure = d.structure || { header, footer }
        this.structure_saved = true
        clearTimeout(this._struct_timer)
        this._struct_timer = setTimeout(() => { this.structure_saved = false }, 1500)
      }).catch(e => { this.structure_saving = false; this.errors = ['ошибка запроса: ' + e] })
    },
    back_to_list() {
      this.view = 'list'
      this.current = {}
      this.current_doc = null
      this.structure_doc = null
      this.load_pages()
    },
    open_page_meta(p) {
      this.meta_form = p
        ? { id: p.id, url: p.url, header: p.header }
        : { id: null, url: '', header: '' }
      this.meta_open = true
    },
    save_page_meta() {
      this.meta_saving = true
      const body = { id: this.meta_form.id, template_id: this.template_id, url: this.meta_form.url, header: this.meta_form.header }
      if (this.meta_form.id && this.current.id === this.meta_form.id) {
        body.blocks = this.current_doc ? JSON.stringify(this.current_doc) : JSON.stringify(BLOCKS_EMPTY)
      }
      this.$http.post(this.api + '/page/save', body).then(r => {
        this.meta_saving = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        if (this.meta_form.id && this.current.id === this.meta_form.id) {
          this.current.url = this.meta_form.url
          this.current.header = this.meta_form.header
        }
        if (this.meta_form.id) delete this.preview_docs[this.meta_form.id]
        this.meta_open = false
        this.load_pages()
      }).catch(e => { this.meta_saving = false; this.errors = ['ошибка запроса: ' + e] })
    },
    del_ask(p) {
      this.del_page = p
      this.del_open = true
    },
    del_do() {
      this.del_open = false
      const delId = this.del_page ? this.del_page.id : null
      this.$http.post(this.api + '/page/' + this.del_page.id + '/delete').then(r => {
        const d = r.data || {}
        this.set_errors(d)
        if (delId) {
          delete this.preview_docs[delId]
          if (this.preview_id === delId) { this.preview_id = null; this.preview_page = null; this.list_preview_src = '' }
        }
        this.load_pages()
      }).catch(e => { this.errors = ['ошибка запроса: ' + e] })
    }
  }
}
</script>
<style scoped lang="scss">
  .page_constructor {margin: 16px 20px; max-width: none;}

  /* ---------- заголовок ---------- */
  .pc_head {display: flex; align-items: flex-start; gap: 16px; margin-bottom: 18px; flex-wrap: wrap;}
  .pc_head__titles h1 {margin: 0;}
  .pc_head__sub {color: rgba(var(--v-theme-on-surface), .6); font-size: var(--app-font-value); margin-top: 2px;}
  .pc_head__actions {display: flex; align-items: center; gap: 8px; flex-wrap: wrap;}
  .pc_head__actions .v-btn {text-transform: none;}

  /* ---------- две колонки: тема+превью | страницы (список — по ширине контента) ---------- */
  .pc_list {display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 20px; align-items: start;}
  .pc_list__theme {position: sticky; top: 16px; display: flex; flex-direction: column; height: calc(100vh - 32px); min-width: 0;}
  .pc_list__pages {min-width: 0; max-width: 100%;}
  .pc_preview {flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; border: 1px solid rgba(var(--v-theme-on-surface), .12); border-radius: var(--app-radius-card); background: rgb(var(--v-theme-surface)); overflow: hidden;}
  .pc_preview__head {display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .1); font-size: var(--app-font-desc); color: rgba(var(--v-theme-on-surface), .7);}
  .pc_preview__head b {color: rgb(var(--v-theme-on-surface));}
  .pc_preview__frame {display: block; width: 100%; flex: 1 1 auto; min-height: 0; border: 0; background: #fff;}
  .pc_preview__empty {flex: 1 1 auto; display: flex; align-items: center; justify-content: center; padding: 48px 16px; text-align: center; color: rgba(var(--v-theme-on-surface), .5);}

  /* ---------- таблица страниц ---------- */
  .pc_pages {width: auto; border-collapse: collapse;}
  .pc_pages th {text-align: left; font-size: var(--app-font-label); text-transform: uppercase; letter-spacing: .4px; color: rgba(var(--v-theme-on-surface), .55); padding: 10px 12px; border-bottom: 2px solid rgba(var(--v-theme-on-surface), .14);}
  .pc_th {cursor: pointer; user-select: none; white-space: nowrap; transition: color .15s;}
  .pc_th:hover {color: rgb(var(--v-theme-primary));}
  .pc_th.is-sorted {color: rgb(var(--v-theme-primary));}
  .pc_th--url {width: auto;}
  .pc_arrow {font-size: 12px; opacity: .55; margin-left: 4px;}
  .pc_th.is-sorted .pc_arrow {opacity: 1;}
  .pc_row {transition: background .12s; cursor: pointer;}
  .pc_row:hover {background: var(--app-tint);}
  .pc_row.is-selected {background: rgba(var(--v-theme-primary), .10); box-shadow: inset 3px 0 0 rgb(var(--v-theme-primary));}
  .pc_pages td {padding: 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08); font-size: var(--app-font-value);}
  .pc_name a {font-weight: 600; font-size: 12px; color: rgb(var(--v-theme-primary)); text-decoration: none;}
  .pc_name a:hover {text-decoration: underline;}
  .pc_url a {color: rgb(var(--v-theme-on-surface)); font-family: var(--app-font-mono, monospace); font-size: var(--app-font-value); text-decoration: none;}
  .pc_url a:hover {color: rgb(var(--v-theme-primary)); text-decoration: underline;}
  .pc_actions_col {width: 130px;}
  .pc_actions {width: 130px; text-align: right; white-space: nowrap;}
  .pc_act {position: relative; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; margin-left: 10px; border-radius: 50%; padding: 4px; transition: background .15s, transform .12s;}
  .pc_act:hover {transform: scale(1.12);}
  .pc_act .v-icon {color: inherit;}
  .pc_act::after {
    content: attr(data-tip);
    position: absolute; right: 0; bottom: calc(100% + 8px);
    background: rgba(23, 26, 43, .95); color: #fff;
    font-size: 11px; line-height: 1; white-space: nowrap; letter-spacing: 0;
    padding: 6px 9px; border-radius: 6px; box-shadow: 0 4px 14px rgba(0, 0, 0, .22);
    opacity: 0; visibility: hidden; transform: translateY(3px);
    transition: opacity .12s, transform .12s, visibility .12s; pointer-events: none; z-index: 30;
  }
  .pc_act:hover::after {opacity: 1; visibility: visible; transform: translateY(0);}
  .pc_act--open {color: rgb(var(--v-theme-primary));}
  .pc_act--open:hover {background: rgba(var(--v-theme-primary), .14);}
  .pc_act--edit {color: rgb(var(--v-theme-info));}
  .pc_act--edit:hover {background: rgba(var(--v-theme-info), .14);}
  .pc_act--del {color: rgba(var(--v-theme-on-surface), .45);}
  .pc_act--del:hover {color: rgb(var(--v-theme-error)); background: rgba(var(--v-theme-error), .12);}
  .pc_empty {color: rgba(var(--v-theme-on-surface), .55); padding: 28px 4px; text-align: center;}
  .pc_base_result {color: rgb(var(--v-theme-success)); font-size: var(--app-font-desc); margin: -8px 0 14px;}

  /* ---------- бары редакторов ---------- */
  .pc_bar {display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .12);}
  .pc_bar .v-btn {margin: 0; text-transform: none;}
  .pc_current {font-weight: bold; color: rgb(var(--v-theme-primary)); font-size: var(--app-font-h2);}
  .pc_current_url {font-family: var(--app-font-mono, monospace); color: rgba(var(--v-theme-on-surface), .55); font-size: var(--app-font-desc);}
  .pc_saved {color: rgb(var(--v-theme-success)); font-weight: bold; font-size: var(--app-font-desc);}

  /* ---------- диалог темы ---------- */
  .pc_theme_dialog {height: 100%; padding: 16px 22px; display: flex; flex-direction: column; overflow: hidden;}
  .pc_theme_head {display: flex; align-items: center; margin-bottom: 10px;}
  .pc_theme_title {font-weight: bold; color: rgb(var(--v-theme-primary)); font-size: var(--app-font-h2);}

  @media (max-width: 1200px) {
    .pc_list {grid-template-columns: 1fr;}
    .pc_list__theme {position: static; height: auto;}
    .pc_preview__frame {height: 520px; flex: none;}
  }
  @media (max-width: 640px) { .pc_th--url {width: auto;} .pc_actions {width: auto;} }
</style>
