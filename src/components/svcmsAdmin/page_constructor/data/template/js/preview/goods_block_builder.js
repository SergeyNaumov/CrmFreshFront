/* ============================================================
   Файл: templates/t1/js/preview/goods_block_builder.js
   Конструктор товарных блоков <goods-block> (preview/good_blocks.html).

   Пользователь задаёт параметры (тип отображения, колонки, анимацию,
   вывод типов-бейджей, подборку, лимит, шапку, автопрокрутку), блок
   мгновенно перерисовывается (реальный компонент <GoodsBlock>), а под
   ним выводится готовый HTML-сниппет <goods-block …> с кнопкой «Копировать».

   Данные конструктор грузит сам (события t1:goods / t1:good_list) и
   передаёт в компонент пропсом preload — поэтому смена параметров
   (в т.ч. анимации) не перезагружает данные.
   ============================================================ */
window.__T1_GB_BUILDER_VER = '2026-09-23';

/* ---------- Справочники для панели ---------- */
window.__T1_GB_SHOW = [
  { v: 'carousel', label: 'Карусель (carousel)' },
  { v: 'grid',     label: 'Сетка карточек (grid)' },
  { v: 'compact',  label: 'Компактная сетка (compact)' },
  { v: 'rows',     label: 'Строки (rows)' },
  { v: 'showmore', label: 'Показать ещё (showmore)' },
  { v: 'feature',  label: 'Товар дня (feature)' },
  { v: 'tabs',     label: 'Вкладки (tabs)' },
  { v: 'strip',    label: 'Лента (strip)' }
];

window.__T1_GB_ANIM = [
  { v: 'none', label: 'Без анимации' },
  { v: 'fade', label: 'Проявление (fade)' },
  { v: 'rise', label: 'Проявление + подъём (rise)' },
  { v: 'zoom', label: 'Увеличение (zoom)' },
  { v: 'flip', label: 'Переворот (flip)' },
  { v: 'wave', label: 'Волна-каскад (wave)' }
];

window.__T1_GB_TYPES = [
  { v: 0, label: '0 — не выводить' },
  { v: 1, label: '1 — надписи (Новинка / Спецпредложение / Хит)' },
  { v: 2, label: '2 — иконки без надписей' }
];

window.__T1_GB_SEL = [
  { v: 'all', label: 'Все товары' },
  { v: 'new', label: 'Новинки' },
  { v: 'specpredl', label: 'Спецпредложения' },
  { v: 'action', label: 'Хиты' }
];

window.__T1_GB_SRC = [
  { v: './js/preview/good_list.js', label: 'Каталог (54 товара)' },
  { v: './js/preview/good_new.js', label: 'Новинки (good_new)' },
  { v: './js/preview/good_specpredl.js', label: 'Спецпредложения (good_specpredl)' },
  { v: './js/preview/good_popular.js', label: 'Популярные (good_popular)' }
];

window.__T1_GB_PRESETS = [
  { name: 'Карусель', cfg: { show: 'carousel', cols: 0, animation: 'rise', types: 1, selection: 'specpredl', limit: 0, title: 'Хиты продаж', sub: 'Спецпредложения и популярные товары', autoplay: 3500 } },
  { name: 'Сетка 4×2', cfg: { show: 'grid', cols: 4, animation: 'rise', types: 1, selection: 'new', limit: 8, title: 'Новинки', linkText: 'Смотреть все', linkHref: 'good_list.html' } },
  { name: 'Сетка 3×2', cfg: { show: 'grid', cols: 3, animation: 'fade', types: 2, selection: 'all', limit: 6, title: 'Каталог' } },
  { name: 'Компакт 6', cfg: { show: 'compact', cols: 6, animation: 'none', types: 2, selection: 'all', limit: 12 } },
  { name: 'Строки', cfg: { show: 'rows', cols: 2, animation: 'fade', types: 1, selection: 'action', limit: 6, title: 'Хиты' } },
  { name: 'Показать ещё', cfg: { show: 'showmore', cols: 4, animation: 'rise', types: 1, selection: 'all', limit: 8, title: 'Все товары' } },
  { name: 'Товар дня', cfg: { show: 'feature', cols: 0, animation: 'fade', types: 1, selection: 'specpredl', limit: 4 } },
  { name: 'Вкладки', cfg: { show: 'tabs', cols: 4, animation: 'fade', types: 1, selection: 'all', limit: 4, title: 'Подборки' } },
  { name: 'Лента', cfg: { show: 'strip', cols: 0, animation: 'none', types: 1, selection: 'action', limit: 12 } }
];

