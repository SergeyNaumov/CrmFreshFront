/* ============================================================
   templates/t1/js/parallax.js
   JS-fallback для примитива параллакса (css/parallax.css, класс .plx).

   Нужен ТОЛЬКО там, где браузер не поддерживает scroll-driven анимации
   (animation-timeline: view()). Если поддержка есть — скрипт выходит
   сразу, эффект целиком делает CSS. То же при prefers-reduced-motion:
   скрипт не мешает системной настройке.

   Схема: IntersectionObserver держит список видимых блоков, один
   passive-scroll через requestAnimationFrame пишет --plx-y в transform
   фонового слоя. Без rAF не обходимся: transform на каждый кадр.

   Модуль самодостаточен: если .plx на странице нет — ничего не делает.
   ============================================================ */

(function () {
  'use strict';

  var blocks = document.querySelectorAll('.plx[data-plx]');
  if (!blocks.length) return;

  /* CSS-режим (animation-timeline: view()) — работает без нас. */
  if (window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()')) return;

  /* Системная настройка «меньше движения» — эффект выключен. */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var items = [];
  var i;

  /* Амплитуда = --plx-speed × --plx-unit (те же токены, что и в CSS).
     --plx-shift не читаем: это calc(), getComputedStyle вернёт его
     невычисленным. */
  for (i = 0; i < blocks.length; i++) {
    var media = blocks[i].querySelector('.plx__media');
    if (!media) continue;
    var cs = getComputedStyle(blocks[i]);
    var speed = parseFloat(cs.getPropertyValue('--plx-speed'));
    var unit = parseFloat(cs.getPropertyValue('--plx-unit'));
    items.push({
      block: blocks[i],
      media: media,
      shift: (isNaN(speed) ? 12 : speed) * (isNaN(unit) ? 5 : unit)
    });
  }
  if (!items.length) return;

  var visible = [];

  /* Позиция слоя: -shift…+shift, 0 — блок в центре экрана.
     Нормируем на (высота блока + высота окна) / 2, поэтому на экране
     сдвиг всегда ≤ амплитуды. */
  function shiftFor(item) {
    var r = item.block.getBoundingClientRect();
    var center = r.top + r.height / 2;
    var viewport = window.innerHeight / 2;
    var progress = (center - viewport) / ((r.height + window.innerHeight) / 2);
    if (progress > 1) progress = 1;
    if (progress < -1) progress = -1;
    return (-progress * item.shift).toFixed(1) + 'px';
  }

  function update() {
    for (var k = 0; k < visible.length; k++) {
      visible[k].media.style.setProperty('--plx-y', shiftFor(visible[k]));
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      update();
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var item = entry.target.__plx;
        var idx = visible.indexOf(item);
        if (entry.isIntersecting) {
          if (idx === -1) visible.push(item);
        } else if (idx !== -1) {
          visible.splice(idx, 1);
        }
      });
      onScroll();
    }, { rootMargin: '20% 0px' });
    for (i = 0; i < items.length; i++) {
      items[i].block.__plx = items[i];
      io.observe(items[i].block);
    }
  } else {
    /* Без IO следим за всеми блоками (медленнее, но корректно). */
    visible = items.slice();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();