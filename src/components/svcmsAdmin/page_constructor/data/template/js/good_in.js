/* ============================================================
   Файл: templates/t1/js/good_in.js
   Vue-приложение страницы товара (preview/good_in*.html,
   релиз — page/good_in.html).

   ПРИНЦИП «КОНСТРУКТОР» (как в good_list.js):
   Шаблон живёт в странице — <template id="good_in_tpl"> внутри
   <div id="good_in">. Дополнительно в #good_in лежит статический
   блок .good-in__seo — «серверная» версия карточки для поисковиков
   (показывается до инициализации приложения, Vue его заменяет).

   РЕЖИМЫ:
   1. Статичный (страницы-варианты good_in_2..5.html):
      Контент карточки задаётся атрибутами #good_in:
        data-id, data-title, data-price, data-old-price,
        data-badges="[\"new\",\"promo\"]", data-photos='[ ... ]'.
      Описание и характеристики — статические абзацы в шаблоне.
   2. Динамический (каноничная good_in.html = вариант 1):
      root имеет data-url (preview: js/preview/good_in.js) и ?id=N.
      Приложение подгружает товар по id и заполняет карточку.

   КОРЗИНА: работает через глобальные window.add_to_basket /
   del_from_basket / change_in_basket и реактивный window.store
   (приложение js/app.js). Состояние кнопки «В корзину»/
   «В корзине (N)» приходит из store.state.basket.in_basket[id].

   ГАЛЕРЕЯ: миниатюры, стрелки, счётчик, crossfade и лайтбокс
   Fancybox v5 (self-hosted js/fancybox.umd.js). Увеличение —
   клик по фото; стрелки/клавиатура/swipe в лайтбоксе.
   ============================================================ */
window.__T1_GOOD_IN_VER = '2026-09-18';

