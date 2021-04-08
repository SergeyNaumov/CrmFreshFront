<template>
    <div  class="is_headapp" >
        <v-btn top right absolute="" color="primary" small @click="dialog=!dialog" v-scroll="scrolling" id="scrollbutton"
        >
            оглавление
        </v-btn>
        <div class="content">
                 <item-content
                    v-for="c in list" :key="'content'+c.id"
                    :item="c" :level="0"
                 />
        </div>
        <v-dialog v-model="dialog" max-width="500">
            <v-card>
                 <v-card-title class="headline">Оглавление</v-card-title>
                 <v-card-text>
                <item-menu 
                    v-for="m in list" :key="m.id"
                    :item="m"
                    :level="0"
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
export default {
    components:{
        'item-menu':item_menu,
        'item-content':item_content,
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
                    this.list=data.list
                }
            }
        )
    },
    data(){
        return {
            scrollbutton_offset:0,
            dialog:false,
            config:'',
            list:[]
        }
    },
    methods:{
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
  .v-dialog {
      max-width: 500px;
  }
  .v-dialog .v-card{
      padding: 20px;
      max-width: 500px;
  }
</style>