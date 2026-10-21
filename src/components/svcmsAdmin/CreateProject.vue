<template>
  <div class="create-project">
    <v-card class="pa-4">
      <h1 class="title">Создание проекта</h1>

      <v-radio-group v-model="mode" inline density="compact" hide-details class="mode-row">
        <v-radio label="Новый проект" value="new" />
        <v-radio label="На базе существующего сайта" value="base" />
      </v-radio-group>

      <div class="form">
        <v-text-field v-model="header" label="Название проекта" density="compact" hide-details />
        <v-text-field
          v-model="domain"
          label="Новый домен (без http://)"
          density="compact"
          hide-details="auto"
          :error="!!domain_error"
          :error-messages="domain_error ? [domain_error] : []"
          @update:model-value="on_domain_input"
        />

        <!-- Новый проект: на конструкторе страниц (DS) или обычный -->
        <v-checkbox
          v-if="mode === 'new'"
          v-model="ds_mode"
          label="На базе конструктора страниц (DS)"
          density="compact"
          hide-details
        />

        <v-autocomplete
          v-if="show_source"
          v-model="source_domain"
          :items="source_items"
          :loading="source_loading"
          item-title="d"
          item-value="v"
          return-object
          :custom-filter="() => true"
          :label="source_label"
          density="compact"
          hide-details
          @update:search="on_source_search"
          @update:model-value="on_source_change"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #subtitle>
                <span v-if="item.raw.type === 6">конструктор</span>
                <span v-else>обычный шаблон #{{ item.raw.template_id }}</span>
              </template>
            </v-list-item>
          </template>
        </v-autocomplete>
        <div v-if="mode === 'new' && !ds_mode" class="hint">
          Обычный проект с чистого листа: новый шаблон (папка = домен) и пустые каталоги.
        </div>

        <div class="row2">
          <v-select
            v-model="server_type"
            :items="server_types"
            item-title="d"
            item-value="v"
            label="Размещение на сервере"
            density="compact"
            hide-details
            @update:model-value="on_server_type"
          />
          <v-text-field
            v-model="port"
            label="Порт"
            density="compact"
            hide-details
            :disabled="server_type !== 4"
            :hint="server_type === 4 ? 'Авто: максимум занятых + 1' : 'Для PSGI порт не нужен'"
            persistent-hint
          />
        </div>

        <!-- Опции конструктора -->
        <div v-if="options_visible" class="options">
          <div class="options-head">
            <span>Опции конструктора ({{ ds_option_ids.length }} из {{ ds_options.length }})</span>
            <v-btn size="x-small" variant="text" @click="toggle_all_options">
              {{ all_options ? 'Снять все' : 'Выбрать все' }}
            </v-btn>
          </div>
          <div class="options-grid">
            <template v-for="grp in ds_option_groups" :key="grp.id">
              <v-checkbox
                class="opt-root"
                :model-value="ds_option_ids.includes(grp.id)"
                density="compact"
                hide-details
                @update:model-value="v => toggle_option(grp.id, v)"
              >
                <template #label>
                  <span :title="grp.note || ''">{{ grp.header }}</span>
                </template>
              </v-checkbox>
              <div v-if="grp.children.length" class="opt-kids">
                <v-checkbox
                  v-for="o in grp.children"
                  :key="o.id"
                  :model-value="ds_option_ids.includes(o.id)"
                  :style="{ marginLeft: ((o.depth - 1) * 16) + 'px' }"
                  density="compact"
                  hide-details
                  @update:model-value="v => toggle_option(o.id, v)"
                >
                  <template #label>
                    <span :title="o.note || ''">{{ o.header }}</span>
                    <span v-if="!o.is_menu" class="opt-tag">поведение</span>
                  </template>
                </v-checkbox>
              </div>
            </template>
          </div>
        </div>

        <!-- Режим «на базе существующего» -->
        <template v-if="mode === 'base'">
          <v-radio-group v-model="copy_data" density="compact" hide-details>
            <v-radio label="Только информация о проекте и шаблоне" :value="false" />
            <v-radio label="Данные проекта вместе с файлами" :value="true" />
          </v-radio-group>
          <div class="hint">
            Информация — каркас проекта/шаблона, конфиги шаблона и страницы конструктора;
            данные — сущности сайта (news, article, good, ds_*, struct_*) и файлы.
          </div>
        </template>

        <v-checkbox v-model="create_manager" label="Создать менеджера" density="compact" hide-details />
        <template v-if="create_manager">
          <v-text-field v-model="login" label="Логин менеджера" density="compact" hide-details />
          <div class="pass-row">
            <v-text-field v-model="password" label="Пароль (пусто = сгенерировать)" density="compact" hide-details />
            <v-btn size="small" variant="text" @click="password = genPassword()">Сгенерировать</v-btn>
          </div>
        </template>

        <div class="actions">
          <v-btn color="primary" :loading="running" :disabled="running || !start_ready" @click="start">
            Создать проект
          </v-btn>
          <span v-if="!options_visible && source_domain" class="hint">Обычный проект (без конструктора)</span>
        </div>

        <div v-if="running" class="status">
          <v-progress-linear :model-value="progress" height="6" color="primary" />
          <div>{{ message || 'Выполняется…' }} — {{ progress }}%</div>
        </div>
      </div>

      <!-- Ошибка создания -->
      <v-dialog v-model="error_dialog" max-width="600">
        <v-card class="cp-err">
          <div class="cp-err__head">
            <v-icon size="36" color="error">error</v-icon>
            <div class="cp-err__title">Не удалось создать проект</div>
          </div>
          <v-divider />
          <v-card-text>
            <div v-for="(e, idx) in errors" :key="'e' + idx" class="cp-err__line">{{ e }}</div>
          </v-card-text>
          <v-card-actions class="cp-result__actions">
            <v-spacer />
            <v-btn color="primary" @click="error_dialog = false">Понятно</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Успешное создание -->
      <v-dialog v-model="result_dialog" max-width="720">
        <v-card v-if="result" class="cp-result">
          <div class="cp-result__head">
            <v-icon size="42" color="success">check_circle</v-icon>
            <div>
              <div class="cp-result__title">Проект создан</div>
              <div class="cp-result__subtitle">{{ result.header }}</div>
            </div>
          </div>
          <v-divider />
          <v-card-text class="cp-result__body">
            <div class="cp-result__grid">
              <div class="cp-result__k">Проект</div><div>#{{ result.project_id }}</div>
              <div class="cp-result__k">Домен</div>
              <div>
                {{ result.domain }}
                <span class="cp-result__muted">(id #{{ result.domain_id }})</span>
              </div>
              <div class="cp-result__k">Шаблон</div><div>#{{ result.template_id }}</div>
              <div class="cp-result__k">Размещение</div>
              <div>
                {{ result.server_type === 4 ? 'Python + Fastapi' : 'PSGI + utf8' }}
                <span v-if="result.port" class="cp-result__muted"> — порт {{ result.port }}</span>
              </div>
              <template v-if="result.login">
                <div class="cp-result__k">Менеджер</div>
                <div class="cp-result__login" title="Нажмите, чтобы скопировать логин и пароль" @click="copy_credentials">
                  <span>{{ result.login }} / {{ result.password }}</span>
                  <v-icon size="15">content_copy</v-icon>
                  <span v-if="credentials_copied" class="cp-result__copied">скопировано</span>
                </div>
              </template>
              <template v-if="result.is_constructor">
                <div class="cp-result__k">Страниц конструктора</div><div>{{ result.pages }}</div>
              </template>
            </div>

            <div v-if="result.warnings && result.warnings.length" class="cp-result__warn">
              <v-icon size="18" color="warning">warning</v-icon>
              <div>
                <div v-for="(w, idx) in result.warnings" :key="'w' + idx">{{ w }}</div>
              </div>
            </div>

            <div class="cp-result__links">
              <a v-if="project_url" class="cp-result__link" :href="project_url" target="_blank" rel="noopener">
                <v-icon size="22" color="primary">view_module</v-icon>
                <span class="cp-result__link-title">Карточка проекта</span>
                <span class="cp-result__link-hint">данные проекта в админке</span>
              </a>
              <a v-if="result.domain_id" class="cp-result__link" :href="url_prefix + '/edit_form/domain/' + result.domain_id" target="_blank" rel="noopener">
                <v-icon size="22" color="primary">language</v-icon>
                <span class="cp-result__link-title">Карточка домена</span>
                <span class="cp-result__link-hint">домен, порт, шаблон</span>
              </a>
              <a v-if="constructor_url" class="cp-result__link" :href="constructor_url" target="_blank" rel="noopener">
                <v-icon size="22" color="primary">edit_note</v-icon>
                <span class="cp-result__link-title">Конструктор страниц</span>
                <span class="cp-result__link-hint">страницы и блоки</span>
              </a>
            </div>
          </v-card-text>
          <v-card-actions class="cp-result__actions">
            <v-spacer />
            <v-btn v-if="site_url" variant="tonal" prepend-icon="open_in_new" :href="site_url" target="_blank">Открыть сайт</v-btn>
            <v-btn color="primary" @click="ok_result">ОК</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ['params'],
  data() {
    return {
      mode: 'new',
      header: '',
      domain: '',
      domain_error: '',
      domain_check_timer: null,
      ds_mode: false,
      source_domain: null,
      source_default: null,
      source_option_ids: [],
      domain_items: [],
      domains_loading: false,
      domain_search_timer: null,

      server_type: 4,
      server_types: [
        { v: 3, d: 'PSGI + utf8' },
        { v: 4, d: 'Python + Fastapi' },
      ],
      port: null,
      next_port: null,

      ds_options: [],
      ds_option_ids: [],
      constructor_domains: [],
      constructor_domains_loading: false,
      constructor_search_timer: null,

      copy_data: false,
      create_manager: false,
      login: '',
      password: '',

      running: false,
      progress: 0,
      message: '',
      task_id: null,
      poll_timer: null,
      ws: null,

      errors: [],
      result: null,
      credentials_copied: false,
      error_dialog: false,
      result_dialog: false,
    }
  },
  computed: {
    url_prefix() {
      return (window.BaseUrl || '/').replace(/\/$/, '')
    },
    backend_base() {
      return (typeof config !== 'undefined' && config.BackendBase) || ''
    },
    is_constructor() {
      return !!(this.source_domain && Number(this.source_domain.type) === 6)
    },
    // Поле источника показываем: в клоне (образец) или в новом DS-проекте (источник наполнения).
    show_source() {
      return this.mode === 'base' || (this.mode === 'new' && this.ds_mode)
    },
    source_items() {
      return this.mode === 'base' ? this.domain_items : this.constructor_domains
    },
    source_loading() {
      return this.mode === 'base' ? this.domains_loading : this.constructor_domains_loading
    },
    source_label() {
      return this.mode === 'base'
        ? 'Домен-образец (источник клонирования)'
        : 'Домен-источник (необязательно) — взять страницы, тему и константы'
    },
    // Блок опций: в клоне -- если образец конструкторный; в новом -- если включён DS.
    options_visible() {
      return this.mode === 'new' ? this.ds_mode : this.is_constructor
    },
    // Дерево опций: корневые опции и их потомки (flat с уровнем вложенности).
    // is_menu=0 — служебная опция («поведение»), своего пункта меню не даёт.
    ds_option_groups() {
      const children = {}
      for (const o of this.ds_options) {
        const p = o.parent_id ? Number(o.parent_id) : 0
        if (!children[p]) children[p] = []
        children[p].push(o)
      }
      const flat = (pid, depth) => {
        const out = []
        for (const o of (children[pid] || [])) {
          out.push({ ...o, depth })
          out.push(...flat(Number(o.id), depth + 1))
        }
        return out
      }
      return (children[0] || []).map(root => ({
        ...root,
        children: flat(Number(root.id), 1),
      }))
    },
    all_options() {
      return this.ds_options.length > 0 && this.ds_option_ids.length === this.ds_options.length
    },
    start_ready() {
      // В режиме клонирования домен-образец обязателен; занятый домен блокирует создание.
      const source_ok = this.mode !== 'base' || !!(this.source_domain && this.source_domain.v)
      return !!(this.header && this.domain && source_ok && !this.domain_error)
    },
    constructor_url() {
      if (!this.result || !this.result.domain_id || !this.result.is_constructor) return ''
      return this.url_prefix + '/vue/page-constructor/' + this.result.domain_id
    },
    project_url() {
      if (!this.result || !this.result.project_id) return ''
      return this.url_prefix + '/edit_form/project/' + this.result.project_id
    },
    site_url() {
      return this.result && this.result.domain ? 'https://' + this.result.domain + '/' : ''
    },
  },
  created() {
    this.load_init()
  },
  beforeUnmount() {
    this.stop_task()
  },
  watch: {
    // flush:'sync' — чтобы сброс ds_mode из watcher'а mode отрабатывал сразу
    // и финальное состояние было предсказуемым.
    mode: {
      flush: 'sync',
      handler(v) {
        this.errors = []
        this.result = null
        this.source_domain = null
        this.ds_option_ids = []
        this.copy_data = false
        if (v === 'base') {
          // Клонирование: домен-образец обязателен, подставляем эталон по умолчанию.
          this.ds_mode = false
          if (this.source_default) {
            this.source_domain = this.source_default
            this.domain_items = [this.source_default]
            if (Number(this.source_default.type) === 6) this.ds_option_ids = this.normalize_option_ids(this.source_option_ids)
          }
        } else {
          // «Новый проект»: обычный по умолчанию.
          this.ds_mode = false
        }
      },
    },
    ds_mode: {
      flush: 'sync',
      handler(v) {
        this.errors = []
        this.result = null
        this.source_domain = null
        this.ds_option_ids = v ? this.normalize_option_ids(this.source_option_ids) : []
      },
    },
    create_manager(v) {
      // При включении «создать менеджера» пароль уже сгенерирован.
      if (v && !this.password) this.password = this.genPassword()
    },
  },
  methods: {
    genPassword() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let out = ''
      for (let i = 0; i < 8; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
      return out
    },
    load_init() {
      this.$http.get(this.backend_base + '/svcmsadmin/project/create/init')
        .then(r => {
          const d = r.data || {}
          if (!d.success) { this.errors = d.errors || ['не удалось загрузить форму']; return }
          this.ds_options = d.ds_options || []
          this.source_option_ids = d.source_option_ids || []
          if (d.source_domain) {
            const sd = d.source_domain
            // Эталон для пресейла в режиме клонирования; в «новом» проекте не выбираем.
            this.source_default = Object.assign({}, sd, {
              v: sd.domain_id,
              d: `${sd.domain} — ${sd.header} (#${sd.project_id})`,
            })
          }
          this.on_server_type(this.server_type)
        })
        .catch(e => { this.errors = ['' + e] })
    },
    // ---- autocomplete доменов ----
    on_domain_search(term) {
      if (this.domain_search_timer) clearTimeout(this.domain_search_timer)
      this.domain_search_timer = setTimeout(() => this.load_domains(term), 250)
    },
    load_domains(term) {
      this.domains_loading = true
      this.$http.get(this.backend_base + '/svcmsadmin/project/create/domains', {
        params: { term: term || '' },
      })
        .then(r => {
          const d = r.data || {}
          this.domains_loading = false
          this.domain_items = d.list || []
        })
        .catch(() => { this.domains_loading = false })
    },
    load_constructor_domains(term) {
      this.constructor_domains_loading = true
      this.$http.get(this.backend_base + '/svcmsadmin/project/create/domains', {
        params: { term: term || '', constructor: 1 },
      })
        .then(r => {
          const d = r.data || {}
          this.constructor_domains_loading = false
          this.constructor_domains = d.list || []
        })
        .catch(() => { this.constructor_domains_loading = false })
    },
    on_constructor_domain_search(term) {
      if (this.constructor_search_timer) clearTimeout(this.constructor_search_timer)
      this.constructor_search_timer = setTimeout(() => this.load_constructor_domains(term), 250)
    },
    on_source_search(term) {
      if (this.mode === 'base') this.on_domain_search(term)
      else this.on_constructor_domain_search(term)
    },
    on_source_change() {
      this.errors = []
      this.result = null
      if (!this.options_visible) return
      if (this.source_domain && Number(this.source_domain.type) === 6) {
        // Опции берём из проекта-источника.
        this.load_source_options()
      } else if (this.mode === 'new') {
        // Источник не выбран (новый DS-проект) -- пресет эталона.
        this.ds_option_ids = this.normalize_option_ids(this.source_option_ids)
      }
    },
    // Включение потомка тянет за собой родителей, выключение родителя гасит
    // всех потомков (иерархия опций, ds_options.parent_id).
    toggle_option(id, on) {
      if (on) {
        if (!this.ds_option_ids.includes(id)) this.ds_option_ids.push(id)
        let o = this.ds_options.find(x => Number(x.id) === Number(id))
        while (o && o.parent_id) {
          const p = Number(o.parent_id)
          if (!this.ds_option_ids.includes(p)) this.ds_option_ids.push(p)
          o = this.ds_options.find(x => Number(x.id) === p)
        }
      } else {
        const kill = new Set([Number(id)])
        let grew = true
        while (grew) {
          grew = false
          for (const o of this.ds_options) {
            if (o.parent_id && kill.has(Number(o.parent_id)) && !kill.has(Number(o.id))) {
              kill.add(Number(o.id))
              grew = true
            }
          }
        }
        this.ds_option_ids = this.ds_option_ids.filter(x => !kill.has(Number(x)))
      }
    },
    // Потомок без родителя движок всё равно отключит — достраиваем цепочку.
    normalize_option_ids(ids) {
      const set = new Set((ids || []).map(Number))
      let grew = true
      while (grew) {
        grew = false
        for (const o of this.ds_options) {
          if (o.parent_id && set.has(Number(o.id)) && !set.has(Number(o.parent_id))) {
            set.add(Number(o.parent_id))
            grew = true
          }
        }
      }
      return Array.from(set)
    },
    load_source_options() {
      const project_id = this.source_domain && this.source_domain.project_id
      if (!project_id) {
        this.ds_option_ids = this.mode === 'new' ? this.normalize_option_ids(this.source_option_ids) : []
        return
      }
      this.$http.get(this.backend_base + '/svcmsadmin/project/create/options', {
        params: { project_id },
      })
        .then(r => {
          const d = r.data || {}
          if (d.success) this.ds_option_ids = this.normalize_option_ids(d.option_ids || [])
        })
        .catch(() => {})
    },
    toggle_all_options() {
      this.ds_option_ids = this.all_options ? [] : this.ds_options.map(o => o.id)
    },
    on_server_type() {
      if (Number(this.server_type) === 4) {
        if (!this.port && this.next_port) this.port = this.next_port
        this.$http.get(this.backend_base + '/svcmsadmin/project/create/next-port')
          .then(r => {
            const d = r.data || {}
            if (d.success) {
              this.next_port = d.port
              if (!this.port) this.port = d.port
            }
          })
          .catch(() => {})
      } else {
        this.port = null
      }
    },
    // ---- проверка домена ----
    on_domain_input() {
      if (this.domain_check_timer) clearTimeout(this.domain_check_timer)
      this.domain_error = ''
      this.domain_check_timer = setTimeout(() => this.check_domain(), 400)
    },
    check_domain() {
      const domain = (this.domain || '').trim()
      if (!domain) { this.domain_error = ''; return }
      this.$http.get(this.backend_base + '/svcmsadmin/project/create/check-domain', { params: { domain } })
        .then(r => {
          const d = r.data || {}
          if (d.exists) {
            const info = d.project_id
              ? ` (проект #${d.project_id}${d.project_header ? ' — ' + d.project_header : ''})`
              : ''
            this.domain_error = `Домен уже используется${info}`
          } else {
            this.domain_error = ''
          }
        })
        .catch(() => {})
    },
    // ---- ошибки/успех/сброс ----
    set_errors(list) {
      const arr = (list && list.length) ? list : ['Неизвестная ошибка']
      this.errors = arr
      this.running = false
      this.error_dialog = true
    },
    reset_form() {
      this.mode = 'new'
      this.header = ''
      this.domain = ''
      this.domain_error = ''
      this.ds_mode = false
      this.source_domain = null
      this.ds_option_ids = []
      this.copy_data = false
      this.create_manager = false
      this.login = ''
      this.password = ''
      this.progress = 0
      this.message = ''
      this.errors = []
      this.result = null
      this.port = this.next_port || null
    },
    ok_result() {
      this.result_dialog = false
      this.reset_form()
    },
    // Клик по логину/паролю менеджера — копируем пару в буфер.
    copy_credentials() {
      if (!this.result) return
      const text = this.result.login + ' / ' + this.result.password
      const done = () => {
        this.credentials_copied = true
        setTimeout(() => { this.credentials_copied = false }, 1500)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done)
      } else {
        done()
      }
    },
    // ---- запуск ----
    start() {
      if (this.domain_error) { this.set_errors([this.domain_error]); return }
      this.errors = []
      this.error_dialog = false
      this.result = null
      this.running = true
      this.progress = 0
      this.message = 'Ставим задачу…'
      const payload = {
        mode: this.mode,
        header: this.header,
        domain: this.domain,
        source_domain_id: this.show_source && this.source_domain ? this.source_domain.v : null,
        server_type: Number(this.server_type),
        port: Number(this.server_type) === 4 && this.port ? Number(this.port) : null,
        create_manager: this.create_manager,
        login: this.login,
        password: this.password,
        // Новый проект на конструкторе.
        ds_mode: this.mode === 'new' ? !!this.ds_mode : false,
        // Опции: если блок показан -- выбор пользователя, иначе бэкенд ничего не делает.
        ds_option_ids: this.options_visible ? this.ds_option_ids : null,
        copy_data: this.mode === 'base' ? !!this.copy_data : false,
      }
      this.$http.post(this.backend_base + '/svcmsadmin/project/create/start', payload)
        .then(r => {
          const d = r.data || {}
          if (!d.success || !d.task_id) {
            this.set_errors(d.errors)
            return
          }
          this.open_task(d.task_id)
        })
        .catch(e => {
          const d = e && e.response && e.response.data
          this.set_errors((d && d.errors) || [e && e.message ? e.message : '' + e])
        })
    },
    // ---- фоновая задача: прогресс через WS + поллинг ----
    ws_base() {
      if (typeof config !== 'undefined' && config.BackgroundWS) return config.BackgroundWS
      return ((typeof config !== 'undefined' && config.BackendBase) || '').replace(/^http/, 'ws') + '/background/ws'
    },
    open_task(task_id) {
      this.task_id = task_id
      if (this.poll_timer) clearInterval(this.poll_timer)
      this.poll_timer = setInterval(() => this.poll_status(), 1000)
      this.open_ws(task_id)
    },
    poll_status() {
      if (!this.task_id) return
      this.$http.get(this.backend_base + '/background/status/' + this.task_id)
        .then(r => this.apply_task(r.data && r.data.task))
        .catch(() => {})
    },
    apply_task(t) {
      if (!t) return
      this.progress = t.progress || 0
      this.message = t.message || ''
      if (t.error) this.set_errors([t.error])
      if (t.status === 2) {
        try { this.result = t.result ? JSON.parse(t.result) : null } catch (e) { this.result = null }
        if (this.result && this.result.success === false) {
          this.set_errors(this.result.errors || ['ошибка создания'])
        } else if (this.result) {
          this.result_dialog = true
        }
        this.stop_task()
      } else if (t.status === 3 || t.status === 4) {
        this.stop_task()
      }
    },
    open_ws(task_id) {
      try { this.ws = new WebSocket(`${this.ws_base()}/${task_id}`) } catch (e) { return }
      this.ws.onmessage = (ev) => {
        let d
        try { d = JSON.parse(ev.data) } catch (e) { return }
        this.apply_task(d)
      }
      this.ws.onerror = () => {}
      this.ws.onclose = () => {}
    },
    stop_task() {
      if (this.poll_timer) { clearInterval(this.poll_timer); this.poll_timer = null }
      if (this.ws) { try { this.ws.close() } catch (e) {} this.ws = null }
      this.running = false
      this.task_id = null
    },
  },
}
</script>

