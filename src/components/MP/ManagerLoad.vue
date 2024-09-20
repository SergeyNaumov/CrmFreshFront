<template>
  <div v-if="need_view">
    
    <div v-if="exists">
      <v-expansion-panels>
        <v-expansion-panel>
          
            <v-card-title>
              Ваш процент, указанный на сегодня: {{exists.percent}}%
            </v-card-title>
          
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <v-expansion-panels v-else> 
      <v-expansion-panel>
            <v-expansion-panel-header>
                <v-card-title :class="{need_set:need_set}">
                  Укажите процент своей загрузки
                </v-card-title>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <template v-if="exists">
                
              </template>
              <template v-else>
                  <input type="text"  v-model="percent" placeholder="от 1 до 100" keyup="fix" @input="fix" class="percent">
                  <span v-if="percent">
                    &nbsp;<v-btn small @click.prevent="save">сохранить</v-btn>
                  </span>                
              </template>

              <errors :errors="errors"/>
            </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>  
</template>
<script>
  export default {
    data(){
      return {
        need_view:true,
        need_set: true,
        percent:'',
        exists:null,
        errors:[]
      }
    },
    created(){
      this.init()
    },
    methods:{
      init(){
        let t=this
        t.$http.get(`${BackendBase}/mainpage/manager-load/init`).then(
          r=>{
            let d=r.data
            if(d.success){
              t.exists=d.exists
              t.need_view=d.need_view
            }
            t.errors=d.errors
          }
        )
      },
      fix(){
        let v=this.percent
        if(/[^0-9]+/.test(v)){
          v=v.replace(/[^\d]/g,'')
        }
        if(v){
          v=parseInt(v)  
        }
        if(v>100){
          v=100
        }
        console.log('v2:',v)
        this.percent=v+''
      },
      save(){
        let t=this, v=t.percent
        if(/^[0-9]+$/.test(v)){
          v=parseInt(v)
          if(v>=1 && v<=100){
            t.$http.get(
              `${BackendBase}/mainpage/manager-load/save/${v}`,
            ).then(
              r=>{
                let d=r.data
                if(d.success){
                  t.init()
                }
                t.errors=d.errors
              }
            )
          }
        }
      }
    }
  }
</script>
<style scoped>
  
  .need_set {color: red;}
  .percent {
    border: 1px solid gray;
    height: 30px;
    padding: 2px 5px;
    width: 100px;
  }
</style>
