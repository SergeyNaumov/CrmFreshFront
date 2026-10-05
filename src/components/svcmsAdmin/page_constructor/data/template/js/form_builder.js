const MAX_TRY_FETCH=1
var capcha_cache=null, capcha_reading=0

/* HTTP-хелперы. В проде axios не подключён — работаем нативным fetch.
   В preview определён window.axios (js/preview/forms.js), тогда используем
   его, чтобы работала офлайн-эмуляция. */
function http_has_axios(){
    return (typeof window.axios !== 'undefined') && window.axios && typeof window.axios.get === 'function'
}

/* GET({ url, success, error }) */
function GET(arg, try_cnt=0){
    const on_data = (d) => { if(arg.success){ arg.success(d) } };
    const on_error = (err) => {
        try_cnt++;
        if(arg.error){ arg.error(err) }
        if(try_cnt<MAX_TRY_FETCH){ setTimeout(()=>{ GET(arg, try_cnt) },2000) }
    };
    if(http_has_axios()){
        window.axios.get(arg.url).then(r=>on_data(r.data)).catch(on_error);
        return;
    }
    fetch(arg.url, { credentials: 'same-origin' })
        .then(r=>r.text())
        .then(t=>{
            let d=t;
            try{ d=JSON.parse(t) }catch(e){ /* не JSON — отдаём как есть */ }
            on_data(d);
        })
        .catch(on_error);
}

/* POST({ url, data, success, error }) */
function POST(arg){
    const on_data = (d) => { if(arg.success){ arg.success(d) } };
    const on_error = (err) => { if(arg.error){ arg.error(err) } };
    if(http_has_axios()){
        window.axios.post(arg.url,arg.data).then(r=>on_data(r.data)).catch(on_error);
        return;
    }
    fetch(arg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        credentials: 'same-origin',
        body: JSON.stringify(arg.data || {})
    })
        .then(r=>r.text())
        .then(t=>{
            let d=t;
            try{ d=JSON.parse(t) }catch(e){ /* не JSON — отдаём как есть */ }
            on_data(d);
        })
        .catch(on_error);
}

window.GET = GET;
window.POST = POST;


//test_post()
const init_capcha=(t)=>{

    if(0 && capcha_cache){

        t.capcha_key=capcha_cache.key
        t.capcha_src=capcha_cache.src
        return
    }

    if(capcha_reading>0){
        setTimeout( () => { init_capcha(t)}, 100 )
        return
    }
    capcha_reading++
    GET({
        url:'/capcha?action=out_key&json=1',
        success:(d)=>{
            t.capcha_key = d.capture_key, t.capcha_src = d.capture_src
            capcha_cache={key: d.capture_key, src: d.capture_src}
            capcha_reading--
        }

    })
}
const replace_phone=(v)=>{

    v=v.replace(/[^\d]/g,'');

    v=v.replace(/^(\d{11}).+$/g,'$1');
    //v=v.replace(/^[87]/,'+7');
    v=v.replace(/^[78]/g,'+7');
    v=v.replace(/^(\d)/g,'+7$1');
    v=v.replace(/^\+7(\d{3})(\d)/,"+7 ($1) $2");
    v=v.replace(/^(\+7 \(\d{3}\))(\d{3})/,"$1 $2");
    v=v.replace(/(\d{3})(\d{2})/,"$1-$2");
    v=v.replace(/(\d{2})(\d{2})/,"$1-$2");
    return v
}

const func_required_check=(v)=>{

    return ( (v===undefined || v===null || v==='' || v===false)?'пожалуйста заполните поле':'')}
const func_name_check=(v)=>{return v?'':'пожалуйста представьтесь'};
const func_phone_check=(v)=>{
    s=v+'';
    s=s.replace(/[^0-9]/g,'');
    if(!s)
        return 'вы не указали телефон'
    return (s.length < 9)?'укажите телефон в формате: +7 (XXX) XXX-XX-XX':''
};
const func_email_check=(v)=>{
    if(!v) return 'email не указан'
    return (/^[a-zA-Z0-9\-_\.]+@[a-zA-Z0-9\-_\.]+\.[a-zA-Z0-9\-_\.]+$/.test(v))?'':'email заполнен не корректно'

}

const clear_errors=(self)=>{
    for(let e in self.error ) self.error[e]=''
}
/* Условная обязательность: поле нужно заполнить только при «доставке
   курьером» (delivery). При самовывозе адрес не требуется.
   Проверка получает значение поля и саму форму (t) — из неё берём delivery. */
