/**
 * @file data/footer.js
 * @description Данные футера для превью: меню (bottom_menu, catalog_menu),
 * контакты, соцсети, копирайт. В релизе — из констант/бэкенда и НЕ
 * редактируется (только вкл/выкл секций). Сейчас — демо; позже подменяется
 * админкой. Структура повторяет block/footer.html и preview/main.html.
 */
(function (global) {
  'use strict';

  global.PC_FOOTER_DATA = {
    orgname: 'DigitalStrateg',
    logo: 'images/logo.svg',
    desc: 'Интернет-магазин электроники и гаджетов с гарантией качества и доставкой по всей России.',
    phone: '+7 (495) 123-45-67',
    phone_raw: '+74951234567',
    email: 'info@digitalstrateg.ru',
    address: '109341, г. Москва, ул. Перерва, д.11 стр.3, офис 505',
    work_time: 'Ежедневно с 9:00 до 21:00',
    copyright: '© 2026 DigitalStrateg. Все права защищены.',
    bottom_menu: [
      { header: 'Компания', child: [
        { header: 'О компании', url: '/about' },
        { header: 'История', url: '/history' },
        { header: 'Структура компании', url: '/company_struct' },
        { header: 'Для инвесторов', url: '/for_investors' }
      ] },
      { header: 'Покупателям', child: [
        { header: 'Доставка', url: '/delivery' },
        { header: 'Гарантия', url: '/warranty' },
        { header: 'Оплата', url: '/payment' },
        { header: 'Возврат', url: '/return' }
      ] }
    ],
    catalog_menu: [
      { header: 'Электроника', url: '/catalog/electronics' },
      { header: 'Гаджеты', url: '/catalog/gadgets' },
      { header: 'Умный дом', url: '/catalog/smart-home' },
      { header: 'Спорт и отдых', url: '/catalog/sport' }
    ],
    socials: [
      { id: 'i-vk', label: 'ВКонтакте', url: '#' },
      { id: 'i-ok', label: 'Одноклассники', url: '#' },
      { id: 'i-dzen', label: 'Дзен', url: '#' },
      { id: 'i-rutube', label: 'RuTube', url: '#' },
      { id: 'i-max', label: 'MAX', url: '#' }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
