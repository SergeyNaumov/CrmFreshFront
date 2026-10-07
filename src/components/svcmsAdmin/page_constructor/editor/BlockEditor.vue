<template>
  <div class="pc-body">
    <header class="pc-appbar">
      <div class="pc-appbar__brand">
        <b>{{ role === 'structure' ? 'Шапка и подвал' : 'Конструктор страниц' }}</b>
        <span>{{ role === 'structure' ? 'общие для всех страниц шаблона' : 'block_list.json · v2' }}</span>
      </div>
      <span class="pc-appbar__spacer"></span>
      <span v-if="isDirty" class="pc-saved">изменено {{ lastSavedAt }}</span>
      <button class="pc-tool pc-tool--ghost" @click="openPagePreview">Предпросмотр страницы</button>
      <button class="pc-tool pc-tool--ghost" @click="loadExample">Пример</button>
      <button class="pc-tool pc-tool--ghost" @click="resetAll">Очистить</button>
      <button
        v-if="saveState !== 'saved'"
        class="pc-tool pc-tool--primary"
        :disabled="saving"
        @click="saveNow"
      >{{ saveState === 'error' ? 'Сохранить ещё раз' : (saving ? 'Сохраняем…' : 'Сохранить') }}</button>
      <span v-else-if="isDirty === false" class="pc-saved">сохранено</span>
    </header>

    <div class="pc-shell" :class="{ 'is-editing-preview': asideMode === 'preview' }"
         :style="{ '--pc-aside-w': aside_w + 'px' }">
      <main class="pc-canvas">
        <div class="pc-canvas__bar">
          <button class="pc-add-btn" @click="openAddModal">＋ Добавить блок</button>
          <span class="pc-canvas__hint">{{ displayCount }} блок(ов)</span>
        </div>

        <template v-if="role === 'page'">
          <div class="pcb-struct" :class="{ 'is-missing': !pageHeader }">
            <span class="pcb-struct__ico">▤</span>
            <span class="pcb-struct__label">Шапка — общая для всех страниц шаблона</span>
            <span class="pcb-struct__state">{{ pageHeader ? 'задана' : 'не задана' }}</span>
            <span class="pcb-struct__spacer"></span>
            <button class="pcb-struct__btn" @click="$emit('edit-structure', 'header')">Изменить</button>
          </div>
        </template>

        <div class="pc-canvas__empty" v-if="!blocks.length">
          {{ role === 'structure' ? 'Структура пуста. Добавьте шапку или подвал.' : 'Страница пуста. Нажмите «Добавить блок».' }}
        </div>

        <article
          class="pcb-card"
          :class="[ 'pcb-card--' + block.type, { 'is-structural': isStructural(block), 'is-collapsed': !isOpen(block), 'is-editing': isOpen(block), 'is-dragging': dragIndex === idx }, dropClass(idx) ]"
          v-for="(block, idx) in blocks"
          :key="block._uid"
          :data-uid="block._uid"
          @dragover="onDragOver(idx, $event)"
          @drop="onDrop(idx, $event)"
        >
          <header class="pcb-head">
            <span
              class="pcb-drag"
              :class="{ 'is-disabled': !canDrag(block) }"
              :draggable="canDrag(block)"
              @dragstart="onDragStart(idx, $event)"
              @dragend="onDragEnd"
              title="Перетащите, чтобы изменить порядок"
            >⠿</span>
            <span class="pcb-head__index">{{ idx + 1 }}</span>
            <span class="pcb-head__title">{{ typeTitle(block.type) }}</span>
            <span class="pc-badge" v-if="viewLabel(block)">{{ viewLabel(block) }}</span>
            <span class="pcb-head__summary" v-if="!isOpen(block)">{{ block.params.header || block.params.title || '' }}</span>
            <span class="pcb-head__spacer"></span>
            <button class="pcb-ico" @click="openBlockPreview(block)" aria-label="Предпросмотр блока" title="Предпросмотр блока">👁</button>
            <template v-if="!isStructural(block)">
              <button class="pcb-ico" @click="moveBlock(idx, -1)" aria-label="Поднять блок">↑</button>
              <button class="pcb-ico" @click="moveBlock(idx, 1)" aria-label="Опустить блок">↓</button>
              <button class="pcb-ico" @click="duplicateBlock(idx)" aria-label="Дублировать блок">⧉</button>
            </template>
            <button class="pcb-ico pcb-ico--toggle" @click="toggleForm(block)" :aria-expanded="isOpen(block)" :aria-label="isOpen(block) ? 'Свернуть блок' : 'Развернуть и редактировать'">{{ isOpen(block) ? '▾ Редактирование' : '▸ Редактировать' }}</button>
            <button class="pcb-ico" @click="removeBlock(idx)" aria-label="Удалить блок">✕</button>
          </header>

          <div class="pcb-form" v-if="isOpen(block)">
            <div class="pcb-form__grid">
              <div>
                <div class="pcb-form__section">Оформление блока</div>
                <div class="pcb-row">
                  <label>Фон</label>
                  <div class="pcb-row__control">
                    <select class="pcb-field" v-model="block.fill">
                      <option v-for="f in fillOptions" :key="f" :value="f">{{ f || '— по умолчанию' }}</option>
                    </select>
                  </div>
                </div>
                <div class="pcb-row">
                  <label>Анимация</label>
                  <div class="pcb-row__control">
                    <select class="pcb-field" v-model="block.anim">
                      <option v-for="a in animOptions" :key="a" :value="a">{{ a || '— по умолчанию' }}</option>
                    </select>
                  </div>
                </div>
                <div class="pcb-row">
                  <label>Во всю ширину</label>
                  <div class="pcb-row__control">
                    <label class="pcb-switch"><input type="checkbox" v-model="block.bleed"><span>{{ block.bleed ? 'да' : 'нет' }}</span></label>
                  </div>
                </div>

                <template v-if="hasViews(block)">
                  <div class="pcb-row">
                    <label>Вид блока</label>
                    <div class="pcb-row__control">
                      <select class="pcb-field" :value="viewValue(block)" @change="setView(block, $event.target.value)">
                        <option v-for="v in viewOptions(block)" :key="v.key" :value="v.key">{{ v.label }}</option>
                      </select>
                    </div>
                  </div>
                </template>

                <template v-if="formParams(block).length">
                  <div class="pcb-form__section">Параметры</div>
                  <div class="pcb-row" v-for="pp in formParams(block)" :key="pp.name">
                    <label>{{ pp.label }}</label>
                    <div class="pcb-row__control">
                      <input v-if="pp.kind === 'text'" class="pcb-field" type="text" v-model="block.params[pp.name]">
                      <textarea v-else-if="pp.kind === 'textarea'" class="pcb-field" v-model="block.params[pp.name]"></textarea>
                      <input v-else-if="pp.kind === 'number'" class="pcb-field" type="number" :min="pp.min" :max="pp.max" :step="pp.step" v-model.number="block.params[pp.name]">
                      <template v-else-if="isCustomField(pp, block)">
                        <input class="pcb-field" type="text" v-model="block.params[pp.name]"
                               :placeholder="'например: ' + (pp.options[0] ? pp.options[0].value : '')">
                        <button class="pcb-ico" type="button" @click="setCustom(pp, block, false)"
                                title="Вернуть готовые варианты">↺</button>
                      </template>
                      <select v-else-if="pp.kind === 'select'" class="pcb-field"
                              :value="selectValue(pp, block)" @change="onSelect(pp, block, $event.target.value)">
                        <option v-for="o in selectOptions(pp, block)" :key="String(o.value)" :value="o.value">{{ o.label }}</option>
                      </select>
                      <label v-else-if="pp.kind === 'bool'" class="pcb-switch"><input type="checkbox" v-model="block.params[pp.name]"><span>{{ block.params[pp.name] ? 'да' : 'нет' }}</span></label>
                      <input v-else class="pcb-field" type="text" v-model="block.params[pp.name]">
                      <button v-if="isImageField(pp)" class="pcb-ico pcb-pick" type="button" @click="openPicker(block, 'param', pp)" title="Выбрать изображение">🖼</button>
                      <button v-else-if="isEmojiField(pp)" class="pcb-ico pcb-pick" type="button" @click="openPicker(block, 'param', pp)" title="Выбрать эмодзи">😀</button>
                    </div>
                  </div>
                </template>

                <div class="pcb-note" v-if="isQueryMode(block)">
                  Режим Б: блок сам формирует запрос — условие, сортировка и лимит выше.
                  Поле «Название переменной» скрыто, движок берёт данные напрямую из таблицы.
                </div>
                <div class="pcb-note" v-else-if="isDataBlock(block)">Данные блока берутся из переменной (поле «Название переменной»). Ниже приведены демонстрационные элементы для превью — в JSON они не выгружаются.</div>

                <div class="pcb-items" v-if="hasItems(block)">
                  <div class="pcb-form__section">Элементы ({{ block.items.length }})</div>
                  <div class="pcb-item" v-for="(it, ii) in block.items" :key="ii">
                    <div class="pcb-item__head">
                      <b>№{{ ii + 1 }}</b>
                      <button class="pcb-ico" @click="removeItem(block, ii)" aria-label="Удалить элемент">✕</button>
                    </div>
                    <div class="pcb-row" v-for="f in fieldsOf(block)" :key="f.name">
                      <label>{{ f.label }}</label>
                      <div class="pcb-row__control">
                        <input v-if="f.kind === 'text'" class="pcb-field" type="text" v-model="it[f.name]">
                        <textarea v-else-if="f.kind === 'textarea'" class="pcb-field" v-model="it[f.name]"></textarea>
                        <input v-else-if="f.kind === 'number'" class="pcb-field" type="number" v-model.number="it[f.name]">
                        <select v-else-if="f.kind === 'select'" class="pcb-field" v-model="it[f.name]">
                          <option v-for="o in f.options" :key="String(o.value)" :value="o.value">{{ o.label }}</option>
                        </select>
                        <label v-else-if="f.kind === 'bool'" class="pcb-switch"><input type="checkbox" v-model="it[f.name]"></label>
                        <input v-else class="pcb-field" type="text" v-model="it[f.name]">
                        <button v-if="isImageField(f)" class="pcb-ico pcb-pick" type="button" @click="openPicker(block, 'item', f, ii)" title="Выбрать изображение">🖼</button>
                        <button v-else-if="isEmojiField(f)" class="pcb-ico pcb-pick" type="button" @click="openPicker(block, 'item', f, ii)" title="Выбрать эмодзи">😀</button>
                      </div>
                    </div>
                  </div>
                  <button class="pcb-add-item" @click="addItem(block)">+ Добавить элемент</button>
                </div>
              </div>
            </div>
          </div>
        </article>

        <template v-if="role === 'page'">
          <div class="pcb-struct pcb-struct--footer" :class="{ 'is-missing': !pageFooter }">
            <span class="pcb-struct__ico">▥</span>
            <span class="pcb-struct__label">Подвал — общий для всех страниц шаблона</span>
            <span class="pcb-struct__state">{{ pageFooter ? 'задан' : 'не задан' }}</span>
            <span class="pcb-struct__spacer"></span>
            <button class="pcb-struct__btn" @click="$emit('edit-structure', 'footer')">Изменить</button>
          </div>
        </template>
      </main>

      <div class="pc-resizer" @mousedown.prevent="start_aside_resize" title="Потяните, чтобы изменить ширину панели"></div>

      <aside class="pc-aside">
        <div class="pc-aside__head">
          <b>{{ asideMode === 'preview' ? 'Предпросмотр' : (role === 'structure' ? 'структура' : 'block_list.json') }}</b>
          <span class="pc-aside__stats">{{ asideMode === 'preview' ? previewTitle : (displayCount + ' бл. · ' + totalItems + ' элем.') }}</span>
          <span class="pc-appbar__spacer"></span>
          <button class="pc-tool" @click="toggleJson">{{ jsonVisible ? 'Скрыть JSON' : 'Показать JSON' }}</button>
          <button class="pc-tool" v-if="jsonVisible" @click="copyJson">Копировать</button>
        </div>
        <div class="pc-aside__body" :class="{ 'is-preview': asideMode === 'preview', 'is-json': asideMode === 'json' }">
          <iframe
            v-if="asideMode === 'preview' && editingBlock"
            class="pc-frame"
            data-pc-frame="aside"
            :srcdoc="previewSrc"
            @load="onFrameLoad"
            title="Предпросмотр блока"
          ></iframe>
          <div v-else-if="asideMode === 'preview'" class="pc-aside__idle">
            Выберите блок и нажмите «Редактировать», чтобы увидеть его превью.
          </div>
          <pre v-else class="pc-json">{{ jsonText }}</pre>
        </div>
      </aside>
    </div>

    <div class="pc-modal" v-if="showAddModal" @click.self="closeAddModal">
      <div class="pc-modal__dialog pc-addmodal" role="dialog" aria-modal="true" aria-label="Добавить блок">
        <div class="pc-modal__head">
          <b>Добавить блок</b>
          <button class="pc-modal__close" @click="closeAddModal" aria-label="Закрыть">✕</button>
        </div>
        <div class="pc-addmodal__search">
          <input
            class="pc-addmodal__input"
            type="text"
            v-model="addQuery"
            @keydown="onAddKeydown"
            placeholder="Поиск: карта, header, отзывы, contacts, реквизиты…"
          >
        </div>
        <div class="pc-addmodal__body">
          <div class="pc-addmodal__group" v-for="g in addResults" :key="g.group">
            <div class="pc-addmodal__gtitle">{{ g.group }}</div>
            <div class="pc-addmodal__type" v-for="t in g.types" :key="t.type">
              <div class="pc-addmodal__tname">
                {{ t.typeTitle }}
                <span class="pc-addmodal__tkey">{{ t.type }}</span>
                <span class="pc-addmodal__struct" v-if="t.structural">структурный</span>
              </div>
              <div class="pc-addmodal__variants">
                <button
                  class="pc-addmodal__variant"
                  :class="{ 'is-active': isHighlighted(t.type, v.variantKey) }"
                  v-for="v in t.variants"
                  :key="v.variantKey"
                  @click="pick({ type: t.type, variantKey: v.variantKey })"
                  @mouseenter="addHighlight = flatIndexOf(t.type, v.variantKey)"
                >{{ v.variantLabel }}</button>
              </div>
            </div>
          </div>
          <div class="pc-addmodal__empty" v-if="!addFlat.length">Ничего не найдено</div>
        </div>
        <div class="pc-modal__foot">↑↓ выбор · Enter добавить · Esc закрыть</div>
      </div>
    </div>

    <div class="pc-modal" v-if="previewUid !== null" @click.self="closeBlockPreview">
      <div class="pc-modal__dialog pc-previewmodal" role="dialog" aria-modal="true" aria-label="Предпросмотр блока">
        <div class="pc-modal__head">
          <b>Предпросмотр: {{ modalBlock ? typeTitle(modalBlock.type) : '' }}</b>
          <button class="pc-modal__close" @click="closeBlockPreview" aria-label="Закрыть">✕</button>
        </div>
        <div class="pc-modal__body">
          <iframe class="pc-frame pc-frame--modal" data-pc-frame="modal" :srcdoc="modalSrc" @load="onFrameLoad" title="Предпросмотр блока"></iframe>
        </div>
      </div>
    </div>

    <div class="pc-modal" v-if="showPagePreview" @click.self="closePagePreview">
      <div class="pc-modal__dialog pc-previewmodal pc-previewmodal--page" role="dialog" aria-modal="true" aria-label="Предпросмотр страницы">
        <div class="pc-modal__head">
          <b>Предпросмотр страницы</b>
          <button class="pc-modal__close" @click="closePagePreview" aria-label="Закрыть">✕</button>
        </div>
        <div class="pc-modal__body">
          <iframe class="pc-frame pc-frame--modal" data-pc-frame="page" :srcdoc="pageSrc" @load="onFrameLoad" title="Предпросмотр страницы"></iframe>
        </div>
      </div>
    </div>

    <div class="pc-picker" v-if="picker" @click.self="closePicker">
      <div class="pc-picker__dialog" role="dialog" :aria-label="pickerLabel()">
        <div class="pc-picker__head">
          <b>{{ pickerLabel() }}</b>
          <button class="pc-modal__close" @click="closePicker" aria-label="Закрыть">✕</button>
        </div>
        <div class="pc-picker__body" :class="pickerIsEmoji() ? 'pc-picker__body--emoji' : 'pc-picker__body--image'">
          <template v-if="pickerIsEmoji()">
            <button v-for="e in emojiPresets" :key="e" class="pc-emoji" type="button" @click="pickValue(e)">{{ e }}</button>
          </template>
          <template v-else>
            <div class="pc-bi">
              <label class="pc-bi__upload">
                <input type="file" accept="image/*" :disabled="blockUploading" @change="onUpload">
                <span>{{ blockUploading ? 'Загрузка…' : 'Загрузить картинку' }}</span>
              </label>
              <span class="pc-bi__hint">Картинки проекта: /files/project_&lt;id&gt;/block-images</span>
            </div>
            <div v-if="!projectImages.length" class="pc-bi__empty">Нет картинок — загрузите первую.</div>
            <button v-for="f in projectImages" :key="f.name" class="pc-img" type="button" @click="pickValue(f.path)" :title="f.name">
              <img :src="thumb(f.path)" alt="">
            </button>
          </template>
        </div>
      </div>
    </div>

    <div class="pc-toast" v-if="toast">{{ toast }}</div>
  </div>
