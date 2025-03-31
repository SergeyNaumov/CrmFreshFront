<template>
  <pre v-if="0">{{ source_field }}</pre>
  <div class="root_element">
    <div class="description_container" v-html="field.description+':'"></div>
    <pre v-if="0">{{ source_field }}</pre>
    <!-- Только для чтения -->
    <template v-if="field.read_only">
      <a :href="download_link" :download="orig_filename" v-if="loaded_value">Скачать</a>
    </template>

    <!-- Редактируемый режим -->
    <template v-else>
      <div>
        Загрузка: <!-- Способы загрузки файла -->
        <span v-for="l in load_methods" :key="l.loader" class="file_loader_item">
          <v-icon size="small" color="primary">{{ l.icon }}</v-icon>&nbsp;
          <template v-if="img_loader==l.loader">
            {{ l.header }}
          </template>
          <template v-else>
            <a href="" @click.prevent="set_img_loader(l.loader)">{{ l.header }}</a>
          </template>
        </span>
        <span v-if="img_loader"><a href="" @click.prevent="set_img_loader('')">X</a></span>
      </div>

      <div class="img_loader" v-if="img_loader">
        <!-- Загрузка из буфера обмена -->
        <div v-if="img_loader == 'clipboard'">
          <p>
            В том случае, если в буфере обмена содержится изображение, Вы можете вставить его.<br>
            Данное изображение будет загружено в виде PNG-файла.
          </p>
          <v-btn size="small" color="primary" @click.prevent="load_image_from_clipboard">Вставить изображение</v-btn>
          <template v-if="clipboard_error">&nbsp;<span class="err">{{ clipboard_error }}</span></template>
          <template v-if="clipboard_success">
            <div class="accepted">{{ clipboard_success }}</div>
          </template>
          <div v-if="imgSrc">
            <img :src="imgSrc" class="preview_clipboard">
          </div>
        </div>

        <!-- Загрузка из файла -->
        <div v-if="img_loader == 'file'">
          Выберите файл для загрузки:
          <v-file-input
            :accept="field.accept"
            :id="id_file_field?id_file_field:field.name+'_attach'"
            @change="run_cropper"
            :label="`Выберите файл для загрузки в поле ${field.description}`"
            :rounded="$theme.rounded"
            hide-details
            @click:clear="clear"
          />
        </div>

        <!-- Загрузка из URL -->
        <div v-if="img_loader == 'from_link'">
          <input type="text" class="new_file_url" v-model="extent_file_link" placeholder="Укажите ссылку, по которой сейчас находится файл">
          <v-btn :disabled="!extend_file_link_ok" @click.prevent="load_link_from_url">Ок</v-btn>
        </div>

        <div v-if="field.value">Изображение будет обновлено</div>
      </div>

      <!-- Просмотр загруженного изображения -->

      <div v-if="loaded_value && !imgSrc" class="show_loaded">
        <div v-if="!show_loaded">
          <v-icon size="small" v-if="is_img" @click.prevent="show_loaded = true" class="show">mdi-eye</v-icon>
          <!-- Удалять разрешаем только тогда, когда фото не обязательно -->
          <a :href="download_link" :download="orig_filename">Скачать</a> |
          <a href="" v-if="!field.required" @click.prevent="remove()">Удалить</a>
        </div>

        <template v-if="show_loaded">
          <v-icon size="small" @click.prevent="show_loaded = false" class="not_show">mdi-eye-off</v-icon>
          <a href="" v-if="field.crops && field.resize && field.resize.length" @click.prevent="start_crop_already_loaded">Обрезать фото заново</a>
        </template>

        <template v-if="show_loaded">
          <v-row no-gutters v-if="field.resize && field.resize.length">
            <v-col cols="12" lg="2" md="4" xs="12" v-for="(r, idx) in field.resize" :key="'resize' + field.name + '_' + idx" class="pl-3">
              <v-card class="img_show">
                <a :href="r.loaded" target="_blank"><img :src="r.loaded" style="max-height: 100%; margin: 20px"></a>
              </v-card>
            </v-col>
          </v-row>

          <div v-else-if="is_img" class="img_show">
            <img :src="img_path" style="max-width: 100%">
          </div>
          <a :href="download_link" :download="orig_filename" v-else>Скачать</a>
        </template>
      </div>

      <!-- Подтверждение обрезки -->
      <template v-if="crops.length && imgSrc">
        <div class="accepted" v-if="all_accept"><b>Все фото подтверждены</b></div>
        <div class="not_accepted" v-else>
          <b>Не все изображения подтверждены</b>
          <a href="" v-if="false" @click.prevent="accept_all">Подтвердить сразу всё</a>&nbsp;
          <a href="" v-if="loaded_value" @click.prevent="imgSrc = ''; field_error_check()">Отмена</a>
        </div>

        <v-row no-gutters style="margin-top: 20px;">
          <v-col cols="12" lg="4" md="4" xs="12" v-for="(c, idx) in crops" :key="'crop' + idx" class="pl-3">
            <v-card class="card_cropper">
              <div>
                {{ c.description }}
                <template v-if="!all_accept">
                  <span v-if="crops[idx].accept === 2" class="accepted">Подтверждено</span>
                  <span v-else-if="crops[idx].accept === 1" class="process_accepted">Подтверждается</span>
                  <span v-else class="not_ac">
                    <a href="" @click.prevent="crop(idx)">Подтвердить</a>
                  </span>
                </template>
              </div>
              <Cropper classname="cropper" :src="imgSrc" :stencil-props="stencil_props(c)" :ref="'c' + idx" @change="change(idx)" />
            </v-card>
          </v-col>
        </v-row>
      </template>
    </template>

    <template v-if="false">{{ value }}</template>
    <div class="err" v-if="source_field.error_message" v-html="source_field.error_message"/>
    <div class="warning" v-if="source_field.warning_message" v-html="source_field.warning_message"/>
  </div>
