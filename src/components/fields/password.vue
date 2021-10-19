<template>
    <div>

        <div class="success" v-if="success">
            пароль успешно изменён
        </div>
        <errors :errors="errors"/>

        <div>
            <template v-if="form.read_only || field.read_only">
                [доступ к изменению Вам запрещён]
            </template>
            <!--
            <template v-else-if="!form.id">
                [пароль возможно изменить только после создания основной карты]
            </template>
            -->
            <template v-else>
                <template v-if="!process_change"> <!-- вид, пока не начали менять пароль -->
                    <a href="" @click.prevent="process_change=true" >
                        {{form.id?'изменить':'задать'}}
                    </a>
                </template>
                <template v-if="process_change">
                    <!-- начали генерировать пароль -->
                    <v-text-field :label="new_password?'Вы задали пароль:':'введите или сгенерируйте новый пароль'" v-model="new_password" hide-details/>
                    <div>
                        <small>
                            <a href="" @click.prevent="generate_new_pas()">сгенерировать</a>
                        
                            <template v-if="new_password.length>=min_length">
                                <span v-for="(m,idx) in field.methods_send" :key="'send_'+idx"> 
                                <template v-if="!(form.action=='new')">
                                    | <a href="" @click.prevent="save(idx)">{{m.description}}</a>
                                </template>
                                </span>
                            </template>
                            
                                | <a href="" style="color: red;"@click.prevent="new_password='' ; process_change=false">X</a>
                            
                        </small>

                    </div>

                    <template v-if="new_password.length<min_length">
                        <p style="color: red;">минимальная длина пароля {{min_length}} символов</p>
                    </template>
                </template>
                
                
            </template>

            

        </div>
       

    </div>
</template>

<script>
  import { bus } from '../../main'
  import { gen_pas }  from '../../js/check_func.js'
  export default {
    data:function(){
        return {
            process_change:false, // начинаем менять пароль
            new_password:'',
            min_length:6,
            errors:[],
            success:false

        }
    },
    props:['form','field'],
    watch:{
       new_password(){
           if(!this.form.id){ // если это новая карта -- закидываем в values
                let field=this.field
                field.value=this.new_password
                bus.$emit('change_field', field)
           }
       } 
    },
    created(){   
        if(this.field.min_length)
            this.min_length=this.field.min_length
        else
            this.min_length=6

        // для новой карты задаём пароль сразу
        if(!this.form.id)
            this.process_change=true
    },
    mounted(){

    },
    computed:{


    },
    methods: {
        generate_new_pas(){
            /*let key='';

            
            let symbols=this.field.symbols?this.field.symbols:'123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

            let lensym=symbols.length;
            for(let k=0;k<=l;k++){
                key+=symbols[parseInt(Math.random()*lensym)];
            }
            this.new_password=key;*/
            //let symbold=this.field.symbols?this.field.symbols:'123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
            let l=this.field.generate_len_pas;
            if(!l)
                l=this.min_length;
            this.new_password=gen_pas(l,this.field.symbols)
        },
        save(method_send){
            this.$http.post(
                BackendBase+'/password/'+this.form.config+'/'+this.field.name+'/'+this.form.id,
                {
                    action:'change',
                    new_password: this.new_password,
                    method_send:method_send
                }
            ).then(
                response=>{
                    let D=response.data;
                    if(D.success){
                        this.success=true;
                        this.process_change=false;
                        this.new_password=''
                    }
                    this.errors=D.errors;
                    setTimeout(
                        ()=>{
                            this.success=false;
                            this.errors=[];
                            
                        },
                        1000
                    )

                }
            ).catch(

            )
        },

    }
  }
</script>
<style scoped>
    .error_list {border: 1px solid gray; margin: 1rem; padding: 1rem}
    .error_list .err {color: red; font-weight: bold;}
    .v-application .success {
        background-color: #ffffff !important;
        color: #4caf50 !important;
        font-weight: bold;
    }
    a {font-size: 12px;}
</style>
