<template>
  <div>
    <v-app v-if="headapp">

        <component v-show="headapp" v-bind:is="headapp" is_headapp="1" :params="headapp_params"></component>
    </v-app>
     
  <v-app id="inspire" v-else>
        <v-dialog v-model="dialog" app>
            <v-card>
              <v-card-title  class="headline">{{dialog_header}}</v-card-title>
              <v-card-text>{{dialog_body}}</v-card-text>
              <v-card-actions>
                <div class="flex-grow-1"></div>
                <v-btn color="red darken-1" @click="dialog=false">Закрыть</v-btn>
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

        <v-app-bar app  > <!--color="darken1"-->
          
          <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
          <v-toolbar-title >
            {{title}}
            <!--<a href="/"><img align="absmiddle" class="logo" :src="logo_url"></a> -->
          </v-toolbar-title>
          
          
        </v-app-bar>

        <v-main>
          <div class="fill-height" fluid>
            <errors :errors="errors" />
            <!-- vuecomponent -->
            <pre v-if="0">{{MenuItem}}</pre>

            <template v-if="MenuItem.type == 'vue'">

              <component 
                :is="load_component(MenuItem.value)"
                :params="MenuItemParams"
                style="margin-bottom: 20px;"
              />
            </template>

            <!-- iframe -->
            <template v-if="MenuItem.type=='src'">
              <iframe  style="width: 100%; height: 100%; border: none;" :src="MenuItem.value"></iframe>
            </template>
            
          </div>

        </v-main>
        <v-footer class="app-footer" app>
          <span class="white--text" >&copy; {{copyright}}
            | <a :href="m.url" :target="m.target" v-for='(m,idx) in bottom_menu' style="color: white;">{{m.header}}</a>
          </span>
          
        </v-footer>
  </v-app>
      
  </div>
</template>

<script>

const menu_params_parse=list=>{
  for(let m of list){
  
      if(m.params && typeof(m.params)=='string'){
          m.params=JSON.parse(m.params)
      }
      if(m.child.length){
        m.child=menu_params_parse(m.child)
      }
    
  }
  return list
}
//import EditForm from './components/EditForm';
import MainPage from './MainPage';
import LeftMenu from './LeftMenu';
import { get_headapp } from './js/app';


export default {
        components:{
          'mainpage':MainPage,
          'left_menu':LeftMenu,
          
        },
        data: () => ({
          logo_url:process.env.BASE_URL+'logo.png',
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
          headapp:'',
          headapp_params:{},
          errors:[],
          manager:{},
          
        }),
        mounted () {
           //console.log('env:',process.env)
        },
        created(){
          
          let self=this
          window.app=this
          get_headapp(self)
          window.onhashchange=e=>{
            get_headapp(self);
          }


          

          
          if(!this.headapp){
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
                    //this.left_menu=D.left_menu,
                    if(D.left_menu_controller)
                      this.load_menu(D.left_menu_controller)
                    if(D.left_menu)
                      this.left_menu=D.left_menu
                    this.manager=D.manager;

                    if(D.startpage){
                      this.MenuItem=D.startpage
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
                  //this.left_menu=D.left_menu
                  get_headapp(this);
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
            console.log('St')
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
                  
                  //m.model=true;
                  
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

          load_component(component){
              if(component=='table')
                return 'table_component'

              return component;
          }
        },

        computed: {
           imageHeight () {
             switch (this.$vuetify.breakpoint.name) {
               case 'xs': return '220px'
               case 'sm': return '400px'
               case 'md': return '500px'
               case 'lg': return '600px'
               case 'xl': return '800px'
             }
           }
        }
}
</script>
<style lang="scss">
@import '@/styles/main.scss'; 
  .app-footer {
    background-color: $primary !important;
  }
  .v-application .error {background-color: white !important;}
  $color-pack: false;
  /* настройка полосы прокрутки */
  ::-webkit-scrollbar {
      width: 8px;
  }
  ::-webkit-scrollbar-thumb {
    -webkit-border-radius: 0px;
    border-radius: 0px;
    background-color:$lighten2;
  }
  .v-app-bar {
    background-color:$primary  !important;
    color: $text_on_primary;
  }
  .v-app-bar .theme--light.v-btn.v-btn--icon{
    color: $text_on_primary;
  }

  h1 {color: $primary;}
  h2 {color: $primary;}
  .v-toolbar__title {font-size: 1rem; color: $text_on_primary; font-weight: bold;}
  
  .not_underline {text-decoration: none;}

  
  .v-application .err  {background: #fff; background-color: #fff;  color: red; margin-bottom: 5px;}
  .v-application .succ  {background: #fff; background-color: #fff !important;  color: green; margin-bottom: 5px;}
  
  .v-select-list .v-list-item__title {font-size: 12px;}
  
 
  input, .v-select__selections [type=text] {font-size: 14px !important;}
  .v-list-item__content, .v-select__slot {font-size: 14px;}
  .v-label, .v-input {font-size: 14px !important; margin-bottom: 10px;}
  .v-text-field--rounded .v-input__control {
    border: 1px solid black; 
    padding-left: 3px;
    border-radius: 5px !important;
    margin-top: 4px;
    
  }

  .v-input__slot .v-label--active {
    font-weight: bold;
    border-bottom: 1px solid white;
    background-color: white;
  }
  .v-input__prepend-outer {width: 50px;}
  img.logo {max-height: 50px;  margin: 0px 20px 0 0;}
  .v-toolbar__title .header {text-align: center;vertical-align: top; margin-top: 8px; font-size: 20px; display: inline-block;}


  @media only screen and (max-width: 800px) {
    img.logo {height: 20px; ; margin: 0;}
    .v-toolbar__title .header {text-align: center; margin-top: 0px; font-size: 12px; display: block;}
  }

</style>