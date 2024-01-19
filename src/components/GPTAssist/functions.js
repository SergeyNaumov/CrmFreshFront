
let ws, interval, sockets

export function init_websocket(t, taskid){

    // Задача в GPT была отправлена ранее, а теперь мы создаём сокет и слушаем, пока не придёт ответ

    let ws_url=`${t.WS}/${taskid}`
    console.log('ws_url: ',ws_url)
    ws = new WebSocket(ws_url)
    ws.onmessage = function(event) {
        // здесь ловим результат от GPT
        let data=event.data
        console.log('event.data:',event.data)
        let res=event.data.match(/^(\d+)\|(.+)$/s)

        t.ask_sended=false
        if(res){
            let [status,message]=[res[1],res[2]]
            // console.log(`status: ${status} message: ${message}`)
            t.response_status=status
            t.response=message
            ws.close()


        }


        //messenger_app_object
    };
    ws.onopen=(e)=>{
        console.log('socket open');
        sockets = true;
    }
    ws.onclose = function(e) {
      console.log('socket closed');
      sockets = false;
    }
    // if(!interval){
    //     interval = setInterval(()=>{
    //         console.log('sockets:',sockets)
    //         if (!sockets) {
    //             console.log('MessengerFunc: websocket reconnect')
    //             init_websocket(manager);
    //         }
    //     }, 5000)
    // }



}