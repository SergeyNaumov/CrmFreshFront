<template>
  <div class="ds-data-transfer">
    <errors :errors="errors" v-if="errors.length" />

    <!-- Экспорт -->
    <v-card class="section" flat>
      <div class="h2">Экспорт данных проекта</div>
      <div class="hint">
        Архив содержит данные таблиц (без project_id — он берётся из текущего
        проекта при импорте) и файлы каталога files/project_{{ project_id }}.
      </div>

      <div class="tables" v-if="tables.length">
        <label v-for="t in tables" :key="t.table" class="table-item">
          <input type="checkbox" :value="t.table" v-model="selected" />
          <span class="tbl">{{ t.title || 'Таблица' }}</span>
          <span class="cnt">{{ t.rows }}</span>
          <span class="svc" v-if="t.service">служебная</span>
        </label>
      </div>
      <div class="btns">
        <v-btn size="small" variant="text" @click="select_content">Только контентные</v-btn>
        <v-btn size="small" variant="text" @click="selected = tables.map(t => t.table)">Все</v-btn>
        <v-btn size="small" variant="text" @click="selected = []">Снять выбор</v-btn>
      </div>
      <v-btn color="primary" size="small" :loading="running_export" :disabled="running_export || !selected.length" @click="do_export">
        Выгрузить архив
      </v-btn>

      <div v-if="export_task.running" class="status">
        <v-progress-linear :model-value="export_task.progress" height="6" color="primary" class="mt-2" />
        <div>{{ export_task.message }} — {{ export_task.progress }}%</div>
      </div>
      <div v-if="export_task.result && export_task.result.url" class="ok">
        Архив готов:
        <a :href="BackendBase + export_task.result.url" target="_blank">
          {{ export_task.result.file }}
        </a>
        ({{ export_task.result.files }} файлов, {{ export_task.result.tables && Object.keys(export_task.result.tables).length }} таблиц)
      </div>
    </v-card>

    <!-- Импорт -->
    <v-card class="section" flat>
      <div class="h2">Импорт данных проекта</div>
      <div class="hint">
        Загрузите архив, полученный на экспорте. Сначала будет показан план
        (dry-run) — данные запишутся только после подтверждения.
      </div>

      <input type="file" accept=".zip" @change="on_file" :disabled="running_import" />

      <div v-if="plan" class="plan">
        <div class="plan-title">
          Архив проекта {{ plan.manifest.source_project_id }},
          {{ plan.manifest.created || '' }} → проект {{ plan.project_id }}
        </div>

        <table class="plan-table">
          <thead>
            <tr><th>Таблица</th><th>В архиве</th><th>В проекте сейчас</th><th>Ключ поиска</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in plan.tables" :key="t.table">
              <td>{{ t.title || 'Таблица' }} <span class="svc" v-if="t.service">служебная</span></td>
              <td>{{ t.rows_archive }}</td>
              <td>{{ t.rows_project }}</td>
              <td>{{ (t.natural_key || []).join(' + ') || '—' }}</td>
            </tr>
          </tbody>
        </table>

        <div class="files">
          Файлы: {{ plan.files.count }} шт. ({{ fmt_bytes(plan.files.bytes) }}),
          отсутствуют в проекте: {{ plan.files.missing }},
          отличаются размером: {{ plan.files.differs }}.
        </div>

        <v-radio-group v-model="mode" inline hide-details density="compact" class="mode">
          <v-radio label="Перезаписать (очистить выбранные данные проекта и загрузить из архива)" value="replace" />
          <v-radio label="Совместить (добавить новые, обновить существующие по ключу)" value="merge" />
        </v-radio-group>

        <v-btn color="primary" size="small" :loading="running_import" :disabled="running_import" @click="do_import">
          Импортировать
        </v-btn>

        <div v-if="import_task.running" class="status">
          <v-progress-linear :model-value="import_task.progress" height="6" color="primary" class="mt-2" />
          <div>{{ import_task.message }} — {{ import_task.progress }}%</div>
        </div>
        <div v-if="import_task.result" class="ok">
          Импорт завершён (режим: {{ import_task.result.mode === 'merge' ? 'совместить' : 'перезаписать' }}).
          <div v-for="(s, tbl) in import_task.result.tables" :key="tbl">
            {{ title_of(tbl) }}: вставлено {{ s.inserted }}, обновлено {{ s.updated }}
          </div>
          <div v-if="import_task.result.files">
            Файлы: скопировано {{ import_task.result.files.copied }},
            перезаписано {{ import_task.result.files.overwritten }},
            пропущено (совпадают) {{ import_task.result.files.skipped_same }},
            конфликтов {{ import_task.result.files.conflicts }}
          </div>
          <div v-if="import_task.result.warnings && import_task.result.warnings.length" class="warn">
            <div v-for="(w, i) in import_task.result.warnings" :key="i">{{ w }}</div>
          </div>
        </div>
      </div>

      <div v-if="plan_warnings.length" class="warn">
        <div v-for="(w, i) in plan_warnings" :key="i">{{ w }}</div>
      </div>
    </v-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      BackendBase: (typeof config !== 'undefined' && config.BackendBase) || '',
      project_id: null,
      tables: [],
      selected: [],
      file: null,
      import_id: null,
      plan: null,
      plan_warnings: [],
      mode: 'replace',
      running_export: false,
      running_import: false,
      export_task: { running: false, progress: 0, message: '', result: null },
      import_task: { running: false, progress: 0, message: '', result: null },
      errors: []
    }
  },
  created() { this.load_tables() },
  beforeUnmount() { this.stop_task('export_task'); this.stop_task('import_task') },
  methods: {
    title_of(tbl) {
      // tbl — техническое имя таблицы; отдаём человеческое название из реестра
      const t = (this.tables || []).find(x => x.table === tbl)
      return (t && t.title) || tbl
    },
    fmt_bytes(b) {
      if (!b) return '0'
      if (b > 1048576) return (b / 1048576).toFixed(1) + ' МБ'
      if (b > 1024) return (b / 1024).toFixed(0) + ' КБ'
      return b + ' Б'
    },
    select_content() {
      this.selected = this.tables.filter(t => !t.service).map(t => t.table)
    },
    load_tables() {
      this.errors = []
      this.$http.get(`${config.BackendBase}/svcms/data/tables`)
        .then(r => {
          const d = r.data || {}
          if (!d.success) { this.errors = d.errors || []; return }
          this.tables = d.tables || []
          this.project_id = d.project_id
          this.select_content()
        })
        .catch(e => { this.errors = ['' + e] })
    },
    on_file(e) {
      this.file = e.target.files[0] || null
      this.plan = null
      this.plan_warnings = []
      this.import_task.result = null
      if (!this.file) return
      const fd = new FormData()
      fd.append('file', this.file)
      this.errors = []
      this.$http.post(`${config.BackendBase}/svcms/data/import/preview`, fd)
        .then(r => {
          const d = r.data || {}
          if (!d.success) { this.errors = d.errors || []; return }
          this.plan = d
          this.import_id = d.import_id
          this.plan_warnings = d.warnings || []
        })
        .catch(e => { this.errors = ['' + e] })
    },
    do_export() {
      this.errors = []
      this.export_task = { running: true, progress: 0, message: 'Запуск экспорта…', result: null }
      this.$http.post(`${config.BackendBase}/svcms/data/export/start`, { tables: this.selected })
        .then(r => {
          const d = r.data || {}
          if (!d.success) { this.errors = d.errors || []; this.export_task.running = false; return }
          this.open_task('export_task', d.task_id)
        })
        .catch(e => { this.errors = ['' + e]; this.export_task.running = false })
    },
    do_import() {
      if (!this.import_id) { this.errors = ['сначала загрузите архив']; return }
      this.errors = []
      this.import_task = { running: true, progress: 0, message: 'Запуск импорта…', result: null }
      this.$http.post(`${config.BackendBase}/svcms/data/import/start`, { import_id: this.import_id, mode: this.mode })
        .then(r => {
          const d = r.data || {}
          if (!d.success) { this.errors = d.errors || []; this.import_task.running = false; return }
          this.open_task('import_task', d.task_id)
        })
        .catch(e => { this.errors = ['' + e]; this.import_task.running = false })
    },
    // Прогресс задачи: WS + опрос (WS может быть недоступен за nginx)
    open_task(key, task_id) {
      const t = this[key]
      t.task_id = task_id
      t.poll_timer = setInterval(() => this.poll_status(key), 1000)
      try {
        t.ws = new WebSocket(`${this.ws_base()}/${task_id}`)
        t.ws.onmessage = (ev) => {
          let d; try { d = JSON.parse(ev.data) } catch (e) { return }
          this.apply_task(key, d)
        }
        t.ws.onerror = () => {}
        t.ws.onclose = () => {}
      } catch (e) {}
    },
    ws_base() {
      if (typeof config !== 'undefined' && config.BackgroundWS) return config.BackgroundWS
      return ((typeof config !== 'undefined' && config.BackendBase) || '').replace(/^http/, 'ws') + '/background/ws'
    },
    poll_status(key) {
      const t = this[key]
      if (!t.task_id) return
      this.$http.get(`${config.BackendBase}/background/status/${t.task_id}`)
        .then(r => this.apply_task(key, r.data && r.data.task))
        .catch(() => {})
    },
    apply_task(key, t) {
      if (!t) return
      const task = this[key]
      task.progress = t.progress || 0
      task.message = t.message || ''
      if (t.error) this.errors = [t.error]
      if (t.status === 2) {
        try { task.result = t.result ? JSON.parse(t.result) : null } catch (e) {}
        this.stop_task(key)
        if (key === 'import_task') this.load_tables()
      } else if (t.status === 3 || t.status === 4) {
        this.stop_task(key)
      }
    },
    stop_task(key) {
      const t = this[key]
      if (t.poll_timer) { clearInterval(t.poll_timer); t.poll_timer = null }
      if (t.ws) { try { t.ws.close() } catch (e) {} t.ws = null }
      t.running = false
    }
  }
}
</script>

