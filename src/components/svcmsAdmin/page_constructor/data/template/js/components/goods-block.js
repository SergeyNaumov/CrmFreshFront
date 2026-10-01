/* ============================================================
   Файл: templates/t1/js/components/goods-block.js
   Универсальный товарный блок <goods-block> — один компонент
   для ВСЕХ вариантов товарных блоков (витрина good_blocks.html +
   обратная совместимость с main.html):

   Один вариант критичен для боевых страниц — КАРУСЕЛЬ (default):
   разметка на главной не меняется, поведение идентично прежнему.

   Разметка:
     <section class="section" id="new">
       <div class="container">
         <div class="section-head">…</div>   <!-- заголовок/ссылка секции -->
         <goods-block id="good_new" data-url="./js/preview/good_new.js"
                      autoplay="3500"></goods-block>
       </div>
     </section>

   Витрина разновидностей (preview/good_blocks.html, V1…V9):
     <goods-block data-url="./js/preview/good_list.js" variant="grid"
                  cols="4" limit="8" selection="specpredl"
                  title="Хиты продаж" sub="…" link-text="Все товары"></goods-block>

   Props (все в data-* либо атрибуте компонента):
     - dataId      string   идентификатор блока; для событий t1:goods
                              (preview-блоки вида good_new.js) обязателен,
                              для t1:good_list (общий каталог) не нужен;
     - dataUrl     string   путь к данным (обязательно);
     - show        string   carousel|grid|compact|rows|showmore|feature|tabs|strip
                              (data-show; приоритетнее variant, default: carousel);
     - variant     string   синоним show (обратная совместимость);
     - cols        number   число колонок сетки (grid/showmore/tabs — 4,
                              compact — 6, rows — 2; свой дефолт в компоненте);
     - limit       number   сколько карточек показывать (0 = все);
     - step        number   шаг «Показать ещё» (showmore, default 8);
     - selection   string   all|new|specpredl|action — подборка товаров
                              (default: all);
     - types       number   data-types: 0 — не выводить бейджи, 1 — надписи,
                              2 — SVG-иконки (default: -1 → берётся badges);
     - badges      string   text|icons — синоним types (default: text);
     - animation   string   none|fade|rise|zoom|flip|wave — появление карточек
                              (data-animation, default: none);
     - preload     array    готовый список товаров (конструктор): если задан,
                              данные не грузятся по dataUrl;
     - title / sub — заголовок и подпись шапки блока (renders .section-head);
     - link-text / link-href — ссылка «все товары» в шапке;
     - autoplay    number   интервал автопрокрутки карусели, мс (0 = выкл);
     - arrows      bool     стрелки карусели (default: true).

   Данные грузит сам по data-url:
     - preview:      js-файл публикует событие t1:goods (detail { id, list })
                     или t1:good_list (detail { catalog_id, list }).
                     Запрос через инъекцию <script> (fetch из file:// нельзя).
     - релиз/статик: данных-url может быть .json — будет fetch+json.

   Состояние корзины/избранного — из глобального store
   (store.state.basket.in_basket / store.state.favorites), кнопки и
   сердечки реактивно обновляются.

   Внутренние компоненты:
     - GoodsCard  — карточка товара (mode="card" | mode="row"),
                    самодостаточна: свой photoIdx, корзина/избранное
                    через window.store, фото-галерея директивой
                    v-photo-gallery.
   ============================================================ */
window.__T1_GOODS_BLOCK_VER = '2026-09-23-builder';

/* ---------- SVG-иконки бейджей (спарклайны, режим badges="icons") ---------- */
window.__T1_BADGE_ICONS = {
  new: '<svg class="product-card__badge-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5"/></svg>',
  specpredl: '<svg class="product-card__badge-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  action: '<svg class="product-card__badge-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>'
};

/* ============================================================
   КАРТОЧКА ТОВАРА (используется всеми вариантами блока)
   ============================================================ */
