/**
 * @file export.js
 * @description Сборка JSON-документа block_list и работа с localStorage.
 *
 * Чистый модуль (тестируется в Node), DOM используется только в copy/download.
 * Пишет в global.PC и module.exports.
 */
(function (global) {
  'use strict';

  var PC = global.PC = global.PC || {};

  var SCHEMA_ID = 'svcms.page_blocks';
  var SCHEMA_VERSION = 2;
  var STORAGE_KEY = 'svcms.page_constructor.v1';

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  /** Отфильтровать пустые значения из params (null/''). */
  function compactParams(params) {
    var out = {};
    var src = params || {};
    Object.keys(src).forEach(function (key) {
      var v = src[key];
      if (v === '' || v === null || v === undefined) return;
      out[key] = v;
    });
    return out;
  }

  /**
   * Нормализует блок в выходной формат.
   * @param {Object} block
   * @returns {Object}
   */
  function normalizeBlock(block) {
    var td = (global.PC && global.PC.typeDef) ? global.PC.typeDef(block.type) : null;
    var isData = !!(td && td.data);
    var out = {
      type: block.type,
      variant: block.variant || undefined,
      fill: block.fill || undefined,
      anim: block.anim || undefined,
      bleed: block.bleed || undefined,
      params: compactParams(block.params),
      items: clone(block.items || [])
    };
    if (!out.variant) delete out.variant;
    if (!out.fill) delete out.fill;
    if (!out.anim) delete out.anim;
    if (!out.bleed) delete out.bleed;
    // У data-блоков данные берутся из переменной (params.varname) — демо-items не экспортируем.
    if (isData || !out.items.length) delete out.items;
    return out;
  }

  /**
   * Собирает итоговый JSON-документ block_list.
   * Формат v2: только блоки (шаблон/страница задаются снаружи движком).
   * @param {Object} state — { blocks }
   * @returns {Object}
   */
  function exportDocument(state) {
    state = state || {};
    return {
      schema: SCHEMA_ID,
      version: SCHEMA_VERSION,
      blocks: (state.blocks || []).map(normalizeBlock)
    };
  }

  function serialize(state, pretty) {
    return JSON.stringify(exportDocument(state), null, pretty === false ? 0 : 2);
  }

  // -------- localStorage --------

  function hasStorage() {
    try { return typeof global.localStorage !== 'undefined' && global.localStorage !== null; }
    catch (e) { return false; }
  }

  function saveState(state) {
    if (!hasStorage()) return false;
    try {
      global.localStorage.setItem(STORAGE_KEY, serialize(state));
      return true;
    } catch (e) { return false; }
  }

  function loadState() {
    if (!hasStorage()) return null;
    try {
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var doc = JSON.parse(raw);
      if (!doc || !Array.isArray(doc.blocks)) return null;
      return doc;
    } catch (e) { return null; }
  }

  function clearState() {
    if (!hasStorage()) return false;
    try { global.localStorage.removeItem(STORAGE_KEY); return true; }
    catch (e) { return false; }
  }

  // -------- clipboard / download (DOM) --------

  function copyText(text) {
    if (typeof document === 'undefined') return Promise.resolve(false);
    if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
      return global.navigator.clipboard.writeText(text)
        .then(function () { return true; })
        .catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  function download(filename, text) {
    if (typeof document === 'undefined') return false;
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'block_list.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return true;
  }

  var api = {
    SCHEMA_ID: SCHEMA_ID,
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORAGE_KEY: STORAGE_KEY,
    clone: clone,
    compactParams: compactParams,
    normalizeBlock: normalizeBlock,
    exportDocument: exportDocument,
    serialize: serialize,
    saveState: saveState,
    loadState: loadState,
    clearState: clearState,
    copyText: copyText,
    fallbackCopy: fallbackCopy,
    download: download
  };

  for (var k in api) { if (Object.prototype.hasOwnProperty.call(api, k)) PC[k] = api[k]; }

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