<style scoped>
.ds-data-transfer .section { padding: 12px; margin-bottom: 16px; }
.ds-data-transfer .h2 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.ds-data-transfer .hint { color: #666; margin-bottom: 10px; }
.ds-data-transfer .tables { margin-bottom: 8px; }
.ds-data-transfer .table-item { display: inline-flex; align-items: center; gap: 6px; margin: 2px 12px 2px 0; }
.ds-data-transfer .table-item .cnt { color: #888; }
.ds-data-transfer .code { color: #999; font-size: 11px; font-family: monospace; }
.ds-data-transfer .svc { color: #b06000; font-size: 12px; }
.ds-data-transfer .btns { margin: 8px 0; }
.ds-data-transfer .status { margin-top: 8px; }
.ds-data-transfer .ok { margin-top: 8px; color: green; word-break: break-all; }
.ds-data-transfer .warn { margin-top: 8px; color: #b06000; white-space: pre-wrap; }
.ds-data-transfer .plan { margin-top: 10px; }
.ds-data-transfer .plan-title { font-weight: 600; margin-bottom: 6px; }
.ds-data-transfer .plan-table { border-collapse: collapse; margin-bottom: 8px; }
.ds-data-transfer .plan-table th, .ds-data-transfer .plan-table td {
  border: 1px solid #ddd; padding: 2px 8px; text-align: left;
}
.ds-data-transfer .plan-table .code { color: #999; font-size: 11px; font-family: monospace; }
.ds-data-transfer .mode { margin-top: 4px; }
</style>
