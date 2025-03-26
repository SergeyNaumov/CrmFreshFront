export const formatDate= date=>{
  if (!date) return ''; // Если дата не определена, возвращаем пустую строку  
  const day = String(date.getDate()).padStart(2, '0'); // День (с ведущим нулём)
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяц (с ведущим нулём, +1 потому что месяцы начинаются с 0)
  const year = date.getFullYear(); // Год

  return `${day}.${month}.${year}`; // Формат dd.mm.yyyy
}

export const formatDateYMD= date=>{
  if (!date) return ''; // Если дата не определена, возвращаем пустую строку
  
  
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



          //if(f.error !== old_error || ){
    if(self.parent){
      // с этим нужно будет разобраться
      // self.parent({
      //   from:'field_functions.js',
      //   'name':f.name,
      //   'value':self.value,
      //   'error':error,
      //   'error_message':error_message
      // })
              
    }
    else{
      //f.value=self.value 
      f.error_message=error_message
      f.error=error
      f.not_parent=true
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

  if(field.parent){
    //this.$store.state.values[this.field.name]
  }
  else{
    return self.$store.state.values[field.name]
  }
}

export const setValueByField=(self,field,value)=>{
  // console.log('setValueByField:',value);
  if(field.parent){

  }
  else{
    let ov=self.$store.state.values[field.name]
    if(ov!=value){
      //ov=value
      value=check_fld(self,value)
      //console.log('ov: ',ov,' nv: ',value)
      if(ov!=value){
        
        if(field.parent){
      
        }
        else{
          //console.log('save to storage: ',value, 'refresh_value: ',self.$store.state.refresh)
          
          self.$store.state.values[field.name]=value
          self.$store.state.refresh=self.$store.state.refresh+1
        }
      }
    }

  }


}