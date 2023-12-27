<template>
        <div  class="is_headapp">

              <h1  >{{title}}</h1>

              <div v-if="permissions.make_create ">
                <v-icon @click="new_card()" class="small" color="primary">fa-plus</v-icon>&nbsp;
                <a href=""  @click.prevent="new_card()" class="">Добавить</a>
              </div>
              
              <p v-if="0"><a href="">Загрузка / сохранение фильтров</a></p>
              
              <div v-if="search_plugin" class="search_plugin">
                <div v-for="(sp,idx) in search_plugin" :key="'sp'+idx">
                  <v-icon color="primary">{{sp.icon}}</v-icon>
                  <a href="" @click.prevent="go_search_plugin(sp.name)">{{sp.title}}</a>
                </div>
              </div>
              <template v-if="errors.length">
              <div  class="errors">
                
                  <div v-for="(e,idx) in errors" class="error" :key="'err'+idx" ><v-icon color="primary">fa fa-bomb</v-icon> <span   v-html="e"></span></div>
                
              </div>     
            </template>         
            <v-layout row wrap v-else>
            <v-flex xs12 lg12 class="mt-2 mb-2" >
              <v-btn v-if=0 @click="SHOW_FILTERS=!SHOW_FILTERS" small><v-icon color="primary" small>filter_list</v-icon> </v-btn>  
              <v-flex xs12 lg12 class="mt-2 mb-2">
                    <template v-if="1">
                      <div class="links" v-if="1">
                        <div v-for="l in search_links" v-bind:key="l.link"><a :href="l.link" :target="l.target">{{l.description}}</a></div>
                      </div>
                      <div class="log" v-if="log">
                        <pre v-if="typeof(log)=='string'">{{ log }}</pre>
                        <pre v-else v-for="(l,i) in log" v-bind:key="'log'+i">{{  l }}</pre>
                      </div> 
                      <div class="before_filters_html" v-if=" before_filters_html">
                        <div v-if="typeof(before_filters_html)=='string'" v-html="before_filters_html"></div>
                        <div v-else v-for="h in before_filters_html" :key="h.i" v-html="h"></div>
                      </div>
                    </template>
              </v-flex>
            </v-flex>
                <template v-if="show_find_button_top">
                  <v-flex xs12 lg12 v-show="on_filters && on_filters.length">

                    <v-btn color="primary" small  @click.prevent="go_search(1);" href="" id="search_results"><v-icon  class="small"> fa fa-search</v-icon>&nbsp;искать</v-btn>
                  </v-flex>
                </template>
                <v-flex xs12 sm12 md4 lg4 class="mb-2 filters"  v-show="SHOW_FILTERS">
                      
                          <v-toolbar @click="SHOW_FILTERS_all=!SHOW_FILTERS_all">
                            <!--<v-toolbar-side-icon @click="SHOW_FILTERS_all=!SHOW_FILTERS_all"></v-toolbar-side-icon>-->
                            <v-app-bar-nav-icon color="primary" ></v-app-bar-nav-icon>
                            <v-subheader>Фильтры</v-subheader>
                          </v-toolbar>
                          <div v-if="SHOW_FILTERS_all && filters_groups.length">
                            
                            <div  v-for="(fg,idx) in filters_groups" class="filters_groups" :key="fg.description" >
                                <a href="#" @click.prevent="filters_groups[idx].on=!filters_groups[idx].on" color="primary">{{fg.description}}</a>
                                <template v-for="cid in fg.child">
                                <div v-if="fg.on"  :key="cid.i" class="filter_block">
                                    <v-checkbox
                                      hide-details
                                      small
                                      color="primary" @change="filter_toggle(filters[cid])" v-model="filters[cid]['filter_on']" :label="filters[cid]['description']"
                                    />
                                </div>
                                </template>
                            </div>
                          </div>
                          <div v-else-if=" SHOW_FILTERS_all" class="filters_list">
                                     <v-checkbox
                                      v-for="f in filters" :key="f.name" class="filter_block"
                                      hide-details
                                      color="primary" @change="filter_toggle(f)" v-model="f.filter_on"
                                      :label="f.description"
                                    />
                          </div>
   
                </v-flex>
                <template v-if="0">
                  {{on_filters}}
                  <hr>
                  {{filters_values}}
                  <hr>
                </template>
                  <on-filters :filters="filters"
                    :config="params.config"
                    :go_search="go_search"
                    :on_filters="on_filters"
                    :filter_change="filter_change"
                    :toggle_filters="toggle_filters"
                    :SHOW_FILTERS_on="SHOW_FILTERS_on"
                    :ORDER="ORDER"

                    :filters_values="filters_values"
                  />
                  <template v-if="!show_find_button_top">
                    <v-flex xs12 lg12 v-show="on_filters && on_filters.length">
                      <v-btn color="primary" small  @click.prevent="go_search(1)" href="" id="search_results"><v-icon  class="small"> fa fa-search</v-icon>&nbsp;искать</v-btn>
                    </v-flex>
                  </template>
                
            
            <v-flex md12 class="mt-1" >

                <!-- [loading...] -->
                <v-progress-linear
                  color="primary"
                  indeterminate
                  rounded
                  height="6"
                  v-if="finding"
                />


                <div v-if="errors_find && errors_find.length" class="errors_find">
                  <h2>Произошли ошибки при поиске</h2>
                  <div v-for="ef in errors_find" :key="ef" style="color: red;">{{ef}}</div>
                  <p><a href="" @click.prevent="go_search()">повторить попытку поиска</a></p>
                </div>
                <template v-else>
                  <hr>
                  
                  <div v-if="plugin_out" class="plugin_out" v-html="plugin_out" />
                  

                  <find-results  
                    v-else
                    :results="results"
                    :permissions="permissions"
                    :go_search="go_search"
                    :finding="finding"
                    :SearchDataSet="SearchDataSet"
                    :filters="filters"
                    :explain_query="explain_query"
                    :out_before_search="out_before_search"
                    :out_after_search="out_after_search"
                    :not_out_result_search="not_out_result_search"
                    :last_search_params="last_search_params"
                    :on_filters="on_filters"
                    :search_multi_action="search_multi_action"
                    :get_filter_by_name="get_filter_by_name"


                  />
                  
                </template>
            </v-flex>
          </v-layout>
      </div>

