/* ============================================================
   templates/t1/js/preview/text_block_builder.js
   Конструктор текстовых блоков для preview-страницы
   text_block_builder.html.

   Пользователь задаёт параметры (тип блока, заливку, текст,
   структуру) — блок сразу рендерится, а под ним в <pre> выводится
   готовый HTML-код вставки. Кнопка «Копировать» кладёт код в буфер.

   ЕДИНЫЙ ИСТОЧНИК ПРАВДЫ: превью и сниппет строятся из одной
   строки html (computed), поэтому «что видишь — то и скопируешь».
   Текстовые поля экранируются (tbEsc), чужие HTML-теги не попадают
   ни в превью (v-html), ни в код.

   Стили блоков (.block, .block--fill-*, .block--anim-*, .tb-*) —
   в общем css/style.css; стили самого воркбенча — inline в странице.
   Демо-данные: window.__t1_tb_demos (можно подменять из консоли).
   ============================================================ */

/* ---------- Демо-данные (содержимое повторяющихся пунктов) ---------- */
window.__t1_tb_demos = window.__t1_tb_demos || {
  li: [
    'Точки, отступы и межстрочный интервал настраиваются токенами темы',
    'Список наследует цвет текста заливки: работает и на тёмном фоне',
    'Внутри списка допустимы ссылки и жирные акценты'
  ],
  feature: [
    { icon: 'truck',   emoji: '🚚', title: 'Быстрая доставка', text: 'Курьер по городу за день, в регионы — от двух дней. Пункты выдачи в каждом районе.' },
    { icon: 'shield',  emoji: '🛡️', title: 'Гарантия качества', text: 'Официальная гарантия производителя и расширенная гарантия магазина до 2 лет.' },
    { icon: 'tag',     emoji: '💰', title: 'Честные цены', text: 'Цены без скрытых наценок, регулярные акции и бонусная программа для постоянных клиентов.' },
    { icon: 'refresh', emoji: '🔁', title: 'Лёгкий возврат', text: '14 дней на возврат без объяснений. Оформим возврат в один клик в личном кабинете.' },
    { icon: 'star',    emoji: '⭐', title: 'Проверенные товары', text: 'Каждая позиция проходит входной контроль, а отзывы пишут только покупатели с заказом.' },
    { icon: 'chat',    emoji: '💬', title: 'Поддержка 24/7', text: 'Чат на сайте и горячая линия работают круглосуточно, среднее время ответа — 2 минуты.' }
  ],
  stats: [
    { num: '12',      label: 'лет на рынке электроники' },
    { num: '850 000', label: 'заказов доставлено' },
    { num: '4.9',     label: 'средний рейтинг сервиса' },
    { num: '24/7',    label: 'поддержка без выходных' }
  ],
  steps: [
    { title: 'Оставьте заявку',   text: 'Выберите товар на сайте или позвоните — заявка занимает пару минут.' },
    { title: 'Заберём товар',     text: 'Курьер приедет в удобное время или вы заберёте заказ в пункте выдачи.' },
    { title: 'Проверим и настроим', text: 'Диагностика, прошивка и финальная проверка перед выдачей клиенту.' },
    { title: 'Доставим обратно',  text: 'Готовый заказ вернём курьером — с гарантией на все работы.' }
  ],
  faq: [
    { q: 'Как оформить заказ на сайте?', a: 'Добавьте товары в корзину, укажите адрес и способ доставки, выберите оплату и подтвердите заказ. Мы пришлём письмо с номером заказа.' },
    { q: 'Сколько стоит и сколько идёт доставка?', a: 'По городу — 1–2 дня, в регионы — от 2 до 7 дней. Стоимость считается при оформлении; при заказе от 5 000 ₽ доставка бесплатная.' },
    { q: 'Можно ли вернуть товар?', a: 'Да, в течение 14 дней с момента получения, если товар не использовался и сохранена упаковка. Возврат оформляется в личном кабинете.' },
    { q: 'Как отследить заказ?', a: 'Статус обновляется в личном кабинете, дополнительно мы отправляем SMS на каждом этапе — от сборки до передачи курьеру.' },
    { q: 'Есть ли гарантия на ремонт и аксессуары?', a: 'Официальная гарантия производителя — от 6 месяцев, расширенная гарантия магазина — до 2 лет на электронику.' }
  ],
  cards: [
    { title: 'Сервис и ремонт', text: 'Авторизованный сервис-центр: диагностика за 1 день, оригинальные запчасти и гарантия на работы до года.' },
    { title: 'Трейд-ин', text: 'Сдайте старую технику в зачёт покупки: оценим онлайн по фото и добавим сумму к скидке на новый товар.' },
    { title: 'Подписка на обзоры', text: 'Раз в неделю — подборки новинок, честные сравнения и промокоды для подписчиков. Без спама.' }
  ],
  article: [
    { id: 'sec-1', title: 'Базовый контейнер', text: 'Каждый текстовый блок оборачивается в .block с выбранной заливкой. Внутри — любая типографика .tb-prose: заголовки, лид, списки и выноски.' },
    { id: 'sec-2', title: 'Сетка и адаптив', text: 'На десктопе — колонка текста и колонка оглавления 300px. Ниже 992px оглавление уходит под статью и теряет sticky.' },
    { id: 'sec-3', title: 'Работа с темами', text: 'Цвет ссылок, подсветки и рамок — только токены. Блок перекрашивается вместе с цветовой схемой страницы.' },
    { id: 'sec-4', title: 'Контент и медиа', text: 'Внутри статьи допустимы картинки, таблицы и выноски. Отступы нормализованы, у медиа включено max-width: 100%.' }
  ],
  logos: ['NOVA', 'AZUR', 'VERTA', 'KRON', 'LUMEN', 'ORBIT'],
  charts: [
    { kind: 'bar',   title: 'Столбчатый — выручка по кварталам, млн ₽' },
    { kind: 'line',  title: 'Линейный — динамика по годам, млрд ₽' },
    { kind: 'donut', title: 'Кольцевой — структура выручки' }
  ]
};

