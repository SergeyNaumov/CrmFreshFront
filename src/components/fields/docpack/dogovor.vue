<template>
    <div>

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
                <template v-else>
                    <v-card-title @click="show_new_bill_form=false">Новый счёт</v-card-title>
                    
                    <template v-if="parseInt(docpack.make_new_bill)">
                        <div class="success" v-if="success">
                            Счёт был успешно добавлен. <a href="" @click.prevent="success=false;"><b>добавить ещё</b></a>
                        </div>
                        <template v-else>
                            <v-text-field style="max-width: 200px;" autofocus label="укажите сумму" v-model="new_summ"></v-text-field>
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
                            
                            <v-btn v-if="new_summ>0 && new_summ_ok" small color="primary" @click="create_bill">создать счёт</v-btn>
                            <div v-if="!new_summ_ok" class="err">
                                сумма указана не корректно
                            </div>
                        </template>
                    </template>
                    <div class="err" v-else>
                        Вам запрещено создавать счета
                    </div>
                </template>
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
            new_summ:0,
            new_comment:'',
            new_act_summ:undefined,
            new_act_date:'',
            errors:[],
            success: false,
            show_new_bill_form: false
        }
    },
    props:['docpack','dogovor','config','field','form'], 

    watch:{
        show(v){
            if(v && !this.bills.length){
                this.load()
            }
        },
        new_summ(v){
            if(!this.new_summ_ok){
                
                v=v.replace(/,/g,'.');
                v=v.replace(/[^\.\d]+/g,'');
                
                v=v.replace(/\.\.+/g,'.');
                v=v.replace(/^\d+.\d+\..*$/g,'$1$2');
                v=v.replace(/(.\d{2})\d+$/g,'$1');
                this.$nextTick(()=>{this.new_summ=v;})
            }
            if(/^0+([1-9])/.test(v)){
                v=v.replace(/^0+([1-9])/,'$1');
                this.$nextTick(()=>{this.new_summ=v;})
            }
            
        }
    },
    created(){
        
    },
    computed:{

        new_summ_ok(){
            return /^\d+(\.\d+)?$/.test(this.new_summ)
        }
    },
    methods: {
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
        create_bill(){
            this.$http.post(
                BackendBase+'/docpack/'+this.config+'/'+this.field.name,
                {
                    action:'create_bill',
                    dogovor_id:this.dogovor.docpack_id,
                    summ: this.new_summ,
                    comment: this.new_comment,
                    id: this.form.id
                }
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success){
                        this.new_summ='0', this.new_comment='', this.show_comment=false, this.success=true
                        this.load()
                    }
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
