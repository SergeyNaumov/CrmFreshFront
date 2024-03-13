<template>
  <div class="block">
    
    <div v-for="f in fields_for_block" :key="f.name+'_1'" class="field">
      <template v-if="is_only_field(f)"> <!--только поле без всего лишнего (для миниатюрных полей) -->
          
          <template v-if="f.before_html" v-html="f.before_html"></template>
          
          <component  :is="dynamic_component(f)"
                  :form="form" :field="f" 
          />
          <!--<div v-if="f.after_html" v-html="f.after_html"></div>-->
      </template>
      <div row wrap v-else>
        
          <v-flex md12 xs12 v-if="f.full_str || !f.description || is_default_full_str(f) || is_default_not_description(f)">
            <!-- FULL_STR -->
              <div class="description_container" v-if="f.description && !is_default_not_description(f)">{{f.description}}:</div>

              <template if="dynamic_component(f)">
              <!--
                Перенесено в компонент                
                <template v-if="f.before_html" v-html="f.before_html"></template>
              -->
                
                <component  :is="dynamic_component(f)"
                  :form="form" :field="f"  
                />

                
              </template>
              <!--
                Перенесено в компонент
                <div v-if="f.after_html" v-html="f.after_html"></div>
              -->

              
          </v-flex>
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


                <component  :is="dynamic_component(f)"
                  :form="form" :field="f" 
                />
                
                <!--<div v-if="f.type=='code' && f.after_html" v-html="f.after_html"></div>-->

              </template>
              </v-col>
            </v-row>
            <!-- NOT_FULL_STR -->
            <!--
            <v-flex md6 xs12 class="v-col-6description_container">
              {{f.description}}:
            </v-flex>
            
            
            <v-flex md6 xs12 class="field_container">
            

            </v-flex>
            -->
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
      props:['block_name','form','save','params','values','block_name'],
      created(){

      },
      watch:{

      },
      computed:{
        fields_for_block(){
          if(this.block_name){
            let list=[];
            for(var f of this.form.fields){
              if(f.tab==this.block_name)
                list.push(f);           
            }
            return list;
          }
          else{
            return this.form.fields
          }
        }
      },
      methods: {
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
                case 'multiconnect':
                case 'select':
                case 'date':
                case 'time':
                case 'datetime':
                case 'yearmon':
                case 'daymon':
                case 'font-awesome':
                case 'wysiwyg':
                case 'password':
                case 'code':
                case 'accordion':
                case 'memo':
                case '1_to_m':
                case 'file':  
                case 'docpack':
                case 'in_ext_url':
                case 'time_table':
                    res='field-'+field_type; break;
          };

          return res;
        },
        is_dynamyc_loader(field){ 
          //return false;
          return /^(1_to_m|wysiwyg|password)$/.test(field.type);
          //return (field.type=='1_to_m' || field.type=='wysiwyg')?true:false
        },
        is_default_full_str(field){
          return (typeof(field.full_str)=='undefined' && /^(1_to_1_)?(password|date|file|time|datetime|memo|wysiwyg|1_to_m|text|checkbox|select|switch|textarea|multiconnect|time_table)$/.test(field.type));
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
  .block {margin-top: 10px; padding-bottom: 10px;}  
  table.one_to_m td{
    border: 1px solid gray;
    padding: 0.5rem;
  }
  div.one_to_m{
    background-color: #eee;
    border: 1px solid gray;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  div.one_to_m .h{font-weight: bold; }
  div.one_to_m .controls{position: absolute; right: 1rem; bottom: 0rem; padding-top: 2rem;}
  .one_to_m_new{margin-left: 0.5rem;}
  .one_to_m_description {margin-top: 0.5rem}
  .description_container {
    margin-top: 10px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    margin-top: 15px;
    font-weight: bold;
    font-family: "Roboto", sans-serif;
  }
  .field_container {padding-left: 0; padding-right: 2rem;}
  div {line-height: 20px;}
</style>
