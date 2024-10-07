<template>
	<div>
            <v-card class="new_bill" >
				<template v-if="!new_form">
	            	<template v-if="make_add_bill_without_app">
                        <a href="" @click.prevent="new_form='bill'"> новый счёт</a>&nbsp;|&nbsp;
                    </template>
	            	<a href="" @click.prevent="check_filled_all_fields(); new_form='app'"> новое приложение</a>
	            </template>
                <div v-if="new_form=='app'">
                	<v-card-title>Новое приложение |&nbsp;<a href="" @click.prevent="new_form=''">закрыть</a></v-card-title>
                    <template v-if="parseInt(docpack.make_new_bill+0)">
                        <div class="success" v-if="new_app.success">
                            Новое приложение было успешно добавлено. <a href="" @click.prevent="new_app.success=false;"><b>добавить ещё</b></a>
                        </div>
                        <template v-else>
                            <select class="service" v-model="selected_service">
                                <option value="">Выберите услугу</option>
                                <option v-for="s in services" :value="s.id">{{s.header}}</option>
                            </select>
                            <template v-if="selected_service">
                            <v-text-field

                                style="max-width: 200px;" @keyup="fix_new_summ(new_app); check_filled_all_fields()" label="Сумма предоплаты" v-model="new_app.summ"
                            />
                            <v-text-field
                                style="max-width: 200px;"  @keyup="fix_new_summ(new_app); check_filled_all_fields()" label="Сумма постоплаты" v-model="new_app.summ_post"
                            />

                            <v-text-field v-for="f in service_fields" :key="f.id"
                                v-model="f.value"
                                :label="f.header"
                                @keyup="check_filled_all_fields"
                            />
                            </template>

                            <!-- сообщения об ошибках -->
                            <div v-for="(e,idx) in new_app.errors" :key="'e'+idx">{{e}}</div>

                            <v-btn v-if="new_app_ok" small color="primary" @click="create_app">создать приложение</v-btn>

                            <div v-if="!new_app_ok" class="err">
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
                <div v-if="new_form=='bill'">
                    <v-card-title @click="new_form=''">Новый счёт |&nbsp;<a href="" @click.prevent="new_form=''">закрыть</a></v-card-title>

                    <template v-if="parseInt(docpack.make_new_bill+0)">
                        <div class="success" v-if="new_bill.success">
                            Счёт был успешно добавлен. <a href="" @click.prevent="new_bill.success=false;"><b>добавить ещё</b></a>
                        </div>
                        <template v-else>
                            <v-text-field style="max-width: 200px;" @keyup="fix_new_summ(new_bill)" label="Сумма счёта" v-model="new_bill.summ"/>


                            <a href="" @click.prevent="new_bill.show_comment=true" v-if="new_bill.summ>0 && !new_bill.show_comment">нужен комментарий?</a>
                            <v-textarea v-if="new_bill.show_comment"

                                label="теперь можете ввести комментарий к счёту"
                                v-model="new_comment"
                                auto-grow
                                autofocus
                                rows=1
                            />

                            <!-- сообщения об ошибках -->
                            <div v-for="(e,idx) in new_bill.errors" :key="'e'+idx">{{e}}</div>

                            <v-btn v-if="new_bill_ok" small color="primary" @click="create_bill">создать счёт</v-btn>

                            <div v-if="!new_bill_ok" class="err">
                                выберите услугу и укажите корректно суммы предоплаты и постоплаты
                            </div>


                        </template>
                    </template>
                    <div class="err" v-else>
                        Вам запрещено создавать счета
                    </div>
                </div>
            </v-card>
            <div v-if="apps.length" class="bills_without_app">
                <h2>Приложения к договору:</h2>
                <v-card v-for="a in apps" :key="a.id" >
                    <v-card-title>Приложение №{{a.num_of_dogovor}} от {{a.registered}}</v-card-title>
                    <div>
                        Скачать приложение:
                        <div>
                            с печатями: <a :href="load_app_link(a,'doc',1)">doc</a> |
                            <a :href="load_app_link(a,'pdf')">pdf</a>
                        </div>
                        <div>
                            без печатей: <a :href="load_app_link(a,'doc',0)">doc</a> |
                            <a :href="load_app_link(a,'pdf',1)">pdf</a>
                        </div>
                    </div>
                    <div v-if="a.card_id">
                        Создана СР: <a :href="a.sr_link" target="_blank">{{a.sr_name || '----'}}</a>
                    </div>
                    <v-btn small color="primary" v-else @click.prevent="create_sr(a)">создать СР</v-btn>
                    <div>
                        <b>Услуга:</b> {{a.service}}<br>
                        <div class="err" v-html="a.error" v-if="a.error"></div>



                        <table class="fields">
                            <tr><td>Предоплата:</td><td>{{a.summ}} р.</td></tr>
                            <tr><td>Постоплата:</td><td>{{a.summ_post}} р.</td></tr>
                            <tr v-for="f in a.fields">
                                <td>{{f.name}}:</td>
                                <td>
                                    <template v-if="!f.edited">
                                        {{f.value}}


                                    </template>
                                    <template v-else>
                                        <textarea v-model="f.value"></textarea>
                                        <a href="" @click.prevent="save_app_field(a,f)"><v-icon small color="primary">fa fa-save</v-icon></a>
                                    </template>

                                </td>
                                <td>
                                    <template v-if="!form.read_only">
                                        <a href="" @click.prevent="f.edited=true"><v-icon x-small color="primary">fa fa-pencil-alt</v-icon></a>
                                    </template>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <v-card v-for="b in a.bills" :key="b.id" >
                        <v-card-title>

                            Счёт №{{b.number}} от {{b.registered}} ({{b.type}}) |&nbsp;<a :href="'/edit_form/bill/'+b.id" target="_blank">к счёту</a></v-card-title>
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
                        <!--<div><b>Комментарий:</b> {{b.comment}}</div>-->
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
                        <!--<acts_for_bill :bill="b" :config="config" :form="form" :field="field"/>-->
                    </v-card>
                </v-card>
                <pre v-if="0">
                    {{apps}}
                </pre>
            </div>
            <div v-if="bills.length" class="bills_without_app">

                <h2>Счета без приложений:</h2>
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
            </div>
	</div>
