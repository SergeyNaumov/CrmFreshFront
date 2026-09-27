<template>
    <div>
        <v-dialog v-model="dialog_add_form" max-width="500">
            <v-card>
                <v-card-title  class="text-h5">Создание нового элемента</v-card-title>
                <v-card-text>
                    <template v-if="mode_new_element=='text'">
                        <v-text-field  @keyup.enter="save()" label="Наименование раздела" placeholder="введите название" :ref="'new_header'+parent.id" v-model="values[form.header_field]" />
                        <small><a href="" @click.prevent="mode_new_element='textarea'">создать сразу несколько записей</a></small>
                    </template>
                    <template v-else-if="mode_new_element=='textarea'">
                        <v-textarea label="Наименование раздела" :ref="'new_header'+parent.id" v-model="values[form.header_field]" 
                            placeholder="Если Вы напишите несколько строк, то будет создано, соответственно сразу несколько записей"
                        />
                        <small><a href="" @click.prevent="mode_new_element='text'">вернуться к стандартному режиму создания</a></small>
                    </template>

                </v-card-text>
                <v-card-actions>
                    <div class="flex-grow-1"></div>
                    <v-btn color="red" variant="text" @click="dialog_add_form=false">Отменить</v-btn>
                    <v-btn color="primary-darken-1" variant="text" @click="save()">Сохранить</v-btn>   
                </v-card-actions>  
            </v-card>
        </v-dialog>
        
        <v-dialog v-model="show_errors" max-width="500">
            <v-card>
                <v-card-title  class="text-h5">Произошли ошибки</v-card-title>
                <v-card-text>
                    <errors :errors="errors" />
                </v-card-text>
                <v-card-actions>
                    <div class="flex-grow-1"></div>
                    <v-btn color="red" variant="text" @click="show_errors=false">Закрыть</v-btn>
                      
                </v-card-actions>  
            </v-card>
        </v-dialog>
        <div class="Area" :class="{'flat-list': form && !form.tree_use && !form.sort}">
            
        <a href="#" v-if="make_add " @click.prevent="open_dialog_add_form">добавить
                <span v-if="parent.id"> в "{{parent.header}}" </span>
                <span v-else> в /</span>
        </a>
        <template v-if="is_galery"> <!-- GALLERY -->
            <draggable
                :id="'p-'+parent.id"
                tag="div"
                class="gallery"
                :style="gallery_style"
                :list="list"
                item-key="id"
                :group="'g'+parent.id"
                ghost-class="gallery_ghost"
                :disabled="!form.sort"
                @end="move_end"
            >
                <template #item="{ element: l }">
                <div class="gallery_item" :id="'li-'+l.id">
                    <div class="gallery_card">
                        <div class="gallery_photo_wrap">
                            <img v-if="l.photo" :src="photo_url(l)" class="gallery_photo" :alt="l.header">
                            <div v-else class="gallery_photo gallery_no_photo">нет фото</div>
                        </div>
                        <div class="gallery_title">
                            <a href="" @click.prevent="go_to_edit(l.id)">{{ l.header }}</a>
                        </div>
                        <div class="gallery_tools" v-if="!form.read_only || make_delete(parent.id,l)">
                            <a v-if="!form.read_only" :href="get_edit_link(l.id)" @click.prevent="go_to_edit(l.id)"><v-icon color="primary" size="small">edit</v-icon></a>
                            <v-icon v-if="make_delete(parent.id,l)" size="small" style="font-size: 10pt;" color="primary" @click="del(parent.id,l)">fa fa-trash</v-icon>
                        </div>
                    </div>
                    <FormInBranch
                        :tree_form="form"
                        :item="l"
                        :close_edit_form="close_edit_form"
                        :upload_header="upload_header"
                        v-if="show_edit_form==l.id"
                    />
                </div>
                </template>
            </draggable>
        </template>
        <div v-else-if="form.sort">  <!-- USE SORT-->
            <draggable
                :id="'p-'+parent.id"
                tag="ul"
                v-if="list.length"
                class="list-group"
                ghost-class="ghost"
                :renew="renew"
                :list="list"
                item-key="id"
                :group="'g'+parent.id"
                @start="move_start" @end="move_end"                
            >   
                <template #item="{ element: l }">
                <li :id="'li-'+l.id" >
                <div >
                    <div class="li_header" :style='{"background":cur_color}'  >
                            <div class="plus-icon " v-if="form.tree_use && (!form.max_level || (level < form.max_level))" >
                                <!---->
                                <v-icon size="x-small" color="primary"
                                    v-if="!shows[l.id]" 
                                    @click="show_this(l)"
                                >
                                    fa fa-plus 
                                </v-icon>
                                <v-icon size="x-small" color="primary" v-if="shows[l.id]" @click="shows[l.id]=false">fa fa-minus</v-icon>
                            </div>
                            <div class="branch-header" >
                                <a href="" @click.prevent="go_to_edit(l.id)">{{ l.header }}</a>
                                <template v-if="l.childs && form.tree_use && l.childs.length>0">&nbsp;({{l.childs.length}})</template>
                                <FormInBranch
                                    :tree_form="form"
                                    :item="l"
                                    :close_edit_form="close_edit_form"
                                    :upload_header="upload_header"
                                    v-if="show_edit_form==l.id"
                                />
                                
                            </div>
                            <div class="branch-tools">
                                <a :href="get_edit_link(l.id)" @click.prevent="go_to_edit(l.id)"><v-icon color="primary" size="small" >edit</v-icon></a>
                                <v-icon v-if="make_delete(parent.id,l)" size="small" style="font-size: 10pt;" color="primary" @click="del(parent.id,l)">fa fa-trash</v-icon>
                            </div>
                    </div>
                    <template v-if="shows[l.id]">
                        <nested-draggable v-if="l.childs"
                            :form="form"
                            :level="(level+1)"
                            :renew="renew" :add_to_map="add_to_map"
                            :parent="l"
                            :add="add" :del="del" :move_end="move_end" :get_list="get_list"
                        />
                    </template>

                </div>

                </li>
                </template>
            </draggable>
        </div>
        <template v-else> <!-- NOT USE SORT-->

            <ul v-if="list.length">
                <li v-for="l in list" :key="l.id" :id="'li-'+l.id">
                    <div class="li_header">
                        <div class="ws-nowrap">
                            <div class="plus-icon float-left" v-if="form.tree_use">
                                <v-icon size="x-small" color="primary" v-if="!shows[l.id] && form.tree_use" @click="show_this(l)">fa fa-plus</v-icon>
                                <v-icon size="x-small" color="primary" v-if="shows[l.id]" @click="shows[l.id]=false">fa fa-minus</v-icon>
                            </div>
                            <div class="branch-header">
                                <a href="" @click.prevent="go_to_edit(l.id)">{{ l.header }}</a>
                                <template v-if="l.childs && l.childs.length>0 && form.tree_use">({{l.childs.length}})</template>
                                <FormInBranch
                                    :tree_form="form"
                                    :item="l"
                                    :close_edit_form="close_edit_form"
                                    :upload_header="upload_header"
                                    v-if="show_edit_form==l.id"
                                />
                            </div>
                            <div class="branch-tools float-right">
                                <a :href="get_edit_link(l.id)" @click.prevent="go_to_edit(l.id)"><v-icon color="primary" size="small" >edit</v-icon></a>
                                <v-icon v-if="make_delete(parent.id,l)" size="small" style="font-size: 10pt;" color="primary" @click="del(parent.id,l)">fa fa-trash</v-icon>
                            </div>
                        </div>
                    </div>

                    <template v-if="shows[l.id]">
                        <nested-draggable v-if="l.childs"
                            :form="form"
                            :level="(level+1)"
                            :renew="renew"
                            :list="l.childs" :add_to_map="add_to_map"
                            :parent="l"
                            :add="add" :del="del" :move_end="move_end" :get_list="get_list"
                        />
                    </template>
                </li>
                
            </ul>
        </template>
        <div v-if="!exist_childs" class="li_empty">
            [ пусто ]
        </div>
        </div>
    </div>