window.GoodsCard = {
  name: 'GoodsCard',
  props: {
    g: { type: Object, default: function () { return {}; } },
    badges: { type: String, default: 'text' },
    mode: { type: String, default: 'card' }
  },

  directives: {
    photoGallery: window.PhotoGallery.directive
  },

  data: function () {
    return { photoIdx: {} };
  },

  template: `
<article v-if="mode === 'row'" class="product-row">
  <div class="product-row__media" v-photo-gallery="g">
    <a class="product-row__media-link" :href="g.url || '/product/' + g.id">
      <img class="product-row__img" :src="curPhoto(g)" :alt="g.header"
           width="120" height="120" loading="lazy">
    </a>
    <div class="product-card__badges" v-if="hasBadge()">
      <span v-if="g.new" class="product-card__badge product-card__badge--new"
            :role="badges === 'icons' ? 'img' : null"
            :aria-label="badges === 'icons' ? badgeLabel('new') : null" v-html="badgeContent('new')"></span>
      <span v-if="g.specpredl" class="product-card__badge product-card__badge--hit"
            :role="badges === 'icons' ? 'img' : null"
            :aria-label="badges === 'icons' ? badgeLabel('specpredl') : null" v-html="badgeContent('specpredl')"></span>
      <span v-if="g.action" class="product-card__badge product-card__badge--sale"
            :role="badges === 'icons' ? 'img' : null"
            :aria-label="badges === 'icons' ? badgeLabel('action') : null" v-html="badgeContent('action')"></span>
    </div>
  </div>
  <div class="product-row__body">
    <h4 class="product-row__title">
      <a :href="g.url || '/product/' + g.id">{{ g.header }}</a>
    </h4>
    <p class="product-row__anons">{{ g.anons }}</p>
    <div class="product-row__price-row">
      <span class="product-row__price">{{ priceFmt(g.price) }}</span>
      <span v-if="g.old_price" class="product-row__price-old">{{ priceFmt(g.old_price) }}</span>
    </div>
  </div>
  <div class="product-row__actions">
    <button class="action-btn" :class="{ 'is-active': favState(g) }" type="button"
            :aria-label="favState(g) ? 'В избранном' : 'Добавить в избранное'"
            @click="fav(g)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
      </svg>
    </button>
            <button class="action-btn" :class="{ 'is-active': cmpState(g) }" type="button"
                    :aria-label="cmpState(g) ? 'Убрать из сравнения' : 'Добавить к сравнению'" @click="cmp(g)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 5h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 5v14M15 5v14"/></svg>
            </button>
    <button v-if="cartCount(g) === 0" class="btn btn-primary btn-sm product-row__buy"
            type="button" @click="add(g)">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
      <span>В корзину</span>
    </button>
    <a v-else class="btn btn-primary btn-sm product-row__buy is-in-cart" href="/basket">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
      <span>В корзине ({{ cartCount(g) }})</span>
    </a>
  </div>
</article>

<article v-else class="product-card">
  <div class="product-card__media" v-photo-gallery="g">
    <a class="product-card__media-link" :href="g.url || '/product/' + g.id">
      <img class="product-card__img" :src="curPhoto(g)" :alt="g.header"
           width="400" height="400" loading="lazy">
    </a>
    <div class="product-card__badges" v-if="hasBadge()">
      <span v-if="g.new" class="product-card__badge product-card__badge--new"
            :role="badges === 'icons' ? 'img' : null"
            :aria-label="badges === 'icons' ? badgeLabel('new') : null" v-html="badgeContent('new')"></span>
      <span v-if="g.specpredl" class="product-card__badge product-card__badge--hit"
            :role="badges === 'icons' ? 'img' : null"
            :aria-label="badges === 'icons' ? badgeLabel('specpredl') : null" v-html="badgeContent('specpredl')"></span>
      <span v-if="g.action" class="product-card__badge product-card__badge--sale"
            :role="badges === 'icons' ? 'img' : null"
            :aria-label="badges === 'icons' ? badgeLabel('action') : null" v-html="badgeContent('action')"></span>
    </div>
    <div v-if="photoCount(g) > 1" class="product-card__dots">
      <button v-for="i in photoCount(g)" :key="i" class="product-card__dot"
              :class="{ 'is-active': i === photoIndex(g) + 1 }"
              :aria-label="'Фото ' + i + ' ' + g.header"
              :aria-current="i === photoIndex(g) + 1 ? 'true' : null"
              type="button" @click.prevent.stop="setPhoto(g, i - 1)"></button>
    </div>
  </div>
  <div class="product-card__actions">
    <button class="action-btn" :class="{ 'is-active': favState(g) }" type="button"
            :aria-label="favState(g) ? 'В избранном' : 'Добавить в избранное'"
            @click="fav(g)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
      </svg>
    </button>
            <button class="action-btn" :class="{ 'is-active': cmpState(g) }" type="button"
                    :aria-label="cmpState(g) ? 'Убрать из сравнения' : 'Добавить к сравнению'" @click="cmp(g)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 5h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 5v14M15 5v14"/></svg>
            </button>
  </div>
  <div class="product-card__body">
    <h3 class="product-card__title">
      <a :href="g.url || '/product/' + g.id">{{ g.header }}</a>
    </h3>
    <p class="product-card__anons">{{ g.anons }}</p>
    <div class="product-card__price-row">
      <span class="product-card__price">{{ priceFmt(g.price) }}</span>
      <span v-if="g.old_price" class="product-card__price-old">{{ priceFmt(g.old_price) }}</span>
    </div>
    <button v-if="cartCount(g) === 0" class="btn btn-primary btn-sm product-card__buy"
            type="button" @click="add(g)">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
      <span>В корзину</span>
    </button>
    <a v-else class="btn btn-primary btn-sm product-card__buy is-in-cart" href="/basket">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
      <span>В корзине ({{ cartCount(g) }})</span>
    </a>
  </div>
</article>`,

  methods: {
    hasBadge: function () {
      var g = this.g;
      if (this.badges === 'none') return false; // data-types="0"
      return !!(g && (g.new || g.specpredl || g.action));
    },
    badgeLabel: function (type) {
      return { new: 'Новинка', specpredl: 'Спецпредложение', action: 'Хит' }[type] || type;
    },
    badgeContent: function (type) {
      if (this.badges === 'icons') {
        return (window.__T1_BADGE_ICONS && window.__T1_BADGE_ICONS[type]) || '';
      }
      return this.badgeLabel(type);
    },

    cartCount: function (g) {
      return Number(window.store.state.basket.in_basket[g.id]) || 0;
    },

    // ---------- Галерея фото (photo: строка или массив) ----------
    photoList: function (g) {
      if (!g) return [];
      if (Array.isArray(g.photo)) return g.photo.filter(Boolean);
      return g.photo ? [g.photo] : [];
    },
    photoCount: function (g) {
      return this.photoList(g).length;
    },
    photoIndex: function (g) {
      var cur = Number(this.photoIdx[g.id]) || 0;
      var n = this.photoCount(g);
      return n ? ((cur % n) + n) % n : 0;
    },
    curPhoto: function (g) {
      var list = this.photoList(g);
      return list[this.photoIndex(g)] || '';
    },
    setPhoto: function (g, i) {
      var n = this.photoCount(g);
      if (!n) return;
      this.photoIdx = Object.assign({}, this.photoIdx, { [g.id]: ((i % n) + n) % n });
    },
    prevPhoto: function (g) { this.setPhoto(g, this.photoIndex(g) - 1); },
    nextPhoto: function (g) { this.setPhoto(g, this.photoIndex(g) + 1); },

    priceFmt: function (n) {
      return new Intl.NumberFormat('ru-RU').format(Number(n) || 0) + ' ₽';
    },

    add: function (g) {
      add_to_basket(Object.assign({}, g, { photo: this.curPhoto(g) }), 1);
      showToast('Товар добавлен в корзину');
    },

    fav: function (g) {
      favorite_toggle(g);
    },

    favState: function (g) {
      return !!window.store.state.favorites[g.id];
    },

    cmp: function (g) {
      compare_toggle(g);
    },

    cmpState: function (g) {
      return !!window.store.state.compare[g.id];
    }
  }
};

