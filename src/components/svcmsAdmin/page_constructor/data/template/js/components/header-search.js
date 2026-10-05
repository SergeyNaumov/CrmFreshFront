/* ============================================================
   templates/t1/js/components/header-search.js
   Компонент поиска с автокомплитом (строка поиска в шапке, на
   /search и на 404). Самозапускается по [data-header-search],
   подключение — index.html (после js/app.js), стили — css/header-search.css.

   КОНТРАКТ ЗАПРОСА
   ---------------
   Релиз:  GET /ajax/search/<сущность>/<фраза>     (endpoint, по умолчанию
           товары — /ajax/search/good/; см. agent-doc/prod_contract/
           09_utility_services.md)
           Ответ: { "list": [ { "id": 3, "header": "Ноутбук UltraBook 14",
                                "photo": "/files/…/good_3_1.webp",
                                "url": "/good/Noutbuk-UltraBook-14" } ],
                     "more": false }
           (терпимо к голому массиву и к ключам items / LIST)
   Preview: инъекция <script src="js/preview/ajax_search.js?q=…&rid=…"> —
           файл публикует CustomEvent('t1:ajax-search',
           { detail: { rid, q, list } }); fetch из file:// заблокирован.

   Какая ветка используется — задаёт пропс dataUrl:
     - задан dataUrl → preview-инъекция (файл с данными);
     - не задан       → релизный fetch на endpoint.

   СТРАНИЦА РЕЗУЛЬТАТОВ
   -------------------
   Отправка формы и ссылка «Все результаты» ведут на searchBase/<фраза>
   (по умолчанию /search/<фраза>) — ЧПУ-адрес страницы поиска.
   Без JS форма отработает обычным GET на action (/search?q=… — такой
   вариант бэкенд тоже принимает).

   ИСПОЛЬЗОВАНИЕ
   -------------
   1) Отдельным приложением (как в шапке):
        <div class="header__search" data-header-search
             data-placeholder="Поиск по каталогу"
             data-value="ноутбук"></div>

   2) Частью другого приложения (шапка, где рядом корзина и избранное):
        Vue.createApp({
          components: { HeaderSearch: window.HeaderSearch },
          template: root.querySelector('template').innerHTML
        }).mount(root);
      в разметке шапки: <header-search value="…" placeholder="…"></header-search>

   Данные для проверки в preview: js/preview/ajax_search.js.
   ============================================================ */
window.__T1_HEADER_SEARCH_VER = '2026-10-03-release';

