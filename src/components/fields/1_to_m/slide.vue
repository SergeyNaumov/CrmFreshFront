<template>
    <!-- slide -->
    <div>
      <div v-if="values && values.length">      
        <v-dialog v-model="del_errors_out" max-width="500">
        <v-card class="one_to_m" >
            <v-card-title  class="text-h5">
                Ошибка
            </v-card-title>
            <ul class="del_error">
                <li v-for="e in del_errors" :key="e">{{e}}</li>
            </ul>
        </v-card>
        </v-dialog> 
        <!-- view type: list -->
        <template v-if="field.view_type=='list'">
            <div>

                <draggable
                    v-model="list"
                    item-key="id"
                    tag="div"
                    @end="move_end"
                    :disabled="!field.sort"
                >
                <template #item="{ element: v, index: vi }">
                    <v-card class="one_to_m one_to_m_list" :style="list_item_style"> <!--:style="{'background-color': $color.secondary}"-->
                        <template v-for="(h,hidx) in field.headers" :key="hidx">
                            <div v-if="v[h.name] && fields_hash[h.name] ">
                                <template v-if="h.change_in_slide">
                                    <change_in_slide :refresh="cur_refresh" :form="form" :field="field" :name="h.name" :cur_id="ch_id(v)" :values="v"></change_in_slide>
                                </template>
                                <template v-else>
                                    
                                    <span class="h">{{h.description}}:</span>
                                    <template v-if="h.type=='file'"> 

                                        <span v-html="download_file_block(h,ch_id(v),v[h.name+'_filename'],v)"></span>
                                        <template v-if="field.headers.length>1"> <!-- выводим эту ссылку если помимо файла есть другие поля -->
                                            <a v-if="v[h.name+'_filename'] && !child_field_read_only(h.name)" href="" @click.prevent="del_file(h.name,ch_id(v))">удалить</a>
                                        </template>

                                    </template>
                                    <template v-else>
                                        <!-- div squire color 20x20-->
                                        <pre v-if="h.type=='codelist'" class="codelist_slide">{{ get_value_for_slide(h,v) }}</pre>
                                        <template v-else>
                                            <template v-if="h.type=='text' && h.subtype=='color'">
                                                <div class="color_squire"  :style="{'background-color': get_value_for_slide(h,v) }"></div>
                                                
                                            </template>
                                            <template v-if="h.type=='text' && h.subtype" >
                                                <template  v-if="h.subtype=='qr_call'">
                                                    <qr_call :value="get_value_for_slide(h,v)" :field="h" :for_slide="true"/>
                                                </template>
                                                <template v-else-if="h.subtype=='email'">
                                                    <email :value="get_value_for_slide(h,v)" :field="h" :for_slide="true"/>
                                                </template>

                                            </template>
                                            <template v-else>
                                                <span v-html="get_value_for_slide(h,v)"></span>
                                            </template>
                                        </template>

                                    </template>
                                    
                                </template>
                            </div>
                        </template>
                        <div class="controls">
                            
                            <v-icon size="small" class="edit" color="primary" v-if="!field.read_only" @click="open_edit_dialog(v)">edit</v-icon>
                            <v-icon size="small" color="primary" v-if="make_delete" @click="del(v)">delete</v-icon>
                            
                        </div>
                    </v-card>
                </template>
                </draggable>
            </div>
        </template>

        <!-- view type: order — «Состав заказа» (товары + итог) -->
        <template v-else-if="field.view_type=='order'">
            <div class="order-goods">
                <div class="og-row og-row--head">
                    <span class="og-col og-name">Товар</span>
                    <span class="og-col og-artikul">Артикул</span>
                    <span class="og-col og-price">Цена</span>
                    <span class="og-col og-cnt">Кол-во</span>
                    <span class="og-col og-sum">Сумма</span>
                    <span class="og-col og-tools"></span>
                </div>
                <div class="og-row" v-for="v in values" :key="ch_id(v)">
                    <span class="og-col og-name">
                        <a :href="good_link(v)" target="_blank">{{ v.name || ('Товар #' + v.good_id) }}</a>
                    </span>
                    <span class="og-col og-artikul">{{ v.artikul || '—' }}</span>
                    <span class="og-col og-price">
                        <change_in_slide v-if="has_child('price')" :refresh="cur_refresh" :form="form" :field="field" :name="'price'" :cur_id="ch_id(v)" :values="v"></change_in_slide>
                        <template v-else>{{ money(v.price) }}</template>
                    </span>
                    <span class="og-col og-cnt">
                        <change_in_slide v-if="has_child('cnt')" :refresh="cur_refresh" :form="form" :field="field" :name="'cnt'" :cur_id="ch_id(v)" :values="v"></change_in_slide>
                        <template v-else>{{ v.cnt }}</template>
                    </span>
                    <span class="og-col og-sum">{{ money(num(v.price) * num(v.cnt)) }}</span>
                    <span class="og-col og-tools">
                        <v-icon size="small" color="primary" v-if="!field.read_only" @click="open_edit_dialog(v)">edit</v-icon>
                        <v-icon size="small" color="primary" v-if="make_delete" @click="del(v)">delete</v-icon>
                    </span>
                </div>
                <div class="og-total">
                    <span class="og-total__label">Итого:</span>
                    <span class="og-total__sum">{{ money(order_total) }}</span>
                </div>
            </div>
        </template>

        <!-- view type: default -->

        <template v-else>
            <table class="one_to_m">
            <thead>
                <tr>
                    <th v-for="h in field.headers" :key="h.name">{{h.description}}</th>
                    <th ></th>
                </tr>
            </thead>
            <draggable
                v-model="list"
                tag="tbody"
                :item-key="ch_id"
                @end="move_end"
                :disabled="!field.sort"
            >
            <template #item="{ element: v }">
            <tr :key="ch_id(v)">

                <td v-for="h in field.headers" :key="h.name"  >
                <template v-if="h.change_in_slide">
                    <change_in_slide :refresh="cur_refresh" :form="form" :field="field" :name="h.name" :cur_id="ch_id(v)" :values="v"></change_in_slide>
                </template>
                <template v-else>
                    
                    <span v-if="h.type=='file'">                   
                        <span v-html="download_file_block(h,ch_id(v),v[h.name+'_filename'],v)"></span>

                        <template v-if="field.headers.length>1"> <!-- выводим эту ссылку если помимо файла есть другие поля -->
                            <a v-if="v[h.name+'_filename'] && !child_field_read_only(h.name)" href="" @click.prevent="del_file(h.name,ch_id(v))">удалить</a>
                        </template>
                        <template v-else>-</template>
                    </span>
                    <span v-else>
                        <pre v-if="h.type=='codelist'" class="codelist_slide">{{ get_value_for_slide(h,v) }}</pre>
                        <template v-else>
                            <template v-if="h.type=='text' && h.subtype=='color'">
                                                <div class="color_squire"  :style="{'background-color': get_value_for_slide(h,v) }"></div>&nbsp;
                            </template>
                            <span v-html="get_value_for_slide(h,v)"></span>
                        </template>
                    </span>
                </template>
                <!--<span v-else v-html="v[h.name]"></span>-->
                
                
                </td>
                <td class="tool">
                    <a :href="'/-'+ch_id(v)" v-if="!field.read_only" @click.prevent="open_edit_dialog(v)"><v-icon size="small" class="edit" color="primary">edit</v-icon></a>
                    <a :href="'/-'+ch_id(v)" @click.prevent="del(v)" v-if="make_delete"><v-icon size="small" color="primary"  >delete</v-icon></a>
                </td>
            </tr>
            </template>
            </draggable>
            </table>
        </template>
    </div>
    <!-- /slide -->
    </div>
