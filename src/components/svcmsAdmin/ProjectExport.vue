<template>
  <div class="project-export">
    <div v-if="loaded && exportInfo" class="row">
      <a :href="archHref" target="_blank">Архив</a>
      <v-btn size="small" color="error" variant="tonal" class="ml-2" :disabled="running" @click="drop">Удалить</v-btn>
    </div>
    <div v-else-if="loaded">
      <v-btn color="primary" :loading="running" :disabled="running" @click="start">
        Экспортировать
      </v-btn>
    </div>

    <div v-if="running" class="status">
      <v-progress-linear :model-value="progress" height="6" color="primary" class="mt-2" />
      <div>{{ message }} — {{ progress }}%</div>
    </div>
    <div v-if="result" class="ok">Готово: {{ result.file }}</div>
    <div v-if="error" class="err">{{ error }}</div>
  </div>
</template>

<script>
export default {
  props: ['form', 'field'],
  data() {
    return {
      loaded: false, exportInfo: null, running: false, progress: 0,
      message: '', error: '', result: null,
      task_id: null, poll_timer: null, ws: null
    }
  },
  computed: {
    archHref() {
      if (!this.exportInfo || !this.exportInfo.file) return '#'
      // На проде nginx отдаёт /exported_projects, локально файла может не быть
      return this.exportInfo.file.replace(/^.*\/exported_projects/, '/exported_projects')
    }
  },
  created() { this.load() },
  beforeUnmount() { this.stop_task() },
  methods: {
    ws_base() {
      if (typeof config !== 'undefined' && config.BackgroundWS) return config.BackgroundWS
      return ((typeof config !== 'undefined' && config.BackendBase) || '').replace(/^http/, 'ws') + '/background/ws'
    },
    load() {
      this.$http.get(`${config.BackendBase}/svcmsadmin/project/export/info`, { params: { project_id: this.form.id } })
        .then(r => { this.exportInfo = (r.data && r.data.export) || null; this.loaded = true })
        .catch(() => { this.loaded = true })
    },
    start() {
      if (!this.form.id) { this.error = 'Сначала сохраните проект'; return }
      this.running = true; this.progress = 0; this.message = 'Запуск экспорта…'; this.error = ''; this.result = null
      this.$http.post(`${config.BackendBase}/svcmsadmin/project/export/start`, { project_id: this.form.id })
        .then(r => {
          const d = r.data || {}
          if (!d.success || !d.task_id) { this.error = (d.errors && d.errors[0]) || 'ошибка запуска'; this.running = false; return }
          this.open_task(d.task_id)
        })
        .catch(e => { this.error = '' + e; this.running = false })
    },
    drop() {
      if (!this.form.id) { this.error = 'Сначала сохраните проект'; return }
      if (!confirm('Удалить архив экспорта?')) return
      this.running = true; this.progress = 0; this.message = 'Удаление…'; this.error = ''; this.result = null
      this.$http.post(`${config.BackendBase}/svcmsadmin/project/export/drop`, { project_id: this.form.id })
        .then(r => {
          const d = r.data || {}
          if (d.task_id) this.open_task(d.task_id)
          else { this.running = false; this.load() }
        })
        .catch(e => { this.error = '' + e; this.running = false })
    },
    // Задача ставится в crm_background; прогресс слушаем по WS,
    // а если WS недоступен (nginx без upgrade) -- опрашиваем статус.
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
        this.stop_task(); this.load()
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
      // при ошибке/закрытии WS не сбрасываем running -- дoведёт опрос
      this.ws.onerror = () => {}
      this.ws.onclose = () => {}
    },
    stop_task() {
      if (this.poll_timer) { clearInterval(this.poll_timer); this.poll_timer = null }
      if (this.ws) { try { this.ws.close() } catch (e) {} this.ws = null }
      this.running = false
    }
  }
}
</script>

<style scoped>
.project-export .row { display: flex; align-items: center; }
.project-export .status { margin-top: 6px; }
.project-export .ok { margin-top: 6px; color: green; word-break: break-all; }
.project-export .err { margin-top: 6px; color: red; white-space: pre-wrap; }
</style>
