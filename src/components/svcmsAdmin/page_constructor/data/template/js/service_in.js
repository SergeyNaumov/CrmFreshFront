/* ============================================================
   Файл: templates/t1/js/service_in.js
   Приложение страницы услуги (preview/service_in.html, релиз —
   page/service_in.html). Обычный JS, без Vue (как article_in.js).

   ПРИНЦИП «SEO + догрузка»:
   В #serviceIn лежит статический блок — «серверная» версия последней
   услуги (id 8) для поисковиков. Поверх него приложение подгружает
   актуальную услугу по ?id= из URL и перерисовывает заголовок, обложку,
   иконку, аннонс, текст, хлебные крошки и <title>, а также название
   услуги в попапе «Заказать услугу».

   РЕЖИМЫ ДАННЫХ:
   - Preview: script-запрос js/preview/service_ajax_{id}.js (файл публикует
     событие t1:service_in с detail { id, service });
   - Release: AJAX GET /ajax/services/{id} → JSON (та же запись).
   Режим и базовый путь задаются атрибутами #serviceIn:
     data-mode="preview|release", data-url="{префикс до id}",
     data-min / data-max — границы списка.

   НАВИГАЦИЯ:
   - «Предыдущая» — услуга с меньшим id, «Следующая» — с большим;
     кнопки отключаются на краях; при переходе обновляются URL
     (history.pushState), <title>, og, крошки и активность кнопок;
     popstate возвращает назад. Гонки гасятся токеном запроса.
   ============================================================ */
window.__T1_SERVICE_IN_VER = '2026-09-29';

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

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('serviceIn');
    if (!root) return;

    var basePath  = root.getAttribute('data-url') || '';
    var isPreview = root.getAttribute('data-mode') === 'preview';
    var MIN_ID = parseInt(root.getAttribute('data-min'), 10) || 1;
    var MAX_ID = parseInt(root.getAttribute('data-max'), 10) || 8;

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
    var req = 0; // токен против гонок

    function idFromURL() {
      try {
        var p = new URL(window.location.href).searchParams.get('id');
        var n = parseInt(p, 10);
        return !isNaN(n) && n >= MIN_ID && n <= MAX_ID ? n : null;
      } catch (e) {
        return null;
      }
    }

    function apply(data, push) {
      var id = Number(data.id);
      currentId = id;

      if (titleEl) titleEl.textContent = data.title || '';
      if (imgEl) {
        imgEl.src = data.photo || '';
        imgEl.alt = (data.title || 'Услуга') + ' — DigitalStrateg';
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
      if (crumbEl) crumbEl.textContent = data.title || '';

      // Название услуги в попапе и на кнопках «Заказать услугу»
      if (window.serviceOrderSet) window.serviceOrderSet(data.title || '');
      document.querySelectorAll('.js-service-order').forEach(function (b) {
        b.setAttribute('data-service', data.title || '');
      });

      syncDocTitle(data.title);
      syncButtons(id);
      if (push) history.pushState(null, '', 'service_in.html?id=' + id);
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

    function syncButtons(id) {
      if (prevBtn) prevBtn.disabled = (id <= MIN_ID);
      if (nextBtn) nextBtn.disabled = (id >= MAX_ID);
    }

    function setBusy(busy) {
      root.classList.toggle('is-busy', busy);
      if (statusEl) statusEl.hidden = !busy;
    }

    function load(id, push) {
      id = parseInt(id, 10);
      if (isNaN(id) || id < MIN_ID || id > MAX_ID) return;

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
        .then(function (d) { apply(d || {}, push); done(); })
        .catch(fail);
    }

    function navigate(id, push) {
      id = parseInt(id, 10);
      if (isNaN(id) || id < MIN_ID || id > MAX_ID) return;
      if (id === currentId) return;
      load(id, push);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { navigate((currentId || MAX_ID) - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { navigate((currentId || MIN_ID) + 1, true); });

    navigate(idFromURL() || MAX_ID, false);

    window.addEventListener('popstate', function () { navigate(idFromURL() || MAX_ID, false); });
  });
})();
