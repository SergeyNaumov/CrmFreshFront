/* ============================================================
   Файл: templates/t1/js/good_list.js
   Vue-приложение страницы «Список товаров» (preview/good_list.html,
   релиз — page/catalog_list.html).

   ПРИНЦИП «КОНСТРУКТОР»:
   Шаблон живёт НЕ в JS, а в странице — внутри #good_list →
   <template id="good_list_tpl">. Каждый блок тулбара (поиск, цена,
   сортировка, чипы подкатегорий), сетка, пустое состояние и
   пагинация — отдельная секция шаблона. Чтобы убрать фильтр или
   сортировку, достаточно удалить соответствующий фрагмент шаблона
   на странице: JS универсален и не требует правок (несуществующий
   контрол просто не связывается, фильтр остаётся «выключен»).

   КОНФИГУРАЦИЯ (на странице, перед подключением скрипта):
     <script>const catalog_id = 1; const perpage = 12;</script>
   Fallback: атрибуты data-catalog-id / data-perpage у #good_list.

   ДАННЫЕ:
     - preview: инъекция <script src="js/preview/good_list.js"> +
                событие CustomEvent('t1:good_list', { detail:
                { catalog_id, list, rubrics } }) — литеральный адрес
                передаётся атрибутом data-url у #good_list.
       После инициализации все товары раздела загружены в память.
     - релиз:  /ajax?catalog_id=..&last_id=..&limit=.. — приложение
       догружает порции до тех пор, пока ответ не станет короче limit
       (пустой ответ = конец списка).

   САЙДБАР РУБРИК (catalog2.html / page_type catalog2):
     В шаблоне может быть секция <aside class="catalog-sidebar"> с
     перебором `rubrics` и вызовом setRubric(id). Дерево рубрик
     {id, header, child?} приходит одним из способов:
       - global `const rubrics = [...]` на странице (прод),
       - <script type="application/json" id="good_list_rubrics">[...]</script>,
       - data-rubrics="#good_list" (JSON),
       - detail.rubrics в событии t1:good_list (preview).
     Фильтр рубрики — по вхождению выбранного id в rubricator_id товара
     ([верхняя] или [верхняя, подрубрика]). Нет рубрик — нет сайдбара:
     приложение работает как обычный список.

   ПАГИНАЦИЯ: отдельный компонент js/perpage.js (window.Perpage).
   Переход по страницам меняет URL (?page=N, на 1-й странице параметр
   убирается) через history.pushState без перезагрузки страницы.
   ============================================================ */
// Метка версии: в консоли `__T1_GOOD_LIST_VER` покажет актуальную.
window.__T1_GOOD_LIST_VER = '2026-09-25-rubric-sidebar';

