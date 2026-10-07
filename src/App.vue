<template>
  <v-defaults-provider :defaults="$schemeDefaults">
    <!-- full-screen layout (без меню) -->
    <v-app v-if="isBlank">
      <router-view />
    </v-app>

    <!-- shell layout (меню + контент) -->
    <v-app id="inspire" v-else>
        <v-dialog v-model="dialog" app>
            <v-card>
              <v-card-title  class="text-h5">{{dialog_header}}</v-card-title>
              <v-card-text>{{dialog_body}}</v-card-text>
              <v-card-actions>
                <div class="flex-grow-1"></div>
                <v-btn color="red-darken-1" @click="dialog=false">Закрыть</v-btn>
              </v-card-actions>
            </v-card>
        </v-dialog>
        <v-navigation-drawer v-model="drawer" app >
          <left_menu
            :manager="manager"
            :left_menu="left_menu"
            :drawer="drawer"
            :setMenuItemParams="setMenuItemParams"
            :setDriwer="setDriwer"
            :setMenuItem="setMenuItem"
          />
        </v-navigation-drawer>

        <v-app-bar app  >
          <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
          <v-toolbar-title >
            <a href="/"><v-icon size="small">fa fa-home</v-icon>&nbsp; {{title}}</a>
          </v-toolbar-title>
          <Messenger v-if="false" :config="app_components.navigator" :manager="manager"/>
        </v-app-bar>

        <v-main>
          <div class="fill-height" fluid>
            <errors :errors="errors" />
            <router-view />
          </div>
        </v-main>
        <v-footer class="app-footer" app>
          <span :style="{color: 'rgb(var(--v-theme-text-on-primary))'}" >&copy; {{copyright}}
            | <a :href="m.url" :target="m.target" v-for='(m,idx) in bottom_menu' :style="{color: 'rgb(var(--v-theme-text-on-primary))'}">{{m.header}}</a>
          </span>
        </v-footer>
  </v-app>
    <Lightbox />
  </v-defaults-provider>
</template>

<script>
let self=null
const menu_params_parse=list=>{
  if(!Array.isArray(list)) return list
  for(let m of list){
      if(m.params && typeof(m.params)=='string'){
        try {
          m.params=JSON.parse(m.params)
        }
        catch(error){
          let err_str=`ошибка при парсинге параметров в пункте меню ${m.header} (${m.params})`
          self.errors.push(err_str)
        }
      }
      // child опционален: пункт меню может быть листовым (conf_projects/*/left_menu.py)
      if(m.child && m.child.length){
        m.child=menu_params_parse(m.child)
      }
      else if(!m.child){
        m.child=[]
      }
  }
  return list
}

import MainPage from './MainPage';
import LeftMenu from './LeftMenu';
import Lightbox from './components/Lightbox.vue';

