<template>
    <div>
      <!-- Диалоговое окно для отображения ошибок -->
      <v-dialog v-model="dialog" max-width="800px">
        <v-card>
          <div class="err" v-for="(error, index) in errors" :key="index">{{ error }}</div>
        </v-card>
      </v-dialog>
  
      <!-- Компонент для создания нового пакета документов -->
      <docpack_new
        v-if="!field.not_create_docpack"
        :form="form"
        :field="field"
        :refresh_docpack_list="load"
      />
  
      <!-- Отладочная информация (скрыта) -->
      <pre v-if="false">{{ permissions }}</pre>
  
      <!-- Список пакетов документов -->
      <v-card class="one_to_m" v-for="dp in list" :key="dp.id">
        <!-- Удаление пакета, если он не содержит счетов -->
        <div v-if="dp.cnt_bill === 0">
          Пакет документов не содержит счетов, его можно
          <a href="#" @click.prevent="remove(dp)">удалить</a>.
        </div>
  
        <!-- Основная информация о пакете -->
        <v-list-item>
          <div>
            <div>
              <v-icon small color="primary">edit</v-icon>
              <a :href="`/edit_form/docpack/${dp.id}`" target="_blank">Редактировать пакет документов</a>
            </div>
            <div>Тариф: <a :href="`/edit_form/tarif/${dp.tarif_id}`" target="_blank">{{ dp.tarif }}</a></div>
            <div>Юр.лицо: <a :href="`/edit_form/ur_lico/${dp.ur_lico_id}`" target="_blank">{{ dp.ur_lico }}</a></div>
            <div>Менеджер: {{ dp.manager }} / {{ dp.registered }}</div>
  
            <!-- Список договоров в пакете -->
            <dogovor
              v-for="dogovor in dp.dogovor_list"
              :key="dogovor.id"
              :field="field"
              :dogovor="dogovor"
              :services="services"
              :config="form.config"
              :form="form"
              :docpack="dp"
              :permissions="permissions"
            />
          </div>
        </v-list-item>
      </v-card>
  
      <!-- Дополнительный HTML из поля field.after_html -->
      <div v-html="field.after_html"></div>
    </div>
  </template>
  
  <script>
  import { bus } from '../../main';
  import Dogovor from './docpack/dogovor.vue';
  import DocpackNew from './docpack/docpack_new.vue';
  
  export default {
    components: {
      dogovor: Dogovor,
      docpack_new: DocpackNew,
    },
    props: {
      form: {
        type: Object,
        required: true,
      },
      field: {
        type: Object,
        required: true,
      },
      parent: {
        type: Object,
        default: null,
      },
      refresh: {
        type: Function,
        default: () => {},
      },
    },
    data() {
      return {
        list: [], // Список пакетов документов
        errors: [], // Список ошибок
        permissions: {}, // Права доступа
        dialog: false, // Флаг для отображения диалогового окна
      };
    },
    created() {
      if (this.form.id) {
        this.load();
      }
    },
    methods: {
      /**
       * Загружает список пакетов документов.
       */
      load() {
        const formId = this.field.form_id || this.form.id;
        this.$http
          .post(
            `${BackendBase}/docpack/${this.form.config}/${this.field.name}`,
            {
              action: 'list',
              id: this.form.id,
              form_id_alternative: this.field.form_id || null,
              only_dogovor: this.field.only_dogovor || null,
            }
          )
          .then((response) => {
            const data = response.data;
            if (data.success) {
              this.list = data.list.map((dp) => ({ ...dp, dogovor_list_show: false }));
              this.services = data.services;
              this.permissions = data.permissions;
            }
            this.errors = data.errors;
          })
          .catch((error) => {
            console.error('Ошибка при загрузке списка пакетов:', error);
          });
      },
  
      /**
       * Удаляет пакет документов.
       * @param {Object} dp - Пакет документов для удаления.
       */
      remove(dp) {
        this.$http
          .post(
            `${BackendBase}/docpack/${this.form.config}/${this.field.name}`,
            {
              action: 'docpack_delete',
              id: this.form.id,
              docpack_id: dp.id,
            }
          )
          .then((response) => {
            const data = response.data;
            if (data.success) {
              this.list = this.list.filter((item) => item.id !== dp.id);
            }
            this.errors = data.errors;
            if (this.errors.length) {
              this.dialog = true;
            }
          })
          .catch((error) => {
            console.error('Ошибка при удалении пакета:', error);
          });
      },
  
      /**
       * Открывает страницу редактирования пакета документов в новой вкладке.
       * @param {number} id - ID пакета документов.
       */
      toDocpackEdit(id) {
        window.open(`/edit_form/docpack/${id}`, '_blank');
      },
    },
  };
  </script>
  
  <style scoped>
  .new {
    margin-bottom: 10px;
  }
  .v-icon {
    margin-right: 10px;
  }
  .header {
    display: inline-block;
    font-weight: bold;
    max-width: 40%;
  }
  .to_dp_link {
    font-size: 0.8rem;
  }
  .v-card div {
    padding-bottom: 10px;
  }
  </style>