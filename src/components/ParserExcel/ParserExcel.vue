<template>
  <v-app>
        <v-container>
            <v-card class="mx-auto auth"> 
                <h1 color="primary">{{parser.title}}</h1>
                <div class="err" v-for="(e,idx) in errors" :key="'err'+idx">{{e}}</div>
                <!-- сообщение об успешной загрузке -->
                <v-dialog v-model="success_parse" max-width="290">
                  <v-card>
                    <v-card-title class="text-h5">Загрузка </v-card-title>
                    <v-card-text>Ваш файл {{orig_name}} был успешно загружен на сервер!<br><span v-if="message">{{message}}</span></v-card-text>

                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn color="primary" @click="success_parse = false">
                        ОК
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>

                <v-dialog v-model="refs_dialog" max-width="560">
                  <v-card>
                    <v-card-title class="text-h6">Справочники</v-card-title>
                    <v-card-text>
                      <div v-for="r in refs_check" :key="'ref'+r.key" style="margin-bottom: 8px;">
                        <div v-if="r.missing && r.missing.length">
                          Не найдены {{r.label}}:
                          <b>{{r.missing.join(', ')}}</b>
                        </div>
                        <div v-if="r.bad_ids && r.bad_ids.length" style="color: #b00;">
                          Id {{r.label}} вне текущего проекта
                          ({{r.bad_ids.map(b=>b.id).join(', ')}}) — будут пропущены
                        </div>
                      </div>
                      <div class="comment">Значения можно создать, они будут добавлены в текущий проект.</div>
                    </v-card-text>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn v-if="refs_has_missing" color="primary" @click="create_and_continue">Создать и продолжить</v-btn>
                      <v-btn @click="skip_refs">Продолжить без создания</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>



                <template v-if="!before_load_fields_selected">
                    <!-- Поля, которые выбираются перед инициализацией парсера -->
                    <div v-html="before_load_fields_message"></div>
                    <div v-for="f in before_load_fields">
                      <v-select
                        :label="f.description"
                        v-model="f.value"
                        :items="f.values" item-value="v" item-title="d"
                        :multiple="false"
                        no-data-text="Выберите значение"
                        cache-items
                        @update:model-value="select_before_field(f)"
                        clear
                      ></v-select>
                    </div>
                    <v-btn :disabled="!before_load_fields_next_show" @click.prevent="before_load_fields_selected=true">продолжить</v-btn>
                </template>
                <template v-else>
                  <div v-if="before_load_fields.length" style="margin-bottom: 20px;">
                    <a href="" @click.prevent="before_load_fields_selected=false">&lt;&lt; назад</a>

                  </div>
                  <!-- Форма для загрузки -->
                  <form id="parse_xls_form">


                      <div><input type="file" id="parse_xls_file" @change="change_input_file"></div>
                      <div v-if="src" style="margin-top: 10px;">
                        <a href="" @click.prevent="cancel">отменить</a>
                        <!--<a href="" @click.prevent="preload">preload</a>-->
                      </div>

                  </form>
                  <div class="comment" v-if="preload_data.length && loaded_filename">
                    <div v-if="!all_fields_selected" class="not_selected">
                      Файл загружен на сервер, для того, чтобы продолжить -- выберите соответствие колонок:
                    </div>
                    <div class="selected">
                      Проверьте соответствие колонок:
                    </div>
                    <!-- интерактивные надписи в зависимости от того, на каком этапе мы находимся -->
                    <table class="select_cols">
                      <tr v-for="(f,k) in parser.fields" :key="'field'+k" >
                          <td>{{f.description}}</td>
                          <td>
                            <select v-model="f.selected">
                              <option value="-1">выберите столбец</option>
                              <!-- v-for и v-if на одном элементе: в Vue 3 v-if
                                   имеет приоритет и вычисляется вне области
                                   видимости v-for (был TypeError: h is undefined) -->
                              <template v-for="h in first_header" :key="h.v">
                                <option v-if="h.v" :value="h.v">{{h.d}}</option>
                              </template>
                            </select>
                            <template v-if='!all_fields_selected'>
                              <div v-if="f.selected>=0" class="selected">выбрано</div>
                              <div v-else class="not_selected">не выбрано</div>
                            </template>
                          </td>
                      </tr>
                    </table>
                    <div v-if="all_fields_selected" style="color: green; font-weight: bold;">
                      <div class="selected" v-if="data_line_number">
                        Отлично, теперь можно приступить к загрузке файла
                        <hr>
                        <v-btn size="small" color="primary" v-if="all_fields_selected" @click="load()">Загрузить</v-btn>
                      </div>
                      <div class="not_selected" v-else>Все столбцы выбраны. Теперь отметьте слева строку, с которой начинаются данные (заголовок не считаем)</div>
                    </div>
                  </div>
                  <div v-else class="comment"
                    >Вы можете загрузить файл в формате xls или xlsx
                  </div>
                  <v-progress-linear
                    color="primary"
                    indeterminate
                    rounded
                    height="6"
                    v-if="uploading"
                  />
                  <hr>
                  <h2 v-if="preload_data.length && loaded_filename">Предварительный просмотр:</h2>

                  <table class="preload">
                    <tr v-for="(col,i) in preload_data" :key="'col'+i">

                      <td>
                        <template v-if="i==0">данные</template>
                        <input v-else
                          type="radio"
                          v-model="data_line_number"
                          :value="parseInt(i)"
                        />
                      </td>

                      <td v-for="(v,j) in  col" :key="'col'+j">{{v}}</td>

                    </tr>

                  </table>
                </template>
            </v-card>
          
        </v-container>
  </v-app>
