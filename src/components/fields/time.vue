<template>
    <div>        
        <div v-if="field.before_html" v-html="field.before_html"></div>
        <template v-if="field.read_only">
          <template v-if="field.value">{{field.value}}</template>
          <template v-else>-</template>
        </template>
        <template v-else>
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            readonly
            min-width="290px"
          >
          
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="field.value"
                label="Выберите время"
                prepend-icon="event"
                readonly
                v-bind="props"
                :style="field_style"
                hide-details
              ></v-text-field>
              
              
            </template>
            <v-time-picker
              color="primary"
              format="24hr"
              v-model="field.value" @update:model-value="select_cal()"></v-time-picker>
              
          </v-menu>
          
        </template>
        <div class="clear" v-show="need_empty"><small><a href="#" @click.prevent="clear()"> очистить</a></small></div>
        <div v-if="field.add_description" class="add_description">{{field.add_description}}</div>
        <div class="err" v-if="field.error_message" v-html="field.error_message"/>
        <div class="warn" v-if="field.warning_message" v-html="field.warning_message"/>
        <div v-if="field.after_html" v-html="field.after_html"></div>
    </div>
</template>
<script>
import { bus } from '../../main'
import { fieldWidthStyle } from './field_style'
export default {
    props:['form','field'],
    computed:{
      field_style(){
        return fieldWidthStyle(this.field,'200px')
      }
    },
    mounted(){
      this.set_need_empty()
    },
    data:function(){
        return {
            date: '',
            show_calendar: false,
            menu: false,
            modal: false,
            need_empty:false
        }
    },
    methods:{
      select_cal(){
        this.menu = false;
        this.set_need_empty();
        //this.change_field(this.field);
        this.emitChange(this.field);
      },
      clear(){
        this.field.value='';
        this.select_cal();
      },
      set_need_empty:function(){
        this.need_empty=this.field.value?true:false
      }
    }
}
</script>
<style scoped>
  .select_cal {margin-top: 1rem;}
  .select_cal {transition: background 0.3s ease, color 0.2s linear;}
  .clear {margin-top: 2px;}
</style>