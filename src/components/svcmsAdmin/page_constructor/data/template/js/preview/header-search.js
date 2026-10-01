/* ============================================================
   templates/t1/js/preview/header-search.js
   Компонент поиска с автокомплитом по товарам (строка поиска в шапке).

   Область применения: preview. Лежит в preview/, а не в js/components/,
   потому что дизайн шапки с поиском ещё не согласован — та же позиция,
   что в main_v2.html («инлайн, чтобы не плодить новые файлы в прод-папке
   до согласования дизайна»); прецедент клиентского модуля в preview —
   js/preview/forms.js. При переносе в релиз: файл → js/components/
   header-search.js, подключение → index.html (после js/app.js).

   КОНТРАКТ ЗАПРОСА
   ---------------
   Релиз:  GET /ajax/search/<слово>
           Ответ: { "list": [ { "id": 101, "header": "Смартфон X1 Pro",
                                "photo": "images/good/good_1_1.webp",
                                "url": "/catalog/.../smartfony-x1-pro/" } ] }
           (терпимо к голому массиву и к ключам items / LIST)
   Preview: инъекция <script src="js/preview/ajax_search.js?q=…&rid=…"> —
           файл публикует CustomEvent('t1:ajax-search',
           { detail: { rid, q, list } }); fetch из file:// заблокирован.

   Какая ветка используется — задаёт пропс dataUrl:
     - задан dataUrl → preview-инъекция (файл с данными);
     - не задан       → релизный fetch на /ajax/search/<слово>.
   Форма рабочая и без обвязки: обычный GET на action.

   ИСПОЛЬЗОВАНИЕ
   -------------
   1) Отдельным приложением (страница с витриной шапок):
        <div class="hdr__search"
             data-header-search
             data-url="js/preview/ajax_search.js"
             data-action="search.html"
             data-placeholder="Поиск по каталогу"></div>
        <script src="js/preview/header-search.js"></script>
      Приложение само найдёт все [data-header-search] на DOMContentLoaded.

   2) Частью другого приложения (шапка, где рядом корзина и избранное):
        Vue.createApp({
          components: { HeaderSearch: window.HeaderSearch },
          template: root.querySelector('template').innerHTML
        }).mount(root);
      в разметке шапки: <header-search data-url="…" action="search.html"
      placeholder="…"></header-search>

   Данные для проверки: js/preview/ajax_search.js.
   ============================================================ */
window.__T1_HEADER_SEARCH_VER = '2026-09-28-preview';

