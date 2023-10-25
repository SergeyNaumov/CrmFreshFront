<template>
    <div  class="messenger" >
      <audio id="sms_messenger" muted="muted" 
         autoplay="">
        <source :src="MessengerSignal" type="audio/ogg" />
      </audio>

      <a href="" @click.prevent="go_chat_list"> 
        <template v-if="new_messages>0">
          <v-badge :content="new_messages" inline color="error"></v-badge>
        </template>
        <template v-else>
          
        </template>
        <v-icon class="msg_count" small>fa fa-comments</v-icon>
      </a>
      <ChatList 
        v-if="show_chat_list"
        :close_chat_list="close_chat_list"
        :open_chat="open_chat"
      />

      <ChatWindow
        v-if="show_chat_window"
        :chat="show_chat_window"
        :go_chat_list="go_chat_list"
      />      
    </div>
</template>
<script>
// import item_content from './item_content';
// import item_menu from './item_menu';
// import links_block from './links'
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { init_websocket, get_new_messages, get_chatlist } from './MessengerFunc.js'
export default {  
    props:['params','is_headapp','manager'],
    components:{
       ChatWindow,ChatList
    },
    data: () => ({
      chat_state:'',
      new_messages: 0,
      MessengerSignal:config.MessengerSignal,
      show_chat_list: false,
      show_chat_window: false,
      chat_list: [],
      chat_messages: []
    }),
    mounted(){
      this.init()
    },
    watch:{
      manager(){
        if(this.manager.id){
          this.init()      
        }
      },
      show_chat_list(v){
        if(v){
          this.chat_state='chat_list'
          this.show_chat_window=false
        }
      },
      show_chat_window(v){
        if(v){
          this.chat_state='chat_window'
          this.show_chat_list=false
        }
      }

    },

    methods: {
      init(){
        console.log('init Messenger')
        init_websocket(this)
        get_new_messages(this)

      },
      go_chat_list(){
        this.show_chat_list=true

      },
      close_chat_list(){
        this.show_chat_list=false
        this.chat_state=''
      },
      open_chat(c){
        this.show_chat_window=c
        this.show_chat_list=false
        
      },


    }

}
</script>
<style lang="scss" scoped>  
  .messenger {
    padding-left: 15px; 
    width: 100%;
    text-align: right;
  }
  .msg_count {padding-left: 5px; color: #fff;}
</style> 