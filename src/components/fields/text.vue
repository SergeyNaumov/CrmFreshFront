<template>
        <div>
          <div v-if="source_field.before_html" v-html="source_field.before_html"></div>
          <template v-if="!source_field.hide">
            <template v-if="source_field.subtype=='color'">
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
                  :items="source_field.prefix_list"
                  :label="source_field.prefix_list_header"
                  @input="select_prefix"
                  hide-details
                  :rounded="$theme.rounded"
                />
              </template>
              <template v-if="!(source_field.subtype && source_field.show_only_subtype)">
                  <v-text-field
                    v-if="field.type=='text' && !source_field.hide_field"
                    :label="source_field.description"
                    v-model="value"
                    :hint="source_field.add_description" :placeholder="source_field.placeholder"
                    :disabled="!!source_field.read_only"
                    @input="input"
                    @keyup="input"
                    :clearable="!source_field.read_only"
                    :style="field.style"
                    :error-messages="source_field.error_message"
                    :rounded="$theme.rounded"
                    hide-details
                    :id="field.name"
                    v-on:input="$emit('input', $event)"
                    :prepend-icon="field.icon"
                  />
                  <div class="popup_list" v-if="show_popup_list">
                    <div class="close"><a href="" @click.prevent="show_popup_list=false">закрыть</a></div>
                    <div class="item" v-for="(p,idx) in popup_list" :key="'popup'+idx" @click="set_new_value(p.header)">{{p.header}}</div>
                  </div>
                  
                  <v-textarea
                    @input="input"
                    @keyup="input"
                    v-if="field.type=='textarea'"
                    :disabled="!!field.read_only"
                    v-model="value"
                    :label="field.description"
                    :hint="field.add_description"
                    :auto-grow="true"
                    :clearable="true"
                    :rounded="$theme.rounded"
                    v-on:input="$emit('input', $event)"
                    :prepend-icon="field.icon"
                  />
                  <template v-if="source_field.values && source_field.values.length">
                    варианты: ({{ source_field.name }})
                    <span v-for="v in source_field.values" :key="v.v">
                      <a href="" @click.prevent="set_new_value(v.v)" >{{ v.d }}</a>&nbsp;
                    </span>
                  </template>

                </template>
                <div class="add_description" v-if="source_field.add_description">{{source_field.add_description}}</div>
                <div
                  class="err" v-if="source_field.error_message" v-html="source_field.error_message"
                />
                <div
                  class="warning" v-if="source_field.warning_message" v-html="source_field.warning_message"
                />
            </template>
            <qr_call v-if="field.subtype=='qr_call'" :value="value" :field="source_field"/>

            <div v-if="source_field.after_html" v-html="source_field.after_html"></div>
          </template>
      </div>
</template>

<script>
  let kladr_req=0, dadata_req=0;
  // вынести в библиотеку


  // end
  import { getValueByField, setValueByField } from '../js/field_functions'
  //import QRCode from '../../js/qrcode.min.js'
  import qr_call from './text_subtypes/qr_call.vue';
  
  export default {
  components:{ qr_call },
  created(){
    let t=this
    t.value=getValueByField(t)
  },   
  data:function(){
    return {
      value:'',
      current_prefix:'',      
      go_save:0,
      show_popup_list:false,
      popup_list:[],
      show_color_picker:false
    }
  },
  props:['form','field',
    'save_to_store',
    'save_field_to_store',
    'get_source_field','get_value_by_field'
  ],
  
  watch:{
    refresh(r){
      let nv=getValueByField(this)
      if(nv!=this.value){
        this.value=nv 
      }
    },
    source_field(f){
      if(f.value!=this.value){
        this.value=f.value
      }
      
    },
    value(nv){
      let t=this, ov=getValueByField(t)
      if(nv != ov){
        setValueByField(t, t.field, nv)
      }
    }
  },
  mounted(){
    this.value=this.field.value;
    //check_fld(this);
  },
  computed:{
    refresh(){
      return this.$store.state.refresh
    },
    source_field(){
      let t=this, f=t.field
      if(typeof t.get_source_field=='function'){  
        return t.get_source_field(f.name)
      }
      return t.$store.state.fields[f.name]
    },
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
          //check_fld(this);
          

          let t=this, f=t.field
          
          
          
          if(f.subtype=='kladr'){
            this.kladr_request()
          }
          else if(f.subtype=='dadata_address'){
            this.dadata_address_request()
          }

          //setValueByField(t, t.field, t.value)
          

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
  @use '@/styles/variables';
  .v-input {font-size: 14px;}
  .popup_list {position: relative; border: 1px solid gray; border-radius: 5px;}
  
  .popup_list div.item {padding: 2px 5px; border-bottom: 1px dotted gray; font-size: 0.8rem;}
  .popup_list div.item:hover {background: $primary;}
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
