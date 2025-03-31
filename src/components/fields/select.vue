<template>
  <div>
    <v-icon></v-icon>
    <!-- tree -->
    <template v-if="!source_field.hide">
      <div v-if="source_field.before_html" v-html="source_field.before_html"></div>
      
      <!-- Если используется древовидная структура -->
      <template v-if="field.tree_use">
        
        <v-select
          :items="values"
          item-value="v"
          item-title="d"
          v-model="value"
          :label="field.description"
          :rounded="$theme.rounded"
          :hint="field.add_description"
          hide-details
          @update:modelValue="input"

        />
      </template>

      <!-- Если не используется древовидная структура -->
      <template v-else>
        <!-- Цветной селект -->
        <template v-if="field.background_color">
          <div class="color_box">
            <div
              class="color_container"
              :style="{ 'background-color': field.background_color }"
            ></div>
            <v-select
              :multiple="!!field.multiple"
              :items="values"
              :label="field.description"
              v-model="value"
              item-value="v"
              item-title="d"
              :hint="field.add_description"
              :disabled="!!field.read_only || !!form.read_only"
              class="color_select"
              @update:modelValue="input"
              :error-messages="error_message"
              hide-details
              :rounded="$theme.rounded"
            />
          </div>
        </template>

        <!-- Обычный селект -->
        <template v-else>

          <!-- С автозаполнением -->
          <!--  -->
          <template v-if="field.autocomplete">
            <v-autocomplete
              :label="field.description"  
              v-model="value"
              :items="values"
              :attrs="{ autocomplete: 'new-password' }"
              placeholder="Введите что-нибудь для автозаполнения"
              item-value="v"
              item-title="d"
              v-model:search="search"
              :rounded="$theme.rounded"
              no-data-text="Внимание! Следует выбрать значение из списка, иначе оно не будет сохранено"
              cache-items
              variant="filled"
              clearable
              hide-details
              :prepend-icon="field.icon"
            /> 
            <!-- @update:modelValue="input" -->
          </template>

          <!-- Без автозаполнения -->
          <template v-else>
            
            <template v-if="values.length > 15">
              
              <v-autocomplete
                :label="field.description"
                v-model="value"
                :items="values"
                item-value="v"
                item-title="d"
                
                :search-input.sync="search"
                :rounded="$theme.rounded"
                no-data-text="Не выбрано"
                cache-items
                variant="filled"
                density="compact"
                :disabled="!!field.read_only"
                clearable
                hide-details
                :autocomplete="false"
                :prepend-icon="field.icon"
              />
              <!-- @update:modelValue="input" -->

              
            </template>
            <template v-else>
              <v-select
                :label="field.description"
                :items="values"
                :style="field.style"
                item-value="v"
                item-title="d"
                
                no-data-text="Не выбрано"
                v-model="value"
                :disabled="!!field.read_only || !!form.read_only"
                :rounded="$theme.rounded"
                
                hide-details
                v-on:input="$emit('input', $event)"
                :prepend-icon="field.icon"
              />
              <!-- @update:modelValue="input" -->
            </template>
          </template>
        </template>
      </template>

      <!-- Сообщения об ошибках и предупреждения -->
      <div v-if="source_field.error_message" class="error_msg">{{ source_field.error_message }}</div>
      <div v-if="source_field.warning_message" class="warning">{{ source_field.warning_message }}</div>
      <div v-if="source_field.after_html" v-html="source_field.after_html"></div>
    </template>
  </div>
</template>

<script>
import { getValueByField, setValueByField,frontend_process } from '../js/field_functions'
export default {
  
  data:function(){
    return {
      value:'0',
      values:[],
      search:'' // для autocomplete
    }
  },
  props:['form','field', 'save_field_to_store','save_to_store', 'get_value_by_field','get_source_field'],
  watch:{
        value(){
          let t=this, ov=getValueByField(t), nv=t.value

          console.log('nv:',nv)
          if(nv != ov){
            setValueByField(t, t.field, nv)
          }
        },
        source_field(f){
          setTimeout(
            ()=>{
              this.value=this.source_field.value
            },100
          )
          
        },
        search(v){
          if(v && v.length>2){
            console.log('LOAD Autocomplete')
            this.load_autocomplete(v)
            //frontend_process
          }
        },
        // field(){
        //   this.value=this.field.value+''; 
        //   //this.values=this.field.values;
        // }
  },

  created(){

    let t=this, f=t.field
    let v=getValueByField(t)
    

    t.value=v?v.toString():'';
    console.log('field select:', t.value)
    t.values=(t.field && t.field.values)?t.field.values:[];

    if(t.values && t.values.length==1 && Array.isArray(t.values[0])){
      // это костыль, отловить не смог, но в select-е 1_to_m values оборачивается внутрь []
      t.values=t.values[0]
    }
    
    for(let v of t.values){
      v.v=v.v.toString()
    }
    if(f.autocomplete){
      t.values=[]
      if(!t.value || t.value=='0'){
        t.value=''
      }
    }
    //this.change_field();
    //check_fld(t);
  },
  mounted(){
    
  },
  computed:{
    style(){
      // let f=this.field;
      // let style=(f.style)?f.style:{}
      // style['border-top:']='3px solid '+f.background_color;
      //return style;
    },
    refresh(){
      return this.$store.state.refresh
    },
    source_field(){
      let t=this, f=t.field
      if(typeof t.get_source_field=='function'){  
        return t.get_source_field(f.name)
      }
      return t.$store.state.fields[f.name]
    },

  },
  methods: {
    delayOpen() {
      setTimeout(() => {}, 10); // Добавляем задержку
    },
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
    input(){
      let t=this, f=this.field
      console.log('input:',t.value)
      console.log('search:',t.search)
      t.value=setValueByField(t, t.field, t.value)
      console.log('new_value:',t.value)
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
    position: relative;
    top: -15px;    
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
