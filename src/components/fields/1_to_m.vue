<template>
      <div>

        <one_to_m_form 
          :form="form"
          :field="field"
          :refresh="refresh"
          :dialog="dialog"
          :set_dialog="set_dialog"
          :values="values"
          :upload_values="upload_values"
        />

        <!-- multiload -->     
        <template v-if="dialog_multiload"> <!-- v-if для очистки формы-->
          <v-dialog  v-model="dialog_multiload" max-width="500">
            <v-card class="one_to_m" >
                <v-card-title  class="headline">
                  Загрузка нескольких файлов
                </v-card-title>
                <v-card-text class="multiload">
                    <form enctype="multipart-form/data">                
                      <input type="file" multiple="multiple" :name="this.multiload_name">
                    </form>
                    <v-btn color="primary" @click="start_multiload()" small>Загрузить</v-btn>
                </v-card-text>
            </v-card>
          </v-dialog> 
        </template>

        
        <template v-if="!form.id">
          <p>Данный блок можно редактировать только после создания основной карты</p>
        </template>
        
        <template v-else-if="make_create">
          
          <template v-if="field.link_add">
            <a :href="link_converter(field.link_add)" target="blank">добавить</a>
          </template>

          <template v-else>
            <a href="" v-if="!dialog" class="create" @click.prevent="open_new_dialog()">добавить</a>
          </template>
          
          <template v-if="multiload_name">
            | 
            <a href=""  @click.prevent="start_dialog_multiload"> загрузить несколько файлов</a>
          </template>
          <a href="" v-if="dialog" @click.prevent="dialog=false"> скрыть</a>
        </template>
        <slide v-if="1"
          :values="values"
          :field="field"
          :form="form"
          :upload_values="upload_values"
          />
      </div>
</template>

<script>
  import Slide from './1_to_m/slide';
  import one_to_m_form from './1_to_m/form';
  


  export default {
    components:{
       'slide':Slide,
       'one_to_m_form': one_to_m_form
    },
  // опции
  data:function(){
    
    return {
      child_id: null,
      id:undefined,
      dialog:false,
      values:[],
      save_action:'',
      refresh:0,
      // загрузка нескольких файлов
      dialog_multiload: false
    }
  },
  props:['form','field'],
  created(){
    let t=this
    this.$bus.on( // обновление значений в 1_to_m
      '1_to_m:upload_values:'+this.field.name,
      values=>{
        //console.log('opload_values:',values);
        this.upload_values(values)
      }
    );



    if(!t.field.values)
        t.field.values=[];
    //this.create_edit_fields();
    t.values=t.field.values;
    
    
  },
  beforeDestroy(){
  },
  watch:{
    field(){
      console.log('field_change')
    }
  },
  computed:{
    multiload_name(){ 
      // если элемент 1_to_m содежит 1 файл -- multiload_name равен имени этого файла
      let cnt_files=0; let name_multiload='';
      for(let cf of this.field.fields){
        if(cf.type=='file'){
          cnt_files++; name_multiload=cf.name
        }
        
      }
      return (cnt_files==1)?name_multiload:false

    },
    make_create(){
      return (!this.form.read_only & !this.field.read_only && !this.field.not_create)
    },
    fields(){
      let hash={};
      for(let f of this.field.fields){
        hash[f.name]=f
      }
      return hash;
    }

  },
  methods: {
    link_converter(link,id){
      return link.replace('<%form.id%>',this.form.id).replace('<%id%>',id)
    },
    set_dialog(d){
      this.dialog=d
    },
    // reload_1_to_m(){  // Обновляем все значения в 1_to_m
    //   let t=this, f=t.field;
    //   this.$http.get(
    //           BackendBase+`/1_to_m/${t.form.config}/${t.field.name}/${t.form.id}`
    //   ).then(
    //     r=>{
    //       let d=r.data
    //       if(d.success){
    //         t.values=d.field.values
    //         //t.field.fields=d.field.fields
    //         console.log('fields:',d.field)
    //         bus.$emit('change_field', d.field);
    //       }
    //     }
    //   )
      
      
    // },
    upload_values(new_values){
      this.values=new_values;
      let f=this.field;
      f.values=new_values;
      this.refresh++
    },
    open_new_dialog(){
      this.$bus.emit('1_to_m_open_new_dialog:'+this.field.name);
    },
    // множественная загрузка файлов
    start_dialog_multiload(){ // диалог для множественной загрузки файлов
      this.dialog_multiload=true;
    },
    start_multiload(){
      let file=document.querySelector('.multiload input[type=file]');
    
      if(file.files.length){
        for(let f of file.files){      
            let formData = new FormData();
            //formData.append(this.multiload_name, f);
            formData.append('attach', f);
            this.$http.post(
              BackendBase+'/1_to_m/upload_file/' + this.form.config+'/'+this.field.name + '/' + this.multiload_name + '/'+ this.form.id,
              formData, {headers: {'Content-Type': 'multipart/form-data'}}
            ).then(
              response=>{
                let D=response.data;
                if(D.success){ 
                  if(D.values.length)
                    for(let v of D.values){
                      this.values.push(v)
                    }
                  this.dialog_multiload=false;
                }
                
              }
            ).catch(
              e=>{
                alert(e)
              }
            )
        }
      }
    },
    
  },
  
  name:'one_to_m'
}
</script>
<style lang="scss" >
  @import '@/styles/variables.scss';
  table.one_to_m{
    margin-top: 10px;
    border-collapse: collapse;
    margin-bottom: 10px;;
    width: 100%;
  }
  table.one_to_m th{
    color: $light;
    background-color: $primary;
    
  }

table.one_to_m tr:nth-child(2n+1) {
  background: $lighten5;
} 
  table.one_to_m td, table.one_to_m th{
    border: 1px solid $lighten2;
    padding: 5px;
    font-size: 10pt;
    text-align: left;
  }
/*
  table.one_to_m th:first-child {
    border-top-left-radius: 10px;
    border: none;
  }
  table.one_to_m th:last-child {
    border-top-right-radius: 10px;
    border: none;
  }
  table.one_to_m tr:last-child td:first-child {
    border-bottom-left-radius: 10px;
    
  }
  table.one_to_m tr:last-child td:last-child {
    border-bottom-right-radius: 10px;
  }
*/
  table.one_to_m td.tool{
    padding:0;
    text-align: center;
    width: 60px;
  }
  div.one_to_m{
    
    border: 1px solid $lighten2;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  div.one_to_m .h{color: $primary; font-size: 11pt; vertical-align: top;}
  div.one_to_m .controls{position: absolute; right: 1rem; bottom: 0rem; padding-top: 2rem;}
  /*.one_to_m.theme--light.v-card {background-color: #7dd5f857 !important;}*/
  a.create {font-size: 12px;}  
</style>}
