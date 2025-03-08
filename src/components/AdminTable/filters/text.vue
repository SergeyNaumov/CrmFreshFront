<template>
  <div>
    <!-- Если поле имеет диапазон -->
    <template v-if="field.range">
      <div class="description">{{ field.description }}:</div>
      <v-row>
        <v-col cols="6">
          <v-text-field
            prepend-icon="mdi-check"
            label="От"
            v-model="field.value_low"
            density="compact"
            clearable
          />
        </v-col>
        <v-col cols="6">
          <v-text-field
            prepend-icon="mdi-check-all"
            label="До"
            v-model="field.value_hi"
            density="compact"
            clearable
          />
        </v-col>
      </v-row>
    </template>

    <!-- Если поле не имеет диапазона -->
    <template v-else>
      <!-- Комбобокс для автозаполнения -->
      <v-combobox
        v-if="field.autocomplete"
        v-model="value"
        :items="values"
        :label="field.description"
        clearable
        density="compact"
      />

      <!-- Текстовое поле -->
      <v-text-field
        v-else
        v-model="value"
        :label="field.description"
        clearable
        density="compact"
      />
    </template>
  </div>
</template>
<script>

export default {
    props:["config", "field", "filter_change"],
    created(){

    },
    watch:{
        config(){
            this.value=this.field.value
        },
        value(v){
            let t=this
            let field=t.field
            if(v && t.field.autocomplete){

                setTimeout(
                    ()=>{
                        if(v==t.value){
                            t.load_autocomplete()
                        }
                    },300
                )

            }


            field.value=v
            t.filter_change(field);
        }
    },
    data(){
        return {
            show_results: true,
            search:'',
            value:'',
            values:[]
        }
    },
    created(){
        this.value=this.field.value || ''
    },
    methods:{
        change_search(s){
            console.log(s)
        },
        load_autocomplete(){
            let t=this
            let req_data={
                term:t.search,
                action: 'get_list',
                field_name:t.field.name,
                term: t.value // выбранные ранее значения тоже подтягиваем
            }
            t.$http.post(
                BackendBase+'/autocomplete/'+t.config,
                req_data
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success)
                        t.values=d.list
                }
            ).catch(
                e=>{
                    alert(e)
                }
            )
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
</style>ds