<template>
    <div>
        <div class="read_only" v-if="field.read_only">
            
            <v-text-field 
              :label="field.description"
              disabled
              v-model="value"
              :rounded="$theme.rounded"
              hide-details
            />
            
        </div>
        <template v-else>
            <div>
                        <v-menu
                            v-model="menu_date"
                            :close-on-content-click="false"
                            :nudge-right="40"
                            transition="scale-transition"
                            offset-y
                            
                            readonly
                            max-width="290px"
                        >
                        
                            <template v-slot:activator="{ on }">
                            <v-text-field
                                v-model="date"
                                label="Дата: ГГГГ-ММ-ДД"
                                prepend-icon="event"
                                readonly
                                v-on="on"
                                class="inline"
                                style="max-width: 150px;"
                            />
                            </template>
                            <v-date-picker :first-day-of-week="1"  locale="ru-Ru" v-model="date" @input="set_value(); menu_date=false"/>
                            
                        </v-menu>
                        
                        
                
    
                        <v-menu
                            v-model="menu_time"
                            :close-on-content-click="false"
                            :nudge-right="40"
                            transition="scale-transition"
                            offset-y

                            readonly
                            min-width="290px"
                        >
                        
                            <template v-slot:activator="{ on }">
                            <v-text-field
                                v-model="time"
                                label="Время: ЧЧ:MM"
                                prepend-icon="event"
                                readonly
                                v-on="on"
                                style="max-width: 150px"
                            ></v-text-field>
                            
                            
                            </template>
                            <v-time-picker format="24hr"
                            v-model="time" @input="select_cal_time()"></v-time-picker>
                            
                        </v-menu>

                        
            </div>
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
import { bus } from '../../main'
import { field_update } from './field_functions'

export default {
    props:['form','field','refresh','parent'], // ,'calc_values'
    created(){
      this._field_update=(new_data)=>{field_update(new_data,this)};

      if(!this.parent){
        bus.$on('field-update:'+this.field.name,this._field_update )
      }

      if(this.field.value){
        if(this.field.read_only){
          if(this.field.value)
            this.value=this.field.value
          else
            this.value='не указано'
        }
        else{
          let arr=this.field.value.split(' ');
          if(arr.length==2){
            this.date=arr[0];
            this.time=arr[1];
            this.value=this.field.value;
          }
        }

      }
      else{
        this.date='', this.time='', this.value='';
      }

      this.set_need_empty()
    },
    beforeDestroy(){
      if(!this.parent){
        bus.$off('field-update:'+this.field.name,this._field_update)
      }
    },
    data:function(){
        return {
            value:'',
            date: '',
            time: '',
            show_calendar: false,
            menu_date: false,
            menu_time: false,
            modal: false,
            need_empty:false
        }
    },
    watch:{

    },
    methods:{
      set_value(){
        this.set_need_empty();
        this.value=this.date+' '+this.time;
        let field=this.field;
        field.value=this.value
        
        bus.$emit('change_field', field)
      },
      select_cal_date(){
        this.menu_date = false;
        this.set_value();
      },
      select_cal_time(){
        this.set_value();
        
      },
      clear(){
        this.date=''; this.time=''; this.set_value();
      },
      set_need_empty:function(){
        if(this.field.not_clear)
          return false;
        this.need_empty=this.field.value?true:false
      },
      set_now(){
        let d=new Date();
        let values = [ d.getDate(), d.getMonth() + 1, d.getHours(), d.getMinutes(), d.getSeconds() ];
        for( let id in values ) {
          values[ id ] = values[ id ].toString().replace( /^([0-9])$/, '0$1' );
        }
        this.date=d.getFullYear()+'-'+values[ 1 ]+'-'+values[ 0 ];
        this.time=values[2]+':'+values[3]+':'+values[4]
        
      }
    }
}
</script>
<style scoped>
  .select_cal {margin-top: 1rem;}
  .select_cal {transition: background 0.3s ease, color 0.2s linear;}
  .clear {position: relative; top: -1.5rem;}
  .v-date-picker-title__date {font-size: 16px;}
  .read_only {margin-top: 10px;}
  .v-input {display: inline-flex;}
  /*.inline {display: inline-block;}
  .inline div {display: block;}*/
</style>