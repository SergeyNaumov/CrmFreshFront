/* ============================================================
   Файл: js/gallery.js
   Назначение: галерея (page_type: galery) — фильтр по тегам (.gal-chip)
   и привязка Fancybox к сетке .gal-grid. Без зависимостей (vanilla JS).
   ============================================================ */
(function () {
  'use strict';

  function bindFancybox() {
    if (!window.Fancybox || typeof window.Fancybox.bind !== 'function') return;
    // Все лайтбокс-группы страницы: gallery (галерея), certs
    // (сертификаты) и любые другие. Элементы с одинаковым значением
    // data-fancybox Fancybox объединяет в одну галерею.
    if (document.querySelector('[data-fancybox]')) {
      window.Fancybox.bind('[data-fancybox]', {});
    }
  }

  function init() {
    var chips = document.querySelectorAll('.gal-chip');
    var items = document.querySelectorAll('.gal-item');

    // Фильтр по тегам — только если чипы есть на странице.
    if (chips.length) {
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
    }

    // Лайтбокс привязываем всегда (раньше при отсутствии чипов не работал).
    bindFancybox();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
