/* ============================================================
   templates/t1/js/search-page.js
   Модуль страницы поиска (блок page_search, page_type: search).

   Два режима — по разметке от block/page_search.html:

   1) Общий поиск /search/<фраза>: три блока .search-block
      (товары, новости, статьи). Каждый один раз запрашивает
      /ajax/search/<entity>/<фраза>?limit=<count_search_items>
      и рисует результаты карточками .search-hit; если ответ
      {more: true} — показывает ссылку «Все результаты».

   2) Все результаты сущности /search/<entity>/<фраза>: первая
      порция уже в #searchList (для SEO), дальше — догрузка
      по скроллу тем же запросом с курсором last_id=data-id
      последней карточки. Тот же приём, что в
      js/components/news-list.js (IntersectionObserver +
      запас 300px, добираем, пока порция не короче limit).

   Формат ответа /ajax/search/<entity>/<фраза>:
     { "list": [ { id, header, anons, photo, url,
                   price_fmt?, old_price_fmt?, date? } ],
       "more": true|false }
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Экранирование (текст приходит из БД) ---------- */
  function esc(s) {
    var el = document.createElement('span');
    el.textContent = s === undefined || s === null ? '' : s;
    return el.innerHTML;
  }

  /* ---------- Карточка результата ---------- */
  function renderHit(item) {
    var href = esc(item.url || '#');
    var photo = item.photo ? '<img src="' + esc(item.photo) + '" alt="" width="88" ' +
      'height="88" loading="lazy" decoding="async">' : '';
    var anons = item.anons ? '<p class="search-hit__anons">' + esc(item.anons) + '</p>' : '';
    var meta = '';
    if (item.price_fmt) meta += '<span class="search-hit__price">' + esc(item.price_fmt) + '</span>';
    if (item.date) meta += '<span class="search-hit__date">' + esc(item.date) + '</span>';
    meta = meta ? '<p class="search-hit__meta">' + meta + '</p>' : '';

    return '<article class="search-hit" data-id="' + esc(item.id) + '">' +
      '<a class="search-hit__media" href="' + href + '" tabindex="-1" aria-hidden="true">' + photo + '</a>' +
      '<div class="search-hit__body">' +
        '<h2 class="search-hit__title"><a href="' + href + '">' + esc(item.header) + '</a></h2>' +
        anons + meta +
      '</div>' +
    '</article>';
  }

  /* ---------- Запрос порции ---------- */
  function fetchHits(url, lastId, limit) {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    var full = url + sep + 'limit=' + limit + (lastId ? '&last_id=' + lastId : '');
    return fetch(full)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        return {
          list: (d && (d.list || d.items || d.LIST)) || [],
          more: !!(d && d.more)
        };
      });
  }

  /* ---------- 1) Общий поиск: по одному запросу на сущность ---------- */
  function initBlock(block) {
    var box = block.querySelector('.search-hits');
    if (!box) return;

    var limit = parseInt(block.getAttribute('data-limit'), 10) || 6;
    var more = block.querySelector('.search-more');
    var empty = block.querySelector('.search-empty');

    fetchHits(block.getAttribute('data-url') || '', 0, limit)
      .then(function (d) {
        box.removeAttribute('data-state');
        box.textContent = '';

        if (!d.list.length) {
          if (empty) empty.removeAttribute('hidden');
          return;
        }

        var html = '';
        for (var i = 0; i < d.list.length; i++) html += renderHit(d.list[i]);
        box.innerHTML = html;

        /* Ссылка «Все результаты» — только если есть что показывать дальше */
        if (d.more && more) more.removeAttribute('hidden');
      })
      .catch(function () {
        box.removeAttribute('data-state');
        box.innerHTML = '<p class="search-block__msg search-block__msg--error">Не удалось загрузить результаты</p>';
      });
  }

  /* ---------- 2) Страница сущности: догрузка по скроллу ---------- */
  function initList(list) {
    var sentinel = document.getElementById('searchSentinel');
    if (!sentinel) return;

    var limit = parseInt(list.getAttribute('data-limit'), 10) || 6;
    var url = list.getAttribute('data-url') || '';

    var loading = false;
    var done = false;

    function lastId() {
      var hits = list.querySelectorAll('.search-hit');
      if (!hits.length) return 0;
      return parseInt(hits[hits.length - 1].getAttribute('data-id'), 10) || 0;
    }

    function finish() {
      done = true;
      loading = false;
      if (io) io.disconnect();
      else window.removeEventListener('scroll', check, { passive: true });
      sentinel.setAttribute('hidden', '');
      sentinel.setAttribute('aria-busy', 'false');
    }

    function loadPage() {
      loading = true;
      sentinel.setAttribute('aria-busy', 'true');
      sentinel.classList.add('is-armed');

      fetchHits(url, lastId(), limit)
        .then(function (d) {
          loading = false;
          sentinel.setAttribute('aria-busy', 'false');
          sentinel.classList.remove('is-armed');

          if (!d.list.length) { finish(); return; }

          var html = '';
          for (var i = 0; i < d.list.length; i++) html += renderHit(d.list[i]);
          list.insertAdjacentHTML('beforeend', html);

          /* Порция короче лимита (или сервер сказал «больше нет») — стоп */
          if (!d.more || d.list.length < limit) { finish(); return; }

          /* Порция полная, но список мог уже входить в зону видимости:
             IntersectionObserver на повторном пересечении не сработает,
             поэтому перепроверяем положение sentinel сами. */
          check();
        })
        .catch(function () { finish(); });
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
  }

  /* ---------- Запуск ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var blocks = document.querySelectorAll('.search-block[data-url]');
    for (var i = 0; i < blocks.length; i++) initBlock(blocks[i]);

    var list = document.getElementById('searchList');
    if (list && list.getAttribute('data-url')) initList(list);
  });
})();