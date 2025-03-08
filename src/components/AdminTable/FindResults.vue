<template>
<div>
      <pre v-if="0">{{results.config}}</pre>
      <div v-if="results.log">        
        <pre v-if="typeof(results.log)=='string'" v-text="results.log"></pre>
        <pre v-else v-for="(l,idx) in (results.log)" :key="'l'+idx">{{l}}</pre>
      </div>
      <div v-if="explain_query" v-html="sql_format(explain_query)"></div>
  <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title  class="headline">{{dialog_header}}</v-card-title>

        <v-card-text>
          {{dialog_body}}
          <template v-if="log.length">
            <b>обратитесь к разработчику: </b>
            <pre v-for="l in (log)" v-bind:key="l.index" v-text="l"></pre>
          </template>
          <template v-if="errors.length">
              <ul class="errors">
                <li v-for="e in errors" v-bind:key="e.idx">{{e}}</li>
              </ul>
          </template>
          
        </v-card-text>

        <v-card-actions v-if="dialog_type=='delete_dialog'">
          <div class="flex-grow-1"></div>
          <v-btn color="primary darken-1" text @click="delete_element()">Да</v-btn>
          <v-btn color="red darken-1" text  @click="dialog=false; dialog_type=''">Нет</v-btn>
        </v-card-actions>
        <v-card-actions v-else>
          <div class="flex-grow-1"></div>
          <v-btn color="primary darken-1" text @click="dialog=false; dialog_type=''">Ок</v-btn>
        </v-card-actions>
      </v-card>

  </v-dialog>
      <pre v-if="0">{{selected_ids}}</pre>
      <div sm12 md12 lg12 class="mt-5 text-left" v-if="results.headers">
            <!--<h2 class="subheadling mb-2">Результаты поиска</h2>-->

            <div v-for="(o,idx) in out_before_search" :key="idx" v-html="o"></div>
            <template v-if="!not_out_result_search">
              
              <template v-if="results.count_total">
                    
                    <div class="text-xs-left"><u>Найдено записей: {{results.count_total}}</u></div>
                    <div class="text-xs-left">
                      <v-pagination v-if="results.count_pages>1" :length="results.count_pages" v-model="page"></v-pagination>
                    </div>
                    <div class="results_wrap">

                    <results_multi_action
                        :config="results.config"
                        :change_selected_ids="change_selected_ids"
                        :search_multi_action="search_multi_action" :selected_ids="selected_ids"
                        :get_filter_by_name="get_filter_by_name"
                        :on_filters="on_filters"
                        :select_all_result="select_all_result"
                        :results_update="results_update"
                    />

                      <table class="results" v-if="results.output">
                        <thead>
                          <tr class="header">
                            <th v-if="search_multi_action.length" >
                              <span></span>
                            </th><!-- для выделения записей-->
                            <th v-for="h in results.headers" :key="h.head_idx"> 
                                <span v-html="h.h"></span>
                                <span v-if="h.make_sort" class="sort_button">
                                  <a href="#" @click.prevent="go_search(page,{priority_sort: [h.n,'asc']})" class="sort_desc" :class="{'bold': (h.sorted=='desc')}"><v-icon color="green" small>keyboard_arrow_down</v-icon></a>
                                  <a href="#" @click.prevent="go_search(page,{priority_sort: [h.n,'desc']})" class="sort_asc" :class="{'bold': (h.sorted=='asc')}"><v-icon color="red" small>keyboard_arrow_up</v-icon></a>
                                  
                                </span>
                            </th>
                            <th class="controls"
                              v-if="!permissions.not_edit || permissions.make_delete"
                            >
                            </th>
                          </tr>
                        </thead>
                        <tbody>                          
                            <tr v-for="tr in results.output" :key="tr.tr_index">
                              <td v-if="search_multi_action.length" class="multi_action" data-label="">
                                <input type="checkbox" v-model="selected_ids[tr.key]" @change="change_selected_ids=Math.random()">
                              </td>
                              <td  v-for="(td,td_index) in tr.data" :key="td.td_index" :data-label="results.headers[td_index]['h']+':'">
                                
                                <div class="field">

                                  <template v-if="typeof(td.value)=='object'">
                                    
                                    <div v-if="td.value.before_html" v-html="td.value.before_html" />
                                    
                                    <res-file-uploader :opt="td.value" v-if="td.value.type=='file_uploader'"/>
                                    <res-form :opt="td.value" v-else-if="td.value.type=='form'"/>

                                    <div v-if="td.value.after_html" v-html="td.value.after_html" />
                                  </template>
                                  <template v-else-if="td.type=='html'">
                                        <span v-html='td.value'></span>
                                  </template>
                                  <template v-else-if="td.type=='file'">
                                    <template v-if="td.value">
                                      <a :href="td.value" target="_blank">посмотреть</a> | 
                                      <a :href="td.value" :download="td.value">скачать</a>
                                    </template>
                                    
                                  </template>
                                  <template v-else-if="td.type=='text'">
                                      <v-text-field
                                        
                                        v-model="td.value"
                                        @input="change_in_search(tr,td)"
                                        class="change_in_search"
                                      />
                                    <div class="saved" :id="td.name+'_'+tr.key"></div>
                                    <div class="err" :id="td.name+'_'+tr.key+'_err'"></div>
                                  </template>

                                  <template v-else-if="td.type=='font-awesome'">
                                    <v-icon>{{td.value}}</v-icon>
                                  </template>

                                  <template v-else-if="td.type=='textarea'">
                                    <v-textarea @input="change_in_search(tr,td)"  
                                      v-model="td.value" :auto-grow="true" :clearable="true">      
                                    </v-textarea>
                                    <div class="saved" :id="td.name+'_'+tr.key"></div>
                                    <div class="err" :id="td.name+'_'+tr.key+'_err'"></div>
                                  </template>

                                  <template v-else-if="td.type=='select'">
                                      <v-select 
                                          v-model="td.value" :items="results.selects[td.name]" item-value="v" item-text="d"
                                          @change="change_in_search(tr,td)"
                                      ></v-select>
                                      <div class="saved" :id="td.name+'_'+tr.key"></div>
                                      <div class="err" :id="td.name+'_'+tr.key+'_err'"></div>
                                  </template>

                                  <div style="text-align: center;" v-else-if="td.type=='checkbox' || td.type=='switch'">
                                      <v-checkbox v-model="td.value" hide-details row @change="change_in_search(tr,td)"></v-checkbox>
                                    <div class="saved" :id="td.name+'_'+tr.key"></div>
                                    <div class="err" :id="td.name+'_'+tr.key+'_err'"></div>
                                  </div>
                                  
                                  <template v-if="td.type=='date'">
                                      <field-date
                                        :field="td" 
                                        :form="{read_only:0}"
                                        style="width: 200px;"
                                        :parent="(value)=>{
                                          td.value=value;
                                          change_in_search(tr,td)
                                        }"
                                      />

                                      
                                      <div class="saved" :id="td.name+'_'+tr.key"></div>
                                      <div class="err" :id="td.name+'_'+tr.key+'_err'"></div>
                                  </template>
                                  <template v-if="td.type=='datetime'">

                                      <field-datetime
                                        :field="td" 
                                        :form="{}"
                                        style="width: 200px;"
                                        :parent="(value)=>{
                                          td.value=value; 
                                          change_in_search(tr,td)
                                        }"
                                      />

                                      
                                      <div class="saved" :id="td.name+'_'+tr.key"></div>
                                      <div class="err" :id="td.name+'_'+tr.key+'_err'"></div>
                                  
                                  
                                  </template>
                                  <template v-if="td.type=='yearmon'">[yearmon]</template>

                                  <field-memo v-if="td.type=='memo'" :form_id="tr.key" :form="{'config':results.config}"  :field="{'name':td.name,'show_type':td.show_type}"></field-memo>
                                  
                                  <template v-if="td.type=='multiconnect'" >
                                    <template v-if="td.value">
                                      <v-chip class="ma-2" color="primary" v-for="t in td.value.split(/,/)" :key="t.value">{{t}}</v-chip>
                                    </template>
                                  </template> 
                                  
                                </div>
                              </td>
                              <td class="text-xs-left text-md-right controls" v-if="!permissions.not_edit || permissions.make_delete">
                                
                                
                                <v-btn size="25" v-if="!permissions.not_edit" @click="go_to_edit(tr.key)" >
                                  <a :href="edit_link(tr)" @click.prevent="go_to_edit(tr.key)">
                                    <v-icon  color="primary">mdi-pencil</v-icon>
                                  </a>
                                </v-btn>&nbsp;
                                <v-btn size="25" v-if="permissions.make_delete" @click="delete_dialog(tr.key)" small>
                                  <v-icon  color="primary" icon >mdi-trash-can</v-icon>
                                </v-btn>
                              </td>
                            </tr>
                            
                        </tbody>
                      </table>
                    </div>
                    <div class="text-xs-left" v-if="results.count_pages>1">
                      <v-pagination :length="results.count_pages" v-model="page"></v-pagination>
                    </div>
              </template>
              <template v-else-if="!finding">
                <p>По Вашему запросу ничего не найдено </p>
              </template>
            </template>
            <div v-for="(o,idx) in out_after_search" :key="idx" v-html="o"></div>

                
      </div>
