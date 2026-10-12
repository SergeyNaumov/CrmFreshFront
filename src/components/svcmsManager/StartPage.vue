<template>
  <div class="svcms-manager-start">
    <errors :errors="errors" v-if="errors.length" />

    <!-- Шапка: от чьего имени работаем + выход + вопрос разработчикам -->
    <v-card class="header" flat>
      <div class="greeting">
        <span v-if="user.firm">Вы работаете от: <strong>{{ user.firm }}</strong></span>
        <strong v-else>{{ host }}</strong>
      </div>
      <div class="ctrl_top">
        <v-btn size="small" variant="text" prepend-icon="fa fa-sign-out" @click="logout">
          Выход
        </v-btn>
        <v-btn size="small" color="primary" variant="flat" @click="openModal('prog_request')">
          Задать вопрос разработчикам
        </v-btn>
      </div>
    </v-card>

    <!-- Сплаш -->
    <v-card class="splash" flat>
      <div class="splash-img">
        <v-icon size="56" color="primary">fa fa-bullseye</v-icon>
      </div>
      <div class="inner">
        <p>Сайт должен продавать и приносить прибыль, поэтому важно развивать
          функционал и анализировать полученные данные. Ваши конкуренты не стоят
          на месте и получают хорошую прибыль.</p>
        <div class="h3">Мы поможем Вам в развитии сайта и сделаем все, чтобы Ваши
          затраты на его разработку окупились!</div>
      </div>
    </v-card>

    <!-- Бары: домен и хостинг -->
    <div class="bar_wrapper">
      <v-card v-if="domain_info.paid_till" class="bar blue" flat>
        <div class="bar-info">
          <div class="bar-title">Домен</div>
          <div class="bar-line">Дата создания: {{ domain_info.created || '—' }}</div>
          <div class="bar-line">Оплачен до {{ domain_info.paid_till }}</div>
        </div>
        <v-btn color="primary" variant="flat" size="small" @click="openModal('long_domain')">Продлить</v-btn>
      </v-card>

      <v-card v-if="user.hosting_start && user.hosting_end" class="bar purple" flat>
        <div class="bar-info">
          <div class="bar-title">Хостинг сайта</div>
          <div class="bar-line">Дата создания: {{ user.hosting_start }}</div>
          <div class="bar-line">Оплачен до {{ user.hosting_end }}</div>
        </div>
        <v-btn color="primary" variant="flat" size="small" @click="openModal('long_host')">Продлить</v-btn>
      </v-card>
    </div>

    <!-- Карточки услуг -->
    <div class="stacks">
      <v-card
        v-for="c in visibleCards"
        :key="c.title"
        class="stack"
        :class="c.color"
        flat
      >
        <div class="stack-accent"></div>
        <div class="stack-body">
          <div class="stack-title">{{ c.title }}</div>
          <p>{{ c.text }}</p>
          <p v-if="c.price" class="lgreen"><b>{{ c.price }}</b></p>
          <v-btn color="primary" variant="flat" size="small" @click="openModal(c.modal)">{{ c.button }}</v-btn>
        </div>
      </v-card>
    </div>

    <!-- Нижний бар: реклама -->
    <v-card class="bar purple promo" flat>
      <div class="bar-title alt">Хотите получать еще больше заказов и прибыли?</div>
      <v-btn color="primary" variant="flat" size="small"
        @click="openModal('start_promo')">Запустить рекламу</v-btn>
    </v-card>

    <!-- Модальное окно: подтверждение без форм -->
    <v-dialog v-model="dialog" max-width="480" persistent>
      <v-card class="modal">
        <v-btn icon="fa fa-times" variant="text" class="close" @click="closeModal" />

        <div v-if="success" class="success">
          <h2>{{ success_header }}</h2>
          <p>{{ success_text }}</p>
        </div>

        <div v-else class="modal-body">
          <div class="modal-title">{{ modalDef.title }}</div>
          <p v-if="modalDef.text" class="modal-text">{{ modalDef.text }}</p>

          <div v-if="form_error" class="form_error">{{ form_error }}</div>

          <div class="modal-actions">
            <v-btn color="primary" variant="flat" size="small" @click="submitModal">
              Да, хочу
            </v-btn>
            <v-btn v-if="modalDef.cancel" variant="text" size="small" @click="closeModal">
              {{ modalDef.cancel }}
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
// Тексты модальных окон (порт client_manager/forms.html, без форм).
// Ключ модалки совпадает с action для /svcms/startpage/request.
const MODALS = {
  prog_request: {
    title: 'Задать вопрос разработчикам',
    text: 'Здесь вы можете задать вопрос разработчикам системы, или оставить свои предложения / замечания',
  },
  get_ssl: {
    title: 'Добавление ssl-сертификата',
    text: 'Отправить запрос на добавление ssl-сертификата',
  },
  adaptive_design: { title: 'Хотите адаптировать сайт под мобильные устройства?' },
  audit_site: { title: 'Хотите заказать аудит сайта?' },
  rule_fill: { title: 'Хотите наполнить сайт?' },
  add_section: { title: 'Хотите подключить новый раздел?' },
  inner_optimize: { title: 'Хотите улучшить ранжирование вашего сайта в поисковых системах?' },
  long_host: { title: 'Отправить запрос на продление хостинга' },
  long_domain: { title: 'Отправить запрос на продление домена' },
  optimize: { title: 'Хотите оптимизировать сайт?' },
  context: { title: 'Хотите настроить контекстную рекламу?' },
  schema: { title: 'Хотите настроить микроразметку?' },
  redesign: { title: 'Хотите обновить дизайн?' },
  site_rework: { title: 'Хотите доработать сайт?' },
  ii_show: { title: 'Хотите улучшить видимость в нейросетях?' },
  base_support: { title: 'Хотите базовую поддержку сайта?' },
  start_promo: { title: 'Запустить рекламу', cancel: 'Нет, немного позже' },
}

