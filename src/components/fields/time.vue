<template>
    <div>        
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
          
            <template v-slot:activator="{ on }">
              <v-text-field
                v-model="field.value"
                label="Выберите время"
                prepend-icon="event"
                readonly
                v-on="on"
              ></v-text-field>
              
              
            </template>
            <v-time-picker
              format="24hr"
              v-model="field.value" @input="select_cal()"></v-time-picker>
              
          </v-menu>
          
        </template>
        <div class="clear" v-show="need_empty"><small><a href="#" @click.prevent="clear()"> очистить</a></small></div>
    </div>
</template>
<script>
export default {
    props:['form','field'],
    computed:{

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
        this.$bus.$emit('change_field',this.field);
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
  .clear {position: relative; top: -1.5rem;}
</style>