<template>
    <div  class="is_headapp" >
        <v-btn top right absolute="" color="red" small @click="dialog=!dialog" v-scroll="scrolling" id="scrollbutton"
        >
            оглавление
        </v-btn>
        <div class="content">
                <pre v-if="log.length">
                    {{log}}
                </pre>

                <links_block v-if="links.length" :links="links" />
                <hr>
                <div class="title">{{title}}</div>
                <hr>
                <item-content
                    v-for="c in list" :key="'content'+c.id"
                    :item="c" :level="0"
                />
        </div>
        <v-dialog v-model="dialog" max-width="800">
            <v-card>
                 <v-card-title class="headline">Оглавление</v-card-title>
                 <v-card-text>
                    <item-menu 
                        v-for="m in list" :key="m.id"
                        :item="m"
                        :item_id="m.id"
                        :level="0"
                        :go_to_ankor="go_to_ankor"
                    />
                </v-card-text>
                <v-card-actions>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!--
         <v-row  no-gutters>
             <v-col class="p1" cols="12" sm="12" md="4">
                 

                 
             </v-col>
             <v-col class="p2" cols="12" sm="12" md="8">

             </v-col>
         </v-row>
         -->
    </div>
</template>
<script>
import item_content from './item_content';
import item_menu from './item_menu';
import links_block from './links'
export default {
    components:{
        'item-menu':item_menu,
        'item-content':item_content,
        'links_block':links_block
    },
    props:['params','is_headapp'],
    created(){
        //console.log(location);
        this.$http.get(
            BackendBase+'/documentation/'+this.params.config
        ).then(
            r=>{
                let data=r.data;
                if(data.success){
                    document.title=data.title, this.title=data.title
                    this.list=data.list
                    this.log=data.log
                    this.links=data.links
                }
            }
        )
    },
    data(){
        return {
            scrollbutton_offset:0,
            title:'',
            dialog:false,
            config:'',
            list:[],
            links: [],
            log:[]
        }
    },
    methods:{
        go_to_ankor(id){
            
            document.getElementById('header'+id).scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                })
        },
        scrolling(p){
            let body=document.getElementsByTagName("body")[0];
            let scrollHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            document.getElementById('scrollbutton').style.top=window.pageYOffset+'px';
            //this.scrollbutton_offset=window.pageYOffset
            
        }
    } 
}
</script>
<style scoped>

  .is_headapp {margin: 20px; max-width: 1400px;}
  .is_headapp h1 {margin-bottom: 20px;} 
  #scrollbutton {color: #fff;}
  .v-dialog {
      max-width: 800px;
  }
  .v-dialog .v-card{
      max-width: 800px;
  }
  .title {
    margin-bottom:  20px;
    margin-top:  20px;
    font-size:  36px !important;
  }
  .headline {margin-bottom: 20px;}
  @media only screen and (max-width: 800px) {
    .title {font-size:  28px !important;}
  }
</style>