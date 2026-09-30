var config={
    UrlPrefix:'',
    schema:0,
    
    BackendBase:'http://dev-crm.test/backend',
    // Фоновые задачи (crm_background). Если не задано — выводится из BackendBase.
    //BackgroundWS:'ws://localhost:5000/background/ws',
    //MessengerWS:'ws://dev-crm.test/backend/messenger/ws',
    MessengerWS:'ws://localhost:5000/messenger/ws',
    MessengerSignal:'/messenger/sms.ogg',
    
    TinyMCE_BaseUrl: '/dist/tinymce'
}