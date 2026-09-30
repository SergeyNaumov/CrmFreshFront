/* ============================================================
   templates/t1/js/preview/news.js
   Демо-данные блока «Новости» для preview — эмуляция эндпоинта
   /ajax/news?id=<id последней новости>&limit=<количество>.

   Страница отдаёт script-запрос вида
     js/preview/news.js?id=9&limit=6
   Файл читает свои query-параметры (document.currentScript.src),
   выбирает следующую порцию (новости со СТАРШИМ id, чем переданный)
   и публикует событие t1:news с detail { id, list }.
   Каждая дозагрузка по скроллу = отдельный GET-запрос (видно в DevTools).

   Формат записи: { id, title, anons, photo, date(ISO), url }.
   id здесь: ЧЕМ НОВЕЕ новость, ТЕМ БОЛЬШЕ id (как автоинкремент в БД).
   ============================================================ */
(function () {
  'use strict';

  /* Все «старые» новости (id ниже, чем на стартовой странице) */
  var DB = [
    { id: 8, title: 'Как выбрать умные часы: чек-лист для покупателя', anons: 'Пульс, GPS, NFC-оплата и автономность — разбираемся, какие функции действительно нужны, а какие просто маркетинг.', photo: 'images/news/news_8.webp', date: '2025-12-20', url: 'news_in.html?id=8' },
    { id: 7, title: 'Топ-5 аксессуаров для удалённой работы', anons: 'Веб-камера, хаб, эргономичная мышь и наушники с шумоподавлением — минимальный набор для продуктивности из дома.', photo: 'images/news/news_7.webp', date: '2025-12-12', url: 'news_in.html?id=7' },
    { id: 6, title: 'Обзор беспроводных наушников нового поколения', anons: 'Активное шумоподавление, пространственное аудио и 40 часов автономности — тестирование трёх флагманских моделей.', photo: 'images/news/news_6.webp', date: '2025-12-05', url: 'news_in.html?id=6' },
    { id: 5, title: 'Программа трейд-ин: обменяйте старый гаджет на скидку', anons: 'Принимаем смартфоны, ноутбуки и планшеты любого состояния. Скидка до 15 000 ₽ на новую технику.', photo: 'images/news/news_5.webp', date: '2025-11-27', url: 'news_in.html?id=5' },
    { id: 4, title: 'Гайд по выбору роутера: покрытие, стандарты и тонкости', anons: 'Wi-Fi 6, Mesh-системы и двухдиапазонные модели — что подойдёт вашей квартире и как не переплатить.', photo: 'images/news/news_4.webp', date: '2025-11-18', url: 'news_in.html?id=4' },
    { id: 3, title: 'DigitalStrateg открывает пункт выдачи в Мытищах', anons: 'Теперь забрать заказ можно без курьера — пункт работает ежедневно с 9 до 21 на улице Олимпийский проспект.', photo: 'images/news/news_3.webp', date: '2025-11-09', url: 'news_in.html?id=3' },
    { id: 2, title: 'Зимняя распродажа: итоги и бестселлеры', anons: 'Пять недель акции, более 2 000 заказов и десятки положительных отзывов — смотрите, что выбирали чаще всего.', photo: 'images/news/news_2.webp', date: '2025-10-30', url: 'news_in.html?id=2' },
    { id: 1, title: 'Энергонезависимые UPS для дома и офиса', anons: 'Как подобрать ИБП для компьютера, роутера и сервера — расчёт времени работы и обзор трёх популярных моделей.', photo: 'images/news/news_1.webp', date: '2025-10-21', url: 'news_in.html?id=1' }
  ];

  /* Читаем свой src (js/preview/news.js?id=..&limit=..) */
  var src = (document.currentScript && document.currentScript.src) || '';
  var qs = {};
  (src.split('?')[1] || '').split('&').forEach(function (kv) {
    var p = kv.split('=');
    if (!p[0]) return;
    qs[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
  });

  var lastId = parseInt(qs.id, 10) || 0;
  var limit = parseInt(qs.limit, 10) || 6;

  /* Новости со СТАРШИМ id, чем lastId (т.е. более старые), далее меньшие id */
  var list = DB
    .filter(function (n) { return n.id < lastId; })
    .sort(function (a, b) { return b.id - a.id; })
    .slice(0, limit);

  window.dispatchEvent(new CustomEvent('t1:news', {
    detail: { id: 'news', list: list }
  }));
})();