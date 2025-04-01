<template>
  <div>
    <!-- Описание поля -->
    <div class="description">{{ field.description }}:</div>
    <!-- Если поле имеет диапазон дат -->
    <template v-if="field.range">
      <v-row no-gutters>
        <!-- Первая дата (начало периода) -->
        <v-col cols="12" md="6" class="pl-3">
          <v-menu
            v-model="menu[0]"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            readonly
            min-width="290px"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="show_dat_value0"
                label="C"
                prepend-icon="mdi-calendar"
                readonly
                clearable
                v-bind="props"
                @click:clear="dat_value0=null ; select_cal(0)"
                style="max-width: 250px;"
              ></v-text-field>
            </template>
            <v-date-picker
              first-day-of-week="1"
              locale="ru-RU"
              v-model="dat_value0"
              @input="select_cal(0)"
            ></v-date-picker>
          </v-menu>
        </v-col>

        <!-- Вторая дата (конец периода) -->
        <v-col cols="12" md="6" class="pl-3">
          <v-menu
            v-model="menu[1]"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            readonly
            min-width="290px"
          >
            <template #activator="{ props }">
              <v-text-field
                v-model="show_dat_value1"
                label="По"
                prepend-icon="mdi-calendar"
                readonly
                clearable
                v-bind="props"
                style="max-width: 250px;"
                @click:clear="dat_value1=null ; select_cal(1)"
              ></v-text-field>
            </template>
            <v-date-picker
              first-day-of-week="1"
              locale="ru-RU"
              v-model="dat_value1"
              @input="select_cal(1)"
            ></v-date-picker>
          </v-menu>
        </v-col>

        <!-- Сообщение об ошибке -->
        <v-col cols="12" class="err_select pl-3" v-if="err_select">
          Дата начала периода больше даты его окончания
        </v-col>
      </v-row>
    </template>

    <!-- Если поле не имеет диапазона дат -->
    <template v-else>
      <v-menu
        v-model="menu[0]"
        :close-on-content-click="false"
        :nudge-right="40"
        transition="scale-transition"
        offset-y
        readonly
        min-width="290px"
      >
        <template #activator="{ props }">
          <v-text-field
            v-model="show_dat_value0"
            :label="field.description"
            prepend-icon="mdi-calendar"
            readonly
            clearable
            v-bind="props"
            style="max-width: 250px;"
          ></v-text-field>
        </template>
        <v-date-picker
          first-day-of-week="1"
          locale="ru-RU"
          v-model="dat_value0"
          @input="select_cal(0)"
        ></v-date-picker>
      </v-menu>
    </template>
  </div>
</template>
<script>
import { formatDate, formatDateYMD } from '../../js/field_functions'
// const formatDate= date=>{
//   if (!date) return ''; // Если дата не определена, возвращаем пустую строку

//   const day = String(date.getDate()).padStart(2, '0'); // День (с ведущим нулём)
//   const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяц (с ведущим нулём, +1 потому что месяцы начинаются с 0)
//   const year = date.getFullYear(); // Год

//   return `${day}.${month}.${year}`; // Формат dd.mm.yyyy
// }
export default {
    props:["field",'filter_change'],
    mounted(){
        this.init_filter()
        

        
    },
    computed:{

        show_dat_value0(){
            if(this.dat_value0)
                return formatDate(this.dat_value0)
            return ''
        },
        show_dat_value1(){
            if(this.dat_value1)
              return formatDate(this.dat_value1)
            return ''
        },
        err_select(){
            let t=this

            if(t.dat_value0 && t.dat_value1){
                //if(t.dat_value0.split(/-/).join('')>t.dat_value1.split(/-/).join('')){
                if(t.dat_value0>t.dat_value1){
                    return true;
                }
            }
            return false;
        }
    },
    data(){
        return {
            dat_value0:null,
            dat_value1:null,
            menu: [false,false],
            modal: [false,false],
            need_empty:[false,false]
        }
    },
    watch:{
      dat_value0(){
        this.select_cal(0)
      },
      dat_value1(){
        this.select_cal(1)
      },
        field(){
            this.init_filter()
        },

    },
    methods:{
      init_filter(){
        let t=this, f=t.field
        if('value' in f){
            
            if(!f.value.length){
                t.dat_value0=null, this.dat_value1=null
            }
            if(typeof(f.value)=='string'){
              t.dat_value0=f.value?new Date(f.value):null  
              return 
            }
            if(typeof(f.value) == 'object'){ // this.range
                if(f.value.length>0){
                  t.dat_value0=f.value[0]?new Date(f.value[0]):null  
                  t.dat_value0=null
                    
                }
                if(f.value.length>1){
                    t.dat_value1=f.value[1]?new Date(f.value[1]):null  
                }                
            }
            else{
                t.dat_value0=f.value || null
            }
            //console.log(`this.dat_value0: ${this.dat_value0} this.dat_value1: ${this.dat_value0}`)

        }
      },
      select_cal(idx){
        //this.calc_values();
        let t=this, f=t.field
        t.menu[idx] = false;
        t.set_need_empty();
        if(f.range){
          if(idx==0){
            
            f.value_low=t.dat_value0?formatDateYMD(t.dat_value0):'';
            // t.show_dat_value0=formatDate(t.dat_value0)
          }
          else{
            f.value_hi=t.dat_value1?formatDateYMD(t.dat_value1):'';
            // f.show_dat_value1=t.dat_value1?formatDate(t.dat_value1):'';
          }
          f.value=[f.value_low,f.value_hi]; 

        }
        else{
          f.value=t.dat_value0?formatDateYMD(t.dat_value0):'';
        }
        
        
        console.log('select_cal:',f.value)
        t.filter_change(f)
        
      },
      clear(idx){
        this.field.value='';
        this.select_cal(idx);
      },
      set_need_empty:function(){
        this.need_empty=(!this.field.read_only && this.field.value)?true:false
      }
    }
}
</script>
<style scoped>
.description {
    padding: 20px 0 0 0px;
    color: gray;
    font-size: 14px;
    font-family: Roboto, sans-serif;
}
.err_select {text-align: center;padding-left: 20px; color: red; font-size: 0.8rem; font-weight: bold;}
.v-input__icon--clear {margin-right: 20px;}
.description {
    margin-top: 5px;
    color: rgba(0, 0, 0, 0.54);
    font-size: 12px;
    font-weight: 700; 
}
</style>