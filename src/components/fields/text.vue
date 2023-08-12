<template>
        <div>         
          <template v-if="!field.hide">

            <template v-if="field.subtype=='color'">
              <div class="color_block">
                  <div class="label">{{field.description}}</div>

                  <v-color-picker
                    
                    v-model="value"
                    :hide-canvas="!show_color_picker"
                    :hide-sliders="false"
                    hide-inputs
                  />

                  <a href="" @click.prevent="show_color_picker=!show_color_picker"><div class="picker_button"></div></a>
                  <div v-if="field.values && field.values.length" style="padding: 10px;">
                    <span v-for="v in field.values" :key="v.v">
                      <a href="" @click.prevent="set_new_value(v.v)" >{{ v.d }}</a>&nbsp;
                    </span>
                  </div>
              </div>
            </template>
            <template v-else>
              <template v-if="show_city_for_address">
                
                <v-select
                  v-model="current_prefix"
                  :items="field.prefix_list"
                  :label="field.prefix_list_header"
                  @input="select_prefix"
                  hide-details
                  :rounded="$theme.rounded"
                />
              </template>
              <v-text-field 
                v-if="field.type=='text'"
                :label="field.description"
                v-model="value"
                :hint="field.add_description" :placeholder="field.placeholder"
                :disabled="!!field.read_only"
                @input="input"
                @keyup="input"
                :clearable="!field.read_only"
                :style="field.style"
                :error-messages="error_message"
                :rounded="$theme.rounded"
                hide-details
              />
              <div class="popup_list" v-if="show_popup_list"> 
                <div class="close"><a href="" @click.prevent="show_popup_list=false">закрыть</a></div>
                <div class="item" v-for="(p,idx) in popup_list" :key="'popup'+idx" @click="set_new_value(p.header)">{{p.header}}</div>
              </div>

              <v-textarea
                @input="input"
                v-if="field.type=='textarea'"
                :disabled="!!field.read_only"
                v-model="value"
                :label="field.description"
                :hint="field.add_description"
                :auto-grow="true"
                :clearable="true"
                :rounded="$theme.rounded"
              />
              <template v-if="field.values && field.values.length">
                варианты: 
                <span v-for="v in field.values" :key="v.v">
                  <a href="" @click.prevent="set_new_value(v.v)" >{{ v.d }}</a>&nbsp;
                </span>
              </template>
            </template>

            <div
              class="err" v-if="error_message" v-html="error_message"
            />
            <div
              class="err" v-if="warning_message" v-html="warning_message"
            />
            <div class="add_description" v-else-if="field.add_description">{{field.add_description}}</div>     
            
            <qr_call v-if="field.subtype=='qr_call'" :value="field.value" :field="field"/>

            
          </template>
      </div>
</template>

