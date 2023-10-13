<template>
    <div class="is_headapp">
      <h1>{{title}}</h1>
      <errors :errors="errors"/>
      <pre v-if="0">
        {{filters_hash}}

      </pre>

      <div v-for="f in filters">
          <filter-date :field="f" :filter_change="filter_change" v-if="f.type=='date'"/>

      </div>
      <v-btn @click.prevent="search()">найти</v-btn>
      <div class="results" v-if="list.length">
        <pre v-if="0">
          {{list}}
        </pre>
        <div v-for="d in list">
          <field-accordion :field="d"/>
        </div>
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
     title:'',
     filters_hash:{},
     filters:[], // фильтры для поиска
     list:[], // список вывода
     errors:[]
    }),
    mounted(){
      this.init()
    },
    watch:{
     
      

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
            }
            t.errors=d.errors

          }
        ).catch(        
          e=>{
            t.errors=[`ошибка при инициализации: ${e}`]
          }
        )
        

      },
      filter_change(filter){
        this.filters_hash[filter.name]=filter.value
        console.log(filter.value)
        console.log(this.filters_hash)
      },
      search(){ // поиск
          t.$http.post(`${BackendBase}/stat-tool/${t.params.config}/search`,
          {
            
            cgi_params: get_cgi_params(),
            filters: t.filters_hash
          }
        ).then(
          r=>{
            let d=r.data
            if(d.success){
              t.list=d.list
            }
            t.errors=d.errors
          }
        ).catch(
          e=>{
            t.errors=[`ошибка при поиске: ${e}`]
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