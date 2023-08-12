<template>
    <v-dialog class="one_to_m_form" justify="center" v-model="in_dialog" id="is_dialog">

      <v-card class="one_to_m">

        <div class="close">
            <v-icon @click="in_dialog=false" style="text-align: right">mdi-close</v-icon>
        </div>
        <div class="dialog_head">
          <div>
            <template v-if="save_action=='insert'">Создание элемента</template>
            <template v-if="save_action=='update'">Редактирование элемента</template>
          </div>


        </div>

          <div v-for="cf in field.fields" :key="cf.name">
         
            <template v-if="edit_fields[cf.name] && (cf.type=='text' || cf.type=='textarea')">
              
              <field-text
                :field="edit_fields[cf.name]"
                :parent="parent_sub"
                :refresh="cur_refresh"
                :error-messages="error_messages[cf.name]"
              />

            </template>
            
            
            <template v-else-if="cf.type=='select_from_table' || cf.type=='select_values'">
               
                <field-select
                  :field="edit_fields[cf.name]"
                  :parent="parent_sub"
                  :name_parent_field="field.name"
                  :refresh="cur_refresh"
                  :form="form"
                />
                
                <!--
                <v-autocomplete v-if="cf.autocomplete"
                    :label="cf.description"
                    :items="cf.values"
                    filled
                    item-value="v"
                    item-text="d"
                    no-data-text="ничего не найдено"
                    v-model="edit_fields[cf.name].value"
                />
                -->
            </template>
            <template v-else-if="cf.type=='checkbox' || cf.type=='switch'">
                <field-checkbox 
                  :form="form"
                  :field="edit_fields[cf.name]" 
                  :parent="parent_sub"
                  :refresh="cur_refresh"
                />
            </template>
            <template v-else-if="cf.type=='file'">
              <form enctype="multipart-form/data"  class="upload_file" :id="'upload_'+cf.name">
                <input type="file">
              </form>
            </template>
          </div>
          
          <template v-if="dialog_errors.length">
            <ul class="dialog_erros">
              <li v-for="(e,idx) in dialog_errors" :key="'dial_err'+idx">{{e}}</li>
            </ul>
          </template>
          
          <v-btn color="primary" 
            v-if="(!form.read_only && !field.read_only)"
            :disabled="form_disabled"
            @click="save(edit_fields,save_action)" small>Сохранить
          </v-btn>
          <div v-if="form_disabled" class="err">перед сохранением исправьте ошибки</div>
          
      </v-card>
    </v-dialog>
