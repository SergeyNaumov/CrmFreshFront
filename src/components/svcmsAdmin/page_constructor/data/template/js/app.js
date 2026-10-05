/* ============================================================
   Файл: templates/t1/js/app.js
   Назначение: интерактивность предпросмотра шаблона (preview):
   - глобальное состояние store + корзина (localStorage + /init-basket);
   - виджет корзины в шапке (Vue: basket_info_app) и избранное;
   - универсальная карусель SiteCarousel (ручная + автопрокрутка);
   - товарные блоки — компонент <goods-block> (js/components/goods-block.js,
     монтируется драйвером js/goods_blocks.js);
   - hero-слайдер, табы, телефонная маска, формы, cookie, «наверх».

   Vue 3 подключён локально (js/vue.global.prod.js), без CDN.
   ============================================================ */

/* ============================================================
   ГЛОБАЛЬНОЕ СОСТОЯНИЕ (store) — аналог Pinia/Vuex без бандлера
   Один реактивный объект на всю страницу: читается и пишется
   всеми Vue-приложениями (basket_info, goods_* и др.).
   Поля store.state.basket:
   - list                 — товары в корзине [{id, header, price, old_price, cnt, photo}]
   - in_basket            — карта id -> кол-во единиц (сырые данные localStorage)
   - total_count          — всего единиц товара (сумма cnt)
   - total_price          — сумма по полной цене (old_price, если есть)
   - total_price_with_sale— сумма по актуальной цене (price)
   - inited               — true после загрузки/синхронизации (виджет скрыт до этого)
   ============================================================ */
window.store = Vue.reactive({
  state: {
    basket: {
      inited: false,
      list: [],
      in_basket: {},
      total_price: 0,
      total_price_with_sale: 0,
      total_count: 0
    },
    favorites: {}, // id -> true/false
    compare: {}    // id -> true/false (сравнение товаров)
  }
});

window.__t1_catalog = window.__t1_catalog || {}; // каталог товаров (для preview)

// Метка версии app.js: в консоли `__T1_APP_VER` покажет, какая версия
// загружена (undefined = в кэше/на диске старый файл).
window.__T1_APP_VER = '2026-09-16-basket-full-info';

/* ---------- Хранилище: localStorage + резерв на window.name ----------
   На file:// некоторые браузеры (Firefox) изолируют localStorage по файлу,
   поэтому дублируем значения в window.name (переживает переходы в той же
   вкладке). Чтение — сначала localStorage, затем резерв. */
function _lsFallback() {
  try {
    if (window.name && window.name.charAt(0) === '{') return JSON.parse(window.name) || {};
  } catch (e) { /* не наш формат */ }
  return {};
}
function _lsFallbackSave(obj) {
  try { window.name = JSON.stringify(obj); } catch (e) { /* ignore */ }
}

function loadLS(name) {
  try {
    var v = window.localStorage.getItem(name);
    if (v !== null) return JSON.parse(v);
  } catch (e) { /* localStorage недоступен */ }
  var fb = _lsFallback();
  if (Object.prototype.hasOwnProperty.call(fb, name)) {
    try { return JSON.parse(fb[name]); } catch (e) { /* ignore */ }
  }
  return name === 'basket' || name === 'favorites' || name === 'compare' ? {} : '';
}
window.loadLS = loadLS;

function saveLS(name, value, notsync) {
  var s = JSON.stringify(value);
  try { window.localStorage.setItem(name, s); } catch (e) { /* localStorage недоступен */ }
  var fb = _lsFallback();      // зеркало для file:// (Firefox) и т.п.
  fb[name] = s;
  _lsFallbackSave(fb);
  // Сохранение корзины всегда уводит на сервер: init_basket(true)
  if (!notsync && name === 'basket') init_basket(true);
}
window.saveLS = saveLS;

/* ---------- Форматирование числа: 1234567 -> "1 234 567" ---------- */
function get_triade(v) {
  if (!v) return 0;
  return String(parseInt(v, 10)).replace(/(\d)(?=(\d{3})+$)/g, '$1 ');
}
window.get_triade = get_triade;

