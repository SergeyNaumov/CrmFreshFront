<template>
    <div>

        <template v-if="field.read_only">

          <a :href="download_link" v-if="field.begin_value" download>скачать</a>
          
        </template>
        <template v-else>
          <v-file-input
            :accept="field.accept" :id="field.name+'_attach'" 
            @change="run_cropper"
            :label="field.description"
            :rounded="$theme.rounded"
            hide-details
            @click:clear="clear"
          />

          <div v-if="begin_value && !imgSrc" class="show_loaded">
            
            <div v-if="!show_loaded">
              <v-icon x-small v-if="is_img" @click.prevent="show_loaded=true" class="show">fa-eye</v-icon>
              <!-- удалять разрешаем только тогда, когда фото не обязательно -->
              <a :href="img_path" download>скачать</a> | 
              <a href="" v-if="!field.required" @click.prevent="remove()">удалить</a>
            </div>

            <template v-if="show_loaded" >
              <v-icon x-small  @click.prevent="show_loaded=false" class="not_show">fa-eye-slash</v-icon>
              <a href="" v-if="field.crops && field.resize && field.resize.length" @click.prevent="start_crop_already_loaded">обрезать фото заново</a>

              <!--
              <a href="" @click.prevent="show_loaded=false">скрыть</a>&nbsp;
              
              <a href="" v-if="field.crops && field.resize && field.resize.length" @click.prevent="start_crop_already_loaded">обрезать фото заново</a>

              -->
            </template>
            <template v-if="show_loaded">
              <v-layout  row wrap  v-if="field.resize && field.resize.lenght">
                <v-flex pl-3 lg2 md4 xs12 v-for="(r,idx) in field.resize" :key="'resize'+field.name+'_'+idx" >
                  <v-card class="img_show">
                    <a :href="r.loaded" target="_blank"><img :src="r.loaded" style="max-height: 100%; margin: 20px"></a>
                  </v-card>
                </v-flex>
              </v-layout>
              
              <div v-else-if="is_img" class="img_show">
                <img :src="img_path" style="max-width: 100%">
                
              </div>
              <a :href="download_link" v-else>скачать</a>
              
            </template>
          </div>

           

          


          <template v-if="field.crops && imgSrc">
              <div class="accepted" v-if="all_accept"><b>Все фото подтверждены</b></div>
              <div class="not_accepted" v-else>
                <b>Не все изображения подтверждены</b> 
                <a href="" v-if="0" @click.prevent="accept_all"> подтвердить сразу всё</a>&nbsp;
                <a href="" v-if="begin_value" @click.prevent="imgSrc=''; field_error_check()">отмена</a>
              </div>

                    <v-layout row wrap>
                        <v-flex pl-3 lg4 md4 xs12 v-for="(c,idx) in crops" :key="'crop'+idx">
                          
                          <v-card class="card_cropper">
                              <div > {{c.description}} 
                                <template v-if="!all_accept">
                                <span v-if="crops[idx].accept==2" class="accepted">подтверждено</span>
                                <span v-else-if="crops[idx].accept==1" class="process_accepted">подтверждается</span>
                                <span v-else class="not_ac"><a href=""  @click.prevent="crop(idx)" >подтвердить</a></span>
                                </template>
                              </div>
                              <Cropper classname="cropper" :src="imgSrc" :stencil-props="stencil_props(c)"
                              :ref="'c'+idx" @change="change(idx)" />
                                
                              
                          </v-card>
                        </v-flex>
                    </v-layout>
                </template>
        </template>
        <template v-if="0">{{value}}</template>
        <div class="err">{{err_str}}</div>
    </div>
