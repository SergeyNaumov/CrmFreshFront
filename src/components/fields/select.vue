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
              @input="change_field(field)"
              :hint="field.add_description"
              hide-details
            />
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
                                @input="change_field(field)"
                                hide-details
                                :rounded="$theme.rounded"
                              />
                  </div>
                </template>
                
                <template v-else>  
                    <template v-if="field.autocomplete">
                      <v-autocomplete 
                          :label="field.description"
                          v-model="value"
                          :items="values" item-value="v" item-text="d"
                          :search-input.sync="search"
                          :rounded="$theme.rounded"
                          :disabled="!!field.read_only || !!form.read_only"
                          no-data-text="не выбрано"
                          cache-items
                          clearable
                      />
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
                          @input="change_field(field)"
                      />
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
                          @input="change_field(field)"
                          :rounded="$theme.rounded"
                          hide-details
                        />
                      </template>
                      
                    </template>
                </template>
            </template>
            <div v-if="error_message" class="error_msg">{{error_message}}</div>
            <div v-if="warning_message" class="err" >{{warning_message}}</div>     
      </template>
    </div>
</template>

<script>
import { bus } from '../../main'
export default {
  
  data:function(){
    return {
      value:'',
      values:[],
      regexp_rules:[],
      error_message:'',
      warning_message:'',
      search:'' // для autocomplete
    }
  },
  props:['form','field','parent','refresh'],
  watch:{
        value(){
          this.field.value=this.value
          bus.$emit('change_field',this.field);
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
    if(!this.parent){
      
      bus.$on('field-update:'+this.field.name,new_data=>{
        if('values' in new_data) this.values=new_data.values;
        
        if(this.value !== new_data.value){
          this.$nextTick(
            ()=>{this.value=new_data.value}
          );
        }


        if('error_message' in new_data){
          this.$nextTick(
            ()=>{this.error_message=new_data.error_message}
          );
        }
        if('warning_message' in new_data){
          this.$nextTick(
            ()=>{this.warning_message=new_data.warning_message}
          );
        }
      })
    }
    this.value=this.field.value.toString(); 
    
    this.values=this.field.values;
    
    for(let v of this.values){
      v.v=v.v.toString()
    }
    this.change_field();
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
        
        this.$http.post(
          BackendBase+'/autocomplete/'+this.form.config,
          {
            term:this.search,
            field_name: this.field.name,
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
