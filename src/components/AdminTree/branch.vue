<template>
    <div>
        
        <v-dialog v-model="dialog_add_form" max-width="500">
            <v-card>
                <v-card-title  class="headline">Создание нового элемента</v-card-title>
                <v-card-text>
                    <v-text-field  @keyup.enter="save()" label="Наименование раздела" :ref="'new_header'+parent.id" v-model="values[form.header_field]" />
                </v-card-text>
                <v-card-actions>
                    <div class="flex-grow-1"></div>
                    <v-btn color="red" text @click="dialog_add_form=false">Отменить</v-btn>
                    <v-btn color="primary darken-1" text @click="save()">Сохранить</v-btn>   
                </v-card-actions>  
            </v-card>
        </v-dialog>
        
        <v-dialog v-model="show_errors" max-width="500">
            <v-card>
                <v-card-title  class="headline">Произошли ошибки</v-card-title>
                <v-card-text>
                    <errors :errors="errors" />
                </v-card-text>
                <v-card-actions>
                    <div class="flex-grow-1"></div>
                    <v-btn color="red" text @click="show_errors=false">Закрыть</v-btn>
                      
                </v-card-actions>  
            </v-card>
        </v-dialog>
        <div class="Area">
        <a href="#" v-if="make_add " @click.prevent="open_dialog_add_form">добавить
                <span v-if="parent.id"> в "{{parent.header}}" </span>
                <span v-else> в /</span>
        </a>
        <div v-if="form.sort">
            
            <!-- -->
            <draggable
                :id="'p-'+parent.id"
                tag="ul"
                v-if="list.length"
                :list="list"
                class="list-group"
                ghost-class="ghost"
                :options="{'group':'g'+parent.id}"
                @start="move_start"
                @end="move_end"
                
            >   
                <li v-for="l in list" :key="l.id" :id="'li-'+l.id" >
                <div >
                    <div class="li_header" :style='{"background":cur_color}'  >
                            <div class="plus-icon " v-if="form.tree_use" >
                                <v-icon small color="primary" v-if="!shows[l.id] && form.tree_use" @click="show_this(l)">fa fa-plus</v-icon>
                                <v-icon small color="primary" v-if="shows[l.id]" @click="shows[l.id]=false">fa fa-minus</v-icon>
                            </div>
                            <div class="branch-header" >
                                {{ l.header }} 
                                <template v-if="l.childs && form.tree_use">({{l.childs.length}})</template>
                            </div>
                            <div class="branch-tools " style="display: block; position: relative; top: -30px; height: 0; margin-bottom: 0; text-align: right; ">
                                <a :href="'/edit_form/'+form.config+'/'+l.id" @click.prevent="go_to_edit(l.id)"><v-icon color="primary" small >edit</v-icon></a>&nbsp;
                                <v-icon v-if="make_delete(parent.id,l)" small style="font-size: 10pt;" color="primary" @click="del(parent.id,l)">fa fa-trash</v-icon>
                            </div>
                    </div>
                    <template v-if="shows[l.id]">
                        <nested-draggable v-if="l.childs"
                            :form="form"
                            :level="(level+1)"
                            :list="l.childs" :add_to_map="add_to_map"
                            :parent="l"
                            :add="add" :del="del" :move_end="move_end"
                        />
                    </template>

                </div>

                </li>
            </draggable>
        </div>
        <template v-else>
            <ul v-if="list.length">
                <li v-for="l in list" :key="l.id" :id="'li-'+l.id">
                    <div class="li_header">
                        <div class="ws-nowrap">
                            <div class="plus-icon float-left" v-if="form.tree_use">
                                <v-icon small color="primary" v-if="!shows[l.id] && form.tree_use" @click="show_this(l)">fa fa-plus</v-icon>
                                <v-icon small color="primary" v-if="shows[l.id]" @click="shows[l.id]=false">fa fa-minus</v-icon>
                            </div>
                            <div class="branch-header">
                                {{ l.header }}
                                <template v-if="l.childs && form.tree_use">({{l.childs.length}})</template>
                            </div>
                            <div class="branch-tools float-right">
                                <a :href="'/edit_form/'+form.config+'/'+l.id" @click.prevent="go_to_edit(l.id)"><v-icon color="primary" small >edit</v-icon></a>&nbsp;
                                <v-icon v-if="make_delete(parent.id,l)" small style="font-size: 10pt;" color="primary" @click="del(parent.id,l)">fa fa-trash</v-icon>
                            </div>
                        </div>
                    </div>

                    <template v-if="shows[l.id]">
                        <nested-draggable v-if="l.childs"
                            :form="form"
                            :level="(level+1)"
                            :list="l.childs" :add_to_map="add_to_map"
                            :parent="l"
                            :add="add" :del="del" :move_end="move_end"
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

export default {
  props: {
    list: {type: Array,required:false},
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
          show_errors:false,
          shows:{
            0:false          
          },
          
      }
  },
  methods:{
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
                                    }
                                    
                                }
                            }
                        }
                    )
                }

                shows[l.id]=true;
                this.shows=shows;
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
                        
                        this.add(this.parent.id,D.data);
                        this.values={};
                    }
                    else{
                        this.show_errors=true, this.errors=D.errors
                    }
                    this.dialog_add_form=false;
                    
                }
            );  
        },
        go_to_edit(key){
            let url=''; 
            if(this.form.card_format && this.form.card_format == 'old')
                url='/edit_form.pl?config='+config+'&action=edit&id='+key;            
            else
                url='/edit_form/'+this.form.config+'/'+key
            window.open(url);
        },
        open_dialog_add_form(l){
            this.dialog_add_form=true;
            
            l=l?l:this.parent.id;
            console.log({parent:this.parent.id})
            // хз почему, но без setTimeout не работает
            setTimeout(
                ()=>{
                    
                    if(this.parent.id && this.$refs['new_header'+this.parent.id]){
                        this.$refs['new_header'+this.parent.id].$refs.input.focus();
                    }
                    else{
                        console.log('not refs: '+'new_header'+this.parent.id)
                    }
                    
                    //this.$refs['new_header'+this.parent.id].$refs.input.focus();
                },
                100
            );
            //this.$refs.new_header.focus();
            
            //this.$refs['new_header'].focus()
        },
        move_start(){

        }
  },
  computed:{
      cur_color(){
          let colors=['#CFD8DC','#D7CCC8','#FFCCBC','#FFE0B2','#FFECB3','#FFF9C4','#F0F4C3','#DCEDC8','#C8E6C9','#B2DFDB','#B2EBF2','#B3E5FC','#BBDEFB','#C5CAE9'];
          if(this.level in colors)
            return colors[this.level]
          return '#ffffff'
      },
      exist_childs(){
        return (this.list && this.list.length>0)
      },
      make_add(){
        return (!this.form.not_create && (!this.form.max_level || (parseInt(this.form.max_level) >= parseInt(this.level)) ))
      }
  },
  mounted(){

  },
  watch:{
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
    border: 1px solid #E8EAF6; border-radius: 10px; width: 85%; max-width: 1000px; padding: 0.5rem;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
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
    min-width: 20px; 
    display:inline-block;
}
div.plus-icon button {margin: 0;}
div.branch-header{
    width:auto; 
    max-width: 80%;
    display:inline-block;
}
div.branch-tools{
    width:auto;
    display:inline-block; 
    min-width: 30px;
    margin-bottom: 20px;
}
div.branch-tools a{text-decoration: none;}
.ws-nowrap{
    white-space:nowrap;
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
</style>