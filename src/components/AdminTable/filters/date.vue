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
                        <!-- v-model="dat_value0" -->
                        <template v-slot:activator="{ on }">
                         <v-text-field
                            
                            v-model="show_dat_value0"
                            label="C"
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
                        <!--  v-model="dat_value1" -->
                        <template v-slot:activator="{ on }">
                         <v-text-field
                            v-model="show_dat_value1"
                            label="По"
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

                    <v-menu
                        v-model="menu[0]"
                        :close-on-content-click="false"
                        :nudge-right="40"
                        transition="scale-transition"
                        offset-y
                        readonly
                        min-width="290px"
                    >
                        <!-- v-model="dat_value0" -->
                        <template v-slot:activator="{ on }">
                         <v-text-field
                            
                            v-model="show_dat_value0"
                            :label="field.description"
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
                        v-model="dat_value0" @input="select_cal(0)" />
                    </v-menu>
        </template>
    </div>
</template>
<script>
export default {
    props:["field",'filter_change'],
    mounted(){
        this.init_filter()
        

        
    },
    computed:{
        // show_dat_value0(){
        //     if(this.dat_value0)
        //         return this.dat_value0.split('-').reverse().join('.')
        //     return ''
        // },
        // show_dat_value1(){
        //     if(this.dat_value1)
        //         return this.dat_value1.split('-').reverse().join('.')
        //     return ''
        // },
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
            show_dat_value0:'',
            show_dat_value1:'',
            //show_calendar: false,
            menu: [false,false],
            modal: [false,false],
            need_empty:[false,false]
        }
    },
    watch:{
        field(){
            this.init_filter()
        },
        show_dat_value0(){
            
            if(!this.show_dat_value0)
                this.dat_value0=''
        },
        show_dat_value1(){
            
            if(!this.show_dat_value1)
                this.dat_value1=''
        },
        dat_value0(){
            let filter=this.field;
            filter.value_low=this.dat_value0;
            //filter.value=[filter.value_low,filter.value_hi]
            if(filter.range){
                filter.value=[filter.value_low,filter.value_hi]
            }
            else{
                filter.value=filter.value_low
            }
            this.filter_change(filter)
            //console.log('v0:',this.dat_value0)
            this.show_dat_value0=this.dat_value0.split('-').reverse().join('.')
        },
        dat_value1(){
            let filter=this.field;
            filter.value_hi=this.dat_value1;
            if(filter.range){
                filter.value=[filter.value_low,filter.value_hi]
            }
            else{
                filter.value=filter.value_low
            }
            
            this.filter_change(filter)
            this.show_dat_value1=this.dat_value1.split('-').reverse().join('.')
        },
    },
    methods:{
      init_filter(){
        let f=this.field
        if('value' in f){
            if(f.name=='born'){
                console.log(f.name, 'v:',f.value, 'typeof:',typeof(f.value))    
            }
            
            if(!f.value.length){
                this.dat_value0='', this.dat_value1=''
            }
            if(typeof(f.value) == 'object'){ // this.range
                if(f.value.length>0){
                    this.dat_value0=f.value[0]
                }
                if(f.value.length>1){
                    this.dat_value1=f.value[1]
                }                
            }
            else{
                this.dat_value0=f.value
            }
            console.log(`this.dat_value0: ${this.dat_value0} this.dat_value1: ${this.dat_value0}`)

        }
      },
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