<style scoped>
.create-project .form { display: flex; flex-direction: column; gap: var(--app-space-field, 16px); max-width: 720px; }
.create-project .mode-row { margin-bottom: 8px; }
.create-project .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.create-project .pass-row { display: flex; gap: 6px; align-items: center; }
.create-project .hint { color: #666; font-size: 0.85rem; }
.create-project .actions { display: flex; align-items: center; gap: 12px; }
.create-project .status { margin-top: 4px; }
.create-project .ok { margin-top: 12px; color: green; }
.create-project .options { border: 1px solid rgba(0, 0, 0, 0.12); border-radius: 6px; padding: 8px 12px; }
.create-project .options-head {
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 600; font-size: 0.9rem; margin-bottom: 4px;
}
.create-project .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
.create-project .options-grid :deep(.v-input) { margin: 0; min-height: 28px; }
.create-project .options-grid :deep(.v-selection-control) { min-height: 28px; }
.create-project .options-grid :deep(.v-label) { font-size: 13px; opacity: 0.85; }
/* Дерево опций: корневая опция во всю ширину, потомки — сеткой ниже. */
.create-project .opt-root { grid-column: 1 / -1; }
.create-project .opt-root :deep(.v-label) { font-weight: 600; opacity: 1; }
.create-project .opt-kids {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}
.create-project .opt-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 8px;
  font-size: 10px;
  line-height: 15px;
  background: rgba(0, 0, 0, 0.08);
  opacity: 0.7;
}
.create-project .options { max-height: 380px; overflow: auto; }
</style>

