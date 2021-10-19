<template>
  <v-app>
        <v-container>
            <v-card max-width="500" class="mx-auto auth">
                <template v-if="success">
                    <v-card-title  class="headline">Регистрация прошла успешно!</v-card-title>
                    <v-card-text>
                        Ваша заявка принята, с вами свяжется менеджер для уточнения деталей
                        <v-card-actions v-if="0">
                            <v-btn color="primary" ref="button"  @click="to_login()" small>Войти в систему</v-btn>
                        </v-card-actions>
                    </v-card-text>
                    
                </template>
                <template v-else>
                    <v-card-title  class="headline">
                    Регистрация в системе АннА
                    </v-card-title>
                    <v-card-text>
                        
                    <v-text-field 
                        :label="show_labels?'Наименование компании':''" v-model="firm"
                        :error-messages="error.firm" 
                    />
                    
                    <v-text-field :label="show_labels?'Юридический адрес':''" 
                        v-model="ur_address"
                        :error-messages="error.ur_address" 
                    />
                    <v-text-field :label="show_labels?'ИНН':''"
                        v-model="inn"
                        :error-messages="error.inn" 
                    />
                    <v-text-field :label="show_labels?'Фамилия':''"
                        v-model="name_f"
                        :error-messages="error.name_f" 
                    />
                    <v-text-field :label="show_labels?'Имя':''"
                        v-model="name_i"
                        :error-messages="error.name_i" 
                    />
                    <v-text-field :label="show_labels?'Отчество':''"
                        v-model="name_o"
                        :error-messages="error.name_o" 
                    />
                    <v-text-field 
                        :label="show_labels?'Контактный телефон':''"
                        v-model="phone"

                        @keyup="phone_replace"
                        :error-messages="error.phone" 
                    />
                    
                    <v-text-field 
                        :label="show_labels?'Email':''"
                        v-model="login"
                        @keyup="error.login=''"
                        :error-messages="error.login" 

                    />
                    <div class="err" v-if="errors.length">
                        <div v-for="(e,idx) in errors" :key="'err'+idx" v-html="e"></div>
                    </div>
                    </v-card-text>
                    <v-card-actions>
                    <v-btn color="primary" ref="button" :disabled="submit_disabled" @click="register()" small>Зарегистрироваться</v-btn>
                    </v-card-actions>
                </template>

            </v-card>
        </v-container>

  </v-app>
</template>

<script>

import { phone_replace, phone_check, email_check } from '../js/check_func.js';
export default {
        data: () => ({
          show_labels:true,
          success:false, // флаг успешной регистрации
          firm:'Рога и копыта',
          ur_address:'Москва, Перерва, д4',
          inn:'2362763762',
          name_f:'Иванов',
          name_i:'Иван',
          name_o:'Иванович',
          phone:'89999999999',
          login:'test@test.ru',
          error:{
              login:'',
              ur_address:'',
              inn:'',
              firm:'',
              name_f:'',
              name_i:'',
              name_o:'',
              phone:'',

          },
          errors:[], // серверные ошибки
        }),
        mounted () {
            setTimeout(
               ()=>{ // для того, чтобы не было глюков с автоподстановкой логина и пароля при отображении
                
                  let l=document.querySelectorAll('.auth label');
                  for(let el of l){
                      el.classList.add('v-label--active')
                  }

                  //document.getElementById('login').focus();
               },1

            )
        },

        created(){
          
        },
        watch:{
            inn(){
                if(/[^\d]/.test(this.inn) || this.inn.length > 12)
                    this.error.inn='ИНН может содержать только 10 или 12 цифр'
                else
                    this.error.inn=''
            },


        },

        methods: {
            to_login(){
                document.location.href="/login"
            },
            login_check(){

                let v=this.login
                if(!v){
                    this.error.login='Обязательно укажите Email, он является логином в системе'
                }
                if(!/^[a-zA-Z0-9\-_\.]+@[a-zA-Z0-9\-_\.]+\.[a-zA-Z0-9\-_\.]+$/.test(v)){
                    this.error.login='Логин указан не корректно'                    
                }
            },
            phone_check(){
                this.phone_replace()
                return phone_check(this.phone)
            },
            phone_replace(){
                this.phone=phone_replace(this.phone)                
            },
            check(){ // Браузерная проверка
              if(!this.name_f)
                this.error.name_f='Укажите фамилию'
              if(!this.name_i)
                this.error.name_i='Укажите имя'
              if(!this.name_o)
                this.error.name_i='Укажите отчество'
                
              // ИНН
              if(this.inn && !/^[\d]{10,12}$/.test(this.inn))
                this.error.inn='ИНН может содержать только 10 или 12 цифр'
              
              if(!this.phone_check())
                this.error.phone='Телефон не указан или указан неверно'
              
              this.login_check()
              if(!this.ur_address)
                this.error.ur_address='Пожалуйста укажите юридический адрес'
          },
          register(){
            
            this.check(); // проверка в браузере
            if(this.submit_disabled)
                return 
            
            this.$http.post(
              BackendBase+'/register',
              {
                  firm: this.firm,
                  ur_address:this.ur_address,
                  inn:this.inn,
                  name_f:this.name_f,
                  name_i:this.name_i,
                  name_o:this.name_o,
                  phone: this.phone,
                  login: this.login
              }
            ).then(
              response=>{
                let D=response.data;
                if(D.success)
                  this.success=true
                
                this.errors=D.errors
                
              }
            )
          }
        },

        computed: {
          submit_disabled(){
            
            for(let f in this.error)
                if(this.error[f])
                    return true
            return false

          }
        }
}
</script>
<style scope>
  
  .auth .err{ color: red; background-color: white;}
</style>



