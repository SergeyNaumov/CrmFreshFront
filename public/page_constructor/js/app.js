/**
 * @file app.js
 * @description Vue-приложение конструктора страниц.
 *
 * - Одна страница из блоков (без выбора шаблона/страницы).
 * - Добавление блока: кнопка «Добавить блок» → модалка с поиском (ru+en).
 * - Редактируется один блок за раз (аккордеон); справа показывается его
 *   живой предпросмотр (вместо JSON-кода).
 * - Предпросмотр блока (👁) и всей страницы — модалки.
 * - header/footer структурные: по одному, шапка первая, подвал последний.
 *
 * Использует window.Vue, window.PAGE_CONSTRUCTOR_SCHEMA, window.PC.
 */
(function () {
  'use strict';

  var Vue = window.Vue;
  var PC = window.PC;
  var SCHEMA = window.PAGE_CONSTRUCTOR_SCHEMA || { types: {} };

  var uidCounter = 0;
  function nextUid() { uidCounter += 1; return 'blk-' + Date.now().toString(36) + '-' + uidCounter; }

  function defaultsFromParams(defs) {
    var out = {};
    (defs || []).forEach(function (d) { out[d.name] = PC.clone(d.default); });
    return out;
  }
  function defaultsFromFields(fields, sample) {
    if (sample) return PC.clone(sample);
    var out = {};
    (fields || []).forEach(function (f) { out[f.name] = PC.clone(f.default); });
    return out;
  }
  function typeDef(type) { return (SCHEMA.types || {})[type] || null; }

  // Готовые изображения шаблона для быстрого выбора (пикер).
  var IMAGE_PRESETS = [
    'images/hero-1.svg', 'images/avatar.svg', 'images/banner-1.svg',
    'images/good/good_1_1.webp', 'images/good/good_2_1.webp', 'images/good/good_3_1.webp',
    'images/good/good_4_1.webp', 'images/good/good_5_1.webp', 'images/good/good_6_1.webp',
    'images/preview/articles/article-1.webp', 'images/preview/articles/article-2.webp',
    'images/preview/articles/article-3.webp', 'images/preview/articles/article-4.webp',
    'images/preview/articles/article-5.webp', 'images/preview/articles/article-6.webp',
    'images/preview/articles/article-7.webp', 'images/preview/articles/article-8.webp',
    'images/preview/managers/manager-1.webp', 'images/preview/managers/manager-2.webp',
    'images/preview/managers/manager-3.webp', 'images/preview/managers/manager-4.webp',
    'images/preview/managers/manager-5.webp',
    'images/preview/galery/photo-1.webp', 'images/preview/galery/photo-2.webp',
    'images/preview/galery/photo-3.webp', 'images/preview/galery/photo-4.webp',
    'images/preview/galery/photo-5.webp', 'images/preview/galery/photo-6.webp',
    'images/preview/galery/photo-7.webp', 'images/preview/galery/photo-8.webp',
    'images/preview/galery/photo-9.webp', 'images/preview/galery/photo-10.webp',
    'images/preview/galery/photo-11.webp', 'images/preview/galery/photo-12.webp',
    'images/preview/certificates/cert-1.webp', 'images/preview/certificates/cert-2.webp',
    'images/preview/certificates/cert-3.webp', 'images/preview/certificates/cert-4.webp',
    'images/preview/certificates/cert-5.webp', 'images/preview/certificates/cert-6.webp',
    'images/preview/service/service_1.webp', 'images/preview/service/service_2.webp',
    'images/preview/service/service_3.webp', 'images/preview/service/service_4.webp',
    'images/preview/brands/brand-aura.svg', 'images/preview/brands/brand-game.svg',
    'images/preview/brands/brand-nova.svg', 'images/preview/brands/brand-pixel.svg',
    'images/preview/brands/brand-pulse.svg', 'images/preview/brands/brand-smart.svg',
    'images/preview/brands/brand-techno.svg', 'images/preview/brands/brand-volt.svg'
  ];

  // Популярные эмодзи (пикер 10×10).
  var EMOJI_PRESETS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕',
    '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
    '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩',
    '😤', '😡', '😠', '🤬', '💀', '💩', '🤡', '👻', '👽', '🤖',
    '✅', '❌', '⭐', '🔥', '💡', '📞', '✉️', '📍', '⏰', '🚚',
    '🎁', '🏆', '❤️', '👍', '👎', '🙏', '💬', '📈', '📉', '⚙️'
  ];

  var app = Vue.createApp({
    data: function () {
      return {
        blocks: [],
        editingUid: null,
        picker: null,
        imagePresets: IMAGE_PRESETS,
        emojiPresets: EMOJI_PRESETS,
        forceJson: false,
        dragIndex: null,
        dragOverIndex: null,
        // модалка добавления
        showAddModal: false,
        addQuery: '',
        addHighlight: 0,
        // предпросмотр
        previewUid: null,
        showPagePreview: false,
        previewSrc: '',
        modalSrc: '',
        pageSrc: '',
        _previewTimer: null,
        toast: '',
        lastSavedAt: '',
        _loaded: false,
        _toastTimer: null
      };
    },
    computed: {
      fillOptions: function () {
        return (SCHEMA.envelope && SCHEMA.envelope.fill) || ['', 'fill-1', 'fill-2', 'fill-3', 'fill-4', 'fill-5'];
      },
      animOptions: function () {
        return (SCHEMA.envelope && SCHEMA.envelope.anim) || ['', 'anim-zoom', 'anim-clip', 'no-anim'];
      },

      // ---- поиск/добавление ----
      addResults: function () {
        var res = PC.search(SCHEMA, this.addQuery) || [];
        function ru(a, b) { return String(a).localeCompare(String(b), 'ru'); }
        res.forEach(function (g) {
          (g.types || []).sort(function (a, b) { return ru(a.typeTitle, b.typeTitle); });
        });
        res.sort(function (a, b) { return ru(a.group, b.group); });
        return res;
      },
      addFlat: function () {
        var out = [];
        this.addResults.forEach(function (g) {
          g.types.forEach(function (t) {
            t.variants.forEach(function (v) {
              out.push({ group: g.group, type: t.type, typeTitle: t.typeTitle, variantKey: v.variantKey, variantLabel: v.variantLabel });
            });
          });
        });
        return out;
      },

      // ---- редактирование / панель ----
      editingBlock: function () {
        var self = this;
        return this.blocks.filter(function (b) { return b._uid === self.editingUid; })[0] || null;
      },
      asideMode: function () {
        return (this.editingBlock && !this.forceJson) ? 'preview' : 'json';
      },
      editingMarkup: function () {
        return this.editingBlock ? PC.renderBlock(this.editingBlock) : '';
      },
      previewTitle: function () {
        return this.editingBlock ? this.typeTitle(this.editingBlock.type) : '';
      },

      // ---- предпросмотр ----
      modalBlock: function () {
        var self = this;
        return this.blocks.filter(function (b) { return b._uid === self.previewUid; })[0] || null;
      },

      // ---- экспорт ----
      exportDoc: function () { return PC.exportDocument({ blocks: this.blocks }); },
      jsonText: function () { return JSON.stringify(this.exportDoc, null, 2); },
      totalItems: function () {
        return this.blocks.reduce(function (n, b) { return n + ((b.items && b.items.length) || 0); }, 0);
      }
    },
    watch: {
      blocks: { deep: true, handler: function () { this.autosave(); } },
      addResults: function () { this.addHighlight = 0; },
      editingMarkup: function (markup) { this.schedulePreview(markup); }
    },
    methods: {
      // ---- метаданные ----
      typeTitle: function (type) { var t = typeDef(type); return t ? (t.title || type) : type; },
      variantTitle: function (type, variantKey) {
        var t = typeDef(type);
        if (!t) return variantKey || '';
        if (!variantKey || variantKey === 'default') return t.title || type;
        var vd = (t.variants || {})[variantKey];
        return vd ? (vd.title || variantKey) : variantKey;
      },
      paramsOf: function (block) { return PC.variantParams(block.type, block.variant); },
      fieldsOf: function (block) { return PC.itemFields(block.type, block.variant); },
      isDataBlock: function (block) { var t = typeDef(block.type); return !!(t && t.data); },
      hasItems: function (block) { return !this.isDataBlock(block) && PC.itemFields(block.type, block.variant).length > 0; },

      // ---- вид блока (переключаемые варианты) ----
      // Переключатель показываем для любого типа с 2+ вариантами
      // (флаг views влияет только на палитру добавления, а не на редактор).
      hasViews: function (block) {
        var t = typeDef(block.type);
        return !!(t && t.variants && Object.keys(t.variants).length > 1);
      },
      viewOptions: function (block) {
        var t = typeDef(block.type) || {};
        return Object.keys(t.variants || {}).map(function (vk) {
          var vd = (t.variants || {})[vk] || {};
          return { key: vk === 'default' ? '' : vk, label: vd.title || (t.title || vk) };
        }).sort(function (a, b) { return a.label.localeCompare(b.label, 'ru'); });
      },
      setView: function (block, key) {
        block.variant = key === 'default' ? '' : key;
        var defaults = {};
        PC.variantParams(block.type, block.variant).forEach(function (d) { defaults[d.name] = PC.clone(d.default); });
        Object.keys(defaults).forEach(function (k) {
          if (block.params[k] === undefined || block.params[k] === null || block.params[k] === '') block.params[k] = defaults[k];
        });
        var fields = PC.itemFields(block.type, block.variant);
        var sample = PC.sampleItems(block.type, block.variant);
        if (!block.items || !block.items.length) {
          block.items = sample.map(function (it) { return PC.clone(it); });
        } else if (fields.length) {
          // Дополняем существующие элементы полями нового варианта,
          // не затирая уже заполненные значения.
          block.items = block.items.map(function (it, i) {
            var out = PC.clone(it);
            fields.forEach(function (f) {
              if (out[f.name] === undefined || out[f.name] === null) {
                var sv = sample[i] ? sample[i][f.name] : undefined;
                out[f.name] = PC.clone(sv !== undefined ? sv : f.default);
              }
            });
            return out;
          });
        }
      },

      // ---- пикеры изображений и эмодзи ----
      isImageField: function (f) {
        if (!f) return false;
        if (f.kind === 'image') return true;
        return /^(photo|image|img|logo|poster|avatar|picture|src|photo_url|image_url)$/i.test(f.name || '');
      },
      isEmojiField: function (f) {
        if (!f) return false;
        return f.kind === 'emoji' || /^emoji$/i.test(f.name || '');
      },
      openPicker: function (block, scope, def, index) {
        if (!def) return;
        this.picker = {
          uid: block._uid, scope: scope, name: def.name,
          index: (typeof index === 'number' ? index : -1),
          kind: this.isEmojiField(def) ? 'emoji' : 'image'
        };
      },
      thumb: function (src) {
        try { return PC.tplAsset(src); } catch (e) { return src; }
      },
      closePicker: function () { this.picker = null; },
      pickerIsEmoji: function () { return !!(this.picker && this.picker.kind === 'emoji'); },
      pickerLabel: function () { return this.pickerIsEmoji() ? 'Выбор эмодзи' : 'Выбор изображения'; },
      pickValue: function (val) {
        var p = this.picker;
        if (!p) return;
        var target = null;
        for (var i = 0; i < this.blocks.length; i++) {
          if (this.blocks[i]._uid === p.uid) { target = this.blocks[i]; break; }
        }
        if (!target) { this.picker = null; return; }
        if (p.scope === 'param') target.params[p.name] = val;
        else if (target.items && target.items[p.index]) target.items[p.index][p.name] = val;
        this.picker = null;
      },

      // ---- структурные ----
      isStructural: function (block) { return !!(typeDef(block.type) && typeDef(block.type).structural); },
      hasStructural: function (type) { return this.blocks.some(function (b) { return b.type === type; }); },
      headerIndex: function () { return this.blocks.findIndex(function (b) { return b.type === 'header'; }); },
      footerIndex: function () { return this.blocks.findIndex(function (b) { return b.type === 'footer'; }); },
      movableStart: function () { return this.headerIndex() === -1 ? 0 : 1; },
      movableEnd: function () { return this.footerIndex() === -1 ? this.blocks.length : this.blocks.length - 1; },

      // ---- модалка добавления ----
      openAddModal: function () {
        this.showAddModal = true;
        this.addQuery = '';
        this.addHighlight = 0;
        this.$nextTick(function () {
          var el = document.querySelector('.pc-addmodal__input');
          if (el) el.focus();
        });
      },
      closeAddModal: function () { this.showAddModal = false; },
      pick: function (cand) {
        if (!cand) return;
        this.addBlock(cand.type, cand.variantKey);
        this.closeAddModal();
      },
      pickHighlighted: function () { this.pick(this.addFlat[this.addHighlight]); },
      onAddKeydown: function (e) {
        var n = this.addFlat.length;
        if (e.key === 'ArrowDown') { e.preventDefault(); this.addHighlight = n ? (this.addHighlight + 1) % n : 0; }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.addHighlight = n ? (this.addHighlight - 1 + n) % n : 0; }
        else if (e.key === 'Enter') { e.preventDefault(); this.pickHighlighted(); }
        else if (e.key === 'Escape') { e.preventDefault(); this.closeAddModal(); }
      },
      flatIndexOf: function (type, variantKey) {
        for (var i = 0; i < this.addFlat.length; i++) {
          var c = this.addFlat[i];
          if (c.type === type && c.variantKey === variantKey) return i;
        }
        return -1;
      },
      isHighlighted: function (type, variantKey) { return this.flatIndexOf(type, variantKey) === this.addHighlight; },

      // ---- создание ----
      makeBlock: function (type, variantKey) {
        var t = typeDef(type);
        if (!t) return null;
        var variant = variantKey || t.default_variant || Object.keys(t.variants || {})[0] || 'default';
        return {
          _uid: nextUid(),
          type: type,
          variant: variant === 'default' ? '' : variant,
          fill: '', anim: '', bleed: false,
          params: defaultsFromParams(PC.variantParams(type, variant)),
          items: PC.sampleItems(type, variant).map(function (it) {
            return defaultsFromFields(PC.itemFields(type, variant), it);
          })
        };
      },
      addBlock: function (type, variantKey) {
        var t = typeDef(type);
        if (!t) return;
        if (t.structural && this.hasStructural(type)) {
          this.flash(this.typeTitle(type) + ' уже есть на странице');
          return;
        }
        var block = this.makeBlock(type, variantKey);
        if (!block) return;
        if (type === 'header') this.blocks.unshift(block);
        else if (type === 'footer') this.blocks.push(block);
        else {
          var fi = this.footerIndex();
          if (fi === -1) this.blocks.push(block); else this.blocks.splice(fi, 0, block);
        }
        this.flash('Добавлен блок: ' + this.typeTitle(type));
      },
      removeBlock: function (idx) {
        var b = this.blocks[idx];
        if (b && b._uid === this.editingUid) this.editingUid = null;
        this.blocks.splice(idx, 1);
      },
      duplicateBlock: function (idx) {
        var src = this.blocks[idx];
        if (!src || this.isStructural(src)) return;
        var copy = PC.clone(src);
        copy._uid = nextUid();
        this.blocks.splice(idx + 1, 0, copy);
      },
      moveBlock: function (idx, dir) {
        var block = this.blocks[idx];
        if (!block || this.isStructural(block)) return;
        var to = idx + dir;
        if (to < this.movableStart() || to >= this.movableEnd()) return;
        var b = this.blocks.splice(idx, 1)[0];
        this.blocks.splice(to, 0, b);
      },

      // ---- редактирование (аккордеон) ----
      toggleForm: function (block) {
        if (this.editingUid === block._uid) { this.editingUid = null; return; }
        this.editingUid = block._uid;
        this.forceJson = false;
      },
      isOpen: function (block) { return this.editingUid === block._uid; },
      showJson: function () { this.forceJson = true; },
      addItem: function (block) { block.items.push(defaultsFromFields(this.fieldsOf(block))); },
      removeItem: function (block, i) { block.items.splice(i, 1); },

      // ---- предпросмотр ----
      schedulePreview: function (markup) {
        var self = this;
        clearTimeout(this._previewTimer);
        this._previewTimer = setTimeout(function () {
          self.previewSrc = PC.buildPreviewDoc(markup, self.editingBlock ? self.editingBlock.type : null);
        }, 300);
      },
      openBlockPreview: function (block) {
        this.previewUid = block._uid;
        this.modalSrc = PC.buildPreviewDoc(PC.renderBlock(block), block.type);
      },
      closeBlockPreview: function () { this.previewUid = null; },
      openPagePreview: function () {
        this.pageSrc = PC.buildPreviewDoc(PC.renderAll(this.blocks), this.blocks.map(function (b) { return b.type; }));
        this.showPagePreview = true;
      },
      closePagePreview: function () { this.showPagePreview = false; },
      onFrameLoad: function (e) {
        var f = e.target;
        var resize = function () {
          try {
            var d = f.contentDocument;
            if (d && d.body) f.style.height = Math.max(220, d.body.scrollHeight + 8) + 'px';
          } catch (err) { /* cross-origin */ }
        };
        resize();
        setTimeout(resize, 400);
        setTimeout(resize, 1200);
        try {
          var w = f.contentWindow, d2 = f.contentDocument;
          if (!f.__pcRO && w && w.ResizeObserver && d2 && d2.body) {
            f.__pcRO = new w.ResizeObserver(resize);
            f.__pcRO.observe(d2.body);
          }
        } catch (err) { /* ignore */ }
      },

      // ---- drag & drop ----
      canDrag: function (block) { return !this.isStructural(block); },
      onDragStart: function (idx, e) {
        var block = this.blocks[idx];
        if (!block || this.isStructural(block)) { e.preventDefault(); return; }
        this.dragIndex = idx; this.dragOverIndex = idx;
        try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); } catch (err) {}
      },
      onDragOver: function (idx, e) {
        if (this.dragIndex === null) return;
        if (this.dragOverIndex !== idx) this.dragOverIndex = idx;
        e.preventDefault();
        try { e.dataTransfer.dropEffect = 'move'; } catch (err) {}
      },
      onDrop: function (idx, e) {
        e.preventDefault();
        var from = this.dragIndex;
        this.dragIndex = null; this.dragOverIndex = null;
        if (from === null || from === idx) return;
        var block = this.blocks[from];
        if (!block || this.isStructural(block)) return;
        var to = Math.max(this.movableStart(), Math.min(idx, this.movableEnd() - 1));
        if (to === from) return;
        var b = this.blocks.splice(from, 1)[0];
        this.blocks.splice(to, 0, b);
      },
      onDragEnd: function () { this.dragIndex = null; this.dragOverIndex = null; },
      dropClass: function (idx) {
        if (this.dragIndex === null || this.dragOverIndex !== idx || this.dragIndex === idx) return '';
        return idx < this.dragIndex ? 'is-drop-before' : 'is-drop-after';
      },

      // ---- экспорт/импорт ----
      resetAll: function () {
        if (this.blocks.length && !window.confirm('Очистить страницу? Действие необратимо.')) return;
        this.blocks = []; this.editingUid = null; PC.clearState(); this.flash('Страница очищена');
      },
      loadExample: function () {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'examples/example_block_list.json', true);
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { self.importDoc(JSON.parse(xhr.responseText)); self.flash('Пример загружен'); return; } catch (e) {}
          }
          self.flash('Не удалось загрузить пример (откройте через http-сервер)');
        };
        xhr.onerror = function () { self.flash('Не удалось загрузить пример (откройте через http-сервер)'); };
        xhr.send();
      },
      loadExampleNew: function () {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'examples/blocks_new_example.json', true);
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { self.importDoc(JSON.parse(xhr.responseText)); self.flash('Пример новых блоков загружен'); return; } catch (e) {}
          }
          self.flash('Не удалось загрузить пример (откройте через http-сервер)');
        };
        xhr.onerror = function () { self.flash('Не удалось загрузить пример (откройте через http-сервер)'); };
        xhr.send();
      },
      importDoc: function (doc) {
        if (!doc || !Array.isArray(doc.blocks)) return;
        this.blocks = doc.blocks.map(function (b) {
          return {
            _uid: nextUid(), type: b.type, variant: b.variant || '',
            fill: b.fill || '', anim: b.anim || '', bleed: !!b.bleed,
            params: PC.clone(b.params || {}), items: PC.clone(b.items || [])
          };
        });
        this.editingUid = null;
        this.normalizeOrder();
      },
      normalizeOrder: function () {
        var header = this.blocks.filter(function (b) { return b.type === 'header'; })[0];
        var footer = this.blocks.filter(function (b) { return b.type === 'footer'; })[0];
        var rest = this.blocks.filter(function (b) { return b.type !== 'header' && b.type !== 'footer'; });
        this.blocks = (header ? [header] : []).concat(rest).concat(footer ? [footer] : []);
      },
      autosave: function () {
        if (!this._loaded) return;
        if (PC.saveState({ blocks: this.blocks })) this.lastSavedAt = new Date().toLocaleTimeString('ru-RU');
      },
      restore: function () {
        var doc = PC.loadState();
        if (doc) this.importDoc(doc);
        this._loaded = true;
      },
      copyJson: function () {
        var self = this;
        PC.copyText(this.jsonText).then(function (ok) { self.flash(ok ? 'JSON скопирован' : 'Не удалось скопировать'); });
      },
      downloadJson: function () {
        PC.download('block_list.json', this.jsonText);
        this.flash('Файл block_list.json сохранён');
      },
      flash: function (msg) {
        var self = this;
        this.toast = msg;
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(function () { self.toast = ''; }, 2200);
      }
    },
    mounted: function () { this.restore(); }
  });

  app.mount('#page-constructor');
})();