/* ============================================================
   БЛОК ТОВАРОВ
   ============================================================ */
window.GoodsBlock = {
  name: 'GoodsBlock',
  components: { GoodsCard: window.GoodsCard },

  props: {
    dataId: { type: String, default: '' },
    dataUrl: { type: String, required: true },
    autoplay: { type: Number, default: 0 },
    show: { type: String, default: '' },          // data-show: carousel|grid|… (приоритетнее variant)
    variant: { type: String, default: 'carousel' },
    cols: { type: Number, default: 0 },
    limit: { type: Number, default: 0 },
    step: { type: Number, default: 8 },
    selection: { type: String, default: 'all' },
    badges: { type: String, default: 'text' },    // data-badges: text|icons (синоним types)
    types: { type: Number, default: -1 },         // data-types: 0 нет, 1 надписи, 2 иконки
    animation: { type: String, default: 'none' }, // data-animation: none|fade|rise|zoom|flip|wave
    preload: { type: Array, default: null },      // готовый список (конструктор), иначе грузим по dataUrl
    title: { type: String, default: '' },
    sub: { type: String, default: '' },
    linkText: { type: String, default: '' },
    linkHref: { type: String, default: '' },
    arrows: { type: Boolean, default: true }
  },

  directives: {
    photoGallery: window.PhotoGallery.directive
  },

  data: function () {
    return {
      goods: [], loading: true, error: false, _received: false, shown: 0, activeTab: '',
      _onGoods: null, _onList: null, _script: null
    };
  },

  template: `
<div class="goods-block goods-app" :class="['goods-block--' + kind, 'goods-block--anim-' + anim]">
  <div v-if="title || sub || linkText" class="section-head section-head--block">
    <div>
      <h2 v-if="title" class="section-title">{{ title }}</h2>
      <p v-if="sub" class="section-sub">{{ sub }}</p>
    </div>
    <a v-if="linkText" class="section-head__link" :href="linkHref || '#'">{{ linkText }}</a>
  </div>

  <p v-if="loading" class="goods-status">Загружаем товары…</p>
  <p v-else-if="error" class="goods-status goods-status--error">Не удалось загрузить товары.</p>

  <template v-else>
    <!-- КАРУСЕЛЬ (variant=carousel, по умолчанию) -->
    <div v-if="kind === 'carousel'" class="carousel carousel--side">
      <div class="carousel__track">
        <div class="carousel__item" v-for="(g, i) in items" :key="g.id" :style="'--i:' + i">
          <GoodsCard :g="g" :badges="badgesMode"/>
        </div>
      </div>
      <div v-if="arrows" class="carousel__nav">
        <button class="carousel__btn carousel__prev" type="button" aria-label="Предыдущие товары">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button class="carousel__btn carousel__next" type="button" aria-label="Следующие товары">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- СЕТКА (variant=grid) -->
    <div v-else-if="kind === 'grid'" class="gb-grid" :class="'gb-grid--cols-' + effCols">
      <GoodsCard v-for="(g, i) in items" :key="g.id" :g="g" :badges="badgesMode" :style="'--i:' + i"/>
    </div>

    <!-- КОМПАКТНАЯ СЕТКА (variant=compact) -->
    <div v-else-if="kind === 'compact'" class="gb-grid gb-grid--compact" :class="'gb-grid--cols-' + effCols">
      <GoodsCard v-for="(g, i) in items" :key="g.id" :g="g" :badges="badgesMode" :style="'--i:' + i"/>
    </div>

    <!-- СТРОКИ (variant=rows) -->
    <div v-else-if="kind === 'rows'" class="gb-rows" :class="'gb-rows--cols-' + effCols">
      <GoodsCard v-for="(g, i) in items" :key="g.id" :g="g" :badges="badgesMode" mode="row" :style="'--i:' + i"/>
    </div>

    <!-- ПОКАЗАТЬ ЕЩЁ (variant=showmore) -->
    <div v-else-if="kind === 'showmore'">
      <div class="gb-grid" :class="'gb-grid--cols-' + effCols">
        <GoodsCard v-for="(g, i) in shownItems" :key="g.id" :g="g" :badges="badgesMode" :style="'--i:' + i"/>
      </div>
      <div v-if="shown < selectionList.length" class="gb-more">
        <span class="gb-more__count">Показано {{ shown }} из {{ selectionList.length }}</span>
        <button class="btn btn-outline gb-more__btn" type="button" @click="more">
          Показать ещё {{ moreStep }}
        </button>
      </div>
    </div>

    <!-- ТОВАР ДНЯ / FEATURE (variant=feature) -->
    <div v-else-if="kind === 'feature'" class="gb-feature">
      <div v-if="items[0]" class="gb-feature__main">
        <GoodsCard :g="items[0]" :badges="badgesMode"/>
      </div>
      <div v-if="sideItems.length" class="gb-feature__side">
        <GoodsCard v-for="(g, i) in sideItems" :key="g.id" :g="g" :badges="badgesMode" mode="row" :style="'--i:' + i"/>
      </div>
    </div>

    <!-- ВКЛАДКИ (variant=tabs) -->
    <div v-else-if="kind === 'tabs'" class="gb-tabs">
      <div v-if="tabs.length" class="gb-tabs__chips" role="tablist">
        <button v-for="t in tabs" :key="t.key" class="gb-chip"
                :class="{ 'is-active': t.key === activeKey }"
                type="button" role="tab"
                :aria-selected="t.key === activeKey ? 'true' : 'false'"
                @click="activeTab = t.key">{{ t.label }}<span class="gb-chip__count">{{ t.count }}</span></button>
      </div>
      <div class="gb-grid" :class="'gb-grid--cols-' + effCols">
        <GoodsCard v-for="(g, i) in tabItems" :key="g.id" :g="g" :badges="badgesMode" :style="'--i:' + i"/>
      </div>
    </div>

    <!-- ЛЕНТА (variant=strip) -->
    <div v-else-if="kind === 'strip'" class="gb-strip">
      <div class="gb-strip__item" v-for="(g, i) in items" :key="g.id" :style="'--i:' + i">
        <GoodsCard :g="g" :badges="badgesMode"/>
      </div>
    </div>
  </template>
</div>`,

  computed: {
    kind: function () {
      var whitelist = ['carousel', 'grid', 'compact', 'rows', 'showmore', 'feature', 'tabs', 'strip'];
      var v = this.show || this.variant;   // data-show приоритетнее data-variant
      return whitelist.indexOf(v) > -1 ? v : 'carousel';
    },

    // Режим бейджей: data-types (0/1/2) приоритетнее data-badges
    badgesMode: function () {
      if (this.types === 0) return 'none';
      if (this.types === 1) return 'text';
      if (this.types === 2) return 'icons';
      return this.badges;
    },

    // Тип анимации появления карточек
    anim: function () {
      var whitelist = ['none', 'fade', 'rise', 'zoom', 'flip', 'wave'];
      return whitelist.indexOf(this.animation) > -1 ? this.animation : 'none';
    },

    // Кастомные колонки или дефолт варианта
    effCols: function () {
      var def = { grid: 4, compact: 6, rows: 2, showmore: 4, tabs: 4 }[this.kind] || 0;
      return this.cols > 0 ? this.cols : def;
    },

    // Отбор по selection
    selectionList: function () {
      var vm = this;
      var list = vm.goods || [];
      if (vm.selection === 'new') return list.filter(function (g) { return g.new; });
      if (vm.selection === 'specpredl') return list.filter(function (g) { return g.specpredl; });
      if (vm.selection === 'action') return list.filter(function (g) { return g.action; });
      return list;
    },

    // Карточки блока (карусель/сетки/лента): отбор + limit
    items: function () {
      var s = this.selectionList;
      return this.limit > 0 ? s.slice(0, this.limit) : s;
    },

    shownItems: function () {
      return this.selectionList.slice(0, Math.max(0, this.shown));
    },

    moreStep: function () {
      return this.step || 8;
    },

    sideItems: function () {
      return this.items.slice(1, 4);
    },

    // Вкладки: подборки, у которых есть товары
    tabs: function () {
      var vm = this;
      var order = [
        { key: 'new', label: 'Новинки' },
        { key: 'specpredl', label: 'Хиты продаж' },
        { key: 'action', label: 'Акции' },
        { key: 'all', label: 'Все товары' }
      ];
      var out = [];
      order.forEach(function (t) {
        var count = vm.countBy(t.key);
        if (count > 0) out.push({ key: t.key, label: t.label, count: count });
      });
      return out;
    },

    activeKey: function () {
      var tabs = this.tabs;
      var hit = null;
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].key === this.activeTab) { hit = tabs[i].key; break; }
      }
      return hit || (tabs[0] ? tabs[0].key : 'all');
    },

    tabItems: function () {
      var list = this.filterBy(this.activeKey);
      return list.slice(0, this.limit > 0 ? this.limit : 4);
    }
  },

  created: function () {
    if (this.preload && this.preload.length) this.recv(this.preload.slice());
    else this.load();
  },

  watch: {
    // Смена источника данных — перезагрузка (без утечки слушателей)
    dataUrl: function () { if (!(this.preload && this.preload.length)) this.reload(); },
    // Конструктор: готовый список приходит пропсом
    preload: function (list) { if (list && list.length) this.recv(list.slice()); },
    // Возврат к карусели — заново инициализируем SiteCarousel
    kind: function (v) {
      if (v !== 'carousel') return;
      var vm = this;
      this.$nextTick(function () { vm.initCarousel(); });
    }
  },

  beforeUnmount: function () {
    this.cleanup();
  },

  methods: {
    countBy: function (key) {
      var list = this.goods || [];
      if (key === 'all') return list.length;
      if (key === 'new') return list.filter(function (g) { return g.new; }).length;
      if (key === 'specpredl') return list.filter(function (g) { return g.specpredl; }).length;
      if (key === 'action') return list.filter(function (g) { return g.action; }).length;
      return 0;
    },

    filterBy: function (key) {
      var list = this.goods || [];
      if (key === 'all') return list;
      if (key === 'new') return list.filter(function (g) { return g.new; });
      if (key === 'specpredl') return list.filter(function (g) { return g.specpredl; });
      if (key === 'action') return list.filter(function (g) { return g.action; });
      return list;
    },

    more: function () {
      this.shown = Math.min(this.selectionList.length, this.shown + this.moreStep);
    },

    // Снять слушатели событий данных (reload / beforeUnmount)
    cleanup: function () {
      if (this._onGoods) { window.removeEventListener('t1:goods', this._onGoods); this._onGoods = null; }
      if (this._onList) { window.removeEventListener('t1:good_list', this._onList); this._onList = null; }
    },

    // Переинициализация карусели (после смены варианта/данных)
    initCarousel: function () {
      var carousel = this.$el && this.$el.querySelector ? this.$el.querySelector('.carousel') : null;
      if (carousel && window.SiteCarousel) window.SiteCarousel.init(carousel, this.autoplay);
    },

    // Повторная загрузка данных (смена dataUrl в конструкторе)
    reload: function () {
      this.cleanup();
      this._received = false;
      this.error = false;
      this.loading = true;
      this.load();
    },

    load: function () {
      var vm = this;

      if (/\.json$/i.test(vm.dataUrl)) {
        // Релиз/статический JSON: обычный запрос
        fetch(vm.dataUrl)
          .then(function (r) { return r.json(); })
          .then(function (list) { vm.recv(list); })
          .catch(function () { vm.fail(); });
        return;
      }

      // Preview: js-файл при исполнении публикует событие t1:goods
      // (detail { id, list }) или t1:good_list (detail { list, catalog_id }).
      var listener = function (e) {
        var d = e.detail || {};
        // t1:goods привязан к блоку (id совпадает с dataId),
        // t1:good_list — общий каталог без id, принимаем всем.
        if (d.id && d.id !== vm.dataId) return;
        vm.cleanup();
        vm.recv(d.list || []);
      };
      vm._onGoods = listener;
      vm._onList = listener;
      window.addEventListener('t1:goods', listener);
      window.addEventListener('t1:good_list', listener);

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
      vm.goods = list || [];
      vm.loading = false;

      // Каталог для локального пересчёта корзины в preview:
      // в __t1_catalog храним фото как строку (первое фото), т.к. корзина
      // и страница товара ожидают строку, а не массив.
      for (var i = 0; i < vm.goods.length; i++) {
        var g = vm.goods[i];
        var first = Array.isArray(g.photo) ? (g.photo[0] || '') : (g.photo || '');
        window.__t1_catalog[g.id] = Object.assign({}, g, { photo: first });
      }
      window.init_basket(false);

      // Стартовый диапазон «Показать ещё»
      vm.shown = Math.min(vm.selectionList.length, vm.limit > 0 ? vm.limit : vm.step);

      // Карусель: навигация + автопрокрутка
      if (vm.kind === 'carousel') {
        vm.$nextTick(function () { vm.initCarousel(); });
      }
    },

    fail: function () {
      this.error = true;
      this.loading = false;
    }
  }
};