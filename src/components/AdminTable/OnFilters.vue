<template>
  <v-col cols="12" sm="12" md="7" lg="7" offset-lg="1" offset-md="1" class="mb-2" id="on_filters">
    <!-- Карточка с фильтрами -->
    <v-card>
      <v-toolbar >
        <!-- <v-app-bar-nav-icon color="primary"></v-app-bar-nav-icon> -->
        
         <a href="#" @click.prevent="toggle_filters()"><fa size="16" class="ml-4 mr-5" icon="fa-bars" set="fa"></fa></a>
         Используемые фильтры

        
      </v-toolbar>
    </v-card>

    <!-- Форма для фильтров -->
    <form @submit.prevent="go_search(1)" autocomplete="new-password" v-if="SHOW_FILTERS_on">
      <draggable
        :list="filter_list"
        v-model="filter_list"
        handle=".drag_area"
        itemKey="name" 
      >
        <template #item="{ element: f, index }">
          <div :key="index">
            <div class="drag_area">
              <v-icon>fa-arrows-up-down</v-icon>
            </div>
            <v-card class="pa-2 mt-0 mb-3 onfilter" outlined>
              <div v-if="dynamic_component(f)">
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

export default {
  components:{

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
    @import '@/styles/variables.scss';
    .v-toolbar__content {background: #fff;}
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
    font-size: 12px;

    margin: 2px 4px 4px 4px;
    padding: 10;
    width: 16px;
    // border: 1px solid gray;
    // border-radius: 10px;
    color: $lighten5;
    color: gray;
    
    
  }
</style>
