/* ============================================================
   templates/t1/js/components/reviews-list.js
   Бесконечная подгрузка отзывов (вариант grid блока reviews).
   В #reviewsList уже лежит серверная порция (SEO); JS добавляет
   следующие по мере приближения к #reviewsSentinel.

   Release: AJAX GET /ajax/reviews?id=<lastId>&limit=<limit> → JSON.
   data-id последнего отзыва берётся из .review-card[data-id].
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    var el = document.createElement('span');
    el.textContent = s == null ? '' : String(s);
    return el.innerHTML;
  }

  function stars(rating) {
    var out = '';
    for (var i = 0; i < 5; i++) {
      out += '<span class="review-card__star' + (i < rating ? ' is-on' : '') + '">★</span>';
    }
    return out;
  }

  function renderCard(r) {
    var initial = (r.author || '?').slice(0, 1);
    var avatar = r.avatar
      ? '<span class="review-card__avatar-photo"><img src="' + esc(r.avatar) + '" alt="" aria-hidden="true" loading="lazy"></span>'
      : '<span class="review-card__avatar" aria-hidden="true">' + esc(initial) + '</span>';
    return '<article class="review-card" data-id="' + esc(r.id) + '">' +
      '<div class="review-card__head">' + avatar +
        '<div class="review-card__meta">' +
          '<div class="review-card__name">' + esc(r.author) + '</div>' +
          '<div class="review-card__date">' + esc(r.date) + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="review-card__stars" role="img" aria-label="Оценка ' + esc(r.rating) + ' из 5">' + stars(Number(r.rating) || 0) + '</div>' +
      '<p class="review-card__text">' + esc(r.text) + '</p>' +
    '</article>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var list = document.getElementById('reviewsList');
    var sentinel = document.getElementById('reviewsSentinel');
    if (!list || !sentinel) return;

    var dataUrl = list.getAttribute('data-url') || '/ajax/reviews';
    var limit = parseInt(list.getAttribute('data-limit'), 10) || 9;

    var loading = false;
    var done = false;

    function lastId() {
      var cards = list.querySelectorAll('.review-card');
      if (!cards.length) return 0;
      return parseInt(cards[cards.length - 1].getAttribute('data-id'), 10) || 0;
    }

    function loadPage() {
      if (loading || done) return;
      loading = true;
      sentinel.setAttribute('aria-busy', 'true');
      sentinel.classList.add('is-armed');

      var url = dataUrl + (dataUrl.indexOf('?') === -1 ? '?' : '&') +
                'id=' + encodeURIComponent(lastId()) + '&limit=' + limit;

      fetch(url)
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (items) { recv(items || []); })
        .catch(function () { finish(); });
    }

    function recv(items) {
      loading = false;
      sentinel.setAttribute('aria-busy', 'false');
      sentinel.classList.remove('is-armed');
      if (!items.length) { finish(); return; }

      var frag = document.createDocumentFragment();
      var tmp = document.createElement('div');
      items.forEach(function (item) {
        tmp.innerHTML = renderCard(item);
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      });
      list.appendChild(frag);

      if (items.length < limit) finish();
    }

    function finish() {
      done = true;
      loading = false;
      if (io) io.disconnect();
      else window.removeEventListener('scroll', check);
      sentinel.classList.remove('is-armed');
      sentinel.setAttribute('aria-busy', 'false');
    }

    function check() {
      if (loading || done) return;
      var r = sentinel.getBoundingClientRect();
      if (r.top < window.innerHeight + 300) loadPage();
    }

    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !loading && !done) loadPage();
      }, { rootMargin: '300px' });
      io.observe(sentinel);
    } else {
      window.addEventListener('scroll', check, { passive: true });
    }
    check();
  });
})();
