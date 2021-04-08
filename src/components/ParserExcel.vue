<template>
  <v-app>
        <v-container>
            <v-card class="mx-auto auth"> 
                <h1 color="primary">{{parser.title}}</h1>
                <div class="err" v-for="(e,idx) in errors" :key="'err'+idx">{{e}}</div>
                <!-- сообщение об успешной загрузке -->
                <v-dialog v-model="success_parse" max-width="290">
                  <v-card>
                    <v-card-title class="headline">Загрузка </v-card-title>
                    <v-card-text>Ваш файл {{orig_name}} был успешно загружен на сервер!</v-card-text>

                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn color="primary" @click="success_parse = false">
                        ОК
                      </v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
                <!-- Форма для загрузки -->
                <form id="parse_xls_form">
                  
                    
                    <div><input type="file" id="parse_xls_file" @change="change"></div>
                    <div v-if="src" style="margin-top: 10px;">
                      <a href="" @click.prevent="cancel">отменить</a>
                      <!--<a href="" @click.prevent="preload">preload</a>-->
                    </div>
                    
                </form>
                
                <div class="comment" v-if="preload_data.length && loaded_filename">
                  <div v-if="!all_fields_selected" class="not_selected">
                    Файл загружен на сервер, для того, чтобы продолжить -- выберите соответствие колонок
                  </div>
                  <!-- интерактивные надписи в зависимости от того, на каком этапе мы находимся -->
                  <table class="select_cols">
                    <tr v-for="(f,k) in parser.fields" :key="'field'+k" >
                        <td>{{f.description}}</td>
                        <td>
                          <select v-model="f.selected">
                            <option value="n">выберите столбец</option>
                            <option v-for="h in first_header" :value="h.v" :key="h.v">{{h.d}}</option>
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
                      <v-btn small color="primary" v-if="all_fields_selected" @click="load()">Загрузить</v-btn>
                    </div>
                    <div class="not_selected" v-else>Вы выбрали все столбцы. Теперь отметьте слева строку, с которой начинаются данные (заголовок не считаем)</div>
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
                
            </v-card>
          
        </v-container>
  </v-app>
</template>

<script>

export default {
        props:['params'],
        data: () => ({
          orig_name:'',
          src:'',
          uploading: false,
          data_line_number: false, // первая строка с данными
          parser:{
          },
          preload_data:[],
          first_header:[],
          loaded_filename:'',
          success_parse:false,
          errors:[]
        }),
        
        mounted () {
           
        },
        created(){
          this.$http.post(
            BackendBase+'/parser-excel/'+this.params.config,
            {
              action:'init'
            }
          ).then(
            r=>{
              let d=r.data;
              if(d.success){
                for(let f of d.parser.fields){
                  f.selected='-1'
                }
                this.parser=d.parser
              }
            }
          ).catch(
            e=>{ this.errors=[e]}
          )
        },
        watch:{
          success_parse(v){
            if(!v){
              this.cancel()
            }
          }
        },
        methods: {
          change(){
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
          preload(){ // предварительная загрузка
            this.$http.post(
              BackendBase+'/parser-excel/'+this.params.config,
              {
                action:'preload',
                src: this.src,
                orig_name:this.orig_name
              }
            ).then(
              r=>{
                let d=r.data;
                this.uploading=false;
                if(d.success){
                  this.preload_data=d.data, this.loaded_filename=d.loaded_filename;
                  this.calc_first_header();
                }
                this.errors=d.errors
              }
            ).catch(
              e=>{
                this.uploading=false;
                this.errors=[e]}
            )
          },
          cancel(){
            this.src='', this.orig_name='', this.data_line_number=false, this.preload_data=[];
            let tmp_file=this.loaded_filename
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
            this.uploading=true;
            this.$http.post(
              BackendBase+'/parser-excel/'+this.params.config,
              {
                action:'load',
                loaded_filename:this.loaded_filename,
                data_line_number: this.data_line_number,
                fields:this.parser.fields
              }
            ).then(r=>{
              let d=r.data;
              this.uploading=false;
              if(d.success){
                this.success_parse=true;
              }
              this.errors=d.errors
            }).catch(
              e=>{
                this.uploading=false; this.errors=[e]
              }
            )
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
          all_fields_selected(){
            if(!this.parser.fields)
              return false 

            let flag=1;
            for(let f of this.parser.fields)
              if(f.selected<0)
                return false
            
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



