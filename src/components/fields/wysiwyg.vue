<template>      
    <div>
        
        <errors :errors="errors" v-show="errors.length"></errors>
        <template v-show="!errors.length">        
            <!-- файловый навигатор -->
            <v-dialog v-model="dialog" min-height="300" max-width="800">
            <v-card class="filenavigator" style="">
                <div class="close">
                    <a href="" @click.prevent="dialog=false"><v-icon color="primary" >fa-window-close</v-icon></a>
                </div>
                <v-card-title v-text="create_folder_form?'Новая папка':'Загрузка изображений'" />
                    <form class="create_folder_form" @submit.prevent="create_folder" v-if="create_folder_form">
                        <div v-for="(e,idx) in create_folder_errors" :key="'err'+idx" class="err">
                            {{e}}
                        </div>
                        <v-text-field 
                            v-model="new_folder_name"
                            label="введите название папки"
                        />
                        <v-btn x-small color="primary" @click="create_folder" :disabled="!new_folder_name">создать новую папку</v-btn>
                        <v-btn x-small @click.prevent="create_folder_form=false; new_folder_name=''" color="error">отмена</v-btn>
                    </form>
                    <template v-else>
                        <div>путь: {{file_path}}</div>
                        <p class="create_folder_link"><a href="#"  @click.prevent="create_folder_form=!create_folder_form">новая папка</a></p>
                        <table align="center" style="margin-left: 2rem; min-width: 300px;">
                                <tr v-if="file_path!='/'">
                                    <td >
                                        <a href="" @click.prevent="folder_up()">...</a>
                                    </td>
                                    <td></td>
                                </tr>
                                <template v-for="(f,idx) in file_list" >
                                    <tr v-if="f.type=='dir'"  :key="f.name">
                                        <td ><v-icon color="primary" >mdi-folder </v-icon>
                                            <a href="" @click.prevent="go_to_folder(f.name)">{{f.name}}</a>
                                        </td>
                                        <td><v-icon @click.prevent="del(f)">mdi-delete</v-icon></td>
                                    </tr>
                                    <tr v-else :key="idx">
                                        <td  color="primary"><v-icon>insert_drive_file</v-icon> 
                                        <a href="" @click.prevent="goFileCallBack(f.name,{})">{{f.name}}</a> </td>
                                        <td><v-icon @click.prevent="del(f)">mdi-delete</v-icon> </td>
                                    </tr>

                                </template>
                        </table>
                        <errors :errors="uploader_errors" v-show="uploader_errors.length"></errors>
                        <form :id="'tinyupload_'+field.name" enctype="multipart/form-data" class="upload" @submit.prevent="upload()">
                            <!--<input type="file" name="attach" multiple="multiple"> -->
                            <v-file-input 
                                name="attach"
                                multiple="multiple"
                                chips
                                v-model="upload_value"
                                label="выберите файлы для загрузки"
                            />
                            <v-btn x-small color="primary" @click="upload()">загрузить</v-btn>
                        </form>
                    </template>
            </v-card>
            </v-dialog>
            <!-- / файловый навигатор -->
            <div class="read_only" v-if="field.read_only" v-html="value" /> 
            <template v-else>

                <p><a href="" @click.prevent="edit_mode=!edit_mode" v-text="edit_mode?'в режим просмотра':'в режим редактирования'"></a></p>
                <div v-show="edit_mode">
                    <field-buttons
                        :form="form"
                        :field="field"
                        :after_update="updateContent"
                    />
                    <textarea class="mce" :id="field.name" v-model="value"/>
                </div>
                <div v-show="!edit_mode && !!value">
                    <div class="read_only"  v-html="value" /> 
                </div>
            </template>
        </template>
    </div>
</template>
<script>
// 

// npm install tinymce

import { bus } from '../../main'
import tinymce from 'tinymce/tinymce';
import field_buttons from './frontend/buttons';
import { field_update } from './field_functions' 
let PickerCallBack=false;
function show_hide_tox(mode){
    mode=mode?'visible':'hidden';
    let selectors=['.tox-dialog-wrap','.tox-dialog-wrap__backdrop','.tox-dialog'];
    for(let s of selectors){
        let for_hide=document.querySelectorAll(s);
        for(let h of for_hide){
            h.style.visibility = mode;
        }
    }  
}

