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
        t.success_parse=true;
      }
      t.errors=d.errors
    }).catch(
      e=>{
        t.uploading=false; t.errors=[e]
      }
    )
}