</template>
<script>
import { PC, SCHEMA } from '../engine'
import example_block_list from '../data/examples/example_block_list.json'
import blocks_new_example from '../data/examples/blocks_new_example.json'

// Метка опции «ручной ввод» в select с allowCustom.
const CUSTOM = '__custom__'

let uidCounter = 0
function nextUid() { uidCounter += 1; return 'blk-' + Date.now().toString(36) + '-' + uidCounter }
function clone(v) { return PC.clone(v) }

function defaultsFromParams(defs) {
  const out = {}
  ;(defs || []).forEach(d => { out[d.name] = clone(d.default) })
  return out
}
function defaultsFromFields(fields, sample) {
  if (sample) return clone(sample)
  const out = {}
  ;(fields || []).forEach(f => { out[f.name] = clone(f.default) })
  return out
}
function mergeParamDefaults(type, variant, params) {
  const out = clone(params || {})
  ;(PC.variantParams(type, variant) || []).forEach(d => {
    if (out[d.name] === undefined) out[d.name] = clone(d.default)
  })
  // Товары: условие выборки зависит от переменной (новинки/акции/популярные),
  // иначе схема-дефолт «new=1» сломает спецпредложения и популярные.
  if (type === 'goods' && out.varname && ('where' in out)) {
    out.where = out.varname === 'sale_goods_list' ? 'enabled=1 and action=1'
      : out.varname === 'popular_goods_list' ? 'enabled=1 and specpredl=1'
      : 'enabled=1 and new=1'
  }
  return out
}
function makeEditable(block) {
  const td = typeDef(block.type)
  return {
    _uid: nextUid(),
    type: block.type,
    variant: block.variant || '',
    fill: block.fill || '',
    anim: block.anim || '',
    bleed: !!block.bleed,
    // Дефолты схемы доливаются всем блокам (а не только структурным),
    // чтобы «источник/условие/сортировка», переходы/скорости и т.п. были
    // заполнены при открытии. Существующие значения не перетираются.
    params: mergeParamDefaults(block.type, block.variant || '', block.params),
    items: clone(block.items || [])
  }
}
function typeDef(type) { return (SCHEMA.types || {})[type] || null }

