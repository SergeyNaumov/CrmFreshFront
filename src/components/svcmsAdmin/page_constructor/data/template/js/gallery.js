/* ============================================================
   Файл: js/gallery.js
   Назначение: галерея (page_type: galery) — фильтр по тегам (.gal-chip)
   и привязка Fancybox к сетке .gal-grid. Без зависимостей (vanilla JS).
   ============================================================ */
(function () {
  'use strict';

  function bindFancybox() {
    if (window.Fancybox && typeof window.Fancybox.bind === 'function') {
      window.Fancybox.bind('[data-fancybox="gallery"]', {});
    }
  }

  function init() {
    var chips = document.querySelectorAll('.gal-chip');
    var items = document.querySelectorAll('.gal-item');
    if (!chips.length) return;

    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var tag = chip.getAttribute('data-filter') || 'all';
        Array.prototype.forEach.call(chips, function (c) {
          c.classList.toggle('is-active', c === chip);
        });
        Array.prototype.forEach.call(items, function (item) {
          var show = tag === 'all' || item.getAttribute('data-tag') === tag;
          item.hidden = !show;
        });
      });
    });

    bindFancybox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
