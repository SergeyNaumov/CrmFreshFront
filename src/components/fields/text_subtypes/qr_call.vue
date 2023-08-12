<template>
  <div :class="{'inline':for_slide}">
    <div >   
      <template v-if="!for_slide">QR-код для звонка: </template>
      <span v-for="(p,idx) in splitted" :key="`qr-${idx}`"><a href="#"   @click.prevent="draw_qr(p)">{{ p }}</a><template v-if="idx!=splitted.length-1"> | </template></span>

    </div>
    <template v-if="show_qr">
      <div class="qr" :id="id"></div>
      <a href="" @click.prevent="show_qr=false">скрыть qr код</a>
    </template>
    <pre v-if="0">
      {{ splitted }}
    </pre>
  </div>
</template>
<script>

export default {
    props:['field','value','for_slide'],

    created(){
      console.log('create qr_call')
      if(!window.QRCode){
        this.load_QRCode_js()
      }

      

    },
    data:function(){
        let id=Math.random()+''

        return {
          id:'qr'+id.replace('0.',''),
          loaded: false,
          show_qr: false
        }
    },
    computed:{
      splitted(){
        let splitted=[]
        for(let p of this.value.split(/,\s*/)){
          if(/\d/.test(p)){
            splitted.push(p)
          }
        }
        return splitted
      }
    },
    watch:{
      value(){
        this.show_qr=false
      }
    },
    methods:{
      load_QRCode_js(){
        console.log('load_QRCode_js')
        if(window.QRCode){ // уже загружена
          console.log('load_QRCode_js already loaded')
          this.loaded=true
        }
        else{
          let scriptEle = document.createElement("script");
          scriptEle.setAttribute("src", "/dist/qrcode.min.js");
          document.body.appendChild(scriptEle)
          scriptEle.addEventListener("load", () => {
            
            this.loaded=true
            console.log('load_QRCode_js is okay')

              
          })
        }
      },
      draw_qr(phone){
        this.show_qr=true
        setTimeout(
          ()=>{
            let qr_div=document.getElementById(this.id)
        
            qr_div.innerHTML='';

            let qrcode_result=new QRCode(qr_div, `call:${phone}`);
          },50
        )

        
      }
    }
}
</script>
<style scoped>
  .qr {margin: 10px;}
  .inline {display: inline-block;}
</style>