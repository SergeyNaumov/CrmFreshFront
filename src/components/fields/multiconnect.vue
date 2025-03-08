<template>
    <div class="multiconnect">

        <errors :errors="errors"/>
        
        <template>
                <div v-if="field.fast_search">
                    <v-text-field label='быстрый поиск' v-model="search" flat hide-details/>
                </div>
                <template v-if="field.subtype=='table'">
                    <table class="mini" v-if="Object.keys(selected_hash).length">

                        <tr v-for="tr in list" :key="`row_${tr.id}`">
                            <td>{{tr.header}}: </td>
                            <td v-for="f in field.fields" v-if="f.name && selected_hash[tr.id]">
                                <template v-if="f.type=='text'" >
                                    <input :class="{percent: f.subtype=='percent'}" type="text" :disabled="read_only" v-model="selected_hash[tr.id][f.name]" @keyup="subtype_percent_check(tr.id,f.name)">
                                    <template v-if="f.subtype=='percent'">
                                        %
                                    </template>
                                </template>

                            </td>
                        </tr>
                    </table>
                </template>
<!--                 <v-treeview v-else-if="out_tree"
                    item-disabled="read_only"
                    :items="list"
                    :selection-type="selectionType"
                    :search="search"
                    item-text="header"
                    item-children="child"                   

                    @change="selected_hash_to_value"
                    v-model="value"
                    dense
                    selectable
                    hoverable
                    selected-color="primary"
                /> -->
                <tree-view
                v-else-if="out_tree"
                :items="list"
                :search="search"
                :selected-hash="selected_hash"
                @change="selected_hash_to_value"
              />
                <div v-else>
                    

                    <div v-if="field.make_add" v-show="show_adding_form">
                        <a href="" @click.prevent="show_adding_form=true" v-if="!show_adding_form">добавить</a>
                        <a href="" @click.prevent="show_adding_form=false"  v-if="show_adding_form">отменить</a>
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
                    <v-container>
                        <template v-if="field.view_only_selected">
                            <v-row>
                                <v-col v-for="(l,idx) in list_searched" :md="get_md_class2" v-show="selected_hash[l.id]" :key="'l'+idx">
                                    <v-checkbox hide-details :label="l.header" v-model="selected_hash[l.id]" @change="selected_hash_to_value()"></v-checkbox>
                                </v-col>
                            </v-row>
                        </template>
                        <template v-else>
                            <v-row>
                                <v-col v-for="(l,idx) in list_searched" :md="get_md_class2" :key="'l'+idx">
                                    <v-checkbox hide-details :label="l.header" v-model="selected_hash[l.id]" @change="selected_hash_to_value()" />
                                </v-col>

                            </v-row>
                        </template>
                        <div v-if="!list_searched.length && list.length">
                            ничего не найдено
                        </div>
                    </v-container>

                </div>

        </template>

    </div>

</template>

<script>
import TreeView from "./TreeView.vue";
  export default {
    components: {TreeView},
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
            this.$bus.emit('change_field',field)
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
        read_only(){
            return this.form.read_only || this.field.read_only
        },
        url(){
            return BackendBase+'/multiconnect/'+this.form.config+'/'+this.field.name
        },
        out_tree(){
            // если tree_use или не указано cols -- выводим через v-treeview
            return (this.field.tree_use)

        },
        get_md_class2(){
            if(this.field.cols>0)
                return parseInt(12/this.field.cols);
            return '12'
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
            let t=this


            if(t.field.subtype=='table'){
                let sh={}
                for(let tr of t.list){

                    sh[tr.id]={id: tr.id}
                    for(let f of t.field.fields){
                        sh[tr.id][f.name]=''
                    }
                }
                for(let v of t.value){

                    sh[v.id]={id:v.id}
                    for(let f of t.field.fields){
                        sh[v.id][f.name]=v[f.name]
                    }

                }
                t.selected_hash=sh
            }
            else{
                for(let v of t.value)
                    t.selected_hash[v]=true
            }


        },
        selected_hash_to_value(){
            let t=this, field=t.field, new_value=[];

            if(t.field.subtype=='table'){
                for(let k of Object.keys(t.selected_hash)){
                    new_value.push(t.selected_hash[k])
                }
            }
            else{
                for(let k of Object.keys(t.selected_hash)){
                    if(t.selected_hash[k])
                        new_value.push(k)
                }
            }

            t.value=new_value
            field.value=t.value
            this.$bus.emit('change_field',field)
        },
        init(){ // получаем список элементов дерева
            let t=this
            t.$http.post(
                t.url,
                {
                    action:'get',
                    id:t.form.id?t.form.id:undefined
                }
            ).then(
                response=>{
                    let D=response.data;
                    if(D.success){
                        // преобразование типов (с числами ошибка)
                        for(let i in D.list){
                            D.list[i].id=D.list[i].id.toString()
                        }
                        t.list=D.list;

                        t.value=D.value;
                        if(!t.out_tree) // если выводим как список -- инитим хэш включенных
                            t.value_to_selected_hash();

                        
                    }
                    t.errors=D.errors;
                }
            ).catch(
                e=>{
                    alert('on request: '+t.url+', error: '+e)
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
        },
        subtype_percent_check(id,name){
            let t=this, v=t.selected_hash[id][name]+''

            v=v.replace(/[^\d]+/g,'').replace(/^([2-9]\d)\d+$/,'$1')
            if(parseInt(v)>100){
                v=100
            }
            t.selected_hash[id][name]=v
            t.selected_hash_to_value()
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
    .mini td {border: none !important;}
    .mini input {border: 1px solid gray !important; padding: 2px 1px; margin: 5px;}
    input.percent {width: 30px; text-align: right}
</style>
