export function init(t){
    t.$http.post(
        BackendBase+'/parser-excel/'+t.params.config,
        {
          action:'init'
        }
    ).then(
	        r=>{
	          let d=r.data;
	          if(d.success){
	            for(let f of d.parser.fields){
	              f.selected='-1'
	            }
	            if(d.parser.before_load_fields){
	              let before_load_fields=d.parser.before_load_fields
	              for(let f of before_load_fields){
	                if(!f.value)
	                  f.value=1
	              }
	              t.before_load_fields=before_load_fields
	              t.before_load_fields_message=d.parser.before_load_fields_message || 'Выберите значения для прододжения работы:'
	            }
	            else{
	              t.before_load_fields_selected=true
	            }

	            t.parser=d.parser
	          }
	        }
    ).catch(
            e=>{
                t.errors=[`ошибка при вызове init ${e}`]
            }
    )


}

export function select_before_field(t, field){
	console.log('t:',t,'field:',field)
	let all_selected=true
	for(let f of t.before_load_fields){
		if(!f.value){ // если хотя бы одно поле не выбрано
			all_selected=false
		}
	}
	// если все предварительные поля заполнены, то делаем активным переход к загрузке файла
	t.before_load_fields_next_show=all_selected
}


const before_load_values=(before_load_fields)=>{
	let values={}
	for(let f of before_load_fields){
		values[f.name]=f.value
	}
	return values
}
// предварительная загрузка
export function preload(t){

    t.$http.post(
      BackendBase+'/parser-excel/'+t.params.config,
      {
        action:'preload',
        src: t.src,
        orig_name:t.orig_name,
        before_load_values: before_load_values(t.before_load_fields)

      }
    ).then(
      r=>{
        let d=r.data;
        t.uploading=false;
        if(d.success){

          t.preload_data=t.normalize_preload(d.data) // нормализуем, чтобы выкинуть явный мусор из предпросмотра
          t.loaded_filename=d.loaded_filename;
          t.calc_first_header()
          t.autofill_preload()
        }
        t.errors=d.errors
      }
    ).catch(
      e=>{
        t.uploading=false;
        t.errors=[e]}
    )
}

export function load(t){

    if(!(t.parser.refs && t.parser.refs.length)){
      do_load(t)
      return
    }

    t.uploading=true;
    t.$http.post(
      BackendBase+`/parser-excel/${t.params.config}`,
      {
        action:'check_refs',
        loaded_filename:t.loaded_filename,
        data_line_number: t.data_line_number+t.cnt_rows_deleted_preview,
        fields:t.parser.fields,
        before_load_values: before_load_values(t.before_load_fields)
      }
    ).then(r=>{
      let d=r.data;
      t.uploading=false;
      if(!d.success){
        t.errors=d.errors
        return
      }
      t.refs_check=d.refs||[]
      if(refs_has_issues(t)){
        t.refs_dialog=true
        return
      }
      do_load(t)
    }).catch(e=>{
      t.uploading=false; t.errors=[e]
    })
}

export function refs_has_issues(t){
  for(let r of (t.refs_check||[])){
    if((r.missing && r.missing.length) || (r.bad_ids && r.bad_ids.length))
      return true
  }
  return false
}

export function refs_has_missing(t){
  for(let r of (t.refs_check||[])){
    if(r.missing && r.missing.length)
      return true
  }
  return false
}

export function create_and_continue(t){
  t.uploading=true;
  let chain=Promise.resolve()
  for(let r of (t.refs_check||[])){
    if(!(r.missing && r.missing.length))
      continue
    chain=chain.then(()=>t.$http.post(
      BackendBase+`/parser-excel/${t.params.config}`,
      {action:'create_refs', ref:r.key, names:r.missing}
    ).then(res=>{
      if(!res.data.success)
        throw (res.data.errors || ['не удалось создать справочник'])
    }))
  }
  chain.then(()=>{
    t.refs_dialog=false
    do_load(t)
  }).catch(e=>{
    t.uploading=false
    t.refs_dialog=false
    t.errors=Array.isArray(e)?e:[e]
  })
}

export function skip_refs(t){
  t.refs_dialog=false
  do_load(t)
}

export function do_load(t){

    t.uploading=true;
    t.$http.post(
      BackendBase+`/parser-excel/${t.params.config}`,
      {
        action:'load',
        loaded_filename:t.loaded_filename,
        data_line_number: t.data_line_number+t.cnt_rows_deleted_preview,
        fields:t.parser.fields,
        before_load_values: before_load_values(t.before_load_fields)
      }
    ).then(r=>{
      let d=r.data;

      t.uploading=false;
      if(d.success){
        t.message=d.message || '';
        t.success_parse=true;
      }
      t.errors=d.errors
    }).catch(
      e=>{
        t.uploading=false; t.errors=[e]
      }
    )
}