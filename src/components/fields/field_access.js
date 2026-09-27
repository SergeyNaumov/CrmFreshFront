import { bus } from '../../main'

// Доступ поля к контроллеру формы. Если контроллер предоставлен через
// provide('formController') — вызываем метод напрямую (scoped, изолированно).
// Иначе откатываемся на глобальный bus (мост на время миграции).
export default {
  inject: {
    formController: { default: null }
  },
  methods: {
    emitChange(field) {
      if (this.formController && this.formController.changeField) {
        this.formController.changeField(field)
      } else {
        bus.$emit('change_field', field)
      }
    },
    emitSaveField1ToM(data) {
      if (this.formController && this.formController.saveField1ToM) {
        this.formController.saveField1ToM(data)
      } else {
        bus.$emit('save_field_1_to_m', data)
      }
    },
    emitFrontendButton(field, button, success) {
      if (this.formController && this.formController.runFrontendButton) {
        this.formController.runFrontendButton(field, button, success)
      } else {
        bus.$emit('frontend_button_process', field, button, success)
      }
    }
  }
}
