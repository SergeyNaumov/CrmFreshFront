<template>
    <div>

        <template v-if="field.range">
            <div class="description">{{field.description}}:</div>
            <v-flex xs6>
                <v-text-field 
                    prepend-icon="done"
                    label="От"
                    v-model="field.value_low"
                    hide-details
                    clearable
                />
            </v-flex>
            <v-flex xs6>
                <v-text-field
                    prepend-icon="done_all"
                    label="До"
                    v-model="field.value_hi"
                    hide-details
                    clearable
                />
            </v-flex>
              
        </template>
        <template v-else>

            <!--
                здесь не стал использовать autocomplete
                потому что поиск может происходить по части слова и
                в некоторых случаях функция аutocomplete не нужна
            -->
            <v-combobox
                v-if="field.autocomplete"
                :search-input.sync="value"

                :label="field.description"
                v-model="value"
                :items="values"
            />


            <v-text-field 
                v-else
                :label="field.description"
                v-model="value"
                class="input-group--focused"
                clearable
                hide-details
            />

 <!-- Необходим для того, чтобы скрыть выпадающее меню при нажатии вне него -->






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