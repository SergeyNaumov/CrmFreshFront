/* ============================================================
   Файл: templates/t1/js/service_in.js
   Приложение страницы услуги (/service/{id}). Обычный JS, без Vue.

   РЕЖИМЫ ДАННЫХ:
   - Preview: script-запрос js/preview/service_ajax_{id}.js (событие
     t1:service_in с detail { id, service });
   - Release: GET /ajax/services/{id} → JSON (запись + prev_id, next_id, url).

   НАВИГАЦИЯ:
   - id берётся из пути (/service/{id}) либо из ?id=;
   - «Предыдущая»/«Следующая» — prev_id/next_id из ответа сервера;
   - URL меняется через history.pushState на канонический url (data.url,
     ЧПУ-слаг при наличии); popstate возвращает назад.
   ============================================================ */
window.__T1_SERVICE_IN_VER = '2026-10-02';

(function () {
  'use strict';

  function setIcon(el, icon) {
    if (!el) return;
    if (!icon) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    if (/^i-/.test(icon)) {
      el.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#' + icon + '"></use></svg>';
    } else {
      el.textContent = icon;
    }
  }

  /* id из /service/{id} или ?id= */
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
    var root = document.getElementById('serviceIn');
    if (!root) return;

    var basePath  = root.getAttribute('data-url') || '/ajax/services/';
    var isPreview = root.getAttribute('data-mode') === 'preview';

    var titleEl  = document.getElementById('serviceInTitle');
    var imgEl    = document.getElementById('serviceInMedia');
    var iconEl   = document.getElementById('serviceInIcon');
    var priceEl  = document.getElementById('serviceInPrice');
    var priceWrapEl = document.getElementById('serviceInPriceWrap');
    var anonsEl  = document.getElementById('serviceInAnons');
    var bodyEl   = document.getElementById('serviceInBody');
    var statusEl = document.getElementById('serviceInStatus');
    var crumbEl  = document.getElementById('serviceCrumb');
    var prevBtn  = document.getElementById('servicePrev');
    var nextBtn  = document.getElementById('serviceNext');

    var currentId = null;
    var prevId = null, nextId = null;
    var req = 0; // токен против гонок

    function apply(data, push) {
      var id = Number(data.id);
      if (!id) return;
      currentId = id;

      var title = data.header || data.title || '';
      if (titleEl) titleEl.textContent = title;
      if (imgEl) {
        imgEl.src = data.photo || '';
        imgEl.alt = (title || 'Услуга') + ' — DigitalStrateg';
      }
      setIcon(iconEl, data.icon || '');
      if (priceEl) priceEl.textContent = data.price_from || '';
      if (priceWrapEl) priceWrapEl.hidden = !data.price_from;
      if (anonsEl) anonsEl.textContent = data.anons || '';
      if (bodyEl) {
        bodyEl.innerHTML = '';
        var pars = Array.isArray(data.body) ? data.body : (data.anons ? [data.anons] : []);
        pars.forEach(function (text) {
          var p = document.createElement('p');
          p.textContent = text;
          bodyEl.appendChild(p);
        });
      }
      if (crumbEl) crumbEl.textContent = title;

      if (window.serviceOrderSet) window.serviceOrderSet(title);
      document.querySelectorAll('.js-service-order').forEach(function (b) {
        b.setAttribute('data-service', title);
      });

      prevId = data.prev_id || null;
      nextId = data.next_id || null;

      syncDocTitle(title);
      syncButtons();
      if (push) {
        history.pushState({ id: id }, '', data.url || ('/service/' + id));
      }
    }

    function syncDocTitle(title) {
      if (!title || document.title.indexOf('DigitalStrateg') === -1) return;
      var t = title + ' — DigitalStrateg: услуги';
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

    function load(id, push) {
      id = parseInt(id, 10);
      if (isNaN(id)) return;

      var num = ++req;
      setBusy(true);

      var done = function () { if (num === req) setBusy(false); };
      var fail = function () {
        if (num !== req) return;
        if (statusEl) statusEl.textContent = 'Услуга не найдена.';
        done();
      };

      if (isPreview) {
        var listener = function (e) {
          var d = e.detail;
          if (!d || Number(d.id) !== Number(id)) return;
          window.removeEventListener('t1:service_in', listener);
          if (num !== req) return;
          apply(d.service || {}, push);
          done();
        };
        window.addEventListener('t1:service_in', listener);
        var s = document.createElement('script');
        s.src = basePath + id + '.js';
        s.onerror = function () {
          window.removeEventListener('t1:service_in', listener);
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

    function navigate(id, push) {
      id = parseInt(id, 10);
      if (isNaN(id) || id === currentId) return;
      load(id, push);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { if (prevId) navigate(prevId, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (nextId) navigate(nextId, true); });

    var startId = idFromURL() || parseInt(root.getAttribute("data-id"), 10) || null;
    if (startId) load(startId, false);

    window.addEventListener('popstate', function () {
      var id = idFromURL();
      if (id) load(id, false);
    });
  });
})();
