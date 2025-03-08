import { bus } from '../../main'
export function on_dependence(self, name,obj,not_frontend_process){
    for(let f of self.form.fields){
      if(f.name == name){
        if( !('value' in obj) && !('instead_of_empty' in obj) )
          not_frontend_process=true

        if('fields' in obj){
          f.fields=obj.fields
          bus.$emit(`1_to_m/slide_${f.name}:update_fields`,f.fields);
          //bus.$emit(`1_to_m:upload_values:${f.name}`)
        }
        if('value' in obj && f.value != obj.value )
          f.value=obj.value
        
        if('instead_of_empty' in obj && !f.begin_value)
          f.value=obj.instead_of_empty
          
        if('values' in obj){
          if( typeof(obj.values) == 'object'){
            f.values=obj.values
          }
          else if(typeof(obj.values) == 'string'){
            f.values=JSON.parse(obj.values)
          }
          else{
            f.values=[]
          }
          
        }
        if('hide' in obj)
          f.hide=obj.hide
        
        if('error' in obj){
          f.error_message=obj.error;
          f.error=f.error_message?true:false;
        }

        if('warning' in obj)
          f.warning_message=obj.warning;
        
        if('after_html' in obj)
          f.after_html=obj.after_html 
        
        if('before_html' in obj)
          f.before_html=obj.before_html
        bus.$emit('change_field',f,not_frontend_process);
      }
        
    }
    return undefined;
}

export function change_field(self,field,not_frontend_process){

    //console.log('CHANGE_FIELD:',self)
    if(!field) return;
    let v=field.value;
    if(field.type=='checkbox' || field.type=='switch'){
        v=parseInt(v)?true:false
    }
    if(field.type=='1_to_m'){
      for(let f of self.form.fields){
        if(f.name==field.name){
          f.values=field.values
          f.fields=field.fields
        }
      }
    }
    self.values[field.name]=v;
    
    bus.$emit('field-update:'+field.name,field);
    
    calc_values(self);
    if(!not_frontend_process)
      frontend_process(self,field);
};


export function save_field_1_to_m(self,data){

  if(!self.form.id) return ;

  let url=BackendBase+'/1_to_m/update_field/'+self.form.config+'/'+data.field+'/'+data.subfield+'/'+self.form.id;
  let emit_key='1_to_m:change_in_slide:'+data.field+':'+data.subfield+':'+data.id;

  self.$http.post(url,{
    cur_id:data.id,
    value:data.value
  }).then(
    r=>{
      let D=r.data;
      if(D.success){
          // Обновляем значения в 1_to_m
          bus.$emit('1_to_m:upload_values:'+data.field,D.values);
          bus.$emit(emit_key,{save_ok:true});
          
      }
      bus.$emit(emit_key,{errors:D.errors})
    }
  ).catch(
    e=>{
      //alert(e)
    }
  );

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
export const frontend_button_process=(self,f,button,success_function)=>{
  if(button.ajax){
    
    self.$http.post(
      BackendBase+'/ajax/'+self.params.config+'/'+button.ajax,
      {values:self.values,id:self.form.id}
    ).then(
      r=>{
        let d=r.data;
        if(d.success){
          frontend_result_process(self,d.result,f.name);
          success_function()
        }
        if(d.errors.length)
          alert(d.errors[0])
      }
    ).catch(
      e=>{
        alert('frontend_process (ajax): '+e)
      }
    )
    
  }

}
export function frontend_process(self,f){
    //console.log('frontend_process: ',f)
    if(!f.frontend) return;

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
                  let ajax_url=BackendBase+'/ajax/'+self.params.config+'/'+a.name
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

export function get_cgi_params(){
    let data=location.search.replace(/^\?/,'');
    let cgi_params={};

    for(let j of data.split(/&/)){
        let arr=j.split(/=/);
        cgi_params[arr[0]]=arr[1]
    }
    return cgi_params

}

export  function get_params(self){ // получаем параметры из url-а
    let url=location.pathname; let to_url=''
    if(/\/edit[\-_]form\/([^\/]+)\/(\d+)$/.test(url)){
        let arr=url.match(/\/edit[\-_]form\/([^\/]+)\/(\d+)$/);
        self.params={config:arr[1],id:arr[2],action:'edit'};
        
        return BackendBase+'/edit-form/'+self.params.config+'/'+self.params.id;
        
    }
    else if(/\/edit[\-_]form\/([^\/]+)?$/.test(url)){
        let arr=url.match(/\/edit[\-_]form\/([^\/]+)$/); 
        self.params={config:arr[1],action:'new'};

        return BackendBase+'/edit-form/'+self.params.config;
    }
    else{
        self.fatal_errors=[`url должен быть в формате ${BaseUrl}/edit_form/[config] или /edit_form/[config]/id`];
        return false;
    }
}

export function calc_values(self){
    let values={};
    let block=false;
    
    for(let f of self.form.fields){ 
      /*if(f.not_process){
        delete values[f.name]; continue;
      }*/
      
      if(f.error)
        block=true;

      if(f.type == 'select'){
        if(!f.value) f.value=''
        f.value+=''
        for(let v of f.values){
          v.v=v.v+''
        } 
      }
      
      if( f.type!='file'){
        let v=f.value;
        if(v === undefined) v='';
        if(f.type=='checkbox' || f.type=='switch') v=v?1:0;
        
        values[f.name]=v;
      }
    }
    
    self.disabled_form=block;
    self.values=values;
    self.init_color_selects();
}