let editor_object=false;
let inited=false;
export default {
    name:'field-wysiwyg',
    components:{
        'field-buttons':field_buttons
    },
    data:function(){
        return {
            
            inited:false,
            edit_mode:false,
            value:'',
            dialog:false, // debug
            create_folder_form: false,
            new_folder_name: '',
            create_folder_errors:[],
            upload_value:null,
            /*toolbar: [
                "styleselect formatselect fontselect fontsizeselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify image",
                "cut copy paste | searchreplace | bullist numlist | outdent indent blockquote | undo redo | link unlink anchor image media code | insertdatetime preview | forecolor backcolor",
                "table | hr removeformat | subscript superscript | charmap emoticons | print fullscreen | ltr rtl | spellchecker | visualchars visualblocks nonbreaking template pagebreak restoredraft"
            ],
            toolbar2: '',*/
            
            other_options: {},
            readonly:false,
            files_dir_web:'',
            file_path: '/',
            file_list:[],
            errors:[],
            uploader_errors:[]
        }
    },
  props:['form','field','parent'],
  watch:{
      dialog(){
          if(this.dialog)
            this.read_file_list()
      },

      value(){
        // ловим изменения в редакторе 
        // отправляем его выше по иерархии объектов
        this.field.value=this.value;
        
        


        
        bus.$emit('change_field',this.field);
      },
      file_path(){ // если мы осуществляем навигацию по папкам -- отправляемся за списком файлов
          this.read_file_list()
      },
      edit_mode(v){
          if(v)
            this.tinymce_init(this.field.name);
      },
  },
  created(){
    this.value=this.field.value;
    
    this.read_file_list() // debug
    
    this._field_update=(new_data)=>{field_update(new_data,this)};
    if(this.field.edit_mode){
        this.edit_mode=this.field.edit_mode
    }
    if(!this.parent){
      bus.$on('field-update:'+this.field.name,this._field_update )
    }
  }, 
  beforeDestroy(){
    if(!this.parent){
       bus.$off('field-update:'+this.field.name,this._field_update)
    }
  },
  mounted(){
      
  },
 
  computed:{

      
  },
  methods: {
    /*update_content(){
        if(editor_object){
            editor_object.setContent(this.value)
        }
    },*/
    updateContent(){
        if(editor_object){
            editor_object.setContent(this.value)
        }
    },
    create_folder(){
        
        if( /^[a-zA-Z0-9_\.\-]+$/.test(this.new_folder_name) ){
            //alert(555)
            this.$http.post(
                BackendBase+'/wysiwyg/'+this.form.config+'/'+this.field.name,
                {
                    new_folder_name:this.new_folder_name,
                    path: this.file_path,
                    action: 'create_folder'
                }
            ).then(
                r=>{
                    let D=r.data;
                    if(D.success){
                        this.new_folder_name='', this.create_folder_form=false
                        this.read_file_list()
                    }
                    this.create_folder_errors=D.errors
                }
            ).catch(
                e=>{
                    this.create_folder_errors=[e]
                }
            )
        }
        else{
            this.create_folder_errors=['недопустимые символы в имени файла']
        }
    },
    go_to_folder(folder){
        this.file_path+=folder+'/'
    },
    folder_up(){
        this.file_path=this.file_path.replace(/[^\/]+\/$/,'');
    },
    read_file_list(){
        let url=BackendBase+'/wysiwyg/'+this.form.config+'/'+this.field.name;
        if(this.form.id)
            url=url+'/'+this.form.id;

        this.$http.post(url,
            {
                action:'file_list',
                path: this.file_path
            }
        ).then(
            response=>{
                let D=response.data;
                if(D.success){
                    this.file_list=D.file_list;
                    this.files_dir_web=D.files_dir_web;
                }
                //console.log({errors:D.errors    })
                this.errors=D.errors    
            }
        ).
        catch(
            err=>{
                this.errors=['ошибка при вызове файлового навигатора']
            }
        )
    },
    upload(){ // загрузка файлов в файловом менеджере
        let file=document.querySelector('form#tinyupload_'+this.field.name+' input[type=file]');
        let url=BackendBase+'/wysiwyg/' + this.form.config+'/'+this.field.name;
        if(this.form.id)
            url=url+'/'+this.form.id
        
        url+='/upload';

        if(file.files.length){
            for(let f of file.files){      
                let formData = new FormData();
                formData.append('file', f);
                formData.append('path',this.file_path);
                this.$http.post(
                    url,
                    formData,
                {headers: {'Content-Type': 'multipart/form-data'}}
                ).then(
                response=>{
                    let D=response.data;
                    if(D.success){ 
                        this.file_list=D.file_list;
                        this.upload_value=null
                        this.uploader_errors=[];
                    }
                    this.uploader_errors=D.errors
                }
                ).catch( e=>{this.uploader_errors=[e]} )
            }
        }
        

    },
    del(f){
        let url=BackendBase+'/wysiwyg/'+this.form.config+'/'+this.field.name;
        if(this.form.id)
            url=url+'/'+this.form.id;
        //console.log('DEL!')
        this.$http.post(url,
            {
                action:'delete',
                path: this.file_path,
                name: f.name
            }
        ).then(
            response=>{
                let D=response.data;
                if(D.success){
                    this.file_list=D.file_list;
                    this.files_dir_web=D.files_dir_web;
                    
                }
                   
                this.uploader_errors=D.errors
            }
        ).
        catch(
            err=>{
                this.uploader_errors=['ошбка при вызове файлового навигатора']
            }
        )
    },
    tinymce_change(editor){ 
        // если значение меняется -- 
        // отправляем его выше по иерархии объектов
        this.value=editor.getContent();
    },
    tinymce_init(name){
        
        this.read_file_list(); // убрать
        let this_component=this;
        
        function svBrowser(callback,value,meta){

            PickerCallBack=callback;
            show_hide_tox(false);

            this_component.dialog=true;

        }
        if(inited){
            return 
        }
            
        inited=true;

        if(!document.querySelector('#'+this.field.name+'.mce')){
            setTimeout(
                function(){
                    this_component.tinymce_init(name)
                },
                50
            );
        }
        tinymce.baseURL='/dist/tinymce';

        tinymce.init({
            selector:'#'+name+'.mce',
            // content_css:'/tinymce.css', // -- собственный файл стилей
            browser_spellcheck: true,
            relative_urls : false,
            init_instance_callback: function (editor) {
                editor_object=editor;
                // ловим изменения в редаеторе и изменяем value компонента:
                editor.on('keyup', function (e) {
                    this_component.value=editor.getContent();
                    
                });
                editor.on('change', function (e) {
                    this_component.value=editor.getContent();
                });
            },
            
            plugins: [
                "advlist autolink autosave link image lists charmap print preview hr anchor pagebreak spellchecker",
                "searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking",
                "table  directionality emoticons template  paste  textpattern"
            ], // fullpage
            menubar: false,
            toolbar1: "styleselect formatselect fontselect fontsizeselect | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify ",
            toolbar2: "cut copy paste | searchreplace | bullist numlist | outdent indent blockquote | undo redo | link unlink anchor image media code | insertdatetime preview | forecolor backcolor",
            toolbar3: "table | hr removeformat | subscript superscript | charmap emoticons | print fullscreen | ltr rtl | spellchecker | visualchars visualblocks nonbreaking template pagebreak restoredraft",
            language: 'ru',
            //width: 500,
            advlist_number_styles: "lower-alpha",
            height : 500,
            file_picker_callback : svBrowser,
            paste_data_images: true,
            image_advtab: true,
            extended_valid_elements: '@[itemscope|itemprop|itemtype|itemref|content],img[*],time[*],div[*|class|data-resultsUrl|data-newWindow|data-queryParameterName],span[*],strong[*],td[*],tr[*],p[*],small[*],a[*|download],ul[*],li[*],em[*],script[type|src],article[*],header[*],meta[itemprop|itemtype|itemref|itemscope|content],iframe[src|style|width|height|scrolling|marginwidth|marginheight|frameborder|allowfullscreen],object[width|height|classid|codebase|embed|param],param[name|value],embed[param|src|type|width|height|flashvars|wmode],a[*]',
            valid_children: '+a[div|p|img|span  ]'
        });
        tinymce.EditorManager.init({
        });
        tinymce.activeEditor.getRnd=function(){
            return Math.random()
        }
        // tinymce.activeEditor.execCommand('ApplyOrderedListStyle', false, {
        // 'list-style-type': 'disc'
        // });

    },
    goFileCallBack(name,attr){

            name=this.files_dir_web+this.file_path+name
            // visible
            this.dialog=false;
            show_hide_tox(true);
            if(PickerCallBack)
                PickerCallBack(name,attr);

            //callback('mypage.html', {text: 'My text'});            
            // callback('myimage.jpg', {alt: 'My alt text'});
            // callback('movie.mp4', {source2: 'alt.ogg', poster: 'image.jpg'});
            
    }
  }
}

</script>
<style scoped>
 button {margin-bottom: 1rem;}
 .filenavigator {min-height: 300px; padding: 20px;}
 .read_only {padding: 10px; border: 1px solid gray;  border-radius: 4px;}
 p {margin: 0;}
 form.upload {margin-top: 20px;}
.close {text-align: right; } 
.close a {text-decoration: none;}
</style>
