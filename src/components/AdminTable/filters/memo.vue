<template>
  <div>
    <!-- Описание поля -->
    <div class="description">{{ field.description }}:</div>

    <!-- Меню выбора даты "С" -->
    <v-row no-gutters>
      <v-col cols="12">
        <v-menu
          v-model="menu_from"
          :close-on-content-click="true"
          transition="scale-transition"
          offset-y
          readonly
          min-width="290px"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="field.registered_low"
              label="С"
              prepend-icon="mdi-calendar"
              readonly
              clearable
              v-bind="props"
            />
          </template>
          <v-date-picker
            first-day-of-week="1"
            locale="ru-RU"
            v-model="field.registered_low"
          />
        </v-menu>
      </v-col>

      <!-- Меню выбора даты "По" -->
      <v-col cols="12">
        <v-menu
          v-model="menu_to"
          :close-on-content-click="true"
          transition="scale-transition"
          offset-y
          readonly
          min-width="290px"
        >
          <template #activator="{ props }">
            <v-text-field
              v-model="field.registered_hi"
              label="По"
              prepend-icon="mdi-calendar"
              readonly
              clearable
              v-bind="props"
            />
          </template>
          <v-date-picker
            first-day-of-week="1"
            locale="ru-RU"
            v-model="field.registered_hi"
          />
        </v-menu>
      </v-col>

      <!-- Поле ввода текста комментария -->
      <v-col cols="12">
        <v-text-field
          label="Текст комментария"
          v-model="field.message"
          clearable
        />
      </v-col>

      <!-- Поле автозаполнения для выбора пользователя -->
      <v-col cols="12">
        <v-autocomplete
          label="Комментарий оставил"
          v-model="field.user_id"
          :items="field.users"
          item-value="v"
          item-text="d"
          multiple
          clearable
        />
      </v-col>
    </v-row>
  </div>
</template>
<script>
export default {
    props:["field"],
    data(){
        return {
            menu_from: false,
            menu_to: false,
        }
    }
}
</script>
<style scoped>
.description {
    margin-top: 5px;
    color: rgba(0, 0, 0, 0.54);
    font-size: 12px;
    font-weight: 700;
    
}
</style>