</template>
<script>
import { Cropper } from 'vue-advanced-cropper'
import { bus } from '../../main'
// https://norserium.github.io/vue-advanced-cropper/
// https://norserium.github.io/vue-advanced-cropper/introduction/getting-started.html
export default {
    created(){
      bus.$on('file:'+this.field.name, begin_value=>{
        this.begin_value=begin_value,
        document.getElementById(this.field.name+'_attach').value='',
        this.imgSrc='';
      });
    },
    components: { Cropper},
    props:['form','field'],
    computed:{
      img_path(){ 
        // если ранее загруженное фото является изображением
        //  -- возвращаем путь к этому изображению
        if(/\.(jpg|png|svg|gif)/.test(this.begin_value)){
            let full_name=this.field.filedir+'/'+this.begin_value;
            return full_name.replace(/^\.\//,'/');

        }
        return '';
      },
      is_img(){
        return /^.+\.(jpg|png|wepb|gif)$/i.test(this.begin_value)
      },
      download_link(){
        let filedir=this.field.filedir.replace(/^\./,'');
        return filedir+'/'+this.field.begin_value
      }

    },
    watch:{

    },
    data:function(){
        return {
            begin_value: '',
            show_loaded: false, // показать ранее загруженное фото
            imgSrc:'',
            orig_name:'', // оригинальное имя файла
            cropImage:null,
            all_accept:false,
            err_str:'',
            crops:[
            // accept: 0-не подтверждено, 1 - вычисляется, 2 - подтверждено

              //{description:'вертикальное фото',width:100,height:200,data:'',accept:0},
              //{description:'квадратное фото',width:200,height:200,data:'',accept:0},
            ],

        }
    },
    mounted(){
      this.init();
      this.field_error_check()
    },
    methods:{
      init(){ // читаем field.resize и на его основе собираем crops (правила ресайзов)
        let field=this.field;
        this.begin_value=field.begin_value;
        this.crops=[];
        if(field.resize){
          for(let r of field.resize){
            let sz=r.size.split('x')
            this.crops.push({description:r.description || '', width:sz[0],height:sz[1],data:'',accept:0})
          }
        }
        //this.crops=arr;
        
      },
      field_error_check(){
        let field=this.field;
        if(field.required && !this.imgSrc && !this.begin_value){
          this.err_str='Файл обязателен для загрузки'
          field.error=true;
        }
        else if(field.crops){
          field.error=this.imgSrc?true:false;
          if(this.imgSrc && this.crops.length>0){
            this.calc_all_accept();
            field.error=this.all_accept?false:true;
          }
        }
        
          
        
        if(field.max_size){
          let file = document.getElementById(this.field.name+'_attach').files[0];
          if(file !== undefined){
            if(parseInt(field.max_size)< parseInt(file.size)){
              field.error=true;
              this.err_str='размер загружаемого файла слишком велик'
            }
            else{
              this.err_str=''
            }
          }

        }
        if(!field.error)
          field.error=false;
        
        field.value=this.get_value();
        //this.change_field(field);
        bus.$emit('change_field',field);

      },
      get_value(){
        let field=this.field;
        
        if(!this.imgSrc)
          return null

        
        if(field.crops){


          if(field.error || !this.orig_name)
            return null 
          
          return {
              orig_name:this.orig_name,
              src:this.imgSrc,
              crops:this.crops
          }
        }
        else{ // нет кропов (просто изображение)
          
          return {
            orig_name:this.orig_name,
            src:this.imgSrc
          }
        }

        
      },
      clear(){
        this.imgSrc=''; this.field_error_check();
      },
      run_cropper(){
        let file = document.getElementById(this.field.name+'_attach').files[0];
        
        if(1 || this.crops.length){ // если нужно кропить
          if(file){
            this.orig_name=file.name;
            
            
            let reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (e) => {
              this.imgSrc=e.target.result;
              this.field_error_check();
            }
          }
          else{
            this.imgSrc='';
            if(this.crops){
              for(let c of this.crops){
                c.data='';
                c.accept=0
              }
            }

          }
        }
        this.field_error_check();
        this.get_value()

      },
      //change({coordinates, canvas}) {
      stencil_props(c){
        //return "{aspectRatio: c.width/c.height}"
        return {aspectRatio: parseInt(c.width)/parseInt(c.height)}
      },
      change(n){ // подвинули рамку
        
        
        this.crops[n].accept=0;
        this.calc_all_accept();
        this.field_error_check();
      },
      crop(n) {
        this.crops[n].accept=1;
        //this.calc_all_accept();
        const {coordinates, canvas} = this.$refs['c'+n][0].getResult();
        this.crops[n].data = canvas.toDataURL();
        this.crops[n].accept=2;
        
        this.field_error_check();
        this.calc_all_accept();
      },
      accept_all(){
        for(let c of this.crops){
          c.accept=2
        }
        this.all_accept=true;
        this.field_error_check();
        this.calc_all_accept();
      },
      calc_all_accept(){
        for(let c of this.crops){
          if(c.accept!==2){
            this.all_accept=false;
            return false
          } 
        }
        this.all_accept=true;
        return true
      },
      start_crop_already_loaded(){
        let full_name=this.field.filedir+'/'+this.begin_value;       
        this.orig_name=this.begin_value;
        this.imgSrc=full_name.replace(/^\.\//,'/');
      },
      remove(){ // удаляем текущее фото с сервера
        // получить с сервера загруженное ранее фото для кропа
        this.$http.post(
          this.BackendBase()+'/'+'/edit-form/'+this.form.config+'/'+this.form.id,
          {
            action:'delete_file',
            name: this.field.name
          }
        ).then(
          r=>{
            let R=r.data;
            if(R.success){
              this.begin_value='';
            }
            this.errors=R.errors
          }
        )

        
      },
      BackendBase(){
          return /^localhost:/.test(location.host)?'http://dev-crm.test/backend':'/backend';
      },
    }
}
</script>
<style scoped lang="scss">
  @import '@/styles/variables.scss';
  div {font-size: 12px;}
  .not_accepted {color: red; }
  .accepted {color: green; }
  .process_accepted {color: orange ;}
  .show_loaded {margin: 10px 0 20px 55px;}
  .card_cropper div {padding: 10px;}
  .show, .not_show {margin-right: 20px;}
  .show:hover, .not_show:hover {
    color: $primary
  }
  .img_show{
    margin-top: 10px;
    border: 1px solid gray;
    background: linear-gradient( #ccc, transparent 1px), linear-gradient( 90deg, #bbb, transparent 1px);
    background-size: 3px 3px;
    background-position: center center;
    padding: 10px;
  }
</style>