(function () {
  'use strict';

  var MIN_CHARS = 2;   /* сколько символов вводим до первого запроса */
  var DELAY = 300;     /* пауза после последнего нажатия клавиши, мс */
  var LIMIT = 8;       /* сколько подсказок показывать */

  var seq = 0;         /* сквозной счётчик экземпляров и запросов */

  /* Приводит запись сервера к { id, header, photo, url }.
     photo бывает строкой или массивом фото — берём первое. */
  function norm(item) {
    if (!item) return null;
    var header = String(item.header || '').trim();
    var url = String(item.url || '').trim();
    if (!header || !url) return null;

    var photo = item.photo;
    if (Array.isArray(photo)) photo = photo[0] || '';

    return {
      id: (item.id === undefined || item.id === null) ? '' : item.id,
      header: header,
      photo: String(photo || '').trim(),
      url: url
    };
  }

  window.HeaderSearch = {
    name: 'HeaderSearch',

    props: {
      dataUrl:     { type: String, default: '' },
      action:      { type: String, default: 'search.html' },
      placeholder: { type: String, default: 'Поиск по каталогу' },
      limit:       { type: Number, default: LIMIT },
      minChars:    { type: Number, default: MIN_CHARS },
      delay:       { type: Number, default: DELAY }
    },

    data: function () {
      seq += 1;
      return {
        uid: 'hs' + seq,
        q: '',
        items: [],
        open: false,
        loading: false,
        active: -1,
        _timer: null,
        _rid: '',
        _abort: null,
        _cancelPrev: null
      };
    },

    computed: {
      /* Ссылка «Все результаты» в подвале выпадашки */
      allHref: function () {
        return this.action + '?q=' + encodeURIComponent(this.q.trim());
      },
      listId: function () { return 'hs-list-' + this.uid; },
      /* Текст состояния — для скринридеров */
      status: function () {
        if (this.loading) return 'Ищем по запросу «' + this.q.trim() + '»';
        if (!this.open) return '';
        if (!this.items.length) return 'Ничего не найдено по запросу «' + this.q.trim() + '»';
        return 'Найдено подсказок: ' + this.items.length;
      }
    },

    mounted: function () {
      var vm = this;
      /* Клик вне — закрываем выпадашку */
      this._onDocClick = function (e) {
        if (vm.open && vm.$el && !vm.$el.contains(e.target)) vm.close();
      };
      document.addEventListener('click', this._onDocClick, true);
    },

    beforeUnmount: function () {
      if (this._timer) clearTimeout(this._timer);
      if (this._abort) this._abort.abort();
      if (this._onDocClick) {
        document.removeEventListener('click', this._onDocClick, true);
        this._onDocClick = null;
      }
    },

    methods: {
      /* --- Ввод ------------------------------------------------------------ */
      onInput: function () {
        var vm = this;
        vm.active = -1;
        vm.clearTimer();

        if (vm.q.trim().length < vm.minChars) {
          vm.reset();
          return;
        }
        vm._timer = setTimeout(function () { vm.request(); }, vm.delay);
      },

      /* Даём время на mousedown по подсказке */
      onBlur: function () {
        var vm = this;
        setTimeout(function () { vm.close(); }, 160);
      },

      onFocus: function () {
        if (this.items.length) this.open = true;
      },

      clear: function () {
        this.q = '';
        this.reset();
        var input = this.$el.querySelector('.hsearch__input');
        if (input) input.focus();
      },

      /* Снимает отложенный запрос (debounce), не трогая подсказки:
         нужен перед новым запросом, когда результаты старого ещё видны. */
      clearTimer: function () {
        if (this._timer) { clearTimeout(this._timer); this._timer = null; }
      },

      reset: function () {
        this.clearTimer();
        if (this._abort) { this._abort.abort(); this._abort = null; }
        this.items = [];
        this.open = false;
        this.loading = false;
        this.active = -1;
      },

      close: function () {
        this.open = false;
        this.active = -1;
      },

      /* --- Запрос ---------------------------------------------------------- */
      request: function () {
        var vm = this;
        var q = vm.q.trim();
        if (q.length < vm.minChars) return;

        vm.clearTimer();
        /* Незавершённый preview-запрос снимаем — иначе на странице
           копились бы слушатели при быстром наборе */
        if (vm._cancelPrev) { vm._cancelPrev(); vm._cancelPrev = null; }

        vm.loading = true;
        vm.active = -1;
        /* Выпадашка открывается сразу: иначе состояние «Ищем…» не видно
           (список выводится по v-show="open") */
        vm.open = true;
        vm._rid = 'r' + (++seq);

        if (vm.dataUrl) vm.requestPreview(q);
        else vm.requestRelease(q);
      },

      /* Preview: инъекция <script> — файл публикует t1:ajax-search */
      requestPreview: function (q) {
        var vm = this;
        var rid = vm._rid;
        var got = false;

        var listener = function (e) {
          var d = e.detail;
          if (!d || d.rid !== rid) return;
          done();
          vm.recv(d.list);
        };

        /* Снимаем слушатель и в ответе, и по таймауту — чтобы не копить их
           на странице, если файл с данными не пришёл вовсе. */
        function done() {
          if (got) return;
          got = true;
          window.removeEventListener('t1:ajax-search', listener);
          window.clearTimeout(guard);
          if (vm._cancelPrev === done) vm._cancelPrev = null;
        }

        var guard = window.setTimeout(function () {
          done();
          vm.fail();
        }, 8000);

        vm._cancelPrev = done;
        window.addEventListener('t1:ajax-search', listener);

        var s = document.createElement('script');
        /* data-url может уже содержать query (метка сброса кеша
           ?nocache=[]), поэтому разделитель выбираем, а не пишем '?' */
        s.src = vm.dataUrl +
                (vm.dataUrl.indexOf('?') === -1 ? '?' : '&') +
                'q=' + encodeURIComponent(q) +
                '&rid=' + encodeURIComponent(rid);
        s.onerror = function () {
          done();
          vm.fail();
        };
        document.head.appendChild(s);
      },

      /* Релиз: GET /ajax/search/<слово> */
      requestRelease: function (q) {
        var vm = this;
        var url = '/ajax/search/' + encodeURIComponent(q);

        if (typeof window.fetch !== 'function') {
          /* Совсем старый браузер: молча оставляем форму без подсказок */
          vm.fail();
          return;
        }

        if (typeof window.AbortController === 'undefined') {
          window.fetch(url)
            .then(function (r) { return r.json(); })
            .then(function (d) { vm.recv(d); })
            .catch(function () { vm.fail(); });
          return;
        }

        if (this._abort) this._abort.abort();
        this._abort = new window.AbortController();

        var self = this;
        window.fetch(url, { signal: this._abort.signal })
          .then(function (r) { return r.json(); })
          .then(function (d) { self.recv(d); })
          .catch(function (err) {
            if (err && err.name === 'AbortError') return; /* отменили сами */
            self.fail();
          });
      },

      recv: function (data) {
        var vm = this;
        var src = Array.isArray(data) ? data
                : (data && (data.list || data.items || data.LIST)) || [];
        var out = [];

        for (var i = 0; i < src.length && out.length < vm.limit; i++) {
          var item = norm(src[i]);
          if (item) out.push(item);
        }

        vm.items = out;
        vm.loading = false;
        vm.open = true;
        vm.active = -1;
      },

      fail: function () {
        /* Ответ не пришёл — просто не показываем выпадашку,
           форма продолжает работать обычным GET-запросом. */
        this.items = [];
        this.open = false;
        this.loading = false;
        this.active = -1;
      },

      /* --- Клавиатура ------------------------------------------------------ */
      move: function (step) {
        var n = this.items.length;
        if (!n) return;

        this.active += step;
        if (this.active < 0) this.active = n - 1;
        if (this.active >= n) this.active = 0;

        var vm = this;
        this.$nextTick(function () {
          var el = document.getElementById('hs-opt-' + vm.uid + '-' + vm.active);
          if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
        });
      },

      onKeydown: function (e) {
        var vm = this;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          if (!vm.items.length) return;
          e.preventDefault();
          vm.move(e.key === 'ArrowDown' ? 1 : -1);
        } else if (e.key === 'Escape') {
          vm.close();
        } else if (e.key === 'Enter' && vm.active >= 0 && vm.items[vm.active]) {
          /* Выбрана подсказка — идём на карточку товара */
          e.preventDefault();
          vm.go(vm.items[vm.active]);
        }
        /* Enter без выделенной подсказки — обычная отправка формы */
      },

      go: function (item) {
        if (!item || !item.url) return;
        window.location.href = item.url;
      }
    },

    template: `
<div class="hsearch">
  <form class="hsearch__form" :action="action" method="get" role="search">
    <svg class="hsearch__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5"></circle>
      <path d="M15.5 15.5L21 21" stroke-linecap="round"></path>
    </svg>

    <input class="hsearch__input" type="search" name="q"
           :placeholder="placeholder" autocomplete="off"
           :aria-label="'Поиск: ' + placeholder"
           :aria-controls="listId" aria-autocomplete="list"
           :aria-busy="loading ? 'true' : 'false'"
           :aria-expanded="open ? 'true' : 'false'"
           :aria-activedescendant="active >= 0 ? 'hs-opt-' + uid + '-' + active : null"
           v-model="q"
           @input="onInput" @keydown="onKeydown" @blur="onBlur" @focus="onFocus">

    <button class="hsearch__clear" type="button" v-show="q"
            aria-label="Очистить строку поиска" @click="clear">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
           aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"></path></svg>
    </button>

    <button class="hsearch__submit" type="submit">Найти</button>
  </form>

  <ul class="hsearch__list" :id="listId" role="listbox"
      aria-label="Подсказки поиска" v-show="open">
    <li class="hsearch__msg" v-if="loading" role="presentation">Ищем…</li>
    <li class="hsearch__msg" v-else-if="!items.length" role="presentation">
      Ничего не найдено — попробуйте другой запрос
    </li>
    <template v-else>
      <li class="hsearch__item" role="option" v-for="(it, i) in items" :key="it.id || i"
          :id="'hs-opt-' + uid + '-' + i"
          :class="{ 'is-active': i === active }"
          :aria-selected="i === active ? 'true' : 'false'"
          @mouseenter="active = i"
          @mousedown.prevent="go(it)">
        <img class="hsearch__photo" v-if="it.photo" :src="it.photo" :alt="it.header"
             width="40" height="40" loading="lazy">
        <span class="hsearch__name">{{ it.header }}</span>
      </li>
      <li class="hsearch__all" role="presentation">
        <a :href="allHref">Все результаты: «{{ q }}»</a>
      </li>
    </template>
  </ul>

  <span class="hsearch__status" role="status" aria-live="polite">{{ status }}</span>
</div>
`
  };

  /* ---------- Монтирование: все [data-header-search] на странице ---------- */
  function mountOne(el) {
    if (el.__t1HeaderSearch) return null;
    if (!window.Vue || !window.HeaderSearch) return null;
    el.__t1HeaderSearch = true;

    return window.Vue.createApp(window.HeaderSearch, {
      dataUrl: el.getAttribute('data-url') || '',
      action: el.getAttribute('data-action') || 'search.html',
      placeholder: el.getAttribute('data-placeholder') || 'Поиск по каталогу',
      limit: parseInt(el.getAttribute('data-limit'), 10) || LIMIT,
      minChars: parseInt(el.getAttribute('data-min-chars'), 10) || MIN_CHARS,
      delay: parseInt(el.getAttribute('data-delay'), 10) || DELAY
    }).mount(el);
  }

  /* Ручной вызов — например, когда корневой элемент создаёт другое приложение */
  window.initHeaderSearch = function (el, props) {
    if (!el || !window.Vue || !window.HeaderSearch) return null;
    return window.Vue.createApp(window.HeaderSearch, props || {}).mount(el);
  };

  document.addEventListener('DOMContentLoaded', function () {
    var nodes = document.querySelectorAll('[data-header-search]');
    for (var i = 0; i < nodes.length; i++) mountOne(nodes[i]);
  });
})();
