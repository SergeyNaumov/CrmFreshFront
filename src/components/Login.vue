<template>
  <v-app>
        <v-container>
            <v-card max-width="344" class="mx-auto auth">
                <v-card-title  class="headline">
                  Авторизуйтесь
                </v-card-title>
                <v-card-text>
                  <v-text-field :label="show_labels?'Ваш логин':''" v-model="login"  id="login"/>
                  <v-text-field :label="show_labels?'Пароль':''" type="password" v-model="password" id="password"/>
                  <div class="err" v-if="errors.length">
                      <div v-for="e in errors" :key="e">{{e}}</div>
                  </div>
                </v-card-text>
                <v-card-actions>
                  <v-btn color="primary" ref="button" :disabled="submit_disabled" @click="on_login()" small>Войти</v-btn>&nbsp;
                  <div>
                    <small><a href="/register">регистрация в системе</a></small>&nbsp;
                    <small><a href="/remember">забыли пароль?</a></small>
                  </div>
                </v-card-actions>

            </v-card>
        </v-container>

  </v-app>
</template>

<script>

export default {
        data: () => ({
          show_labels:true,
          login:'',
          password:'',
          dialog:true,
          errors:[]
        }),
        mounted () {
            setTimeout(
               ()=>{ // для того, чтобы не было глюков с автоподстановкой логина и пароля при отображении
                
                  let l=document.querySelectorAll('.auth label');
                  l[0].classList.add('v-label--active');
                  l[1].classList.add('v-label--active');
                  document.getElementById('login').focus();
               },1

            )
        },

        created(){
          
        },
        watch:{
          login(){
            this.errors=[]
          },
          password(){
            this.errors=[]
          }
        },
        methods: {
          on_login(){
            this.$http.post(
              BackendBase+'/login',
              {
                login:this.login,
                password:this.password
              }
            ).then(
              response=>{
                let D=response.data;
                if(D.success){
                  let prev_login=localStorage.getItem('link_prev_login')
                  location.href=prev_login?prev_login:'/'
                }

                
                this.errors=D.errors
                
              }
            )
          }
        },

        computed: {
          submit_disabled(){
            if(this.errors.length || !this.login || !this.password)
              return true
            else 
              return false

          }
        }
}
</script>
<style scope>
  .auth .err{ color: red; background-color: white;}
  body {margin-top: 10%;}
</style>



