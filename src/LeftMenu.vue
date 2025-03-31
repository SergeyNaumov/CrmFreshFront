<template>
    <div>
      <v-dialog v-model="dialog" max-width="800">
        <v-card>
          <v-card-title  class="headline">Привязка Telegram</v-card-title>
          <v-card-text>

            <template v-if="manager.telegram_id">
              Ваш Telegram @{{manager.telegram_login}} уже привязан к CRM
            </template>
            <template v-else>
              <p>Привязать telegram можно по ссылке:<br>
                <a :href="manager.tg_link" target="_blank">{{manager.tg_link}}</a>
              </p>

              <p class="mt-1">После того, как Вы сделаете это, Вам будут приходить уведомления</p>
            </template>

          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>

            <v-btn
              text="Закрыть"
              @click="dialog = false"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

        <div class="cur_profile" style="white-space: nowrap; min-width: 165px;">
          <div style="">
            <v-avatar size="24"><fa large color="primary" icon="fa-user"/></v-avatar>
            <template v-if="manager.out_manager_card_link">
                <a :href="manager.link" target="_blank">{{manager.login}}</a>
                
                <div class="role" v-if="manager.role_login">&nbsp;(роль: {{manager.role_login}})</div>
            </template>
            <template v-else>
              <span class="role">{{manager.login}}</span>
            </template>
          </div>
          <v-btn class="logout ml-2 mr-2" @click.prevent="link_telegram" x-small>
                <div :class="{tg_indicator_on: manager.telegram_id , tg_indicator_off: !manager.telegram_id }" ></div> Telegram
          </v-btn>
          
          <v-btn x-small class="logout" @click.prevent="logout()">выйти</v-btn>
          
        </div>

        <div class="left_menu">
          <left_menu_item v-for="m in left_menu" 
            :item="m"
            :get_link="get_link"
            :go_link="go_link"
            :manager="manager"
            :key="m.id"
          />
        </div>

    </div>    
</template>
<script>
import { toRaw } from 'vue';

import left_menu_item from './components/left_menu_item';
export default{
    components:{
      'left_menu_item':left_menu_item
    },
    props:['left_menu','manager','drawer','setDriwer','setMenuItemParams','setMenuItem'],
    data(){
        return {
          dialog:false
        }
    },
    created(){
      window.addEventListener("popstate",(e)=>{
            
            let item=e.state
            if(item){
              this.go_link(item,true)
            }
            this.go_link(item,true)
            //go(location.pathname+location.search);
      })
      
    },
    methods:{
      link_telegram(){
        this.dialog=true
      },
      logout(){
            this.$http.get(BackendBase+'/logout').then(
                response=>{
                  let D=response.data;
                  if(D.success){
                      location.href=config.UrlPrefix+'/login'
                  }
                }
            )
      },
      go_link:function(item, not_push_state=false){
            item=toRaw(item)
            if(!item){
              return;
            }
            if(document.body.clientWidth<800)
               this.setDriwer(false);
            
            if(item && item.type=='newtab'){
              window.open(item.value, '_blank');
              window.focus();
            }
            else{

              if(item.params){
                this.setMenuItemParams(item.params);
              }
              this.setMenuItem(item)
              if(!not_push_state){
                console.log('item:',item, 'header:',item.header, 'link:', this.get_link(item) )
                //history.pushState(state, item.header, this.get_link(item));
                history.pushState(item, item.header, this.get_link(item))
              }
            }

      },
      get_link(item){
          let params={};
          let UrlPrefix=config.UrlPrefix
          
          if(item.params)
              params=item.params;
          if(item.type=='vue'){
              
              if(item.value=='mainpage')
                return UrlPrefix+'/'
              
              if(item.value=='const'){
                return UrlPrefix+'/vue/const/'+params.config
              }
              if(item.value=='documentation')
                return UrlPrefix+'/vue/documentation/'+params.config
              
              if(item.value=='VideoList')
                return UrlPrefix+'/vue/video_list/'+params.config
              if(item.value=='stat-tool'){
                return UrlPrefix+'/vue/stat-tool/'+params.config
              }
              if(item.value=='admin-table')
                return UrlPrefix+'/vue/admin_table/'+params.config
              if(item.value=='admin-tree')
                return UrlPrefix+'/vue/admin_tree/'+params.config
              if(item.value=='parser-excel')
                return UrlPrefix+'/vue/parser-excel/'+params.config
              if(item.value=='Schedule')
                return UrlPrefix+'/vue/Schedule/'+params.config
              if(item.value=='table')
                return UrlPrefix+'/vue/table/'+params.config
          }
          if(item.type=='src'){
            
            if(item.id){
              return UrlPrefix+'/src:'+item.value
            }
            else{
              return item.value
            }
            
          }

          return ''
      },

    }
}
</script>
<style lang="scss" scoped>
@import '@/styles/variables.scss';
  .tg_indicator_on {
    background-color: green;
    display: inline-block;
    min-width: 10px;
    height: 10px;
    margin-right: 5px;
    border-radius: 5px;
  }
  .tg_indicator_off {
    background-color: red;
    display: inline-block;
    min-width: 10px;
    height: 10px;
    margin-right: 5px;
    border-radius: 5px;
  }
  .left_menu {
    margin-top: 10px;    
  }
    
  .cur_profile {
    height: 90px;
    border-bottom: 1px solid gray;
    padding: 10px 0 10px 0;
    background-color: $darken1;
    display: table;
    width: 100%;
    
  }
  .cur_profile a{
    font-weight: normal !important;
    font-size: 0.9rem;
  }
  .cur_profile .role {
    font-size: 0.9rem !important;
    display: block;
    color: #fff;
    margin: 0px 0 10px 10px;
  }
  .cur_profile .v-avatar {background-color: white; font-size: 8px; margin: 10px;}
  .cur_profile .v-icon {color :#fff;  }
  .cur_profile .v-btn.v-size--small {
    font-size: 10px; background-color: $primary !important;
    border: 1px solid #fff;
    color: #fff;
    margin-left: 10px;
  }
  
  .manager_login {
    color: white;
    font-size: 0.9rem;
    font-weight: bold;
  }
  .v-application .cur_profile a{color: white; text-decoration: none; font-weight: bold;} 
  
  /*.v-treeview a{color: black; }*/
  
  .v-application .left_menu, .v-application .left_menu a {
    
    text-decoration: none;
    font-size: 12pt;
  }
  .v-application .left_menu .v-treeview-node__label:hover,  .v-application .left_menu .v-treeview-node__label a:hover{
    color: $primary !important;
  }
</style>