(function () {
  'use strict';

  var MIN_CHARS = 2;   /* сколько символов вводим до первого запроса */
  var DELAY = 300;     /* пауза после последнего нажатия клавиши, мс */
  var LIMIT = 8;       /* сколько подсказок показывать */

  var ENDPOINT = '/ajax/search/good/';  /* сущность подсказок в шапке */
  var SEARCH_BASE = '/search';          /* ЧПУ-страница результатов */
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
      endpoint:    { type: String, default: ENDPOINT },
      searchBase:  { type: String, default: SEARCH_BASE },
      action:      { type: String, default: SEARCH_BASE },
      placeholder: { type: String, default: 'Поиск по каталогу' },
      value:       { type: String, default: '' },
      /* Фразы для эффекта печати в placeholder (параметр шапки search_hints).
         Пустой массив — эффект выключен, остаётся обычный placeholder. */
      hints:       { type: Array, default: function () { return []; } },
      typeSpeed:   { type: Number, default: 85 },
      deleteSpeed: { type: Number, default: 45 },
      holdTime:    { type: Number, default: 1600 },
      limit:       { type: Number, default: LIMIT },
      minChars:    { type: Number, default: MIN_CHARS },
      delay:       { type: Number, default: DELAY }
    },

    data: function () {
      seq += 1;
      return {
        uid: 'hs' + seq,
        q: (this.value || '').trim(),
        items: [],
        open: false,
        loading: false,
        active: -1,
        /* Эффект печати: печатаемая фраза и таймер */
        typed: '',
        typing: false,
        _timer: null,
        _rid: '',
        _abort: null,
        _cancelPrev: null
      };
    },

    computed: {
      /* Ссылка «Все результаты» в подвале выпадашки — ЧПУ-страница поиска */
      allHref: function () {
        return this.searchPath(this.q.trim());
      },
      listId: function () { return 'hs-list-' + this.uid; },
      /* Текст placeholder: печатаемая фраза, когда поле пустое и не в фокусе,
         иначе исходный подсказчик. Печатаем через :placeholder, значение поля
         при этом остаётся пустым — так что подсказка не мешает вводу. */
      shownPlaceholder: function () {
        if (this.typing) return this.typed;
        return this.placeholder;
      },
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

      /* Эффект печати — только для пустого поля. На странице поиска в поле уже
         подставлена готовая фраза (data-value), печатать нечего. */
      if (!this.q) this.startTyping();
    },

    beforeUnmount: function () {
      if (this._timer) clearTimeout(this._timer);
      if (this._typeTimer) clearTimeout(this._typeTimer);
      if (this._abort) this._abort.abort();
      if (this._onDocClick) {
        document.removeEventListener('click', this._onDocClick, true);
        this._onDocClick = null;
      }
    },

    methods: {
      /* --- Куда ведёт поиск ----------------------------------------------------
         /search/<фраза> (фраза в URL-кодировке). Пустая фраза — на /search. */
      searchPath: function (q) {
        var base = String(this.searchBase || SEARCH_BASE).replace(/\/+$/, '');
        var query = String(q || '').trim();
        return query ? base + '/' + encodeURIComponent(query) : base;
      },

      /* Отправка формы: путь, а не ?q= (без JS сработает обычный GET на action) */
      submit: function () {
        window.location.href = this.searchPath(this.q);
      },

      /* --- Ввод ------------------------------------------------------------ */
      onInput: function () {
        var vm = this;
        vm.active = -1;
        vm.clearTimer();
        /* Пользователь печатает сам — эффект печати в placeholder не нужен. */
        vm.stopTyping();

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
        /* Печать в placeholder останавливается, когда пользователь начал ввод. */
        this.stopTyping();
        if (this.items.length) this.open = true;
      },

      /* --- Эффект печати в placeholder --------------------------------------
         Фразы берутся из props.hints (параметр шапки search_hints).
         Печать идёт посимвольно: набор → пауза → стирание → следующая фраза.
         Любой ввод, фокус или очистка останавливают эффект. */
      startTyping: function () {
        var vm = this;
        var hints = (vm.hints || []).filter(function (h) { return h && String(h).trim(); });
        if (!hints.length) return;

        var idx = 0;
        var chars = 0;
        var erasing = false;

        vm.stopTyping();
        vm.typing = true;
        vm.typed = '';

        function step() {
          var word = String(hints[idx]);
          if (!erasing) {
            chars += 1;
            vm.typed = word.slice(0, chars);
            if (chars >= word.length) {
              erasing = true;
              vm._typeTimer = setTimeout(step, vm.holdTime);
              return;
            }
          } else {
            vm.typed = word.slice(0, Math.max(0, chars - 1));
            chars -= 1;
            if (chars <= 0) {
              erasing = false;
              idx = (idx + 1) % hints.length;
              vm._typeTimer = setTimeout(step, 350);
              return;
            }
          }
          vm._typeTimer = setTimeout(step, erasing ? vm.deleteSpeed : vm.typeSpeed);
        }

        vm._typeTimer = setTimeout(step, 400);
      },

      stopTyping: function () {
        if (this._typeTimer) { clearTimeout(this._typeTimer); this._typeTimer = null; }
        this.typing = false;
        this.typed = '';
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

      /* Релиз: GET /ajax/search/<сущность>/<фраза> */
      requestRelease: function (q) {
        var vm = this;
        var base = String(vm.endpoint || ENDPOINT);
        if (base.charAt(base.length - 1) !== '/') base += '/';
        var url = base + encodeURIComponent(q);

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
  <form class="hsearch__form" :action="action" method="get" role="search" @submit.prevent="submit">
    <svg class="hsearch__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5"></circle>
      <path d="M15.5 15.5L21 21" stroke-linecap="round"></path>
    </svg>

    <input class="hsearch__input" type="search" name="q"
           :placeholder="shownPlaceholder" autocomplete="off"
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

  /* Фразы для печати: data-hints="ноутбук|игровой ноутбук|смартфон"
     Разделители: | , реальный перевод строки (фразы из конструктора) и
     литерал "\n" — на случай, если значение сохранилось как escape-последовательность
     (иначе все фразы склеились бы в одну и печатались с символами \n). */
  function parseHints(raw) {
    if (!raw) return [];
    var s = String(raw).trim();
    if (!s) return [];
    if (s.charAt(0) === '[') {
      try {
        var arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.filter(function (h) { return h && String(h).trim(); });
      } catch (e) { /* не JSON — читаем как список */
      }
    }
    return s.split(/[|\r\n]+|\\+[nN]/).map(function (h) { return h.trim(); })
            .filter(function (h) { return h; });
  }

  function mountOne(el) {
    if (el.__t1HeaderSearch) return null;
    if (!window.Vue || !window.HeaderSearch) return null;
    el.__t1HeaderSearch = true;

    return window.Vue.createApp(window.HeaderSearch, {
      dataUrl: el.getAttribute('data-url') || '',
      endpoint: el.getAttribute('data-endpoint') || ENDPOINT,
      searchBase: el.getAttribute('data-search-base') || SEARCH_BASE,
      action: el.getAttribute('data-action') || SEARCH_BASE,
      placeholder: el.getAttribute('data-placeholder') || 'Поиск по каталогу',
      value: el.getAttribute('data-value') || '',
      /* Фразы для печати в placeholder: data-hints="фраза1|фраза2|…" */
      hints: parseHints(el.getAttribute('data-hints')),
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
