export function field_update(new_data, self){
    if(self.value !== new_data.value)
      self.value=new_data.value
    //console.log('self: ',self.field, self.field.description)

    // if('error_message' in new_data){
    //   self.$nextTick(
    //     ()=>{self.error_message=new_data.error_message}
    //   );
    // }
    //let field=window.EditForm.get_field_by_name(self.field.name) // дёргаем field прямо из формы

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
          for(let a of ['after_html','before_html','description']){
              self[a]=new_data[a] || ''
              // if(field){
              //   field[a]=new_data[a] || ''
              //   console.log(`set field ${field.name} => ${new_data[a]}`)
              // }
          }

        }
      );
    } 
}

export function check_fld(self){
    if(!self.value)
      self.value='';
    let f=self.field;
    let error=false
    let error_message=''

    if(f.replace_rules){
              let i=0;
              while(i<f.replace_rules.length){
                let rule=f.replace_rules[i], rep=f.replace_rules[i+1];
                
                self.$nextTick(
                  ()=>{
                    self.value=eval('self.value.replace('+rule+",'"+rep+"')");
                  }
                );
                
                i+=2;
              }
    }

    let i=0
    if(f.regexp_rules){
            
            while(i<f.regexp_rules.length){
              let rule=f.regexp_rules[i]; let msg=f.regexp_rules[i+1];
              let test=eval(`${rule}.test(self.value)`);

              if(!test){

                error_message=msg
                error=true
                
                break;
              }
              i=i+2;
            }
            
            //let field=self.field
            //field.error_message=error_message
            
            //self.error_message=error_message;
            
    }



          //if(f.error !== old_error || ){
    if(self.parent){
      //console.log('TO_PARENT:',f)
      self.parent({
        from:'field_functions.js',
        'name':f.name,
        'value':self.value,
        'error':error,
        'error_message':error_message
      })
              
    }
    else{
      f.value=self.value 
      f.error_message=error_message
      f.error=error
      f.not_parent=true
      self.$bus.$emit('change_field', f);
    }
          //}

  }