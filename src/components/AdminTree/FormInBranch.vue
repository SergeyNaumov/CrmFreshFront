<template>
    

         <v-dialog v-model="dialog" max-width="500">
            
            <v-card>
                <v-card-text>
        <form @submit.prevent="save()">
            <template v-for="f in fields">
                <div :key="f.name" v-if="/^(text|textarea)$/.test(f.type)">
                    <div class="description">{{ f.description }}:</div>
                    
                    <template v-if="f.type=='text'">
                        <input type="text" v-model="f.value" :id="'form_in_branch'+f.name"/>
                    
                    </template>
                    <template v-else-if="f.type=='textarea'">
                    
                        <textarea  v-model="f.value"></textarea>
                    
                    </template>
                </div>
            </template>
            <!--<pre>
                {{ fields }}
            </pre>-->
                    <div class="save_message" v-if="saved">изменения успешно сохранены</div>
        </form>
                </v-card-text>
                
                <v-card-actions>
                    <div class="flex-grow-1"></div>
                    
                    <v-btn color="primary darken-1" text @click="save">Сохранить</v-btn>
                    <v-btn color="red darken-1" text @click="close_edit_form">Закрыть форму</v-btn>
                </v-card-actions>
            </v-card>
            
        </v-dialog>
    
</template>
<script>
export default {
    props: {
        form:{type:Object,required:true},
        item:{type:Object},
        close_edit_form:{type:Function, required:true},
        upload_header:{type:Function, required:true}
        //parent:{required:true}, // вышестоящий элемент
    
  },
  data(){
      return {
          edit_on:false, // включен режим редактирования
          data_loaded: false, // загружены данные формы
          fields:[],
          values:{},
          errors:[],
          saved: false,
          dialog: true
/*
        item.id -- id текущей записи
*/
      }
  },
  watch:{
    dialog(v){
        if(!v) this.close_edit_form()

        
    }
  },
  created(){
    this.init()
  },
  methods:{
    init(){
        let t=this
        t.$http.post(
                `${BackendBase}/edit-form/${t.form.config}/${t.item.id}`,
                {cgi_params: {}}
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        t.fields=d.fields, t.data_loaded=true
                        setTimeout(
                            ()=>{
                                document.getElementById('form_in_branch'+this.form.header_field).focus()
                            },
                            100

                        )
                    }
                }
            )
    },
    get_values(){
        for(let f of this.fields){
            if(/^(text|textarea)$/.test(f.type)){
                this.values[f.name]=f.value
            }
        }
    },
    save(){
        let t=this
        t.get_values()
        
        t.$http.post(
            `${BackendBase}/edit-form/${t.form.config}/${t.item.id}`,
            {
                action:'update',id:t.item.id,
                values:t.values
            }
        ).then(
            r=>{
                let d=r.data
                if(d.success){
                    t.upload_header(t.item.id,t.values[t.form.header_field])
                    this.close_edit_form();
                }
            }
        )
    }
  },
  name:'formInBranch'
}
</script>
<style scoped>
    .form_in_branch{

        background-color: #fff;
        padding: 20px;
        
    }
    .description {
        display: inline-block;
        width: 100%; font-weight: bold;
        padding-top: 10px;
    }
    input[type=text], textarea {
        padding: 2px;
        border: 1px solid black !important;
        border-radius: 5px;
        width: 100%;
    }
    .save_message {
        margin-top: 10px;
        color: green;
        font-weight: bold;
        text-align: center;
        width: 100%;
    }
</style>