</template>
<script>
import { Cropper } from 'vue-advanced-cropper'
//import { bus } from '../../main'
// https://norserium.github.io/vue-advanced-cropper/
// https://norserium.github.io/vue-advanced-cropper/introduction/getting-started.html
import { getValueByField, setValueByField, save_field_to_store } from '../js/field_functions'

export default {

    components: { Cropper},
    props:['form','field','save_field_to_store','save_to_store', 'get_value_by_field','get_source_field','id_file_field','remove_file'],
    computed:{
      source_field(){
        let t=this, f=t.field
        if(typeof t.get_source_field=='function'){  
          return t.get_source_field(f.name)
        }
        return t.$store.state.fields[f.name]
      },
      loaded_value(){ // загруженный в данный момент файл (вместо begin_value)
        let t=this, f=t.field
        if(typeof t.get_source_field=='function'){  
          f=t.get_source_field(f.name)
        }
        else{
          f=t.$store.state.fields[f.name]
        }
        return f.loaded_value
      },
      img_loader(){
        
        let t=this, f=t.field
        if(!f){
          return ''
        }
        if(typeof t.get_source_field=='function'){  
          f=t.get_source_field(f.name)
        }
        else{
          f=t.$store.state.fields[f.name]
        }
        return f.img_loader_value?f.img_loader_value:''
      },
      img_path(){ 
        // если ранее загруженное фото является изображением
        //  -- возвращаем путь к этому изображению
        if(/\.(jpg|jpeg|png|svg|gif)/i.test(this.loaded_value)){
            return this.download_link
        }
        return '';
      },
      is_img(){
        return /^.+\.(jpe?g|png|wepb|gif|svg)$/i.test(this.loaded_value)
      },
      orig_filename(){
        if(this.loaded_value){
          return this.field.keep_orig_filename?this.loaded_value.split(';').pop():this.loaded_value
        }
        return ''

      },
      download_link(){
        let t=this, saved_filename='', f=t.source_field
        
        if(!f){
          return ''
        }
        if(!f || !f.filedir){
          let f=t.source_field
          f.error_message='не указан filedir!'
          t.update_field(f)
          
          return

        }
        let filedir=`${BaseUrl}${t.source_field.filedir.replace(/^\./,'')}`
        if(t.loaded_value){
          saved_filename=t.field.keep_orig_filename?t.loaded_value.split(';').shift():t.loaded_value
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
      loaded_value(){
        this.imgSrc=''
      }
    },
    data:function(){
        return {
            show_loaded: false, // показать ранее загруженное фото
            imgSrc:'',
            orig_name:'', // оригинальное имя файла
            cropImage:null,
            all_accept:false,
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
      update_field(field){
        save_field_to_store(this,field)
      },
      init(){ // читаем field.resize и на его основе собираем crops (правила ресайзов)
        let field=this.field;
        this.crops=[];
        if(field.resize){
          for(let r of field.resize){
            let sz=r.size.split('x')
            this.crops.push({description:r.description || '', width:sz[0],height:sz[1],data:'',accept:0})
          }
        }
        //console.log('crops:',this.crops)
        //this.crops=arr;
        
      },
      set_img_loader(v){
        //console.log('set_img_loader:',v)
        let t=this, f=t.source_field
        f.img_loader_value=v
        t.update_field(f)
      },
      field_error_check(){
        let t=this
        let field=t.source_field;
        if(field.required && !t.imgSrc && !t.loaded_value){
          field.error_message='Файл обязателен для загрузки'
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
          let id_file_field=t.id_file_field?t.id_file_field:t.field.name+'_attach'
          let file = document.getElementById(id_file_field).files[0];
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
        //this.$bus.emit('change_field',field);

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
        let t=this
        let id_file_field=t.id_file_field?t.id_file_field:t.field.name+'_attach'
        let file = document.getElementById(id_file_field).files[0];
        
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
        let full_name=this.field.filedir+'/'+this.loaded_value;
        this.orig_name=this.loaded_value;
        this.imgSrc=BaseUrl+full_name.replace(/^\.\//,'/');
      },
      remove(){ // удаляем текущее фото с сервера
        // получить с сервера загруженное ранее фото для кропа
        let t=this, f=t.source_field
        if(t.remove_file){ // если есть своя функция удаляния -- выполняем её
          t.remove_file(t)
        }
        else{
              t.$http.post(
              `${BackendBase}/edit-form/${t.form.config}/${t.form.id}`,
              {
                action:'delete_file',
                name: t.field.name
              }
            ).then(
              r=>{
                let R=r.data;
                if(R.success){
                  f.loaded_value=''
                  save_field_to_store(t,f)
                }
                this.errors=R.errors
              }
            )
        }


        
      },

      load_image_from_clipboard(){
        let t=this
        navigator.clipboard.read().then((data) => {
        if (data && data.length && data[0].types) {
          let types=data[0].types
          //console.log('data[0]:',types, (types.includes('image/png')), (types.includes('text/html')) )
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
        this.$bus.emit('change_field',field);
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