</template>
<script>
//import ChangeInSlide from './change_in_slide';
import { bus } from '../../../main'
import ChangeInSlide from './ChangeInSlide';
import qr_call from '../text_subtypes/qr_call';
import email from '../text_subtypes/email';

export default {
    components:{
       'change_in_slide': ChangeInSlide,
       'qr_call': qr_call,
       'email': email
    },
    props:["form","values","field","upload_values"],
    data(){
        return {
            del_errors:[],
            del_errors_out:false, // выводить ошибку при операциях с 1_to_m (удаление)
            list:[], 
            cur_fields:[],
            cur_refresh:0,
            order_sync_timer:null // debounce пересчёта суммы заказа
        }
    },
    watch:{
        values(){
            this.cur_refresh++;
            this.list=this.values;
            this.sync_order_total();
            //Math.random();
        },
        field(){
            console.log('refresh field in slide');
        }
    },


    computed:{
        fields_hash(){
            let h={}
            for(let f of this.cur_fields){
                h[f.name]=true
            }
            return h
        },
        colors_primary(){
            return bus.colors_primary;
            /*let arr=[]
            for(let c in bus.colors_primary){
                arr.push([c,bus.colors_primary[c]])
            }
            return arr;*/
        },
        make_delete(){  
            return !this.form.read_only && this.field.make_delete && (!this.field.read_only || this.field.make_delete)
        },
        // Итог по составу заказа (для view_type: order)
        order_total(){
            let s=0
            for(const v of (this.values || []))
                s += this.num(v.price) * this.num(v.cnt)
            return s
        },
        // Ширина карточки в списке: cols=1 — на всю ширину, cols>1 — по колонкам.
        list_item_style(){
            const cols = parseInt(this.field.cols)
            if(!(cols > 0))
                return {}
            if(cols === 1)
                return { display: 'block', width: '100%', marginRight: '0' }
            return { width: 'calc(' + (100 / cols).toFixed(4) + '% - 16px)' }
        },
        //list(){
        //    return this.values
        //}
    },

    created(){
        let field=this.field
        this.list=this.values;
        this.cur_fields=this.field.fields // нужно для того, чтобы можно было обновить

        bus.$on( // обновление полей в 1_to_m
            `1_to_m/slide_${field.name}:update_fields`,this._update_fields
        )

        bus.$on(`1_to_m_slide:${this.field.name}_reload`,this.reload_slide);


    },
    beforeUnmount(){
        let field=this.field
        bus.$off( // обновление полей в 1_to_m
            `1_to_m/slide_${field.name}:update_fields`,this._update_fields
        )
        bus.$off(`1_to_m_slide:${this.field.name}_reload`,this.reload_slide);
    },
    methods:{
        _update_fields(fields){
            this.cur_fields=fields
            console.log('fields:',fields)

        },
        reload_slide(D){ // обновляем данные в слайде
            this.cur_fields=D.field.fields
            this.list=D.values
        },
        open_edit_dialog(v){
            bus.$emit( // событие передаём в 1_to_m_form
                '1_to_m_open_edit_dialog:'+this.field.name,
                v
            );
        },
        ch_id(v){ // возвращает id-шник записи
            return v[this.field.table_id]
        },
        move_end(){
            let sort_hash={};
            let i=1;
            for(let v of this.list){
                sort_hash[this.ch_id(v)]=i++;
            }
            this.$http.post(
                BackendBase+'/1_to_m/sort/'+this.form.config+'/'+this.field.name+'/'+this.form.id,
                {
                    sort_hash:sort_hash
                }
            ).then().catch(
                e=>{
                    this.del_errors = [e];
                    this.del_errors_out=true;
                }
            )
        },
        get_value_for_slide(h,values){
            let type=h.type;
            let name=h.name;
            if(h.slide_code && values[name+'_slide']!==undefined && values[name+'_slide']!==null)
                return values[name+'_slide'];
            let value=values[name];
            if(type=='text' || type=='textarea' || type=='wysiwyg' || type=='codelist'){
                return value
            }
            else if(type=='checkbox' || type=='switch'){
                return parseInt(value)?'да':'нет'
            }
            else{
                if(type=='select_from_table' || type=='select_values'){
                    let cf=this.get_field_by_name(name);
                    if(!cf)
                        return 'не найдено поле '+name
                    return this.get_header_from_select(cf,value)
                }
            }
        },
        get_field_by_name(name){
            for(let f of this.cur_fields)
                if(f.name==name)
                    return f
            return undefined
        },
        get_header_from_select(cf,value){
            for(let v of cf.values){
                if( (value ==v.v) || ( !parseInt(value)  && !parseInt(v.v) ) )
                    return v.d
            }
            return 'не указано'
        },
        child_field_read_only(name){
            if(this.form.read_only || this.field.read_only)
                return true
            
            for(let cf in this.cur_fields){
                if(cf.name=='name'){
                return cf.read_only?true:false
                }
            }
            return false
        },
        del(v){      
            let id=v[this.field.table_id];
            let url=BackendBase+'/1_to_m/delete/'+this.form.config+'/'+this.field.name+'/'+this.form.id+'/'+id;
            
            this.$http.get(url).then(
                response=>{
                let D=response.data;
                if(D.success){
                    let new_list=[];
                    for(let cv of this.values){
                    if(cv[this.field.table_id]!=v[this.field.table_id])
                        new_list.push(cv)
                    }
                    this.upload_values(new_list)
                    //this.values=new_list;
                }
                this.start_dialog_errors(D.errors);
            
                
                }
            );
        },
        del_file(child_name,cur_id){
                this.del_errors = [];
                this.$http.get(BackendBase+'/1_to_m/delete_file/'+this.form.config+'/'+this.field.name+'/'+child_name+'/'+this.form.id+'/'+cur_id).then(
                    response=>{
                        let D=response.data;
                        if(D.success){
                            let new_values=[];
                            for(let v of this.values){
                                if(cur_id == v[this.field.table_id])
                                    v[child_name+'_filename']=''                            
                                new_values.push(v);
                            }
                            this.upload_values(new_values)
                        }
                        this.start_dialog_errors(D.errors);

                    }
                )
        },
        download_file_block(h,child_id,orig_name,v){
            let child_name=h.name
            
            //let link=BackendBase+'/1_to_m/download/'+this.form.config+'/'+this.field.name+'/'+child_name+'/'+this.form.id+'/'+child_id+'/'+orig_name;
            let link=v.preview_img
            //console.log('v: ',v)
            //let cf=this.fields[child_name];
            let cf=this.get_field_by_name(child_name);
              
            let desc='скачать'; let view=0;

            if(!orig_name)
                    return ''
            console.log('link: ',link, 'make_view: ',this.make_view(link))
            if(this.make_view(link)){
                desc='просмотреть';
                
                if(cf.preview && cf.preview.length)
                    return `<br><a href="#" onclick="window.bus&&window.bus.$emit('lightbox:open',{src:'${link}'});return false"><img src="${link}" style="max-width:120px;cursor:zoom-in"></a><br>`
                
                else
                    return `<a href="${link}" target="_blank">${desc}</a> `
            }
            return `${orig_name}:<br><a href="${link}?view=${view}" download="${orig_name}">${desc} </a> `
        },
        make_view(f){
            // возвращает true, если файл можно просмотреть в браузере
            return /\.(jpg|png|gif|jpeg|webp|svg)$/i.test(f)
            
        },
        // --- view_type: order ---
        num(x){ return parseInt(x) || 0 },
        money(x){ return this.num(x).toLocaleString('ru-RU') + ' ₽' },
        good_link(v){ return BaseUrl + 'edit_form/ds_good/' + v.good_id },
        has_child(name){ return (this.cur_fields || []).some(f => f.name === name) },
        // Пересчёт total_sum на бэке после правок состава (debounce).
        sync_order_total(){
            if(this.field.view_type!='order' || !this.form || !this.form.id) return
            clearTimeout(this.order_sync_timer)
            this.order_sync_timer = setTimeout(()=>{
                this.$http.post(BackendBase + '/recalc_total/' + this.form.config + '/' + this.form.id, {})
                    .catch(()=>{})
            }, 400)
        },
        start_dialog_errors(errors){
            if(errors.length){
                this.del_errors = errors;
                this.del_errors_out=true;
                setTimeout(
                ()=>{
                    this.del_errors=[];
                    this.del_errors_out=false;
                },
                1500
                );
            }

        },


    }
}
</script>
<style scoped>
    .del_error li, .dialog_erros li {color: red; list-style-type: none;}
    .tool a {text-decoration: none;}
    .v-icon.edit {margin-right: 10px; }
    .v-card.one_to_m {display: inline-block; margin-right: 15px; padding-right: 40px; padding-bottom: 20px;}
    .one_to_m_list > div:not(.controls) {margin-bottom: 8px;}
    .one_to_m_list .controls {margin-top: 5px !important;   margin-bottom: 5px; display: none;}
    
    .one_to_m_list:hover .controls{display: block;}
    .one_to_m_list .controls button {margin: 5px !important;}
    .color_squire {
        border: 1px solid gray; margin-left: 5px; width: 10px; height: 10px; display: inline-block; vertical-align: middle;
    }
    pre.codelist_slide {
        font-family: var(--app-font-mono, monospace);
        font-size: var(--app-font-desc);
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 140px;
        overflow: auto;
        margin: 2px 0 0;
        padding: 6px 8px;
        border-radius: var(--app-radius-field);
        background-color: var(--app-tint);
    }

    /* view_type: order — «Состав заказа» */
    .order-goods {
        margin-top: 6px;
        border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
        border-radius: 12px;
        overflow: hidden;
    }
    .og-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
    }
    .og-row:nth-child(even) { background: rgba(var(--v-theme-on-surface), 0.03); }
    .og-row--head {
        font-weight: 700;
        background: rgba(var(--v-theme-primary), 0.08) !important;
        border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.14);
    }
    .og-col { display: block; min-width: 0; }
    .og-name { flex: 1 1 34%; }
    .og-name a { color: rgb(var(--v-theme-primary)); text-decoration: none; }
    .og-name a:hover { text-decoration: underline; }
    .og-artikul { flex: 0 0 14%; color: rgba(var(--v-theme-on-surface), 0.7); }
    .og-price, .og-cnt, .og-sum { flex: 0 0 12%; text-align: right; }
    .og-sum { font-weight: 600; }
    .og-tools {
        flex: 0 0 auto;
        display: flex;
        gap: 6px;
        opacity: 0.35;
        transition: opacity 0.15s ease;
    }
    .og-row:hover .og-tools { opacity: 1; }
    .og-total {
        display: flex;
        justify-content: flex-end;
        align-items: baseline;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(var(--v-theme-primary), 0.06);
    }
    .og-total__label { color: rgba(var(--v-theme-on-surface), 0.7); }
    .og-total__sum { font-size: 1.25em; font-weight: 700; }
    @media (max-width: 700px) {
        .og-artikul, .og-price { display: none; }
        .og-name { flex: 1 1 auto; }
    }

    
</style>