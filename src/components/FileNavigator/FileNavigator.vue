<template>
  <div class="is_headapp file_navigator" @contextmenu.prevent="open_ctx($event, null)">
    <h1 v-if="!params.without_title">Файлы</h1>
    <errors :errors="errors"/>

    <div class="fn_bar">
      <span class="fn_root" v-if="root_label">корень: <b>{{ root_label }}</b></span>
      <v-btn size="small" variant="text" :disabled="cur_dir == '.'" @click="go_up">вверх</v-btn>
      <v-btn size="small" variant="text" @click="reload">обновить</v-btn>
      <v-btn size="small" variant="text" @click="toggle_create_dir">{{ show_create_dir ? 'отмена' : 'создать папку' }}</v-btn>
      <v-btn size="small" variant="text" @click="toggle_create_file">{{ show_create_file ? 'отмена' : 'создать файл' }}</v-btn>
      <v-spacer />
      <div class="fn_views">
        <v-btn icon size="small" variant="text" title="Список" :color="view == 'list' ? 'primary' : undefined" @click="set_view('list')"><v-icon size="small">mdi-view-list</v-icon></v-btn>
        <v-btn icon size="small" variant="text" title="Плитка" :color="view == 'tile' ? 'primary' : undefined" @click="set_view('tile')"><v-icon size="small">mdi-view-grid</v-icon></v-btn>
      </div>
    </div>

    <div class="fn_bar" v-if="show_create_dir">
      <v-text-field
        v-model="new_dir"
        label="имя папки"
        density="compact"
        variant="outlined"
        hide-details
        class="fn_new_name"
        @keyup.enter="create_dir"
      />
      <v-btn size="small" color="primary" :disabled="!new_dir || creating" @click="create_dir">создать папку</v-btn>
    </div>

    <div class="fn_bar" v-if="show_create_file">
      <v-text-field
        v-model="new_name"
        label="имя файла"
        density="compact"
        variant="outlined"
        hide-details
        class="fn_new_name"
        @keyup.enter="create_file"
      />
      <v-btn size="small" color="primary" :disabled="!new_name || creating" @click="create_file">создать файл</v-btn>
    </div>

    <div class="fn_path" @dragover="on_drag_over('.', $event)" @dragleave="on_drag_leave('.', $event)" @drop="on_drop('.', $event)">
      <a :class="{fn_drop: drag_over == '.'}" href="#" @click.prevent="go_root">.</a>
      <template v-for="(part, i) in cur_parts" :key="'p' + i">
        <span class="sep">/</span>
        <a :class="{fn_drop: drag_over == crumb_dir(i)}" href="#" @click.prevent="go_index(i)" @dragover="on_drag_over(crumb_dir(i), $event)" @dragleave="on_drag_leave(crumb_dir(i), $event)" @drop="on_drop(crumb_dir(i), $event)">{{ part }}</a>
      </template>
      <span class="fn_charset" v-if="charset && charset != 'utf-8'">{{ charset }}</span>
    </div>

    <div v-if="loading" class="fn_loading">
      <v-progress-circular indeterminate color="primary" size="30" />
    </div>

    <template v-else>
      <table v-if="view == 'list'" class="fn_files">
        <tbody>
          <tr
            v-for="it in items"
            :key="it.name"
            :class="{fn_drop_row: drag_over == item_dir(it) && it.type == 'dir', fn_dragging: is_dragging(it)}"
            :draggable="true"
            @dragstart="on_drag_start(it, $event)"
            @dragend="on_drag_end"
            @dragover="it.type == 'dir' && on_drag_over(item_dir(it), $event)"
            @dragleave="it.type == 'dir' && on_drag_leave(item_dir(it), $event)"
            @drop="it.type == 'dir' && on_drop(item_dir(it), $event)"
            @contextmenu.prevent.stop="open_ctx($event, it)"
          >
            <td class="fn_name">
              <v-icon :class="['fn_ic_' + kind_of(it), 'fn_open']" size="default" @click="open_item(it)">{{ icon_of(it) }}</v-icon>
              <a href="#" @click.prevent="open_item(it)">{{ it.name }}</a>
            </td>
            <td class="fn_size">{{ it.type == 'file' ? human_size(it.size) : '' }}</td>
            <td class="fn_date">{{ fmt_mtime(it.mtime) }}</td>
            <td class="fn_actions">
              <v-icon size="default" title="переименовать" @click="ask_rename(it)">mdi-rename-box</v-icon>
              <v-icon size="default" title="переместить" @click="ask_move(it)">mdi-file-move</v-icon>
              <v-icon size="default" title="удалить" @click="ask_delete(it)">mdi-delete</v-icon>
            </td>
          </tr>
          <tr v-if="!items.length">
            <td colspan="4" class="fn_empty">пусто (правый клик — создать)</td>
          </tr>
        </tbody>
      </table>

      <div v-else class="fn_tiles">
        <div
          v-for="it in items"
          :key="it.name"
          class="fn_tile"
          :class="{fn_drop_row: drag_over == item_dir(it) && it.type == 'dir', fn_dragging: is_dragging(it)}"
          :draggable="true"
          @click="open_item(it)"
          @dragstart="on_drag_start(it, $event)"
          @dragend="on_drag_end"
          @dragover="it.type == 'dir' && on_drag_over(item_dir(it), $event)"
          @dragleave="it.type == 'dir' && on_drag_leave(item_dir(it), $event)"
          @drop="it.type == 'dir' && on_drop(item_dir(it), $event)"
          @contextmenu.prevent.stop="open_ctx($event, it)"
        >
          <v-icon :class="['fn_tile_icon', 'fn_ic_' + kind_of(it)]">{{ icon_of(it) }}</v-icon>
          <div class="fn_tile_name">{{ it.name }}</div>
          <div class="fn_tile_meta">{{ it.type == 'file' ? human_size(it.size) : '' }}</div>
          <div class="fn_tile_actions">
            <v-icon size="default" title="переименовать" @click.stop="ask_rename(it)">mdi-rename-box</v-icon>
            <v-icon size="default" title="переместить" @click.stop="ask_move(it)">mdi-file-move</v-icon>
            <v-icon size="default" title="удалить" @click.stop="ask_delete(it)">mdi-delete</v-icon>
          </div>
        </div>
        <div v-if="!items.length" class="fn_empty">пусто (правый клик — создать)</div>
      </div>
    </template>

    <div v-if="ctx_open" class="fn_ctx" :style="{ left: ctx_x + 'px', top: ctx_y + 'px' }" @contextmenu.prevent>
      <template v-if="ctx_item">
        <div class="fn_ctx_item" @click="ctx_do('open')"><v-icon size="small">mdi-open-in-app</v-icon> открыть</div>
        <template v-if="ctx_item.type == 'dir'">
          <div class="fn_ctx_item" @click="ctx_create_dir"><v-icon size="small">mdi-folder-plus</v-icon> создать папку</div>
          <div class="fn_ctx_item" @click="ctx_create_file"><v-icon size="small">mdi-file-plus</v-icon> создать файл</div>
        </template>
        <div class="fn_ctx_item" @click="ctx_do('rename')"><v-icon size="small">mdi-rename-box</v-icon> переименовать</div>
        <div class="fn_ctx_item" @click="ctx_do('move')"><v-icon size="small">mdi-file-move</v-icon> переместить</div>
        <div class="fn_ctx_item fn_ctx_danger" @click="ctx_do('delete')"><v-icon size="small">mdi-delete</v-icon> удалить</div>
      </template>
      <template v-else>
        <div class="fn_ctx_item" @click="ctx_create_dir"><v-icon size="small">mdi-folder-plus</v-icon> создать папку</div>
        <div class="fn_ctx_item" @click="ctx_create_file"><v-icon size="small">mdi-file-plus</v-icon> создать файл</div>
        <div class="fn_ctx_item" @click="ctx_refresh"><v-icon size="small">mdi-refresh</v-icon> обновить</div>
      </template>
    </div>

    <v-dialog v-model="preview_open" max-width="1100">
      <v-card>
        <v-card-title class="fn_preview_head">
          <span class="fn_editor_path">{{ preview_name }}</span>
          <v-spacer />
          <a :href="raw_url(preview_rel, 1)" class="fn_preview_download"><v-icon size="small">mdi-download</v-icon> скачать</a>
          <v-btn icon size="small" variant="text" @click="preview_open = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text class="fn_preview_body">
          <div v-if="preview_kind == 'image'" class="fn_gallery">
            <v-btn v-if="gallery.length > 1" icon variant="text" class="fn_gal_arrow" @click.stop="gallery_prev"><v-icon size="large">mdi-chevron-left</v-icon></v-btn>
            <img :src="raw_url(preview_rel)" class="fn_preview_img" :alt="preview_name">
            <v-btn v-if="gallery.length > 1" icon variant="text" class="fn_gal_arrow" @click.stop="gallery_next"><v-icon size="large">mdi-chevron-right</v-icon></v-btn>
          </div>
          <div v-if="preview_kind == 'image' && gallery.length > 1" class="fn_gal_counter">{{ gallery_index + 1 }} / {{ gallery.length }}</div>
          <iframe v-if="preview_kind == 'pdf'" :src="raw_url(preview_rel)" class="fn_preview_frame"></iframe>
          <div v-if="preview_kind != 'image' && preview_kind != 'pdf'" class="fn_preview_binary">
            <v-icon size="64">mdi-file-alert-outline</v-icon>
            <p>Бинарный файл — предпросмотр недоступен.</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirm_open" max-width="480">
      <v-card>
        <v-card-title class="text-h5">Удаление</v-card-title>
        <v-card-text>{{ confirm_text }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirm_open = false">Отмена</v-btn>
          <v-btn color="error" @click="do_delete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="rename_open" max-width="480">
      <v-card>
        <v-card-title class="text-h5">Переименование</v-card-title>
        <v-card-text>
          <v-text-field v-model="rename_new" label="новое имя" density="compact" variant="outlined" hide-details @keyup.enter="do_rename" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="rename_open = false">Отмена</v-btn>
          <v-btn color="primary" :disabled="!rename_new" @click="do_rename">Переименовать</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="move_open" max-width="560">
      <v-card>
        <v-card-title class="text-h5">Перемещение</v-card-title>
        <v-card-text>
          <div class="fn_move_item">{{ move_item ? move_item.name : '' }}</div>
          <v-text-field
            v-model="move_to"
            label="каталог назначения (относительный путь)"
            placeholder="."
            density="compact"
            variant="outlined"
            hide-details
            @keyup.enter="do_move"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="move_open = false">Отмена</v-btn>
          <v-btn color="primary" @click="do_move">Переместить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editor_open" fullscreen>
      <v-card class="fn_editor">
        <div class="fn_editor_head">
          <span class="fn_editor_path">{{ edited_path }}</span>
          <span v-if="charset && charset != 'utf-8'" class="fn_charset_badge">{{ charset }}</span>
          <span v-if="saved" class="fn_saved">сохранено</span>
          <v-spacer />
          <v-btn size="small" color="primary" :disabled="!dirty" :loading="saving" @click="save_file">Сохранить</v-btn>
          <v-btn size="small" variant="text" @click="editor_open = false">Закрыть</v-btn>
        </div>
        <field-codelist :key="edited_path" :field="edited_field" :form="cform" :parent="on_edit" />
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
const EXT_LANG = {
  py: 'python',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'javascript', tsx: 'javascript',
  perl: 'perl', pl: 'perl', pm: 'perl', t: 'perl',
  sql: 'sql',
  sh: 'shell', bash: 'shell', zsh: 'shell',
  css: 'css', scss: 'css', less: 'css',
  html: 'xml', htm: 'xml', xml: 'xml', svg: 'xml',
  rb: 'ruby', lua: 'lua',
  c: 'clike', h: 'clike', cpp: 'clike', cc: 'clike', hpp: 'clike', java: 'clike', cs: 'clike'
}

const EXT_KIND = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image', bmp: 'image', ico: 'image', svg: 'image', tiff: 'image', avif: 'image',
  py: 'code', pyw: 'code', js: 'code', mjs: 'code', cjs: 'code', jsx: 'code', ts: 'code', tsx: 'code',
  php: 'code', rb: 'code', pl: 'code', pm: 'code', c: 'code', cc: 'code', cpp: 'code', h: 'code', hpp: 'code',
  java: 'code', cs: 'code', go: 'code', rs: 'code', swift: 'code', kt: 'code', lua: 'code',
  sh: 'code', bash: 'code', zsh: 'code', fish: 'code',
  css: 'code', scss: 'code', less: 'code', html: 'code', htm: 'code', xml: 'code', vue: 'code', svelte: 'code',
  sql: 'code', json: 'code', yml: 'code', yaml: 'code', toml: 'code', ini: 'code', conf: 'code', env: 'code',
  txt: 'doc', md: 'doc', markdown: 'doc', log: 'doc', rst: 'doc', csv: 'doc', tsv: 'doc',
  pdf: 'pdf',
  zip: 'archive', tar: 'archive', gz: 'archive', tgz: 'archive', bz2: 'archive', rar: 'archive', '7z': 'archive', xz: 'archive',
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', m4a: 'audio', aac: 'audio',
  mp4: 'video', avi: 'video', mov: 'video', mkv: 'video', webm: 'video', wmv: 'video', flv: 'video',
  xls: 'sheet', xlsx: 'sheet', ods: 'sheet',
  doc: 'word', docx: 'word', odt: 'word',
  exe: 'binary', dll: 'binary', so: 'binary', bin: 'binary', deb: 'binary', rpm: 'binary', dmg: 'binary', iso: 'binary',
  ttf: 'binary', otf: 'binary', woff: 'binary', woff2: 'binary', eot: 'binary',
  sqlite: 'binary', db: 'binary', pyc: 'binary', class: 'binary', jar: 'binary', wasm: 'binary'
}

