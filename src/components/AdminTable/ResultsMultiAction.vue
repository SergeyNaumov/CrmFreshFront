<template>

<div class="search_multi_action" >

      <div v-if="cnt_selected">
        выбрано: {{cnt_selected}}
      </div>
      <div class="item" v-if="!all_selected"><a href="" @click.prevent="select_all_result(true)" >выбрать всё на этой странице</a>


      </div>
      <div class="item" v-if="cnt_selected">
        <a href="" @click.prevent="select_all_result(false)" v-if="cnt_selected">сбросить выбранные</a>
      </div>
        <template v-if="ids.length">
        <div v-for="a in search_multi_action" class="item">
          <b v-if="action==a">{{a.description}}</b>
          <a v-else href="" @click.prevent="go_action(a)">{{a.description}}</a>

<!--             <template v-if="a.type=='delete'">
                <a href="" @click.prevent="go_action(a)">{{a.description}}</a>
            </template>
            <template v-if="a.type=='set_all_value_field' || a.type=='change_price'" >
                <a href="" @click.prevent="go_action(a)">{{a.description}}</a>
                <template >

                </template>
            </template>
            <template v-if="a.type=='chane_price'">

            </template> -->
        </div>
        <div v-if="action">

            <!-- Изменить значение поля (set_all_value_field)-->
            <div v-if="action.type=='set_all_value_field'" class="step2">
                <template v-if="field && action.type=='set_all_value_field'">
                    {{action.description}}:<br>
                    <template v-if="field.type=='select'">

                        <select v-model="new_value" v-if="field.values">
                            <option value="">выберите значение</option>
                            <option v-for="v in field.values" :value="v.v" v-html="v.d"></option>
                        </select>

                        <v-btn x-small @click.prevent="reset" color="primary">отмена</v-btn>
                        <v-btn x-small @click.prevent="set_all_value_field(action,3)"  v-if="new_value">перенести записи ({{cnt_selected}})</v-btn>
                    </template>

                    <errors :errors="errors" v-if="errors"/>
                </template>
            </div>
            <div v-else-if="action.type=='change_price'" class="step2">
              <h3>{{action.description}}</h3>
              <div style="margin: 20px;">


                    Действие:
                    <select v-model="change_price_settings.operation">
                        <option value="plus">прибавить</option>
                        <option value="minus">отнять</option>
                    </select>
                    <br>
                    Величина:
                    <select v-model="change_price_settings.type">
                        <option value="cnt">руб.</option>
                        <option value="percent">%</option>
                    </select>
                    <br>
                    Значение:
                    <input type="text" class="price" v-model="change_price_settings.value" @keyup="control_price_value">

                <div>
                      <errors :errors="errors" v-if="errors"/>
                      <v-btn small @click.prevent="reset" color="primary">отмена</v-btn>
                      <v-btn small @click.prevent="change_price(action,3)" :disabled="!change_price_settings.value">изменить ({{cnt_selected}})</v-btn>
                </div>


                <br>


              </div>
            </div>
            <div v-else class="step2">
              неизвестный тип MultiAction: {{action.type}}, обратитесь к разработчику
            </div>
        </div>
        <div class="success_message" v-if="success_message">
            Операция успешно выполнена
        </div>



        </template>
</div>
</template>
<script>

