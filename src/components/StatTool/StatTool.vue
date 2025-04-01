<template>
    <div class="is_headapp">
      <h1>{{title}}</h1>
      <errors :errors="errors"/>
      <pre v-if="1">
        {{filters}}

      </pre>
      <div style="border: 1px solid gray; margin: 10px; padding: 10px;" v-if="log_filters.length">
        <pre >{{log_filters}}</pre>
      </div>
      <div v-for="f in filters" class="filter">
          
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


      <stat-tool-result v-if="show_results" :source_list="list" :source_columns="columns" :params="params"/>
    </div>
</template>
<script>
// import item_content from './item_content';
// import item_menu from './item_menu';
// import links_block from './links'




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
     popup_links:{
      show:false,
      title:'',
      body:''
     },
     result_refresh:1
    }),
    mounted(){
      this.init()
    },
    watch:{
     
      params(){
        console.log('change params')
        this.init()
      }

    },

    methods: {

      init(){
        let t=this

        t.$http.post(
          `${BackendBase}/stat-tool/${t.params.config}`,
          {cgi_params: get_cgi_params()}
        ).then(
          r=>{
            let d=r.data
            if(d.redirect && d.redirect!=location.pathname){
                localStorage.setItem('link_prev_login',location.href);
                location.href=d.redirect;
                return ;
            }
            if(d.success){
              t.list=[] ; t.show_results=false
              t.filters=d.filters, t.title=d.title

              for(let f of this.filters){
                t.filters_hash[f.name]=f.value
              }
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
      init_results(){ // инициализация результатов
        let t=this
        //console.log('init_results core!')
        // обрабатываем ссылки для popup-ов
        let popup_links=document.querySelectorAll('.crm-popup')
        //console.log('popup_links:',popup_links)
        popup_links.forEach(link=>{
          console.log('link:',link)
          let url=`${BackendBase}/stat-tool/${t.params.config}`
          let data_json=link.getAttribute('data-json')
          if(data_json){
            data_json=JSON.parse(data_json)
          }
          link.onclick = event => {
            event.preventDefault()
            t.$http.post(
              url,{cgi_params:data_json}
            ).then(
              r=>{
                let d=r.data
                t.popup_links.show=true
                t.popup_links.title=d.header
                t.popup_links.body=d.body
                t.result_refresh+=1
              }
            )
          }

        })

        t.result_refresh+=1

      },
      search(){ // поиск
          let t=this
          t.finding=true
          t.show_results=false
          let query=[] // query совместимо с поиском в admin_table

          for(let f of t.filters){
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
              console.log('d:',d)
              if(t.result_type=='columns'){
                t.list=[]
                t.columns=d.columns, t.show_results=true
              }
              else{
                t.list=d.list, t.show_results=true
              }

              t.show_results=false
              setTimeout(()=>{t.show_results=true},10)
              t.result_refresh+=1

              if(d.log){
                t.log_search=d.log
              }

            }
            t.errors=d.errors
            t.finding=false
          }
        ).catch(
          e=>{
            t.errors=[`ошибка при поиске: ${e}`]
            t.finding=false
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
  div.filter {max-width: 800px;}
</style> 