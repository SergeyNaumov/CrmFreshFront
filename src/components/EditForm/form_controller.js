import { bus } from '../../main'
import {
  change_field,
  save_field_1_to_m,
  frontend_button_process,
  calc_values
} from '../js/edit_form.js'

// Общий контроллер формы (Vue 3 Options API mixin).
// Даёт scoped-доступ полям через provide('formController'), сохраняя bus как
// временный мост для немигрированных полей и серверного javascript_static.
export default {
  data() {
    return {
      form: {
        id: '',
        title: '',
        read_only: false,
        fields: [],
        config: ''
      },
      cols: [],
      tabs: [],
      tab: null,
      values: {},
      errors: [],
      log: [],
      fatal_errors: [],
      disabled_form: false,
      title: '',
      params: { config: '' }
    }
  },
  provide() {
    const vm = this
    return {
      formController: {
        changeField: (field, not_frontend_process) => change_field(vm, field, not_frontend_process),
        saveField1ToM: (data) => save_field_1_to_m(vm, data),
        runFrontendButton: (field, button, success) => frontend_button_process(vm, field, button, success),
        getField: (name) => vm.get_field_by_name(name)
      }
    }
  },
  created() {
    window.EditForm = this

    calc_values(this)

    this._change_field = (field, not_frontend_process) => {
      change_field(this, field, not_frontend_process)
    }
    this._save_field_1_to_m = (data) => {
      save_field_1_to_m(this, data)
    }
    this._frontend_button_process = (field, button_name, success_function) => {
      frontend_button_process(this, field, button_name, success_function)
    }

    bus.$on('change_field', this._change_field)
    bus.$on('save_field_1_to_m', this._save_field_1_to_m)
    bus.$on('frontend_button_process', this._frontend_button_process)
  },
  beforeUnmount() {
    bus.$off('change_field', this._change_field)
    bus.$off('save_field_1_to_m', this._save_field_1_to_m)
    bus.$off('frontend_button_process', this._frontend_button_process)
  },
  methods: {
    init_tabs(d) {
      if ('tabs' in d && d.tabs.length) {
        let i = 0
        for (let t of d.tabs) {
          t.active = i ? false : true
          i++
        }
        this.tabs = d.tabs
      }
    },
    get_form_self() {
      return this
    },
    // options: { redirect, document_title }
    load_form(url, cgi_params, options) {
      options = options || {}
      return this.$http.post(
        url,
        { cgi_params: cgi_params || {} }
      ).then(response => {
        let data = response.data
        if (data.log) this.log = data.log

        if (options.redirect && data.redirect && data.redirect != location.pathname) {
          localStorage.setItem('link_prev_login', location.href)
          location.href = data.redirect
          return null
        }

        if (data.success) {
          if (data.title && options.document_title !== false) {
            this.title = data.title
            document.title = this.title.replace(/<.+?>/g, ' ')
          }

          for (let f of data.fields)
            if (!('hide' in f))
              f.hide = false
          this.form = data
          this.form.read_only = parseInt(this.form.read_only)
          calc_values(this)

          this.cols = data.cols

          this.init_tabs(data)

          for (let f of this.form.fields) {
            if (f.type == 'file' && f.value) {
              f.begin_value = f.value, f.value = ''
            }
            if (f.type == 'checkbox' || f.type == 'switch') {
              f.value = parseInt(f.value) ? 1 : 0
              this.values[f.name] = f.value
            }
          }
        }

        if (data.javascript) {
          eval(data.javascript)
        }

        if (data.javascript_static) {
          for (let src of data.javascript_static) {
            let script = document.createElement('script')
            script.src = src
            document.head.appendChild(script)
          }
        }

        this.fatal_errors = data.errors
        return data
      }).catch(e => {
        this.fatal_errors = [e]
        return null
      })
    },
    save_form(cgi_params) {
      let url = BackendBase + '/edit-form/' + this.params.config + (this.form.id ? ('/' + this.form.id) : '')
      this.errors = []
      this.log = []

      return this.$http.post(url, {
        action: this.form.id ? 'update' : 'insert',
        id: this.form.id,
        values: this.values,
        cgi_params: cgi_params || {}
      }).then(response => {
        let R = response.data
        if (R.log) this.log = R.log
        this.errors = R.errors || []

        if (R.success) {
          if (R.id) this.form.id = R.id
          if (this.form.id) this.save_files()
          if (typeof this.after_save == 'function') this.after_save(R)
        }
        return R
      }).catch(e => {
        this.errors = ['Произошла ошибка при сохранении!: ' + e]
        return null
      })
    },
    after_save() {},
    // Загрузка файлов в форму
    save_files() {
      for (let f of this.form.fields) {
        if (f.type == 'file' && f.value) {
          this.$http.post(
            BackendBase + '/edit-form/' + this.params.config + '/' + this.form.id,
            {
              action: 'upload_file',
              name: f.name,
              value: f.value
            }
          ).then(
            r => {
              let R = r.data
              this.errors = R.errors
              if (R.success) {
                bus.$emit('file:' + f.name, R.value)
              }
            }
          ).catch(
            e => {
              this.errors = ['Ошибка при сохранении файла ' + f.description + ': ' + e]
            }
          )
        }
      }
    },
    init_color_selects() {
      for (let field of this.form.fields) {
        if (field.type == 'select') {
          for (let v of field.values) {
            if (v.v == field.value) {
              if (v['c'])
                field.background_color = v.c
            }
          }
        }
      }
    },
    block_toggle(block) {
      block.hide = !block.hide
      if (!block.hide && block.on_show) {
        eval(block.on_show)
      }
    },
    get_field_by_name(name) {
      for (let f of this.form.fields) {
        if (f.name == name) {
          return f
        }
      }
    }
  }
}
