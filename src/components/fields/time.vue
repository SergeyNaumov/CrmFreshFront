<template>
    <div>        
        <template v-if="field.read_only">
          <template v-if="field.value">{{field.value}}</template>
          <template v-else>-</template>
        </template>
        <template v-else>         
            <v-text-field
              v-model="value"
              @keyup="fix_value"
              @change="fix_value"
              :label="field.description"
              prepend-icon="mdi-clock"
              placeholder="Введите время в формате ЧЧ:ММ"
              clearable
            />
            <div class="warning" v-if="!value_ok">Неверный формат даты</div>
        </template>
        
    </div>
</template>
<script>
import { getValueByField, setValueByField } from '../js/field_functions'
export default {
    props:['form','field','save_field_to_store','save_to_store', 'get_value_by_field','get_source_field'],
    computed:{
      refresh(){
        return this.$store.state.refresh
      },
      source_field(){
        let t=this, f=t.field
        if(typeof t.get_source_field=='function'){  
          return t.get_source_field(f.name)
        }
        return t.$store.state.fields[f.name]
      },
      value_ok(){
        let v=this.value;
        return !v || /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v)
      }
    },
    created(){
      this.value=String(this.field.value || '');
      this.fix_value()
    },
    data:function(){
        return {
            date: '',
            show_calendar: false,
            menu: false,
            modal: false,
            value:''
        }
    },

    watch:{
      value(nv){
        let t=this, ov=getValueByField(t,t.field)
        if(t.value_ok){
          if(ov != nv){
            t.save_value()
          }
        }
      }
    },
    methods:{
      fix_value() {
        let v = String(this.value || ''); // Преобразуем значение в строку
        v = v.replace(/^(\d:)/, '0$1');
        v = v.replace(/[^\d]/g, '').replace(/^(\d{1,4}).*$/, '$1').replace(/^(\d{2})(.*)$/, '$1:$2');
        v = v.replace(/^[3-9]/, '2').replace(/^2[4-9]/, '23').replace(/:[6-9]/, ':5').replace(/(\d{2})\d+/, '$1');

        this.value = v;
      },
      set_need_empty:function(){
        this.need_empty=this.field.value?true:false
      },
      save_value(){
        let t=this, field=t.field
        
        field.value=t.value
        setValueByField(t,t.field, t.value || '')
      }
    }
}
</script>
<style scoped>
  .select_cal {margin-top: 1rem;}
  .select_cal {transition: background 0.3s ease, color 0.2s linear;}
  .clear {position: relative; top: -1.5rem;}
</style>