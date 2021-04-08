<template>
  <div>
 

    <a href="" v-if="!apt.more" @click.prevent="show()">{{apt_local.header}}</a> 
        <v-card v-if="apt.more">
          
          <v-card-title>
              <div>
                    Заявка на изменение сведений<br>
                    <small>{{apt_local.header}}</small>
              </div>
          </v-card-title>
          <v-card-text >
                

                <template v-if="success">
                  <p>Ваша заявка успешно отправлена!</p>
                  <v-btn color="primary" ref="button"  @click="success=success_off()" small >Закрыть</v-btn>&nbsp;
                </template>
                <template v-else>
                  <p>Ваш менеджер: {{your_manager.name}}</p>
                  <v-checkbox
                    label="Включить уведомления о подписке аптек"
                    v-model="apt_local.on_notify"
                  />
                  <v-text-field 
                            label="Наименование"
                            v-model="apt_local.header"
                            @keyup="check_data"
                            :error-messages="error.header" 
                  />
                  <v-text-field 
                            label="ИНН"
                            v-model="apt_local.inn"
                            @keyup="check_data"
                            :error-messages="error.inn" 
                  />
                  <v-text-field 
                            label="Юридический адрес"
                            v-model="apt_local.ur_address"
                            @keyup="check_data"
                            :error-messages="error.ur_address" 
                  />
                  <v-text-field 
                            label="Телефон"
                            v-model="apt_local.phone"
                            @keyup="check_data"
                            :error-messages="error.phone" 
                  />
                  <v-text-field 
                            label="Email"
                            v-model="apt_local.email"
                            @keyup="check_data"
                            :error-messages="error.email" 
                  />
                  <v-text-field 
                            label="Email для оповещений"
                            v-model="apt_local.email_for_notify"
                            @keyup="check_data"
                            :error-messages="error.email_for_notify" 
                  />
                </template>
                <errors :errors="errors"/>
          </v-card-text>
          <v-card-actions v-if="!success">
            <template>
              <v-btn color="primary" ref="button"  @click="send_order()" small >Отправить заявку</v-btn>&nbsp;
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
    'apt','set_apt','your_manager','get_reg_data'
  ],
  created(){
    this.apt_local=this.apt
  },

  data() {
    return{
      apt_local:{},
      success:false,
      errors:[],
      error:{
        header:'',
        inn:'',
        phone:'',
        email:'',
        ur_address:''
      }
    }
    
  },
  computed: {
    data_ok(){
      for(let e in this.error)
        if(this.error[f]){
          console.log('error:',f,this.manager_error[f])
          return false
        }

      return true
    }
  },
  methods:{
    success_off(){
      this.success=false;
      this.hide()
      // читаем заново из базы
      this.get_reg_data()
    },
    check_data(){
      this.apt_local.phone=phone_replace(this.apt_local.phone)

      // обнуляем ошибки перед проверкой
      for(let f in this.error)
        this.error[f]=''
      
      if(!phone_check(this.apt_local.phone))
        this.error['phone']='Введите номер телефона в правильном формате'

      if(!this.apt_local.ur_address){
        this.error['ur_address']='Укажите юридический адрес'
      }
      if(!/^(\d{10}|\d{12})?$/.test(this.apt_local.inn) ){
        this.error['inn']='В ИНН должно быть 10 или 12 цифр'
      }
      if(!email_check(this.apt_local.email)){
        this.error['email']='Электронный адрес не валиден'
      }
      
      if(this.apt_local.email_for_notify && !email_check(this.apt_local.email_for_notify)){
        this.error['email_for_notify']='Электронный адрес не валиден'
      }
      
      
    },
    show(){
      this.apt_local.more=true
      this.set_apt(this.apt_local)
    },
    hide(){
      this.apt_local.more=false
      this.set_apt(this.apt_local)
    },
    send_order(){
      let c=this.apt_local

      this.$http.post(
        BackendBase+'/anna/change-apteka-order',
        {
          'apteka_id':c.id,
          'header':c.header,
          'inn':c.inn,
          'phone':c.phone,
          'email':c.email,
          'email_for_notify':c.email_for_notify,
          'ur_address':c.ur_address,
          'on_notify':c.on_notify?1:0
        }
      ).then(
        r=>{
          let D=r.data
          if(D.success){
            this.success=true
            this.get_reg_data()
          }
          this.errors=D.errors
        }
      )
    }
  }
})
</script>
