<template>
  <div class="page_blocks">
    <errors :errors="errors" v-show="errors.length"></errors>
    <!-- Режим задаётся полем mode: text — wysiwyg, blocks — редактор текстовых блоков. -->
    <field-wysiwyg v-if="mode !== 'blocks'" :form="form" :field="field" />
    <BlockEditor
      v-else
      :doc="doc"
      :allowed-types="['text']"
      compact
      @change="onBlocks"
    />
  </div>
</template>
<script>
// Двухрежимное поле ds_text.body:
//   mode=text   — обычный wysiwyg (HTML);
//   mode=blocks — JSON конверта svcms.page_blocks (только блоки type=text).
// В blocks-режиме переиспользуется BlockEditor конструктора страниц.
import FieldWysiwyg from './wysiwyg.vue'
import BlockEditor from '../svcmsAdmin/page_constructor/editor/BlockEditor.vue'

const EMPTY = { schema: 'svcms.page_blocks', version: 2, blocks: [] }

export default {
  name: 'field-page_blocks',
  components: { FieldWysiwyg, BlockEditor },
  props: ['form', 'field'],
  data() {
    return {
      errors: [],
      doc: null,
    }
  },
  created() {
    this.doc = this.parseDoc(this.field.value)
  },
  computed: {
    // Режим из поля mode той же формы (formController из mixin field_access).
    mode() {
      const f = this.formController ? this.formController.getField('mode') : null
      return (f && f.value) || 'text'
    },
  },
  watch: {
    mode() {
      // При переключении режима пересобираем документ из текущего значения.
      this.doc = this.parseDoc(this.field.value)
    },
  },
  methods: {
    parseDoc(raw) {
      if (raw && typeof raw === 'object') return raw
      if (typeof raw === 'string' && raw.trim().startsWith('{')) {
        try {
          const d = JSON.parse(raw)
          if (d && Array.isArray(d.blocks)) return d
        } catch (e) {
          this.errors = ['Содержимое не является корректным JSON блоков — начинаем с пустого списка']
        }
      }
      return JSON.parse(JSON.stringify(EMPTY))
    },
    onBlocks(doc) {
      this.doc = doc
      this.field.value = JSON.stringify(doc)
      this.field.from = 'field-page_blocks (page_blocks.vue)'
      this.emitChange(this.field)
    },
  },
}
</script>
<style scoped>
.page_blocks {
  width: 100%;
}
</style>
