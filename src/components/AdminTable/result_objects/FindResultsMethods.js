/*
  Методы для FindResults
*/
export default {
    parent_save_func(td, value){
      td.value=value;
      console.log('DT VALUE:',value)
      //change_in_search(tr,td)
    },
    parent_for_change_in_search(tr,td,value){
      //console.log([tr,td,value])
      td.value=value;
      this.change_in_search(tr,td)
    },
    sql_format(sql){ // для форматирования mysql-запроса (explain)
      if(!sql){
        return 1
      }
      sql=sql.replace(/\s\s+/gm,' ');
      sql=sql.replace(/(WHERE|FROM|GROUP\s+BY|ORDER\s+BY|LIMIT)\s+/gi,'<br>$1 ');
      sql=sql.replace(/((LEFT )?JOIN)/gim,'<br>$1');
      sql=sql.replace(/(SELECT|FROM)[^_]/gi,'$1<br>');
      sql=sql.replace(/([a-zA-Z0-9\(\)\s\._]{1,30},)/gmi,'$1 ');
      sql=sql.replace(/(([a-zA-Z0-9\(\)\s\._]{1,50},){3})/gmi,'&nbsp;&nbsp;$1<br>');
      sql=sql.replace(/(\b(SELECT|FROM|LEFT|JOIN|GROUP|ORDER|BY|ON|LIMIT|WHERE|LIKE|IN|OR|AND|NOT|as)\b)/gim,'<span style="color: blue;">$1</span>');
      return sql
    },
    toggle_memo_add(idx){
      if(this.cur_str!=idx){
        this.cur_str=idx;
        this.show_memo_form=true;
      }
      else{
        this.show_memo_form=!this.show_memo_form
      }

    },
    go_to_edit(key){
      let url=''; let config=this.results.config;
      if(this.results.card_format && this.results.card_format == 'vue'){
        url=BaseUrl+'edit_form/'+config+'/'+key
      }
      else{
        url=BaseUrl+'edit_form.pl?config='+config+'&action=edit&id='+key;
      }
      window.open(url);
    },
    delete_dialog(id){
      this.dialog=true;
      this.dialog_type='delete_dialog';
      this.delete_id=id;
      this.dialog_body='Вы действительно хотите удалить элемент?';

    },
    delete_element(){
      this.$http.get(
        BackendBase+'/delete-element/'+this.results.config+'/'+this.delete_id
      ).then(
        r=>{
          let d=r.data;

          this.dialog = false;
          this.dialog_type='';
          this.dialog_header = 'Удаление ';
          this.dialog = true;
          if(d.success){
            this.dialog_body = 'Операция прошла успешно';

            let arr=[];
            for(let tr of this.results.output){
              if(tr.key!=this.delete_id)
                arr.push(tr)
            }
            this.results.count_total--;
            this.delete_id=false;
            this.results.output=arr;
            setTimeout(()=>{
              this.dialog=false;
            },700)
          }
          else{
            this.dialog_body = 'При удалении возникли ошибки';
            this.errors=d.errors

          }
          this.log=d.log
        }
      );
    },
    change_in_search(tr,td){
      if(td.before_saved){
        return
      }
      td.before_saved=true;
      setTimeout(
        ()=>{td.before_saved=false;},
        600
      );

      setTimeout(
        ()=>{
          if(td.before_saved==false)
            this.save_in_search(tr,td);
        },601
      );

    },
    get_field_by_name(name){

      let fields=this.results.query_fields;
      if(!fields.length){
        return
      }
      for(let f of fields){
        if(f.name==name)
          return f
      }
    },
    save_in_search(tr,td){
      let v=td.value;

      let form_id=tr.key;

      if(td.type=='checkbox')
        v=v?1:0

      let values={}; values[td.name]=v;

      let url=BackendBase+'/edit-form/'+this.results.config+'/'+form_id;
      this.$http.post(url,{
        id:form_id,
        action:'update',
        values:values
      }).then(response=>{
            let R=response.data;

            if(R.success){
              let sav=document.getElementById(td.name+'_'+tr.key)
              sav.innerHTML='Сохранено';
              setTimeout(function(){sav.innerHTML='';},500);
            }
            if(R.errors.length){
              let err=document.getElementById(td.name+'_'+tr.key+'_err');
              err.innerHTML=R.errors.join('<br>');
              setTimeout(()=>{err.innerHTML='';},1500);
            }
      });
    },
    edit_link(tr){


        return BaseUrl+'edit_form/'+this.results.config+'/'+tr.key
    },
    results_update(){
      this.go_search(this.page,this.last_search_params);
    },
    select_all_result(v){ // выбрать все записи из поиска на тек. странице
        let t=this
        if(!v){
          t.selected_ids={}
        }
        if(!t.results || !t.results.output){
          return
        }
        for(let tr of t.results.output){
            t.selected_ids[tr.key]=v
        }

        t.$nextTick(()=>{t.change_selected_ids=Math.random()})

    },

}