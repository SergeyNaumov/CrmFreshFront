/* ============================================================
   catalog_projects.js — фильтры «Каталога проектов» (block/catalog_projects.html).

   Карточки рендерит сервер/движок (SSR), а фильтрация, сортировка и
   «Показать ещё» выполняются на клиенте по data-атрибутам карточек:
     data-segment / data-floors / data-technology / data-area.
   Разметка контракта: [data-prj], [data-prj-grid], [data-prj-more],
   [data-prj-empty], [data-prj-count], [data-prj-segment], [data-prj-floor],
   [data-prj-tech], .prj-range__min/max, [data-prj-sort], [data-prj-reset].
   ============================================================ */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function initRoot(root) {
    var perpage = parseInt(root.getAttribute('data-perpage'), 10) || 12;
    var grid = root.querySelector('[data-prj-grid]');
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll('.prj-card'));
    var more = root.querySelector('[data-prj-more]');
    var empty = root.querySelector('[data-prj-empty]');
    var count = root.querySelector('[data-prj-count]');
    var min = root.querySelector('.prj-range__min');
    var max = root.querySelector('.prj-range__max');
    var sort = root.querySelector('[data-prj-sort]');

    var state = { segment: 'all', floor: null, tech: null, areaMin: null, areaMax: null, sort: 'asc', shown: perpage };

    function areaOf(c) { return parseFloat(c.getAttribute('data-area')) || 0; }

    function matches(c) {
      if (state.segment !== 'all' && c.getAttribute('data-segment') !== state.segment) return false;
      if (state.floor && c.getAttribute('data-floors') !== state.floor) return false;
      if (state.tech && c.getAttribute('data-technology') !== state.tech) return false;
      var a = areaOf(c);
      if (state.areaMin != null && a < state.areaMin) return false;
      if (state.areaMax != null && a > state.areaMax) return false;
      return true;
    }

    function apply() {
      var filtered = cards.filter(matches);
      filtered.sort(function (x, y) {
        var d = areaOf(x) - areaOf(y);
        return state.sort === 'desc' ? -d : d;
      });
      filtered.forEach(function (c) { grid.appendChild(c); });
      cards.forEach(function (c) { c.classList.add('is-hidden'); });
      filtered.slice(0, state.shown).forEach(function (c) { c.classList.remove('is-hidden'); });
      if (empty) empty.hidden = filtered.length !== 0;
      if (more) more.hidden = filtered.length <= state.shown;
      if (count) count.textContent = 'Показано проектов: ' + Math.min(filtered.length, state.shown) + ' из ' + filtered.length;
    }

    function setActive(container, btn) {
      if (!container) return;
      Array.prototype.forEach.call(container.querySelectorAll('.is-active'), function (b) { b.classList.remove('is-active'); });
      if (btn) btn.classList.add('is-active');
    }

    Array.prototype.forEach.call(root.querySelectorAll('[data-prj-segment]'), function (btn) {
      btn.addEventListener('click', function () {
        state.segment = btn.getAttribute('data-prj-segment');
        state.shown = perpage;
        setActive(btn.parentNode, btn);
        apply();
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-prj-floor]'), function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-prj-floor');
        state.floor = (state.floor === v) ? null : v;
        state.shown = perpage;
        setActive(btn.parentNode, state.floor ? btn : null);
        apply();
      });
    });

    Array.prototype.forEach.call(root.querySelectorAll('[data-prj-tech]'), function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-prj-tech');
        state.tech = (state.tech === v) ? null : v;
        state.shown = perpage;
        setActive(btn.parentNode, state.tech ? btn : null);
        apply();
      });
    });

    if (min) min.addEventListener('input', function () {
      state.areaMin = min.value === '' ? null : parseFloat(min.value);
      state.shown = perpage; apply();
    });
    if (max) max.addEventListener('input', function () {
      state.areaMax = max.value === '' ? null : parseFloat(max.value);
      state.shown = perpage; apply();
    });
    if (sort) sort.addEventListener('change', function () { state.sort = sort.value; apply(); });

    var reset = root.querySelector('[data-prj-reset]');
    if (reset) reset.addEventListener('click', function () {
      state = { segment: 'all', floor: null, tech: null, areaMin: null, areaMax: null, sort: 'asc', shown: perpage };
      if (min) min.value = '';
      if (max) max.value = '';
      if (sort) sort.value = 'asc';
      setActive(root.querySelector('[data-prj-segment-group]'), root.querySelector('[data-prj-segment="all"]'));
      Array.prototype.forEach.call(root.querySelectorAll('[data-prj-floor], [data-prj-tech]'), function (b) { b.classList.remove('is-active'); });
      apply();
    });

    if (more) more.addEventListener('click', function () { state.shown += perpage; apply(); });

    apply();
  }

  ready(function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-prj]'), initRoot);
  });
})();
