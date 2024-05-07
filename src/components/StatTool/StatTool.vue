<template>
    <div class="is_headapp">
      <h1>{{title}}</h1>
      <errors :errors="errors"/>
      <pre v-if="0">
        {{filters_hash}}

      </pre>
      <div style="border: 1px solid gray; margin: 10px; padding: 10px;" v-if="log_filters.length">
        <pre >{{log_filters}}</pre>
      </div>
      <div v-for="f in filters">
          <filter-date :field="f" :filter_change="filter_change" v-if="f.type=='date'"/>
          <filter-select :field="f" :filter_change="filter_change" v-if="f.type=='select'"/>
          <filter-text :field="f" :filter_change="filter_change"
            :config="params.config"
            v-if="f.type=='text'"/>

      </div>
      <v-btn @click.prevent="search()">найти</v-btn>

      <v-progress-linear
        color="primary"
        indeterminate
        rounded
        height="6"
        v-if="finding"
      />
      <div style="border: 1px solid gray; margin: 10px; padding: 10px;" v-if="log_search.length">
        <pre >{{log_search}}</pre>
      </div>

        <div class="results" v-if="show_results">
          <template v-if="result_type=='columns'">
            <!-- Вывод результатов колонками -->

              <v-row>
                <v-col v-for="col in columns">
                  <div v-for="d in col">
                    <field-accordion v-if="d.type=='accordion'" :field="d"/>
                    <div v-if="d.type=='html'" v-html="d.body"></div>
                    <div style="position: relative; display: inline-block;" v-if="d.type=='chart'">
                      <field-chart  :field="d" />
                    </div>
                  </div>
                </v-col>
              </v-row>

          </template>
          <template v-else>
            <template v-if="list.length">
              <div v-for="d in list">
                <field-accordion v-if="d.type=='accordion'" :field="d"/>
                <div v-if="d.type=='html'" v-html="d.body"></div>
                <div style="position: relative; display: inline-block;" v-if="d.type=='chart'">
                  <field-chart  :field="d" />
                </div>
              </div>
            </template>
            <template v-else>
              
              <p>ничего не найдено</p>
            </template>
          </template>
        </div>

      
    </div>
</template>
<script>
// import item_content from './item_content';
// import item_menu from './item_menu';
// import links_block from './links'



let t
import { 
  get_cgi_params
} from '../js/edit_form.js'

export default {  
    props:['params','is_headapp','manager'],
    components:{
       

    },
    data: () => ({
     result_type: '', // если columns, то выводим колонками
     show_results: false,
     title:'',
     filters_hash:{},
     filters:[], // фильтры для поиска
     list:[], // список вывода
     columns: [], // колонки для вывода при result_type=='columns'
     errors:[],
     log_filters:[],
     log_search:[],
     finding:false,
    }),
    mounted(){
      this.init()
    },
    watch:{
     
      params(){
        this.init()
      }

    },

    methods: {

      init(){
        t=this
        for(let f of this.filters){
          t.filters_hash[f.name]=f.value
        }
        t.$http.post(
          `${BackendBase}/stat-tool/${t.params.config}`,
          {cgi_params: get_cgi_params()}
        ).then(
          r=>{
            let d=r.data
            if(d.success){
              t.filters=d.filters, t.title=d.title
              if(d.javascript){
                eval(d.javascript)
              }
            }
            t.errors=d.errors
            if(d.log){
              t.log_filters=d.log
            }
          }
        ).catch(        
          e=>{
            t.errors=[`ошибка при инициализации: ${e}`]
          }
        )
        

      },
      filter_change(filter){
        this.filters_hash[filter.name]=filter.value
        //console.log(filter.value)
        //console.log(this.filters_hash)
      },
      search(){ // поиск
          this.finding=true
          this.show_results=false
          let query=[] // query совместимо с поиском в admin_table

          for(let f of this.filters){
            let values=t.filters_hash[f.name] || ''


            query.push([f.name, values ])
          }
          t.$http.post(`${BackendBase}/stat-tool/${t.params.config.replace(/\?.*$/,'')}/search`,
          {
            
            cgi_params: get_cgi_params(),
            query: query, // query совместимо с поиском в admin_table
            filters: t.filters_hash, // передаём на случай если удобнее будет работать с ним (опционально)
          }
        ).then(
          r=>{
            let d=r.data
            if(d.success){
              t.result_type=d.result_type || ''
              if(t.result_type=='columns'){
                t.list=[]
                t.columns=d.columns, t.show_results=true
              }
              else{
                t.list=d.list, t.show_results=true
              }

              if(d.log){
                t.log_search=d.log
              }

            }
            t.errors=d.errors
            this.finding=false
          }
        ).catch(
          e=>{
            t.errors=[`ошибка при поиске: ${e}`]
            this.finding=false
          }
        )
      }


    }

}
</script>
<style lang="scss" scoped>  
  .is_headapp {margin: 20px; }
  .is_headapp h1 {margin-bottom: 20px;} 
  .results {margin-top: 10px;}
  
</style> 