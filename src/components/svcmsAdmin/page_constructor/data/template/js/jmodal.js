/* ============================================================
   Файл: templates/t1/js/jmodal.js
   Попапы форм (js/forms.js, карточка товара, страница услуги).

   Важно: модалка может оказаться вложена в блок с scroll-анимацией
   (.block--anim-*, animation-timeline: view() с fill-mode: both).
   Пока у блока есть transform, он становится containing block для
   position: fixed — оверлей уезжает за пределы экрана, диалог обрезается,
   а прокрутка не работает (body заблокирован). Поэтому при открытии
   модалка переносится в <body>.
   ============================================================ */
function jmodalOpen(id) {
    const modal = document.getElementById(id);
    if (!modal) return;

    modal.style.display = 'flex';
    // Диалог всегда открываем сверху, а не с середины остатка.
    const dialog = modal.querySelector('.jmodal__dialog');
    if (dialog) dialog.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    modal.setAttribute('aria-hidden', 'false');
    const focusable = modal.querySelector('input:not([type=hidden]), select, textarea, button:not(.jmodal__close)');
    if (focusable) setTimeout(function () { focusable.focus({ preventScroll: true }); }, 30);
}

function jmodalClose(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', function () {
    /* Все попапы сразу переносим в <body>: блок с scroll-анимацией
       (animation-timeline: view(), transform) становится containing block
       для position:fixed, и оверлей уезжает за экран — форма обрезается и
       не прокручивается. Перенос делаем на загрузке, а не при открытии,
       чтобы не трогать смонтированные Vue-приложения форм. */
    document.querySelectorAll('.jmodal').forEach(function (modal) {
        if (modal.parentNode !== document.body) document.body.appendChild(modal);
    });

    document.querySelectorAll('[data-jmodal-open]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            jmodalOpen(this.getAttribute('data-jmodal-open'));
        });
    });
    document.querySelectorAll('[data-jmodal-close]').forEach(function (closeBtn) {
        closeBtn.addEventListener('click', function () {
            jmodalClose(this.closest('.jmodal').id);
        });
    });
    window.addEventListener('click', function (e) {
        if (e.target.classList.contains('jmodal')) {
            jmodalClose(e.target.id);
        }
    });
    // Escape закрывает верхнюю открытую модалку.
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        const open = document.querySelectorAll('.jmodal[style*="display: flex"], .jmodal[aria-hidden="false"]');
        for (let i = open.length - 1; i >= 0; i--) {
            if (open[i].style.display === 'flex') { jmodalClose(open[i].id); break; }
        }
    });
});