/* ---------- Справочник типов (для панели) ---------- */
window.__t1_tb_types = window.__t1_tb_types || {
  prose:   { label: 'Текст (раздел)', desc: '.tb-prose: заголовок h2, лид-абзац, основной текст, списки и выноска blockquote. Универсальная типографика раздела.' },
  split:   { label: 'Текст + изображение', desc: '.tb-split: две колонки — медиа-заглушка слева (или справа через .tb-split--rev) и текст с кнопкой.' },
  feature: { label: 'Преимущества', desc: '.tb-feature: карточки с иконками SVG из спрайта или эмодзи, 3–6 штук. Колонки — через --tb-cols.' },
  stats:   { label: 'Статистика', desc: '.tb-stats: крупные числа в ряд (2 или 4), на мобильном — сетка 2×2. На акцентной заливке числа светлые.' },
  quote:   { label: 'Цитата / отзыв', desc: '.tb-quote: текст отзыва, аватар-заглушка, имя и должность. Хорошо смотрится на мягкой и акцентной заливках.' },
  steps:   { label: 'Шаги / процесс', desc: '.tb-steps: шаги с номерами 01–04 и соединительной линией; на мобильном — вертикальный список с линией слева.' },
  cta:     { label: 'CTA-баннер', desc: '.tb-cta: заголовок, текст и кнопка .btn-white. Классика — акцентная (градиент) или тёмная заливка.' },
  faq:     { label: 'FAQ-аккордеон', desc: '.tb-faq на <details>/<summary>: раскрытие без JavaScript, плавная анимация панели, иконка «+» → «×».' },
  cards:   { label: 'Карточки', desc: '.tb-cards: карточки с заголовком, текстом и ссылкой. Hover-подъём и стрелка «Подробнее →».' },
  article: { label: 'Статья + оглавление', desc: '.tb-article: статья .tb-prose и sticky-оглавление .tb-toc на якорях (подсветка :target).' },
  logos:   { label: 'Лента логотипов', desc: '.tb-logos: полоса партнёров — серыми SVG-заглушками, цвет проявляется на hover.' },
  chart:   { label: 'Графики', desc: '.tb-chart: SVG-графики без JS — столбчатый, линейный и кольцевой. Карточки .tb-chart__item и легенда .tb-chart__legend; цвета — токены темы (--tb-brand/--tb-accent/--tb-alt).' }
};

