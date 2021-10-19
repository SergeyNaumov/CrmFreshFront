<template>      
    <div>
      <errors :errors="errors" v-if="errors.length"></errors>
      <template v-if="id">
            <v-progress-circular indeterminate color="primary" v-if="loading"></v-progress-circular>
            <template v-else>
              <v-card class="memo"  :class="{'is_in_results':is_in_results}">
                <div v-if="!data.length">
                  пусто
                </div>
                <div v-for="(l,idl) in data" :key="l.idl" >
                    <div v-if="l.edit_on" class="edit_on">
                      <v-textarea v-model="l.message" class="" :rows="1" 
                        :label="'Измените комментарий:'"
                        :auto-grow="true"
                        :clearable="true"
                        :autofocus="true">
                      </v-textarea>
                          <v-btn color="primary"  @click="update(l)" small>Внести изменения</v-btn>
                          <v-btn color="red"  @click="edit(l,false)" small>Отмена</v-btn>
                    </div>

                    <div v-else class="memo_item">
                        <div class="date" :style="l.style">{{l.date}}</div>
                        <div class="user_name" :style="l.style">{{l.user_name}}:</div>
                        <div class="message" v-html="to_html(l.message)"></div>
                        <v-icon v-if="field.make_delete" small @click="edit(l,true)">edit</v-icon>
                        <v-icon v-if="field.make_delete" small @click="del(l,idl)">delete</v-icon> 
                    </div>
                </div>
              </v-card>

              <template v-if="!form.read_only && !field.read_only">
                  <v-btn color="primary" v-if="!view_adding_block" @click="view_adding_block=1" small>Новый комментарий</v-btn>
                  <div v-if="view_adding_block" class="adding_block pt-1">
                    <v-textarea v-model="adding_value" class="" :rows="1"
                      :label="'Введите комментарий'"
                      :auto-grow="true"
                      :clearable="true"
                      :autofocus="true">
                    </v-textarea>
                    <v-btn color="primary"  @click="add()" small>Сохранить</v-btn> <v-btn color="red"  @click="view_adding_block=false" small>Отмена</v-btn>
                  </div>
              </template>
            </template>
      </template>
      <template v-else>
        добавлять комментарии будет возможно после создания основной карты
      </template>

      
    </div>
</template>

<script>
  
  import { bus } from '../../main'
  export default {
    data:function(){
      return {
        loading:false,
        //field:{description:''},
        adding_value:'',
        view_adding_block:false,
        user_color:{},
        colors:['#009688','#673AB7','#9C27B0','#3F51B5','#607D8B','#1B5E20','#004D40'],
        data:[],
        errors:[],
        id:false
      }
    },
    props:[
      'form',
      'field',
      'form_id',
    ],
    mounted(){
        // когда вызывается из формы -- передаётся form.id,
        // а из результатов поиска -- form_id
        if(this.form_id)
          this.id=this.form_id;
        
        
        if(this.form && !this.id)
          if(this.form.id)
            this.id=this.form.id

          
        //console.log({id: this.id});
        this.init()

        
      
    },
    computed:{
/*
      exists_description(){
        return !(typeof(this.description)==undefined);
        
      }
*/
    },
    methods: {
      init(){
        if(this.id){
          
          this.$http.get(
            BackendBase+'/memo/get/'+this.form.config+'/'+this.field.name+'/'+this.id
          ).then(
            response=>{
              let D=response.data;
              this.data=D.data;
              if(!D.field.description)
                D.field.description='';
              this.errors=D.errors;
              this.colored();
              this.loading=false;
            }
          ).catch(
              e => {
                this.errors=['error get memo: '+e]
              }
          );
        }
      },
      is_in_results(){
        if(this.form_id)
          return true;
        return false
      },
      colored(){
        let user_color={};
        let color_idx=0;
        let color;
        for(let d of this.data){
          let color;
          if(d.user_id==null){
            d.user_id=-1;
            d.user_name='<не известно>'
          }
          if(!user_color[d.user_id]){
            user_color[d.user_id]=this.colors[color_idx];
            color_idx++;
          }
          color=user_color[d.user_id];
          d.style={"color":color};

          
        }
      },
      add(){
        this.$http.post(BackendBase+'/memo/add/'+this.form.config+'/'+this.field.name+'/'+this.id,{
          message: this.adding_value
        }).then(
          response=>{
            let D=response.data;
            if(D.success && D.memo_id){
              let new_el={id:D.memo_id,message:this.adding_value,user_name:D.user_name,user_id:D.user_id,date:D.now }
              if(this.field.reverse)
                this.data.unshift(new_el);
              else
                this.data.push(new_el);
              
              this.adding_value='';
              this.colored();
            }
            this.errors=D.errors
            this.hide_timeout_errors()
          }
        );
      },
      hide_timeout_errors(){
        setTimeout(()=>{this.errors=[]},1000);
      },
      update(el){
        
        this.edit(el,false);
        
        this.$http.post(
          BackendBase+'/memo/update/'+this.form.config+'/'+this.field.name+'/'+this.id+'/'+el.id,{
          message:el.message
        }).then(
          response=>{
            let D=response.data;
            if(D.success){
              el.date=D.now;
              el.user_name=D.user_name;
              el.user_id=D.user_id;
              this.colored();
            }
            
          }
        );
      },
      edit(el,v){
        var arr=[];
        el.edit_on=v;
        for(let e of this.data)
          arr.push(e)
        this.data=arr;
        
      },
      del(el,idl){
        this.$http.get(BackendBase+'/memo/delete/'+this.form.config+'/'+this.field.name+'/'+this.id+'/'+el.id).then(
          response=>{

            let D=response.data;
            if(D.success){
              this.data.splice(idl, 1);
              this.colored();
            }
            
          }
        );
        
      },

      to_html(txt){
        if(!txt)
          return '';
        txt=txt.replace(/</g,'&lt;');
        txt=txt.replace(/>/g,'&gt;');
        txt=txt.replace(/\n/g,'<br>');
        return txt;
      }
    },
    watch:{
      form_id(){
        if(this.id!=this.form_id){
          this.id=this.form_id;
          this.init()
        }
        
      }
    }
  }
</script>
<style scoped lang="scss">
  @import '@/styles/variables.scss';
  .memo {
    border: 1px solid gray; min-height: 50px;
    padding: 0;
    max-height: 300px;
    overflow-y: scroll;
    margin-bottom: 15px;
  }
  div.memo .is_in_results {max-width: 500px;}
  div.memo div { font-size: 0.8rem;}
  
  div.memo  .memo_item .date {
    display: inline-block; font-weight: bold;
    
  }
  div.memo div {padding-left: 5px;}
  div.memo .memo_item .user_name{
    display: inline-block; 
    
    
  }
  .memo_item .message{
    
    padding-bottom: 15px;
  }
  
  .memo_item {
    padding: 5px; border-bottom: 1px dotted gray; line-height: 20px;
    
  }
  div.memo div:nth-child(2n){
    background-color: $lighten5;
  }
  .edit_on{
    margin: 5px;
  }
</style>}
