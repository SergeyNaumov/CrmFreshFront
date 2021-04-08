<template>
  <div>
      <!-- Блок для проекта "Анна" -->
      <div>
        
        <!-- для изменения рег. данных -->
        <errors :errors="errors" v-if="errors.length"/> <!-- ошибки при инициализации компонента -->
        <v-card max-width="500px" v-else> 
          
          <v-card-text >
              <h3>Ваши регистрационные данные:</h3>

              
              <div v-if="!edit_reg_data">

                &nbsp;<b>Логин:</b> {{manager.login}}<br>
                &nbsp;<b>Имя:</b> {{manager.name}}<br>
                <div  v-if="!edit_reg_data" style="text-align: right; width: 100%;">
                  <a href="" @click.prevent="edit_reg_data=true"><v-icon  color="primary" small>edit</v-icon></a>
                </div>
              </div>
              <template v-else> 

                  <!-- Изменение рег. данных -->

                  <v-text-field 
                            label="Логин"
                            v-model="manager.login"
                            :error-messages="manager_error.login" 
                            @keyup="check_reg_data"
                  />
                  <v-text-field 
                            label="Фамилия"
                            @keyup="check_reg_data"
                            v-model="manager.name_f"
                            :error-messages="manager_error.name_f" 
                  />
                  <v-text-field 
                            label="Имя"
                            @keyup="check_reg_data"
                            v-model="manager.name_i"
                            :error-messages="manager_error.name_i" 
                  />
                  <v-text-field 
                            label="Отчество"
                            @keyup="check_reg_data"
                            v-model="manager.name_o"
                            :error-messages="manager_error.name_o" 
                  />
                  <v-text-field 
                            label="Телефон"
                            v-model="manager.phone"
                            @keyup="check_reg_data"
                            :error-messages="manager_error.phone" 
                  />
                  
                      <!-- ИЗМЕНЕНИЕ Пароля -->
                      <div v-if="change_password_step==0"><a href=""  @click.prevent="change_password_step=1" small >изменить пароль</a></div>
                      <div class="change_form" v-else>
                        <template v-if="change_password_step==1"> <!-- изменение пароля, шаг1 -->
                          <v-text-field 
                              label="введите свой текущий пароль"
                              v-model="password"
                              type="password"
                          />
                        <div class="err" v-if="error_change_password">
                          {{error_change_password}}
                        </div>
                          <template v-if="password">
                              <v-btn color="primary" ref="button"  @click="check_password()" small v-if="edit_reg_data">Ок</v-btn>        
                              <v-btn color="red" ref="button"  @click="change_password_step=0" small v-if="edit_reg_data">Отмена</v-btn>        
                          </template>
                        </template>
                        <div v-if="change_password_step==2"> <!-- изменение пароля, шаг2 -->
                          <v-text-field 
                              label="введите новый пароль"
                              v-model="password1"
                              type="password"
                          />
                          <v-text-field 
                              label="введите новый пароль ещё раз"
                              v-model="password2"
                              type="password"
                          />
                          <div class="err" v-if="error_change_password">
                            {{error_change_password}}
                          </div>
                          <template v-if="change_password2_ok">
                            <v-btn color="primary" ref="button"  @click="change_password()" small v-if="edit_reg_data">Изменить пароль</v-btn>&nbsp;
                          </template>
                          <v-btn color="red" ref="button"  @click="change_password_step=0" small v-if="edit_reg_data">Отмена</v-btn>        
                        </div>
                        <template v-if="change_password_step==3">
                          <p style="color: green;">
                            Ваш пароль был успешно изменён!<br>
                            Уведомление о смене пароля было отправлено на Вашу электронную почту
                          </p>
                          <v-btn color="primary" ref="button"  @click="change_password_step=0" small v-if="edit_reg_data">Ясно</v-btn>&nbsp;
                        </template>

                      </div>
                      <!-- ИЗМЕНЕНИЕ Пароля - end -->

                
              </template>
          </v-card-text>
          
          <errors :errors="reg_data_errors" />
          
          <v-card-actions  v-if="change_password_step==0 && edit_reg_data">
              <div v-if="change_reg_data_success" class="succ">  <!-- Регистрационные данные успешно обновлены-->
                Регистрационные данные успешно обновлены <v-btn color="primary" ref="button"  @click="get_reg_data()" small >Закрыть</v-btn>
              </div>
              <template v-else>
                <v-btn color="primary" ref="button"  @click="change_reg_data()" small v-if="reg_data_ok">Внести изменения</v-btn>

                <v-btn color="red" ref="button"  @click="get_reg_data()" small >Не вносить изменения</v-btn>            
              </template>
          </v-card-actions>
          
        </v-card>

        <!-- ПРЕДСТАВИТЕЛЬ ЮРИДИЧЕСКОГО ЛИЦА -->
        <template v-if="manager.type==2"> 
         
          <v-card max-width="800px" class="ur_lico_settings">  
          
            <v-card-text>
            <template v-if="comp_list.length>0">
              Вы являетесь представителем {{(comp_list.length>1)?'юридического лица':'юридических лиц'}}
                
                  <CompItem      
                    v-for="c in comp_list" 
                    :comp="c"
                    :set_comp="set_comp"
                    :get_reg_data="get_reg_data"
                    :your_manager="your_manager"
                    :key="c.id"
                  />

                
              <a href=""></a>
            </template>
            </v-card-text>
          </v-card>
        </template>

        <!-- ПРЕДСТАВИТЕЛЬ АПТЕК -->
        <template v-if="manager.type==3"> 
         
          <v-card max-width="500px" class="ur_lico_settings">  
          
            <v-card-text>
            <template v-if="apt_list.length>0">
              Вы являетесь представителем {{(apt_list.length>1)?'аптек':'аптеки'}}
                  
                  <AptItem
                    v-for="c in apt_list" 
                    :apt="c"
                    :set_apt="set_apt"
                    :get_reg_data="get_reg_data"
                    :your_manager="your_manager"
                    :key="c.id"
                  />
            </template>
            </v-card-text>
          </v-card>
        </template>
      </div>
  </div>  