/* ---------- Пресеты параметров по типам (кнопка «Сброс к дефолту типа») ---------- */
var TB_PRESETS = {
  prose:   { theme: 'fill-1', anim: '', bleed: false, eyebrow: 'Раздел 01 · О компании', title: 'Заголовок раздела',
             leadOn: true, lead: 'Лид-абзац: одно-два вводных предложения, которые читают первыми.',
             p1: 'Абзац основного текста: расскажите о компании, услугах или товаре спокойно и по делу.',
             list: true, quote: true, quoteText: 'Выноска blockquote внутри текста — для цитат, важных замечаний и предупреждений.' },
  split:   { theme: 'fill-1', anim: '', bleed: false, rev: false, eyebrow: 'Возможность', title: 'Текст рядом с изображением',
             lead: 'Классическая компоновка «картинка слева — текст справа» для продающих разделов.',
             p1: 'Вместо заглушки вставьте свой <img> или фон: структура и отступы не изменятся.',
             btnText: 'Подробнее', btnUrl: '/catalog' },
  feature: { theme: 'fill-1', anim: '', bleed: false, cols: 3, iconMode: 'svg', count: 6 },
  stats:   { theme: 'fill-1', anim: '', bleed: false, count: 4 },
  quote:   { theme: 'fill-3', anim: '', bleed: false, text: '«Заказала ноутбук вечером, курьер привёз уже на следующий день. Отдельное спасибо за упаковку и оплату при получении».',
             name: 'Анна Смирнова', role: 'постоянный покупатель, Москва' },
  steps:   { theme: 'fill-1', anim: '', bleed: false, count: 4 },
  cta:     { theme: 'fill-4', anim: '', bleed: false, eyebrow: 'Выгодное предложение', title: '−20% на все гаджеты до конца недели',
             text: 'Скидка применяется автоматически в корзине. Количество акционных товаров ограничено.',
             btnText: 'Смотреть акции', btnUrl: '/catalog' },
  faq:     { theme: 'fill-1', anim: '', bleed: false, count: 5, firstOpen: true },
  cards:   { theme: 'fill-1', anim: '', bleed: false, cols: 3, linkText: 'Подробнее' },
  article: { theme: 'fill-1', anim: '', bleed: false, sections: 4, toc: true },
  logos:   { theme: 'fill-2', anim: '', bleed: false, count: 6 },
  chart:   { theme: 'fill-1', anim: '', bleed: false, count: 3 }
};

function tbStarter(type) {
  var p = TB_PRESETS[type] || TB_PRESETS.prose;
  var cfg = { type: type };
  Object.keys(p).forEach(function (k) { cfg[k] = p[k]; });
  return cfg;
}

