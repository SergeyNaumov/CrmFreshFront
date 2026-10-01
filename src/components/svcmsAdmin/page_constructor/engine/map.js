/**
 * @file preview-map.js
 * @description Карта: тип блока → CSS/JS шаблона и ключ данных превью.
 *
 * Пути CSS/JS — относительно корня шаблона (templateBase).
 * dataKey — файл в page_constructor/js/data/<key>.js (контракт t1: событий).
 * kind — как рендерить (static | hero-slider | catalog-block | goods-block | ...).
 *
 * Списки собраны по research движка t1 (см. agent-doc/16_block_contract.md).
 */
(function (global) {
  'use strict';

  var COMMON_JS = [
    'js/vue.global.prod.js',
    'js/components/carousel.js',
    'js/app.js',
    'js/components/photo-gallery.js',
    'js/components/goods-block.js',
    'js/goods_blocks.js',
    'js/components/hero-slider.js',
    'js/components/catalog-block.js'
  ];

  global.PC_PREVIEW_MAP = {
    cssBase: [
      'css/fonts.css',
      'css/tokens/_tokens-base.css',
      'css/style.css',
      'css/forms.css'
    ],
    cssColor: 'css/themes/colors/{color}.css',
    cssStyle: 'css/themes/style/{style}.css',
    cssLayout: 'css/themes/layout/{layout}.css',
    commonJs: COMMON_JS,
    dataDir: 'js/data/',

    type: {
      text:           { css: [], kind: 'static' },
      slider:         { css: ['css/block-slider.css'], kind: 'hero-slider', dataKey: 'slider' },
      catalog:        { css: ['css/catalog.css', 'css/splide.min.css'], kind: 'catalog-block', dataKey: 'catalog' },
      goods:          { css: ['css/goods_block.css'], kind: 'goods-block', dataKey: 'goods' },
      advantages:     { css: ['css/advantages-icons.css'], kind: 'static' },
      reviews:        { css: [], kind: 'carousel' },
      clients:        { css: [], kind: 'carousel' },
      services:       { css: [], kind: 'static' },
      faq:            { css: [], kind: 'static' },
      header:         { css: ['css/header-search.css'], kind: 'static', extraJs: ['js/preview/header-search.js'] },
      footer:         { css: [], kind: 'static' },
      product_card:   { css: ['css/goods_block.css'], kind: 'static' },
      product_list:   { css: ['css/good_list.css', 'css/goods_block.css'], kind: 'good-list', dataKey: 'good_list', extraJs: ['js/perpage.js', 'js/good_list.js'] },
      rubric_list:    { css: ['css/catalog.css'], kind: 'static' },
      product_detail: { css: ['css/good_in.css', 'css/fancybox.css'], kind: 'good-in', extraJs: ['js/good_in.js', 'js/fancybox.umd.js'] },
      service_card:   { css: ['css/service_list.css'], kind: 'static' },
      service_list:   { css: ['css/service_list.css'], kind: 'static' },
      service_detail: { css: ['css/service_in.css'], kind: 'static' },
      team:           { css: [], kind: 'carousel' },
      certificates:   { css: ['css/fancybox.css'], kind: 'static' },
      catalog_projects: { css: [], kind: 'catalog-projects', extraJs: ['js/catalog_projects.js'] },
      countdown:      { css: [], kind: 'static', extraJs: ['js/countdown.js'] },
      marquee:        { css: [], kind: 'static' },
      tabs:           { css: [], kind: 'static' },
      photo_gallery:  { css: ['css/fancybox.css'], kind: 'static', extraJs: ['js/gallery.js'] },
      brands_grid:    { css: [], kind: 'static' },
      history_timeline: { css: [], kind: 'static' },
      org_chart:      { css: [], kind: 'static' },
      reports:        { css: [], kind: 'static' },
      photo_gallery:  { css: ['css/fancybox.css'], kind: 'static', extraJs: ['js/fancybox.umd.js'] },
      video:          { css: [], kind: 'static', extraJs: ['js/components/video-block.js'] },
      brands_grid:    { css: ['css/brands.css'], kind: 'static' },
      news_list:      { css: ['css/news_in.css'], kind: 'news-list', dataKey: 'news', extraJs: ['js/components/news-list.js'] },
      article_list:   { css: ['css/articles.css', 'css/article_in.css'], kind: 'static' },
      tabs:           { css: [], kind: 'static' },
      tags:           { css: ['css/good_list.css'], kind: 'static' },
      branches:       { css: [], kind: 'static' },
      map:            { css: [], kind: 'static' },
      requisites:     { css: [], kind: 'static' },
      contacts_info:  { css: [], kind: 'static' },
      history_timeline: { css: [], kind: 'static' },
      org_chart:      { css: [], kind: 'static' },
      reports:        { css: [], kind: 'static' },
      promo_parallax: { css: [], kind: 'static' },
      subscribe:      { css: [], kind: 'static', extraJs: ['js/form_builder.js', 'js/preview/forms.js', 'js/forms.js', 'js/jmodal.js'] },
      form:           { css: ['css/forms.css'], kind: 'static', extraJs: ['js/form_builder.js', 'js/preview/forms.js', 'js/forms.js', 'js/jmodal.js'] },
      contact_form:   { css: ['css/forms.css'], kind: 'static', extraJs: ['js/form_builder.js', 'js/preview/forms.js', 'js/forms.js', 'js/jmodal.js'] },
      routes:         { css: [], kind: 'static' },
      page_favorites: { css: ['css/good_list.css', 'css/goods_block.css'], kind: 'good-list', dataKey: 'good_list', extraJs: ['js/perpage.js', 'js/good_list.js'] },
      page_search:    { css: ['css/good_list.css', 'css/goods_block.css', 'css/search.css'], kind: 'good-list', dataKey: 'good_list', extraJs: ['js/perpage.js', 'js/good_list.js'] },
      page_404:       { css: ['css/404.css'], kind: 'static' },
      page_compare:   { css: ['css/good_list.css'], kind: 'static', extraJs: ['js/compare.js'] },
      page_basket:    { css: ['css/forms.css'], kind: 'static', extraJs: ['js/basket.js'] },
      page_news_detail:    { css: ['css/news_in.css', 'css/splide.min.css'], kind: 'static' },
      page_article_detail: { css: ['css/articles.css', 'css/article_in.css'], kind: 'static' },
      page_order:          { css: [], kind: 'static' },
      page_profile:        { css: ['css/forms.css'], kind: 'static' },
      page_registration:   { css: ['css/forms.css'], kind: 'static', extraJs: ['js/form_builder.js', 'js/preview/forms.js', 'js/forms.js', 'js/jmodal.js'] }
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
