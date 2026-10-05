/* ============================================================
   Файл: templates/t1/js/forms.js
   Назначение: инициализация ВСЕХ форм шаблона T1 (F-01..F-31,
   каталог — agent-doc/05_forms_and_validation.md) через form_builder.js.

   Зависимости (в порядке подключения на странице):
     1. vue.global.prod.js   — Vue 3 (createApp), build с компилятором;
     2. form_builder.js      — Form({ el, action_url, fields, ... });
     3. js/preview/forms.js  — preview-режим: реальный fetch-клиент
                               (axios-совместимый; капча — фейковая DEMO);
     4. js/forms.js          — этот файл;
     5. jmodal.js            — попапы (.jmodal) и #modal_thanks.

   form_builder портирован на Vue 3: каждый Form() = Vue.createApp().mount().
   Успешная отправка -> jmodalOpen('modal_thanks'); ошибка запроса ->
   общий текст в error.__form (попап не открывается).
   formdata: false (JSON); formdata: true (загрузка файлов) не реализован в
   POST-хелпере form_builder.js — для F-13/F-19 файловый input только UI.
   ============================================================ */
(function () {
  'use strict';


  var mktu_list = ['Класс 09', 'Класс 25', 'Класс 35', 'Класс 42', 'Не знаю'];
  var position_list = ['Менеджер', 'Разработчик', 'Дизайнер', 'Маркетолог', 'Другое'];
  var rating_list = ['1', '2', '3', '4', '5'];
  var service_list = ['Паспорт РФ', 'Прописка', 'Справки и выписки', 'Загранпаспорт', 'Соцвыплаты'];
  var source_list = ['Реклама', 'Поисковик', 'Соцсети', 'Рекомендация', 'Другое'];
  var specialist_list = ['Тихонов А.В.', 'Смирнова Е.', 'Иванов П.', 'Неважно'];
  var theme_list = ['Общие вопросы', 'Выбор техники', 'Настройка оборудования', 'Сервис и ремонт'];
  var time_list = ['8:00-13:00', '13:00-18:00'];
  var type_list = ['Жалоба', 'Предложение', 'Благодарность'];
  /* F-06 · Заказать в 1 клик: способы доставки. Адрес нужен только курьеру. */
  var delivery_list = ['Курьером', 'Самовывоз из магазина'];



  /* F-01 · Отправить заявку (/ajax/modal-send-request) */
  var send_request = Form({
    el: '#form_send_request_wrap',
    action_url: '/ajax/modal-send-request',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'time', value:time_list[0] },
    { name:'time_list', value:time_list, not_submit:true },
    { name:'message', chk:'required', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-02 · Задать вопрос (/ajax/ask-question) */
  var ask_question = Form({
    el: '#form_ask_question_wrap',
    action_url: '/ajax/ask-question',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'question', chk:'required', value:'' },
    { name:'email', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-03 · Обратный звонок (/ajax/callback) */
  var callback = Form({
    el: '#form_callback_wrap',
    action_url: '/ajax/callback',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'time', value:time_list[0] },
    { name:'time_list', value:time_list, not_submit:true },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-04 · Отправить отзыв (/ajax/send-review, попап) */
  var send_review = Form({
    el: '#form_send_review_wrap',
    action_url: '/ajax/send-review',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'rating', chk:'required', value:'' },
    { name:'rating_list', value:rating_list, not_submit:true },
    { name:'message', chk:'required', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-05 · Получить консультацию (/ajax/consultation) */
  var consultation = Form({
    el: '#form_consultation_wrap',
    action_url: '/ajax/consultation',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', value:'' },
    { name:'theme', chk:'required', value:theme_list[0] },
    { name:'theme_list', value:theme_list, not_submit:true },
    { name:'time', chk:'required', value:time_list[0] },
    { name:'time_list', value:time_list, not_submit:true },
    { name:'message', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-06 · Заказать в 1 клик (/ajax/buy-one-click).
     Товар (good_id/good_name) подставляет карточка товара, из которой
     нажали кнопку (js/good_in.js пишет их в атрибуты модалки). */
  var buy_one_click = Form({
    el: '#form_buy_one_click_wrap',
    action_url: '/ajax/buy-one-click',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'good_id', value:'42' },
    { name:'good_name', value:'Смартфон X1 Pro' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'delivery', value:delivery_list[0], chk:'required' },
    { name:'delivery_list', value:delivery_list, not_submit:true },
    /* need_address — адрес обязателен только при доставке курьером
       (правило читает поле delivery; см. form_builder.js). */
    { name:'address', chk:'need_address', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-07 · Не нашли что искали? (/ajax/not-found-request) */
  var not_found_request = Form({
    el: '#form_not_found_request_wrap',
    action_url: '/ajax/not-found-request',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'request', chk:'required', value:'' },
    { name:'email', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-08 · Хотите сотрудничать? (/ajax/collaborate) */
  var collaborate = Form({
    el: '#form_collaborate_wrap',
    action_url: '/ajax/collaborate',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'company', value:'' },
    { name:'site', value:'' },
    { name:'message', chk:'required', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-09 · Не нашли нужную услугу? (/ajax/no-service) */
  var no_service = Form({
    el: '#form_no_service_wrap',
    action_url: '/ajax/no-service',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'service', chk:'required', value:'' },
    { name:'email', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-10 · Узнать цену (/ajax/get-price) */
  var get_price = Form({
    el: '#form_get_price_wrap',
    action_url: '/ajax/get-price',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'item_id', value:'7' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', value:'' },
    { name:'message', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-11 · Заказать прайс (/ajax/get-pricelist) */
  var get_pricelist = Form({
    el: '#form_get_pricelist_wrap',
    action_url: '/ajax/get-pricelist',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'company', value:'' },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-12 · Индивидуальный расчёт (/ajax/custom-calc) */
  var custom_calc = Form({
    el: '#form_custom_calc_wrap',
    action_url: '/ajax/custom-calc',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'task', chk:'required', value:'' },
    { name:'volume', value:'' },
    { name:'deadline', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-13 · Откликнуться на вакансию (/ajax/job-apply, попап) */
  var job_apply = Form({
    el: '#form_job_apply_wrap',
    action_url: '/ajax/job-apply',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'position', value:'' },
    { name:'position_list', value:position_list, not_submit:true },
    { name:'cover', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-14 · Бесплатный выезд замерщика (/ajax/free-measure) */
  var free_measure = Form({
    el: '#form_free_measure_wrap',
    action_url: '/ajax/free-measure',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'address', chk:'required', value:'' },
    { name:'time', chk:'required', value:time_list[0] },
    { name:'time_list', value:time_list, not_submit:true },
    { name:'comment', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-15 · Рассчитать стоимость (/ajax/calc-cost) */
  var calc_cost = Form({
    el: '#form_calc_cost_wrap',
    action_url: '/ajax/calc-cost',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'params', chk:'required', value:'' },
    { name:'email', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-16 · Забронировать (/ajax/booking) */
  var booking = Form({
    el: '#form_booking_wrap',
    action_url: '/ajax/booking',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', value:'' },
    { name:'date', chk:'required', value:'' },
    { name:'time', value:time_list[0] },
    { name:'time_list', value:time_list, not_submit:true },
    { name:'comment', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-17 · Подписаться на рассылку (/ajax/subscribe) */
  var subscribe = Form({
    el: '#form_subscribe_wrap',
    action_url: '/ajax/subscribe',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'email', chk:'email', value:'' },
    { name:'name', value:'' },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-18 · Записаться на мероприятие (/ajax/event-register, попап) */
  var event_register = Form({
    el: '#form_event_register_wrap',
    action_url: '/ajax/event-register',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'event_id', value:'3' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'comment', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-19 · Оценить ремонт по фото (/ajax/estimate-by-photo, попап) */
  var estimate_by_photo = Form({
    el: '#form_estimate_by_photo_wrap',
    action_url: '/ajax/estimate-by-photo',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'desc', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-20 · Анкета до 10 полей (/ajax/complex-form) */
  var complex_form_10 = Form({
    el: '#form_complex_form_10_wrap',
    action_url: '/ajax/complex-form',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
      { name:'q1', chk:'required', value:'' },
      { name:'q2', chk:'required', value:'Продажи' },
      { name:'q3', value:'' },
      { name:'q4', chk:'required', value:'' },
      { name:'q5', value:'' },
      { name:'q6', chk:'required', value:'' },
      { name:'q7', value:'' },
      { name:'complex_fields', value:[
        { key:'q1', label:'Дополнительные данные', type:'text', req:true },
        { key:'q2', label:'Отдел / направление 2', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q3', label:'Комментарий 3', type:'textarea', req:false, full:true },
        { key:'q4', label:'Дата 4', type:'date', req:true },
        { key:'q5', label:'Удобный способ связи 5', type:'radio', req:false, list:['Телефон', 'Email', 'WhatsApp', 'Telegram'] },
        { key:'q6', label:'Поле 6', type:'text', req:true },
        { key:'q7', label:'Дополнительные данные 7', type:'text', req:false }
      ], not_submit:true },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    methods: { fieldVal: function (n) { return this[n]; } },
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-21 · Анкета до 20 полей (/ajax/complex-form-20) */
  var complex_form_20 = Form({
    el: '#form_complex_form_20_wrap',
    action_url: '/ajax/complex-form-20',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
      { name:'q1', chk:'required', value:'' },
      { name:'q2', chk:'required', value:'Продажи' },
      { name:'q3', value:'' },
      { name:'q4', chk:'required', value:'' },
      { name:'q5', value:'' },
      { name:'q6', chk:'required', value:'' },
      { name:'q7', value:'' },
      { name:'q8', chk:'required', value:'Продажи' },
      { name:'q9', value:'' },
      { name:'q10', chk:'required', value:'' },
      { name:'q11', value:'' },
      { name:'q12', chk:'required', value:'' },
      { name:'q13', value:'' },
      { name:'q14', chk:'required', value:'Продажи' },
      { name:'q15', value:'' },
      { name:'q16', chk:'required', value:'' },
      { name:'q17', value:'' },
      { name:'complex_fields', value:[
        { key:'q1', label:'Дополнительные данные', type:'text', req:true },
        { key:'q2', label:'Отдел / направление 2', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q3', label:'Комментарий 3', type:'textarea', req:false, full:true },
        { key:'q4', label:'Дата 4', type:'date', req:true },
        { key:'q5', label:'Удобный способ связи 5', type:'radio', req:false, list:['Телефон', 'Email', 'WhatsApp', 'Telegram'] },
        { key:'q6', label:'Поле 6', type:'text', req:true },
        { key:'q7', label:'Дополнительные данные 7', type:'text', req:false },
        { key:'q8', label:'Отдел / направление 8', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q9', label:'Комментарий 9', type:'textarea', req:false, full:true },
        { key:'q10', label:'Дата 10', type:'date', req:true },
        { key:'q11', label:'Удобный способ связи 11', type:'radio', req:false, list:['Телефон', 'Email', 'WhatsApp', 'Telegram'] },
        { key:'q12', label:'Поле 12', type:'text', req:true },
        { key:'q13', label:'Дополнительные данные 13', type:'text', req:false },
        { key:'q14', label:'Отдел / направление 14', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q15', label:'Комментарий 15', type:'textarea', req:false, full:true },
        { key:'q16', label:'Дата 16', type:'date', req:true },
        { key:'q17', label:'Удобный способ связи 17', type:'radio', req:false, list:['Телефон', 'Email', 'WhatsApp', 'Telegram'] }
      ], not_submit:true },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    methods: { fieldVal: function (n) { return this[n]; } },
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-22 · Анкета до 30 полей (/ajax/complex-form-30) */
  var complex_form_30 = Form({
    el: '#form_complex_form_30_wrap',
    action_url: '/ajax/complex-form-30',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
      { name:'q1', chk:'required', value:'' },
      { name:'q2', chk:'required', value:'Продажи' },
      { name:'q3', value:'' },
      { name:'q4', chk:'required', value:'' },
      { name:'q5', value:'' },
      { name:'q6', chk:'required', value:'' },
      { name:'q7', value:'' },
      { name:'q8', chk:'required', value:'Продажи' },
      { name:'q9', value:'' },
      { name:'q10', chk:'required', value:'' },
      { name:'q11', value:'' },
      { name:'q12', chk:'required', value:'' },
      { name:'q13', value:'' },
      { name:'q14', chk:'required', value:'Продажи' },
      { name:'q15', value:'' },
      { name:'q16', chk:'required', value:'' },
      { name:'q17', value:'' },
      { name:'q18', chk:'required', value:'' },
      { name:'q19', value:'' },
      { name:'q20', chk:'required', value:'Продажи' },
      { name:'q21', value:'' },
      { name:'q22', chk:'required', value:'' },
      { name:'q23', value:'' },
      { name:'q24', chk:'required', value:'' },
      { name:'q25', value:'' },
      { name:'q26', chk:'required', value:'Продажи' },
      { name:'q27', value:'' },
      { name:'complex_fields', value:[
        { key:'q1', label:'Дополнительные данные', type:'text', req:true },
        { key:'q2', label:'Отдел / направление 2', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q3', label:'Комментарий 3', type:'textarea', req:false, full:true },
        { key:'q4', label:'Дата 4', type:'date', req:true },
        { key:'q5', label:'Удобный способ связи 5', type:'radio', req:false, list:['Телефон', 'Email', 'WhatsApp', 'Telegram'] },
        { key:'q6', label:'Поле 6', type:'text', req:true },
        { key:'q7', label:'Дополнительные данные 7', type:'text', req:false },
        { key:'q8', label:'Отдел / направление 8', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q9', label:'Комментарий 9', type:'textarea', req:false, full:true },
        { key:'q10', label:'Дата 10', type:'date', req:true },
        { key:'q11', label:'Удобный способ связи 11', type:'radio', req:false, list:['Телефон', 'Email', 'WhatsApp', 'Telegram'] },
        { key:'q12', label:'Поле 12', type:'text', req:true },
        { key:'q13', label:'Дополнительные данные 13', type:'text', req:false },
        { key:'q14', label:'Отдел / направление 14', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q15', label:'Комментарий 15', type:'textarea', req:false, full:true },
        { key:'q16', label:'Дата 16', type:'date', req:true },
        { key:'q17', label:'Удобный способ связи 17', type:'radio', req:false, list:['Телефон', 'Email', 'WhatsApp', 'Telegram'] },
        { key:'q18', label:'Поле 18', type:'text', req:true },
        { key:'q19', label:'Дополнительные данные 19', type:'text', req:false },
        { key:'q20', label:'Отдел / направление 20', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q21', label:'Комментарий 21', type:'textarea', req:false, full:true },
        { key:'q22', label:'Дата 22', type:'date', req:true },
        { key:'q23', label:'Удобный способ связи 23', type:'radio', req:false, list:['Телефон', 'Email', 'WhatsApp', 'Telegram'] },
        { key:'q24', label:'Поле 24', type:'text', req:true },
        { key:'q25', label:'Дополнительные данные 25', type:'text', req:false },
        { key:'q26', label:'Отдел / направление 26', type:'select', req:true, list:['Продажи', 'Поддержка', 'Сервис', 'Другое'] },
        { key:'q27', label:'Комментарий 27', type:'textarea', req:false, full:true }
      ], not_submit:true },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    methods: { fieldVal: function (n) { return this[n]; } },
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-23 · Проверить товарный знак (/ajax/check-trademark) */
  var check_trademark = Form({
    el: '#form_check_trademark_wrap',
    action_url: '/ajax/check-trademark',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'tm', chk:'required', value:'' },
    { name:'mktu', value:'' },
    { name:'mktu_list', value:mktu_list, not_submit:true },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-24 · Записаться на курс (/ajax/course-enroll, попап) */
  var course_enroll = Form({
    el: '#form_course_enroll_wrap',
    action_url: '/ajax/course-enroll',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'course_id', value:'7' },
    { name:'course_name', value:'Курс менеджера' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'comment', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-25 · Записаться в МФЦ (/ajax/mfc-appointment, попап) */
  var mfc_appointment = Form({
    el: '#form_mfc_appointment_wrap',
    action_url: '/ajax/mfc-appointment',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'fio', chk:'required', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', value:'' },
    { name:'service', chk:'required', value:service_list[0] },
    { name:'service_list', value:service_list, not_submit:true },
    { name:'date', chk:'required', value:'' },
    { name:'time', chk:'required', value:time_list[0] },
    { name:'time_list', value:time_list, not_submit:true },
    { name:'snils', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-26 · Статус заявления МФЦ (/ajax/mfc-status) */
  var mfc_status = Form({
    el: '#form_mfc_status_wrap',
    action_url: '/ajax/mfc-status',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'num', chk:'required', value:'' },
    { name:'datum', value:'' },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-27 · Обратная связь МФЦ (/ajax/mfc-feedback, попап) */
  var mfc_feedback = Form({
    el: '#form_mfc_feedback_wrap',
    action_url: '/ajax/mfc-feedback',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'fio', chk:'required', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'type', chk:'required', value:type_list[0] },
    { name:'type_list', value:type_list, not_submit:true },
    { name:'message', chk:'required', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-28 · Обращение в МФЦ (/ajax/mfc-appeal, попап) */
  var mfc_appeal = Form({
    el: '#form_mfc_appeal_wrap',
    action_url: '/ajax/mfc-appeal',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'fio', chk:'required', value:'' },
    { name:'birthdates', value:'' },
    { name:'address', chk:'required', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'appeal', chk:'required', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-29 · Записаться на консультацию (/ajax/book-consultation, попап) */
  var book_consultation = Form({
    el: '#form_book_consultation_wrap',
    action_url: '/ajax/book-consultation',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', value:'' },
    { name:'specialist', value:'' },
    { name:'specialist_list', value:specialist_list, not_submit:true },
    { name:'date', chk:'required', value:'' },
    { name:'time', chk:'required', value:time_list[0] },
    { name:'time_list', value:time_list, not_submit:true },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-30 · Записаться на примерку (/ajax/fitting, попап) */
  var fitting = Form({
    el: '#form_fitting_wrap',
    action_url: '/ajax/fitting',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'item_id', value:'42' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'date', chk:'required', value:'' },
    { name:'time', chk:'required', value:time_list[0] },
    { name:'time_list', value:time_list, not_submit:true },
    { name:'comment', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-31 · Записаться в клуб (/ajax/join-club, попап) */
  var join_club = Form({
    el: '#form_join_club_wrap',
    action_url: '/ajax/join-club',
    formdata: false,
    fields: [
      { name:'action', value:'form_send' },
    { name:'name', chk:'name', value:'' },
    { name:'phone', repl:'phone', chk:'phone', value:'' },
    { name:'email', chk:'email', value:'' },
    { name:'about', value:'' },
    { name:'source', value:'' },
    { name:'source_list', value:source_list, not_submit:true },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



  /* F-32 · Заказать услугу (попап на странице услуги, /ajax/modal-send-request).
     Разметка — block/service_order.html (#form_service_order_wrap). Маска
     телефона, капча, отправка и «спасибо» — через form_builder. */
  var service_order = Form({
    el: '#form_service_order_wrap',
    action_url: '/ajax/modal-send-request',
    formdata: false,
    fields: [
      { name:'service', value:'' },
      { name:'name', chk:'name', value:'' },
      { name:'phone', repl:'phone', chk:'phone', value:'' },
      { name:'comment', value:'' },
      { name:'capcha', chk:'required', value:'', not_submit:false },
      { name:'accept', chk:'required', value:false, not_submit:true },
    ],
    success: function (d) {
      var yid = (window.CNST && window.CNST.ym_id) || 0;
      if (typeof ym !== 'undefined' && yid) ym(yid, 'reachGoal', 'sendorder');
      if (window.jmodalClose) jmodalClose('serviceOrderModal');
      if (window.jmodalOpen) jmodalOpen('modal_thanks');
    }
  });



})();
