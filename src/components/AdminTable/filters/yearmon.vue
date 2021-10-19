<template>
    <div>
        <div class="description">{{field.description}}:</div>

        <template v-if="field.range">
            <div class="description">От:</div>
            <v-flex xs6>
                <v-row>
                    
                    <v-col>
                        <v-select label="Месяц" :items="mon_items" item-value="v" item-text="d" v-model="mon_from" @change="set_value"/>
                    </v-col>
                    <v-col>
                        
                        <v-select label="Год" :items="year_items" v-model="year_from" class="year" @change="set_value"/>
                    </v-col>
                    <v-col class="reset_link" >
                        <small v-if="year_from || mon_from"><a href="" @click.prevent="reset(0)">сбросить</a></small>
                    </v-col>
                </v-row>
            </v-flex>
            <div class="description">До:</div>
            <v-flex xs6>
                <v-row>
                    <v-col md-2>

                        <v-select label="Месяц" :items="mon_items" item-value="v" item-text="d" v-model="mon_to" @change="set_value"/>
                    </v-col>
                    <v-col md-2>
                        <v-select label="Год" :items="year_items" v-model="year_to" class="year" @change="set_value"/>
                    </v-col>
                    <v-col class="reset_link"  md-1>
                        <small v-if="year_to || mon_to"><a href="" @click.prevent="reset(1)">сбросить</a></small>
                    </v-col>
                </v-row>
            </v-flex>
              
        </template>
        <template v-else>
            
            
            <v-container>
                <v-row>
                    <v-col>
                        
                        <v-select label="Месяц" :items="mon_items" item-value="v" item-text="d" v-model="mon"/>
                    </v-col>
                    <v-col>
                        <v-select label="Год" :items="year_items" v-model="year" class="year"/>
                    </v-col>
                </v-row>

            </v-container>  
            <div v-if="year || mon"><small><a href="" @click.prevent="reset">сбросить</a></small></div>
        </template>
    </div>
</template>
<script>
export default {
    props:["field","filter_change"],
    data(){
        return {
            
            year_values:[],
            mon_items:[
                {v:'01',d:'Январь'},
                {v:'02',d:'Февраль'},
                {v:'03',d:'Март'},
                {v:'04',d:'Апрель'},
                {v:'05',d:'Май'},
                {v:'06',d:'Июнь'},
                {v:'07',d:'Июль'},
                {v:'08',d:'Август'},
                {v:'09',d:'Сертябрь'},
                {v:'10',d:'Октябрь'},
                {v:'11',d:'Ноябрь'},
                {v:'12',d:'Декабрь'},
            ],
            
            value:'',
            year_items:[],
            year:'',
            mon:'',
            
            // filter_type: range
            value2:['',''], 
            year_from:'',
            year_to:'',
            mon_from:'',
            mon_to:''

        }
    },
    created(){

        let field=this.field

        let cur_year=new Date().getFullYear()

        let max_year
        if(field.max_year && field.max_year>cur_year){
            max_year=max_year
        }
        else{
            max_year=cur_year+3
        }

        while(cur_year <= max_year ){
            this.year_items.push(cur_year)
            cur_year++
        }
    },
    watch:{
        year(){
            this.set_value()
        },
        mon(){
            this.set_value()
        },


    },
    methods:{
        set_value(){
            let field=this.field;
            if(field.filter_type=='range'){
                if(this.year_from && this.mon_from){
                    this.value2[0]=this.year_from+'-'+this.mon_from
                }
                else{
                    this.value2[0]=''
                }
                if(this.year_to && this.mon_to){
                    this.value2[1]=this.year_to+'-'+this.mon_to
                    
                }
                else{
                    this.value2[1]=''
                }
                field.value_low=this.value2[0]
                field.value_hi=this.value2[1]
                this.filter_change(field);
            }
            else{
                if(this.year && this.mon){
                    this.value=this.year+'-'+this.mon
                    
                    field.value=this.value;
                    this.filter_change(field);
                } 
            }

        },
        reset(p){
            if(this.field.filter_type=='range'){
                if(p==0){
                    this.year_from=''
                    this.mon_from=''
                }
                if(p==1){
                    this.year_to=''
                    this.mon_to=''
                }
                this.set_value()
            }
            else{
                this.year=''
                this.mon=''
            }
        }
    }

}
</script>
<style scoped>
.description {
    margin-top: 5px;
    color: rgba(0, 0, 0, 0.54);
    font-size: 12px;
    font-weight: 700; 
}
.year {}

</style>