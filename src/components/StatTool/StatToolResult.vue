<template>
    <div>
      <template v-if="expansion_panels">


            <v-expansion-panels v-model="panel">
              <v-expansion-panel >
                    <v-expansion-panel-header>
                        <v-card-title v-html="out_title" />


                    </v-expansion-panel-header>
                    <v-expansion-panel-content>

                        <OutResult :list="list" :columns="columns" :style="{'max-height': max_height}" style="overflow-y: auto;"/>

                        <errors :errors="errors"/>

                    </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>

      </template>
      <template v-else>
            <OutResult :list="list" :columns="columns"/>
      </template>

      <v-dialog
        v-model="popup_links.show"
        max-width="800"
        transition="dialog-bottom-transition"
      >
            <v-card>
              <v-card-title>{{popup_links.title}}</v-card-title>

               <v-card-text v-html="popup_links.body">

              </v-card-text>
            </v-card>
      </v-dialog>
    </div>
</template>
<script>
import OutResult from './OutResult';
export default {
    components:{ OutResult },
    props:['title', 'expansion_panels', 'source_list','source_columns', 'url','params', 'max_height'],
    data:()=>{
        return {
            panel:0,
            popup_links:{
                show:false,
                title:'',
                body:''
            },
            out_title:'',
            list:[],
            columns:[],
            errors:[],
            show_results:false,
            columns:[]
        }
    },

    created(){
        let t=this

        if(t.url){
            // если результаты берём по url-у, тогда вот
            t.$http.get(t.url).then(
                r=>{
                    let d=r.data

                    if(d.success){
                        t.out_title=d.title?d.title:t.title

                        t.result_type=d.result_type
                        if(t.result_type=='columns'){
                            t.list=[]
                            t.columns=d.columns
                        }
                        else{
                            t.list=d.list

                        }
                        t.show_results=true


                        if(d.log){
                            t.log_search=d.log
                        }
                    }
                }
            )
        }
        else if(t.source_list.length){
            t.list=t.source_list
            t.columns=[]
        }
        else if(t.source_columns.length){
            t.columns=t.source_columns
            t.list=[]
        }
        setTimeout( ()=>{this.init_results()},500)

    },
    methods:{
        init_results(){ // инициализация результатов
            let t=this
            console.log('init_results!')
            // обрабатываем ссылки для popup-ов
            let popup_links=document.querySelectorAll('.crm-popup')
            popup_links.forEach(link=>{
              let url=`${BackendBase}/stat-tool/${t.params.config}`
              let data_json=link.getAttribute('data-json')
              if(data_json){
                data_json=JSON.parse(data_json)
              }

              link.onclick = event => {
                event.preventDefault()
                console.log('on click:',link)
                t.$http.post(
                  url,{cgi_params:data_json}
                ).then(
                  r=>{
                    let d=r.data
                    t.popup_links.show=true
                    t.popup_links.title=d.header
                    t.popup_links.body=d.body

                  }
                )
              }
            })
        },

    }
}
</script>
<style  scoped>

</style>