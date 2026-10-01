/* ============================================================
   Файл: templates/t1/js/requisites-pdf.js
   Кнопка «Скачать реквизиты» на page/contacts.html: формирует PDF
   из таблицы .requisites-table прямо в браузере (jsPDF + собственный
   кириллический шрифт). Библиотека и шрифт грузятся ЛЕНИВО — только
   при первом клике, поэтому страница контактов их не тянет зря.

   Разметка кнопки:
     <button class="js-requisites-pdf" data-org="..." data-title="...">
   Берёт строки из первой таблицы .requisites-table на странице.

   Запасной путь: если jsPDF/шрифт не загрузились — window.print().
   ============================================================ */
window.__SVCMS_REQUISITES_PDF_VER = '2026-09-29';

(function () {
  'use strict';

  // Каталог, из которого загружен этот скрипт (js/ и в preview, и в проде —
  // плоский, но prod подключает как [[TEMPLATE_FOLDER]]/js/...).
  var SELF = document.currentScript;
  var BASE = SELF && SELF.src ? SELF.src.replace(/requisites-pdf\.js.*$/, '') : 'js/';

  var loading = null; // промис однократной загрузки jsPDF + шрифта

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Не загрузился ' + src)); };
      document.head.appendChild(s);
    });
  }

  function loadDeps() {
    if (loading) return loading;
    loading = loadScript(BASE + 'jspdf.umd.min.js')
      .then(function () { return loadScript(BASE + 'pdf_font.js'); })
      .then(function () {
        if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('jsPDF недоступен');
        if (!window.SVCMS_PDF_FONT || !window.SVCMS_PDF_FONT.b64) throw new Error('PDF-шрифт недоступен');
      });
    return loading;
  }

  function readRows() {
    var table = document.querySelector('.requisites-table');
    if (!table) return [];
    var rows = [];
    table.querySelectorAll('tr').forEach(function (tr) {
      var cells = tr.querySelectorAll('td, th');
      if (cells.length < 2) return;
      rows.push([cells[0].textContent.trim(), cells[1].textContent.trim()]);
    });
    return rows;
  }

  function ruDate(d) {
    var m = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
             'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear();
  }

  function slug(s) {
    return (s || 'rekvizity').toLowerCase()
      .replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'rekvizity';
  }

  function build(btn) {
    var font = window.SVCMS_PDF_FONT;
    var jsPDF = window.jspdf.jsPDF;
    var rows = readRows();
    var title = btn.getAttribute('data-title') || (document.querySelector('.requisites h2')
      ? document.querySelector('.requisites h2').textContent.trim() : 'Реквизиты');
    var org = btn.getAttribute('data-org') || '';

    var doc = new jsPDF({ unit: 'mm', format: 'a4' });
    doc.addFileToVFS(font.file, font.b64);
    doc.addFont(font.file, font.family, 'normal');
    doc.setFont(font.family, 'normal');

    var M = 18, W = 210, H = 297, CW = W - M * 2;
    var KEY_W = 66, y = M;
    var line = 0.6;

    // Шапка документа
    doc.setFontSize(17);
    doc.text(title, M, y); y += 8;
    if (org) { doc.setFontSize(11); doc.text(org, M, y); y += 5.5; }
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('Документ сформирован ' + ruDate(new Date()), M, y);
    doc.setTextColor(0);
    y += 3;
    doc.setDrawColor(210); doc.line(M, y, W - M, y); y += 7;

    // Таблица: ключ (серая подложка) + значение
    doc.setFontSize(10.5);
    rows.forEach(function (row) {
      var valueLines = doc.splitTextToSize(row[1], CW - KEY_W - 6);
      var blockH = Math.max(valueLines.length * 5, 5) + 4;

      if (y + blockH > H - M - 6) { // перенос страницы
        doc.addPage();
        y = M;
      }

      doc.setFillColor(244, 246, 248);
      doc.rect(M, y - 4, KEY_W, blockH, 'F');
      doc.setTextColor(110);
      doc.text(doc.splitTextToSize(row[0], KEY_W - 4), M + 2, y);
      doc.setTextColor(20);
      doc.text(valueLines, M + KEY_W + 4, y);
      y += blockH;
    });

    // Нумерация страниц
    var pages = doc.getNumberOfPages();
    for (var p = 1; p <= pages; p++) {
      doc.setPage(p);
      doc.setFontSize(8); doc.setTextColor(150);
      doc.text(String(p) + ' / ' + pages, W - M, H - M + 4, { align: 'right' });
    }

    doc.save((org ? slug(org) + '-' : '') + 'rekvizity.pdf');
  }

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.js-requisites-pdf') : null;
    if (!btn || btn.disabled) return;
    e.preventDefault();

    var old = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Готовим PDF…';

    loadDeps().then(function () {
      build(btn);
    }).catch(function (err) {
      if (window.console) console.error('requisites-pdf:', err);
      // Запасной путь — печать страницы (пользователь сохранит в PDF сам).
      window.print();
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = old;
    });
  });
})();
