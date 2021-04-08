<template>
    <div>
        <div class="new">
            <v-icon small color="primary" @click="show=!show">fa-plus</v-icon>
            &nbsp;<a href="" @click.prevent="show=!show" target="_blank">новый пакет документов</a>
        </div>
        <v-card v-if="show">
            <v-card-title>Новый пакет документов</v-card-title>
            <!-- <div v-if="success" class="success">
                <p>Пакет документов успешно создан </p>
                <v-btn v-if="form_ok" color="primary" small @click="success=false">Ок</v-btn>
            </div> -->
             <v-select
                label="Тариф"
                v-model="tarif_id"
                :items="tarif_list"
                item-value="v"
                item-text="d"
             />
             <v-select
                label="Юр.лицо"
                v-model="ur_lico_id"
                :items="ur_lico_list"
                item-value="v"
                item-text="d"
             />
             <v-select
                v-if="need_manager_field"
                label="Менеджер"
                v-model="manager_id"
                :items="manager_list"
                item-value="v"
                item-text="d"
             />
             
             <div class="err" v-for="e in errors" :key="e">{{e}}</div>
             <v-btn v-if="form_ok" color="primary" small @click="save">Сохранить</v-btn>

        </v-card>
    </div>
</template>

<script>
  
  export default {
    data:function(){
        return {
            tarif_list:[],
            ur_lico_list: [],
            manager_list:[],
            cur_manager_id:0,
            manager_id:0,
            tarif_id: 0,
            ur_lico_id: 0,
            need_manager_field:false,
            show: false,
            success:false,
            errors:['djkksjkjs']
        }
    },
    props:['field','form','refresh_docpack_list'], 
    computed:{
        form_ok(){
            return this.tarif_id>0 && this.ur_lico_id>0
        }
    },
    watch:{
        show(v){
            if(v)
                this.init()
        }
    },
    created(){
        //this.init()
    },

    methods: {
        init(){
            if(!this.form.id) return
            this.$http.post(
                BackendBase+'/docpack/'+this.form.config+'/'+this.field.name,
                {
                    id:this.form.id,
                    action:'init_new_docpack_form'
                }
            ).then(
                r=>{
                    let d=r.data;
                    this.errors=d.errors
                    //console.log({errors:d.errors,d});
                    if(d.success){
                        this.ur_lico_list=d.ur_lico_list, this.tarif_list=d.tarif_list,
                        this.manager_id=d.cur_manager_id, this.cur_manager_id=d.cur_manager_id,
                        this.need_manager_field=d.need_manager_field,
                        this.manager_list=d.manager_list
                    }
                    
                }
            )
        },
        save(){
            this.$http.post(
                BackendBase+'/docpack/'+this.form.config+'/'+this.field.name,
                {
                    id:this.form.id,
                    action:'create_docpack',
                    manager_id:this.manager_id,
                    tarif_id:this.tarif_id,
                    ur_lico_id:this.ur_lico_id
                }
            ).then(
                r=>{
                    let d=r.data;
                    this.errors=d.errors
                    if(d.success){
                        this.success=true;
                        this.refresh_docpack_list();
                        this.manager_id=this.cur_manager_id,
                        this.ur_lico_id=0; this.tarif_id=0;
                        this.show=false;
                    }
                    
                }
            )
        }
    }
}
</script>
<style scoped lang="scss">
    @import '@/styles/variables.scss';
    .v-card {padding: 10px;}
    
</style>
