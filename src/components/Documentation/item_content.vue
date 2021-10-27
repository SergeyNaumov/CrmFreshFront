<template>
    <div :id="id_content">
<v-dialog
      v-model="lightbox"
      width="auto "
    >
      <v-card>
        <!--
        <v-card-title class="text-h5">
          
        </v-card-title>
    -->

        
        <img :src="lightbox_img"/>
        <v-card-actions>
          <v-spacer></v-spacer>



          <v-btn
            color="primary"
            
            @click="lightbox = false"
          >
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
        <template v-if="level==0"><h1>{{item.header}}</h1></template>
        <template v-else-if="level==1"><h2>{{level}}-{{item.header}}</h2></template>
        <template v-else-if="level==2"><h3>{{level}}-{{item.header}}</h3></template>
        <template v-else-if="level==3"><h4>{{level}}-{{item.header}}</h4></template>
        <template v-else-if="level==4"><h5>{{level}}-{{item.header}}</h5></template>
        <template v-else-if="level==5"><h6>{{level}}-{{item.header}}</h6></template>
        <div v-html="item.body"/>
        <item-content
            v-for="c in item.child" :key="'content'+c.id"
            :item="c" :level="level+1"
        />
    </div>
</template>
<script>
let t
export default {
    props:['item','level'],
    name:'item-content',
    watch:{
        item(){

            
        }
    },
    created(){
            t=this
            this.$nextTick(
                ()=>{this.init_lightbox()}
            )
    },
    data(){
        return {
            lightbox_img:'',
            lightbox:''
        }
    },
    computed:{
        id_content(){
            return 'header'+this.item.id
        }
    },
    methods:{
        show_lightbox(img){

        },
        init_lightbox(){
            //console.log('init init_lightbox',`#${this.id_content} a.lightbox`)

            for(let link of document.querySelectorAll(`#${this.id_content} a.lightbox`)){
                link.setAttribute('data-src',link.href)
                link.href='#'
                link.onclick=function(){
                    t.lightbox_img=this.getAttribute('data-src')
                    t.lightbox=true
                    //console.log('click:',this.getAttribute('data-src'))

                    return false
                }
            }
        }
    }
}
</script>
<style  scoped lang="scss">
    @import '@/styles/variables.scss';
    
    h1 {font-size: 36px !important; margin-top: 20px !important; margin-bottom: 10px !important;}
    h2 {font-size: 28px !important; margin-top: 20px !important; color: $primary;}
    h3 {font-size: 22px !important; margin-top: 20px !important; color: $primary;}
    h4 {font-size: 18px !important; margin-top: 20px !important; color: $primary;}
    h5 {font-size: 16px !important; margin-top: 20px !important; color: $primary;}

    h6 {font-size: 15px !important; margin-top: 20px !important; color: $primary;}
    @media only screen and (max-width: 800px) {
        h1 {font-size: 26px !important; margin-top: 20px !important; margin-bottom: 10px !important;}
        h2 {font-size: 24px !important; margin-top: 20px !important; color: $primary;}
        h3 {font-size: 22px !important; margin-top: 20px !important; color: $primary;}
        h4 {font-size: 18px !important; margin-top: 20px !important; color: $primary;}
        h5 {font-size: 16px !important; margin-top: 20px !important; color: $primary;}
    }
    .v-dialog{
        width: unset;
    }
</style>