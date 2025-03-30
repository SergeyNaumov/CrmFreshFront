export const init_store=t=>{
    let values=t.field.values || []
    let fields={}
    for(let f of t.field.fields){
        fields[f.name]=f

    }
    t.$store.state.one_to_m[t.field.name]={
        // для формы
        dialog:false,
        save_action:'',
        fields: fields, // хэш полей (для быстрого доступа)
        form_values:{},

        // значения для слайда
        values:values
    
    }
}

export const create_edit_fields=t=>{
    
    if(!t.field || !t.field.name || !t.field.fields){
        return 
    }
    // t.$store.state.values[t.field.name]={
    //   fields:{} // для формы
    // }

    for(let f of t.field.fields){        
      if(/^(file|text|textarea|checkbox|switch|date|datetime|select|select_from_table|select_values)$/.test(f.type)){
        if(f.type=='select_from_table' || f.type=='select_values'){ // преобразование типов
          for(let v of t.field.values){
            if(!v[f.name]) v[f.name]=''
            v[f.name]=v[f.name].toString();
          }
        }
        let new_fld={};
        Object.assign(new_fld,f);
        
        if(f.type=='text' || f.type=='textarea'){
          new_fld.value='';
        }
        else{
          new_fld.value=0;
        }
        
        t.$store.state.one_to_m[t.field.name].fields[f.name]=new_fld
        
        //this.edit_fields[f.name]=new_fld;
      }
    }
}