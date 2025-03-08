<template>
  <div class="const">
    <v-card>
    <h1 class="title">Константы системы</h1>
    <p>(сохранение происходит сразу после изменения значений)</p>

    <v-tabs v-model="cur_tab" bg-color="primary" v-if="tabs.length">
          <v-tab v-for="t in tabs" :key="`tab${t.name}`":value="t.name" >{{t.description}}</v-tab>
    </v-tabs>

    <div>
      <!-- Вывод ошибок -->
      <template v-if="errors.length">
        <div v-for="(e,idx) in errors" class="error" :key="'e'+idx">{{e}}</div>
      </template>

      <div >
        <pre v-if=0>{{list}}</pre>
          <table>
          <template v-for="l in list" v-if="show_field(l)">
                <template v-if="l.type=='header'">
                  <!-- <tr><td colspan="2"><b>{{l.header}}</b></td></tr> -->
                  <div class="header"><b>{{l.header}}</b></div>
                </template>
                <template v-else>
                  <div class="item">
                        <template v-if="l.type=='text'">
                          {{l.header}}:
                          <input type="text" v-model="l.value" @keyup="change(l)">
                        </template>
                        <template v-if="l.type=='textarea'">
                          {{l.header}}:
                          <textarea
                            v-model="l.value"
                            @keyup="change(l)"
                          />
                        </template>
                        <template v-if="l.type=='wysiwyg'">
                          {{l.header}}:
                          <field-wysiwyg
                            :field="l"
                          />
                        </template>
                        <template v-if="l.type=='file'">
                          {{l.header}}:
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
                            <input type="checkbox"   v-model="l.value" @change="change(l)"> {{l.header}}
                        </template>
                        <template v-if="l.type=='switch'">
                            <v-switch   v-model="l.value" @change="change(l)"/>
                        </template>
                        <template v-if="l.type=='select'">
                            {{l.header}}:
                        <field-select :form="form" v-if="l.type=='select'" :field="l"
                        />

                        </template>
                        <div v-if="l.saved" class="saved">
                            сохранено
                        </div>
                  </div>
<!--                       <tr :key="l.name">
                        <td class="label">{{l.header}}:</td>
                        <td>
                        <template v-if="l.type=='text'">
                          <input type="text" v-model="l.value" @keyup="change(l)">
                        </template>
                        <template v-if="l.type=='textarea'">
                          <textarea
                            v-model="l.value"
                            @keyup="change(l)"
                          />
                        </template>
                        <template v-if="l.type=='wysiwyg'">
                          <field-wysiwyg
                            :field="l"
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
                        <template v-if="l.type=='select'">
                            <select v-model="l.value">
                              <option v-for="v in values" :value="v.v">{{v.d}}</option>
                            </select>
                        </template>
                        <field-select :form="form" v-if="l.type=='select'" :field="l"
                        />
                        <div class="add_description" v-if="l.add_description">
                          {{l.add_description}}
                        </div>


                      </td>
                    </tr> -->
              </template>
        </template>
      </table>
      </div>


    </div>
    </v-card>
  </div>          
</template>

<script>
let t
//import { bus } from '../main'
export default {
        props:["params"],
        data: () => ({
          cur_tab:0,
          tabs:[],
          form:{},
          config:'',
          filedir:'',
          list:[], // список типов констант
          errors:[]
        }),

        mounted () {
           
        },

        created(){
          t=this
          t._change_field=(field,not_frontend_process)=>{
            //console.log('field: ',field)
            t.change(field)
          },
          this.$bus.$on('change_field', t._change_field);
          if(t.params && t.params.config){
            t.config=t.params.config
          }
          t.get_list()
          
        },
        beforeDestroy(){
          this.$bus.$off('change_field',t._change_field);
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
                

                t.$http.post(
                  BackendBase+'/const/save_value',
                  {
                    config: t.config,
                    name: l.name,
                    value: orig_name,
                    src: fileSrc
                  }
                ).then(
                  r=>{
                    let d=r.data;
                    if(d.success){ 
                        l.value=d.value || ''
                        t.mark_success(l);
                    }
                  }
                ).catch(
                  e=>{
                    t.errors=[e]
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
                  t.list=d.list
                  t.filedir=d.filedir

                  // табы
                  if(d.tabs && d.tabs.length){
                    t.tabs=d.tabs


                  }
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
          },
          show_field(field){
            // для табов: условие отображения поля
            return !field.hide && (!t.tabs.length || t.tabs[t.cur_tab].name == field.tab)

          },


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
  td.label {width: 200px; }
  table {width: calc(100% - 35px); border-collapse: collapse;}
  table td {vertical-align: top; padding: 10px; 
    font-size: 11pt;
    border-top: 1px solid gray;
    border-bottom: 1px solid gray;
  }
  table tr:nth-child(odd) td {background-color: #f1f1f1;}
  div.item{
    vertical-align: top; padding: 10px;
    font-size: 11pt;
    border-top: 1px solid gray;
    border-bottom: 1px solid gray;
  }
  div.item:nth-child(odd) {background-color: #f1f1f1;}
  div.header {text-align: center;
    padding: 20px;
  }
  input[type=text] {
    padding: 5px;
    border-radius: 3px;
    border: 1px solid rgb(192, 192, 192); width: 100%;}
  textarea {
    padding: 5px;
    width: 100%; height: auto;
    border-radius: 3px;
    height: 100px;
    border: 1px solid rgb(192, 192, 192) !important;
  }
  .add_description {
    margin-top: 10px;
    color: gray;
    font-size: 0.8rem;
  }
  .saved {
    height: 10px; position: relative; top: -1px; font-size: 9pt;
    z-index: 1000;
  }
</style>



