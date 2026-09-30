<template>
  <v-dialog v-model="dialog" :max-width="dialog_width" scrollable>
    <v-card>
      <v-card-title class="text-h5">{{ form.title || tree_form.title }}</v-card-title>
      <v-card-text>
        <errors v-if="fatal_errors.length" :errors="fatal_errors"/>
        <errors v-else-if="errors.length" :errors="errors"/>
        <FormBody
          v-else-if="data_loaded"
          :form="form" :cols="cols" :tabs="tabs"
          :values="values" :save="save_modal" :disabled_form="disabled_form"
          :show_save="false" :framed="false"
        />
      </v-card-text>
      <v-card-actions>
        <div class="flex-grow-1"></div>
        <v-btn color="primary" variant="outlined" @click="close_edit_form">Закрыть форму</v-btn>
        <v-btn color="primary" variant="elevated" v-if="data_loaded && !fatal_errors.length && !form.read_only" :disabled="disabled_form" @click="save_modal">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
import FormBody from '../EditForm/FormBody.vue'
import form_controller from '../EditForm/form_controller.js'

export default {
  name: 'formInBranch',
  components: { FormBody },
  mixins: [form_controller],
  props: {
    tree_form: { type: Object, required: true },
    item: { type: Object },
    close_edit_form: { type: Function, required: true },
    upload_header: { type: Function, required: true }
  },
  data() {
    return {
      data_loaded: false,
      dialog: true
    }
  },
  computed: {
    dialog_width() {
      return (this.form && this.form.wide_form) ? '1100px' : '700px'
    }
  },
  watch: {
    dialog(v) {
      if (!v) this.close_edit_form()
    }
  },
  created() {
    this.params = { config: this.tree_form.config, id: this.item.id, action: 'edit' }
    this.load_form(
      `${BackendBase}/edit-form/${this.tree_form.config}/${this.item.id}`,
      {},
      { redirect: false, document_title: false }
    ).then(() => {
      this.data_loaded = true
      this.focus_header()
    })
  },
  methods: {
    save_modal() {
      return this.save_form({}).then(R => {
        if (R && R.success) {
          if (this.tree_form.header_field) {
            this.upload_header(this.item.id, this.values[this.tree_form.header_field])
          }
          this.close_edit_form()
        }
      })
    },
    focus_header() {
      if (!this.tree_form.header_field) return
      this.$nextTick(() => {
        let el = document.getElementById(this.tree_form.header_field)
        if (el && el.focus) el.focus()
      })
    }
  }
}
</script>
<style scoped>
</style>
