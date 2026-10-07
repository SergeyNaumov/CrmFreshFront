<template>
    <div>

        <div class="cur_profile">
          <div style="display: inline-block; min-width: 165px;">
            <v-avatar size=24><v-icon size="small" color="primary">fa-user-edit</v-icon></v-avatar>
            <template v-if="manager.out_manager_card_link">
                <a :href="manager.link" target="_blank">{{manager.login}}</a>

                <small class="manager_login" v-if="manager.role_login">&nbsp;(роль: {{manager.role_login}})</small>
            </template>
            <template v-else>
              <span class="manager_login">{{manager.login}}</span>
            </template>
            
            
          </div>
          <v-btn class="logout" @click.prevent="logout()" size="small">выйти</v-btn>
          
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
import left_menu_item from './components/left_menu_item';
export default{
    components:{
      'left_menu_item':left_menu_item
    },
    props:['left_menu','manager','drawer','setDriwer','setMenuItemParams','setMenuItem'],
    data(){
        return {

        }
    },
    created(){
    },
    methods:{
        logout(){
            this.$http.get(BackendBase+'/logout').then(
                response=>{
                  let D=response.data;
                  if(D.success){
                      // реальный URL: базовый префикс сборки (/manager/), т.к. без него это уже сайт
                      location.href=(window.BaseUrl||'/')+'login'
                  }
                }
            )
        },
        go_link:function(item, not_push_state=false){

            if(document.body.clientWidth<800)
               this.setDriwer(false);

            if(item && item.type=='newtab'){
              window.open(item.value, '_blank');
              window.focus();
              return;
            }

            let link = this.get_link(item);
            if(!link) return;
            // get_link отдаёт полный URL с базой сборки (/manager/), а vue-router
            // сам добавляет base -> перед push срезаем базу, иначе двойной префикс.
            link = this.to_router_path(link);

            this.setMenuItemParams(item.params || {});
            this.setMenuItem(item);

            if(not_push_state)
              this.$router.replace(link);
            else
              this.$router.push(link);
        },
        to_router_path(link){
            const b1 = window.BaseUrl || '/';       // '/manager/' на проде, '/' локально
            const b0 = b1.replace(/\/$/,'');        // '/manager' или ''
            if (b1 !== '/' && link.indexOf(b1) === 0)
                return '/' + link.slice(b1.length);
            if (b0 && link.indexOf(b0) === 0)
                return link.slice(b0.length) || '/';
            return link;
        },
        get_link(item){
            let params={};
            let UrlPrefix=(window.BaseUrl||'/').replace(/\/$/,'') // '' локально, '/manager' на проде
            
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
                if(item.value=='filenavigator')
                  return UrlPrefix+'/vue/filenavigator/'+params.config
                if(item.value=='svcmsadmin-createproject')
                  return UrlPrefix+'/vue/svcmsadmin-createproject'
            }
            if(item.type=='src'){
              return UrlPrefix+'/src:'+item.value
            }

            return ''
        },

    }
}
</script>
<style lang="scss" scoped>
  .left_menu {
    margin-top: 10px;    
  }
  .cur_profile {
    height: 65px;
    border-bottom: 1px solid gray;
    padding: 10px 0 10px 0;
    background-color: rgb(var(--v-theme-primary-darken-1));
    display: table;
    width: 100%;
  }
  .cur_profile .v-avatar {background-color: white; font-size: 8px; margin: 10px;}
  .cur_profile .v-icon {color :#fff;  }
  .cur_profile .v-btn.v-btn--size-small {
    font-size: 10px; background-color: rgb(var(--v-theme-primary)) !important;
    border: 1px solid #fff;
    color: #fff;
    font-weight: bold;
    margin-left: 10px;
  }
  .cur_profile button {
    margin: 0; font-size: 10px;
    
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
</style>