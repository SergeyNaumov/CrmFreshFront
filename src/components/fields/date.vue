<template>
    <div v-if="!field.hide">
      <template v-if="field.read_only">
        <div style="margin-left: 14px;">
          <div class="description_container" v-html="field.description+':'"></div>
            {{ value_show }}
        </div>


        </template>
        
        <div style="position: relative;" v-else>
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            readonly
          > 
          
            <template v-slot:activator="{ props }">             
              <!-- "need_empty?'event':''" -->
              <v-text-field
                v-model="value_show"
                :label="field.description"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="props"
                
                :rounded="$theme.rounded"
                hide-details
                
              > 
              <!-- @click.prevent="handleClick($event)" -->
                               </v-text-field> <!---->
            </template>
            <v-date-picker
              first-day-of-week="1" 
              locale="ru-Ru"
              v-model="value" 
              color="primary"
              /> <!--@input="select_cal()"-->
            

          </v-menu> 
          
        </div>
        <div class="clear" v-show="need_empty"><small><a href="#" @click.prevent="clear()"> очистить</a></small></div>
        <div class="err" v-if="error_message" v-html="error_message"></div>
        <div class="err" v-if="warning_message" v-html="warning_message"></div>
        <div v-if="after_html" v-html="after_html"></div> 
    </div>
</template>
<script>
import { formatDate, formatDateYMD, getValueByField, setValueByField } from './field_functions'

export default {
    props:['form','field','parent'], // ,'calc_values'
    computed:{
      value_show(){
        let v=getValueByField(this,this.field) 
        if(v){
          v=v.replace(/\s\d{2}:.+$/,'').split('-').reverse().join('.')
        }
        return v?v:''
        if(!v){
          v=''
        }
        if(v && /\s\d{2}:\d{2}:\d{2}/.test(v)){
          v=formatDate(v)
          //v=v.replace(/\s\d{2}:\d{2}:\d{2}/,'')
          
        }
        console.log(this.field.name,' => ',v)
        if(v)
          return v.split('-').reverse().join('.')
        return ''
      }
    },
    watch:{
      value(nv){
        // сохраняем новое значение в store
        let t=this, ov=getValueByField(t,t.field)
        nv = nv?formatDateYMD(nv):''
        
        if(ov != nv){
          setValueByField(t,t.field, nv)
        }
        t.set_need_empty()
        t.menu=false

      },

    },
    created(){
      // .replace нужен для того, чтобы пофиксить время, которого быть не должно
      
      let value=this.field.value.replace(/[T\s][\d:]+$/,'')
      this.value=value?new Date(value):null

      
      if(!/[1-9]/.test(this.value) || !/^\d{4}-\d{2}-\d{2}/.test(this.value)){
        this.value=null
      }
      
      // убрал, потому что из-за него криво отправляло из change_in_search
      //check_fld(this);
    },
    
    mounted(){
      this.set_need_empty()
    },
    data:function(){
        return {
            value: null,
            date: '',
            show_calendar: false,
            menu: false,
            menuX: 0,
            menuY: 0,
            need_empty:false,
            after_html:'',
            error_message:'',
            warning_message:''
        }
    },
    methods:{
      handleClick() {
        this.menu = false;

      },
      clear(){
        this.value=null;

      },
      set_need_empty(){
        this.need_empty=(!this.field.read_only && this.value)?true:false
      }
    }
}
</script>
<style scoped>
  /* .select_cal {margin-top: 1rem;}
  .select_cal {transition: background 0.3s ease, color 0.2s linear;}
  .clear {position: relative; top: -15px;} */
  /*.v-input__control {width: 150px;}*/
  .v-menu__content {
  position: absolute !important;
  top: 100% !important;
  left: 0 !important;
  transform: none !important;
  z-index: 1000 !important;
}
</style>