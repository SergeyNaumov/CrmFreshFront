<template>
    <div>
        <div v-if="field.before_html" v-html="field.before_html"></div>
        <template v-if="field.read_only">
          <template v-if="field.value">{{field.value}}</template>
          <template v-else>-</template>
        </template>
        <template v-else>
          <v-row >
              <v-col class="pl-3" md="6" cols="12" >
                  <v-autocomplete
                    v-model="day"
                    :items="day_list"
                    no-data-text="недопустимое значение"
                    label="Выберите день"
                    hide-details
                  />
                  </v-col>
              <v-col class="pl-3" md="6" cols="12" >
                  <v-select
                    v-model="mon"
                    :items="mon_list"
                    item-value="v"
                    item-title="d"
                    label="Выберите месяц"
                    hide-details
                  />
              </v-col>
              <div class="clear" v-show="need_empty"><small>
                <a href="#" @click.prevent="set_current()">установить текущие значения</a> |
                <a href="#" @click.prevent="clear()"> очистить</a></small>
              </div>
          </v-row>
        </template>

        <div v-if="field.add_description" class="add_description">{{field.add_description}}</div>
        <div class="err" v-if="field.error_message" v-html="field.error_message"/>
        <div class="warn" v-if="field.warning_message" v-html="field.warning_message"/>
        <div v-if="field.after_html" v-html="field.after_html"></div>
    </div>
</template>
<script>
import { bus } from '../../main'
export default {
    props:['form','field'],
    computed:{
      day_list(){
        let list=[];
        if(!this.mon){
          return [];
        }
        else{
          // я  ф  м  а  м  и 
          const cnt_mas=[31,29,31,30,31,30,31,31,30,31,30,31];
          let max_cnt=cnt_mas[this.mon-1];
          while(this.day>max_cnt){
            this.day--
          }
          for(let i=0;i<=max_cnt;i++){
            list.push(i);
          }
          return list;
        }
      }
    },
    watch:{
      day(){
        this.save();
      },
      mon(){
        this.save();
      }
    },
    mounted(){
      if(this.field.value){
        let arr=this.field.value.split('-');
        if(arr.length==2){
          this.day=parseInt(arr[0]),
            this.mon=parseInt(arr[1]);
        }
        
      }
    },
    data:function(){
        return {
            day: '',
            mon: '',
            mon_list:[{v:1,d:'Январь'},{v:2,d:'Февраль'},{v:3,d:'Март'},{v:4,d:'Апрель'},{v:5,d:'Май'},{v:6,d:'Июнь'},{v:7,d:'Июль'},{v:8,d:'Август'},{v:9,d:'Сентябрь'},{v:10,d:'Октябрь'},{v:11,d:'Ноябрь'},{v:12,d:'Декабрь'}]
        }
    },
    methods:{
      clear(){
        this.day=''; this.mon='';
        this.field.value='';
      },
      need_empty(){
        return (this.day || this.mon)
      },
      
      set_current(){
        var dt = new Date();
        this.mon=dt.getMonth()+1, this.day=dt.getDate();
      },
      save(){
        let field=this.field;
        field.value=( (this.day>9)?this.day:'0'+this.day )+'-'+( (this.mon>9)?this.mon:'0'+this.mon );
        //this.change_field(field);
        this.emitChange(field)
      },
      
    }
}
</script>
<style scoped>
  .select_cal {margin-top: 1rem;}
  .select_cal {transition: background 0.3s ease, color 0.2s linear;}
  .clear {position: relative; top: -1.5rem;}
</style>