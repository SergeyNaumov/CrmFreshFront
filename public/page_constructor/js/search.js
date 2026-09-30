/**
 * @file search.js
 * @description Поиск блоков по названию и ключевым словам (ru+en) для
 * автокомплита в модалке «Добавить блок».
 *
 * Чистый модуль (без DOM): используется в браузере и в Node-тестах.
 * Пишет в global.PC и module.exports.
 */
(function (global) {
  'use strict';

  var PC = global.PC = global.PC || {};

  function norm(value) {
    return String(value === undefined || value === null ? '' : value)
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Плоский список кандидатов (по одному на вариант типа).
   * @param {Object} schema — PAGE_CONSTRUCTOR_SCHEMA
   * @returns {Array}
   */
  function buildCandidates(schema) {
    schema = schema || {};
    var types = schema.types || {};
    var out = [];
    Object.keys(types).forEach(function (type) {
      var t = types[type] || {};
      var variantKeys = Object.keys(t.variants || {});
      if (!variantKeys.length) variantKeys = ['default'];
      // Блоки с переключаемым «видом» — одна запись в поиске (вид меняется в форме).
      if (t.views) variantKeys = [t.default_variant || variantKeys[0]];
      var variantWords = Object.keys(t.variants || {}).map(function (vk) {
        var vd = (t.variants || {})[vk] || {};
        return vk + ' ' + (vd.title || '');
      }).join(' ');
      var base = [
        type,
        t.title || '',
        (t.keywords || []).join(' '),
        t.group || '',
        variantWords
      ].join(' ');
      variantKeys.forEach(function (vk) {
        var vd = (t.variants || {})[vk] || {};
        out.push({
          group: t.group || 'Прочее',
          type: type,
          typeTitle: t.title || type,
          variantKey: vk,
          variantLabel: t.views ? (t.title || type) : (vk === 'default' ? (t.title || type) : (vd.title || vk)),
          structural: !!t.structural,
          haystack: norm(base + ' ' + (vd.title || ''))
        });
      });
    });
    return out;
  }

  /**
   * Фильтр кандидатов по запросу (все токены должны встречаться).
   * @param {Array} candidates
   * @param {string} query
   * @returns {Array}
   */
  function filterCandidates(candidates, query) {
    var q = norm(query);
    if (!q) return candidates.slice();
    var tokens = q.split(' ').filter(Boolean);
    return candidates.filter(function (c) {
      return tokens.every(function (tok) { return c.haystack.indexOf(tok) !== -1; });
    });
  }

  /**
   * Сгруппировать кандидатов: [{group, types:[{type,typeTitle,structural,variants:[{variantKey,variantLabel}]}]}]
   * @param {Array} candidates
   * @returns {Array}
   */
  function groupCandidates(candidates) {
    var groups = {};
    var order = [];
    candidates.forEach(function (c) {
      if (!groups[c.group]) { groups[c.group] = {}; order.push(c.group); }
      var byType = groups[c.group];
      if (!byType[c.type]) {
        byType[c.type] = { type: c.type, typeTitle: c.typeTitle, structural: c.structural, variants: [] };
      }
      byType[c.type].variants.push({ variantKey: c.variantKey, variantLabel: c.variantLabel });
    });
    function ru(a, b) { return String(a).localeCompare(String(b), 'ru'); }
    // Группы и типы — по алфавиту; варианты внутри типа — по алфавиту.
    return order.sort(ru).map(function (g) {
      var list = Object.keys(groups[g]).map(function (k) { return groups[g][k]; });
      list.forEach(function (t) { t.variants.sort(function (a, b) { return ru(a.variantLabel, b.variantLabel); }); });
      list.sort(function (a, b) { return ru(a.typeTitle, b.typeTitle); });
      return { group: g, types: list };
    });
  }

  /**
   * Полный поиск: вернуть сгруппированную структуру для рендера.
   * @param {Object} schema
   * @param {string} query
   */
  function search(schema, query) {
    return groupCandidates(filterCandidates(buildCandidates(schema), query));
  }

  var api = {
    norm: norm,
    buildCandidates: buildCandidates,
    filterCandidates: filterCandidates,
    groupCandidates: groupCandidates,
    search: search
  };

  for (var k in api) { if (Object.prototype.hasOwnProperty.call(api, k)) PC[k] = api[k]; }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
