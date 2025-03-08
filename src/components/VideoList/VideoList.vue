<template>
    <div class="is_headapp">
<!---->
<v-dialog
      v-model="dialog"
      fullscreen
      
      hide-overlay
      transition="dialog-bottom-transition"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          color="primary"
          dark
          v-bind="attrs"
          v-on="on"
          v-if="code_for_show"
        >
          Продолжить просмотр
        </v-btn>
      </template>
      <v-card>
        <v-toolbar
          dark
          color="primary"
        >
          <v-btn
            icon
            dark
            @click="dialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>{{code_for_show.header}} </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-toolbar-items>
            <v-btn
              dark
              text
              @click="dialog = false"
            >
              Закрыть
            </v-btn>
          </v-toolbar-items>
        </v-toolbar>

        <div class="video" v-html="code_for_show.code" style="margin: 20px;"></div>
          

      </v-card>
    </v-dialog>


       <h1 v-if="!params.without_title" >{{title}}</h1>
       <errors :errors="errors"/>       

      <div class="links" >
          <template v-for="(l,idx) in links" :key="idx">
              <a :href="l.link" target="_blank">{{l.description}}</a>
              <template v-if="idx < links.length -1 ">&nbsp;|&nbsp;</template>
          </template>

      </div>
       <template v-if="params.limit">
            <v-row>
                <v-col v-for="(v,idx) in list" cols="12" md="4" sm="12" :key="idx">
                    <div><a href="" @click.prevent="open_video(v)">{{v.header}}</a></div>
                    <a href="" @click.prevent="open_video(v)" v-if="!v.show"><img :src="v.img"/></a>
                </v-col>
            </v-row>
       </template>
       <template v-else>
           <div v-for="(s,idx) in list" class='section'>
                    <!-- вывод по секциям -->
                
                    <template v-if="s.child.length">
                        <div class="section_name" >
                            {{s.header}}
                        </div>
                        <v-row>
                            <v-col v-for="(v,idx) in s.child" cols="12" md="4" sm="12" :key="idx">
                                <div><a href="" @click.prevent="open_video(v)">{{v.header}}</a></div>
                                <a href="" @click.prevent="open_video(v)" v-if="!v.show"><img :src="v.img"/></a>
                            </v-col>
                        </v-row>
                    </template>
           </div>
       </template>
    </div>
</template>
<script>
/*import item_content from './item_content';
import item_menu from './item_menu';
import links_block from './links'*/
const fix_youtube_code=(v)=>{
    if(!v.code) return
    let resmatch=v.code.match(/<iframe.*?src="(.+?)"/)
    if(resmatch){
        let Id=resmatch[1].split('/').pop()
        //console.log(Id)
        v.img=`https://img.youtube.com/vi/${Id}/mqdefault.jpg`
        
        //v.code=v.code.replace(/width="\d+"/,'width="800"').replace(/height="\d+"/,`height="600"`) // ${window.innerHeight}
        let size_match=v.code.match(/<iframe.*?width="(.+?)".*?height="(.+?)"/)
        if(size_match){
            let width=size_match[1]
            let height=size_match[2]
            let k=width/height
            let new_width=window.innerWidth-150
            let new_height=new_width/k
            if(new_height > (window.innerWidth*1)-200)
                new_height=window.innerWidth-200
                new_width=new_height*k
            console.log('new_height:',new_height)
            v.code=v.code.replace(/width="\d+"/,`width="${new_width}"`).replace(/height="\d+"/,`height="${new_height}"`) // ${window.innerHeight}
        }
        //console.log(size_match)
    }
    else{
        v.img=''
    }

    
}
export default {
    components:{
    /*
        'item-menu':item_menu,
        'item-content':item_content,
        'links_block':links_block
    */
    },
    props:['params','is_headapp'],
    created(){
        this.$nextTick(
            ()=>{
                this.load()
            }
        )

    },
    data(){
        return {
            dialog:false,
            code_for_show: false,
            title:'',
            errors:[],
            config:'',
            list:[],
            links: [],
            log:[]
        }
    },
    watch:{
        dialog(){
            if(!this.dialog){ // Начали просматривать видео, фиксируем
                this.code_for_show=false
            }
            
                
        }
    },
    methods:{
        open_video(v){
            this.dialog=true
            this.code_for_show=v
            let interval_update_seconds=false
            let rec_id=false
            

            let begin_show_sec=Math.floor( new Date().getTime()/1000)

            this.$http.post(
                BackendBase+'/VideoList/'+this.params.config,
                {
                    action: 'open_video',
                    id: v.id
                }
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        rec_id=d.id
                        // отравляем информацию о просмотре видео
                        interval_update_seconds=setInterval(
                            ()=>{
                                    if(this.code_for_show && begin_show_sec){
                                        
                                        let opened_seconds=Math.floor( new Date().getTime()/1000) - begin_show_sec; //  - begin_show_sec
                                        
                                        this.$http.post(
                                            BackendBase+'/VideoList/'+this.params.config,
                                            {
                                                action:'update_open_video',
                                                id:rec_id,
                                                seconds: opened_seconds // отправляем инфу о том, сколько секунд открыто окно с видео
                                            }
                                        )
                                    }
                                    else{
                                        clearInterval(interval_update_seconds)
                                    }

                                

                            },
                            1000
                        )
                    }
                }
            )
        },
        load(){
            let url=BackendBase+'/VideoList/'+this.params.config
            if(this.params.limit)
                url+='?limit='+this.params.limit

            this.$http.get(
                url
            ).then(
                r=>{
                    let data=r.data;
                    if(data.success){
                        if(!this.params.not_set_title)
                            document.title=data.title

                        this.title=data.title
                        if(this.params.limit){
                            for(let v of data.list){
                                    v.show=false
                                    fix_youtube_code(v)
                            }
                        }
                        else{
                            for(let sect of data.list){
                                for(let v of sect.child){
                                    v.show=false
                                    fix_youtube_code(v)
                                }
                            }
                        }

                        this.list=data.list
                        this.errors=data.errors
                        this.log=data.log
                        this.links=data.links
                    }
                }
            )
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
  .section_name {
    background-color:  #bebebe;
    margin-bottom:  20px;
    margin-top:  30px;
    border-radius:  5px;
    padding:  10px;
  }
  img {max-width: 100%;}
</style>