</template>
<script>
import FormInBranch from "./FormInBranch.vue";
export default {
  components: {'FormInBranch': FormInBranch},
  props: {
    get_list: {required:true},
    renew: {required:true},
    form:{type:Object,required:false},
    level:{type:Number,required:false},
    parent:{required:true}, // вышестоящий элемент
    add:{required:true},
    del:{required:true},
    move_end:{required:true},
    add_to_map:{required:true},
    new_runner:{type:Number,required:false},
    
  },
  data(){
      return {
          dialog_add_form: false,
          values:{},
          errors:[],
          list:[],
          child_count:0,
          show_errors:false,
          shows:{
            0:false          
          },
          mode_new_element:'text',
          show_edit_form:0  // показываем форму редактирования для записи с l.id=show_edit_form
          
      }
  },
  methods:{
        init(){
            this.values={}
            this.child_count=0
            this.list=[]
            this.show_edit_form=0
            this.shows={0:false}

            this.list=this.get_list(this.parent.id)
        },
        upload_header(id, new_header='this is new header'){
            for(let l of this.list){
                if(l.id==id){
                    l.header=new_header
                }
            }

        },
        make_delete(parent_id,l){
            // можно сделать зависимо от веток дерева
            if(this.form.read_only)
                return false
            return this.form.make_delete
                
            
        },
        make_open_childs(l){ // возможно ли раскрыть ветку? (показывать ли кнопку с плюсиком)
            return !this.shows[l.id] && this.tree_use
        },
        show_this(l){
            let shows={};
            
            for(let p in this.shows)
                shows[p]=this.shows[p];
            
            this.shows[l.id]=true;
            if(this.form.tree_use && !l.childs){ // получаем child-ы с сервера
                    
                    this.$http.post(
                        BackendBase+'/admin-tree/'+this.form.config,
                        {action:'get_branch', parent_id:l.id}
                    ).then(
                        response=>{
                            let D=response.data;
                            if(D.success){
                              l.childs=D.data;
                              for(let c of l.childs){
                                  
                                  this.add_to_map(this.parent.id,c);
                              }

                              shows[l.id]=true;
                              this.shows=shows;
                              
                            }

                    }).catch(function(){
                        alert('server error!');
                    });
                
            }
            else{ // child-ы уже загружены
                
                if(this.form.tree_use){
                    let need_load_for_all_childs=false
                    let child_list=[]
                    for(let c of l.childs){
                        if( !('childs' in c) ){
                            child_list.push(c.id)
                            need_load_for_all_childs=true
                        }
                    }
                    if(need_load_for_all_childs){ // отправляем запрос для получения всех child-ов для child-ов )

                    }
                    this.$http.post(
                        BackendBase+'/admin-tree/'+this.form.config,
                        {action:'load_many_childs',list:child_list}
                    ).then(
                        response=>{
                            let D=response.data
                            if(D.success){
                                for(let object_id in D.data){
                                    for(let child of D.data[object_id]){
                                        
                                        this.add_to_map(object_id,child)
                                        this.list=this.get_list(this.parent.id)
                                    }
                                    
                                }
                            }
                        }
                    )
                }

                shows[l.id]=true;
                this.shows=shows;
                this.list=this.get_list(this.parent.id)
            }

            
        },
        save(l){
            
            this.$http.post(
                BackendBase+'/admin-tree/'+this.form.config,
                {
                    action:'add_branch_plain',
                    parent_id:this.parent.id,
                    header:this.values[this.form.header_field]
                }
            ).then(
                R=>{
                    let D=R.data;
                    if(D.success){
                        // добавляем в структуру
                        if(D.data_for_multi){
                            for(let dh of D.data_for_multi){
                                this.add(this.parent.id,dh);
                            }
                        }
                        else{
                            this.add(this.parent.id,D.data);
                        }
                        this.values={};
                        this.list=this.get_list(this.parent.id)

                    }
                    else{
                        this.show_errors=true, this.errors=D.errors
                    }
                    this.dialog_add_form=false;
                    
                }
            );  
        },
        get_edit_link(key){
            let url='', UrlPrefix=config.UrlPrefix
            if(this.form.card_format && this.form.card_format == 'old')
                url='/edit_form.pl?config='+config+'&action=edit&id='+key;            
            else
                url=UrlPrefix.replace(/\/$/,'')+'/edit_form/'+this.form.config+'/'+key
            return url
        },
        photo_url(l){
            if(!l || !l.photo)
                return ''
            let p=/^(https?:)?\//.test(l.photo)?l.photo:('/'+l.photo)
            return (BaseUrl||'').replace(/\/$/,'')+p
        },
        edit_in_new_tab(key){
            window.open( this.get_edit_link(key) );
        },
        go_to_edit(key){
            let t=this
            if(t.form.changed_in_tree){ // открываем форму для редактирования здесь же
                t.show_edit_form=key
            }
            else{
                window.open( this.get_edit_link(key) );
            }
            
        },
        open_dialog_add_form(l){
            this.dialog_add_form=true;
            
            l=l?l:this.parent.id;
            console.log({parent:this.parent.id})
            // хз почему, но без setTimeout не работает
            setTimeout(
                ()=>{
                    
                    //if(this.parent.id && this.$refs['new_header'+this.parent.id]){
                        this.$refs['new_header'+this.parent.id].$refs.input.focus();
                    //}
                    // else{
                    //     this.$refs['new_header'+this.parent.id].$refs.input.focus();
                    // }
                    //else{
                    //    console.log('not refs: '+'new_header'+this.parent.id)
                        //console.log('parent_id:',this.parent.id)
                    //}
                    
                    //this.$refs['new_header'+this.parent.id].$refs.input.focus();
                },
                100
            );
            //this.$refs.new_header.focus();
            
            //this.$refs['new_header'].focus()
        },
        move_start(){

        },
        close_edit_form(){
            this.show_edit_form=0
        }
  },
  
  computed:{
      cur_color(){
          let colors=(this.$scheme && this.$scheme.colors && this.$scheme.colors.treeLevels) || ['#CFD8DC','#D7CCC8','#FFCCBC','#FFE0B2','#FFECB3','#FFF9C4','#F0F4C3','#DCEDC8','#C8E6C9','#B2DFDB','#B2EBF2','#B3E5FC','#BBDEFB','#C5CAE9'];
          if(this.level in colors)
            return colors[this.level]
          return '#ffffff'
      },
      exist_childs(){
        return (this.list && this.list.length>0)
      },
      make_add(){
        return (!this.form.not_create && (!this.form.max_level || (parseInt(this.form.max_level) >= parseInt(this.level)) ))
      },
      is_galery(){
        let vt=this.form && this.form.view_type
        return vt=='gallery' || vt=='galery'
      },
      gallery_style(){
        let cols=parseInt(this.form && this.form.cols)
        if(cols>0)
          return {gridTemplateColumns:'repeat('+cols+', minmax(0, 1fr))'}
        return {}
      }
  },
  created(){
    this.init()
  },
  mounted(){

  },
  watch:{
    renew(){
        this.list=this.get_list(this.parent.id)
        for(let l of this.list){
            l.childs=this.get_list(l.id)
        }
    },
    form(){
        console.log('FORM_RELOAD')
    },
    new_runner(){
          if(this.new_runner){
              this.dialog_add_form=true
          }
            
    }
  },
  name: "nested-draggable"
};
</script>
<style scoped>
.Area {
  min-height: 50px;
  max-width: 1000px;
  padding: 0 0.5rem 0 1rem; 
  /*outline: 1px dashed;*/

}
.Area ul {list-style: none; padding: 0; min-height: 40px; /*border: 1px solid gray;*/}
.add_form {
    border: 1px solid gray;
    max-width: 250px;
    padding: 1rem;
}

