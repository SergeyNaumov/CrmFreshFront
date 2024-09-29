<template>
    <div>
        <v-dialog v-model="dialog" style="min-height: 100px; width: 800px;">
            <v-card>
                {{errors}}
                <div class="err" v-for="(e,idx) in errors" :key="idx">{{e}}</div>
            </v-card>
        </v-dialog>
        <docpack_new
            v-if="!field.not_create_docpack"
            :form="this.form"
            :field="this.field"

            :refresh_docpack_list="load"
        />

        
        

        <pre v-if="0">{{permissions}}</pre>
        <v-card class="one_to_m"  v-for="dp in list" :key="dp.id">
            <div v-if="dp.cnt_bill==0">
                пакет документов не содержит счетов, его можно
                <a href="" @click.prevent="remove(dp)">удалить</a>
            </div>
            

            <v-list-item>

                <v-list-item-content>
                    
                    <div>
                        <v-icon  small  color="primary">edit</v-icon>
                        <a :href="'/edit_form/docpack/'+dp.id" target="_blank">Редактировать пакет документов</a>
                    </div>
                    <div>Тариф: <a :href="'/edit_form/tarif/'+dp.tarif_id" target="_blank">{{dp.tarif}}</a></div>
                    <div>Юр.лицо: <a :href="'/edit_form/ur_lico/'+dp.ur_lico_id" target="_blank">{{dp.ur_lico}}</a></div>
                    <div>Менеджер: {{dp.manager}} / {{dp.registered}}</div>

                    <dogovor
                        v-for="dogovor in dp.dogovor_list"
                        :key="dogovor.id"
                        :field="field"
                        :dogovor="dogovor"
                        :services="services"
                        :config="form.config"
                        :form="form"
                        :docpack="dp"
                        :permissions="permissions"
                        
                    />
                </v-list-item-content>
            </v-list-item>


            
        </v-card>
    </div>
</template>

<script>
  import { bus } from '../../main'
  import dogovor from './docpack/dogovor.vue';
  import docpack_new from './docpack/docpack_new.vue';
  export default {
    components:{
        'dogovor':dogovor,
        docpack_new: docpack_new
    },
    data:function(){
        return {
            list:[], // список пакетов документов
            errors:[],
            permissions:{},
            dialog:false

        }
    },
    props:['form','field','parent','refresh'],
    created(){
        if(this.form.id) this.load()
    },
    computed:{


    },
    methods: {

        load(){
            let t=this
            let form_id=t.field.form_id || t.form.id
            t.$http.post(
                BackendBase+'/docpack/'+t.form.config+'/'+t.field.name,
                {
                    action:'list',
                    id:t.form.id,
                    form_id_alternative: t.field.form_id || null,
                    only_dogovor: t.field.only_dogovor || null
                }

            ).then(
                r=>{
                    let d=r.data;
                    if(d.success){
                        for(let dp of d.list)
                            dp.dogovor_list_show=false
                        t.list=d.list;
                        t.services=d.services
                        t.permissions=d.permissions;
                    }
                    t.errors=d.errors
                }
            )
        },
        remove(dp){
            this.$http.post(
                BackendBase+'/docpack/'+this.form.config+'/'+this.field.name,
                {
                    action:'docpack_delete',
                    id:this.form.id,
                    docpack_id: dp.id
                }
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success){
                        let arr=[]
                        for(let p of this.list){
                            if(p.id!=dp.id)
                                arr.push(p)
                        }
                        this.list=arr
                    }
                    this.errors=d.errors;
                    if(d.errors.length){
                        this.dialog=true
                    }
                    
                }
            )
        },
        to_docpack_edit(id){
            window.open('/edit_form/docpack/'+id, '_blank');
        }

    }
  }
</script>
<style scoped>
    .new {margin-bottom: 10px;}
    .v-icon {margin-right: 10px;}
    .header {display: inline-block; font-weight: bold; max-width: 40%;}
    .to_dp_link {font-size: 0.8rem;}
    .v-card div{padding-bottom: 10px;}
</style>
