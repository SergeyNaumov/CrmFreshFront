import { bus } from '../../main'

export function field_update(new_data, self){
    if(self.value !== new_data.value)
      self.value=new_data.value

    if('error_message' in new_data){
      self.$nextTick(
        ()=>{self.error_message=new_data.error_message}
      );
    }

    if('warning_message' in new_data){
      self.$nextTick(
        ()=>{self.warning_message=new_data.warning_message}
      );
    } 
}

export function check_fld(self){
    if(!self.value)
      self.value='';
    let f=self.field;
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

          if(f.regexp_rules){
            let i=0, error_message='';
            while(i<f.regexp_rules.length){
              let rule=f.regexp_rules[i]; let msg=f.regexp_rules[i+1];
              let test=eval(rule+'.test(self.value)');
              
              if(!test){
                error_message=msg;
                break;
              }
              i=i+2;
            }
            
            let field=self.field
            field.error_message=error_message
            //self.error_message=error_message;
            
          }
          
          let old_error=f.error
          f.error=self.error_message?true:false;  

          if(f.error !== old_error){
            if(!self.parent){
              f.value=self.value
              bus.$emit('change_field', f);  
            }
          }

  }