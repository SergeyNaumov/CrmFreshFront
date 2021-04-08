<template>
  <v-app>
        <v-container>
            <v-card max-width="344" class="mx-auto auth">
                
                <v-card-title  class="headline">
                  Напоминание пароля 
                </v-card-title>

                <template v-if="step==0">
                    <v-card-text>
                    <v-text-field :label="show_labels?'Ваш логин':''" v-model="login"  id="login"/>
                    </v-card-text>
                    <v-card-actions>
                    <v-btn color="primary" ref="button" :disabled="!login_ok" @click="remember()" small>Напомнить пароль</v-btn>
                    
                    </v-card-actions>
                </template>
                <template v-else-if="step==1">
                    <v-card-text>
                        <p>Мы отправили на Ваш Email код доступа для восстановления пароля. Пожалуйста, укажите его здесь, либо перейдите по ссылке из письма</p>
                        <v-text-field :label="show_labels?'Код доступа':''" v-model="remember_code"  id="login"/>
                    </v-card-text>
                    <v-card-actions>
                    <v-btn color="primary" ref="button" :disabled="!remember_code" @click="check_remember_code()" small>Восстановить пароль</v-btn>

                    </v-card-actions>
                </template>
                <template v-else-if="step==2">
                    <v-card-text>
                        <p>Отлично, проверочный код подошёл, теперь задайте новый пароль</p>
                        
                        <v-text-field label="Новый пароль" type="password" v-model="pass1" @keyup="check_pass_ok" />
                        <v-text-field label="Новый пароль (ещё раз)" type="password" v-model="pass2" @keyup="check_pass_ok" />
                        <div class="err">{{pass_err}}</div>
                        <errors :errors="errors" />
                    </v-card-text>
                    
                    <v-card-actions>
                        
                    <v-btn color="primary" ref="button" :disabled="!pass_ok" @click="change_password()" small>Изменить старый пароль</v-btn>

                    </v-card-actions>
                </template>
                <template v-else-if="step==3">
                    <v-card-text>
                        <p>Поздравляем, Ваш пароль изменён</p>
                        <a href="/login">перейти к авторизации</a>
                    </v-card-text>
                    
                    <v-card-actions>
                        
                    <v-btn color="primary" ref="button" :disabled="!pass_ok" @click="change_password()" small>Изменить старый пароль</v-btn>

                    </v-card-actions>
                </template>
            </v-card>
        </v-container>

  </v-app>
</template>

<script>

export default {
        data: () => ({
          show_labels:true,
          login:'',
          pass1:'',
          pass2:'',
          pass_ok:false,
          pass_err:'', // сообщение об ошибке а-ля "пароли не совпадают"
          remember_code:'',
          step:0,
          id:'',
          dialog:true,
          errors:[]
        }),
        mounted () {
/*            setTimeout(
               ()=>{ // для того, чтобы не было глюков с автоподстановкой логина и пароля при отображении
                
                  let l=document.querySelectorAll('.auth label');
                  l[0].classList.add('v-label--active');
                  l[1].classList.add('v-label--active');
                  document.getElementById('login').focus();
               },1

            )*/
        },

        created(){
            // убрать, для теста
          this.check_pass_ok()
        },
        watch:{
            step(){
                this.errors=[]
                this.pass1=''
                this.pass2=''
            },
            login(){
                this.errors=[]
            },
        },
        methods: {
          remember(){ // получаем проверочный код
            this.$http.post(
              BackendBase+'/remember/get-access-code',
              {
                login:this.login              }
            ).then(
              r=>{
                let D=r.data
                if(D.success) this.step=1
                this.errors=D.errors
                
              }
            )
          },
          check_remember_code(){ // проверяем, есть ли такой код в системе
              this.$http.post(
                  BackendBase+'/remember/check-access-code',
                  {
                      remember_code: this.remember_code
                  }
              ).then(
                  r=>{
                    let D=r.data
                    if(D.success){
                        this.step=2
                        this.id=D.id
                    }
                  }
              )
          },
          check_pass_ok(){
              
            if(this.pass1 && this.pass2){
                
                if( !(this.pass1 == this.pass2) ){
                    this.pass_err='пароли не совпадают'
                    
                }
                else if(!/^[a-zA-Z0-9\.\-#@\!%\^,\?;\]\[\{\}\(\)\s\*&]+$/.test(this.pass1)){ // !@#\-\.\$%\^&*\(\)
                    this.pass_err='недопустимые символы, проверьте раскладку'
                }
                else if(this.pass1.length < 8){
                    this.pass_err='длина пароля не должна быть менее 8-ми символов'
                }
                else{
                    this.pass_ok=true
                    this.pass_err=''
                    return
                }
                
            }
            this.pass_ok=false

          },
          change_password(){
              this.$http.post(
                  BackendBase+'/remember/change-password',
                  {
                      id: this.id,
                      remember_code: this.remember_code,
                      password: this.pass1
                  }
              ).then(
                  r=>{
                    let D=r.data
                    if(D.success) this.step=3
                    else
                        this.errors=D.errors
                  }
              )
          }
        },

        computed: {
          login_ok(){
              // нет никакой необходимости проверять на email, поскольку логин может быть любым
              
              return true
              //return /^[a-zA-Z0-9\-_\.]+@[a-zA-Z0-9\-_\.]+\.[a-zA-Z0-9\-_\.]+$/.test(this.login)
          }
        }
}
</script>
<style scope>
  .auth .err{ color: red; background-color: white;}
  body {margin-top: 10%;}
</style>



