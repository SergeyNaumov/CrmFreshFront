<template>
    <div>
        <div>
            <v-select v-if="values.length<20"
                :items="values"
                v-model="value"
                class="input-group--focused"
                item-value="v"
                item-title="d"
                no-data-text="значения не выбраны"
                hint="Выберите одно или несколько значений"
                descriprion="выберите значения"
                multiple
                :label="field.description"
                chips
                clearable
                @update:model-value="change"
            />
            <v-autocomplete v-else
                :items="values"
                v-model="value"
                class="input-group--focused"
                item-value="v"
                item-title="d"
                no-data-text="значения не выбраны"
                hint="Выберите одно или несколько значений"
                descriprion="выберите значения"
                :label="field.description"
                multiple
                chips
                clearable
                @update:model-value="change"
            />
            <div class="err"  v-for="(e,idx) in errors" :key="'err'+idx">{{e}}</div>
        </div>
    </div>
</template>
<script>
export default {
    props:["config","field",'filter_change'],
    computed:{


    },
    data(){
        return {
            value:[],
            values:[],
            errors:[]
        }
    },
    created(){
        let v=this.field.value;
        this.value = Array.isArray(v) ? v : (v ? [v] : []);
        if(!this.field.autocomplete){
            this.$http.post(
                BackendBase+'/multiconnect/'+this.config+'/'+this.field.name,
                {action:'get'}
            ).then(
                d=>{
                    let D=d.data;
                    if(D.success){
                        //console.log({list:D.list});
                        for(let l of D.list){ // с атрибутами id и header select не работает, хз почему
                            this.values.push({'v':l.id+'','d':l.header})
                        }
                    }

                }
            );
        }

    },
    methods:{
        change(){
            let filter=this.field;
            filter.value=this.value;
            this.filter_change(filter);
        }
    }
}
</script>
<style scoped>
    .err {color: red;}
</style>