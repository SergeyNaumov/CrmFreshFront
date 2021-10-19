<template>
    <div  class="is_headapp" >
       <h1>Список видеоматериалов</h1>
       {{list}}
    </div>
</template>
<script>
/*import item_content from './item_content';
import item_menu from './item_menu';
import links_block from './links'*/
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

        this.$http.get(
            BackendBase+'/VideoList/'+this.params.config
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
  .title {
    margin-bottom:  20px;
    margin-top:  20px;
    font-size:  36px !important;
  }
</style>