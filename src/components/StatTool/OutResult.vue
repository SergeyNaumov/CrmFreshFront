<template>
    <div>
      <template v-if="columns.length">
        <!-- Вывод результатов колонками -->

          <v-row>
            <v-col v-for="(col,idx) in columns" :key="'col'+idx">
              <div v-for="d in col">
                <field-accordion v-if="d.type=='accordion'" :field="d"/>
                <div v-if="d.type=='html'" v-html="d.body"></div>
                <div style="position: relative; display: inline-block;" v-if="d.type=='chart'">
                  <field-chart  :field="d" />
                </div>
                <div v-if="d.type=='data_table'">
                  <field-data-table :field="d"/>
                </div>
              </div>
            </v-col>
          </v-row>

      </template>
      <template v-else>
        <template v-if="list.length">
          <div v-for="d in list">
            <field-accordion v-if="d.type=='accordion'" :field="d"/>
            <div v-if="d.type=='html'" v-html="d.body"></div>
            <div style="position: relative; display: inline-block;" v-if="d.type=='chart'">
              <field-chart  :field="d" />
            </div>
            <div v-if="d.type=='data_table'">
              <field-data-table :field="d"/>
            </div>
          </div>
        </template>
        <template v-else>

          <p>ничего не найдено</p>
        </template>
      </template>
    </div>
</template>
<script>
export default {
    props: ['columns','list']
}
</script>
<style scoped>
</style>