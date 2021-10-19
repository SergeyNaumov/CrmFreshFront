<template>
    <div :style="opt.style"> 
            <pre v-if="errors.length">
                {{errors}}
            </pre>
            <div v-if="opt.spoiler && !show" @click.prevent="show=true" class="spoiler">
                <v-btn @click.prevent="show=true" small color="primary">{{opt.spoiler}}</v-btn>

            </div>
            
            <v-dialog v-model="show" max-width="500" class="dialog">
                <v-card>
                    
                    <v-card-title  class="headline">{{opt.title}}</v-card-title>
                    <v-card-text>
                        <div class="success" v-if="success">
                            <p>Ваша заявка была успешно отправлена</p>
                            <p><v-btn small color="primary" @click="show=false; success=false">ок</v-btn></p>
                        </div>

                        <form enctype="multipart/form-data" method="post" :action="opt.url" :target="iframe_name" :id="form_id" @submit.prevent="submit" v-else> 
                            
                            <template v-for="f of fields">
                                <div v-if="f.type=='file'" class="row">
                                    <v-file-input
                                      :label="f.description"
                                      @change="attach_file(f)"
                                      :id="f.id"
                                      
                                    />
                                </div>
                                <div v-else-if="f.type=='text'" class="row">
                                    <v-text-field   :label="f.description" :name="f.name"
                                        v-model="f.value"
                                    />
                                </div>
                                <div v-else-if="f.type=='textarea'" class="row">
                                    <v-textarea :label="f.description" 
                                        v-model="f.value"
                                    />
                                </div>
                                <div class="err" v-if="form_errors[f.name]">
                                    {{form_errors[f.name]}}
                                </div>
                            </template>
                            <v-btn small @click.prevent="submit">отправить</v-btn>
                        </form>
                    </v-card-text>
                </v-card>
            </v-dialog>

        
    </div>
</template>
<script>
    
    export default {
        props:[
            'opt'
        ],
        data(){
            return {
                iframe_name:'',
                form_id:'',
                value:'',
                show:false,
                fields:[],
                success:false,
                errors:[],
                form_errors:{
                },

            }
        },
        watch:{

        },
        computed:{
            // download_link(){
            //     return this.opt.filedir.replace(/^\./,'')+'/'+this.value
            // }
        
        },
        mounted(){
            this.init()
        },
        methods:{
            init(){

                this.iframe_name='resform_'+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 4)
                this.form_id='resform_id_'+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 4)
                //this.value=opt.value
                this.fields=this.opt.fields
                this.show=this.opt.spoiler?false:true
                for(let f of this.fields){
                    if(f.type=='file'){
                        f.id='attach_'+this.opt.id+'_'+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 12)
                    }
                    //this.form_values[f.name]=''
                    
                }
            },
            attach_file(f){
                
                let file=document.getElementById(f.id).files[0]
                console.log(file)
                let reader = new FileReader();
                reader.readAsDataURL(file);
                
                reader.onload = (e) => {
                        let src=e.target.result;
                        f.value={
                            orig_name:file.name,
                            src:src
                        }

                }

                

            },
            submit(){
                let send_data={}
                for( let f of this.fields){
                    
                    send_data[f.name]=('value' in f)?f.value:''
                    
                }
                console.log('send_data:',send_data)
                this.$http.post(
                    this.opt.url,
                    send_data
                ).then(
                    r=>{
                        let d=r.data
                        this.success=d.success
                        this.errors=d.errors
                        this.form_errors=d.form_errors
                    }
                )
                //document.getElementById(this.form_id).submit()
            }
        }
    }
</script>
<style scoped>
    .row {margin-bottom: 10px; margin-top: 20px;}
    .v-dialog { background-color: #fff; }
    .spoiler {margin-bottom: 20px;}
    .err {color: red;}
    .success {
        background-color: #fff !important;
    }
</style>