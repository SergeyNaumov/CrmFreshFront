/* ============================================================
   templates/t1/js/preview/good_popular.js
   Демо-данные блока "Популярные товары" для preview.
   Сформирован из корневого goods.json: товары, отмеченные флагом action.
   В релизной версии этот список вернёт сервер по адресу data-url
   (примерно в таком же формате — голый массив товаров).
   Запись: { id, header, photo, price, old_price, anons, url }
   photo — одиночная строка или массив (до 3 фото) images/good/good_{id}_{N}.webp.
   Общий список всех товаров — goods.json.
   ============================================================ */
window.dispatchEvent(new CustomEvent('t1:goods', {
  detail: {
    id: 'good_popular',
    list: [
      { id: 1, "new": true, "spec": true, "hit": true, header: "Смартфон X1 Pro", photo: ["images/good/good_1_1.webp", "images/good/good_1_2.webp", "images/good/good_1_3.webp"], price: 29990, old_price: 34990, anons: "6.7\" AMOLED, 128 ГБ, камера 50 Мп, NFC", url: "/product/1" },
      { id: 4, "new": false, "spec": true, "hit": false, header: "Ноутбук GameBook 16", photo: ["images/good/good_4_1.webp"], price: 109990, old_price: 119990, anons: "RTX 5060, 32 ГБ RAM, SSD 1 ТБ, 165 Гц", url: "/product/4" },
      { id: 5, "new": false, "spec": true, "hit": false, header: "Планшет PadAir 12", photo: ["images/good/good_5_1.webp", "images/good/good_5_2.webp"], price: 34990, old_price: 39990, anons: "12.4\" 120 Гц, стилус в комплекте, 8 ГБ RAM", url: "/product/5" },
      { id: 10, "new": true, "spec": true, "hit": false, header: "Дрон SkyFly Mini", photo: ["images/good/good_10_1.webp", "images/good/good_10_2.webp", "images/good/good_10_3.webp"], price: 32990, old_price: 37990, anons: "4K/30, 3-осевой стабилизатор, 30 мин полёта", url: "/product/10" },
      { id: 11, "new": false, "spec": true, "hit": true, header: "Умная колонка Smart Echo", photo: ["images/good/good_11_1.webp", "images/good/good_11_2.webp"], price: 5990, old_price: 7990, anons: "Голосовой ассистент, 360° звук, Wi-Fi и Bluetooth", url: "/product/11" },
      { id: 16, "new": false, "spec": true, "hit": false, header: "Электросамокат Rider X8", photo: ["images/good/good_16_1.webp", "images/good/good_16_2.webp"], price: 34990, old_price: 39990, anons: "25 км/ч, запас хода 30 км, складной, пневмошины", url: "/product/16" },
      { id: 21, "new": false, "spec": true, "hit": true, header: "Наушники Pro Sound", photo: ["images/good/good_21_1.webp", "images/good/good_21_2.webp", "images/good/good_21_3.webp"], price: 9990, old_price: 12990, anons: "Активное шумоподавление, 40 ч работы, Hi-Res", url: "/product/21" },
      { id: 26, "new": false, "spec": true, "hit": false, header: "Чехол UltraProtect", photo: ["images/good/good_26_1.webp"], price: 1490, old_price: 1990, anons: "Магнитный MagSafe, ударопрочный, для X1 Pro", url: "/product/26" },
      { id: 31, "new": true, "spec": true, "hit": false, header: "Телевизор OLED 55", photo: ["images/good/good_31_1.webp", "images/good/good_31_2.webp", "images/good/good_31_3.webp"], price: 84990, old_price: 94990, anons: "55\" 4K, 120 Гц, Dolby Vision, Smart TV", url: "/product/31" },
      { id: 35, "new": false, "spec": true, "hit": false, header: "Камера Mirrorless A7", photo: ["images/good/good_35_1.webp", "images/good/good_35_2.webp", "images/good/good_35_3.webp"], price: 159990, old_price: 179990, anons: "Полный кадр, 33 Мп, съёмка 4K/60", url: "/product/35" },
      { id: 41, "new": false, "spec": true, "hit": true, header: "Монитор UltraWide 34", photo: ["images/good/good_41_1.webp", "images/good/good_41_2.webp"], price: 54990, old_price: 62990, anons: "34\" UWQHD, 180 Гц, HDR, изогнутый", url: "/product/41" },
      { id: 44, "new": false, "spec": true, "hit": false, header: "Консоль GameStation 5", photo: ["images/good/good_44_1.webp", "images/good/good_44_2.webp"], price: 59990, old_price: 67990, anons: "1 ТБ, геймпад, 4K/120, твёрдотельный накопитель", url: "/product/44" }
    ]
  }
}));
