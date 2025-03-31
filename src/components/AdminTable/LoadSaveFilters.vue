<!--
    Компонент загрузки / сохранения фильтров
-->

<template>
    <div>
        <p><a href="" @click.prevent="dialog=true">Загрузка / сохранение фильтров</a></p>
        <v-dialog v-model="dialog" max-width="700">
          <v-card>
            <v-card-title  class="headline">Загрузка и сохрание фильтров</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12">
                    <h3>Загрузка</h3>
                </v-col>
                <template v-if=" filters_list.length">
                    <v-col cols="8">
                        <v-select 
                        
                            label="Выберите фильтр для загрузки" 
                            v-model="selected_filter"
                            :items="filters_list" item-value="v" item-text="d"
                        />
                    </v-col>
                    <v-col cols="4">
                        
                        
                        <v-btn small color="primary" v-if="selected_filter" @click="load_filter"> &nbsp;Загрузить</v-btn> &nbsp;
                        <a href="" v-if="selected_filter" @click.prevent="delete_filter(selected_filter)"><v-icon x-small color="primary">fa fa-trash</v-icon></a> 
                        <!-- <v-btn x-small color="error">Удалить</v-btn>  -->
                    </v-col>
                </template>
                <template v-else>
                    <v-col>
                    <p>Нет фильтров для загрузки, они появятся, когда Вы сохраните хотя бы один</p>
                    </v-col>
                </template>


              </v-row>

              
              <v-row style="margin-top: 80px;">
                <v-col cols="12"><h3>Сохранение</h3></v-col>
                
                <template v-if="!saved_filter_message">
                    <v-col cols="8">
                        <v-text-field v-model="name_new_filter" hide-details label="Укажите имя для нового фильтра фильтра"/>
                    </v-col>
                    <v-col cols="4">
                        <v-btn small v-if="name_new_filter" @click.prevent="save_filter"><v-icon x-small >fa fa-save</v-icon>&nbsp;Сохранить</v-btn>
                    </v-col>
                </template>
                <template v-else>
                    <v-col class="success">Фильтр под именем {{name_new_filter}} был успешно сохранён</v-col>

                </template>
              </v-row>
              
               
            </v-card-text>
          </v-card>
        </v-dialog>
        
    </div>
    
</template>
<script>
export default{
    props:['config','on_filters','filters','init_on_filters'],
    data(){
        return {
            name_new_filter:'',
            saved_filter_message:false, // если true, тогда сообщение "фильтр успешно сохранён"
            dialog:false,
            filter_list_loaded:false,
            filters_list:[],
            selected_filter:null,
            filters_for_save:[]
        }
    },
    watch:{
        dialog(){
            // при первом открытии диалога, загружаем список фильтров
            if(!this.filter_list_loaded){
                this.load_filters_list()
                this.filter_list_loaded=true
            }
        }
    },
    methods:{
        load_filters_list(){
            let t=this
            t.$http.get(`${BackendBase}/filters_load_save/${t.config}/load_filters_list`).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        t.filters_list=d.list
                    }
                }
            )
        },
        load_filter(){

            let t=this
            t.$http.get(`${BackendBase}/filters_load_save/${t.config}/load_filter/${t.selected_filter}`).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        t.init_on_filters(d.filters_data)
                        t.dialog=false
                        console.log('selected_filter:',d.filters_data)
                    }
                    
                }
            )

            

        },
        save_filter(){
            // Сохранение нового фильтра
            let t=this, filters_for_save=t.get_filters_for_save()
            this.$http.post(
                `${BackendBase}/filters_load_save/${t.config}/save_filter`,
                {
                    header: t.name_new_filter,
                    json: filters_for_save
                }
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        // включаем сообщение о сохранении
                        t.saved_filter_message=true
                        setTimeout(
                            ()=>{
                                // убираем сообщение о сохранении
                                t.saved_filter_message=false
                                t.name_new_filter=''
                            },
                            800
                        )
                        // обновляем список фильтров
                        this.load_filters_list()
                    }
                }
            )
        },
        delete_filter(id){
            let t=this
            t.$http.delete(
                `${BackendBase}/filters_load_save/${t.config}/${id}`
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        t.load_filters_list()
                        t.selected_filter=null
                    }
                }
            )
        },
        get_filters_for_save(){
            let t=this, filters_for_save=[]
            console.log(t.on_filters)
            for(let f of t.on_filters){
                filters_for_save.push({name:f.name, value:f.value, filter_order:f.filter_order})
            }
            return filters_for_save
        }
    }
}
</script>
<style scoped>
    .success {background: #fff !important; color: green; font-weight: bold;}
</style>