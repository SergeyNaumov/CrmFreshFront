<template>
    <div  class="is_headapp" >
      <h1>{{form.title}}</h1>
      <pre v-if="form.log && form.log.length">
        {{form.log}}
      </pre>
      <v-sheet >
            <div v-if="!show_select_date">
              {{value}} <v-btn @click="show_select_date=true" small>изменить дату</v-btn> 
              &nbsp;
              <v-btn color="primary" small @click="show_event_form=!show_event_form">{{show_event_form?'Не добавлять в расписание':'Добавить в расписание'}}</v-btn>
            </div>
            <v-date-picker 
              v-if="show_select_date"
              first-day-of-week="1" 
              locale="ru-Ru"
              v-model="value"
            />
      </v-sheet>
          <div v-if="show_event_form" class="event_form"> 
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
              <v-btn v-if="form_event.interval" @click.prevent="insert_event">Добавить</v-btn>
            </form>
            
          </div>
      

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
                    <hr>
                    <v-btn @click="deleteEvent(selectedEvent)" color="primary" x-small>удалить запись</v-btn>
                    <div v-for="e in errors_delete" class="err">{{e}}</div>
                  </v-card-text>
                </v-card>

              </v-menu>
              







          
          <v-sheet height="600">
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
              :interval-minutes="form.interval_minutes"
              :interval-count="form.interval_count"
              :first-interval="form.first_interval"
              @click:event="showEvent"
              locale="ru-Ru"
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
      type: 'week',
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
      events: [
      ],
      selectedOpen:false,
      selectedEvent: {},
      selectedElement: null,
      //colors: ['blue', 'indigo', 'deep-purple', 'cyan', 'green', 'orange', 'grey darken-1'],
      //names: ['Meeting', 'Holiday', 'PTO', 'Travel', 'Event', 'Birthday', 'Conference', 'Party'],
      /*active_color: "#4a30d7", 
      busy_color: "#6f6d78",*/
      errors_delete:[]
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
                  this.form=d.form
                  this.value=d.form.value

              }

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
      add_enent(){
        this.show_event_form=true
      },
      insert_event(){
        
        this.$http.post(
          `${BackendBase}/Schedule/${this.params.config}/addEvent`,
          {
            id: this.form_event.select_id,
            times:[this.form_event.interval[0],this.form_event.interval[1]],
            

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

      getEventColor (event) {
        return event.color
      },

      deleteEvent(event){
        console.log(event)
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
              this.load_events()
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
          let h2=parseInt( (delta_min+this.form.interval_minutes)/60), m2=(delta_min+this.form.interval_minutes-1) % 60

          if(m<10) m='0'+m
          if(h<10) h='0'+h
          if(m2<10) m2='0'+m2
          if(h2<10) h2='0'+h2
          let begin_interval=`${this.value} ${h}:${m}:00`
          let end_interval=`${this.value} ${h}:59:59`
          if(in_number>this.form.first_interval && !exists_time(begin_interval))
            return_value.push({text:`${h}:${m} - ${h}:59`, value: [begin_interval,end_interval]})

          if(in_number>= this.form.interval_count + this.form.first_interval){
            break
          }
          delta_min+=this.form.interval_minutes
          in_number++
          //console.log(`interval: ${h}:${m}`)
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
</style>