</div>
</template>
<script>
import FieldMemo from '../fields/memo.vue';
import ResultsMultiAction from './ResultsMultiAction.vue';
import res_file_uploader from './result_objects/file_uploader';
import res_form from './result_objects/form';
import FindResultsMethods from './result_objects/FindResultsMethods.js';
export default {
  components:{
    'field-memo':FieldMemo,
    'res-file-uploader':res_file_uploader,
    'res-form':res_form,
    'results_multi_action': ResultsMultiAction
  },
  props:[
    'results','permissions','go_search','finding','SearchDataSet',
    'fields','explain_query','out_before_search', 'out_after_search', 'not_out_result_search', 'last_search_params',
    'search_multi_action','on_filters','get_filter_by_name',
  ],
  data () {
    return {
        page:1,
        cur_str:false,
        show_memo_form:false,
        dialog:false,
        dialog_header:'Удаление элемента',
        dialog_body:'Вы действительно хотите удалить элемент?',
        dialog_type:'',
        delete_id:false,
        log:[],
        //dialog_log:[],
        errors:[],
        selected_ids:{},
        change_selected_ids:0 // изменение состава выбранных полей (без этого не работает реактивность)
    }
  },
  watch:{
    page(v){
        this.go_search(v,this.last_search_params);
    },
    dialog(){
      if(!this.dialog){
        this.errors=[]
      }
    },
    SearchDataSet(){
      this.page=this.SearchDataSet.page;
    }
        //this.go_search(v)
        //this.$emit('pageChange',v);
    
  },
  computed:{
    is_show_add_memo(){
      return this.CUR_STR.show_form;
    }
  },
  methods: FindResultsMethods
};
</script>
<style scope lang="scss">
@import '@/styles/variables.scss';
.errors {color: $error;}
.theme--light.v-pagination{
  
  
}
  .theme--light.v-pagination .v-pagination__item{
    width: auto;
    font-size: 0.9rem;
    min-width: 5px;
    
  }
  .v-pagination__item {font-size: 14px; width: 15px;}
 .memo_item{
   font-size: 0.9rem ;
 }
 .memo_item .registered{
   color: #3f51b5;
 }

 .memo_item .user{
   color: red;
 }
