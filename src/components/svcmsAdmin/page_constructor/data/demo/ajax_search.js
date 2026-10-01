/* ============================================================
   templates/t1/js/preview/ajax_search.js
   Фейковый серверный ответ для preview на запрос
   GET /ajax/search/<слово> (релизный клиент — header-search.js,
   ветка без data-url).

   Реальный ответ сервера:
     { "list": [ { "id": 101,
                   "header": "Смартфон X1 Pro",
                   "photo":  "images/good/good_1_1.webp",
                   "url":    "/catalog/elektronika/telefony/smartfony-x1-pro/" } ] }
   Клиент терпим и к голому массиву, и к ключам items / LIST,
   лишние поля (price, anons) игнорирует.

   Здесь файл эмулирует ответ: читает q и rid из собственного src,
   ищет товары и публикует CustomEvent('t1:ajax-search',
   { detail: { rid, q, list } }). Запрос выполняется как <script>
   (fetch из file:// блокируется), rid защищает от гонки:
   на странице может быть несколько строк поиска с разными
   запросами одновременно.

   Порядок товаров: сначала те, что начинаются с запроса, потом
   остальные совпадения; внутри — по алфавиту. Максимум LIMIT
   записей (клиент всё равно режет своим limit).

   Каталог: приоритет у window.__t1_catalog — его заполняют
   товарные блоки (js/goods_blocks.js, js/good_list.js,
   js/good_in.js), поэтому на странице с товарами поиск предлагает
   именно их. Встроенный список — запасной вариант для страниц
   без товарных блоков (главная). Тот же состав, что в CATALOG
   файла basket_info.js (54 товара, ids 1..54).

   Формат записи: { id, header, photo, url }
   ============================================================ */
