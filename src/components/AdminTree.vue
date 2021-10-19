<template>
   <v-app>
    <v-container fluid >
      
      <h1 class="title">{{form.title}}</h1>
        <pre v-if="0">{{map}}</pre>
        <div v-if="fatal_errors.length" class="errors">
            <div v-for="e in fatal_errors" :key="e">{{e}}</div>
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
                :list="list"
                :parent="{id:0}"
                :watch_parent="watch_parent"
                :add_to_map="add_to_map"
                :new_runner="new_runner"
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
      branch
  },
  data () {
      return {
            form:{},
            list: [],
            map:{}, // быстрое нахождение по id элемента
            parents:{}, // быстрое нахождение parent-а по id
            need_watch:0,
            fatal_errors:[],
            errors:[],
            watch_parent:'',
            new_runner:0

      }
      
  },
  created(){
    
    
  },
  watch:{
    params(){
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
  beforeDestroy(){
    document.removeEventListener('keydown', function(event) {
    })
  },
  */
  computed:{

  },
  methods:{

    init(){
        this.$http.get(BackendBase+'/admin-tree/'+this.params.config).then(response=>{
            var D=response.data;
            if(D.success){
                this.list=D.tree; this.form=D.form;
                for(let l of this.list){
                    this.add_to_map(null,l)
                }
                document.title=this.form.title;
                
                if(D.javascript)
                  eval(D.javascript);
            }
            else{
              this.form.title='Ошибка!';
              this.fatal_errors=D.errors
            }
              
            
            
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
        this.map[l.id]=l;
        this.parents[l.id]=parent_id;
      },
      del(parent_id, l){
          //var tree=this;
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
              }
              else
                  alert(D.error);
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
      move_end(e){
          let arr;
          let from=e.from.getAttribute('id'),
              to=e.to.getAttribute('id'),
              item=e.item.getAttribute('id');
          
          console.log({from:from})
              arr=from.match(/p-([0-9]+)/); from=arr[1]; 
              arr=to.match(/p-([0-9]+)/); to=arr[1]; 
              arr=item.match(/li-([0-9]+)/); item=arr[1]; 

          console.log({
               from:from,
               to:to,
               item:item,
               arr:arr
          });
          

          if(from==to) // перемещение в пределах одной ветки
              this.request_sort(from,this.obj_sort_by_parent(from));
          
          else // если ветки разные -- сначала переносим объект, потом сортируем ветки
              this.$http.post( 
                BackendBase+'/admin-tree/'+this.form.config,
                {
                  action:'move',id:item,to:to
                }
              ).then(
                response=>{
                  let R=response.data;
                  this.errors=R.errors;
                  if(R.success){
                    this.request_sort(from,this.obj_sort_by_parent(from));
                    this.request_sort(to,this.obj_sort_by_parent(to));
                  }

                }
              ).catch(
                e=>{
                  this.errors=['Ошибка при перемещении объекта: '+e]
                }
              )
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
      }
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