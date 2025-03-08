<template>       
  <div class="main">
      <errors :errors="errors" v-if="errors.length" />
      <v-row  no-gutters class="manager_panel" >
        <v-col class="p1" cols="12" sm="6" md="6" style="padding: 5px;">
          <!--
            <a href=""><v-icon small color="primary">fa-user-alt</v-icon></a>
            <a :href="manager.link">{{manager.name}}</a>
          -->
          
            <v-icon small color="primary">fa-user-alt</v-icon>
            {{manager.name || manager.login}}
            
          

        </v-col>

        <v-col class="p3"  cols="12" sm="6" md="6">
          <v-icon small color="primary">fa-calendar-alt</v-icon> {{curdate}}
        </v-col>
      </v-row>
      <v-row>
        
        <v-col  v-for="(c,idx) in list_components" :cols="c.cols" :key="`maincomponent_${idx}`">
          
          <component :is="c.component"  />
          
        </v-col>
      </v-row>
      <!-- Блок для информации о регистрационных данных 
        <RegDataBlock/>
        (позже нужно будет перетащить из Anna)
      -->
      

      <!-- Блок для проекта "Анна" -->
      
      
      <!-- Блок новостей
      <div v-if="news_list.length">
        <h1>Новости</h1>
        <v-card class="news">
          <div class="item" v-for="(n,idx) in news_list" :key="'newsitem'+idx">
            <v-row>
              <v-col cols="12" sm="12" md="10" class="header">{{n.header}}</v-col>
              <v-col cols="12" sm="12" md="2" class="reg"><v-icon small color="primary">fa-calendar-alt</v-icon> {{n.registered}}</v-col>
            </v-row>
            <div class="body" v-html="n.body" />
            <hr/>
          </div>
        </v-card>
      </div>
      -->
  </div>
</template>
<script>


//import Vue from 'vue'
import BirthDays from './components/BirthDays';
import Notifications from './components/Notifications';
//import LinkTelegram from './components/MP/LinkTelegram';
import ManagerLoad from './components/MP/ManagerLoad';

export default {
  components: {
    'birth-days': BirthDays,
    'notifications': Notifications,
    //'link-telegram': LinkTelegram,
    'manager-load': ManagerLoad
  },
  props:[],
  data(){
    return {
      curdate: '',
      errors:[],
      list_components:[],
      manager:{
        login:'',
        id:'',
        link:'',
        name:'',
      },
      news_list:[

      ]
    }
  },
  created(){
    let t=this
    t.$http.get(BackendBase+'/get-events').then(
      response=>{
        let D=response.data;
      }
    )

    t.$http.get(BackendBase+'/mainpage').then(
      response=>{
        let D=response.data;
        if(D.success){
          t.news_list=D.news_list

          t.manager=D.manager, t.curdate=D.curdate;
          if(D.main_page_components){
            t.list_components=D.main_page_components
          }
        }
        if(D.errors){
          this.errors=D.errors
        }
        

        
      }
    )
  }

}
</script>
<style scope lang="scss">
  @import '@/styles/variables.scss';
  
  .main {
    height: 100%;
    padding: 20px;
    max-width: 1200px;
  }
  .main h1 {color: black; margin-top: 20px;}
  .v-card.news {
    padding: 20px;
  }
  .news .item .header {font-weight: bold; color: $primary;}
  .news .item .reg {text-align: right;}
  .news .item hr {border-bottom: 1px solid gray;}
  .manager_panel {
    margin: 20px;
    border: 1px dotted gray;
    margin-bottom: 20px;
    border-radius: 30px;
    padding:0;
    min-height: 40px;
    

  }
.manager_panel .p1, .manager_panel .p2, .manager_panel .p3{
  padding: 10px !important; 
}
  .manager_panel .p1{
    font-weight: bold;
    color: $primary; 
    padding-left: 20px;

  }
  .manager_panel .p1 .v-icon {
    margin-right: 10px;
    
    
  }
  .manager_panel .p2{
    border-left: 1px dotted gray;
    border-right: 1px dotted gray;
    padding-left: 10px;
    position: relative; 
    top: 0;
  }
  .manager_panel .p3{
    text-align: right;
    font-weight: bold;
    
  }
  .manager_panel .p3 .v-icon{
    margin-right: 5px;
    

  }
  .v-avatar {
    background-color: $primary;
    font-size: 8px; margin: 10px;
    
  }
  .v-avatar .v-icon  {color: white;}
  
@media only screen and (max-width: 800px){
  .manager_panel {border: none};
  .manager_panel .p1 {border-bottom: 1px dotted gray; padding-bottom: 10px; text-align: center;}
  .manager_panel .p2 {padding-top: 10px; text-align: center; border: none; padding-bottom: 10px; border-bottom: 1px dotted gray;}
  .manager_panel .p3 {padding-top: 10px; text-align: center; padding-right: 0;}
  
}
</style>