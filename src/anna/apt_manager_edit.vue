<template>
  <div>

    
              <template v-if="edit_form">
                    <v-text-field 
                              label="Логин"
                              v-model="login"
                              :error-messages="error.login" 
                              @keyup="check_login"
                    />
                    <v-text-field 
                              label="Фамилия"
                              v-model="name_f"
                              :error-messages="error.name_f" 
                              @keyup="check_data()"
                    />
                    <v-text-field 
                              label="Имя"
                              v-model="name_i"
                              :error-messages="error.name_i" 
                              @keyup="check_data(a)"
                    />
                    <v-text-field 
                              label="Отчество"
                              v-model="name_o"
                              :error-messages="error.name_o" 
                              @keyup="check_data()"
                    />
                    <v-text-field 
                              label="Телефон"
                              v-model="phone"
                              :error-messages="error.phone" 
                              @keyup="check_data(a)"
                    />
                    <div v-if="set_password">
                      <v-text-field 
                                label="Задайте пароль"
                                v-model="password"
                                :error-messages="error.password" 
                                @keyup="check_login"
                      />
                      <!--<v-btn color="primary" ref="button"  @click="gen_pas" small>сгенерировать пароль</v-btn>-->
                      <a href="" @click.prevent="gen_pas">сгенерировать пароль</a>
                      &nbsp;
                      <v-btn color="red" ref="button"  @click="set_password=false" small>Отменить изменение пароля</v-btn>

                    </div>
                    <div v-else>
                      <a href="" @click.prevent="set_password=1">Назначить пароль</a>
                    </div>

                    <errors :errors="errors"/>
                    <br><br>
                    <v-btn color="primary" ref="button"  @click="save()" small :disabled="!data_ok">Изменить</v-btn>&nbsp;
                    <v-btn color="red" ref="button"  @click="cancel_edit" small>Отменить</v-btn>
                  
              </template>
              <template v-else>
                <div>Email: {{login}}</div>
                <div>Фамилия: {{name_f}}</div>
                <div>Имя: {{name_i}}</div>
                <div>Отчество: {{name_o}}</div>
                <div>Телефон: {{phone}}</div>
                <v-btn color="primary" ref="button"  @click="edit_form=true" small>Изменить</v-btn>&nbsp;
              </template>
              <br>
              
  </div>
</template>
<script>
import { phone_replace, phone_check, email_check, gen_pas} from '../js/check_func.js';
export default ({
  props:['apteka'],
  created(){
    this.name_f=this.apteka.m_name_f
    this.name_i=this.apteka.m_name_i
    this.name_o=this.apteka.m_name_o
    this.phone=this.apteka.m_phone
    this.login=this.apteka.m_login
    this.check_login()
  },
  data(){
    return {
      chk_login_cnt:0,
      data_ok:true,
      edit_form:false,
      success:false,
      set_password:false,
      name_f:'',
      name_i:'',
      name_o:'',
      login:'',
      phone:'',
      password:'',
      errors:[],
      error:{
        name_f:'',
        name_i:'',
        name_o:'',
        login:'',
        phone:'',
      }
    }
  },
  methods:{
    gen_pas(){
      this.password=gen_pas()
    },
    clear_errors(){
      this.data_ok=true
      this.errors=[]
      for(let f in this.error)
        this.error[f]=''
    },
    check_login(){
      this.clear_errors()
      if(!email_check(this.login)){
        this.error['login']='Логин '+this.login+' должен является валидным адресом электронной почты'
        this.data_ok=false
      }
      else{ // логин прошёл проверку на валидность, проверяем дубли
        if(this.chk_login_cnt==0){
 
              this.chk_login_cnt++
              this.$http.post(
                BackendBase+'/anna/check-account-login',
                {
                  login:this.login,
                  id: this.apteka.m_id
                }
              ).then(
                r=>{
                  let D=r.data
                  this.chk_login_cnt--
                  if(D.success){
                    this.check_data()
                  }
                  else if(D.errors.length){
                    this.error['login']=D.errors[0]
                  }
                }
              )

          
        }

      }

    },
    check_data(){
      this.phone=phone_replace(this.phone)
      // обнуляем ошибки перед проверкой
      this.clear_errors()
      
      
      if(!phone_check(this.phone)){
        this.error['phone']='Введите номер телефона в правильном формате'
        this.data_ok=false
      }

      if(!this.name_f){
        this.error['name_f']='укажите фамилию'
        this.data_ok=false
      }
      if(!this.name_i){
        this.error['name_i']='укажите имя'
        this.data_ok=false
      }
      if(!this.name_o){
        this.error['name_o']='укажите отчество'
        this.data_ok=false
      }
      if(this.set_password){
        if(this.password.length<6){
          this.error['password']='пароль должен быть не менее 6-ти символов'
        }
      }
    },
    load_cur_manager_data(){
      this.$http.post(
        BackendBase+'/anna/get-account-data',
        {id:this.apteka.m_id}
      ).then(
        r=>{
          let D=r.data
          if(D.success){
            D=D.data
            console.log('D:',D)
            this.name_f=D.name_f
            this.name_i=D.name_i
            this.name_o=D.name_o
            this.login=D.login
            this.password=D.password
          }
        }
      )
    },
    save(){
        this.$http.post(
            BackendBase+'/anna/change-apteka-account',
            {
              manager_id:this.apteka.m_id,
              login:this.login,
              phone: this.phone,
              name_f:this.name_f,
              name_i:this.name_i,
              name_o:this.name_o,
              password:(this.set_password && this.password)?this.password:''
            }

        ).then(
          r=>{
            let D=r.data
            if(D.success){
              this.success=true
              this.edit_form=false
            }
            else{
              this.errors=D.errors
              this.load_cur_manager_data()
            }
            
          }
        ).catch(()=>{this.load_cur_manager_data()})
    },

    cancel_edit(){
      console.log('cancel')
      this.edit_form=false
      this.load_cur_manager_data()
    }
    

  }
})
</script>