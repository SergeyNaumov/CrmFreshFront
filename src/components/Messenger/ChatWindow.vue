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
				<div>{{m.body}}</div>
			</div>
			<!--<a href="" @click.prevent="load_forward">load_forward ()</a>-->
		</div>
        <div class="footer">
          <v-textarea 
          v-model="new_message"
          label="Ваше сообщение:"
          />
          <v-btn @click.prevent="send_message"><v-icon x-small>far fa-paper-plane</v-icon>&nbsp;отправить</v-btn>
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
      new_message: ''
    }),
    mounted(){
      this.init()  
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
    		load_chat(this,scroll_to_bottom)
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
    	send_message(){
    		send_message(this, scroll_to_bottom)
    		
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
	    width: 500px;
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
		
		margin-top: 10px;
		
		
		min-height: 30px;
		text-align: left;
	}
	.message_item div{
		padding: 10px;

		background-color: $lighten4;;
	}
	.message_item.your{
		text-align: right;	
	}

	.message_item.your div{
		background-color: $lighten5;
	}

	.footer {
	    position: absolute;
	    border-top: 1px solid gray;
	    width: 100%;
	    bottom: 0px;
	    right: 0px;
	}
</style>