(function () {
  if (typeof window.Vue === 'undefined') return;

  var CONFIG_KEYS = ['catalog_id', 'perpage'];

  // Чтение конфигурации: page-level const (catalog_id / perpage)
  // → data-* атрибуты #good_list → значения по умолчанию.
  function readConfig(root) {
    var cfg = { catalog_id: 1, perpage: 12 };
    for (var i = 0; i < CONFIG_KEYS.length; i++) {
      var key = CONFIG_KEYS[i];
      var gkey = key; // catalog_id, perpage
      // глобальная лексическая константа из <script> на странице
      var g;
      try { g = eval('typeof ' + gkey + ' !== "undefined"'); } catch (e) { g = false; }
      if (g) {
        var v = eval(gkey);
        cfg[key] = Number(v);
      } else if (root && root.getAttribute('data-' + key.replace(/_/g, '-'))) {
        cfg[key] = Number(root.getAttribute('data-' + key.replace(/_/g, '-')));
      }
      if (!(cfg[key] > 0)) cfg[key] = key === 'perpage' ? 12 : 1;
    }
    return cfg;
  }

  function readTpl(root) {
    var el = root && root.querySelector('#good_list_tpl');
    if (el && el.innerHTML && el.innerHTML.trim()) return el.innerHTML;
    return null; // шаблона в странице нет — приложение не запускаем
  }

  // Дерево рубрик для сайдбара (catalog2): global const rubrics →
  // <script type="application/json" id="good_list_rubrics"> → data-rubrics.
  function readRubrics(root) {
    var r = null;
    try { if (typeof rubrics !== 'undefined' && Array.isArray(rubrics)) r = rubrics; } catch (e) { /* нет глобала */ }
    if (!r) {
      var jsonEl = document.getElementById('good_list_rubrics');
      if (jsonEl) {
        try { r = JSON.parse(jsonEl.textContent || '[]'); } catch (e) { r = null; }
      }
    }
    if (!r && root) {
      var attr = root.getAttribute('data-rubrics');
      if (attr) {
        try { r = JSON.parse(attr); } catch (e) { r = null; }
      }
    }
    return Array.isArray(r) ? r : [];
  }

  // Готовый список товаров из JSON-скрипта на странице
  // (<script type="application/json" id="...">) — для «Избранного» и т.п.
  function readDataJson(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try {
      var d = JSON.parse(el.textContent || '[]');
      return Array.isArray(d) ? d : null;
    } catch (e) { return null; }
  }

  // Стандартный порядок меток подкатегорий для чипов.
  var CATEGORY_ORDER = {
    new: 0,
    action: 1,
    specpredl: 2,
    other: 9
  };

  var CATEGORY_LABELS = {
    new: 'Новинки',
    action: 'Акции',
    specpredl: 'Спецпредложения',
    other: 'Прочее'
  };

  // Нормализация category товара: строка ИЛИ массив (товар может входить
  // в несколько чипов — new / action / specpredl). Возвращает массив меток.
  function categoryList(g) {
    var c = g && g.category;
    if (Array.isArray(c)) return c.filter(Boolean);
    return c ? [c] : ['other'];
  }

  // Нормализация rubricator_id товара: массив id ИЛИ одиночный id.
  // Пусто = товар без рубрики (в фильтре «Все товары» виден всегда).
  function rubricatorList(g) {
    var r = g && g.rubricator_id;
    if (Array.isArray(r)) return r.map(Number).filter(function (n) { return n > 0; });
    return r ? [Number(r)] : [];
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('good_list');
    if (!root) return;

    var cfg = readConfig(root);
    var tpl = readTpl(root);
    if (!tpl) return; // без шаблона страницы конструктор не собирается

    var dataUrl = root.getAttribute('data-url') || null;
    var favoritesOnly = root.hasAttribute('data-favorites');
    var initialPage = getPageFromURL();
    var rubrics = readRubrics(root);

    var app = Vue.createApp({
      components: { Perpage: window.Perpage || {} },
      directives: { photoGallery: window.PhotoGallery.directive },
      template: tpl, // шаблон взят из страницы: #good_list → template#good_list_tpl

      data: function () {
        return {
          catalogId: cfg.catalog_id,
          favoritesOnly: favoritesOnly, // страница «Избранное»: только отмеченные товары
          perpage: cfg.perpage,
          goods: [],
          loading: true,
          error: false,
          _received: false,
          // --- фильтры/сортировка (данные живут всегда, контролы — в шаблоне) ---
          q: getQueryFromURL('q'), // поиск по названию (на странице поиска — из ?q)
          priceMin: '',   // цена «от»
          priceMax: '',   // цена «до»
          sort: 'views',  // views | price_asc | price_desc | published
          category: 'all',// all | подкатегория из данных товара
          rubric: 'all',  // all | id рубрики/подрубрики (сайдбар catalog2)
          rubrics: rubrics, // дерево рубрик {id, header, child?}
          page: initialPage,
          photoIdx: {}    // текущее фото по id товара (для галереи)
        };
      },

      computed: {
        // Список подкатегорий для чипов — собирается из данных товаров
        categories: function () {
          var seen = {};
          for (var i = 0; i < this.goods.length; i++) {
            var c = this.goods[i].category;
            var list = Array.isArray(c) ? c : [c || 'other'];
            for (var j = 0; j < list.length; j++) {
              if (list[j]) seen[list[j]] = true;
            }
          }
          var arr = Object.keys(seen);
          arr.sort(function (a, b) {
            return (CATEGORY_ORDER[a] != null ? CATEGORY_ORDER[a] : 9) -
                   (CATEGORY_ORDER[b] != null ? CATEGORY_ORDER[b] : 9);
          });
          return arr;
        },

        // Применение всех фильтров: поиск + цена + подкатегория
        filtered: function () {
          var vm = this;
          var q = String(vm.q || '').toLowerCase().trim();
          var pmin = vm.priceMin === '' || vm.priceMin == null ? null : Number(vm.priceMin);
          var pmax = vm.priceMax === '' || vm.priceMax == null ? null : Number(vm.priceMax);
          return vm.goods.filter(function (g) {
            if (vm.favoritesOnly && !window.store.state.favorites[g.id]) return false;
            if (q && String(g.header).toLowerCase().indexOf(q) === -1) return false;
            if (vm.category !== 'all') {
              var list = categoryList(g);
              if (list.indexOf(vm.category) === -1) return false;
            }
            if (vm.rubric !== 'all') {
              if (rubricatorList(g).indexOf(Number(vm.rubric)) === -1) return false;
            }
            var p = Number(g.price) || 0;
            if (pmin != null && p < pmin) return false;
            if (pmax != null && p > pmax) return false;
            return true;
          });
        },

        sorted: function () {
          var vm = this;
          var sort = vm.sort;
          return vm.filtered.slice().sort(function (a, b) {
            switch (sort) {
              case 'price_asc':  return a.price - b.price;
              case 'price_desc': return b.price - a.price;
              case 'published':  return String(b.published || '').localeCompare(String(a.published || ''));
              case 'views':
              default:           return (b.views || 0) - (a.views || 0) || a.id - b.id;
            }
          });
        },

        pages: function () {
          var n = Math.ceil(this.sorted.length / this.perpage);
          return Math.max(1, n);
        },

        paged: function () {
          var from = (this.page - 1) * this.perpage;
          return this.sorted.slice(from, from + this.perpage);
        },

        foundText: function () {
          return this.sorted.length;
        }
      },

      watch: {
        // Любая смена фильтра/сортировки сбрасывает на 1-ю страницу
        q: { handler: 'resetPage', deep: false },
        priceMin: 'resetPage',
        priceMax: 'resetPage',
        sort: 'resetPage',
        category: 'resetPage',
        rubric: 'resetPage',
        page: 'syncURL'
      },

      created: function () {
        this.load();
      },

      mounted: function () {
        var vm = this;
        window.addEventListener('popstate', function () {
          vm.page = getPageFromURL();
        });
      },

      methods: {
        // ---------- Данные ----------
        load: function () {
          var vm = this;
          // Избранное/сравнение: сервер отдаёт готовый список в JSON-скрипте
          if (vm.favoritesOnly) {
            var dj = readDataJson('good_list_data');
            if (dj) { vm.recv(dj); return; }
          }
          if (dataUrl) {
            // PREVIEW: скрипт-инъекция + событие t1:good_list
            var listener = function (e) {
              var d = e.detail;
              if (!d || Number(d.catalog_id) !== vm.catalogId) return;
              window.removeEventListener('t1:good_list', listener);
              vm.recv(d.list || [], d.rubrics);
            };
            window.addEventListener('t1:good_list', listener);
            var s = document.createElement('script');
            s.src = dataUrl;
            s.onload = function () { if (!vm._received) vm.fail(); };
            s.onerror = function () { vm.fail(); };
            document.head.appendChild(s);
          } else {
            // РЕЛИЗ: /ajax?catalog_id=..&last_id=..&limit=..
            vm.fetchAll(0, []); // lastId = 0 → «грузить всё, что есть»
          }
        },

        // Релиз: итеративная подгрузка всех товаров раздела
        fetchAll: function (lastId, acc) {
          var vm = this;
          // Первая порция уже отрисована сервером в HTML (для SEO) — её id (<= perpage)
          // не запрашиваем повторно, если она была передана последним загруженным id.
          var last = lastId || vm.perpage;
          fetch('/ajax?catalog_id=' + vm.catalogId + '&last_id=' + last + '&limit=' + vm.perpage)
            .then(function (r) { return r.json(); })
            .then(function (arr) {
              if (!Array.isArray(arr)) return vm.finishFetch(acc);
              var merged = acc.concat(arr);
              if (arr.length >= vm.perpage && arr.length) {
                // порция полная — возможно есть ещё
                var l = arr[arr.length - 1].id;
                vm.fetchAll(l, merged);
              } else {
                vm.finishFetch(merged);
              }
            })
            .catch(function () { vm.fail(); });
        },

        finishFetch: function (list) {
          var vm = this;
          // догруженные обновляют базовую (серверную) часть
          vm.goods = list;
          vm.recv(list);
        },

        recv: function (list, rubrics) {
          var vm = this;
          vm._received = true;
          vm.goods = list || [];
          vm.loading = false;
          if (Array.isArray(rubrics) && rubrics.length) vm.rubrics = rubrics;

          // Каталог для локального пересчёта корзины в preview.
          // В __t1_catalog фото сохраняем СТРОКОЙ (первое фото): корзина,
          // деталка и init_basket_local ожидают строку, а не массив.
          for (var i = 0; i < vm.goods.length; i++) {
            var g = vm.goods[i];
            var first = Array.isArray(g.photo) ? (g.photo[0] || '') : (g.photo || '');
            window.__t1_catalog[g.id] = Object.assign({}, g, { photo: first });
          }
          window.init_basket && window.init_basket(false);

          // Применить страницу из URL (с клампингом по фактическому кол-ву страниц)
          vm.page = Math.min(Math.max(getPageFromURL(), 1), vm.pages);
          if (vm.page > 1) vm.syncURL(); // нормализуем, если была ?page=99
        },

        fail: function () {
          this.error = true;
          this.loading = false;
        },

        // ---------- Управление ----------
        resetPage: function () {
          this.page = 1;
        },

        goPage: function (n) {
          this.page = Number(n);
        },

        reset: function () {
          this.q = '';
          this.priceMin = '';
          this.priceMax = '';
          this.sort = 'views';
          this.category = 'all';
          this.rubric = 'all';
          this.page = 1;
        },

        // ---------- URL (?page=N) ----------
        syncURL: function () {
          try {
            var u = new URL(window.location.href);
            if (this.page > 1) u.searchParams.set('page', String(this.page));
            else u.searchParams.delete('page');
            history.pushState({ page: this.page }, '', u.toString());
          } catch (e) { /* file:// и т.п. — URL не меняем */ }
        },

        // ---------- UI ----------
        priceFmt: function (n) {
          return new Intl.NumberFormat('ru-RU').format(Number(n) || 0) + ' ₽';
        },

        categoryLabel: function (c) {
          return CATEGORY_LABELS[c] || c;
        },

        categoryCount: function (c) {
          var k = c || 'other';
          var n = 0;
          for (var i = 0; i < this.goods.length; i++) {
            if (categoryList(this.goods[i]).indexOf(k) !== -1) n++;
          }
          return n;
        },

        // ---------- Сайдбар рубрик (catalog2) ----------
        setRubric: function (id) {
          this.rubric = id;
        },

        rubricActive: function (id) {
          return String(this.rubric) === String(id);
        },

        // Счётчик товаров рубрики/подрубрики; 0/'all' → все товары.
        rubricCount: function (id) {
          var k = Number(id);
          if (!k) return this.goods.length;
          var n = 0;
          for (var i = 0; i < this.goods.length; i++) {
            if (rubricatorList(this.goods[i]).indexOf(k) !== -1) n++;
          }
          return n;
        },

        cartCount: function (g) {
          return Number(window.store.state.basket.in_basket[g.id]) || 0;
        },

        add: function (g) {
          // В корзину — текущее показанное фото (строка)
          add_to_basket(Object.assign({}, g, { photo: this.curPhoto(g) }), 1);
          showToast('Товар добавлен в корзину');
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

        fav: function (g) {
          favorite_toggle(g);
        },

        favState: function (g) {
          return !!window.store.state.favorites[g.id];
        },

        // Сравнение товаров (store.state.compare, localStorage 'compare')
        cmp: function (g) {
          compare_toggle(g);
        },

        cmpState: function (g) {
          return !!window.store.state.compare[g.id];
        }
      }
    });

    // Debug-хендл: в консоли / QA доступен корневой proxy приложения
    window.__t1_goodList = app.mount(root) || app;
  });

  // ---------- Хелперы ----------
  function getPageFromURL() {
    try {
      var p = new URL(window.location.href).searchParams.get('page');
      var n = parseInt(p, 10);
      return (!isNaN(n) && n > 0) ? n : 1;
    } catch (e) {
      return 1;
    }
  }

  function getQueryFromURL(name) {
    try { return new URL(window.location.href).searchParams.get(name) || ''; } catch (e) { return ''; }
  }
})();