</template>

<script>
import {  init, select_before_field, preload, load, create_and_continue, skip_refs } from './methods.js'

export default {
        props:['params'],
        data: () => ({
          before_load_fields_message:'',
          before_load_fields:[],
          before_load_fields_selected:false,
          before_load_fields_next_show: false,
          orig_name:'',
          src:'',
          uploading: false,
          data_line_number: false, // первая строка с данными
          parser:{
          },
          preload_data:[],
          cnt_rows_deleted_preview:0, // для подсчёта количества удалённых строк из превью
          first_header:[],
          loaded_filename:'',
          success_parse:false,
          message:'',
          refs_check:[],
          refs_dialog:false,
          errors:[]
        }),
        
        mounted () {
           
        },
        created(){
          this.init()
        },
        watch:{
          success_parse(v){
            if(!v){
              this.cancel()
            }
          }
        },
        methods: {
          init(){
            init(this)
          },
          select_before_field(field){
            select_before_field(this,field)


          },
          change_input_file(){
            let t=this
            this.uploading=true;
            let file = document.getElementById('parse_xls_file').files[0];
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
              this.orig_name=file.name;
              this.src=e.target.result;
              this.preload()
            }
          },
          normalize_preload(list){
            let maxlen=0
            this.cnt_rows_deleted_preview=0
            for(let l of list){
              if (maxlen<l.length)
                maxlen=l.length

            }
            let new_data=[]
            for(let l of list){
              if( l.length >= maxlen/2 ){
                new_data.push(l)
              }
              else{
                this.cnt_rows_deleted_preview++
              }
            }
            return new_data
          },
          autofill_preload(){
            // автовыбор соответствия столбцов, если названия совпадают
            let t=this
            for(let f of t.parser.fields){
              for(let h of t.first_header){
                if(h.d==f.description){
                  f.selected=h.v
                }
              }
            }
          },
          preload(){
            // предварительная загрузка
            preload(this)

          },
          cancel(){
            this.uploading=false;
            this.refs_dialog=false;
            this.refs_check=[];
            let tmp_file=this.loaded_filename
            this.src='', this.orig_name='', this.data_line_number=false, this.preload_data=[];
            this.loaded_filename='';
            this.remove_tmp(tmp_file);
            if(this.parser.fields)
              for(let f of this.parser.fields)
                f.selected=-1;

            document.getElementById('parse_xls_form').reset();
          },
          remove_tmp(tmp_file){
            if(tmp_file){
              this.$http.post(
                BackendBase+'/parser-excel/'+this.params.config,
                {
                  action:'remove_tmp_file',
                  tmp_file:tmp_file
                }
              ).then(
                r=>{
                  let d=r.data;

                }
              )
            }
          },
          load(){ // загрузка
            load(this)

          },
          create_and_continue(){
            create_and_continue(this)
          },
          skip_refs(){
            skip_refs(this)
          },
          calc_first_header(){
            let arr=[];
            if(!this.preload_data || !this.preload_data.length)
              return
            let j=0;
            for(let a of this.preload_data[0]){
              arr.push({v:j,d:a})
              j++;
            }
            this.first_header=arr;
          },
        },
        computed:{
          refs_has_missing(){
            for(let r of (this.refs_check||[])){
              if(r.missing && r.missing.length)
                return true
            }
            return false
          },
          all_fields_selected(){
            if(!this.parser.fields)
              return false 

            for(let f of this.parser.fields)
              if(f.required!==0 && f.selected<0)
                return false

            for(let group of (this.parser.require_any_of||[])){
              let any=false
              for(let name of group){
                let f=this.parser.fields.find(x=>x.name==name)
                if(f && !(f.selected<0)){ any=true; break }
              }
              if(!any)
                return false
            }

            return true
          }
        }

}
</script>

<style scope>
  h1 {margin-bottom: 10px;}
  form {margin-bottom: 10px;}
  .comment {margin-bottom: 10px; }
  .v-card {padding: 20px;}
  table.preload {margin: 10px 0px; border-collapse: collapse; width: 100%;}
  table.preload td {border: 1px solid gray; padding:  5px;}

  table.select_cols{margin: 10px 0px; border-collapse: collapse; width: 100%;}
  table.select_cols td {border: 1px solid gray; padding:  5px;}
  table.select_cols select {min-width: 500px; padding: 5px; border: 1px solid gray;} 
  .selected {color: green; font-weight: bold;}
  .not_selected {color: red; font-weight: bold;}
  
</style>