export default {
        components:{
          'mainpage':MainPage,
          'left_menu':LeftMenu,
          'Lightbox':Lightbox,
        },
        data: () => ({
          logo_url:import.meta.env.BASE_URL+'logo.png',
          drawer:true, // вкл / выкл левое меню
          active:{},
          dialog:false,
          dialog_header:'',
          dialog_body:'',
          copyright: '',
          left_menu:[],
          bottom_menu:[],
          title:'',
          MenuItem:{type:'vue',value:'mainpage'},
          MenuItemParams:{},
          errors:[],
          manager:{},
          app_components:{}
        }),
        computed: {
           route(){ return this.$route },
           isBlank(){ return this.$route.meta && this.$route.meta.blank === true },
        },
        created(){
          self=this
          window.app=this
          window.toggle=(sel)=>{
            let el=document.querySelector(sel)
            if(el){
              el.style.display=(el.style.display=='none')?'':'none'
            }
            return false
          }

          if(!this.isBlank){
            this.$http.get(BackendBase+'/startpage').then(
              r=>{
                let D=r.data;

                if(D.bottom_menu)
                  this.bottom_menu=D.bottom_menu

                if(D.redirect && D.redirect!=location.pathname){
                  localStorage.setItem('link_prev_login',location.href)
                  location.href=D.redirect;
                  return ;
                }

                if(D.success){
                    if(D.left_menu_controller)
                      this.load_menu(D.left_menu_controller)
                    if(D.left_menu)
                      this.left_menu=menu_params_parse(D.left_menu)
                    this.manager=D.manager;

                    if(D.startpage){
                      this.MenuItem=D.startpage
                    }
                    if(D.app_components){
                      this.app_components=D.app_components
                    }
                }
                this.$nextTick(()=>{
                    this.copyright=D.copyright, document.title=this.title=D.title;
                });
                this.errors=D.errors;

              }
            ).catch(e => {
              this.dialog_header='Ошибка сети';
              this.dialog_body='произошла ошибка '+e+'. пожалуйста повторите попытку позже';
              this.dialog=true;
            });
          }
        },
        methods: {
          load_menu(url){
            this.$http.get(BackendBase+url).then(
              r=>{
                let D=r.data;
                if(D.success){
                  this.left_menu=menu_params_parse(D.left_menu)
                }
                else{
                  this.errors=D.errors
                }
              }
            )
          },
          link_to_profil(){
            if(this.manager){
              return this.manager.link
            }
            else
              return ''
          },
          current_name(){
            if(this.manager){
              return this.manager.name
            }
            else
              return ''
          },
          setMenuItemParams(v){
            this.MenuItemParams=v
          },
          setDriwer(v){
            this.drawer=v
          },
          setMenuItem(v){
            this.MenuItem=v
          },
          set_active_manager_menu(params){
            let element=params.element;
            let config=params.config?params.config:'';
            let menu=params.menu?params.menu:this.left_menu

            for(let m of menu){
              if(m.type && m.type=='vue' && m.value && m.value==element){
                m.isActive=true;
                if(params.parent){
                  params.parent['model']=true;
                  return true;
                }
                return true;
              }
              if(m.child && m.child.length>0){
                if(this.set_active_manager_menu({element:element,config:config,parent:m,menu:m.child})){
                   m.model=true;
                }
              }
            }
            return false;
          },
        }
}
</script>
<style lang="scss">
@use './styles/main' as *;
.app-footer {
    background-color: rgb(var(--v-theme-primary)) !important;
  }
  .v-application .error {background-color: white !important;}
  /* настройка полосы прокрутки */
  ::-webkit-scrollbar {
      width: 8px;
  }
  ::-webkit-scrollbar-thumb {
    -webkit-border-radius: 0px;
    border-radius: 0px;
    background-color:rgb(var(--v-theme-primary-lighten-2));
  }
  .v-app-bar {
    background-color:rgb(var(--v-theme-primary))  !important;
    color: rgb(var(--v-theme-text-on-primary));
  }
  .v-app-bar .v-btn{
    color: rgb(var(--v-theme-text-on-primary));
  }

  h1 {color: rgb(var(--v-theme-primary));}
  h2 {color: rgb(var(--v-theme-primary));}
  .v-toolbar-title {font-size: 1rem; color: rgb(var(--v-theme-text-on-primary)); font-weight: bold; vertical-align: bottom;}
  header .v-toolbar-title .v-icon {color: rgb(var(--v-theme-text-on-primary)) !important; position: relative; top: -2px; margin-right: 10px;}
  header .v-toolbar-title a {color: rgb(var(--v-theme-text-on-primary)) !important; text-decoration: none;}
  .not_underline {text-decoration: none;}

  .v-application .err  {background: #fff0; background-color: #fff0;  color: red; margin-bottom: 5px;}
  .v-application .succ  {background: #fff; background-color: #fff !important;  color: green; margin-bottom: 5px;}

  /* Сообщения поля: держим сразу под контролом, без больших отступов */
  .v-application .field .err,
  .v-application .field .warn {
    margin: 2px 0 0;
    padding: 0;
    line-height: 1.25;
    font-size: var(--app-font-help);
    background: transparent;
  }
  .v-application .field .warn {color: #b26a00;}
  .v-application .field .add_description {
    margin: 2px 0 0;
    color: rgba(var(--v-theme-on-surface), 0.65);
    font-size: var(--app-font-help);
    line-height: 1.25;
  }
  .v-application .field .v-input--error {margin-bottom: 0 !important;}
  .v-application .block .field {margin: 0 0 var(--app-space-field) 0;}
  .v-application .block .field .v-input {margin-bottom: 0;}

  .v-select-list .v-list-item-title {font-size: 12px;}

  input, .v-field__input {font-size: 12px !important;}
  .v-list-item-title, .v-field__input {font-size: 12px;}
  .v-label, .v-input {font-size: var(--app-font-label) !important; margin-bottom: 10px;}
  .v-field--rounded .v-field {
    border: 1px solid black;
    padding-left: 3px;
    border-radius: 5px !important;
    margin-top: 4px;
  }

  .v-field-label--floating {
    font-size: calc(var(--app-font-label) - 2px) !important;
    font-weight: bold;
    color: rgb(var(--v-theme-primary)) !important;
  }
  .v-field__prepend-inner {width: 50px;}
  img.logo {max-height: 50px;  margin: 0px 20px 0 0;}
  .v-toolbar-title .header {text-align: center;vertical-align: top; margin-top: 8px; font-size: 20px; display: inline-block;}

  .v-textarea textarea{
    line-height: 1.1rem !important;
  }

  .v-textarea .v-field__input{
    padding:  8px 5px !important;
  }

  @media only screen and (max-width: 800px) {
    img.logo {height: 20px; ; margin: 0;}
    .v-toolbar-title .header {text-align: center; margin-top: 0px; font-size: 12px; display: block;}
  }

</style>
