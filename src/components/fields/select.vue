<template>
    <div > 
       
        <!-- tree -->
        <template v-if="!field.hide">
          <template v-if="field.tree_use">
            <v-select
              :items="values"
              item-value="v"
              item-text="d"
              v-model="value"
              :label="field.description"
              class="input-group--focused"
              :rounded="$theme.rounded"

              :hint="field.add_description"
              hide-details
            /> <!--@input="change_field(field)"-->
          </template>
              
          <template v-else>

                <template v-if="field.background_color">
                  <div class="color_box">
                    <!-- colored select -->

                            <div class="color_container" :style="{'background-color':field.background_color}">
                            </div>                         
                              <v-select 
                                :multiple="!!field.multilpe"
                                :items="values"
                                :label="field.description"
                                v-model="value"
                                :descriprion="field.description"
                                item-value="v"
                                item-text="d"
                                :hint="field.add_description"
                                :disabled="!!field.read_only || !!form.read_only"
                                class="color_select"
                                autocomplete
                                :error-messages="error_message"

                                hide-details
                                :rounded="$theme.rounded"
                              /> <!--@input="change_field(field)"-->
                  </div>
                </template>
                
                <template v-else>  
                  
                    <template v-if="field.autocomplete">

                      <v-autocomplete 
                          :name="'x'+Math.random()"
                          autocomplete="false"
                          :label="field.description"
                          v-model="value"
                          :items="values" item-value="v" item-text="d"
                          :search-input.sync="search"
                          :rounded="$theme.rounded"
                          hide-details
                          no-data-text="Внимание! следует выбрать значение из списка, иначе оно не будет сохранено"
                          cache-items
                          clearable
                      /> <!--:disabled="!!field.read_only || !!form.read_only"-->
                    </template>
                    <template v-else>

                      <!-- not colored (p) select -->
                      <template v-if="values.length>15">
                        
                      <v-autocomplete 
                          

                          :label="field.description"
                          v-model="value"
                          :items="values" item-value="v" item-text="d"
                          :search-input.sync="search"
                          :rounded="$theme.rounded"
                          no-data-text="не выбрано"
                          cache-items
                          dense
                          :disabled="!!field.read_only"
                          clearable
                          hide-details

                      /> <!--@input="change_field(field)"-->
                      </template>
                      <template v-else>
                        <v-select
                          :label="field.description"
                          :items="values"
                          :style="field.style"
                          item-value="v"
                          item-text="d"
                          no-data-text="не выбрано"
                          v-model="value"
                          autocomplete
                          :disabled="!!field.read_only || !!form.read_only"

                          :rounded="$theme.rounded"
                          hide-details
                        /> <!--@input="change_field(field)"-->
                      </template>
                      
                    </template>
                </template>
            </template>
            <div v-if="error_message" class="error_msg">{{error_message}}</div>
            <div v-if="warning_message" class="err" >{{warning_message}}</div>     
            <div v-if="after_html" v-html="after_html"></div>
      </template>
    </div>
</template>

<script>
import { bus } from '../../main'
import { field_update,check_fld } from './field_functions'
export default {
  
  data:function(){
    return {
      value:'',
      values:[],
      regexp_rules:[],
      error_message:'',
      warning_message:'',
      after_html:'',
      search:'' // для autocomplete
    }
  },
  props:['form','field','parent','name_parent_field','refresh'],
  watch:{
        value(){
          //console.log('v:',this.value)
          this.field.value=this.value
          // этот костыль нужен для того, чтобы можно было поменять значение извне

          
          // this.display=false
          setTimeout(
            ()=>{
              
                  let s = this.get_search_from_values()
                  if(s){
                    this.search=s 
                  }                
              
            },200
          )
          if(this.parent){
            this.parent(this.field)
          }
          else{
            bus.$emit('change_field',this.field);
          }
          
        },
        refresh(){ 
            this.value=this.field.value+'';  
        },
        search(v){
          if(v && v.length>3){
            this.load_autocomplete(v)
          }
        },
        field(){
          this.value=this.field.value+'';
          
          //this.values=this.field.values;
        }

  },

  created(){
    let t=this
    t._field_update=(new_data)=>{
      field_update(new_data,t)
    };

    if(!t.parent){
      
      bus.$on(`field-update:${t.field.name}`,t._field_update )
    }
    else{
      console.log('parent:',parent)
    }

    t.value=t.field.value?t.field.value.toString():'';

    t.values=t.field.values;
    if(t.values && t.values.length==1 && Array.isArray(t.values[0])){
      // это костыль, отловить не смог, но в select-е 1_to_m values оборачивается внутрь []
      t.values=t.values[0]
    }
    for(let v of t.values){
      v.v=v.v.toString()
    }
    //this.change_field();
    check_fld(t);
  },
  mounted(){
    
  },
  computed:{
    style(){
      // let f=this.field;
      // let style=(f.style)?f.style:{}
      // style['border-top:']='3px solid '+f.background_color;
      //return style;
    }

  },
  methods: {
    load_autocomplete(search){
      if(this.field.autocomplete){
        
        if(this.search==this.get_search_from_values()){ // если в списке есть искомое значение, то сервер не дёргаем
          console.log('load_autocomplete / break ajax',this.search,this.get_search_from_values())
          return
        }
        
        let field_name=this.name_parent_field?`${this.name_parent_field}.${this.field.name}`:this.field.name
        this.$http.post(
          BackendBase+'/autocomplete/'+this.form.config,
          {
            term:this.search,
            field_name: field_name,
            action: 'get_list'
          }
        ).then(
          r=>{
            let d=r.data;
            if(d.success){
              let list=[];

              
              this.values=d.list
            }
            
          }
        )
      }
    },
    get_search_from_values(){
      if(!this.value){
        return ''
      }
      if(this.values.length){
        for(let v of this.values){
          //console.log('v:',v, this.value, (v==this.value) )
          if(v.v==this.value) {
            return v.d
            break

          }
        }
        return ''        
      }

    },

    change_field(field){
      let f=this.field;
      this.error_message='', f.error_message=''
      this.regexp_check();
      
      f.error=this.error_message?true:false;
      f.value=this.value;
      //console.log({CF: f});
      if(!f.error){
        if(this.parent)
            this.parent({value:f.value,error:f.error,name:f.name})
        else
          bus.$emit('change_field',f)
      }
    },
    regexp_check(){
      let f=this.field;
      if(f.regexp_rules){
        let i=0, error_message='';
        while(i<f.regexp_rules.length){
          let rule=f.regexp_rules[i]; let msg=f.regexp_rules[i+1];
          let test=eval(rule+'.test(this.value)');
          
          if(!test)
            error_message=msg;
          
          i=i+2;
        }
        this.error_message=error_message;
        
      }
    }
  }
}
</script>
<style scoped>
  .inline {display: inline-block;}

  .color_box {
      
      padding: 0;
      margin: 0;
      vertical-align: bottom;
  }
  .color_container { 
    width: 30px;
    height: 30px;
    display: inline-block;
    margin: 0px 10px -10px 0px;
    
    border: 1px solid gray;
    display: inline-block;
  }
  .v-input.color_select   {
    display: inline-block;
    
    width: calc(100% - 40px);
  }
  .error_msg {color: red;}
  .row.colored .col {padding: 0 5px 0 0; }
  .row.colored .col .v-text-field {padding-top: 0; margin-top: 0;}
  .v-select__slot  {padding-left: 2px;}
  .v-select__selection {padding-left: 5px;}
  
</style>
