/**
 * @file config.js
 * @description Настройки превью конструктора. ЕДИНОЕ место правки путей/темы.
 *
 * templateBase — путь к корню шаблона (со слэшем на конце) ИЛИ абсолютный URL
 * (https://...). Примеры:
 *   '../templates/t1/'
 *   'https://cdn.example.com/templates/t1/'
 * color / style / layout — схемы тем: css/themes/colors/*, css/themes/style/*,
 * css/themes/layout/* (компоновка: геометрия + структурные правила).
 * font — шрифтовая схема (токены --font/--font-heading), как в preview-theme.js.
 * engine — подключать JS шаблона (реальное поведение компонентов).
 */
(function (global) {
  'use strict';
  global.PAGE_CONSTRUCTOR_CONFIG = {
    templateBase: '../templates/t1/',
    color: 'digitalstrateg',
    style: 'soft',
    layout: 'standard',
    font: 'inter',
    engine: true
  };
})(typeof window !== 'undefined' ? window : globalThis);
