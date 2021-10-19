<template>
    <div>

        <template>
            <v-select
                :label="field.description"
                v-model="value"
                :items="values" item-value="v" item-text="d"
                
                
                cache-items
                clearable
            ></v-select>
        </template>
    </div>
</template>
<script>
export default {
    props:['field','filter_change'],
    data(){
        return {
            values:[
                {'v':0, 'd':'искать всё'},
                {'v':1, 'd':'файл существует'},
                {'v':2, 'd':'файл отсутствует'},
            ],
            value:0
        }
    },
    watch:{
        value(v){
            let field=this.field;
            field.value=this.value;
            this.filter_change(field);
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