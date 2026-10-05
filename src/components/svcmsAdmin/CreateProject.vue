<template>
  <div class="create-project">
    <v-card class="pa-4">
      <h1 class="title">Быстрое создание проекта</h1>

      <div class="form">
        <v-text-field v-model="header" label="Название проекта" density="compact" hide-details />
        <v-text-field v-model="domain" label="Домен (без http://)" density="compact" hide-details />

        <v-select
          v-model="template_id"
          :items="templates"
          item-title="header"
          item-value="template_id"
          label="Шаблон-конструктор"
          density="compact"
          hide-details
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" :subtitle="item.raw.folder"></v-list-item>
          </template>
        </v-select>

        <v-checkbox
          v-model="create_manager"
          label="Создать менеджера"
          density="compact"
          hide-details
        />
        <template v-if="create_manager">
          <v-text-field v-model="login" label="Логин менеджера" density="compact" hide-details />
          <div class="pass-row">
            <v-text-field v-model="password" label="Пароль (пусто = сгенерировать)" density="compact" hide-details />
            <v-btn size="small" variant="text" @click="password = genPassword()">Сгенерировать</v-btn>
          </div>
        </template>

        <v-checkbox
          v-model="demo"
          label="Демо-контент и файлы проекта (из эталона)"
          density="compact"
          hide-details
        />
        <div v-if="source_project_id" class="hint">Проект-эталон: #{{ source_project_id }}</div>

        <div>
          <v-btn color="primary" :loading="running" :disabled="running" @click="start">
            Создать проект
          </v-btn>
        </div>
      </div>

      <div v-if="errors.length" class="err">
        <div v-for="(e, idx) in errors" :key="'e' + idx">{{ e }}</div>
      </div>

      <div v-if="result" class="ok">
        <div>Проект #{{ result.project_id }} создан (домен #{{ result.domain_id }}).</div>
        <div v-if="result.login">Менеджер: {{ result.login }} / {{ result.password }}</div>
        <div>Страниц конструктора: {{ result.pages }}</div>
        <div v-if="result.warnings && result.warnings.length" class="warn">
          <div v-for="(w, idx) in result.warnings" :key="'w' + idx">{{ w }}</div>
        </div>
        <div class="links">
          <a v-if="constructor_url" :href="constructor_url">Открыть конструктор</a>
          <a v-if="project_url" :href="project_url">Открыть проект</a>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ['params'],
  data() {
    return {
      header: '',
      domain: '',
      template_id: null,
      templates: [],
      source_project_id: 0,
      create_manager: false,
      login: '',
      password: '',
      demo: false,
      running: false,
      errors: [],
      result: null,
    }
  },
  computed: {
    url_prefix() {
      return (typeof config !== 'undefined' && config.UrlPrefix) || ''
    },
    backend_base() {
      return (typeof config !== 'undefined' && config.BackendBase) || ''
    },
    constructor_url() {
      if (!this.result || !this.result.domain_id) return ''
      return this.url_prefix + '/vue/page-constructor/' + this.result.domain_id
    },
    project_url() {
      if (!this.result || !this.result.project_id) return ''
      return this.url_prefix + '/edit_form/project/' + this.result.project_id
    },
  },
  created() {
    this.load_templates()
  },
  methods: {
    genPassword() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let out = ''
      for (let i = 0; i < 8; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
      return out
    },
    load_templates() {
      this.$http.get(this.backend_base + '/svcmsadmin/project/create/templates')
        .then(r => {
          const d = r.data || {}
          this.templates = d.templates || []
          this.source_project_id = d.source_project_id || 0
          if (this.templates.length) this.template_id = this.templates[0].template_id
        })
        .catch(e => { this.errors = ['' + e] })
    },
    start() {
      this.errors = []
      this.result = null
      this.running = true
      this.$http.post(this.backend_base + '/svcmsadmin/project/create/start', {
        header: this.header,
        domain: this.domain,
        template_id: this.template_id,
        create_manager: this.create_manager,
        login: this.login,
        password: this.password,
        demo: this.demo,
        source_project_id: this.source_project_id,
      })
        .then(r => {
          const d = r.data || {}
          this.running = false
          if (!d.success) { this.errors = d.errors || ['ошибка создания']; return }
          this.result = d
        })
        .catch(e => { this.errors = ['' + e]; this.running = false })
    },
  },
}
</script>

<style scoped>
.create-project .form { display: flex; flex-direction: column; gap: var(--app-space-field, 16px); max-width: 640px; }
.create-project .pass-row { display: flex; gap: 6px; align-items: center; }
.create-project .hint { color: #666; font-size: 0.85rem; }
.create-project .ok { margin-top: 12px; color: green; }
.create-project .warn { color: #b26a00; }
.create-project .err { margin-top: 12px; color: red; white-space: pre-wrap; }
.create-project .links { display: flex; gap: 16px; margin-top: 8px; }
</style>
