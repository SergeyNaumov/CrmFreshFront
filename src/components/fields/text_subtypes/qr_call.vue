<template>
  <span>
    <template>

      <template v-if="!for_slide">QR-код для звонка: </template>
      <span style="padding-left: 3px;" v-for="(p,idx) in splitted" :key="`qr-${idx}`"><a href="#"   @click.prevent="show_qr==p?(show_qr=false):(draw_qr(p))">{{ format_phone(p) }}</a><template v-if="idx!=splitted.length-1"> | </template></span>

    </template>
    <template v-if="show_qr">
      <div class="call_number">
        позвонить по: {{show_qr}}
      </div>
      <div class="call_buttons">
        <a :href="'tel:'+show_qr">
          <v-btn>
            <v-icon color="primary">fa fa-phone</v-icon>
          </v-btn>
        </a>
        <a :href="'https://tlgg.ru/'+show_qr">
          <v-btn>
            <img class="messenger" src="/img/icon_telegram.svg"/>
          </v-btn>
        </a>
        <a :href="'https://wa.me/'+show_qr">
          <v-btn>
            <img class="messenger" src="/img/icon_whatsapp.svg"/>
          </v-btn>
        </a>
      </div>

      <div class="qr" :id="id" style="width: 100%;"></div>
      <!--<a href="" @click.prevent="show_qr=false">скрыть qr код</a>-->
      <hr>
    </template>
    <pre v-if="0">
      {{ splitted }}
    </pre>
  </span>
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
          show_qr: false,
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


              
          })
        }
      },
      draw_qr(phone){
        this.show_qr=phone
        setTimeout(
          ()=>{
            let qr_div=document.getElementById(this.id)
        
            qr_div.innerHTML='';

            let qrcode_result=new QRCode(qr_div, `tel:${phone}`);
            //let qrcode_result=new QRCode(qr_div, `tel:${this.format_phone(phone)}`);
          },50
        )

        
      },
      format_phone(phone){
        return phone.replace(/\+7(\d{3})(\d{3})(\d{2})(\d{2})/,'8($1)$2-$3$4')
      }
    },

}
</script>
<style scoped>
  .qr {margin: 10px;}
  .inline {display: inline-block;}
  img.messenger {width: 30px;}
  .call_number {font-size: 1.2rem; margin-top: 10px;}
  .call_buttons {

    padding:0 ;
    margin: 10px 0;
  }
  .call_buttons button {width: calc(30% - 11px); margin: 0 10px;  }
  .call_buttons .v-btn {height: 50px;}
</style>