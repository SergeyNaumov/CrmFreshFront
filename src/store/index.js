// store.js или store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    // глобальное состояние
    manager:{}, // менеджер, от которого ведётся работа
    
    // для EditForm
    refresh:0,
    form: {
       id:'',
       title:'',
       read_only:false,
       fields:[],
       config:'',
    },
    fields:{},
    values: {}, // поля формы (для edit_form)
    one_to_m:{
      /* [name]: {
        dialog: false, // диалоговое окно формы
        fields:{} // поля формы добавления / редактирования
        form_values: {} // значения полей формы добавления / редактирования
      }
      */
    },
    // для AdminTree
    tree:[] 

    // для AdminTable
  },
  mutations: {
    set_field(state,field){
        state.fields[field.name]=field
    },
    set_form(state,form){
        state.form=form
    },
    set_values(state,values){
        state.values=values
    },
    set_fields(state,fields){
      state.fields=fields
    },
    update_field(state,field){
      state.fields[field.name]=field
    },
    get_field_value(state,name){
        return state.values[name]
    },
    one_to_m_updateList(state, obj ){
      // обновляем значения слайда (при сортировке)
      console.log('new_list:', obj)
      state.one_to_m[obj.name].values=obj.value
    },

  },
  actions: {

    // асинхронные операции
    // async fetchUser({ commit }) {
    //   const response = await fetch('/api/user')
    //   const user = await response.json()
    //   commit('setUser', user)
    // }
  },
  getters: {
    // вычисляемые свойства
    // doubleCount(state) {
    //   return state.count * 2
    // }
  }
})