.li_header {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #E8EAF6; border-radius: 10px; width: 85%; max-width: 1000px; padding: 0.5rem;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
}
/* Плоский список (без дерева): строки-разделители вместо "коробок" */
.Area.flat-list ul > li .li_header {
    border: none;
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 0;
    width: 100%;
    padding: 0.55rem 0.25rem;
    margin-bottom: 0;
    margin-top: 0;
    transition: background-color .15s ease;
}
.Area.flat-list ul > li .li_header:hover {
    background-color: rgba(var(--v-theme-primary), 0.05);
}
.li_empty{
    /*border: 1.5px solid deepskyblue;*/
    border-radius: 10px;
    min-width: 350px;
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
}
div.plus-icon{
    flex: 0 0 auto;
    min-width: 18px;
    margin-right: 6px;
    display: inline-flex;
    align-items: center;
}
div.plus-icon button {margin: 0;}
div.branch-header{
    flex: 1 1 auto;
    min-width: 0;
    width: auto;
    display: inline-block;
}
div.branch-tools{
    flex: 0 0 auto;
    width: auto;
    min-width: 30px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0;
}
div.branch-tools a{text-decoration: none; display: inline-flex; align-items: center;}
div.branch-tools .v-icon {cursor: pointer;}
.ws-nowrap{
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    flex: 1 1 auto;
    width: 100%;
}

