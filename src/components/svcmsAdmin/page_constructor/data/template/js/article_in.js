/* ============================================================
   Файл: templates/t1/js/article_in.js
   Приложение страницы статьи (/article/{id}). Обычный JS, без Vue.

   РЕЖИМЫ ДАННЫХ:
   - Preview: script-запрос js/preview/article_ajax_{id}.js (событие
     t1:article_in с detail { id, article });
   - Release: GET /ajax/articles/{id} → JSON (запись + prev_id, next_id, url).

   НАВИГАЦИЯ:
   - id берётся из пути (/article/{id}) либо из ?id=;
   - «Предыдущая»/«Следующая» — prev_id/next_id из ответа сервера;
   - URL меняется через history.pushState на канонический url (data.url);
   - popstate возвращает назад.
   Гонки обрабатываются токеном запроса: применяется только ответ
   последнего загруженного id.
   ============================================================ */
window.__T1_ARTICLE_IN_VER = '2026-10-02';

(function () {
  'use strict';

  /* id из /article/{id} или ?id= */
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
    var root = document.getElementById('articleIn');
    if (!root) return;

    var basePath  = root.getAttribute('data-url') || '/ajax/articles/';
    var isPreview = root.getAttribute('data-mode') === 'preview';

    var titleEl   = document.getElementById('articleInTitle');
    var imgEl     = document.getElementById('articleInMedia');
    var anonsEl   = document.getElementById('articleInAnons');
    var bodyEl    = document.getElementById('articleInBody');
    var statusEl  = document.getElementById('articleInStatus');
    var crumbEl   = document.getElementById('articleCrumb');
    var prevBtn   = document.getElementById('articlePrev');
    var nextBtn   = document.getElementById('articleNext');
    var metaEl    = document.getElementById('articleInMeta');
    var authorEl  = document.getElementById('articleInAuthor');

    var currentId = null;
    var prevId = null, nextId = null;
    var req = 0; // токен против гонок

    /* ---------- Применение записи статьи ---------- */
    function apply(data, push) {
      var id = Number(data.id);
      if (!id) return;
      currentId = id;

      if (titleEl) titleEl.textContent = data.title || data.header || '';
      if (imgEl) {
        imgEl.src = data.photo || '';
        imgEl.alt = (data.title || data.header || '') + ' — DigitalStrateg';
      }
      if (anonsEl) anonsEl.textContent = data.anons || '';

      if (authorEl) authorEl.textContent = data.author || '';
      if (metaEl) {
        if (data.author) metaEl.removeAttribute('hidden');
        else metaEl.setAttribute('hidden', '');
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
        history.pushState({ id: id }, '', data.url || ('/article/' + id));
      }
    }

    function syncDocTitle(title) {
      if (!title) return;
      if (document.title.indexOf('DigitalStrateg') === -1) return;
      var t = title + ' — DigitalStrateg: статьи';
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
        if (statusEl) { statusEl.textContent = 'Статья не найдена.'; }
        done();
      };

      if (isPreview) {
        var listener = function (e) {
          var d = e.detail;
          if (!d || Number(d.id) !== Number(id)) return;
          window.removeEventListener('t1:article_in', listener);
          if (num !== req) return;
          apply(d.article || {}, push);
          done();
        };
        window.addEventListener('t1:article_in', listener);
        var s = document.createElement('script');
        /* Метка сброса кеша (preview): см. preview_nocache.py */
        s.src = basePath + id + '.js?nocache=[]';
        s.onerror = function () {
          window.removeEventListener('t1:article_in', listener);
          fail();
        };
        document.head.appendChild(s);
        return;
      }

      fetch(basePath + id)
        .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
        .then(function (d) { if (num !== req) return; apply(d || {}, push); done(); })
        .catch(fail);
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

    /* ---------- Старт и история ---------- */
    var startId = idFromURL() || parseInt(root.getAttribute("data-id"), 10) || null;
    if (startId) load(startId, false);

    window.addEventListener('popstate', function () {
      var id = idFromURL();
      if (id) load(id, false);
    });
  });
})();