export default {
  components:{

  },
  props:[
    'config',
    'results_update', // для обновления результатов на странице поиска (после множественного действия)
    'search_multi_action', 'selected_ids', 'get_filter_by_name', 'on_filters',
    'select_all_result', // выбрать всё в результатах поиска
    'select_all_result','change_selected_ids' // изменились выбранные записи
  ],
  data () {
    return {
      cnt_selected: 0,
      change_price_settings:{
        // установки для изменения цены
        operation:'plus', // plus / minus
        type:'cnt', // cnt, percent
        value:0
      },
      step:1,
      all_selected:false,
      action:null,
      field:null,
      new_value:'',
      ids:[],
      success_message:false,
      errors:[],
      filter_values:{},
    }
  },
  watch:{
    change_selected_ids(){
        this.$nextTick(
            ()=>{this.calc_ids()}
        )
    }
  },
  computed:{
    // cnt_selected(){
    //   let cnt=0, sel=this.selected_ids

    //   for(let s in sel){
    //     if(sel[s])
    //       cnt++
    //   }
    //   console.log('cnt_seleted:',cnt)
    //   return cnt
    // }
  },
  mounted(){
    // получаем filter_values
    
    let t=this


    this.calc_ids()
    
  },

  methods:{
    calc_ids(){
          
          let list=[], t=this
          for(let id in t.selected_ids){
              if(t.selected_ids[id]){
                  list.push(id)
              }
          }
          t.cnt_selected=list.length
          t.all_selected=Object.keys(t.selected_ids).length == list.length
          t.ids=list
      },
      show_success_message(){
          this.success_message=true
          setTimeout(
              ()=>{this.success_message=false},2000
          )
      },
      reset(){
          let t=this
          t.step=1, t.action=null, t.field=null, t.new_value=''
          t.errors=[]
      },
      ajax_feedback(d){
          if(d.success){
              this.show_success_message()
              this.reset()
          }
          else if(d.errors.length){
              this.errors=d.errors
              setTimeout(()=>{
                  this.errors=[]
                },
                2000
              )
          }
      },
      go_action(a){
          if(a.type=='delete'){
              this.multi_action({
                  action:a,ids:this.ids,
                  feedback:(d)=>{
                      this.ajax_feedback(d)
                  }
              })
          }
          else{
            console.log('a:',a)
            this.action=a
            //this.set_all_value_field(a,2)
            if(a.type=='set_all_value_field'){
              this.set_all_value_field(a,2)

            }
            else if(a.type=='change_price'){ // рендер формы для изменения цены
              this.change_price(a,2)
            }
          }

      },
      set_all_value_field(a,step){ // устанавливаем выбранным
          let t=this
          if(step==2){
              t.action=a
              let filter=t.get_filter_by_name(a.name)
              //console.log('filter:',filter)
              t.field=t.get_filter_by_name(a.name)
          }
          if(step==3){ // изменение записей
              this.multi_action({
                  action:a,
                  value:t.new_value,
                  ids:t.ids,
                  feedback:(d)=>{
                      console.log('feedback_d:',d)
                      this.ajax_feedback(d)

                  }
              })
          }

      },
      control_price_value(){
        let v=this.change_price_settings.value, v2=v.replace(/[^\d]/g,'')


        if(v2 != v){
          this.change_price_settings.value=v2
        }

      },
      change_price(a,step){
        let t=this, s=t.change_price_settings
        if(step==3){
            this.multi_action({
                action:a,
                value:s,
                ids:t.ids,
                feedback:(d)=>{
                    console.log('feedback_d:',d)
                    this.ajax_feedback(d)

                }
            })
        }

      },
      multi_action(attr){ // множественное действие над несколькими ids
          console.log('multi_action:',attr)
          let t=this
          t.errors=[]
          console.log('attr',attr)
          let ids=[]
          for(let v of attr.ids){
            ids.push(parseInt(v) )
          }
          this.$http.post(
            `${BackendBase}/multiaction/${t.config}`,
            {
              'action':'multi_action',
              'subaction':attr.action.type,
              'ids': ids,
              'name':attr.action.name,
              'value': attr.value

            }
          ).then(
            r=>{
              let d=r.data
              //console.log('d:',d)
              if(d.success){
                t.results_update()
                attr.feedback(d)

              }
              if(d.errors){
                t.errors=d.errors
              }

            }
          ).catch(
            e=>{
              console.log(e)
              //t.errors.push(e)
            }
          )

          //if(attr.action.type=='set_all_value_field'){ // присваиваем нескольким записям одно значение

              // let fd = new FormData();
              // fd.append('config',form.config)
              // fd.append('action','set_all_value_field')
              // fd.append('name',attr.action.name)
              // fd.append('ids',attr.ids)
              // fd.append('value',attr.new_value)

              // axios({
              //     method:'post',url:'./edit_form.pl',data:fd,headers: { "Content-Type": "multipart/form-data" },
              // }).then(
              //     r=>{
              //         let d=r.data
              //         if(d.success) this.find()

              //         if(attr.feedback){
              //             attr.feedback(d)
              //         }
              //     }
              // )
          //}
          // else if(attr.action.type=='delete'){

          //     let fd = new FormData();
          //     fd.append('config',form.config)
          //     fd.append('ids',attr.ids)
          //     axios({
          //         method: 'post',url:'./delete_element.pl',data:fd,headers: { "Content-Type": "multipart/form-data"}
          //     }).then(
          //         r=>{
          //             let d=r.data
          //             if(d.success) this.find()

          //             if(attr.feedback){
          //                 attr.feedback(d)
          //             }

          //         }
          //     )
          // }

      },

  }
};
</script>
<style scope lang="scss">

.search_multi_action {
    font-size: 10pt;
}
.search_multi_action .item {
    display: inline-block;
    margin-bottom: 20px;
    padding-right: 8px;
}
.search_multi_action .item:not(:last-child)::after {
    content: ' |';
}
.step2 {
  width: auto;
}
.search_multi_action .step2, .search_multi_action .success_message, .search_multi_action .error_message{
    margin-bottom: 20px;
    padding: 20px;
    border: 1px solid gray;
}

.search_multi_action .success_message{
    color: green;
}
.search_multi_action .error_message{
    color: red;
}
.search_multi_action select {
  border: 1px solid gray;
  padding: 5px;
  -moz-appearance: auto !important;
  -webkit-appearance: auto !important;
  margin-bottom: 20px;
}
.v-btn {
  margin: 20px;
}
.price {
  border: 1px solid gray;
  width: 100px;
  padding: 5px;
}
</style>