// Карточки услуг (порт client_manager/index.html)
const CARDS = [
  { title: 'SSL', color: 'purple', modal: 'get_ssl', button: 'Включить сертификат',
    text: 'Поисковые машины отдают предпочтение сайтам с SSL-сертификатом',
    visible: (u) => u.loaded && !u.is_ssl },
  { title: 'Улучшение видимости в нейросетях', color: 'pink', modal: 'ii_show',
    button: 'Повысить видимость',
    text: 'Поможем сделать сайт и материалы более понятными для нейросетей, чтобы повысить вероятность упоминаний компании в ответах ChatGPT, Алисы и других ИИ-сервисов.' },
  { title: 'Базовая поддержка сайта', color: 'pink', modal: 'base_support',
    button: 'Заказать поддержку',
    text: 'Это выгодное решение для владельцев сайтов, которые хотят сохранить стабильность и актуальность своего онлайн-ресурса без значительных затрат' },
  { title: 'Аудит сайта', color: 'green', modal: 'audit_site',
    button: 'Заказать аудит', price: 'ЦЕНА ОТ 10 000 руб',
    text: 'Проверим технические ошибки, SEO, удобство использования и точки потери клиентов. Подготовим список рекомендаций и оценку работ',
    visible: (u) => !u.domain_adaptive },
  { title: 'Грамотное наполнение', color: 'pink', modal: 'rule_fill',
    button: 'Заказать',
    text: 'Нет времени наполнять и придумывать тексты для сайта? Обратитесь к профессионалам' },
  { title: 'Добавить новый раздел', color: 'purple', modal: 'add_section',
    button: 'Добавить раздел', text: 'Не знаете, как добавить новый раздел на сайт? Напишите нам' },
  { title: 'Внутренняя оптимизация сайта', color: 'pink', modal: 'optimize',
    button: 'Оптимизировать',
    text: 'Оптимизация сайта в соответствии с требованиями поисковых систем позволит существенно повысить позиции сайта в выдаче и приводить целевых клиентов' },
  { title: 'Настройка контекстной рекламы', color: 'pink', modal: 'context',
    button: 'Запустить рекламу',
    text: 'Запустим рекламу в Яндекс Директ, чтобы привлечь на сайт заинтересованных клиентов.' },
  { title: 'Настройка микроразметки schema.org', color: 'pink', modal: 'schema',
    button: 'Настроить микроразметку',
    text: 'Поможем поисковым системам и нейросетям лучше понимать содержание сайта, повысим заметность в поиске и вероятность отображения в расширенных ответах.' },
  { title: 'Доработка сайта', color: 'pink', modal: 'site_rework',
    button: 'Оценить доработку',
    text: 'Добавим новый функционал, изменим структуру, формы, каталог, карточки товаров или личный кабинет.' },
  { title: 'Обновление дизайна', color: 'pink', modal: 'redesign',
    button: 'Обсудить дизайн',
    text: 'Освежим внешний вид отдельных блоков или полностью переработаем интерфейс сайта.' },
]

