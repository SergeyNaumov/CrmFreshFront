/* ============================================================
   templates/t1/js/preview/basket_info.js
   Фейковый серверный ответ для preview-режима на запрос
   GET /basket-full-info (релизная версия — см. app.js,
   axios.get('/basket-full-info')).

   Реальный ответ сервера имеет такую структуру:
     { "success": 1,
       "basket": {
         "cur_record_total_price": 521.5,  // итог по актуальным ценам
         "unique_count": 1,                // кол-во позиций
         "total_count": 11,                // всего единиц товара
         "basket_id": "51268657",
         "total_price": 2219,              // итог по полным ценам
         "cookie_name": "basket",
         "LIST": [ { "photo": "...", "basket_list_id": 45712,
                     "id": 27205, "price": "1697.50", ... } ]
       } }

   Здесь файл эмулирует этот ответ: читает корзину из localStorage
   (карта id товара -> количество) и подставляет подробности товара
   из собственного каталога — поэтому виджет корзины в шапке
   работает на ЛЮБОЙ странице preview (не только там, где есть
   товарные блоки). Запрос выполняется как <script> (fetch из file://
   блокируется), событие — t1:basket-info. Файл публикует ОДИН ответ
   для конкретного id=... из своего src (как news.js).

   Встроенный каталог товаров СГЕНЕРИРОВАН из корневого goods.json
   (все 54 товара): photo = images/good/good_{id}_1.webp (первое фото
   товара из images/good/). Генератор: agent-doc/tools/gen_basket_info_preview.py.
   На страницах с товарными блоками каталог из window.__t1_catalog
   имеет приоритет.

   Функция «сервера» добавления/удаления товара здесь не нужна:
   в preview корзина пишется напрямую в localStorage, а каждый
   вызов init_basket() повторно запрашивает basket_info.js.
   ============================================================ */
