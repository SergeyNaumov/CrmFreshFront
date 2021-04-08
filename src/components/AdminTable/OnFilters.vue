<template>
  <v-flex xs12 sm12 md7 lg7 offset-lg1 offset-md1  class="mb-2" >
    <v-card >
      <v-toolbar>
        <v-app-bar-nav-icon color="primary" @click="toggle_filters()"></v-app-bar-nav-icon>
        <v-subheader>Используемые фильтры</v-subheader>
      </v-toolbar>

    </v-card>
      <pre>
        
        
      </pre>
      <draggable :options="{handle:'.drag_area'}" :list="filter_list" v-show="SHOW_FILTERS_on">
        <div v-for="f in filter_list" :key="f.name">
            <div class="drag_area">
              <v-icon>fa-arrows-alt-v</v-icon>
            </div>
            <v-card   class="pa-2 mt-0 mb-3 onfilter" :outlined="true" >
                <div v-if="dynamic_component(f)" style="inline-block;  border; 1px solid black;">
                    <component :is="dynamic_component(f)" :field="f" :config="config" :filter_change="filter_change"/>              
                </div>            
            </v-card>
        </div>
        

        
      </draggable>
    
  </v-flex>
</template>
<script>
import FilterText from './filters/text.vue';
import FilterInExtUrl from './filters/in_ext_url.vue';
import FilterSelect from './filters/select.vue';
import FilterMemo from './filters/memo.vue';
import FilterDate from './filters/date.vue';
import FilterTime from './filters/time.vue';
import FilterDateTime from './filters/datetime.vue';
import FilterMulticonnect from './filters/multiconnect.vue';

export default {
  components:{
    'filter-text':FilterText,
    'filter-select':FilterSelect,
    'filter-date':FilterDate,
    'filter-time':FilterTime,
    'filter-datetime':FilterDateTime,
    'filter-memo':FilterMemo,
    'filter-multiconnect':FilterMulticonnect,
    'filter-in_ext_url':FilterInExtUrl
  },
  props:[
    'config','filters','on_filters','filter_change', 'SHOW_FILTERS_on', 'toggle_filters','ORDER'
  ],
  data () {
    return {
      filter_list:[],
      autocomplete_search:'',
      autocomplete_loading: false,
      aucocomplete_current:{}, // name элемента, в который что-то пишется
    }
  },
  created(){
    this.filter_list=this.on_filters
  },
  watch:{
    on_filters(){
      this.filter_list=this.on_filters

    },
    ORDER(){
      this.filter_list=this.on_filters
    }
  },

  computed:{

  },
  methods:{
    set_aucocomplete_current(f){
      var term=this.autocomplete_search;
      if(term && term!=f.old_search){
        f.old_search=term;
        this.$http.get(f.source+'?config='+this.config+'&field='+f.name+'&term='+term).then(response=>{
            f.values=response.data;
          }).catch(e => {
            alert('Error: '+e);
            //console.log('Eerror: '+e);
        })
      }
      
    },
    // save_datapicker(f,date){
    //   f.value=date
    // },
    dynamic_component(f){
        let res='';
        switch(f.type){
            case 'text':
            case 'textarea':
            case 'wysiwyg':
                res='filter-text'; break;
            
            case 'checkbox':
            case 'switch':
                res='filter-checkbox'; break;
            case 'select':
            case 'date':
            case 'datetime':
            case 'memo':
            case 'in_ext_url':
            case 'multiconnect':
                res='filter-'+f.type; break
            default: res='';
            
        }
        return res
    },
    search(){
      //console.log('submit!')
    }

  }
  
}
</script>
<style lang="scss" scoped>
    @import '@/styles/variables.scss';
  html {font-size: 12px;}
  .v-label {font-size: 12px;}
  .onfilter.sortable-ghost{background-color: $lighten4;}
  .drag_area{
    display: inline-block;   color: $primary;
    
    position: relative;
    top: 12px;
    z-index: 1;
    width: 100%;
    min-height: 12px;
    padding-left: 3px;
    border-radius: 3px;
    
    background-color: $lighten4;
  }
  .drag_area .v-icon {
    font-size: 8px;
    margin: 4px 4px 4px 4px;
    padding: 3px 3px 3px 4px;
    width: 16px;
    border: 1px solid gray;
    border-radius: 10px;
    color: $lighten5;
    background-color: gray;
    
  }
</style>
