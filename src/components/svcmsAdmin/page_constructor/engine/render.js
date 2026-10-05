/**
 * @file render-preview.js
 * @description Реальная разметка блоков (контрактные классы/теги) для превью
 * в изолированном iframe. Пишет в global.PC и module.exports.
 *
 * Компонентные блоки отдают теги (<hero-slider>, <catalog-block>,
 * <goods-block>, #newsList, .carousel) с атрибутом data-data-key — его
 * js/preview-frame.js заменяет на абсолютный data-url к js/data/<key>.js.
 */
(function (global) {
  'use strict';

  var PC = global.PC = global.PC || {};

  // -------- утилиты --------
  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function el(tag, attrs, inner) {
    var a = '';
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false || v === '') return;
        if (v === true) { a += ' ' + k; return; }
        a += ' ' + k + '="' + esc(v) + '"';
      });
    }
    if (inner === null || inner === undefined || inner === '') return '<' + tag + a + '></' + tag + '>';
    return '<' + tag + a + '>' + inner + '</' + tag + '>';
  }
  function link(url, cls, inner, extra) {
    var attrs = { class: cls, href: url || '#' };
    if (extra) Object.keys(extra).forEach(function (k) { attrs[k] = extra[k]; });
    return el('a', attrs, inner);
  }
  var FALLBACK_IMG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200">' +
    '<rect width="100%" height="100%" fill="#eef1f7"/>' +
    '<text x="50%" y="50%" fill="#a3abbd" font-family="sans-serif" font-size="14" ' +
    'text-anchor="middle" dominant-baseline="middle">нет фото</text></svg>');
  function mediaUrl(src) {
    if (!src) return src;
    // Картинки блоков проекта (block-images/…) резолвятся от filesBase.
    if (src.indexOf('block-images/') === 0) {
      var fb = (global.PAGE_CONSTRUCTOR_CONFIG && global.PAGE_CONSTRUCTOR_CONFIG.filesBase) || '';
      return fb + src;
    }
    return src;
  }
  function img(src, alt, cls) {
    var s = mediaUrl(src) || FALLBACK_IMG;
    return '<img src="' + esc(s) + '" alt="' + esc(alt || '') + '"' +
      (cls ? ' class="' + esc(cls) + '"' : '') +
      ' decoding="async" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">';
  }
  /** Логотип: обязательны width/height (SVG без размеров не рисуется). */
  function logoImg(src, alt) {
    return '<img src="' + esc(src || 'images/logo.svg') + '" width="155" height="38" alt="' + esc(alt || '') + '"' +
      ' decoding="async" onerror="this.onerror=null;this.src=\'' + FALLBACK_IMG + '\'">';
  }
  /** JSON в single-quoted data-атрибут (экранируем только апострофы). */
  function attrJson(v) {
    return JSON.stringify(v === undefined ? null : v).replace(/'/g, '&#39;');
  }
  function schema() { return global.PAGE_CONSTRUCTOR_SCHEMA || { types: {} }; }
  function typeDef(type) { return (schema().types || {})[type] || null; }
  function variantDef(type, variant) {
    var t = typeDef(type);
    if (!t || !t.variants) return null;
    if (t.variants[variant]) return t.variants[variant];
    if (t.default_variant && t.variants[t.default_variant]) return t.variants[t.default_variant];
    var keys = Object.keys(t.variants); return keys.length ? t.variants[keys[0]] : null;
  }
  function variantParams(type, variant) {
    var v = variantDef(type, variant);
    if (!v) return [];
    if (Array.isArray(v.params)) return v.params;
    if (v.params_ref) {
      var t = typeDef(type);
      return ((t && t.shared_params) || {})[v.params_ref] || [];
    }
    return [];
  }
  function itemFields(type, variant) {
    var v = variantDef(type, variant);
    if (v && v.items && v.items.fields) return v.items.fields;
    var t = typeDef(type);
    return (t && t.items_shared && t.items_shared.fields) || [];
  }
  function sampleItems(type, variant) {
    var v = variantDef(type, variant);
    if (v && v.items && Array.isArray(v.items.default)) return v.items.default;
    var t = typeDef(type);
    return (t && t.items_shared && Array.isArray(t.items_shared.default)) ? t.items_shared.default : [];
  }

  function fillClass(fill) { return fill ? 'block--' + String(fill).replace(/^block--/, '') : ''; }
  function animClass(anim) {
    if (!anim) return '';
    if (anim === 'no-anim') return 'block--no-anim';
    if (anim === 'anim-zoom' || anim === 'anim-clip') return 'block--' + anim;
    return 'block--anim-' + anim;
  }
  function blockEnvelopeClasses(block) {
    var out = ['block'];
    var f = fillClass(block.fill); if (f) out.push(f);
    if (block.bleed) out.push('block--bleed');
    var a = animClass(block.anim); if (a) out.push(a);
    var td = typeDef(block.type);
    if (td && td.contract_classes) {
      td.contract_classes.forEach(function (c) { if (out.indexOf(c) === -1) out.push(c); });
    }
    return out;
  }

  /** Только классы конверта (block + fill/anim/bleed), без контрактных классов типа. */
  function envelopeClasses(block) {
    var out = ['block'];
    var f = fillClass(block.fill); if (f) out.push(f);
    if (block.bleed) out.push('block--bleed');
    var a = animClass(block.anim); if (a) out.push(a);
    return out;
  }
  function envelopeModifiers(block) {
    return envelopeClasses(block).filter(function (c) { return c !== 'block'; }).join(' ');
  }

  function p(block, key, fb) {
    var v = (block.params || {})[key];
    return (v !== undefined && v !== null && v !== '') ? v : (fb === undefined ? '' : fb);
  }
  function bool(block, key) { return !!(block.params || {})[key]; }
  /** Параметр-галочка с дефолтом (не задан = дефолт, а не false). */
  function defBool(block, key, dflt) {
    var v = (block.params || {})[key];
    return v === undefined ? !!dflt : !!v;
  }
  /** Дополняет params схемными дефолтами (структурные блоки без явных значений). */
  function withDefaults(block) {
    if (!block) return block;
    var params = {};
    var src = block.params || {};
    Object.keys(src).forEach(function (k) { params[k] = src[k]; });
    (variantParams(block.type, block.variant) || []).forEach(function (d) {
      if (params[d.name] === undefined) params[d.name] = d.default;
    });
    return { type: block.type, variant: block.variant, params: params };
  }
  function items(block) {
    if (Array.isArray(block.items) && block.items.length) return block.items;
    var td = typeDef(block.type);
    if (td && td.data) return sampleItems(block.type, block.variant);
    return Array.isArray(block.items) ? block.items : [];
  }
  function dataAttr(block, key) { return typeDef(block.type) && previewKind(block.type) ? { 'data-data-key': key } : {}; }

  function previewKind(type) {
    var map = global.PC_PREVIEW_MAP;
    var t = map && map.type && map.type[type];
    return t ? t.kind : 'static';
  }

  // -------- header / footer --------
  function renderMenu(list, level, expanded) {
    return (list || []).map(function (m) {
      var active = !!m.active;
      var aria = expanded ? 'true' : 'false';
      if (m.child && m.child.length) {
        var caret = '<svg class="nav-link__caret' + (level > 0 ? ' nav-link__caret--flyout' : '') +
          ' icon icon-caret-down" aria-hidden="true"><use href="#i-caret-down"></use></svg>';
        if (level === 0) {
          return '<div class="nav-item has-submenu' + (active ? ' is-active' : '') + '">' +
            '<a class="nav-link" href="' + esc(m.url) + '" aria-haspopup="true" aria-expanded="' + aria + '">' +
            esc(m.header) + caret + '</a>' +
            '<ul class="nav-submenu" aria-label="' + esc(m.header) + '">' + renderMenu(m.child, 1, expanded) + '</ul></div>';
        }
        return '<li class="nav-item has-submenu' + (active ? ' is-active' : '') + '">' +
          '<a href="' + esc(m.url) + '" aria-haspopup="true" aria-expanded="' + aria + '">' +
          esc(m.header) + caret + '</a>' +
          '<ul class="nav-submenu nav-submenu--flyout" aria-label="' + esc(m.header) + '">' + renderMenu(m.child, level + 1, expanded) + '</ul></li>';
      }
      if (level === 0) {
        return '<a class="nav-link' + (active ? ' is-active' : '') + '" href="' + esc(m.url) + '">' + esc(m.header) + '</a>';
      }
      return '<li><a href="' + esc(m.url) + '"' + (active ? ' class="is-active"' : '') + '>' + esc(m.header) + '</a></li>';
    }).join('');
  }

  function headerWidgets(block) {
    var out = '';
    if (bool(block, 'favorite')) {
      out += '<a class="header-widget favorites-widget" href="/favorites" aria-label="Избранное">' +
        '<span class="header-widget__icon"><svg class="icon icon-heart" aria-hidden="true"><use href="#i-heart"></use></svg></span>' +
        '<span class="header-widget__label">Избранное</span></a>';
    }
    if (bool(block, 'compare')) {
      out += '<a class="header-widget compare-widget" href="/compare" aria-label="Сравнение">' +
        '<span class="header-widget__icon"><svg class="icon icon-compare" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 5h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 5v14M15 5v14"/></svg></span>' +
        '<span class="header-widget__label">Сравнение</span></a>';
    }
    if (bool(block, 'cart')) {
      out += '<button class="header-widget basket-widget__btn" type="button" aria-label="Корзина">' +
        '<span class="header-widget__icon"><svg class="icon icon-cart" aria-hidden="true"><use href="#i-cart"></use></svg></span>' +
        '<span class="header-widget__label">Корзина</span></button>';
    }
    out += '<button class="burger" id="burgerBtn" type="button" aria-label="Открыть меню" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>';
    return out;
  }

  // Плоский список пунктов шапки с level (0/1/2) → дерево для renderMenu.
  function menuFromFlat(items) {
    var roots = [], stack = [];
    (items || []).forEach(function (it) {
      var url = it.url || '', header = it.header || it.title || '';
      if (!header && !url) return;
      var lvl = parseInt(it.level || 0, 10);
      if (isNaN(lvl) || lvl < 0) lvl = 0;
      if (lvl > 2) lvl = 2;
      var node = { header: header, url: url, description: it.description || '', child: [] };
      if (lvl === 0 || stack.length < lvl) {
        roots.push(node);
        stack = [node];
      } else {
        stack[lvl - 1].child.push(node);
        stack = stack.slice(0, lvl).concat([node]);
      }
    });
    return roots;
  }
  function renderHeader(block) {
    block = withDefaults(block);
    var d = global.PC_HEADER_DATA || {};
    var menuSrc = (p(block, 'source', 'template_var') !== 'template_var' && (block.items || []).length)
      ? menuFromFlat(block.items)
      : d.top_menu;
    var layout = p(block, 'layout', 'classic');
    var em = envelopeModifiers(block);
    var cls = 'header' + (layout && layout !== 'classic' ? ' header--' + layout : '') + (em ? ' ' + em : '');

    var top = '';
    if (bool(block, 'topbar')) {
      var left = '';
      if (bool(block, 'phone')) {
        left += '<li class="topbar__item"><svg class="icon" aria-hidden="true"><use href="#i-phone-w"></use></svg>' +
          '<a href="tel:' + esc(d.phone_raw || '') + '">' + esc(d.phone || '') + '</a></li>';
      }
      if (bool(block, 'email')) {
        left += '<li class="topbar__item"><svg class="icon" aria-hidden="true"><use href="#i-mail-w"></use></svg>' +
          '<a href="mailto:' + esc(d.email || '') + '">' + esc(d.email || '') + '</a></li>';
      }
      if (bool(block, 'workTime')) {
        left += '<li class="topbar__item"><svg class="icon" aria-hidden="true"><use href="#i-clock-w"></use></svg>' + esc(d.work_time || '') + '</li>';
      }
      var right = d.notice ? '<li class="topbar__item">' + esc(d.notice) + '</li>' : '';
      top = '<div class="topbar"><div class="container topbar__inner"><ul class="topbar__list">' + left +
        '</ul><ul class="topbar__list">' + right + '</ul></div></div>';
    }

    var logo = '<a class="logo" href="/">' + logoImg(d.logo, d.orgname) + '</a>';
    var nav = bool(block, 'nav')
      ? '<nav class="header__nav" aria-label="Основная навигация">' + renderMenu(menuSrc, 0, false) + '</nav>'
      : '';
    // Строка поиска с автокомплитом (.hsearch) — flex-элемент внутри
    // .header__main, как в prod-шапке block/header.html: вид шапки
    // (header--<layout>) решает, будет это отдельная строка или строка
    // логотипа. На мобильном — всегда отдельная строка.
    var search = bool(block, 'search')
      ? '<div class="header__search"><div class="hsearch" data-header-search' +
        ' data-endpoint="/ajax/search/good/" data-placeholder="Поиск по каталогу"></div></div>'
      : '';
    var main = '<div class="header__main container">' + logo + nav +
      '<div class="header__actions">' + headerWidgets(block) + '</div>' + search + '</div>';
    var mobile = bool(block, 'nav')
      ? '<nav class="header__mobile container is-hidden" id="mobileMenu" aria-label="Мобильное меню">' + renderMenu(menuSrc, 0, true) + '</nav>'
      : '';
    return '<header class="' + cls + '" id="siteHeader">' + top + main + mobile + '</header>';
  }

  var FOOTER_NOTE = 'Обращаем ваше внимание на то, что данный интернет-сайт носит исключительно ' +
    'информационный характер и ни при каких условиях не является публичной офертой, определяемой ' +
    'положениями Статьи 437 (п.2) Гражданского кодекса РФ.';
  function footerMenu(items) {
    return (items || []).map(function (m) {
      if (m.child && m.child.length) {
        return '<div class="footer__col"><h4 class="footer__title">' + esc(m.header) + '</h4>' +
          '<ul class="footer__links">' + m.child.map(function (c) {
            return '<li><a href="' + esc(c.url) + '"' + (c.active ? ' class="is-active"' : '') + '>' + esc(c.header) + '</a></li>';
          }).join('') + '</ul></div>';
      }
      return '<div class="footer__col"><ul class="footer__links">' +
        '<li><a href="' + esc(m.url) + '"' + (m.active ? ' class="is-active"' : '') + '>' + esc(m.header) + '</a></li></ul></div>';
    }).join('');
  }
  function renderFooter(block) {
    block = withDefaults(block);
    var d = global.PC_FOOTER_DATA || {};
    var socials = bool(block, 'socials')
      ? '<div class="socials">' + (d.socials || []).map(function (s) {
          return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(s.label) + '">' +
            '<svg class="icon" aria-hidden="true"><use href="#' + esc(s.id) + '"></use></svg></a>';
        }).join('') + '</div>'
      : '';

    var brand = '<div class="footer__col">' +
      '<div class="footer__brand"><img src="' + esc(d.logo || '') + '" width="106" height="26" alt="' + esc(d.orgname || '') + '"></div>' +
      '<p class="footer__desc">' + esc(d.desc || '') + '</p></div>';

    var contacts = bool(block, 'contacts')
      ? '<div class="footer__col"><h4 class="footer__title">Контакты</h4>' +
        '<ul class="footer__contacts">' +
        '<li><svg class="icon icon-pin-w" aria-hidden="true"><use href="#i-pin-w"></use></svg>' + esc(d.address || '') + '</li>' +
        '<li><svg class="icon icon-phone-w" aria-hidden="true"><use href="#i-phone-w"></use></svg>' +
          '<a href="tel:' + esc(d.phone_raw || '') + '">' + esc(d.phone || '') + '</a></li>' +
        '<li><svg class="icon icon-mail-w" aria-hidden="true"><use href="#i-mail-w"></use></svg>' +
          '<a href="mailto:' + esc(d.email || '') + '">' + esc(d.email || '') + '</a></li>' +
        '<li><svg class="icon icon-clock-w" aria-hidden="true"><use href="#i-clock-w"></use></svg>' + esc(d.work_time || '') + '</li>' +
        '</ul>' + socials + '</div>'
      : '';

    // Колонки ссылок из конструктора (block.items: {group, header, url})
    var groupsMap = {}, groupsOrder = [];
    items(block).forEach(function (it) {
      var g = it.group || 'Меню';
      if (!groupsMap[g]) { groupsMap[g] = []; groupsOrder.push(g); }
      groupsMap[g].push(it);
    });
    var linksCols = groupsOrder.map(function (g) {
      return el('div', { class: 'footer__col' },
        el('h4', { class: 'footer__title' }, esc(g)) +
        el('ul', { class: 'footer__links' },
          groupsMap[g].map(function (it) {
            return el('li', null, link(it.url || '#', null, esc(it.header || '')));
          }).join('')));
    }).join('');

    var grid = '<div class="footer__grid">' + brand + linksCols + footerMenu(d.bottom_menu) + contacts + '</div>';

    var catalog = bool(block, 'catalog')
      ? '<div class="footer__catalog"><h4 class="footer__title">Каталог</h4><ul class="footer__catalog-list">' +
        (d.catalog_menu || []).map(function (c) {
          return '<li><a href="' + esc(c.url) + '"' + (c.active ? ' class="is-active"' : '') + '>' + esc(c.header) + '</a></li>';
        }).join('') + '</ul></div>'
      : '';

    var note = bool(block, 'note')
      ? '<div class="footer__note"><svg class="icon icon-info" aria-hidden="true"><use href="#i-info"></use></svg>' +
        '<p>' + esc(FOOTER_NOTE) + '</p></div>'
      : '';

    var bottom = '<div class="footer__bottom">' +
      '<span>' + esc(p(block, 'copyright', d.copyright || '')) + '</span>' +
      '<span><a href="/securitypolicy">Политика конфиденциальности</a> · <a href="/soglasie">Согласие на обработку ПД</a></span>' +
      '</div>';

    var fem = envelopeModifiers(block);
    return '<footer class="footer' + (fem ? ' ' + fem : '') + '"><div class="container">' +
      grid + catalog + note + bottom + '</div></footer>';
  }

  // -------- текст --------
  function renderText(block) {
    var v = block.variant || 'prose';
    var it = items(block);
    var header = esc(p(block, 'title', p(block, 'header', 'Заголовок')));
    /* H1 рисует page_head (renderBlock) — в превью свой h2 не дублируем,
       как в проде (text_block.html: {% if title and not p.page_head %}). */
    var ph = defBool(block, 'page_head', false);
    switch (v) {
      case 'split':
        return el('div', { class: 'tb-split' + (p(block, 'rev', false) === true ? ' tb-split--rev' : '') },
          el('div', { class: 'tb-split__media' }, img(p(block, 'photo', 'images/hero-1.svg'), p(block, 'title', ''))) +
          el('div', { class: 'tb-split__body' },
            el('div', { class: 'tb-eyebrow' }, esc(p(block, 'eyebrow'))) +
            el('h2', null, header) + el('p', { class: 'tb-lead' }, esc(p(block, 'lead'))) +
            el('p', null, esc(p(block, 'p1'))) +
            (p(block, 'btnText') ? link(p(block, 'btnUrl'), 'btn', esc(p(block, 'btnText'))) : '')));
      case 'feature':
        return el('div', { class: 'tb-feature', style: '--tb-cols:' + esc(p(block, 'cols', 3)) },
          it.map(function (i, n) {
            var icon = p(block, 'iconMode', 'svg') === 'emoji'
              ? el('span', { class: 'tb-feature__icon' }, esc(i.emoji || '\u2705'))
              : el('span', { class: 'tb-feature__icon' }, el('svg', { class: 'icon', 'aria-hidden': 'true' }, el('use', { href: '#' + (i.icon || 'i-check') })));
            return el('div', { class: 'tb-feature__item' }, icon +
              el('div', { class: 'tb-feature__title' }, esc(i.title)) +
              el('div', { class: 'tb-feature__text' }, esc(i.text)));
          }).join(''));
      case 'stats':
        return el('div', { class: 'tb-stats', style: '--tb-cols:' + esc(p(block, 'count', 4)) },
          it.map(function (i) {
            return el('div', { class: 'tb-stats__item' }, el('div', { class: 'tb-stats__num' }, esc(i.num)) +
              el('div', { class: 'tb-stats__label' }, esc(i.label)));
          }).join(''));
      case 'quote':
        return el('blockquote', { class: 'tb-quote' }, el('div', { class: 'tb-quote__text' }, esc(p(block, 'text'))) +
          el('div', { class: 'tb-quote__name' }, esc(p(block, 'name'))) +
          el('div', { class: 'tb-quote__role' }, esc(p(block, 'role'))));
      case 'steps':
        return el('ol', { class: 'tb-steps' }, it.map(function (i, n) {
          return el('li', { class: 'tb-steps__item' }, el('span', { class: 'tb-steps__num' }, String(n + 1)) +
            el('div', { class: 'tb-steps__title' }, esc(i.title)) +
            el('div', { class: 'tb-steps__text' }, esc(i.text)));
        }).join(''));
      case 'cta':
        return el('div', { class: 'tb-cta' }, el('div', { class: 'tb-eyebrow' }, esc(p(block, 'eyebrow'))) +
          el('h2', { class: 'tb-cta__title' }, esc(p(block, 'title'))) +
          el('p', { class: 'tb-cta__text' }, esc(p(block, 'text'))) +
          (p(block, 'btnText') ? link(p(block, 'btnUrl'), 'btn', esc(p(block, 'btnText'))) : ''));
      case 'faq':
        return el('div', { class: 'tb-faq' }, it.map(function (i, n) {
          return el('details', { class: 'tb-faq__item', open: n === 0 ? true : null },
            el('summary', { class: 'tb-faq__question' }, esc(i.q)) +
            el('div', { class: 'tb-faq__answer' }, esc(i.a)));
        }).join(''));
      case 'cards':
        return el('div', { class: 'tb-cards', style: '--tb-cols:' + esc(p(block, 'cols', 3)) }, it.map(function (i) {
          return el('article', { class: 'tb-card' }, el('h3', { class: 'tb-card__title' }, esc(i.title)) +
            el('p', { class: 'tb-card__text' }, esc(i.text)) +
            (p(block, 'linkText') ? link('#', 'tb-card__link', esc(p(block, 'linkText'))) : ''));
        }).join(''));
      case 'article':
        return el('article', { class: 'tb-article' }, el('h2', null, header) + it.map(function (s) {
          return el('section', { class: 'tb-article__section', id: s.id || null }, el('h3', null, esc(s.title)) +
            el('p', null, esc(s.text)));
        }).join(''));
      case 'logos':
        return el('div', { class: 'tb-logos' }, it.map(function (i) { return el('span', { class: 'tb-logo' }, esc(i.name)); }).join(''));
      case 'chart':
        return el('div', { class: 'tb-chart' }, it.map(function (i) {
          return el('div', { class: 'tb-chart__item' }, el('div', { class: 'tb-chart__title' }, esc(i.title)) +
            el('div', { class: 'tb-chart__chart' }, el('canvas', { 'data-chart': i.kind || 'bar' })) +
            el('div', { class: 'tb-chart__legend' }, ''));
        }).join(''));
      case 'prose':
      default:
        return el('div', { class: 'tb-prose' },
          el('div', { class: 'tb-eyebrow' }, esc(p(block, 'eyebrow'))) +
          (ph ? '' : el('h2', null, header)) +
          (bool(block, 'leadOn') || p(block, 'lead') ? el('p', { class: 'tb-lead' }, esc(p(block, 'lead'))) : '') +
          el('p', null, esc(p(block, 'p1'))) +
          (p(block, 'btnText') ? link('#', 'btn', esc(p(block, 'btnText'))) : ''));
    }
  }

  // -------- компонентные --------
  function renderSlider(block) {
    // Слайды — из items блока (per-block), инлайн data-list; фото block-images/… через filesBase.
    var slides = (block.items || []).map(function (it) {
      return {
        header: it.header || '',
        body: it.body || it.text || '',
        url: it.url || '',
        button: it.button || '',
        photo: mediaUrl(it.photo || '')
      };
    });
    var boolAttr = function (name) {
      var v = p(block, name);
      return (v === false || v === 'false') ? 'false' : 'true';
    };
    return el('hero-slider', {
      'data-list': JSON.stringify(slides),
      autoplay: p(block, 'autoplay', '5000'),
      duration: p(block, 'duration', 0),
      animation: p(block, 'animation', 'rise'),
      transition: p(block, 'transition', 'slide'),
      arrows: boolAttr('arrows'),
      dots: boolAttr('dots'),
      loop: boolAttr('loop'),
      start: p(block, 'start', 0),
      height: p(block, 'height', 0),
      speed: p(block, 'speed', 0)
    });
  }
  function renderCatalog(block) {
    return el('catalog-block', {
      id: 'catalog', 'data-data-key': 'catalog',
      cols: p(block, 'columns', '3'), effect: p(block, 'effect', 'flip'), enter: p(block, 'enter', 'rise'),
      title: p(block, 'header'), sub: p(block, 'sub')
    });
  }
  function goodsAttrs(block) {
    var a = {
      'data-show': p(block, 'show', block.variant || 'grid'),
      'data-cols': p(block, 'cols', ''),
      'data-animation': p(block, 'animation', ''),
      'data-types': p(block, 'types', ''),
      'data-selection': p(block, 'selection', ''),
      'data-limit': p(block, 'limit', ''),
      'data-title': p(block, 'title', ''),
      'data-sub': p(block, 'sub', ''),
      'data-link-text': p(block, 'linkText', ''),
      'data-link-href': p(block, 'linkHref', '')
    };
    if (Number(p(block, 'autoplay', 0)) > 0) a.autoplay = p(block, 'autoplay');
    if (block.params && block.params.arrows === false) a['data-arrows'] = 'false';
    return a;
  }
  function renderGoods(block) {
    var a = goodsAttrs(block);
    var key = p(block, 'dataKey', 'goods');
    a.id = p(block, 'blockId', key === 'goods' ? 'good_list' : key);
    a['data-data-key'] = key;
    a.class = 'block-reserve';
    return el('goods-block', a, el('div', { class: 'block-skeleton', 'aria-hidden': 'true' }));
  }
  // -------- Каталог товаров (product_list) --------
  // Единый листинг: сайдбар рубрик (sidebar: none|left|right) + тулбар
  // (search/priceFilter/sort/chips) + сетка товаров + пагинация. Разметка и
  // классы совпадают с block/product_list.html; движок монтирует #good_list
  // по <template id="good_list_tpl"> (js/good_list.js, js/perpage.js).
  function glSidebar() {
    return '<aside class="catalog-sidebar" aria-label="Разделы каталога">' +
      '<h2 class="catalog-sidebar__title">Разделы каталога</h2>' +
      '<nav class="catalog-sidebar__nav" aria-label="Разделы каталога">' +
      '<ul class="catalog-sidebar__list">' +
      '<li class="catalog-sidebar__item">' +
      "<button type=\"button\" class=\"catalog-sidebar__link\" :class=\"{ 'is-active': rubricActive('all') }\" @click=\"setRubric('all')\">" +
      'Все товары <span class="catalog-sidebar__count">{{ goods.length }}</span></button></li>' +
      '<li class="catalog-sidebar__item" v-for="r in rubrics" :key="r.id">' +
      "<button type=\"button\" class=\"catalog-sidebar__link\" :class=\"{ 'is-active': rubricActive(r.id) }\" @click=\"setRubric(r.id)\">" +
      '{{ r.header }} <span class="catalog-sidebar__count">{{ rubricCount(r.id) }}</span></button>' +
      '<ul v-if="r.child && r.child.length" class="catalog-sidebar__sublist">' +
      '<li class="catalog-sidebar__subitem" v-for="c in r.child" :key="c.id">' +
      "<button type=\"button\" class=\"catalog-sidebar__sublink\" :class=\"{ 'is-active': rubricActive(c.id) }\" @click=\"setRubric(c.id)\">" +
      '{{ c.header }} <span class="catalog-sidebar__count">{{ rubricCount(c.id) }}</span></button>' +
      '</li></ul></li></ul></nav></aside>';
  }
  function glToolbar(block) {
    var t = '';
    if (defBool(block, 'search', true)) {
      t += '<div class="gl-control gl-search">' +
        '<label class="gl-control__label" for="gl-q">Поиск по названию</label>' +
        '<input class="form-control" id="gl-q" v-model="q" type="search" placeholder="Например, X1 Pro" autocomplete="off"></div>';
    }
    if (defBool(block, 'priceFilter', true)) {
      t += '<div class="gl-control gl-price"><span class="gl-control__label">Цена, ₽</span><div class="gl-price__row">' +
        '<input class="form-control" v-model="priceMin" type="number" inputmode="numeric" min="0" placeholder="от" aria-label="Минимальная цена">' +
        '<span class="gl-price__sep">—</span>' +
        '<input class="form-control" v-model="priceMax" type="number" inputmode="numeric" min="0" placeholder="до" aria-label="Максимальная цена"></div></div>';
    }
    if (defBool(block, 'sort', true)) {
      t += '<div class="gl-control gl-sort"><label class="gl-control__label" for="gl-sort">Сортировка</label>' +
        '<select class="form-select" id="gl-sort" v-model="sort">' +
        '<option value="views">По популярности</option>' +
        '<option value="price_asc">Сначала дешевле</option>' +
        '<option value="price_desc">Сначала дороже</option>' +
        '<option value="published">Сначала новинки</option></select></div>';
    }
    if (defBool(block, 'chips', true)) {
      t += '<div class="gl-control gl-chips" v-if="categories.length"><span class="gl-control__label">Подкатегории</span><div class="gl-chips__row">' +
        "<button class=\"gl-chips__chip\" :class=\"{ 'is-active': category === 'all' }\" type=\"button\" @click=\"category = 'all'\">" +
        'Все <span class="gl-chips__count">{{ goods.length }}</span></button>' +
        "<button v-for=\"c in categories\" :key=\"c\" class=\"gl-chips__chip\" :class=\"{ 'is-active': category === c }\" type=\"button\" @click=\"category = c\">" +
        '{{ categoryLabel(c) }} <span class="gl-chips__count">{{ categoryCount(c) }}</span></button>' +
        '</div></div>';
    }
    t += '<button class="gl-reset" type="button" @click="reset" title="Сбросить все фильтры">Сбросить</button>' +
      '<span class="gl-count">Найдено: <b>{{ foundText }}</b></span>';
    return '<div class="good-list__toolbar">' + t + '</div>';
  }
  function glCardTemplate(emptyHtml) {
    var s = [];
    emptyHtml = emptyHtml || '<p class="m-0">По выбранным параметрам товаров не найдено.</p><button class="btn btn-primary btn-sm gl-empty__btn" type="button" @click="reset">Сбросить фильтры</button>';
    s.push('<template v-else>');
    s.push('<div class="products-grid" v-if="paged.length">');
    s.push('<article class="product-card" v-for="g in paged" :key="g.id">');
    s.push('<div class="product-card__media" v-photo-gallery="g">');
    s.push("<a class=\"product-card__media-link\" :href=\"g.url || '/product/' + g.id\">");
    s.push('<img class="product-card__img" :src="curPhoto(g)" :alt="g.header" width="400" height="400" loading="lazy"></a>');
    s.push('<div class="product-card__badges">');
    s.push('<span v-if="g.new" class="product-card__badge product-card__badge--new">Новинка</span>');
    s.push('<span v-if="g.hit" class="product-card__badge product-card__badge--hit">Хит</span>');
    s.push('<span v-if="g.spec" class="product-card__badge product-card__badge--spec">Спецпредложение</span>');
    s.push('</div>');
    s.push('<div v-if="photoCount(g) > 1" class="product-card__dots">');
    s.push("<button v-for=\"i in photoCount(g)\" :key=\"i\" class=\"product-card__dot\" :class=\"{ 'is-active': i === photoIndex(g) + 1 }\" type=\"button\" @click.prevent.stop=\"setPhoto(g, i - 1)\"></button>");
    s.push('</div></div>');
    s.push('<div class="product-card__actions">');
    s.push("<button class=\"action-btn\" :class=\"{ 'is-active': favState(g) }\" type=\"button\" :aria-label=\"favState(g) ? 'В избранном' : 'Добавить в избранное'\" @click=\"fav(g)\">");
    s.push('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg></button>');
    s.push("<button class=\"action-btn\" :class=\"{ 'is-active': cmpState(g) }\" type=\"button\" :aria-label=\"cmpState(g) ? 'Убрать из сравнения' : 'Добавить к сравнению'\" @click=\"cmp(g)\">");
    s.push('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 5h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 5v14M15 5v14"/></svg></button>');
    s.push('</div>');
    s.push('<div class="product-card__body">');
    s.push("<h2 class=\"product-card__title\"><a :href=\"g.url || '/product/' + g.id\">{{ g.header }}</a></h2>");
    s.push('<p class="product-card__anons">{{ g.anons }}</p>');
    s.push('<div class="product-card__price-row"><span class="product-card__price">{{ priceFmt(g.price) }}</span>');
    s.push('<span v-if="g.old_price" class="product-card__price-old">{{ priceFmt(g.old_price) }}</span></div>');
    s.push("<button v-if=\"cartCount(g) === 0\" class=\"btn btn-primary btn-sm product-card__buy\" type=\"button\" @click=\"add(g)\"><span>В корзину</span></button>");
    s.push("<a v-else class=\"btn btn-primary btn-sm product-card__buy is-in-cart\" href=\"/basket\"><span>В корзине ({{ cartCount(g) }})</span></a>");
    s.push('</div></article>');
    s.push('</div>');
    s.push('<div class="gl-empty" v-else>' + emptyHtml + '</div>');
    s.push('<perpage v-if="pages > 1" :page="page" :pages="pages" @go="goPage"></perpage>');
    s.push('</template>');
    return s.join('');
  }
  function renderProductList(block) {
    var perpage = p(block, 'perpage', 12);
    var side = p(block, 'sidebar', 'left');
    if (side !== 'left' && side !== 'right') side = 'none';
    var layoutCls = 'catalog-layout' + (side === 'right' ? ' catalog-layout--sidebar-right' : '');
    var listing = '<div class="good-list">' + glToolbar(block) +
      '<p v-if="loading" class="goods-status">Загружаем товары…</p>' +
      '<p v-else-if="error" class="goods-status goods-status--error">Не удалось загрузить товары.</p>' +
      glCardTemplate() + '</div>';
    var layout = '<div class="' + layoutCls + '">' +
      (side !== 'none' ? glSidebar() : '') +
      '<div class="catalog-main">' + listing + '</div></div>';
    return '<div id="good_list" data-data-key="good_list" data-catalog-id="1" data-perpage="' + esc(perpage) + '">' +
      '<template id="good_list_tpl">' + layout + '</template></div>';
  }
  // -------- Блок страницы «Избранное» (page_favorites) --------
  function renderPageFavorites(block) {
    var perpage = p(block, 'perpage', 12);
    var empty = '<p class="m-0">В избранном пока ничего нет. Отмечайте товары значком ♡ в каталоге.</p>';
    var listing = '<div class="good-list">' + glToolbar(block) +
      '<p v-if="loading" class="goods-status">Загружаем товары…</p>' +
      '<p v-else-if="error" class="goods-status goods-status--error">Не удалось загрузить товары.</p>' +
      glCardTemplate(empty) + '</div>';
    return '<div id="good_list" data-data-key="good_list" data-perpage="' + esc(perpage) + '" data-favorites="1">' +
      '<template id="good_list_tpl">' + listing + '</template></div>';
  }
  // -------- Блок страницы «Поиск» (page_search) --------
  // Разметка повторяет prod-блок block/page_search.html: строка поиска
  // .hsearch (js/components/header-search.js) + блоки по сущностям
  // .search-block. Здесь она статичная: фразы запроса в конструкторе нет,
  // поэтому у каждого блока — заглушка и ссылка «Все результаты».
  var SEARCH_ENTITIES = [
    { key: 'good', name: 'Товары' },
    { key: 'news', name: 'Новости' },
    { key: 'articles', name: 'Статьи' }
  ];
  function searchBlockHtml(entity) {
    return '<section class="search-section search-block" data-entity="' + esc(entity.key) + '">' +
      '<div class="search-section__head">' +
        '<h2 class="search-section__title">' + esc(entity.name) + '</h2>' +
        '<a class="search-more" href="/search/' + esc(entity.key) + '/">Все результаты</a>' +
      '</div>' +
      '<div class="search-hits search-hits--compact">' +
        '<p class="search-empty">Ничего не найдено</p>' +
      '</div>' +
    '</section>';
  }
  function renderPageSearch(block) {
    var query = p(block, 'query', '');
    var bar = '<div class="search-page__bar"><div class="hsearch" data-header-search' +
      ' data-endpoint="/ajax/search/good/"' +
      (query ? ' data-value="' + esc(query) + '"' : '') +
      ' data-placeholder="Поиск по каталогу"></div></div>';

    var body = defBool(block, 'showNews', true) && defBool(block, 'showArticles', true)
      ? SEARCH_ENTITIES.map(searchBlockHtml).join('')
      : searchBlockHtml(SEARCH_ENTITIES[0]);
    return bar + body;
  }
  // -------- Блок страницы «404» (page_404) --------
  function renderPage404(block) {
    return '<div class="nf">' +
      '<div class="nf__media"><img class="nf__img" src="' + esc(p(block, 'image', 'images/404/404.webp')) + '" alt="' + esc(p(block, 'title', 'Страница не найдена')) + '" width="1600" height="1067" decoding="async" onerror="this.style.opacity=0"></div>' +
      '<div class="nf__body">' +
        '<p class="nf__code">' + esc(p(block, 'code', '404')) + '</p>' +
        '<h1 class="nf__title">' + esc(p(block, 'title', 'Страница уехала на подзарядку')) + '</h1>' +
        '<p class="nf__text">' + esc(p(block, 'text', 'Похоже, страница не найдена. Вернитесь на главную, загляните в каталог или воспользуйтесь поиском.')) + '</p>' +
        '<form class="nf__search" action="/search/" method="get" role="search">' +
          '<label class="visually-hidden" for="nf-q">Поиск по сайту</label>' +
          '<input class="form-control" id="nf-q" type="search" name="q" placeholder="Что искать?">' +
          '<button class="btn btn-primary" type="submit">Найти</button>' +
        '</form>' +
        '<div class="nf__actions">' +
          '<a class="btn btn-primary" href="/">На главную</a>' +
          '<a class="btn btn-outline" href="/catalog/">В каталог</a>' +
        '</div>' +
      '</div></div>';
  }
  // -------- Блок страницы «Сравнение» (page_compare) --------
  function renderPageCompare(block) {
    var s = [];
    s.push('<div class="compare">');
    s.push('<p v-if="loading" class="goods-status">Загружаем товары…</p>');
    s.push('<p v-else-if="error" class="goods-status goods-status--error">Не удалось загрузить товары.</p>');
    s.push('<template v-else>');
    s.push('<div v-if="hasItems">');
    s.push('<div class="compare__toolbar"><span class="gl-count">В сравнении: <b>{{ selected.length }}</b></span>');
    s.push('<button class="gl-reset" type="button" @click="clear">Очистить</button></div>');
    s.push('<div class="compare__scroll"><table class="compare__table"><thead><tr>');
    s.push('<th class="compare__th compare__row-name">Характеристика</th>');
    s.push('<th class="compare__th compare__th--product" v-for="g in selected" :key="g.id">');
    s.push('<div class="compare__product"><a class="compare__media" :href="g.url || \'/product/\' + g.id"><img :src="photo(g)" :alt="g.header" width="200" height="200" loading="lazy"></a>');
    s.push('<a class="compare__name" :href="g.url || \'/product/\' + g.id">{{ g.header }}</a>');
    s.push('<span class="compare__price">{{ priceFmt(g.price) }}</span>');
    s.push('<div class="compare__acts"><button v-if="cartCount(g) === 0" class="btn btn-primary btn-sm" type="button" @click="add(g)">В корзину</button>');
    s.push('<a v-else class="btn btn-primary btn-sm is-in-cart" href="/basket/">В корзине ({{ cartCount(g) }})</a>');
    s.push('<button class="compare__remove" type="button" @click="remove(g)" :aria-label="\'Убрать \' + g.header + \' из сравнения\'">×</button></div></div></th>');
    s.push('</tr></thead><tbody>');
    s.push('<tr v-for="k in specKeys" :key="k"><th class="compare__row-name">{{ k }}</th><td class="compare__cell" v-for="g in selected" :key="g.id + k">{{ specValue(g, k) }}</td></tr>');
    s.push('<tr><th class="compare__row-name">Цена</th><td class="compare__cell" v-for="g in selected" :key="\'p\' + g.id">{{ priceFmt(g.price) }}</td></tr>');
    s.push('</tbody></table></div></div>');
    s.push('<div class="gl-empty" v-else><p class="m-0">В сравнении пока нет товаров.</p>');
    s.push('<p class="compare-empty__hint">Добавляйте товары кнопкой «сравнить» на карточках в каталоге.</p>');
    s.push('<a class="btn btn-primary btn-sm gl-empty__btn" href="/catalog/">Перейти в каталог</a></div>');
    s.push('<div v-if="!hasItems && suggestions.length" class="compare-suggest"><h2 class="compare-suggest__title">Популярные товары</h2><div class="products-grid">');
    s.push('<article class="product-card" v-for="g in suggestions" :key="g.id"><div class="product-card__media"><a class="product-card__media-link" :href="g.url || \'/product/\' + g.id"><img class="product-card__img" :src="photo(g)" :alt="g.header" width="400" height="400" loading="lazy"></a></div>');
    s.push('<div class="product-card__body"><h2 class="product-card__title"><a :href="g.url || \'/product/\' + g.id">{{ g.header }}</a></h2><p class="product-card__anons">{{ g.anons }}</p>');
    s.push('<div class="product-card__price-row"><span class="product-card__price">{{ priceFmt(g.price) }}</span></div></div></article>');
    s.push('</div></div>');
    s.push('</template></div>');
    var demo = JSON.stringify([
      { id: 1, header: 'Смартфон X1 Pro', price: 49990, url: '/product/1', photo: 'images/good/good_1_1.webp', spec: [['Бренд', 'TechnoLine'], ['Гарантия', '12 мес.']] },
      { id: 2, header: 'Ноутбук Notebook 14', price: 64990, url: '/product/2', photo: 'images/good/good_2_1.webp', spec: [['Бренд', 'TechnoLine'], ['Гарантия', '24 мес.']] }
    ]).replace(/<\//g, '<\\/');
    return '<div id="compare"><template id="compare_tpl">' + s.join('') + '</template></div>' +
      '<script type="application/json" id="compare_data">' + demo + '</script>';
  }
  // -------- Блок страницы «Корзина» (page_basket) --------
  function renderPageBasket(block) {
    var s = [];
    s.push('<div class="basket">');
    s.push('<div v-if="!b.inited" class="basket-loading">Загрузка содержимого корзины…</div>');
    s.push('<div v-else-if="empty" class="basket-empty"><svg class="icon icon-cart" aria-hidden="true"><use href="#i-cart"></use></svg>');
    s.push('<h2 class="basket-empty__title">Ваша корзина пуста</h2>');
    s.push('<p class="basket-empty__text">Загляните в каталог — найдётся всё нужное.</p>');
    s.push('<a class="btn btn-primary" href="/catalog/">Перейти в каталог</a></div>');
    s.push('<div v-else class="basket-layout"><section class="basket-items" aria-label="Товары в корзине">');
    s.push('<div class="basket-items__head"><span>Товар</span><span>Количество</span><span>Сумма</span><span></span></div>');
    s.push('<article class="basket-item" v-for="g in b.list" :key="g.id"><div class="basket-item__main">');
    s.push('<a class="basket-item__media" :href="itemUrl(g)"><img :src="g.photo" :alt="g.header" loading="lazy" decoding="async"></a>');
    s.push('<div class="basket-item__info"><a class="basket-item__name" :href="itemUrl(g)">{{ g.header }}</a>');
    s.push('<div class="basket-item__price"><span class="price">{{ priceFmt(g.price) }}</span>');
    s.push('<s v-if="g.old_price && g.old_price > g.price" class="price-old">{{ priceFmt(g.old_price) }}</s></div></div></div>');
    s.push('<div class="basket-item__qty"><div class="qty-step"><button type="button" aria-label="Уменьшить количество" @click="dec(g)">−</button>');
    s.push('<span class="qty-step__val">{{ g.cnt }}</span><button type="button" aria-label="Увеличить количество" @click="inc(g)">+</button></div></div>');
    s.push('<div class="basket-item__sum">{{ priceFmt(g.price * g.cnt) }}</div>');
    s.push('<div class="basket-item__remove"><button type="button" class="icon-btn" aria-label="Удалить товар" @click="remove(g)"><svg class="icon icon-trash" aria-hidden="true"><use href="#i-trash"></use></svg></button></div></article>');
    s.push('<div class="basket-items__foot"><a class="btn btn-outline" href="/catalog/"><svg class="icon icon-chevron-left" aria-hidden="true"><use href="#i-chevron-left"></use></svg> Продолжить покупки</a>');
    s.push('<button type="button" class="basket-items__clear" @click="clearAll">Очистить корзину</button></div></section>');
    s.push('<aside class="basket-summary" aria-label="Итоги заказа"><div class="basket-summary__card"><h2 class="basket-summary__title">Ваш заказ</h2>');
    s.push('<ul class="basket-summary__lines"><li class="line"><span>Позиций</span><span>{{ b.list.length }}</span></li>');
    s.push('<li class="line"><span>Товаров</span><span>{{ b.total_count }} шт.</span></li>');
    s.push('<li class="line"><span>Товары по цене</span><span>{{ priceFmt(b.total_price) }}</span></li>');
    s.push('<li class="line line--discount" v-if="discount > 0"><span>Скидка</span><span>−{{ priceFmt(discount) }}</span></li></ul>');
    s.push('<div class="basket-summary__total"><span>Итого</span><span>{{ priceFmt(b.total_price_with_sale) }}</span></div>');
    s.push('<p class="basket-summary__note"><svg class="icon icon-delivery" aria-hidden="true"><use href="#i-delivery"></use></svg> Бесплатная доставка при заказе от 5 000 ₽</p>');
    s.push('<a class="btn btn-primary basket-summary__cta" href="#basketOrder">Оформить заказ</a></div></aside></div></div>');
    return '<div id="basket_page_wrap">' + s.join('') + '</div>' + basketOrderForm();
  }
  function basketOrderForm() {
    return '<section class="basket-order" id="basketOrder" aria-label="Оформление заказа">' +
      '<div class="section-head section-head--no-flex"><div><h2 class="section-title">Оформление заказа</h2>' +
      '<p class="section-sub">Заполните обязательные поля — менеджер перезвонит и подтвердит заказ.</p></div></div>' +
      '<form id="basketOrderForm" class="basket-order__form" novalidate><div class="basket-order__grid">' +
      '<div><label for="order-name">ФИО *</label><input class="form-control" id="order-name" name="name" type="text" required placeholder="Иванов Иван Иванович" autocomplete="name"></div>' +
      '<div><label for="order-phone">Телефон *</label><input class="form-control" id="order-phone" name="phone" type="tel" required placeholder="+7 (999) 000-00-00" autocomplete="tel"></div>' +
      '<div><label for="order-email">Email</label><input class="form-control" id="order-email" name="email" type="email" placeholder="you@example.ru" autocomplete="email"></div>' +
      '<div><label for="order-company">Компания</label><input class="form-control" id="order-company" name="company" type="text" placeholder="ООО «Ромашка»" autocomplete="organization"></div>' +
      '<div><label for="order-delivery">Способ доставки</label><select class="form-control" id="order-delivery" name="delivery">' +
      '<option value="pickup">Самовывоз</option><option value="courier">Курьер по Москве</option><option value="company">Транспортная компания</option></select></div>' +
      '<div><label for="order-address">Адрес доставки *</label><input class="form-control" id="order-address" name="address" type="text" required placeholder="Город, улица, дом, квартира"></div>' +
      '<div class="basket-order__grid-full"><label for="order-comment">Комментарий</label><textarea class="form-control" id="order-comment" name="comment" rows="3" placeholder="Пожелания к заказу"></textarea></div>' +
      '</div>' +
      '<div class="basket-order__agree"><label class="check"><input type="checkbox" name="accept" required><span>Я согласен(на) на обработку персональных данных</span></label></div>' +
      '<p class="basket-order__error" hidden></p>' +
      '<button class="btn btn-primary basket-order__submit" type="submit">Оформить заказ</button></form></section>';
  }
  // -------- Блок страницы «Новость» (page_news_detail) --------
  function renderPageNewsDetail(block) {
    var title = p(block, 'title', 'Открытие нового шоурума');
    var date = p(block, 'date', '29 сентября 2026');
    var photo = p(block, 'photo', 'images/preview/news/news-1.webp');
    var body = items(block).map(function (x) { return x.text || x.anons || ''; }).filter(Boolean);
    if (!body.length) body = ['Текст новости: что произошло и почему это важно.', 'Второй абзац с деталями и планами.'];
    return '<div id="newsIn" class="news-in-wrap">' +
      '<article class="news-in" itemscope itemtype="https://schema.org/NewsArticle">' +
        '<h1 class="news-in__title" id="newsInTitle" itemprop="headline">' + esc(title) + '</h1>' +
        '<figure class="news-in__media"><img id="newsInMedia" src="' + esc(photo) + '" alt="' + esc(title) + '" width="800" height="457">' +
        '<span class="news-in__date"><svg class="icon icon-clock" aria-hidden="true"><use href="#i-clock"></use></svg><time id="newsInDate">' + esc(date) + '</time></span></figure>' +
        '<div class="news-in__body" id="newsInBody" itemprop="articleBody">' + body.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
      '</article>' +
      '<nav class="news-in__nav" aria-label="Навигация по новостям">' +
        '<button class="news-nav__btn" type="button" aria-label="Предыдущая новость"><svg class="icon icon-chevron-left" aria-hidden="true"><use href="#i-chevron-left"></use></svg> Предыдущая</button>' +
        '<a class="news-in__all" href="/news/">К списку новостей</a>' +
        '<button class="news-nav__btn" type="button" aria-label="Следующая новость" disabled>Следующая <svg class="icon" aria-hidden="true"><use href="#i-chevron-right"></use></svg></button>' +
      '</nav></div>';
  }
  // -------- Блок страницы «Статья» (page_article_detail) --------
  // Данные на проде приходят из ds_article (content: header/photo/body).
  // В превью полей-заглушек нет: показываем фиксированный демо-пример,
  // повторяя то, что реально выводит прод (шапка, обложка, абзацы).
  function renderPageArticleDetail(block) {
    var title = 'Как выбрать смартфон в 2026 году';
    var photo = 'images/preview/articles/article-1.webp';
    var body = items(block).map(function (x) { return x.text || x.anons || ''; }).filter(Boolean);
    if (!body.length) body = [
      'Выбор смартфона в 2026 году начинается не с бренда, а с задач. Определите, что для вас важнее: долгая автономность, качество камеры, производительность в играх или компактный корпус. От этого зависит не только модель, но и бюджет, который придётся заложить.',
      'Обратите внимание на экран: диагональ, разрешение и частоту обновления. Панели с частотой 120 Гц делают прокрутку заметно плавнее, а технология LTPO помогает экономить заряд, снижая частоту в статичных сценах. Яркость важна, если вы часто пользуетесь телефоном на улице.',
      'Процессор и объём памяти определяют запас производительности на годы вперёд. Для повседневных задач достаточно 8 ГБ оперативной памяти, но если вы снимаете видео в 4K или играете, стоит смотреть на 12–16 ГБ и накопитель от 256 ГБ без слота расширения.',
      'Камеры — самая маркетинговая часть. Смотрите не на число мегапикселей, а на размер сенсора, наличие оптической стабилизации и качество ночных снимков. Хороший основной модуль важнее, чем четыре вспомогательных, которыми вы почти не будете пользоваться.',
      'И последнее: автономность и зарядка. Батарея от 5000 мА·ч — разумный минимум, а быстрая зарядка на 65–120 Вт позволяет забыть о розетке на день. Проверьте поддержку беспроводной зарядки, если она для вас принципиальна.',
      'Подводя итог: составьте список из трёх обязательных требований и двух желательных, сравните 3–4 модели в этом диапазоне и только потом принимайте решение. Так вы получите телефон, который будет радовать, а не разочаровывать через месяц.'
    ];
    var av = (block.variant === 'magazine' || block.variant === 'split') ? block.variant : 'classic';
    return '<div class="section-head section-head--no-flex"><div>' +
        '<p class="article-eyebrow">Статьи</p>' +
        '<p class="section-sub">Практические материалы: обзоры техники, гайды по выбору, настройке и уходу за гаджетами.</p>' +
      '</div></div>' +
      '<div id="articleIn" class="article-in-wrap">' +
      '<article class="article-in article-in--' + av + '" itemscope itemtype="https://schema.org/Article">' +
        '<h1 class="article-in__title" id="articleInTitle" itemprop="headline">' + esc(title) + '</h1>' +
        '<figure class="article-in__media"><img id="articleInMedia" src="' + esc(photo) + '" alt="' + esc(title) + '" itemprop="image"></figure>' +
        '<div class="article-in__body" id="articleInBody" itemprop="articleBody">' +
          body.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
        '</div>' +
      '</article>' +
      '<nav class="article-in__nav" aria-label="Навигация по статьям">' +
        '<button class="article-nav__btn" type="button" aria-label="Предыдущая статья"><svg class="icon icon-chevron-left" aria-hidden="true"><use href="#i-chevron-left"></use></svg> Предыдущая</button>' +
        '<a class="article-in__all" href="/articles/">К списку статей</a>' +
        '<button class="article-nav__btn" type="button" aria-label="Следующая статья" disabled>Следующая <svg class="icon" aria-hidden="true"><use href="#i-chevron-right"></use></svg></button>' +
      '</nav></div>';
  }
  // -------- Блок страницы «Заказ» (page_order) --------
  function renderPageOrder(block) {
    var number = p(block, 'number', '1024');
    var statusLabel = p(block, 'statusLabel', 'Обрабатывается');
    var statusClass = p(block, 'statusClass', 'processing');
    var date = p(block, 'date', '29 сентября 2026');
    var total = p(block, 'total', '49 990 ₽');
    var address = p(block, 'address', 'Москва, ул. Примерная, 1');
    var rows = items(block).map(function (g) {
      var url = g.url || '#';
      return '<article class="basket-item"><div class="basket-item__main">' +
        '<a class="basket-item__media" href="' + esc(url) + '"><img src="' + esc(g.image) + '" alt="' + esc(g.header) + '" loading="lazy" decoding="async"></a>' +
        '<div class="basket-item__info"><a class="basket-item__name" href="' + esc(url) + '">' + esc(g.header) + '</a>' +
        '<div class="basket-item__price"><span class="price">' + esc(g.price) + '</span></div></div></div>' +
        '<div class="basket-item__qty"><span>' + esc(g.cnt) + ' шт.</span></div>' +
        '<div class="basket-item__sum">' + esc(g.sum) + '</div></article>';
    }).join('');
    var cnt = items(block).length;
    return '<div class="order-in">' +
      '<div class="order-in__head"><span class="order-status order-status--' + esc(statusClass) + '">' + esc(statusLabel) + '</span>' +
      '<span class="order-in__date">от ' + esc(date) + '</span></div>' +
      '<div class="order-in__layout"><section class="order-items" aria-label="Товары в заказе">' +
      '<div class="basket-items__head"><span>Товар</span><span>Количество</span><span>Сумма</span></div>' + rows + '</section>' +
      '<aside class="basket-summary" aria-label="Итоги заказа"><div class="basket-summary__card">' +
      '<h2 class="basket-summary__title">Заказ №' + esc(number) + '</h2>' +
      '<ul class="basket-summary__lines"><li class="line"><span>Товаров</span><span>' + cnt + ' шт.</span></li>' +
      (address ? '<li class="line"><span>Адрес доставки</span><span>' + esc(address) + '</span></li>' : '') + '</ul>' +
      '<div class="basket-summary__total"><span>Итого</span><span>' + esc(total) + '</span></div>' +
      '<a class="btn btn-outline basket-summary__cta" href="/profile/"><svg class="icon icon-chevron-left" aria-hidden="true"><use href="#i-chevron-left"></use></svg> Вернуться в личный кабинет</a>' +
      '</div></aside></div></div>';
  }
  // -------- Блок страницы «Профиль» (page_profile) --------
  function renderPageProfile(block) {
    var name = p(block, 'name', 'Иванов Иван');
    var phone = p(block, 'phone', '+7 (999) 000-00-00');
    var email = p(block, 'email', 'mail@example.ru');
    var address = p(block, 'address', 'Москва, ул. Примерная, 1');
    var dataPanel = '<div class="profile-tabs__panel is-active" data-panel="data" role="tabpanel">' +
      '<form id="profileDataForm" class="profile-form" novalidate><div class="basket-order__grid">' +
      '<div><label for="prof-name">ФИО *</label><input class="form-control" id="prof-name" name="name" type="text" required value="' + esc(name) + '" autocomplete="name"></div>' +
      '<div><label for="prof-phone">Телефон *</label><input class="form-control" id="prof-phone" name="phone" type="tel" required value="' + esc(phone) + '" data-mask="phone" autocomplete="tel"></div>' +
      '<div><label for="prof-email">Email *</label><input class="form-control" id="prof-email" name="email" type="email" required value="' + esc(email) + '" autocomplete="email"></div>' +
      '<div><label for="prof-address">Адрес доставки</label><input class="form-control" id="prof-address" name="address" type="text" value="' + esc(address) + '"></div>' +
      '</div><button class="btn btn-primary profile-form__submit" type="submit">Сохранить изменения</button>' +
      '<a class="profile-form__password" href="#prof-password" aria-controls="prof-password">Изменить пароль</a></form>' +
      '<form id="prof-password" class="profile-form profile-form--password" novalidate hidden><div class="basket-order__grid">' +
      '<div><label for="prof-pass-old">Текущий пароль *</label><input class="form-control" id="prof-pass-old" name="password_old" type="password" required autocomplete="current-password"></div>' +
      '<div><label for="prof-pass-new">Новый пароль *</label><input class="form-control" id="prof-pass-new" name="password_new" type="password" required minlength="8" autocomplete="new-password"></div>' +
      '<div><label for="prof-pass-new2">Повторите новый пароль *</label><input class="form-control" id="prof-pass-new2" name="password_new2" type="password" required minlength="8" autocomplete="new-password"></div>' +
      '</div><button class="btn btn-primary profile-form__submit" type="submit">Сменить пароль</button></form></div>';
    var ordersPanel = '<div class="profile-tabs__panel" data-panel="orders" role="tabpanel">' +
      '<div class="orders-list"><div class="basket-items__head"><span>Номер</span><span>Дата</span><span>Товаров</span><span>Сумма</span><span>Статус</span><span></span></div>' +
      '<article class="order-row"><div class="basket-item__main"><div class="basket-item__info"><a class="basket-item__name" href="/profile/order/1024/">Заказ №1024</a></div></div>' +
      '<div class="basket-item__qty">29 сентября 2026</div><div class="basket-item__qty">3 шт.</div><div class="basket-item__sum">49 990 ₽</div>' +
      '<div><span class="order-status order-status--processing">Обрабатывается</span></div>' +
      '<div class="basket-item__remove"><a class="btn btn-outline btn-sm" href="/profile/order/1024/">Подробнее</a></div></article></div>' +
      '<nav class="profile-pager" aria-label="Пагинация заказов"><span class="profile-pager__cur">Страница 1 из 1</span></nav></div>';
    return '<div class="profile-tabs" data-tabs>' +
      '<div class="profile-tabs__nav" role="tablist" aria-label="Разделы личного кабинета">' +
      '<button class="profile-tabs__tab is-active" type="button" role="tab" data-tab="data" aria-selected="true">Мои данные</button>' +
      '<button class="profile-tabs__tab" type="button" role="tab" data-tab="orders" aria-selected="false">Мои заказы</button></div>' +
      '<div class="profile-tabs__panels">' + dataPanel + ordersPanel + '</div></div>';
  }
  // -------- Блок страницы «Регистрация» (page_registration) --------
  function renderPageRegistration(block) {
    var title = p(block, 'title', 'Регистрация');
    var form = '<div id="registerForm_wrap" class="form-card register__card"><h2 class="form-card__title">Создать аккаунт</h2>' +
      '<form id="registerForm" novalidate><div class="form-grid">' +
      '<div class="form-group form-group--full"><label class="form-label" for="reg-name">ФИО <span class="req">*</span></label><input class="form-control" id="reg-name" type="text" placeholder="Иванов Иван Иванович" autocomplete="name"></div>' +
      '<div class="form-group"><label class="form-label" for="reg-email">Email <span class="req">*</span></label><input class="form-control" id="reg-email" type="email" placeholder="mail@example.com" autocomplete="email"></div>' +
      '<div class="form-group"><label class="form-label" for="reg-phone">Телефон</label><input class="form-control" id="reg-phone" type="tel" placeholder="+7 (___) ___-__-__" autocomplete="tel"></div>' +
      '<div class="form-group"><label class="form-label" for="reg-password">Пароль <span class="req">*</span></label><input class="form-control" id="reg-password" type="password" placeholder="Минимум 8 символов" autocomplete="new-password"></div>' +
      '<div class="form-group"><label class="form-label" for="reg-password2">Подтверждение пароля <span class="req">*</span></label><input class="form-control" id="reg-password2" type="password" placeholder="Повторите пароль" autocomplete="new-password"></div>' +
      '</div>' +
      '<div class="form-group form-group--full"><label class="form-label" for="reg-capcha">Капча <span class="req">*</span></label><div class="captcha"><span class="fig" title="Обновить картинку"><a href="#"><img src="" width="120" height="44" alt="Капча"></a></span><input class="form-control" id="reg-capcha" type="text" placeholder="Введите код" autocomplete="off"></div></div>' +
      '<label class="checkbox"><input type="checkbox"><span>Я принимаю условия <a href="/soglasie">соглашения</a> и <a href="/securitypolicy">Политики обработки персональных данных</a></span></label>' +
      '<button class="btn btn-primary btn-lg" type="submit">Зарегистрироваться</button>' +
      '<p class="register__login">Уже есть аккаунт? <a href="/profile/">Войти</a></p></form></div>';
    var benefits = '<aside class="register__benefits" aria-label="Что даёт аккаунт"><h2>Что даёт аккаунт</h2><ul>' +
      '<li><svg class="icon icon-check" aria-hidden="true"><use href="#i-check"></use></svg><span>Быстрое оформление — адрес и контакты сохраняются</span></li>' +
      '<li><svg class="icon icon-check" aria-hidden="true"><use href="#i-check"></use></svg><span>Избранное на всех устройствах и история покупок</span></li>' +
      '<li><svg class="icon icon-check" aria-hidden="true"><use href="#i-check"></use></svg><span>Персональные скидки и ранний доступ к распродажам</span></li>' +
      '</ul></aside>';
    return '<div class="register"><div class="register__layout">' + form + benefits + '</div></div>';
  }
  function renderCarousel(block, kind) {
    var it = items(block);
    var item = function (inner) { return el('div', { class: 'carousel__item' }, inner); };
    var slides = it.map(function (i) {
      if (kind === 'reviews') {
        return item(el('article', { class: 'review-card' },
          el('div', { class: 'review-card__head' },
            el('span', { class: 'review-card__avatar', 'aria-hidden': 'true' }, esc((i.name || '?').slice(0, 1))) +
            el('div', { class: 'review-card__meta' }, el('div', { class: 'review-card__name' }, esc(i.name)) +
              el('div', { class: 'review-card__date' }, esc(i.role))) ) +
          el('div', { class: 'review-card__text' }, esc(i.text))));
      }
      if (kind === 'clients') {
        var ccard = i.logo
          ? img(i.logo, i.name, 'client-card__logo')
          : el('span', { class: 'client-card__name' }, esc(i.name));
        if (i.url) return item(link(i.url, 'client-card', ccard, { target: '_blank', rel: 'noopener' }));
        return item(el('span', { class: 'client-card' }, ccard));
      }
      if (kind === 'team') {
        return item(el('article', { class: 'team-card' }, img(i.photo, i.name, 'team-card__photo') +
          el('div', { class: 'team-card__name' }, esc(i.name)) +
          el('div', { class: 'team-card__role' }, esc(i.role))));
      }
      return item('');
    }).join('');
    var carCls = 'carousel carousel--side' + (kind === 'team' ? ' team-carousel' : '') + (kind === 'clients' ? ' clients-app' : '');
    return el('div', { class: carCls, 'data-carousel': 'true', 'data-autoplay': '3500' },
      el('div', { class: 'carousel__track' }, slides) +
      el('div', { class: 'carousel__nav' },
        el('button', { class: 'carousel__prev', type: 'button', 'aria-label': 'Назад' }) +
        el('button', { class: 'carousel__next', type: 'button', 'aria-label': 'Вперёд' })));
  }

  // -------- статические инфоблоки --------
  var ADV_ICON_SLUGS = ['delivery', 'shield', 'payment', 'support'];
  function renderAdvantages(block) {
    return el('div', { class: 'adv-grid' }, items(block).map(function (a, n) {
      var slug = ADV_ICON_SLUGS[n % ADV_ICON_SLUGS.length];
      return el('div', { class: 'adv-card' },
        el('span', { class: 'adv-card__icon adv-card__icon--' + slug }, img('images/preview/advantages_' + ((n % 4) + 1) + '.svg', '')) +
        el('h3', { class: 'adv-card__title' }, esc(a.header)) +
        el('p', { class: 'adv-card__text' }, esc(a.text)));
    }).join(''));
  }
  function renderAbout(block) {
    var title = p(block, 'title', 'О компании');
    var feats = items(block).map(function (f) {
      return el('div', { class: 'about__feature' },
        el('svg', { class: 'icon icon-check', 'aria-hidden': 'true' }, el('use', { href: '#i-check' })) +
        esc(f.text || ''));
    }).join('');
    var badge = p(block, 'badgeNum')
      ? el('div', { class: 'about__badge' },
          el('span', { class: 'about__badge-num' }, esc(p(block, 'badgeNum'))) +
          el('span', { class: 'about__badge-txt' }, p(block, 'badgeText')))
      : '';
    return el('div', { class: 'about' },
      el('div', { class: 'about__media' },
        img(p(block, 'image', 'block-images/about.png'), title) + badge) +
      el('div', null,
        // page_head уже печатает H1 — не дублируем заголовок.
        (defBool(block, 'page_head', false) ? '' : el('h2', { class: 'section-title' }, esc(title))) +
        el('p', { class: 'about__text' }, esc(p(block, 'text'))) +
        (feats ? el('div', { class: 'about__features' }, feats) : '') +
        el('div', { class: 'hero__actions' },
          (p(block, 'btn1Text') ? link(p(block, 'btn1Url', '#'), 'btn btn-primary', esc(p(block, 'btn1Text'))) : '') +
          (p(block, 'btn2Text') ? link(p(block, 'btn2Url', '#'), 'btn btn-outline', esc(p(block, 'btn2Text'))) : ''))
      ));
  }
  function renderPageContacts(block) {
    return '<section class="section" aria-label="Контакты"><div class="container">' +
      '<div class="section-head section-head--no-flex"><div><h1 class="section-title">Контакты</h1></div></div>' +
      '<div class="contacts-layout">' +
        '<div class="contacts-panel"><h2>Как нас найти</h2>' +
          '<ul class="contact__list"><li class="contact__item"><span class="contact__item-icon"><svg class="icon" aria-hidden="true"><use href="#i-pin"></use></svg></span><div><div class="contact__item-title">Адрес шоурума</div><div class="contact__item-value">Москва, ул. Перерва, д.11</div></div></li></ul>' +
        '</div>' +
        '<div class="contacts-map"></div>' +
      '</div>' +
      '<div class="branches"><h2 class="section-title">Наши филиалы</h2><div class="tabs branches-tabs" data-tabs><button type="button" class="tab-btn is-active" data-tab="msk">Москва</button></div></div>' +
      '<div class="requisites"><h2 class="section-title">Наши реквизиты</h2><div class="requisites-wrap"><table class="requisites-table"><tbody><tr><td>ИНН</td><td>—</td></tr></tbody></table></div></div>' +
      '</div></section>' +
      '<section class="fullmap"><div class="fullmap__frame"></div></section>';
  }
  function renderFaq(block) {
    return el('div', { class: 'faq-block' }, items(block).map(function (i, n) {
      return el('details', { class: 'faq-item', open: n === 0 ? true : null },
        el('summary', { class: 'faq-item__question' }, esc(i.q)) +
        el('div', { class: 'faq-item__answer' }, esc(i.a)));
    }).join(''));
  }
  function renderServicesTiles(block) {
    return el('div', { class: 'services-tiles' }, items(block).map(function (s) {
      var title = s.header || s.title || '';
      return link(s.url, 'service-tile', el('span', { class: 'service-tile__media' }, img(s.photo, title)) +
        el('span', { class: 'service-tile__title' }, esc(title)));
    }).join(''));
  }
  function renderServiceCards(block, tile) {
    var it = items(block);
    var gridCls = tile ? 'services-tiles' : 'services-grid' + (bool(block, 'noIcons') ? ' services-grid--no-icons' : '');
    return el('div', { class: gridCls }, it.map(function (s) {
      var title = s.header || s.title || '';
      if (tile) {
        return link(s.url, 'service-tile', el('span', { class: 'service-tile__media' }, img(s.photo, title)) +
          el('span', { class: 'service-tile__title' }, esc(title)));
      }
      var body = el('div', { class: 'service-card__body' },
        (bool(block, 'showIcon') && s.icon ? el('span', { class: 'service-card__icon' }, el('svg', { class: 'icon' }, el('use', { href: '#' + s.icon }))) : '') +
        el('h3', { class: 'service-card__title' }, link(s.url, null, esc(title))) +
        (s.anons ? el('p', { class: 'service-card__anons' }, esc(s.anons)) : '') +
        (bool(block, 'showPrice') && s.price_from ? el('div', { class: 'service-card__price' }, 'Цена от ' + el('b', null, esc(s.price_from))) : '') +
        (bool(block, 'showMore') ? link(s.url, 'service-card__more', 'Подробнее') : ''));
      return el('article', { class: 'service-card', itemscope: true, itemtype: 'https://schema.org/Service' },
        link(s.url, 'service-card__media', img(s.photo, title, 'service-card__media-img')) + body);
    }).join(''));
  }
  function renderServiceOthers(block) {
    return '<section class="service-others" aria-label="Другие услуги">' +
      '<h2 class="service-others__title">' + esc(p(block, 'header', 'Другие услуги')) + '</h2>' +
      '<div class="service-others__grid">' + items(block).map(function (s) {
        var icon = s.icon
          ? (String(s.icon).indexOf('i-') === 0
              ? '<span class="service-tile__icon"><svg class="icon" aria-hidden="true"><use href="#' + esc(s.icon) + '"></use></svg></span>'
              : '<span class="service-tile__icon">' + esc(s.icon) + '</span>')
          : '';
        return link(s.url, 'service-tile', icon +
          '<span><span class="service-tile__title">' + esc(s.header) + '</span>' +
          '<span class="service-tile__anons">' + esc(s.anons) + '</span></span>');
      }).join('') + '</div></section>';
  }
  function renderProductCards(block) {
    var it = items(block);
    var row = block.variant === 'row';
    var card = function (g) {
      var badge = g.badge ? el('span', { class: 'product-card__badge product-card__badge--' + g.badge }, esc(g.badge)) : '';
      var inner = img(g.photo, g.header, 'product-card__img') +
        (bool(block, 'showBadges') ? el('span', { class: 'product-card__badges' }, badge) : '') +
        el('div', { class: 'product-card__body' },
          link(g.url, 'product-card__title', esc(g.header)) +
          (bool(block, 'showAnons') && g.anons ? el('div', { class: 'product-card__anons' }, esc(g.anons)) : '') +
          el('div', { class: 'product-card__price-row' }, el('span', { class: 'product-card__price' }, esc(g.price)) +
            (g.oldPrice ? el('span', { class: 'product-card__price-old' }, esc(g.oldPrice)) : '')) +
        (bool(block, 'showBuy') ? el('button', { class: 'btn product-card__buy', type: 'button' }, 'В корзину') : ''));
      return el('div', { class: row ? 'product-row' : 'product-card' },
        el('div', { class: 'product-card__media' }, link(g.url, 'product-card__media-link', inner)) +
        (bool(block, 'showFavorite') || bool(block, 'showCompare')
          ? el('div', { class: 'product-card__actions' },
              (bool(block, 'showFavorite') ? el('button', { class: 'product-card__action', type: 'button', 'aria-label': 'Избранное' }, '\u2661') : '') +
              (bool(block, 'showCompare') ? el('button', { class: 'product-card__action', type: 'button', 'aria-label': 'Сравнение' }, '\u21C4') : ''))
          : ''));
    };
    return el('div', { class: row ? 'gb-rows' : 'gb-grid', style: '--gb-cols:' + esc(p(block, 'cols', row ? 2 : 4)) }, it.map(card).join(''));
  }
  function renderRubricList(block) {
    var it = items(block);
    if (block.variant === 'sidebar') {
      return el('nav', { class: 'catalog-sidebar' }, el('div', { class: 'catalog-sidebar__title' }, 'Каталог') +
        el('ul', { class: 'catalog-sidebar__nav' }, it.map(function (r) {
          return el('li', { class: 'catalog-sidebar__item' }, link(r.url, 'catalog-sidebar__link', esc(r.header)));
        }).join('')));
    }
    if (block.variant === 'rubs') {
      return el('div', { class: 'cat-rubs' }, it.map(function (r) {
        return el('div', { class: 'rub' }, el('div', { class: 'rub__name' }, esc(r.header)) +
          el('div', { class: 'rub__desc' }, esc(r.desc)) +
          el('div', { class: 'rub__subs' }, esc(r.sub)));
      }).join(''));
    }
    return el('div', { class: 'cat-grid cat-grid--' + esc(p(block, 'effect', 'flip')) + ' cat-enter--' + esc(p(block, 'enter', 'rise')), style: '--catalog-cols:' + esc(p(block, 'cols', 3)) },
      it.map(function (r) {
        return link(r.url, 'cat-card', el('span', { class: 'cat-card__inner' },
          el('span', { class: 'cat-card__face cat-card__face--front' }, el('span', { class: 'cat-card__name' }, esc(r.header))) +
          el('span', { class: 'cat-card__face cat-card__face--back' }, el('span', { class: 'cat-card__name' }, esc(r.header)) +
            el('span', { class: 'cat-card__desc' }, esc(r.desc)))));
      }).join(''));
  }
  function renderProductDetail(block) {
    var v = block.variant || 'gv-classic';
    var showSpecs = defBool(block, 'showSpecs', true);
    var showTabs = defBool(block, 'showTabs', true);
    var title = p(block, 'title', 'Смартфон X1 Pro');
    var anons = p(block, 'anons', 'Флагман с OLED-экраном, тройной камерой и быстрой зарядкой.');
    var price = p(block, 'price', 49990);
    var oldPrice = p(block, 'oldPrice', 59990);
    var photos = ['images/good_in/good_in_1_01.webp', 'images/good_in/good_in_1_02.webp', 'images/good_in/good_in_1_03.webp'];
    var desc = ['Краткое описание товара.', 'Второй абзац описания товара.'];
    var specs = items(block).map(function (s) { return [s.name || s.title, s.value || s.text]; });
    if (!specs.length) specs = [['Бренд', 'TechnoLine'], ['Гарантия', '12 мес.'], ['Страна', 'Россия']];
    var badges = ['new'];

    var tpl = [];
    tpl.push("<div v-if=\"loading\" class=\"gi-status\">Загружаем товар…</div>");
    tpl.push("<div v-else-if=\"error\" class=\"gi-status gi-status--error\">Товар не найден.</div>");
    tpl.push("<template v-else>");
    tpl.push("<div class=\"good-in__gallery\"><div class=\"gi-stage\">");
    tpl.push("<a v-if=\"curPhoto\" :href=\"curPhoto\" class=\"gi-stage__link\" data-fancybox=\"gi-gallery\" :data-caption=\"product.header\">");
    tpl.push("<img class=\"gi-stage__img\" :src=\"curPhoto\" :alt=\"product.header\" width=\"800\" height=\"800\"></a>");
    tpl.push("<div class=\"gi-stage__empty\" v-else><img :src=\"product.photo\" :alt=\"product.header\" width=\"400\" height=\"400\"></div>");
    tpl.push("<button class=\"gi-nav gi-nav--prev\" type=\"button\" @click=\"prev\" :disabled=\"photosCount<1\" aria-label=\"Предыдущее фото\">‹</button>");
    tpl.push("<button class=\"gi-nav gi-nav--next\" type=\"button\" @click=\"next\" :disabled=\"photosCount<1\" aria-label=\"Следующее фото\">›</button>");
    tpl.push("<div class=\"gi-count\" v-if=\"photosCount\">{{ cur+1 }} / {{ photosCount }}</div></div>");
    tpl.push("<div class=\"gi-thumbs\" v-if=\"photosCount>1\">");
    tpl.push("<button v-for=\"(pp,i) in photos\" :key=\"i\" class=\"gi-thumb\" :class=\"{'is-active': i===cur}\" type=\"button\" @click=\"setCur(i)\" :aria-label=\"'Фото '+(i+1)\">");
    tpl.push("<img :src=\"pp\" :alt=\"product.header + ', фото '+(i+1)\" loading=\"lazy\" width=\"800\" height=\"800\"></button></div></div>");
    tpl.push("<div class=\"good-in__info\">");
    tpl.push("<div class=\"gi-badges\" v-if=\"badges && badges.length\"><span v-for=\"b in badges\" :key=\"b\" class=\"gi-badge\" :class=\"'gi-badge--'+b\">{{ badgeLabel(b) }}</span></div>");
    // Название уже есть в H1 блока-страницы (.product-detail-head) — в превью
    // второй .gi-name в колонке не выводим (не дублируем заголовок).
    tpl.push("<div class=\"gi-price\"><span class=\"gi-price__new\">{{ priceFmt(product.price) }}</span>");
    tpl.push("<span v-if=\"oldPrice\" class=\"gi-price__old\">{{ priceFmt(oldPrice) }}</span><span v-if=\"savePercent\" class=\"gi-save\">-{{ savePercent }}%</span></div>");
    tpl.push("<p class=\"gi-anons\">{{ product.anons }}</p>");
    tpl.push("<div class=\"gi-buy\">");
    tpl.push("<div class=\"gi-qty\" v-if=\"inBasket\"><button class=\"gi-qty__btn\" type=\"button\" @click=\"decInCart\" :disabled=\"cartCount<=1\" aria-label=\"Уменьшить количество\">−</button>");
    tpl.push("<span class=\"gi-qty__val\">{{ cartCount }}</span><button class=\"gi-qty__btn\" type=\"button\" @click=\"incInCart\" aria-label=\"Увеличить количество\">+</button></div>");
    tpl.push("<div class=\"gi-qty\" v-else><button class=\"gi-qty__btn\" type=\"button\" @click=\"qtyDec\" :disabled=\"qty<=1\" aria-label=\"Уменьшить\">−</button>");
    tpl.push("<input class=\"gi-qty__input\" type=\"number\" min=\"1\" max=\"99\" :value=\"qty\" @input=\"onQty\" aria-label=\"Количество\">");
    tpl.push("<button class=\"gi-qty__btn\" type=\"button\" @click=\"qtyInc\" aria-label=\"Увеличить\">+</button></div>");
    if (defBool(block, 'one_click', false)) {
      tpl.push("<button v-if=\"oneClick\" class=\"btn btn-outline gi-buy__btn gi-buy__oneclick\" type=\"button\" @click=\"openOneClick\" :aria-label=\"'Заказать в 1 клик: ' + product.header\">Заказать в 1 клик</button>");
    }
    tpl.push("<button v-if=\"!inBasket\" class=\"btn btn-primary gi-buy__btn\" type=\"button\" @click=\"addToCart\">В корзину</button>");
    tpl.push("<template v-else><button class=\"btn btn-primary gi-buy__btn\" type=\"button\" @click=\"incInCart\">В корзине ({{ cartCount }})</button>");
    tpl.push("<button class=\"btn gi-buy__remove\" type=\"button\" @click=\"removeFromCart\" aria-label=\"Убрать из корзины\">Убрать</button></template>");
    tpl.push("<div class=\"gi-buy__extra\">");
    tpl.push("<button class=\"action-btn\" :class=\"{ 'is-active': favState() }\" type=\"button\" @click=\"fav()\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z\"/></svg></button>");
    tpl.push("<button class=\"action-btn\" :class=\"{ 'is-active': cmpState() }\" type=\"button\" @click=\"cmp()\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 5h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 5v14M15 5v14\"/></svg></button>");
    tpl.push("</div></div>");
    tpl.push("<div class=\"gi-total\" v-if=\"inBasket && qty>1\">Итого: <b>{{ priceFmt(totalPrice) }}</b></div>");
    tpl.push("</div>");
    tpl.push("<div class=\"good-in__tabs\"><div class=\"gi-tabs\" role=\"tablist\" aria-label=\"Информация о товаре\">");
    tpl.push("<button type=\"button\" class=\"gi-tab\" :class=\"{'is-active': tab==='desc'}\" role=\"tab\" :aria-selected=\"tab==='desc'\" @click=\"tab='desc'\">Описание</button>");
    if (showSpecs) {
      tpl.push("<button type=\"button\" class=\"gi-tab\" :class=\"{'is-active': tab==='specs'}\" role=\"tab\" :aria-selected=\"tab==='specs'\" @click=\"tab='specs'\">Характеристики</button>");
    }
    tpl.push("</div>");
    tpl.push("<div class=\"gi-tab-panel\" v-show=\"tab==='desc'\" role=\"tabpanel\"><p v-for=\"(t,i) in product.desc\" :key=\"i\" class=\"gi-desc__p\">{{ t }}</p></div>");
    if (showSpecs) {
      tpl.push("<div class=\"gi-tab-panel\" v-show=\"tab==='specs'\" role=\"tabpanel\"><dl class=\"good-in__specs\" v-if=\"product.specs && product.specs.length\">");
      tpl.push("<template v-for=\"(sp,i) in product.specs\" :key=\"i\"><dt>{{ sp[0] }}</dt><dd>{{ sp[1] }}</dd></template></dl></div>");
    }
    tpl.push("</div></template>");

    var seo = '<div class="good-in__seo" itemscope itemtype="https://schema.org/Product">' +
      '<h2 class="gi-name" itemprop="name">' + esc(title) + '</h2>' +
      '<div class="gi-price"><span class="gi-price__new">' + esc(price) + ' ₽</span></div>' +
      '<p class="gi-anons" itemprop="description">' + esc(anons) + '</p>' +
      '<dl class="good-in__specs">' + specs.map(function (sp) {
        return '<dt>' + esc(sp[0]) + '</dt><dd>' + esc(sp[1]) + '</dd>';
      }).join('') + '</dl></div>';

    var oneClick = defBool(block, 'one_click', false);

    var attrs = 'data-id="1" data-title="' + esc(title) + '" data-anons="' + esc(anons) + '" data-price="' + esc(price) + '"' +
      (oldPrice ? ' data-old-price="' + esc(oldPrice) + '"' : '') +
      (oneClick ? ' data-one-click="1"' : '') +
      " data-badges='" + attrJson(badges) + "'" +
      " data-photos='" + attrJson(photos) + "'" +
      " data-desc='" + attrJson(desc) + "'" +
      " data-specifications='" + attrJson(specs) + "'";
    /* Модалка «Заказать в 1 клик» в превью — статичная заглушка (реальная
       форма F-06 подключается на проде партиалом block/product_detail.html). */
    var oneClickModal = oneClick
      ? '<div id="modal_buy_one_click" class="jmodal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="modal_buy_one_click_title">' +
        '<div class="jmodal__dialog">' +
          '<button type="button" class="jmodal__close" data-jmodal-close aria-label="Закрыть">&times;</button>' +
          '<h3 class="jmodal__title" id="modal_buy_one_click_title">Заказать в 1 клик</h3>' +
          '<p class="mb-2">' + esc(title) + '</p>' +
          '<div class="form-grid">' +
            '<div class="form-group"><label class="form-label">Имя</label><input class="form-control" type="text" placeholder="Ваше имя"></div>' +
            '<div class="form-group"><label class="form-label">Телефон</label><input class="form-control" type="tel" placeholder="+7 (900) 000-00-00"></div>' +
            '<div class="form-group"><label class="form-label">Способ доставки</label><select class="form-control"><option>Курьером</option><option>Самовывоз из магазина</option></select></div>' +
            '<div class="form-group"><label class="form-label">Адрес доставки</label><input class="form-control" type="text" placeholder="Город, улица, дом"></div>' +
          '</div>' +
          '<div class="form-foot"><button class="btn btn-primary" type="button">Отправить</button></div>' +
        '</div></div>'
      : '';

    return '<div id="good_in" ' + attrs + ' class="good-in ' + esc(v) + '">' +
      '<template id="good_in_tpl">' + tpl.join('') + '</template>' + seo + '</div>' + oneClickModal;
  }
  function renderServiceDetail(block) {
    var noIcons = bool(block, 'noIcons');
    var showPrice = defBool(block, 'showPrice', true);
    var showRegion = defBool(block, 'showRegion', true);
    var title = p(block, 'title', 'Разработка дизайна');
    var anons = p(block, 'anons', 'Создаём современный и запоминающийся образ вашего бренда.');
    var photo = p(block, 'photo', 'images/preview/services/service-1.webp');
    var price = p(block, 'price', '1 500');
    var body = items(block).map(function (x) { return x.text || x.anons || ''; }).filter(Boolean);
    if (!body.length) body = ['Описание услуги и что в неё входит.', 'Сроки, этапы и условия работы.'];
    var icon = !noIcons
      ? '<span class="service-hero__icon"><svg class="icon" aria-hidden="true"><use href="#i-check"></use></svg></span>'
      : '';
    return '<div id="serviceIn" class="service-in-wrap">' +
      '<article class="service-in" itemscope itemtype="https://schema.org/Service">' +
        '<div class="service-in__head">' +
          '<h1 class="service-in__title" id="serviceInTitle" itemprop="name">' + esc(title) + '</h1>' +
          '<p class="service-in__anons" id="serviceInAnons" itemprop="description">' + esc(anons) + '</p>' +
        '</div>' +
        '<div class="service-hero">' +
          '<figure class="service-hero__media">' + img(photo, title, '') + icon + '</figure>' +
          '<div class="service-hero__body">' +
            (showPrice ? '<div class="service-in__price" id="serviceInPriceWrap">Цена от <b id="serviceInPrice">' + esc(price) + '</b> ₽</div>' : '') +
            (showRegion ? '<p class="service-in__region"><svg class="icon" aria-hidden="true"><use href="#i-pin"></use></svg> Работаем по всей России</p>' : '') +
            '<div class="service-in__actions">' +
              '<button class="btn btn-primary js-service-order" type="button" data-service="' + esc(title) + '">Заказать услугу</button>' +
              '<a class="btn btn-outline" href="/services/">Все услуги</a>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="service-in__body" id="serviceInBody">' + body.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' +
      '</article>' +
      '<nav class="service-in__nav" aria-label="Навигация по услугам">' +
        '<button class="service-nav__btn" type="button" aria-label="Предыдущая услуга"><svg class="icon" aria-hidden="true"><use href="#i-chevron-left"></use></svg> Предыдущая</button>' +
        '<a class="service-in__all" href="/services/">К списку услуг</a>' +
        '<button class="service-nav__btn" type="button" aria-label="Следующая услуга">Следующая <svg class="icon" aria-hidden="true"><use href="#i-chevron-right"></use></svg></button>' +
      '</nav></div>';
  }
  function teamTel(phone) { return String(phone || '').replace(/[^+\d]/g, ''); }
  function teamContacts(it) {
    var rows = '';
    if (it.phone) {
      rows += '<li><svg class="icon" aria-hidden="true"><use href="#i-phone"></use></svg>' +
        '<a href="tel:' + esc(teamTel(it.phone)) + '">' + esc(it.phone) + '</a></li>';
    }
    if (it.email) {
      rows += '<li><svg class="icon" aria-hidden="true"><use href="#i-mail"></use></svg>' +
        '<a href="mailto:' + esc(it.email) + '">' + esc(it.email) + '</a></li>';
    }
    if (it.max) {
      rows += '<li><svg class="icon" aria-hidden="true"><use href="#i-max"></use></svg>' +
        '<a href="' + esc(it.max) + '" target="_blank" rel="noopener noreferrer">MAX</a></li>';
    }
    return rows ? '<ul class="team-card__contacts">' + rows + '</ul>' : '';
  }
  function teamCard(it, withContacts) {
    return '<article class="team-card">' +
      '<div class="team-card__photo">' + img(it.photo, it.name) + '</div>' +
      '<div class="team-card__body">' +
        '<h3 class="team-card__name">' + esc(it.name) + '</h3>' +
        '<p class="team-card__role">' + esc(it.role) + '</p>' +
        (withContacts ? teamContacts(it) : '') +
      '</div></article>';
  }
  function renderTeam(block) {
    var variant = block.variant || 'cards';
    var people = items(block);
    var withContacts = defBool(block, 'contacts', true);
    var cols = p(block, 'cols', 4);

    if (variant === 'manager') {
      var m = people[0] || {};
      return '<article class="manager-card">' +
        '<div class="manager-card__photo">' + img(m.photo, m.name) + '</div>' +
        '<div class="manager-card__body">' +
          '<h3 class="manager-card__name">' + esc(m.name) + '</h3>' +
          '<p class="manager-card__role">' + esc(m.role) + '</p>' +
          (m.desc ? '<p class="manager-card__desc">' + esc(m.desc) + '</p>' : '') +
          (withContacts ? teamContacts(m) : '') +
          '<div class="manager-card__actions">' +
            (m.phone
              ? '<a class="btn btn-primary" href="tel:' + esc(teamTel(m.phone)) + '">Позвонить</a>'
              : '') +
            '<button class="btn btn-outline js-callback" type="button">Оставить заявку</button>' +
          '</div>' +
        '</div></article>';
    }

    if (variant === 'list') {
      return '<div class="team-list">' + people.map(function (it) {
        return '<article class="team-row">' +
          '<div class="team-row__photo">' + img(it.photo, it.name) + '</div>' +
          '<div class="team-row__body">' +
            '<h3 class="team-card__name">' + esc(it.name) + '</h3>' +
            '<p class="team-card__role">' + esc(it.role) + '</p>' +
            (withContacts ? teamContacts(it) : '') +
          '</div></article>';
      }).join('') + '</div>';
    }

    if (variant === 'compact') {
      return '<div class="team-grid" style="--team-cols:' + esc(cols) + '">' + people.map(function (it) {
        return '<article class="team-card team-card--compact">' +
          '<div class="team-card__photo">' + img(it.photo, it.name) + '</div>' +
          '<div class="team-card__body">' +
            '<h3 class="team-card__name">' + esc(it.name) + '</h3>' +
            '<p class="team-card__role">' + esc(it.role) + '</p>' +
          '</div></article>';
      }).join('') + '</div>';
    }

    if (variant === 'grid') {
      return '<div class="team-grid" style="--team-cols:' + esc(cols) + '">' +
        people.map(function (it) { return teamCard(it, withContacts); }).join('') + '</div>';
    }

    // cards (default) — карусель
    var autoplay = p(block, 'autoplay', 0);
    return '<div class="carousel carousel--side team-carousel" data-carousel' +
      (autoplay ? ' data-autoplay="' + esc(autoplay) + '"' : '') + '>' +
      '<div class="carousel__track">' + people.map(function (it) {
        return '<div class="carousel__item">' + teamCard(it, withContacts) + '</div>';
      }).join('') + '</div>' +
      '<div class="carousel__nav">' +
        '<button class="carousel__btn carousel__prev" type="button" aria-label="Назад"><svg class="icon" aria-hidden="true"><use href="#i-chevron-left"></use></svg></button>' +
        '<button class="carousel__btn carousel__next" type="button" aria-label="Вперёд"><svg class="icon" aria-hidden="true"><use href="#i-chevron-right"></use></svg></button>' +
      '</div></div>';
  }
  var PRJ_TECH = { brus: 'Клеёный брус', fachwerk: 'Фахверк', stone: 'Камень', ceramic: 'Тёплая керамика', monolith: 'Монолит' };
  function prjTech(v) { return PRJ_TECH[v] || v || ''; }
  function prjFloors(v) { return String(v) === '1' ? '1 этаж' : (String(v) === '2' ? '2 этажа' : (v || '')); }
  function prjCard(g) {
    return '<article class="prj-card" data-segment="' + esc(g.segment || '') + '" data-floors="' + esc(g.floors || '') +
      '" data-technology="' + esc(g.technology || '') + '" data-area="' + esc(g.area || '') + '">' +
      '<a class="prj-card__media" href="' + esc(g.url || '#') + '">' + img(g.photo, g.title) +
      '<span class="prj-card__tech">' + esc(prjTech(g.technology)) + '</span></a>' +
      '<div class="prj-card__body">' +
      '<h3 class="prj-card__title"><a href="' + esc(g.url || '#') + '">' + esc(g.title) + '</a></h3>' +
      '<ul class="prj-card__meta"><li>' + esc(g.area) + ' м²</li><li>' + esc(prjFloors(g.floors)) + '</li><li>' + esc(prjTech(g.technology)) + '</li></ul>' +
      '<a class="btn btn-outline btn-sm prj-card__link" href="' + esc(g.url || '#') + '">Смотреть проект</a></div></article>';
  }
  function renderCatalogProjects(block) {
    var perpage = p(block, 'perpage', 12);
    var list = items(block);
    var parts = '';
    if (defBool(block, 'segment', true)) {
      parts += '<div class="prj-tabs" data-prj-segment-group>' +
        '<button class="prj-tab is-active" type="button" data-prj-segment="all">Все</button>' +
        '<button class="prj-tab" type="button" data-prj-segment="life">Для жизни</button>' +
        '<button class="prj-tab" type="button" data-prj-segment="business">Для бизнеса</button></div>';
    }
    if (defBool(block, 'floors', true)) {
      parts += '<div class="prj-group"><span class="prj-group__label">Этажность</span>' +
        '<button class="prj-chip" type="button" data-prj-floor="1">1 этаж</button>' +
        '<button class="prj-chip" type="button" data-prj-floor="2">2 этажа</button></div>';
    }
    if (defBool(block, 'technology', true)) {
      parts += '<div class="prj-group"><span class="prj-group__label">Технология</span>' +
        ['brus', 'fachwerk', 'stone', 'ceramic', 'monolith'].map(function (t) {
          return '<button class="prj-chip" type="button" data-prj-tech="' + t + '">' + esc(prjTech(t)) + '</button>';
        }).join('') + '</div>';
    }
    if (defBool(block, 'area', true)) {
      parts += '<div class="prj-group prj-range"><span class="prj-group__label">Площадь, м²</span>' +
        '<input class="form-control prj-range__min" type="number" inputmode="numeric" min="0" placeholder="от" aria-label="Площадь от">' +
        '<span class="prj-range__sep">—</span>' +
        '<input class="form-control prj-range__max" type="number" inputmode="numeric" min="0" placeholder="до" aria-label="Площадь до"></div>';
    }
    if (defBool(block, 'sort', true)) {
      parts += '<label class="prj-sort"><span class="prj-group__label">Площадь</span>' +
        '<select class="form-select" data-prj-sort><option value="asc">По возрастанию</option><option value="desc">По убыванию</option></select></label>';
    }
    parts += '<button class="prj-reset" type="button" data-prj-reset>Сбросить</button>' +
      '<span class="prj-count" data-prj-count>Показано проектов: ' + list.length + ' из ' + list.length + '</span>';
    var toolbar = parts ? '<div class="prj-toolbar">' + parts + '</div>' : '';
    var grid = '<div class="prj-grid" data-prj-grid>' + list.map(prjCard).join('') + '</div>';
    var empty = '<p class="prj-empty" data-prj-empty hidden>Проекты по вашим параметрам не найдены. Попробуйте изменить площадь, технологию или сегмент.</p>';
    var more = defBool(block, 'loadMore', true)
      ? '<button class="btn btn-primary prj-more" type="button" data-prj-more hidden>Показать ещё</button>' : '';
    return '<div class="prj" data-prj data-perpage="' + esc(perpage) + '">' + toolbar + grid + empty + more + '</div>';
  }
  var CD_LABELS = { days: 'дн', hours: 'час', minutes: 'мин', seconds: 'сек' };
  function renderCountdown(block) {
    var units = String(p(block, 'units', 'days-hours-minutes-seconds')).split('-');
    var mode = p(block, 'mode', 'until');
    var date = p(block, 'date', '');
    var btnText = p(block, 'buttonText', '');
    var btnUrl = p(block, 'buttonUrl', '#consultation');
    var header = p(block, 'header', '');
    var text = p(block, 'text', '');
    var unitsHtml = units.map(function (u) {
      return '<span class="countdown__unit" data-cd-unit="' + esc(u) + '">' +
        '<span class="countdown__value" data-cd-' + esc(u) + '>00</span>' +
        '<span class="countdown__label">' + esc(CD_LABELS[u] || u) + '</span></span>';
    }).join('');
    return '<div class="countdown" data-countdown data-deadline="' + esc(date) + '" data-mode="' + esc(mode) + '"' +
      (defBool(block, 'hideAfter', true) ? ' data-hide-after="1"' : '') + '>' +
      '<div class="countdown__info">' +
        (header ? '<p class="countdown__title">' + esc(header) + '</p>' : '') +
        (text ? '<p class="countdown__text">' + esc(text) + '</p>' : '') +
      '</div>' +
      '<div class="countdown__timer">' + unitsHtml + '</div>' +
      (btnText ? '<a class="btn btn-primary countdown__btn" href="' + esc(btnUrl) + '">' + esc(btnText) + '</a>' : '') +
      '</div>';
  }
  function renderMarquee(block) {
    var view = p(block, 'view', 'cards');
    var speed = p(block, 'speed', 40);
    var dir = p(block, 'direction', 'left');
    var pause = defBool(block, 'pause', true);
    function item(it) {
      var inner;
      if (view === 'logos') {
        inner = '<span class="marquee__logo">' + img(it.photo, it.title || it.text) + '</span>';
      } else if (view === 'text') {
        inner = '<span class="marquee__text">' + esc(it.title || it.text) + '</span>';
      } else {
        inner = '<span class="marquee__card-media">' + img(it.photo, it.title) + '</span>' +
          '<span class="marquee__card-body"><span class="marquee__card-title">' + esc(it.title) + '</span>' +
          (it.text ? '<span class="marquee__card-text">' + esc(it.text) + '</span>' : '') + '</span>';
      }
      var tag = it.url ? 'a' : 'span';
      var attrs = it.url ? ' href="' + esc(it.url) + '"' : '';
      return '<' + tag + ' class="marquee__item"' + attrs + '>' + inner + '</' + tag + '>';
    }
    var seq = items(block).map(item).join('');
    return '<div class="marquee marquee--' + esc(view) + '" data-marquee' +
      ' style="--marquee-duration:' + esc(speed) + 's;--marquee-dir:' + (dir === 'right' ? 'reverse' : 'normal') + '"' +
      (pause ? ' data-pause-hover' : '') + '>' +
      '<div class="marquee__track">' + seq + seq + '</div></div>';
  }
  function renderCertificates(block) {
    var vertical = block.variant === 'vertical';
    var fancy = defBool(block, 'fancybox', true);
    return '<div class="cert-list' + (vertical ? ' cert-list--vertical' : '') + '" style="--cert-cols:' + esc(p(block, 'cols', vertical ? 4 : 4)) + '">' +
      items(block).map(function (c) {
        return '<a class="cert-card' + (c.portrait ? ' cert-card--portrait' : '') + '" href="' + esc(c.photo) + '"' +
          (fancy ? ' data-fancybox="certs" data-caption="' + esc(c.title) + '"' : '') +
          ' aria-label="Сертификат: ' + esc(c.title) + '">' +
          '<span class="cert-card__view"><img src="' + esc(c.photo) + '" alt="' + esc(c.title) + '" loading="lazy" decoding="async"></span>' +
          '<span class="cert-card__title">' + esc(c.title) + '</span></a>';
      }).join('') + '</div>';
  }
  // Пропорции плитки мозаики — реальные размеры фото (как в prod: width/height).
  function galRatio(g) {
    return (g && g.width && g.height) ? (g.width + '/' + g.height) : '';
  }
  function galItem(g, fancy, featured) {
    var cls = 'gal-item' + (featured ? ' gal-item--featured' : '');
    var style = (!featured && galRatio(g)) ? ' style="--ar:' + esc(galRatio(g)) + '"' : '';
    return '<a class="' + cls + '"' + style + ' href="' + esc(g.photo) + '"' +
      (fancy ? ' data-fancybox="gallery"' : '') + ' data-tag="' + esc(g.tag || '') + '"' +
      ' aria-label="' + esc(g.caption || '') + '">' + img(g.photo, g.caption, 'gal-item__img') +
      '<span class="gal-item__cap"><span class="gal-item__cap-title">' + esc(g.caption || '') + '</span>' +
      (g.tag_label ? '<span class="gal-item__cap-tag">' + esc(g.tag_label) + '</span>' : '') + '</span>' +
      '<span class="gal-item__zoom" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg></span>' +
      '</a>';
  }
  function renderGallery(block) {
    var v = block.variant || 'mosaic';
    var list = items(block);
    // Чипы фильтра: явный filterTags, иначе собираем из данных (тег + подпись +
    // счётчик) — как в prod block/photo_gallery.html.
    var tags = String(p(block, 'filterTags', '')).split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    var labels = {};
    list.forEach(function (g) { if (g.tag && !labels[g.tag]) labels[g.tag] = g.tag_label || g.tag; });
    var pairs = tags.length
      ? tags.map(function (t) { return { tag: t, label: labels[t] || t }; })
      : Object.keys(labels).map(function (t) { return { tag: t, label: labels[t] }; });
    var countOf = function (tag) { return list.filter(function (g) { return (g.tag || '') === tag; }).length; };
    var chips = (defBool(block, 'filter', true) && pairs.length)
      ? '<div class="gal-filter" data-gal-filter><button class="gal-chip is-active" type="button" data-filter="all">Все <span class="gal-chip__count">' + list.length + '</span></button>' +
        pairs.map(function (c) {
          return '<button class="gal-chip" type="button" data-filter="' + esc(c.tag) + '">' + esc(c.label) +
            ' <span class="gal-chip__count">' + countOf(c.tag) + '</span></button>';
        }).join('') + '</div>'
      : '';
    var fancy = defBool(block, 'fancybox', true);
    if (v === 'mosaic') {
      // Первый кадр — крупный (во всю ширину), остальные — мозаикой колонками.
      var first = list[0];
      var body = (first ? galItem(first, fancy, true) : '') +
        '<div class="gal-cols">' + list.slice(1).map(function (g) { return galItem(g, fancy, false); }).join('') + '</div>';
      return chips + body;
    }
    var grid = '<div class="gal-grid gal-grid--' + esc(v) + '">' + list.map(function (g) {
      return galItem(g, fancy, false);
    }).join('') + '</div>';
    return chips + grid;
  }
  function renderBrands(block) {
    return el('div', { class: 'brands-grid', style: '--brand-cols:' + esc(p(block, 'cols', 4)) }, items(block).map(function (b) {
      return link(b.url, 'brand-card', el('span', { class: 'brand-card__logo' }, img(b.logo, b.name)) +
        el('span', { class: 'brand-card__name' }, esc(b.name)) +
        el('span', { class: 'brand-card__desc' }, esc(b.desc)) +
        el('span', { class: 'brand-card__count' }, esc(b.count) + ' товаров'));
    }).join(''));
  }
  function renderNews(block) {
    var arrow = '<svg class="icon icon-arrow-right" aria-hidden="true"><use href="#i-arrow-right"></use></svg>';
    var v = block.variant || 'grid';
    var it = items(block);
    // Лимит из параметров блока: на проде движок режет выборку; в превью
    // режем демо-элементы так же, иначе «Лимит» визуально не работает.
    var lim = parseInt(p(block, 'limit', 0), 10) || 0;
    if (lim > 0) it = it.slice(0, lim);
    var card = function (n) {
      var url = n.url || '#';
      return '<article class="news-card" data-id="' + esc(n.url || '') + '">' +
        '<a class="news-card__media" href="' + esc(url) + '">' +
          '<span class="news-card__date">' + esc(n.date) + '</span>' +
          img(n.photo, n.title) +
        '</a>' +
        '<div class="news-card__body">' +
          '<h3 class="news-card__title"><a href="' + esc(url) + '">' + esc(n.title) + '</a></h3>' +
          '<p class="news-card__anons">' + esc(n.anons) + '</p>' +
          '<a class="news-card__link" href="' + esc(url) + '">Подробнее ' + arrow + '</a>' +
        '</div></article>';
    };
    var limit = esc(p(block, 'limit', 6));
    if (v === 'carousel') {
      return '<div class="carousel carousel--side" data-carousel data-autoplay="' + esc(p(block, 'autoplay', '0')) + '">' +
        '<div class="carousel__track">' + it.map(function (n) { return '<div class="carousel__item">' + card(n) + '</div>'; }).join('') + '</div>' +
        '<div class="carousel__nav"><button class="carousel__prev" type="button" aria-label="Назад"></button><button class="carousel__next" type="button" aria-label="Вперёд"></button></div></div>';
    }
    if (v === 'list') {
      return el('div', { id: 'newsList', class: 'grid-news grid-news--list', 'data-data-key': 'news', 'data-id': 'news', 'data-limit': limit }, it.map(card).join('')) +
        el('div', { id: 'newsSentinel' });
    }
    if (v === 'feature') {
      var first = it[0] || {};
      return el('div', { id: 'newsList', class: 'news-feature', 'data-data-key': 'news', 'data-id': 'news', 'data-limit': limit },
        '<div class="news-feature__main">' + card(first) + '</div>' +
        '<div class="news-feature__side">' + it.slice(1).map(card).join('') + '</div>') +
        el('div', { id: 'newsSentinel' });
    }
    return el('div', { id: 'newsList', class: 'grid-news', style: '--news-cols:' + esc(p(block, 'columns', 3)), 'data-data-key': 'news', 'data-id': 'news', 'data-limit': limit }, it.map(card).join('')) +
      el('div', { id: 'newsSentinel' });
  }
  function renderArticleList(block) {
    var it = items(block);
    var lim = parseInt(p(block, 'limit', 0), 10) || 0;
    if (lim > 0) it = it.slice(0, lim);
    var arrow = '<svg class="icon icon-arrow-right" aria-hidden="true"><use href="#i-arrow-right"></use></svg>';
    if (block.variant === 'tiles') {
      return '<div class="article-more"><div class="article-more__grid">' + it.map(function (a) {
        var url = a.url || '#';
        return '<div class="article-tile">' +
          '<a class="article-tile__media" href="' + esc(url) + '">' + img(a.photo, a.title) + '</a>' +
          '<div class="article-tile__body"><h3 class="article-tile__title"><a href="' + esc(url) + '">' + esc(a.title) + '</a></h3>' +
          '<p class="article-tile__anons">' + esc(a.anons) + '</p>' +
          '<a class="article-tile__link" href="' + esc(url) + '">Читать статью ' + arrow + '</a></div></div>';
      }).join('') + '</div></div>';
    }
    return '<div class="article-list article-list--enter">' + it.map(function (a, n) {
      var url = a.url || '#';
      var meta = '<span class="article-row__num">Публикация № ' + (n + 1) + '</span>' +
        (a.author ? '<span class="article-row__author" itemprop="author" itemscope itemtype="https://schema.org/Person">' +
          '<svg class="icon icon-author" aria-hidden="true"><use href="#i-dev-user"></use></svg>' +
          '<span itemprop="name">' + esc(a.author) + '</span></span>' : '');
      return '<article class="article-row" style="--i:' + (n + 1) + '" itemscope itemtype="https://schema.org/Article">' +
        '<div class="article-row__media">' + img(a.photo, a.title, 'article-row__img') + '</div>' +
        '<div class="article-row__body">' +
          '<p class="article-row__meta">' + meta + '</p>' +
          '<h2 class="article-row__name" itemprop="headline"><a href="' + esc(url) + '">' + esc(a.title) + '</a></h2>' +
          '<p class="article-row__desc" itemprop="description">' + esc(a.anons) + '</p>' +
          '<a class="article-row__link" href="' + esc(url) + '">Читать статью ' + arrow + '</a>' +
        '</div></article>';
    }).join('') + '</div>';
  }
  function renderTabs(block) {
    var it = items(block);
    var nav = el('div', { class: 'tab-btns' }, it.map(function (t, n) {
      return el('button', { class: 'tab-btn' + (n === 0 ? ' is-active' : ''), type: 'button', 'data-tab': 't' + n }, esc(t.label));
    }).join(''));
    var panels = it.map(function (t, n) {
      return el('div', { class: 'tab-panel' + (n === 0 ? ' is-active' : ''), 'data-panel': 't' + n }, esc(t.content));
    }).join('');
    return el('div', { 'data-tabs': 'true' }, nav + panels);
  }
  function renderTags(block) {
    return el('div', { class: 'gl-chips' }, el('div', { class: 'gl-chips__row' }, items(block).map(function (t) {
      return el('span', { class: 'gl-chips__chip' }, esc(t.label) + el('span', { class: 'gl-chips__count' }, esc(t.count)));
    }).join('')));
  }
  function branchInfo(icon, title, value, href) {
    var val = href ? link(href, null, esc(value)) : esc(value);
    return el('div', { class: 'branch-info-item' },
      el('svg', { class: 'icon', 'aria-hidden': 'true' }, el('use', { href: '#' + icon })) +
      el('div', null, el('div', { class: 'branch-info-item-title' }, title) +
        el('div', { class: 'branch-info-item-value' }, val)));
  }
  function yandexMapUrl(lat, lon, zoom, marker) {
    if (lat === '' || lon === '' || lat == null || lon == null) return '';
    var u = 'https://yandex.ru/map-widget/v1/?ll=' + lon + ',' + lat + '&z=' + (zoom || 16);
    if (marker !== false) u += '&pt=' + lon + ',' + lat + ',pm2rdm';
    return u;
  }
  function renderBranches(block) {
    var it = items(block);
    var tabs = defBool(block, 'tabs', true) && it.length
      ? el('div', { class: 'tabs branches-tabs', 'data-tabs': true, role: 'tablist', 'aria-label': 'Филиалы по городам' }, it.map(function (b, n) {
          return el('button', {
            type: 'button', class: 'tab-btn' + (n === 0 ? ' is-active' : ''), role: 'tab',
            'aria-selected': n === 0 ? 'true' : 'false', 'data-tab': b.key || ('b' + n)
          }, esc(b.name || b.city));
        }).join(''))
      : '';
    function branchMap(b) {
      var bz = Number(b.zoom || p(block, 'zoom', 16)) || 16;
      var bmap = yandexMapUrl(b.lat, b.lon, bz, true) || b.map;
      if (!bmap && !b.address) return '';
      return el('div', { class: 'branch-map' },
        (bmap ? '<iframe src="' + esc(bmap) + '" title="Карта: филиал ' + esc(b.name || '') + '" loading="lazy" allowfullscreen></iframe>' : '') +
        el('div', { class: 'branch-map__badge' },
          el('span', { class: 'branch-map__title' }, esc(b.name || b.city || '')) +
          (b.address ? el('span', { class: 'branch-map__addr' }, esc(b.address)) : '') +
          (b.address ? el('a', { class: 'branch-map__route', href: 'https://yandex.ru/maps/?text=' + encodeURIComponent(b.address) + '&z=' + bz, target: '_blank', rel: 'noopener' },
            '<svg class="icon icon-pin" aria-hidden="true"><use href="#i-pin"></use></svg>Построить маршрут') : '')));
    }
    var panels = el('div', { class: 'branches-panels' }, it.map(function (b, n) {
      return el('div', { class: 'tab-panel' + (n === 0 ? ' is-active' : ''), role: 'tabpanel', 'data-panel': b.key || ('b' + n) },
        el('div', { class: 'branch-card' },
          el('div', { class: 'branch-info' },
            branchInfo('i-pin', 'Адрес', b.address) +
            branchInfo('i-phone', 'Телефон', b.phone, b.phone_raw ? 'tel:' + b.phone_raw : null) +
            (b.email ? branchInfo('i-mail', 'E-mail', b.email, 'mailto:' + b.email) : '') +
            branchInfo('i-clock', 'Режим работы', b.work_time)) +
          branchMap(b)));
    }).join(''));
    return el('div', { class: 'branches' }, tabs + panels);
  }
  function renderRoutes(block) {
    return el('div', { class: 'routes' }, items(block).map(function (r) {
      return el('div', { class: 'routes__item' },
        el('div', { class: 'routes__item-title' }, '<svg class="icon icon-pin" aria-hidden="true"><use href="#i-pin"></use></svg> ' + esc(r.title)) +
        el('p', null, esc(r.text)));
    }).join('') + (p(block, 'note') ? el('p', { class: 'routes-note' }, esc(p(block, 'note'))) : ''));
  }
  function renderMap(block) {
    var center = String(p(block, 'center', '') || '').split(',');
    var has = center.length === 2 && center[0].trim() && center[1].trim();
    var z = Number(p(block, 'zoom', 15)) || 15;
    var marker = defBool(block, 'marker', true);
    var showRoute = defBool(block, 'showRoute', true);
    var url = has ? yandexMapUrl(center[0].trim(), center[1].trim(), z, marker)
                  : p(block, 'url', 'https://yandex.ru/map-widget/v1/?ll=37.617700%2C55.755800&z=12&pt=37.617700%2C55.755800%2Cpm2rdm');
    var route = has ? 'https://yandex.ru/maps/?rtext=' + center[0].trim() + ',' + center[1].trim() + '&rtm=atm&z=' + z : url;
    var h = Number(p(block, 'height', 400)) || 400;
    var iframe = '<iframe src="' + esc(url) + '" title="Карта" loading="lazy" allowfullscreen style="height:' + h + 'px"></iframe>';
    if (block.variant === 'full') {
      return '<div class="fullmap"><div class="fullmap__frame">' + iframe + '</div></div>';
    }
    var link = (showRoute && has)
      ? '<a class="map-route__link" href="' + esc(route) + '" target="_blank" rel="noopener">Построить маршрут</a>'
      : '<a class="map-route__link" href="' + esc(url) + '" target="_blank" rel="noopener">Открыть карту</a>';
    return '<div class="contacts-map">' + iframe +
      '<div class="map-route"><span>Мы на карте</span>' + link + '</div></div>';
  }

  // -------- формы --------
  function renderForm(block) {
    var key = p(block, 'form', 'callback');
    var forms = global.PC_FORMS || {};
    var html = forms[key];
    if (!html) html = '<div class="form-api-wrap"><p>Форма «' + esc(key) + '» недоступна в превью.</p></div>';
    return '<div class="form-block">' + html + '</div>';
  }

  function renderContactForm(block) {
    var hd = global.PC_HEADER_DATA || {};
    var ft = global.PC_FOOTER_DATA || {};
    var icon = function (id) { return '<svg class="icon" aria-hidden="true"><use href="#' + esc(id) + '"></use></svg>'; };
    var items = [
      { icon: 'i-pin', title: 'Адрес шоурума', value: ft.address || 'Москва, ул. Примерная, 1' },
      { icon: 'i-phone', title: 'Телефон', value: hd.phone || '' },
      { icon: 'i-mail', title: 'Email', value: hd.email || '' },
      { icon: 'i-clock', title: 'Режим работы', value: hd.work_time || '' }
    ];
    var socials = (ft.socials || []).map(function (s) {
      return '<a href="' + esc(s.url) + '" aria-label="' + esc(s.label) + '">' + icon(s.id) + '</a>';
    }).join('');
    var forms = global.PC_FORMS || {};
    return '<div class="contact">' +
      '<div><ul class="contact__list">' + items.map(function (it) {
        return '<li class="contact__item"><span class="contact__item-icon">' + icon(it.icon) + '</span>' +
          '<div><div class="contact__item-title">' + esc(it.title) + '</div>' +
          '<div class="contact__item-value">' + esc(it.value) + '</div></div></li>';
      }).join('') + '</ul>' +
      (socials ? '<div class="socials">' + socials + '</div>' : '') + '</div>' +
      '<div class="contact__form">' + (forms.send_request || '') + '</div></div>';
  }
  function renderRequisites(block) {
    return el('div', { class: 'requisites' }, el('div', { class: 'requisites-wrap' },
      el('div', { class: 'section-title' }, esc(p(block, 'title', 'Наши реквизиты'))) +
      el('table', { class: 'requisites-table' }, el('tbody', null, items(block).map(function (r) {
        return el('tr', null, el('td', null, esc(r.k)) + el('td', null, esc(r.v)));
      }).join(''))) +
      (defBool(block, 'pdf', true) ? el('div', { class: 'requisites-actions' },
        el('button', {
          class: 'btn btn-outline js-requisites-pdf', type: 'button',
          'data-title': p(block, 'title', 'Реквизиты компании'), 'data-org': p(block, 'org', 'ООО «Компания»')
        }, '<svg class="icon icon-doc" aria-hidden="true"><use href="#i-dev-doc"></use></svg> Скачать реквизиты')) : '')));
  }
  function renderContacts(block) {
    return el('div', { class: 'contact' }, el('div', { class: 'contact__list' }, items(block).map(function (c) {
      return el('div', { class: 'contact__item' }, el('span', { class: 'contact__item-icon' }, el('svg', { class: 'icon' }, el('use', { href: '#' + (c.icon || 'i-phone') }))) +
        el('div', { class: 'contact__item-body' }, el('div', { class: 'contact__item-title' }, esc(c.title)) +
          el('div', { class: 'contact__item-value' }, esc(c.value))));
    }).join('')) +
      (bool(block, 'showSocials') ? el('div', { class: 'contacts-soc' }, el('div', { class: 'socials' }, ['VK', 'OK'].map(function (s) { return link('#', 'socials__item', s); }).join(''))) : '') +
      (bool(block, 'showMap') ? el('div', { class: 'contacts-map', style: 'height:240px' }) : ''));
  }
  function renderHistory(block) {
    var cls = 'history' + (block.variant === 'horizontal' ? ' history--horizontal' : '');
    return '<ol class="' + cls + '">' + items(block).map(function (h) {
      return '<li class="history__item"><div class="history__year">' + esc(h.year) + '</div>' +
        '<div class="history__body"><div class="history__title">' + esc(h.title) + '</div>' +
        '<div class="history__text">' + esc(h.text) + '</div></div></li>';
    }).join('') + '</ol>';
  }
  function renderOrg(block) {
    return el('div', { class: 'org' }, items(block).map(function (o) {
      return el('div', { class: 'org__box' }, esc(o.name) + (o.note ? el('div', { class: 'org__box-note' }, esc(o.note)) : ''));
    }).join(''));
  }
  function renderReports(block) {
    return el('div', { class: 'reports' }, items(block).map(function (r) {
      var src = r.attach_and_path || r.attach || r.url || '#';
      var ext = String(r.attach || r.attach_and_path || r.url || '').split('.').pop().toUpperCase();
      return link(src, 'report', el('span', { class: 'report__ico' }, ext || 'FILE') +
        el('span', { class: 'report__name' }, esc(r.header || r.name || '')) +
        el('span', { class: 'report__meta' }, esc(r.meta || '')));
    }).join(''));
  }
  function renderPromo(block) {
    /* Разметка 1:1 с templates/t1/block/promo_parallax.html.
       Фон — .plx__media (img), подложка — .plx__overlay, текст — .plx__content.
       data-plx + --plx-* включает примитив css/parallax.css. */
    var amplitude = p(block, 'amplitude', 12);
    var minH = p(block, 'minH', 420);
    var cls = 'plx' + (p(block, 'align', 'left') === 'center' ? ' plx--center' : '');
    return el('section', { class: cls, 'data-plx': true,
      style: '--plx-speed:' + esc(amplitude) + ';--plx-min-h:' + esc(minH) + 'px' },
      img(p(block, 'photo'), '', 'plx__media') +
      (defBool(block, 'overlay', true) ? el('div', { class: 'plx__overlay' }) : '') +
      el('div', { class: 'container' },
        el('div', { class: 'plx__content' },
          (p(block, 'eyebrow') ? el('p', { class: 'plx__eyebrow' }, esc(p(block, 'eyebrow'))) : '') +
          (p(block, 'title') ? el('h2', { class: 'plx__title' }, esc(p(block, 'title'))) : '') +
          (p(block, 'text') ? el('p', { class: 'plx__text' }, esc(p(block, 'text'))) : '') +
          (p(block, 'btnText') ? el('div', { class: 'plx__actions' },
            link(p(block, 'btnUrl'), 'btn btn-primary', esc(p(block, 'btnText')))) : ''))));
  }
  // -------- видео (RuTube, click-to-play) --------
  var PLAY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
  var VIDEO_THUMB = 'https://rutube.ru/api/video/';
  function videoThumb(id) { return id ? VIDEO_THUMB + encodeURIComponent(id) + '/thumbnail/?redirect=1' : FALLBACK_IMG; }

  function videoMedia(v) {
    return '<div class="video-card__media" data-video-media>' +
      img(videoThumb(v.id), v.title || '', 'video-card__poster') +
      '<button class="video-card__playbtn" type="button" data-video-play data-video-id="' + esc(v.id || '') + '"' +
      ' aria-label="Смотреть видео: ' + esc(v.title || '') + '">' +
      '<span class="video-card__play" aria-hidden="true">' + PLAY_SVG + '</span>' +
      (v.duration ? '<span class="video-card__duration">' + esc(v.duration) + '</span>' : '') +
      '</button></div>';
  }
  function videoCard(v) {
    return '<article class="video-card">' + videoMedia(v) +
      '<div class="video-card__body"><h3 class="video-card__title">' + esc(v.title) + '</h3>' +
      '<div class="video-card__meta">RuTube' + (v.duration ? ' · ' + esc(v.duration) : '') + '</div></div></article>';
  }
  function renderVideo(block) {
    var v = block.variant || 'carousel';
    var it = items(block);
    if (v === 'grid') {
      return '<div class="video-block video-block--grid" data-video-block><div class="video-grid" style="--video-cols:' +
        esc(p(block, 'cols', '3')) + '">' + it.map(videoCard).join('') + '</div></div>';
    }
    if (v === 'feature') {
      var first = it[0] || {};
      var player = '<div class="video-feature__player"><div class="video-feature__media" data-video-media>' +
        img(videoThumb(first.id), first.title || '') +
        '<button class="video-card__playbtn" type="button" data-video-play data-video-id="' + esc(first.id || '') + '"' +
        ' aria-label="Смотреть видео: ' + esc(first.title || '') + '">' +
        '<span class="video-card__play" aria-hidden="true">' + PLAY_SVG + '</span></button></div></div>';
      var list = '<div class="video-feature__list" role="list">' + it.map(function (x, n) {
        return '<button class="video-feature__item' + (n === 0 ? ' is-active' : '') + '" type="button" role="listitem"' +
          ' data-video-id="' + esc(x.id || '') + '"' +
          ' data-video-thumb="' + esc(videoThumb(x.id)) + '">' +
          '<span class="video-feature__thumb">' + img(videoThumb(x.id), x.title || '') + '</span>' +
          '<span><span class="video-feature__item-title">' + esc(x.title) + '</span>' +
          '<span class="video-feature__item-meta">RuTube' + (x.duration ? ' · ' + esc(x.duration) : '') + '</span></span></button>';
      }).join('') + '</div>';
      return '<div class="video-block video-block--feature" data-video-block><div class="video-feature">' + player + list + '</div></div>';
    }
    if (v === 'cover') {
      var c = it[0] || {};
      return '<div class="video-block video-block--cover" data-video-block><div class="video-cover"><div class="video-cover__media" data-video-media>' +
        img(videoThumb(c.id), c.title || '', 'video-cover__poster') +
        '<button class="video-card__playbtn" type="button" data-video-play data-video-id="' + esc(c.id || '') + '"' +
        ' aria-label="Смотреть видео: ' + esc(c.title || '') + '">' +
        '<span class="video-card__play" aria-hidden="true">' + PLAY_SVG + '</span></button></div>' +
        '<div class="video-cover__body"><h3 class="video-cover__title">' + esc(c.title || '') + '</h3>' +
        '<div class="video-card__meta">RuTube' + (c.duration ? ' · ' + esc(c.duration) : '') + '</div></div></div></div>';
    }
    if (v === 'strip') {
      return '<div class="video-block video-block--strip" data-video-block><div class="video-strip">' + it.map(function (x) {
        return '<button class="video-strip__item" type="button" data-video-play data-video-id="' + esc(x.id || '') + '"' +
          ' aria-label="Смотреть видео: ' + esc(x.title || '') + '">' +
          '<span class="video-strip__media" data-video-media>' + img(videoThumb(x.id), x.title || '') +
          '<span class="video-card__play" aria-hidden="true">' + PLAY_SVG + '</span>' +
          (x.duration ? '<span class="video-card__duration">' + esc(x.duration) + '</span>' : '') + '</span>' +
          '<span class="video-strip__title">' + esc(x.title) + '</span></button>';
      }).join('') + '</div></div>';
    }
    // carousel (default)
    var track = it.map(function (x) { return '<div class="carousel__item">' + videoCard(x) + '</div>'; }).join('');
    return '<div class="video-block video-block--carousel" data-video-block>' +
      '<div class="carousel carousel--side" data-carousel data-autoplay="' + esc(p(block, 'autoplay', '0')) + '">' +
      '<div class="carousel__track">' + track + '</div>' +
      '<div class="carousel__nav"><button class="carousel__prev" type="button" aria-label="Предыдущее видео"></button>' +
      '<button class="carousel__next" type="button" aria-label="Следующее видео"></button></div></div></div>';
  }

  // -------- сборка --------
  var RENDER = {
    text: { raw: false, fn: renderText },
    slider: { raw: true, fn: renderSlider },
    catalog: { raw: false, fn: renderCatalog },
    goods: { raw: false, fn: renderGoods },
    advantages: { raw: false, fn: renderAdvantages },
    about: { raw: false, fn: renderAbout },
    reviews: { raw: false, fn: function (b) { return renderCarousel(b, 'reviews'); } },
    clients: { raw: false, fn: function (b) { return renderCarousel(b, 'clients'); } },
    services: { raw: false, fn: renderServicesTiles },
    faq: { raw: false, fn: renderFaq },
    header: { raw: true, fn: renderHeader },
    footer: { raw: true, fn: renderFooter },
    product_card: { raw: false, fn: renderProductCards },
    product_list: { raw: false, fn: renderProductList },
    page_favorites: { raw: false, fn: renderPageFavorites },
    page_search: { raw: false, fn: renderPageSearch },
    page_404: { raw: false, fn: renderPage404 },
    page_compare: { raw: false, fn: renderPageCompare },
    page_basket: { raw: false, fn: renderPageBasket },
    page_news_detail: { raw: false, fn: renderPageNewsDetail },
    page_article_detail: { raw: false, fn: renderPageArticleDetail },
    page_contacts: { raw: true, fn: renderPageContacts },
    page_order: { raw: false, fn: renderPageOrder },
    page_profile: { raw: false, fn: renderPageProfile },
    page_registration: { raw: false, fn: renderPageRegistration },
    rubric_list: { raw: false, fn: renderRubricList },
    product_detail: { raw: false, fn: renderProductDetail },
    service_card: { raw: false, fn: function (b) { return renderServiceCards(b, b.variant === 'tile'); } },
    service_list: { raw: false, fn: function (b) { return b.variant === 'others' ? renderServiceOthers(b) : renderServiceCards(b, false); } },
    service_detail: { raw: false, fn: renderServiceDetail },
    team: { raw: false, fn: renderTeam },
    certificates: { raw: false, fn: renderCertificates },
    catalog_projects: { raw: false, fn: renderCatalogProjects },
    countdown: { raw: false, fn: renderCountdown },
    marquee: { raw: false, fn: renderMarquee },
    photo_gallery: { raw: false, fn: renderGallery },
    video: { raw: false, fn: renderVideo },
    page_video: { raw: false, fn: renderVideo },
    custom: { raw: true, fn: renderCustom },
    note: { raw: false, fn: renderNote },
    brands_grid: { raw: false, fn: renderBrands },
    news_list: { raw: false, fn: renderNews },
    article_list: { raw: false, fn: renderArticleList },
    tabs: { raw: false, fn: renderTabs },
    tags: { raw: false, fn: renderTags },
    branches: { raw: false, fn: renderBranches },
    map: { raw: false, fn: renderMap },
    requisites: { raw: false, fn: renderRequisites },
    contacts_info: { raw: false, fn: renderContacts },
    routes: { raw: false, fn: renderRoutes },
    history_timeline: { raw: false, fn: renderHistory },
    org_chart: { raw: false, fn: renderOrg },
    reports: { raw: false, fn: renderReports },
    promo_parallax: { raw: false, fn: renderPromo },
    form: { raw: false, fn: renderForm },
    contact_form: { raw: false, fn: renderContactForm }
  };

  // Кастомный блок: сырой HTML + ссылки на CSS/JS (абсолютные или из
  // файлов проекта). Raw-блок — своей секции/заголовка не добавляет.
  function renderCustom(block) {
    var html = p(block, 'html', '');
    var _c = global.PAGE_CONSTRUCTOR_CONFIG || {};
    var base = _c.filesBase || '';
    var abs = function (u) { return /^https?:|^\//.test(u) ? u : base + u; };
    var lines = function (name) {
      return String(p(block, name, '') || '').split(/\r?\n/)
        .map(function (s) { return s.trim(); }).filter(Boolean);
    };
    var out = '';
    lines('css').forEach(function (u) {
      out += '<link rel="stylesheet" href="' + esc(abs(u)) + '">';
    });
    out += '<div class="custom-block" data-custom-block>' + html + '</div>';
    lines('js').forEach(function (u) {
      out += '<script src="' + esc(abs(u)) + '"><\/script>';
    });
    return out;
  }

  // Примечание/акцент (note): variant info|warning|success, title, text.
  function renderNote(block) {
    var v = p(block, 'variant', 'info');
    var t = p(block, 'title', '');
    var tx = p(block, 'text', '');
    return '<div class="note note--' + esc(v) + '">' +
      (t ? '<div class="note__title">' + esc(t) + '</div>' : '') +
      (tx ? '<div class="note__text">' + tx + '</div>' : '') +
      '</div>';
  }

  function renderBlock(block) {
    if (!block || !block.type) return '<div class="container">Пустой блок</div>';
    var def = RENDER[block.type];
    if (!def) return el('div', { class: 'container' }, 'Неизвестный тип: ' + esc(block.type));
    var inner = def.fn(block);
    /* Галочка «Блок страницы»: блок сам печатает H1 + хлебные крошки.
       На проде это делает движок (ph_<тип> + block/page_head_inner.html);
       здесь собираем то же самое в превью. */
    var ph = defBool(block, 'page_head', false);
    var phHidden = defBool(block, 'page_head_hidden', false);
    var phTitle = p(block, 'title', '') || p(block, 'header', '');
    /* Заголовок блока-страницы в превью может быть пустым — на проде его
       подставляет движок из domain_page.header. Чтобы не оставлять крошки
       без заголовка, в превью подставляем видимую заглушку. */
    if (ph && !phTitle && !phHidden) phTitle = 'Заголовок страницы';
    var pageHead = '';
    if (ph) {
      if (phHidden) {
        pageHead = '<h1 class="visually-hidden">' + esc(phTitle) + '</h1>';
      } else {
        var phT = phTitle;
        pageHead = '<div class="page-head">' +
          (phT ? '<h1 class="page-head__title">' + esc(phT) + '</h1>' : '') +
          '<nav class="breadcrumbs-wrap" aria-label="Навигация"><ol class="breadcrumbs">' +
            '<li class="breadcrumbs__item"><a href="/"><span>Главная</span></a></li>' +
            '<li class="breadcrumbs__item breadcrumbs__item--active"><span>' + esc(phT) + '</span></li>' +
          '</ol></nav>' +
          (p(block, 'sub', '') ? '<p class="page-head__sub">' + esc(p(block, 'sub')) + '</p>' : '') +
          '</div>';
      }
    }
    /* Raw-блоки (header/footer/slider/catalog/contact_form) идут мимо
       .section-обёртки. Заголовок блока-страницы подключают только те, кому
       он нужен: header (главная — скрытый H1) и catalog. Иначе блок без
       title выведет пустые крошки — как это было у slider на главной. */
    if (def.raw) {
      var rawWithHead = block.type === 'header' || block.type === 'catalog';
      return rawWithHead ? pageHead + inner : inner;
    }
    var classes = envelopeClasses(block).join(' ');
    var head = '';
    var hasHeaderParam = variantParams(block.type, block.variant).some(function (d) { return d.name === 'header'; });
    // Шапку рисуют компонентные блоки (catalog/goods) — index/renderBlock её
    // не дублируют. page_head уже печатает H1+sub — section-head тоже не нужен.
    var componentHead = (block.type === 'catalog' || block.type === 'goods');
    if (!ph && hasHeaderParam && !componentHead) {
      var hv = p(block, 'header');
      var sv = p(block, 'sub');
      if (hv || sv) {
        head = '<div class="section-head"><div>' +
          (hv ? '<h2 class="section-title">' + esc(hv) + '</h2>' : '') +
          (sv ? '<p class="section-sub">' + esc(sv) + '</p>' : '') +
          '</div></div>';
      }
    }
    var env = envelopeClasses(block).filter(function (c) { return c !== 'block'; });
    var clsArr = ['section'].concat(env);
    // Паритет с продом: каталог с заливкой (section--alt), page_head — section--page.
    if (block.type === 'catalog') clsArr.push('section--alt');
    if (ph) clsArr.push('section--page');
    var cls = clsArr.join(' ');
    return el('section', { class: cls, 'data-block-type': block.type }, el('div', { class: 'container' }, pageHead + head + inner));
  }

  function renderAll(blocks) {
    return (blocks || []).map(renderBlock).join('');
  }

  var api = {
    escapeHtml: esc, schema: schema, typeDef: typeDef, variantDef: variantDef,
    variantParams: variantParams, itemFields: itemFields, sampleItems: sampleItems,
    fillClass: fillClass, animClass: animClass, blockEnvelopeClasses: blockEnvelopeClasses, envelopeClasses: envelopeClasses,
    renderBlock: renderBlock, renderAll: renderAll
  };
  for (var k in api) { if (Object.prototype.hasOwnProperty.call(api, k)) PC[k] = api[k]; }
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
