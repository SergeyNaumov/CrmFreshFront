<template>
    <div>
        <div class="description">{{field.description}}:</div>
        
        <template v-if="field.range">
            
            <v-layout row wrap>
                <v-flex pl-3 md6 xs12 >
                    <v-menu
                        v-model="menu[0]"
                        :close-on-content-click="false"
                        :nudge-right="40"
                        transition="scale-transition"
                        offset-y
                        readonly
                        min-width="290px"
                    >
                    
                        <template v-slot:activator="{ on }">
                         <v-text-field
                            v-model="dat_value0"
                            label="Начало периода"
                            prepend-icon="event"
                            readonly
                            clearable
                            v-on="on"
                            style="max-width: 250px;"
                        ></v-text-field>
                        
                        
                        </template>
                        <v-date-picker
                        first-day-of-week="1" 
                        locale="ru-Ru"
                        v-model="dat_value0" @input="select_cal(0)"></v-date-picker>
                        
                    </v-menu>
                </v-flex>
                <v-flex pl-3 md6 xs12 >
                    <v-menu
                        v-model="menu[1]"
                        :close-on-content-click="false"
                        :nudge-right="40"
                        transition="scale-transition"
                        offset-y
                        readonly
                        min-width="290px"
                    >
                    
                        <template v-slot:activator="{ on }">
                         <v-text-field
                            v-model="dat_value1"
                            label="Окончание периода"
                            prepend-icon="event"
                            readonly
                            clearable
                            v-on="on"
                            style="max-width: 250px;"
                        ></v-text-field>
                        
                        
                        </template>
                        <v-date-picker
                        first-day-of-week="1" 
                        locale="ru-Ru"
                        v-model="dat_value1" @input="select_cal(1)"></v-date-picker>
                    </v-menu>
                </v-flex>
                <v-flex pl-3 md12 xs12 class="err_select" v-if="err_select">
                    дата начала периода больше даты его окончания
                </v-flex>
            </v-layout>
        </template>
        <template v-else>

        </template>
    </div>
</template>
<script>
export default {
    props:["field",'filter_change'],
    created(){
        let f=this.field
        if('value' in f){
            if(f.value.length>0){
                this.dat_value0=f.value[0]
            }
            if(f.value.length>1){
                this.dat_value1=f.value[1]
            }
        }
        
    },
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
            //show_calendar: false,
            menu: [false,false],
            modal: [false,false],
            need_empty:[false,false]
        }
    },
    watch:{
        dat_value0(){
            let filter=this.field;
            filter.value_low=this.dat_value0;
            this.filter_change(filter)
        },
        dat_value1(){
            let filter=this.field;
            filter.value_hi=this.dat_value1;
            this.filter_change(filter)
        },
    },
    methods:{
      select_cal(idx){
        //this.calc_values();
        this.menu[idx] = false;
        this.set_need_empty();
        if(idx==0){
            this.field.value_low=this.dat_value0;
        }
        else{
            this.field.value_hi=this.dat_value1;
        }
        let values=[]; 
        
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