/* ============================================================
   Файл: templates/t1/js/service_order.js
   Назначение: попап «Заказать услугу» на страницах услуг
   (service_list.html, service_in.html).

   Любая кнопка с классом .js-service-order и атрибутом data-service
   открывает модалку #serviceOrderModal и подставляет в неё название
   услуги (в видимую строку [data-service-name] и в скрытое поле
   input[name="service"]). Открытие — через js/jmodal.js (window.jmodalOpen).
   ============================================================ */
(function () {
  'use strict';

  function fill(modal, name) {
    var nameEl = modal.querySelector('[data-service-name]');
    if (nameEl) nameEl.textContent = name || '—';
    var hidden = modal.querySelector('input[name="service"]');
    if (hidden) hidden.value = name || '';
  }

  /* Публичный метод: обновить название услуги в попапе (использует service_in.js) */
  window.serviceOrderSet = function (name) {
    var modal = document.getElementById('serviceOrderModal');
    if (modal) fill(modal, name);
  };

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.js-service-order') : null;
    if (!btn) return;
    e.preventDefault();
    var modal = document.getElementById('serviceOrderModal');
    if (!modal) return;
    fill(modal, btn.getAttribute('data-service') || '');
    if (window.jmodalOpen) window.jmodalOpen('serviceOrderModal');
  });
})();