<!--
  Стили диалогов создания/ошибки — БЕЗ scoped.
  v-dialog телепортирует контент в .v-overlay-container, поэтому селекторы вида
  «.create-project .links» в scoped-блоке не матчатся (предка .create-project там
  уже нет) и вёрстка диалога разваливается. Классы с префиксом cp-* уникальны.
-->
<style>
.cp-result__head,
.cp-err__head { display: flex; align-items: center; gap: 14px; padding: 18px 22px 14px; }
.cp-result__title { font-size: 1.15rem; font-weight: 600; line-height: 1.2; }
.cp-err__title { font-size: 1.1rem; font-weight: 600; }
.cp-result__subtitle { color: rgba(0, 0, 0, 0.6); font-size: 0.92rem; margin-top: 2px; }
.cp-result__body { padding: 16px 22px 8px; }
.cp-result__grid { display: grid; grid-template-columns: 180px 1fr; gap: 6px 14px; align-items: baseline; }
.cp-result__k { color: rgba(0, 0, 0, 0.6); font-size: 0.9rem; }
.cp-result__muted { color: rgba(0, 0, 0, 0.45); }
.cp-result__login { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.cp-result__login:hover { color: #1976d2; }
.cp-result__copied { color: #2e7d32; font-size: 0.85rem; margin-left: 4px; }
.cp-result__warn {
  display: flex; align-items: flex-start; gap: 8px; margin-top: 16px;
  padding: 10px 12px; border-radius: 8px;
  background: rgba(255, 152, 0, 0.12); color: #8a5300; font-size: 0.9rem;
}
.cp-result__links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
.cp-result__link {
  display: flex; flex-direction: column; gap: 2px;
  padding: 12px 14px; border: 1px solid rgba(0, 0, 0, 0.14); border-radius: 10px;
  color: inherit; text-decoration: none;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}
.cp-result__link:hover {
  border-color: #1976d2;
  box-shadow: 0 2px 10px rgba(25, 118, 210, 0.16);
  transform: translateY(-1px);
}
.cp-result__link-title { font-weight: 600; font-size: 0.95rem; }
.cp-result__link-hint { color: rgba(0, 0, 0, 0.55); font-size: 0.78rem; }
.cp-result__actions { padding: 10px 16px 14px; }
.cp-err__line { color: #b00020; margin-bottom: 4px; white-space: pre-wrap; }

@media (max-width: 640px) {
  .cp-result__links { grid-template-columns: 1fr; }
  .cp-result__grid { grid-template-columns: 1fr; gap: 2px 0; }
  .cp-result__k { margin-top: 8px; }
}
</style>
