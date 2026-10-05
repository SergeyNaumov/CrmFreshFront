/**
 * @file data/header.js
 * @description Данные шапки для превью: меню (top_menu, многоуровневое),
 * логотип, телефон/почта/время (в релизе — из констант). Меню в шапке
 * НЕ редактируется — только вкл/выкл; данные автоматические.
 * Сейчас — демо; позже подменяется админкой.
 *
 * ВАЖНО: это данные для родительского документа (конструктора), а не
 * событие iframe. Подключается в index.html до render-preview.
 */
(function (global) {
  'use strict';

  global.PC_HEADER_DATA = {
    logo: 'images/logo.svg',
    phone: '+7 (495) 123-45-67',
    phone_raw: '+74951234567',
    email: 'info@technolife.ru',
    work_time: 'Ежедневно с 9:00 до 21:00',
    notice: 'Бесплатная доставка от 5 000 ₽',
    top_menu: [
      { header: 'Главная', url: '/', active: true },
      { header: 'О Компании', url: '/about', child: [
        { header: 'История', url: '/history' },
        { header: 'Структура Компании', url: '/company_struct' },
        { header: 'О нас', url: '/about' },
        { header: 'Для инвесторов', url: '/for_investors' }
      ] },
      { header: 'Каталог', url: '/catalog', child: [
        { header: 'Электроника', url: '/catalog/electronics', child: [
          { header: 'Телефоны', url: '/catalog/phones' },
          { header: 'Ноутбуки', url: '/catalog/laptops' },
          { header: 'Телевизоры', url: '/catalog/tv' },
          { header: 'Планшеты', url: '/catalog/tablets' }
        ] },
        { header: 'Гаджеты', url: '/catalog/gadgets', child: [
          { header: 'Смарт-часы', url: '/catalog/watches' },
          { header: 'Наушники', url: '/catalog/headphones' },
          { header: 'Фитнес-браслеты', url: '/catalog/fitness' }
        ] },
        { header: 'Умный дом', url: '/catalog/smart-home', child: [
          { header: 'Умные колонки', url: '/catalog/speakers' },
          { header: 'Роботы-пылесосы', url: '/catalog/vacuum' }
        ] }
      ] },
      { header: 'Новости', url: '/news' },
      { header: 'Статьи', url: '/articles' },
      { header: 'Услуги', url: '/service_list' },
      { header: 'Контакты', url: '/contacts' }
    ]
  };

  /**
   * Виды шапки (модификаторы к .header). Раскладки живут в prod-стилях
   * шаблона (css/style.css, класс header--<layout>), поэтому здесь только
   * превью-специфичные правки. Многоуровневое меню работает во всех видах.
   */
  global.PC_HEADER_CSS = [
    /* Превью-панель узкая → срабатывают адаптивные правила (≤991px) и меню
       с поиском прячутся. Для превью шапки форсируем десктоп: строка логотипа
       с поиском и меню на всю ширину. Вид «minimal» меню всё же скрывает. */
    '.header__nav { display: flex !important; }',
    '.header__search { display: block !important; }',
    '.header--search-row .header__main, .header--two .header__main { flex-wrap: wrap !important; }',
    '.header--minimal .header__nav { display: none !important; }',
    /* Мобильное правило «поиск отдельной строкой» не должно применяться к
       превью — узкая панель показывает десктопную раскладку. */
    '.header__search { order: 2 !important; flex: 1 1 auto !important; max-width: 620px !important; padding-bottom: 0 !important; }',
    '.header--classic .header__search { order: 4 !important; flex: 1 0 100% !important; max-width: 720px !important; padding-bottom: 14px !important; }',
    /* Анимация для структурных блоков: у них нет .block, поэтому анимируем сам элемент. */
    '.header.block--anim-zoom, .footer.block--anim-zoom { animation: tbRevealZoom .6s ease both; }',
    '.header.block--anim-clip, .footer.block--anim-clip { animation: tbRevealClip .6s ease both; }',
    '.header.block--no-anim, .footer.block--no-anim { animation: none; }'
  ].join('\n');
})(typeof window !== 'undefined' ? window : globalThis);
