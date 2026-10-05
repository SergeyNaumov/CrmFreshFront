/* ============================================================
   Файл: templates/t1/js/components/carousel.js
   Назначение: универсальная карусель шаблона (ручная + автопрокрутка)
   и её авто-инициализация. Вынесена из app.js, чтобы переиспользовать
   на страницах без Vue/app.js (например, all_components.html).

   Разметка:
     <div class="carousel carousel--side" data-autoplay="3500">
       <div class="carousel__track">
         <div class="carousel__item">…</div>
         …
       </div>
       <div class="carousel__nav">
         <button class="carousel__btn carousel__prev" …>
         <button class="carousel__btn carousel__next" …>
       </div>
     </div>

   SiteCarousel.init(root, autoplayMs)
   - root — элемент-обёртка с .carousel__track / .carousel__prev / .carousel__next
   - autoplayMs — интервал автопрокрутки (мс); если передан, лента
     листается сама, но после первого клика по стрелкам автопрокрутка
     останавливается навсегда и листание — только по кнопкам.

   Авто-инициализация: на DOMContentLoaded подхватываются все .carousel
   страницы (интервал берётся из data-autoplay). Динамически созданные
   карусели (например, goods-block.js) инициализируют себя сами через
   window.SiteCarousel.init.
   ============================================================ */
window.SiteCarousel = {
  init: function (root, autoplayMs) {
    var track = root.querySelector('.carousel__track');
    var prev = root.querySelector('.carousel__prev');
    var next = root.querySelector('.carousel__next');
    if (!track || !prev || !next) return;

    var timer = null;
    var stopped = false;

    function stepWidth() {
      var item = track.querySelector('.carousel__item');
      return item ? item.getBoundingClientRect().width + 22 : 0; // + gap
    }

    function step(dir) {
      var w = stepWidth();
      if (!w) return;
      var maxScroll = track.scrollWidth - track.clientWidth;
      var target = track.scrollLeft + dir * w;
      /* Зацикливание в обе стороны: упёрлись в конец — начинаем сначала,
         упёрлись в начало — переходим на последний шаг. */
      if (target >= maxScroll - 1) target = 0;
      else if (target <= 0) target = maxScroll;
      track.scrollTo({ left: target, behavior: 'smooth' });
    }

    function stopAutoplay() {
      if (timer) { clearInterval(timer); timer = null; }
      stopped = true;
    }

    prev.addEventListener('click', function () { stopAutoplay(); step(-1); });
    next.addEventListener('click', function () { stopAutoplay(); step(1); });

    /* ---------- Перетаскивание мышью (drag & drop) ----------
       Работает по pointer events только для мыши (pointerType 'mouse'):
       touch использует нативную прокрутку + scroll-snap.
       При драге на время отключается scroll-snap (класс is-dragging),
       чтобы лента вела себя как «липкая бумага», а не дёргалась по точкам. */
    var startX = 0;
    var startLeft = 0;
    var dragPointer = null;
    var dragged = false;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      dragPointer = e.pointerId;
      dragged = false;
      // ВАЖНО: не вызываем setPointerCapture здесь. Захват указателя на
      // pointerdown перенаправляет pointerup на саму ленту, и браузер
      // синтезирует click по .carousel__track, а не по кнопке/ссылке внутри
      // карточки — тогда @click (сердечко, «В корзину») не срабатывает.
      // Захватываем указатель только когда драг реально начался (pointermove).
    });

    track.addEventListener('pointermove', function (e) {
      if (e.pointerId !== dragPointer) return;
      var dx = e.clientX - startX;
      if (!dragged && Math.abs(dx) > 6) {
        dragged = true;
        track.classList.add('is-dragging');
        stopAutoplay();
        // Захват на время драга — чтобы не терять события за пределами ленты
        try { track.setPointerCapture(e.pointerId); } catch (err) {}
      }
      if (dragged) {
        e.preventDefault();
        track.scrollLeft = startLeft - dx;
      }
    });

    function endDrag(e) {
      if (e.pointerId !== dragPointer) return;
      dragPointer = null;
      track.classList.remove('is-dragging');
      if (dragged) {
        try { track.releasePointerCapture(e.pointerId); } catch (err) {}
        suppressPostDragClick();
        settle();
      }
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);

    // Первый клик сразу после драга не должен открывать карточку-ссылку.
    // Кнопки (сердечко, «В корзину») и поля ввода не подавляем НИКОГДА:
    // реальный клик мышью — это pointerdown→pointermove→pointerup, и микро-шевеление
    // курсора на пару пикселей превращает его в «драг», а старый код гасил
    // следующий клик по кнопке. Подавляем только ссылку карточки и только
    // в коротком окне после отпускания драга.
    function suppressPostDragClick() {
      var until = Date.now() + 350;
      var onCapture = function (e) {
        document.removeEventListener('click', onCapture, true);
        if (Date.now() > until) return; // окно драга истекло — клик обычный
        var el = e.target && e.target.closest
          ? e.target.closest('a, button, input, select, textarea, [role="button"]')
          : null;
        if (el && el.tagName !== 'A') return; // интерактивные элементы не трогаем
        e.preventDefault();
        e.stopImmediatePropagation();
      };
      document.addEventListener('click', onCapture, true);
    }

    // Плавное прилипание к ближайшему элементу после отпускания
    function settle() {
      var w = stepWidth();
      if (!w) return;
      var snap = Math.round(track.scrollLeft / w) * w;
      snap = Math.min(snap, track.scrollWidth - track.clientWidth);
      track.scrollTo({ left: snap, behavior: 'smooth' });
    }

    if (autoplayMs) {
      timer = setInterval(function () { step(1); }, autoplayMs);
    }
  }
};

/* ---------- Авто-инициализация статических каруселей ---------- */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.carousel').forEach(function (wrap) {
    var autoplay = Number(wrap.getAttribute('data-autoplay')) || 0;
    window.SiteCarousel.init(wrap, autoplay);
  });
});