/* ============================================================
   КОРЗИНА
   На ЛЮБОЙ странице сайта корзина синхронизируется c сервером:
   клиент отправляет содержимое из localStorage ({ "<id>": count })
   на POST /ajax/basket, сервер возвращает подробную информацию о
   товарах (название/цена/фото) и суммы. Работает и загрузка
   страницы, и локальные изменения (add/del/change).

     Релиз: POST /ajax/basket  (через хелпер POST из form_builder.js)
     Preview: фейковый script-запрос к js/preview/basket_info.js,
              который эмулирует ответ сервера (событие t1:basket-info).

   Ответ нормализуется в apply_basket_full_info(data) и целиком
   заменяет store.state.basket (все Vue-приложения перерисовываются).
   ============================================================ */
window.init_basket = function (change) {
  // Preview: присутствует axios-эмуляция (js/preview/forms.js) или явный флаг
  var isPreview = window.__T1_PREVIEW__ ||
    (typeof window.axios !== 'undefined' && window.axios && window.axios.post);
  if (isPreview) {
    init_basket_preview(change);
    return;
  }

  init_basket_release(change);
};

/* ---------- Релиз: синхронизация корзины с сервером ---------- */
function init_basket_release(change) {
  // Отправляем текущее содержимое корзины из localStorage; сервер
  // вернёт подробности по id/количествам.
  var payload = { basket: loadLS('basket') };
  if (change) payload.change = 1;

  POST({
    url: '/ajax/basket',
    data: payload,
    success: function (d) {
      if (d && d.success) apply_basket_full_info(d);
    }
  });
}

/* ---------- Preview: фейковое /basket-full-info ----------
   Запрос выполняется как <script src="js/preview/basket_info.js?id=...">:
   файл читает localStorage + собственный каталог и публикует событие
   t1:basket-info с ответом в формате сервера. Так корзина видна на
   любой странице (в т.ч. без товарных блоков). Резерв (ошибка/нет
   файла) — локальный пересчёт init_basket_local() по __t1_catalog. */
function init_basket_preview(change) {
  var requestId = 'basket' + Date.now();
  var listener = function (e) {
    var d = e.detail;
    if (!d || String(d.id) !== requestId) return;
    window.removeEventListener('t1:basket-info', listener);
    apply_basket_full_info(d);
  };
  window.addEventListener('t1:basket-info', listener);

  var s = document.createElement('script');
  /* Метка сброса кеша (preview). Значение меняется раз в выкладке —
     см. agent-doc/tools/preview_nocache.py. В релизе этот путь не
     используется: см. init_basket_release. */
  s.src = 'js/preview/basket_info.js?id=' + encodeURIComponent(requestId) +
          '&nocache=[]';
  s.onerror = function () {
    window.removeEventListener('t1:basket-info', listener);
    init_basket_local(change);
  };
  document.head.appendChild(s);
}

/* ---------- Нормализация ответа корзины ----------
   Основной источник — GET /basket-full-info:
     { success: 1, basket: { cur_record_total_price, unique_count,
       total_count, basket_id, total_price, cookie_name,
       LIST: [ { photo, basket_list_id, id, price, name/header, cnt, ... } ] } }
   Совместимость: прежний sync-ответ /init-basket имел вид
   { success, list, in_basket, total_price, total_price_with_sale, total_count }.
   Приводим оба варианта к структуре store.state.basket. */
function apply_basket_full_info(data) {
  if (!data || !data.success) return;

  var basket = data.basket || data;
  var rawList = basket.LIST || basket.list || [];
  var list = [];
  var in_basket = {};
  var total_price = 0;
  var total_price_with_sale = 0;
  var total_count = 0;

  rawList.forEach(function (g) {
    var cnt = parseInt(g.cnt, 10) || 0;
    if (cnt <= 0) return;
    var price = Number(g.price) || 0;
    var old_price = Number(g.old_price) || price;

    list.push({
      id: g.id,
      header: g.name || g.header || ('Товар #' + g.id),
      photo: g.photo || '',
      price: price,
      old_price: old_price,
      cnt: cnt,
      url: g.url || '/product/' + g.id,
      view_type: g.view_type
    });
    in_basket[g.id] = cnt;
    total_count += cnt;
    total_price += old_price * cnt;
    total_price_with_sale += price * cnt;
  });

  // Если сервер вернул итоги в in_basket (легаси), берём совмещённо
  if (data.in_basket) {
    for (var k in data.in_basket) {
      if (!Object.prototype.hasOwnProperty.call(data.in_basket, k)) continue;
      if (!(k in in_basket)) in_basket[k] = parseInt(data.in_basket[k], 10) || 0;
    }
  }

  window.store.state.basket = {
    inited: true,
    list: list,
    in_basket: in_basket,
    total_price: Number(basket.total_price) || total_price,
    total_price_with_sale: Number(basket.cur_record_total_price) || Number(basket.total_price_with_sale) || total_price_with_sale,
    total_count: Number(basket.total_count) || total_count
  };
}

