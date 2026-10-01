/* ============================================================
   Файл: templates/t1/js/news_in.js
   Приложение страницы новости (preview/news_in.html, релиз —
   page/news_in.html). Обычный JS, без Vue (как news-list.js).

   ПРИНЦИП «SEO + догрузка» (как в good_in.js):
   В #newsIn лежит статический блок — «серверная» версия самой
   свежей новости (id 14) для поисковиков. Поверх него приложение
   подгружает актуальную новость по ?id= из URL и перерисовывает
   заголовок, обложку, дату, текст, хлебные крошки и <title>.

   РЕЖИМЫ ДАННЫХ:
   - Preview: script-запрос js/preview/news_ajax_{id}.js (файл
     публикует событие t1:news_in с detail { id, news });
   - Release: AJAX GET /ajax/news/{id} → JSON (та же запись).
   Режим и базовый путь задаются атрибутами #newsIn:
     data-mode="preview|release", data-url="{префикс до id}".

   НАВИГАЦИЯ:
   - «Предыдущая» — более старая новость (id−1), «Следующая» — более
     новая (id+1); кнопки отключаются на краях списка (1 и 14);
   - клик по карточке в карусели «Другие новости» — то же переключение;
   - при переходе обновляются URL (history.pushState), <title>, og/tw,
     хлебные крошки, активность кнопок; popstate возвращает назад.
   Гонки обрабатываются токеном запроса: применяется только ответ
   последнего загруженного id.
   ============================================================ */
window.__T1_NEWS_IN_VER = '2026-09-22';

(function () {
  'use strict';

  var MONTHS = ['января','февраля','марта','апреля','мая','июня',
                'июля','августа','сентября','октября','ноября','декабря'];
  var MIN_ID = 1;
  var MAX_ID = 14;

  /* ---------- Формат "DD месяц ГГГГ" ---------- */
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }

  function idFromURL() {
    try {
      var p = new URL(window.location.href).searchParams.get('id');
      var n = parseInt(p, 10);
      return !isNaN(n) && n >= MIN_ID && n <= MAX_ID ? n : null;
    } catch (e) {
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('newsIn');
    if (!root) return;

    var basePath  = root.getAttribute('data-url') || '';
    var isPreview = root.getAttribute('data-mode') === 'preview';

    var titleEl  = document.getElementById('newsInTitle');
    var imgEl    = document.getElementById('newsInMedia');
    var dateEl   = document.getElementById('newsInDate');
    var bodyEl   = document.getElementById('newsInBody');
    var statusEl = document.getElementById('newsInStatus');
    var crumbEl  = document.getElementById('newsCrumb');
    var prevBtn  = document.getElementById('newsPrev');
    var nextBtn  = document.getElementById('newsNext');

    var currentId = null; // показанная новость
    var req      = 0;     // токен против гонок (быстрые переходы)

    /* ---------- Применение записи новости ---------- */
    function apply(data, push) {
      var id = Number(data.id);
      currentId = id;

      if (titleEl) titleEl.textContent = data.title;
      if (imgEl) {
        imgEl.src = data.photo || '';
        imgEl.alt = data.title + ' — DigitalStrateg';
      }
      if (dateEl) {
        dateEl.setAttribute('datetime', data.date || '');
        dateEl.textContent = fmtDate(data.date);
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
      if (crumbEl) crumbEl.textContent = data.title;

      syncDocTitle(data.title);
      syncButtons(id);

      if (push) history.pushState(null, '', window.location.pathname + '?id=' + id);
    }

    function syncDocTitle(title) {
      if (!title) return;
      // Меняем title только если на странице шаблон DigitalStrateg
      if (document.title.indexOf('DigitalStrateg') === -1) return;
      var t = title + ' — DigitalStrateg: новости компании';
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

    /* ---------- Загрузка данных по id ---------- */
    function load(id, push) {
      id = parseInt(id, 10);
      if (isNaN(id) || id < MIN_ID || id > MAX_ID) return;

      var num = ++req;
      setBusy(true);

      var done = function () {
        if (num !== req) return; // пришёл более новый запрос — игнорируем
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
        /* Метка сброса кеша: в data-url стоит ПРЕФИКС (id дописывается
           здесь), поэтому суффикс добавляется после .js.
           Инструмент: agent-doc/tools/preview_nocache.py */
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
        .then(function (d) { apply(d || {}, push); done(); })
        .catch(fail);
    }

    /* ---------- Навигация ---------- */
    function navigate(id, push) {
      id = parseInt(id, 10);
      if (isNaN(id) || id < MIN_ID || id > MAX_ID) return;
      if (id === currentId) return;
      load(id, push);
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
      navigate((currentId || MAX_ID) - 1, true);
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      navigate((currentId || MIN_ID) + 1, true);
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
          type: 'loop',
          perPage: 3,
          perMove: 1,
          gap: 24,
          arrows: true,
          pagination: true,
          breakpoints: {
            991: { perPage: 2 },
            575: { perPage: 1 }
          }
        }).mount();
      }
    }

    /* ---------- Старт и история ---------- */
    navigate(idFromURL() || MAX_ID, false);

    window.addEventListener('popstate', function () {
      navigate(idFromURL() || MAX_ID, false);
    });
  });
})();