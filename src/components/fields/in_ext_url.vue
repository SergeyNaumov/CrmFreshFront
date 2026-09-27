<template>
        <div>
          <template v-if="!field.hide">
            <div v-if="field.before_html" v-html="field.before_html"></div>
            <v-text-field 
              v-bind:label="field.description"
              v-model="value"
              :placeholder="field.placeholder"
              :readonly="!!field.read_only"
              @input="input"
              @keyup="input"
              clearable
              :style="field.style"
              :rounded="$theme.rounded"
              :error-messages="error_message || field.error_message"
              hide-details
            />
            <div v-if="field.add_description" class="add_description">{{field.add_description}}</div>
            <div class="err" v-if="error_message || field.error_message" v-html="error_message || field.error_message"/>
            <div class="warn" v-if="field.warning_message" v-html="field.warning_message"/>
            <div v-if="field.after_html" v-html="field.after_html"></div>
          </template>
      </div>
</template>

<script>
  import { field_update,check_fld } from './field_functions'
  import { bus } from '../../main'
  export default {
  // created(){
  //   let f=this.field;
  //   this.value=f.value;
  //   this.begin_valie=f.value;

    
  // },

  data:function(){
    return {
      value:'',
      regexp_rules:[],
      error_message:'',
      go_save:0
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
    }
  },
  created(){

    this._field_update=(new_data)=>{field_update(new_data,this)};

    if(!this.parent){
      bus.$on('field-update:'+this.field.name,this._field_update )
    }

    this.value=this.field.value;
    let f=this.field;
    f.begin_value=this.value;
    if(!this.value){
      f.value='';
      this.value=''
    } 
    this.emitChange(f);
    
       
  },
  beforeUnmount(){
    if(!this.parent){
       bus.$off('field-update:'+this.field.name,this._field_update)
    }
  },
  computed:{


  },
  methods: {

        input(){
          //this.frontend_process();          
          let f=this.field;
          f.error=this.error_message?true:false;
          if(this.parent){
            this.parent({value:this.value,error:f.error,name:f.name})
          }      
          else{ // обработчик основной формы
            f.value=this.value;
            this.emitChange(f);
          }
          
        },
    }
  }
</script>
<style scoped>
  .v-input {font-size: 12px;}

</style>
}