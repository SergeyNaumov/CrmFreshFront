/* ============================================================
   countdown.js — обратный отсчёт (block/countdown.html).

   Разметка: [data-countdown][data-deadline][data-mode][data-hide-after].
   Режимы: until — до даты deadline (ISO); daily — до конца текущих суток.
   Значения выводятся в [data-cd-days|hours|minutes|seconds].
   Если время вышло и есть data-hide-after — блок скрывается.
   ============================================================ */
(function () {
  'use strict';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function deadline(cd) {
    var mode = cd.getAttribute('data-mode') || 'until';
    if (mode === 'daily') {
      var end = new Date();
      end.setHours(23, 59, 59, 999);
      return end;
    }
    var raw = cd.getAttribute('data-deadline');
    var d = raw ? new Date(raw) : null;
    if (!d || isNaN(d.getTime())) d = new Date(Date.now() + 86400000);
    return d;
  }

  function set(cd, unit, value) {
    var el = cd.querySelector('[data-cd-' + unit + ']');
    if (el) el.textContent = unit === 'days' ? String(value) : pad(value);
  }

  function tick(cd) {
    var diff = Math.max(0, deadline(cd).getTime() - Date.now());
    var s = Math.floor(diff / 1000);
    var days = Math.floor(s / 86400); s -= days * 86400;
    var hours = Math.floor(s / 3600); s -= hours * 3600;
    var minutes = Math.floor(s / 60);
    var seconds = s - minutes * 60;
    set(cd, 'days', days);
    set(cd, 'hours', hours);
    set(cd, 'minutes', minutes);
    set(cd, 'seconds', seconds);
    return diff > 0;
  }

  function init(cd) {
    if (!tick(cd)) {
      if (cd.hasAttribute('data-hide-after')) cd.hidden = true;
      return;
    }
    var timer = setInterval(function () {
      if (!tick(cd)) {
        clearInterval(timer);
        if (cd.hasAttribute('data-hide-after')) cd.hidden = true;
      }
    }, 1000);
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-countdown]'), init);
  });
})();
