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
      var explicit = false;
      if (g) {
        var v = eval(gkey);
        cfg[key] = Number(v);
        explicit = true;
      } else if (root && root.getAttribute('data-' + key.replace(/_/g, '-'))) {
        cfg[key] = Number(root.getAttribute('data-' + key.replace(/_/g, '-')));
        explicit = true;
      }
      // Значение по умолчанию — только если ничего не задано. Явный 0
      // (catalog_id=0 → «весь каталог», /goodlist) сохраняем как есть;
      // принудительный 1 ломал выборку всех товаров и «Избранное».
      if (!explicit) {
        cfg[key] = key === 'perpage' ? 12 : 1;
      } else if (key === 'perpage' && !(cfg[key] > 0)) {
        cfg[key] = 12;
      }
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

  // Данные категории для /catalog/{id}: scope, дети, view, selected.
  function readCat(root) {
    var el = document.getElementById('good_list_cat');
    if (!el) return null;
    try { return JSON.parse(el.textContent || 'null'); } catch (e) { return null; }
  }

  // Нормализация «all» → 0.
  function normRubric(id) {
    return (id === 'all' || id == null || id === '') ? 0 : (Number(id) || 0);
  }

  // Путь без завершающего слэша для сравнения с location.pathname.
  function normPath(u) {
    return String(u || '').replace(/\/+$/, '');
  }

  /* Пункт хлебных крошек того же вида, что и в block/breadcrumbs.html:
     промежуточное звено — ссылка с названием, текущее — span без ссылки. */
  function crumbItem(path, title, isCurrent) {
    var li = document.createElement('li');
    li.className = 'breadcrumbs__item' + (isCurrent ? ' breadcrumbs__item--active' : '');
    li.setAttribute('itemprop', 'itemListElement');
    li.setAttribute('itemscope', '');
    li.setAttribute('itemtype', 'https://schema.org/ListItem');
    var span = document.createElement('span');
    span.setAttribute('itemprop', 'name');
    span.textContent = title || '';
    if (isCurrent) {
      li.appendChild(span);
    } else {
      var a = document.createElement('a');
      a.setAttribute('itemprop', 'item');
      a.setAttribute('href', path);
      a.appendChild(span);
      li.appendChild(a);
    }
    return li;
  }

  // Название звена из его пути: /catalog/elektronika/smartfony -> Смартфоны
  function crumbTitle(path) {
    var parts = String(path || '').replace(/^\/+|\/+$/g, '').split('/');
    var last = parts[parts.length - 1] || '';
    return last ? last.charAt(0).toUpperCase() + last.slice(1) : '';
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
    var cat = readCat(root) || {};
    var orgname = root.getAttribute('data-orgname') || '';

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
          _fetchId: null,   // id раздела для /ajax; 0 = весь каталог (избранное)
          // --- фильтры/сортировка (данные живут всегда, контролы — в шаблоне) ---
          q: getQueryFromURL('q'), // поиск по названию (на странице поиска — из ?q)
          priceMin: '',   // цена «от»
          priceMax: '',   // цена «до»
          sort: 'views',  // views | price_asc | price_desc | published
          category: 'all',// all | подкатегория из данных товара
          rubric: normRubric(cat.selected), // 0/all | id подкатегории
          rubrics: rubrics, // дерево рубрик {id, header, child?}
          rubricCounts: {}, // счётчики товаров по рубрикам
          // --- страница категории /catalog/{id} ---
          cat: cat,                          // {current, scope, view, selected, children}
          scope: cat.scope || {},            // категория, чьи дети показаны
          sidebarKids: cat.children || [],   // дети scope (сайдбар/фильтр)
          orgname: orgname,
          page: initialPage,
          _suppressUrl: false, // не пушить URL во время SPA-навигации/popstate
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
            if (normRubric(vm.rubric)) {
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
        page: 'syncURL'
      },

      created: function () {
        this.load();
      },

      mounted: function () {
        var vm = this;
        // back/forward работают симметрично: подкатегория — из пути.
        window.addEventListener('popstate', function () {
          var r = vm.rubricFromPath();
          if (r !== null) vm.rubric = r;
          vm._suppressUrl = true;     // history уже применила URL
          vm.page = getPageFromURL();
          vm.$nextTick(function () { vm._suppressUrl = false; });
          vm.updateMeta(vm.kidById(vm.rubric) || vm.scope || {});
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
            // Фолбэк: грузим ВЕСЬ каталог (catalog_id=0) и фильтруем по
            // store.state.favorites. Иначе catalog_id по умолчанию = 1,
            // выборка пустая и «Избранное» всегда пусто.
            vm._fetchId = 0;
            vm.fetchAll(0, []);
            return;
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
            // Грузим товары scope (родителя), чтобы соседние подкатегории
            // фильтровались мгновенно без догрузки.
            vm._fetchId = (vm.scope && vm.scope.id) ? vm.scope.id : vm.catalogId;
            vm.fetchAll(0, []); // lastId = 0 → «грузить всё, что есть»
          }
        },

        // Релиз: итеративная подгрузка всех товаров раздела
        fetchAll: function (lastId, acc) {
          var vm = this;
          // Грузим с начала (lastId=0): серверная часть SSR заменяется, зато
          // корректно работают страницы-рубрики (/catalog/{id}), где выборка
          // отфильтрована и нумерация id не совпадает с perpage.
          var last = lastId || 0;
          // _fetchId=0 — валидное значение («весь каталог»), поэтому не через ||.
          var cid = (vm._fetchId !== null && vm._fetchId !== undefined)
            ? vm._fetchId : vm.catalogId;
          fetch('/ajax?catalog_id=' + cid + '&last_id=' + last + '&limit=' + vm.perpage)
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
          vm.loadCounts();
        },

        // Загрузка всех товаров каталога для счётчиков рубрик в сайдбаре.
        // Без этого в подкаталоге остальные рубрики показывают 0.
        loadCounts: function () {
          var vm = this;
          if (vm._countsLoaded) return;
          vm._countsLoaded = true;
          fetch('/ajax?catalog_id=0&last_id=0&limit=1000')
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .then(function (all) {
              if (!Array.isArray(all) || !all.length) return;
              var counts = {};
              for (var i = 0; i < all.length; i++) {
                var ids = rubricatorList(all[i]);
                for (var j = 0; j < ids.length; j++) {
                  counts[ids[j]] = (counts[ids[j]] || 0) + 1;
                }
              }
              vm.rubricCounts = counts;
            })
            .catch(function () { /* счётчики не критичны */ });
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
          this.page = 1;
          this.setRubric(0);
        },

        // ---------- URL (?page=N) ----------
        syncURL: function () {
          if (this._suppressUrl) return; // SPA-навигация сама ставит URL
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

        // ---------- Сайдбар подкатегорий (страница категории) ----------
        kidById: function (id) {
          id = Number(id) || 0;
          if (!id) return null;
          for (var i = 0; i < this.sidebarKids.length; i++) {
            if (Number(this.sidebarKids[i].id) === id) return this.sidebarKids[i];
          }
          return null;
        },

        // Выбор подкатегории: фильтр + URL + title/H1/крошки (без перезагрузки).
        setRubric: function (id) {
          id = normRubric(id);
          var node = this.kidById(id);
          var target = node || this.scope || {};
          var changed = Number(this.rubric) !== id;
          var vm = this;
          this.rubric = id;
          this._suppressUrl = true;   // URL ставим вручную ниже
          this.page = 1;
          this.$nextTick(function () { vm._suppressUrl = false; });
          // reset_filters целевой категории → сбросить и остальные фильтры.
          if (changed && target && target.reset) {
            this.q = '';
            this.priceMin = '';
            this.priceMax = '';
            this.sort = 'views';
            this.category = 'all';
          }
          if (changed) {
            this.pushRubricUrl(target);
            this.updateMeta(target);
          }
        },

        rubricActive: function (id) {
          return normRubric(this.rubric) === normRubric(id);
        },

        pushRubricUrl: function (node) {
          try {
            var url = (node && node.url) ? node.url : window.location.pathname;
            history.pushState({ rubric: Number(this.rubric) }, '', url);
          } catch (e) { /* file:// и т.п. — URL не меняем */ }
        },

        // Обновить <title>, og/twitter, H1 и хлебные крошки под новую рубрику.
        updateMeta: function (node) {
          var title = (node && node.header) || '';
          if (!title) return;
          var full = this.orgname ? (title + ' — ' + this.orgname) : title;
          document.title = full;
          var og = document.querySelector('meta[property="og:title"]');
          if (og) og.setAttribute('content', full);
          var tw = document.querySelector('meta[name="twitter:title"]');
          if (tw) tw.setAttribute('content', full);
          var h1 = document.getElementById('catTitle');
          if (h1) h1.textContent = title;
          this.updateCrumbs(node, title);
        },

        /* Крошки при переходе в другую подкатегорию (SPA, без перезагрузки).
           Раньше менялся только текст последнего звена, из-за чего при
           переходе «Флагманы → Смартфоны» получалось «Смартфоны / Смартфоны».
           Теперь хвост перестраивается по новому пути: звенья глубже общей
           части удаляются, недостающие добавляются, позиции пересчитываются. */
        updateCrumbs: function (node, title) {
          var nav = document.querySelector('.breadcrumbs-wrap');
          if (!nav || !node || !node.url) return;
          var list = nav.querySelector('.breadcrumbs');
          if (!list) return;
          var path = normPath(node.url);
          if (!path) return;

          var items = Array.prototype.slice.call(list.querySelectorAll('.breadcrumbs__item'));
          // Общая часть: звенья, чей путь является префиксом нового пути.
          var keep = 1;                       // «Главная» остаётся всегда
          for (var i = 1; i < items.length; i++) {
            var a = items[i].querySelector('a');
            if (!a) break;
            var cp = normPath(a.getAttribute('href'));
            if (cp && (path === cp || path.indexOf(cp + '/') === 0)) keep++;
            else break;
          }
          for (var j = items.length - 1; j >= keep; j--) {
            if (items[j].parentNode) items[j].parentNode.removeChild(items[j]);
          }

          // Какие пути уже есть.
          var have = [];
          Array.prototype.forEach.call(list.querySelectorAll('.breadcrumbs__item a'), function (el) {
            have.push(normPath(el.getAttribute('href')));
          });

          // Дописываем недостающие звенья нового пути.
          var parts = path.replace(/^\/+|\/+$/g, '').split('/');
          var acc = '';
          for (var k = 0; k < parts.length; k++) {
            acc += '/' + parts[k];
            if (have.indexOf(acc) !== -1) continue;
            var last = (k === parts.length - 1);
            list.appendChild(crumbItem(acc, last ? title : crumbTitle(acc), last));
          }

          // Пересчитываем Schema.org position и заголовок текущего звена.
          var all = Array.prototype.slice.call(list.querySelectorAll('.breadcrumbs__item'));
          all.forEach(function (li, n) {
            var meta = li.querySelector('meta[itemprop="position"]');
            if (meta) meta.setAttribute('content', String(n + 1));
          });
          var active = list.querySelector('.breadcrumbs__item--active span[itemprop="name"]');
          if (active && title) active.textContent = title;
        },

        // Подкатегория по текущему пути (для popstate back/forward).
        rubricFromPath: function () {
          var p = normPath(window.location.pathname);
          for (var i = 0; i < this.sidebarKids.length; i++) {
            if (normPath(this.sidebarKids[i].url) === p) {
              return Number(this.sidebarKids[i].id);
            }
          }
          if (this.scope && normPath(this.scope.url) === p) return 0;
          return null;
        },

        // Счётчик товаров рубрики/подрубрики; 0/'all' → все товары.
        // Если загружены глобальные счётчики (loadCounts) — используем их,
        // иначе считаем по текущему набору товаров.
        rubricCount: function (id) {
          var k = Number(id);
          if (!k) return this.goods.length;
          if (this.rubricCounts && this.rubricCounts[k] !== undefined) {
            return this.rubricCounts[k];
          }
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