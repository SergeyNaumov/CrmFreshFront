(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-67c5d9d3"],{1005:function(t,i,e){},"439e":function(t,i,e){},7557:function(t,i,e){},b45c:function(t,i,e){"use strict";var s=e("439e"),a=e.n(s);a.a},d4d9:function(t,i,e){"use strict";var s=e("1005"),a=e.n(s);a.a},d504:function(t,i,e){"use strict";e.r(i);var s=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("div",[e("v-dialog",{staticStyle:{"min-height":"100px",width:"800px"},model:{value:t.dialog,callback:function(i){t.dialog=i},expression:"dialog"}},[e("v-card",[t._v("\n            "+t._s(t.errors)+"\n            "),t._l(t.errors,(function(i,s){return e("div",{key:s,staticClass:"err"},[t._v(t._s(i))])}))],2)],1),e("docpack_new",{attrs:{form:this.form,field:this.field,refresh_docpack_list:t.load}}),t._e(),t._l(t.list,(function(i){return e("v-card",{key:i.id,staticClass:"one_to_m"},[0==i.cnt_bill?e("div",[t._v("\n            пакет документов не содержит счетов, его можно\n            "),e("a",{attrs:{href:""},on:{click:function(e){return e.preventDefault(),t.remove(i)}}},[t._v("удалить")])]):t._e(),e("v-list-item",[e("v-list-item-content",[e("div",[e("v-icon",{attrs:{small:"",color:"primary"}},[t._v("edit")]),e("a",{attrs:{href:"/edit_form/docpack/"+i.id,target:"_blank"}},[t._v("Редактировать пакет документов")])],1),e("div",[t._v("Тариф: "),e("a",{attrs:{href:"/edit_form/tarif/"+i.tarif_id,target:"_blank"}},[t._v(t._s(i.tarif))])]),e("div",[t._v("Юр.лицо: "),e("a",{attrs:{href:"/edit_form/ur_lico/"+i.ur_lico_id,target:"_blank"}},[t._v(t._s(i.ur_lico))])]),e("div",[t._v("Менеджер: "+t._s(i.manager)+" / "+t._s(i.registered))]),t._l(i.dogovor_list,(function(s){return e("dogovor",{key:s.id,attrs:{field:t.field,dogovor:s,config:t.form.config,form:t.form,docpack:i,permissions:t.permissions}})}))],2)],1)],1)}))],2)},a=[],r=(e("56d7"),function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("div",[e("v-icon",{attrs:{small:"",color:"$color.primary"},on:{click:function(i){t.show=!t.show}}},[t.show?[t._v("fa-minus")]:[t._v("fa-plus")]],2),e("a",{attrs:{href:""},on:{click:function(i){i.preventDefault(),t.show=!t.show}}},[t._v("Договор №"+t._s(t.dogovor.number)+" от "+t._s(t.dogovor.registered))]),t.show?[e("div",[t._v("\n            с печатями: "),e("a",{attrs:{href:t.load_dog_link("doc")}},[t._v("doc")]),t._v(" |\n            "),e("a",{attrs:{href:t.load_dog_link("pdf")}},[t._v("pdf")])]),e("div",[t._v("\n            без печатей: "),e("a",{attrs:{href:t.load_dog_link("doc",1)}},[t._v("doc")]),t._v(" |\n            "),e("a",{attrs:{href:t.load_dog_link("pdf",1)}},[t._v("pdf")])]),e("v-card",{staticClass:"new_bill"},[t.show_new_bill_form?[e("v-card-title",{on:{click:function(i){t.show_new_bill_form=!1}}},[t._v("Новый счёт")]),parseInt(t.docpack.make_new_bill)?[t.success?e("div",{staticClass:"success"},[t._v("\n                        Счёт был успешно добавлен. "),e("a",{attrs:{href:""},on:{click:function(i){i.preventDefault(),t.success=!1}}},[e("b",[t._v("добавить ещё")])])]):[e("v-text-field",{staticStyle:{"max-width":"100px"},attrs:{autofocus:"",label:"укажите сумму"},model:{value:t.new_summ,callback:function(i){t.new_summ=i},expression:"new_summ"}}),t.new_summ>0&&!t.show_comment?e("a",{attrs:{href:""},on:{click:function(i){i.preventDefault(),t.show_comment=!0}}},[t._v("нужен комментарий?")]):t._e(),t.show_comment?e("v-textarea",{attrs:{label:"теперь можете ввести комментарий к счёту","auto-grow":"",autofocus:"",rows:"1"},model:{value:t.new_comment,callback:function(i){t.new_comment=i},expression:"new_comment"}}):t._e(),t._l(t.errors,(function(i,s){return e("div",{key:"e"+s},[t._v(t._s(i))])})),t.new_summ>0&&t.new_summ_ok?e("v-btn",{attrs:{small:"",color:"primary"},on:{click:t.create_bill}},[t._v("создать счёт")]):t._e(),t.new_summ_ok?t._e():e("div",{staticClass:"err"},[t._v("\n                            сумма указана не корректно\n                        ")])]]:e("div",{staticClass:"err"},[t._v("\n                    Вам запрещено создавать счета\n                ")])]:e("a",{attrs:{href:""},on:{click:function(i){i.preventDefault(),t.show_new_bill_form=!0}}},[t._v(" новый счёт")])],2),t._l(t.bills,(function(i){return e("v-card",{key:i.id},[e("v-card-title",[t._v("Счёт №"+t._s(i.number)+" от "+t._s(i.registered)+" | "),e("a",{attrs:{href:"/edit_form/bill/"+i.id,target:"_blank"}},[t._v("к счёту")])]),e("div",[e("b",[t._v("Сумма:")]),t._v(" "+t._s(i.summ))]),e("div",[e("b",[t._v("Комментарий:")]),t._v(" "+t._s(i.comment))]),e("div",[e("a",{attrs:{href:"/backend/load_document?doc_pack_id="+t.docpack.id+"&bill_id="+i.id+"&format=doc&type=paid"}},[t._v("платёжка (для частного лица)")])]),e("div",[t._v("\n                с печатями: "),e("a",{attrs:{href:t.load_bill_link(i,"doc")}},[t._v("doc")]),t._v(" |\n                "),e("a",{attrs:{href:t.load_bill_link(i,"pdf")}},[t._v("pdf")])]),e("div",[t._v("\n                без печатей: "),e("a",{attrs:{href:t.load_bill_link(i,"doc",1)}},[t._v("doc")]),t._v(" |\n                "),e("a",{attrs:{href:t.load_bill_link(i,"pdf",1)}},[t._v("pdf")])]),parseInt(i.paid)?[e("div",[e("b",[t._v("дата оплаты:")]),t._v(" "+t._s(i.paid_date))]),e("div",[e("b",[t._v("оплачен до:")]),t._v("  "+t._s(i.paid_to))])]:e("div",{staticClass:"not_paid"},[t._v("не оплачен")])],2)}))]:t._e()],2)}),o=[],n={data:function(){return{show:!1,bills:[],errors:[],show_comment:!1,new_summ:0,new_comment:"",errors:[],success:!1,show_new_bill_form:!1}},props:["docpack","dogovor","config","field","form"],watch:{show(t){t&&!this.bills.length&&this.load()},new_summ(t){this.new_summ_ok||(t=t.replace(/,/g,"."),t=t.replace(/[^\.\d]+/g,""),t=t.replace(/\.\.+/g,"."),t=t.replace(/^\d+.\d+\..*$/g,"$1$2"),t=t.replace(/(.\d{2})\d+$/g,"$1"),this.$nextTick(()=>{this.new_summ=t})),/^0+([1-9])/.test(t)&&(t=t.replace(/^0+([1-9])/,"$1"),this.$nextTick(()=>{this.new_summ=t}))}},created(){},computed:{new_summ_ok(){return/^\d+(\.\d+)?$/.test(this.new_summ)}},methods:{load_bill_link(t,i,e){return"/backend/load_document?doc_pack_id="+this.docpack.id+"&bill_id="+t.id+"&format="+i+"&type=bill"+(e?"&without_print=1":"")},load_dog_link(t,i){return"/backend/load_document?doc_pack_id="+this.docpack.id+"&format="+t+"&type=dogovor"+(i?"&without_print=1":"")},load(){this.$http.post(BackendBase+"/docpack/"+this.config+"/"+this.field.name,{action:"get_bills",id:this.form.id,dogovor_id:this.dogovor.docpack_id}).then(t=>{let i=t.data;i.success&&(this.bills=i.list),this.errors=i.errors})},create_bill(){this.$http.post(BackendBase+"/docpack/"+this.config+"/"+this.field.name,{action:"create_bill",dogovor_id:this.dogovor.docpack_id,summ:this.new_summ,comment:this.new_comment,id:this.form.id}).then(t=>{let i=t.data;i.success&&(this.new_summ="0",this.new_comment="",this.show_comment=!1,this.success=!0,this.load())})}}},c=n,d=(e("b45c"),e("2877")),_=e("6544"),l=e.n(_),m=e("8336"),f=e("b0af"),h=e("99d9"),u=e("132d"),v=e("8654"),p=e("a844"),k=Object(d["a"])(c,r,o,!1,null,"2bef645e",null),g=k.exports;l()(k,{VBtn:m["a"],VCard:f["a"],VCardTitle:h["c"],VIcon:u["a"],VTextField:v["a"],VTextarea:p["a"]});var w=function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("div",[e("div",{staticClass:"new"},[e("v-icon",{attrs:{small:"",color:"primary"},on:{click:function(i){t.show=!t.show}}},[t._v("fa-plus")]),t._v("\n         "),e("a",{attrs:{href:"",target:"_blank"},on:{click:function(i){i.preventDefault(),t.show=!t.show}}},[t._v("новый пакет документов")])],1),t.show?e("v-card",[e("v-card-title",[t._v("Новый пакет документов")]),e("v-select",{attrs:{label:"Тариф",items:t.tarif_list,"item-value":"v","item-text":"d"},model:{value:t.tarif_id,callback:function(i){t.tarif_id=i},expression:"tarif_id"}}),e("v-select",{attrs:{label:"Юр.лицо",items:t.ur_lico_list,"item-value":"v","item-text":"d"},model:{value:t.ur_lico_id,callback:function(i){t.ur_lico_id=i},expression:"ur_lico_id"}}),t.need_manager_field?e("v-select",{attrs:{label:"Менеджер",items:t.manager_list,"item-value":"v","item-text":"d"},model:{value:t.manager_id,callback:function(i){t.manager_id=i},expression:"manager_id"}}):t._e(),t._l(t.errors,(function(i){return e("div",{key:i,staticClass:"err"},[t._v(t._s(i))])})),t.form_ok?e("v-btn",{attrs:{color:"primary",small:""},on:{click:t.save}},[t._v("Сохранить")]):t._e()],2):t._e()],1)},b=[],x={data:function(){return{tarif_list:[],ur_lico_list:[],manager_list:[],cur_manager_id:0,manager_id:0,tarif_id:0,ur_lico_id:0,need_manager_field:!1,show:!1,success:!1,errors:["djkksjkjs"]}},props:["field","form","refresh_docpack_list"],computed:{form_ok(){return this.tarif_id>0&&this.ur_lico_id>0}},watch:{show(t){t&&this.init()}},created(){},methods:{init(){this.form.id&&this.$http.post(BackendBase+"/docpack/"+this.form.config+"/"+this.field.name,{id:this.form.id,action:"init_new_docpack_form"}).then(t=>{let i=t.data;this.errors=i.errors,i.success&&(this.ur_lico_list=i.ur_lico_list,this.tarif_list=i.tarif_list,this.manager_id=i.cur_manager_id,this.cur_manager_id=i.cur_manager_id,this.need_manager_field=i.need_manager_field,this.manager_list=i.manager_list)})},save(){this.$http.post(BackendBase+"/docpack/"+this.form.config+"/"+this.field.name,{id:this.form.id,action:"create_docpack",manager_id:this.manager_id,tarif_id:this.tarif_id,ur_lico_id:this.ur_lico_id}).then(t=>{let i=t.data;this.errors=i.errors,i.success&&(this.success=!0,this.refresh_docpack_list(),this.manager_id=this.cur_manager_id,this.ur_lico_id=0,this.tarif_id=0,this.show=!1)})}}},$=x,y=(e("da136"),e("b974")),V=Object(d["a"])($,w,b,!1,null,"7cefdc45",null),C=V.exports;l()(V,{VBtn:m["a"],VCard:f["a"],VCardTitle:h["c"],VIcon:u["a"],VSelect:y["a"]});var B={components:{dogovor:g,docpack_new:C},data:function(){return{list:[],errors:[],permissions:{},dialog:!1}},props:["form","field","parent","refresh"],created(){this.form.id&&this.load()},computed:{},methods:{load(){this.$http.post(BackendBase+"/docpack/"+this.form.config+"/"+this.field.name,{action:"list",id:this.form.id}).then(t=>{let i=t.data;if(i.success){for(let t of i.list)t.dogovor_list_show=!1;this.list=i.list,this.permissions=i.permissions}this.errors=i.errors})},remove(t){this.$http.post(BackendBase+"/docpack/"+this.form.config+"/"+this.field.name,{action:"docpack_delete",id:this.form.id,docpack_id:t.id}).then(i=>{let e=i.data;if(e.success){let i=[];for(let e of this.list)e.id!=t.id&&i.push(e);this.list=i}this.errors=e.errors,e.errors.length&&(this.dialog=!0)})},to_docpack_edit(t){window.open("/edit_form/docpack/"+t,"_blank")}}},D=B,I=(e("d4d9"),e("169a")),j=e("da13"),T=e("5d23"),E=Object(d["a"])(D,s,a,!1,null,"287fee78",null);i["default"]=E.exports;l()(E,{VCard:f["a"],VDialog:I["a"],VIcon:u["a"],VListItem:j["a"],VListItemContent:T["a"]})},da136:function(t,i,e){"use strict";var s=e("7557"),a=e.n(s);a.a}}]);
//# sourceMappingURL=chunk-67c5d9d3.ec2ee3e9.js.map