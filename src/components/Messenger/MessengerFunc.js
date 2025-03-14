let messenger_app_object=null
let chat_list_object=null
let chat_window_object=null
let ws, interval, sockets

const signal_message=()=>{ // проигать звук 
	document.getElementById('sms_messenger').play()
}

// Инициализация вебсокета
export function init_websocket(t){
	console.log('INIT WebSocket:',t.$http)
	let manager=t.manager
	t.$http.get(
		`${config.BackendBase}/messenger/get-socket-name`
	).then(
		r=>{
			let websocket_name=r.data
			let ws_url=`${config.MessengerWS}/${websocket_name}`
			/*
ws = new WebSocket('wss://' + location.hostname + '/backend/messenger/ws/1')
ws.onclose=()=>{console.log('MY SOCKET CLOSE')}
ws.onopen=(e)=>{
console.log('MYSOCKET is open');
sockets = true;
}
ws.onmessage =(e)=>{
console.log('MYSOCKET onmessage:',event.data)
}
			)*/

			ws = new WebSocket(ws_url)
		    ws.onmessage = function(event) {
		    	console.log('event.data:',event.data)
		    	let res=event.data.match(/chat_id:(\d+):(\d+)/)

		    	if(res){
		    		signal_message()
		    		//console.log('chat_state:',messenger_app_object.chat_state)
		    		let chat_id=res[1]
		    		let new_messages=res[2]
		    		if(messenger_app_object){
		    			console.log('new_messages:',new_messages)
		    			messenger_app_object.new_messages=new_messages
		    		}
		    		if(messenger_app_object.chat_state=='chat_list'){
		    			chat_list_object.get_chat_list()
		    		}
		    		if(messenger_app_object.chat_state=='chat_window'){
		    			chat_window_object.load_forward(
		    				(new_messages)=>{
		    					//if(messenger_app_object.new_messages<new_messages){
		    						messenger_app_object.new_messages=new_messages
		    						// проигрываем звуковой сигнал

		    					//}

		    				}
		    			)
		    		}
		    		//console.log(`chat_id: ${chat_id}`)
		    	}


		        messenger_app_object
		    };
		    ws.onopen=(e)=>{
		    	console.log('socket open');
		    	sockets = true;
		    }
			ws.onclose = function(e) {
			  console.log('socket closed');
			  sockets = false;
			}
			if(!interval){
			    interval = setInterval(()=>{
			    	console.log('sockets:',sockets)
			        if (!sockets) {
			        	console.log('MessengerFunc: websocket reconnect')
			            init_websocket(t);
			        }
			    }, 5000)
			}

		}
	)
	//console.log('manager:',manager)
	//let ws_url=`${config.BackendBase}/messenger/ws`.replace('http://','ws://')
	//console.log('socket_id: ',manager.socket_id || manager.id)



}
export function get_new_messages(t){
	messenger_app_object=t
	t.$http.get(`${config.BackendBase}/messenger`).then(
		r=>{
			let d=r.data
			if(d.success)
				t.new_messages=d.new_messages
		}
	)
}

export function get_chatlist(t){ // загрузка всех сообщений в окне чата
	console.log('get_chatlist')
	chat_list_object=t
	t.$http.get(`${config.BackendBase}/messenger/chatlist`).then(
		r=>{
			let d=r.data
			if(d.success){
				t.chat_list=d.chat_list
				console.log('chat_list:',t.chat_list)
			}
		}
	)
}

export function load_forward(t,loopback){ // загрузка новых сообщений в окне чата
	let last_chat_message_id=0
	if(t.messages.length){
		last_chat_message_id = t.messages[ t.messages.length - 1 ].id
	}
	t.$http.get(
		`${config.BackendBase}/messenger/chat-forward/${t.chat.id}/${last_chat_message_id}`
	).then(
		r=>{
			let d=r.data
			if(d.success){
				for(let m of d.messages){
					t.messages.push(m)
				}
				if(d.not_read_messages && messenger_app_object){ // в чате были непрочитанные сообщения
					get_new_messages(messenger_app_object)
				}
				loopback()
			}
		}
	)
}

export function load_chat(t, loopback){
	chat_window_object=t

	t.$http.get(
		`${config.BackendBase}/messenger/chat/${t.chat.id}`
	).then(
		r=>{
			let d=r.data
			if(d.success){
				t.messages=d.messages
				if(d.not_read_messages && messenger_app_object){ // в чате были непрочитанные сообщения
					get_new_messages(messenger_app_object)
				}
				loopback(d)
			}
		}
	)
}

export function send_message(t,loopback){
	let last_chat_message_id=0
	if(t.messages.length){
		last_chat_message_id = t.messages[ t.messages.length - 1 ].id
	}
	/*console.log('ws:',ws)
	if(ws.readyState != 1){
		init_websocket()
	}
	ws.send(
		JSON.stringify({action:'send_message', message: t.new_message, last_chat_message_id: last_chat_message_id})
	)*/

	t.$http.post(
		`${config.BackendBase}/messenger/send`,
		{
			chat_id: t.chat.id,
			message: t.new_message,
			last_chat_message_id: last_chat_message_id
		}
	).then(
		r=>{
			let d=r.data
			if(d.success){
				for(let message of d.messages){ // сообщения, которые надо добавить в чат
					t.messages.push(message)
				}
				t.new_message=''
				loopback()

			}
		}
	)
}