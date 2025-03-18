<template>
    <div v-if="!field.hide">
      <template v-if="field.read_only">
            <v-text-field 
              :label="field.description"
              disabled
              v-model="value_show"
              :rounded="$theme.rounded"
              hide-details
            />
        </template>
        
        <template v-else>
          
          value: {{ source_value }} <br>
          menuX: {{ menuX}}
          menuY: {{ menuY}}
          <v-menu
            v-model="menu"
            :close-on-content-click="true"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            min-width="290px"
            nudge-right="300px"
            
            
          >
          
            <template v-slot:activator="{ on, attrs }">             
              <!-- "need_empty?'event':''" -->
              <v-text-field
                v-model="value_show"
                :label="field.description"
                :prepend-icon='event'
                readonly
                @click.prevent="handleClick($event)"
                v-bind="attrs"
                v-on="on"
                :rounded="$theme.rounded"
                hide-details
              ></v-text-field>
            </template>
            <v-date-picker
              first-day-of-week="1" 
              locale="ru-Ru"
              v-model="value" 
              @input="select_cal()">
            </v-date-picker>

          </v-menu> 
          
        </template>
        <div class="clear" v-show="need_empty"><small><a href="#" @click.prevent="clear()"> очистить</a></small></div>
        <div class="err" v-if="error_message" v-html="error_message"></div>
        <div class="err" v-if="warning_message" v-html="warning_message"></div>
        <div v-if="after_html" v-html="after_html"></div> 
    </div>
</template>
<script>
import { formatDate, formatDateYMD, field_update,check_fld } from './field_functions'

export default {
    props:['form','field','parent'], // ,'calc_values'
    computed:{
      source_value(){
        return this.$store.state.values[this.field.name]
      },
      value_show(){
        let v=this.value
        if(!v){
          v=''
        }
        if(v && /\s\d{2}:\d{2}:\d{2}/.test(v)){
          v=formatDate(v)
          //v=v.replace(/\s\d{2}:\d{2}:\d{2}/,'')
          
        }

        if(v)
          return v.split('-').reverse().join('.')
        return ''
      }
    },
    watch:{
      value(nv){
        // сохраняем новое значение в store
        nv = nv?formatDateYMD(nv):''
        if(this.$store.state.values[this.field.name] != nv){
          this.$store.state.values[this.field.name]=nv
        }
        

        // if(nv!=this.value){
        //   console.log('changed!')
        // }
      }
      // field(){
      //   if(this.field.value){
      //     this.value=new Date(this.field.value)
      //   }
        
      //   //console.log('watch_value: ',this.value)
      //   this.after_html=this.field.after_html
      // }
    },
    created(){
      // .replace нужен для того, чтобы пофиксить время, которого быть не должно
      
      let value=this.field.value.replace(/[T\s][\d:]+$/,'')
      this.value=value?new Date(value):null

      //console.log('datevalue:',this.value)
      this._field_update=(new_data)=>{
        console.log('field_update0:',new_data)
        if(new_data.value){
          //new_data.value=formatDateYMD(new_data.value)
        }
        else{
          new_data.value=null
        }
        console.log('field_update1:',new_data.value)
        field_update(new_data,this)
      };
      if(!this.parent){
        this.$bus.on('field-update:'+this.field.name,this._field_update )
      }
      
      if(!/[1-9]/.test(this.value) || !/^\d{4}-\d{2}-\d{2}/.test(this.value)){
        this.value=null
      }
      if(this.parent){
        //console.log(this.value)
      }
      else{
       this.$bus.on('field-update:'+this.field.name,this._field_update )


      }
      // убрал, потому что из-за него криво отправляло из change_in_search
      //check_fld(this);
    },
    umounted(){
      if(!this.parent){
       //this.$bus.off('field-update:'+this.field.name,this._field_update)
      }
    },
    mounted(){
      this.set_need_empty()
    },
    data:function(){
        return {
            value: null,
            date: '',
            show_calendar: false,
            menu: false,
            menuX: 0,
            menuY: 0,
            need_empty:false,
            after_html:'',
            error_message:'',
            warning_message:''
        }
    },
    methods:{
      handleClick(event) {
        // Получаем координаты клика
        this.menuX = event.clientX;
        this.menuY = event.clientY;

        // Открываем меню
        this.menu = true;
      },
      select_cal(){
        //this.calc_values();
        console.log('select_cal')
        this.menu = false;
        this.set_need_empty();
        let field=this.field;
        field.value=formatDateYMD(this.value)
        if(this.parent){
          //console.log('date save:', this.value)
          this.parent(this.value)
        }
        else{
          //this.$bus.emit('change_field', field);
          console.log(`set value ${this.field.name} ${field_value}`)
          //this.$store.state.values[this.field.name]=field.value
        }
        
      },
      clear(){
        this.value=null;
        this.select_cal();
      },
      set_need_empty:function(){
        this.need_empty=(!this.field.read_only && this.value)?true:false
      }
    }
}
</script>
<style scoped>
  .select_cal {margin-top: 1rem;}
  .select_cal {transition: background 0.3s ease, color 0.2s linear;}
  .clear {position: relative; top: -15px;}
  /*.v-input__control {width: 150px;}*/
</style>