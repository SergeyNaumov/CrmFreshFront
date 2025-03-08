<template>
        <div>
          <template v-if="!field.hide">
            
            <v-text-field 
              v-bind:label="field.description"
              v-model="value"
              :hint="field.add_description" :placeholder="field.placeholder"
              :readonly="!!field.read_only"
              @input="input"
              @keyup="input"
              clearable
              :style="field.style"
              :rounded="$theme.rounded"
              :error-messages="error_message"
              hide-details
            />
            
          </template>
      </div>
</template>

<script>
  import { field_update,check_fld } from './field_functions'
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
        this.value=v
    },
    refresh(){ 
      this.value=this.field.value;  
    }
  },
  created(){

    this._field_update=(new_data)=>{field_update(new_data,this)};

    if(!this.parent){
      this.$bus.$on('field-update:'+this.field.name,this._field_update )
    }

    this.value=this.field.value;
    let f=this.field;
    f.begin_value=this.value;
    if(!this.value){
      f.value='';
      this.value=''
    } 
    this.$bus.$emit('change_field', f);
    
       
  },
  beforeDestroy(){
    if(!this.parent){
       this.$bus.$off('field-update:'+this.field.name,this._field_update)
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
            this.$bus.$emit('change_field', f);
          }
          
        },
    }
  }
</script>
<style scoped>
  .v-input {font-size: 12px;}

</style>
}