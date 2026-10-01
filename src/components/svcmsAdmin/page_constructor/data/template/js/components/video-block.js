/* ============================================================
   Файл: js/components/video-block.js
   Назначение: видео-блок (RuTube) — ленивый click-to-play.

   1) Server-rendered разметка (prod): клик по [data-video-play]
      заменяет ближайший [data-video-media] на iframe RuTube.
   2) Preview-режим: контейнер [data-video-block][data-video-src]
      подгружает JSON со списком {id, title, url} и сам строит
      карточки (постер и плеер — из id).
   3) Вид feature: клик по плейлисту переключает плеер.
   Вид carousel инициализирует общий js/components/carousel.js.

   Постер: https://rutube.ru/api/video/<id>/thumbnail/?redirect=1
   Плеер:  https://rutube.ru/play/embed/<id>/?autoStart=true
   ============================================================ */
(function () {
  'use strict';

  var EMBED = 'https://rutube.ru/play/embed/';
  var THUMB = 'https://rutube.ru/api/video/';
  var PH = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22320%22%20height%3D%22180%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23e9edf6%22%2F%3E%3C%2Fsvg%3E';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function thumbUrl(id) { return id ? THUMB + encodeURIComponent(id) + '/thumbnail/?redirect=1' : PH; }
  function embedUrl(el) {
    var url = el.getAttribute('data-video-url');
    if (url) return url;
    var id = el.getAttribute('data-video-id');
    return id ? EMBED + encodeURIComponent(id) + '/?autoStart=true' : '';
  }
  function pimg(v, cls) {
    return '<img' + (cls ? ' class="' + cls + '"' : '') + ' src="' + esc(thumbUrl(v.id)) +
      '" alt="" loading="lazy" onerror="this.onerror=null;this.src=\'' + PH + '\'">';
  }

  // ---------- click-to-play ----------
  function makeIframe(title, url) {
    var f = document.createElement('iframe');
    f.className = 'video-iframe';
    f.src = url;
    f.setAttribute('allow', 'clipboard-write; autoplay; fullscreen; picture-in-picture');
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('frameborder', '0');
    f.setAttribute('title', title || 'Видео');
    return f;
  }
  function mount(media, el) {
    var url = embedUrl(el);
    if (!url || !media) return;
    media.removeAttribute('data-video-media');
    media.innerHTML = '';
    media.appendChild(makeIframe(el.getAttribute('aria-label'), url));
  }
  function play(btn) {
    var media = btn.closest('[data-video-media]');
    if (media) mount(media, btn);
  }

  function initFeature(root) {
    if (root.__videoFeat) return;
    root.__videoFeat = true;
    root.addEventListener('click', function (e) {
      var item = e.target.closest('.video-feature__item');
      if (!item || !root.contains(item)) return;
      e.preventDefault();
      var url = embedUrl(item);
      if (!url) return;
      root.querySelectorAll('.video-feature__item').forEach(function (n) {
        n.classList.toggle('is-active', n === item);
      });
      var wrap = root.querySelector('.video-feature__player');
      if (!wrap) return;
      var iframe = wrap.querySelector('.video-iframe');
      if (iframe) { iframe.src = url; return; }
      var img = wrap.querySelector('img');
      var thumb = item.getAttribute('data-video-thumb');
      if (img && thumb) img.src = thumb;
      var btn = wrap.querySelector('[data-video-play]');
      if (btn) { btn.setAttribute('data-video-id', item.getAttribute('data-video-id') || ''); btn.removeAttribute('data-video-url'); mount(btn.closest('[data-video-media]'), btn); }
    });
  }

  // ---------- client render (preview: fetch JSON) ----------
  function cardHtml(v) {
    return '<article class="video-card">' +
      '<div class="video-card__media" data-video-media>' + pimg(v, 'video-card__poster') +
      '<button class="video-card__playbtn" type="button" data-video-play data-video-id="' + esc(v.id) + '" aria-label="Смотреть видео: ' + esc(v.title) + '">' +
      '<span class="video-card__play" aria-hidden="true">' + PLAY + '</span>' +
      (v.duration ? '<span class="video-card__duration">' + esc(v.duration) + '</span>' : '') +
      '</button></div>' +
      '<div class="video-card__body">' +
      '<a class="video-card__title" href="' + esc(v.url || '#') + '" target="_blank" rel="noopener noreferrer">' + esc(v.title) + '</a>' +
      '<div class="video-card__meta">RuTube' + (v.duration ? ' · ' + esc(v.duration) : '') + '</div>' +
      '</div></article>';
  }

  function renderVariant(root, variant, list, opts) {
    opts = opts || {};
    var nav = '<div class="carousel__nav"><button class="carousel__prev" type="button" aria-label="Предыдущее видео"></button>' +
      '<button class="carousel__next" type="button" aria-label="Следующее видео"></button></div>';
    if (variant === 'grid') {
      root.innerHTML = '<div class="video-grid" style="--video-cols:' + esc(opts.cols || 3) + '">' + list.map(cardHtml).join('') + '</div>';
      return;
    }
    if (variant === 'feature') {
      var first = list[0] || {};
      var player = '<div class="video-feature__player"><div class="video-feature__media" data-video-media>' + pimg(first, '') +
        '<button class="video-card__playbtn" type="button" data-video-play data-video-id="' + esc(first.id) + '" aria-label="Смотреть видео: ' + esc(first.title) + '">' +
        '<span class="video-card__play" aria-hidden="true">' + PLAY + '</span></button></div></div>';
      var plist = '<div class="video-feature__list" role="list">' + list.map(function (v, i) {
        return '<button class="video-feature__item' + (i === 0 ? ' is-active' : '') + '" type="button" role="listitem" data-video-id="' + esc(v.id) + '" data-video-thumb="' + esc(thumbUrl(v.id)) + '">' +
          '<span class="video-feature__thumb">' + pimg(v, '') + '</span>' +
          '<span><span class="video-feature__item-title">' + esc(v.title) + '</span>' +
          '<span class="video-feature__item-meta">RuTube' + (v.duration ? ' · ' + esc(v.duration) : '') + '</span></span></button>';
      }).join('') + '</div>';
      root.innerHTML = '<div class="video-feature">' + player + plist + '</div>';
      return;
    }
    if (variant === 'cover') {
      var c = list[0] || {};
      root.innerHTML = '<div class="video-cover"><div class="video-cover__media" data-video-media>' + pimg(c, 'video-cover__poster') +
        '<button class="video-card__playbtn" type="button" data-video-play data-video-id="' + esc(c.id) + '" aria-label="Смотреть видео: ' + esc(c.title) + '">' +
        '<span class="video-card__play" aria-hidden="true">' + PLAY + '</span></button></div>' +
        '<div class="video-cover__body"><a class="video-cover__title" href="' + esc(c.url || '#') + '" target="_blank" rel="noopener noreferrer">' + esc(c.title) + '</a>' +
        '<div class="video-card__meta">RuTube' + (c.duration ? ' · ' + esc(c.duration) : '') + '</div></div></div>';
      return;
    }
    if (variant === 'strip') {
      root.innerHTML = '<div class="video-strip">' + list.map(function (v) {
        return '<button class="video-strip__item" type="button" data-video-play data-video-id="' + esc(v.id) + '" aria-label="Смотреть видео: ' + esc(v.title) + '">' +
          '<span class="video-strip__media" data-video-media>' + pimg(v, '') +
          '<span class="video-card__play" aria-hidden="true">' + PLAY + '</span>' +
          (v.duration ? '<span class="video-card__duration">' + esc(v.duration) + '</span>' : '') + '</span>' +
          '<span class="video-strip__title">' + esc(v.title) + '</span></button>';
      }).join('') + '</div>';
      return;
    }
    // carousel (default)
    root.innerHTML = '<div class="carousel carousel--side" data-carousel data-autoplay="' + esc(opts.autoplay || '0') + '">' +
      '<div class="carousel__track">' + list.map(function (v) { return '<div class="carousel__item">' + cardHtml(v) + '</div>'; }).join('') + '</div>' +
      nav + '</div>';
  }

  function finishRender(root, variant, list, opts) {
    if (!Array.isArray(list) || !list.length) return;
    renderVariant(root, variant, list, opts);
    if (variant === 'feature') initFeature(root);
    if (variant === 'carousel' && window.SiteCarousel && window.SiteCarousel.init) {
      var c = root.querySelector('.carousel');
      if (c) window.SiteCarousel.init(c, parseInt(opts.autoplay, 10) || 0);
    }
  }

  function initClientRender(root) {
    if (root.getAttribute('data-video-ready')) return;
    var name = root.getAttribute('data-video-list');
    var src = root.getAttribute('data-video-src');
    if (!name && !src) return;
    root.setAttribute('data-video-ready', '1');
    var variant = root.getAttribute('data-video-variant') || 'carousel';
    var opts = { cols: root.getAttribute('data-video-cols') || '3', autoplay: root.getAttribute('data-video-autoplay') || '0' };

    // 1) синхронно из глобала (работает на file://, без fetch)
    if (name && Array.isArray(window[name])) {
      finishRender(root, variant, window[name], opts);
      return;
    }
    // 2) фолбэк — fetch JSON (http)
    if (!src) return;
    fetch(src).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (list) {
      finishRender(root, variant, list, opts);
    }).catch(function () { /* нет сети/глобала — оставляем пусто */ });
  }

  function boot() {
    document.querySelectorAll('[data-video-block]').forEach(initClientRender);
    document.querySelectorAll('.video-block--feature').forEach(initFeature);
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-video-play]');
    if (!btn) return;
    if (e.target.closest('.video-feature__list')) return; // обрабатывает initFeature
    e.preventDefault();
    play(btn);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
