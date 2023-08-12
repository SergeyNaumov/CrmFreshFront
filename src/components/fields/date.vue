<template>
    <div>
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
          <v-menu
            v-model="menu"
            :close-on-content-click="false"
            :nudge-right="40"
            transition="scale-transition"
            offset-y
            readonly
            min-width="290px"
          >
          
            <template v-slot:activator="{ on }">
              
              <!-- v-model="value" -->
              <v-text-field
                v-model="value_show"
                :label="field.description"
                :prepend-icon="need_empty?'event':''"
                readonly
                v-on="on"
                :rounded="$theme.rounded"
                hide-details
              ></v-text-field>
              
              
            </template>
            <v-date-picker
              first-day-of-week="1" 
              locale="ru-Ru"
              v-model="value" @input="select_cal()"></v-date-picker>
              
          </v-menu>
          
        </template>
        <div class="clear" v-show="need_empty"><small><a href="#" @click.prevent="clear()"> очистить</a></small></div>
        <div
          class="err" v-if="error_message" v-html="error_message"
        />
        <div
          class="err" v-if="warning_message" v-html="warning_message"
        />
    </div>
</template>
<script>
import { field_update,check_fld } from './field_functions'
import { bus } from '../../main'
export default {
    props:['form','field','parent'], // ,'calc_values'
    computed:{
      value_show(){
        let v=this.value
        if(/\s\d{2}:\d{2}:\d{2}/.test(v)){
          v=v.replace(/\s\d{2}:\d{2}:\d{2}/,'')
          
        }
        if(v)
          return v.split('-').reverse().join('.')
        return ''
      }
    },
    watch:{
      field(){
        this.value=this.field.value
      }
    },
    created(){
      this.value=this.field.value;;
      this._field_update=(new_data)=>{field_update(new_data,this)};

      if(!/[1-9]/.test(this.value) || !/^\d{4}-\d{2}-\d{2}/.test(this.value)){
        this.value=''
      }
      if(this.parent){
        //console.log(this.value)
      }
      else{
        bus.$on('field-update:'+this.field.name,this._field_update )

        // bus.$on('field-update:'+this.field.name,new_data=>{
        //   if(this.value !== new_data.value)
        //     this.value=new_data.value

        //   if('error_message' in new_data){
        //     this.$nextTick(
        //       ()=>{this.error_message=new_data.error_message}
        //     );
        //   }
        //   if('warning_message' in new_data){
        //     this.$nextTick(
        //       ()=>{this.warning_message=new_data.warning_message}
        //     );
        //   }
        // })
      }
    },
    beforeDestroy(){
      if(!this.parent){
       bus.$off('field-update:'+this.field.name,this._field_update)
      }
    },
    mounted(){
      this.set_need_empty()
    },
    data:function(){
        return {
            value:'',
            date: '',
            show_calendar: false,
            menu: false,
            modal: false,
            need_empty:false,
            error_message:'',
            warning_message:''
        }
    },
    methods:{
      select_cal(){
        //this.calc_values();
        
        this.menu = false;
        this.set_need_empty();
        let field=this.field;
        field.value=this.value
        if(this.parent){
          //console.log(this.value)
          this.parent(this.value)
        }
        else{
          bus.$emit('change_field', field);
        }
        
      },
      clear(){
        this.value='';
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