<template>
    <div class="root_element">
        <!--
        field: {{field}}<br>
        orig_filename: {{orig_filename}}<br>
        download_link: {{download_link}}
        -->
        <template v-if="field.read_only">

          <a :href="download_link" :download="orig_filename" v-if="field.begin_value" >скачать</a>
          
        </template>
        <template v-else>
          <div>
          загрузка: <!-- Способы загрузки файла-->
              <span v-for="l in load_methods" :key="l.loader" class="file_loader_item">
                <v-icon x-small color="primary">{{ l.icon }}</v-icon>&nbsp;
                <template v-if="img_loader==l.loader">
                  {{ l.header }}
                </template>
                <template v-else>
                  <a href="" @click.prevent="img_loader=l.loader">{{ l.header }}</a>
                </template>
                
              </span>
          </div>
          <div class="img_loader" v-if="img_loader">


              <div v-if="img_loader=='clipboard'">
                  
                  <p>
                    В том случае, если в буфере обмена содержится изображение, Вы можете вставить его.<br>
                    Данное изображение будет загружено в виде PNG-файла
                  </p>
                  <v-btn x-small color="primary"  @click.prevent="load_image_from_clipboard">Вставить изображение</v-btn>
                  <template v-if="clipboard_error">&nbsp;<span class="err">{{clipboard_error}}</span></template>
                  <template v-if="clipboard_success">
                    <div class="accepted">{{clipboard_success}}</div>
                  </template>
                  <div v-if="imgSrc">
                    <img :src="imgSrc" class="preview_clipboard"> 
                  </div>
                  
                  
              </div>
              <div v-if="img_loader=='file'"> <!-- загрузка изображения из файла-->
                Выберите файл для загрузки:
                <v-file-input
                  :accept="field.accept" :id="field.name+'_attach'" 
                  @change="run_cropper"
                  :label="`выберите файл для загрузки в поле ${field.description}`"
                  :rounded="$theme.rounded"
                  hide-details
                  @click:clear="clear"
                />
              </div>
              
              <div v-if="img_loader=='from_link'"> <!-- Загрузка изображения из url-а -->
                  <input type="text" class="new_file_url" v-model="extent_file_link" placeholder="Укажите ссылку, по которой сейчас находится файл">
                  <v-btn :disabled="!extend_file_link_ok" @click.prevent="load_link_from_url">ок</v-btn>
              </div>
              
              <div v-if="field.value">изображение будет обновлено</div>
          </div>
          <div v-if="begin_value && !imgSrc" class="show_loaded">


            <div v-if="!show_loaded">
              <v-icon x-small v-if="is_img" @click.prevent="show_loaded=true" class="show">fa-eye</v-icon>
              <!-- удалять разрешаем только тогда, когда фото не обязательно -->
              <a :href="download_link" :download="orig_filename">скачать</a> | 
              <a href="" v-if="!field.required" @click.prevent="remove()">удалить</a>
            </div>

            <template v-if="show_loaded" >
              <v-icon x-small  @click.prevent="show_loaded=false" class="not_show">fa-eye-slash</v-icon>
              <a href="" v-if="field.crops && field.resize && field.resize.length" @click.prevent="start_crop_already_loaded">обрезать фото заново</a>
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
              <a :href="download_link" :download="orig_filename" v-else>скачать</a>
              
            </template>
          </div>
          
          <template v-if="crops.length && imgSrc">
              <div class="accepted" v-if="all_accept"><b>Все фото подтверждены</b></div>
              <div class="not_accepted" v-else>
                <b>Не все изображения подтверждены</b> 
                <a href="" v-if="0" @click.prevent="accept_all"> подтвердить сразу всё</a>&nbsp;
                <a href="" v-if="begin_value" @click.prevent="imgSrc=''; field_error_check()">отмена</a>
              </div>

                    <v-layout row wrap style="margin-top:20px;">
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
//import { bus } from '../../main'
// https://norserium.github.io/vue-advanced-cropper/
// https://norserium.github.io/vue-advanced-cropper/introduction/getting-started.html
export default {
    created(){
      this.$bus.$on('file:'+this.field.name, begin_value=>{
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
        if(/\.(jpg|png|svg|gif)/i.test(this.begin_value)){
            return this.download_link
            //return BaseUrl+this.field.filedir.replace(/^\.\//,'')+'/'+this.begin_value;
            //return full_name;

        }
        return '';
      },
      is_img(){
        return /^.+\.(jpe?g|png|wepb|gif|svg)$/i.test(this.begin_value)
      },
      orig_filename(){
        if(this.begin_value){
          return this.field.keep_orig_filename?this.begin_value.split(';').pop():this.begin_value
        }
        return ''

      },
      download_link(){
        let filedir=BaseUrl+this.field.filedir.replace(/^\./,'')
        let saved_filename=''
        if(this.field.begin_value){
          saved_filename=this.field.keep_orig_filename?this.begin_value.split(';').shift():this.begin_value
        }
        let download_link=filedir+'/'+saved_filename
        download_link=download_link.replace('//','/')
        
        return download_link
      },
      extend_file_link_ok(){
        let v=/^https?:\/\/.+?\..+$/.test(this.extent_file_link)
        
        return v
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
            img_loader:'',
            //new_image_url:'https://damion.club/uploads/posts/2022-02/1643959008_61-damion-club-p-ptitsa-sekretar-zhivotnie-68.jpg',
            clipboard_error:'', // ошибка при вставке из буфера картинки
            clipboard_success:'',
            crops:[
            // accept: 0-не подтверждено, 1 - вычисляется, 2 - подтверждено

              //{description:'вертикальное фото',width:100,height:200,data:'',accept:0},
              //{description:'квадратное фото',width:200,height:200,data:'',accept:0},
            ],
            extent_file_link:'',
            load_methods:[
              {icon: 'fas fa-file-upload', header: 'из файла',  loader:'file'},
              {icon: 'fa fa-paste', header: 'из буфера', loader:'clipboard'},
              //{icon: 'fa fa-paste', header: 'по ссылке', loader:'from_link'},
            ]
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
        console.log('crops:',this.crops)
        //this.crops=arr;
        
      },
      field_error_check(){
        let t=this
        let field=t.field;
        if(field.required && !t.imgSrc && !t.begin_value){
          t.err_str='Файл обязателен для загрузки'
          field.error=true;
        }
        else if(field.crops){
          field.error=t.imgSrc?true:false;
          if(t.imgSrc && t.crops.length>0){
            t.calc_all_accept();
            field.error=t.all_accept?false:true;
          }
        }
        
          
        
        if(field.max_size){
          let file = document.getElementById(t.field.name+'_attach').files[0];
          if(file !== undefined){
            if(parseInt(field.max_size)< parseInt(file.size)){
              field.error=t;
              t.err_str='размер загружаемого файла слишком велик'
            }
            else{
              t.err_str=''
            }
          }

        }
        if(!field.error)
          field.error=false;
        
        field.value=t.get_value();
        this.$bus.$emit('change_field',field);

      },
      get_value(){
        let field=this.field;
        
        if(!this.imgSrc) return null

        if(field.crops){
          if (field.error || !this.orig_name) return null 
          
          return {
              orig_name:this.orig_name,
              src:this.imgSrc,
              crops:this.crops
          }
        }
        else{ // нет кропов (просто изображение)          
          return { orig_name:this.orig_name, src:this.imgSrc }
        }

        
      },
      clear(){
        this.imgSrc=''; this.field_error_check();
      },
      run_cropper(){
        let file = document.getElementById(this.field.name+'_attach').files[0];
        
        { // если нужно кропить if(1 || this.crops.length)
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
        //this.get_value()

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
        this.imgSrc=BaseUrl+full_name.replace(/^\.\//,'/');
      },
      remove(){ // удаляем текущее фото с сервера
        // получить с сервера загруженное ранее фото для кропа
        this.$http.post(
          BackendBase+'/edit-form/'+this.form.config+'/'+this.form.id,
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

      load_image_from_clipboard(){
        let t=this
        navigator.clipboard.read().then((data) => {
        if (data && data.length && data[0].types) {
          let types=data[0].types
          console.log('data[0]:',types, (types.includes('image/png')), (types.includes('text/html')) )
          if(types.includes('image/png')){
              data[0].getType("image/png").then((blob) => {
              let reader = new FileReader();
              reader.onload = () => {
                //let img=new Image();
                //img.src=t.imgSrc
                t.imgSrc = reader.result, t.orig_name='_from_clipboard_.png'
                t.field_error_check()
                // сообщение об успешной вставке
                t.clipboard_success=`изображение было вставлено в буфер обмена в поле ${t.field.description}. Не забудьте сохранить`
                setTimeout( ()=>{ t.clipboard_success='' },1000 )
                
              };

              reader.readAsDataURL(blob);
            
            });

          }
          else{
            t.clipboard_error='Буфер обмена не содержит изображений'
            setTimeout( ()=>{ t.clipboard_error='' },1000 )
            //console.log('Буфер обмена пуст!')
            //alert('Буфер обмена пуст!')
          }

      
    }
  });
      },
      load_link_from_url(){
        let field=this.field
        field.value={
          external_link:this.extent_file_link
        }
        this.$bus.$emit('change_field',field);
      }
    }
}
</script>
<style scoped lang="scss">
  @import '@/styles/variables.scss';
  .root_element {
    border-bottom: 1px solid gray;
  }
  div {font-size: 12px;}
  .not_accepted {color: red; }
  .accepted {color: green; }
  .process_accepted {color: orange ;}
  /*.show_loaded {margin: 10px 0 20px 55px;}*/
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
  .new_file_url {
    border: 1px solid gray;
    padding: 5px;
    width: 100%;
  }
  .file_loader_item{
    margin-right: 10px;
  }
  .img_loader {border: 1px solid gray; padding: 10px; border-radius: 5px; margin-bottom: 10px;}
  .preview_clipboard {width: 300px;}
</style>