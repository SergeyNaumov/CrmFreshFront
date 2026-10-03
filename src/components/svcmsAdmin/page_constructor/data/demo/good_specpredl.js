/* ============================================================
   templates/t1/js/preview/good_specpredl.js
   Демо-данные блока "Спецпредложения" для preview.
   Сформирован из корневого goods.json: товары, отмеченные флагом specpredl.
   В релизной версии этот список вернёт сервер по адресу data-url
   (примерно в таком же формате — голый массив товаров).
   Запись: { id, header, photo, price, old_price, anons, url }
   photo — одиночная строка или массив (до 3 фото) images/good/good_{id}_{N}.webp.
   Общий список всех товаров — goods.json.
   ============================================================ */
window.dispatchEvent(new CustomEvent('t1:goods', {
  detail: {
    id: 'good_specpredl',
    list: [
      { id: 7, "new": true, "spec": true, "hit": true, header: "Экшн-камера ActionCam 4K", photo: ["images/good/good_7_1.webp", "images/good/good_7_2.webp"], price: 11990, old_price: 14990, anons: "Съёмка 4K/60fps, стабилизация, влагозащита IP68", url: "/product/7" },
      { id: 11, "new": false, "spec": true, "hit": true, header: "Умная колонка Smart Echo", photo: ["images/good/good_11_1.webp", "images/good/good_11_2.webp"], price: 5990, old_price: 7990, anons: "Голосовой ассистент, 360° звук, Wi-Fi и Bluetooth", url: "/product/11" },
      { id: 12, "new": false, "spec": false, "hit": true, header: "Робот-пылесос CleanBot S1", photo: ["images/good/good_12_1.webp", "images/good/good_12_2.webp", "images/good/good_12_3.webp"], price: 27990, old_price: 32990, anons: "Лазерная навигация, мощность 4000 Па, автовозврат", url: "/product/12" },
      { id: 13, "new": true, "spec": false, "hit": true, header: "Умная лампа GlowSmart", photo: ["images/good/good_13_1.webp"], price: 1290, old_price: 1790, anons: "16 млн цветов, димминг, сценарии рассвета", url: "/product/13" },
      { id: 21, "new": false, "spec": true, "hit": true, header: "Наушники Pro Sound", photo: ["images/good/good_21_1.webp", "images/good/good_21_2.webp", "images/good/good_21_3.webp"], price: 9990, old_price: 12990, anons: "Активное шумоподавление, 40 ч работы, Hi-Res", url: "/product/21" },
      { id: 23, "new": true, "spec": false, "hit": true, header: "Колонка MegaBass", photo: ["images/good/good_23_1.webp", "images/good/good_23_2.webp"], price: 4990, old_price: 5990, anons: "20 Вт, пыле-влагозащита, 12 ч работы, TWS-пара", url: "/product/23" },
      { id: 24, "new": false, "spec": false, "hit": true, header: "Саундбар SoundMax", photo: ["images/good/good_24_1.webp"], price: 9990, old_price: 12990, anons: "2.1, 120 Вт, сабвуфер, Bluetooth, пульт", url: "/product/24" },
      { id: 34, "new": false, "spec": false, "hit": true, header: "Саундбар HomeCinema", photo: ["images/good/good_34_1.webp", "images/good/good_34_2.webp"], price: 26990, old_price: 32990, anons: "5.1, 600 Вт, DTS:X, сабвуфер в комплекте", url: "/product/34" },
      { id: 35, "new": false, "spec": true, "hit": true, header: "Камера Mirrorless A7", photo: ["images/good/good_35_1.webp", "images/good/good_35_2.webp", "images/good/good_35_3.webp"], price: 159990, old_price: 179990, anons: "Полный кадр, 33 Мп, съёмка 4K/60", url: "/product/35" },
      { id: 42, "new": false, "spec": false, "hit": true, header: "SSD 1 ТБ NVMe", photo: ["images/good/good_42_1.webp"], price: 7990, old_price: 9990, anons: "7000 МБ/с, PCIe 4.0, 5 лет гарантии", url: "/product/42" },
      { id: 45, "new": false, "spec": false, "hit": true, header: "Геймпад Wireless", photo: ["images/good/good_45_1.webp", "images/good/good_45_2.webp", "images/good/good_45_3.webp"], price: 3990, old_price: 4990, anons: "Bluetooth, виброотклик, совместим с ПК и консолями", url: "/product/45" },
      { id: 52, "new": false, "spec": false, "hit": true, header: "PowerBank 20 000", photo: ["images/good/good_52_1.webp", "images/good/good_52_2.webp"], price: 4990, old_price: 5990, anons: "Быстрая зарядка 65 Вт, два порта USB-C, LED-дисплей", url: "/product/52" }
    ]
  }
}));
