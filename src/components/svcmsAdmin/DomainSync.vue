<template>
  <div class="domain-sync">
    <!-- Вход из карточки домена: кнопка. В меню (без form.id) компонент не рендерит кнопку. -->
    <v-btn v-if="form && form.id" color="primary" variant="tonal" prepend-icon="swap_horiz" @click="open">
      Перенос на другой домен
    </v-btn>

    <v-dialog v-model="dialog" max-width="760" :persistent="running">
      <v-card class="ds-dlg">
        <div class="ds-dlg__head">
          <v-icon size="38" color="primary">swap_horiz</v-icon>
          <div>
            <div class="ds-dlg__title">Перенос на другой домен</div>
            <div class="ds-dlg__subtitle">
              Настройки конструктора привязаны к домену (домен = сайт)
            </div>
          </div>
        </div>
        <v-divider />
        <v-card-text class="ds-dlg__body">
          <!-- Источник -->
          <v-autocomplete
            v-if="!form || !form.id"
            v-model="src_domain"
            :items="src_items"
            :loading="src_loading"
            item-title="d"
            item-value="v"
            return-object
            :custom-filter="() => true"
            label="Домен-источник"
            density="compact"
            hide-details
            class="mb-3"
            @update:search="on_src_search"
            @update:model-value="on_src_change"
          />
          <div v-else class="ds-dlg__src">
            Источник: <b>{{ src_info.domain || ('#' + src_id) }}</b>
            <span v-if="src_info.project_id"> — проект #{{ src_info.project_id }}</span>
            <span v-if="src_info.is_constructor" class="ds-badge">конструктор</span>
            <span v-else class="ds-badge ds-badge--plain">обычный</span>
          </div>

          <!-- Приёмник -->
          <div class="ds-row">
            <v-radio-group v-model="dst_mode" inline density="compact" hide-details class="ds-radio">
              <v-radio label="Создать новый домен" value="new" />
              <v-radio label="Существующий домен" value="existing" />
            </v-radio-group>
          </div>

          <v-text-field
            v-if="dst_mode === 'new'"
            v-model="new_domain"
            label="Новый домен (без http://)"
            density="compact"
            hide-details="auto"
            :error="!!domain_error"
            :error-messages="domain_error ? [domain_error] : []"
            @update:model-value="on_domain_input"
          />
          <v-autocomplete
            v-else
            v-model="dst_domain"
            :items="dst_items"
            :loading="dst_loading"
            item-title="d"
            item-value="v"
            return-object
            :custom-filter="() => true"
            label="Домен-приёмник"
            density="compact"
            hide-details
            @update:search="on_dst_search"
            @update:model-value="refresh_preview"
          />

          <div class="ds-row ds-row--two">
            <v-text-field
              v-if="show_port"
              v-model="port"
              label="Порт (пусто = авто)"
              density="compact"
              hide-details
            />
            <v-text-field
              v-if="!src_info.is_constructor && template_mode === 'clone'"
              v-model="new_folder"
              label="Папка шаблона"
              density="compact"
              hide-details
            />
          </div>

          <!-- Режим данных: оба варианта, как просили -->
          <div class="ds-block">
            <div class="ds-block__title">Что делаем с данными</div>
            <v-radio-group v-model="data_mode" density="compact" hide-details>
              <v-radio value="copy">
                <template #label>
                  <span><b>Скопировать</b> — источник продолжает работать, у приёмника будет копия</span>
                </template>
              </v-radio>
              <v-radio value="move">
                <template #label>
                  <span><b>Перенести</b> — настройки уедут с источника (он откатится на тему по умолчанию)</span>
                </template>
              </v-radio>
            </v-radio-group>
          </div>

          <!-- Состав -->
          <div class="ds-block">
            <div class="ds-block__title">Что переносим</div>
            <div class="ds-checks">
              <v-checkbox
                v-for="p in part_list"
                :key="p.key"
                :model-value="parts.includes(p.key)"
                :label="p.label"
                density="compact"
                hide-details
                @update:model-value="v => toggle_part(p.key, v)"
              />
            </div>
            <v-radio-group
              v-if="parts.includes('pages')"
              v-model="pages_mode"
              inline
              density="compact"
              hide-details
              class="ds-radio mt-1"
            >
              <v-radio label="Страницы: заменить" value="replace" />
              <v-radio label="дополнить" value="merge" />
            </v-radio-group>
          </div>

          <!-- Шаблон (только обычные проекты) -->
          <div v-if="!src_info.is_constructor" class="ds-block">
            <div class="ds-block__title">Шаблон</div>
            <v-radio-group v-model="template_mode" density="compact" hide-details>
              <v-radio value="inherit" label="Тот же шаблон (как у источника)" />
              <v-radio value="clone" label="Отдельная копия шаблона (папка копируется на диске)" />
            </v-radio-group>
          </div>

          <v-checkbox
            v-if="data_mode === 'move'"
            v-model="delete_old"
            label="Удалить исходный домен после переноса"
            color="error"
            density="compact"
            hide-details
          />

          <!-- Превью -->
          <div v-if="preview || preview_loading" class="ds-preview">
            <div v-if="preview_loading" class="ds-preview__loading">Считаем…</div>
            <template v-else>
              <div class="ds-preview__title">
                Профиль: {{ preview.src.is_constructor ? 'конструктор' : 'обычный проект' }}
              </div>
              <div class="ds-preview__row" v-for="row in preview_rows" :key="row.k">
                <span class="ds-preview__k">{{ row.k }}</span>
                <span>{{ row.src }}<template v-if="row.dst !== null"> → {{ row.dst }}</template></span>
              </div>
              <div v-for="(w, i) in preview.warnings" :key="'pw' + i" class="ds-preview__warn">
                <v-icon size="15" color="warning">warning</v-icon> {{ w }}
              </div>
            </template>
          </div>

          <div v-if="running" class="ds-status">
            <v-progress-linear :model-value="progress" height="6" color="primary" />
            <div>{{ message || 'Выполняется…' }} — {{ progress }}%</div>
          </div>
          <div v-if="error" class="ds-err">{{ error }}</div>
        </v-card-text>
        <v-card-actions class="ds-actions">
          <v-spacer />
          <v-btn variant="text" :disabled="running" @click="dialog = false">Закрыть</v-btn>
          <v-btn color="primary" :loading="running" :disabled="running || !can_run" @click="start">
            {{ data_mode === 'copy' ? 'Скопировать' : 'Перенести' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Успех -->
    <v-dialog v-model="result_dialog" max-width="680">
      <v-card v-if="result" class="ds-result">
        <div class="ds-dlg__head">
          <v-icon size="42" color="success">check_circle</v-icon>
          <div>
            <div class="ds-dlg__title">
              {{ result.mode === 'move' ? 'Настройки перенесены' : 'Настройки скопированы' }}
            </div>
            <div class="ds-dlg__subtitle">{{ result.dst_domain }}</div>
          </div>
        </div>
        <v-divider />
        <v-card-text class="ds-dlg__body">
          <div class="ds-grid">
            <div class="ds-grid__k">Домен</div><div>{{ result.dst_domain }} (id #{{ result.dst_domain_id }})</div>
            <div class="ds-grid__k">Шаблон</div><div>#{{ result.template_id }}</div>
            <div v-if="result.port" class="ds-grid__k">Порт</div>
            <div v-if="result.port">{{ result.port }}</div>
            <div class="ds-grid__k">Страниц конструктора</div><div>{{ (result.counts || {}).domain_page || 0 }}</div>
          </div>
          <div v-if="result.warnings && result.warnings.length" class="ds-warn">
            <v-icon size="18" color="warning">warning</v-icon>
            <div>
              <div v-for="(w, i) in result.warnings" :key="'w' + i">{{ w }}</div>
            </div>
          </div>
          <div class="ds-next">
            <div class="ds-next__title">Что сделать дальше</div>
            <ol>
              <li>Проверить домен на сервере: DNS, SSL-сертификат, vhost nginx.</li>
              <li>Обновить кэш: у домена стоит «нужно очистить кэш».</li>
              <li v-if="result.mode === 'copy'">
                Решить судьбу источника: правьте только новый домен либо отключите старый
                (карточка hosting → «Выключен»).
              </li>
            </ol>
          </div>
          <div class="ds-links">
            <a class="ds-link" :href="url_prefix + '/edit_form/domain/' + result.dst_domain_id" target="_blank" rel="noopener">
              <v-icon size="20" color="primary">language</v-icon>
              <span class="ds-link__t">Карточка домена</span>
            </a>
            <a v-if="result.is_constructor" class="ds-link" :href="url_prefix + '/vue/page-constructor/' + result.dst_domain_id" target="_blank" rel="noopener">
              <v-icon size="20" color="primary">edit_note</v-icon>
              <span class="ds-link__t">Конструктор страниц</span>
            </a>
            <a class="ds-link" :href="'https://' + result.dst_domain + '/'" target="_blank" rel="noopener">
              <v-icon size="20" color="primary">open_in_new</v-icon>
              <span class="ds-link__t">Открыть сайт</span>
            </a>
          </div>
        </v-card-text>
        <v-card-actions class="ds-actions">
          <v-spacer />
          <v-btn color="primary" @click="result_dialog = false">ОК</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: ['form', 'field'],
  data() {
    return {
      dialog: false,
      src_id: null,
      src_info: {},
      src_domain: null,
      src_items: [],
      src_loading: false,
      dst_mode: 'new',
      new_domain: '',
      domain_error: '',
      domain_check_timer: null,
      dst_domain: null,
      dst_items: [],
      dst_loading: false,
      port: null,
      new_folder: '',
      data_mode: 'copy',
      template_mode: 'inherit',
      pages_mode: 'replace',
      delete_old: false,
      parts: ['pages', 'theme', 'schemes', 'rkn', 'hosting', 'dns', 'robots'],
      preview: null,
      preview_loading: false,
      running: false,
      progress: 0,
      message: '',
      error: '',
      task_id: null,
      poll_timer: null,
      ws: null,
      result: null,
      result_dialog: false,
    }
  },
  computed: {
    url_prefix() {
      return (window.BaseUrl || '/').replace(/\/$/, '')
    },
    show_port() {
      return !!(this.src_info.is_constructor || Number(this.src_info.server_type) === 4)
        || (this.src_info.template_type === 6)
    },
    can_run() {
      if (!this.src_id) return false
      if (this.dst_mode === 'new') return !!this.new_domain && !this.domain_error
      return !!(this.dst_domain && this.dst_domain.v)
    },
    part_list() {
      const all = [
        { key: 'pages', label: 'Страницы конструктора' },
        { key: 'theme', label: 'Тема, шапка и подвал' },
        { key: 'schemes', label: 'Схемы темы домена' },
        { key: 'rkn', label: 'Реквизиты РКН' },
        { key: 'hosting', label: 'Hosting (клиент, оплаты)' },
        { key: 'dns', label: 'DNS-записи' },
        { key: 'robots', label: 'robots.txt' },
      ]
      if (this.src_info.is_constructor) return all
      return all.filter(p => !['pages', 'theme', 'schemes'].includes(p.key))
    },
    preview_rows() {
      if (!this.preview) return []
      const c = this.preview.src_counts || {}
      const labels = {
        domain_page: 'Страниц', domain_constructor: 'Тема (строк)',
        domain_theme_style: 'Схем стиля', domain_theme_color: 'Схем цвета',
        domain_rkn: 'РКН', project_hosting: 'Hosting',
        domain_dns_records_txt: 'DNS TXT', domain_dns_records_a: 'DNS A',
      }
      const rows = []
      for (const [k, label] of Object.entries(labels)) {
        if (c[k] === undefined) continue
        rows.push({ k: label, src: c[k], dst: this.preview.dst_counts ? (this.preview.dst_counts[k] || 0) : null })
      }
      return rows
    },
  },
  watch: {
    data_mode(v) { if (v !== 'move') this.delete_old = false },
  },
  mounted() {
    const id = this.form && this.form.id
    if (id) { this.src_id = id; this.load_preview() }
  },
  beforeUnmount() { this.stop_task() },
  methods: {
    open() {
      this.error = ''
      this.result = null
      this.dialog = true
      if (this.form && this.form.id) { this.src_id = this.form.id; this.load_preview() }
    },
    ws_base() {
      if (typeof config !== 'undefined' && config.BackgroundWS) return config.BackgroundWS
      return ((typeof config !== 'undefined' && config.BackendBase) || '').replace(/^http/, 'ws') + '/background/ws'
    },
    // ---- источник/приёмник ----
    on_src_search(term) {
      const t = (term || '').trim()
      clearTimeout(this.src_timer)
      this.src_timer = setTimeout(() => {
        this.src_loading = true
        this.$http.get(`${config.BackendBase}/svcmsadmin/project/create/domains`, { params: { term: t } })
          .then(r => { this.src_items = (r.data || {}).list || [] })
          .catch(() => {})
          .finally(() => { this.src_loading = false })
      }, 250)
    },
    on_dst_search(term) {
      const t = (term || '').trim()
      clearTimeout(this.dst_timer)
      this.dst_timer = setTimeout(() => {
        this.dst_loading = true
        this.$http.get(`${config.BackendBase}/svcmsadmin/project/create/domains`, { params: { term: t } })
          .then(r => { this.dst_items = (r.data || {}).list || [] })
          .catch(() => {})
          .finally(() => { this.dst_loading = false })
      }, 250)
    },
    on_src_change() {
      this.src_id = this.src_domain ? this.src_domain.v : null
      this.load_preview()
    },
    on_domain_input() {
      clearTimeout(this.domain_check_timer)
      this.domain_error = ''
      this.domain_check_timer = setTimeout(() => this.check_domain(), 400)
    },
    check_domain() {
      const domain = (this.new_domain || '').trim()
      if (!domain) { this.domain_error = ''; return }
      this.$http.get(`${config.BackendBase}/svcmsadmin/project/create/check-domain`, { params: { domain } })
        .then(r => {
          const d = r.data || {}
          this.domain_error = d.exists
            ? `Домен уже используется${d.project_id ? ' (проект #' + d.project_id + ')' : ''}`
            : ''
        })
        .catch(() => {})
    },
    toggle_part(key, on) {
      const i = this.parts.indexOf(key)
      if (on && i < 0) this.parts.push(key)
      if (!on && i >= 0) this.parts.splice(i, 1)
      this.refresh_preview()
    },
    // ---- превью ----
    load_preview() {
      if (!this.src_id) { this.src_info = {}; this.preview = null; return }
      this.preview_loading = true
      this.$http.get(`${config.BackendBase}/svcmsadmin/domain/sync/preview`, { params: { src_domain_id: this.src_id } })
        .then(r => {
          const d = r.data || {}
          if (!d.success) { this.error = (d.errors || [])[0] || 'не удалось получить превью'; return }
          this.src_info = d.src || {}
          this.preview = d
          if (this.src_info.is_constructor !== undefined) {
            this.parts = this.parts.filter(p => this.src_info.is_constructor || !['pages', 'theme', 'schemes'].includes(p))
          }
        })
        .catch(e => { this.error = '' + e })
        .finally(() => { this.preview_loading = false })
    },
    refresh_preview() {
      if (this.dst_domain && this.dst_domain.v) {
        this.preview_loading = true
        this.$http.get(`${config.BackendBase}/svcmsadmin/domain/sync/preview`,
          { params: { src_domain_id: this.src_id, dst_domain_id: this.dst_domain.v } })
          .then(r => { const d = r.data || {}; if (d.success) this.preview = d })
          .catch(() => {})
          .finally(() => { this.preview_loading = false })
      } else {
        this.load_preview()
      }
    },
    // ---- запуск ----
    start() {
      if (!this.can_run) return
      const dst = this.dst_mode === 'new' ? this.new_domain : null
      const where = dst ? dst : (this.dst_domain || {}).d
      const what = this.data_mode === 'move'
        ? 'Перенести настройки'
        : 'Скопировать настройки'
      if (!confirm(`${what} на ${where}?`)) return
      this.running = true
      this.progress = 0
      this.message = 'Ставим задачу…'
      this.error = ''
      this.result = null
      const payload = {
        src_domain_id: this.src_id,
        mode: this.data_mode,
        dst_domain_id: this.dst_mode === 'existing' ? (this.dst_domain || {}).v : null,
        new_domain: this.dst_mode === 'new' ? this.new_domain : null,
        new_folder: this.new_folder || null,
        template_mode: this.template_mode,
        parts: this.parts,
        pages_mode: this.pages_mode,
        delete_old: !!this.delete_old,
        port: this.port ? Number(this.port) : null,
      }
      this.$http.post(`${config.BackendBase}/svcmsadmin/domain/sync/start`, payload)
        .then(r => {
          const d = r.data || {}
          if (!d.success || !d.task_id) {
            this.error = (d.errors && d.errors[0]) || 'ошибка запуска'
            this.running = false
            return
          }
          this.open_task(d.task_id)
        })
        .catch(e => { this.error = '' + e; this.running = false })
    },
    open_task(task_id) {
      this.task_id = task_id
      if (this.poll_timer) clearInterval(this.poll_timer)
      this.poll_timer = setInterval(() => this.poll_status(), 1000)
      this.open_ws(task_id)
    },
    poll_status() {
      if (!this.task_id) return
      this.$http.get(`${config.BackendBase}/background/status/${this.task_id}`)
        .then(r => this.apply_task(r.data && r.data.task))
        .catch(() => {})
    },
    apply_task(t) {
      if (!t) return
      this.progress = t.progress || 0
      this.message = t.message || ''
      if (t.error) this.error = t.error
      if (t.status === 2) {
        try { this.result = t.result ? JSON.parse(t.result) : null } catch (e) {}
        this.stop_task()
        if (this.result && this.result.success) {
          this.dialog = false
          this.result_dialog = true
        }
      } else if (t.status === 3 || t.status === 4) {
        this.stop_task()
      }
    },
    open_ws(task_id) {
      try { this.ws = new WebSocket(`${this.ws_base()}/${task_id}`) } catch (e) { return }
      this.ws.onmessage = (ev) => {
        let d; try { d = JSON.parse(ev.data) } catch (e) { return }
        this.apply_task(d)
      }
      this.ws.onerror = () => {}
      this.ws.onclose = () => {}
    },
    stop_task() {
      if (this.poll_timer) { clearInterval(this.poll_timer); this.poll_timer = null }
      if (this.ws) { try { this.ws.close() } catch (e) {} this.ws = null }
      this.running = false
    },
  },
}
</script>

<style scoped>
.domain-sync { display: inline-block; }
</style>

<!-- Стили диалогов — БЕЗ scoped: v-dialog телепортирует контент вне корня. -->
<style>
.ds-dlg__head { display: flex; align-items: center; gap: 14px; padding: 18px 22px 14px; }
.ds-dlg__title { font-size: 1.15rem; font-weight: 600; line-height: 1.2; }
.ds-dlg__subtitle { color: rgba(0, 0, 0, 0.6); font-size: 0.9rem; margin-top: 2px; }
.ds-dlg__body { padding: 16px 22px 8px; max-height: 68vh; overflow: auto; }
.ds-dlg__src { margin-bottom: 12px; }
.ds-badge {
  display: inline-block; margin-left: 8px; padding: 1px 8px; border-radius: 10px;
  font-size: 0.75rem; background: rgba(25, 118, 210, 0.12); color: #1565c0;
}
.ds-badge--plain { background: rgba(0, 0, 0, 0.07); color: rgba(0, 0, 0, 0.6); }
.ds-radio { margin-bottom: 4px; }
.ds-row { margin-bottom: 10px; }
.ds-row--two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ds-block { margin: 12px 0; padding: 10px 12px; border: 1px solid rgba(0, 0, 0, 0.12); border-radius: 8px; }
.ds-block__title { font-weight: 600; font-size: 0.92rem; margin-bottom: 4px; }
.ds-checks { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
.ds-checks :deep(.v-selection-control) { min-height: 28px; }
.ds-preview { margin-top: 14px; padding: 10px 12px; border-radius: 8px; background: rgba(25, 118, 210, 0.06); }
.ds-preview__loading { color: rgba(0, 0, 0, 0.6); font-size: 0.9rem; }
.ds-preview__title { font-weight: 600; margin-bottom: 4px; }
.ds-preview__row { display: flex; justify-content: space-between; font-size: 0.88rem; }
.ds-preview__k { color: rgba(0, 0, 0, 0.6); }
.ds-preview__warn { margin-top: 6px; color: #8a5300; font-size: 0.85rem; display: flex; gap: 6px; }
.ds-status { margin-top: 12px; }
.ds-err { margin-top: 10px; color: #b00020; white-space: pre-wrap; }
.ds-actions { padding: 10px 16px 14px; }
.ds-grid { display: grid; grid-template-columns: 180px 1fr; gap: 6px 14px; }
.ds-grid__k { color: rgba(0, 0, 0, 0.6); font-size: 0.9rem; }
.ds-warn { display: flex; gap: 8px; align-items: flex-start; margin-top: 14px; padding: 10px 12px;
  border-radius: 8px; background: rgba(255, 152, 0, 0.12); color: #8a5300; font-size: 0.9rem; }
.ds-next { margin-top: 16px; font-size: 0.9rem; }
.ds-next__title { font-weight: 600; margin-bottom: 4px; }
.ds-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
.ds-link { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.14);
  border-radius: 10px; text-decoration: none; color: inherit; transition: border-color .15s, box-shadow .15s; }
.ds-link:hover { border-color: #1976d2; box-shadow: 0 2px 10px rgba(25, 118, 210, 0.16); }
.ds-link__t { font-weight: 600; font-size: 0.92rem; }
@media (max-width: 640px) {
  .ds-row--two, .ds-checks, .ds-links { grid-template-columns: 1fr; }
  .ds-grid { grid-template-columns: 1fr; }
}
</style>
