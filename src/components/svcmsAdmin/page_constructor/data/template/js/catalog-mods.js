/* ============================================================
   templates/t1/js/catalog-mods.js
   Небольшие интерактивные эффекты страницы «Каталог» (preview/catalog.html):
     1) Карусель рубрик на Splide (модификация 4);
     2) 3D-tilt карточек за курсором (модификация 5);
     3) Скролл-reveal рубрик через IntersectionObserver (модификация 6).
   Каждый модуль самодостаточен: если элемента на странице нет — ничего не делает.
   Без JS страница остаётся полностью рабочей (эффекты деградируют до CSS-hover).
   ============================================================ */

(function () {
  'use strict';

  /* ---------- 1. Карусель (Splide) ---------- */
  var carouselEl = document.getElementById('catalogSplide');
  if (carouselEl && window.Splide) {
    new Splide('#catalogSplide', {
      type: 'loop',
      perPage: 4,
      perMove: 1,
      gap: 24,
      autoplay: true,
      interval: 3000,
      pauseOnHover: true,
      arrows: true,
      pagination: true,
      breakpoints: {
        991: { perPage: 2 },
        575: { perPage: 1 }
      }
    }).mount();
  }

  /* ---------- 2. 3D-tilt карточек ---------- */
  var tiltCards = document.querySelectorAll('[data-tilt]');
  function resetTilt(card) {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  }
  for (var t = 0; t < tiltCards.length; t++) {
    (function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 … 0.5
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', (px * 16).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (-py * 16).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (px * 100 + 50).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100 + 50).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () { resetTilt(card); });
    })(tiltCards[t]);
  }

  /* ---------- 3. Скролл-reveal ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  function show(el) { el.classList.add('is-visible'); }

  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          show(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    for (var i = 0; i < revealEls.length; i++) io.observe(revealEls[i]);
  } else {
    for (var j = 0; j < revealEls.length; j++) show(revealEls[j]);
  }
})();