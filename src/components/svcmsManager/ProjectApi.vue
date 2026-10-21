<template>
  <div class="ds-api">
    <errors :errors="errors" v-if="errors.length" />

    <div v-if="note" class="note">{{ note }}</div>

    <!-- Состояние и ключ -->
    <v-card class="section" flat>
      <div class="h2">API управления контентом</div>
      <div class="hint">
        Обмен товарами, рубриками, характеристиками, новостями, статьями,
        услугами и файлами с внешними системами. API работает на домене сайта,
        данные изолированы по проекту.
      </div>

      <div class="state">
        <div class="row">
          <span class="lbl">Состояние:</span>
          <span :class="['badge', settings.enabled ? 'on' : 'off']">
            {{ settings.enabled ? 'включено' : 'выключено' }}
          </span>
          <span v-if="settings.created" class="dim">создан {{ settings.created }}</span>
        </div>
        <div class="row">
          <span class="lbl">Ключ:</span>
          <code v-if="settings.key_mask">{{ settings.key_mask }}</code>
          <span v-else class="dim">не задан</span>
        </div>
        <div class="row">
          <span class="lbl">Адрес:</span>
          <code>{{ info.base_url || '—' }}</code>
        </div>
        <div class="row">
          <span class="lbl">Проверка связи:</span>
          <span :class="['badge', ping.ok ? 'on' : 'off']">
            {{ ping.ok ? 'API отвечает' : 'нет ответа' }}
          </span>
          <span class="dim">{{ ping.status ? 'HTTP ' + ping.status : (ping.error || '') }}</span>
          <v-btn size="x-small" variant="text" @click="load_info">проверить</v-btn>
        </div>
        <div class="row">
          <span class="lbl">Сегодня:</span>
          <span>{{ info.today ? info.today.requests : 0 }} запросов,
                {{ info.today ? info.today.errors : 0 }} с ошибкой</span>
        </div>
      </div>

      <div class="btns">
        <v-btn color="primary" size="small" @click="generate_key">
          {{ settings.enabled ? 'Перевыпустить ключ' : 'Создать ключ' }}
        </v-btn>
        <v-btn size="small" variant="text" color="error" :disabled="!settings.enabled" @click="revoke_key">
          Отозвать ключ
        </v-btn>
        <v-btn size="small" variant="text" @click="open_docs">Документация</v-btn>
        <v-btn size="small" variant="text" @click="open_html">Открыть HTML</v-btn>
      </div>

      <div v-if="new_key" class="newkey">
        <div class="newkey-title">Ключ создан — скопируйте его сейчас: повторно он не показывается.</div>
        <code class="newkey-value">{{ new_key }}</code>
        <v-btn size="x-small" variant="text" @click="copy(new_key)">копировать</v-btn>
        <v-btn size="x-small" variant="text" @click="new_key = ''">скрыть</v-btn>
      </div>
    </v-card>

    <!-- Настройки -->
    <v-card class="section" flat>
      <div class="h2">Права и лимиты</div>
      <div class="hint">
        Список методов, разрешённых ключу. Пустой список = только чтение.
        Лимиты — «запросов/секунд» и суточный. IP — по одному в строке/через запятую
        (пусто = любые).
      </div>

      <div class="scopes">
        <label v-for="s in info.scopes" :key="s.code" class="scope">
          <input type="checkbox" :value="s.code" v-model="form.scopes" />
          {{ s.title }}
        </label>
      </div>

      <div class="fields">
        <label class="field">
          <span>Лимит запросов (напр. 600/60)</span>
          <input v-model="form.rate_limit" type="text" placeholder="600/60" />
        </label>
        <label class="field">
          <span>Суточный лимит</span>
          <input v-model="form.rate_limit_day" type="text" placeholder="20000" />
        </label>
        <label class="field wide">
          <span>Разрешённые IP</span>
          <input v-model="form.allow_ips" type="text" placeholder="пусто — любые" />
        </label>
      </div>

      <v-btn color="primary" size="small" :loading="saving" @click="save_settings">Сохранить настройки</v-btn>
      <span class="dim"> изменения применяются в течение минуты</span>
    </v-card>

    <!-- Статистика -->
    <v-card class="section" flat>
      <div class="h2">Статистика трафика API</div>
      <div class="row">
        <label class="field small">
          <span>Период</span>
          <select v-model.number="days" @change="load_stats">
            <option :value="1">1 день</option>
            <option :value="7">7 дней</option>
            <option :value="30">30 дней</option>
            <option :value="90">90 дней</option>
            <option :value="365">год</option>
          </select>
        </label>
        <v-btn size="small" variant="text" @click="load_stats">обновить</v-btn>
      </div>

      <div class="totals" v-if="stats.total">
        <span>Запросов: <b>{{ stats.total.requests || 0 }}</b></span>
        <span>С ошибкой: <b>{{ stats.total.errors || 0 }}</b></span>
        <span>Строк изменено: <b>{{ stats.total.rows_affected || 0 }}</b></span>
        <span>Принято: <b>{{ fmt_bytes(stats.total.bytes_in) }}</b></span>
        <span>Отдано: <b>{{ fmt_bytes(stats.total.bytes_out) }}</b></span>
      </div>

      <div class="cols">
        <div class="col">
          <div class="sub">По дням</div>
          <table class="tbl" v-if="stats.by_day && stats.by_day.length">
            <thead><tr><th>День</th><th>Запросов</th><th>Ошибок</th><th>Строк</th></tr></thead>
            <tbody>
              <tr v-for="d in stats.by_day.slice(0, 30)" :key="d.day">
                <td>{{ d.day }}</td><td>{{ d.requests }}</td><td>{{ d.errors }}</td><td>{{ d.rows_affected }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="dim">пока нет данных</div>
        </div>
        <div class="col">
          <div class="sub">По методам</div>
          <table class="tbl" v-if="stats.by_operation && stats.by_operation.length">
            <thead><tr><th>Метод</th><th>Запросов</th><th>Ошибок</th></tr></thead>
            <tbody>
              <tr v-for="o in stats.by_operation" :key="o.operation">
                <td>{{ o.operation || '—' }}</td><td>{{ o.requests }}</td><td>{{ o.errors }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="dim">нет данных</div>
        </div>
        <div class="col">
          <div class="sub">По сущностям</div>
          <table class="tbl" v-if="stats.by_entity && stats.by_entity.length">
            <thead><tr><th>Сущность</th><th>Запросов</th><th>Ошибок</th></tr></thead>
            <tbody>
              <tr v-for="e in stats.by_entity" :key="e.entity">
                <td>{{ e.entity }}</td><td>{{ e.requests }}</td><td>{{ e.errors }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="dim">нет данных</div>
        </div>
        <div class="col">
          <div class="sub">По ключам</div>
          <table class="tbl" v-if="stats.by_key && stats.by_key.length">
            <thead><tr><th>Ключ</th><th>Запросов</th><th>Последний IP</th></tr></thead>
            <tbody>
              <tr v-for="k in stats.by_key" :key="k.key_mask">
                <td><code>{{ k.key_mask }}</code></td>
                <td>{{ k.requests }}</td>
                <td>{{ k.last_ip }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="dim">нет данных</div>
        </div>
      </div>
    </v-card>

    <!-- Журнал -->
    <v-card class="section" flat>
      <div class="h2">Журнал запросов</div>
      <div class="row">
        <label class="field">
          <span>Метод</span>
          <select v-model="log_filter.operation" @change="load_log">
            <option value="">все</option>
            <option v-for="s in info.scopes" :key="s.code" :value="s.code">{{ s.code }}</option>
          </select>
        </label>
        <label class="check">
          <input type="checkbox" v-model="log_filter.errors" @change="load_log" />
          только ошибки
        </label>
        <v-btn size="small" variant="text" @click="load_log">обновить</v-btn>
        <v-btn size="small" variant="text" @click="clear_log">очистить старше 90 дней</v-btn>
      </div>

      <div class="dim">Всего записей: {{ log.total }}</div>
      <table class="tbl log" v-if="log.rows && log.rows.length">
        <thead>
          <tr><th>Время</th><th>Метод</th><th>Сущность</th><th>Ключ</th><th>IP</th>
              <th>Результат</th><th>мс</th><th>Строк</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in log.rows" :key="r.id" :class="{err: !r.ok}">
            <td>{{ r.registered }}</td>
            <td>{{ r.operation }}</td>
            <td>{{ r.entity }}</td>
            <td><code>{{ r.key_mask }}</code></td>
            <td>{{ r.ip }}</td>
            <td>
              <span v-if="r.ok">ok</span>
              <span v-else class="err-code">{{ r.error_code }}: {{ r.error_message }}</span>
            </td>
            <td>{{ r.ms }}</td>
            <td>{{ r.rows_affected }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="dim">записей нет</div>

      <div class="row" v-if="log.total > log_filter.limit">
        <v-btn size="x-small" variant="text" :disabled="log_filter.offset <= 0" @click="page_log(-1)">назад</v-btn>
        <span class="dim">
          {{ log_filter.offset + 1 }}–{{ Math.min(log_filter.offset + log_filter.limit, log.total) }}
          из {{ log.total }}
        </span>
        <v-btn size="x-small" variant="text"
               :disabled="log_filter.offset + log_filter.limit >= log.total"
               @click="page_log(1)">вперёд</v-btn>
      </div>
    </v-card>
  </div>
</template>

<script>
export default {
  name: 'project-api',
  data() {
    return {
      errors: [],
      note: '',
      info: { scopes: [], today: {}, base_url: '' },
      settings: {},
      ping: {},
      form: { scopes: [], rate_limit: '', rate_limit_day: '', allow_ips: '' },
      stats: {},
      log: { total: 0, rows: [] },
      log_filter: { operation: '', errors: false, limit: 50, offset: 0 },
      days: 30,
      new_key: ''
    }
  },
  created() {
    this.load_info()
    this.load_stats()
    this.load_log()
  },
  methods: {
    api_get(url, params) {
      return this.$http.get(this.BackendBase() + url, { params: params || {} })
    },
    api_post(url, body) {
      return this.$http.post(this.BackendBase() + url, body || {})
    },
    BackendBase() {
      return (typeof config !== 'undefined' && config.BackendBase) || ''
    },
    apply(response) {
      const d = response.data || {}
      if (!d.success) {
        this.errors = d.errors || ['неизвестная ошибка']
        return null
      }
      this.errors = []
      return d.data || {}
    },
    fail(e) {
      this.errors = ['' + (e && e.message ? e.message : e)]
    },
    load_info() {
      this.api_get('/svcms/api/info')
        .then(r => {
          const data = this.apply(r)
          if (!data) return
          this.info = data
          this.settings = data.settings || {}
          this.ping = data.ping || {}
          this.form = {
            scopes: (data.settings && data.settings.scopes) ? data.settings.scopes.slice() : [],
            rate_limit: (data.settings && data.settings.rate_limit) || '',
            rate_limit_day: (data.settings && data.settings.rate_limit_day) || '',
            allow_ips: (data.settings && data.settings.allow_ips) || ''
          }
        })
        .catch(e => this.fail(e))
    },
    generate_key() {
      if (this.settings.enabled && !window.confirm('Выпустить новый ключ? Текущий ключ перестанет работать.')) return
      this.api_post('/svcms/api/key/generate', { scopes: this.form.scopes })
        .then(r => {
          const data = this.apply(r)
          if (!data) return
          this.new_key = data.key
          this.settings = data.settings || {}
          this.note = 'Ключ сохранён.'
          this.load_info()
        })
        .catch(e => this.fail(e))
    },
    revoke_key() {
      if (!window.confirm('Отозвать ключ? Интеграции перестанут работать.')) return
      this.api_post('/svcms/api/key/revoke')
        .then(r => {
          const data = this.apply(r)
          if (!data) return
          this.new_key = ''
          this.settings = data.settings || {}
          this.note = 'Ключ отозван, API выключено.'
          this.load_info()
        })
        .catch(e => this.fail(e))
    },
    save_settings() {
      this.api_post('/svcms/api/settings', {
        scopes: this.form.scopes,
        rate_limit: this.form.rate_limit,
        rate_limit_day: this.form.rate_limit_day,
        allow_ips: this.form.allow_ips
      })
        .then(r => {
          const data = this.apply(r)
          if (!data) return
          this.settings = data.settings || {}
          this.note = 'Настройки сохранены. Они применятся в течение минуты.'
        })
        .catch(e => this.fail(e))
    },
    load_stats() {
      this.api_get('/svcms/api/stats', { days: this.days || 30 })
        .then(r => { const d = this.apply(r); if (d) this.stats = d })
        .catch(e => this.fail(e))
    },
    load_log() {
      this.api_get('/svcms/api/log', {
        limit: this.log_filter.limit,
        offset: this.log_filter.offset,
        operation: this.log_filter.operation,
        errors: this.log_filter.errors ? 1 : 0
      })
        .then(r => { const d = this.apply(r); if (d) this.log = d })
        .catch(e => this.fail(e))
    },
    page_log(dir) {
      this.log_filter.offset = Math.max(0, this.log_filter.offset + dir * this.log_filter.limit)
      this.load_log()
    },
    clear_log() {
      if (!window.confirm('Удалить записи журнала старше 90 дней?')) return
      this.api_post('/svcms/api/log/clear', { days: 90 })
        .then(r => { const d = this.apply(r); if (d) { this.note = 'Журнал очищен.'; this.load_log() } })
        .catch(e => this.fail(e))
    },
    open_docs() {
      this.$router.push('/vue/documentation/ds_api')
    },
    open_html() {
      window.open(this.BackendBase() + '/svcms/api/doc.html', '_blank')
    },
    copy(text) {
      try {
        navigator.clipboard.writeText(text)
        this.note = 'Ключ скопирован в буфер обмена.'
      } catch (e) {
        this.note = 'Скопируйте ключ вручную.'
      }
    },
    fmt_bytes(b) {
      b = Number(b || 0)
      if (b > 1048576) return (b / 1048576).toFixed(1) + ' МБ'
      if (b > 1024) return (b / 1024).toFixed(0) + ' КБ'
      return b + ' Б'
    }
  }
}
</script>

<style scoped>
.ds-api .section { padding: 12px; margin-bottom: 16px; }
.ds-api .h2 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
.ds-api .hint { color: #666; margin-bottom: 10px; }
.ds-api .note { background: #eef7ee; color: #256029; padding: 6px 10px; border-radius: 6px; margin-bottom: 10px; }
.ds-api .state { margin-bottom: 10px; }
.ds-api .row { display: flex; align-items: center; gap: 10px; margin: 3px 0; flex-wrap: wrap; }
.ds-api .lbl { color: #666; min-width: 120px; }
.ds-api .dim { color: #888; font-size: 13px; }
.ds-api code { background: #f3f5f9; padding: 1px 6px; border-radius: 4px; font-family: monospace; }
.ds-api .badge { padding: 1px 8px; border-radius: 10px; font-size: 12px; }
.ds-api .badge.on { background: #dff3e3; color: #256029; }
.ds-api .badge.off { background: #f7e0e0; color: #8a2a2a; }
.ds-api .btns { display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0; }
.ds-api .newkey { background: #fff8e1; border: 1px solid #f0d98a; border-radius: 8px; padding: 10px; margin-top: 8px; }
.ds-api .newkey-title { color: #8a6d00; font-size: 13px; margin-bottom: 6px; }
.ds-api .newkey-value { font-size: 16px; letter-spacing: 1px; background: #fff; padding: 3px 8px; }
.ds-api .scopes { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-bottom: 10px; }
.ds-api .scope { display: inline-flex; align-items: center; gap: 6px; }
.ds-api .fields { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; }
.ds-api .field { display: flex; flex-direction: column; font-size: 12px; color: #666; gap: 3px; }
.ds-api .field input, .ds-api .field select { border: 1px solid #ccc; border-radius: 4px; padding: 5px 8px; font-size: 14px; }
.ds-api .check { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.ds-api .totals { display: flex; gap: 18px; flex-wrap: wrap; margin: 8px 0 12px; }
.ds-api .cols { display: flex; gap: 16px; flex-wrap: wrap; }
.ds-api .col { flex: 1 1 220px; min-width: 220px; }
.ds-api .sub { font-weight: 600; margin-bottom: 4px; }
.ds-api .tbl { border-collapse: collapse; width: 100%; font-size: 13px; }
.ds-api .tbl th, .ds-api .tbl td { border: 1px solid #e2e6ee; padding: 3px 7px; text-align: left; }
.ds-api .tbl th { background: #f5f7fb; }
.ds-api .log tr.err { background: #fdf0f0; }
.ds-api .err-code { color: #8a2a2a; }
</style>
