<template>
  <form autocomplete="off" @submit.prevent="save()">
    <v-row>
      <template v-if="cols.length"> <!-- Колонки, блоки -->
        <v-col class="pl-3" :md="12/Math.floor(cols.length)" cols="12" v-for="c in cols" :key="c.idx">

          <v-card class="block" v-for="block in c" :key="block.name">
            <v-toolbar color="primary" dark height="35px" @click="block_toggle(block)">
              <v-toolbar-title>
                <v-icon v-if="!block.hide">keyboard_arrow_up</v-icon>
                <v-icon v-if="block.hide">keyboard_arrow_down</v-icon>
                <span>{{block.description}} </span>
              </v-toolbar-title>
              <div class="flex-grow-1"></div>
            </v-toolbar>

            <div v-show="!block.hide" pb-1>
              <form-block :block_name="block.name" :form="form" :save="save" :values="values"></form-block>
              <v-col cols="12" lg="12" class="text-lg-center" v-if="show_save">
                <v-btn color="primary" v-if="!form.read_only && !block.not_save_button" :disabled="disabled_form" @click="save()">Сохранить</v-btn>
              </v-col>
            </div>
          </v-card>

        </v-col>
      </template>
      <template v-else-if="tabs.length"> <!-- Табы -->
        <v-tabs v-model="tab">
          <v-tab v-for="(tab,idx) in tabs" :key="'tab'+idx" :style="tab.style" v-html="tab.description"/>
        </v-tabs>
        <v-col md="12">
          <v-card style="width: 100%;">
            <v-window v-model="tab">
              <v-window-item v-for="(tab,idx) in tabs" :key="'tabitm'+idx">
                <form-block :block_name="tab.name" :form="form" :save="save" :values="values"></form-block>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
      </template>
      <template v-else>
        <v-col md="12">
          <v-card style="padding: 1rem 0;">
            <form-block :block_name="''" :form="form" :save="save" :values="values"></form-block>
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
    show_save: { type: Boolean, default: true }
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
    }
  }
}
</script>
