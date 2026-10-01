/* ============================================================
   templates/t1/js/block_slider.js
   Vue-компонент <block-slider> — единый слайдер для всех типов.

   Один компонент рисует 10 видов слайдера в зависимости от
   атрибута data-type: hero, split, thumbs, fade, vertical,
   center, progress, text, parallax, coverflow.

   ПАРАМЕТРЫ (атрибуты на элементе <block-slider>)
     data-type     — тип слайдера (обязательный);
     data-list     — данные: инлайн-JSON-массив слайдов ИЛИ URL;
     data-speed    — длительность перехода, с (дефолт 0.55);
     data-autoplay — интервал автопрокрутки, мс (0 — нет);
     data-duration — длительность показа для типа progress, мс;
     data-animation— анимация появления контента: rise (дефолт),
                     fade, zoom, left, right, flip, swirl, blur,
                     clip, bounce;
     data-transition— анимация перехода между слайдами: fade (дефолт),
                     slide, zoom, fly, flip, swirl, blur, bounce,
                     iris, clip;
     data-antialias— прозрачность неактивных слайдов, 0–1 (0.4);
     data-loop     — зацикливание (true);
     data-start    — стартовый индекс (0);
     data-arrows   — показ стрелок (дефолт — по типу);
     data-dots     — показ точек (дефолт — по типу);
     data-height   — высота блока, px (переопределяет дефолт типа);
     data-fade-in / data-fade-out — мс, только для типа hero.

   ФОРМАТ СЛАЙДА: { id, header, text, photo, url, button }
   button — строка (текст кнопки, url берётся из url) или
   объект { text, url }. У hero поля text/button приходят как
   body/button — нормализуются в recv().

   Стили — единые в css/block-slider.css. Анимации появления
   выбираются переменной --slider-anim (класс .slider__reveal).
   ============================================================ */

/* ---------- Соответствие data-animation → имя keyframes ---------- */
var BS_ANIM = {
  rise: 'riseUp', fade: 'animFade', zoom: 'animZoom', left: 'animLeft',
  right: 'animRight', flip: 'animFlip', swirl: 'animSwirl', blur: 'animBlur',
  clip: 'animClip', bounce: 'animBounce'
};

/* ---------- Анимации перехода (data-transition) ---------- */
var BS_TRANS = ['fade', 'slide', 'zoom', 'fly', 'flip', 'swirl', 'blur', 'bounce', 'iris', 'clip'];

/* ---------- Дефолты управления по типам ---------- */
var BS_CONTROLS = {
  split: { arrows: true, dots: true },
  thumbs: { arrows: false, dots: false },
  fade: { arrows: true, dots: true },
  vertical: { arrows: true, dots: true },
  center: { arrows: true, dots: false },
  progress: { arrows: true, dots: true },
  text: { arrows: true, dots: false },
  parallax: { arrows: true, dots: true },
  coverflow: { arrows: true, dots: true },
  hero: { arrows: true, dots: true }
};

/* ---------- Нормализация слайда { header, text, photo, url, button } ---------- */
function bsNormalize(raw, i) {
  var s = raw || {};
  var btn = s.button;
  var url = s.url;
  var btnText = '';
  if (btn && typeof btn === 'object') {
    btnText = btn.text || '';
    url = url || btn.url;
  } else if (btn) {
    btnText = String(btn);
  }
  return {
    key: (s.id != null ? s.id : 's') + '-' + i,
    id: s.id,
    header: s.header != null ? s.header : (s.title || ('Слайд ' + (i + 1))),
    text: s.text != null ? s.text : (s.description != null ? s.description : (s.body || '')),
    photo: s.photo || '',
    url: url || '',
    button: btnText
  };
}

/* ---------- Стрелки (общие для всех типов) ---------- */
var BSArrows = {
  name: 'BSArrows',
  template:
    '<button class="slider__arrow slider__arrow--prev" type="button" aria-label="Предыдущий слайд" @click="$emit(\'prev\')">‹</button>' +
    '<button class="slider__arrow slider__arrow--next" type="button" aria-label="Следующий слайд" @click="$emit(\'next\')">›</button>'
};

