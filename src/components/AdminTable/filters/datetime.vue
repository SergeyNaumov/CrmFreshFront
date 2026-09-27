<template>
    <div>
        <div class="description">{{field.description}}:</div>
        <template v-if="field.range">
            <v-row >
                <v-col class="pl-3" md="auto" cols="auto" >
                    <v-menu
                        v-model="menu[0]"
                        :close-on-content-click="false"
                        :nudge-right="40"
                        transition="scale-transition"
                        offset-y
                        readonly
                        
                        min-width="290px"
                    >
                    
                        <template v-slot:activator="{ props }">

                            <v-text-field
                                v-model="field.value_low"
                                label="С"
                                prepend-icon="event"
                                readonly
                                clearable
                                v-bind="props"
                                @click="show_time[0]=false"
                                style="width: 220px;"
                            />

                        
                        </template>
                        
                        <v-date-picker
                            v-if="!show_time[0]"
                            first-day-of-week="1" 
                            locale="ru-Ru"
                            :model-value="$toDate(dat_value0)" @update:model-value="dat_value0=$toIso($event); select_dat(0)"
                        />
                        <v-time-picker 
                            v-if="show_time[0]"
                            format="24hr"
                            v-model="time_value0" 
                            @update:model-value="select_cal(0)"
                        />
                        
                    </v-menu>
                </v-col>
                <v-col class="pl-3" md="auto" cols="auto" >
                    <v-menu
                        v-model="menu[1]"
                        :close-on-content-click="false"
                        :nudge-right="40"
                        transition="scale-transition"
                        offset-y
                        readonly
                        min-width="290px"
                    >
                    
                        <template v-slot:activator="{ props }">
                         <v-text-field
                            v-model="field.value_hi"
                            label="По"
                            prepend-icon="event"
                            readonly
                            clearable
                            v-bind="props"
                            style="width: 220px;"
                            @click="show_time[1]=false"
                        />
                        
                        
                        </template>
                        <v-date-picker
                            v-if="!show_time[1]"
                            first-day-of-week="1" 
                            locale="ru-Ru"
                            :model-value="$toDate(dat_value1)" @update:model-value="dat_value1=$toIso($event); select_dat(1)"
                        />
                        <v-time-picker 
                            v-if="show_time[1]"
                            format="24hr"
                            v-model="time_value1" 
                            @update:model-value="select_cal(1)"
                        />
                    </v-menu>
                </v-col>
                <v-col class="pl-3 err_select" md="12" cols="12" v-if="err_select">
                    дата начала периода больше даты его окончания
                </v-col>
            </v-row>
        </template>
        <template v-else>

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
.v-field__clearable {margin-right: 20px;}
.description {
    margin-top: 5px;
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-size: 12px;
    font-weight: 700;
}
.v-row {display: flex; flex-wrap: wrap; gap: 16px; margin: 0;}
.v-row > div {padding: 0 !important; margin: 0 !important;}
</style>