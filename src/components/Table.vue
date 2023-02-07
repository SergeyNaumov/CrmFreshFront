<template>
  <div class="is_headapp">
    <v-dialog
      v-model="dialog"
      width="auto "
    >
      <v-card>
        <v-card-title class="headline">{{dialog_title}}</v-card-title>
        <v-card-text v-html="dialog_html">

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="dialog = false"
          >
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <template v-if="form ">

      <errors :errors="form.errors"/>

      <pre  v-for="(l,idx) in form.log" :key="idx">{{l}}</pre>
      <h1 v-if="!params.without_title">{{form.title}}</h1>
      
      
      <div class="links" >
          <template v-for="(l,idx) in form.links" >
              <a  :href="l.link" target="_blank">{{l.description}}</a>
              <template v-if="idx < form.links.length -1 ">&nbsp;|&nbsp;</template>
          </template>

      </div>
          <template v-if="form.data.length>0">
            <v-simple-table v-if="!form.errors.length" mobile-breakpoint="0" class="results">
              <template v-slot:default>
                  <thead>
                      <tr>

                          <th v-for="(header,idx) in form.headers" :key="'th'+idx">
                              <a href="" @click.prevent="go_sort(header.sort?header.sort:header.n,'')" v-html="header.h"/>
                              <span style="padding-left: 8px; padding-bottom: 5px;" v-if="header.tooltip">
                                  <a href="" style="text-decoration: none; " @click.prevent="show_tooltip(header.tooltip);"><v-icon style="font-size: 8pt;" small color="primary">fa fa-question</v-icon></a>
                              </span>
                              <div>
                                  <a href="#" @click.prevent="go_sort(header.sort?header.sort:header.n,'asc')" class="sort_desc" :class=""><v-icon color="green" small>keyboard_arrow_down</v-icon></a>
                                    <a href="#" @click.prevent="go_sort(header.sort?header.sort:header.n,'desc')" class="sort_asc" :class=""><v-icon color="red" small>keyboard_arrow_up</v-icon></a>
                              </div>
                          </th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr
                        v-for="(tr,idx) in form.data"
                        :key="'tr'+idx"
                      >  

                        <template v-for="(header,h_idx) in form.headers">
                          
                          <!--
                          <template v-if="tr[header.name].type=='dialog' || tr[header.name].type=='ajax_dialog'">
                            <td :key="idx+'_'+h_idx"><a href="" @click.prevent="show_dialog(tr[header.name])">{{tr[header.name].header}}</a></td>
                          </template>
                          -->
                          <template >
                            <td v-html="get_data_td(header,h_idx,tr)" :key="idx+'_'+h_idx"></td>
                          </template>
                          
                          
                        </template>
                          
                      </tr>
                  </tbody>
              </template>
            </v-simple-table>
          </template>
          <template v-else>
            {{empty_message}}
          </template>
    </template>
  </div>
</template>

<script>
let t
export default {
        props:['params','is_headapp'],
        data(){
          return {
            form:null,
            sort:'',
            sort_desc: false,
            dialog: false,
            dialog_html: '',
            dialog_title: '',
            empty_message:''
          }
        },

        mounted () {
          t=this
          t.init()
        },

        created(){
          
        },
        watch:{
          params(){
            t.init()
          }
        },
        methods: {
          get_data_td(header,h_idx,tr){
            let name=header.n // имя поля
            let td=tr[name]
            if(typeof(td)=='object'){
              let type=td.type
              if(type=='url'){
                return `<a href="${td.url}" target="_blank">${td.header}</a>`
              }
             
            }
            //if('type' in d){
            //  return '-'
            //}
            
            //console.log('header:',header,'h_idx:',h_idx,'tr:',tr)
            return td
          },
          go_sort(idx,order){

              if(order=='asc'){
                  t.sort_desc=false
              }
              else if(order=='desc'){
                  t.sort_desc=true
              }
              else if(this.sort==idx){
                  t.sort_desc=!this.sort_desc 
              }
              else{
                  t.sort_desc=false
              }
              t.sort=idx
              console.log('sort:',t.sort,t.sort_desc)
              t.sorted()
          },
          sorted(){
              this.form.data.sort(
                                  (a,b)=>{
                                      
                                      let v1=a[this.sort], v2=b[this.sort]
                                      console.log(v1,v2)
                                      if(parseFloat(v1) && parseFloat(v2) ){
                                          v1=parseFloat(v1)
                                          v2=parseFloat(v2)
                                      }  
                                      else if(Number(v1) && Number(v2) ){
                                          v1=parseInt(v1)
                                          v2=parseInt(v2)
                                      }

                                      
                                      if(this.sort_desc){
                                          if(v1<v2){
                                              return 1
                                          }
                                      }
                                      else{
                                          if(v1>v2){
                                              return 1
                                          }
                                      }

                                      return -1
                                  }
                              )
          },
          init(){
            let url=BackendBase+'/table/'+t.params.config
            if(this.params.limit){
              url+=`?limit=${this.params.limit}`
            }
            t.$http.get(url).then(
              r=>{
                let d=r.data;
                if(d.success)
                  t.form=d.form
                  if(!t.params.limit){
                    document.title=d.form.title
                  }
                  t.empty_message=d.form.empty_message
                  t.sort=t.form.sort
                  t.sort_desc=t.form.sort_desc
              }
            )
          },
          show_dialog(el){
            
            if(el.type=='ajax_dialog'){

            }
            else{
              t.dialog=true
              t.dialog_html=el.dialog_html
              t.dialog_title=el.header
            }
            
          },
          idx_header(name){
            let i=0
            for(let f of t.form.headers){
              if(f.n==name){
                return i
              }
              i++
            }
            return false
          }
        }

        
        
}
</script>
<style scoped>
  .is_headapp {margin: 20px; max-width: 1400px;}
  .is_headapp h1 {margin-bottom: 20px;} 
  .auth .err{ color: red; background-color: white;}
  body {margin-top: 10%;}
  .sort_asc, .sort_desc {text-decoration: none !important;}
  .links {margin-left: 20px; border-bottom: 1px dotted black; padding-bottom: 20px;}
  @media only screen and (max-width: 1000px) {
    .results thead {
        display: none;
    }
    .results tr {

      line-height: auto !important;
    }
    .results td{
      display: block;
      margin-top: 10px;
      padding-bottom: 10px !important;
      height: auto !important;
      
    }
    .results td:last-child{border-bottom: 3px solid $primary;}



    .results td:before{
      content: attr(data-label);
      display: block;
      font-weight: bold;
      color: $primary;
      text-decoration: underline;
      
    }

    .results tr td:first-child {border-top: 2px solid black; padding-top: 20px;}
    .results tr:first-child td:first-child {border-top: none;}
  }
</style>



