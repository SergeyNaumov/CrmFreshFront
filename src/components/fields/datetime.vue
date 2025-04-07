<template>
    <div>
        <div class="read_only" v-if="field.read_only">
          <div style="margin-left: 14px;">
          <div class="description_container" v-html="field.description+':'"></div>
            {{ value_show }}
          </div>
        </div>
        <template v-else>
            <div v-if="field.description" class="description_container"  v-html="field.description+':'"></div>
            <v-row style="max-width: 450px; ">
              <v-col sm="12" :md="br?12:6">
                        <v-menu
                            v-model="menu_date"
                            :close-on-content-click="false"
                            :nudge-right="40"
                            transition="scale-transition"
                            offset-y
                            
                            
                            
                        >
                        
                            <template v-slot:activator="{ props }">
                              <v-text-field
                                  v-model="date_show"
                                  style="width: 180px; "
                                  label="Дата: ДД.ММ.ГГГГ"
                                  prepend-icon="mdi-calendar"
                                  v-bind="props"
                                  :rounded="$theme.rounded"
                                  hide-details
                                  
                              />
                              
                            </template>
                            
                            <v-date-picker :first-day-of-week="1"  locale="ru-Ru" v-model="date" /> <!-- @input="set_value(); menu_date=false" -->
                            
                        </v-menu>
              </v-col>
              <v-col sm="12" md="6">
                  <v-text-field
                          v-model="time"
                          label="Время: ЧЧ:MM"
                          prepend-icon="mdi-clock-outline"
                          @change="fix_time"
                          @keyup="fix_time"
                          style="width: 180px;"
                          
                  />
              </v-col>
            </v-row>
            <div class="clear">
                <template>
                  <small v-show="need_empty"><a href="#" @click.prevent="clear()"> очистить</a></small>&nbsp;
                </template>
                <small><a href="" @click.prevent="set_now()">текущая дата и время</a></small>
            </div>
        </template>
    </div>
</template>
<script>
//import { bus } from '../../main'
//import { field_update } from './field_functions'
//import { of } from 'core-js/core/array'
import { formatDateYMD, getValueByField, setValueByField } from '../js/field_functions'
export default {
    props:['form','field', 'save_field_to_store','save_to_store', 'get_value_by_field','get_source_field','br'], // ,'calc_values'
    created(){
      let t=this, v=getValueByField(this) || ''
      if(v){
        let [date, time]=v.split(' ')
        if(date){
          t.date=new Date(date)
        }
        if(time){
          t.time=time
          t.fix_time()
        }
      }
    },
    data:function(){
        return {
            old_value:'',
            value:'',
            date: null,
            time: '',
            show_calendar: false,
            menu_date: false,
            menu_time: false,
            modal: false,
            need_empty:false
        }
    },
    computed:{
      date_show(){
          let v=getValueByField(this, this.field)
          if(v){
            let [date,time]=v.split(' ')
            return date.split('-').reverse().join('.')
          }
      },

      value_show(){
        let v = this.$store.state.values[this.field.name]
        
        if(v){
          let [date,time]=v.split(' ')
          date=date.split('-').reverse().join('.')
          if(time){
            this.time=time
          }
          return `${date} ${time}`
        }
        else{
          return '-'
        }
      }
    },
    watch:{
      value(nv){
        let t=this, ov=getValueByField(t,t.field)
        nv = t.date?formatDateYMD(nv):''
        
        if(ov != nv){
          setValueByField(t,t.field, nv)
        }
      },
      date(v){
        this.menu_date=false
        if(v){
          this.set_value()
        }
      },
      // time(){

      // }

    },
    methods:{
      fix_time(){ // исправлено время 
        // if(!/[1-9]/.test(this.date)){
        //   this.date=null, this.time=''
        // }
        let time=this.time
        // '22:5332222'.replace(/[^\d]/g,'').replace(/^(\d{1,4}).*$/,'$1').replace(/^(\d{2})(.*)$/,'$1:$2')
        time=time.replace(/[^\d]/g,'').replace(/^(\d{1,4}).*$/,'$1').replace(/^(\d{2})(.*)$/,'$1:$2')
        time=time.replace(/^[3-9]/,'2').replace(/^2[4-9]/,'23').replace(/:[6-9]/,':5')
        
        this.time=time
        this.set_value()
      },
      set_value(){
        this.set_need_empty();
        let t=this
        //console.log('set value')
        let fd=formatDateYMD(t.date)
        let time=t.time
        time=time.replace(/^(\d{2}:\d{2})$/,'$1:00')

        if(t.date && fd){
          let new_value=time?`${fd} ${time}`:`${fd} 00:00:00`
          console.log('new_value:',new_value)
          if(new_value !=t.old_value){
            setValueByField(t,t.field,new_value)
          }
          
        }
        
      },
      select_cal_date(){
        this.menu_date = false;
        this.set_value();
        this.set_need_empty();
      },
      select_cal_time(){
        this.set_value();
        this.set_need_empty();
        
      },
      clear(){
        this.date=''; this.time=''; this.set_value();
        this.need_empty=false

      },
      set_need_empty:function(){
        
        if(this.field.not_clear)
          return false;
        this.need_empty=(this.date && this.time)?true:false
      },
      set_now(){
        let d=new Date();
        let values = [ d.getDate(), d.getMonth() + 1, d.getHours(), d.getMinutes(), d.getSeconds() ];
        for( let id in values ) {
          values[ id ] = values[ id ].toString().replace( /^([0-9])$/, '0$1' );
        }
        this.date=d;
        this.time=values[2]+':'+values[3]+':'+values[4]
        if(!this.field.not_clear)
          this.need_empty=true
      }
    }
}
</script>
<style scoped>
  .select_cal {margin-top: 1rem;}
  .select_cal {transition: background 0.3s ease, color 0.2s linear;}
  /* .clear {position: relative; top: 0rem;} */
  .v-date-picker-title__date {font-size: 16px;}
  .read_only {margin-top: 10px;}

</style>