</template>
<script>
import Vue from 'vue'
import { phone_replace, phone_check, email_check } from '../js/check_func.js';
Vue.component('CompItem',()=> import('./comp_item'));
Vue.component('AptItem',()=> import('./apteka_item'));
export default ({
  props:[],
  //components:[comp_item],
  created(){
    this.get_reg_data()
  },
  data: function(){
    return {
      errors:[],
      change_password_step:0,
      // для подтверждения тек. пароля
      password:'',
      // для изменения пароля
      password1:'',
      password2:'',
      
      error_change_password:'',
      edit_reg_data:true,
      reg_data_errors:[],
      phone: '', // телефон менеджера храним здесь, чтобы можно было watch-ить
      change_reg_data_success: false,
      manager:{
        login: '',
        name_f: '',
        name_i: '',
        name_o: '',
        type: 0
      },
      your_manager:{name:'Леопольд Викторович Мандельштам'},
      manager_error:{
        login: '',
        name_f:'',
        name_i:'',
        name_o:'',
        phone:''
      },
      comp_list:[ // Список юрлиц
      ],
      apt_list:[

      ]
    }
  },
  watch:{
    change_password_step(){
      
      if(this.change_password_step==1){
        this.password=''
      }
      else if(this.change_password_step==2){
        this.password1=''
        this.password2=''
      }
      
      
      this.error_change_password=''
    },

  },
  computed:{
    reg_data_ok(){
      for(let f in this.manager_error)
        if(this.manager_error[f]){
          console.log('error:',f,this.manager_error[f])
          return false
        }

      return true
    },
    change_password2_ok(){
      this.error_change_password=''
      let p1 = this.password1, p2 = this.password2
      if( p1 && !/^[a-zA-Z0-9\-\+=#\@\!\^&\%\$\.\*,<>\/\\;\{\}:"']+$/.test(p1)){
        this.error_change_password='новый пароль содержит недопустимые символы, проверьте раскладку клавиатуры'
      }
      if(p1.length>=6 && p1==p2){
        return true
      }

      if(p1 && p2){
        if(p1.length<6)
          this.error_change_password='длина пароля должна быть не менее 6-ти символов'
        else if(p1 != p2)
          this.error_change_password='пароли не совпадают'
        
      }
      return false
    }
  },
  methods:{
    set_comp(comp){
      for(let c of this.comp_list){
        if(c.id==comp.id){
           c=comp; return
        }
      }
    },
    set_apt(apt){
      for(let a of this.apt_list){
        if(a.id==apt.id){
           a=apt ;  return
        }
      }
    },
    login_check(){
      this.check_reg_data()
    },
    check_reg_data(){
      this.manager.phone=phone_replace(this.manager.phone)
      // обнуляем ошибки перед проверкой
      for(let f in this.manager_error)
        this.manager_error[f]=''
      
      
      if(!phone_check(this.manager.phone)){
        this.manager_error['phone']='Введите номер телефона в правильном формате'
      }
      if(!email_check(this.manager.login)){
        this.manager_error['login']='Логин должен являеть валидным адресом электронной почты'
      }
      if(!this.manager.name_f){
        this.manager_error['name_f']='укажите фамилию'
      }
      if(!this.manager.name_i){
        this.manager_error['name_i']='укажите имя'
      }
      if(!this.manager.name_o){
        this.manager_error['name_o']='укажите отчество'
      }
    },
    get_reg_data(){ // получаем регистрационные данные
      this.$http.get(BackendBase+'/anna/get-reg-data').then(
        r=>{
          let D=r.data
          if(D.success){
            this.manager=D.manager
            this.phone=this.manager.phone

            this.comp_list=[]
            this.apt_list=[]
            
              setTimeout(
                ()=>{
                  if(this.manager.type==2)
                    this.comp_list=D.comp_list

                  if(this.manager.type==3)
                    this.apt_list=D.apt_list
                },100
              )
            

            
            this.apt_list=D.apt_list
            this.change_password_step=0
            this.edit_reg_data=false
            this.reg_data_errors=[]
            this.check_reg_data()
            
          }
          this.errors=D.errors
          
        }
      )
      
    },
    check_password(){
      this.$http.post(BackendBase+'/anna/check-password',
        {
          password: this.password
        }
      ).then(
        r=>{
          let D=r.data
          if(D.success) // пароль подошёл
            this.change_password_step=2
          this.error_change_password=D.error
          

        }
      )
    },
    change_password(){
      this.$http.post(
        BackendBase+'/anna/change-password',
        {
          password: this.password,
          password1: this.password1,
          password2: this.password2
        }
      ).then(
        r=>{
          let D=r.data
          if(D.success)
            this.change_password_step=3
          this.error_change_password=D.error
        }
      )
    },
    change_reg_data(){
      this.check_reg_data()
      if(this.reg_data_ok){
        this.$http.post(BackendBase+'/anna/change-reg-data',
          {
            login: this.manager.login,
            name_f: this.manager.name_f,
            name_i: this.manager.name_i,
            name_o: this.manager.name_o,
            phone: this.manager.phone,

          }
        ).then(
          r=>{
            let D=r.data
            if(D.success)
              this.get_reg_data()
          }
        )
      }
    }
  }
})
</script>
<style scoped>
  .change_form {
    border: 1px solid gray;
    padding: 10px;
    margin: 5px;
    border-radius: 5px;
  }
  .ur_lico_settings {margin-top: 10px;}
  a {text-decoration: none;}
</style>
