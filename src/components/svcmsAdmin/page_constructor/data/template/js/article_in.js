/* ============================================================
   Файл: templates/t1/js/article_in.js
   Приложение страницы статьи (preview/article_in.html, релиз —
   page/article_in.html). Обычный JS, без Vue (как news_in.js).

   ПРИНЦИП «SEO + догрузка»:
   В #articleIn лежит статический блок — «серверная» версия самой
   свежей статьи (id 8) для поисковиков. Поверх него приложение
   подгружает актуальную статью по ?id= из URL и перерисовывает
   заголовок, обложку, текст, автора, хлебные крошки и <title>.

   АВТОР (поле необязательное):
   Блок #articleInMeta рендерится сервером всегда, но пустое значение
   даёт атрибут hidden (в CSS для .article-in__meta[hidden] жёстко
   задан display:none). Здесь он точно так же показывается/гасится по
   data.author — иначе при переходе на статью с автором он бы не появился.

   РЕЖИМЫ ДАННЫХ:
   - Preview: script-запрос js/preview/article_ajax_{id}.js (файл
     публикует событие t1:article_in с detail { id, article });
   - Release: AJAX GET /ajax/articles/{id} → JSON (та же запись).
   Режим и базовый путь задаются атрибутами #articleIn:
     data-mode="preview|release", data-url="{префикс до id}".

   НАВИГАЦИЯ:
   - «Предыдущая» — более старая статья (id−1), «Следующая» — более
     новая (id+1); кнопки отключаются на краях списка (1 и 8);
   - при переходе обновляются URL (history.pushState), <title>, og/tw,
     хлебные крошки и активность кнопок; popstate возвращает назад.
   Гонки обрабатываются токеном запроса: применяется только ответ
   последнего загруженного id.
   ============================================================ */
window.__T1_ARTICLE_IN_VER = '2026-09-25';

(function () {
  'use strict';

  var MIN_ID = 1;
  var MAX_ID = 8;

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
    var root = document.getElementById('articleIn');
    if (!root) return;

    var basePath  = root.getAttribute('data-url') || '';
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
    var req      = 0; // токен против гонок (быстрые переходы)

    /* ---------- Применение записи статьи ---------- */
    function apply(data, push) {
      var id = Number(data.id);
      currentId = id;

      if (titleEl) titleEl.textContent = data.title;
      if (imgEl) {
        imgEl.src = data.photo || '';
        imgEl.alt = data.title + ' — DigitalStrateg';
      }
      if (anonsEl) anonsEl.textContent = data.anons || '';

      // Автор — необязательное поле. Блок .article-in__meta есть в DOM
      // всегда, поэтому здесь только наполняем и гасим/показываем его:
      // у догруженной статьи автор может быть, а у серверной — нет
      // (и наоборот).
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
      if (crumbEl) crumbEl.textContent = data.title;

      syncDocTitle(data.title);
      syncButtons(id);

      if (push) history.pushState(null, '', window.location.pathname + '?id=' + id);
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
        /* Метка сброса кеша: в data-url стоит ПРЕФИКС (id дописывается
           здесь), поэтому суффикс добавляется после .js.
           Инструмент: agent-doc/tools/preview_nocache.py */
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

    /* ---------- Старт и история ---------- */
    navigate(idFromURL() || MAX_ID, false);

    window.addEventListener('popstate', function () {
      navigate(idFromURL() || MAX_ID, false);
    });
  });
})();