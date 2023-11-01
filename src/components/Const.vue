<template>
  <div class="const">
            <h1 class="title">Константы системы</h1>
            <p>(сохранение происходит сразу после изменения значений)</p>
            <div >
            <template v-if="errors.length">
              <div v-for="(e,idx) in errors" class="error" :key="'e'+idx">{{e}}</div>
            </template>
            <div >
              <pre v-if=0>{{list}}</pre>
                <table>
                <tr v-for="l in list" :key="l.name">
                  <td class="label">{{l.header}}:</td>
                  <td>
                  <template v-if="l.type=='text'">
                    <input type="text"
                      v-model="l.value"
                      
                      @keyup="change(l)"
                    >
                  </template>
                  <template v-if="l.type=='textarea'">
                    <textarea
                      v-model="l.value" 
                      
                      @keyup="change(l)"
                    />
                  </template>

                  <template v-if="l.type=='file'">
                    
                    <input type="file"
                    :id="'const_file_'+l.name"
                    @change="file_upload(l)"
                    />
                    <div v-if="l.value">
                      <a :href="filedir+'/'+l.value" target="_blank">открыть в браузере</a> | 
                      <a :href="filedir+'/'+l.value" :download="l.value">загрузить</a>
                    </div>
                    
                  </template>
                  <template v-if="l.type=='checkbox'">
                      <input type="checkbox"   v-model="l.value" @change="change(l)">
                  </template>
                  <template v-if="l.type=='switch'">
                      <v-switch   v-model="l.value" @change="change(l)"/>
                  </template>
                  <field-select :form="form" v-if="l.type=='select'" :field="l"
                  />
                  <div v-if="l.saved" class="saved">
                    
                      сохранено
                    
                  </div>
                </td>
              </tr>
            </table>
            </div>
            

            </div>
  </div>          
</template>

<script>
import { bus } from '../main'
export default {
        props:["params"],
        data: () => ({
          form:{},
          config:'',
          filedir:'',
          list:[], // список типов констант
          errors:[]
        }),

        mounted () {
           
        },

        created(){
          this._change_field=(field,not_frontend_process)=>{
            //console.log('field: ',field)
            this.change(field)
          },
          bus.$on('change_field', this._change_field);
          if(this.params && this.params.config){
            this.config=this.params.config
          }
          this.get_list()
          
        },
        beforeDestroy(){
          bus.$off('change_field',this._change_field);
        },
        watch:{
          
        },
        methods: {
          _change_field(){

          },
          file_upload(l){
            
            let file = document.getElementById('const_file_'+l.name).files[0];
            if(file){
              
            
              
              let reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = (e) => {
                let orig_name=file.name, fileSrc=e.target.result;
                //this.field_error_check();
                

                this.$http.post(
                  BackendBase+'/const/save_value',
                  {
                    config: this.config,
                    name: l.name,
                    value: orig_name,
                    src: fileSrc
                  }
                ).then(
                  r=>{
                    let d=r.data;
                    if(d.success){ 
                        l.value=d.value || ''
                        this.mark_success(l);
                    }
                  }
                ).catch(
                  e=>{
                    this.errors=[e]
                  }
                );
              }
            }

          },
          get_list(){
            this.$http.post(BackendBase+'/const/get',{config: this.config}).then(
              r=>{
                let d=r.data;
                this.errors=d.errors
                if(d.success){
                  for(let l of d.list){
                    if(l.type=='checkbox' || l.type=='switch')
                        l.value=l.value?true:false;

                    else if(!l.value)
                      if(l.type=='text' || l.type=='textarea')
                        l.value=''                      
                    
                    l.begin_value=l.value,
                    l.saved=false;
                    
                  }
                  this.list=d.list
                  this.filedir=d.filedir
                }
              }
            )
          },
          change(l){
            if(l.before_value==l.value) // если значение не поменялось -- ничего не делаем
              return

            if(!l.cnt_ajax) l.cnt_ajax=0;
            l.cnt_ajax++;
            setTimeout( // оборачиваем в setTimeout, чтобы не долбить постоянно ajax-ом
              ()=>{
                l.cnt_ajax--;
                if(l.cnt_ajax>0)
                  return
                let value=l.value;
                
                if(l.type=='checkbox' || l.type=='switch'){
                  value=value?1:0
                }

                this.$http.post(
                  BackendBase+'/const/save_value',
                  {
                    config: this.config,
                    name: l.name,
                    value: value
                  }
                ).then(
                  r=>{
                    let d=r.data;
                    if(d.success){ 
                        this.mark_success(l);
                    }
                  }
                ).catch(
                  e=>{
                    this.errors=[e]
                  }
                );
               
              },
              500
            );
          },
          mark_success(l){ // выводим сообщение "сохранено", затем гасим его
            l.saved=true; l.before_value=l.value
            setTimeout(
              ()=>{ 
                
                l.saved=false
              },
              500
            )
          }
        },

        computed: {
          
        }
}
</script>
<style scoped>
  .const {margin: 20px; width: 100%; max-width: 1280px;}
  .saved {color: green; padding-bottom: 15px;}
  table {
    width: 100%;
    border-left: 1px solid gray;
    border-right: 1px solid gray;
  }
  td.label {max-width: 100px;}
  table {width: 100%; border-collapse: collapse;}
  table td {vertical-align: top; padding: 10px; 
    font-size: 11pt;
    border-top: 1px solid gray;
    border-bottom: 1px solid gray;
  }
  table tr:nth-child(odd) td {background-color: #f1f1f1;}
  input[type=text] {
    padding: 2px;
    border-radius: 3px;
    border: 1px solid rgb(192, 192, 192); width: 100%;}
  textarea {
    padding: 2px;
    width: 100%; height: auto;
    border-radius: 3px;
    border: 1px solid rgb(192, 192, 192) !important;
  }
  .saved {
    height: 10px; position: relative; top: -1px; font-size: 9pt;
    z-index: 1000;
  }
</style>



