<template>
  <div class="project-clone">
    <v-btn color="primary" @click="open">
      Клонировать
    </v-btn>

    <v-dialog v-model="dialog" max-width="560" :persistent="running">
      <v-card>
        <v-card-title>Клонирование проекта</v-card-title>
        <v-card-text>
          <div class="clone-form">
            <v-text-field v-model="domain" label="Новый домен (без .design-b2b.com)" density="compact" hide-details />
            <v-text-field v-model="login" label="Логин (по умолчанию = домен)" density="compact" hide-details />
            <v-text-field v-model="password" label="Пароль (пусто = сгенерировать)" density="compact" hide-details />
            <v-text-field v-model="folder" label="Папка шаблона (по умолчанию = домен)" density="compact" hide-details />
          </div>

          <div v-if="running" class="status">
            <v-progress-linear :model-value="progress" height="6" color="primary" class="mt-3" />
            <div>{{ message }} — {{ progress }}%</div>
          </div>
          <div v-if="result" class="ok">
            Новый проект #{{ result.project_id }}<br>
            <span v-if="result.login">Логин: {{ result.login }} / Пароль: {{ result.password }}</span>
          </div>
          <div v-if="error" class="err">{{ error }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="running" @click="dialog = false">Закрыть</v-btn>
          <v-btn color="primary" :loading="running" :disabled="running" @click="start">Клонировать</v-btn>
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
      domain: '', login: '', password: '', folder: '',
      dialog: false, running: false, progress: 0,
      message: '', error: '', result: null,
      task_id: null, poll_timer: null, ws: null
    }
  },
  watch: {
    domain(v) { if (!this.login) this.login = v; if (!this.folder) this.folder = v }
  },
  beforeUnmount() { this.stop_task() },
  methods: {
    open() {
      this.error = ''
      this.result = null
      this.dialog = true
    },
    ws_base() {
      if (typeof config !== 'undefined' && config.BackgroundWS) return config.BackgroundWS
      return ((typeof config !== 'undefined' && config.BackendBase) || '').replace(/^http/, 'ws') + '/background/ws'
    },
    start() {
      if (!this.form.id) { this.error = 'Сначала сохраните проект'; return }
      if (!this.domain) { this.error = 'Укажите новый домен'; return }
      if (!confirm(`Клонировать проект в ${this.domain}.design-b2b.com?`)) return
      this.running = true; this.progress = 0; this.message = 'Клонирование…'; this.error = ''; this.result = null
      const payload = {
        project_id: this.form.id,
        domain: this.domain + '.design-b2b.com',
        folder: this.folder || this.domain,
        login: this.login || this.domain,
        password: this.password,
      }
      this.$http.post(`${config.BackendBase}/svcmsadmin/project/clone/start`, payload)
        .then(r => {
          const d = r.data || {}
          if (!d.success || !d.task_id) { this.error = (d.errors && d.errors[0]) || 'ошибка запуска'; this.running = false; return }
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
    }
  }
}
</script>

<style scoped>
.project-clone .clone-form { display: flex; flex-direction: column; gap: var(--app-space-field, 16px); }
.project-clone .status { margin-top: 6px; }
.project-clone .ok { margin-top: 6px; color: green; }
.project-clone .err { margin-top: 6px; color: red; white-space: pre-wrap; }
</style>
