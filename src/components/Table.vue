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
          <template v-for="(l,idx) in form.links">
              <a   :key="idx" :href="l.link" target="_blank">{{l.description}}</a>
              <template v-if="idx < form.links.length -1 ">&nbsp;|&nbsp;</template>
          </template>

      </div>
      <v-simple-table v-if="!form.errors.length">
        <template v-slot:default>
            <thead>
                <tr>

                    <th v-for="(header,idx) in form.headers" >
                        <a href="" @click.prevent="go_sort(header.n,'')" v-html="header.h"/>
                        <span style="padding-left: 8px; padding-bottom: 5px;" v-if="header.tooltip">
                            <a href="" style="text-decoration: none; " @click.prevent="show_tooltip(header.tooltip);"><v-icon style="font-size: 8pt;" small color="primary">fa fa-question</v-icon></a>
                        </span>
                        <div>
                            <a href="#" @click.prevent="go_sort(header.n,'asc')" class="sort_desc" :class=""><v-icon color="green" small>keyboard_arrow_down</v-icon></a>
                              <a href="#" @click.prevent="go_sort(header.n,'desc')" class="sort_asc" :class=""><v-icon color="red" small>keyboard_arrow_up</v-icon></a>
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                  v-for="(tr,idx) in form.data"
                  :key="'tr'+idx"
                >  
                  <template v-for="td in tr">
                    
                    <template v-if="td.type=='url'">
                      <td ><a :href="td.url" target="_blank">{{td.header}}</a></td>
                    </template>
                    <template v-else-if="td.type=='dialog' || td.type=='ajax_dialog'">
                      <td><a href="" @click.prevent="show_dialog(td)">{{td.header}}</a></td>
                    </template>
                    <td v-html="td" v-else></td>
                  </template>
                    
                </tr>
            </tbody>
        </template>
      </v-simple-table>
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
            dialog_title: ''
          }
        },

        mounted () {
          t=this
          t.init()
        },

        created(){
          
        },
        watch:{

        },
        methods: {
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
              t.sorted()
          },
          sorted(){
              this.form.data.sort(
                                  (a,b)=>{
                                      
                                      let v1=a[this.sort], v2=b[this.sort]
                                    
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
            
            t.$http.get(
              BackendBase+'/table/'+t.params.config,
            ).then(
              r=>{
                let d=r.data;
                if(d.success)
                  t.form=d.form
                  t.sort=t.form.sort
                  t.sort_desc=t.form.sort_desc
              }
            )
          },
          show_dialog(el){
            console.log(el)
            if(el.type=='ajax_dialog'){

            }
            else{
              t.dialog=true
              t.dialog_html=el.dialog_html
              t.dialog_title=el.header
            }
            
          }
        },


        
        
}
</script>
<style scoped>
  .is_headapp {margin: 20px; max-width: 1400px;}
  .is_headapp h1 {margin-bottom: 20px;} 
  .auth .err{ color: red; background-color: white;}
  body {margin-top: 10%;}
  .sort_asc, .sort_desc {text-decoration: none !important;}
  .links {margin-left: 20px; border-bottom: 1px dotted black; padding-bottom: 20px;}
</style>



