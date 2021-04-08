<template>
    <div>
        <template v-if="field.type=='checkbox'">
            <v-checkbox  :label="field.description" :disabled="disabled" color="primary" v-model="value" @change="change_field(field)" hide-details></v-checkbox>
        </template>
        <template v-else-if="field.type=='switch'">
            <v-switch  :label="field.description" color="primary" :disabled="disabled"  v-model="value" @change="change_field(field)" hide-details></v-switch>
        </template>

    </div>
</template>

<script>
  import { bus } from '../../main'
  export default {
    data:function(){
        return {
            value:false
        }
    },
    props:['form','field','parent','refresh'],
    watch:{
        refresh(){ 
            this.value=parseInt(this.field.value)?true:false
        },
        field(){
            this.value=parseInt(this.field.value)?true:false
        }
    },
    created(){   
        this.value=parseInt(this.field.value)?true:false;
        
    },
    mounted(){

        
    },
    computed:{
        disabled(){
            return (this.field.read_only || this.form.read_only)?true:false
        }

    },
    methods: {
        change_field(f){
            f.value=this.value;
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