/* ---------- Точки (общие для всех типов) ---------- */
var BSDots = {
  name: 'BSDots',
  props: ['slides', 'active'],
  template:
    '<button v-for="(s, i) in slides" :key="\'dot-\' + s.key" type="button" ' +
    'class="slider__dot" :class="{ \'is-active\': active === i }" ' +
    ':aria-label="\'Слайд \' + (i + 1)" @click="$emit(\'go\', i)"></button>'
};

/* ============================================================
   КОМПОНЕНТ <block-slider>
   ============================================================ */
window.BlockSlider = {
  name: 'BlockSlider',
  components: { 'bs-arrows': BSArrows, 'bs-dots': BSDots },

  props: {
    dataType: { type: String, required: true },
    dataList: { type: String, required: true },
    dataSpeed: { type: [Number, String], default: null },
    dataAutoplay: { type: [Number, String], default: null },
    dataDuration: { type: [Number, String], default: null },
    dataAnimation: { type: String, default: '' },
    dataTransition: { type: String, default: '' },
    dataAntialias: { type: [Number, String], default: null },
    dataLoop: { type: Boolean, default: true },
    dataStart: { type: [Number, String], default: null },
    dataArrows: { type: Boolean, default: null },
    dataDots: { type: Boolean, default: null },
    dataHeight: { type: String, default: '' },
    dataFadeIn: { type: [Number, String], default: null },
    dataFadeOut: { type: [Number, String], default: null }
  },

  data: function () {
    return {
      slides: [],
      loading: true,
      error: false,
      index: 0,
      activeIndex: 0,
      busy: false,
      leaving: null,
      shift: null,
      progress: 0,
      cardW: 320,
      centerBasis: 0,
      centerGap: 0,
      _timer: null,
      _ptimer: null,
      _startX: null,
      _onStart: null,
      _onEnd: null
    };
  },

  computed: {

    type: function () {
      return String(this.dataType || '').toLowerCase();
    },

    classNames: function () {
      return 'slider--' + this.type + ' slider--t-' + this.transition;
    },

    speed: function () {
      var v = parseFloat(this.dataSpeed);
      return isFinite(v) && v > 0 ? v : 0.55;
    },
    autoplayMs: function () {
      var v = parseInt(this.dataAutoplay, 10);
      return isFinite(v) && v > 0 ? v : 0;
    },
    durationMs: function () {
      var v = parseInt(this.dataDuration, 10);
      return isFinite(v) && v > 0 ? v : 5000;
    },
    loop: function () { return this.dataLoop; },
    animation: function () {
      var a = String(this.dataAnimation || '').toLowerCase();
      return BS_ANIM[a] ? a : 'rise';
    },
    transition: function () {
      var growth = String(this.dataTransition || '').toLowerCase();
      return BS_TRANS.indexOf(growth) !== -1 ? growth : 'fade';
    },
    antialias: function () {
      var v = parseFloat(this.dataAntialias);
      if (!isFinite(v)) v = 0.4;
      return Math.max(0, Math.min(1, v));
    },
    startIdx: function () {
      var v = parseInt(this.dataStart, 10);
      return isFinite(v) && v >= 0 ? v : 0;
    },
    fadeIn: function () {
      var v = parseInt(this.dataFadeIn, 10);
      return isFinite(v) && v > 0 ? v : 650;
    },
    fadeOut: function () {
      var v = parseInt(this.dataFadeOut, 10);
      return isFinite(v) && v > 0 ? v : 350;
    },

    showArrows: function () {
      var d = BS_CONTROLS[this.type];
      var base = d && d.arrows !== undefined ? d.arrows : true;
      return this.dataArrows === null ? base : !!this.dataArrows;
    },
    showDots: function () {
      var d = BS_CONTROLS[this.type];
      var base = d && d.dots !== undefined ? d.dots : true;
      return this.dataDots === null ? base : !!this.dataDots;
    },

    rootStyle: function () {
      var st = {
        '--slider-speed': this.speed + 's',
        '--slider-anim': BS_ANIM[this.animation] || 'riseUp',
        '--slider-trans': BS_TRANS.indexOf(this.transition) !== -1 ? this.transition : 'fade',
        '--slider-dim': String(this.antialias)
      };
      if (this.dataHeight) st['--slider-height'] = this.dataHeight + 'px';
      return st;
    },

    heroStyle: function () {
      return {
        '--hero-fade-in': (this.fadeIn / 1000) + 's',
        '--hero-fade-out': (this.fadeOut / 1000) + 's',
        '--hero-slide-speed': this.speed + 's'
      };
    },

    /* Горизонтальная лента (hero, split) */
    trackStyle: function () {
      return { transform: 'translateX(' + (-this.index * 100) + '%)' };
    },
    /* Вертикальная лента (vertical) */
    verticalTrackStyle: function () {
      return { transform: 'translateY(' + (-this.index * 100) + '%)' };
    },
    /* Center-mode: активная карточка в центре блока */
    centerTrackStyle: function () {
      var n = this.slides.length;
      if (!n) return {};
      var basis = this.centerBasis || 300;
      var gap = this.centerGap || 0;
      var groupW = n * basis + (n - 1) * gap;
      var off = -(this.index * (basis + gap)) + (groupW / 2 - basis / 2);
      return { transform: 'translateX(' + off + 'px)' };
    },

    progressWidth: function () {
      return Math.min(this.progress / this.durationMs * 100, 100) + '%';
    }
  },

  methods: {

    /* ---------- Загрузка данных ---------- */
    load: function () {
      var raw = String(this.dataList || '').trim();
      if (!raw) { this.fail(); return; }
      var first = raw.charAt(0);
      if (first === '[' || first === '{') {
        try { this.recv(JSON.parse(raw)); }
        catch (e) { this.fail(); }
        return;
      }
      /* data-list = URL (релиз: сервер отдаёт голый массив JSON) */
      var vm = this;
      fetch(raw)
        .then(function (r) { return r.json(); })
        .then(function (list) { vm.recv(list); })
        .catch(function () { vm.fail(); });
    },

    recv: function (list) {
      var vm = this;
      vm.slides = (list || []).map(bsNormalize);
      vm.loading = false;
      if (!vm.slides.length) { vm.error = true; return; }
      var start = Math.max(0, Math.min(vm.startIdx, vm.slides.length - 1));
      vm.index = start;
      vm.activeIndex = start;
      if (vm.type === 'progress') vm.restartProgress();
      else vm.restart();
    },

    fail: function () {
      this.loading = false;
      this.error = true;
    },

    /* ---------- Замеры после монтирования ---------- */
    measure: function () {
      var el = this.$el;
      if (!el) return;
      if (this.type === 'center') {
        var track = el.querySelector('.slider--center__track');
        if (track && track.children.length) {
          this.centerBasis = track.children[0].offsetWidth || 300;
          this.centerGap = parseFloat(getComputedStyle(track).columnGap) || 0;
        }
      }
      if (this.type === 'coverflow') {
        var card = el.querySelector('.slider--coverflow__card');
        if (card) this.cardW = card.offsetWidth || 320;
      }
    },
    _onResize: function () { this.measure(); },

    /* ---------- Переключение ---------- */
    go: function (n) {
      var len = this.slides.length;
      if (!len || this.loading || this.error || this.busy) return;
      n = this.loop ? (n + len) % len : Math.max(0, Math.min(n, len - 1));
      if (n === this.index) { if (this.type === 'hero') this.restart(); return; }

      if (this.type === 'hero') { this.heroGo(n); return; }

      var prev = this.index;
      this.index = n;
      this.activeIndex = n;

      if (this.type === 'parallax') {
        this.busy = true;
        this.leaving = prev;
        this.shift = n;
        var vm = this;
        setTimeout(function () { vm.leaving = null; vm.shift = null; vm.busy = false; },
          this.speed * 1000 + 140);
      } else if (this.type === 'split') {
        this.busy = true;
        var self = this;
        setTimeout(function () { self.busy = false; }, this.speed * 1000 + 90);
      }

      if (this.type === 'progress') this.restartProgress();
      else this.restart();
    },

    heroGo: function (n) {
      if (this.busy) return;
      var vm = this;
      vm.busy = true;
      vm.leaving = vm.index;
      vm.activeIndex = null;
      setTimeout(function () {
        vm.index = n;
        setTimeout(function () {
          vm.leaving = null;
          vm.activeIndex = n;
          vm.busy = false;
          vm.restart();
        }, vm.speed * 1000);
      }, vm.fadeOut);
    },

    next: function () { this.go(this.index + 1); },
    prev: function () { this.go(this.index - 1); },

    /* ---------- Автопрокрутка ---------- */
    restart: function () {
      var vm = this;
      clearInterval(this._timer);
      if (this.type === 'progress') return;
      if (this.autoplayMs > 0 && this.slides.length > 1) {
        this._timer = setInterval(function () { vm.go(vm.index + 1); }, vm.autoplayMs);
      }
    },

    /* ---------- Прогресс-бар (тип progress, data-duration) ---------- */
    restartProgress: function () {
      var vm = this;
      clearInterval(this._ptimer);
      this.progress = 0;
      if (this.slides.length < 2) return;
      this._ptimer = setInterval(function () {
        vm.progress += 30;
        if (vm.progress >= vm.durationMs) vm.go(vm.index + 1);
      }, 30);
    },

    /* ---------- Атрибуты типов ---------- */
    parallaxAttr: function (i) {
      if (i === this.leaving) return 'prev';
      if (i === this.activeIndex) return 'center';
      return null;
    },
    shiftAttr: function (i) {
      return i === this.shift ? 'down' : null;
    },

    /* ---------- Coverflow 3D: раскладка карточек ---------- */
    cardStyle: function (i) {
      var off = i - this.index;
      var abs = Math.abs(off);
      var step = this.cardW + 26;
      if (off === 0) {
        return { transform: 'translate(-50%,-50%) rotateY(0deg) scale(1)', zIndex: 10, opacity: '1', pointerEvents: 'auto' };
      }
      var dir = off > 0 ? 1 : -1;
      var rotY = -dir * 38;
      var scale = Math.max(0.72, 1 - abs * 0.12);
      var depth = -abs * 60;
      return {
        transform: 'translate(-50%,-50%) translateX(' + (off * step) + 'px) ' +
          'rotateY(' + rotY + 'deg) scale(' + scale + ') translateZ(' + depth + 'px)',
        zIndex: 10 - abs,
        opacity: abs <= 2 ? (abs === 1 ? '0.9' : '0.55') : '0',
        pointerEvents: abs <= 2 ? 'auto' : 'none'
      };
    }
  },

  created: function () {
    this.load();
  },

  mounted: function () {
    var vm = this;
    this.$nextTick(function () { vm.measure(); });
    window.addEventListener('resize', this._onResize);
    if (this.type === 'progress') this.restartProgress();
    else this.restart();

    if (this.type === 'hero') {
      var el = this.$el;
      this._onStart = function (e) { vm._startX = e.touches[0].clientX; };
      this._onEnd = function (e) {
        if (vm._startX === null) return;
        var dx = e.changedTouches[0].clientX - vm._startX;
        if (Math.abs(dx) > 50) vm.go(vm.index + (dx < 0 ? 1 : -1));
        vm._startX = null;
      };
      el.addEventListener('touchstart', this._onStart, { passive: true });
      el.addEventListener('touchend', this._onEnd, { passive: true });
    }
  },

  beforeUnmount: function () {
    clearInterval(this._timer);
    clearInterval(this._ptimer);
    window.removeEventListener('resize', this._onResize);
    if (this.type === 'hero' && this.$el) {
      if (this._onStart) this.$el.removeEventListener('touchstart', this._onStart);
      if (this._onEnd) this.$el.removeEventListener('touchend', this._onEnd);
    }
  },

  /* ============================================================
     ШАБЛОН
     hero — отдельная секция .hero (стили .hero* из style.css);
     остальные типы — общий корень .slider.slider--<type> со
     стрелками и точками (BSArrows / BSDots), позиционируемыми CSS.
     ============================================================ */
  template:
    '<section v-if="type === \'hero\'" class="hero" :class="\'slider--t-\' + transition" :data-type="type" :data-transition="transition" aria-label="Слайдер" :style="heroStyle">' +

      '<p v-if="loading" class="hero__status">Загружаем слайды…</p>' +
      '<p v-else-if="error" class="hero__status hero__status--error">Не удалось загрузить слайды.</p>' +

      '<template v-else>' +
        '<div class="hero__slides" :style="trackStyle">' +
          '<div class="hero__slide" v-for="(s, i) in slides" :key="s.key" ' +
               ':class="{ \'is-active\': activeIndex === i, \'is-out\': leaving === i }">' +
            '<img class="hero__media" :src="s.photo" :alt="s.header">' +
            '<div class="hero__overlay"></div>' +
            '<div class="container hero__content">' +
              '<h1 class="hero__title">{{ s.header }}</h1>' +
              '<p class="hero__subtitle">{{ s.text }}</p>' +
              '<a v-if="s.url || s.button" class="btn btn-primary btn-lg hero__btn" :href="s.url">{{ s.button || \'Узнать больше\' }}</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button v-if="showArrows" class="hero__arrow hero__arrow--prev" type="button" aria-label="Предыдущий слайд" @click="prev">‹</button>' +
        '<button v-if="showArrows" class="hero__arrow hero__arrow--next" type="button" aria-label="Следующий слайд" @click="next">›</button>' +
        '<div v-if="showDots" class="hero__dots" role="group" aria-label="Навигация по слайдам">' +
          '<button v-for="(s, i) in slides" :key="\'dot-\' + s.key" type="button" class="hero__dot" ' +
                  ':class="{ \'is-active\': activeIndex === i }" :aria-label="\'Слайд \' + (i + 1)" @click="go(i)"></button>' +
        '</div>' +
      '</template>' +
    '</section>' +

    '<div v-else class="slider" :class="classNames" :data-type="type" :data-animation="animation" :data-transition="transition" :style="rootStyle">' +

      '<p v-if="loading" class="slider__status">Загружаем слайды…</p>' +
      '<p v-else-if="error" class="slider__status slider__status--error">Не удалось загрузить слайды.</p>' +

      '<template v-else>' +

        /* split */
        '<div v-if="type === \'split\'" class="slider--split__track" :style="trackStyle">' +
          '<article v-for="(s, i) in slides" :key="s.key" class="slider--split__slide" :class="{ \'is-active\': activeIndex === i }">' +
            '<div class="slider--split__left"><img :src="s.photo" :alt="s.header" loading="lazy"></div>' +
            '<div class="slider--split__right" :class="{ \'slider--split__right--alt\': !s.button }">' +
              '<h3 class="slider--split__title slider__reveal">{{ s.header }}</h3>' +
              '<p class="slider--split__text slider__reveal slider__reveal--1">{{ s.text }}</p>' +
              '<a v-if="s.button || s.url" class="slider--split__btn slider__reveal slider__reveal--2" :href="s.url">{{ s.button }}</a>' +
            '</div>' +
          '</article>' +
        '</div>' +

        /* thumbs */
        '<div v-if="type === \'thumbs\'">' +
          '<div class="slider--thumbs__main is-active" :key="activeIndex">' +
            '<img :src="slides[activeIndex].photo" :alt="slides[activeIndex].header">' +
            '<div class="slider--thumbs__content">' +
              '<h3 class="slider--thumbs__title slider__reveal">{{ slides[activeIndex].header }}</h3>' +
              '<p class="slider--thumbs__text slider__reveal slider__reveal--1">{{ slides[activeIndex].text }}</p>' +
              '<a v-if="slides[activeIndex].button || slides[activeIndex].url" class="slider--thumbs__btn slider__reveal slider__reveal--2" :href="slides[activeIndex].url">{{ slides[activeIndex].button }}</a>' +
            '</div>' +
          '</div>' +
          '<div class="slider--thumbs__thumbs">' +
            '<button v-for="(s, i) in slides" :key="\'thumb-\' + s.key" type="button" class="slider--thumbs__thumb" ' +
                    ':class="{ \'is-active\': activeIndex === i }" :aria-label="s.header" @click="go(i)">' +
              '<img :src="s.photo" :alt="s.header">' +
            '</button>' +
          '</div>' +
        '</div>' +

        /* fade */
        '<div v-if="type === \'fade\'">' +
          '<span class="slider--fade__counter">{{ activeIndex + 1 }} / {{ slides.length }}</span>' +
          '<article v-for="(s, i) in slides" :key="s.key" class="slider--fade__slide" :class="{ \'is-active\': activeIndex === i }">' +
            '<img :src="s.photo" :alt="s.header" loading="lazy">' +
            '<div class="slider--fade__overlay"></div>' +
            '<div class="slider--fade__content">' +
              '<h3 class="slider--fade__title slider__reveal">{{ s.header }}</h3>' +
              '<p class="slider--fade__text slider__reveal slider__reveal--1">{{ s.text }}</p>' +
              '<a v-if="s.button || s.url" class="slider--fade__btn slider__reveal slider__reveal--2" :href="s.url">{{ s.button }}</a>' +
            '</div>' +
          '</article>' +
        '</div>' +

        /* vertical */
        '<div v-if="type === \'vertical\'" class="slider--vertical__track" :style="verticalTrackStyle">' +
          '<article v-for="(s, i) in slides" :key="s.key" class="slider--vertical__slide" :class="{ \'is-active\': activeIndex === i }">' +
            '<img :src="s.photo" :alt="s.header">' +
            '<div class="slider--vertical__overlay"></div>' +
            '<div class="slider--vertical__content">' +
              '<h3 class="slider--vertical__title slider__reveal">{{ s.header }}</h3>' +
              '<p class="slider--vertical__text slider__reveal slider__reveal--1">{{ s.text }}</p>' +
            '</div>' +
          '</article>' +
        '</div>' +

        /* center */
        '<div v-if="type === \'center\'" class="slider--center__track" :style="centerTrackStyle">' +
          '<article v-for="(s, i) in slides" :key="s.key" class="slider--center__slide" ' +
                   ':class="{ \'is-active\': activeIndex === i }" @click="go(i)">' +
            '<img :src="s.photo" :alt="s.header" loading="lazy">' +
            '<div class="slider--center__overlay"></div>' +
            '<div class="slider--center__content">' +
              '<h3 class="slider--center__title slider__reveal">{{ s.header }}</h3>' +
              '<p class="slider--center__text slider__reveal slider__reveal--1">{{ s.text }}</p>' +
            '</div>' +
          '</article>' +
        '</div>' +

        /* progress */
        '<div v-if="type === \'progress\'">' +
          '<div class="slider--progress__progress" :style="{ width: progressWidth }"></div>' +
          '<article v-for="(s, i) in slides" :key="s.key" class="slider--progress__slide" :class="{ \'is-active\': activeIndex === i }">' +
            '<img :src="s.photo" :alt="s.header" loading="lazy">' +
            '<div class="slider--progress__overlay"></div>' +
            '<div class="slider--progress__content">' +
              '<h3 class="slider--progress__title slider__reveal">{{ s.header }}</h3>' +
              '<p class="slider--progress__text slider__reveal slider__reveal--1">{{ s.text }}</p>' +
              '<a v-if="s.button || s.url" class="slider--progress__btn slider__reveal slider__reveal--2" :href="s.url">{{ s.button }}</a>' +
            '</div>' +
          '</article>' +
        '</div>' +

        /* text */
        '<div v-if="type === \'text\'">' +
          '<article v-for="(s, i) in slides" :key="s.key" class="slider--text__slide" :class="{ \'is-active\': activeIndex === i }">' +
            '<h3 class="slider--text__title slider__reveal">{{ s.header }}</h3>' +
            '<p class="slider--text__text slider__reveal slider__reveal--1">{{ s.text }}</p>' +
            '<a v-if="s.button || s.url" class="slider--text__link slider__reveal slider__reveal--2" :href="s.url">{{ s.button }}</a>' +
          '</article>' +
        '</div>' +

        /* parallax */
        '<div v-if="type === \'parallax\'">' +
          '<article v-for="(s, i) in slides" :key="s.key" class="slider--parallax__slide" ' +
                   ':class="{ \'is-active\': activeIndex === i }" :data-parallax="parallaxAttr(i)" ' +
                   ':style="{ backgroundImage: \'url(\' + s.photo + \')\' }">' +
            '<div class="slider--parallax__overlay"></div>' +
            '<div class="slider--parallax__content" :data-shift="shiftAttr(i)">' +
              '<h3 class="slider--parallax__title slider__reveal">{{ s.header }}</h3>' +
              '<p class="slider--parallax__text slider__reveal slider__reveal--1">{{ s.text }}</p>' +
              '<a v-if="s.button || s.url" class="slider--parallax__btn slider__reveal slider__reveal--2" :href="s.url">{{ s.button }}</a>' +
            '</div>' +
          '</article>' +
        '</div>' +

        /* coverflow */
        '<div v-if="type === \'coverflow\'" class="slider--coverflow__stage">' +
          '<article v-for="(s, i) in slides" :key="s.key" class="slider--coverflow__card" ' +
                   ':class="{ \'is-active\': activeIndex === i }" :style="cardStyle(i)" @click="go(i)">' +
            '<img :src="s.photo" :alt="s.header">' +
            '<div class="slider--coverflow__overlay"></div>' +
            '<div class="slider--coverflow__content">' +
              '<h3 class="slider--coverflow__title slider__reveal">{{ s.header }}</h3>' +
              '<p class="slider--coverflow__desc slider__reveal slider__reveal--1">{{ s.text }}</p>' +
            '</div>' +
          '</article>' +
        '</div>' +

      '</template>' +

      /* Стрелки (кроме text — они в футере ниже) */
      '<div v-if="showArrows && type !== \'text\'" class="slider__arrows" :class="\'slider--\' + type + \'__arrows\'">' +
        '<bs-arrows @prev="prev" @next="next"></bs-arrows>' +
      '</div>' +

      /* Точки */
      '<div v-if="showDots" class="slider__dots" :class="\'slider--\' + type + \'__dots\'">' +
        '<bs-dots :slides="slides" :active="activeIndex" @go="go"></bs-dots>' +
      '</div>' +

      /* text: футер со стрелками и счётчиком */
      '<div v-if="type === \'text\' && (showArrows || slides.length > 1)" class="slider--text__footer">' +
        '<div v-if="showArrows" class="slider--text__arrows">' +
          '<bs-arrows @prev="prev" @next="next"></bs-arrows>' +
        '</div>' +
        '<span class="slider--text__counter">{{ activeIndex + 1 }} / {{ slides.length }}</span>' +
      '</div>' +

    '</div>'
};