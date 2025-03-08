<template>
  <div>
    <!-- Описание поля -->
    <div class="description">{{ field.description }}:</div>

    <!-- Если поле имеет диапазон дат -->
    <template v-if="field.range">
      <v-row no-gutters>
        <!-- Первая дата/время (начало периода) -->
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
                v-model="field.value_low"
                label="С"
                prepend-icon="mdi-calendar"
                readonly
                clearable
                v-bind="props"
                @click="show_time[0] = false"
                style="max-width: 250px;"
              />
            </template>

            <!-- Выбор даты -->
            <v-date-picker
              v-if="!show_time[0]"
              first-day-of-week="1"
              locale="ru-RU"
              v-model="dat_value0"
              @input="select_dat(0)"
            />

            <!-- Выбор времени -->
            <v-time-picker
              v-if="show_time[0]"
              format="24hr"
              v-model="time_value0"
              @input="select_cal(0)"
            />
          </v-menu>
        </v-col>

        <!-- Вторая дата/время (конец периода) -->
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
                v-model="field.value_hi"
                label="По"
                prepend-icon="mdi-calendar"
                readonly
                clearable
                v-bind="props"
                @click="show_time[1] = false"
                style="max-width: 250px;"
              />
            </template>

            <!-- Выбор даты -->
            <v-date-picker
              v-if="!show_time[1]"
              first-day-of-week="1"
              locale="ru-RU"
              v-model="dat_value1"
              @input="select_dat(1)"
            />

            <!-- Выбор времени -->
            <v-time-picker
              v-if="show_time[1]"
              format="24hr"
              v-model="time_value1"
              @input="select_cal(1)"
            />
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
      <!-- Здесь можно добавить логику для одиночного выбора даты/времени -->
    </template>
  </div>
</template>
<script>
export default {
    props:["field",'filter_change'],
    computed:{

        err_select(){
            if(this.dat_value0 && this.dat_value1){

                if(this.dat_value0.split(/-/).join('')>this.dat_value1.split(/-/).join('')){
                    return true;
                }
            }
            return false;
        }
    },
    data(){
        return {
            dat_value0:'',
            dat_value1:'',
            time_value0:'',
            time_value1:'',
            //show_calendar: false,
            menu: [false,false],
            show_time: [false,false],
            modal: [false,false],
            need_empty:[false,false]
        }
    },
    watch:{
        //dat_value0(){
            //let filter=this.field;
            //filter.value_low=this.dat_value0;
            //this.filter_change(filter)
          //  this.time_value0=''

        //},
        //dat_value1(){
            //let filter=this.field;
            //filter.value_hi=this.dat_value1;
            //this.filter_change(filter)
            //this.time_value1=''
        //},
    },
    methods:{
      select_cal(idx){
        let filter=this.field;
        
        this.menu[idx] = false;
        this.set_need_empty();
        if(idx==0){
            this.field.value_low=this.dat_value0+' '+this.time_value0+':00'
            filter.value_low=this.field.value_low
        }
        else{
            this.field.value_hi=this.dat_value1+' '+this.time_value1+':59'
            filter.value_hi=this.field.value_hi
        }
        filter.value=[filter.value_low, filter.value_hi]
        this.filter_change(filter)
        let values=[]; 
        
      },
      select_dat(idx){
        this.show_time[idx]=true
        if(idx==0){
            this.time_value0=''
        }
        else{
            this.time_value1=''
        }
        
      },
      select_time(idx){
        this.show_time[idx]=false;

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
.err_select {text-align: center;padding-left: 20px; color: red; font-size: 0.8rem; font-weight: bold;}
.v-input__icon--clear {margin-right: 20px;}
.description {
    margin-top: 5px;
    color: rgba(0, 0, 0, 0.54);
    font-size: 12px;
    font-weight: 700;
    
}
</style>