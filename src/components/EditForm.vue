<template>
    <v-app id="EditForm">
        <!-- для вызова попапа извне -->
        <v-dialog v-model="popup.show" max-width="500">
          <v-card>
            <v-card-title  class="headline">{{popup.header}}</v-card-title>
            <v-card-text>
              {{popup.body}}
            </v-card-text>
          </v-card>
        </v-dialog>
        
        <div :class="form.wide_form?'container_fluid':'container'" >
            <pre v-if="0">
                {{values}}
            </pre>
            
            <v-card v-if="fatal_errors.length">
              <v-card-title  class="headline">Критическая ошибка</v-card-title>
              <v-card-text >
                      <errors :errors="fatal_errors"/>
              </v-card-text>
            </v-card>
            
            <template v-else>
                    <template v-if="log">
                        <div>
                            <pre v-if="typeof(log)=='string'" v-html="log"></pre>
                            <pre v-else v-for="(l,idx) in (log)" v-bind:key="idx" v-html="l"></pre>
                        </div>
                    </template>
                    <v-dialog v-model="dialog" max-width="500">
                        <v-card>
                            <v-card-title  class="headline">{{dialog_header}}</v-card-title>
                            <v-card-text>
                              <template v-if="log.length">
                                  <b>обратитесь к разработчику: </b>
                                  <pre v-for="(l,idx) in (log)" :key="'l2'+idx" v-html="l"></pre>
                              </template>
                              <errors :errors="errors"/>
                              <template v-if="!errors.length">
                              {{dialog_body}}
                              </template>
                            </v-card-text>
                            <!--
                            <v-card-actions ">
                                <div class="flex-grow-1"></div>
                                <v-btn color="primary darken-1" text @click="dialog = false">Продолжить работу</v-btn>
                                <v-btn color="red darken-1" text v-if="exists_opener()" @click="window_close()">Закрыть</v-btn>
                            </v-card-actions>
                            -->
                        </v-card>
                    </v-dialog>

                    <h1 color="primary" class="form_header" v-html="form.title"/>
                    <form autocomplete="off">
                    <v-layout row wrap>

                        <template v-if="cols.length"> <!-- Колонки, блоки -->
                          <!--  -->
                            <v-flex pl-3 :class="'md'+12/Math.floor(cols.length)" xs12 v-for="c in cols" :key="c.idx">

                            <v-card class="block" v-for="block in c" :key="block.name">
                                <v-toolbar color="primary" dark height="35px" @click="block_toggle(block)">
                                    <v-toolbar-title >
                                        <v-icon v-if="!block.hide">keyboard_arrow_up</v-icon> 
                                        <v-icon v-if="block.hide">keyboard_arrow_down</v-icon>
                                        <span >{{block.description}} </span>
                                    </v-toolbar-title>
                                    <div class="flex-grow-1"></div>
                                </v-toolbar>

                                <div v-show="!block.hide" pb-1>
                                    <form-block :block_name="block.name" :form="form"  :save="save" :values="values"></form-block>
                                    <v-flex xs12 lg12 text-lg-center>

                                    <v-btn color="primary" v-if="!form.read_only && !block.not_save_button" :disabled="disabled_form" @click="save()">Сохранить</v-btn> 
                                    </v-flex>
                                </div>
                                
                            </v-card>

                            </v-flex>
                        </template>
                        <template v-else-if="tabs.length"> <!-- Табы -->
                              <v-tabs v-model="tab">
                                <v-tab v-for="(tab,idx) in tabs" :key="'tab'+idx" :style="tab.style" v-html="tab.description"/>

                              </v-tabs>
                              <v-flex md12 >
                              <v-card style="width: 100%;">
                                <v-tabs-items v-model="tab" >
                                  <v-tab-item v-for="(tab,idx) in tabs" :key="'tabitm'+idx">
                                    <form-block :block_name="tab.name" :form="form"  :save="save" :values="values"></form-block>
                                  </v-tab-item>
                                </v-tabs-items>
                              </v-card>
                              </v-flex>
                              
                        </template>
                        <template v-else> 
                            <v-flex md12 >

                            <v-card style="padding: 1rem;">

                                <form-block :block_name="''" :form="form"  :save="save" :values="values"></form-block>
                                <v-flex xs12 lg12 text-lg-center>
                                
                                <v-btn color="primary" v-if="!form.read_only" :disabled="disabled_form" @click="save()">Сохранить</v-btn> 
                                </v-flex>
                            </v-card>
                            </v-flex>

                        </template>
                    </v-layout>
                    </form>
            
        </template>
      </div>
    </v-app>
</template>
<style scoped>
  .container_fluid {margin-left: 20px; margin-right: 20px;}
</style>
<script>
import { bus } from '../main'

import { 
  on_dependence, change_field,save_field_1_to_m, 
  frontend_button_process,
  frontend_process, get_cgi_params, get_params, calc_values
} from './js/edit_form.js'