.results_wrap{
  
  overflow-x: auto;
  /*max-width: 1200px;*/
  margin: 0 auto;
}


.results{
  border-collapse: collapse;
  width: 100%;

  margin: 10px 0;
}

.results th{
  font-weight: bold;
}
.results td.controls, .results th.controls{
  width: 120px;
  vertical-align: middle;
  /*text-align: center;*/
}
.results td.controls button {
  margin: 0
}

.results tr:nth-child(2n+1) {
  background: $lighten5;
} 
/*.results tr.header {
  
  
  
  
  
}*/
.results td, table.results th {
  padding: 1rem; border: 1px solid gray;

}

.results td {
    position: relative;
    text-align: left;
    vertical-align: middle;
    padding: 3px;;
}

.results td .field{
  margin: 0 0.5rem;  
}


.application a {text-decoration: none;}
.application a.sort_asc .theme--light.v-icon {color: green;}
.application a.sort_desc .theme--light.v-icon {color: red;}
.application a.bold .theme--light.v-icon {font-weight: bold;}
/*
.application .theme--light.v-icon, .theme--light a.sort_asc .v-icon {color: green;}
.application .theme--light.v-icon, .theme--light .bold .v-icon {font-weight: bold;}

.application .theme--light.v-icon, .theme--light .sort_desc .v-icon {color: red;}
*/
.results td .saved {color: green; font-weight: bold;}
.results td .err {color: red; font-weight: bold;}
.results td.multi_action {padding-left: 10px;}
.sort_button a {text-decoration: none; white-space: nowrap;}
.controls a {text-decoration: none;}
@media only screen and (max-width: 1000px) {
    .results thead {
        display: none;
    }
    
    .results td{
      display: block;
      border: none;
      margin-top: 10px;
      padding: 10px;
      
    }
    .results td .field{
      margin: 0 0;  
      padding: 10px 0;
      border-bottom: 1px dotted $primary;
    }
    .results td.controls{
      width: 100%;
      padding-bottom: 2rem;
      border-bottom: 1px solid $primary;
    }
    /*.results td:first-child{border-top: 2px solid gray;}*/
    .results td:last-child{border-bottom: 3px solid $primary;}



    .results td:before{
      content: attr(data-label);
      /*position: absolute;*/
      font-weight: bold;
      color: $primary;
      text-decoration: underline;
      
    }

    

}
</style>