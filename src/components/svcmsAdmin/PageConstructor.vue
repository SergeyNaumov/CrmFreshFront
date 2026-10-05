<template>
  <div class="is_headapp page_constructor">
    <errors :errors="errors"/>

    <!-- ===== битый JSON блоков: страница выглядит пустой, объясняем причину ===== -->
    <div v-if="blocks_error" class="pc_broken">
      <b>Страница не покажется: JSON блоков повреждён.</b>
      <div class="pc_broken__msg">{{ blocks_error }}</div>
      <button type="button" class="btn btn-primary" @click="open_json_fix">
        Открыть JSON-редактор и исправить
      </button>
    </div>

    <!-- ===== ручная правка JSON ===== -->
    <div v-if="json_fix" class="pc_modal">
      <div class="pc_modal__box">
        <h3 class="pc_modal__title">JSON блоков страницы</h3>
        <textarea v-model="json_text" class="pc_modal__ta" spellcheck="false"
                  rows="18" placeholder='{"schema":"svcms.page_blocks","version":2,"blocks":[...]}'
        ></textarea>
        <div v-if="json_error" class="pc_broken__msg">{{ json_error }}</div>
        <div class="pc_modal__foot">
          <button type="button" class="btn btn-primary" @click="apply_json_fix">Применить</button>
          <button type="button" class="btn" @click="json_fix = false">Закрыть</button>
          <span class="pc_modal__hint">После «Применить» не забудьте сохранить страницу.</span>
        </div>
      </div>
    </div>

    <!-- ===== список страниц ===== -->
    <template v-if="view == 'list'">
      <header class="pc_head">
        <div class="pc_head__titles">
          <h1>Страницы домена</h1>
          <div v-if="domain.domain" class="pc_head__sub">{{ domain.domain }}</div>
        </div>
        <v-spacer />
        <div class="pc_head__actions">
          <v-btn color="primary" prepend-icon="mdi-plus" @click="open_page_meta(null)">Создать страницу</v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-auto-fix" :loading="base_loading" @click="open_base">Базовый набор</v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-page-layout-header-footer" @click="open_structure()">Шапка и подвал</v-btn>
        </div>
      </header>

      <div v-if="base_result" class="pc_base_result">{{ base_result }}</div>

      <div class="pc_list" :class="{ 'is-theme-hidden': panel_theme_hidden, 'is-pages-hidden': panel_pages_hidden }">
        <section class="pc_panel pc_panel--theme" v-show="!panel_theme_hidden">
          <header class="pc_panel__head" @click="panel_theme_hidden = true"
                  title="Скрыть панель «Тема шаблона»">
            <v-icon size="18" class="pc_panel__caret">mdi-chevron-up</v-icon>
            <b>Тема шаблона</b>
            <span class="pc_panel__hint">кликните шапку — скрыть</span>
          </header>
          <theme-axes
            :theme="theme"
            :scheme-lists="scheme_lists"
            :saving="theme_saving"
            :pending="theme_pending"
            @set-axis="set_axis"
            @edit-axis="open_theme"
            @save-theme="save_theme"
          />
        </section>

        <section class="pc_panel pc_panel--pages" v-show="!panel_pages_hidden">
          <header class="pc_panel__head" @click="panel_pages_hidden = true"
                  title="Скрыть панель «Список страниц»">
            <v-icon size="18" class="pc_panel__caret">mdi-chevron-up</v-icon>
            <b>Список страниц</b>
            <span class="pc_panel__hint">{{ sorted_pages.length }} шт. · кликните шапку — скрыть</span>
          </header>
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

        <!-- Превью страницы: растягивается на всю ширину, когда боковые
             панели скрыты. -->
        <section class="pc_list__preview">
          <div class="pc_preview">
            <div class="pc_preview__head">
              <span>Превью: <b>{{ preview_page ? (preview_page.header || preview_page.url) : 'страница не выбрана' }}</b></span>
              <v-spacer />
              <v-progress-circular v-if="preview_loading" indeterminate size="16" width="2" color="primary" />
              <v-btn size="small" variant="text" prepend-icon="mdi-chevron-up"
                     :title="panel_theme_hidden ? 'Показать тему' : 'Скрыть тему'"
                     @click="panel_theme_hidden = !panel_theme_hidden">
                Тема
              </v-btn>
              <v-btn size="small" variant="text" prepend-icon="mdi-chevron-up"
                     :title="panel_pages_hidden ? 'Показать список страниц' : 'Скрыть список страниц'"
                     @click="panel_pages_hidden = !panel_pages_hidden">
                Страницы
              </v-btn>
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
        :pending="theme_pending"
        @set-axis="set_axis"
        @edit-axis="open_theme"
        @save-theme="save_theme"
      />

      <block-editor
        v-if="current_doc"
        ref="pageEditor"
        :key="current.id"
        :doc="current_doc"
        :header="structure.header"
        :footer="structure.footer"
        :config-rev="theme_rev"
        :expand-index="pending_block"
        @change="on_editor_change"
        @edit-structure="open_structure"
        @save="on_editor_save"
        @edit-block="on_edit_block"
      />
    </template>

    <!-- ===== редактор шапки/подвала ===== -->
    <template v-else>
      <div class="pc_bar">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="back_to_list">К списку</v-btn>
        <span class="pc_current">Шапка и подвал</span>
        <span class="pc_current_url">общие для всех страниц домена</span>
        <span v-if="structure_saved" class="pc_saved">сохранено</span>
        <v-spacer />
        <v-btn color="primary" prepend-icon="mdi-content-save" :loading="structure_saving" @click="save_structure">Сохранить</v-btn>
      </div>
      <block-editor
        v-if="structure_doc"
        ref="structEditor"
        key="structure"
        role="structure"
        :doc="structure_doc"
        @change="on_structure_change"
        @save="on_structure_save"
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

    <v-dialog v-model="base_open" max-width="640">
      <v-card>
        <v-card-title class="text-h5">Базовый набор страниц</v-card-title>
        <v-card-text>
          <v-select
            v-model="base_set_id"
            :items="base_sets"
            item-title="name"
            item-value="id"
            label="Набор"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.pages + ' стр.' + (item.raw.is_default ? ' · по умолчанию' : '')" />
            </template>
          </v-select>
          <v-checkbox
            v-model="base_overwrite"
            density="compact"
            hide-details
            label="Перезаписать существующие страницы набора"
          />

          <v-divider class="my-3" />
          <div class="pc_base_manage_title">Управление наборами</div>
          <div class="pc_base_new">
            <v-text-field v-model="base_new_name" label="Имя нового набора" density="compact" variant="outlined" hide-details />
            <v-checkbox v-model="base_new_from_domain" density="compact" hide-details label="из текущего домена" />
            <v-btn variant="outlined" :disabled="!base_new_name" :loading="base_manage_loading" @click="create_base_set">Создать</v-btn>
          </div>
          <div class="pc_base_actions">
            <v-btn size="small" variant="text" :disabled="!base_set_id" @click="update_base_set_from_domain">Обновить из домена</v-btn>
            <v-btn size="small" variant="text" :disabled="!base_set_id" @click="rename_base_set">Переименовать</v-btn>
            <v-btn size="small" variant="text" color="error" :disabled="!base_set_id || is_default_set" @click="delete_base_set">Удалить</v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="base_open = false">Отмена</v-btn>
          <v-btn color="primary" :loading="base_loading" :disabled="!base_set_id" @click="create_base_pages">Применить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="theme_open" fullscreen>
      <v-card class="pc_theme_dialog">
        <div class="pc_theme_head">
          <span class="pc_theme_title">{{ theme_title }}</span>
          <v-spacer />
          <v-btn variant="text" @click="close_theme">Закрыть</v-btn>
        </div>
        <theme-tool
          v-if="theme_open"
          :key="theme_axis"
          :axis="theme_axis"
          :domain_id="domain_id"
          :template_base="effective_template_base"
          :theme="theme"
          :saved="theme[theme_axis] || {}"
          @saved="on_theme_saved"
        />
      </v-card>
    </v-dialog>

    <!-- Несохранённые изменения темы: спросить перед уходом -->
    <v-dialog v-model="theme_confirm" max-width="460" persistent>
      <v-card class="pc_theme_dialog">
        <div class="pc_theme_head">
          <span class="pc_theme_title">Тема изменена</span>
        </div>
        <div style="padding: 18px 20px; line-height: 1.6">
          Есть несохранённые изменения темы шаблона. Сохранить их перед уходом?
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end; padding: 0 20px 18px">
          <v-btn variant="text" @click="theme_confirm_cancel">Отмена</v-btn>
          <v-btn variant="outlined" color="error" @click="theme_confirm_discard">Не сохранять</v-btn>
          <v-btn color="primary" :loading="theme_saving === 'all'" @click="theme_confirm_save">Сохранить</v-btn>
        </div>
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
      // Битый JSON блоков страницы: бэкенд отдаёт blocks_error/blocks_raw.
      blocks_error: null,
      blocks_raw: '',
      json_fix: false,
      json_text: '',
      json_error: '',
      domain: {},
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
      base_open: false,
      base_sets: [],
      base_set_id: null,
      base_overwrite: false,
      base_new_name: '',
      base_new_from_domain: true,
      base_manage_loading: false,
      theme_open: false,
      theme_axis: 'color',
      theme_saving: '',
      theme_rev: 0,
      // Несохранённые изменения темы: выбор схемы меняет только превью,
      // сохранение — по кнопке «Сохранить тему».
      theme_pending: false,
      theme_dirty: {},
      theme_confirm: false,
      theme_confirm_action: null,
      theme_confirm_next: null,
      editor_theme_open: false,
      scheme_lists: { color: [], style: [], layout: [], font: [] },
      preview_id: null,
      preview_page: null,
      preview_docs: {},
      preview_loading: false,
      list_preview_src: '',
      // Номер раскрытого блока в редакторе страницы (для URL и глубоких ссылок).
      current_block: -1,
      pending_block: -1,
      // Скрываемые панели на главной конструктора: тема и список страниц.
      // Нужно, чтобы рассмотреть превью в большом окошке.
      panel_theme_hidden: false,
      panel_pages_hidden: false,
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
    domain_id() {
      return parseInt(this.params.domain_id)
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
    is_default_set() {
      const s = this.base_sets.find(x => x.id === this.base_set_id)
      return !!(s && s.is_default)
    },
    doc_title() {
      const dom = (this.domain && this.domain.domain) || this.domain_id || ''
      let title = 'Конструктор шаблона' + (dom ? ' ' + dom : '')
      if (this.theme_open) title += ' · Тема'
      else if (this.view === 'editor') title += ' · ' + (this.current.header || this.current.url || 'страница')
      else if (this.view === 'structure') title += ' · Шапка и подвал'
      return title
    },
    theme_title() {
      return 'Тема домена · ' + (THEME_TITLES[this.theme_axis] || this.theme_axis)
    }
  },
  created() {
    this._prev_title = document.title
    this.init()
  },
  mounted() {
    // Закрытие вкладки с несохранённой темой — предупреждение браузера.
    this._theme_beforeunload = (e) => {
      if (!this.theme_pending) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', this._theme_beforeunload)
  },
  beforeUnmount() {
    if (this._theme_beforeunload) {
      window.removeEventListener('beforeunload', this._theme_beforeunload)
    }
    if (this._prev_title !== undefined) document.title = this._prev_title
  },
  // Уход из раздела конструктора с несохранённой темой — диалог подтверждения.
  // Внутренние переходы (список ↔ редактор ↔ структура ↔ тема) — это смена
  // route-record, но тот же раздел; их не перехватываем (иначе «К списку»
  // мог зависать на guard'е). Их обрабатывает leave_theme_guard в back_to_list.
  beforeRouteLeave(to, from, next) {
    const sameCtor = (to.path || '').indexOf('/page-constructor/' + this.domain_id) === 0
    if (sameCtor || !this.theme_pending) { next(); return }
    this.theme_confirm_next = next
    this.theme_confirm_action = () => next()
    this.theme_confirm = true
  },
  watch: {
    // Назад/вперёд в браузере: повторно разбираем URL.
    '$route.fullPath'() { this.on_route_change() },
    doc_title(v) { if (v) document.title = v }
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
      if (!this.domain_id) { this.errors = ['не указан domain_id']; return }
      this.$http.post(this.api + '/init', { domain_id: this.domain_id }).then(r => {
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.domain = d.domain || {}
        this.template_base = d.templateBase || ''
        this.theme = d.theme || {}
        this.theme_pending = false
        this.theme_dirty = {}
        this.structure = d.structure || { header: null, footer: null }
        this.pc_config = Object.assign({}, d.config || {}, { customCss: this.build_custom_css(d.theme) })
        this.apply_pc_config()
        this.load_asset_rev()
        this.pages = d.pages || []
        this.base_sets = d.base_sets || []
        const def_set = this.base_sets.find(s => s.is_default) || this.base_sets[0]
        this.base_set_id = d.base_set_id || (def_set ? def_set.id : null)
        this.load_scheme_lists()
        this.read_route()
        this.ensure_preview()
        document.title = this.doc_title
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
      this.apply_route()
    },
    /* ---------------- URL-навигация ----------------
       /page-constructor/<domain>                      — список страниц
       /page-constructor/<domain>/page/<id>            — редактор страницы
       /page-constructor/<domain>/structure            — шапка и подвал
       /page-constructor/<domain>/theme/<axis>         — конструктор темы
       Плюс query ?preview=<id> — какая страница показана в превью списка. */
    route_query() {
      const q = (this.$route && this.$route.query) || {}
      return {
        preview: q.preview !== undefined && q.preview !== '' ? String(q.preview) : '',
        theme: q.theme !== undefined && q.theme !== '' ? String(q.theme) : ''
      }
    },
    apply_route(force) {
      if (!this.$router) return
      const rp = (this.$route && this.$route.params) || {}
      // Входной URL ведёт в раздел (страница/шапка/подвал/тема), а приложение
      // ещё не перешло в него (данные грузятся) — свой путь не навязываем,
      // иначе глубокая ссылка будет затёрта до того, как откроется раздел.
      const cur = this.view === 'editor' ? 'page' : this.view === 'structure' ? 'structure' : ''
      if (!force && rp.view && rp.view !== cur) return
      if (!force && rp.axis && !this.theme_open) return
      // Пока открыт раздел темы (/theme/<axis>), свой путь не навязываем.
      if (!force && rp.axis && this.theme_open) return
      let view = this.view === 'editor' ? '/page/' + this.current.id
        : this.view === 'structure' ? '/structure'
        : ''
      if (view && this.current_block >= 0) view += '/block/' + this.current_block
      const query = {}
      if (this.view === 'list' && this.preview_id) query.preview = this.preview_id
      if (this.theme_open && this.theme_axis && !rp.axis) query.theme = this.theme_axis
      const want = { path: '/page-constructor/' + this.domain_id + view, query: query }
      if (this.$route && this.$route.path === want.path &&
          JSON.stringify(this.$route.query || {}) === JSON.stringify(query)) return
      this.$router.replace(want).catch(() => {})
    },
    // Разбор URL при входе/переходе: сразу открываем нужный раздел.
    read_route() {
      const rp = (this.$route && this.$route.params) || {}
      const q = this.route_query()
      // Вид шапки/темы открывается и по /theme/<axis>, и по ?theme=<axis>.
      const axis = rp.axis || q.theme
      if (axis && ['color', 'style', 'layout', 'font'].indexOf(axis) !== -1) {
        this.theme_axis = axis
        this.theme_open = true
      }
      if (rp.view === 'structure') { this.open_structure(); return }
      if (rp.view === 'page' && rp.page_id) {
        const p = this.pages.find(x => String(x.id) === String(rp.page_id))
        if (p) {
          // /block/<n> — сразу раскрываем нужный блок после загрузки страницы.
          const bi = rp.block_id !== undefined && rp.block_id !== '' ? parseInt(rp.block_id, 10) : -1
          this.pending_block = isNaN(bi) ? -1 : bi
          this.open_page(p)
          return
        }
      }
      // ?preview=<id> — какая страница показана в превью списка.
      if (q.preview) {
        const p = this.pages.find(x => String(x.id) === String(q.preview))
        if (p) this.preview_id = p.id
      }
    },
    select_preview(p) {
      if (!p) return
      this.preview_id = p.id
      this.preview_page = p
      const cached = this.preview_docs[p.id]
      if (cached) { this.render_list_preview(cached); this.apply_route(); return }
      this.preview_loading = true
      this.$http.get(this.api + '/page/' + p.id).then(r => {
        this.preview_loading = false
        const d = r.data || {}
        if (!d.success) return
        this.preview_docs[p.id] = d.page
        if (this.preview_id === p.id) this.render_list_preview(d.page)
        this.apply_route()
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
        this.$http.get(this.api + '/theme-schemes/' + axis + '?domain_id=' + this.domain_id).then(r => {
          const d = r.data || {}
          if (!d.success) return
          this.scheme_lists = Object.assign({}, this.scheme_lists, { [axis]: d.schemes || [] })
        }).catch(() => {})
      })
    },
    // Выбор схемы оси меняет ТОЛЬКО превью; сохранение — по кнопке
    // «Сохранить тему» (save_theme). Иначе тема сохранялась мгновенно.
    set_axis(axis, name) {
      const cur = this.theme[axis] || {}
      if (!name || name === cur.name) return
      const scheme = (this.scheme_lists[axis] || []).find(s => s.header === name) || {}
      const apply = (css) => {
        this.theme = Object.assign({}, this.theme, {
          [axis]: { name, custom: !!scheme.is_custom, css: css || '' }
        })
        this.pc_config = Object.assign({}, this.pc_config, {
          [axis]: name,
          customCss: this.build_custom_css(this.theme)
        })
        this.theme_dirty = Object.assign({}, this.theme_dirty, { [axis]: true })
        this.theme_pending = true
        this.on_theme_changed()
      }
      if (scheme.is_custom) {
        this.$http.get(this.api + '/theme-schemes/' + axis + '/' + encodeURIComponent(name) + '?domain_id=' + this.domain_id)
          .then(sr => apply(((sr.data || {}).scheme || {}).css || ''))
          .catch(() => apply(''))
      } else {
        apply('')
      }
    },
    // Сохраняет все изменённые оси темы одной пачкой.
    save_theme() {
      const axes = Object.keys(this.theme_dirty || {})
      if (!axes.length) { this.theme_pending = false; return }
      this.theme_saving = 'all'
      const jobs = axes.map(axis => {
        const t = this.theme[axis] || {}
        const css = (t.custom && t.css) ? t.css : ''
        return this.$http.post(this.api + '/theme/save', {
          domain_id: this.domain_id, axis, name: t.name || '', css
        })
      })
      Promise.all(jobs).then(results => {
        this.theme_saving = ''
        const bad = (results || []).find(r => !((r.data || {}).success))
        if (bad) { this.set_errors(bad.data); return }
        this.theme_dirty = {}
        this.theme_pending = false
        this.load_scheme_lists()
        this.on_theme_changed()
      }).catch(e => { this.theme_saving = ''; this.errors = ['ошибка запроса: ' + e] })
    },
    // Откат несохранённых изменений темы к состоянию из БД.
    reload_theme() {
      this.$http.get(this.api + '/theme/' + this.domain_id).then(r => {
        const d = r.data || {}
        if (!d.success) return
        this.theme = d.theme || {}
        this.pc_config = Object.assign({}, this.pc_config, {
          color: (this.theme.color || {}).name || this.pc_config.color,
          style: (this.theme.style || {}).name || this.pc_config.style,
          layout: (this.theme.layout || {}).name || this.pc_config.layout,
          font: (this.theme.font || {}).name || this.pc_config.font,
          customCss: this.build_custom_css(this.theme)
        })
        this.theme_dirty = {}
        this.theme_pending = false
        this.on_theme_changed()
      }).catch(() => {})
    },
    // Уход со страницы при несохранённой теме — спросить.
    leave_theme_guard(action) {
      if (!this.theme_pending) { action(); return }
      this.theme_confirm_action = action
      this.theme_confirm = true
    },
    theme_confirm_save() {
      const action = this.theme_confirm_action
      this.theme_confirm = false
      this.theme_confirm_action = null
      this.theme_confirm_next = null
      this.save_theme()
      if (action) action()
    },
    theme_confirm_discard() {
      const action = this.theme_confirm_action
      this.theme_confirm = false
      this.theme_confirm_action = null
      this.theme_confirm_next = null
      this.reload_theme()
      if (action) action()
    },
    theme_confirm_cancel() {
      const next = this.theme_confirm_next
      this.theme_confirm = false
      this.theme_confirm_action = null
      this.theme_confirm_next = null
      if (next) next(false)
    },
    open_theme(axis) {
      this.theme_axis = axis
      this.theme_open = true
      this.apply_route()
    },
    close_theme() {
      this.theme_open = false
      // Раздел темы прописан в URL — уходим с него явно (apply_route без force
      // не трогает URL, пока диалог открыт).
      this.apply_route(true)
    },
    on_theme_saved(res) {
      if (!this.theme[res.axis]) this.theme[res.axis] = {}
      this.theme[res.axis] = { name: res.name, custom: !!res.custom, css: res.css || '' }
      this.pc_config = Object.assign({}, this.pc_config, {
        [res.axis]: res.name,
        customCss: this.build_custom_css(this.theme)
      })
      // Ось сохранена через полный редактор — снимаем её из «грязных».
      const dirty = Object.assign({}, this.theme_dirty)
      delete dirty[res.axis]
      this.theme_dirty = dirty
      this.theme_pending = Object.keys(dirty).length > 0
      this.on_theme_changed()
    },
    load_pages() {
      this.init()
    },
    open_base() {
      if (!this.base_set_id && this.base_sets.length) this.base_set_id = this.base_sets[0].id
      this.base_new_name = ''
      this.base_open = true
    },
    reload_base_sets() {
      return this.$http.get(this.api + '/base-sets').then(r => {
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.base_sets = d.sets || []
        if (!this.base_sets.some(s => s.id === this.base_set_id)) {
          this.base_set_id = d.default_set_id || (this.base_sets[0] ? this.base_sets[0].id : null)
        }
      })
    },
    create_base_pages() {
      this.base_loading = true
      this.base_result = ''
      this.$http.post(this.api + '/base-pages', {
        domain_id: this.domain_id,
        set_id: this.base_set_id,
        overwrite: this.base_overwrite
      }).then(r => {
        this.base_loading = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.base_result = 'набор «' + (d.set_name || '') + '»: создано ' + (d.created || []).length +
          ', обновлено ' + (d.updated || []).length + ', пропущено ' + (d.skipped || []).length
        this.base_open = false
        this.preview_docs = {}
        clearTimeout(this._base_timer)
        this._base_timer = setTimeout(() => { this.base_result = '' }, 6000)
        this.load_pages()
      }).catch(e => { this.base_loading = false; this.errors = ['ошибка запроса: ' + e] })
    },
    create_base_set() {
      const name = (this.base_new_name || '').trim()
      if (!name) return
      this.base_manage_loading = true
      this.$http.post(this.api + '/base-sets/create', {
        name: name,
        domain_id: this.base_new_from_domain ? this.domain_id : null
      }).then(r => {
        this.base_manage_loading = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.base_new_name = ''
        return this.reload_base_sets().then(() => {
          if (d.set && d.set.id) this.base_set_id = d.set.id
        })
      }).catch(e => { this.base_manage_loading = false; this.errors = ['ошибка запроса: ' + e] })
    },
    update_base_set_from_domain() {
      const cur = this.base_sets.find(s => s.id === this.base_set_id)
      if (!cur) return
      if (!confirm('Заменить страницы набора «' + cur.name + '» текущими страницами домена?')) return
      this.base_manage_loading = true
      this.$http.post(this.api + '/base-sets/update-from-domain', {
        set_id: this.base_set_id,
        domain_id: this.domain_id
      }).then(r => {
        this.base_manage_loading = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.base_result = 'набор «' + (d.set_name || cur.name) + '» обновлён: ' + (d.pages || 0) + ' стр.'
        this.reload_base_sets()
      }).catch(e => { this.base_manage_loading = false; this.errors = ['ошибка запроса: ' + e] })
    },
    rename_base_set() {
      const cur = this.base_sets.find(s => s.id === this.base_set_id)
      if (!cur) return
      const name = prompt('Новое имя набора', cur.name)
      if (!name || name === cur.name) return
      this.base_manage_loading = true
      this.$http.post(this.api + '/base-sets/rename', { set_id: this.base_set_id, name: name }).then(r => {
        this.base_manage_loading = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.reload_base_sets()
      }).catch(e => { this.base_manage_loading = false; this.errors = ['ошибка запроса: ' + e] })
    },
    delete_base_set() {
      const cur = this.base_sets.find(s => s.id === this.base_set_id)
      if (!cur) return
      if (!confirm('Удалить набор «' + cur.name + '»?')) return
      this.base_manage_loading = true
      this.$http.post(this.api + '/base-sets/delete', { set_id: this.base_set_id }).then(r => {
        this.base_manage_loading = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) return
        this.base_set_id = null
        this.reload_base_sets()
      }).catch(e => { this.base_manage_loading = false; this.errors = ['ошибка запроса: ' + e] })
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
        // JSON блоков повреждён — блоки придут пустыми, поэтому сохраняем
        // причину и исходный текст, чтобы предложить починить вручную.
        this.blocks_error = page.blocks_error || null
        this.blocks_raw = page.blocks_raw || ''
        this.json_fix = false
        this.json_text = this.blocks_raw || ''
        const doc = (page.blocks && page.blocks.blocks) ? page.blocks : Object.assign({}, BLOCKS_EMPTY, { blocks: page.blocks || [] })
        this.current = page
        this.current_doc = doc
        // Раскрытый блок из URL (/block/<n>) сохраняем — иначе apply_route()
        // сразу выбросит его из адреса, пока редактор ещё монтируется.
        this.current_block = this.pending_block
        this.saved = false
        this.apply_pc_config()
        this.view = 'editor'
        this.apply_route()
      }).catch(e => { this.errors = ['ошибка запроса: ' + e] })
    },
    apply_pc_config() {
      window.PAGE_CONSTRUCTOR_CONFIG = Object.assign({}, this.pc_config, {
        templateBase: this.effective_template_base,
        dataBase: BaseUrl + 'page_constructor/js/data/',
        filesBase: this.pc_config.filesBase || '',
        api: this.api,
        domain_id: this.domain_id,
        customCss: this.build_custom_css()
      })
    },
    // Карта mtime ассетов шаблона (constructor:pack → asset-rev.json):
    // tplAsset добавляет ?nc=<mtime>, чтобы превью не кешировало css/js.
    load_asset_rev() {
      fetch(BaseUrl + 'page_constructor/js/data/asset-rev.json')
        .then(r => (r.ok ? r.json() : {}))
        .then(m => {
          window.PC_ASSET_REV = m || {}
          this.on_theme_changed()
        })
        .catch(() => { window.PC_ASSET_REV = {} })
    },
    on_editor_change(doc) {
      // На @change компонента может прилететь нативный DOM-event
      // (fallthrough от внутренних input) — у него нет .blocks.
      // Не перетираем документ страницы таким значением.
      if (!doc || !Array.isArray(doc.blocks)) return
      this.current_doc = doc
    },
    /* Раскрыт блок в редакторе — отражаем в URL (/page/<id>/block/<n>). */
    on_edit_block(idx) {
      this.current_block = (idx === undefined || idx === null) ? -1 : idx
      this.apply_route()
    },
    /* Кнопка «Сохранить» в редакторе блоков: сохраняем документ, редактор
       остаётся открытым (BlockEditor сам подтверждает через applySaveResult). */
    on_editor_save(doc) {
      const editor = this.$refs.pageEditor
      const finish = (ok, msg) => { if (editor) editor.applySaveResult(ok, msg) }
      this.save_page(doc, finish)
    },
    on_structure_save(doc) {
      const editor = this.$refs.structEditor
      const finish = (ok, msg) => { if (editor) editor.applySaveResult(ok, msg) }
      this.save_structure(doc, finish)
    },
    /* Битый JSON: открыть ручной редактор и применить исправленный документ. */
    open_json_fix() {
      this.json_text = this.blocks_raw || (this.current_doc ? JSON.stringify(this.current_doc, null, 2) : '')
      this.json_fix = true
      this.json_error = ''
    },
    apply_json_fix() {
      let doc
      try {
        doc = JSON.parse(this.json_text)
      } catch (e) {
        this.json_error = 'JSON не исправлен: ' + e.message
        return
      }
      if (!doc || typeof doc !== 'object') {
        this.json_error = 'ожидался объект с блоками'
        return
      }
      if (Array.isArray(doc)) doc = Object.assign({}, BLOCKS_EMPTY, { blocks: doc })
      if (!doc.blocks) doc = Object.assign({}, BLOCKS_EMPTY, { blocks: [] })
      this.current_doc = doc
      this.json_fix = false
      this.blocks_error = null
      this.blocks_raw = ''
      this.errors = []
      this.saved = false
      this.json_error = ''
    },
    save_page(doc, done) {
      this.saving = true
      const payload = (doc && Array.isArray(doc.blocks)) ? doc : this.current_doc
      if (!payload || !Array.isArray(payload.blocks)) {
        this.saving = false
        const msg = 'Не удалось сохранить: документ страницы не загружен'
        if (done) done(false, msg); else this.errors = [msg]
        return
      }
      const blocks = JSON.stringify(payload)
      this.$http.post(this.api + '/page/save', {
        id: this.current.id,
        domain_id: this.domain_id,
        url: this.current.url,
        header: this.current.header,
        blocks
      }).then(r => {
        this.saving = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) {
          const msg = (Array.isArray(d.errors) && d.errors.length) ? d.errors.join('; ') : 'Ошибка сохранения'
          if (done) done(false, msg); else this.errors = [msg]
          return
        }
        if (payload) this.current_doc = payload
        this.saved = true
        delete this.preview_docs[this.current.id]
        clearTimeout(this._saved_timer)
        this._saved_timer = setTimeout(() => { this.saved = false }, 1500)
        // НЕ вызываем load_pages()/init(): это перезагружало тему
        // (цвета/стили/шрифты) и всю страницу. Сохраняем только документ,
        // список страниц уже загружен.
        if (done) done(true, 'Сохранено')
      }).catch(e => {
        this.saving = false
        const msg = 'ошибка запроса: ' + e
        if (done) done(false, msg); else this.errors = [msg]
      })
    },
    open_structure() {
      const blocks = [this.structure.header, this.structure.footer].filter(Boolean)
      this.structure_doc = { schema: 'svcms.page_blocks', version: 2, blocks }
      this.structure_saved = false
      this.view = 'structure'
      this.apply_route()
    },
    on_structure_change(doc) {
      if (!doc || !Array.isArray(doc.blocks)) return
      this.structure_doc = doc
    },
    save_structure(payload, done) {
      const doc = (payload && Array.isArray(payload.blocks)) ? payload : this.structure_doc
      if (!doc || !Array.isArray(doc.blocks)) {
        this.structure_saving = false
        const msg = 'Не удалось сохранить: структура не загружена'
        if (done) done(false, msg); else this.errors = [msg]
        return
      }
      const header = doc.blocks.find(b => b.type === 'header') || null
      const footer = doc.blocks.find(b => b.type === 'footer') || null
      this.structure_saving = true
      this.$http.post(this.api + '/structure/save', {
        domain_id: this.domain_id,
        header,
        footer
      }).then(r => {
        this.structure_saving = false
        const d = r.data || {}
        this.set_errors(d)
        if (!d.success) {
          const msg = (Array.isArray(d.errors) && d.errors.length) ? d.errors.join('; ') : 'Ошибка сохранения'
          if (done) done(false, msg); else this.errors = [msg]
          return
        }
        this.structure = d.structure || { header, footer }
        this.structure_doc = { schema: 'svcms.page_blocks', version: 2, blocks: [header, footer].filter(Boolean) }
        this.structure_saved = true
        clearTimeout(this._struct_timer)
        this._struct_timer = setTimeout(() => { this.structure_saved = false }, 1500)
        if (done) done(true, 'Сохранено')
      }).catch(e => {
        this.structure_saving = false
        const msg = 'ошибка запроса: ' + e
        if (done) done(false, msg); else this.errors = [msg]
      })
    },
    back_to_list() {
      this.leave_theme_guard(() => this._do_back_to_list())
    },
    _do_back_to_list() {
      this.view = 'list'
      this.current = {}
      this.current_doc = null
      this.structure_doc = null
      // force: без этого apply_route() видит прежний rp.view='page' и не
      // меняет URL. НЕ вызываем load_pages(): init()→read_route() успевал
      // прочитать ещё старый URL (/page/<id>) и заново открывал страницу,
      // возвращая редактор. Список уже загружен в this.pages.
      this.apply_route(true)
    },
    /* Повторный разбор URL: после смены маршрута возвращаемся в нужный раздел. */
    on_route_change() {
      const rp = (this.$route && this.$route.params) || {}
      const seg = rp.view || ''
      const q = this.route_query()
      // Кто-то закрыл диалог темы или перешёл по прямой ссылке — сверяемся с URL.
      if (rp.axis && !this.theme_open) { this.theme_axis = rp.axis; this.theme_open = true; return }
      if (!rp.axis && !q.theme && this.theme_open) { this.theme_open = false }
      const axis = rp.axis || q.theme
      if (axis && ['color', 'style', 'layout', 'font'].indexOf(axis) !== -1) {
        this.theme_axis = axis
        if (!this.theme_open) { this.theme_open = true; return }
      }
      if (!seg && this.view !== 'list') { this._do_back_to_list(); return }
      if (seg === 'structure' && this.view !== 'structure') { this.open_structure(); return }
      if (seg === 'page' && rp.page_id) {
        const id = String(rp.page_id)
        if (String((this.current || {}).id || '') !== id) {
          const p = this.pages.find(x => String(x.id) === id)
          if (p) {
            const bi = rp.block_id !== undefined && rp.block_id !== '' ? parseInt(rp.block_id, 10) : -1
            this.pending_block = isNaN(bi) ? -1 : bi
            this.open_page(p)
            return
          }
        }
        // та же страница — синхронизируем раскрытый блок с адресом
        const bi = rp.block_id !== undefined && rp.block_id !== '' ? parseInt(rp.block_id, 10) : -1
        const want = isNaN(bi) ? -1 : bi
        if (want !== this.current_block) {
          this.current_block = want
          this.pending_block = want
        }
        return
      }
      if (!seg && this.view === 'list' && q.preview) {
        const p = this.pages.find(x => String(x.id) === String(q.preview))
        if (p && String(this.preview_id || '') !== String(p.id)) this.select_preview(p)
      }
    },
    open_page_meta(p) {
      this.meta_form = p
        ? { id: p.id, url: p.url, header: p.header }
        : { id: null, url: '', header: '' }
      this.meta_open = true
    },
    save_page_meta() {
      this.meta_saving = true
      const body = { id: this.meta_form.id, domain_id: this.domain_id, url: this.meta_form.url, header: this.meta_form.header }
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
        // Создание: запоминаем выданный id и выделяем новую страницу,
        // чтобы повторное сохранение обновляло её, а не падало на
        // «страница уже есть».
        if (!this.meta_form.id && d.id) {
          this.meta_form.id = d.id
          this.preview_id = d.id
        }
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

  /* ---------- сетка главной конструктора ----------
     [ тема ] [ страницы ]
     [ превью ] [ страницы ]
     Страницы занимают обе строки, поэтому пустая ячейка темы не растягивает
     страницу: при скрытии темы превью поднимается наверх, при скрытии
     страниц колонка исчезает и превью занимает всю ширину. */
  .pc_list {display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: auto minmax(0, 1fr); grid-template-areas: "theme pages" "preview pages"; gap: 16px; align-items: start;}
  .pc_list.is-pages-hidden {grid-template-columns: minmax(0, 1fr); grid-template-areas: "theme" "preview";}
  .pc_list.is-theme-hidden.is-pages-hidden {grid-template-areas: "theme" "preview";}
  .pc_panel--theme {grid-area: theme; min-width: 0;}
  /* Специфичность выше, чем у .pc_panel{overflow:hidden} ниже, иначе список
     страниц обрезается без скролла (счётчик «32 шт», видно ~13, /video за
     обрезом). НЕ понижать специфичность/НЕ убирать overflow. */
  .pc_list .pc_panel--pages {grid-area: pages; min-width: 0; max-width: 100%; max-height: calc(100vh - 40px); overflow: auto;}
  .pc_list__preview {grid-area: preview; min-width: 0;}
  .pc_list__preview .pc_preview {height: min(72vh, 860px);}
  /* Обе панели скрыты — превью занимает почти всё окно. */
  .pc_list.is-theme-hidden.is-pages-hidden .pc_list__preview .pc_preview {height: calc(100vh - 150px);}

  /* ---------- скрываемые панели ---------- */
  .pc_panel {border: 1px solid rgba(var(--v-theme-on-surface), .12); border-radius: var(--app-radius-card); background: rgb(var(--v-theme-surface)); overflow: hidden;}
  .pc_panel__head {display: flex; align-items: center; gap: 8px; padding: 10px 14px; cursor: pointer; user-select: none; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .10); transition: background .15s;}
  .pc_panel__head:hover {background: var(--app-tint);}
  .pc_panel__head b {font-size: 14px;}
  .pc_panel__hint {margin-left: auto; font-size: 11px; color: rgba(var(--v-theme-on-surface), .5);}
  .pc_panel__caret {color: rgb(var(--v-theme-primary));}
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
  .pc_base_manage_title {font-weight: 600; font-size: var(--app-font-label); margin-bottom: 8px;}
  .pc_base_new {display: flex; gap: 10px; align-items: center;}
  .pc_base_new .v-input {margin: 0;}
  .pc_base_new .v-checkbox {flex: 0 0 auto;}
  .pc_base_actions {display: flex; gap: 6px; margin-top: 6px;}
  .pc_base_actions .v-btn {margin: 0;}

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
    .pc_broken {margin:12px 0; padding:14px 16px; border:1px solid #e0a800; border-radius:8px; background:#fff8e1;}
    .pc_broken__msg {margin:6px 0 10px; font-family:monospace; font-size:12px; color:#7a5b00; white-space:pre-wrap;}
    .pc_modal {position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.45);}
    .pc_modal__box {width:min(900px,92vw); max-height:86vh; overflow:auto; padding:18px; background:#fff; border-radius:10px;}
    .pc_modal__title {margin:0 0 10px;}
    .pc_modal__ta {width:100%; font-family:monospace; font-size:12px; padding:10px; border:1px solid #ccc; border-radius:6px;}
    .pc_modal__foot {display:flex; align-items:center; gap:12px; margin-top:10px;}
    .pc_modal__hint {font-size:12px; color:#666;}
    .pc_list {grid-template-columns: 1fr;}
    .pc_list__theme {position: static; height: auto;}
    .pc_preview__frame {height: 520px; flex: none;}
  }
  @media (max-width: 640px) { .pc_th--url {width: auto;} .pc_actions {width: auto;} }
</style>
