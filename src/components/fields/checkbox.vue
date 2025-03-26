<template>
    
    <div v-if="!field.hide">
        <!-- <pre v-if="field.name=='prez_order'">{{field}}</pre> -->
        <template v-if="field.type=='checkbox' || field.type=='1_to_1_checkbox'">
            <v-checkbox  :label="field.description" :disabled="disabled" color="primary" v-model="value" @change="change_field(field)" hide-details></v-checkbox>
            
        </template>
        <template v-else-if="field.type=='switch'">
            <v-switch  :label="field.description" color="primary" :disabled="disabled"  v-model="value" @change="change_field(field)" hide-details></v-switch>
        </template>
        
        <div v-if="after_html" v-html="after_html"></div>
    </div>
</template>

<script>
  // import { bus } from '../../main'
  import { getValueByField, setValueByField } from './field_functions'
  export default {
    //attributes:['after_html','before_html','description'], // чтобы не было реактивным
    data:function(){
        return {
            after_html:'',
            value:false
        }
    },
    props:['form','field','parent'],

    created(){   

        this.value=(this.field.value || parseInt(this.field.value))?true:false

        
    },
    beforeDestroy(){
        if(!this.parent){
           this.$bus.off('field-update:'+this.field.name,this._field_update)
        }
    },
    watch:{
        refresh(r){
            let nv=getValueByField(this)?true:false
            if(nv!=this.value){
                this.value=nv 
            }
        },
        field(){
            this.value=(this.field.value || parseInt(this.field.value))?true:false
            this.after_html=this.field.after_html
        },
        // value(nv){
        //     let t=this, ov=getValueByField(t)?true:false
        //     if(nv != ov){
        //         setValueByField(t, t.field, nv?1:0)
        //     }
        // }

    },
    computed:{
        source_field(){
            let t=this, f=t.field
            if(f.parent){
                return 'parent'
            }
            return t.$store.state.fields[f.name]
        },
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
            let t=this, ov=getValueByField(t)?true:false
            //console.log('change_field:',t.value)
            //if(t.value != ov){
            setValueByField(t, t.field, t.value?1:0)
            //}
            
            
        }
    }
  }
</script>
<style scoped>
  /* .v-input {font-size: 12px;} */
</style>
