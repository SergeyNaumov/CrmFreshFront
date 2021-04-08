<template>
  <v-app>
        <v-container>
            <h1 color="primary">Константы системы</h1>
            
            <template v-if="errors.length">
              <div v-for="(e,idx) in errors" class="error" :key="'e'+idx">{{e}}</div>
            </template>
            <div class="form">
              <pre v-if=0>{{list}}</pre>
              <div v-for="l in list" :key="l.name">
                <template v-if="l.type=='text'">
                  <v-text-field
                    v-model="l.value"
                    :label="l.header"
                    @keyup="change(l)"
                  />
                </template>
                <template v-if="l.type=='textarea'">
                  <v-textarea
                    v-model="l.value" 
                    :label="l.header"
                    @keyup="change(l)"
                  />
                </template>
                <template v-if="l.type=='checkbox'">
                    <v-checkbox  :label="l.header" v-model="l.value" @change="change(l)"/>
                </template>
                <template v-if="l.type=='switch'">
                    <v-switch  :label="l.header" v-model="l.value" @change="change(l)"/>
                </template>
                <div style="height: 10px; vertical-align: top;">
                  <div v-if="l.saved" class="saved">
                    сохранено
                  </div>
                </div>
              </div>
            </div>
            
            <v-card max-width="344" class="mx-auto auth"> 
              
            </v-card>
          
        </v-container>
  </v-app>
</template>

<script>

export default {
        props:["params"],
        data: () => ({
          config:'',
          list:[], // список типов констант
          errors:[]
        }),

        mounted () {
           
        },

        created(){
          if(this.params && this.params.config){
            this.config=this.params.config
          }
          this.get_list()
          
        },
        watch:{
          
        },
        methods: {
          get_list(){
            this.$http.post(BackendBase+'/const/get',{config: this.config}).then(
              r=>{
                let d=r.data;
                this.errors=d.errors
                if(d.success){
                  for(let l of d.list){
                    if(l.type=='checkbox' || l.type=='switch')
                        l.value=l.value?true:valse;

                    else if(!l.value)
                      if(l.type=='text' || l.type=='textarea')
                        l.value=''                      
                    
                    l.begin_value=l.value,
                    l.saved=false;
                    
                  }
                  this.list=d.list
                }
              }
            )
          },
          change(l){
            if(l.before_value==l.value) // если значение не поменялось -- ничего не делаем
              return

            if(!l.cnt_ajax) l.cnt_ajax=0;
            l.cnt_ajax++;
            setTimeout( // оборачиваем в setTimeout, чтобы не долбить постоянно ajax-ом
              ()=>{
                l.cnt_ajax--;
                if(l.cnt_ajax>0)
                  return
                let value=l.value;
                
                if(l.type=='checkbox' || l.type=='switch'){
                  value=value?1:0
                }

                this.$http.post(
                  BackendBase+'/const/save_value',
                  {
                    config: this.config,
                    name: l.name,
                    value: value
                  }
                ).then(
                  r=>{
                    let d=r.data;
                    if(d.success){ 
                        this.mark_success(l);
                    }
                  }
                ).catch(
                  e=>{
                    this.errors=[e]
                  }
                );
               
              },
              500
            );
          },
          mark_success(l){ // выводим сообщение "сохранено", затем гасим его
            l.saved=true; l.before_value=l.value
            setTimeout(
              ()=>{ 
                
                l.saved=false
              },
              500
            )
          }
        },

        computed: {
          
        }
}
</script>
<style scope>
  .form {max-width: 800px;}
  .saved {color: green; padding-bottom: 15px;}
</style>



