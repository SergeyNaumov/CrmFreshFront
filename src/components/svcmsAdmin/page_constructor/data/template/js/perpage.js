/* ============================================================
   Файл: templates/t1/js/perpage.js
   Компонент «Расстраничивание» (пагинация) для Vue-приложения
   страницы «Список товаров» (js/good_list.js).

   Является ОТДЕЛЬНОЙ переиспользуемой component-unit: подключается
   в приложение через
     components: { Perpage: window.Perpage }
   и используется в шаблоне как
     <perpage :page="page" :pages="pages" @go="goPage"></perpage>

   Props:
     - page   number  текущая страница (1-based)
     - pages  number  всего страниц

   События:
     - go(page) — запрос перехода на страницу page (clamp внутри).
       Родитель сам меняет .page и обновляет URL (?page=N).

   Компонент ничего не знает о данных и URL — только рисует кнопки.

   Версия: 
   ============================================================ */
// Метка версии: в консоли `__T1_PER_PAGE_VER` покажет актуальную,
// иначе — старый файл.
window.__T1_PER_PAGE_VER = '2026-09-17';

window.Perpage = {
  name: 'Perpage',
  props: {
    page:  { type: Number, default: 1 },
    pages: { type: Number, default: 1 }
  },
  emits: ['go'],

  computed: {
    // Список элементов: числа (страницы) и null (многоточие)
    list: function () {
      var pages = this.pages || 1;
      var page = Math.min(Math.max(Number(this.page) || 1, 1), pages);
      if (pages <= 7) {
        var all = [];
        for (var i = 1; i <= pages; i++) all.push(i);
        return all;
      }
      // Окно вокруг текущей страницы с многоточиями по краям
      var out = [1];
      var start = Math.max(2, page - 1);
      var end = Math.min(pages - 1, page + 1);
      if (start > 2) out.push(null);
      for (var j = start; j <= end; j++) out.push(j);
      if (end < pages - 1) out.push(null);
      out.push(pages);
      return out;
    }
  },

  methods: {
    go: function (n) {
      n = Number(n);
      if (n < 1 || n > this.pages || n === this.page) return;
      this.$emit('go', n);
    }
  },

  template: `
<nav class="gl-pagination" aria-label="Навигация по страницам">
  <ul class="pagination m-0">
    <li class="page-item" :class="{ disabled: page <= 1 }">
      <button class="page-link" type="button" aria-label="Предыдущая страница"
              :aria-disabled="page <= 1" @click="go(page - 1)">
        <svg class="icon icon-chevron-left" aria-hidden="true"><use href="#i-chevron-left"></use></svg>
      </button>
    </li>
    <li v-for="(p, idx) in list" :key="p === null ? 'dot' + idx : p"
        class="page-item" :class="{ active: p === page, disabled: p === null }">
      <button v-if="p !== null" class="page-link" type="button"
              :aria-current="p === page ? 'page' : null"
              @click="go(p)">{{ p }}</button>
      <span v-else class="page-link" aria-hidden="true">…</span>
    </li>
    <li class="page-item" :class="{ disabled: page >= pages }">
      <button class="page-link" type="button" aria-label="Следующая страница"
              :aria-disabled="page >= pages" @click="go(page + 1)">
        <svg class="icon icon-chevron-right" aria-hidden="true"><use href="#i-chevron-right"></use></svg>
      </button>
    </li>
  </ul>
</nav>`
};