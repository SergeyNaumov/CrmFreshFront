<template>
      <div class="chat_list">
				<div class="header">
					Список чатов

					<a href="" @click.prevent="close_chat_list">
						<div class="close">[x]</div>
					</a>
				</div>
        <div v-if="!chat_list.length" class="not_chat_list">
          К сожалению, в данный момент нет доступных чатов
        </div>
        <a v-for="c in chat_list" href="" @click.prevent="open_chat(c)" style="width: 100%;">
        		<div  class="chat_item" :class="{'selected': c.new_messages>0}">
            {{c.name}} 
            <div class="cnt" >{{c.new_messages}}</div>
        </div>
        </a>
      </div>
</template>
<script>
import { get_chatlist } from './MessengerFunc.js'
import { load_chat, send_message } from './MessengerFunc.js'
export default {  
    props:['close_chat_list','open_chat'],
    data: () => ({
      
      chat_list: [],
      new_message: ''
    }),
    mounted(){
      this.init()  
    },
    watch:{
      chat(){
        this.init()
      },
    },

    methods: {
    	init(){
    		this.get_chat_list()
    	},

      get_chat_list(){
      	console.log('go_chat_list!')
        get_chatlist(this)
      }


    }

}
</script>
<style lang="scss" scoped>
	@import '@/styles/main.scss'; 
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
  .chat_list {
    text-align: left;
    border: 1px solid gray;
    height: 300px;
    
    width: 450px;
    max-width: 100%;
    right: 0;
    
    position: absolute;
    background-color: #fff;
    overflow-y: auto;
    border-radius: 5px;
    font-size: 10pt;
  }
  .not_chat_list{
    padding-top: 50px;
    text-align: center;
  }
  .chat_item {
    padding: 2px 5px;
    
    width: 100%;
  }
  .chat_item:hover{
    background-color: #bebebe;
  }
  .chat_item.selected {
    font-weight: bold;
  }
  .chat_list a {
    text-decoration: none;
  }
  .chat_item .cnt{ 
    display: inline-block;
    position: absolute;
    right: 10px;
  }
</style>