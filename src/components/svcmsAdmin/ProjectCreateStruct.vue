<template>
  <div class="project-struct">
    <v-select
      v-model="structname"
      :items="templates"
      item-title="header"
      item-value="name"
      label="Сущность"
      density="compact"
      hide-details
      class="mb-2"
    />

    <div v-for="(r, idx) in resizes" :key="idx" class="resize-row">
      <v-text-field v-model="r.file" label="fname (напр. [%input%]_mini.[%input_ext%])" density="compact" hide-details />
      <v-text-field v-model="r.resize" label="resize (WxH)" density="compact" hide-details style="max-width: 120px;" />
      <v-btn size="small" variant="text" @click="resizes.splice(idx, 1)">×</v-btn>
    </div>
    <v-btn size="small" variant="text" class="mb-2" @click="resizes.push({ file: '', resize: '' })">+ Добавить resize</v-btn>

    <div>
      <v-btn color="primary" :loading="running" :disabled="running || !form.id || !structname" @click="start">
        Создать структуру
      </v-btn>
    </div>

    <div v-if="message" class="status">{{ message }}<span v-if="running"> — {{ progress }}%</span></div>
    <div v-if="result" class="ok">Создано: {{ result.header }} ({{ result.table_name }})</div>
    <div v-if="error" class="err">{{ error }}</div>
  </div>
</template>

<script>
export default {
  props: ['form', 'field'],
  data() {
    return { templates: [], structname: '', resizes: [], running: false, progress: 0, message: '', error: '', result: null }
  },
  created() {
    this.$http.get(`${config.BackendBase}/svcmsadmin/project/struct/templates`)
      .then(r => { this.templates = (r.data && r.data.templates) || [] })
      .catch(() => {})
  },
  methods: {
    ws_base() {
      if (typeof config !== 'undefined' && config.BackgroundWS) return config.BackgroundWS
      return ((typeof config !== 'undefined' && config.BackendBase) || '').replace(/^http/, 'ws') + '/background/ws'
    },
    start() {
      if (!this.form.id || !this.structname) return
      this.running = true; this.progress = 0; this.message = 'Создание структуры…'; this.error = ''; this.result = null
      this.$http.post(`${config.BackendBase}/svcmsadmin/project/struct/start`, {
        project_id: this.form.id,
        structname: this.structname,
        resize: this.resizes.filter(r => r.file && r.resize),
      }).then(r => {
        const d = r.data
        if (!d.success || !d.task_id) { this.error = (d.errors && d.errors[0]) || 'ошибка запуска'; this.running = false; return }
        this.open_ws(d.task_id)
      }).catch(e => { this.error = '' + e; this.running = false })
    },
    open_ws(task_id) {
      const ws = new WebSocket(`${this.ws_base()}/${task_id}`)
      ws.onmessage = (ev) => {
        let d; try { d = JSON.parse(ev.data) } catch (e) { return }
        this.progress = d.progress || 0
        this.message = d.message || ''
        if (d.error) this.error = d.error
        if (d.status === 2) {
          try { this.result = d.result ? JSON.parse(d.result) : null } catch (e) {}
          this.running = false; ws.close()
        } else if (d.status === 3 || d.status === 4) { this.running = false; ws.close() }
      }
      ws.onerror = () => { this.running = false }
      ws.onclose = () => { this.running = false }
    }
  }
}
</script>

<style scoped>
.project-struct .resize-row { display: flex; gap: 6px; align-items: center; }
.project-struct .status { margin-top: 6px; }
.project-struct .ok { margin-top: 6px; color: green; }
.project-struct .err { margin-top: 6px; color: red; white-space: pre-wrap; }
</style>
