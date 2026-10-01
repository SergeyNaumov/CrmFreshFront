/* ============================================================
   templates/t1/js/preview/blocks_sliders.js
   Интерактивная витрина <block-slider> для preview-страницы
   blocks_sliders.html: один слайдер + панель параметров.

   При изменении любого параметра компонент <block-slider>
   пересоздаётся (передаётся :key от всех параметров) — слайдер
   «переинициализируется и меняет внешний вид». Под демо-слайдером
   генерируется готовый HTML-код вставки (со всеми выбранными
   параметрами и полным data-list) и кнопка «Копировать».

   Демо-данные по типам — window.__t1_slider_demos (можно
   подменять из консоли перед инициализацией).
   ============================================================ */

/* ---------- Демо-данные по типам (пути относительно preview/) ---------- */
window.__t1_slider_demos = window.__t1_slider_demos || {
  hero: [
    { id: 1, header: 'Техника будущего — уже сегодня', body: 'Смартфоны, ноутбуки и аксессуары со скидкой до 40% на старте продаж. Гарантия качества и быстрая доставка.', url: '#catalog', button: 'Смотреть каталог', photo: 'images/hero-1.svg' },
    { id: 2, header: 'Распродажа со скидками до 50%', body: 'Топовые бренды по лучшим ценам. Успейте заказать любимые гаджеты, пока действует акция.', url: '#sale', button: 'К акциям', photo: 'images/hero-2.svg' },
    { id: 3, header: 'Новые поступления в магазине', body: 'Первыми узнайте о свежих релизах и эксклюзивных новинках. Промокод NEW20 даёт −20% на первый заказ.', url: '#new', button: 'Смотреть новинки', photo: 'images/hero-3.svg' }
  ],
  split: [
    { header: 'Смартфоны нового поколения', description: 'Флагманы с камерой 200 Мп и зарядкой за 15 минут. Лучшие цены на старте продаж.', photo: 'images/category-electronics.svg', button: { text: 'Смотреть', url: 'catalog_in.html' } },
    { header: 'Умный дом под ключ', description: 'Свет, климат и безопасность — всё управляется со смартфона. Бесплатная консультация инженера.', photo: 'images/category-home.svg', button: { text: 'Подробнее', url: 'catalog_in.html' } },
    { header: 'Спортивные трекеры 2026', description: 'Новые модели с замером SpO2, давления и качества сна. Выбор профессиональных атлетов.', photo: 'images/category-sport.svg', button: { text: 'К покупке', url: 'catalog_in.html' } },
    { header: 'Наушники и аудио', description: 'TWS с шумоподавлением и полноразмерные модели для домашней студии.', photo: 'images/product-11.jpg' }
  ],
  thumbs: [
    { header: 'Геймерские ноутбуки', description: 'RTX 50-серии и 240 Гц экран в компактном корпусе.', photo: 'images/product-13.jpg' },
    { header: 'Беспроводные наушники', description: 'ANC, 40 часов работы, Hi-Res Audio сертификация.', photo: 'images/product-11.jpg' },
    { header: 'Умные часы Pro', description: 'GPS, пульсоксиметр, 14 дней без зарядки.', photo: 'images/about.svg' },
    { header: 'Телевизор OLED 65″', description: '4K 120 Гц, Dolby Vision, идеальный чёрный.', photo: 'images/product-14.jpg' }
  ],
  fade: [
    { header: 'Распродажа до −50%', description: 'Топовые бренды по лучшим ценам. Успейте заказать, пока действует акция.', photo: 'images/category-electronics.svg', button: { text: 'К акциям', url: '#v1' } },
    { header: 'Новые поступления', description: 'Первыми узнайте о свежих релизах. Промокод NEW20 — минус 20% на первый заказ.', photo: 'images/category-home.svg', button: { text: 'Смотреть', url: '#v1' } },
    { header: 'Бесплатная доставка', description: 'Доставим заказ за 1–2 дня по городу. Бесплатно при сумме от 5 000 ₽.', photo: 'images/category-sport.svg' }
  ],
  vertical: [
    { header: 'Игровые консоли', description: 'Новейшие консоли и эксклюзивы в наличии.', photo: 'images/product-13.jpg' },
    { header: 'Фото и видео', description: 'Камеры, объективы и штативы для съёмки.', photo: 'images/product-15.jpg' },
    { header: 'Аудиотехника', description: 'Колонки, наушники и усилители.', photo: 'images/product-11.jpg' },
    { header: 'Компьютеры', description: 'Системные блоки и комплектующие.', photo: 'images/product-12.jpg' }
  ],
  center: [
    { header: 'Galaxy S26 Ultra', description: '200 Мп, S Pen, титановый корпус', photo: 'images/category-electronics.svg' },
    { header: 'MacBook Pro M5', description: '48 ГБ RAM, 24 часа автономности', photo: 'images/product-13.jpg' },
    { header: 'Sony WH-2000XM6', description: 'Лучшее ANC в индустрии', photo: 'images/product-11.jpg' },
    { header: 'Dyson V20 Detect', description: 'Лазерное обнаружение пыли', photo: 'images/category-home.svg' },
    { header: 'GoPro Hero 14', description: '5.3K HDR, стабилизация HyperSmooth 7', photo: 'images/product-15.jpg' }
  ],
  progress: [
    { header: 'До −40% на технику', description: 'Смартфоны, ноутбуки и аксессуары со скидкой. Гарантия качества и быстрая доставка.', photo: 'images/category-electronics.svg', button: { text: 'Смотреть каталог', url: '#v1' } },
    { header: 'Новые поступления', description: 'Первыми узнайте о свежих релизах. Промокод NEW20 даёт −20% на первый заказ.', photo: 'images/category-home.svg', button: { text: 'К новинкам', url: '#v1' } },
    { header: 'Распродажа до −50%', description: 'Топовые бренды по лучшим ценам. Успейте заказать, пока действует акция.', photo: 'images/category-sport.svg' }
  ],
  text: [
    { header: 'Техника будущего — уже сегодня', description: 'Смартфоны, ноутбуки и аксессуары со скидкой до 40%. Гарантия качества и быстрая доставка по всей России.', button: { text: 'Перейти в каталог', url: '#v1' } },
    { header: 'Компетентный сервис — наше кредо', description: 'Консультанты разбираются в каждой линейке и подберут решение за 15 минут. Работаем для вас ежедневно с 9:00 до 21:00.', button: { text: 'Наши контакты', url: '#v1' } },
    { header: 'Новые поступления каждую неделю', description: 'Будьте в курсе свежих релизов. Подпишитесь на рассылку и получайте промокод −20% на первый заказ.', button: { text: 'Подписаться', url: '#v1' } }
  ],
  parallax: [
    { header: 'Смартфоны нового поколения', description: 'Флагманы с камерой 200 Мп и зарядкой за 15 минут.', photo: 'images/category-electronics.svg', button: { text: 'Смотреть', url: '#v1' } },
    { header: 'Умный дом под ключ', description: 'Свет, климат и безопасность — всё управляется со смартфона.', photo: 'images/category-home.svg', button: { text: 'Подробнее', url: '#v1' } },
    { header: 'Спортивные трекеры', description: 'Замер SpO2, давления и качества сна.', photo: 'images/category-sport.svg', button: { text: 'К покупке', url: '#v1' } },
    { header: 'Аудиотехника', description: 'TWS с шумоподавлением и полноразмерные модели.', photo: 'images/product-11.jpg' }
  ],
  coverflow: [
    { header: 'Электроника', description: 'Смартфоны и ноутбуки топ-брендов.', photo: 'images/category-electronics.svg' },
    { header: 'Умный дом', description: 'Климат и безопасность со смартфона.', photo: 'images/category-home.svg' },
    { header: 'Спорт', description: 'Трекеры и снаряжение.', photo: 'images/category-sport.svg' },
    { header: 'Аудио', description: 'Наушники и звуковые панели.', photo: 'images/product-11.jpg' },
    { header: 'Компьютеры', description: 'Моноблоки и комплектующие.', photo: 'images/product-13.jpg' },
    { header: 'Фото и видео', description: 'Камеры и штативы.', photo: 'images/product-15.jpg' }
  ]
};

