<template>
  
    <div class="apteka_list">
      <h3>Аптеки:</h3>
      <div v-for="(a,idx) in list" :key="idx">
        <a href="" @click.prevent="a.more=!a.more">{{a.ur_address}}</a>
        <div v-if="a.more" class="more">
          <div><b>Данные представителя:</b></div>
            <template v-if="a.m_id">
              <AptManagerEdit :apteka="a"/>
              
            </template>
            <template v-else>
              <p>
                Для данной аптеки не добавлен представитель
                <v-btn color="primary" ref="button"  @click.prevent="show_create_form=true" v-if="!show_create_form" small>Добавить</v-btn>        
                <v-card class="create_form" v-if="show_create_form"> 
                  <v-card-text>
                    <h3>Добавление представителя аптеки:</h3>
                    <template v-if="success_register">
                      <p>Вы успешно добавили представителя аптеки!</p>
                      <v-btn color="primary" ref="button"  @click="get_reg_data" small >Закрыть</v-btn>&nbsp;
                    </template>
                    <template v-else>
                    
                    <v-text-field 
                              label="Логин"
                              v-model="login"
                              :error-messages="error.login" 
                              @keyup="check_login"
                    />
                    <v-text-field 
                              label="Пароль"
                              v-model="password"
                              :error-messages="error.password" 
                              @keyup="check_login"
                    />
                    <v-text-field 
                              label="Фамилия"
                              v-model="name_f"
                              :error-messages="error.name_f" 
                              @keyup="check_reg_data"
                    />
                    <v-text-field 
                              label="Имя"
                              v-model="name_i"
                              :error-messages="error.name_i" 
                              @keyup="check_reg_data"
                    />
                    <v-text-field 
                              label="Отчество"
                              v-model="name_o"
                              :error-messages="error.name_o" 
                              @keyup="check_reg_data"
                    />
                    <v-text-field 
                              label="Телефон"
                              v-model="phone"
                              :error-messages="error.phone" 
                              @keyup="check_reg_data"
                    />
                    </template>
                    <errors :errors="errors"/>
                  </v-card-text>
                  <template v-if="!success_register">
                    <v-btn color="primary" ref="button"  @click="register_apt_manager(a.id)" small :disabled="!reg_data_ok">Добавить</v-btn>&nbsp;
                    <v-btn color="red" ref="button"  @click="show_create_form=false" small>Отменить</v-btn>
                  </template>
                </v-card>
              </p>
            </template>
          <hr>
          
<!--          <div><b>Данные аптеки:</b></div>
            <div>ИНН: {{a.inn}}</div>
            <div>Email Аптеки: {{a.email}}</div>
            <div>Телефон Аптеки: {{a.phone}}</div>
          <hr>
        -->
          <div class="subscribes">
              <v-checkbox
                hide-details
                label="отображать график выполнения плана"
                v-model="a.set1"
                @change="change_set(1,a)"
              />
              <div v-show="a.saved_s1" class="saved"></div>
              <v-checkbox
                hide-details
                label="показывать % выполнения плана другими аптеками сети"
                v-model="a.set2"
                @change="change_set(2,a)"
              />
              <div v-show="a.saved_s2"  class="saved"></div>
          </div>
        </div>
      </div>
    </div>
  
</template>
<script>

import { phone_replace, phone_check, email_check, gen_pas } from '../js/check_func.js';
export default ({
  props:[
    'comp','get_reg_data'
  ],
  created(){
      this.list=this.comp.apteka_list
  },
  watch:{
    comp(){
      this.list=this.comp.apteka_list
    },
    show_create_form(){
      this.password=gen_pas()
    }
  },
  data() {
    return{
      list:[],
      // данные для регистрации
      chk_login_cnt:0,
      success_register:false,
      //login: 'testirovanie@apteka.ru',
      login:'',
      password:'',
      name_f:'',
      name_i:'',
      name_o:'',
      phone:'',
      reg_data_ok: false,
      edit_data_ok: false,
      errors:[],
      error:{
        login:'',
        phone:'',
        name_f:'',
        name_i:'',
        name_o:'',
      },
      edit_error:{
        login:'',
        phone:'',
        name_f:'',
        name_i:'',
        name_o:'',
      },
      show_create_form:false,
    }
    
  },
  computed: {
    
  },
  methods:{
    check_login(){
      this.reg_data_ok=true
      if(!email_check(this.login)){
        this.error['login']='Логин должен являеть валидным адресом электронной почты'
        this.reg_data_ok=false
      }
      else{ // логин прошёл проверку на валидность, проверяем дубли
        if(this.chk_login_cnt==0){
 
              this.chk_login_cnt++
              this.$http.post(
                BackendBase+'/anna/check-account-login',
                {
                  login:this.login
                }
              ).then(
                r=>{
                  let D=r.data
                  this.chk_login_cnt--
                  if(D.success){
                    this.check_reg_data()
                  }
                  else if(D.errors.length){
                    this.error['login']=D.errors[0]
                  }
                }
              )

          
        }

      }

    },
    check_reg_data(){
      this.phone=phone_replace(this.phone)
      // обнуляем ошибки перед проверкой
      this.reg_data_ok=true
      this.errors=[]
      for(let f in this.error)
        this.error[f]=''
      
      
      if(!phone_check(this.phone)){
        this.error['phone']='Введите номер телефона в правильном формате'
        this.reg_data_ok=false
      }

      if(!this.name_f){
        this.error['name_f']='укажите фамилию'
        this.reg_data_ok=false
      }
      if(!this.name_i){
        this.error['name_i']='укажите имя'
        this.reg_data_ok=false
      }
      if(!this.name_o){
        this.error['name_o']='укажите отчество'
        this.reg_data_ok=false
      }
      if(this.password.length<6){
        this.error['password']='длина пароля должна быть не менее 6-ти символов'
        this.reg_data_ok=false
      }
    },
    register_apt_manager(apteka_id){
      this.$http.post(
        BackendBase+'/anna/reg-apteka-account',
        {
          apteka_id:apteka_id,
          login: this.login,
          password:this.password,
          name_f: this.name_f,
          name_i: this.name_i,
          name_o: this.name_o,
          phone: this.phone,

        }
      ).then(
        r=>{
          let D=r.data
          if(D.success){
            
            this.success_register=true
          }
          else{
            this.errors=D.errors
          }
            
            
          
        }
      )
    },
    change_set(set_number,a){ // опции для аптек
      // a -- аптека
      let value=a['set'+set_number]?'1':'0'
      this.$http.post(
        BackendBase+'/anna/change-set-apteka',
        {
          apteka_id: a.id,
          number: set_number,
          value: value
        }
      ).then(
        r=>{
          let D=r.data
          if(D.success){
            a['saved_s'+set_number]=true
            setTimeout(()=>{a['saved_s'+set_number]=false},500)
          }
          else{
            a['set'+set_number]=value?true:false
            alert('произошла ошибка при сохранении')
          }
        }
      ).catch(
        ()=>{
          alert('произошла ошибка при сохранении')
          a['set'+set_number]=value?true:false
        }
      )
    },
  }
})
</script>
<style scope>
  .create_form{
    padding: 10px;
  }
  .apteka_list {margin-top: 20px;}
  .apteka_list .more {
    margin-top: 10px;
    border: 1px dotted gray;
    border-radius: 10px;
    padding: 10px;
  }
  .apteka_list .more hr {
    margin-top: 10px;
    margin-bottom: 10px;
    
  }
  .saved {
    color: green; 
    /*position: relative; top: -40px;
    left: 300px;
    height: 10px;*/
  }
  .saved:after {content: 'сохранено'; }
</style>