/* ============================================================
   Файл: templates/t1/js/basket.js
   Назначение: страница корзины (page_type: basket).
   Подключается в index.html только при page_type == 'basket'.

   Состав:
     1. basket_app — Vue-приложение страницы корзины (#basket_page_wrap):
        читает глобальный store.state.basket, умеет −/+/удалить/очистить,
        содержит форму заказа (валидация + капча).
     2. Форма оформления заказа (#basketOrderForm) — реальный POST /zakaz
        (контракт agent-doc/05_forms_and_validation.md §5). При d.success:
        очистка корзины + показ модалки modal_basket_2.show(d.zakaz_id)
        (Vue-приложение в js/app.js, разметка в index.html).
        Атрибуты data-validate/data-success в разметке СНЯТЫ, чтобы
        демо-шим app.js не перехватывал отправку.

   Зависимости (порядок подключения в index.html):
     vue.global -> app.js -> этот файл -> form_builder.js (GET/POST/init_capcha)
     Инициализация отложена до DOMContentLoaded: к этому моменту
     form_builder.js уже выполнен и POST/init_capcha доступны.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  /* ---------- 1. Корзина на странице ---------- */
  var root = document.getElementById('basket_page_wrap');
  var vm = null;

  if (root && window.Vue && window.store) {
    vm = Vue.createApp({
      data: function () {
        return {
          store: window.store,
          capcha: '',       // введённый пользователем код капчи
          capcha_key: '',   // ключ капчи (запрос GET /capcha)
          capcha_src: ''    // url картинки капчи
        };
      },
      computed: {
        b: function () { return this.store.state.basket; },
        empty: function () { return this.b.inited && this.b.list.length === 0; },
        discount: function () {
          return Math.max(0, (Number(this.b.total_price) || 0) - (Number(this.b.total_price_with_sale) || 0));
        }
      },
      methods: {
        priceFmt: function (n) {
          return window.get_triade(Math.round(Number(n) || 0)) + ' ₽';
        },
        itemUrl: function (g) { return g.url || ('/product/' + g.id); },
        inc: function (g) { change_in_basket(g, (Number(g.cnt) || 0) + 1); },
        dec: function (g) {
          if ((Number(g.cnt) || 0) <= 1) del_from_basket(g);
          else change_in_basket(g, (Number(g.cnt) || 0) - 1);
        },
        remove: function (g) { del_from_basket(g); },
        clearAll: function () { if (window.clear_basket) clear_basket(false); },
        refreshCapcha: function () {
          if (typeof init_capcha === 'function') init_capcha(this);
        }
      },
      mounted: function () {
        if (typeof init_capcha === 'function') init_capcha(this);
      }
    }).mount(root);
  }

  /* ---------- 2. Форма оформления заказа ---------- */
  var form = document.getElementById('basketOrderForm');
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"]');
  var accept = form.querySelector('input[type="checkbox"][name="accept"]');
  var errorAll = form.querySelector('.basket-order__error');

  function field(name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value : '';
  }

  function validate() {
    var ok = true;
    form.querySelectorAll('[required]').forEach(function (f) {
      var fine = f.type === 'checkbox' ? f.checked : f.value.trim().length > 0;
      f.classList.toggle('is-invalid', !fine);
      if (!fine) ok = false;
    });
    return ok;
  }

  /* Кнопка заблокирована, пока не отмечено согласие на обработку ПД */
  if (submitBtn && accept) {
    var syncAccept = function () { submitBtn.disabled = !accept.checked; };
    accept.addEventListener('change', syncAccept);
    syncAccept();
  }

  /* Снимаем подсветку ошибки с поля при вводе */
  form.querySelectorAll('[required]').forEach(function (f) {
    f.addEventListener('input', function () { f.classList.remove('is-invalid'); });
    f.addEventListener('change', function () { f.classList.remove('is-invalid'); });
  });

  function resetErrors() {
    if (errorAll) { errorAll.textContent = ''; errorAll.hidden = true; }
    form.querySelectorAll('.is-invalid').forEach(function (f) { f.classList.remove('is-invalid'); });
  }

  /* Маска телефона — общий хелпер из form_builder.js */
  var phoneEl = form.querySelector('[name="phone"]');
  if (phoneEl && typeof replace_phone === 'function') {
    phoneEl.addEventListener('input', function () {
      phoneEl.value = replace_phone(phoneEl.value);
    });
  }

  /* Адрес обязателен только для доставки (не для самовывоза) */
  var deliveryEl = form.querySelector('[name="delivery"]');
  var addressEl = form.querySelector('[name="address"]');
  function syncDelivery() {
    if (!deliveryEl || !addressEl) return;
    var need = deliveryEl.value !== 'pickup';
    addressEl.required = need;
    var label = addressEl.closest('div') ? addressEl.closest('div').querySelector('label') : null;
    if (label) label.textContent = need ? 'Адрес доставки *' : 'Адрес доставки';
  }
  if (deliveryEl) { deliveryEl.addEventListener('change', syncDelivery); syncDelivery(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    resetErrors();

    if (!validate()) {
      if (window.showToast) showToast('Пожалуйста, заполните обязательные поля');
      return;
    }

    /* Список товаров: { id: cnt, id: cnt, ... } */
    var list = {};
    var basket = (window.store && window.store.state.basket) || {};
    (basket.list || []).forEach(function (g) { list[g.id] = g.cnt; });

    var t = vm; // реактивные поля капчи
    POST({
      url: '/zakaz',
      data: {
        action: 'form_send',
        name: field('name'),
        phone: field('phone'),
        email: field('email'),
        delivery: field('delivery'),
        address: field('address'),
        comment: field('comment'),
        capcha_key: (t && t.capcha_key) || '',
        capcha: (t && t.capcha) || '',
        capture_str: (t && t.capcha) || '',
        list: list
      },
      success: function (d) {
        if (d && d.success) {
          if (window.clear_basket) clear_basket(false);
          form.reset();
          if (t) {
            t.capcha = '';
            if (typeof init_capcha === 'function') init_capcha(t);
          }
          if (window.modal_basket_2 && window.modal_basket_2.show) {
            window.modal_basket_2.show(d.zakaz_id);
          }
          return;
        }

        /* Ошибки полей с бекенда: { field: 'текст' } */
        if (d && d.error) {
          Object.keys(d.error).forEach(function (k) {
            var f = form.querySelector('[name="' + k + '"]');
            if (f) f.classList.add('is-invalid');
          });
        }

        var msg = (d && d.error_all) || 'Не удалось отправить заказ. Попробуйте ещё раз.';
        if (errorAll) {
          errorAll.textContent = msg;
          errorAll.hidden = false;
        } else if (window.showToast) {
          showToast(msg);
        }
        if (t && typeof init_capcha === 'function') init_capcha(t);
      },
      error: function () {
        if (window.showToast) showToast('Ошибка сети. Попробуйте ещё раз.');
        if (t && typeof init_capcha === 'function') init_capcha(t);
      }
    });
  });
});
