/* ============================================================
   Файл: templates/t1/js/news_in.js
   Приложение страницы новости (/news/{id}). Обычный JS, без Vue.

   РЕЖИМЫ ДАННЫХ:
   - Preview: script-запрос js/preview/news_ajax_{id}.js (событие
     t1:news_in с detail { id, news });
   - Release: GET /ajax/news/{id} → JSON (запись + prev_id, next_id, url).

   НАВИГАЦИЯ:
   - id берётся из пути (/news/{id}) либо из ?id=;
   - «Предыдущая»/«Следующая» — prev_id/next_id из ответа сервера;
   - URL меняется через history.pushState на канонический url (data.url);
   - клик по карточке «Другие новости» (#newsMoreSplide) — та же навигация;
   - popstate возвращает назад.
   Гонки обрабатываются токеном запроса: применяется только ответ
   последнего загруженного id.
   ============================================================ */
window.__T1_NEWS_IN_VER = '2026-10-02';

(function () {
  'use strict';

  var MONTHS = ['января','февраля','марта','апреля','мая','июня',
                'июля','августа','сентября','октября','ноября','декабря'];

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* id из /news/{id} или ?id= */
  function idFromURL() {
    try {
      var m = window.location.pathname.match(/\/(\d+)\/?$/);
      if (m) return parseInt(m[1], 10);
      var p = new URL(window.location.href).searchParams.get('id');
      var n = parseInt(p, 10);
      return isNaN(n) ? null : n;
    } catch (e) {
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('newsIn');
    if (!root) return;

    var basePath  = root.getAttribute('data-url') || '/ajax/news/';
    var isPreview = root.getAttribute('data-mode') === 'preview';

    var titleEl  = document.getElementById('newsInTitle');
    var imgEl    = document.getElementById('newsInMedia');
    var dateEl   = document.getElementById('newsInDate');
    var bodyEl   = document.getElementById('newsInBody');
    var statusEl = document.getElementById('newsInStatus');
    var crumbEl  = document.getElementById('newsCrumb');
    var prevBtn  = document.getElementById('newsPrev');
    var nextBtn  = document.getElementById('newsNext');

    var currentId = null;
    var prevId = null, nextId = null;
    var req = 0; // токен против гонок

    /* ---------- Применение записи новости ---------- */
    function apply(data, push) {
      var id = Number(data.id);
      if (!id) return;
      currentId = id;

      if (titleEl) titleEl.textContent = data.title || data.header || '';
      if (imgEl) {
        imgEl.src = data.photo || '';
        imgEl.alt = (data.title || data.header || '') + ' — DigitalStrateg';
      }
      if (dateEl) {
        dateEl.setAttribute('datetime', data.registered_iso || data.date || '');
        dateEl.textContent = data.date || fmtDate(data.registered_iso);
      }
      if (bodyEl) {
        bodyEl.innerHTML = '';
        var pars = Array.isArray(data.body) ? data.body
                  : (data.anons ? [data.anons] : []);
        pars.forEach(function (text) {
          var p = document.createElement('p');
          p.textContent = text;
          bodyEl.appendChild(p);
        });
      }
      if (crumbEl) crumbEl.textContent = data.title || data.header || '';

      prevId = data.prev_id || null;
      nextId = data.next_id || null;

      syncDocTitle(data.title || data.header);
      syncButtons();

      if (push) {
        history.pushState({ id: id }, '', data.url || ('/news/' + id));
      }
    }

    function syncDocTitle(title) {
      if (!title) return;
      if (document.title.indexOf('DigitalStrateg') === -1) return;
      var t = title + ' — DigitalStrateg: новости компании';
      document.title = t;
      var og = document.querySelector('meta[property="og:title"]');
      if (og) og.setAttribute('content', t);
      var tw = document.querySelector('meta[name="twitter:title"]');
      if (tw) tw.setAttribute('content', t);
    }

    function syncButtons() {
      if (prevBtn) prevBtn.disabled = !prevId;
      if (nextBtn) nextBtn.disabled = !nextId;
    }

    function setBusy(busy) {
      root.classList.toggle('is-busy', busy);
      if (statusEl) statusEl.hidden = !busy;
    }

    /* ---------- Загрузка данных по id ---------- */
    function load(id, push) {
      id = parseInt(id, 10);
      if (isNaN(id)) return;

      var num = ++req;
      setBusy(true);

      var done = function () {
        if (num !== req) return;
        setBusy(false);
      };
      var fail = function () {
        if (num !== req) return;
        if (statusEl) { statusEl.textContent = 'Новость не найдена.'; }
        done();
      };

      if (isPreview) {
        var listener = function (e) {
          var d = e.detail;
          if (!d || Number(d.id) !== Number(id)) return;
          window.removeEventListener('t1:news_in', listener);
          if (num !== req) return;
          apply(d.news || {}, push);
          done();
        };
        window.addEventListener('t1:news_in', listener);
        var s = document.createElement('script');
        /* Метка сброса кеша (preview): см. preview_nocache.py */
        s.src = basePath + id + '.js?nocache=[]';
        s.onerror = function () {
          window.removeEventListener('t1:news_in', listener);
          fail();
        };
        document.head.appendChild(s);
        return;
      }

      fetch(basePath + id)
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) { if (num !== req) return; apply(d || {}, push); done(); })
        .catch(function () {
          /* Fallback: если детальный API недоступен, загружаем список
             новостей и определяем prev/next по порядку в списке. */
          fetch(basePath + '?limit=100')
            .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
            .then(function (list) {
              if (num !== req) return;
              if (!Array.isArray(list) || !list.length) return fail();
              /* Соседей ищем по id (как серверный _prev_next), а не по
                 порядку выдачи списка (он отсортирован по дате). */
              var rows = list.slice().sort(function (a, b) {
                return Number(a.id) - Number(b.id);
              });
              var ids = rows.map(function (n) { return Number(n.id); });
              var idx = ids.indexOf(Number(id));
              if (idx === -1) return fail();
              var prev = idx > 0 ? ids[idx - 1] : null;
              var next = idx < ids.length - 1 ? ids[idx + 1] : null;
              apply({
                id: id,
                title: (rows[idx].title || rows[idx].header || ''),
                photo: rows[idx].photo || '',
                body: rows[idx].body || [],
                date: rows[idx].date || '',
                prev_id: prev,
                next_id: next,
                url: rows[idx].url || ('/news/' + id)
              }, push);
              done();
            })
            .catch(fail);
        });
    }

    /* ---------- Навигация ---------- */
    function navigate(id, push) {
      id = parseInt(id, 10);
      if (isNaN(id) || id === currentId) return;
      load(id, push);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
      if (prevId) navigate(prevId, true);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      if (nextId) navigate(nextId, true);
    });

    /* Карусель «Другие новости»: клик по карточке — та же навигация */
    var more = document.getElementById('newsMoreSplide');
    if (more) {
      more.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var card = a.closest('[data-id]');
        if (!card) return;
        e.preventDefault();
        navigate(parseInt(card.getAttribute('data-id'), 10), true);
      });

      if (window.Splide) {
        new Splide(more, {
          type: 'loop', perPage: 3, perMove: 1, gap: 24,
          arrows: true, pagination: true,
          breakpoints: { 991: { perPage: 2 }, 575: { perPage: 1 } }
        }).mount();
      }
    }

    /* ---------- Старт и история ---------- */
    var startId = idFromURL() || parseInt(root.getAttribute("data-id"), 10) || null;
    if (startId) load(startId, false);

    window.addEventListener('popstate', function () {
      var id = idFromURL();
      if (id) load(id, false);
    });
  });
})();
