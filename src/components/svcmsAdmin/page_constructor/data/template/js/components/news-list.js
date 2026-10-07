/* ============================================================
   templates/t1/js/components/news-list.js
   Самозапускаемый модуль бесконечной подгрузки новостей.
   Работает с серверной разметкой: в #newsList уже есть
   начальная порция новостей (для SEO), JS добавляет следующие
   порции по скроллу.

   Каждое приближение к концу списка отправляет СВЕЖИЙ запрос
   за очередной порцией:
     Preview: script-запрос js/preview/news.js?id=<lastId>&limit=<limit>
              (файл читает query из своего src и возвращает порцию),
     Release: AJAX GET /ajax/news?id=<lastId>&limit=<limit> → JSON-массив.

   data-id последней новости берётся из разметки каждой карточки
   (.news-card[data-id]), поэтому компонент работает и с серверным
   HTML, и с догруженными карточками.
   ============================================================ */
(function () {
  'use strict';

  var MONTHS = ['января','февраля','марта','апреля','мая','июня',
                'июля','августа','сентября','октября','ноября','декабря'];

  /* ---------- Формат "DD месяц ГГГГ" ---------- */
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function esc(s) {
    var el = document.createElement('span');
    el.textContent = s;
    return el.innerHTML;
  }

  function renderCard(item) {
    var d = item.date && item.date.indexOf(' ') === -1 ? fmtDate(item.date) : item.date;
    var href = item.url || '#';
    var arrow = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    return '<article class="news-card" data-id="' + item.id + '" itemscope itemtype="https://schema.org/BlogPosting">' +
      '<a class="news-card__media" href="' + esc(href) + '">' +
        '<span class="news-card__date"><time datetime="' + esc(item.date || '') + '">' + esc(d) + '</time></span>' +
        '<img src="' + esc(item.photo) + '" alt="' + esc(item.header) + '" loading="lazy" decoding="async">' +
      '</a>' +
      '<div class="news-card__body">' +
        '<h3 class="news-card__title" itemprop="headline"><a href="' + esc(href) + '">' + esc(item.header) + '</a></h3>' +
        '<p class="news-card__anons" itemprop="description">' + esc(item.anons) + '</p>' +
        '<a class="news-card__link" href="' + esc(href) + '">Подробнее ' + arrow + '</a>' +
      '</div>' +
    '</article>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var list     = document.getElementById('newsList');
    var sentinel = document.getElementById('newsSentinel');
    if (!list || !sentinel) return;

    var dataUrl   = list.getAttribute('data-url')      || '';
    var dataId    = list.getAttribute('data-id')       || 'news';
    var limit     = parseInt(list.getAttribute('data-limit'), 10) || 6;   // размер порции
    var total     = parseInt(list.getAttribute('data-total'), 10) || 0;   // ЖЁСТКИЙ максимум блока (0 = без ограничения)
    var isPreview = /\.js$/i.test(dataUrl);

    var loading = false;
    var done    = false;

    function countCards() { return list.querySelectorAll('.news-card').length; }
    function lastCard() {
      var cards = list.querySelectorAll('.news-card');
      return cards.length ? cards[cards.length - 1] : null;
    }

    /* ---------- Сентинел: наблюдаем за появлением в вьюпорте ---------- */
    function check() {
      if (loading || done) return;
      if (total > 0 && countCards() >= total) { finish(); return; }
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

    /* ---------- Загрузка очередной порции ---------- */
    function loadPage() {
      var last = lastCard();
      var lastId = last ? parseInt(last.getAttribute('data-id'), 10) || 0 : 0;

      // Жёсткий максимум: не запрашиваем больше, чем осталось до total.
      var batch = limit;
      if (total > 0) {
        var remaining = total - countCards();
        if (remaining <= 0) { finish(); return; }
        batch = Math.min(limit, remaining);
      }

      loading = true;
      sentinel.setAttribute('aria-busy', 'true');
      sentinel.classList.add('is-armed');

      var url = dataUrl + (dataUrl.indexOf('?') === -1 ? '?' : '&') +
                'id=' + encodeURIComponent(lastId) + '&limit=' + batch;

      if (isPreview) {
        loadPreview(url);
      } else {
        fetch(url)
          .then(function (r) { return r.json(); })
          .then(function (items) { recv(items || []); })
          .catch(function () { finish(); });
      }
    }

    /* Preview: та же логика, что для /ajax/news, но через script-запрос.
       Каждый вызов — НОВЫЙ GET (уникальная query), виден в DevTools. */
    function loadPreview(url) {
      var listener = function (e) {
        var d = e.detail;
        if (!d || d.id !== dataId) return;
        window.removeEventListener('t1:news', listener);
        recv(d.list || []);
      };
      window.addEventListener('t1:news', listener);

      var s = document.createElement('script');
      s.src = url;
      s.onerror = function () {
        window.removeEventListener('t1:news', listener);
        finish();
      };
      document.head.appendChild(s);
    }

    /* ---------- Обработка полученной порции ---------- */
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

      if (total > 0 && countCards() >= total) { finish(); return; }
      if (items.length < limit) finish();
    }

    /* ---------- Конец данных ---------- */
    function finish() {
      done = true;
      loading = false;
      if (io) io.disconnect();
      else window.removeEventListener('scroll', check);
      sentinel.classList.remove('is-armed');
      sentinel.setAttribute('aria-busy', 'false');
    }
  });
})();