const KIND_ICON = {
  dir: 'mdi-folder',
  image: 'mdi-file-image',
  code: 'mdi-file-code',
  doc: 'mdi-file-document-outline',
  pdf: 'mdi-file-pdf-box',
  archive: 'mdi-zip-box',
  audio: 'mdi-file-music',
  video: 'mdi-file-video',
  sheet: 'mdi-file-excel',
  word: 'mdi-file-word',
  binary: 'mdi-file-cog-outline',
  file: 'mdi-file-outline'
}

const BINARY_KINDS = { image: 1, pdf: 1, archive: 1, audio: 1, video: 1, sheet: 1, word: 1, binary: 1 }

function ext_of(name) {
  const m = String(name).toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

function lang_of(name) {
  const e = ext_of(name)
  return EXT_LANG[e] || 'plain'
}

function kind_of(it) {
  if (it.type == 'dir') return 'dir'
  return EXT_KIND[ext_of(it.name)] || 'file'
}

function human_size(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return ''
  if (bytes < 1024) return bytes + ' Б'
  const units = ['КБ', 'МБ', 'ГБ', 'ТБ']
  let v = bytes / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return (v >= 10 ? Math.round(v) : v.toFixed(1)) + ' ' + units[i]
}

function normalize_rel(d) {
  return String(d || '').replace(/^\/+|\/+$/g, '')
}

export default {
  props: ['params', 'is_headapp'],
  data() {
    return {
      root: '',
      base_dir: '',
      charset: 'utf-8',
      cur_dir: '.',
      items: [],
      view: localStorage.getItem('filenavigator_view') || 'list',
      loading: false,
      creating: false,
      errors: [],
      show_create_file: false,
      new_name: '',
      show_create_dir: false,
      new_dir: '',
      drag_item: null,
      drag_over: '',
      ctx_open: false,
      ctx_x: 0,
      ctx_y: 0,
      ctx_item: null,
      preview_open: false,
      preview_rel: '',
      preview_name: '',
      preview_kind: '',
      gallery: [],
      gallery_index: 0,
      confirm_open: false,
      confirm_text: '',
      pending: null,
      rename_open: false,
      rename_new: '',
      move_open: false,
      move_to: '.',
      move_item: null,
      editor_open: false,
      edited_path: '',
      edited_field: { name: 'file', value: '', description: '', language: 'plain' },
      original_body: '',
      file_body: '',
      dirty: false,
      saving: false,
      saved: false,
      cform: { read_only: 0 }
    }
  },
  computed: {
    base() {
      return BackendBase + '/filenavigator/' + this.params.config
    },
    cur_parts() {
      return this.cur_dir === '.' ? [] : this.cur_dir.split('/')
    },
    root_label() {
      if (!this.root) return this.base_dir || ''
      const r = this.root === './' ? '' : this.root
      return (r ? r.replace(/\/$/, '') + '/' : '') + (this.base_dir || '')
    },
    route_base() {
      const b = this.params && this.params.base
      if (Array.isArray(b) && b.length) return normalize_rel(b.join('/'))
      if (typeof b === 'string' && b) return normalize_rel(b)
      return normalize_rel((this.$route.query || {}).dir)
    }
  },
  created() {
    this.init_from_route()
  },
  mounted() {
    this._ctx_close = () => this.close_ctx()
    this._ctx_esc = (e) => {
      if (e.key === 'Escape') { this.close_ctx(); if (this.preview_open) this.preview_open = false }
      if (this.preview_open && this.preview_kind == 'image' && this.gallery.length > 1) {
        if (e.key === 'ArrowLeft') this.gallery_prev()
        if (e.key === 'ArrowRight') this.gallery_next()
      }
    }
    document.addEventListener('click', this._ctx_close)
    document.addEventListener('keydown', this._ctx_esc)
    window.addEventListener('scroll', this._ctx_close, true)
  },
  beforeUnmount() {
    document.removeEventListener('click', this._ctx_close)
    document.removeEventListener('keydown', this._ctx_esc)
    window.removeEventListener('scroll', this._ctx_close, true)
  },
  watch: {
    params() {
      this.init_from_route()
    },
    route_base() {
      this.init_from_route()
    }
  },
  methods: {
    kind_of,
    icon_of(it) {
      return KIND_ICON[kind_of(it)] || KIND_ICON.file
    },
    human_size,
    is_binary(it) {
      return !!BINARY_KINDS[kind_of(it)]
    },
    fmt_mtime(ts) {
      if (!ts) return ''
      const d = new Date(ts * 1000)
      const p = n => (n < 10 ? '0' + n : '' + n)
      return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
    },
    set_view(v) {
      this.view = v
      localStorage.setItem('filenavigator_view', v)
    },
    init_from_route() {
      const q = this.$route.query || {}
      this.charset = q.charset ? String(q.charset) : 'utf-8'
      this.base_dir = this.route_base
      this.cur_dir = '.'
      this.load_root()
      this.read_dir('.')
    },
    set_errors(d) {
      const e = d && d.error
      if (Array.isArray(e)) this.errors = e.map(String)
      else if (e) this.errors = [String(e)]
      else this.errors = []
    },
    request(path, body) {
      return this.$http.post(this.base + path, body).then(r => {
        const d = r.data
        this.set_errors(d)
        return d
      }).catch(e => {
        this.errors = ['ошибка запроса: ' + String(e)]
        return { success: false }
      })
    },
    backend_dir(rel) {
      const r = normalize_rel(rel)
      if (!r || r === '.') return this.base_dir || '.'
      return this.base_dir ? this.base_dir + '/' + r : r
    },
    raw_url(rel, download) {
      let u = this.base + '/raw?dir=' + encodeURIComponent(this.backend_dir(rel))
      if (download) u += '&download=1'
      return u
    },
    load_root() {
      this.$http.get(this.base).then(r => {
        this.root = typeof r.data === 'string' ? r.data : ''
      }).catch(() => {})
    },
    read_dir(rel) {
      this.loading = true
      this.request('/readir', { dir: this.backend_dir(rel) }).then(d => {
        this.loading = false
        if (d.success) this.items = d.list || []
      })
    },
    reload() {
      this.read_dir(this.cur_dir)
    },
    join(dir, name) {
      return dir === '.' ? name : dir + '/' + name
    },
    item_dir(it) {
      return this.join(this.cur_dir, it.name)
    },
    crumb_dir(i) {
      return this.cur_parts.slice(0, i + 1).join('/')
    },
    open_item(it) {
      if (it.type == 'dir') {
        this.cur_dir = this.item_dir(it)
        this.read_dir(this.cur_dir)
      } else {
        this.open_file(it)
      }
    },
    open_file(it) {
      const rel = this.item_dir(it)
      const k = kind_of(it)
      if (k == 'image' || k == 'pdf' || this.is_binary(it)) {
        this.preview_rel = rel
        this.preview_name = it.name
        this.preview_kind = k
        this.gallery = (k == 'image') ? this.items.filter(x => kind_of(x) == 'image') : []
        this.gallery_index = this.gallery.findIndex(x => x.name === it.name)
        this.preview_open = true
        return
      }
      this.request('/readfile', { dir: this.backend_dir(rel), charset: this.charset }).then(d => {
        if (!d.success) return
        const body = d.body === undefined || d.body === null ? '' : String(d.body)
        this.edited_path = rel
        this.edited_field = { name: 'file', value: body, description: it.name, language: lang_of(it.name), rows: 30 }
        this.original_body = body
        this.file_body = body
        this.dirty = false
        this.saved = false
        this.editor_open = true
      })
    },
    on_edit(obj) {
      if (!obj) return
      this.file_body = obj.value
      this.dirty = this.file_body !== this.original_body
    },
    gallery_go(i) {
      if (!this.gallery.length) return
      const n = this.gallery.length
      this.gallery_index = ((i % n) + n) % n
      const it = this.gallery[this.gallery_index]
      this.preview_rel = this.item_dir(it)
      this.preview_name = it.name
    },
    gallery_prev() {
      this.gallery_go(this.gallery_index - 1)
    },
    gallery_next() {
      this.gallery_go(this.gallery_index + 1)
    },
    save_file() {
      this.saving = true
      this.request('/writefile', { dir: this.backend_dir(this.edited_path), body: this.file_body, charset: this.charset }).then(d => {
        this.saving = false
        if (d.success) {
          this.original_body = this.file_body
          this.dirty = false
          this.saved = true
          clearTimeout(this._saved_timeout)
          this._saved_timeout = setTimeout(() => { this.saved = false }, 1500)
        }
      })
    },
    go_root() {
      this.cur_dir = '.'
      this.read_dir('.')
    },
    go_up() {
      const parts = this.cur_parts.slice(0, -1)
      this.cur_dir = parts.length ? parts.join('/') : '.'
      this.read_dir(this.cur_dir)
    },
    go_index(i) {
      this.cur_dir = this.crumb_dir(i)
      this.read_dir(this.cur_dir)
    },
    toggle_create_file() {
      this.show_create_file = !this.show_create_file
      this.show_create_dir = false
      this.new_name = ''
    },
    toggle_create_dir() {
      this.show_create_dir = !this.show_create_dir
      this.show_create_file = false
      this.new_dir = ''
    },
    create_file() {
      if (!this.new_name || this.creating) return
      this.creating = true
      const path = this.backend_dir(this.join(this.cur_dir, this.new_name))
      this.request('/writefile', { dir: path, body: '', charset: this.charset }).then(d => {
        this.creating = false
        if (d.success) {
          this.show_create_file = false
          this.new_name = ''
          this.read_dir(this.cur_dir)
        }
      })
    },
    create_dir() {
      if (!this.new_dir || this.creating) return
      this.creating = true
      const path = this.backend_dir(this.join(this.cur_dir, this.new_dir))
      this.request('/mkdir', { dir: path }).then(d => {
        this.creating = false
        if (d.success) {
          this.show_create_dir = false
          this.new_dir = ''
          this.read_dir(this.cur_dir)
        }
      })
    },
    open_ctx(ev, it) {
      this.ctx_item = it || null
      this.ctx_x = ev.clientX
      this.ctx_y = ev.clientY
      this.ctx_open = true
    },
    close_ctx() {
      this.ctx_open = false
      this.ctx_item = null
    },
    ctx_do(action) {
      const it = this.ctx_item
      this.close_ctx()
      if (!it) return
      if (action == 'open') this.open_item(it)
      else if (action == 'rename') this.ask_rename(it)
      else if (action == 'move') this.ask_move(it)
      else if (action == 'delete') this.ask_delete(it)
    },
    ctx_create_dir() {
      const it = this.ctx_item
      this.close_ctx()
      if (it && it.type == 'dir') {
        this.cur_dir = this.item_dir(it)
        this.read_dir(this.cur_dir)
      }
      this.show_create_dir = true
      this.show_create_file = false
      this.new_dir = ''
    },
    ctx_create_file() {
      const it = this.ctx_item
      this.close_ctx()
      if (it && it.type == 'dir') {
        this.cur_dir = this.item_dir(it)
        this.read_dir(this.cur_dir)
      }
      this.show_create_file = true
      this.show_create_dir = false
      this.new_name = ''
    },
    ctx_refresh() {
      this.close_ctx()
      this.reload()
    },
    is_dragging(it) {
      return !!this.drag_item && this.drag_item.name === it.name
    },
    on_drag_start(it, ev) {
      this.drag_item = it
      this.drag_over = ''
      if (ev && ev.dataTransfer) {
        ev.dataTransfer.effectAllowed = 'move'
        try { ev.dataTransfer.setData('text/plain', it.name) } catch (e) { /* noop */ }
      }
    },
    on_drag_end() {
      this.drag_item = null
      this.drag_over = ''
    },
    can_drop(dir) {
      const it = this.drag_item
      if (!it || !dir) return false
      if (dir === this.cur_dir) return false
      if (it.type == 'dir') {
        const self = this.item_dir(it)
        if (dir === self || dir.indexOf(self + '/') === 0) return false
      }
      return true
    },
    on_drag_over(dir, ev) {
      if (ev) ev.preventDefault()
      if (this.can_drop(dir)) {
        this.drag_over = dir
        if (ev && ev.dataTransfer) ev.dataTransfer.dropEffect = 'move'
      }
    },
    on_drag_leave(dir, ev) {
      if (ev && ev.relatedTarget && ev.currentTarget && ev.currentTarget.contains(ev.relatedTarget)) return
      if (this.drag_over === dir) this.drag_over = ''
    },
    on_drop(dir, ev) {
      if (ev) ev.preventDefault()
      const it = this.drag_item
      const ok = this.can_drop(dir)
      this.on_drag_end()
      if (!ok) return
      this.request('/move', { from_dir: this.backend_dir(this.cur_dir), to_dir: this.backend_dir(dir), name: it.name }).then(d => {
        if (d.success) this.read_dir(this.cur_dir)
      })
    },
    ask_delete(it) {
      this.pending = it
      this.confirm_text = 'Удалить ' + (it.type == 'dir' ? 'папку' : 'файл') + ' «' + it.name + '»' + (it.type == 'dir' ? ' со всем содержимым' : '') + '?'
      this.confirm_open = true
    },
    do_delete() {
      const it = this.pending
      this.confirm_open = false
      this.request('/delete', { dir: this.backend_dir(this.cur_dir), name: it.name }).then(d => {
        if (d.success) this.read_dir(this.cur_dir)
      })
    },
    ask_rename(it) {
      this.pending = it
      this.rename_new = it.name
      this.rename_open = true
    },
    do_rename() {
      const it = this.pending
      if (!this.rename_new || this.rename_new === it.name) { this.rename_open = false; return }
      this.request('/rename', { dir: this.backend_dir(this.cur_dir), name: it.name, new_name: this.rename_new }).then(d => {
        if (d.success) {
          this.rename_open = false
          this.read_dir(this.cur_dir)
        }
      })
    },
    ask_move(it) {
      this.move_item = it
      this.move_to = this.cur_dir
      this.move_open = true
    },
    do_move() {
      const it = this.move_item
      this.request('/move', { from_dir: this.backend_dir(this.cur_dir), to_dir: this.backend_dir(this.move_to), name: it.name }).then(d => {
        if (d.success) {
          this.move_open = false
          this.read_dir(this.cur_dir)
        }
      })
    }
  }
}
</script>
<style scoped lang="scss">
  .file_navigator {margin: 20px; max-width: 1500px;}
  .file_navigator h1 {margin-bottom: 20px;}
  .fn_bar {display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 10px;}
  .fn_bar .v-btn {margin: 0; text-transform: none;}
  .fn_root {color: rgba(var(--v-theme-on-surface), .6); margin-right: 14px; font-size: var(--app-font-value);}
  .fn_root b {color: rgb(var(--v-theme-primary));}
  .fn_views {display: inline-flex; gap: 2px;}
  .fn_views .v-btn {margin: 0;}
  .fn_new_name {max-width: 460px;}
  .fn_path {
    border-bottom: 1px dotted rgba(var(--v-theme-on-surface), .4);
    padding: 6px 8px;
    margin-bottom: 14px;
    font-family: var(--app-font-mono, monospace);
    font-size: var(--app-font-value);
    border-radius: var(--app-radius-field);
  }
  .fn_path a {color: rgb(var(--v-theme-primary)); padding: 3px 5px; border-radius: 4px;}
  .fn_path .sep {margin: 0 5px; color: rgba(var(--v-theme-on-surface), .4);}
  .fn_charset {float: right; color: rgba(var(--v-theme-on-surface), .5); font-size: var(--app-font-desc);}
  .fn_loading {padding: 24px; text-align: center;}
  .fn_open {cursor: pointer;}
  .fn_files {width: 100%; border-collapse: collapse;}
  .fn_files td {padding: 9px 10px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08); font-size: var(--app-font-value);}
  .fn_files tr.fn_dragging {opacity: .4;}
  .fn_name .v-icon {cursor: pointer; vertical-align: middle;}
  .fn_name a {margin-left: 8px; font-size: var(--app-font-value);}
  .fn_size, .fn_date {color: rgba(var(--v-theme-on-surface), .55); font-size: var(--app-font-desc); white-space: nowrap;}
  .fn_size {text-align: right; width: 110px;}
  .fn_date {width: 170px;}
  .fn_actions {width: 150px; white-space: nowrap; text-align: right;}
  .fn_actions .v-icon {cursor: pointer; margin-left: 16px; color: rgba(var(--v-theme-on-surface), .55);}
  .fn_actions .v-icon:hover {color: rgb(var(--v-theme-primary));}
  .fn_drop_row {background: rgba(var(--v-theme-primary), .12); outline: 2px dashed rgb(var(--v-theme-primary)); outline-offset: -2px;}
  .fn_drop {background: rgba(var(--v-theme-primary), .18); outline: 1px dashed rgb(var(--v-theme-primary));}
  .fn_tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 14px;
  }
  .fn_tile {
    border: 1px solid rgba(var(--v-theme-on-surface), .14);
    border-radius: var(--app-radius-card);
    padding: 16px 10px 10px;
    text-align: center;
    background: rgba(var(--v-theme-on-surface), .02);
    transition: background .12s, box-shadow .12s;
    cursor: pointer;
  }
  .fn_tile:hover {background: var(--app-tint); box-shadow: 0 2px 10px rgba(0,0,0,.14);}
  .fn_tile.fn_dragging {opacity: .4;}
  .fn_tile_icon {font-size: 64px !important;}
  .fn_tile_name {
    margin-top: 8px;
    font-size: var(--app-font-value);
    word-break: break-word;
    max-height: 2.8em;
    overflow: hidden;
  }
  .fn_tile_meta {font-size: 12px; color: rgba(var(--v-theme-on-surface), .5); min-height: 16px; margin-top: 2px;}
  .fn_tile_actions {margin-top: 6px; min-height: 26px;}
  .fn_tile_actions .v-icon {cursor: pointer; margin: 0 7px; color: rgba(var(--v-theme-on-surface), .5);}
  .fn_tile_actions .v-icon:hover {color: rgb(var(--v-theme-primary));}
  .fn_empty {color: rgba(var(--v-theme-on-surface), .5); padding: 14px 4px; font-size: var(--app-font-value);}
  .fn_move_item {font-weight: bold; margin-bottom: 10px; color: rgb(var(--v-theme-primary));}
  .fn_ctx {
    position: fixed;
    z-index: 3000;
    min-width: 210px;
    background: rgb(var(--v-theme-surface));
    border: 1px solid rgba(var(--v-theme-on-surface), .16);
    border-radius: var(--app-radius-card);
    box-shadow: 0 6px 24px rgba(0,0,0,.24);
    padding: 4px;
  }
  .fn_ctx_item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    cursor: pointer;
    border-radius: var(--app-radius-field);
    font-size: var(--app-font-value);
  }
  .fn_ctx_item:hover {background: var(--app-tint);}
  .fn_ctx_danger {color: rgb(var(--v-theme-error));}
  .fn_editor {height: 100%; padding: 14px 22px; overflow: auto;}
  .fn_editor_head {display: flex; align-items: center; gap: 10px; margin-bottom: 12px;}
  .fn_editor_path {font-family: var(--app-font-mono, monospace); font-weight: bold; color: rgb(var(--v-theme-primary));}
  .fn_saved {color: rgb(var(--v-theme-success)); font-weight: bold;}
  .fn_charset_badge {border: 1px solid rgba(var(--v-theme-on-surface), .3); border-radius: 10px; padding: 1px 8px; font-size: var(--app-font-desc); color: rgba(var(--v-theme-on-surface), .6);}
  .fn_preview_head {display: flex; align-items: center; gap: 12px;}
  .fn_preview_download {white-space: nowrap; font-size: var(--app-font-desc);}
  .fn_preview_body {text-align: center; padding: 0 0 16px;}
  .fn_gallery {display: flex; align-items: center; justify-content: center; gap: 8px;}
  .fn_preview_img {max-width: 100%; max-height: 78vh; border-radius: var(--app-radius-field);}
  .fn_gallery .fn_preview_img {max-width: calc(100% - 120px);}
  .fn_gal_arrow {flex: 0 0 auto; color: rgb(var(--v-theme-primary));}
  .fn_gal_counter {margin-top: 8px; color: rgba(var(--v-theme-on-surface), .6); font-size: var(--app-font-desc);}
  .fn_preview_frame {width: 100%; height: 78vh; border: none; border-radius: var(--app-radius-field);}
  .fn_preview_binary {padding: 40px; color: rgba(var(--v-theme-on-surface), .6);}
  .fn_ic_dir {color: #f6c344;}
  .fn_ic_image {color: #43a047;}
  .fn_ic_code {color: #1e88e5;}
  .fn_ic_doc {color: #78909c;}
  .fn_ic_pdf {color: #e53935;}
  .fn_ic_archive {color: #8d6e63;}
  .fn_ic_audio {color: #8e24aa;}
  .fn_ic_video {color: #d81b60;}
  .fn_ic_sheet {color: #2e7d32;}
  .fn_ic_word {color: #1565c0;}
  .fn_ic_binary {color: #607d8b;}
  .fn_ic_file {color: #90a4ae;}
</style>
