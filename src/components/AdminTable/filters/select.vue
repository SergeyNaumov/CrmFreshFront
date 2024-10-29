<template>
    <div>
        <template v-if="field.filter_type && field.filter_type=='checkbox'">
            <v-checkbox 
                v-model="value"
                :label="field.description"
                hide-details
            />
        </template>
        <template v-else-if="field.range">
            <!-- сделать возможность range-поиска по select-у -->
            {{field.name}} select filter range пока не реализован
        </template>
        <template v-else>
            <template v-if="field.autocomplete">
                <v-autocomplete 
                    :label="field.description"
                    v-model="value"
                    :multiple="field.multiple"
                    :items="values" item-value="v" item-text="d"
                    :search-input.sync="search"
                    :no-data-text="no_data_text"
                    clearable
                    :loading="loading"
                    hide-details
                    multiple chips
                    @focus="focus_autocomplete"
                    :id='"filter_"+field.name'
                    autocomplete="new-password"
                />
            </template>
            <template v-else-if="field.values.length>10">
                <!-- если значений в фильтре >10 -- выводим  autocomplete -->

                <v-autocomplete 
                    :label="field.description"
                    v-model="value"
                    :items="values" item-value="v" item-text="d"
                    :no-data-text="no_data_text"
                    cache-items
                    clearable
                    :multiple="!field.not_multiple" chips
                    hide-details
                />
            </template>
            <template v-else>
                
                <v-select
                    :label="field.description"
                    v-model="value"
                    :items="values" item-value="v" item-text="d"
                    :multiple="!field.not_multiple" chips
                    :no-data-text="no_data_text"
                    cache-items
                    clearable
                ></v-select>
            </template>
        </template>
    </div>
</template>
<script>
export default {
    props:["field","config","filter_change","filters_values","refresh"],
    data(){
        return {
            value:[],
            values:[],
            search:'',
            loading: false
        }
    },
    created(){
        let v=this.field.value;

        
        this.values=this.field.values
        //document.getElementById("filter_"+this.field.name).
        if(this.field.filter_type && this.field.filter_type=='checkbox'){
            //v=false
            
        }

        if(typeof(v)=='string') v=[v]
        
        this.value=v;
        

        
        if(this.field.autocomplete && this.field.autocomplete_start_loaded){
          //console.log('load_autocomplete!')
          this.load_autocomplete('')
        }
    },
    watch:{
        refresh(){
            this.value=[]
        },
        search(){
            this.load_autocomplete();
        },
        value(v){
            let field=this.field;
            field.value=this.value;
            this.filter_change(field);

        }
    },
    computed:{
        no_data_text(){
           
            if(this.search){
                return 'ничего не найдено'
            }
            return 'введите часть наименования'


        }
    },
    methods:{
        focus_autocomplete(){
            if(this.field.depend_filter){ // если это зависимый фильтр -- сразу отправляем
                this.load_autocomplete()
            }
            
        },
        load_autocomplete(){
            let req_data={
                term:this.search,
                action: 'get_list',
                field_name:this.field.name,
                values: this.value // выбранные ранее значения тоже подтягиваем
            }
            if(this.field.depend_filter){
                req_data.filters_values=this.filters_values

                
            }
            
            this.$http.post(
                BackendBase+'/autocomplete/'+this.config,
                req_data
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success)
                        this.values=d.list
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

</style>