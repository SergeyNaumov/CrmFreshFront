<template>
   <v-app>
    <v-dialog v-model="del_dialog" max-width="480">
      <v-card>
        <v-card-title class="text-h6">Удаление элемента</v-card-title>
        <v-card-text>
          <template v-if="del_children>0">
            Данная запись содержит {{ del_children }} дочерних. Вы действительно хотите удалить?
          </template>
          <template v-else>
            Вы действительно хотите удалить элемент?
          </template>
          <div v-if="del_target && del_target.header" class="mt-3 font-weight-medium">{{ del_target.header }}</div>
        </v-card-text>
        <v-card-actions>
          <div class="flex-grow-1"></div>
          <v-btn color="red" variant="text" @click="del_dialog=false">Отменить</v-btn>
          <v-btn color="primary-darken-1" variant="text" @click="confirm_del">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="snackbar" color="error" timeout="5000" location="top">
      {{ snackbar_text }}
    </v-snackbar>
    <v-container fluid >
      
      <h1 class="title">{{form.title}}</h1>
        <pre v-if="0">{{map}}</pre>
        <div v-if="fatal_errors.length" class="errors">
            <div v-for="(e,idx) in fatal_errors" :key="`err${idx}`">{{e}}</div>
        </div>
        <template v-else>
          <div v-if="errors.length" class="errors">
              <div v-for="e in errors" :key="e">{{e}}</div>
          </div>
          <div>
              <branch
                :level="1"
                :form="form"
                :add="add" :del="del" :move_end="move_end"
                :renew="renew"
                :parent="{id:0}"
                :watch_parent="watch_parent"
                :add_to_map="add_to_map"
                :new_runner="new_runner"
                :get_list="get_list"
                :drag="drag"
              />
          </div>
        </template>
        <!--<rawDisplayer class="col-3" :value="list" title="List" />-->
    </v-container>
</v-app>
</template>

<script>
// https://sortablejs.github.io/Vue.Draggable/#/functional

import branch from "./AdminTree/branch.vue";


