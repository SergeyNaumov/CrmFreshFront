/* ============================================================
   Файл: templates/t1/js/goods_blocks.js
   Драйвер товарных блоков: находит все <goods-block> в разметке
   и монтирует на каждый ОТДЕЛЬНОЕ Vue-приложение (тонкий app).
   Подключается ПОСЛЕ js/components/goods-block.js и js/app.js.

   Прокидывает в компонент атрибуты элемента:
     data-id / id, data-url, autoplay, data-show, data-variant, data-cols,
     data-limit, data-step, data-selection, data-types, data-badges,
     data-animation, data-title, data-sub, data-link-text, data-link-href,
     data-arrows.
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  if (!window.GoodsBlock || !window.Vue) return;

  var num = function (v) {
    var n = parseFloat(v);
    return isFinite(n) ? n : 0;
  };

  var bool = function (v) {
    if (v === null || v === undefined || v === '') return undefined;
    return v !== 'false' && v !== '0';
  };

  var blocks = document.querySelectorAll('goods-block');
  for (var i = 0; i < blocks.length; i++) {
    var el = blocks[i];
    var url = el.getAttribute('data-url');
    if (!url) continue;

    Vue.createApp(window.GoodsBlock, {
      dataId: el.id || el.getAttribute('data-id') || '',
      dataUrl: url,
      autoplay: num(el.getAttribute('autoplay')),
      show: el.getAttribute('data-show') || '',
      variant: el.getAttribute('data-variant') || 'carousel',
      cols: num(el.getAttribute('data-cols')),
      limit: num(el.getAttribute('data-limit')),
      step: num(el.getAttribute('data-step')),
      selection: el.getAttribute('data-selection') || 'all',
      badges: el.getAttribute('data-badges') || 'text',
      types: el.hasAttribute('data-types') ? num(el.getAttribute('data-types')) : -1,
      animation: el.getAttribute('data-animation') || 'none',
      title: el.getAttribute('data-title') || '',
      sub: el.getAttribute('data-sub') || '',
      linkText: el.getAttribute('data-link-text') || '',
      linkHref: el.getAttribute('data-link-href') || '',
      arrows: bool(el.getAttribute('data-arrows')) !== undefined
        ? bool(el.getAttribute('data-arrows'))
        : true
    }).mount(el);
  }
});