export default {

// опции
  name:'edit-form',

data:function(){
  return {
    popup:{ // для вызова извне: window.EditForm.popup='текст сообщения'
      show: false,
      header:'',
      body:''
    }, 
    log:[],
    title:'',
    errors:[],
    disabled_form: false,
    fatal_errors:[],
    tabs:[],
    tab:null,
    form:{
      id:'',
      title:'',
      read_only:false,
      fields:[],
      config:'',
    },
    cols:[],
    values:{},
    valid: false,
    dialog_body:'',
    dialog_header:'',
    dialog: false,
    save_window:false,
    pagination: {},
    params:{config:''}
  }
},
computed:{
  width(){
    if(this.form.width){
      return  this.form.width
    }
    return '';
  },

},
//props:['params'],
created(){
  // Для того, чтобы можно было обратиться к объекту EditForm
  window.EditForm=this

  calc_values(this);
  this._change_field=(field,not_frontend_process)=>{

    change_field(this,field,not_frontend_process)
  }
  let self=this;
  this._save_field_1_to_m=(data)=>{
    save_field_1_to_m(self,data)
  }
  this._frontend_button_process=(field,button_name,success_function)=>{
    frontend_button_process(this,field,button_name,success_function)
  }
  bus.$on('change_field', this._change_field);
  bus.$on('save_field_1_to_m',this._save_field_1_to_m);
  bus.$on('frontend_button_process',this._frontend_button_process);

  this.Init();
},
beforeDestroy(){
  bus.$off('change_field',this._change_field);
  bus.$off('save_field_1_to_m',this._save_field_1_to_m);
  bus.$off('frontend_button_process',this._frontend_button_process);
},
watch:{
  errors(){
      if(this.errors.length>0)
        this.dialog=true
  }
},
methods: {
          init_tabs(d){
            if('tabs' in d && d.tabs.length){
              let i=0
              for(let t of d.tabs){
                t.active=i?false:true
                i++
              }
              this.tabs=d.tabs
            }
          },
          get_form_self(){
            return this
          },
          Init(){
            let url=get_params(this);
            if(url){
                this.$http.post(
                  url,
                  {
                    cgi_params: get_cgi_params()
                  }
                ).then(response=>{
                        let data=response.data;
                        if(data.log)
                            this.log=data.log
                        
                        if(data.redirect && data.redirect!=location.pathname){
                          localStorage.setItem('link_prev_login',location.href)

                          location.href=data.redirect;
                          return ;
                        }
     
                        if(data.success){

                            if(data.title){
                              this.title=data.title;
                              document.title=this.title.replace(/<.+?>/g,' ')
                            }

                            // для реактивности
                            for(let f of data.fields)
                              if(!('hide' in f))
                                f.hide=false
                            this.form=data;
                            this.form.read_only=parseInt(this.form.read_only);
                            calc_values(this);
                            
                            this.cols=data.cols;
                            this.init_tabs(data)

                            
                            for(let f of this.form.fields){
                              if(f.type=='file' && f.value){
                                f.begin_value=f.value, f.value=''
                              }
                              
                              if(f.type=='checkbox' || f.type=='switch'){
                                f.value=parseInt(f.value)?1:0;
                                this.values[f.name]=f.value
                              }

                            }
                        }
                        // Динамический javascript
                        if(data.javascript){
                          eval(data.javascript)
                        }
                        
                        // Статический javascript
                        if(data.javascript_static){
                          for(let src of data.javascript_static){
                            let script = document.createElement('script')
                            script.src=src
                            document.head.appendChild(script)
                          }
                        }
                        this.fatal_errors=data.errors;
                        
                    }).catch(e => {
                        this.fatal_errors=[e]
                    })
            }
          },
          init_color_selects(){
            for(let field of this.form.fields){
              if(field.type=='select'){
                for(let v of field.values){
                  if(v.v==field.value){
                    if(v['c'])
                      field.background_color=v.c;
                  }
                }
              }
            }
          },
          save () {
            let data={}, t=this
            let url=BackendBase+'/edit-form/'+this.params.config+(this.form.id?('/'+this.form.id):'');
            t.errors=[]; t.log=[];
            
            t.$http.post(url,{
              action:this.form.id?'update':'insert',
              id:this.form.id,
              values:this.values,
              cgi_params: get_cgi_params()
            }).then(response=>{
              let R=response.data;
              if(R.log)
                this.log=R.log
              
              this.errors=R.errors;
              if(R.success){
                this.dialog_header='Изменения сохранены';
                //this.dialog_body='Изменения успешно сохранены! Вы можете продолжить работу или закрыть карточку'; 
                this.dialog_body=''; 
                if(R.id){
                  this.form.id=R.id;
                }
                if(this.form.id){
                  this.save_files();
                  window.history.pushState(null, document.title, BaseUrl+'edit_form/'+this.params.config+'/'+this.form.id);
                }
                this.Init()
              }
              else{
                this.dialog_header='При сохранении произошли ошибки';
              }
              this.dialog=true;
              if(!this.errors.length){
                setTimeout(()=>{this.dialog=false},500)
              }
              
            }).catch(
              e=>{
                this.errors=['Произошла ошибка при сохранении!: '+e]
              }
            )
          },
          // Загрузка файлов в форму
          save_files(){
            
            for(let f of this.form.fields){
              if(f.type === 'file'){
                
              }
              if(f.type=='file' && f.value) {
                this.$http.post(
                  BackendBase+'/edit-form/'+this.params.config+'/'+ this.form.id,
                  {
                    action:'upload_file',
                    name: f.name,
                    value:f.value,
                  }
                ).then(
                    r=>{
                      let R=r.data;
                      this.errors=R.errors;
                      if(R.success){
                        bus.$emit('file:'+f.name,R.value);
                      }
                    }
                ).catch(
                    e=>{
                      this.errors=['Ошибка при сохранении файла '+f.description+': '+e]
                    }
                )
              }
            }
          },
          window_close(){
            window.open('', '_self', '');
            window.close()
          },
          exists_opener(){
            return window.opener
          },
          block_toggle(block){
            block.hide=!block.hide
            if(!block.hide && block.on_show){
              eval(block.on_show)
            }
          }
          // 1_to_m-end
        }, // end-methods
}
</script>
<style >
    
    .v-application {line-height: 1;}  
    body {font-size: 14px;}
    
    div.field {margin: 0 20px;}
    
    button {margin: 1rem;}
    .container.onecol {max-width: 1200px;}
    header {margin-top: 1rem;}  
    .v-list-item {min-height: 25px !important;}
    .form_header {margin-bottom: 20px;}
</style>