export default {
  data() {
    return {
      host: '',
      user: { loaded: false, id: 0, firm: '', is_ssl: 0, hosting_start: null, hosting_end: null, domain_adaptive: 1 },
      domain_info: {},
      show_modal: '',
      success: false,
      success_header: '',
      success_text: '',
      errors: [],
      form_error: '',
    }
  },
  computed: {
    dialog: {
      get() { return !!this.show_modal },
      set(v) { if (!v) this.closeModal() },
    },
    modalDef() { return MODALS[this.show_modal] || {} },
    visibleCards() {
      return CARDS.filter((c) => (c.visible ? c.visible(this.user) : true))
    },
  },
  created() {
    this.init()
  },
  methods: {
    init() {
      this.$http.get(BackendBase + '/svcms/startpage/user-info').then((r) => {
        const D = r.data || {}
        if (D.user) this.user = D.user
        if (D.domain_info) this.domain_info = D.domain_info
        if (D.host) this.host = D.host
        this.errors = D.errors || []
      }).catch((e) => {
        this.errors = ['' + e]
      })
    },
    logout() {
      this.$http.get(BackendBase + '/logout').finally(() => {
        window.location.href = '/'
      })
    },
    openModal(key) {
      this.form_error = ''
      this.success = false
      this.show_modal = key
    },
    closeModal() {
      this.show_modal = ''
      this.success = false
      this.form_error = ''
    },
    submitModal() {
      this.$http.post(BackendBase + '/svcms/startpage/request', { action: this.show_modal }).then((r) => {
        const D = r.data || {}
        if (D.success) {
          this.success = true
          this.success_header = D.success_header || 'Запрос был успешно отправлен'
          this.success_text = D.success_text || 'Ваш персональный менеджер свяжется с Вами в ближайшее время'
        } else {
          this.form_error = (D.errors && D.errors.length) ? D.errors.join('; ') : 'Не удалось отправить запрос'
        }
      }).catch((e) => {
        this.form_error = '' + e
      })
    },
  },
}
</script>

<style scoped lang="scss">
.svcms-manager-start {
  padding: 20px;
  max-width: 1200px;
}
.svcms-manager-start .v-btn {
  min-width: 0;
  height: 30px;
  padding: 0 12px;
  font-size: 12px;
  text-transform: none;
  letter-spacing: 0;
}
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
  border: 1px dotted rgba(var(--v-theme-on-surface), 0.4);
  border-radius: 12px;
}
.header .greeting { font-weight: 600; font-size: 15px; }
.header .ctrl_top { display: flex; gap: 8px; flex-wrap: wrap; }
.splash {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 18px;
  margin-bottom: 20px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
}
.splash-img { flex: 0 0 auto; }
.splash .inner p { margin: 0 0 8px; }
.splash .h3 { font-weight: 700; color: rgb(var(--v-theme-primary)); }

.bar_wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-radius: 12px;
  flex: 1 1 320px;
  border-left: 5px solid transparent;
}
.bar .bar-title { font-weight: 700; margin-bottom: 4px; }
.bar .bar-line { font-size: 13px; }
.bar.blue { border-left-color: #2196f3; background: rgba(33, 150, 243, 0.08); }
.bar.purple { border-left-color: #7e57c2; background: rgba(126, 87, 194, 0.08); }
.bar .bar-title.alt { font-size: 16px; }

.stacks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.stack {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 1);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}
.stack-accent { width: 6px; flex: 0 0 6px; }
.stack-body { padding: 14px 16px; display: flex; flex-direction: column; }
.stack-title { font-weight: 700; margin-bottom: 8px; color: rgb(var(--v-theme-primary)); }
.stack-body p { font-size: 13px; margin: 0 0 10px; flex: 1 1 auto; }
.stack-body .v-btn { align-self: flex-start; }
.stack .lgreen { color: #2e7d32; }
.stack.pink .stack-accent { background: #ec407a; }
.stack.purple .stack-accent { background: #7e57c2; }
.stack.blue .stack-accent { background: #2196f3; }
.stack.green .stack-accent { background: #43a047; }

.promo { margin-bottom: 20px; }

.modal { padding: 22px; }
.modal .close { position: absolute; top: 8px; right: 8px; z-index: 2; }
.modal-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: rgb(var(--v-theme-primary)); }
.modal-text { font-size: 13px; margin-bottom: 12px; }
.modal-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.form_error { color: #c62828; font-size: 13px; margin-top: 8px; }
.success { text-align: center; padding: 20px 10px; }
.success h2 { color: rgb(var(--v-theme-primary)); margin-bottom: 10px; }
</style>
