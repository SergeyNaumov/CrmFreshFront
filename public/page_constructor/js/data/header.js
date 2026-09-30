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
   * Виды шапки (модификаторы к .header). Конструкторский CSS — инлайнится
   * только в превью шапки. Многоуровневое меню работает во всех видах.
   */
  global.PC_HEADER_CSS = [
    /* Превью-панель узкая → срабатывают адаптивные правила и меню прячется.
       Для превью шапки форсируем десктопное меню; вид «minimal» его скрывает. */
    '.header__nav { display: flex !important; }',
    '.header--minimal .topbar { display: none; }',
    '.header--minimal .header__nav { display: none !important; }',
    '.header--two .header__main { flex-wrap: wrap; }',
    '.header--two .header__nav { order: 3; flex: 1 0 100%; margin: 12px 0 0; padding-top: 12px; border-top: 1px solid var(--border); }',
    '.header--center .header__main { flex-wrap: wrap; justify-content: center; row-gap: 10px; }',
    '.header--center .logo { flex: 1 0 100%; display: flex; justify-content: center; }',
    '.header--center .header__nav { margin: 0 auto; }',
    '.header--center .header__actions { margin: 0 auto; }',
    /* Анимация для структурных блоков: у них нет .block, поэтому анимируем сам элемент. */
    '.header.block--anim-zoom, .footer.block--anim-zoom { animation: tbRevealZoom .6s ease both; }',
    '.header.block--anim-clip, .footer.block--anim-clip { animation: tbRevealClip .6s ease both; }',
    '.header.block--no-anim, .footer.block--no-anim { animation: none; }'
  ].join('\n');
})(typeof window !== 'undefined' ? window : globalThis);
