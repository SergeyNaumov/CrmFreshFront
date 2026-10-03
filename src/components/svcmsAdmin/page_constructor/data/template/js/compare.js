/* ============================================================
   Файл: templates/t1/js/compare.js
   Назначение: страница «Сравнение» (page/compare.html,
   preview/compare.html). Показывает таблицу характеристик
   выбранных товаров (store.state.compare, localStorage 'compare').

   Данные: готовый список товаров со `spec` из JSON-скрипта
   #compare_data (релиз) или из события t1:good_list по data-url
   (preview). Товары без spec отображаются с прочерками.
   ============================================================ */
(function () {
  'use strict';
  if (typeof window.Vue === 'undefined') return;

  window.__T1_COMPARE_VER = '2026-10-02-compare';

  // spec товара: массив [[key, value], …]; из API может прийти JSON-строкой.
  function specList(g) {
    var s = g && g.spec;
    if (Array.isArray(s)) return s;
    if (typeof s === 'string' && s.trim()) {
      try { var a = JSON.parse(s); if (Array.isArray(a)) return a; } catch (e) { /* не JSON */ }
    }
    return [];
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('compare');
    if (!root) return;
    var tpl = root.querySelector('#compare_tpl');
    if (!tpl || !tpl.innerHTML.trim()) return;

    var dataUrl = root.getAttribute('data-url') || null;

    var app = Vue.createApp({
      template: tpl.innerHTML,
      data: function () {
        return { goods: [], loading: true, error: false, _received: false };
      },
      computed: {
        selected: function () {
          var ids = window.store.state.compare || {};
          return this.goods.filter(function (g) { return !!ids[g.id]; });
        },
        specKeys: function () {
          var keys = [];
          this.selected.forEach(function (g) {
            specList(g).forEach(function (s) { if (keys.indexOf(s[0]) < 0) keys.push(s[0]); });
          });
          return keys;
        },
        hasItems: function () { return this.selected.length > 0; },
        // «Популярные» для пустого состояния: первые товары не из сравнения
        suggestions: function () {
          var ids = window.store.state.compare || {};
          var out = [];
          for (var i = 0; i < this.goods.length && out.length < 8; i++) {
            if (!ids[this.goods[i].id]) out.push(this.goods[i]);
          }
          return out;
        }
      },
      created: function () { this.load(); },
      methods: {
        load: function () {
          var vm = this;
          if (dataUrl && /\.json$/i.test(dataUrl)) {
            fetch(dataUrl)
              .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
              .then(function (list) { vm.recv(list || []); })
              .catch(function () { vm.fail(); });
            return;
          }
          if (dataUrl) {
            var listener = function (e) {
              var d = e.detail;
              if (!d || !d.list) return;
              window.removeEventListener('t1:good_list', listener);
              vm.recv(d.list);
            };
            window.addEventListener('t1:good_list', listener);
            var s = document.createElement('script');
            s.src = dataUrl;
            s.onerror = function () { vm.fail(); };
            document.head.appendChild(s);
            return;
          }
          var dj = readJson('compare_data');
          if (dj) { vm.recv(dj); return; }
          // fallback: локальный каталог (__t1_catalog) или пусто
          var cat = window.__t1_catalog || {};
          var list = Object.keys(cat).map(function (k) { return cat[k]; });
          vm.recv(list);
        },
        recv: function (list) {
          this._received = true;
          this.goods = list || [];
          this.loading = false;
        },
        fail: function () { this.error = true; this.loading = false; },

        specValue: function (g, key) {
          var found = specList(g).filter(function (s) { return s[0] === key; })[0];
          return found ? found[1] : '—';
        },
        photo: function (g) { return Array.isArray(g.photo) ? (g.photo[0] || '') : (g.photo || ''); },
        priceFmt: function (n) { return new Intl.NumberFormat('ru-RU').format(Number(n) || 0) + ' ₽'; },
        cartCount: function (g) { return Number(window.store.state.basket.in_basket[g.id]) || 0; },
        remove: function (g) { window.compare_remove(g.id); },
        clear: function () { window.compare_clear(); },
        cmp: function (g) { compare_toggle(g); },
        cmpState: function (g) { return !!window.store.state.compare[g.id]; },
        add: function (g) {
          add_to_basket(Object.assign({}, g, { photo: this.photo(g) }), 1);
          showToast('Товар добавлен в корзину');
        }
      }
    });
    window.__t1_compare = app.mount(root) || app;
  });

  function readJson(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { var d = JSON.parse(el.textContent || '[]'); return Array.isArray(d) ? d : null; }
    catch (e) { return null; }
  }
})();
