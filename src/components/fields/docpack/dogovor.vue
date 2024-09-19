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

            <v-card class="new_bill" >
                <a href="" @click.prevent="show_new_bill_form=true" v-if="!show_new_bill_form"> новый счёт</a>
                <div v-else>
                    <v-card-title @click="show_new_bill_form=false">Новый счёт</v-card-title>
                    
                    <template v-if="parseInt(docpack.make_new_bill+0)">
                        <div class="success" v-if="success">
                            Счёт был успешно добавлен. <a href="" @click.prevent="success=false;"><b>добавить ещё</b></a>
                        </div>
                        <template v-else>



                            <select class="service" v-model="selected_service">
                                <option value="">Выберите услугу</option>
                                <option v-for="s in services" :value="s.id">{{s.header}}</option>
                            </select>
                            <template v-if="selected_service">
                            <v-text-field

                                style="max-width: 200px;" @keyup="fix_new_summ" label="Сумма предоплаты" v-model="new_summ"
                            />
                            <v-text-field

                                style="max-width: 200px;"  @keyup="fix_new_summ" label="Сумма постоплаты" v-model="new_summ_post"
                            />
                            <v-text-field v-for="f in service_fields" :key="f.id"
                                v-model="f.value"
                                :label="f.header"
                                @keyup="check_filled_all_fields"
                            />
                            </template>

                            <a href="" @click.prevent="show_comment=true" v-if="new_summ>0 && !show_comment">нужен комментарий?</a>
                            <v-textarea v-if="show_comment"

                                label="теперь можете ввести комментарий к счёту"
                                v-model="new_comment"
                                auto-grow  
                                autofocus
                                rows=1
                            />

                            <!-- сообщения об ошибках -->
                            <div v-for="(e,idx) in errors" :key="'e'+idx">{{e}}</div>
                            
                            <v-btn v-if="new_bill_ok" small color="primary" @click="create_bill">создать счёт</v-btn>

                            <div v-if="!new_bill_ok" class="err">
                                выберите услугу и укажите корректно суммы предоплаты и постоплаты
                            </div>
                            <div v-else-if="selected_service && !filled_all_fields" class="err">
                                заполните все дополнительные поля
                            </div>

                        </template>
                    </template>
                    <div class="err" v-else>
                        Вам запрещено создавать счета
                    </div>
                </div>
            </v-card>
            <v-card v-for="b in bills" :key="b.id" >
                <v-card-title>

                    Счёт №{{b.number}} от {{b.registered}} |&nbsp;<a :href="'/edit_form/bill/'+b.id" target="_blank">к счёту</a></v-card-title>
                <div><b>Сумма:</b>
                    <template v-if="b.make_edit_summ">

                        <template v-if="!b.edit_sum">
                            <!-- сумма не редактируется -->
                            {{b.summ}}
                            <a href="" @click.prevent="b.edit_sum=true"><v-icon small color="primary">fa fa-pencil-alt</v-icon></a>
                        </template>
                        <template v-else>
                            <!-- сумма редактируется -->
                            <input type="text" class="edited_summ" v-model="b.summ" @keyup="control_summ(b)">

                            <a href="" @click.prevent="save_sum_bill(b)"><v-icon small color="primary">fa fa-save</v-icon></a>
                            <a href="" @click.prevent="b.summ=b.old_summ; b.edit_sum=false"><v-icon small color="red">far fa-window-close</v-icon></a>

                        </template>
                    </template>
                    <template v-else>
                        {{b.summ}}
                    </template>

                </div>
                
                
                <div><b>Комментарий:</b> {{b.comment}}</div>
                <div><a :href="'/backend/load_document?doc_pack_id='+docpack.id+'&bill_id='+b.id+'&format=doc&type=paid'">платёжка (для частного лица)</a></div>
                

                <div>
                    с печатями: <a :href="load_bill_link(b,'doc',1)">doc</a> |
                    <a :href="load_bill_link(b,'pdf')">pdf</a>
                </div>
                <div>
                    без печатей: <a :href="load_bill_link(b,'doc',0)">doc</a> |
                    <a :href="load_bill_link(b,'pdf',1)">pdf</a>
                </div>
                <template v-if="parseInt(b.paid)">
                    <div><b>дата оплаты:</b> {{b.paid_date}}</div>
                    <div><b>оплачен до:</b>  {{b.paid_to}}</div>
                </template>
                <div v-else class="not_paid">счёт не оплачен</div>

                <!-- блок актов для счёта -->
                <acts_for_bill :bill="b" :config="config" :form="form" :field="field"/>


            </v-card>
        </template>
    </div>
</template>