const IMAGE_PRESETS = [
  'images/hero-1.svg', 'images/avatar.svg', 'images/banner-1.svg',
  'images/good/good_1_1.webp', 'images/good/good_2_1.webp', 'images/good/good_3_1.webp',
  'images/good/good_4_1.webp', 'images/good/good_5_1.webp', 'images/good/good_6_1.webp',
  'images/preview/articles/article-1.webp', 'images/preview/articles/article-2.webp',
  'images/preview/articles/article-3.webp', 'images/preview/articles/article-4.webp',
  'images/preview/articles/article-5.webp', 'images/preview/articles/article-6.webp',
  'images/preview/managers/manager-1.webp', 'images/preview/managers/manager-2.webp',
  'images/preview/managers/manager-3.webp', 'images/preview/managers/manager-4.webp',
  'images/preview/managers/manager-5.webp',
  'images/preview/galery/photo-1.webp', 'images/preview/galery/photo-2.webp',
  'images/preview/galery/photo-3.webp', 'images/preview/galery/photo-4.webp',
  'images/preview/galery/photo-5.webp', 'images/preview/galery/photo-6.webp',
  'images/preview/galery/photo-7.webp', 'images/preview/galery/photo-8.webp',
  'images/preview/certificates/cert-1.webp', 'images/preview/certificates/cert-2.webp',
  'images/preview/certificates/cert-3.webp', 'images/preview/certificates/cert-4.webp',
  'images/preview/certificates/cert-5.webp', 'images/preview/certificates/cert-6.webp',
  'images/preview/service/service_1.webp', 'images/preview/service/service_2.webp',
  'images/preview/service/service_3.webp', 'images/preview/service/service_4.webp',
  'images/preview/brands/brand-aura.svg', 'images/preview/brands/brand-game.svg',
  'images/preview/brands/brand-nova.svg', 'images/preview/brands/brand-pixel.svg',
  'images/preview/brands/brand-pulse.svg', 'images/preview/brands/brand-smart.svg'
]

