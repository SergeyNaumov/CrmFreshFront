<template>
  <div class="gpt-assist" v-if="inited">
    <v-btn @click="show_panel=!show_panel" color="primary" style="margin: 0" v-if="!show_panel">GPT</v-btn>
    <v-dialog v-model="show_panel" height="500" max-width="1000">

        <v-toolbar dark color="primary">
          <v-btn icon dark @click="show_panel = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>GPT - Ассистент</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>

          <v-card>

            <v-card-text  style="padding: 20px;">
              <p>Данный ассистент помогает Вам заполнить поля карточки</p>
              <pre v-if="0">
                {{mode}}
                {{config}}

              </pre>
              <div>
                <!-- Это поле выводится если движков > 1-->
                <v-select
                  label="Выберите источник:" :items="gpt_list" item-value="v" item-text="d"
                  v-model="gpt_engine" :rounded="$theme.rounded"
                  hide-details v-if="gpt_list>1"
                />

                <v-select
                  label="Выберите вариант генерации:" :items="prompts_for_out" item-value="v" item-text="d"
                  v-model="prompt" :rounded="$theme.rounded"
                  hide-details @change="select_prompt"
                />
                <div v-if="prompt" class="prompt_edit">
                  <p><b>{{prompt.header}}</b></p>
                  Температура: {{prompt.temperature}}<br>
                  <p>{{prompt.text}}</p>

                  <v-textarea label="Введите текст Вашего запроса:" placeholder="" v-model="ask" />
                  <div v-if="prompt.placeholder">
                      <p><b>Например так:</b></p>
                      <div v-html="prompt.placeholder" />
                  </div>

                  <v-btn color="primary" v-if="ask.length > 10" @click="send_task_to_gpt">получить ответ</v-btn>
                </div>
              </div>


              <div v-if="ask_sended">
                Получаем ответ....
               <v-progress-circular
                  indeterminate
                  color="primary"
                ></v-progress-circular>
              </div>
              <div v-if="response">
                <div v-if="response_status==1" class="response_success">
                  <div><b>Ответ от GPT:</b></div>
                  <v-textarea  v-model="response" />
                  <v-select
                    label="В какое поле отправить?" :items="fields_for_out" item-value="v" item-text="d"
                    v-model="selected_field" :rounded="$theme.rounded"
                    hide-details
                  />
                  <v-btn v-if="selected_field" @click.prevent="fill_field(selected_field)">Отправить  в карту</v-btn>
                </div>
                <div v-if="response_status==2" class="response_error">
                  <div><b>Произошла ошибка:</b></div>
                  {{response}}
                </div>

              </div>
            </v-card-text>
          </v-card>
    </v-dialog>

  </div>

</template>

<script>

import { bus } from '/src/main' // для передачи по шине значения поля в форму

import { init_websocket } from './functions.js'
export default {
  components:{

  },
  name:'GPTAssist',
  data:function(){
    return {
      WS:'',
      inited: true,
      show_panel: true,
      gpt_list:[],
      fields:[],
      selected_field:null,
      gpt_engine:0,
      ask_sended: false,
      prompt:null, // текущий вариант генерации (prompt)

      prompts_list:[
        {
          temperature:0.5,
          header: 'Маркетинг - Генерация заголовка',
          text:'Ты — опытный копирайтер. Сгенерируй 5 опций заголовка для маркетингового текста, чтобы привлечь внимание читателей.',
          placeholder: 'введите текст, для которого нужно придумать заголовок',
        },
        {
          temperature:0.4,
          header: 'Маркетинг - Генерация описания товара',
          text:'Ты — маркетолог. Напиши описание товара для маркетплейса. Используй заданные название товара, категорию и ключевые слова.',
          placeholder: '"Станция 2.0 с Алисой". Категория: умные колонки. Ключевые слова: умная колонка, алиса, умный дом.',
        },
        {
          temperature:0.5,
          header: 'Маркетинг - Стилизация текста',
          text:'Ты — опытный копирайтер. Перепиши маркетинговый текст с учётом вида текста и выбранной тональности.',
          placeholder: 'Например: Вид текста: сообщение в телеграмме. Тональность: дружеская, позитивная. Текст: ....',
        },
      ],
      // Возможно, позже вынесу в настройки
      temperature: 0,
      maxTokens: 2000,

      ask:'"Станция 2.0 с Алисой". Категория: умные колонки. Ключевые слова: умная колонка, алиса, умный дом.',
      response_status:0,
      response:'Ответ от чат-бота',

    }
  },
  props:['config','mode'],
  // mode:
  //  form -- вызвано из формы
  //  system -- на главной странице системы
  created(){
    this.init()
  },
  watch:{
    show_panel(){
      let t=this
      //t.response_status=0
      //t.response_0=0

    }
  },
  computed:{
    prompts_for_out(){
      let t=this, result=[]
      for(let item of t.prompts_list){
        result.push({v:item, d:item.header})
      }
      if(!t.prompt && result.length){
        t.prompt=result[0].v
      }
      return result

    },
    fields_for_out(){
      // для выбора, в какое поле отправ
      let t=this, result=[]
      for(let f of t.fields){
        result.push({v:f.name,d:f.description})
      }
      return result

    }
  },
  methods: {
    init(){
      let t=this
      t.$http.get(`${BackendBase}/gpt-assist/init/${t.config}`).then(
        r=>{
          let d=r.data
          if(d.success && d.need_inited && d.WS) {
            t.inited=true
            t.gpt_list=d.gpt_list
            t.gpt_engine=t.gpt_list[0].v
            t.fields=d.fields
            t.WS=d.WS
          }
        }
      )

    },
    select_prompt(){
      let t=this


    },
    send_task_to_gpt(){
      let t=this
      t.ask_sended=true, t.response_status=0, t.response=''
      if(!t.prompt){
        console.log('отсутствует prompt')
        return
      }

      let prompt=t.prompt
      if(!prompt){
        console.log('отсутствует prompt: t.prompt:',t.prompt)
        return
      }

      t.$http.post(
        `${BackendBase}/gpt-assist/send-task`,
        {
          engine: t.gpt_engine,
          temperature: prompt.temperature,
          sys_text: prompt.text,
          ask: t.ask
        }
      ).then(
        r=>{
          let d=r.data
          if(d.success){
            // задача была отправлена на исполнение
            init_websocket(t, d.task_id)
          }

        }
      )

    },
    fill_field(name){
      let t=this
      if(!t.response){
        return
      }
      let type='text'
      for(let f of t.fields){

        if(name==f.name && f.type){
          type=f.type
        }
      }
      let result=''
      if(type=='wysiwyg'){
        // визивиг преобразуем в абзацы

        for(let str of t.response.split("\n")){
            if(str){
              result+=`<p>${str}</p>`
            }

        }


      }
      else{
        result=t.response
      }
      bus.$emit(`field-update:${name}`,{'value':result});


      setTimeout(
        ()=>{t.show_panel=false},
        300
      )
    }

  }
}
</script>
<style scoped>
  .response_success {
    border: 1px solid gray; padding: 10px; background: #cacdff;
    border-radius: 5px;
  }
  .response_error {
    border: 1px solid gray; padding: 10px; background: #f5afaf;
    border-radius: 5px;
  }
  .gpt-assist {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10;
    font-weight: bold;
  }
</style>