export default {
  props:['params'],
  components:{
    'branch':branch
  },
  data () {
      return {
            renew:0,
            form:{},
            list: [],
            map:{}, // быстрое нахождение по id элемента
            parents:{}, // быстрое нахождение parent-а по id
            need_watch:0,
            fatal_errors:[],
            errors:[],
            watch_parent:'',
            new_runner:0,
            del_dialog:false,
            del_target:null,
            del_children:0,
            snackbar:false,
            snackbar_text:'',
            // Состояние drag&drop для подсветки цели переноса (см. branch.vue).
            drag:{over_list:'',over_item:'',over_nest:false}

      }
      
  },
  created(){
    
    
  },
  watch:{
    params(){
      console.log('params:',this.params)
      this.list=[]
      this.map={}
      this.parents={}
      
      this.init();
      

    }
  },
  mounted(){
    this.init()
    /*
    self=this
    document.addEventListener('keydown', function(event) {
      console.log(event.code)
      if(event.code=='KeyN'){
        // 
        //self.new_runner++
        //console.log(self.new_runner)
      }
      if (event.code == 'KeyZ' && (event.ctrlKey || event.metaKey)) {
        alert('Отменить!')
      }
    })
    */
  },
  /*
  beforeUnmount(){
    document.removeEventListener('keydown', function(event) {
    })
  },
  */
  computed:{

  },
  methods:{

    init(){
        this.$http.get(BackendBase+'/admin-tree/'+this.params.config).then(response=>{
            let D=response.data;
            if(D.success){
                this.list=D.tree; this.form=D.form;
                for(let l of this.list){
                    this.add_to_map(null,l)
                }
                document.title=this.form.title;
                
                if(D.javascript)
                  eval(D.javascript);
                this.renew++
            }
            else
            {
              this.form.title='Ошибка!';
              
            }
            this.fatal_errors=D.errors
              
            
            
          }).catch(e => {
            alert(e);
        });
    },

      add(parent_id,l){ // добавление элемента
        if(parent_id){
          if(this.map[parent_id])
            this.map[parent_id].childs.push(l)

        }
        else{ 
          this.list.push(l);
        }

        this.add_to_map(parent_id,l)
        this.renew++
        
      },
      del(parent_id, l){
          // Спрашиваем число дочерних и открываем модалку подтверждения.
          this.$http.get(BackendBase+'/children-count/'+this.form.config+'/'+l.id).then(r=>{
            this.del_children=(r.data && r.data.children_count) || 0;
            this.del_target={parent_id:parent_id, l:l, header:(l && l.header) || ''};
            this.del_dialog=true;
          }).catch(()=>{
            this.del_children=0;
            this.del_target={parent_id:parent_id, l:l, header:(l && l.header) || ''};
            this.del_dialog=true;
          });
      },
      confirm_del(){
          const t=this.del_target;
          this.del_dialog=false;
          if(t) this.do_del(t.parent_id, t.l);
      },
      do_del(parent_id, l){
          this.$http({
              method:'post',
              url:BackendBase+'/admin-tree/'+this.form.config,
              data:{
                  config:this.form.config,
                  action:'delete_branch',
                  id:l.id
              }
          }).then(response=>{
              let D=response.data;
              console.log('success: ',D.success)
              if(D.success){
                  if(parent_id){
                    
                    let list=[]
                    for(let c of this.map[parent_id].childs){
                      if(c.id!=l.id) list.push(c)
                    }
                    this.map[parent_id].childs=list
                  }
                  else{ // удаляем из корневой ветки
                      let list=[];
                      for(let c of this.list){
                        if(c.id!=l.id) list.push(c)
                      }
                      this.list=list;
                  }
                  delete this.map[l.id];
                  delete this.parents[l.id];
                  this.renew++
              }
              else
                  this.notify(D.errors && D.errors[0]);
          });
      },
      add_to_map(parent_id,l){

          if( !(l.id in this.map) ){
              this.map[l.id]=l;
              this.parents[l.id]=parent_id;
              if(parent_id && parent_id in this.map){
                this.watch_parent=parent_id
                let parent_object=this.map[parent_id]
                if( !('childs' in parent_object) ){
                  parent_object.childs=[]
                  parent_object.childs.push(l)
                }
              }
              

          }
         
          if(l.childs){ // если у добавляемого элемента есть дочерние -- добавляем их тоже
              
              for(let child of l.childs){
                this.add_to_map(l.id,child)
              }
          }
          
          this.renew++
      },
      obj_sort_by_parent(parent_id){
        parent_id=parseInt(parent_id);
        let list=[];
        if(!parent_id)
          list=this.list
        else{
          list=this.map[parent_id].childs    
        }

          
        
        let i=1; let obj_sort={};
        for(let t of list)
            obj_sort[t.id]=i++;
        
        return obj_sort;
      },
      get_list(parent_id){
        parent_id=parseInt(parent_id);
        let list=[];
        if(!parent_id)
          list=this.list
        else{
          list=this.map[parent_id].childs    
        }
        //this.renew++
        return list
      },
      move_end(e){
          // запомним состояние до сброса
          const over_nest=this.drag.over_nest, over_item=this.drag.over_item, over_list=this.drag.over_list;
          this.drag.over_list=''; this.drag.over_item=''; this.drag.over_nest=false;
          // извлекаем id из id-атрибутов списков ("p-<id>") и элемента ("li-<id>")
          let from=(e.from && e.from.id ? e.from.id : '').replace('p-',''),
              to=(e.to && e.to.id ? e.to.id : '').replace('p-',''),
              item=(e.item && e.item.id ? e.item.id : '').replace('li-','');

          // Бросок на строку ветки (середина строки) — вкладываем в эту ветку,
          // а не в список родителя. Край строки = обычная сортировка.
          if(over_nest && over_item && over_list===e.to.id){
              const nid=String(over_item).replace('li-','');
              if(nid && nid!==String(item)) to=nid;
          }

          const sort_of=(el)=>{ let o={},i=1; for(let c of ((el&&el.children)||[])){ let id=(c.id||'').replace('li-',''); if(id) o[id]=i++; } return o; };

          if(from==to){ // перемещение в пределах одной ветки
              this.request_sort(from, sort_of(e.to));
              this.renew++
              return;
          }
          // из одной ветки в другую: сначала на сервере, потом сортируем обе ветки
          this.$http.post(
                BackendBase+'/admin-tree/'+this.form.config,
                { action:'move', id:item, to:to }
          ).then(response=>{
                let R=response.data;
                this.errors=R.errors||[];
                if(R.success){
                    // VueDraggable (:list) сам перенёс элемент между массивами —
                    // вручную НЕ добавляем (иначе дубль). Только сортировка.
                    this.request_sort(from, sort_of(e.from));
                    this.request_sort(to, sort_of(e.to));
                    this.renew++
                } else {
                    this.notify((R.errors && R.errors[0]) || 'Не удалось переместить элемент');
                    this.init(); // сервер отклонил (например, цикл) — перечитываем дерево
                }
          }).catch(err=>{
                this.notify('Ошибка при перемещении объекта: '+err);
                this.init();
          });
      },
      notify(text){
          this.snackbar_text=text || 'Ошибка';
          this.snackbar=true;
      },
      reparent(from,to,item){
          // обновляем in-memory структуру после успешного переноса
          let fromList=(from==='0'||from==='')?this.list:(this.map[from]?this.map[from].childs:null);
          if(fromList){
              let filtered=fromList.filter(c=>String(c.id)!==String(item));
              if(from==='0'||from==='') this.list=filtered;
              else if(this.map[from]) this.map[from].childs=filtered;
          }
          let obj=this.map[item];
          if(!obj) return;
          this.parents[item]=to;
          if(to==='0'||to===''){ this.list.push(obj); }
          else if(this.map[to]){ if(!this.map[to].childs) this.map[to].childs=[]; this.map[to].childs.push(obj); }
      },
      request_sort(parent_id,obj_sort){
          this.$http.post(
              BackendBase+'/admin-tree/'+this.form.config,
              {
                  action:'sort',
                  config:this.form.config,
                  parent_id:parent_id,
                  obj_sort:obj_sort
              }
          ).then(request=>{
              var R=request.data;
              this.errors=R.errors;
              if(!R.success){
                  //alert('Ошибка сети при отправки запроса на сортировку')
              }
          }).catch({
              function(error){
                  alert(error)
              }
          })
      },

  }
  
}
</script>
<style scoped>
.errors {color: red;}
.errors div {margin: 0.5rem;}
ul{
      list-style-type: none;
}

</style>