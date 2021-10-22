<template>
  <div v-if="form.id"> <!-- показываем только для существующих записей -->
    <pre>
      {{events}}
    </pre>
        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
          max-width="500"
        >
          <v-card>

            <v-card-text>
              {{selectedEvent.name}}: {{getTime(selectedEvent.start)}} -  {{getTime(selectedEvent.end)}}
              <v-btn @click="deleteEvent(selectedEvent)">удалить</v-btn>
            </v-card-text>
          </v-card>
          <!--<v-card
            color="grey lighten-4"
            min-width="350px"
            flat
          >
            <v-toolbar
              :color="selectedEvent.color"
              dark
            >
              <v-btn icon>
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn icon>
                <v-icon>mdi-heart</v-icon>
              </v-btn>
              <v-btn icon>
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </v-toolbar>
            <v-card-text>
              <span v-html="selectedEvent.details"></span>
            </v-card-text>
            <v-card-actions>
              <v-btn
                text
                color="secondary"
                @click="selectedOpen = false"
              >
                Cancel
              </v-btn>
            </v-card-actions>
          </v-card>-->
        </v-menu>
    <p>
      <span>{{value}}</span> <v-btn color="primary" small @click="show_event_form=!show_event_form">{{show_event_form?'Не добавлять в расписание':'Добавить в расписание'}}</v-btn>
    </p>

    <div v-if="show_event_form" class="event_form"> 
      <h2>{{field.form_event_name}}</h2>
      <form @submit.prevent="insert_event">
        <v-select 
          hide-details
          :items="form_event_intervals"
          v-model="form_event.interval"
          label="Укажите интервал"
        />
        <v-btn v-if="form_event.interval" @click.prevent="insert_event">Добавить</v-btn>
      </form>
      
    </div>

      <div v-if="!show_select_date">
        {{value}} <a href="" @click.prevent="show_select_date=true">Выбрать</a>
      </div>
      <v-date-picker 
        v-if="show_select_date"
        first-day-of-week="1" 
        locale="ru-Ru"
        v-model="value"
      />


    
    <v-sheet height="600">
      <v-calendar
        v-if="field"
        :ref="refname"
        v-model="value"
        :weekdays="weekday"
        :type="type"
        :events="events"
        :event-overlap-mode="mode"
        :event-overlap-threshold="30"
        :event-color="getEventColor"
        :interval-minutes="field.interval_minutes"
        :interval-count="field.interval_count"
        :first-interval="field.first_interval"
        @click:event="showEvent"
        locale="ru-Ru"
      />
    </v-sheet>
  </div>
</template>

