/**
 * @file preview-frame.js
 * @description Сборка изолированного HTML-документа для превью блока в <iframe>.
 *
 * - CSS/JS шаблона берутся по абсолютным URL относительно PAGE_CONSTRUCTOR_CONFIG.templateBase.
 * - data-data-key="x" заменяется на абсолютный data-url → js/data/x.js (данные превью).
 * - <base href> = templateBase, чтобы внутренние относительные загрузки шаблона
 *   (например, app.js → js/preview/basket_info.js) резолвлись в корень шаблона.
 *
 * Пишет в global.PC и module.exports (для тестов).
 */
(function (global) {
  'use strict';

  var PC = global.PC = global.PC || {};

  var FONTS = {
    inter: { body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif", heading: '' },
    system: { body: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", heading: '' },
    serif: { body: "Georgia, 'Times New Roman', 'PT Serif', serif", heading: "Georgia, 'Times New Roman', 'PT Serif', serif" },
    mono: { body: "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace", heading: '' },
    golos: { body: "'Golos Text', 'Inter', system-ui, sans-serif", heading: '' },
    manrope: { body: "'Manrope', 'Inter', system-ui, sans-serif", heading: '' },
    nunito: { body: "'Nunito', 'Inter', system-ui, sans-serif", heading: '' },
    ptserif: { body: "'PT Serif', Georgia, 'Times New Roman', serif", heading: "'PT Serif', Georgia, serif" },
    'inter-manrope': { body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif", heading: "'Manrope', 'Inter', system-ui, sans-serif" },
    'manrope-ptserif': { body: "'Manrope', 'Inter', system-ui, sans-serif", heading: "'PT Serif', Georgia, 'Times New Roman', serif" }
  };

  function cfg() {
    return global.PAGE_CONSTRUCTOR_CONFIG || {
      templateBase: '../templates/t1/', color: 'digitalstrateg', style: 'soft', layout: 'standard', font: 'inter', engine: true
    };
  }
  function map() {
    return global.PC_PREVIEW_MAP || { cssBase: [], commonJs: [], cssColor: '', cssStyle: '', dataDir: 'js/data/', type: {} };
  }
  function esc(v) {
    return String(v === undefined || v === null ? '' : v)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // База для тестов/Node, где нет document.location.
  function docBase(opts) {
    if (opts && opts.baseUrl) return opts.baseUrl;
    if (typeof document !== 'undefined' && document.baseURI) return document.baseURI;
    return 'http://localhost/page_constructor/';
  }

  function tplBase(opts) {
    return new URL(cfg().templateBase, docBase(opts)).href;
  }
  function tplAsset(path, opts) {
    return new URL(path, tplBase(opts)).href;
  }
  function dataAsset(key, opts) {
    var base = cfg().dataBase;
    if (base) return new URL(base + key + '.js', docBase(opts)).href;
    return new URL(map().dataDir + key + '.js', docBase(opts)).href;
  }

  function fontCss(name) {
    var f = FONTS[name];
    if (!f) return '';
    return ':root{--font:' + f.body + ';--font-heading:' + (f.heading || 'var(--font)') + ';}';
  }

  /** Заменить data-data-key="x" на абсолютный data-url. */
  function resolveDataKeys(markup, opts) {
    return String(markup || '').replace(/data-data-key="([^"]+)"/g, function (m, key) {
      return 'data-url="' + esc(dataAsset(key, opts)) + '"';
    });
  }

  /**
   * Собрать полный HTML-документ превью.
   * @param {string} markup — реальная разметка блока(ов)
   * @param {string} type — тип блока (для выбора CSS/JS); для страницы — null
   * @param {Object} [opts] — { baseUrl } для тестов
   */
  function buildPreviewDoc(markup, type, opts) {
    var c = cfg(); var m = map();
    var types = Array.isArray(type) ? type : (type ? [type] : []);
    var css = []; var extraJs = [];
    types.forEach(function (tp) {
      var t = (m.type || {})[tp] || {};
      (t.css || []).forEach(function (f) { if (css.indexOf(f) === -1) css.push(f); });
      (t.extraJs || []).forEach(function (f) { if (extraJs.indexOf(f) === -1) extraJs.push(f); });
    });
    var out = ['<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">'];
    out.push('<meta name="viewport" content="width=device-width, initial-scale=1">');
    out.push('<base href="' + esc(tplBase(opts)) + '">');

    (m.cssBase || []).concat(css).forEach(function (f) {
      out.push('<link rel="stylesheet" href="' + esc(tplAsset(f, opts)) + '">');
    });
    if (c.font && FONTS[c.font]) out.push('<style>' + fontCss(c.font) + '</style>');
    if (c.color && m.cssColor) out.push('<link rel="stylesheet" href="' + esc(tplAsset(m.cssColor.replace('{color}', c.color), opts)) + '">');
    if (c.style && m.cssStyle) out.push('<link rel="stylesheet" href="' + esc(tplAsset(m.cssStyle.replace('{style}', c.style), opts)) + '">');
    if (c.layout && m.cssLayout) out.push('<link rel="stylesheet" href="' + esc(tplAsset(m.cssLayout.replace('{layout}', c.layout), opts)) + '">');
    if (c.customCss) out.push('<style>' + c.customCss + '</style>');
    var chrome = types.indexOf('header') !== -1 || types.indexOf('footer') !== -1;
    out.push('<style>html,body{margin:0}body{padding:' + (chrome ? '0' : '18px') + ';background:' + (c.color === 'dark' ? '#14161d' : '#fff') + '}</style>');
    if ((types.indexOf('header') !== -1 || types.indexOf('footer') !== -1) && global.PC_HEADER_CSS) {
      out.push('<style>' + global.PC_HEADER_CSS + '</style>');
    }
    out.push('</head><body class="page-constructor-preview">');
    if (global.PC_SPRITE) out.push(global.PC_SPRITE);
    out.push('<script>window.__pcErrors=[];window.addEventListener("error",function(e){window.__pcErrors.push(String(e.message||e.error));});<\/script>');
    out.push(resolveDataKeys(markup, opts));
    if (c.engine) {
      (m.commonJs || []).concat(extraJs).forEach(function (f) {
        out.push('<script src="' + esc(tplAsset(f, opts)) + '"><\/script>');
      });
    }
    out.push('</body></html>');
    return out.join('\n');
  }

  var api = {
    buildPreviewDoc: buildPreviewDoc,
    resolveDataKeys: resolveDataKeys,
    tplBase: tplBase,
    tplAsset: tplAsset,
    dataAsset: dataAsset
  };
  for (var k in api) { if (Object.prototype.hasOwnProperty.call(api, k)) PC[k] = api[k]; }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