const make_need_address_check=(v,t)=>{
    const d = t ? t.delivery : '';
    if(d && d!=='Курьером') return '';
    return (v===undefined || v===null || v==='')?'укажите адрес доставки':'';
};
const need_checks={
    need_address: make_need_address_check,
};
const check_hash={
    required:func_required_check,
    name: func_name_check,
    phone: func_phone_check,
    email: func_email_check,
}
const check_form=(t)=>{
    let exists_errors=false
    for(let f of t.check_fields){

      if('chk' in f){
        let v=t[f.name], err=f.chk(v, t)
        if(err){ t.error[f.name]=err, exists_errors=true }
      }
    }

    return exists_errors
}
var BuildedForms={}
const Form=(a)=>{
    if( !document.getElementById(a.el.replace(/^#/,'')) )
        return
    /* ======================================= */
    





    const repl_hash={
        phone: replace_phone
    }

    let data_hash={ total_errors:[],error:{}, inited: false }, check_fields=[], capcha_exists=false, watch={}, appId=a.el.replace(/^#/,'')
    const get_data_for_submit=t=>{
        
        let data={}, app=BuildedForms[appId]

        for(let f of a.fields) 
            if(!f.not_submit)
                data[f.name]=app[f.name]
        
        if(capcha_exists){
            data.capcha_key=app.capcha_key
            data.capcha=app.capcha
            data.capture_key=app.capcha_key
            data.capture_str=app.capcha
        }
        return data
    }
    /* ======================================= */

    
    for(let f of a.fields){
        if(f.name=='capcha'){
            data_hash.capcha_key='', data_hash.capcha='', data_hash.capcha_src='', capcha_exists=true
            data_hash.error.capcha=''
        }
        else{
            data_hash[f.name]=f.value?f.value:''
        }
        c_fn=check_hash[f.chk] || need_checks[f.chk]
        if(c_fn){
            data_hash.error[f.name]=''
            check_fields.push({name:f.name,chk:c_fn}) 
        }
        f.repl=repl_hash[f.repl]
        if(f.repl){
            //console.log('r_fn:',r_fn)
            watch[f.name]=(v)=>{
                
                nv=f.repl(v)               
                
                BuildedForms[appId].set_value(f.name,nv)
                //console.log('app:',app._component.methods.set_value)
                //app._component.methods
            }
        }
    }

    data_hash.check_fields=check_fields
    
    let methods_hash={
                reset(){
                    for(let f of a.fields){
                        if(!f.not_reset)
                            this[f['name']]=f.value?f.value:''
                    }
                },
                set_value(n,v){ this[n]=v },
                init_capcha(){ 
                    capcha_cache=null // сбрасываем кэш у капчи
                    init_capcha(this) 
                },
                clear_errors(){
                    clear_errors(this)
                },
                check_form(){
                    clear_errors(this);
                    return check_form(this)
        
                },
                submit(){
                    this.error.__form=''
                    let exists_errors=this.check_form();

                    if(!exists_errors){
                        let data=get_data_for_submit()
                        data.action='form_send'

                        if(this.before_submit){
                            exists_errors=this.before_submit(data)
                        }
                        if(!exists_errors){
                        POST({
                            url:a.action_url,
                            data:data,
                            error:(err)=>{
                                this.error.__form='Не удалось отправить форму. Попробуйте ещё раз позже.'
                            },
                            success:(d)=>{
                                if(d.success){
                                    if(a.success){
                                        a.success(d)
                                    }
                                    this.reset()
                                }
                                else{
                                    this.total_errors=d.errors
                                    for(let e of d.errors){
                                        if(e=='capcha' || e=='str_key' || e=='capture_str'){

                                            this.error.capcha='укажите верный проверочный код'
                                        }
                                        else{
                                            this.error[e]='поле не заполнено или заполнено неверно'
                                        }
        
                                    }
                                    if(d.errors.capcha){
                                        this.error.capcha='проверочный ключ заполнен неверно'
                                    }
                                }

                            }
                        })
                        }
                    }
                }
    }

    if(a.methods){
        for(let m in a.methods)
            methods_hash[m]=a.methods[m]
    }
    let computed_hash={}
    if(a.computed){
        for(let c in a.computed)
            computed_hash[c]=a.computed[c]
    }
    //console.log('builder:',a)
    return Vue.createApp({
        data: ()=>data_hash,
        created(){
            BuildedForms[appId]=this
            if(capcha_exists)
                init_capcha(this)
            this.inited=true
            if(a.created)
                a.created()
        },
        computed: computed_hash,
        watch:watch,
        methods:methods_hash
    }).mount(a.el)
}
