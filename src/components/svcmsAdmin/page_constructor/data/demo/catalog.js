/* ============================================================
   templates/t1/js/preview/catalog.js
   Демо-данные блока «Каталог товаров» для preview.
   СГЕНЕРИРОВАН из projects/5837/catalog.json (все 12 разделов).
   В релизной версии этот список вернёт сервер по адресу data-url
   (примерно в таком же формате — голый массив разделов).
   Здесь данные «публикуются» событием t1:catalog: компонент
   <catalog-block> с id="catalog" слушает событие и берёт свой
   список по detail.id.
   Запрос выполняется как <script> (fetch/import из file:// блокируются).

   Формат записи: { id, header, body, url, photo }
   header — название раздела, body — краткое описание (anons из catalog.json),
   url — ссылка на раздел, photo — картинка раздела (images/catalog/catalog-N.webp).
   ============================================================ */
window.dispatchEvent(new CustomEvent('t1:catalog', {
  detail: {
    id: 'catalog',
    list: [
      {"id": 1,"header": "Электроника","body": "Смартфоны, ноутбуки и планшеты топовых брендов: новые модели, аксессуары и техника для дома.","url": "catalog_in.html","photo": "images/catalog/catalog-1.webp"},
      {"id": 2,"header": "Гаджеты","body": "Умные часы, наушники, камеры и колонки для жизни в движении. Подборки под любой бюджет.","url": "catalog_in.html","photo": "images/catalog/catalog-2.webp"},
      {"id": 3,"header": "Умный дом","body": "Климат, освещение и безопасность под управлением со смартфона. Голосовые ассистенты уже в комплекте.","url": "catalog_in.html","photo": "images/catalog/catalog-3.webp"},
      {"id": 4,"header": "Спорт и отдых","body": "Трекеры, аксессуары и снаряжение для тренировок и активного досуга в любое время года.","url": "catalog_in.html","photo": "images/catalog/catalog-4.webp"},
      {"id": 5,"header": "Аудиотехника","body": "Наушники, колонки и звуковые панели: от компактных моделей до полноценных домашних кинотеатров.","url": "catalog_in.html","photo": "images/catalog/catalog-5.webp"},
      {"id": 6,"header": "Аксессуары","body": "Зарядные устройства, кабели, чехлы и крепления — всё для комфортного использования гаджетов.","url": "catalog_in.html","photo": "images/catalog/catalog-6.webp"},
      {"id": 7,"header": "Телевизоры и кинотеатры","body": "OLED, QLED и лазерные модели от 32 до 85 дюймов. Поможем собрать домашний кинотеатр под любой бюджет.","url": "catalog_in.html","photo": "images/catalog/catalog-7.webp"},
      {"id": 8,"header": "Фото и видео","body": "Беззеркальные камеры, экшн-камеры, объективы и штативы — для съёмки путешествий, блогов и семейных архивов.","url": "catalog_in.html","photo": "images/catalog/catalog-8.webp"},
      {"id": 9,"header": "Компьютерная техника","body": "Моноблоки, системные блоки и комплектующие для работы, учёбы и игр. Соберём ПК под ваши задачи.","url": "catalog_in.html","photo": "images/catalog/catalog-9.webp"},
      {"id": 10,"header": "Игровой сегмент","body": "Консоли, геймпады, рули и кресла. Всё, чтобы играть комфортно — дома или в дороге.","url": "catalog_in.html","photo": "images/catalog/catalog-10.webp"},
      {"id": 11,"header": "Сеть и связь","body": "Роутеры, Wi-Fi-системы и Mesh — стабильный интернет в каждой комнате. Настройка и установка под ключ.","url": "catalog_in.html","photo": "images/catalog/catalog-11.webp"},
      {"id": 12,"header": "Питание и батареи","body": "Внешние аккумуляторы, зарядные станции и устройства для работы вдали от розетки.","url": "catalog_in.html","photo": "images/catalog/catalog-12.webp"}
    ]
  }
}));
