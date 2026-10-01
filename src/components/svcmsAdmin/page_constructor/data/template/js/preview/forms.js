/* ============================================================
   Файл: templates/t1/js/preview/forms.js
   Назначение: HTTP-клиент для preview-режима (axios-совместимый).

   В релизе настоящий axios приносит бекенд/шаблон. Здесь — своя
   реализация на fetch, чтобы формы РЕАЛЬНО отправлялись по своему
   относительному URL (`/ajax/...`) даже на статическом превью.

   Поведение:
     POST <url>          → реальный fetch POST (JSON). Успех/ошибка —
                           по HTTP-статусу: !res.ok → reject (форма
                           покажет общую ошибку, попап не откроется).
     GET  <url>          → реальный fetch GET.
     GET  ...capcha...   → фейковый DEMO-ответ (капча в preview не
                           ходит на сервер; ключ фиктивный).

   Подключается ДО js/forms.js; если axios уже определён (релиз) —
   ничего не делает.
   ============================================================ */
(function () {
  'use strict';

  if (typeof window.axios !== 'undefined' && window.axios.post) return;

  /* Признак preview-режима для app.js (корзина): в preview корзина
     синхронизируется локально/через basket_info.js, а не запросами к
     серверу — даже несмотря на то, что здесь определён axios. */
  window.__T1_PREVIEW__ = true;

  var fakeSrc = 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="44">' +
    '<rect width="120" height="44" rx="6" fill="#eef1f6"/>' +
    '<text x="12" y="29" font-family="Arial, sans-serif" font-size="20" ' +
    'font-style="italic" fill="#33415c">DEMO</text></svg>'
  );

  function fakeCapcha() {
    return Promise.resolve({
      data: { success: 1, capture_key: 'preview-demo', capture_src: fakeSrc }
    });
  }

  /* Тело ответа → { data }. Пытаемся распарсить JSON, иначе отдаём текст. */
  function wrap(res) {
    return res.text().then(function (t) {
      var data;
      try { data = JSON.parse(t); } catch (e) { data = t; }
      return { data: data };
    });
  }

  window.axios = {
    get: function (url) {
      if (String(url).indexOf('capcha') !== -1) return fakeCapcha();
      return fetch(url, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return wrap(res);
      });
    },
    post: function (url, data) {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        body: JSON.stringify(data || {})
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return wrap(res);
      });
    }
  };
})();
