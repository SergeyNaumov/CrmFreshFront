/* ============================================================
   templates/t1/js/preview/good_new.js
   Демо-данные блока "Новинки" для preview.
   Сформирован из корневого goods.json: товары, отмеченные флагом new.
   В релизной версии этот список вернёт сервер по адресу data-url
   (примерно в таком же формате — голый массив товаров).
   Запись: { id, header, photo, price, old_price, anons, url }
   photo — одиночная строка или массив (до 3 фото) images/good/good_{id}_{N}.webp.
   Общий список всех товаров — goods.json.
   ============================================================ */
window.dispatchEvent(new CustomEvent('t1:goods', {
  detail: {
    id: 'good_new',
    list: [
      { id: 1, "new": true, "specpredl": false, "action": true, header: "Смартфон X1 Pro", photo: ["images/good/good_1_1.webp", "images/good/good_1_2.webp", "images/good/good_1_3.webp"], price: 29990, old_price: 34990, anons: "6.7\" AMOLED, 128 ГБ, камера 50 Мп, NFC", url: "/product/1" },
      { id: 2, "new": true, "specpredl": false, "action": false, header: "Смартфон Nova Pro", photo: ["images/good/good_2_1.webp", "images/good/good_2_2.webp"], price: 43990, old_price: 49990, anons: "6.5\" OLED, 256 ГБ, 108 Мп, беспроводная зарядка", url: "/product/2" },
      { id: 3, "new": true, "specpredl": true, "action": false, header: "Ноутбук UltraBook 14", photo: ["images/good/good_3_1.webp", "images/good/good_3_2.webp", "images/good/good_3_3.webp"], price: 59990, old_price: 69990, anons: "16 ГБ RAM, SSD 512 ГБ, 2.8K-экран, вес 1.1 кг", url: "/product/3" },
      { id: 6, "new": true, "specpredl": false, "action": false, header: "Умные часы FitTrack Ultra", photo: ["images/good/good_6_1.webp", "images/good/good_6_2.webp", "images/good/good_6_3.webp"], price: 14990, old_price: 17990, anons: "AMOLED-экран, GPS, пульсометр, 14 дней автономности", url: "/product/6" },
      { id: 10, "new": true, "specpredl": false, "action": true, header: "Дрон SkyFly Mini", photo: ["images/good/good_10_1.webp", "images/good/good_10_2.webp", "images/good/good_10_3.webp"], price: 32990, old_price: 37990, anons: "4K/30, 3-осевой стабилизатор, 30 мин полёта", url: "/product/10" },
      { id: 16, "new": true, "specpredl": false, "action": false, header: "Электросамокат Rider X8", photo: ["images/good/good_16_1.webp", "images/good/good_16_2.webp"], price: 34990, old_price: 39990, anons: "25 км/ч, запас хода 30 км, складной, пневмошины", url: "/product/16" },
      { id: 22, "new": true, "specpredl": true, "action": false, header: "TWS-наушники Air Buds", photo: ["images/good/good_22_1.webp", "images/good/good_22_2.webp"], price: 2990, old_price: 3990, anons: "Bluetooth 5.3, кейс-зарядка, до 30 ч музыки", url: "/product/22" },
      { id: 25, "new": true, "specpredl": false, "action": false, header: "Микрофон StudioMic", photo: ["images/good/good_25_1.webp", "images/good/good_25_2.webp"], price: 3990, old_price: 4790, anons: "USB, конденсаторный, кардиоида, поп-фильтр", url: "/product/25" },
      { id: 33, "new": true, "specpredl": false, "action": false, header: "Проектор Beam 4K", photo: ["images/good/good_33_1.webp"], price: 69990, old_price: 79990, anons: "4K, 2200 люмен, лазер, диагональ до 300 дюймов", url: "/product/33" },
      { id: 39, "new": true, "specpredl": false, "action": false, header: "Моноблок iMac 24", photo: ["images/good/good_39_1.webp"], price: 134990, old_price: 149990, anons: "24\" Retina, M3, 8 ГБ, SSD 256 ГБ", url: "/product/39" },
      { id: 44, "new": true, "specpredl": true, "action": true, header: "Консоль GameStation 5", photo: ["images/good/good_44_1.webp", "images/good/good_44_2.webp"], price: 59990, old_price: 67990, anons: "1 ТБ, геймпад, 4K/120, твёрдотельный накопитель", url: "/product/44" },
      { id: 48, "new": true, "specpredl": false, "action": false, header: "Роутер RouterPro AX", photo: ["images/good/good_48_1.webp", "images/good/good_48_2.webp"], price: 6990, old_price: 8490, anons: "Wi-Fi 6 3000 Мбит/с, 4 порта, Mesh", url: "/product/48" }
    ]
  }
}));