/* ---------- Фолбэк копирования ---------- */
function gbFallbackCopy(text) {
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

function gbEsc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function initGoodsBlockBuilder() {
  var root = document.getElementById('goodsBlockBuilder');
  if (!root || typeof window.Vue === 'undefined' || !window.GoodsBlock) return;

  var defaults = function () {
    return {
      source: './js/preview/good_list.js',
      selection: 'all',
      show: 'carousel',
      cols: 0,
      animation: 'rise',
      types: 1,
      limit: 0,
      title: '',
      sub: '',
      linkText: '',
      linkHref: '',
      autoplay: 0,
      arrows: true
    };
  };

  var app = window.Vue.createApp({
    components: { GoodsBlock: window.GoodsBlock },

    data: function () {
      return {
        cfg: defaults(),
        catalog: [],
        loading: true,
        error: false,
        copied: false,
        showOpts: window.__T1_GB_SHOW,
        anims: window.__T1_GB_ANIM,
        typesOpts: window.__T1_GB_TYPES,
        selections: window.__T1_GB_SEL,
        sources: window.__T1_GB_SRC,
        presets: window.__T1_GB_PRESETS,
        _on: null
      };
    },

    computed: {
      // Ре-маунт превью при смене этих параметров — чтобы анимация проигралась
      previewKey: function () {
        return [this.cfg.show, this.cfg.cols, this.cfg.animation, this.cfg.types].join('|');
      },
      html: function () { return this.buildHtml(this.cfg); }
    },

    created: function () { this.loadSource(); },

    beforeUnmount: function () { this.cleanup(); },

    watch: {
      'cfg.source': function () { this.loadSource(); }
    },

    methods: {
      cleanup: function () {
        if (this._on) {
          window.removeEventListener('t1:goods', this._on);
          window.removeEventListener('t1:good_list', this._on);
          this._on = null;
        }
      },

      loadSource: function () {
        var vm = this;
        vm.cleanup();
        vm.loading = true;
        vm.error = false;
        vm.catalog = [];

        var onData = function (e) {
          var d = e.detail || {};
          if (!d.list) return;
          vm.cleanup();
          vm.catalog = d.list;
          vm.loading = false;
        };
        vm._on = onData;
        window.addEventListener('t1:goods', onData);
        window.addEventListener('t1:good_list', onData);

        var s = document.createElement('script');
        s.src = vm.cfg.source;
        s.onerror = function () { vm.cleanup(); vm.error = true; vm.loading = false; };
        document.head.appendChild(s);
      },

      reset: function () {
        this.cfg = defaults();
        this.copied = false;
      },

      applyPreset: function (p) {
        var cfg = defaults();
        Object.keys(p.cfg).forEach(function (k) { cfg[k] = p.cfg[k]; });
        this.cfg = cfg;
        this.copied = false;
      },

      buildHtml: function (c) {
        var a = [];
        a.push('data-url="' + c.source + '"');
        a.push('data-show="' + c.show + '"');
        if (c.cols > 0) a.push('data-cols="' + c.cols + '"');
        a.push('data-animation="' + c.animation + '"');
        a.push('data-types="' + c.types + '"');
        if (c.selection && c.selection !== 'all') a.push('data-selection="' + c.selection + '"');
        if (c.limit > 0) a.push('data-limit="' + c.limit + '"');
        if (c.autoplay > 0) a.push('autoplay="' + c.autoplay + '"');
        if (c.arrows === false) a.push('data-arrows="false"');
        if (c.title) a.push('data-title="' + gbEsc(c.title) + '"');
        if (c.sub) a.push('data-sub="' + gbEsc(c.sub) + '"');
        if (c.linkText) a.push('data-link-text="' + gbEsc(c.linkText) + '"');
        if (c.linkHref) a.push('data-link-href="' + gbEsc(c.linkHref) + '"');
        return '<goods-block\n  ' + a.join('\n  ') + '></goods-block>';
      },

      copy: function () {
        var vm = this;
        var text = vm.html;
        var done = function () { vm.copied = true; setTimeout(function () { vm.copied = false; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { gbFallbackCopy(text); done(); });
        } else {
          gbFallbackCopy(text); done();
        }
      }
    },

    template: `
<div class="gbc-playground">

  <div class="gbc-config">

    <div class="gbc-field gbc-field--wide">
      <label for="gbc-source">Источник данных (data-url)</label>
      <select id="gbc-source" v-model="cfg.source">
        <option v-for="s in sources" :key="s.v" :value="s.v">{{ s.label }}</option>
      </select>
    </div>

    <div class="gbc-field gbc-field--wide">
      <label for="gbc-show">Тип отображения (data-show)</label>
      <select id="gbc-show" v-model="cfg.show">
        <option v-for="s in showOpts" :key="s.v" :value="s.v">{{ s.label }}</option>
      </select>
    </div>

    <div class="gbc-field">
      <label for="gbc-cols">Колонок (data-cols)</label>
      <select id="gbc-cols" v-model.number="cfg.cols">
        <option :value="0">авто</option>
        <option :value="1">1</option><option :value="2">2</option><option :value="3">3</option>
        <option :value="4">4</option><option :value="5">5</option><option :value="6">6</option>
      </select>
    </div>

    <div class="gbc-field">
      <label for="gbc-anim">Анимация (data-animation)</label>
      <select id="gbc-anim" v-model="cfg.animation">
        <option v-for="a in anims" :key="a.v" :value="a.v">{{ a.label }}</option>
      </select>
    </div>

    <div class="gbc-field gbc-field--wide">
      <label for="gbc-types">Вывод типов (data-types)</label>
      <select id="gbc-types" v-model.number="cfg.types">
        <option v-for="t in typesOpts" :key="t.v" :value="t.v">{{ t.label }}</option>
      </select>
    </div>

    <div class="gbc-field">
      <label for="gbc-sel">Подборка (data-selection)</label>
      <select id="gbc-sel" v-model="cfg.selection">
        <option v-for="s in selections" :key="s.v" :value="s.v">{{ s.label }}</option>
      </select>
    </div>

    <div class="gbc-field">
      <label for="gbc-limit">Лимит (data-limit)</label>
      <select id="gbc-limit" v-model.number="cfg.limit">
        <option :value="0">все</option>
        <option :value="4">4</option><option :value="6">6</option>
        <option :value="8">8</option><option :value="12">12</option>
      </select>
    </div>

    <div class="gbc-field gbc-field--wide">
      <label for="gbc-title">Заголовок (data-title)</label>
      <input id="gbc-title" type="text" v-model="cfg.title" placeholder="Новинки">
    </div>
    <div class="gbc-field gbc-field--wide">
      <label for="gbc-sub">Подпись (data-sub)</label>
      <input id="gbc-sub" type="text" v-model="cfg.sub" placeholder="Самые свежие модели сезона">
    </div>
    <div class="gbc-field">
      <label for="gbc-lt">Ссылка, текст</label>
      <input id="gbc-lt" type="text" v-model="cfg.linkText" placeholder="Все товары">
    </div>
    <div class="gbc-field">
      <label for="gbc-lh">Ссылка, href</label>
      <input id="gbc-lh" type="text" v-model="cfg.linkHref" placeholder="good_list.html">
    </div>

    <div class="gbc-field">
      <label for="gbc-autoplay">Автопрокрутка, мс</label>
      <select id="gbc-autoplay" v-model.number="cfg.autoplay">
        <option :value="0">выкл</option>
        <option :value="3500">3500</option>
        <option :value="5000">5000</option>
      </select>
    </div>
    <div class="gbc-field gbc-check">
      <label><input type="checkbox" v-model="cfg.arrows"> стрелки карусели</label>
    </div>

    <div class="gbc-field gbc-field--wide gbc-presets">
      <span class="gbc-presets__label">Пресеты:</span>
      <div class="gbc-btns">
        <button v-for="p in presets" :key="p.name" type="button" class="btn btn-outline btn-sm" @click="applyPreset(p)">{{ p.name }}</button>
      </div>
    </div>

    <div class="gbc-field gbc-field--wide gbc-actions">
      <p class="gbc-hint">Параметры — атрибуты <code>&lt;goods-block&gt;</code>. Вставьте сниппет на страницу, где подключены
        <code>vue</code>, <code>js/components/carousel.js</code>, <code>js/app.js</code>,
        <code>js/components/photo-gallery.js</code>, <code>js/components/goods-block.js</code>,
        <code>js/goods_blocks.js</code> и <code>css/goods_block.css</code>.</p>
      <div class="gbc-btns">
        <button type="button" class="btn btn-outline btn-sm" @click="reset">Сбросить</button>
        <button type="button" class="btn btn-primary btn-sm" @click="copy">{{ copied ? 'Скопировано ✓' : 'Копировать HTML' }}</button>
      </div>
    </div>

  </div>

  <div class="gbc-demo">
      <p v-if="loading" class="goods-status">Загружаем товары…</p>
      <p v-else-if="error" class="goods-status goods-status--error">Не удалось загрузить данные.</p>
      <GoodsBlock v-else
        :key="previewKey"
        :data-url="cfg.source"
        :preload="catalog"
        :show="cfg.show"
        :cols="cfg.cols"
        :animation="cfg.animation"
        :types="cfg.types"
        :selection="cfg.selection"
        :limit="cfg.limit"
        :autoplay="cfg.autoplay"
        :arrows="cfg.arrows"
        :title="cfg.title"
        :sub="cfg.sub"
        :link-text="cfg.linkText"
        :link-href="cfg.linkHref"/>
  </div>

  <div class="gbc-snippet">
    <div class="gbc-snippet__head">
      <h3 class="gbc-snippet__title">HTML для вставки в шаблон</h3>
      <button type="button" class="btn btn-secondary btn-sm" @click="copy">{{ copied ? 'Скопировано ✓' : 'Копировать' }}</button>
    </div>
    <pre class="gbc-snippet__pre"><code>{{ html }}</code></pre>
  </div>

</div>`
  });

  app.mount(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGoodsBlockBuilder);
} else {
  initGoodsBlockBuilder();
}
