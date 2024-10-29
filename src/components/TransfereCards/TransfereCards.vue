<template>
    <div  class="is_headapp">
        <h1>{{title}}</h1>
        <v-row v-if="ready">
            <v-col>
                <template v-for="f in fields">
                        <h3 v-if="f.type=='header'">{{f.description}}</h3>
                        <filter-date :field="f" :filter_change="filter_change" v-if="f.type=='date'"/>
                        <filter-select :field="f" :filter_change="filter_change" v-if="f.type=='select'"/>
                        <hr v-if="f.type=='hr'" style="height:2px;border-width:0;color:gray;background-color:gray; margin-top: 10px;">
                </template>
                <v-btn v-if="all_required" @click.prevent="transfere">Перевести</v-btn>
                <div v-else>
                    Заполните все обязательные поля
                </div>
            </v-col>
            <v-col>
                <p class="ok">{{result_message}}</p>
                <errors :errors="errors" />

            </v-col>
        </v-row>


    </div>
</template>
<script>
export default {
    name:'transfere-cards',
    props:['params','is_headapp'],
    data(){
        return {
            title:'Превод карт ОП',
            result_message:'',
            fields:[],
            ready:false,
            errors:[],
            filters_hash:null,

        }
    },
    created(){
        let t=this
        t.$http.get(`${BackendBase}/transfere-cards/${t.params.config}`).then(
            r=>{
                let d=r.data
                if(d.success){
                    t.fields=d.fields
                    t.create_filters_hash()
                }
            }
        )


    },
    methods:{
        create_filters_hash(){
            let fh={}
            for(let f of this.fields){
                if(f.type!=='header')
                    fh[f.name]=''
            }

            this.filters_hash=fh
            this.ready=true
        },
        filter_change(filter){

            this.filters_hash[filter.name]=filter.value
        },
        transfere(){
            let t=this
            t.$http.post(
                `${BackendBase}/transfere-cards/${t.params.config}`,
                {
                    'action':'transfere',
                    'values': t.filters_hash,
                    'config': t.params.config
                }
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        t.result_message=d.result_message

                    }
                    else{
                        t.result_message=''
                    }
                    t.errors=d.errors
                }
            )

        }
    },
    computed:{
        all_required(){

            for(let f of this.fields){
                if(f.required){
                    let v=this.filters_hash[f.name]
                    if(!v){
                        return false
                    }
                    if(f.range){
                        if(!v.length){
                            return false
                        }
                        if(f.type=='date'){
                            if(v.length!=2)
                                return false
                            if(!v[0] || !v[1])
                                return false
                        }
                    }


                }
            }
            return true
        }
    }
}
</script>
<style lang="scss">
    @import '@/styles/variables.scss';
    .is_headapp {margin: 20px;}
    .is_headapp h1 {margin: 20px 0px; }
    .ok {color: green; font-weight: bold; background: none !important;}
</style>