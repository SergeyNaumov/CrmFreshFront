<template>
  <v-col cols="12" sm="12" md="7" lg="7" offset-lg="1" offset-md="1"  class="mb-2" id="on_filters">
<!---@ -->
    <v-card >

      <v-toolbar @click="toggle_filters()" elevation="4">
        <v-app-bar-nav-icon color="primary" ></v-app-bar-nav-icon>
        <v-list-subheader>Используемые фильтры</v-list-subheader>
      </v-toolbar></v-card>
      <form @submit.prevent="go_search(1)" autocomplete="new-password">
      <draggable :list="filter_list" item-key="name" handle=".drag_area" v-show="SHOW_FILTERS_on">
        <template #item="{ element: f }">
        <div :key="f.name">
            <div class="drag_area">
              <v-icon>fa-arrows-alt-v</v-icon>
            </div>
            <v-card   class="pa-2 mt-0 mb-3 onfilter" variant="outlined" >
                <div v-if="dynamic_component(f)" style="display:block; width:100%;">
                    <component
                      :is="dynamic_component(f)"
                      :field="f"
                      :config="config"
                      :filter_change="filter_change"
                      :filters_values="filters_values"
                      :refresh="refresh"
                    />              
                </div>            
            </v-card>
        </div>
        </template>

        
        </draggable>
      </form>
  </v-col>
</template>
<script>
/*
import FilterText from './filters/text.vue';
import FilterInExtUrl from './filters/in_ext_url.vue';
import FilterSelect from './filters/select.vue';
import FilterMemo from './filters/memo.vue';
import FilterDate from './filters/date.vue';
import FilterTime from './filters/time.vue';
import FilterDateTime from './filters/datetime.vue';
import FilterMulticonnect from './filters/multiconnect.vue';
import FilterYearMon from './filters/yearmon.vue'
import FilterFile from './filters/file.vue';
*/
export default {
  components:{
/*
    'filter-text':FilterText,
    'filter-select':FilterSelect,
    'filter-date':FilterDate,
    'filter-time':FilterTime,
    'filter-datetime':FilterDateTime,
    'filter-yearmon':FilterYearMon,
    'filter-memo':FilterMemo,
    'filter-multiconnect':FilterMulticonnect,
    'filter-in_ext_url':FilterInExtUrl,
    'filter-file':FilterFile
*/
  },
  props:[
    'config','filters','on_filters','filter_change', 'SHOW_FILTERS_on', 'toggle_filters','ORDER',
    'filters_values','go_search'
  ],
  data () {
    return {
      refresh:0,
      filter_list:[],
      autocomplete_search:'',
      autocomplete_loading: false,
      aucocomplete_current:{}, // name элемента, в который что-то пишется
    }
  },
  created(){
    this.filter_list=this.on_filters
    setTimeout(
        ()=>{
            document.querySelector('#on_filters').addEventListener('keydown', e=>{
              if (e.keyCode === 13) {
                // можете делать все что угодно со значением текстового поля
                console.log('press enter in on_filters');
                this.go_search(1)
              }
            });
        },
        100
    )


  },
  watch:{
    config(){
      this.refresh=Math.random()
    },
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
            case 'file':
            case 'select':
            case 'date':
            case 'datetime':
            case 'yearmon':
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
  html {font-size: 12px;}
  #on_filters form { margin-top: 10px; }
  .v-label {font-size: 12px;}
  .onfilter.sortable-ghost{background-color: var(--app-tint);}
  .onfilter {
    border-color: rgba(var(--v-theme-on-surface), 0.12) !important;
    margin-top: 10px;
    margin-bottom: 6px;
  }
  .drag_area{
    display: flex;
    align-items: center;
    color: rgb(var(--v-theme-primary));
    width: 100%;
    height: 22px;
    padding-left: 6px;
    border-radius: 3px;
    background-color: var(--app-tint);
  }
  .drag_area .v-icon {
    font-size: 10px;
    margin: 0;
    padding: 0;
    width: 18px;
    height: 18px;
    min-width: 18px;
    line-height: 1;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid gray;
    border-radius: 50%;
    color: rgb(var(--v-theme-primary-lighten-5));
    background-color: gray;
    
  }
</style>