<script>
  const monlist=['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря']
  export default {
    props:['form','field'],
    data: () => ({
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
      weekday: [1, 2, 3, 4, 5, 6,7],
      weekdays: [
        { text: 'Sun - Sat', value: [0, 1, 2, 3, 4, 5, 6] },
        { text: 'Mon - Sun', value: [1, 2, 3, 4, 5, 6, 0] },
        { text: 'Mon - Fri', value: [1, 2, 3, 4, 5] },
        { text: 'Mon, Wed, Fri', value: [1, 3, 5] },
      ],
      value: '',
      form_event:{
        interval:''
      },
      events: [
      ],
      selectedOpen:false,
      selectedEvent: {},
      selectedElement: null,
      //colors: ['blue', 'indigo', 'deep-purple', 'cyan', 'green', 'orange', 'grey darken-1'],
      //names: ['Meeting', 'Holiday', 'PTO', 'Travel', 'Event', 'Birthday', 'Conference', 'Party'],
      active_color: "#4a30d7", 
      busy_color: "#6f6d78",
    }),
    mounted(){
      this.value=new Date()

      this.$nextTick(
        ()=>{
          this.value=this.$refs[this.refname].start
          console.log('VALUE:',this.value)

          //this.load_events()
          /*
          this.events.push(  {
          "name": "Я",
          "start": "2021-10-21 17:00:00",
          "end":   "2021-10-21 18:59:59",
          "color": this.active_color,
          "timed": true
        })*/
        }
        
      )
      
    },
    watch:{
      value(){
        this.show_select_date=false
        this.load_events()
      },
      show_event_form(){
        this.form_event.interval=''
      }
    },

    methods: {
      getTime(dt){
        if(dt){
          return dt.replace(/^\d{4}-\d{2}-\d{2}\s*/,'')
        }
        return dt
        
      },
      load_events(){ // 
        this.$http.post(
          `${BackendBase}/time_table/${this.form.config}/getList`,
          {
            id:this.form.id,
            date:this.value,
            field_name: this.field.name
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
      add_enent(){
        this.show_event_form=true
      },
      insert_event(){
        console.log('insert_event')
        this.$http.post(
          `${BackendBase}/time_table/${this.form.config}/addEvent`,
          {
            id: this.form.id,
            times:[this.form_event.interval[0],this.form_event.interval[1]],
            field_name: this.field.name

          }
        ).then(
          r=>{
            let d=r.data
            if(d.success){
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
          }
        )

        /*this.events.push(  {
          "name": "Кузнецов Виктор, индивидуальное занятие",
          "start": '2021-10-21 12:00:00',//new Date('2021-10-21 12:00'),
          "end":   "2021-10-21 12:59:59",//new Date("2021-10-21 12:59"),
          "color": this.active_color,
          "timed": true
        })*/
      },
      getEvents ({ start, end }) {
        const events = []
        //console.log('start:',start,' end:',end)
        const min = new Date(`${start.date}T00:00:00`)
        const max = new Date(`${end.date}T23:59:59`)
        const days = (max.getTime() - min.getTime()) / 86400000
        const eventCount = this.rnd(days, days + 20)

        for (let i = 0; i < eventCount; i++) {
          const allDay = this.rnd(0, 3) === 0
          const firstTimestamp = this.rnd(min.getTime(), max.getTime())
          const first = new Date(firstTimestamp - (firstTimestamp % 900000))
          const secondTimestamp = this.rnd(2, allDay ? 288 : 8) * 900000
          const second = new Date(first.getTime() + secondTimestamp)

          events.push({
            name: this.names[this.rnd(0, this.names.length - 1)],
            start: first,
            end: second,
            color: this.colors[this.rnd(0, this.colors.length - 1)],
            timed: !allDay,
          })
        }

        this.events = events
      },
      getEventColor (event) {
        return event.color
      },
      rnd (a, b) {
        return Math.floor((b - a + 1) * Math.random()) + a
      },
      deleteEvent(event){
        console.log(event)
      },
      setToday(){
         this.value = ''
      },
      time_busy(){

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
      cur_value(){
        let refname=this.refname
        if(!this.$refs[refname]){
          //console.log('none')
          return ''
        }
        
        if(this.type=='day'){
          let v=this.value?this.value:this.$refs[refname].start
          let [year,mon,day]=v.split('-')
         // console.log('start:',this.$refs[refname].start)
          mon=parseInt(mon)-1
          
          return `${day} ${monlist[mon]} ${year}`
        }
        else {
          
          return this.$refs[refname].title
        }
      },
      form_event_intervals(){
        let d=new Date()
        let begin_day=new Date(d.getFullYear(), d.getMonth()+1, d.getDate())
        let delta_min=0; // Сколько минут прошло с начала дня
        let in_number=1 // порядковый номер интервала
        let return_value=[]
        
        // Для проверки, занято ли событие
        const exists_time=t=>{
          for(let e of this.events){
            if(e.start==t)
              return true
          }
        }

        while(delta_min<1440){ // делим сутки на интервалы
          let h=parseInt(delta_min/60), m=delta_min % 60
          let h2=parseInt( (delta_min+this.field.interval_minutes)/60), m2=(delta_min+this.field.interval_minutes-1) % 60

          if(m<10) m='0'+m
          if(h<10) h='0'+h
          if(m2<10) m2='0'+m2
          if(h2<10) h2='0'+h2
          let begin_interval=`${this.value} ${h}:${m}:00`
          let end_interval=`${this.value} ${h}:${m}:59`
          if(in_number>=this.field.first_interval && !exists_time(begin_interval))
            return_value.push({text:`${h}:${m} - ${h}:59`, value: [begin_interval,end_interval]})

          if(in_number>= this.field.interval_count + this.field.first_interval){
            break
          }
          delta_min+=this.field.interval_minutes
          in_number++
          //console.log(`interval: ${h}:${m}`)
        }
        return return_value
      }
    }
  }
</script>


<style scoped lang="scss">
  @import '@/styles/variables.scss';
  .v-toolbar__title {color: #bebebe; padding-top: 15px; font-size: 1rem;}
  .event_form {border: 1px solid gray; padding: 20px; margin-top: 20px; margin-bottom: 20px; border-radius: 5px;}
  h2 {font-size: 0.9rem; color: black;}
</style>