/* ---------- Справочник типов (для панели) ---------- */
window.__t1_type_info = window.__t1_type_info || {
  hero:      { label: 'Hero — на весь экран', desc: 'Полноэкранный hero-слайдер: подъезжающая лента, каскад контента, стрелки только на hover, точки снизу. Стили — .hero* из style.css.' },
  split:     { label: 'Split — сплит', desc: 'Левая половина — фото на всю высоту, правая — текст на цветном фоне с кнопкой. Лента сдвигается горизонтально.' },
  thumbs:    { label: 'Thumbs — с миниатюрами', desc: 'Крупный слайд сверху (фото зумится ken burns), полоса превью-миниатюр снизу. Клик по миниатюре переключает слайд.' },
  fade:      { label: 'Fade', desc: 'Слайды сменяются плавным затуханием, фото активного медленно зумится. Счётчик «1 / N» в правом верхнем углу.' },
  vertical:  { label: 'Vertical — вертикальный', desc: 'Слайды переключаются по вертикали (translateY, трек — flex-колонка). Стрелки вверху/внизу, точки — столбиком справа.' },
  center:    { label: 'Center mode', desc: 'Активный слайд в центре и крупнее (scale 1.18), соседние уменьшены и приглушены на data-antialias. Клик по боковому — в центр.' },
  progress:  { label: 'Progress — с прогресс-баром', desc: 'Полоса прогресса сверху, синхронизированная с data-duration и автоплеем. Стрелки в правом нижнем углу.' },
  text:      { label: 'Text — без фото', desc: 'Только текст на градиентном фоне, кнопка-ссылка, стрелки и счётчик «1 / N» в футере.' },
  parallax:  { label: 'Parallax — с параллаксом', desc: 'Фон (background-image) смещается медленнее текста при переключении (background-position).' },
  coverflow: { label: 'Coverflow 3D', desc: 'Сцена с perspective: центральная карточка в фокусе, соседние раскрыты по rotateY и уходят вглубь.' }
};

