<template>
  <form autocomplete="off" @submit.prevent="save()">
    <v-row>
      <template v-if="cols.length"> <!-- Колонки, блоки -->
        <v-col class="pl-3" :md="12/Math.floor(cols.length)" cols="12" v-for="c in cols" :key="c.idx">

          <template v-for="block in c" :key="block.name">
          <v-card class="block" :class="{flat: !framed}" v-if="block_has_fields(block.name)">
            <v-toolbar class="block_toolbar" color="primary" height="38" @click="block_toggle(block)">
              <v-toolbar-title class="block_title">
                <v-icon v-if="!block.hide">keyboard_arrow_up</v-icon>
                <v-icon v-if="block.hide">keyboard_arrow_down</v-icon>
                <span>{{block.description}}</span>
              </v-toolbar-title>
            </v-toolbar>

            <div v-show="!block.hide" class="block_body">
              <form-block :block_name="block.name" :form="form" :save="save" :values="values"></form-block>
              <v-col cols="12" lg="12" class="text-lg-center" v-if="show_save && block_has_fields(block.name)">
                <v-btn color="primary" v-if="!form.read_only && !block.not_save_button" :disabled="disabled_form" @click="save()">Сохранить</v-btn>
              </v-col>
            </div>
          </v-card>
          </template>

        </v-col>
      </template>
      <template v-else-if="tabs.length"> <!-- Табы -->
        <v-tabs v-model="tab">
          <v-tab v-for="(tab,idx) in tabs" :key="'tab'+idx" :style="tab.style" v-html="tab.description"/>
        </v-tabs>
        <v-col md="12">
          <v-card style="width: 100%;" :class="{flat: !framed}">
            <v-window v-model="tab">
              <v-window-item v-for="(tab,idx) in tabs" :key="'tabitm'+idx">
                <div class="block_body">
                  <form-block :block_name="tab.name" :form="form" :save="save" :values="values"></form-block>
                </div>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </template>
      <template v-else>
        <v-col md="12">
          <v-card class="block_card" :class="{flat: !framed}">
            <div class="block_body">
              <form-block :block_name="''" :form="form" :save="save" :values="values"></form-block>
            </div>
            <v-col cols="12" lg="12" class="text-lg-center" v-if="show_save">
              <v-btn color="primary" v-if="!form.read_only" :disabled="disabled_form" @click="save()">Сохранить</v-btn>
            </v-col>
          </v-card>
        </v-col>
      </template>
    </v-row>
  </form>
</template>
<script>
export default {
  name: 'form-body',
  props: {
    form: { type: Object, required: true },
    cols: { type: Array, default: () => [] },
    tabs: { type: Array, default: () => [] },
    values: { type: Object, default: () => ({}) },
    save: { type: Function, required: true },
    disabled_form: { type: Boolean, default: false },
    show_save: { type: Boolean, default: true },
    framed: { type: Boolean, default: true }
  },
  data() {
    return {
      tab: null
    }
  },
  methods: {
    block_toggle(block) {
      block.hide = !block.hide
      if (!block.hide && block.on_show) {
        eval(block.on_show)
      }
    },
    block_has_fields(name) {
      return this.form.fields.some(f => f.tab === name)
    }
  }
}
</script>
<style scoped>
/* Карточка блока/формы: выраженная граница + мягкая тень */
.v-card.block,
.v-card.block_card {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  border-radius: var(--app-radius-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.v-card.block {
  margin-bottom: var(--app-space-section);
}
.block_toolbar {
  margin-top: 0;
}
.block_title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}
.block_title .v-icon {
  font-size: 18px !important;
}
/* В широком двухколоночном контейнере блоки чуть плотнее */
.container_wide .v-card.block {
  margin-bottom: 16px;
}
/* Без рамки (модалка / вложенные формы): без границы/тени/фона */
.v-card.flat {
  border: 0 !important;
  box-shadow: none !important;
  background: transparent !important;
}
.v-card.flat > .block_body,
.v-card.flat .block_body {
  padding: 0.5rem 0;
}
/* Внутренние отступы: поля чуть уже, не прилипают к краям карточки */
.block_body {
  padding: 12px 20px 8px;
}
/* FormBlock — дочерний компонент, его корень также имеет class block.
   Убираем его верхний отступ, чтобы не было двойного отступа в карточке. */
.block_body > .block {
  margin-top: 0;
}
</style>
