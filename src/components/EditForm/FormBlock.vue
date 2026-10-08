<template>
  <div class="block">
    
    <div v-for="f in fields_for_block" :key="f.name+'_1'" class="field">

      <template v-if="is_only_field(f)"> <!--только поле без всего лишнего (для миниатюрных полей) -->
          
          <template v-if="f.before_html" v-html="f.before_html"></template>
          
          <div class="control_row">
            <div v-if="f.icon" class="field_icon"><v-icon color="primary">{{ f.icon }}</v-icon></div>
            <div class="control_body">
              <component  :is="dynamic_component(f)" v-if="dynamic_component(f)"
                      :form="form" :field="f" 
              />
            </div>
          </div>
          <!--<div v-if="f.after_html" v-html="f.after_html"></div>-->
      </template>
      <div v-else>
          
          <v-col md="12" cols="12" v-if="f.full_str || !f.description || is_default_full_str(f) || is_default_not_description(f)">
            <!-- FULL_STR -->
              <div class="description_container" v-if="f.description && !is_default_not_description(f)">{{f.description}}:</div>
              <div class="control_row" v-if="dynamic_component(f)">
                <div v-if="f.icon" class="field_icon"><v-icon color="primary">{{ f.icon }}</v-icon></div>
                <div class="control_body">
                  <component  :is="dynamic_component(f)"
                    :form="form" :field="f"  
                  />
                </div>
              </div>

              
          </v-col>
          <template v-else>
            
            <v-row no-gutters>
              <v-col cols="12" xs="12" md="2"  >{{f.description}}:</v-col>
              <v-col cols="12" xs="12" md="10" >
                <template v-if="is_dynamyc_loader(f)" style="display: inline-block;">
              
                <!--
                <dynamic-loader 
                  :form="form" :field="f" 
                />-->
              </template>
              <template v-else-if="dynamic_component(f)">
                <template v-if="f.before_html" v-html="f.before_html"></template>

                <div class="control_row">
                  <div v-if="f.icon" class="field_icon"><v-icon color="primary">{{ f.icon }}</v-icon></div>
                  <div class="control_body">
                    <component  :is="dynamic_component(f)"
                      :form="form" :field="f" 
                    />
                  </div>
                </div>
                
                <!--<div v-if="f.type=='code' && f.after_html" v-html="f.after_html"></div>-->

              </template>
              </v-col>
            </v-row>
            <!-- NOT_FULL_STR -->
          </template>
      </div>

      <template v-if="f.type=='save_button' && !form.read_only">
                    <div style="text-align: center">
                      <v-btn color="primary" >Сохранить</v-btn>
                    </div>
      </template>

    </div>

  </div>
           
</template>

<script>
import FieldPassword from '../fields/password';

   export default {
      components:{
        'field-password':FieldPassword
      },
      name:'form-block',
      data:function(){
        return {
          valid: false
        }
      },
      props:['block_name','form','save','params','values'],
      created(){

      },
      watch:{

      },
      computed:{
        fields_for_block(){
          let list;
          if(this.block_name){
            list=[];
            for(var f of this.form.fields){
              if(f.tab==this.block_name)
                list.push(f);           
            }
          }
          else{
            list=this.form.fields
          }
          return list.filter(f=>this.is_renderable(f));
        }
      },
      methods: {
        is_renderable(field){
          if(field.hide)
            return false
          if(field.type=='save_button')
            return true
          if(field.before_html)
            return true
          return !!this.dynamic_component(field)
        },
        dynamic_component(field){
          let res='';
          // if(this.is_dynamyc_loader(field)){
          //   return () => import(`../fields/${field.type}`); 
          // }
          let field_type=field.type.replace('1_to_1_','')
          switch(field_type){
                case 'text':
                case 'textarea':
                    res='field-text';break;
                case 'checkbox':
                case 'switch':
                    res='field-checkbox'; break
                case 'component':
                case 'multiconnect':
                case 'multiconnect_old':
                case 'select':
                case 'date':
                case 'time':
                case 'datetime':
                case 'yearmon':
                case 'daymon':
                case 'font-awesome':
                case 'wysiwyg':
                case 'page_blocks':
                case 'password':
                case 'code':
                case 'codelist':
                case 'accordion':
                case 'memo':
                case '1_to_m':
                case 'file':  
                case 'docpack':
                case 'in_ext_url':
                case 'time_table':
                    res='field-'+field_type; break;
                case 'project_sitemap':
                    res='field-project_sitemap'; break;
                case 'project_export':
                    res='field-project_export'; break;
                case 'project_clone':
                    res='field-project_clone'; break;
                case 'project_struct':
                    res='field-project_struct'; break;
          };

          return res;
        },
        is_dynamyc_loader(field){ 
          //return false;
          return /^(1_to_m|wysiwyg|password)$/.test(field.type);
          //return (field.type=='1_to_m' || field.type=='wysiwyg')?true:false
        },
        is_default_full_str(field){
          return (typeof(field.full_str)=='undefined' && /^(1_to_1_)?(password|date|file|time|datetime|memo|wysiwyg|1_to_m|text|checkbox|select|switch|textarea|multiconnect|time_table|codelist)$/.test(field.type));
        },
        is_default_not_description(field){ // если вдруг буду ещё поля, которые по умолчанию должны быть без description-а

          if(field.not_description)
            return true
          if(field.type=='multiconnect')
            return false
          if(/^(1_to_1_)?(wysiwyg|memo|1_to_m|password|file|datetime|code)$/.test(field.type))
            return false
          return true
          //(field.not_description && );
        },
        is_only_field(field){
          //return false;
          return (/^(checkbox|switch)$/.test(field.type) || field.read_only && /^(date|datetime)$/.test(field.type));
        }
      }
  }
</script>
<style scoped>
  .block {margin-top: var(--app-space-section); padding-bottom: 0;}  
  /* Иконка поля выравнивается по контролу: высота как у поля */
  .control_row {display: flex; align-items: flex-start; gap: var(--app-space-inline);}
  .field_icon {
    flex: 0 0 auto;
    width: var(--app-field-height, 40px);
    height: var(--app-field-height, 40px);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--app-radius-field);
    background-color: var(--app-tint);
    color: rgb(var(--v-theme-primary));
  }
  .field_icon .v-icon {
    font-size: calc(var(--app-field-height, 40px) * 0.55) !important;
  }
  .control_body {flex: 1 1 auto; min-width: 0;}
  .block .field .v-col {padding: 0;}
  .block .field .v-input {margin-bottom: 0;}
  .block .field .v-row {margin-bottom: 0;}
  .block .description_container {margin-top: 0; margin-bottom: 4px;}
  table.one_to_m td{
    border: 1px solid rgba(var(--v-theme-on-surface), 0.24);
    padding: 0.5rem;
  }
  div.one_to_m{
    background-color: var(--app-tint);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.24);
    padding: 1rem;
    margin-bottom: 1rem;
  }
  div.one_to_m .h{font-weight: bold; }
  div.one_to_m .controls{position: absolute; right: 1rem; bottom: 0rem; padding-top: 2rem;}
  .one_to_m_new{margin-left: 0.5rem;}
  .one_to_m_description {margin-top: 0.5rem}
  .description_container {
    font-size: var(--app-font-desc);
    color: rgba(var(--v-theme-on-surface), 0.7);
    font-weight: bold;
    font-family: var(--app-font-family);
  }
  .field_container {padding-left: 0; padding-right: 2rem;}
  div {line-height: 20px;}
</style>
