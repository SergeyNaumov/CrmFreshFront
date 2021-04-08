<template>
    <div v-if="frontend_buttons.length">
        <v-btn
            v-for="(b,idx) in frontend_buttons"
            :key="idx" x-small
            color="primary"
            v-text="b.description"
            @click="run_button(b)"
        />
        <div v-if="success" class="success">
            действие успешно выполнено
        </div>
    </div>
</template>
<script>
import { bus } from '../../../main'
//import {frontend_button_process} from '../../js/edit_form.js'
export default {
    props:["after_update","field","form"],
    data(){
        return {
            success:false
            //config:''
        }
    },
    computed:{
      frontend_buttons(){
          let list=[];
          if(!this.field.frontend)
              return []
          
          if(!this.field.frontend.buttons)
              return []
          
          for(let b of this.field.frontend.buttons){
            list.push(b) 
          }
          return list
      }
    },
    methods:{
        run_button(button){
            let success_function=()=>{
                this.success=true;
                if(this.after_update){
                    this.after_update()
                }
                setTimeout(
                    ()=>{this.success=false},500
                )
            }
            bus.$emit('frontend_button_process',this.field,button,success_function);
        }
    }
}
</script>
<style scoped>
    .success {
        font-weight: bold;
        color: green;
        background-color: #ffffff !important;
    }
</style>