/* ---------- Экранирование текста пользователя (безопасно для v-html) ---------- */
function tbEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Фолбэк копирования без Clipboard API ---------- */
function tbFallbackCopy(text) {
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
   VUE-ПРИЛОЖЕНИЕ КОНСТРУКТОРА (монтируется в #textBlockBuilder)
   ============================================================ */
function initTextBlockBuilder() {
  var root = document.getElementById('textBlockBuilder');
  if (!root || typeof window.Vue === 'undefined') return;

  var app = window.Vue.createApp({

    data: function () {
      return {
        cfg: tbStarter('prose'),
        copied: false,
        /* Варианты анимации появления (.block--anim-*) */
        anims: [
          { v: '',            label: 'Появление движением (дефолт)' },
          { v: 'anim-zoom',   label: 'Плавное увеличение (.block--anim-zoom)' },
          { v: 'anim-clip',   label: 'Проявление снизу (.block--anim-clip)' },
          { v: 'no-anim',     label: 'Без анимации (.block--no-anim)' }
        ]
      };
    },

    computed: {

      types: function () {
        return window.__t1_tb_types;
      },

      themes: function () {
        return [
          { v: 'fill-1', label: 'Слот 1 · карточка (.block--fill-1)' },
          { v: 'fill-2', label: 'Слот 2 · плашка (.block--fill-2)' },
          { v: 'fill-3', label: 'Слот 3 · выноска (.block--fill-3)' },
          { v: 'fill-4', label: 'Слот 4 · акцент-градиент (.block--fill-4)' },
          { v: 'fill-5', label: 'Слот 5 · тёмная лента (.block--fill-5)' }
        ];
      },

      typeInfo: function () {
        return window.__t1_tb_types[this.cfg.type] || {};
      },

      /* Единственный источник: превью (v-html) и код в <pre> */
      html: function () {
        return this.buildHtml(this.cfg);
      }
    },

    watch: {
      /* Смена типа показывает «канонический» пример этого типа:
         параметры берутся из его пресета. Тонкая настройка остаётся
         за пользователем прямо в рамках выбранного типа, а вернуться
         к дефолту можно кнопкой «Сброс к дефолту типа». Выбранная
         анимация появления сохраняется между типами. */
      'cfg.type': function (nv) {
        var anim = this.cfg.anim;
        this.cfg = tbStarter(nv);
        this.cfg.anim = anim;
        this.copied = false;
      }
    },

    methods: {

      reset: function () {
        this.cfg = tbStarter(this.cfg.type);
        this.copied = false;
      },

      copy: function () {
        var vm = this;
        var done = function () {
          vm.copied = true;
          setTimeout(function () { vm.copied = false; }, 1600);
        };
        if (window.navigator.clipboard && window.navigator.clipboard.writeText) {
          window.navigator.clipboard.writeText(vm.html).then(done, function () {
            tbFallbackCopy(vm.html);
            done();
          });
        } else {
          tbFallbackCopy(vm.html);
          done();
        }
      },

      /* ---------- Генерация HTML блока по cfg ---------- */
      featSvg: function (id) {
        return '<span class="tb-feature__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><use href="#i-dev-' + id + '"/></svg></span>';
      },
      featEmo: function (e) {
        return '<span class="tb-feature__icon tb-feature__icon--emoji">' + e + '</span>';
      },
      logo: function (name, n) {
        return '<span class="tb-logo tb-logo--' + n + '" role="img" aria-label="' + tbEsc(name) + '">' +
          '<svg viewBox="0 0 150 56" role="img" aria-hidden="true">' +
          '<rect x="4" y="16" width="24" height="24" rx="7" fill="currentColor"/>' +
          '<path d="M10 34V22l12 12V22" stroke="var(--white)" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<text x="36" y="34" font-size="17" font-weight="800" letter-spacing="1.5" fill="currentColor">' + tbEsc(name) + '</text>' +
          '</svg></span>';
      },

      /* ---------- SVG-графики для типа «Графики» ---------- */
      chartSvg: function (kind) {
        if (kind === 'bar') {
          return '<svg class="tb-chart__chart" viewBox="0 0 300 150" role="img" aria-label="Столбчатый график">' +
            '<g fill="var(--tb-brand, var(--primary))">' +
            '<rect x="26" y="86" width="26" height="34" rx="4"></rect>' +
            '<rect x="68" y="68" width="26" height="52" rx="4"></rect>' +
            '<rect x="110" y="46" width="26" height="74" rx="4"></rect>' +
            '<rect x="152" y="62" width="26" height="58" rx="4"></rect>' +
            '<rect x="194" y="34" width="26" height="86" rx="4"></rect>' +
            '<rect x="236" y="18" width="26" height="102" rx="4"></rect>' +
            '</g>' +
            '<line x1="16" y1="120" x2="284" y2="120" stroke="var(--tb-muted, var(--muted))" stroke-opacity="0.35" stroke-width="1"></line>' +
            '</svg>' +
            '<ul class="tb-chart__legend"><li><i></i>Q1</li><li><i></i>Q2</li><li><i></i>Q3</li><li><i></i>Q4</li></ul>';
        }
        if (kind === 'donut') {
          return '<svg class="tb-chart__chart" viewBox="0 0 150 150" role="img" aria-label="Кольцевой график">' +
            '<circle cx="75" cy="75" r="52" fill="none" stroke="var(--tb-track, color-mix(in srgb, var(--tb-brand, var(--primary)) 14%, transparent))" stroke-width="22"></circle>' +
            '<circle cx="75" cy="75" r="52" fill="none" stroke="var(--tb-brand, var(--primary))" stroke-width="22" stroke-dasharray="145 252" stroke-dashoffset="25" transform="rotate(-90 75 75)"></circle>' +
            '<circle cx="75" cy="75" r="52" fill="none" stroke="var(--tb-accent, var(--secondary))" stroke-width="22" stroke-dasharray="80 317" stroke-dashoffset="190" transform="rotate(-90 75 75)"></circle>' +
            '<circle cx="75" cy="75" r="52" fill="none" stroke="var(--tb-alt, var(--success))" stroke-width="22" stroke-dasharray="128 269" stroke-dashoffset="110" transform="rotate(-90 75 75)"></circle>' +
            '</svg>' +
            '<ul class="tb-chart__legend">' +
            '<li style="--c: var(--tb-brand, var(--primary))"><i></i>Онлайн · 41%</li>' +
            '<li style="--c: var(--tb-accent, var(--secondary))"><i></i>Розница · 36%</li>' +
            '<li style="--c: var(--tb-alt, var(--success))"><i></i>B2B · 23%</li>' +
            '</ul>';
        }
        // line (по умолчанию)
        return '<svg class="tb-chart__chart" viewBox="0 0 300 150" role="img" aria-label="Линейный график">' +
          '<polyline points="28,118 74,96 120,84 166,58 212,30 258,16" fill="none" stroke="var(--tb-brand, var(--primary))" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>' +
          '<g fill="var(--tb-brand, var(--primary))">' +
          '<circle cx="28" cy="118" r="4"></circle><circle cx="74" cy="96" r="4"></circle>' +
          '<circle cx="120" cy="84" r="4"></circle><circle cx="166" cy="58" r="4"></circle>' +
          '<circle cx="212" cy="30" r="4"></circle><circle cx="258" cy="16" r="4"></circle>' +
          '</g>' +
          '<line x1="16" y1="120" x2="284" y2="120" stroke="var(--tb-muted, var(--muted))" stroke-opacity="0.35" stroke-width="1"></line>' +
          '</svg>' +
          '<ul class="tb-chart__legend"><li><i></i>2021</li><li><i></i>2022</li><li><i></i>2023</li><li><i></i>2024</li><li><i></i>2025</li></ul>';
      },

      buildHtml: function (c) {
        var D = window.__t1_tb_demos;
        var L = [];
        var open = '<div class="block block--' + c.theme + (c.bleed ? ' block--bleed' : '') + (c.anim ? ' block--' + c.anim : '') + '"';
        var cols = (c.type === 'feature' || c.type === 'cards') && c.cols && c.cols !== 3
          ? ' style="--tb-cols: ' + c.cols + '"'
          : '';
        open += cols + '>';
        L.push(open);

        if (c.type === 'prose') {
          if (c.eyebrow) L.push('  <span class="tb-eyebrow">' + tbEsc(c.eyebrow) + '</span>');
          L.push('  <div class="tb-prose">');
          if (c.title) L.push('    <h2>' + tbEsc(c.title) + '</h2>');
          if (c.leadOn && c.lead) L.push('    <p class="tb-lead">' + tbEsc(c.lead) + '</p>');
          if (c.p1) L.push('    <p>' + tbEsc(c.p1) + '</p>');
          if (c.list) {
            L.push('    <ul>');
            D.li.forEach(function (li) { L.push('      <li>' + tbEsc(li) + '</li>'); });
            L.push('    </ul>');
          }
          if (c.quote) L.push('    <blockquote>' + tbEsc(c.quoteText || '') + '</blockquote>');
          L.push('  </div>');
        }

        if (c.type === 'split') {
          L.push('  <div class="tb-split' + (c.rev ? ' tb-split--rev' : '') + '">');
          L.push('    <div class="tb-split__media"><svg class="tb-split__media-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><use href="#i-dev-image"/></svg></div>');
          L.push('    <div class="tb-split__body">');
          if (c.eyebrow) L.push('      <span class="tb-eyebrow">' + tbEsc(c.eyebrow) + '</span>');
          L.push('      <div class="tb-prose">');
          if (c.title) L.push('        <h2>' + tbEsc(c.title) + '</h2>');
          if (c.lead) L.push('        <p class="tb-lead">' + tbEsc(c.lead) + '</p>');
          if (c.p1) L.push('        <p>' + tbEsc(c.p1) + '</p>');
          L.push('      </div>');
          if (c.btnText) L.push('      <a class="btn btn-primary" href="' + tbEsc(c.btnUrl || '#') + '">' + tbEsc(c.btnText) + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="#i-dev-arrow"/></svg></a>');
          L.push('    </div>');
          L.push('  </div>');
        }

        if (c.type === 'feature') {
          L.push('  <div class="tb-feature">');
          D.feature.slice(0, c.count || 3).forEach(function (f) {
            L.push('    <div class="tb-feature__item">');
            L.push('      ' + (c.iconMode === 'emoji' ? this.featEmo(f.emoji) : this.featSvg(f.icon)));
            L.push('      <h3 class="tb-feature__title">' + tbEsc(f.title) + '</h3>');
            L.push('      <p class="tb-feature__text">' + tbEsc(f.text) + '</p>');
            L.push('    </div>');
          }, this);
          L.push('  </div>');
        }

        if (c.type === 'stats') {
          L.push('  <div class="tb-stats">');
          D.stats.slice(0, c.count || 4).forEach(function (s) {
            L.push('    <div class="tb-stats__item"><span class="tb-stats__num">' + tbEsc(s.num) + '</span><span class="tb-stats__label">' + tbEsc(s.label) + '</span></div>');
          });
          L.push('  </div>');
        }

        if (c.type === 'quote') {
          L.push('  <div class="tb-quote">');
          L.push('    <span class="tb-quote__avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><use href="#i-dev-user"/></svg></span>');
          L.push('    <div class="tb-quote__body">');
          if (c.text) L.push('      <p class="tb-quote__text">' + tbEsc(c.text) + '</p>');
          L.push('      <cite class="tb-quote__cite"><span class="tb-quote__name">' + tbEsc(c.name || '') + '</span><span class="tb-quote__role">' + tbEsc(c.role || '') + '</span></cite>');
          L.push('    </div>');
          L.push('  </div>');
        }

        if (c.type === 'steps') {
          L.push('  <div class="tb-steps">');
          D.steps.slice(0, c.count || 4).forEach(function (s, i) {
            L.push('    <div class="tb-steps__item">');
            L.push('      <span class="tb-steps__num">0' + (i + 1) + '</span>');
            L.push('      <h3 class="tb-steps__title">' + tbEsc(s.title) + '</h3>');
            L.push('      <p class="tb-steps__text">' + tbEsc(s.text) + '</p>');
            L.push('    </div>');
          });
          L.push('  </div>');
        }

        if (c.type === 'cta') {
          L.push('  <div class="tb-cta">');
          if (c.eyebrow) L.push('    <span class="tb-eyebrow">' + tbEsc(c.eyebrow) + '</span>');
          if (c.title) L.push('    <h2 class="tb-cta__title">' + tbEsc(c.title) + '</h2>');
          if (c.text) L.push('    <p class="tb-cta__text">' + tbEsc(c.text) + '</p>');
          if (c.btnText) L.push('    <a class="btn btn-white" href="' + tbEsc(c.btnUrl || '#') + '">' + tbEsc(c.btnText) + ' <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="#i-dev-arrow"/></svg></a>');
          L.push('  </div>');
        }

        if (c.type === 'faq') {
          L.push('  <div class="tb-faq">');
          D.faq.slice(0, c.count || 3).forEach(function (f, i) {
            L.push('    <details' + (i === 0 && c.firstOpen ? ' open' : '') + '>');
            L.push('      <summary>' + tbEsc(f.q) + '</summary>');
            L.push('      <div class="tb-faq__panel"><div class="tb-faq__content">' + tbEsc(f.a) + '</div></div>');
            L.push('    </details>');
          });
          L.push('  </div>');
        }

        if (c.type === 'cards') {
          L.push('  <div class="tb-cards">');
          D.cards.slice(0, c.cols || 3).forEach(function (card) {
            L.push('    <div class="tb-card">');
            L.push('      <h3 class="tb-card__title">' + tbEsc(card.title) + '</h3>');
            L.push('      <p class="tb-card__text">' + tbEsc(card.text) + '</p>');
            L.push('      <a class="tb-card__link" href="#">' + tbEsc(c.linkText || 'Подробнее') + ' <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><use href="#i-dev-arrow"/></svg></a>');
            L.push('    </div>');
          });
          L.push('  </div>');
        }

        if (c.type === 'article') {
          var secs = D.article.slice(0, c.sections || 2);
          L.push('  <div class="tb-article">');
          L.push('    <div class="tb-prose">');
          L.push('      <h2>Статья с оглавлением</h2>');
          L.push('      <p class="tb-lead">Один контейнер .tb-article, две колонки и нативные якоря: оглавление собирается из заголовков статьи.</p>');
          secs.forEach(function (s) {
            L.push('      <h3 class="tb-anchor" id="' + tbEsc(s.id) + '">' + tbEsc(s.title) + '</h3>');
            L.push('      <p>' + tbEsc(s.text) + '</p>');
          });
          L.push('    </div>');
          if (c.toc) {
            L.push('    <aside class="tb-article__side">');
            L.push('      <nav class="tb-toc">');
            L.push('        <div class="tb-toc__title">На этой странице</div>');
            L.push('        <ul class="tb-toc__list">');
            secs.forEach(function (s) {
              L.push('          <li><a class="tb-toc__link" href="#' + tbEsc(s.id) + '">' + tbEsc(s.title) + '</a></li>');
            });
            L.push('        </ul>');
            L.push('      </nav>');
            L.push('    </aside>');
          }
          L.push('  </div>');
        }

        if (c.type === 'logos') {
          L.push('  <div class="tb-logos">');
          D.logos.slice(0, c.count || 4).forEach(function (name, i) {
            L.push('    ' + this.logo(name, i + 1));
          }, this);
          L.push('  </div>');
        }

        if (c.type === 'chart') {
          L.push('  <div class="tb-chart">');
          D.charts.slice(0, c.count || 3).forEach(function (ch) {
            L.push('    <div class="tb-chart__item">');
            L.push('      <h3 class="tb-chart__title">' + tbEsc(ch.title) + '</h3>');
            L.push('      ' + this.chartSvg(ch.kind));
            L.push('    </div>');
          }, this);
          L.push('  </div>');
        }

        L.push('</div>');
        return L.join('\n');
      }
    },

    template:
      '<div class="tbc-playground">' +

        /* ---------- Панель параметров ---------- */
        '<div class="tbc-config">' +

          '<div class="tbc-field tbc-field--wide">' +
            '<label for="tbc-type">Тип блока</label>' +
            '<select id="tbc-type" v-model="cfg.type">' +
              '<option v-for="(t, k) in types" :key="k" :value="k">{{ t.label }}</option>' +
            '</select>' +
          '</div>' +

          '<div class="tbc-field tbc-field--wide">' +
            '<label for="tbc-theme">Фоновая заливка</label>' +
            '<select id="tbc-theme" v-model="cfg.theme">' +
              '<option v-for="th in themes" :key="th.v" :value="th.v">{{ th.label }}</option>' +
            '</select>' +
          '</div>' +

          '<div class="tbc-field tbc-field--wide">' +
            '<label for="tbc-anim">Анимация появления</label>' +
            '<select id="tbc-anim" v-model="cfg.anim">' +
              '<option v-for="an in anims" :key="an.v" :value="an.v">{{ an.label }}</option>' +
            '</select>' +
          '</div>' +

          '<div class="tbc-field tbc-field--wide tbc-check">' +
            '<label><input type="checkbox" v-model="cfg.bleed"> блок на всю ширину (.block--bleed)</label>' +
          '</div>' +

          /* ----- Тип 1: Текст ----- */
          '<template v-if="cfg.type === \'prose\'">' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-p-eyebrow">Надзаголовок (.tb-eyebrow)</label><input id="tbc-p-eyebrow" type="text" v-model="cfg.eyebrow"></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-p-title">Заголовок (h2)</label><input id="tbc-p-title" type="text" v-model="cfg.title"></div>' +
            '<div class="tbc-field tbc-field--wide tbc-check"><label><input type="checkbox" v-model="cfg.leadOn"> лид-абзац (.tb-lead)</label></div>' +
            '<div v-if="cfg.leadOn" class="tbc-field tbc-field--wide"><label for="tbc-p-lead">Лид-абзац</label><textarea id="tbc-p-lead" rows="2" v-model="cfg.lead"></textarea></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-p-p1">Основной абзац</label><textarea id="tbc-p-p1" rows="2" v-model="cfg.p1"></textarea></div>' +
            '<div class="tbc-field tbc-field--wide tbc-check"><label><input type="checkbox" v-model="cfg.list"> маркированный список (3 пункта из демо)</label></div>' +
            '<div class="tbc-field tbc-field--wide tbc-check"><label><input type="checkbox" v-model="cfg.quote"> выноска blockquote</label></div>' +
            '<div v-if="cfg.quote" class="tbc-field tbc-field--wide"><label for="tbc-p-quote">Текст выноски</label><textarea id="tbc-p-quote" rows="2" v-model="cfg.quoteText"></textarea></div>' +
          '</template>' +

          /* ----- Тип 2: Текст + изображение ----- */
          '<template v-if="cfg.type === \'split\'">' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-s-side">Изображение</label><select id="tbc-s-side" v-model="cfg.rev"><option :value="false">Слева</option><option :value="true">Справа (.tb-split--rev)</option></select></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-s-eyebrow">Надзаголовок</label><input id="tbc-s-eyebrow" type="text" v-model="cfg.eyebrow"></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-s-title">Заголовок (h2)</label><input id="tbc-s-title" type="text" v-model="cfg.title"></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-s-lead">Лид-абзац</label><textarea id="tbc-s-lead" rows="2" v-model="cfg.lead"></textarea></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-s-p1">Абзац</label><textarea id="tbc-s-p1" rows="2" v-model="cfg.p1"></textarea></div>' +
            '<div class="tbc-field"><label for="tbc-s-btn">Кнопка, текст</label><input id="tbc-s-btn" type="text" v-model="cfg.btnText"></div>' +
            '<div class="tbc-field"><label for="tbc-s-url">Кнопка, href</label><input id="tbc-s-url" type="text" v-model="cfg.btnUrl"></div>' +
          '</template>' +

          /* ----- Тип 3: Преимущества ----- */
          '<template v-if="cfg.type === \'feature\'">' +
            '<div class="tbc-field"><label for="tbc-f-cols">Колонок --tb-cols</label><select id="tbc-f-cols" v-model.number="cfg.cols"><option :value="2">2</option><option :value="3">3</option><option :value="4">4</option></select></div>' +
            '<div class="tbc-field"><label for="tbc-f-n">Карточек</label><select id="tbc-f-n" v-model.number="cfg.count"><option :value="3">3 из 6</option><option :value="6">6</option></select></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-f-icon">Иконки</label><select id="tbc-f-icon" v-model="cfg.iconMode"><option value="svg">SVG из спрайта (#i-*), цвет currentColor</option><option value="emoji">Эмодзи (.tb-feature__icon--emoji)</option></select></div>' +
          '</template>' +

          /* ----- Тип 4: Статистика ----- */
          '<template v-if="cfg.type === \'stats\'">' +
            '<div class="tbc-field"><label for="tbc-t-n">Чисел</label><select id="tbc-t-n" v-model.number="cfg.count"><option :value="2">2</option><option :value="4">4</option></select></div>' +
          '</template>' +

          /* ----- Тип 5: Цитата ----- */
          '<template v-if="cfg.type === \'quote\'">' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-q-text">Текст отзыва</label><textarea id="tbc-q-text" rows="3" v-model="cfg.text"></textarea></div>' +
            '<div class="tbc-field"><label for="tbc-q-name">Имя</label><input id="tbc-q-name" type="text" v-model="cfg.name"></div>' +
            '<div class="tbc-field"><label for="tbc-q-role">Должность</label><input id="tbc-q-role" type="text" v-model="cfg.role"></div>' +
          '</template>' +

          /* ----- Тип 6: Шаги ----- */
          '<template v-if="cfg.type === \'steps\'">' +
            '<div class="tbc-field"><label for="tbc-st-n">Шагов</label><select id="tbc-st-n" v-model.number="cfg.count"><option :value="3">3</option><option :value="4">4</option></select></div>' +
          '</template>' +

          /* ----- Тип 7: CTA ----- */
          '<template v-if="cfg.type === \'cta\'">' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-c-eyebrow">Надзаголовок</label><input id="tbc-c-eyebrow" type="text" v-model="cfg.eyebrow"></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-c-title">Заголовок</label><textarea id="tbc-c-title" rows="2" v-model="cfg.title"></textarea></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-c-text">Текст</label><textarea id="tbc-c-text" rows="2" v-model="cfg.text"></textarea></div>' +
            '<div class="tbc-field"><label for="tbc-c-btn">Кнопка, текст</label><input id="tbc-c-btn" type="text" v-model="cfg.btnText"></div>' +
            '<div class="tbc-field"><label for="tbc-c-url">Кнопка, href</label><input id="tbc-c-url" type="text" v-model="cfg.btnUrl"></div>' +
          '</template>' +

          /* ----- Тип 8: FAQ ----- */
          '<template v-if="cfg.type === \'faq\'">' +
            '<div class="tbc-field"><label for="tbc-fa-n">Вопросов</label><select id="tbc-fa-n" v-model.number="cfg.count"><option :value="3">3</option><option :value="5">5</option></select></div>' +
            '<div class="tbc-field tbc-field--wide tbc-check"><label><input type="checkbox" v-model="cfg.firstOpen"> первый вопрос открыт (details open)</label></div>' +
          '</template>' +

          /* ----- Тип 9: Карточки ----- */
          '<template v-if="cfg.type === \'cards\'">' +
            '<div class="tbc-field"><label for="tbc-cd-cols">Колонок --tb-cols</label><select id="tbc-cd-cols" v-model.number="cfg.cols"><option :value="2">2</option><option :value="3">3</option></select></div>' +
            '<div class="tbc-field tbc-field--wide"><label for="tbc-cd-link">Текст ссылки</label><input id="tbc-cd-link" type="text" v-model="cfg.linkText"></div>' +
          '</template>' +

          /* ----- Тип 10: Статья ----- */
          '<template v-if="cfg.type === \'article\'">' +
            '<div class="tbc-field"><label for="tbc-a-n">Секций</label><select id="tbc-a-n" v-model.number="cfg.sections"><option :value="2">2</option><option :value="4">4</option></select></div>' +
            '<div class="tbc-field tbc-field--wide tbc-check"><label><input type="checkbox" v-model="cfg.toc"> боковое оглавление (.tb-toc)</label></div>' +
          '</template>' +

          /* ----- Тип 11: Логотипы ----- */
          '<template v-if="cfg.type === \'logos\'">' +
            '<div class="tbc-field"><label for="tbc-l-n">Логотипов</label><select id="tbc-l-n" v-model.number="cfg.count"><option :value="4">4 из 6</option><option :value="6">6</option></select></div>' +
          '</template>' +

          /* ----- Тип 12: Графики ----- */
          '<template v-if="cfg.type === \'chart\'">' +
            '<div class="tbc-field"><label for="tbc-ch-n">Графиков</label><select id="tbc-ch-n" v-model.number="cfg.count"><option :value="2">2 из 3</option><option :value="3">3</option></select></div>' +
          '</template>' +

          '<div class="tbc-field tbc-field--wide tbc-actions">' +
            '<p class="tbc-type-info">{{ typeInfo.desc }}</p>' +
            '<div class="tbc-btns">' +
              '<button type="button" class="btn btn-outline btn-sm" @click="reset">Сброс к дефолту типа</button>' +
              '<button type="button" class="btn btn-primary btn-sm" @click="copy">{{ copied ? \'Скопировано ✓\' : \'Копировать HTML\' }}</button>' +
            '</div>' +
          '</div>' +

        '</div>' +

        /* ---------- Демо-превью + HTML ---------- */
        '<div class="tbc-right">' +
          '<div class="tbc-demo" v-html="html"></div>' +
          '<div class="tbc-snippet">' +
            '<div class="tbc-snippet__head">' +
              '<h3 class="tbc-snippet__title">HTML для вставки в шаблон</h3>' +
              '<button type="button" class="btn btn-secondary btn-sm" @click="copy">{{ copied ? \'Скопировано ✓\' : \'Копировать\' }}</button>' +
            '</div>' +
            '<pre class="tbc-snippet__pre"><code>{{ html }}</code></pre>' +
          '</div>' +
        '</div>' +

      '</div>'
  });

  app.mount(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTextBlockBuilder);
} else {
  initTextBlockBuilder();
}