(function () {
  'use strict';

  /* Полный каталог товаров для preview (ids совпадают с goods.json,
     good_*.js и catalog.js). Здесь он нужен, чтобы на страницах без
     товарных блоков (например, news.html) корзина тоже отображалась
     с названиями и фото. */
  var CATALOG = {
    1: {"photo": "images/good/good_1_1.webp","name": "Смартфон X1 Pro","price": 29990,"old_price": 34990,"url": "/product/1"},
    2: {"photo": "images/good/good_2_1.webp","name": "Смартфон Nova Pro","price": 43990,"old_price": 49990,"url": "/product/2"},
    3: {"photo": "images/good/good_3_1.webp","name": "Ноутбук UltraBook 14","price": 59990,"old_price": 69990,"url": "/product/3"},
    4: {"photo": "images/good/good_4_1.webp","name": "Ноутбук GameBook 16","price": 109990,"old_price": 119990,"url": "/product/4"},
    5: {"photo": "images/good/good_5_1.webp","name": "Планшет PadAir 12","price": 34990,"old_price": 39990,"url": "/product/5"},
    6: {"photo": "images/good/good_6_1.webp","name": "Умные часы FitTrack Ultra","price": 14990,"old_price": 17990,"url": "/product/6"},
    7: {"photo": "images/good/good_7_1.webp","name": "Экшн-камера ActionCam 4K","price": 11990,"old_price": 14990,"url": "/product/7"},
    8: {"photo": "images/good/good_8_1.webp","name": "Фитнес-браслет FitBand S2","price": 4990,"old_price": 5990,"url": "/product/8"},
    9: {"photo": "images/good/good_9_1.webp","name": "Смарт-часы Watch Pro Max","price": 24990,"old_price": 29990,"url": "/product/9"},
    10: {"photo": "images/good/good_10_1.webp","name": "Дрон SkyFly Mini","price": 32990,"old_price": 37990,"url": "/product/10"},
    11: {"photo": "images/good/good_11_1.webp","name": "Умная колонка Smart Echo","price": 5990,"old_price": 7990,"url": "/product/11"},
    12: {"photo": "images/good/good_12_1.webp","name": "Робот-пылесос CleanBot S1","price": 27990,"old_price": 32990,"url": "/product/12"},
    13: {"photo": "images/good/good_13_1.webp","name": "Умная лампа GlowSmart","price": 1290,"old_price": 1790,"url": "/product/13"},
    14: {"photo": "images/good/good_14_1.webp","name": "Камера CamHome 2K","price": 4990,"old_price": 6490,"url": "/product/14"},
    15: {"photo": "images/good/good_15_1.webp","name": "Wi-Fi розетка SocketWiFi","price": 1490,"old_price": 1990,"url": "/product/15"},
    16: {"photo": "images/good/good_16_1.webp","name": "Электросамокат Rider X8","price": 34990,"old_price": 39990,"url": "/product/16"},
    17: {"photo": "images/good/good_17_1.webp","name": "Велосипед Velospeed 26","price": 18990,"old_price": 21990,"url": "/product/17"},
    18: {"photo": "images/good/good_18_1.webp","name": "Беговая дорожка RunMax","price": 27990,"old_price": 32990,"url": "/product/18"},
    19: {"photo": "images/good/good_19_1.webp","name": "Бассейн AquaPool 3x2","price": 9990,"old_price": 12990,"url": "/product/19"},
    20: {"photo": "images/good/good_20_1.webp","name": "Турник HomeFit","price": 3990,"old_price": 4990,"url": "/product/20"},
    21: {"photo": "images/good/good_21_1.webp","name": "Наушники Pro Sound","price": 9990,"old_price": 12990,"url": "/product/21"},
    22: {"photo": "images/good/good_22_1.webp","name": "TWS-наушники Air Buds","price": 2990,"old_price": 3990,"url": "/product/22"},
    23: {"photo": "images/good/good_23_1.webp","name": "Колонка MegaBass","price": 4990,"old_price": 5990,"url": "/product/23"},
    24: {"photo": "images/good/good_24_1.webp","name": "Саундбар SoundMax","price": 9990,"old_price": 12990,"url": "/product/24"},
    25: {"photo": "images/good/good_25_1.webp","name": "Микрофон StudioMic","price": 3990,"old_price": 4790,"url": "/product/25"},
    26: {"photo": "images/good/good_26_1.webp","name": "Чехол UltraProtect","price": 1490,"old_price": 1990,"url": "/product/26"},
    27: {"photo": "images/good/good_27_1.webp","name": "Кабель USB-C 100W","price": 790,"old_price": 990,"url": "/product/27"},
    28: {"photo": "images/good/good_28_1.webp","name": "Держатель CarMount","price": 1190,"old_price": 1490,"url": "/product/28"},
    29: {"photo": "images/good/good_29_1.webp","name": "Клавиатура KeyPro","price": 6990,"old_price": 7990,"url": "/product/29"},
    30: {"photo": "images/good/good_30_1.webp","name": "Мышь Wireless Mouse","price": 3990,"old_price": 4990,"url": "/product/30"},
    31: {"photo": "images/good/good_31_1.webp","name": "Телевизор OLED 55","price": 84990,"old_price": 94990,"url": "/product/31"},
    32: {"photo": "images/good/good_32_1.webp","name": "Телевизор QLED 43","price": 32990,"old_price": 37990,"url": "/product/32"},
    33: {"photo": "images/good/good_33_1.webp","name": "Проектор Beam 4K","price": 69990,"old_price": 79990,"url": "/product/33"},
    34: {"photo": "images/good/good_34_1.webp","name": "Саундбар HomeCinema","price": 26990,"old_price": 32990,"url": "/product/34"},
    35: {"photo": "images/good/good_35_1.webp","name": "Камера Mirrorless A7","price": 159990,"old_price": 179990,"url": "/product/35"},
    36: {"photo": "images/good/good_36_1.webp","name": "Объектив Prime 50mm","price": 19990,"old_price": 23990,"url": "/product/36"},
    37: {"photo": "images/good/good_37_1.webp","name": "Штатив Tripod Pro","price": 6990,"old_price": 8490,"url": "/product/37"},
    38: {"photo": "images/good/good_38_1.webp","name": "Камера GoCam Mini","price": 15990,"old_price": 18990,"url": "/product/38"},
    39: {"photo": "images/good/good_39_1.webp","name": "Моноблок iMac 24","price": 134990,"old_price": 149990,"url": "/product/39"},
    40: {"photo": "images/good/good_40_1.webp","name": "Системный блок GamePC","price": 149990,"old_price": 169990,"url": "/product/40"},
    41: {"photo": "images/good/good_41_1.webp","name": "Монитор UltraWide 34","price": 54990,"old_price": 62990,"url": "/product/41"},
    42: {"photo": "images/good/good_42_1.webp","name": "SSD 1 ТБ NVMe","price": 7990,"old_price": 9990,"url": "/product/42"},
    43: {"photo": "images/good/good_43_1.webp","name": "Видеокарта RTX 5060","price": 52990,"old_price": 59990,"url": "/product/43"},
    44: {"photo": "images/good/good_44_1.webp","name": "Консоль GameStation 5","price": 59990,"old_price": 67990,"url": "/product/44"},
    45: {"photo": "images/good/good_45_1.webp","name": "Геймпад Wireless","price": 3990,"old_price": 4990,"url": "/product/45"},
    46: {"photo": "images/good/good_46_1.webp","name": "Игровая мышь Viper","price": 5990,"old_price": 6990,"url": "/product/46"},
    47: {"photo": "images/good/good_47_1.webp","name": "Кресло ChairPro","price": 15990,"old_price": 18990,"url": "/product/47"},
    48: {"photo": "images/good/good_48_1.webp","name": "Роутер RouterPro AX","price": 6990,"old_price": 8490,"url": "/product/48"},
    49: {"photo": "images/good/good_49_1.webp","name": "Mesh-система MeshHome","price": 12990,"old_price": 14990,"url": "/product/49"},
    50: {"photo": "images/good/good_50_1.webp","name": "Коммутатор Switch8","price": 2990,"old_price": 3990,"url": "/product/50"},
    51: {"photo": "images/good/good_51_1.webp","name": "Wi-Fi адаптер USB","price": 1990,"old_price": 2490,"url": "/product/51"},
    52: {"photo": "images/good/good_52_1.webp","name": "PowerBank 20 000","price": 4990,"old_price": 5990,"url": "/product/52"},
    53: {"photo": "images/good/good_53_1.webp","name": "Зарядная станция Station65","price": 2990,"old_price": 3790,"url": "/product/53"},
    54: {"photo": "images/good/good_54_1.webp","name": "Батарейки AA 24 шт","price": 990,"old_price": 1290,"url": "/product/54"}
  };

  /* Страничный каталог (заполняется good_*-блоками и good_list.js
     в window.__t1_catalog) имеет приоритет: на странице good_list.html
     содержимое корзины показывается по товарам этой страницы.
     Поля блоков — header/photo/price/old_price/url, здесь приводим
     к формату каталога (name). */
  var pageCatalog = window.__t1_catalog || {};
  for (var cid in pageCatalog) {
    if (!Object.prototype.hasOwnProperty.call(pageCatalog, cid)) continue;
    var pg = pageCatalog[cid];
    if (!pg || !(pg.photo || pg.price)) continue;
    CATALOG[cid] = {
      photo: pg.photo,
      name: pg.header || pg.name || 'Товар',
      price: pg.price,
      old_price: pg.old_price,
      url: pg.url
    };
  }

  /* ---------- id запроса из src (для фильтрации события) ---------- */
  var src = document.currentScript ? document.currentScript.src : '';
  var m = src.match(/[?&]id=([^&]+)/);
  var requestId = m ? m[1] : 'basket';

  /* ---------- Корзина из localStorage (карта id -> кол-во) ---------- */
  var in_basket = {};
  try { in_basket = JSON.parse(window.localStorage.getItem('basket') || '{}') || {}; }
  catch (e) { in_basket = {}; }

  /* ---------- Сборка ответа в формате /basket-full-info ---------- */
  var LIST = [];
  var total_price = 0;            // по полным ценам (old_price)
  var cur_record_total_price = 0; // по актуальным ценам (price)
  var total_count = 0;
  var basket_list_id = 1;
  var id;

  for (id in in_basket) {
    if (!Object.prototype.hasOwnProperty.call(in_basket, id)) continue;
    var cnt = parseInt(in_basket[id], 10) || 0;
    if (cnt <= 0) continue;
    var g = CATALOG[id];
    if (!g) continue; // товар не из каталога preview — пропускаем

    LIST.push({
      id: parseInt(id, 10),
      basket_list_id: basket_list_id++,
      photo: g.photo,
      name: g.name,
      price: Number(g.price),
      old_price: Number(g.old_price),
      cnt: cnt,
      url: g.url
    });
    total_count += cnt;
    total_price += (Number(g.old_price) || Number(g.price)) * cnt;
    cur_record_total_price += Number(g.price) * cnt;
  }

  /* ---------- Публикация ответа ---------- */
  window.dispatchEvent(new CustomEvent('t1:basket-info', {
    detail: {
      id: requestId,
      success: 1,
      total_count: total_count,   // дубли для совместимости
      in_basket: in_basket,
      basket: {
        cur_record_total_price: cur_record_total_price,
        unique_count: LIST.length,
        total_count: total_count,
        basket_id: 'preview',
        total_price: total_price,
        cookie_name: 'basket',
        LIST: LIST
      }
    }
  }));
})();