/* ---------- Список анимаций контента (data-animation) ---------- */
window.__t1_animations = [
  'rise', 'fade', 'zoom', 'left', 'right', 'flip', 'swirl', 'blur', 'clip', 'bounce'
];

/* ---------- Список анимаций перехода (data-transition) ---------- */
window.__t1_transitions = [
  { value: 'fade',   label: 'Fade — плавное затухание' },
  { value: 'slide',  label: 'Slide — горизонтальный сдвиг' },
  { value: 'zoom',   label: 'Zoom — увеличение' },
  { value: 'fly',    label: 'Fly — въезд со смещением' },
  { value: 'flip',   label: 'Flip — 3D-переворот' },
  { value: 'swirl',  label: 'Swirl — вращение' },
  { value: 'blur',   label: 'Blur — из размытия' },
  { value: 'bounce', label: 'Bounce — пружинистый' },
  { value: 'iris',   label: 'Iris — круговое расширение' },
  { value: 'clip',   label: 'Clip — шторка сверху' }
];

/* ---------- Пресеты параметров по типам ---------- */
var BS_PRESETS = {
  hero:      { animation: 'rise', speed: 0.7,  autoplay: 5000, duration: 5000 },
  split:     { animation: 'rise', speed: 0.65, autoplay: 3500, duration: 5000 },
  thumbs:    { animation: 'rise', speed: 0.7,  autoplay: 0,    duration: 5000 },
  fade:      { animation: 'rise', speed: 0.9,  autoplay: 4000, duration: 5000 },
  vertical:  { animation: 'rise', speed: 0.7,  autoplay: 4500, duration: 5000 },
  center:    { animation: 'rise', speed: 0.55, autoplay: 0,    duration: 5000 },
  progress:  { animation: 'rise', speed: 0.8,  autoplay: 0,    duration: 5000 },
  text:      { animation: 'rise', speed: 0.55, autoplay: 5000, duration: 5000 },
  parallax:  { animation: 'rise', speed: 0.8,  autoplay: 5000, duration: 5000 },
  coverflow: { animation: 'rise', speed: 0.7,  autoplay: 5000, duration: 5000 }
};

function bsStarter(type) {
  var p = BS_PRESETS[type] || { animation: 'rise', speed: 0.7, autoplay: 0, duration: 5000 };
  return {
    type: type,
    animation: p.animation,
    transition: 'fade',
    speed: p.speed,
    autoplay: p.autoplay,
    duration: p.duration,
    antialias: 0.4,
    loop: true,
    arrows: null,
    dots: null,
    height: '',
    start: 0
  };
}

/* ---------- Фолбэк копирования без Clipboard API ---------- */
function bsFallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
}

/* ============================================================
   VUE-ПРИЛОЖЕНИЕ ВИТРИНЫ (монтируется в #sliderPlayground)
   ============================================================ */
