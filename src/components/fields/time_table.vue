<template>
  <div v-if="form.id"> <!-- показываем только для существующих записей -->
        <v-dialog
          v-model="selectedOpen"
          max-width="500"
        >
          <v-card>

            <v-card-text>
              {{selectedEvent.name}}: {{getTime(selectedEvent.start)}} -  {{getTime(selectedEvent.end)}}
              <v-btn @click="deleteEvent(selectedEvent)">удалить</v-btn>
            </v-card-text>
            <v-card-actions>
              <v-btn variant="text" @click="selectedOpen=false">Закрыть</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
    <p>
      <span>{{value}}</span> <v-btn color="primary" size="small" @click="show_event_form=!show_event_form">{{show_event_form?'Не добавлять в расписание':'Добавить в расписание'}}</v-btn>
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
        :model-value="$toDate(value)"
        @update:model-value="value=$toIso($event)"
      />


    
    <v-sheet height="600" @click="on_event_click">
      <v-calendar
        v-if="field"
        :ref="refname"
        :model-value="[$toDate(value)]"
        :weekdays="weekday"
        :view-mode="type"
        @update:model-value="value=$toIso($event[0])"
        :events="calendar_events"
        :interval-minutes="field.interval_minutes"
        :interval-count="field.interval_count"
        locale="ru-RU"
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
      on_event_click(e){ // labs VCalendar не эмитит click:event — ловим по чипу
        let chip=e.target && e.target.closest ? e.target.closest('.v-chip') : null
        if(!chip) return
        let title=(chip.innerText||'').trim()
        let ev=(this.events||[]).find(x=>x.name===title)
        if(ev){
          this.selectedEvent=ev
          this.selectedOpen=true
        }
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
      calendar_events(){
        return (this.events||[]).map(e=>({
          title: e.name,
          start: this.$toDate(e.start),
          end: this.$toDate(e.end),
          color: e.color,
          allDay: false,
          raw: e
        })).filter(e=>e.start && e.end)
      },
      cur_value(){
        if(!this.value)
          return ''
        if(this.type=='day'){
          let [year,mon,day]=String(this.value).split('-')
          if(!year||!mon||!day)
            return this.value
          return `${day} ${monlist[parseInt(mon)-1]} ${year}`
        }
        return this.value
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
  .v-toolbar-title {color: #bebebe; padding-top: 15px; font-size: 1rem;}
  .event_form {border: 1px solid gray; padding: 20px; margin-top: 20px; margin-bottom: 20px; border-radius: 5px;}
  h2 {font-size: 0.9rem; color: black;}
</style>
