<template>
    <div>
        <div v-for="(cond,i) in value" :key="i" class="ms_row">
            <v-autocomplete
                v-model="cond.param_id"
                :items="field.params"
                item-value="v" item-title="d"
                :label="field.description"
                hide-details dense clearable
                @update:model-value="on_param_change(cond)"
            />
            <template v-if="is_numeric(cond)">
                <v-text-field
                    v-model="cond.from" type="number"
                    label="от" hide-details dense
                />
                <v-text-field
                    v-model="cond.to" type="number"
                    label="до" hide-details dense
                />
            </template>
            <template v-else>
                <v-autocomplete
                    v-model="cond.value"
                    :items="values_for(cond)"
                    item-value="v" item-title="d"
                    label="значение" hide-details dense clearable
                />
            </template>
            <v-btn icon size="small" variant="text" @click="remove(i)">
                <v-icon size="small">fa fa-times</v-icon>
            </v-btn>
        </div>
        <v-btn class="ms_add" size="small" variant="text" @click="add">
            <v-icon size="small">fa fa-plus</v-icon>&nbsp;добавить характеристику
        </v-btn>
    </div>
</template>
<script>
// Фильтр «характеристики»: список пар «параметр: значение».
// Числовой параметр -> диапазон от/до, текстовый -> выбор значения из списка.
// field.params = [{v:id, d:header, t:type, values:[{v,d}]}]
export default {
    props:["field","config","filter_change","filters_values","refresh"],
    data(){
        return {
            value:[]
        }
    },
    created(){
        let v=this.field.value;
        this.value=Array.isArray(v) ? JSON.parse(JSON.stringify(v)) : [];
        if(!this.value.length) this.value=[this.new_cond()];
    },
    watch:{
        refresh(){
            this.value=[this.new_cond()];
            this.sync();
        },
        value:{
            deep:true,
            handler(){ this.sync() }
        }
    },
    methods:{
        new_cond(){
            return {param_id:'', type:'', value:'', from:'', to:''}
        },
        add(){
            this.value.push(this.new_cond());
        },
        remove(i){
            this.value.splice(i,1);
            if(!this.value.length) this.value.push(this.new_cond());
        },
        param_info(cond){
            if(!this.field.params) return undefined;
            return this.field.params.find(p=>String(p.v)===String(cond.param_id));
        },
        is_numeric(cond){
            let p=this.param_info(cond);
            return !!p && String(p.t)==='1';
        },
        values_for(cond){
            let p=this.param_info(cond);
            return (p && p.values) ? p.values : [];
        },
        on_param_change(cond){
            let p=this.param_info(cond);
            cond.type=p ? String(p.t) : '';
            cond.value=''; cond.from=''; cond.to='';
        },
        sync(){
            let out=[];
            for(let c of this.value){
                if(!c.param_id) continue;
                if(String(c.type)==='1'){
                    if((c.from==='' || c.from===null || c.from===undefined) &&
                       (c.to==='' || c.to===null || c.to===undefined)) continue;
                    out.push({param_id:c.param_id, type:'1', from:c.from, to:c.to});
                }else{
                    if(c.value==='' || c.value===null || c.value===undefined) continue;
                    out.push({param_id:c.param_id, type:'2', value:c.value});
                }
            }
            this.field.value=out;
            this.filter_change(this.field);
        }
    }
}
</script>
<style scoped>
.ms_row{
    display:flex;
    gap:6px;
    align-items:center;
    margin-bottom:0;
}
.ms_row > *:first-child{ flex:1 1 40%; }
.ms_row .v-text-field,
.ms_row .v-autocomplete{ flex:1 1 30%; }
/* компактнее: без внутренних отступов полей Vuetify */
.ms_row :deep(.v-input),
.ms_row :deep(.v-input__control),
.ms_row :deep(.v-field){
    margin:0;
}
.ms_row :deep(.v-input){ padding:0; }
.ms_add{
    margin-top:0;
    margin-bottom:0;
    height:28px;
}
</style>