(function () {
  'use strict';

  /* Запасной каталог: id -> { header, photo, url } */
  var CATALOG = {
    '1': { header: 'Смартфон X1 Pro', photo: 'images/good/good_1_1.webp', url: 'good_in.html?id=1' },
    '2': { header: 'Смартфон Nova Pro', photo: 'images/good/good_2_1.webp', url: 'good_in.html?id=2' },
    '3': { header: 'Ноутбук UltraBook 14', photo: 'images/good/good_3_1.webp', url: 'good_in.html?id=3' },
    '4': { header: 'Ноутбук GameBook 16', photo: 'images/good/good_4_1.webp', url: 'good_in.html?id=4' },
    '5': { header: 'Планшет PadAir 12', photo: 'images/good/good_5_1.webp', url: 'good_in.html?id=5' },
    '6': { header: 'Умные часы FitTrack Ultra', photo: 'images/good/good_6_1.webp', url: 'good_in.html?id=6' },
    '7': { header: 'Экшн-камера ActionCam 4K', photo: 'images/good/good_7_1.webp', url: 'good_in.html?id=7' },
    '8': { header: 'Фитнес-браслет FitBand S2', photo: 'images/good/good_8_1.webp', url: 'good_in.html?id=8' },
    '9': { header: 'Смарт-часы Watch Pro Max', photo: 'images/good/good_9_1.webp', url: 'good_in.html?id=9' },
    '10': { header: 'Дрон SkyFly Mini', photo: 'images/good/good_10_1.webp', url: 'good_in.html?id=10' },
    '11': { header: 'Умная колонка Smart Echo', photo: 'images/good/good_11_1.webp', url: 'good_in.html?id=11' },
    '12': { header: 'Робот-пылесос CleanBot S1', photo: 'images/good/good_12_1.webp', url: 'good_in.html?id=12' },
    '13': { header: 'Умная лампа GlowSmart', photo: 'images/good/good_13_1.webp', url: 'good_in.html?id=13' },
    '14': { header: 'Камера CamHome 2K', photo: 'images/good/good_14_1.webp', url: 'good_in.html?id=14' },
    '15': { header: 'Wi-Fi розетка SocketWiFi', photo: 'images/good/good_15_1.webp', url: 'good_in.html?id=15' },
    '16': { header: 'Электросамокат Rider X8', photo: 'images/good/good_16_1.webp', url: 'good_in.html?id=16' },
    '17': { header: 'Велосипед Velospeed 26', photo: 'images/good/good_17_1.webp', url: 'good_in.html?id=17' },
    '18': { header: 'Беговая дорожка RunMax', photo: 'images/good/good_18_1.webp', url: 'good_in.html?id=18' },
    '19': { header: 'Бассейн AquaPool 3x2', photo: 'images/good/good_19_1.webp', url: 'good_in.html?id=19' },
    '20': { header: 'Турник HomeFit', photo: 'images/good/good_20_1.webp', url: 'good_in.html?id=20' },
    '21': { header: 'Наушники Pro Sound', photo: 'images/good/good_21_1.webp', url: 'good_in.html?id=21' },
    '22': { header: 'TWS-наушники Air Buds', photo: 'images/good/good_22_1.webp', url: 'good_in.html?id=22' },
    '23': { header: 'Колонка MegaBass', photo: 'images/good/good_23_1.webp', url: 'good_in.html?id=23' },
    '24': { header: 'Саундбар SoundMax', photo: 'images/good/good_24_1.webp', url: 'good_in.html?id=24' },
    '25': { header: 'Микрофон StudioMic', photo: 'images/good/good_25_1.webp', url: 'good_in.html?id=25' },
    '26': { header: 'Чехол UltraProtect', photo: 'images/good/good_26_1.webp', url: 'good_in.html?id=26' },
    '27': { header: 'Кабель USB-C 100W', photo: 'images/good/good_27_1.webp', url: 'good_in.html?id=27' },
    '28': { header: 'Держатель CarMount', photo: 'images/good/good_28_1.webp', url: 'good_in.html?id=28' },
    '29': { header: 'Клавиатура KeyPro', photo: 'images/good/good_29_1.webp', url: 'good_in.html?id=29' },
    '30': { header: 'Мышь Wireless Mouse', photo: 'images/good/good_30_1.webp', url: 'good_in.html?id=30' },
    '31': { header: 'Телевизор OLED 55', photo: 'images/good/good_31_1.webp', url: 'good_in.html?id=31' },
    '32': { header: 'Телевизор QLED 43', photo: 'images/good/good_32_1.webp', url: 'good_in.html?id=32' },
    '33': { header: 'Проектор Beam 4K', photo: 'images/good/good_33_1.webp', url: 'good_in.html?id=33' },
    '34': { header: 'Саундбар HomeCinema', photo: 'images/good/good_34_1.webp', url: 'good_in.html?id=34' },
    '35': { header: 'Камера Mirrorless A7', photo: 'images/good/good_35_1.webp', url: 'good_in.html?id=35' },
    '36': { header: 'Объектив Prime 50mm', photo: 'images/good/good_36_1.webp', url: 'good_in.html?id=36' },
    '37': { header: 'Штатив Tripod Pro', photo: 'images/good/good_37_1.webp', url: 'good_in.html?id=37' },
    '38': { header: 'Камера GoCam Mini', photo: 'images/good/good_38_1.webp', url: 'good_in.html?id=38' },
    '39': { header: 'Моноблок iMac 24', photo: 'images/good/good_39_1.webp', url: 'good_in.html?id=39' },
    '40': { header: 'Системный блок GamePC', photo: 'images/good/good_40_1.webp', url: 'good_in.html?id=40' },
    '41': { header: 'Монитор UltraWide 34', photo: 'images/good/good_41_1.webp', url: 'good_in.html?id=41' },
    '42': { header: 'SSD 1 ТБ NVMe', photo: 'images/good/good_42_1.webp', url: 'good_in.html?id=42' },
    '43': { header: 'Видеокарта RTX 5060', photo: 'images/good/good_43_1.webp', url: 'good_in.html?id=43' },
    '44': { header: 'Консоль GameStation 5', photo: 'images/good/good_44_1.webp', url: 'good_in.html?id=44' },
    '45': { header: 'Геймпад Wireless', photo: 'images/good/good_45_1.webp', url: 'good_in.html?id=45' },
    '46': { header: 'Игровая мышь Viper', photo: 'images/good/good_46_1.webp', url: 'good_in.html?id=46' },
    '47': { header: 'Кресло ChairPro', photo: 'images/good/good_47_1.webp', url: 'good_in.html?id=47' },
    '48': { header: 'Роутер RouterPro AX', photo: 'images/good/good_48_1.webp', url: 'good_in.html?id=48' },
    '49': { header: 'Mesh-система MeshHome', photo: 'images/good/good_49_1.webp', url: 'good_in.html?id=49' },
    '50': { header: 'Коммутатор Switch8', photo: 'images/good/good_50_1.webp', url: 'good_in.html?id=50' },
    '51': { header: 'Wi-Fi адаптер USB', photo: 'images/good/good_51_1.webp', url: 'good_in.html?id=51' },
    '52': { header: 'PowerBank 20 000', photo: 'images/good/good_52_1.webp', url: 'good_in.html?id=52' },
    '53': { header: 'Зарядная станция Station65', photo: 'images/good/good_53_1.webp', url: 'good_in.html?id=53' },
    '54': { header: 'Батарейки AA 24 шт', photo: 'images/good/good_54_1.webp', url: 'good_in.html?id=54' },

  };

  var LIMIT = 8;

  /* ---------- Запрос из src (как в basket_info.js) ---------- */
  var src = document.currentScript ? document.currentScript.src : '';
  var q = '';
  var rid = '';
  var delay = 120; /* имитация задержки сети — виден стиль загрузки */

  src.replace(/[?&]q=([^&]*)/, function (m, v) {
    q = decodeURIComponent(v || '');
    return m;
  });
  src.replace(/[?&]rid=([^&]*)/, function (m, v) {
    rid = decodeURIComponent(v || '');
    return m;
  });
  src.replace(/[?&]delay=(\d+)/, function (m, v) {
    delay = parseInt(v, 10) || 0;
    return m;
  });

  if (!q) return;

  /* ---------- Каталог страницы имеет приоритет ----------
     Порядок важен: каталог страницы кладём первым, дедупликация ниже
     оставляет первую запись, то есть версию со страницы. */

  var pageCatalog = window.__t1_catalog || {};
  var all = [];

  for (var pid in pageCatalog) {
    if (!Object.prototype.hasOwnProperty.call(pageCatalog, pid)) continue;
    var p = pageCatalog[pid];
    if (!p || !(p.header || p.name)) continue;

    var photo = p.photo;
    if (Array.isArray(photo)) photo = photo[0] || '';

    all.push({
      id: parseInt(pid, 10),
      header: p.header || p.name,
      photo: String(photo || ''),
      url: p.url || ('good_in.html?id=' + pid)
    });
  }

  for (var cid in CATALOG) {
    if (!Object.prototype.hasOwnProperty.call(CATALOG, cid)) continue;
    var c = CATALOG[cid];
    all.push({ id: parseInt(cid, 10), header: c.header, photo: c.photo, url: c.url });
  }

  /* Один товар может прийти и из встроенного списка, и со страницы —
     оставляем версию со страницы (у неё актуальные фото и url). */
  var uniq = {};
  var list = [];
  for (var i = 0; i < all.length; i++) {
    var g = all[i];
    if (uniq[g.id]) continue;
    uniq[g.id] = true;
    list.push(g);
  }

  /* ---------- Поиск ---------- */
  var s = q.toLowerCase();
  var starts = [];
  var contains = [];

  for (var j = 0; j < list.length; j++) {
    var name = String(list[j].header || '').toLowerCase();
    if (name.indexOf(s) === 0) starts.push(list[j]);
    else if (name.indexOf(s) !== -1) contains.push(list[j]);
  }

  starts.sort(function (a, b) { return a.header < b.header ? -1 : 1; });
  contains.sort(function (a, b) { return a.header < b.header ? -1 : 1; });

  var found = starts.concat(contains).slice(0, LIMIT);

  /* ---------- Ответ ---------- */
  setTimeout(function () {
    window.dispatchEvent(new CustomEvent('t1:ajax-search', {
      detail: { rid: rid, q: q, list: found }
    }));
  }, delay);
})();
