/* ============================================================
   templates/t1/js/components/catalog-block.js
   Vue-компонент блока «Каталог товаров».

   Предназначен для PREVIEW (t1). Разделов может быть сколько
   угодно — количество определяется списком data-url.

   В preview данные приходят из js-файла, который публикует
   событие `t1:catalog` с detail { id, list } (формат записи:
   { id, header, body, url, photo }). В релизной версии список
   вернёт сервер по адресу data-url (голый массив JSON).

   ПАРАМЕТРЫ (атрибуты <catalog-block>) — меняются при сборке,
   без правок JS/CSS:
     dataId    string  идентификатор данных (id компонента);
     dataUrl   string  путь к данным (обязательный);
     title     string  заголовок секции;
     sub       string  подзаголовок секции;
     linkText  string  текст ссылки «Весь каталог» (пусто — скрыть);
     linkHref  string  адрес ссылки;
     effect    string  эффект при наведении: flip | rise | zoom;
     enter     string  анимация при загрузке: rise | fade | none;
     cols      number  число колонок сетки на десктопе.

   ЭФФЕКТЫ (класс .cat-grid--<effect>):
     flip — карточка переворачивается (rotateY), сзади описание;
     rise — снизу «поднимается» панель с описанием, картинка едет;
     zoom — описание проявляется поверх затемнения, картинка зумится.
   ВХОД (класс .cat-enter--<enter>): каскадное появление карточек
   со стаггером (переменная --i) с момента рендера блока.

   МИКРОРАЗМЕТКА (Schema.org, microdata-формат): блок — это список
   ссылок на разделы, поэтому на саму разметку повешены атрибуты
   itemscope/itemtype: .cat-grid — ItemList, каждая карточка —
   ListItem (position/name/url). Разметка «живёт» в HTML блока,
   поэтому попадает в собранный шаблон целиком.
   ============================================================ */
window.CatalogBlock = {
  name: 'CatalogBlock',

  props: {
    dataId: { type: String, default: '' },
    dataUrl: { type: String, required: true },
    title: { type: String, default: 'Каталог товаров' },
    sub: { type: String, default: '' },
    linkText: { type: String, default: 'Весь каталог' },
    linkHref: { type: String, default: 'catalog_in.html' },
    effect: { type: String, default: 'flip' },
    enter: { type: String, default: 'rise' },
    cols: { type: Number, default: 3 }
  },

  data: function () {
    return {
      cats: [],
      loading: true,
      error: false,
      _received: false
    };
  },

  computed: {
    subParas: function () {
      return (this.sub || '').split('\n').filter(function (t) { return t.trim() !== ''; });
    }
  },

  created: function () {
    this.load();
  },

  methods: {
    load: function () {
      var vm = this;

      if (/\.json$/i.test(vm.dataUrl)) {
        fetch(vm.dataUrl)
          .then(function (r) { return r.json(); })
          .then(function (list) { vm.recv(list); })
          .catch(function () { vm.fail(); });
        return;
      }

      // Preview: js-файл при исполнении публикует событие t1:catalog
      var listener = function (e) {
        var d = e.detail;
        if (!d || d.id !== vm.dataId) return;
        window.removeEventListener('t1:catalog', listener);
        vm.recv(d.list || []);
      };
      window.addEventListener('t1:catalog', listener);

      var s = document.createElement('script');
      s.src = vm.dataUrl;
      s.onload = function () {
        if (!vm._received) vm.fail();
      };
      s.onerror = function () {
        vm.fail();
      };
      document.head.appendChild(s);
    },

    recv: function (list) {
      var vm = this;
      vm._received = true;
      vm.cats = list || [];
      vm.loading = false;
      if (!vm.cats.length) vm.error = true;
    },

    fail: function () {
      var vm = this;
      vm.loading = false;
      vm.error = true;
    }
  },

  template: `
<section class="catalog section section--alt" aria-label="Каталог товаров">
  <div class="container">
    <div class="section-head">
      <div>
        <h2 class="section-title">{{ title }}</h2>
        <p v-for="(para, i) in subParas" :key="'sub-' + i" class="section-sub">{{ para }}</p>
      </div>
      <a v-if="linkText" class="section-head__link" :href="linkHref">{{ linkText }}
        <svg class="icon icon-arrow-right" aria-hidden="true"><use href="#i-arrow-right"></use></svg>
      </a>
    </div>

    <p v-if="loading" class="goods-status">Загружаем категории…</p>
    <p v-else-if="error" class="goods-status goods-status--error">Не удалось загрузить категории.</p>

    <div v-else class="cat-grid" itemscope itemtype="https://schema.org/ItemList"
         :class="['cat-grid--' + effect, 'cat-enter--' + enter]"
         :style="{ '--catalog-cols': cols }">
      <a class="cat-card" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem"
         v-for="(c, i) in cats" :key="c.id" :href="c.url" :style="{ '--i': i }">
        <meta itemprop="position" :content="String(i + 1)">
        <meta itemprop="url" :content="c.url">
        <div class="cat-card__inner">
          <div class="cat-card__face cat-card__face--front">
            <img class="cat-card__img" :src="c.photo" :alt="c.header" loading="lazy">
            <h3 class="cat-card__name" itemprop="name">{{ c.header }}</h3>
          </div>
          <div class="cat-card__face cat-card__face--back">
            <h3 class="cat-card__name">{{ c.header }}</h3>
            <p class="cat-card__desc">{{ c.body }}</p>
            <span class="cat-card__more">Смотреть
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </span>
          </div>
        </div>
      </a>
    </div>
  </div>
</section>`
};