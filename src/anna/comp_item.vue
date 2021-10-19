<template>
  <div>
    
    <div><b>Наименование:</b>{{comp.header}}</div>
    <div ><b>Юридический адрес:</b>&nbsp;{{comp.ur_address?comp.ur_address:'не указан'}}</div>
    <div><b>ИНН:</b>&nbsp;{{comp.inn?comp.inn:'не указан'}}</div>
    <div><b>Телефон:</b>&nbsp;{{comp.phone?comp.phone:'не указан'}}</div>
    <div>
      
        <v-checkbox v-model="comp.subscribe" hide-datails label="Уведомлять о подписке аптек" @change="subscribe_change" style="display: inline-block;" />
            <v-btn
              color="primary"
              dark
              x-small
              class="tooltip_subscribe"
              @click="tooltip_show=!tooltip_show"
            >?</v-btn>
        <v-dialog v-model="tooltip_show" transition="dialog-bottom-transition" max-width="390">
          
          <v-card>
            <v-card-title>Уведомлять о подписке аптек</v-card-title>
            <v-card-text>
              возможность аптеками выразить желание на участие в маркетинговой акции, уведомления приходят на вашу электронную почту
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>

              <v-btn
                color="primary"
                text
                @click="tooltip_show = false"
              >
                ok
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      
        
        <!--{{comp.on_notify?'да':'нет'}}-->
    </div>

    <template v-if="!comp.more">
      <br>&nbsp;<!--<a href="" @click.prevent="show()">изменить данные</a>-->
      <v-btn color="primary" ref="button"  @click.prevent="show()" small>Изменить данные юридического лица</v-btn>        
    </template>
    <v-card v-if="comp_local.more" style="margin-top: 10px;">
          <v-card-title>
            
              <div>
                    Заявка на изменение сведений о юридическом лице<br>
                    <small>{{comp.header}}</small>
              </div>
          </v-card-title>
          <v-card-text >
                <template v-if="success">
                  <p>Ваша заявка успешно отправлена!</p>
                  <v-btn color="primary" ref="button"  @click="success=success_off()" small >Закрыть</v-btn>&nbsp;
                </template>
                <template v-else>
                  
                  <!--<v-checkbox
                    label="Включить уведомления о подписке аптек"
                    v-model="comp_local.on_notify"
                    hide-details
                  />-->
                  <v-text-field 
                            label="Наименование"
                            v-model="comp_local.header"
                            @keyup="check_data"
                            :error-messages="error.header" 
                  />
                  <v-text-field 
                            label="ИНН"
                            v-model="comp_local.inn"
                            @keyup="check_data"
                            :error-messages="error.inn" 
                  />
                  <v-text-field 
                            label="Юридический адрес"
                            v-model="comp_local.ur_address"
                            @keyup="check_data"
                            :error-messages="error.ur_address" 
                  />
                  <v-text-field 
                            label="Телефон"
                            v-model="phone"
                            @keyup="check_data"
                            :error-messages="error.phone" 
                  />
<!--
                  <v-text-field 
                            label="Email"
                            v-model="comp_local.email"
                            @keyup="check_data"
                            :error-messages="error.email" 
                  />-->
                  <v-text-field 
                            label="Email для оповещений"
                            v-model="comp_local.email_for_notify"
                            @keyup="check_data"
                            :error-messages="error.email_for_notify" 
                  />
                </template>
                <errors :errors="errors"/>
          </v-card-text>
          <v-card-actions v-if="!success">
            <template>
              <v-btn color="primary" ref="button" :disabled="disable_change" @click="send_order()" small >Отправить заявку</v-btn>&nbsp;
              
            </template>
            <v-btn color="red" ref="button"  @click="hide()" small >Отменить</v-btn>
          </v-card-actions>
    </v-card>
  </div>
</template>
<script>
import { phone_replace, phone_check, email_check } from '../js/check_func.js';
export default ({
  props:[
    'comp','set_comp','your_manager','get_reg_data'
  ],
  created(){
    //this.comp_local=this.comp
    this.copy_comp_to_local()
    this.check_data()
  },
  watch:{
    comp(){
      //this.comp_local=this.comp
      this.copy_comp_to_local()
    },
    phone(){
      this.phone=phone_replace(this.phone)
      this.comp_local.phone=this.phone
    }
  },
  data() {
    return{
      comp_local:{
        id:'',header:'',ur_address:'',inn:'',email_for_notify:'',
        phone:'',
        more:false
      },
      phone:'',
      success:false,
      errors:[],
      disable_change:false,
      error:{
        header:'',
        inn:'',
        phone:'',
        email:'',
        ur_address:''
      },
      tooltip_show:false
    }
    
  },
  computed: {
    data_ok(){
      for(let e in this.error)
        if(this.error[f]){
          //console.log('error:',f,this.manager_error[f])
          return false
        }

      return true
    }
  },
  methods:{
    copy_comp_to_local(){
      for(let i in this.comp){
        this.comp_local[i]=this.comp[i]
      }
      this.phone=this.comp.phone
      //console.log('comp_local:',this.comp_local)
    },
    success_off(){
      this.success=false;
      this.hide()
      // читаем заново из базы
      this.get_reg_data()
    },
    check_data(){
      //this.comp_local.phone=phone_replace(this.comp_local.phone)
      this.disable_change=false
      // обнуляем ошибки перед проверкой
      for(let f in this.error)
        this.error[f]=''
        

      //if(!phone_check(this.comp_local.phone))
      //  this.error['phone']='Введите номер телефона в правильном формате'

      if(!this.comp_local.ur_address){
        let e='Укажите юридический адрес'
        this.error['ur_address']=e
        this.disable_change=true
        
      }
      if(!/^(\d{10}|\d{12})?$/.test(this.comp_local.inn) ){
        let e='В ИНН должно быть 10 или 12 цифр'
        this.error['inn']=e
        this.disable_change=true
        
      }
      //if(!email_check(this.comp_local.email)){
      //  this.error['email']='Электронный адрес не валиден'
      //}
      if(this.comp_local.email_for_notify && !email_check(this.comp_local.email_for_notify)){
        let e='Электронный адрес не валиден'
        this.error['email_for_notify']=e
        this.disable_change=true
      }
      
    },
    show(){
      this.comp_local.more=true
      this.set_comp(this.comp_local)
    },
    hide(){
      this.comp_local.more=false
      this.set_comp(this.comp_local)
    },
    subscribe_change(){
      //console.log(BackendBase+'/anna/change-comp-order')
      this.$http.get(BackendBase+'/anna/change-on-notify/'+this.comp.id+'/'+(this.comp.subscribe?1:0))
    },
    send_order(){
      let c=this.comp_local

      this.$http.post(
        BackendBase+'/anna/change-comp-order',
        {
          'comp_id':c.id,
          'header':c.header,
          'inn':c.inn,
          'phone':c.phone,
          //'email':c.email,
          'email_for_notify':c.email_for_notify,
          'ur_address':c.ur_address,
          'on_notify':c.on_notify?1:0
        }
      ).then(
        r=>{
          let D=r.data
          if(D.success){
            this.success=true
            //this.get_reg_data()
          }
          this.errors=D.errors
        }
      )
    }
  }
})
</script>
<style scoped>
  .manager_data{margin-left: 20px;}
  .apteka_list {margin-top: 10px;}
  .apteka_list div{margin-left: 20px; }
  .tooltip_subscribe {top: -10px; margin-left: 10px;}
</style>