<template>
    <div>
        <template v-if="field.range">
            <!-- сделать возможность range-поиска по select-у -->
            {{field.name}} select filter range пока не реализован
        </template>
        <template v-else>
            <template v-if="field.autocomplete">
                <v-autocomplete 
                    :label="field.description"
                    v-model="value"
                    :items="values" item-value="v" item-text="d"
                    :search-input.sync="search"
                    no-data-text="ничего не найдено"
                    clearable
                    :loading="loading"
                />
            </template>
            <template v-else-if="field.values.length>10">
                <!-- если значений в фильтре >10 -- выводим  autocomplete -->
                <v-autocomplete 
                    :label="field.description"
                    v-model="value"
                    :items="values" item-value="v" item-text="d"
                    
                    multiple chips
                    no-data-text="ничего не найдено"
                    cache-items
                    clearable
                ></v-autocomplete>
            </template>
            <template v-else>
                <v-select
                    :label="field.description"
                    v-model="value"
                    :items="values" item-value="v" item-text="d"
                    multiple chips
                    no-data-text="ничего не найдено"
                    cache-items
                    clearable
                ></v-select>
            </template>
        </template>
    </div>
</template>
<script>
export default {
    props:["field","config","filter_change"],
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
        
        
        if(typeof(v)=='string') v=[v]
        this.value=v;
    },
    watch:{
        search(){
            this.load_autocomplete();
        },
        value(v){
            let field=this.field;
            field.value=this.value;
            this.filter_change(field);
        }
    },
    methods:{
        load_autocomplete(){
            this.$http.post(
                BackendBase+'/autocomplete/'+this.config,
                {
                    term:this.search,
                    action: 'get_list',
                    field_name:this.field.name
                }
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