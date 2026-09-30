<template>
  <div class="project-sitemap">
    <v-btn
      color="primary"
      :loading="running"
      :disabled="running || !form.id"
      @click="start"
    >Сгенерировать sitemap.xml</v-btn>

    <div v-if="message || running" class="status">
      {{ message }}
      <span v-if="running"> — {{ progress }}%</span>
    </div>

    <div v-if="result" class="ok">
      Готово: {{ result.file }} ({{ result.urls }} адрес(ов))
    </div>

    <div v-if="error" class="err">{{ error }}</div>
  </div>
</template>

<script>
export default {
  props: ['form', 'field'],
  data() {
    return { running: false, progress: 0, message: '', error: '', result: null, ws: null }
  },
  methods: {
    // Базовый ws-URL: из configure.js (BackgroundWS) либо из BackendBase.
    ws_base() {
      if (typeof config !== 'undefined' && config.BackgroundWS) return config.BackgroundWS
      const base = (typeof config !== 'undefined' && config.BackendBase) || ''
      return base.replace(/^http/, 'ws') + '/background/ws'
    },
    start() {
      this.running = true
      this.progress = 0
      this.message = 'Запуск…'
      this.error = ''
      this.result = null

      const url = `${config.BackendBase}/svcmsadmin/project/sitemap/start`
      this.$http.post(url, { project_id: this.form.id }).then(r => {
        const d = r.data || {}
        if (!d.success || !d.task_id) {
          this.error = (d.errors && d.errors[0]) || 'не удалось запустить задачу'
          this.running = false
          return
        }
        this.open_ws(d.task_id)
      }).catch(e => {
        this.error = '' + e
        this.running = false
      })
    },
    open_ws(task_id) {
      const ws = new WebSocket(`${this.ws_base()}/${task_id}`)
      this.ws = ws
      ws.onmessage = (ev) => {
        let d
        try { d = JSON.parse(ev.data) } catch (e) { return }
        this.progress = d.progress || 0
        this.message = d.message || ''
        if (d.error) this.error = d.error
        if (d.status === 2) {
          try { this.result = d.result ? JSON.parse(d.result) : null } catch (e) { this.result = null }
          this.running = false
          ws.close()
        } else if (d.status === 3 || d.status === 4) {
          this.running = false
          ws.close()
        }
      }
      ws.onerror = () => { this.running = false }
      ws.onclose = () => { this.running = false }
    }
  }
}
</script>

<style scoped>
.project-sitemap { padding: 4px 0; }
.project-sitemap .status { margin-top: 6px; }
.project-sitemap .ok { margin-top: 6px; color: green; }
.project-sitemap .err { margin-top: 6px; color: red; white-space: pre-wrap; }
</style>
