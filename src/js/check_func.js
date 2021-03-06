// Функции для проверки и замены (при работе с формами)

export function phone_replace(v){
    v=v.replace(/[^\d]/g,'');
    v=v.replace(/^(\d{11}).+$/g,'$1');
    
    v=v.replace(/^(\d{11}).+$/g,'$1');
    v=v.replace(/^[87]/,'+7');
    v=v.replace(/^\+7(\d{3})(\d)/,"+7 ($1) $2");
    v=v.replace(/^(\+7 \(\d{3}\))(\d{3})/,"$1 $2");
    v=v.replace(/(\d{3})(\d{2})/,"$1-$2");
    v=v.replace(/(\d{2})(\d{2})/,"$1-$2")
    


    return v
}

export function phone_check(v){
    v=v.replace(/[^\d]/g,'');
    //v=v.replace(/^(\d{11}).+$/g,'$1');
    return /^\d{11}$/.test(v)
}
export function email_check(v){
    
    if(!v)
        return false
    
    if(!/^[a-zA-Z0-9\-_\.]+@[a-zA-Z0-9\-_\.]+\.[a-zA-Z0-9\-_\.]+$/.test(v))
        return false
    
    return true
}
export const is_cyrillic_str=(str)=>{
    return /^[абвгдеёжзийклмнопрстуфхцчшщьыъэюя\s]+$/i.test(str)
}
export function gen_pas(l,symbols){
    if(!l)
        l=6
    if(!symbols)
        symbols='123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

    let key='';

    let lensym=symbols.length;
    for(let k=0;k<=l;k++){
        key+=symbols[parseInt(Math.random()*lensym)];
    }
    return key;
}