</template>
<script>
import { bus } from '../../../main'
export default {
    props:["form","dialog","field","change_one_to_m","set_dialog",
      "values","upload_values",
    ],
    data(){
        return {
            edit_fields:{},
            error_messages:{},
            form_disabled:false,
            cur_refresh:0,
            in_dialog:false,
            fields:{},
            save_action:'',
            dialog_errors:[],
            id:null
        }
    },

    created(){
      
      
      this.create_edit_fields();
      // событие открывания формы редактирования вызывается из слайда
      bus.$on('1_to_m_open_edit_dialog:'+this.field.name,
        v=>{this.open_edit_dialog(v)}
      );
      // открываем окно для создания нового элемента (из 1_to_m по кнопке "добавить")
      bus.$on('1_to_m_open_new_dialog:'+this.field.name,
        ()=>{
          this.open_new_dialog()}
      )
    },
    watch:{
        dialog(){ // когда открывается окно -- инитим fields
            this.in_dialog=this.dialog;
            this.fields=this.edit_fields
        },
        in_dialog(){
            this.dialog_errors=[]
            //this.set_dialog(this.in_dialog)
        },
        cur_refresh(){
          this.form_disabled=false
          for(let name in this.error_messages){
          
            if(this.error_messages[name]){
              this.form_disabled=true
              return
            }
            
          }
        }

    },

    methods:{
        save_cur(){
            
        },
        change_field(cf){

            if(!this.fields[cf.name]){
                this.fields[cf.name]={}
            }
            this.fields[cf.name].value=cf.value;

            this.change_one_to_m()
        },
        get_child_by_name(field,name){
          for(let f of field.fields)
            if(f.name==name)
              return f
          return false
        },
        
        parent_sub(obj){ // для элементов fields/* правила сохранения
          
          //console.log('obj:',obj)
          let value=obj.value;
          if(obj.type=='checkbox' || obj.type=='switch'){
            value=value?1:0
          }
          
          for(let attr of ['error','error_message','value']){
            
            if(attr=='error_message'){
              this.error_messages[obj.name]=obj.error_message
              
            }
            if(obj[attr]!==undefined){

              this.edit_fields[obj.name][attr]=obj[attr]
              
            }
            
          }
          if(obj.name=='phone'){
            //console.log('OBJ:',obj)
          }

          this.cur_refresh=Math.random()

        },
        open_new_dialog(){ // Форма для добавления
          this.create_edit_fields();
          this.cur_refresh=Math.random();
          this.save_action='insert'; this.in_dialog=true;
          this.id=undefined;
          if(this.multiload_name){
              let upload_selector=document.querySelector('form.upload_file');
              if(upload_selector){
                upload_selector.reset();
              }
          }
        },
        open_edit_dialog(d){ // открываем форму для редактирования
          //this.create_edit_fields();
          
          this.cur_refresh=Math.random();
          this.id=d[this.field.table_id];
          for(let f of this.field.fields){
            if(this.edit_fields[f.name]){
              this.edit_fields[f.name].value=d[f.name]
            }
          }
          this.save_action='update';
          this.new_values={};
          let i=0;
          this.in_dialog=true;
        },
        create_edit_fields(){
          for(let f of this.field.fields){        
            if(/^(file|text|textarea|checkbox|switch|select|select_from_table|select_values)$/.test(f.type)){
              if(f.type=='select_from_table' || f.type=='select_values'){ // преобразование типов
                for(let v of this.field.values){
                  if(!v[f.name]) v[f.name]=''
                  v[f.name]=v[f.name].toString();
                }
              }
              let new_fld={};
              Object.assign(new_fld,f);
              
              if(f.type=='text' || f.type=='textarea'){
                new_fld.value='';
              }
              else{
                new_fld.value=0;
              }
              this.edit_fields[f.name]=new_fld;
            }
          }
        },
        save_files(values){
          let cur_id=values[this.field.table_id];
          for(let f of this.field.fields){
            if(f.type=='file'){
              
              let formData = new FormData();
              let file = document.querySelector('#upload_'+f.name+' input[type=file]' );
              //let form=document.getElementById('upload_'+f.name);
              if(file.files.length){ // файлы выбраны
                //formData.append(f.name, file.files[0]);
                formData.append('attach', file.files[0]);
                this.$http.post(BackendBase+'/1_to_m/upload_file/'+this.form.config+'/'+this.field.name+'/'+f.name+'/'+this.form.id+'/'+cur_id, formData, {
                    headers: {'Content-Type': 'multipart/form-data'}
                }).then(
                  response=>{
                    if(response.data.success){
                        /*values[f.name+'_filename']=response.data.file_info.orig_name;
                        //values[f.name+'_filename']=file.files[0]['name'];

                        let table_id=this.field.table_id;
                        let new_values=[];
                        // обновляем this.values, чтобы сработала реактивность
                        for(let v2 of this.values){
                          if(v2[table_id]==values[table_id])
                            new_values.push(values)  
                          else
                            new_values.push(v2)
                        }
                        */
                        this.upload_values(response.data.values);
                    }

                  }
                )
              }
            }
          }
        },
        save(edit_fields,save_action){
          let new_values={};
          //проверяем, прикрепили ли файлы 
          
          
          for(let f of this.field.fields){
            if(edit_fields[f.name]){
              let v=edit_fields[f.name].value;
              new_values[f.name]=v;
            }
          }

          let url='';
          //console.log('save_action: '+save_action);
          if(save_action=='insert')
            url=BackendBase+'/1_to_m/insert/'+this.form.config+'/'+this.field.name+'/'+this.form.id
          else if(save_action=='update')
            url=BackendBase+'/1_to_m/update/'+this.form.config+'/'+this.field.name+'/'+this.form.id+'/'+this.id
          else{
            //console.error('not set save_action');
            return; 
          }
          //console.log('fk:',this.field.foreign_key, ' parent_id:',this.values )
          this.$http.post(
            url,
            {
              id:this.id,
              values:new_values
            }
          ).then(
            response=>{
                
                let D=response.data;
                if(D.success){
                  
                  this.in_dialog=false; 
                  if(!this.id)
                    this.id=D.id

                  
                  // В слайде после сохранения заставляем перечитать этот 1_to_m
                  setTimeout(
                    ()=>{
                      console.log(`emit: 1_to_m:upload_values:${this.field.name}`)
                      //console.log(this.field.values)
                      bus.$emit(
                      `1_to_m:upload_values:${this.field.name}`,
                      this.field.values
                      )
                    },
                    500
                  )
                  
                  /*
                  let values=D.values;
                  for(let cf of this.field.fields){ // преобразование типов для select_from_table и select_values
                    if(cf.type=='select_values' || cf.type=='select_from_table')
                      values[cf.name]=values[cf.name].toString();
                  }
                  if(save_action=='insert'){
                    
                    
                    // !!! здесь нужно сделать преобразование типов для select_from_table и select_values
                    
                    let values_new=[];
                    for(let v of this.values){
                      values_new.push(v)
                    }
                    values_new.push(D.values); // D.values
                    
                    
                  }
                  else if(save_action=='update'){
                    let values_new=[];
                    let table_id=this.field.table_id;
                    for(let v of this.values){
                        if(v[table_id]==values[table_id])
                          values_new.push(values)
                        else
                          values_new.push(v)
                    }
                    this.upload_values(values_new);
                  }
                  */
                  this.upload_values(D.values);

                  let obj=[]; obj[this.field.table_id]=this.id;
                  
                  this.save_files(obj);
                  this.add_form=false;
                  new_values={};
                }
                else
                  this.dialog_errors=D.errors;
            }
          );



        }
  } // end methods
}
</script>
<style scoped lang="scss">

  @import '@/styles/variables.scss';
  .headline {padding: 0 0 0 20px; margin: 0; color: $primary;}
  .v-dialog {max-width: 800px;}
  .v-dialog .v-card {margin-top: 0; padding-top: 0; max-width: 800px;}
  .v-dialog > .v-card > .v-card__title {padding-left: 0; padding-bottom: 20px; color: $primary;}
  .v-btn {margin-left: 0;}
  
  .row .col {margin: 0; padding-right: 0; padding-top: 0;}
  .dialog_head {width: 100%; margin: 20px 0 20px 0; border-bottom: 1px solid $primary; padding-bottom: 10px;}
  .dialog_head div {display: inline-block; width: auto; color: $primary; font-size: 14pt; min-width: 50%;}
  .one_to_m .close {
    position: absolute;
    width: 50px;
    text-align: right;
    display: inline-block;
    right: 5px;
    top: 0px;
    color: black;
    
  }
  .v-icon:hover {color :$primary;}
</style> 