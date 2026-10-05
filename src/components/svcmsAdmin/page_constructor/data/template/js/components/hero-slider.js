/* ============================================================
   templates/t1/js/components/hero-slider.js
   Vue-компонент hero-слайдера.

   В preview данные приходят из js-файла, который публикует
   событие `t1:slider` с detail { id, list } (формат записи:
   { id, header, body, url, button, photo }). В релизной версии
   список вернёт сервер по адресу data-url (голый массив JSON).

   Анимация (состояния классов):
     .hero__slide.is-active — слайд «показывает» контент:
        заголовок/описание/кнопка плавно проявляются (heroIn, стаггер).
     .hero__slide.is-out — контент сначала угасает (heroOut),
        и только потом лента уезжает к следующему слайду.
   Новый слайд подъезжает с уже «погашенным» контентом и проявляет
   его после остановки.

   Пропсы:
     dataId    string  идентификатор данных (id компонента);
     dataUrl   string  путь к данным (обязательный);
     autoplay  number  интервал автопрокрутки, мс (0 — выключено);
     fadeOut   number  длительность угасания контента перед уездом, мс;
     fadeIn    number  длительность проявления контента после приезда, мс;
     slideSpeed number  длительность движения ленты, мс.
   ============================================================ */
window.HeroSlider = {
  name: 'HeroSlider',

  props: {
    dataId: { type: String, default: '' },
    dataUrl: { type: String, default: '' },
    // Инлайн-список слайдов блока (per-block), JSON-строка. Приоритетнее data-url.
    dataList: { type: String, default: '' },
    autoplay: { type: Number, default: 0 },
    fadeOut: { type: Number, default: 350 },
    fadeIn: { type: Number, default: 650 },
    slideSpeed: { type: Number, default: 700 },
    // Параметры блока (конструктор): стрелки, точки, зацикливание,
    // стартовый слайд и высота. По умолчанию — как было (всё включено).
    arrows: { type: Boolean, default: true },
    dots: { type: Boolean, default: true },
    loop: { type: Boolean, default: true },
    start: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    // Анимация появления контента: rise|fade|zoom|left|right|flip|clip|blur
    animation: { type: String, default: 'rise' },
    // Переход между слайдами: slide|fade|zoom|fly|flip|clip
    transition: { type: String, default: 'slide' }
  },

  data: function () {
    return {
      slides: [],
      loading: true,
      error: false,
      _received: false,
      _timer: null,
      _startX: null,
      // Позиция ленты: сколько слайдов прокручено от начала
      index: 0,
      // Слайд, чей контент проявлен (is-active)
      activeIndex: 0,
      // Слайд, чей контент сейчас угасает перед уездом
      leaving: null,
      // Идёт переход — клики/автопрокрутка не сработают повторно
      busy: false
    };
  },

  computed: {
    trackStyle: function () {
      return { transform: 'translateX(' + (-this.index * 100) + '%)' };
    },
    // CSS-переменные для длительностей анимаций (пишутся на корне секции)
    heroStyle: function () {
      var s = {
        '--hero-fade-in': (this.fadeIn / 1000) + 's',
        '--hero-fade-out': (this.fadeOut / 1000) + 's',
        '--hero-slide-speed': (this.slideSpeed / 1000) + 's'
      };
      if (this.height > 0) s['--hero-height'] = this.height + 'px';
      return s;
    }
  },

  created: function () {
    this.load();
  },

  mounted: function () {
    this.restart();
    var el = this.$el;
    var vm = this;
    this._onStart = function (e) { vm._startX = e.touches[0].clientX; };
    this._onEnd = function (e) {
      if (vm._startX === null) return;
      var dx = e.changedTouches[0].clientX - vm._startX;
      if (Math.abs(dx) > 50) vm.go(vm.index + (dx < 0 ? 1 : -1));
      vm._startX = null;
    };
    el.addEventListener('touchstart', this._onStart, { passive: true });
    el.addEventListener('touchend', this._onEnd, { passive: true });
  },

  beforeUnmount: function () {
    clearInterval(this._timer);
    if (this._onStart !== undefined) {
      this.$el.removeEventListener('touchstart', this._onStart);
      this.$el.removeEventListener('touchend', this._onEnd);
    }
  },

  methods: {
    load: function () {
      var vm = this;

      // Слайды блока (инлайн JSON) — приоритетнее серверного data-url.
      if (vm.dataList) {
        var list = null;
        try { list = JSON.parse(vm.dataList); } catch (e) { list = null; }
        if (Array.isArray(list)) { vm.recv(list); return; }
      }

      if (!vm.dataUrl) { vm.fail(); return; }

      if (/\.json$/i.test(vm.dataUrl)) {
        // Релиз/статический JSON: обычный запрос
        fetch(vm.dataUrl)
          .then(function (r) { return r.json(); })
          .then(function (list) { vm.recv(list); })
          .catch(function () { vm.fail(); });
        return;
      }

      // Preview: js-файл при исполнении публикует событие t1:slider
      var listener = function (e) {
        var d = e.detail;
        if (!d || d.id !== vm.dataId) return;
        window.removeEventListener('t1:slider', listener);
        vm.recv(d.list || []);
      };
      window.addEventListener('t1:slider', listener);

      var s = document.createElement('script');
      s.src = vm.dataUrl;
      s.onload = function () {
        if (!vm._received) vm.fail();
      };
      s.onerror = function () {
        vm.fail();
      };
      document.head.appendChild(s);
    },

    recv: function (list) {
      var vm = this;
      vm._received = true;
      vm.slides = list || [];
      vm.loading = false;
      if (!vm.slides.length) vm.error = true;
      // Начальная позиция: стартовый слайд (start), его контент проявляется сразу
      var n = vm.slides.length;
      var st = Math.min(Math.max(0, vm.start | 0), Math.max(0, n - 1));
      vm.index = st;
      vm.activeIndex = st;
      vm.restart();
    },

    fail: function () {
      var vm = this;
      vm.loading = false;
      vm.error = true;
    },

    go: function (i) {
      var vm = this;
      var count = vm.slides.length;
      if (!count || vm.loading || vm.error || vm.busy) return;

      if (vm.loop) {
        i = (i + count) % count;
      } else {
        if (i < 0) i = 0;
        if (i > count - 1) i = count - 1;
      }
      if (i === vm.index) { vm.restart(); return; }

      vm.busy = true;
      // 1. Текущий контент угасает (is-out: heroOut)
      vm.leaving = vm.index;
      vm.activeIndex = null;

      setTimeout(function () {
        // 2. Лента уезжает к следующему слайду (контент нового — погашен)
        vm.index = i;
        setTimeout(function () {
          // 3. Слайд приехал — его контент плавно проявляется (heroIn)
          vm.leaving = null;
          vm.activeIndex = i;
          vm.busy = false;
          vm.restart();
        }, vm.slideSpeed);
      }, vm.fadeOut);
    },

    next: function () { this.go(this.index + 1); },
    prev: function () { this.go(this.index - 1); },

    restart: function () {
      var vm = this;
      clearInterval(vm._timer);
      if (vm.autoplay > 0 && vm.slides.length > 1) {
        vm._timer = setInterval(function () { vm.go(vm.index + 1); }, vm.autoplay);
      }
    }
  },

  template: `
<section class="hero" aria-label="Главный слайдер" :style="heroStyle"
         :class="['hero--anim-' + (animation || 'rise'), 'hero--tr-' + (transition || 'slide'),
                  { 'hero--no-arrows': !arrows, 'hero--no-dots': !dots }]">
  <p v-if="loading" class="hero__status">Загружаем слайды…</p>
  <p v-else-if="error" class="hero__status hero__status--error">Не удалось загрузить слайды.</p>

  <template v-else>
    <div class="hero__slides" :style="trackStyle">
      <div class="hero__slide"
           v-for="(s, i) in slides"
           :key="s.id"
           :class="{ 'is-active': activeIndex === i, 'is-out': leaving === i }">
        <img class="hero__media" :src="s.photo" :alt="s.header"
             width="1600" height="760" decoding="async"
             :fetchpriority="i === 0 ? 'high' : null"
             :loading="i === 0 ? 'eager' : 'lazy'">
        <div class="hero__overlay"></div>
        <div class="container hero__content">
            <p class="hero__title">{{ s.header }}</p>
          <p class="hero__subtitle">{{ s.body }}</p>
          <a class="btn btn-primary btn-lg hero__btn" :href="s.url">{{ s.button || 'Узнать больше' }}</a>
        </div>
      </div>
    </div>

    <button v-if="arrows" class="hero__arrow hero__arrow--prev" type="button" aria-label="Предыдущий слайд" @click="prev">‹</button>
    <button v-if="arrows" class="hero__arrow hero__arrow--next" type="button" aria-label="Следующий слайд" @click="next">›</button>

    <div v-if="dots && slides.length > 1" class="hero__dots" role="group" aria-label="Навигация по слайдам">
      <button v-for="(s, i) in slides"
              :key="'dot-' + s.id"
              type="button"
              class="hero__dot"
              :class="{ 'is-active': activeIndex === i }"
              :aria-label="'Слайд ' + (i + 1)"
              @click="go(i)"></button>
    </div>
  </template>
</section>`
};