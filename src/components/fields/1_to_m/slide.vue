<template>
    <!-- slide -->
    <div>
      <div v-if="values && values.length">      
        <v-dialog v-model="del_errors_out" max-width="500">
        <v-card class="one_to_m" >
            <v-card-title  class="headline">
                Ошибка
            </v-card-title>
            <ul class="del_error">
                <li v-for="e in del_errors" :key="e">{{e}}</li>
            </ul>
        </v-card>
        </v-dialog> 
        <!-- view type: list -->
        <template v-if="field.view_type=='list'">
            <v-layout>
                <draggable
                    v-model="list"
                    tag="div"
                    @end="move_end"
                    :draggable="field.sort?'.v-card':false"
                >
                
                    <v-card class="one_to_m one_to_m_list"  v-for="(v,vi) in list" :key="v[vi]"> <!--:style="{'background-color': $color.secondary}"-->

                        <template v-for="(h,hidx) in field.headers">
                            <div :key="h[hidx]" v-if="v[h.name]">
                                <template v-if="h.change_in_slide">
                                    <change_in_slide :refresh="cur_refresh" :form="form" :field="field" :name="h.name" :cur_id="v.id" :values="v"></change_in_slide>
                                </template>
                                <template v-else>
                                    
                                    <span class="h">{{h.description}}:</span> 
                                    <template v-if="h.type=='file'">         
                                        <span v-html="download_file_block(h.name,ch_id(v),v[h.name+'_filename'])"></span>
                                        <a v-if="v[h.name+'_filename'] && !child_field_read_only(h.name)" href="" @click.prevent="del_file(h.name,ch_id(v))">удалить</a>
                                        <template v-else>-</template>
                                    </template>
                                    <template v-else>
                                        <!-- div squire color 20x20-->
                                        <template v-if="h.type=='text' && h.subtype=='color'">
                                            <div class="color_squire"  :style="{'background-color': get_value_for_slide(h,v) }"></div>
                                        </template>
                                        {{get_value_for_slide(h,v)}}
                                    </template>
                                </template>
                            </div>
                        </template>
                        <div class="controls">
                            <v-icon small class="edit" color="primary" v-if="!field.read_only" @click="open_edit_dialog(v)">edit</v-icon>
                            <v-icon small color="primary" v-if="make_delete" @click="del(v)">delete</v-icon>
                        </div>
                    </v-card>
                </draggable>
            </v-layout>
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
                @end="move_end"
                :draggable="field.sort?'tr':false"
            >
            <tr v-for="v in list" :key="ch_id(v)">

                <td v-for="h in field.headers" :key="h.name"  >
                <template v-if="h.change_in_slide">
                    <change_in_slide :refresh="cur_refresh" :form="form" :field="field" :name="h.name" :cur_id="v.id" :values="v"></change_in_slide>
                </template>
                <template v-else>
                    
                    <span v-if="h.type=='file'">                   
                        <span v-html="download_file_block(h.name,ch_id(v),v[h.name+'_filename'])"></span>
                        <a v-if="v[h.name+'_filename'] && !child_field_read_only(h.name)" href="" @click.prevent="del_file(h.name,ch_id(v))">удалить</a>
                        <template v-else>-</template>
                    </span>
                    <span v-else>
                        <template v-if="h.type=='text' && h.subtype=='color'">
                                            <div class="color_squire"  :style="{'background-color': get_value_for_slide(h,v) }"></div>&nbsp;
                        </template>
                        <span v-html="get_value_for_slide(h,v)"></span>
                    </span>
                </template>
                <!--<span v-else v-html="v[h.name]"></span>-->
                
                
                </td>
                <td class="tool">
                    <a :href="'/-'+ch_id(v)" v-if="!field.read_only" @click.prevent="open_edit_dialog(v)"><v-icon small class="edit" color="primary">edit</v-icon></a>
                    <a :href="'/-'+ch_id(v)" @click.prevent="del(v)" v-if="make_delete"><v-icon small color="primary"  >delete</v-icon></a>
                </td>
            </tr>
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
export default {
    components:{
       'change_in_slide': ChangeInSlide
    },
    props:["form","values","field","upload_values"],
    data(){
        return {
            del_errors:[],
            del_errors_out:false, // выводить ошибку при операциях с 1_to_m (удаление)
            list:[], 
            cur_fields:[],
            cur_refresh:0
        }
    },
    watch:{
        values(){
            this.cur_refresh++;
            this.list=this.values;
            //Math.random();
        },
        field(){
            console.log('refresh field in slide');
        }
    },
    computed:{
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
        //list(){
        //    return this.values
        //}
    },

    created(){
        this.list=this.values;
        this.cur_fields=this.field.fields // нужно для того, чтобы можно было обновить

        bus.$on(`1_to_m_slide:${this.field.name}_reload`,
            v=>{this.reload_slide(v)}
        );        

    },
    methods:{
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
            let value=values[name];
            if(type=='text' || type=='textarea' || type=='wysiwyg'){
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
        download_file_block(child_name,child_id,orig_name){
                
            let link=BackendBase+'/1_to_m/download/'+this.form.config+'/'+this.field.name+'/'+child_name+'/'+this.form.id+'/'+child_id+'/'+orig_name;

            //let cf=this.fields[child_name];
            let cf=this.get_field_by_name(child_name);
              
            let desc='скачать'; let view=0;

            if(!orig_name)
                    return ''

            if(this.make_view(link)){
                desc='просмотреть';
                
                if(cf.preview && cf.preview.length)
                    return `${orig_name}:<br><a href="${link}?view=1" target="_blank"><img src="${link}?view=${cf.preview}"></a><br>`
                
                else
                    return `${orig_name}: <a href="${link}?view=1" target="_blank">посмотреть</a> `
            }
            return `${orig_name}:<br><a href="${link}?view=${view}">${desc}</a> `
        },
        make_view(f){
            // возвращает true, если файл можно просмотреть в браузере
            return /\.(jpg|png|gif|gpeg|webp)$/i.test(f)
            
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
    .one_to_m_list .controls {margin-top: 10px !important; margin-left: 30px !important; position: absolute !important; top: 30px; right: 10px; margin-bottom: 10px;}
    .one_to_m_list .controls button {margin: 5px !important;}
    .color_squire {
        border: 1px solid gray; margin-left: 5px; width: 10px; height: 10px; display: inline-block; vertical-align: middle;
    }
</style>