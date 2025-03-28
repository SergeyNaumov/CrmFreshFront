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
            
            <template v-if="fields[cf.name]">
            
              
              <field-text v-if="(cf.type=='text' || cf.type=='textarea')"
                :field="fields[cf.name]"
                :save_to_store="save_to_store"
                :save_field_to_store="save_field_to_store"
                :get_value_by_field="get_value_by_field"
                :get_source_field="get_source_field"
              />

              <field-select v-else-if="cf.type=='select_from_table' || cf.type=='select_values'"
                  :form="form"
                  :field="fields[cf.name]"
                  :save_to_store="save_to_store"
                  :save_field_to_store="save_field_to_store"
                  :get_value_by_field="get_value_by_field"
                  :get_source_field="get_source_field"
              />
            
<!--             
              <field-checkbox 
                  v-else-if="cf.type=='checkbox' || cf.type=='switch'"
                  :form="form"
                  :field="fields[cf.name]" 
                  :save_to_store="save_to_store"
                  :refresh="cur_refresh"
              />
                        
              <form v-else-if="cf.type=='file'" enctype="multipart-form/data"  class="upload_file" :id="'upload_'+cf.name" >
                <input type="file">
              </form> -->
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
            @click="save(save_action)" small>Сохранить
          </v-btn>
          <div v-if="form_disabled" class="err">перед сохранением исправьте ошибки</div>
          
      </v-card>
    </v-dialog>
</template>
<script>
import { create_edit_fields } from './methods.js'  
export default {
    props:["field","change_one_to_m",
      "values","upload_values",
    ], /* "dialog", */
    data(){
        return {
            //edit_fields:{}, // сюда сохраняются данные формы
            
            error_messages:{},
            form_disabled:false,
            cur_refresh:0,
            in_dialog:false,
            //fields:{},
            //save_action:'',
            dialog_errors:[],
            id:null
        }
    },
    computed:{
      dialog(){
        if(!this.field || !this.field.name || !this.$store.state.one_to_m[this.field.name]){
          return false
        }
        return this.$store.state.one_to_m[this.field.name].dialog
      },
      fields(){
        return this.$store.state.one_to_m[this.field.name].fields
      },
      save_action(){ // action для формы
        return this.$store.state.one_to_m[this.field.name].save_action
      },
      form(){
        return this.$store.state.form
      }
      
    },

    created(){
      let t=this
      //create_edit_fields(t);
    },
    watch:{
        // field(){
        //   this.create_edit_fields
        // },
        dialog(v){ // когда открывается окно -- инитим fields
            //this.in_dialog=this.dialog;
            let t=this
            if(t.save_action=='insert'){
              // очищаем форму
              create_edit_fields(t);  
            }
            t.in_dialog=t.dialog

        },
        save_action(a){
          if(a=='insert'){
            // когда открывается новая форма -- пересоздаём fields
            // в других случаях -- нет
            let t=this
            create_edit_fields(t);
            t.$store.state.one_to_m[t.field.name].id=null
          }
          
        },
        in_dialog(v){
            let t=this
            if(v){
              //console.log('in_dialog:',t.in_dialog, v)
              
              t.dialog_errors=[]
            }
            // сохраняем в store
            t.$store.state.one_to_m[t.field.name].dialog=v
            
            
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
        get_value_by_field(name){
          let t=this
          
          return t.$store.state.one_to_m[t.field.name].fields[name].value
          //this.fields[name].value
        },
        save_field_to_store(field){
          let t=this
          t.$store.state.one_to_m[t.field.name].fields[field.name]=field
          //console.log('safe_field_to_store:',t.$store.state.one_to_m[t.field.name].fields[obj.field.name])
        },
        save_to_store(obj){ // для элементов fields/* правила сохранения
          let t=this
          //console.log('obj:',obj)
          
          t.$store.state.one_to_m[t.field.name].fields[obj.field.name].value=obj.value
          //console.log('save_to_store:',t.$store.state.one_to_m[t.field.name].fields[obj.field.name].value)
        },
        get_source_field(name){
          let t=this
          
          return t.$store.state.one_to_m[t.field.name].fields[name]
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
        save(save_action){
          let t=this, new_values={}, fields=t.fields;
          //проверяем, прикрепили ли файлы 
          let store=t.$store.state.one_to_m[t.field.name]
          
          let parent_id=this.form.id
          for(let f of this.field.fields){
            if(fields[f.name]){
              let v
              if(f.type=='checkbox'){
                v=fields[f.name].value?1:0
              }
              else{
                v=fields[f.name].value;  
              }
              new_values[f.name]=v;
            }
          }
          
          let url='', config=this.form.config;
          //console.log('save_action: '+save_action);
          if(save_action=='insert')
            url=`${BackendBase}/1_to_m/insert/${config}/${this.field.name}/${this.form.id}`
          else if(save_action=='update')
            url=`${BackendBase}/1_to_m/update/${config}/${this.field.name}/${t.form.id}/${store.id}`
          else{
            console.error('not set save_action');
            return; 
          }

          //return

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

                  
                  // // В слайде после сохранения заставляем перечитать этот 1_to_m
                  // setTimeout(
                  //   ()=>{
                  //     //console.log(`emit: 1_to_m:upload_values:${this.field.name}`)
                  //     this.$store.state.one_to_m[this.field.name].list=
                  //     //console.log(this.field.values)
                  //     // this.$bus.emit(
                  //     // `1_to_m:upload_values:${this.field.name}`,
                  //     // this.field.values
                  //     // )
                  //   },
                  //   500
                  // )
                  

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