/* ---------- Локальный пересчёт корзины (только preview) ---------- */
function init_basket_local(change) {
  window.store.state.favorites = loadLS('favorites');

  var in_basket = loadLS('basket');
  var list = [];
  var total_price = 0;
  var total_price_with_sale = 0;
  var total_count = 0;
  var id;

  for (id in in_basket) {
    var g = window.__t1_catalog[id];
    var cnt = parseInt(in_basket[id], 10) || 0;
    if (!g || cnt <= 0) continue;

    list.push(Object.assign({}, g, { cnt: cnt }));
    total_count += cnt;
    total_price += (g.old_price || g.price) * cnt;      // по полной цене
    total_price_with_sale += g.price * cnt;              // по актуальной цене
  }

  window.store.state.basket = {
    inited: true,
    list: list,
    in_basket: in_basket,
    total_price: total_price,
    total_price_with_sale: total_price_with_sale,
    total_count: total_count
  };
}

/* ---------- Добавить товар (или увеличить количество) ---------- */
window.add_to_basket = function (g, cnt) {
  cnt = cnt || 1;
  var basket = loadLS('basket');
  basket[g.id] = (basket[g.id] || 0) + cnt;
  g.in_basket = basket[g.id];
  if (typeof ym !== 'undefined') ym(105273661, 'reachGoal', 'basket');
  saveLS('basket', basket);
};

/* ---------- Удалить товар из корзины ---------- */
window.del_from_basket = function (g) {
  var basket = loadLS('basket');
  delete basket[g.id];
  saveLS('basket', basket);
};

/* ---------- Очистить корзину ---------- */
window.clear_basket = function (notsync) {
  saveLS('basket', {}, notsync);
  window.localStorage.setItem('last_update_basket', 0);
};

/* ---------- Изменить количество товара напрямую ---------- */
window.change_in_basket = function (g, cnt) {
  var basket = loadLS('basket');
  cnt = parseInt(cnt, 10) || 0;
  if (cnt <= 0) delete basket[g.id];
  else basket[g.id] = cnt;
  g.in_basket = basket[g.id] || 0;
  saveLS('basket', basket);
};

/* ============================================================
   ИЗБРАННОЕ
   favorite_toggle(g) — добавить/убрать товар g в/из избранного.
   Хранится карта id -> true/false в localStorage 'favorites'.
   ============================================================ */
window.favorite_toggle = function (g) {
  var favorites = loadLS('favorites');
  favorites[g.id] = !favorites[g.id];
  g.favorite = favorites[g.id];
  window.store.state.favorites[g.id] = g.favorite; // реактивное обновление
  saveLS('favorites', favorites);
};

/* ============================================================
   СРАВНЕНИЕ
   compare_toggle(g) — добавить/убрать товар g из сравнения.
   compare_remove(id) — убрать по id. Хранится карта id -> true/false
   в localStorage 'compare' (как избранное).
   ============================================================ */
window.compare_toggle = function (g) {
  var compare = loadLS('compare');
  compare[g.id] = !compare[g.id];
  g.compare = compare[g.id];
  window.store.state.compare[g.id] = g.compare;
  saveLS('compare', compare);
};
window.compare_remove = function (id) {
  var compare = loadLS('compare');
  delete compare[id];
  window.store.state.compare[id] = false;
  saveLS('compare', compare);
};
window.compare_clear = function () {
  window.store.state.compare = {};
  saveLS('compare', {});
};