li.sortable-ghost .li_header {
    background-color:#e4e4ff;
}
li:hover .li_header > .li_header {
    background-color:#ffffff !important;
}
ul[aria-grabbed="true"] .li_header{
    background-color: #E8EAF6;
}
ul[aria-grabbed="true"] .li_header .li_header{
    background-color: #ffffff;
}
.item-dropzone-area {
    height: 2rem;
    background: #888;
    opacity: 0.8;
    animation-duration: 0.5s;
    animation-name: nodeInserted;
}
@media only screen and (max-width: 500px) {
    div.plus-icon{
        width: 20px;
    }
    .li_header {
        width: 100%;
    }
    div.branch-header{
        
        max-width: 80%;
        display:inline-block;
    }
    .div.branch-tools{
        width: 50px;;        
    }
    .li_empty{
        min-width: 230px;
    }
}

/* Галерейный вид (form.view_type == 'gallery') */
.gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 1rem;
    padding: 0.5rem 0;
    min-height: 40px;
}
.gallery_item {
    min-width: 0;
}
.gallery_card {
    position: relative;
    border: 1px solid #E8EAF6;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    height: 100%;
    display: flex;
    flex-direction: column;
    transition: box-shadow .15s ease;
}
.gallery_card:hover {
    box-shadow: 0 2px 10px rgba(0,0,0,.14);
}
.gallery_photo_wrap {
    aspect-ratio: 4 / 3;
    background: #f5f5f5;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}
.gallery_photo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
}
.gallery_no_photo {
    color: #9e9e9e;
    font-size: 0.8rem;
}
.gallery_title {
    padding: 0.5rem 0.6rem;
    font-size: 0.85rem;
    line-height: 1.25;
    flex: 1 1 auto;
}
.gallery_title a {
    text-decoration: none;
    color: inherit;
}
.gallery_tools {
    position: absolute;
    top: 6px;
    right: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 3px 6px;
    border-radius: 8px;
    background: rgba(255,255,255,.85);
    opacity: 0;
    transition: opacity .15s ease;
}
.gallery_card:hover .gallery_tools {
    opacity: 1;
}
.gallery_tools a {
    text-decoration: none;
    display: inline-flex;
    align-items: center;
}
.gallery_tools .v-icon {
    cursor: pointer;
}
.gallery_ghost {
    opacity: .4;
}
</style>