const EMOJI_PRESETS = [
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
]

export default {
  props: {
    doc: { type: Object, default: null },
    role: { type: String, default: 'page' },
    header: { type: Object, default: null },
    footer: { type: Object, default: null },
    configRev: { type: Number, default: 0 },
    // Номер блока, который нужно раскрыть снаружи (из URL).
    expandIndex: { type: Number, default: -1 }
  },
  emits: ['change', 'edit-structure', 'save', 'saved', 'edit-block'],
  data() {
    return {
      blocks: [],
      pageHeader: null,
      pageFooter: null,
      editingUid: null,
      picker: null,
      imagePresets: IMAGE_PRESETS,
      emojiPresets: EMOJI_PRESETS,
      projectImages: [],
      blockUploading: false,
      // JSON в правой панели по умолчанию скрыт (показывается по кнопке).
      jsonVisible: false,
      // Ширина правой панели (drag), запоминается в localStorage.
      // Клампим и при загрузке: холсту всегда оставляем минимум ~360px,
      // иначе после прошлых сессий панель может перекрыть его.
      aside_w: (() => {
        const minCanvas = 360
        const max = Math.max(260, window.innerWidth - minCanvas - 12)
        return Math.min(Math.max(Number(localStorage.getItem('pc_constructor_aside_w')) || 380, 260), max)
      })(),
      // Поля, переведённые в ручной ввод (UI-состояние, в JSON не попадает).
      custom_fields: {},
      saving: false,
      saveState: '',
      // Снимок документа, принятого бэкендом: с ним сверяется isDirty.
      savedSnapshot: '',
      dragIndex: null,
      dragOverIndex: null,
      showAddModal: false,
      addQuery: '',
      addHighlight: 0,
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
    }
  },
  computed: {
    fillOptions() {
      return (SCHEMA.envelope && SCHEMA.envelope.fill) || ['', 'fill-1', 'fill-2', 'fill-3', 'fill-4', 'fill-5']
    },
    animOptions() {
      return (SCHEMA.envelope && SCHEMA.envelope.anim) || ['', 'anim-zoom', 'anim-clip', 'no-anim']
    },
    addResults() {
      const wantStructural = this.role === 'structure'
      // Фильтр по опциям проекта (приходит в /init -> PAGE_CONSTRUCTOR_CONFIG).
      // restricted — блоки с привязками к опциям; allowed — те из них, чьи
      // опции включены у проекта. Блоки вне restricted доступны всегда.
      const cfg = (typeof window !== 'undefined' && window.PAGE_CONSTRUCTOR_CONFIG) || {}
      const restricted = cfg.block_types_restricted || []
      const allowed = cfg.block_types_allowed || []
      const allowType = (t) => !restricted.length
        || restricted.indexOf(t) === -1
        || allowed.indexOf(t) !== -1
      const res = (PC.search(SCHEMA, this.addQuery) || [])
        .map(g => ({ group: g.group, types: (g.types || []).filter(t => !!t.structural === wantStructural && allowType(t.type)) }))
        .filter(g => g.types.length)
      const ru = (a, b) => String(a).localeCompare(String(b), 'ru')
      res.forEach(g => { (g.types || []).sort((a, b) => ru(a.typeTitle, b.typeTitle)) })
      res.sort((a, b) => ru(a.group, b.group))
      return res
    },
    addFlat() {
      const out = []
      this.addResults.forEach(g => {
        g.types.forEach(t => {
          t.variants.forEach(v => {
            out.push({ group: g.group, type: t.type, typeTitle: t.typeTitle, variantKey: v.variantKey, variantLabel: v.variantLabel })
          })
        })
      })
      return out
    },
    editingBlock() {
      const self = this
      return this.blocks.filter(b => b._uid === self.editingUid)[0] || null
    },
    // По умолчанию показываем превью блока (или заглушку, если блок не
    // выбран). JSON включается только по кнопке «Показать JSON».
    asideMode() {
      return this.jsonVisible ? 'json' : 'preview'
    },
    // Есть ли несохранённые изменения (документ отличается от принятого бэком).
    isDirty() {
      return this.savedSnapshot !== '' && this.exportDocJson !== this.savedSnapshot
    },
    editingMarkup() {
      return this.editingBlock ? PC.renderBlock(this.editingBlock) : ''
    },
    previewTitle() {
      return this.editingBlock ? this.typeTitle(this.editingBlock.type) : ''
    },
    modalBlock() {
      const self = this
      return this.blocks.filter(b => b._uid === self.previewUid)[0] || null
    },
    fullBlocks() {
      if (this.role === 'structure') return this.blocks
      return [this.pageHeader, ...this.blocks, this.pageFooter].filter(Boolean)
    },
    displayCount() { return this.fullBlocks.length },
    exportDoc() { return PC.exportDocument({ blocks: this.fullBlocks }) },
    exportDocJson() { return JSON.stringify(this.exportDoc) },
    jsonText() { return JSON.stringify(this.exportDoc, null, 2) },
    totalItems() {
      return this.blocks.reduce((n, b) => n + ((b.items && b.items.length) || 0), 0)
    }
  },
  watch: {
    blocks: { deep: true, handler() { this.autosave() } },
    addResults() { this.addHighlight = 0 },
    editingMarkup(markup) { this.schedulePreview(markup) },
    configRev() { this.refreshPreviews() },
    expandIndex(i) { if (i >= 0) this.expandBlockByIndex(i) }
  },
  mounted() {
    this.load_doc(this.doc)
    // Блок, указанный в URL (/page/<id>/block/<n>), раскрываем сразу:
    // watcher на expandIndex срабатывает только при смене значения.
    if (this.expandIndex >= 0) this.$nextTick(() => this.expandBlockByIndex(this.expandIndex))
  },
  methods: {
    // Drag-ручка правой панели; ширина запоминается в localStorage.
    start_aside_resize(e) {
      const startX = e.clientX
      const startW = this.aside_w
      // Верхняя граница — доля окна (до 72%), но с гарантией минимума для
      // холста (360px), иначе при сильном сужении левой колонки карточки
      // блоков накладываются друг на друга.
      const minCanvas = 360
      const maxW = Math.max(260, Math.min(Math.round(window.innerWidth * 0.72), window.innerWidth - minCanvas - 12))
      const onMove = (ev) => {
        // панель справа: тянем влево — шире.
        this.aside_w = Math.min(Math.max(startW - (ev.clientX - startX), 260), maxW)
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        try { localStorage.setItem('pc_constructor_aside_w', String(this.aside_w)) } catch (_) {}
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    typeTitle(type) { const t = typeDef(type); return t ? (t.title || type) : type },
    variantTitle(type, variantKey) {
      const t = typeDef(type)
      if (!t) return variantKey || ''
      if (!variantKey || variantKey === 'default') return t.title || type
      const vd = (t.variants || {})[variantKey]
      return vd ? (vd.title || variantKey) : variantKey
    },
    paramsOf(block) { return PC.variantParams(block.type, block.variant) },
    formParams(block) {
      const vp = this.viewParam(block)
      const list = (this.paramsOf(block) || []).filter(p => !vp || p.name !== vp.name)
      // Режим Б («настройка выборки») — имя переменной шаблона не участвует,
      // поэтому поле прячем; у режима А оставляем как есть.
      if (this.isQueryMode(block)) return list.filter(p => p.name !== 'varname')
      return list
    },
    // Режим источника данных: Б = выборка в блоке (block_query).
    // Ключ «ручного режима» — только состояние UI, в JSON не попадает.
    customKey(pp, block) { return (block._uid || '') + '|' + pp.name; },
    isCustomField(pp, block) {
      if (pp.kind !== 'select' || !pp.allowCustom) return false
      return !!this.custom_fields[this.customKey(pp, block)]
    },
    setCustom(pp, block, on) {
      const key = this.customKey(pp, block)
      if (on) {
        this.custom_fields[key] = true
        // Значение из JSON сохраняем — просто показываем его в поле ввода.
      } else {
        delete this.custom_fields[key]
        block.params[pp.name] = (pp.options && pp.options[0]) ? pp.options[0].value : ''
      }
    },
    // Значение для select: свои значения (которых нет в готовых) показываем
    // первой опцией, чтобы выбор не слетел при открытии блока.
    selectValue(pp, block) {
      return this.isCustomField(pp, block) ? CUSTOM : (block.params[pp.name] !== undefined ? block.params[pp.name] : '')
    },
    selectOptions(pp, block) {
      const out = (pp.options || []).slice()
      if (!pp.allowCustom) return out
      const cur = block.params[pp.name]
      if (!this.isCustomField(pp, block) && cur !== undefined && cur !== null && cur !== '' &&
          !out.some(o => String(o.value) === String(cur))) {
        out.unshift({ value: cur, label: cur + ' (текущее)' })
      }
      out.push({ value: CUSTOM, label: 'Свой вариант…' })
      return out
    },
    onSelect(pp, block, value) {
      if (value === CUSTOM) { this.setCustom(pp, block, true); return }
      this.setCustom(pp, block, false)
      // <select> всегда отдаёт строку. Возвращаем исходный тип опции
      // (true/false/null/число), иначе «Нет» сохранится как строка "false"
      // и не переключит превью/движок.
      const opt = (pp.options || []).find(function (o) {
        const ov = (o.value === null || o.value === undefined) ? '' : String(o.value)
        return ov === String(value)
      })
      block.params[pp.name] = opt ? opt.value : value
    },
    isQueryMode(block) {
      const src = (block && block.params && block.params.source) || ''
      return src === 'block_query'
    },
    sourceParam(block) {
      return (this.paramsOf(block) || []).find(p => p.name === 'source') || null
    },
    isDataSourceBlock(block) { return !!this.sourceParam(block) },
    fieldsOf(block) { return PC.itemFields(block.type, block.variant) },
    isDataBlock(block) { const t = typeDef(block.type); return !!(t && t.data) },
    hasItems(block) { return !this.isDataBlock(block) && PC.itemFields(block.type, block.variant).length > 0 },
    hasViews(block) {
      const t = typeDef(block.type)
      return !!(t && t.variants && Object.keys(t.variants).length > 1)
    },
    // select-параметр, управляющий раскладкой (напр. goods: show=carousel|grid|…),
    // приоритетнее списка вариантов — иначе «Вид блока» не влияет на превью.
    viewParam(block) {
      return (this.paramsOf(block) || []).find(p =>
        p.kind === 'select' && Array.isArray(p.options) && p.options.length &&
        ['show', 'view', 'display'].includes(p.name)) || null
    },
    viewValue(block) {
      const vp = this.viewParam(block)
      if (vp) return block.params[vp.name] !== undefined ? block.params[vp.name] : ''
      return block.variant || ''
    },
    viewLabel(block) {
      const vp = this.viewParam(block)
      if (vp) {
        const val = block.params[vp.name]
        const o = (vp.options || []).find(x => x.value === val)
        return o ? o.label : (val || '')
      }
      if (!block.variant) return ''
      return this.variantTitle(block.type, block.variant)
    },
    viewOptions(block) {
      const vp = this.viewParam(block)
      if (vp) return vp.options.map(o => ({ key: o.value, label: o.label }))
      const t = typeDef(block.type) || {}
      return Object.keys(t.variants || {}).map(vk => {
        const vd = (t.variants || {})[vk] || {}
        return { key: vk === 'default' ? '' : vk, label: vd.title || (t.title || vk) }
      }).sort((a, b) => a.label.localeCompare(b.label, 'ru'))
    },
    setView(block, key) {
      const vp = this.viewParam(block)
      if (vp) {
        block.params[vp.name] = key
        const t = typeDef(block.type) || {}
        if (t.variants && t.variants[key]) block.variant = key
      } else {
        block.variant = key === 'default' ? '' : key
      }
      const defaults = {}
      PC.variantParams(block.type, block.variant).forEach(d => { defaults[d.name] = clone(d.default) })
      Object.keys(defaults).forEach(k => {
        if (block.params[k] === undefined || block.params[k] === null || block.params[k] === '') block.params[k] = defaults[k]
      })
      const fields = PC.itemFields(block.type, block.variant)
      const sample = PC.sampleItems(block.type, block.variant)
      if (!block.items || !block.items.length) {
        block.items = sample.map(it => clone(it))
      } else if (fields.length) {
        block.items = block.items.map((it, i) => {
          const out = clone(it)
          fields.forEach(f => {
            if (out[f.name] === undefined || out[f.name] === null) {
              const sv = sample[i] ? sample[i][f.name] : undefined
              out[f.name] = clone(sv !== undefined ? sv : f.default)
            }
          })
          return out
        })
      }
    },
    isImageField(f) {
      if (!f) return false
      if (f.kind === 'image') return true
      return /^(photo|image|img|logo|poster|avatar|picture|src|photo_url|image_url)$/i.test(f.name || '')
    },
    isEmojiField(f) {
      if (!f) return false
      return f.kind === 'emoji' || /^emoji$/i.test(f.name || '')
    },
    openPicker(block, scope, def, index) {
      if (!def) return
      this.picker = {
        uid: block._uid, scope: scope, name: def.name,
        index: (typeof index === 'number' ? index : -1),
        kind: this.isEmojiField(def) ? 'emoji' : 'image',
        folder: def.folder || ''
      }
      if (this.picker.kind === 'image') this.loadBlockImages(this.picker.folder)
    },
    // Список картинок проекта (/files/project_<id>/block-images[/<folder>]/).
    loadBlockImages(folder) {
      const cfg = (typeof window !== 'undefined' && window.PAGE_CONSTRUCTOR_CONFIG) || {}
      if (!cfg.api || typeof fetch === 'undefined') { this.projectImages = []; return }
      const url = cfg.api + '/block-images?domain_id=' + encodeURIComponent(cfg.domain_id || 0) +
        '&folder=' + encodeURIComponent(folder || '')
      fetch(url)
        .then(r => r.json())
        .then(d => { this.projectImages = (d && d.files) || [] })
        .catch(() => { this.projectImages = [] })
    },
    // Загрузка картинки в папку проекта; после — сразу выбрать.
    onUpload(ev) {
      const input = ev && ev.target
      const file = input && input.files && input.files[0]
      if (!file) return
      const cfg = window.PAGE_CONSTRUCTOR_CONFIG || {}
      const fd = new FormData()
      fd.append('domain_id', cfg.domain_id || 0)
      fd.append('folder', (this.picker && this.picker.folder) || '')
      fd.append('file', file)
      this.blockUploading = true
      fetch(cfg.api + '/block-images/upload', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(d => {
          this.blockUploading = false
          if (d && d.success && d.path) {
            this.pickValue(d.path)
            this.loadBlockImages((this.picker && this.picker.folder) || '')
          } else if (d && d.errors && d.errors.length) {
            this.toast = d.errors.join('; ')
          }
        })
        .catch(() => { this.blockUploading = false })
      if (input) input.value = ''
    },
    thumb(src) {
      const cfg = (typeof window !== 'undefined' && window.PAGE_CONSTRUCTOR_CONFIG) || {}
      if (src && String(src).indexOf('block-images/') === 0) return (cfg.filesBase || '') + src
      try { return PC.tplAsset(src) } catch (e) { return src }
    },
    closePicker() { this.picker = null },
    pickerIsEmoji() { return !!(this.picker && this.picker.kind === 'emoji') },
    pickerLabel() { return this.pickerIsEmoji() ? 'Выбор эмодзи' : 'Выбор изображения' },
    pickValue(val) {
      const p = this.picker
      if (!p) return
      let target = null
      for (let i = 0; i < this.blocks.length; i++) {
        if (this.blocks[i]._uid === p.uid) { target = this.blocks[i]; break }
      }
      if (!target) { this.picker = null; return }
      if (p.scope === 'param') target.params[p.name] = val
      else if (target.items && target.items[p.index]) target.items[p.index][p.name] = val
      this.picker = null
    },
    isStructural(block) { return !!(typeDef(block.type) && typeDef(block.type).structural) },
    hasStructural(type) { return this.blocks.some(b => b.type === type) },
    headerIndex() { return this.blocks.findIndex(b => b.type === 'header') },
    footerIndex() { return this.blocks.findIndex(b => b.type === 'footer') },
    movableStart() { return this.headerIndex() === -1 ? 0 : 1 },
    movableEnd() { return this.footerIndex() === -1 ? this.blocks.length : this.blocks.length - 1 },
    openAddModal() {
      this.showAddModal = true
      this.addQuery = ''
      this.addHighlight = 0
      this.$nextTick(() => {
        const el = document.querySelector('.pc-addmodal__input')
        if (el) el.focus()
      })
    },
    closeAddModal() { this.showAddModal = false },
    pick(cand) {
      if (!cand) return
      this.addBlock(cand.type, cand.variantKey)
      this.closeAddModal()
    },
    pickHighlighted() { this.pick(this.addFlat[this.addHighlight]) },
    onAddKeydown(e) {
      const n = this.addFlat.length
      if (e.key === 'ArrowDown') { e.preventDefault(); this.addHighlight = n ? (this.addHighlight + 1) % n : 0 }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.addHighlight = n ? (this.addHighlight - 1 + n) % n : 0 }
      else if (e.key === 'Enter') { e.preventDefault(); this.pickHighlighted() }
      else if (e.key === 'Escape') { e.preventDefault(); this.closeAddModal() }
    },
    flatIndexOf(type, variantKey) {
      for (let i = 0; i < this.addFlat.length; i++) {
        const c = this.addFlat[i]
        if (c.type === type && c.variantKey === variantKey) return i
      }
      return -1
    },
    isHighlighted(type, variantKey) { return this.flatIndexOf(type, variantKey) === this.addHighlight },
    makeBlock(type, variantKey) {
      const t = typeDef(type)
      if (!t) return null
      const variant = variantKey || t.default_variant || Object.keys(t.variants || {})[0] || 'default'
      const defs = PC.variantParams(type, variant) || []
      const params = defaultsFromParams(defs)
      const vp = defs.find(p => p.kind === 'select' && Array.isArray(p.options) && p.options.length &&
        ['show', 'view', 'display'].includes(p.name))
      if (vp && vp.options.some(o => o.value === variant)) params[vp.name] = variant
      return {
        _uid: nextUid(),
        type: type,
        variant: variant === 'default' ? '' : variant,
        fill: '', anim: '', bleed: false,
        params: params,
        items: PC.sampleItems(type, variant).map(it => defaultsFromFields(PC.itemFields(type, variant), it))
      }
    },
    addBlock(type, variantKey) {
      const t = typeDef(type)
      if (!t) return
      if (t.structural && this.hasStructural(type)) {
        this.flash(this.typeTitle(type) + ' уже есть на странице')
        return
      }
      const block = this.makeBlock(type, variantKey)
      if (!block) return
      if (type === 'header') this.blocks.unshift(block)
      else if (type === 'footer') this.blocks.push(block)
      else {
        const fi = this.footerIndex()
        if (fi === -1) this.blocks.push(block); else this.blocks.splice(fi, 0, block)
      }
      this.flash('Добавлен блок: ' + this.typeTitle(type))
    },
    removeBlock(idx) {
      const b = this.blocks[idx]
      if (b && b._uid === this.editingUid) this.editingUid = null
      this.blocks.splice(idx, 1)
    },
    duplicateBlock(idx) {
      const src = this.blocks[idx]
      if (!src || this.isStructural(src)) return
      const copy = clone(src)
      copy._uid = nextUid()
      this.blocks.splice(idx + 1, 0, copy)
    },
    moveBlock(idx, dir) {
      const block = this.blocks[idx]
      if (!block || this.isStructural(block)) return
      const to = idx + dir
      if (to < this.movableStart() || to >= this.movableEnd()) return
      const b = this.blocks.splice(idx, 1)[0]
      this.blocks.splice(to, 0, b)
    },
    toggleForm(block) {
      if (this.editingUid === block._uid) { this.editingUid = null; this.emitEditBlock(); return }
      this.editingUid = block._uid
      this.scrollToBlock(block._uid)
      this.emitEditBlock()
    },
    // Родителю нужен номер раскрытого блока, чтобы отразить его в URL.
    emitEditBlock() {
      const idx = this.editingBlock ? this.blocks.indexOf(this.editingBlock) : -1
      this.$emit('edit-block', idx)
    },
    expandBlockByIndex(i) {
      const n = parseInt(i, 10)
      if (isNaN(n) || n < 0 || n >= this.blocks.length) return
      const block = this.blocks[n]
      this.editingUid = block._uid
      this.scrollToBlock(block._uid)
    },
    toggleJson() { this.jsonVisible = !this.jsonVisible },
    /* Сохранить без закрытия редактора: отдаём документ наружу (PageConstructor
       знает API), сами факт приёма подтверждаем через applySaveResult(). */
    saveNow() {
      if (this.saving) return
      this.saving = true
      this.saveState = 'saving'
      this.$emit('save', this.exportDoc)
    },
    /* Вызывается родителем после ответа бэкенда. */
    applySaveResult(ok, message) {
      const self = this
      this.saving = false
      this.saveState = ok ? 'saved' : 'error'
      if (ok) this.savedSnapshot = this.exportDocJson
      this.flash(message || (ok ? 'Сохранено' : 'Ошибка сохранения'))
      // «сохранено» держим 1.8 c, потом кнопка возвращается для следующей правки
      clearTimeout(this._saveTimer)
      this._saveTimer = setTimeout(() => { if (self.saveState === 'saved') self.saveState = '' }, 1800)
    },
    scrollToBlock(uid) {
      this.$nextTick(() => {
        const el = this.$el.querySelector('[data-uid="' + uid + '"]')
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    },
    isOpen(block) { return this.editingUid === block._uid },
    addItem(block) { block.items.push(defaultsFromFields(this.fieldsOf(block))) },
    removeItem(block, i) { block.items.splice(i, 1) },
    schedulePreview(markup) {
      const self = this
      clearTimeout(this._previewTimer)
      this._previewTimer = setTimeout(() => {
        self.previewSrc = PC.buildPreviewDoc(markup, self.editingBlock ? self.editingBlock.type : null)
      }, 300)
    },
    openBlockPreview(block) {
      this.previewUid = block._uid
      this.modalSrc = PC.buildPreviewDoc(PC.renderBlock(block), block.type)
    },
    closeBlockPreview() { this.previewUid = null },
    openPagePreview() {
      const blocks = this.fullBlocks
      this.pageSrc = PC.buildPreviewDoc(PC.renderAll(blocks), blocks.map(b => b.type))
      this.showPagePreview = true
    },
    closePagePreview() { this.showPagePreview = false },
    refreshPreviews() {
      if (this.asideMode === 'preview' && this.editingBlock) {
        clearTimeout(this._previewTimer)
        this.previewSrc = PC.buildPreviewDoc(this.editingMarkup, this.editingBlock.type)
      }
      if (this.showPagePreview) {
        const blocks = this.fullBlocks
        this.pageSrc = PC.buildPreviewDoc(PC.renderAll(blocks), blocks.map(b => b.type))
      }
      if (this.previewUid !== null && this.modalBlock) {
        this.modalSrc = PC.buildPreviewDoc(PC.renderBlock(this.modalBlock), this.modalBlock.type)
      }
    },
    onFrameLoad(e) {
      const f = e.target
      const resize = () => {
        try {
          const d = f.contentDocument
          if (d && d.body) f.style.height = Math.max(220, d.body.scrollHeight + 8) + 'px'
        } catch (err) { /* cross-origin */ }
      }
      // Сторож: если какая-то ссылка всё же уволила iframe (кириллица в
      // href, скрипт-обход, Turbolinks-подобный код) — возвращаем документ.
      this.guardFrame(f)
      resize()
      setTimeout(resize, 400)
      setTimeout(resize, 1200)
      try {
        const w = f.contentWindow, d2 = f.contentDocument
        if (!f.__pcRO && w && w.ResizeObserver && d2 && d2.body) {
          f.__pcRO = new w.ResizeObserver(resize)
          f.__pcRO.observe(d2.body)
        }
      } catch (err) { /* ignore */ }
    },
    // Подстраховка к скрипту в preview.js: если документ iframe сменился
    // (переход по ссылке), пересобираем srcdoc — превью восстанавливается.
    guardFrame(f) {
      if (!f) return
      if (f.__pcGuard) return
      f.__pcGuard = true
      let lastDoc = null
      const check = () => {
        let doc = null
        try { doc = f.contentDocument } catch (err) { doc = null }
        if (!doc) return
        if (lastDoc && doc !== lastDoc) this.restoreFrame(f)
        lastDoc = doc
      }
      const timer = setInterval(() => {
        if (!f.isConnected) { clearInterval(timer); return }
        check()
      }, 700)
    },
    restoreFrame(f) {
      if (f.__pcRestore) return
      f.__pcRestore = true
      const which = (f.dataset.pcFrame || '')
      if (which === 'page') {
        const blocks = this.fullBlocks
        this.pageSrc = PC.buildPreviewDoc(PC.renderAll(blocks), blocks.map(b => b.type))
      } else if (which === 'modal') {
        if (this.modalBlock) this.modalSrc = PC.buildPreviewDoc(PC.renderBlock(this.modalBlock), this.modalBlock.type)
      } else if (this.editingBlock) {
        this.previewSrc = PC.buildPreviewDoc(PC.renderBlock(this.editingBlock), this.editingBlock.type)
      }
      const done = () => { f.__pcRestore = false }
      this.$nextTick(() => setTimeout(done, 300))
    },
    canDrag(block) { return !this.isStructural(block) },
    onDragStart(idx, e) {
      const block = this.blocks[idx]
      if (!block || this.isStructural(block)) { e.preventDefault(); return }
      this.dragIndex = idx; this.dragOverIndex = idx
      try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)) } catch (err) { /* noop */ }
    },
    onDragOver(idx, e) {
      if (this.dragIndex === null) return
      if (this.dragOverIndex !== idx) this.dragOverIndex = idx
      e.preventDefault()
      try { e.dataTransfer.dropEffect = 'move' } catch (err) { /* noop */ }
    },
    onDrop(idx, e) {
      e.preventDefault()
      const from = this.dragIndex
      this.dragIndex = null; this.dragOverIndex = null
      if (from === null || from === idx) return
      const block = this.blocks[from]
      if (!block || this.isStructural(block)) return
      const to = Math.max(this.movableStart(), Math.min(idx, this.movableEnd() - 1))
      if (to === from) return
      const b = this.blocks.splice(from, 1)[0]
      this.blocks.splice(to, 0, b)
    },
    onDragEnd() { this.dragIndex = null; this.dragOverIndex = null },
    dropClass(idx) {
      if (this.dragIndex === null || this.dragOverIndex !== idx || this.dragIndex === idx) return ''
      return idx < this.dragIndex ? 'is-drop-before' : 'is-drop-after'
    },
    resetAll() {
      if (this.blocks.length && !window.confirm('Очистить страницу? Действие необратимо.')) return
      this.blocks = []; this.editingUid = null; this.flash('Страница очищена')
    },
    loadExample() { this.importDoc(example_block_list); this.flash('Пример загружен') },
    importDoc(doc) {
      if (!doc || !Array.isArray(doc.blocks)) return
      this.blocks = doc.blocks.map(b => makeEditable(b))
      this.editingUid = null
      this.normalizeOrder()
      this.syncCustomFields()
      // Документ принят бэкендом — с этого момента isDirty ловит правки.
      const self = this
      this.$nextTick(() => { self.savedSnapshot = self.exportDocJson })
    },
    normalizeOrder() {
      const header = this.blocks.filter(b => b.type === 'header')[0]
      const footer = this.blocks.filter(b => b.type === 'footer')[0]
      const rest = this.blocks.filter(b => b.type !== 'header' && b.type !== 'footer')
      this.blocks = (header ? [header] : []).concat(rest).concat(footer ? [footer] : [])
    },
    // Значение параметра не совпало с готовыми опциями → показываем поле ввода.
    syncCustomFields() {
      const self = this
      this.blocks.forEach(b => {
        ;(this.paramsOf(b) || []).forEach(pp => {
          if (pp.kind !== 'select' || !pp.allowCustom) return
          const cur = b.params[pp.name]
          if (cur === undefined || cur === null || cur === '') return
          if (!(pp.options || []).some(o => String(o.value) === String(cur))) {
            self.custom_fields[self.customKey(pp, b)] = true
          }
        })
      })
    },
    load_doc(doc) {
      const all = (doc && Array.isArray(doc.blocks)) ? doc.blocks : []
      if (this.role === 'structure') {
        this.pageHeader = null
        this.pageFooter = null
        this.importDoc({ blocks: all.filter(b => b.type === 'header' || b.type === 'footer') })
        this._loaded = true
        return
      }
      const h = all.filter(b => b.type === 'header')[0] || this.header
      const f = all.filter(b => b.type === 'footer')[0] || this.footer
      this.pageHeader = h ? makeEditable(h) : null
      this.pageFooter = f ? makeEditable(f) : null
      this.importDoc({ blocks: all.filter(b => b.type !== 'header' && b.type !== 'footer') })
      this._loaded = true
    },
    autosave() {
      if (!this._loaded) return
      this.lastSavedAt = new Date().toLocaleTimeString('ru-RU')
      this.$emit('change', this.exportDoc)
    },
    copyJson() {
      const self = this
      PC.copyText(this.jsonText).then(ok => { self.flash(ok ? 'JSON скопирован' : 'Не удалось скопировать') })
    },
    flash(msg) {
      const self = this
      this.toast = msg
      clearTimeout(this._toastTimer)
      this._toastTimer = setTimeout(() => { self.toast = '' }, 2200)
    }
  }
}
</script>
<style src="./constructor.css"></style>
