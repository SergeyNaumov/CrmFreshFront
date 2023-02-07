<template>
    <div  class="is_headapp" >
      <h1>{{form.title}}</h1>
      <errors :errors="errors_init"/>

      <pre v-if="form.log && form.log.length">
        {{form.log}}
      </pre>

      <v-sheet style="margin-bottom: 20px;">
            <div v-if="!show_select_date">
              <v-btn @click="show_select_date=true" small>{{value}}</v-btn> 
              &nbsp;
              <v-btn color="primary" small @click="show_event_form=!show_event_form">{{show_event_form?'Не добавлять в расписание':'Добавить в расписание'}}</v-btn>
            </div>
            <div v-if="show_select_date">
              <v-date-picker 
                
                first-day-of-week="1" 
                locale="ru-Ru"
                v-model="value"
              />
              <br>
              <v-btn color="primary" @click="show_select_date=false" small>оставить {{value}}</v-btn>
            </div>
      </v-sheet>
          <div v-if="show_event_form && !show_select_date" class="event_form"> 
            <h2>{{form.title}}</h2>
            <form @submit.prevent="insert_event">
              <v-select 
                hide-details
                :items="form_event_intervals"
                v-model="form_event.interval"
                label="Укажите интервал"
              />
              
              <v-select 
                :label="form.select_label"
                :items="form.select_list"
                v-model="form_event.select_id"
              />
              <div v-for="f in form.fields">
                <template v-if="f.type=='checkbox'">
                  <v-checkbox v-model="f.value" :label="f.description" />
                </template>
              </div>
              <errors :errors="errors_add_time"/>
              
              <v-btn color="red" small @click="show_event_form=!show_event_form">Не добавлять</v-btn>

              <v-btn v-if="form_event.interval" @click.prevent="insert_event">Добавить</v-btn>
            </form>
            
          </div>
      

              <v-menu
                v-model="selectedOpen"
                :close-on-content-click="false"
                :activator="selectedElement"
                offset-x
                max-width="400"
              >
                <v-card>

                  <v-card-text>
                    {{selectedEvent.name}}: {{getTime(selectedEvent.start)}} -  {{getTime(selectedEvent.end)}}
                    <hr>
                    <br>
                    <v-icon small color="primary">fa fa-trash</v-icon>&nbsp;<a href="#" @click.prevent="deleteEvent(selectedEvent)">удалить запись</a> 
                    <!--<v-btn @click="deleteEvent(selectedEvent)" color="primary" x-small></v-btn> удалить запись-->
                    <div v-for="e in errors_delete" class="err">{{e}}</div>
                  </v-card-text>
                </v-card>

              </v-menu>
              







          
          <v-sheet height="600">
            <div class="types">
              <v-btn small :color="(type=='day')?'primary':''" @click="type='day'">дни</v-btn>
              <v-btn small :color="(type=='week')?'primary':''" @click="type='week'">недели</v-btn>
            </div>

            <v-calendar
              v-if="value"
              :ref="refname"
              v-model="value"
              :weekdays="[1, 2, 3, 4, 5, 6,0]"
              :type="type"
              :events="events"
              :event-overlap-mode="mode"
              :event-overlap-threshold="30"
              :event-color="getEventColor"
              :interval-minutes="form.interval_minutes_calendar"
              :interval-count="form.interval_count_calendar"
              :first-time="form.begin"
              @click:event="showEvent"
              locale="ru-Ru"
              style="min-height: 800px;"
            />

            
          </v-sheet>
      

    </div>
