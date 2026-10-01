/* ============================================================
   Файл: templates/t1/js/components/photo-gallery.js
   Галерея фото в карточке товара: точки-навигация + прокрутка
   колесом мыши (desktop) / вертикальным свайпом (mobile).

   Экспонируется window.PhotoGallery.directive — Vue-директива
   v-photo-gallery. Применяется на .product-card__media:
     <div class="product-card__media" v-photo-gallery="g">

   Слушатели вешаются нативно с { passive: false }, чтобы можно
   было вызвать preventDefault:
     - колесо не скроллит страницу, пока курсор над фото (товара
       с несколькими фото); у одиночного фото колесо не трогаем;
     - вертикальный свайп не скроллит страницу/ленту.
   Горизонтальный свайп НЕ перехватывается: на main.html карусель
   товаров листается горизонтально нативно (scroll-snap), а на
   good_list.html — это просто вертикальный скролл страницы.

   Методы компонента, которые использует директива:
     photoCount(g), nextPhoto(g), prevPhoto(g), setPhoto(g, i).
   ============================================================ */
(function () {
  'use strict';

  var WHEEL_PX = 40;  // накопленная deltaY для переключения колесом
  var SWIPE_PX = 40;  // вертикальное смещение для свайпа
  var AXIS_PX = 8;    // порог определения оси жеста

  window.PhotoGallery = {
    directive: {
      mounted: function (el, binding) {
        el._pg = { vm: binding.instance, g: binding.value, acc: 0, tx: 0, ty: 0, axis: null };
        el.addEventListener('wheel', onWheel, { passive: false });
        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd, { passive: true });
        el.addEventListener('touchcancel', onTouchEnd, { passive: true });
      },
      updated: function (el, binding) {
        if (el._pg) { el._pg.vm = binding.instance; el._pg.g = binding.value; el._pg.acc = 0; }
      },
      unmounted: function (el) {
        el.removeEventListener('wheel', onWheel);
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', onTouchEnd);
        el.removeEventListener('touchcancel', onTouchEnd);
        delete el._pg;
      }
    }
  };

  function count(pg) {
    return pg && pg.vm ? Number(pg.vm.photoCount(pg.g)) || 0 : 0;
  }

  function onWheel(e) {
    var pg = e.currentTarget._pg;
    if (!pg || count(pg) <= 1) return; // одно фото — не мешаем скроллу страницы
    e.preventDefault();
    var acc = (pg.acc || 0) + e.deltaY;
    if (Math.abs(acc) >= WHEEL_PX) {
      if (acc > 0) pg.vm.nextPhoto(pg.g); else pg.vm.prevPhoto(pg.g);
      acc = 0;
    }
    pg.acc = acc;
  }

  function onTouchStart(e) {
    var pg = e.currentTarget._pg;
    if (!pg) return;
    var t = e.touches[0];
    if (!t) return;
    pg.tx = t.clientX;
    pg.ty = t.clientY;
    pg.axis = null;
  }

  function onTouchMove(e) {
    var pg = e.currentTarget._pg;
    if (!pg || count(pg) <= 1) return;
    var t = e.touches[0];
    if (!t) return;
    var dx = t.clientX - pg.tx;
    var dy = t.clientY - pg.ty;
    if (pg.axis === null && (Math.abs(dx) > AXIS_PX || Math.abs(dy) > AXIS_PX)) {
      pg.axis = Math.abs(dy) >= Math.abs(dx) ? 'v' : 'h';
    }
    // Только вертикальный жест отменяет прокрутку; горизонтальный
    // оставляем браузеру (натив скролл-снэпа ленты на main.html).
    if (pg.axis === 'v') e.preventDefault();
  }

  function onTouchEnd(e) {
    var pg = e.currentTarget._pg;
    if (!pg || pg.axis !== 'v') { return; }
    var t = e.changedTouches[0];
    if (!t) return;
    var dy = t.clientY - pg.ty;
    if (count(pg) > 1 && Math.abs(dy) >= SWIPE_PX) {
      if (dy > 0) pg.vm.prevPhoto(pg.g); else pg.vm.nextPhoto(pg.g);
    }
    pg.axis = null;
  }
})();