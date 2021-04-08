<template>
    <div>
        <template v-if="field.read_only">
          <template v-if="field.value">{{field.value}}</template>
          <template v-else>-</template>
        </template>
        <template v-else>
          <v-layout row wrap>
              <v-flex pl-3 md6 xs12 >
                  <v-select
                    v-model="year"
                    :items="year_list"
                    autocomplete
                    label="Выберите год"
                  />
                  </v-flex>
              <v-flex pl-3 md6 xs12 >
                  <v-select
                    v-model="mon"
                    :items="mon_list"
                    item-value="v"
                    item-text="d"
                    label="Выберите месяц"
                  />
              </v-flex>
          </v-layout>
        </template>
        <div class="clear" v-show="need_empty">
          <small>
            <a href="#" @click.prevent="set_current()">установить текущие значения</a> |
            <a href="#" @click.prevent="clear()"> очистить</a>
          </small>
        </div>
    </div>
</template>
<script>
function get_cur_year(){
  var dt = new Date(); return dt.getFullYear();
}
function get_cur_mon(){
  var dt = new Date(); return dt.getMonth()+1
}
import { bus } from '../../main'
export default {
    props:['form','field'],
    computed:{
      year_list(){
        let cur_year=get_cur_year();
        let min=cur_year-100, max=cur_year+20;
        let arr=[];
        while(min<max){
          arr.push(min); min++
        }
        return arr
      },
      need_empty(){
        return (this.year || this.mon)?true:false
      },
      value(){
        if(this.year && this.mon){
            let m=this.mon;
            if(m<10)
              m='0'+m
            return this.year+'-'+m
        }
        else
          return ''
        
      }
    },
    mounted(){
      if(this.field.value){
        let arr=this.field.value.split('-');
        if(arr.length==2){
          this.year=parseInt(arr[0]),
            this.mon=parseInt(arr[1]);
        }
        
      }
    },
    watch:{
      year(){
        if(this.year && !this.mon) this.mon=1;
        this.save();
      },
      mon(){
        if(this.mon && !this.year) this.year=get_cur_year();
        this.save();
      }
    },
    data:function(){
        return {
            year: '',
            mon: '',
            mon_list:[{v:1,d:'Январь'},{v:2,d:'Февраль'},{v:3,d:'Март'},{v:4,d:'Апрель'},{v:5,d:'Май'},{v:6,d:'Июнь'},{v:7,d:'Июль'},{v:8,d:'Август'},{v:9,d:'Сентябрь'},{v:10,d:'Октябрь'},{v:11,d:'Ноябрь'},{v:12,d:'Декабрь'}]
        }
    },
    
    methods:{
      
      clear(){
        this.mon=''; this.year='';
        this.field.value='';
        
      },
      save(){
        let field=this.field;
        field.value=this.value;
        //this.change_field(field);
        bus.$emit('change_field',field)
      },
      set_current(){
        this.year=get_cur_year(), this.mon=get_cur_mon();
      }
    }
}
</script>
<style scoped>
  .clear {position: relative; top: -1.5rem;}
</style>