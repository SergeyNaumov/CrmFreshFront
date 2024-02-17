<template>
  <div class="gpt-assist" v-if="inited">
    <v-btn x-small @click="show_panel=!show_panel" color="secondary" style="margin: 0" v-if="!show_panel">GPT</v-btn>
    <v-dialog v-model="show_panel"  transition="dialog-bottom-transition" fullscreen>

        <v-toolbar dark color="primary">
          <v-btn icon dark @click="show_panel = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>GPT - Ассистент</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-card height="100%">
          <v-row no-gutters style="height: 100%;">
            <v-col cols="2"> <!-- левый столбец -->
              <v-sheet class="pa-2 ma-2">
                <select class="plain" v-model="gpt_engine" v-if="gpt_list.length>1">
                  <option value="" disabled>выбор ассистента</option>
                  <option v-for="o in gpt_list" :value="o.v">{{o.d}}</option>
                </select>

                <select v-model="prompt" @change="select_prompt" class="plain" >
                  <option value="" disabled>Вариант генерации</option>
                  <option v-for="o in prompts_for_out" :value="o.v" >{{o.d}}</option>
                </select>

              <div v-if="prompt" class="prompt_edit">
                <p><b>{{prompt.header}}</b></p>
                Температура: {{prompt.temperature}}<br>
                <p>{{prompt.text}}</p>



                <v-btn color="primary" v-if="ask.length > 10" @click="send_task_to_gpt">получить ответ</v-btn>
              </div>


              </v-sheet>

            </v-col>

            <v-col cols="10" style="border: 1px solid gray;"> <!-- правый столбец -->
              <v-sheet class="pa-2 ma-2">
                <template v-if="response">
                  <div><a href="" @click.prevent="show_ask=!show_ask">{{show_ask?'скрыть':'показать'}} запрос</a></div>
                </template>
                <template v-if="!response || show_ask ">
                  Текст Вашего запроса:
                  <textarea class="question" :placeholder="prompt.placeholder?`например: ${prompt.placeholder}`:'введите текст запроса'" v-model="ask"></textarea>
                </template>
                <div v-if="ask_sended">
                  Получаем ответ....
                 <v-progress-circular indeterminate color="primary" ></v-progress-circular>
                </div>

                <div v-if="response"> <!-- ответ получен -->
                  <div v-if="response_status==1" class="response_success">
                    <div><b>Ответ от GPT:</b></div>
                    <textarea v-model="response" class="response" />

                    <template v-if="set_value_button && set_value">
                      <v-btn  @click.prevent="set_value(response); show_panel=false">{{set_value_button}}</v-btn>
                    </template>
                  </div>
                  <div v-if="response_status==2" class="response_error">
                    <div><b>Произошла ошибка:</b></div>
                    {{response}}
                  </div>

                </div>

              </v-sheet>
            </v-col>
          </v-row>
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
      inited: false,
      show_panel: false,
      show_ask: false,
      gpt_list:[],

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

      ask:'',
      response_status:0,
      response:'',

    }
  },
  props:['mode',
    'set_value_button',
    'set_value'
  ],
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

  },
  methods: {
    init(){
      let t=this
      t.$http.get(`${BackendBase}/gpt-assist/init`).then(
        r=>{
          let d=r.data
          if(d.success && d.need_inited && d.WS) {
            t.inited=true
            t.gpt_list=d.gpt_list
            t.gpt_engine=t.gpt_list[0].v

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
      // let t=this
      // if(!t.response){
      //   return
      // }

      // let result=''
      // if(type=='wysiwyg'){
      //   // визивиг преобразуем в абзацы

      //   for(let str of t.response.split("\n")){
      //       if(str){
      //         result+=`<p>${str}</p>`
      //       }

      //   }


      // }
      // else{
      //   result=t.response
      // }
      //bus.$emit(`field-update:${name}`,{'value':result});


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
    margin-top: 5px;
    border: 1px solid gray; padding: 10px; background: #cacdff24;
    border-radius: 5px;
    height: calc(100% - 20px);
  }
  .response_error {
    border: 1px solid gray; padding: 10px; background: #f5afaf;
    border-radius: 5px;
  }
  .gpt-assist {
    margin-top: 5px;
    font-weight: bold;
  }
  select.plain{
    border: 1px solid gray;
    width: 100%;
    appearance: auto;
    margin-bottom: 10px;
  }
  textarea.question {
    border: 1px solid gray; min-height: 200px;
    width: 100%;
    padding: 5px;
    margin-top: 5px;
  }
  textarea.response{
    border: 1px solid gray; min-height: 200px;
    padding: 5px;
    width: 100%;
    margin-top: 5px;
    min-height: 550px;
    line-height: 1.2rem;
  }
</style>