/* ---------- Тост ---------- */
function showToast(text) {
  var toast = document.getElementById('toast');
  var textEl = document.getElementById('toastText');
  if (!toast || !textEl) return;
  textEl.textContent = text;
  toast.classList.add('is-show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function () { toast.classList.remove('is-show'); }, 3500);
}
window.showToast = showToast;

/* ============================================================
   УНИВЕРСАЛЬНАЯ КАРУСЕЛЬ
   Определение и авто-инициализация вынесены в отдельный файл
   js/components/carousel.js (window.SiteCarousel) — он подключается
   перед app.js и переиспользуется на страницах без Vue/app.js.
   ============================================================ */

/* ============================================================
   ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Хедер: тень при скролле + мобильное меню ----------
     Топбар (.topbar) скрывается классом is-scrolled, а это меняет высоту
     хедера. С одиночным порогом (scrollY > 10) при скролле вверх класс
     начинает «дребезжать»: высота хедера меняется → страница смещается →
     scrollY перескакивает порог → топбар то появляется, то исчезает.
     Поэтому гистерезис: включаем на 40px, снимаем только ниже 10px,
     плюс игнорируем микродвижения (<2px) вблизи порога. */
  var header = document.getElementById('siteHeader');
  var SCROLL_HIDE = 40;   // дальше — топбар прячем
  var SCROLL_SHOW = 10;   // ближе — показываем обратно
  var lastY = window.scrollY || 0;
  var scrolled = (lastY > SCROLL_HIDE);
  function onScrollHeader() {
    if (!header) return;
    var y = window.scrollY || 0;
    if (Math.abs(y - lastY) < 2) return;   // дребезг/микродвижения
    lastY = y;
    if (!scrolled && y > SCROLL_HIDE) scrolled = true;
    else if (scrolled && y < SCROLL_SHOW) scrolled = false;
    else return;                            // в «мёртвой зоне» не трогаем класс
    header.classList.toggle('is-scrolled', scrolled);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  header && header.classList.toggle('is-scrolled', scrolled);
  onScrollHeader();

  var burger = document.getElementById('burgerBtn');
  var mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', function () {
      var open = burger.classList.toggle('is-active');
      mobileMenu.classList.toggle('is-hidden', !open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Hero-слайдер: Vue-компонент <hero-slider> ----------
     Компонент описан в js/components/hero-slider.js (window.HeroSlider).
     Данные тянет сам по data-url, автопрокрутка — из атрибута autoplay. */
  function initHeroSlider() {
    var blocks = document.querySelectorAll('hero-slider');
    if (!blocks.length || typeof window.HeroSlider === 'undefined') return;

    blocks.forEach(function (el) {
      var url = el.getAttribute('data-url') || '';
      var list = el.getAttribute('data-list') || '';
      if (!url && !list) return;
      // options: стрелки/точки/цикл — булевы атрибуты ("false"/"0" = выкл).
      var boolAttr = function (name, def) {
        var v = el.getAttribute(name);
        if (v === null || v === '') return def;
        return !(v === 'false' || v === '0');
      };
      var speed = parseFloat(el.getAttribute('speed'));
      // Высота блока (params.height): задаём на ХОСТЕ, т.к. .hero растянут 100%.
      var hgt = parseInt(el.getAttribute('height'), 10);
      if (!isNaN(hgt) && hgt > 0) el.style.height = hgt + 'px';
      Vue.createApp(window.HeroSlider, {
        dataId: el.id || '',
        dataUrl: url,
        dataList: list,
        // duration — алиас интервала автопрокрутки (если autoplay не задан)
        autoplay: parseInt(el.getAttribute('autoplay'), 10)
                  || parseInt(el.getAttribute('duration'), 10) || 0,
        arrows: boolAttr('arrows', true),
        dots: boolAttr('dots', true),
        loop: boolAttr('loop', true),
        start: parseInt(el.getAttribute('start'), 10) || 0,
        height: parseInt(el.getAttribute('height'), 10) || 0,
        animation: el.getAttribute('animation') || 'rise',
        transition: el.getAttribute('transition') || 'slide',
        slideSpeed: (isNaN(speed) || speed <= 0) ? 700 : Math.round(speed * 1000)
      }).mount(el);
    });
  }
  initHeroSlider();

  /* ---------- Каталог товаров: Vue-компонент <catalog-block> ----------
     Компонент описан в js/components/catalog-block.js (window.CatalogBlock).
     Данные тянет сам по data-url; эффект/анимация задаются атрибутами. */
  function initCatalogBlock() {
    var blocks = document.querySelectorAll('catalog-block');
    if (!blocks.length || typeof window.CatalogBlock === 'undefined') return;

    blocks.forEach(function (el) {
      var url = el.getAttribute('data-url');
      if (!url) return;
      var num = function (name) { return parseInt(el.getAttribute(name), 10) || undefined; };
      // ВАЖНО: пустой атрибут (title="") — это «заголовок не нужен», а НЕ
      // «не задан». Иначе || undefined включает default 'Каталог товаров'
      // и дублирует H1 блока-страницы (page_head).
      var str = function (name) { var v = el.getAttribute(name); return v === null ? undefined : v; };
      Vue.createApp(window.CatalogBlock, {
        dataId: el.id || '',
        dataUrl: url,
        title: str('title'),
        sub: str('sub'),
        linkText: str('link-text'),
        linkHref: str('link-href'),
        effect: str('effect'),
        enter: str('enter'),
        cols: num('cols')
      }).mount(el);
    });
  }
  initCatalogBlock();

  /* ---------- Карусели ----------
     Статические .carousel авто-инициализируются в js/components/carousel.js
     (подключается перед app.js). Здесь ничего делать не нужно. */

  /* ---------- Табы ---------- */
  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (root) {
      var btns = Array.prototype.slice.call(root.querySelectorAll('[data-tab]'));
      /* Панели могут находиться вне контейнера [data-tabs] (например,
         в отдельном .branches-panels), поэтому ищем их в родителе. */
      var scope = root.parentElement || document;
      var panels = Array.prototype.slice.call(scope.querySelectorAll('[data-panel]'));

      /* Ленивые iframe карт в табах: грузим при показе панели
         (lazy-iframe внутри display:none может не загрузиться). */
      function loadPanel(panel) {
        if (!panel) return;
        Array.prototype.forEach.call(panel.querySelectorAll('iframe[data-src]'), function (f) {
          if (!f.getAttribute('src')) f.setAttribute('src', f.getAttribute('data-src'));
        });
      }

      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var name = btn.getAttribute('data-tab');
          btns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
          panels.forEach(function (p) {
            var active = p.getAttribute('data-panel') === name;
            p.classList.toggle('is-active', active);
            if (active) loadPanel(p);
          });
        });
      });

      // Карта(ы) активной при загрузке панели.
      panels.forEach(function (p) {
        if (p.classList.contains('is-active')) loadPanel(p);
      });
    });
  }
  initTabs();

  /* ---------- Маска телефона ---------- */
  function initPhoneMask() {
    document.querySelectorAll('[data-mask="phone"]').forEach(function (input) {
      input.addEventListener('input', function () {
        var d = input.value.replace(/\D/g, '').slice(0, 11);
        if (!d) { input.value = ''; return; }

        var out = '+7';
        if (d.length > 1) out += ' (' + d.slice(1, 4);
        else { input.value = out; return; }
        if (d.length >= 4) out += ') ' + d.slice(4, 7);
        if (d.length >= 7) out += '-' + d.slice(7, 9);
        if (d.length >= 9) out += '-' + d.slice(9, 11);

        input.value = out;
      });
    });
  }
  initPhoneMask();

  /* ---------- Корзина: виджет в шапке (Vue: basket_info_app) ----------
     Контейнер #basket_info содержит <template>. Приложение монтируется
     в него и читает глобальный store.state.basket: счётчик, список,
     итог. Виджет скрыт, пока корзина не инициализирована (inited). */
  function initBasketInfo() {
    var root = document.getElementById('basket_info');
    var tpl = root && root.querySelector('template');
    if (!root || !tpl || !window.Vue) return;

    var app = Vue.createApp({
      data: function () {
        return {
          open: false,
          store: window.store // один реактивный объект на всю страницу
        };
      },
      template: tpl.innerHTML,
      methods: {
        toggle: function () { this.open = !this.open; },
        close: function () { this.open = false; },
        priceFmt: function (n) {
          return window.get_triade(Math.round(Number(n) || 0)) + ' ₽';
        },
        inc: function (g) {
          change_in_basket(g, (Number(g.cnt) || 0) + 1);
        },
        dec: function (g) {
          if ((Number(g.cnt) || 0) <= 1) del_from_basket(g);
          else change_in_basket(g, (Number(g.cnt) || 0) - 1);
        },
        remove: function (g) { del_from_basket(g); }
      },
      mounted: function () {
        var vm = this;
        document.addEventListener('click', function (e) {
          if (vm.open && !vm.$el.contains(e.target)) vm.close();
        });
      }
    });

    app.mount(root);
  }
  initBasketInfo();

  /* ---------- Модалка «Заказ оформлен» (Vue: modal_basket_2) ----------
     Отдельное приложение (конвенция AGENTS.md: каждый виджет — свой
     createApp, монтируется только если #id есть на странице). Метод
     show(id) подставляет номер заказа ({{ id }} в разметке index.html)
     и открывает окно через общий jmodal-хелпер.
     window.modal_basket_2 доступен js/basket.js после успешного POST /zakaz. */
  function initBasketOrderModal() {
    var root = document.getElementById('modal_basket_2');
    if (!root || !window.Vue) return;

    var app = Vue.createApp({
      data: function () {
        return { id: '' };
      },
      methods: {
        show: function (id) {
          this.id = id || '';
          if (window.jmodalOpen) jmodalOpen('modal_basket_2');
        }
      }
    });

    window.modal_basket_2 = app.mount(root);
  }
  initBasketOrderModal();

  /* ---------- Избранное: иконка-сердечко в шапке (Vue: favorites_info_app) ----------
     Читает store.state.favorites и показывает число отмеченных товаров.
     Ссылка ведёт на favorites.html в preview и на /favorites в релизе
     (href задаётся в разметке header). */
  function initFavoritesInfo() {
    var root = document.getElementById('favorites_info');
    var tpl = root && root.querySelector('template');
    if (!root || !tpl || !window.Vue) return;

    var app = Vue.createApp({
      data: function () {
        return { store: window.store };
      },
      computed: {
        count: function () {
          var f = this.store.state.favorites || {};
          return Object.keys(f).filter(function (id) { return f[id]; }).length;
        }
      },
      template: tpl.innerHTML
    });

    app.mount(root);
  }
  initFavoritesInfo();

  /* ---------- Сравнение: иконка в шапке (Vue: compare_info_app) ----------
     Появляется только когда есть товары к сравнению (v-show в разметке). */
  function initCompareInfo() {
    var root = document.getElementById('compare_info');
    var tpl = root && root.querySelector('template');
    if (!root || !tpl || !window.Vue) return;

    var app = Vue.createApp({
      data: function () {
        return { store: window.store };
      },
      computed: {
        count: function () {
          var c = this.store.state.compare || {};
          return Object.keys(c).filter(function (id) { return c[id]; }).length;
        }
      },
      template: tpl.innerHTML
    });

    app.mount(root);
  }
  initCompareInfo();

  /* ---------- Шапка: пункты меню с подменю ----------
     Раскрытие уже работает на CSS (hover/focus-within). Здесь синхронизируем
     aria-expanded и класс is-open для состояний, не зависящих от наведения. */
  function initHeaderSubmenu() {
    document.querySelectorAll('.header__nav .has-submenu, .header__mobile .has-submenu').forEach(function (item) {
      var toggle = item.querySelector('.nav-link') || item.querySelector('a[aria-haspopup]');
      if (!toggle || !toggle.hasAttribute('aria-haspopup')) return;

      function set(open) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        item.classList.toggle('is-open', open);
      }
      item.addEventListener('mouseenter', function () { set(true); });
      item.addEventListener('mouseleave', function () { set(false); });
      item.addEventListener('focusin', function () { set(true); });
      item.addEventListener('focusout', function (e) {
        if (!item.contains(e.relatedTarget)) set(false);
      });
    });
  }
  initHeaderSubmenu();

  /* ---------- Избранное: загрузить карту favorites из localStorage ---------- */
  window.store.state.favorites = loadLS('favorites');

  /* ---------- Сравнение: загрузить карту compare из localStorage ---------- */
  window.store.state.compare = loadLS('compare');

  /* ---------- Корзина: инициализация виджета в шапке ----------
     На всех страницах корзина синхронизируется через POST /ajax/basket
     (в preview — фейковый script-запрос к js/preview/basket_info.js),
     чтобы шапка показывала актуальную корзину даже на страницах без
     товарных блоков. Если страница содержит товарные блоки, их
     компонент позже обновит корзину повторно
     (goods-block.recv → init_basket). */
  window.init_basket(false);

  /* ---------- Маска телефона для статичных форм ----------
     Vue-формы (form_builder.js) применяют свою маску; у статичных форм
     вида #serviceOrderForm[data-validate] её не было — «8» не превращалось
     в «+7». Логика совпадает с form_builder.replace_phone. */
  function maskPhone(v) {
    v = String(v == null ? '' : v).replace(/[^\d]/g, '');
    v = v.replace(/^(\d{11}).+$/g, '$1');
    v = v.replace(/^[78]/g, '+7');
    v = v.replace(/^(\d)/g, '+7$1');
    v = v.replace(/^\+7(\d{3})(\d)/, '+7 ($1) $2');
    v = v.replace(/^(\+7 \(\d{3}\))(\d{3})/, '$1 $2');
    v = v.replace(/(\d{3})(\d{2})/, '$1-$2');
    v = v.replace(/(\d{2})(\d{2})/, '$1-$2');
    return v;
  }
  function initPhoneMasks() {
    document.querySelectorAll('form[data-validate] input[type="tel"], form[data-validate] input[name="phone"]').forEach(function (inp) {
      if (inp.dataset.maskBound) return;
      inp.dataset.maskBound = '1';
      var apply = function () {
        var m = maskPhone(inp.value);
        if (inp.value !== m) inp.value = m;
      };
      inp.addEventListener('input', apply);
      inp.addEventListener('blur', apply);
    });
  }

  /* ---------- Валидация форм ---------- */
  function initForms() {
    document.querySelectorAll('form[data-validate]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var valid = true;

        form.querySelectorAll('[required]').forEach(function (field) {
          var ok = field.type === 'checkbox' ? field.checked : field.value.trim().length > 0;
          field.classList.toggle('is-invalid', !ok);
          if (!ok) valid = false;
        });

        if (!valid) {
          showToast('Пожалуйста, заполните обязательные поля');
          return;
        }

        form.reset();
        showToast(form.getAttribute('data-success') || 'Спасибо! Заявка отправлена.');
      });

      form.querySelectorAll('[required]').forEach(function (field) {
        field.addEventListener('input', function () { field.classList.remove('is-invalid'); });
        field.addEventListener('change', function () { field.classList.remove('is-invalid'); });
      });

      var submitBtn = form.querySelector('button[type="submit"]');
      var accept = form.querySelector('input[type="checkbox"][name="accept"]');
      if (submitBtn && accept) {
        function syncAccept() { submitBtn.disabled = !accept.checked; }
        accept.addEventListener('change', syncAccept);
        syncAccept();
      }
    });
  }
  initForms();
  initPhoneMasks();

  /* ---------- Cookie-плашка ---------- */
  var cookieEl = document.getElementById('cookieNotice');
  var cookieBtn = document.getElementById('cookieAccept');
  if (cookieEl && cookieBtn) {
    if (localStorage.getItem('template_cookie_ok')) {
      cookieEl.classList.add('is-hidden');
    }
    cookieBtn.addEventListener('click', function () {
      localStorage.setItem('template_cookie_ok', '1');
      cookieEl.classList.add('is-hidden');
    });
  }

  /* ---------- Кнопка «Наверх» ---------- */
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('is-visible', window.scrollY > 600);
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

});