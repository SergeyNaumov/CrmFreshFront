/* ============================================================
   templates/t1/js/preview/search_suggest.js
   Демо-данные подсказок поиска для preview (вариант главной 2).
   Формат тот же, что у остальных файлов данных preview: скрипт
   «публикует» список событием, страница его слушает. Так работает
   обход ограничений file://, где fetch/import заблокированы.

   В релизной версии подсказки приходят с сервера по адресу data-url
   из формы поиска (необязательно): если ответа нет или запрос
   упал — форма всё равно работает, просто без выпадашки.

   Запись: { header, anons, url }
   header — название позиции (показывается основной строкой),
   anons  — короткая подпись (вторая строка, можно опустить),
   url    — ссылка на карточку.
   ============================================================ */
window.dispatchEvent(new CustomEvent('t1:search-suggest', {
  detail: {
    list: [
      { header: 'Смартфон X1 Pro',      anons: '6.7" AMOLED, 128 ГБ, камера 50 Мп', url: '/product/1' },
      { header: 'Смартфон Nova Pro',    anons: '6.5" OLED, 256 ГБ, беспроводная зарядка', url: '/product/2' },
      { header: 'Ноутбук UltraBook 14', anons: '16 ГБ RAM, SSD 512 ГБ, 2.8K-экран', url: '/product/3' },
      { header: 'Ноутбук UltraBook 16', anons: '32 ГБ RAM, SSD 1 ТБ, дискретная графика', url: '/product/4' },
      { header: 'Планшет TabPro 12',    anons: '12.9" IPS, 256 ГБ, стилус в комплекте', url: '/product/5' },
      { header: 'Умные часы FitTrack Ultra', anons: 'AMOLED, GPS, пульсометр, 14 дней', url: '/product/6' },
      { header: 'Наушники TWS Air Buds',     anons: 'Bluetooth 5.3, кейс-зарядка', url: '/product/22' },
      { header: 'Телевизор Vision 65 QLED',  anons: '65", 4K, 120 Гц, HDR10+', url: '/product/30' },
      { header: 'Телевизор Vision 55 LED',   anons: '55", 4K, Smart TV', url: '/product/31' },
      { header: 'Проектор Beam 4K',          anons: '4K, 2200 люмен, лазер', url: '/product/33' },
      { header: 'Моноблок iMac 24',          anons: '24" Retina, M3, SSD 256 ГБ', url: '/product/39' },
      { header: 'Консоль GameStation 5',     anons: '1 ТБ, геймпад, 4K/120', url: '/product/44' },
      { header: 'Роутер RouterPro AX',       anons: 'Wi-Fi 6, 3000 Мбит/с, Mesh', url: '/product/48' },
      { header: 'Электросамокат Rider X8',   anons: '25 км/ч, запас хода 30 км', url: '/product/16' },
      { header: 'Дрон SkyFly Mini',           anons: '4K/30, стабилизатор, 30 мин полёта', url: '/product/10' }
    ]
  }
}));
