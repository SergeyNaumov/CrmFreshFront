<!--
    Блок "акты" для каждого счёта (вывод списка актов / создание нового акта / редактирование / удаление)
-->
<template>
    <div>
        <div class="new_act"><a href="" @click.prevent="open_new_act_form" v-if="!show_new_act_form">новый акт</a></div>
        <div class="new_act_form" v-if="show_new_act_form">
            <!-- Форма создания акта -->
            <h2><b>Создание нового акта</b></h2>
            <template v-if="new_act_success">
                <div class="succ">Акт был успешно создан</div>
            </template>
            <template v-else>
                <div v-if="step_new_act==1">
                    <v-text-field
                        style="max-width: 200px; display: inline-block;" autofocus
                        label="укажите сумму" v-model="new_act_summ" @keyup="fix_summ(new_act_summ,'new_act_summ')"></v-text-field>

                    <v-btn x-small color=primary :disabled="!new_act_summ_ok" @click.prevent="step_new_act=2">далее</v-btn>
                </div>
                <div v-else>
                    <p><b>Сумма акта:</b> {{new_act_summ}}</p>
                </div>

                <div v-if="step_new_act==2">
                    <p>Выберите дату акта:</p>

                    <v-date-picker
                        color="primary"
                        v-model="new_act_date"
                        first-day-of-week="1"
                        locale="ru-Ru"
                        @change="step_new_act=3"
                    />
                    <v-btn x-small color=primary  @click.prevent="step_new_act=1">вернуться к сумме</v-btn>
                </div>
                <div v-if="step_new_act==3">
                    <b>Дата акта:</b> {{new_act_date.split('-').reverse().join('.')}}
                </div>
                <errors :errors="new_act_errors"/>
                <v-btn x-small   @click.prevent="show_new_act_form=false">отменить создание акта</v-btn>
                <template v-if="step_new_act==3">
                    <v-btn x-small color=primary  @click.prevent="create_new_act">Создать акт</v-btn>
                </template>
            </template>

        </div>
        <!-- список актов для этого счёта -->
        <div class="act_list">
            <div v-for="a in act_list">
                <a :href="a.link" target="_blank">{{a.header}}</a>
                <a href="" @click.prevent="delete_act(a)"><v-icon v-if="a.make_delete" x-small color=primary>fa fa-trash</v-icon></a>

            </div>
            <errors :errors="act_list_errors"/>
        </div>



    </div>
</template>

<script>
  
  export default {
    name: 'acts_for_bill',
    data:function(){
        return {
            show_new_act_form: false,
            new_act_summ: '', // сумма для нового акта
            new_act_date: '', // дата для нового акта
            step_new_act: 1,
            error_new_act: '', // ошибка при создании нового акта
            new_act_show_picker: false,
            new_act_success: false,
            new_act_errors:[], // ошибки при создании акта
            act_list:[],
            act_list_errors:[]
        }
    },
    props:['config', 'form','field','bill'],
    computed:{
        new_act_summ_ok(){

            return /^\d+(\.\d+)?$/.test(this.new_act_summ)


        },
        new_act_date_show(){
            if(this.new_act_date){

            }
            else{
                return 'укажите дату'
            }
        }
        // form_ok(){
        //     return this.tarif_id>0 && this.ur_lico_id>0
        // }
    },
    watch:{

    },
    created(){
        this.load_act_list()
    },

    methods: {
        fix_summ(v,name){
            //console.log('v:',v,typeof(v))
            if(typeof(v)=='number'){
                v+=''
            }
            this[name]=v.replace(',','.').replace(/[^0-9\.]/g,'').replace(/\.\./g,'.')
            console.log(this[name])



        },
        open_new_act_form(){
            let t=this
            t.step_new_act=1
            t.show_new_act_form=true
            t.new_act_summ=t.bill.summ
            t.step_new_act=1
        },
        delete_act(act){
            let t=this
            t.$http.post(
                BackendBase+'/docpack/'+t.config+'/'+t.field.name,
                {
                    action:'delete_act',
                    act_id:act.id,
                    id: t.form.id
                }
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success){
                        t.load_act_list()
                    }
                    if(d.errors.length){
                        t.act_list_errors=d.errors
                        setTimeout(
                            ()=>{
                                t.act_list_errors=[]
                            },1000
                        )
                    }

                }
            )
        },
        create_new_act(){ // создание нового акта
            let t=this
            t.$http.post(
                BackendBase+'/docpack/'+t.config+'/'+t.field.name,
                {
                    action:'create_act',
                    bill_id:t.bill.id,
                    summ: t.new_act_summ,
                    date: t.new_act_date,
                    id: t.form.id
                }
            ).then(
                r=>{
                    let d=r.data;
                    t.new_act_errors=d.errors
                    if(d.success){
                        t.new_act_success=true
                        t.load_act_list()
                        setTimeout(
                            ()=>{
                                t.new_act_success=false
                                t.step_new_act=1
                                t.show_new_act_form=false
                            },
                            1000
                        )
                    }

                }
            )
        },
        load_act_list(){
            let t=this
            t.$http.post(
                `${BackendBase}/docpack/${t.config}/${t.field.name}`,
                {
                    action:'get_acts',
                    id: t.form.id,
                    bill_id:t.bill.id,
                }
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success){
                        t.act_list=d.list
                    }
                }
            )
        }
    }
}
</script>
<style scoped lang="scss">
    h2 {margin-bottom: 10px;}
    .succ {color: green; border: 1px solid gray; border-radius: 2px; padding: 10px;}
    .new_act {font-weight: bold; padding: 20px 0px;}
    .new_act_form {padding: 20px; border: 1px solid gray; border-radius: 2px; margin: 20px;}
    .act_list div {margin-bottom: 5px;}
    .act_list .v-icon {padding-left: 5px;}
    .v-application .err {background-color: #fff0 !important;}
</style>
