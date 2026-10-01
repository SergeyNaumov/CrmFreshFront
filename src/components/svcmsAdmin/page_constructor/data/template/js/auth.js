/* ============================================================
   Файл: templates/t1/js/auth.js
   Назначение: модальные формы авторизации (вход / восстановление /
   сброс пароля) из block/auth.html. Формы — form_builder.js.
   Эндпоинты: /ajax/login, /ajax/forgot, /ajax/reset.
   Подключается после form_builder.js/forms.js/jmodal.js.
   ============================================================ */
(function () {
  'use strict';

  if (typeof Form === 'undefined') return; // нет form_builder — выход

  window.__T1_AUTH_VER = '2026-09-25-auth-modal';

  var AUTH_MODALS = ['modal_login', 'modal_forgot', 'modal_reset'];

  /* ---------- Вход ---------- */
  Form({
    el: '#form_login_wrap',
    action_url: '/ajax/login',
    formdata: false,
    fields: [
      { name: 'action', value: 'login' },
      { name: 'email', chk: 'email', value: '' },
      { name: 'password', chk: 'required', value: '' }
    ],
    success: function () {
      if (window.jmodalClose) jmodalClose('modal_login');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });

  /* ---------- Восстановление пароля ---------- */
  Form({
    el: '#form_forgot_wrap',
    action_url: '/ajax/forgot',
    formdata: false,
    fields: [
      { name: 'action', value: 'forgot' },
      { name: 'email', chk: 'email', value: '' },
      { name: 'capcha', chk: 'required', value: '', not_submit: false }
    ],
    success: function () {
      if (window.jmodalClose) jmodalClose('modal_forgot');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });

  /* ---------- Сброс пароля ---------- */
  Form({
    el: '#form_reset_wrap',
    action_url: '/ajax/reset',
    formdata: false,
    fields: [
      { name: 'action', value: 'reset' },
      { name: 'reset_token', value: '' },
      { name: 'password', chk: 'required', value: '' },
      { name: 'password2', chk: 'required', value: '' }
    ],
    success: function () {
      if (window.jmodalClose) jmodalClose('modal_reset');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });

  /* ---------- Переключение видов (вход ↔ восстановление) ---------- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest('.js-auth-switch') : null;
    if (!el) return;
    e.preventDefault();
    AUTH_MODALS.forEach(function (id) { if (window.jmodalClose) jmodalClose(id); });
    var target = el.getAttribute('data-auth-open');
    if (target && window.jmodalOpen) jmodalOpen(target);
  });

  /* ---------- Открытие сброса по ссылке из письма (?reset_token=…) ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var token = '';
    try { token = new URL(window.location.href).searchParams.get('reset_token') || ''; } catch (e) { token = ''; }
    if (!token) return;
    var inp = document.getElementById('auth_reset_token');
    if (inp) {
      inp.value = token;
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (window.jmodalOpen) jmodalOpen('modal_reset');
  });
})();
