<template>
	<div class="chat_window" id="chat_window">
		<div class="" class="header">
			Чат с {{chat.name}}
			<a href="" @click.prevent="go_chat_list()"><div class="close">[x]</div></a>
		</div>
		<div class="back">
			<a href="" @click.prevent="go_chat_list()">к списку чатов</a>
		</div>
		<div class="messages_list">
			<div 
				v-for="(m,idx) in messages" :key="`mes${idx}`"
				class="message_item" 
				:class="{your: m.your}"
			>
				
					<div class="message" v-html="load_body(m.body)"></div>
					<div class="time">{{time(m.ts)}}</div>

			</div>
			<!--<a href="" @click.prevent="load_forward">load_forward ()</a>-->
		</div>
        <div class="footer" v-if="!read_only">
          <textarea id="chat_window_newmes" v-model="new_message" placeholder="Введите Ваше сообщение (можно отправить нажатием Shift + Enter)"></textarea>
          <div style="text-align: right; margin-bottom: 10px;">
          	<v-btn @click.prevent="send_message"><v-icon x-small>far fa-paper-plane</v-icon>&nbsp;отправить</v-btn>
          </div>
        </div>
	</div>
</template>
<script>
import { load_chat, load_forward, send_message } from './MessengerFunc.js'
const scroll_to_bottom=()=>{ // для прокрутки div-а с сообщениями вниз
		setTimeout(
			()=>{
				let div = document.querySelector('#chat_window .messages_list')
				div.scrollTop = div.scrollHeight
			},
			100
		)
}

export default {  
    props:['chat','go_chat_list'],
    data: () => ({
      
      messages: [],
      new_message: '',
      read_only:false

    }),
    mounted(){
      this.init()  
      this.$el.addEventListener('keydown',this.keylistener)
      document.querySelector('#chat_window_newmes').focus()

    },
    destroyed() {
    	this.$el.removeEventListener('keydown',this.keylistener)
    },
    watch:{
      chat(){
        this.init()
      },
      show_chat_window(v){
        if(v){
          this.show_chat_list=false
        }
      }

    },

    methods: {
    	init(){
    		load_chat(this,(d)=>{
    			console.log('CHAT LOADED:',d)
    			this.read_only=d.read_only
    			scroll_to_bottom()

    		})
    	},
			keylistener(e){
				const keyCode = e.which || e.keyCode;
				
				//console.log(e.key, e.keyCode)
				if (keyCode === 13 && e.shiftKey) {
				 	this.send_message()
				}
			},
    	load_forward(loopback){ // загрузка "вперёд" (вновь появившихся сообщений)

    		load_forward(this, ()=>{
    			scroll_to_bottom
    			if(loopback)
    				loopback()
    		})
    	},
    	load_back(){ // загрузка "назад" (старых сообщений)

    	},
    	load_body(body){
    		body=body.replace(/\[img:(\/files.+?)\]/,`<a href="$1" target="_blank"><img src="$1" style="border-style:none;width: auto;max-width:100%;display:block;margin-bottom:20px;"></a>`)
    		return body
    	},
    	send_message(){
    		send_message(this, scroll_to_bottom)
    		
    	},
    	time(ts){
    		return ts
    	}

    }

}
</script>
<style lang="scss" scoped>
	@import '@/styles/main.scss'; 
	.chat_window{
	    position: absolute;
	    text-align: left;

	   	height: 600px;
	    width: 800px;
	    max-width: 100%;
	    
	    border-radius: 5px;
	    background-color: #fff;
	    border: 1px solid gray;
	    border-radius: 5px;
	    right: 0;
	    font-size: 10pt;
	}

	.back {margin-left: 10px;}
	.header {
	    padding: 5px;
	    background-color: $lighten2;
	    color: #fff;
	    text-align: left;
	    font-weight: bold;
	}
	.header .close{
		display: inline-block;
		float: right;
	}
	.messages_list{
		overflow-y: auto;
		margin-left: 10px;
		margin-right: 10px;
		border: none;
		max-height: 350px;
	}
	.message_item{
		padding: 5px;
		margin-top: 10px;
		
		
		min-height: 30px;
		text-align: left;
	}
	.message_item{
		

		background-color: $lighten4;;
	}
	.message_item.your{
		text-align: right;	
		background-color: $lighten5;
	}

	.message_item.your div{
		
	}
	.message_item .message,  message_item .time{
		padding: 0 !important;
	}

	textarea {
		width: 100%; height: 60px; border: 1px solid gray; margin-bottom: 5px;
		padding: 5px;
	}
	.footer {
	    position: absolute;
	    border-top: 1px solid gray;
	    width: 100%;
	    bottom: 0px;
	    right: 0px;
	}
</style>