(function () {
  if (typeof window.Vue === 'undefined') return;

  function jsonAttr(el, name, fallback) {
    if (!el) return fallback;
    var raw = el.getAttribute(name);
    if (raw == null || raw === '') return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function numAttr(el, name, fallback) {
    var n = Number(el.getAttribute(name));
    return isNaN(n) ? fallback : n;
  }

  function readTpl(root) {
    var el = root && root.querySelector('#good_in_tpl');
    if (el && el.innerHTML && el.innerHTML.trim()) return el.innerHTML;
    return null;
  }

  function idFromURL() {
    try {
      var p = new URL(window.location.href).searchParams.get('id');
      var n = parseInt(p, 10);
      return !isNaN(n) && n > 0 ? n : null;
    } catch (e) {
      return null;
    }
  }

  // Тексты плашек. Контракт — new | sale | promo; hit/specpredl — синонимы
  // «Хита» на случай карточки товара (см. .gi-badge--hit/--specpredl).
  var BADGE_LABELS = { new: 'Новинка', sale: 'Распродажа', promo: 'Акция', hit: 'Хит', specpredl: 'Хит' };

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('good_in');
    if (!root) return;

    var tpl = readTpl(root);
    if (!tpl) return; // шаблона нет — конструктор не собирается

    var dataUrl = root.getAttribute('data-url') || null;
    var dynamic = !!(dataUrl || idFromURL());

    var app = Vue.createApp({
      template: tpl,

      data: function () {
        return {
          product: {
            id: numAttr(root, 'data-id', 1),
            header: root.getAttribute('data-title') || '',
            anons: root.getAttribute('data-anons') || '',
            desc: jsonAttr(root, 'data-desc', []),
            specs: jsonAttr(root, 'data-specs', []),
            price: numAttr(root, 'data-price', 0),
            old_price: numAttr(root, 'data-old-price', 0),
            photo: '',
            url: window.location.href.split('?')[0]
          },
          photos: jsonAttr(root, 'data-photos', []),
          badges: jsonAttr(root, 'data-badges', []),
          cur: 0,
          tab: 'desc',
          qty: 1,
          loading: dynamic,
          error: false,
          autoplayMs: parseInt(root.getAttribute('data-autoplay') || '0', 10) || 0,
          _timer: null,
          _received: false
        };
      },

      computed: {
        curPhoto: function () {
          return this.photos[this.cur] || '';
        },
        photosCount: function () {
          return this.photos.length;
        },
        cartCount: function () {
          return Number(window.store.state.basket.in_basket[this.product.id]) || 0;
        },
        inBasket: function () {
          return this.cartCount > 0;
        },
        totalPrice: function () {
          return Number(this.product.price || 0) * (this.qty || 1);
        },
        oldPrice: function () {
          return this.product.old_price > 0 ? this.product.old_price : null;
        },
        savePercent: function () {
          var old = this.product.old_price;
          var p = this.product.price;
          if (!(old > p)) return null;
          return Math.round((1 - p / old) * 100);
        }
      },

      watch: {
        // При динамической загрузке: пересоберём лайтбокс под новые фото
        photos: function () {
          this.$nextTick(this.bindLightbox);
        }
      },

      created: function () {
        if (dynamic) this.load();
      },

      mounted: function () {
        // Галерея «оживает» только после монтажа Vue-шаблона
        this.bindLightbox();
        this._setupKeys();
        this._setupAutoplay();

        // Страница в памяти (переходы браузером вперёд/назад) — перечитать ?id=
        var vm = this;
        window.addEventListener('popstate', function () {
          vm.load();
        });
      },

      beforeUnmount: function () {
        if (this._timer) clearInterval(this._timer);
      },

      methods: {
        // ---------- Загрузка данных ----------
        load: function () {
          var vm = this;
          var urlId = idFromURL();
          if (urlId != null) vm.product.id = urlId;
          if (!dataUrl) return; // статичный режим — данных в атрибутах достаточно

          vm.loading = true;
          vm.error = false;
          if (dataUrl.indexOf('.json') !== -1) {
            fetch(dataUrl)
              .then(function (r) { return r.json(); })
              .then(function (d) { vm.pickFrom(stripDetail(d)); })
              .catch(function () { vm.fail(); });
          } else {
            // preview: скрипт-инъекция + событие t1:good_in
            var listener = function (e) {
              var d = e.detail;
              if (!d || !d.list) return;
              window.removeEventListener('t1:good_in', listener);
              vm.pickFrom(stripDetail(d)); // stripDetail → единый вид деталей
            };
            window.addEventListener('t1:good_in', listener);
            var s = document.createElement('script');
            s.src = dataUrl;
            s.onload = function () { if (!vm._received) vm.fail(); };
            s.onerror = function () { vm.fail(); };
            document.head.appendChild(s);
          }
        },

        // pickFrom(data: {records|list|product}) — найти товар по id
        pickFrom: function (data) {
          var vm = this;
          var records =
            data.list ||
            data.records ||
            data.products ||
            (data.product ? [data.product] : []) ||
            [];
          if (!Array.isArray(records)) records = [];
          var rec = null;
          for (var i = 0; i < records.length; i++) {
            if (Number(records[i].id) === Number(vm.product.id)) { rec = records[i]; break; }
          }

          // Фолбэк: товар уже в глобальном каталоге (переход из списка товаров)
          if (!rec && window.__t1_catalog && window.__t1_catalog[vm.product.id]) {
            var src = window.__t1_catalog[vm.product.id];
            rec = {
              header: src.header,
              anons: src.anons,
              desc: [],
              specs: [],
              price: src.price,
              old_price: src.old_price,
              photo: src.photo,
              url: src.url,
              photos: [src.photo],
              badges: []
            };
          }
          if (!rec) { vm.fail(); return; }

          vm._received = true;
          vm.product.header = rec.header || vm.product.header;
          vm.product.anons = rec.anons || vm.product.anons;
          vm.product.desc = (rec.desc && rec.desc.length ? rec.desc : vm.product.desc).slice();
          vm.product.specs = (rec.specs && rec.specs.length ? rec.specs : vm.product.specs).slice();
          vm.product.price = Number(rec.price || 0);
          vm.product.old_price = Number(rec.old_price || 0);
          vm.product.photo = rec.photo || '';
          vm.product.url = rec.url || vm.product.url;
          vm.photos = (rec.photos && rec.photos.length ? rec.photos : [rec.photo || '']).slice();
          vm.badges = (rec.badges || []).slice();
          vm.cur = 0;

          // Каталог для локального пересчёта корзины в preview
          window.__t1_catalog[vm.product.id] = vm.product;
          window.init_basket && window.init_basket(false);
          vm.loading = false;
          vm.$nextTick(function () { vm.syncDocTitle(); });
        },

        fail: function () {
          this.error = true;
          this.loading = false;
        },

        // ---------- Галерея ----------
        setCur: function (i) {
          var n = this.photos.length;
          if (!n) return;
          this.cur = ((i % n) + n) % n;
        },
        prev: function () { this.setCur(this.cur - 1); },
        next: function () { this.setCur(this.cur + 1); },

        // Лайтбокс Fancybox (сам себя переподвязывает при смене фото)
        bindLightbox: function () {
          if (!window.Fancybox) return;
          var gal = '[data-fancybox="gi-gallery"]';
          Fancybox.unbind(gal);
          Fancybox.bind(gal, {
            Thumbs: { type: 'classic' },
            Toolbar: {
              // В Fancybox v5 display — объект {left, middle, right}; массив
              // приводил к ошибке "is not iterable" и пустому лайтбоксу.
              display: {
                left: ['infobar'],
                middle: ['prev', 'next'],
                right: ['thumbs', 'close']
              }
            },
            Images: { zoom: true, initialSize: 'fit' },
            Carousel: { infinite: true },
            transition: 'fade'
          });
        },

        _setupKeys: function () {
          var vm = this;
          document.addEventListener('keydown', function (e) {
            var tag = e.target && e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.key === 'ArrowLeft') { vm.prev(); vm._bumpAutoplay(); }
            if (e.key === 'ArrowRight') { vm.next(); vm._bumpAutoplay(); }
          });
        },

        // Авто-листание галереи (опция data-autoplay="мс"). Пауза при наведении.
        _setupAutoplay: function () {
          if (!this.autoplayMs) return;
          var vm = this;
          this._startAutoplay();
          root.addEventListener('mouseenter', function () { vm._stopAutoplay(); });
          root.addEventListener('mouseleave', function () { vm._startAutoplay(); });
          root.addEventListener('focusin', function () { vm._stopAutoplay(); });
          root.addEventListener('focusout', function () { if (vm.autoplayMs) vm._startAutoplay(); });
        },
        _startAutoplay: function () {
          if (!this.autoplayMs || this._timer) return;
          var vm = this;
          this._timer = setInterval(function () { vm.next(); }, this.autoplayMs);
        },
        _stopAutoplay: function () {
          if (this._timer) { clearInterval(this._timer); this._timer = null; }
        },
        _bumpAutoplay: function () { this._stopAutoplay(); this._startAutoplay(); },

        // ---------- Количество ----------
        qtyInc: function () { if (this.qty < 99) this.qty++; },
        qtyDec: function () { if (this.qty > 1) this.qty--; },
        onQty: function (e) {
          var n = parseInt(e.target.value, 10);
          if (isNaN(n) || n < 1) this.qty = 1;
          else if (n > 99) this.qty = 99;
          else this.qty = n;
        },

        // ---------- Корзина ----------
        cartItem: function () {
          return {
            id: this.product.id,
            header: this.product.header,
            price: this.product.price,
            old_price: this.product.old_price || 0,
            photo: this.curPhoto || this.product.photo,
            url: this.product.url
          };
        },

        addToCart: function () {
          var g = this.cartItem();
          add_to_basket(g, this.qty || 1);
          showToast('Товар добавлен в корзину');
        },

        incInCart: function () {
          change_in_basket(this.cartItem(), this.cartCount + 1);
        },

        decInCart: function () {
          change_in_basket(this.cartItem(), this.cartCount - 1);
        },

        removeFromCart: function () {
          del_from_basket(this.cartItem());
          showToast('Товар убран из корзины');
        },

        // ---------- Избранное / сравнение ----------
        fav: function () { favorite_toggle(this.product); },
        favState: function () {
          return !!window.store.state.favorites[this.product.id];
        },
        cmp: function () { compare_toggle(this.product); },
        cmpState: function () {
          return !!window.store.state.compare[this.product.id];
        },

        // ---------- UI ----------
        badgeLabel: function (b) {
          return BADGE_LABELS[b] || b;
        },
        priceFmt: function (n) {
          return new Intl.NumberFormat('ru-RU').format(Number(n) || 0) + ' ₽';
        },

        syncDocTitle: function () {
          if (!this.product.header) return;
          var t = this.product.header + ' — DigitalStrateg: купить в Москве';
          if (document.title.indexOf('DigitalStrateg') === -1) return;
          document.title = t;
          var og = document.querySelector('meta[property="og:title"]');
          if (og) og.setAttribute('content', t);
          var tw = document.querySelector('meta[name="twitter:title"]');
          if (tw) tw.setAttribute('content', t);
        }
      }
    });

    app.mount(root);
  });

  // ---------- Нормализация ответа: разные форматы → { list: [...] } ----------
  // js/preview/good_in.js шлёт { list: [...] }; релиз может слать любой вид —
  // pickFrom уже устойчив к записи, здесь лишь страховка для массивов верхнего уровня.
  function stripDetail(data) {
    if (Array.isArray(data)) return { list: data };
    return data || {};
  }
})();