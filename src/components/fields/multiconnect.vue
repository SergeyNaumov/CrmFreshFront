<template>
    <div class="multiconnect">
        <errors :errors="errors"/>
        
        <template>
                <div v-if="field.fast_search">
                    <v-text-field label='быстрый поиск' v-model="search" flat hide-details/>
                </div>
                
                <v-treeview v-if="out_tree"
                    item-disabled="read_only"
                    :items="list"
                    :selection-type="selectionType"
                    :search="search"
                    item-text="header"
                    item-children="child"                   

                    
                    v-model="value"
                    dense
                    selectable
                    hoverable
                    selected-color="primary"
                />
                <div v-else>
                    
                    <a href="" @click.prevent="show_adding_form=true" v-if="!show_adding_form">добавить</a>
                    <a href="" @click.prevent="show_adding_form=false"  v-if="show_adding_form">отменить</a>
                    
                    <div v-if="field.make_add" v-show="show_adding_form">
                        <v-text-field label='новый тэг' v-model="new_tag" />
                        <div class="tag_list">
                            
                            <span v-show="0">{{value}}</span> <!-- без этого не работает добавление тэгов. ХЗ почему -->
                            <div v-for="(t,idx) in tag_list" :key="idx">
                                
                                <div v-show="!selected_hash[t.v]">
                                    <a href="" @click.prevent="on_tag(t)">{{t.d}}</a>
                                </div>
                            </div>
                        </div>
                        
                        <v-btn @click.prevent="add_tag" v-show="new_tag && new_tag_checked && !new_tag_exists"  small>добавить тэг "{{new_tag}}"</v-btn>

                    </div>

                    <v-layout row class="multiconnect">
                        
                        <template v-if="field.view_only_selected">
                                <v-flex v-for="(l,idx) in list_searched" :class="get_md_class" v-show="selected_hash[l.id]" :key="'l'+idx">
                                    <v-checkbox hide-details :label="l.header" v-model="selected_hash[l.id]" @change="selected_hash_to_value()"></v-checkbox>
                                </v-flex>
                        </template>
                        <template v-else>
                            <v-flex :class="get_md_class"  v-for="l in list_searched" :key="l.id">
                                <v-checkbox hide-details :label="l.header" v-model="selected_hash[l.id]" @change="selected_hash_to_value()"></v-checkbox>
                            </v-flex>
                        </template>
                        <div v-if="!list_searched.length && list.length">
                            ничего не найдено
                        </div>

                    </v-layout>
                </div>

        </template>

    </div>

</template>

<script>
  import { bus } from '../../main'
  export default {
    data:function(){
        return {
            search:'',
            selected_hash:{},
            value:[],
            selectionType: 'leaf',
            list: [],
            errors:[],
            show_adding_form: false,
            new_tag:'',
            new_tag_not_ajax:0,
            new_tag_exists: false,
            new_tag_checked: false, // если мы проверили на существование или не существование тэга в базе -- true
            //new_tag_items:[{v:1,d:'1'},{v:2,d:'2'},{v:3,d:'3'}],
            tag_list:[]
        }
    },
    props:['form','field'],
    watch:{
        value(){ // автосохранение
            let field=this.field;
            field.value=this.value;
            //this.change_field(field)
            bus.$emit('change_field',field)
        },
        new_tag(){
            this.new_tag_not_ajax++;
            setTimeout(
                ()=>{
                    this.new_tag_not_ajax--;
                },
                799
            );
            setTimeout(
                ()=>{
                    if(this.new_tag_not_ajax){
                        
                        return ;
                    }
                    //console.log('go_ajax: '+this.new_tag_not_ajax);

                        
                    this.new_tag_exists=false, this.new_tag_checked=false;

                    if(this.new_tag){
                        let url=BackendBase+'/multiconnect/'+this.form.config+'/'+this.field.name;
                        this.$http.post(
                            url,
                            {
                                action:'autocomplete',
                                header: this.new_tag,
                            }
                        ).then(
                            response=>{
                                let D=response.data;
                                if(D.success){
                                    this.tag_list=D.list;
                                    this.new_tag_checked=true;
                                    this.new_tag_exists=D.exists_tag*true
                                }
                                this.errors=D.errors;
                            }
                        )
                    }
                    else{
                        this.tag_list=[]
                    }
                },
                800
            );

        }

    },
    computed:{
        url(){
            return BackendBase+'/multiconnect/'+this.form.config+'/'+this.field.name
        },
        out_tree(){
            // если tree_use или не указано cols -- выводим через v-treeview
            //console.log({out_tree:this.field.tree_use});
            return (this.field.tree_use)

        },
        get_md_class(){
            if(this.field.cols>0)
                return 'md'+parseInt(12/this.field.cols);
            return 'md12'
        },
        list_searched(){
            if(this.field.tree_use || !this.field.cols)
                return this.list;
            let filter = this.search.toUpperCase();
            if(!filter)
                return this.list;

            let new_list=[];
            for(let el of this.list){
                if(el.header.toUpperCase().indexOf(filter)>-1)
                    new_list.push(el)
            }
            return new_list;
        }
    },
    created(){   
    },
    mounted(){
        this.init();
    },

    methods: {

        value_to_selected_hash(){
            for(let v of this.value)
                this.selected_hash[v]=true;
        },
        selected_hash_to_value(){
            let new_value=[];
            for(let k of Object.keys(this.selected_hash)){
                if(this.selected_hash[k])
                    new_value.push(k)
            }
            this.value=new_value;
            let field=this.field;
            field.value=this.value;
            this.change_field(field)
        },
        init(){ // получаем список элементов дерева
            
            this.$http.post(
                this.url,
                {
                    action:'get',
                    id:this.form.id?this.form.id:undefined
                }
            ).then(
                response=>{
                    let D=response.data;
                    if(D.success){
                        // преобразование типов (с числами ошибка)
                        for(let i in D.list){
                            D.list[i].id=D.list[i].id.toString()
                        }
                        this.list=D.list;
                        
                        for(let i in D.value){
                            D.value[i]=D.value[i].toString()
                        }
                        
                        this.value=D.value;
                        if(!this.out_tree) // если выводим как список -- инитим хэш включенных
                            this.value_to_selected_hash();
                        
                    }
                    this.errors=D.errors;
                }
            ).catch(
                e=>{
                    alert('on request: '+this.url+', error: '+e)
                }
            );
        },
        on_tag(t){
            //console.log(t);
            this.selected_hash[t.v]=this.selected_hash[t.v]?false:true;
            this.selected_hash_to_value();

            //this.value=this.field.value;
        },
        add_tag(){ // создаём новый тэг в базе
            this.$http.post(
                this.url,
                {
                    action:'add_tag',
                    header: this.new_tag
                }
            ).then(
                r=>{
                    let D=r.data;
                    if(D.success){
                        
                        this.list.push({id:D.tag_id,header:this.new_tag});
                        this.on_tag({v:D.tag_id,d:this.new_tag});
                        this.selected_hash[D.tag_id]=true;
                        this.value.push(D.tag_id);
                        //this.selected_hash_to_value();
                    }
                }
            )
        }

    }
  }
</script>
<style scope>
    .tag_list {margin-left: 20px;}
    .tag_list div {margin-left: 10px;}
    .layout.multiconnect {padding-left: 20px;}
    .multiconnect, .multiconnect .v-label {font-size: 12px !important; }
    .v-input--selection-controls {margin-top: 5px; font-size: 10px;}
    .v-treeview-node__children {margin-left: 50px !important;}
    .v-treeview--dense .v-treeview-node__root {min-height: 20px;}
</style>
