export const formatDate= date=>{
  if (!date) return ''; // Если дата не определена, возвращаем пустую строку  
  
  if(typeof(date)=='string')
    return date
  const day = String(date.getDate()).padStart(2, '0'); // День (с ведущим нулём)
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяц (с ведущим нулём, +1 потому что месяцы начинаются с 0)
  const year = date.getFullYear(); // Год

  return `${day}.${month}.${year}`; // Формат dd.mm.yyyy
}

export const formatDateYMD= date=>{
  
  if (!date) return ''; // Если дата не определена, возвращаем пустую строку
  if(!date || date=='Invalid Date'){
    return ''
  }
  if(typeof(date)=='string'){
    return date
  }

  const day = String(date.getDate()).padStart(2, '0'); // День (с ведущим нулём)
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяц (с ведущим нулём, +1 потому что месяцы начинаются с 0)
  const year = date.getFullYear(); // Год

  return `${year}-${month}-${day}`; // Формат dd.mm.yyyy
}

export const getTimeFromDatetime=v=>{
  if(v){
    let [,time]=v.split(' ')
    return time || ''
  }
  return ''
}
export function field_update(new_data, self){
    if(self.value !== new_data.value)
      self.value=new_data.value
    //console.log('self: ',self.field, self.field.description)

    // if('error_message' in new_data){
    //   self.$nextTick(
    //     ()=>{self.error_message=new_data.error_message}
    //   );
    // }
    let field=window.EditForm.get_field_by_name(self.field.name) // дёргаем field прямо из формы

    // if('warning_message' in new_data){
    //   self.$nextTick(
    //     ()=>{self.warning_message=new_data.warning_message}
    //   );
    // }

    const field_attributes=['after_html','before_html','description','warning_message','error_message']

    // если какой-то из атрибутов пристутствует в new_data
    if( field_attributes.some(key => key in new_data) ){
      self.$nextTick(
        ()=>{
          for(let a of ['after_html','before_html','description','value']){
              self[a]=new_data[a] || ''
              if(field){
                field[a]=new_data[a] || ''
                 //console.log(`set field ${field.name} => ${new_data[a]}`)
              }
          }

        }
      );
    } 
}
export function frontend_result_process(self,result,proc_name){
  if(result){
    let i=0; 

    //console.log('proc_name:',proc_name)
    while(i<result.length){
      let name=result[i], obj=result[i+1]
      let dep_field=on_dependence(self,name,obj,(proc_name==name));
      //console.log('name:', name, obj)
      let f=window.EditForm.get_field_by_name(name)
      if(f){
        f.description=obj['description']
      }
      if(obj.jscode){
        eval(obj.jscode)
      }
      i+=2;
    }
  }
}

export const frontend_process=(self,loopback)=>{
  let f=self.field
  console.log('frontend_process: ',f)
  return 
  

  let front=f.frontend;

  if(front.fields_dependence){
    let dep;
    eval('dep='+front.fields_dependence);
    let result=dep(self.values)
    frontend_result_process(self,result,f.name);
  }
  let timeout=600
  if(front.ajax){
    let a=front.ajax;
    if(a.timeout)
      timeout=a.timeout
    if(!f.ajax_cnt) f.ajax_cnt=0;
    f.ajax_cnt++
    
    setTimeout(
      ()=>{
            
            f.ajax_cnt--;
            if(!f.ajax_cnt && !f.error){
                let ajax_url=BackendBase+'/ajax/'+self.form.config+'/'+a.name
                self.$http.post(
                  ajax_url,
                  {values:self.values,id:self.form.id}
                ).then(
                  r=>{
                    let d=r.data;
                    if(d.success){
                      if(f.not_parent){

                      }
                      frontend_result_process(self,d.result,f.name);
                      //console.log('result_process:',f, d.result)
                    }
                    if(d.errors.length)
                      alert(d.errors[0])
                    

                    
                  }
                ).catch(
                  e=>{
                    alert('frontend_process (ajax field_name: '+f.name+' url: '+ajax_url+'): '+e)
                  }
                )
            };
      },
      timeout
    )

  }
  
}

export const save_field_to_store=(t,field)=>{

  if(typeof t.save_field_to_store=='function'){
    t.save_field_to_store(field)
  }
  else{
    t.$store.state.fields[field.name]=field
  }
  

}

export const check_fld=(self, value)=>{
    
    let f=self.field, error=false, error_message=''
    if(value==undefined){
      value=getValueByField(self)
    }
    
    /*
      error -- есть ошибка
      error_message -- сообщение об ошибке
    */

    if(f.replace_rules){
              let i=0;
              while(i<f.replace_rules.length){
                let rule=f.replace_rules[i], rep=f.replace_rules[i+1];

                eval('value=value.replace('+rule+",'"+rep+"')");                
                
                i+=2;
              }
    }

    let i=0
    if(f.regexp_rules){
            
            while(i<f.regexp_rules.length){
              let rule=f.regexp_rules[i]; let msg=f.regexp_rules[i+1];
              let test=eval(`${rule}.test(value)`);

              if(!test){

                error_message=msg
                error=true
                
                break;
              }
              i=i+2;
            }
    }


    f.error_message=error_message
    f.error=error
          //if(f.error !== old_error || ){
    if(typeof self.save_field_to_store=='function'){
      let f=self.field
      f.value=value
      self.save_field_to_store(f)
    }
    if(typeof self.save_to_store=='function'){
      self.save_to_store({field: f, value: f.value, from:'check_fld'})
              
    }
    else{
      //f.value=self.value 

      
      self.$store.state.fields[f]

      //console.log('new value:',value)
      //update_field()
      
      //return value
      //if(value!=ov){
      //  setValueByField(self,self.field, value)
      //}
      
      //self.$bus.emit('change_field', f);
    }
    return value
          //}

}

// новые функции (для vuex)
export const getValueByField=(self,field=null)=>{
  if(!field){
    field=self.field
  }
  if(!field){
    console.log('critical field_functions.js:getValueByField self:',self)
    return 'CRITICAL'
  }
  //console.log(field.name)
  if(typeof self.get_value_by_field=='function'){
    
    return self.get_value_by_field(field.name)

    //this.$store.state.values[this.field.name]
  }
  else{
    //console.log('not_1_to_m:',self)
    //console.log('values:', self.$store.state.values)
    
    return self.$store.state.values[field.name]
  }
}

export const setValueByField=(self,field,value)=>{
  // self -- компонент поля (field-text, field.select и т.д.)
  let ov
  console.log('input:', value, field.name)
  if(typeof self.get_value_by_field=='function'){
    ov=self.get_value_by_field(field.name)
    
  }
  else{
    ov=self.$store.state.values[field.name]
  }
  
  
  let before_check_value=value
  value=check_fld(self,value)
  //console.log('output:',value)
  
  if(ov!=value || before_check_value!=value){
    // loopback нужен для того, чтобы выполниться в fronted_process в случае необходимости  
    const loopback=(value)=>{    
        if(typeof self.save_to_store == 'function'){ // сохраняем в свой  store
          self.save_to_store({field:field, value:value})
        }
        else{ // сохраняем в стандартный store формы
          self.$store.state.values[field.name]=value
        }
        // REFRESH нужен! без него value не обновляется в полях
        self.$store.state.refresh=self.$store.state.refresh+1
        return value
    }

    if(0 &&  self.field.frontend){
        // frontend_process возвращает value
        return frontend_process(self,loopback)
    }
    else{
        return loopback(value)
    }
      
  }
  return ov

}