<script>
  let kladr_req=0, dadata_req=0;
  // вынести в библиотеку


  // end
  import { field_update,check_fld } from './field_functions'
  import { bus } from '../../main'
  //import QRCode from '../../js/qrcode.min.js'
  import qr_call from './text_subtypes/qr_call';
  
  export default {
  components:{ qr_call },
  created(){
    //Vue.component('qr_call', ()=> import('./components/fields/text_subtypes/qr_call.vue'));
    this._field_update=(new_data)=>{
      field_update(new_data,this)
    };

    if(!this.parent){
      
      bus.$on('field-update:'+this.field.name,this._field_update )
    }
    // 
    this.value=this.field.value;
    check_fld(this);

  },
  beforeDestroy(){
    if(!this.parent){
       bus.$off('field-update:'+this.field.name,this._field_update)
    }
  },
    
  data:function(){
    return {
      value:'',
      current_prefix:'',
      error_message:'',
      warning_message:'',
      go_save:0,
      show_popup_list:false,
      popup_list:[],
      show_color_picker:false
    }
  },
  props:['form','field','parent','refresh'],
  watch:{
    field(f){
      if(f.value!=this.value)
        this.value=f.value
    },
    refresh(){ 
      this.value=this.field.value;  
      this.error=this.field.error
      this.warning_message=this.field.warning_message
      this.error_message=this.field.error_message
    },
    value(){
      this.field.value=this.value
      this.field.from='field-text component (text.vue)'
      if(!this.parent){
        bus.$emit('change_field',this.field);
      }
      
    }
  },
  mounted(){
    this.value=this.field.value;
    //check_fld(this);
  },
  computed:{
    show_city_for_address(){
      if('prefix_list' in this.field){
        if(!this.value){
          this.current_prefix=this.field.prefix_list[0];
          this.select_prefix()
        }
        
        return true
      }
      return false;
    },

  },
  methods: {
        select_prefix(){
          if(this.current_prefix){
            this.value=this.current_prefix+', '
          }
        },
        set_new_value(v){
          this.value=v
          this.show_popup_list=false
        },
        input(){
          check_fld(this);
          
          let f=this.field;
          if(f.subtype=='kladr'){
            this.kladr_request()
          }
          else if(f.subtype=='dadata_address'){
            this.dadata_address_request()
          }

          
          if(this.parent){
            this.parent({
              from:'field-text component (text.vue), metod input',
              value:this.value,
              error:f.error,
              name:f.name,
              error_message:f.error_message
            },
            )
            if(f.error_message!=this.error_message){
              this.error_message=f.error_message
            }
          }      
          else{ // обработчик основной формы
            
            f.value=this.value;
            bus.$emit('change_field', f);
          }

        },
        dadata_address_request(){
          if(this.value.length<3)
            return
          dadata_req++;
          setTimeout(
            ()=>{
              dadata_req--;
              if(dadata_req>0)
                return 
              this.$http.post(
                BackendBase+'/extend/DADATA',
                {
                  action: 'onestring',
                  config: this.form.config,
                  name: this.field.name,
                  query:this.value
                }
              ).then(
                r=>{
                  let d=r.data
                  if(d.success){
                    this.popup_list=d.list
                    this.show_popup_list=(d.list.length>0)?true:false
                  }
                }
              )
            },
            800
          )

          
        },
        kladr_request(){
          if(this.value.length<3)
            return
          kladr_req++;
          setTimeout(
            ()=>{
                kladr_req--;
                if(kladr_req>0)
                  return 
                this.$http.post(
                  BackendBase+'/extend/KLADR',
                  {
                    action:'onestring',
                    config: this.form.config,
                    name: this.field.name,
                    query:this.value
                  }
                ).then(
                  r=>{
                    let d=r.data
                    if(d.success){
                      this.popup_list=d.list
                      
                      this.show_popup_list=(d.list.length>0)?true:false
                    }
                  }
                ).catch(
                  e=>{
                    console.error(e);
                  }
                )
            },
            500
          )

        }
    }
  }
</script>
<style scoped lang="scss">
  @import '@/styles/variables.scss';
  .v-input {font-size: 14px;}
  .popup_list {position: relative; border: 1px solid gray; border-radius: 5px;}
  
  .popup_list div.item {padding: 2px 5px; border-bottom: 1px dotted gray; font-size: 0.8rem;}
  .popup_list div.item:hover {background:$primary;}
  .popup_list .close {text-align: right;}
  .label {
    left: 0px; right: auto; font-size: 11px !important;
    margin-left: 30px;
    font-weight: bold;
    color: rgba(0,0,0, 0.6);
    position: relative;
    top: -12px;
    background: #fff;
    
    width: auto;
    display: inline-block;
  }
  .color_block {
    border: 1px solid black;
    border-radius: 5px;
    margin-top: 20px;
  }
  .picker_button{
    position: relative !important; top: -46px; left: 15px; z-index: 1; height: 30px;
    width:30px;
    display: inline-block;
  }
</style>
