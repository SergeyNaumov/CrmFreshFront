<template>
    <div>
        <div class="description">{{ field.description }}:</div>
        <template v-if="field.range">
            <v-row>
                <v-col>
                    <v-text-field
                        label="С" 
                        prepend-icon="mdi-clock"
                        v-model="value0"
                        placeholder="Время в формате ЧЧ:MM"
                        :error="err0"
                        
                        @keyup="fixTime(0)"
                    />
                </v-col>
                <v-col>
                    
                    <v-text-field
                        label="По"
                        prepend-icon="mdi-clock"
                        v-model="value1"
                        placeholder="Время в формате ЧЧ:MM"
                        :error="err1"
                        @keyup="fixTime(1)"
                    />
                </v-col>
            </v-row>
        </template>
        <template v-else>

        </template>
    </div>
</template>
<script>
const getTime=v=>{
    if(/^\d{2}:\d{2}$/.test(v)){
        return v+':00'
    }
    else{
        return ''
    }

}
export default {
    props:["field",'filter_change'],
    data(){
        return {
            value0:'',
            value1:''
        }
    },
    computed:{
        err0(){
            if(this.value0){
                return !/^([01][0-9]|2[0-4]):[0-5][0-9]$/.test(this.value0)
            }
            return false
        },
        err1(){
            if(this.value1){
                return !/^([01][0-9]|2[0-4]):[0-5][0-9]$/.test(this.value1)
            }
            return false
        },
    },
    methods:{
        fixTime(i){
            let t=this, f=t.field
            let v=(i==0?t.value0:t.value1) || ''
            v=v.replace(/^(\d:)/,'0$1')
            v=v.replace(/[^\d]/g,'').replace(/^(\d{1,4}).*$/,'$1').replace(/^(\d{2})(.*)$/,'$1:$2')
            v=v.replace(/^[3-9]/,'2').replace(/^2[4-9]/,'23').replace(/:[6-9]/,':5').replace(/(\d{2})\d+/,'$1')
            
            if(i==0){
                t.value0=v
            }
            else{
                t.value1=v
            }
            t.selectTime()
            
      
        },
        selectTime(){
            let t=this, f=t.field
            if(f.range){
                f.value_low=getTime(t.value0)
                f.value_hi=getTime(t.value1)
                f.value=[f.value_low,f.value_hi]
                t.filter_change(f)
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
</style>