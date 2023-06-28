<template>
    <div>

        <div class="cur_profile">
          <div style="display: inline-block; min-width: 165px;">
            <v-avatar size=24><v-icon small color="primary">fa-user-edit</v-icon></v-avatar>
            <!--<a :href="manager.link" target="_blank">{{manager.login}}</a>-->
            <span class="manager_login">{{manager.login}}</span>
          </div>
          <v-btn class="logout" @click.prevent="logout()" small>выйти</v-btn>
          
        </div>

        <div class="left_menu">
          <left_menu_item v-for="m in left_menu" 
            :item="m"
            :get_link="get_link"
            :go_link="go_link"
            :manager="manager"
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
      addEventListener("popstate",(e)=>{
            
            let item=e.state
            if(item){
              console.log('popstate:',e.state)
              //this.setMenuItem(item,)
              this.go_link(item,true)
            }

            //s.setMenuItem(item)
            
            //console.log('EventListener: ', location.pathname+location.search)
            this.go_link(item,true)
            //go(location.pathname+location.search);
      })
      
    },
    methods:{
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

            if(document.body.clientWidth<800)
               this.setDriwer(false);
            console.log('BEFORE:',item)
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
               
                history.pushState(item, item.header, this.get_link(item))
              }
            }

            console.log('CUR_STATE: ',window.history)
        },
        get_link(item){
            let params={};
            if(item.params)
                params=item.params;
            if(item.type=='vue'){
                let UrlPrefix=config.UrlPrefix
                if(item.value=='mainpage')
                  return UrlPrefix+'/'
                
                if(item.value=='const'){
                  return UrlPrefix+'/vue/const/'+params.config
                }
                if(item.value=='documentation')
                  return UrlPrefix+'/vue/documentation/'+params.config
                
                if(item.value=='VideoList')
                  return UrlPrefix+'/vue/video_list/'+params.config

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
              //return '#src:'+item.value+':'+item.id
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
  .left_menu {
    margin-top: 10px;    
  }
    @import '@/styles/variables.scss';
  .cur_profile {
    height: 65px;
    border-bottom: 1px solid gray;
    padding: 10px 0 10px 0;
    background-color: $darken1;
    display: table;
    width: 100%;
  }
  .cur_profile .v-avatar {background-color: white; font-size: 8px; margin: 10px;}
  .cur_profile .v-icon {color :#fff;  }
  .cur_profile .v-btn.v-size--small {
    font-size: 10px; background-color: $primary !important;
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
  .v-application .left_menu .v-treeview-node__label:hover,  .v-application .left_menu .v-treeview-node__label a:hover{
    color: $primary !important;
  }
</style>