</template>
<script>
// import item_content from './item_content';
// import item_menu from './item_menu';
// import links_block from './links'
export default {
    // components:{
    //     'item-menu':item_menu,
    //     'item-content':item_content,
    //     'links_block':links_block
    // },
    props:['params','is_headapp'],
    data: () => ({
      form:{},
      type: 'day',
      show_select_date:false,
      show_event_form: false,
      refname:'time_table'+parseInt(Math.random()*10**7),
      types: [
        {text:'Месяц',value:'month'},
        {text:'Неделя',value:'week'},
        {text:'День',value:'day'}
      ],
      mode: 'stack',
      modes: ['stack', 'column'],
      
      weekdays: [
        { text: 'Sun - Sat', value: [0, 1, 2, 3, 4, 5, 6] },
        { text: 'Mon - Sun', value: [1, 2, 3, 4, 5, 6, 0] },
        { text: 'Mon - Fri', value: [1, 2, 3, 4, 5] },
        { text: 'Mon, Wed, Fri', value: [1, 3, 5] },
      ],
      value: '',
      form_event:{
        interval:'',
        select_id:''
      },
      events: [],
      selectedOpen:false,
      selectedEvent: {},
      selectedElement: null,
      //colors: ['blue', 'indigo', 'deep-purple', 'cyan', 'green', 'orange', 'grey darken-1'],
      //names: ['Meeting', 'Holiday', 'PTO', 'Travel', 'Event', 'Birthday', 'Conference', 'Party'],
      /*active_color: "#4a30d7", 
      busy_color: "#6f6d78",*/
      errors_delete:[],
      errors_add_time:[],
      errors_init:[]
    }),
    mounted(){
      this.value=new Date()
      this.init()

      
    },
    watch:{
      value(){
        this.show_select_date=false
        this.load_events()
      },
      show_event_form(){
        this.form_event.interval=''
        if(this.form.fields){
            for(let f of this.form.fields) f.value=''
        }

      }
    },

    methods: {
      init(){ // Инициализация, загрузка конфига (form) с сервера
        this.$http.get(
          `${BackendBase}/Schedule/${this.params.config}/init`
        ).then(
          r=>{
              let d=r.data
              if(d.success){
                  if(d.form.fields){
                    for(let f of d.form.fields){
                      if(!f.value){
                        f.value=''
                      }
                    }
                  }
                  this.form=d.form
                  this.value=d.form.value

              }
              
              this.errors_init=d.errors
          }
        )

      },
      getTime(dt){
        if(dt){
          return dt.replace(/^\d{4}-\d{2}-\d{2}\s*/,'')
        }
        return dt
        
      },
      load_events(){ // 
        if(typeof(this.value)!='string')
          return
        this.$http.post(
          `${BackendBase}/Schedule/${this.params.config}/getList`,
          {
            id:this.form.id,
            date:this.value,
          }
        ).then(
          r=>{
            let d=r.data
            if(d.success){
              this.events=d.events
            }
          }
        )
      },
      add_event(){
        this.show_event_form=true
      },
      insert_event(){
        
        this.$http.post(
          `${BackendBase}/Schedule/${this.params.config}/addEvent`,
          {
            id: this.form_event.select_id,
            multi: this.multi,
            times:[this.form_event.interval[0],this.form_event.interval[1]],
            fields_values:this.fields_values

          }
        ).then(
          r=>{
            let d=r.data
            if(d.success){
            
                this.form_event.select_id=''
                this.show_event_form=false
                this.load_events()
                /*this.events.push(  {
                  "name": "Я",
                  "start": this.form_event.interval[0],
                  "end":   this.form_event.interval[1],
                  "color": this.active_color,
                  "timed": true
                })
                this.show_event_form=false*/
            }
            this.errors_add_time=d.errors
            
          }
        )

        /*this.events.push(  {
          "name": "Кузнецов Викторfti, индивидуальное занятие",
          "start": '2021-10-21 12:00:00',//new Date('2021-10-21 12:00'),
          "end":   "2021-10-21 12:59:59",//new Date("2021-10-21 12:59"),
          "color": this.active_color,
          "timed": true
        })*/
      },

      getEventColor (event) {
        return event.color
      },

      deleteEvent(event){
        this.$http.post(
          `${BackendBase}/Schedule/${this.params.config}/deleteEvent`,
          {
            id: event.id
          }
        ).then(
          r=>{
            let d=r.data
            if(d.success){
              this.selectedOpen=false
              
              this.$nextTick(()=>{this.load_events()})

            }
            this.errors_delete=d.errors
          }
          
        )
        
      },
      showEvent ({ nativeEvent, event }) {
        const open = () => {
          this.selectedEvent = event
          this.selectedElement = nativeEvent.target
          requestAnimationFrame(() => requestAnimationFrame(() => this.selectedOpen = true))
        }

        if (this.selectedOpen) {
          this.selectedOpen = false
          requestAnimationFrame(() => requestAnimationFrame(() => open()))
        } else {
          open()
        }

        nativeEvent.stopPropagation()
      },
    },
    computed:{
      multi(){ // если true -- разрешено добавлять нескольких
        if(this.form.multi){
          
          for(let f of this.form.fields){
            if('multi' in f && !f['multi']){
              if(f.type=='checkbox' && f.value){
                return false
              }
            }
          }
          return true
        }
        
        return false

      },
      fields_values(){
        let rez={}
        for(let f of this.form.fields){
          if(f.value){
            rez[f.name]=f.value
          }
        }
        return rez
      },
      form_event_intervals(){
        let d=new Date()
        let begin_day=new Date(d.getFullYear(), d.getMonth()+1, d.getDate())
        let delta_min=this.form.begin; // Сколько минут прошло с начала дня
        let in_number=1 // порядковый номер интервала
        let return_value=[]
        
        // Для проверки, занято ли событие
        const exists_time=t=>{
          for(let e of this.events){
            //console.log(`e.: m: ${e.multi} ; ${e.start} =>  ${t}`)

            if(e.start==t && !(e.multi && this.multi))
              return true
          }
        }
        
        for(let i of this.form.interval_list){
          let begin_interval=`${this.value} ${i[0]}`
          if(!exists_time(begin_interval)){
            let end_interval=`${this.value} ${i[1]}`
            let text=`${i[0].replace(/:\d{2}$/,'')} - ${i[1].replace(/:\d{2}$/,'')}`
            return_value.push({text:text, value: [begin_interval,end_interval]})
          }


        }
        // while(delta_min<1440){ // делим сутки на интервалы

        //   let h=parseInt(delta_min/60), m=delta_min % 60
        //   let h2=parseInt( (delta_min+this.form.interval_minutes)/60), m2=(delta_min+this.form.interval_minutes-1) % 60
        //   console.log('delta_min:',delta_min,`${h}:${m}`,`${h2}:${m2}`)
        //   if(m<10) m='0'+m
        //   if(h<10) h='0'+h
        //   if(m2<10) m2='0'+m2
        //   if(h2<10) h2='0'+h2
        //   let begin_interval=`${this.value} ${h}:${m}:00`
        //   let end_interval=`${this.value} ${h}:59:59`
        //   //console.log(`${begin_interval} ex: ${exists_time(begin_interval)}`)
        //   if(!exists_time(begin_interval))
        //     return_value.push({text:`${h}:${m} - ${h2}:${m2}`, value: [begin_interval,end_interval]})

        //   if(in_number> this.form.interval_count){
        //     break
        //   }
        //   delta_min+=this.form.interval_minutes
        //   in_number++
        //   //console.log(`interval: ${h}:${m}`)
        // }

        // Если выбранный интервал отсутствует в списке -- сбрасываем его
        let event_interval_in_intervals=false
        if(this.form_event.interval){
          for(let i of return_value ){
         
            if(this.form_event.interval[0]==i.value[0]){
              event_interval_in_intervals=true
            }
          }
         
        } 
        
        if(!event_interval_in_intervals){
          this.form_event.interval=''
        }
        return return_value
      }
    }

}
</script>
<style scoped>

  .is_headapp {margin: 20px; max-width: 1400px;}
  .is_headapp h1 {margin-bottom: 20px;} 
  .v-dialog {
      max-width: 500px;
  }
  .v-dialog .v-card{
      padding: 20px;
      max-width: 500px;
  }
  .title {
    margin-bottom:  20px;
    margin-top:  20px;
    font-size:  36px !important;
  }
  .event_form {max-width: 500px; border: 1px solid gray; padding: 20px; margin: 20px; border-radius: 5px;}
  .types {margin: 20px;}
  .types button {margin-right: 10px;}
</style>