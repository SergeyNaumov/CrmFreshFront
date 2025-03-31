<template>

    <!-- Карта для slide:list-->
    <v-card class="one_to_m one_to_m_list flex-grow-1 " :key="v.id">
    <!-- Перебор заголовков 
        v -- это элемент списка list 
        h -- заголовок
    -->
                    
                     
        <div v-for="(h, hidx) in field.headers" :key="hidx">
                <div v-if="v[h.name] " class="mt-1">
                    <template v-if="h.change_in_slide">
                            <change_in_slide
                                :refresh="cur_refresh"
                                :form="form"
                                :field="field"
                                :name="h.name"
                                :cur_id="v.id"
                                :values="v"
                            />
                    </template>
                    
                    <template v-else>
                        <span class="h">{{ h.description }}:</span>
                        <template v-if="h.type === 'file'">
                            <span v-html="download_file_block(h, ch_id(v), v[h.name + '_filename'], v)"></span>
                            <template v-if="field.headers.length > 1">    
                                <a
                                    v-if="v[h.name + '_filename'] && !child_field_read_only(h.name)"
                                    href=""
                                    @click.prevent="del_file(h.name, ch_id(v))"
                                >
                                    Удалить
                                </a>
                            </template>
                        </template>
                        
                        <template v-else>

                            <template v-if="h.type === 'text' && h.subtype === 'color'">
                                    <div
                                        class="color_squire"
                                        :style="{ 'background-color': get_value_for_slide(h, v) }"
                                    ></div>
                                    </template>
                                    <template v-else-if="h.type === 'text' && h.subtype">
                                        <template v-if="h.subtype === 'qr_call'">
                                            <qr_call
                                                :value="get_value_for_slide(h, v)"
                                                :field="h"
                                                :for_slide="true" 
                                            />
                                        </template>
                                        <template v-else-if="h.subtype === 'email'">
                                            <email :value="get_value_for_slide(h, v)" :field="h" :for_slide="true" />
                                        </template>
                                    </template>
                                    <div class="inline" v-else v-html="get_value_for_slide(h, v)">
                                    </div>
                        </template>
                    </template>
                            
                </div>
                        
        </div>
        <v-card-actions style="margin-top: auto;">
            <v-icon size="small" class="edit" color="primary" v-if="!field.read_only" @click="open_edit_dialog(v)">
            mdi-pencil
            </v-icon>
            <v-icon size="small" color="primary" v-if="make_delete" @click="del(v)">
            mdi-delete
            </v-icon>
        </v-card-actions>
    </v-card>

</template>
<script>
import ChangeInSlide from './ChangeInSlide';
export default{
    props: ['v','h','field','open_edit_dialog','del','make_delete', 'get_value_for_slide'],
    components:{
        'change_in_slide': ChangeInSlide,
    },
    created(){
        let t=this
        // for(let f of t.field.fields){
        //     console.log('f:',f)
        //     t['fields'][f.name]=true
        // }
        
    },
    data(){
        return {
            'fields':{}
        }
    },
    methods:{
        // get_value_for_slide(h,values){
        //   console.log('get_value_for_slide:',h,values)
        //     let type=h.type;
        //     let name=h.name;
        //     let value=values[name];
        //     if(type=='text' || type=='textarea' || type=='wysiwyg'){
        //         return value
        //     }
        //     else if(type=='checkbox' || type=='switch'){
        //         return parseInt(value)?'да':'нет'
        //     }
        //     else{
        //         if(type=='select_from_table' || type=='select_values'){
        //             let cf=this.get_field_by_name(name);
        //             if(!cf)
        //                 return 'не найдено поле '+name
        //             return this.get_header_from_select(cf,value)
        //         }
        //     }
        //},
    }
}
</script>
<style scoped>
.v-card {
    margin-right: 20px;
    width: 100%;
    background-color: #fff;
}

@media (max-width: 768px) {
  .v-card {
    width: 100%; /* 1 карточка в ряду на маленьких экранах */
  }
}
</style>