</template>
<script>
import acts_for_bill from './acts_for_bill';
const ok_summ=(s)=>{
    return s>0 && /^\d+(\.\d+)?$/.test(s)
}
export default {
    components:{
        'acts_for_bill': acts_for_bill
    },
	props:['form', 'field','config','docpack', 'apps', 'bills', 'services','load','make_add_bill_without_app'],
	data(){
		return {
			success: false,
			new_form:'',
			selected_service:"",
			new_bill:{
				errors:[],
				success: false,
				show_comment: false,
				summ:0,
				comment: '',
			},
			new_app:{
				errors:[],
				success: false,
				summ:0,
				summ_post:0,
			},
			filled_all_fields: false // все доп. поля заполнены
		}
	},

	computed:{
		new_app_ok(){
			let t=this
			return t.filled_all_fields && ok_summ(t.new_app.summ) && ok_summ(t.new_app.summ_post) && t.selected_service
		},
        new_bill_ok(){
            let t=this

            return ok_summ(t.new_bill.summ)

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
        },
        current_service(){
            let t=this
            if(t.selected_service)
                for(let s of t.services)
                    if(s.id==t.selected_service)
                        return s


            return null
        },
	},
	methods:{
        create_sr(a){ // Создание СР
            console.log('create_sr:',a)
            let t=this
            t.$http.post(
                `${BackendBase}/docpack/${t.config}/${t.field.name}`,
                {
                    action:'create_sr',
                    id: t.form.id,
                    app_id: a.id
                }
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        console.log('d:',d)
                        if(d.item){
                            a.card_id=d.item.card_id
                            a.sr_name=d.item.sr_name
                            a.sr_link=d.item.sr_link
                        }
                    }
                    if(d.errors.length)
                        a.error=d.errors.join('<br>')
                    else
                        a.error=''
                }
            )
        },
        save_app_summ(app,name,value){
            let t=this

        },
        save_app_field(app,field){ // сохранение доп. поля для приложения
            // сохранение поля
            let t=this
            console.log('save_app_field:',app.id,field)
            t.$http.post(
                `${BackendBase}/docpack/${t.config}/${t.field.name}`,
                {
                    action:'save_app_field',
                    id:t.form.id,
                    app_id:app.id,
                    field_id:field.id,
                    value: field.value
                }
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        field.edited=false
                    }
                }
            )
        },
        save_sum_bill(b){
            let t=this
            t.$http.post(
                `${BackendBase}/docpack/${t.config}/${t.field.name}`,
                {
                    action: 'save_summ_bill',
                    id:t.form.id,
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
        check_filled_all_fields(){ // заполнены все доп. поля

            let t=this
            console.log('check_filled_all_fields1')
            if(t.selected_service){
                for(let s of t.services){
                    if(s.id==t.selected_service){
                        let all_field=true
                        console.log('check_filled_all_fields2')
                        for(let f of s.fields){
                            console.log('field.value: ',f.value)
                            if(!f.value){
                                t.filled_all_fields=false
                                return
                            }
                        }
                        t.filled_all_fields=true
                        console.log('check_filled_all_fields3')
                        return
                    }
                }
            }
            t.filled_all_fields=false
        },
		fix_new_summ(item){
            const fix=(v)=>{
                v+=''
                v=v.replace(',','.').replace(/[^\d\.]/g,'').replace(/^\./,'0.').replace(/^(\d+\.\d*)\./,'$1').replace(/(\.\d{2})\d*/,'$1')
                // if(/[^\d+\.]/.test(v)){
                //    v=v.replace(/[^\d\.]/g,'');
                // }
                //return parseFloat(v) || 0
                return v
            }
            //let t=this
            item.summ=fix(item.summ)
            if(item.summ_post && item.summ_post.length){
            	item.summ_post=fix(item.summ_post)
            }


        },

        control_summ(b){

            b.summ=b.summ.replace(',','.').replace(/[^\d\.]/g,'').replace(/^\./,'0.').replace(/^(\d+\.\d*)\./,'$1').replace(/(\.\d{2})\d*/,'$1')
        },
        load_bill_link(bill,format,need_print=0){
            return `${BackendBase}/docpack/load-bill/${this.docpack.id}/${bill.id}/${format}/${need_print}`
        },
        load_app_link(app,format,need_print=0){
            return `${BackendBase}/docpack/load-app/${app.id}/${format}/${need_print}`
        },
        create_app(){
        	let t=this, tech_fields=[]
            for(let f of t.service_fields){
                tech_fields.push({id: f.id, value: f.value})
            }
			let data={
                action:'create_app',
                dogovor_id:t.docpack.id,
                summ: t.new_app.summ,
                summ_post: t.new_app.summ_post,
                comment: t.new_comment,
                id: t.form.id,
                service_id: t.selected_service,
                tech_fields: tech_fields
            }
            console.log('data:',data)
			t.$http.post(
                BackendBase+'/docpack/'+t.config+'/'+t.field.name,
                data
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success){
                        t.reset_new_app()
                    }
                   	t.new_app.errors=d.errors
                }
            )
        },
        create_bill(){
            // 1. Собираем все допю поля
            let t=this
            let data={
                action:'create_bill',
                dogovor_id:t.docpack.id,
                summ: t.new_bill.summ,
                comment: t.new_bill.comment,
                id: t.form.id,
            }

            //return
            t.$http.post(
                BackendBase+'/docpack/'+t.config+'/'+t.field.name,
                data
            ).then(
                r=>{
                    let d=r.data;
                    if(d.success)
                        t.reset_new_bill()
                    t.new_bill.errors=d.errors
                }
            )
        },
        reset_new_app(){
        	let t=this
        	t.new_app={
				errors:[], success: false, summ:0, summ_post:0,
			}
			t.new_form=''
            for(let s of t.services)
                for(let f of s.fields)
                    f.value=''

            t.load()
        },
        reset_new_bill(){
            let t=this
            t.new_bill={errors:[],success: false,show_comment:false,summ:0,comment: ''}
            t.new_form=''
            t.load()
        },

	}
}
</script>
<style scoped>
    .edited_summ {
        padding: 5px; width: 80px; border: 1px solid gray;
        text-align: right;
        margin: 0px 10px;


    }
	.col { font-size: 10px; border-bottom: none; padding: none;}
	select.service {
        border: 1px solid gray !important; padding: 5px 5px;
        appearance: auto;
        width: 200px;
        margin: 0 0 20px 15px;
    }
    .v-card div {padding: 4px 16px;}
    .v-card {padding-left: 0; border: 1px solid $primary; margin-bottom:10px; background-color: $lighten5; margin-top: 10px;}
    .v-card__title {font-size: 12px; font-weight: bold; color: $primary;}
    .bills_without_app h2 {color: #000; margin-bottom: 3px;}
    table.fields {margin-top: 5px;border-collapse: collapse;}
    table.fields td {border-bottom: 1px solid gray; padding: 2px 5px;}
</style>