<script>
  
  import acts_for_bill from './acts_for_bill';
  export default {
    components:{
        'acts_for_bill': acts_for_bill
    },
    data:function(){
        return {
            show:false,
            edited:{},
            bills:[], // список счетов
            errors:[],
            show_comment:false,
            new_summ:0, // предоплата
            new_summ_post:0, // постоплата
            new_comment:'',
            new_act_summ:undefined,
            new_act_date:'',
            errors:[],
            success: false,
            show_new_bill_form: false,
            selected_service:"", // выбранная услуга при создании счёта
            filled_all_fields: false // все доп. поля заполнены
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

        new_bill_ok(){
            let t=this
            const ok_summ=(s)=>{
                return s>0 && /^\d+(\.\d+)?$/.test(s)
            }
            return t.filled_all_fields && ok_summ(t.new_summ) && ok_summ(t.new_summ_post) && t.selected_service

        },
        current_service(){
            let t=this
            if(t.selected_service)
                for(let s of t.services)
                    if(s.id==t.selected_service)
                        return s


            return null
        },
        service_fields(){
            let t=this, result=[], s=t.current_service
            if(s){
                for(let s of t.services){
                    if(s.id==t.selected_service){
                        return s.fields
                    }
                }
            }
            return result
        }
    },
    methods: {
        check_filled_all_fields(){ // заполнены все доп. поля

            let t=this
            if(t.selected_service){
                for(let s of t.services){
                    if(s.id==t.selected_service){
                        let all_field=true
                        for(let f of s.fields){
                            console.log('field.value: ',f.value)
                            if(!f.value){
                                t.filled_all_fields=false
                                return
                            }
                        }
                        t.filled_all_fields=true
                        return
                    }
                }
            }
            t.filled_all_fields=false
        },
        fix_new_summ(){
            const fix=(v)=>{
                v+=''
                if(/[^0-9]/.test(v)){
                   v=v.replace(/[^\d]/g,'');
                }
                return parseInt(v)
            }
            let t=this
            t.new_summ=fix(t.new_summ)
            t.new_summ_post=fix(t.new_summ_post)

        },

        control_summ(b){
            b.summ=b.summ.replace(/[^\d]/g,'')
        },
        save_sum_bill(b){
            let t=this
            t.$http.post(
                `${BackendBase}/docpack/${t.config}/${t.field.name}`,
                {
                    action: 'save_summ_bill',
                    id:this.form.id,
                    bill_id: b.id,
                    summ: b.summ
                }
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        b.old_summ=b.summ
                        b.edit_sum=false
                    }
                    else{
                        if(d.errors && d.errors.length){
                            alert(d.errors[0])
                        }

                    }
                }
            )

        },
        load_bill_link(bill,format,need_print=0){
            //return '/backend/load_document?doc_pack_id='+this.docpack.id+'&bill_id='+bill.id+'&format='+format+'&type=bill'+(without_print?'&without_print=1':'')
            return `${BackendBase}/docpack/load-bill/${this.docpack.id}/${bill.id}/${format}/${need_print}`
        },
        load_dog_link(format,need_print=0){
            //return '/backend/load_document?doc_pack_id='+this.docpack.id+'&format='+format+'&type=dogovor'+(without_print?'&without_print=1':'')
            return `${BackendBase}/docpack/load-dogovor/${this.docpack.id}/${format}/${need_print}`
        },
        load(){
            this.$http.post(
                BackendBase+'/docpack/'+this.config+'/'+this.field.name,
                {
                    action:'get_bills',
                    id:this.form.id,
                    dogovor_id:this.dogovor.docpack_id
                }
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success){
                        this.bills=[]
                        for(let b of d.list){
                            //b.show_new_act_form=false
                            //b.show_picker=false
                            //b.new_act_summ='' // сумма для нового акта
                            //b.error_create_act='' // ошибка при создании акта
                            b.old_summ=b.summ
                            b.edit_sum=false // флаг редактирования суммы
                            this.bills.push(b)


                        }

                    }


                }
            )
        },
        reset_new_bill(){

            let t=this
            t.new_summ=0, t.new_summ_post=0, t.new_comment='', t.show_comment=false, t.success=true
            for(let s of t.services){
                for(let f of s.fields){
                    f.value=''
                }
            }
            t.load()
        },
        create_bill(){
            // 1. Собираем все допю поля
            let t=this, tech_fields=[]
            for(let f of t.service_fields){
                tech_fields.push({id: f.id, value: f.value})
            }
            let data={

                action:'create_bill',
                dogovor_id:t.dogovor.docpack_id,
                summ: t.new_summ,
                summ_post: t.new_summ_post,
                comment: t.new_comment,
                id: t.form.id,
                service_id: t.selected_service,
                tech_fields: tech_fields
            }
            console.log(data)
            //return
            t.$http.post(
                BackendBase+'/docpack/'+t.config+'/'+t.field.name,
                data
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success)
                        t.reset_new_bill()

                }
            )
        },


    }
}
</script>
<style scoped lang="scss">
    @import '@/styles/variables.scss';
    .edited_summ {
        padding: 5px; width: 80px; border: 1px solid gray;
        text-align: right;
        margin: 0px 10px;


    }
    select.service {
        border: 1px solid gray !important; padding: 5px 5px;
        appearance: auto;
        width: 200px;
        margin: 0 0 20px 15px;
    }
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
