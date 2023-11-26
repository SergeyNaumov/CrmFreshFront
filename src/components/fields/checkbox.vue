<template>
    <div v-if="!field.hide">
        <template v-if="field.type=='checkbox'">
            <v-checkbox  :label="field.description" :disabled="disabled" color="primary" v-model="value" @change="change_field(field)" hide-details></v-checkbox>
            
        </template>
        <template v-else-if="field.type=='switch'">
            <v-switch  :label="field.description" color="primary" :disabled="disabled"  v-model="value" @change="change_field(field)" hide-details></v-switch>
        </template>
        
        <div v-if="after_html" v-html="after_html"></div>
    </div>
</template>

<script>
  import { bus } from '../../main'
  import { field_update,check_fld } from './field_functions'
  export default {
    data:function(){
        return {
            after_html:'',
            value:false
        }
    },
    props:['form','field','parent','refresh'],

    created(){   

        this._field_update=(new_data)=>{
          field_update(new_data,this)
        }
        if(!this.parent){
          bus.$on('field-update:'+this.field.name,this._field_update )
        }
        this.value=(this.field.value || parseInt(this.field.value))?true:false
        check_fld(this);
        
    },
    beforeDestroy(){
        if(!this.parent){
           bus.$off('field-update:'+this.field.name,this._field_update)
        }
    },
    watch:{
        refresh(){
            this.value=(this.field.value || parseInt(this.field.value))?true:false
            this.after_html=this.field.after_html
        },
        field(){
            this.value=(this.field.value || parseInt(this.field.value))?true:false
            this.after_html=this.field.after_html
        },
        // value(v){
        //       v=(v || parseInt(v))?true:false
        //       this.field.value=v
        //       this.field.from='field-checkbox component (checkbox.vue)'
        //       if(!this.parent){
        //         bus.$emit('change_field',this.field);
        //       }
        // }

    },
    computed:{
        disabled(){
            let form=this.form, field=this.field
            /*if(!form){
                form={}
            }*/
            
            return (field.read_only || form.read_only)?true:false
        }

    },
    methods: {
        change_field(f){
            f.value=this.value;
            this.after_html=this.field.after_html
            if(this.parent){
                this.parent({value:f.value,error:f.error,name:this.field.name})
            }      
            else{ // обработчик основной формы
                bus.$emit('change_field', f);
            }
            
        }
    }
  }
</script>
<style scoped>
  .v-input {font-size: 12px;}
</style>