function initSliderPlayground() {
  var root = document.getElementById('sliderPlayground');
  if (!root || typeof window.Vue === 'undefined') return;

  var app = window.Vue.createApp({

    data: function () {
      return {
        cfg: bsStarter('hero'),
        copied: false,
        reinitKey: 0
      };
    },

    computed: {

      /* Ключ от всех параметров: при изменении компонент пересоздаётся */
      renderKey: function () {
        var c = this.cfg;
        return [c.type, c.animation, c.transition, c.speed, c.autoplay, c.duration, c.antialias,
                c.loop, c.arrows, c.dots, c.height, c.start, this.reinitKey].join('|');
      },

      /* Атрибуты для <block-slider> */
      sliderAttrs: function () {
        var c = this.cfg;
        return {
          dataType: c.type,
          dataList: JSON.stringify(window.__t1_slider_demos[c.type] || []),
          dataAnimation: c.animation,
          dataTransition: c.transition,
          dataSpeed: c.speed,
          dataAutoplay: c.autoplay,
          dataDuration: c.duration,
          dataAntialias: c.antialias,
          dataLoop: c.loop,
          dataStart: c.start,
          dataHeight: c.height || undefined,
          dataArrows: c.arrows === null ? undefined : c.arrows,
          dataDots: c.dots === null ? undefined : c.dots
        };
      },

      typeInfo: function () {
        return window.__t1_type_info[this.cfg.type] || {};
      },

      anims: function () {
        return window.__t1_animations;
      },

      transitions: function () {
        return window.__t1_transitions;
      },

      types: function () {
        return window.__t1_type_info;
      },

      /* Готовый HTML для вставки в шаблон (многострочный, чтобы
         не требовался горизонтальный скролл на широких мониторах) */
      snippet: function () {
        var c = this.cfg;
        var list = window.__t1_slider_demos[c.type] || [];
        var parts = ['<block-slider'];
        var indent = '  ';
        parts.push(indent + 'data-type="' + c.type + '"');
        parts.push(indent + "data-list='" + JSON.stringify(list) + "'");
        parts.push(indent + 'data-speed="' + c.speed + '"');
        parts.push(indent + 'data-autoplay="' + c.autoplay + '"');
        if (c.type === 'progress') parts.push(indent + 'data-duration="' + c.duration + '"');
        parts.push(indent + 'data-animation="' + c.animation + '"');
        parts.push(indent + 'data-transition="' + c.transition + '"');
        parts.push(indent + 'data-antialias="' + c.antialias + '"');
        parts.push(indent + 'data-loop="' + c.loop + '"');
        if (c.start > 0) parts.push(indent + 'data-start="' + c.start + '"');
        if (c.height) parts.push(indent + 'data-height="' + c.height + '"');
        if (c.arrows !== null) parts.push(indent + 'data-arrows="' + c.arrows + '"');
        if (c.dots !== null) parts.push(indent + 'data-dots="' + c.dots + '"');
        parts.push('></block-slider>');
        return parts.join('\n');
      }
    },

    watch: {
      /* Смена типа — сам пресет-дефолт применяется только в момент
         «Сброс к дефолту типа». При переключении типа сохраняем
         все остальные выбранные параметры (анимация, скорость,
         автоплей и т.д.) — «параметры применяются ко всем типам». */
      'cfg.type': function (nv) {
        var cur = this.cfg;
        this.cfg = Object.assign({}, cur, { type: nv });
      }
    },

    methods: {

      reset: function () {
        this.cfg = bsStarter(this.cfg.type);
        this.copied = false;
      },

      reinit: function () {
        this.reinitKey++;
      },

      copy: function () {
        var vm = this;
        var text = this.snippet;
        var done = function () {
          vm.copied = true;
          setTimeout(function () { vm.copied = false; }, 1600);
        };
        if (window.navigator.clipboard && window.navigator.clipboard.writeText) {
          window.navigator.clipboard.writeText(text).then(done, function () {
            bsFallbackCopy(text);
            done();
          });
        } else {
          bsFallbackCopy(text);
          done();
        }
      }
    },

    template:
      '<div class="slider-playground">' +

        /* ---------- Панель параметров ---------- */
        '<div class="slider-config">' +

          '<div class="slider-config__field slider-config__field--wide">' +
            '<label for="cfg-type">Тип слайдера</label>' +
            '<select id="cfg-type" v-model="cfg.type">' +
              '<option v-for="(t, k) in types" :key="k" :value="k">{{ t.label }}</option>' +
            '</select>' +
          '</div>' +

          '<div class="slider-config__field slider-config__field--wide">' +
            '<label for="cfg-trans">Анимация перехода (data-transition)</label>' +
            '<select id="cfg-trans" v-model="cfg.transition">' +
              '<option v-for="t in transitions" :key="t.value" :value="t.value">{{ t.label }}</option>' +
            '</select>' +
          '</div>' +

          '<div class="slider-config__field slider-config__field--wide">' +
            '<label for="cfg-anim">Анимация контента (data-animation)</label>' +
            '<select id="cfg-anim" v-model="cfg.animation">' +
              '<option v-for="a in anims" :key="a" :value="a">{{ a }}</option>' +
            '</select>' +
          '</div>' +

          '<div class="slider-config__field">' +
            '<label for="cfg-speed">Скорость, с</label>' +
            '<input id="cfg-speed" type="number" min="0.1" step="0.05" v-model.number="cfg.speed">' +
          '</div>' +

          '<div class="slider-config__field">' +
            '<label for="cfg-autoplay">Автоплей, мс</label>' +
            '<input id="cfg-autoplay" type="number" min="0" step="500" v-model.number="cfg.autoplay">' +
          '</div>' +

          '<div v-if="cfg.type === \'progress\'" class="slider-config__field slider-config__field--wide">' +
            '<label for="cfg-duration">Длительность, мс</label>' +
            '<input id="cfg-duration" type="number" min="500" step="500" v-model.number="cfg.duration">' +
          '</div>' +

          '<div class="slider-config__field slider-config__field--wide">' +
            '<label for="cfg-antialias">Прозрачность неактивных: {{ cfg.antialias }}</label>' +
            '<input id="cfg-antialias" type="range" min="0" max="1" step="0.05" v-model.number="cfg.antialias">' +
          '</div>' +

          '<div class="slider-config__field">' +
            '<label for="cfg-arrows">Стрелки</label>' +
            '<select id="cfg-arrows" v-model="cfg.arrows">' +
              '<option :value="null">По умолчанию</option>' +
              '<option :value="true">Показать</option>' +
              '<option :value="false">Скрыть</option>' +
            '</select>' +
          '</div>' +

          '<div class="slider-config__field">' +
            '<label for="cfg-dots">Точки</label>' +
            '<select id="cfg-dots" v-model="cfg.dots">' +
              '<option :value="null">По умолчанию</option>' +
              '<option :value="true">Показать</option>' +
              '<option :value="false">Скрыть</option>' +
            '</select>' +
          '</div>' +

          '<div class="slider-config__field">' +
            '<label for="cfg-height">Высота блока, px</label>' +
            '<input id="cfg-height" type="number" min="120" step="10" placeholder="авто" v-model.number="cfg.height">' +
          '</div>' +

          '<div class="slider-config__field">' +
            '<label for="cfg-start">Стартовый слайд</label>' +
            '<input id="cfg-start" type="number" min="0" step="1" v-model.number="cfg.start">' +
          '</div>' +

          '<div class="slider-config__check">' +
            '<label><input type="checkbox" v-model="cfg.loop"> зацикливание</label>' +
          '</div>' +

          '<div class="slider-config__actions">' +
            '<p class="slider-config__type-info">{{ typeInfo.desc }}</p>' +
            '<div class="slider-config__btns">' +
              '<button type="button" class="btn btn-outline-primary" @click="reset">Сброс к дефолту типа</button>' +
              '<button type="button" class="btn btn-primary" @click="reinit">Переинициализировать</button>' +
            '</div>' +
          '</div>' +

        '</div>' +

        /* ---------- Демо-слайдер ---------- */
        '<div class="slider-playground__right">' +
          '<div class="slider-playground__demo">' +
            '<block-slider :key="renderKey" v-bind="sliderAttrs"></block-slider>' +
          '</div>' +

          /* ---------- HTML для вставки ---------- */
          '<div class="slider-snippet">' +
            '<div class="slider-snippet__head">' +
              '<h3 class="slider-snippet__title">HTML для вставки в шаблон</h3>' +
              '<button type="button" class="btn btn-secondary btn-sm" @click="copy">{{ copied ? \'Скопировано ✓\' : \'Копировать\' }}</button>' +
            '</div>' +
            '<code>{{ snippet }}</code>' +
          '</div>' +
        '</div>' +

      '</div>'
  });

  app.component('block-slider', window.BlockSlider);
  app.mount(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSliderPlayground);
} else {
  initSliderPlayground();
}