<template>
    <v-app id="EditForm">
        <!-- для вызова попапа извне -->
        <v-dialog v-model="popup.show" max-width="500">
          <v-card>
            <v-card-title  class="text-h5">{{popup.header}}</v-card-title>
            <v-card-text>
              {{popup.body}}
            </v-card-text>
          </v-card>
        </v-dialog>

        <div :class="containerClass" >
            <pre v-if="0">
                {{values}}
            </pre>
            
            <v-card v-if="fatal_errors.length">
              <v-card-title  class="text-h5">Критическая ошибка</v-card-title>
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
                            <v-card-title  class="text-h5">{{dialog_header}}</v-card-title>
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
                                <v-btn color="primary-darken-1" variant="text" @click="dialog = false">Продолжить работу</v-btn>
                                <v-btn color="red-darken-1" variant="text" v-if="exists_opener()" @click="window_close()">Закрыть</v-btn>
                            </v-card-actions>
                            -->
                        </v-card>
                    </v-dialog>

                    <h1 color="primary" class="form_header" v-html="form.title"/>
                    <FormBody
                        :form="form" :cols="cols" :tabs="tabs"
                        :values="values" :save="save" :disabled_form="disabled_form"
                    />
            
        </template>
      </div>
    </v-app>
</template>
<style scoped>
  .container_fluid {margin-left: 20px; margin-right: 20px;}
</style>
<script>
import { get_cgi_params, get_params } from './js/edit_form.js'
import FormBody from './EditForm/FormBody.vue'
import form_controller from './EditForm/form_controller.js'

export default {

// опции
  name:'edit-form',
  components:{ FormBody },
  mixins:[form_controller],
data:function(){
  return {
    popup:{ // для вызова извне: window.EditForm.popup='текст сообщения'
      show: false,
      header:'',
      body:''
    },
    valid: false,
    dialog_body:'',
    dialog_header:'',
    dialog: false,
    save_window:false,
    pagination: {}
  }
},
computed:{
  width(){
    if(this.form.width){
      return  this.form.width
    }
    return '';
  },
  containerClass(){
    return (this.form.wide_form || (this.cols && this.cols.length > 1)) ? 'container_wide' : 'container'
  },

},
created(){
  this.Init();
},
watch:{
  errors(){
      if(this.errors.length>0)
        this.dialog=true
  }
},
methods: {
          Init(){
            let url=get_params(this);
            if(url){
              this.load_form(url, get_cgi_params(), { redirect:true, document_title:true })
            }
          },
          save () {
            this.save_form(get_cgi_params()).then(R=>{
              if(!R) return
              if(R.success){
                this.dialog_header='Изменения сохранены';
                this.dialog_body='';
                if(this.form.id){
                  try {
                    this.$router.replace('/edit_form/'+this.params.config+'/'+this.form.id);
                  } catch (e) {
                    window.history.pushState(null, document.title, BaseUrl+'edit_form/'+this.params.config+'/'+this.form.id);
                  }
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
            })
          },
          window_close(){
            window.open('', '_self', '');
            window.close()
          },
          exists_opener(){
            return window.opener
          }
        }, // end-methods
}
</script>
<style >
    
    .v-application {line-height: 1;}  
    body {font-size: 14px;}
    
    div.field {margin: 0 0 var(--app-space-field) 0;}
    div.field [class*="v-col"] {padding-left: 0; padding-right: 0;}
    div.field .v-row {margin-left: 0; margin-right: 0;}
    div.field .v-input {margin-bottom: 0 !important;}
    
    button {margin: 1rem;}
    #EditForm .v-btn:not(.v-btn--icon) {
      min-width: 0;
      padding: 0 12px;
      border-radius: var(--app-radius-btn);
      margin: 4px;
    }
    #EditForm .v-btn--size-default:not(.v-btn--icon) {
      --v-btn-height: 32px;
      --v-btn-size: var(--app-font-label, 12px);
    }
    .container {max-width: 960px; width: 100%;}
    .container.onecol {max-width: 960px;}
    .container_wide {max-width: 1440px; width: 100%; margin: 0 auto; padding: 0 24px;}
    header {margin-top: 1rem;}  
    .v-list-item {min-height: 25px !important;}
    .form_header {margin-bottom: 20px;}
</style>