</template>

<script>
import { 
  get_cgi_params
} from './js/edit_form.js'

import OnFilters from './AdminTable/OnFilters';
import FindResults from './AdminTable/FindResults';
export default {
  name:'admin-table',
  components:{
    'on-filters':OnFilters,
    'find-results':FindResults
  },
  props:['params','is_headapp'],
  data () {
      return { 
      show_find_button_top:false,
      filters:[],
      filters_groups:[],
      on_filters:[],
      permissions:{
        make_create: false,
        make_delete: false,
        not_edit: true,
      },
      search_links:[],
      ORDER:1,
      SHOW_FILTERS:true,
      SHOW_FILTERS_on: true,
      SHOW_FILTERS_all: true,
      title:"",
      log:[],
      errors:[],
      errors_find:[],
      before_filters_html:'',
      finding:false,
      // запрос, который будет уходить на поиск
      SearchDataSet:{
        page:0,
        query:{

        }
      },
      search_plugin:[],
      javascript:{

      },


      search_multi_action:[],
      results: {
        headers:[{h:''}],
        output:[{data:[{value:[]}]}],
      },
      plugin_out:'',
      explain_query:'',
      out_before_search:[],
      out_after_search:[],
      not_out_result_search:'',
      last_search_params:{}
      
    }
  },
  created(){
    this.Init();
  },
  watch:{
    params(v){

      if(v.config){
        this.Init()
      }
    },

  },

  computed:{
    
    filters_values(){ // для того, чтобы можно было реализовать механизм зависимых фильтров, формируем значения всех фильтров
      let obj={}
      for(let f of this.on_filters){
        if('value' in f){
          if(f.value){
            if(typeof(f.value)=='object'){
              if(f.value.length){
                obj[f.name]=f.value
              }
              
            }
            else{
              obj[f.name]=f.value
            }
          }
        }
      }

      return obj
    }

  },
  methods:{
    get_on_filters(){

      let list=[];
      for (let f of this.filters){
        if('filter_on' in f && f.filter_on)
          list.push(f)
      }
      this.on_filters=list.sort(
        (a,b)=>{
          return(a.filter_order>b.filter_order)?1:-1
        }
      );
    },
    init_on_filters(on_filters){
      
      if(!on_filters || !on_filters.length){
        
        for(let f of this.filters){
          if(f.filter_on){
            this.ORDER++
          }
            
        }
      }
      if(on_filters && on_filters.length){
        //for(let f of this.filters)
        //  f.filter_on=0;
        
        for(let f of on_filters){
          
          let field=this.get_filter_by_name(f.name);
          if(field){
            field.filter_on=true;
            
            field.filter_order=this.ORDER++;
            //this.filter_toggle(field);
            if(f.value){
              field.value=f.value
            
              
            }
          }

          
        }
        this.get_on_filters()
      }

      
    },
    Init(){
          let t=this
          t.SHOW_FILTERS=true, t.SHOW_FILTERS_on=true, t.SHOW_FILTERS_all=true, t.filters_groups=[];
          t.$http.post(
              BackendBase+'/get-filters/'+this.params.config,
              {cgi_params: get_cgi_params()}
          ).then(response=>{
              let D=response.data;
              
              
              t.results={};
              t.errors=D.errors;

              if(D.success){
                  document.title=t.title=D.title;
                  t.log=D.log;
                  t.permissions=D.permissions;
                  t.search_plugin=D.search_plugin;
                  t.search_multi_action=D.search_multi_action || []

                  t.show_find_button_top=D.show_find_button_top;
                  // преобразования
                  for(let f of D.filters){
                    if( (f.type=='checkbox' || f.type=='switch') && !f.values){ // чекбокс -- это select с вариантами "да / нет"
                      f.values=[{v:'',d:"Не использовать фильтр"},{v:1,d:"Да"},{v:'0',d:"Нет"}];
                      f.type='select'; f.not_multiple=true;
                      if(!f.value)
                        f.value=[];
                    }
                    
                  }
                  t.filters=D.filters;
                  
                  t.search_links=D.search_links;
                  if(D.javascript)
                    eval(D.javascript);
                  if(D.filters_groups && D.filters_groups.length)
                    t.filters_groups=D.filters_groups;
                  t.before_filters_html=D.before_filters_html;
                  
                  // Если фильтры были включены через filter_on -- собираем  on_filters
                  if(!D.on_filters.length){
                    for(let f of D.filters){
                      if(f.filter_on){
                        let value='';
                        if(f.type in ['select']){
                          value=[]
                          if(typeof(f.value)=='string'){
                            value.push(f.value)
                          }
                          else if(f.value){
                            value=f.value
                          }
                        }
                        else{
                          value=f.value
                        }


                        D.on_filters.push({name:f.name,value:value})
                      }
                    }
                  }

                  t.init_on_filters(D.on_filters);


                  
                  if (D.search_on_load){
                    t.go_search(1);

                  }
                    
              }
              else{
                document.title=this.title='Ошибка при обработке конфига '+this.params.config+'!';
                this.errors=D.errors;
                if(!this.errors.length)
                  this.errors=['произошла непредвиденная ошибка. обратитесь к разработчику'];
              } 
              
            }).catch(e => {
              alert('!!'+e);
          });
    },
    filter_toggle(f){  
          if(f.filter_on)
            f.filter_order=this.ORDER;
          
          this.filters=this.filters
          this.init_on_filters()

          this.get_on_filters();
          this.ORDER++;
    },
    get_query(){
      let q=[];
      for(let f of this.on_filters){
          if(f.range){


            q.push([f.name,[f.value_low,f.value_hi]]);

          }
          else{
            if(f.type=='memo')
              q.push([f.name,{registered_low:f.registered_low, registered_hi: f.registered_hi,message: f.message, user_id: f.user_id}])
            else
              q.push([f.name,(f.value?f.value:'')]);
          }   
      }
      return q;
    },
    go_search_plugin(plugin_name,params){
      let q=this.get_query();

      if(!params) params={}
      //this.finding=false;
      this.$http.post(
        BackendBase+'/get-result',
        {
          config: this.params.config,
          plugin: plugin_name,
          query:q,
          params:params
        }
      ).then(
        r=>{
          let d=r.data;
          this.finding=false;
          if(d.success){
            if(d.ready){
              if(d.format=='html'){

                this.plugin_out=d.result;
              }
              else if(d.format=='xls'){

              }
              else if(d.format='png'){

              }
            }

            
          }
          this.errors_find=d.errors;
        }
      ).catch(
        e=>{
          this.errors_find=['ошибка: '+e];
          this.finding=false;
        }
      );
    },
    go_search(page,params){
          
          
          // обнуляем результаты
          this.results={
            headers:[{h:''}],
            output:[{data:[{value:[]}]}],
          };

          this.plugin_out='';
          this.last_search_params=params;
          this.SHOW_FILTERS_all=false;
          
          this.SHOW_FILTERS_on=false;
          
          let q=this.get_query();


          if(!params) params={}
          
          this.errors_find=[];
          this.finding=true;

          
          this.SearchDataSet={page:page,query:q};
          let method,url;

          this.$http({
            url:BackendBase+'/get-result',
            method:'post',
            data:{
              page: page,
              query: q,
              config: this.params.config,
              params:params,
              cgi_params: get_cgi_params()
            }
          })
          .then(r=>{
              let d=r.data
              
              this.explain_query=d.explain_query;
              this.results=d.results, this.out_before_search=d.out_before_search, this.not_out_result_search=d.not_out_result_search

              this.errors_find=d.errors, this.out_after_search=d.out_after_search
              this.finding=false;
              
              // запускаем form.javascript.find_objecs (если есть)
              if(d.javascript){
                this.$nextTick(
                  ()=>{eval(d.javascript)}
                )
                
              }
              //setTimeout( function(){let link=document.createElement("a"); link.href='#search_results'; link.click();}, 100)
          })
          .catch(e => {
              //alert(e);
              this.errors_find=['ошибка: '+e];
              this.finding=false;
          });
    },

    new_card(){
      window.open(BaseUrl+'edit_form/'+this.params.config);
    },
    filter_change(filter){

      for(let f of this.on_filters){
        if(f.name==filter.name){
          f.value=filter.value
          break
        }
      }
    },
    toggle_filters(){
      this.SHOW_FILTERS_on=!this.SHOW_FILTERS_on;
    },
    get_filter_by_name(name){
      for(let f of this.filters){
        if(f.name == name)
          return f
        
      }
      return undefined;
    }
  }
  
}
</script>
<style lang="scss">
  @import '@/styles/variables.scss';
  .is_headapp h1 {margin-bottom: 20px;;} 
  div.errors {margin: 3rem;}
  div.errors .error {background-color: #ffffff !important;  color: red;}
  .filters_groups{
    padding-top: 1rem;
    padding-left: 1rem;
    font-size: 14px;
    /*font-weight: bold;*/
    padding-bottom: 1rem;
  }
  .filters_groups a{ text-decoration: none;}
  .filters_groups div {
    padding: 0;
  }
  .filters_groups .v-input__control{
    padding-left: 1rem;
  }
  .filters_groups .v-messages{display: none;}
  .filter_collection {
      border: 1px solid black;

      padding: 0;
      display: inline-block;
      margin-right: 20px;
   }
  .filter_collection div {padding: 5px 10px; vertical-align: bottom;}
  .filter_collection .header {border-bottom: 1px solid gray;}
  .on_filters {
    width: 500px;
    display: inline-block;
    vertical-align: top;
  }
  .on_filters .item {
    border: 1px solid gray; margin: 0 15px 15px 15px;
    border-left: 3px solid gray;
    padding: 5px 5px 5px 20px;
  }

  .list--two-line .list__tile {height: 20px; margin-top: 20px;}

  div.links{margin: 1rem;}
  div.log pre {font-family: arial; font-size: 10pt; border: 1px dotted gray;}
  .errors_find {margin: 1rem;}
  .errors_find h2 {margin-bottom: 1rem;}
  .filters_groups .v-label {font-size: 12px;}
  .is_headapp {margin: 20px;}

  
  .filter_block:nth-last-child {border-bottom: none;}
  .filter_block:nth-child(2n) {background-color: $lighten4;}
  .filter_block.v-input--selection-controls { margin: 0;}
  .filter_block {padding: 5px; 
    border: 1px solid $lighten4;
  
  }
  .filters_groups .filter_block {padding: 8px 0px;}
  .filters_groups .filter_block:nth-child(2n) {background-color: #E8EAF6; }
  .filters_groups .v-input--selection-controls{margin-top: 0; margin-bottom: 0;}
  .filters_list {margin-top: 10px;}
  .search_plugin div {margin-top: 15px;}
  .search_plugin div .v-icon {margin-right: 10px;}
  .plugin_out { margin: 20px; }
</style>