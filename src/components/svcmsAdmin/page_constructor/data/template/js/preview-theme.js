/* ============================================================
   preview-theme.js — применение темы из URL-параметров

   Единственный механизм смены темы в preview-страницах. Скрипт
   инлайнится в <head> (см. agent-doc/tools/optimize_head.py) после
   базовых тем.

   Базовые темы ИНЛАЙНЕНЫ в <head> (снимает блокирующие запросы):
   - css/themes/colors/digitalstrateg.css → <style id="t1-color-default">
     (БАЗА цвета и схема по умолчанию, #00a8e6);
   - css/themes/style/soft.css     → <style id="t1-style-soft">   (дефолт стиля).
   Остальные темы подключены <link data-color>/<link data-style> (disabled),
   в т.ч. вариант default.css («Бизнес-классика»).

   Параметры (?color=, &style=, &layout=, &font=) задаёт инструмент
   preview/index.html через iframe. Если параметры отсутствуют/невалидны —
   остаётся дефолт (digitalstrateg × soft × standard × inter).

   Модели включения (контракт в agent-doc/07_themes.md):
   - цвета — ЭКСКЛЮЗИВНО: активна ровно одна схема; базовая
     digitalstrateg инлайнена как дефолт и гасится при выборе другой схемы
     (styleElement.sheet.disabled), включается ровно одна ссылка-вариант;
   - стили — ЭКСКЛЮЗИВНО: инлайновый soft гасится при выборе другого стиля
     (styleElement.sheet.disabled), включается ровно одна ссылка-стиль.
   ============================================================ */

(function () {
  'use strict';

  var COLORS = ['digitalstrateg', 'default', 'ocean', 'forest', 'warm', 'gold', 'cherry', 'mint', 'dark', 'mono', 'slate', 'violet', 'coral', 'emerald', 'sky', 'rose'];
  var STYLES = ['soft', 'flat', 'brutal', 'glass', 'neumorph', 'card', 'compact', 'outline', 'rounded', 'paper', 'luxe', 'neo'];
  /* Ось компоновки (layout): эксклюзивно, дефолт standard. */
  var LAYOUTS = ['standard', 'industrial', 'elegant', 'editorial', 'wide', 'compact'];
  var DEFAULT_LAYOUT = 'standard';
  var DEFAULT_COLOR = 'digitalstrateg';

  /* Шрифтовые схемы (не требуют файлов — системные/self-hosted стеки).
     Меняют токены --font (текст) и --font-heading (заголовки). */
  var FONTS = {
    inter:  { body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif", heading: '' },
    system: { body: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif", heading: '' },
    serif:  { body: "Georgia, 'Times New Roman', 'PT Serif', serif", heading: "Georgia, 'Times New Roman', 'PT Serif', serif" },
    mono:   { body: "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace", heading: "" },
    golos:  { body: "'Golos Text', 'Inter', system-ui, sans-serif", heading: '' },
    manrope: { body: "'Manrope', 'Inter', system-ui, sans-serif", heading: '' },
    nunito: { body: "'Nunito', 'Inter', system-ui, sans-serif", heading: '' },
    ptserif: { body: "'PT Serif', Georgia, 'Times New Roman', serif", heading: "'PT Serif', Georgia, serif" },
    'inter-manrope': { body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif", heading: "'Manrope', 'Inter', system-ui, sans-serif" },
    'manrope-ptserif': { body: "'Manrope', 'Inter', system-ui, sans-serif", heading: "'PT Serif', Georgia, 'Times New Roman', serif" },
    geometric: { body: "system-ui, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", heading: '' },
    elegant: { body: "Georgia, 'Times New Roman', 'PT Serif', serif", heading: "Georgia, 'Times New Roman', 'PT Serif', serif" },
    rounded: { body: "ui-rounded, 'SF Pro Rounded', 'Nunito', 'Segoe UI', system-ui, sans-serif", heading: '' },
    condensed: { body: "'Arial Narrow', 'Roboto Condensed', 'Segoe UI', system-ui, sans-serif", heading: '' }
  };

  function known(list, value) {
    return list.indexOf(value) !== -1;
  }

  var params = new URLSearchParams(window.location.search);
  var color = params.has('color') && known(COLORS, params.get('color'))
    ? params.get('color')
    : null;
  var style = params.has('style') && known(STYLES, params.get('style'))
    ? params.get('style')
    : null;

  /* Цвета — эксклюзивно. Дефолт = digitalstrateg (инлайнен как t1-color-default).
     Инлайновую базу гасим, если выбрана другая схема; вариант-ссылки включаем
     только для активной (работает и когда база подключена ссылкой). */
  var activeColor = color || DEFAULT_COLOR;
  var colorBase = document.getElementById('t1-color-default');
  if (colorBase && colorBase.sheet) {
    colorBase.sheet.disabled = (activeColor !== DEFAULT_COLOR);
  }
  document.querySelectorAll('link[data-color]').forEach(function (link) {
    var name = link.getAttribute('data-color');
    link.disabled = (name !== activeColor);
  });

  /* Стили — эксклюзивно. Активный стиль = ?style или soft (дефолт).
     Инлайновый soft гасим, если выбран другой стиль; ссылки-стили включаем
     только для активного (работает и когда soft подключён ссылкой). */
  var activeStyle = style || 'soft';
  var soft = document.getElementById('t1-style-soft');
  if (soft && soft.sheet) {
    soft.sheet.disabled = (activeStyle !== 'soft');
  }
  document.querySelectorAll('link[data-style]').forEach(function (link) {
    link.disabled = link.getAttribute('data-style') !== activeStyle;
  });

  /* Компоновки (layout) — эксклюзивно. Ссылки-варианты могут отсутствовать
     (preview) — тогда создаём их рядом со стилевыми. Дефолт = standard. */
  var activeLayout = params.has('layout') && known(LAYOUTS, params.get('layout'))
    ? params.get('layout')
    : DEFAULT_LAYOUT;
  var layoutLinks = document.querySelectorAll('link[data-layout]');
  if (!layoutLinks.length) {
    var styleLink = document.querySelector('link[data-style]');
    var base = styleLink
      ? styleLink.getAttribute('href').replace(/[^/]+$/, '').replace('themes/style/', 'themes/layout/')
      : '';
    if (base) {
      LAYOUTS.forEach(function (name) {
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = base + name + '.css';
        l.setAttribute('data-layout', name);
        l.disabled = true;
        document.head.appendChild(l);
      });
      layoutLinks = document.querySelectorAll('link[data-layout]');
    }
  }
  layoutLinks.forEach(function (link) {
    link.disabled = link.getAttribute('data-layout') !== activeLayout;
  });
  document.documentElement.setAttribute('data-layout', activeLayout);

  /* Шрифтовая схема (?font=) — задаём токены прямо на :root */
  var font = params.get('font');
  if (font && FONTS[font]) {
    var st = document.documentElement.style;
    st.setProperty('--font', FONTS[font].body);
    if (FONTS[font].heading) st.setProperty('--font-heading', FONTS[font].heading);
  }
})();
