<template>
    <div scoped>

        <v-icon small color="$color.primary" @click="show=!show"> 
            <template v-if="show">fa-minus</template>
            <template v-else>fa-plus</template>
        </v-icon> 

        <a href="" @click.prevent="show=!show">Договор №{{dogovor.number}} от {{dogovor.registered}}</a> 


        <template v-if="show">
            <div>
                с печатями: <a :href="load_dog_link('doc',1)">doc</a> | <a :href="load_dog_link('pdf',1)">pdf</a>
            </div>
            <div>
                без печатей: <a :href="load_dog_link('doc',0)">doc</a> | <a :href="load_dog_link('pdf',0)">pdf</a>
            </div>

            <tech_and_bills
                :config="config"
                :form="form"
                :field="field"
                :docpack="docpack"
                :bills="bills"
                :apps="apps"
                :services="services"
                :load="load"
            />

        </template>
    </div>
</template>

<script>
  import tech_and_bills from './tech_and_bills';

  export default {
    components:{
        //'acts_for_bill': acts_for_bill
        tech_and_bills: tech_and_bills
    },
    data:function(){
        return {
            show:false,
            edited:{},
            apps: [], // приложения к договору
            bills:[], // список счетов
            errors:[],
            show_comment:false,
            new_summ:0, // предоплата
            new_summ_post:0, // постоплата
            new_comment:'',
            new_act_summ:undefined,
            new_act_date:'',
            success: false,
            //show_new_bill_form: false,
            //selected_service:"", // выбранная услуга при создании счёта

        }
    },
    props:['docpack','dogovor','config','field','form','services'],

    watch:{
        show(v){
            if(v && !this.bills.length){
                this.load()

            }
        },
        show_new_bill_form(v){
            if(v){
                let t=this

                for(let s of t.services){

                }
            }
            
        }
    },
    created(){
        
    },
    computed:{




    },
    methods: {





        load_dog_link(format,need_print=0){
            //return '/backend/load_document?doc_pack_id='+this.docpack.id+'&format='+format+'&type=dogovor'+(without_print?'&without_print=1':'')
            return `${BackendBase}/docpack/load-dogovor/${this.docpack.id}/${format}/${need_print}`
        },
        load(){
            let t=this, field=t.field
            t.$http.post(
                `${BackendBase}/docpack/${t.config}/${t.field.name}`,
                {
                    action:'get_bills',
                    id:t.form.id,
                    dogovor_id:t.dogovor.docpack_id,
                    form_id_alternative: field.form_id || null,
                    only_dogovor: field.only_dogovor || null,
                    only_app: field.only_app || null
                }
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success){
                        t.bills=d.bills, t.apps=d.apps
                    }


                }
            )
        },



    }
}
</script>
<style scoped lang="scss">
    @import '@/styles/variables.scss';


    .row { padding-left: 20px;}
    .col { font-size: 10px; border-bottom: none; padding: none;}
    .v-icon {margin-right: 10px;}
    .header {font-weight: bold; /*color: rgb(63,81,181)*/}
    .v-card {padding-left: 0; border: 1px solid $primary; margin-bottom:10px; background-color: $lighten5; margin-top: 10px;}
    .v-card div {padding: 4px 16px;}
    .v-card__title {font-size: 12px; font-weight: bold; color: $primary;}
    .not_paid {color: $error; font-weight: bold;}
    .v-application .success  {border: 1px solid $primary; border-radius: 5px; background-color: $lighten4 !important; padding: 10px;}


</style>
