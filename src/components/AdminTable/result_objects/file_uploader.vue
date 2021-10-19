<template>
    <div>
            <pre v-if="errors.length">
                {{errors}}
            </pre>
            <div v-if="value">
                {{value}} <a :href="download_link" target="_blank">скачать</a>
            </div>
            <input type="file" @change="upload()" :id="this.id">
        
    </div>
</template>
<script>
    
    export default {
        props:[
            'opt'
        ],
        data(){
            return {
                value:'',
                errors:[],
                id:''
            }
        },
        computed:{
            download_link(){
                return this.opt.filedir.replace(/^\./,'')+'/'+this.value
            }
        
        },
        mounted(){
            this.id='result_uploader_'+this.opt.id+'_'+Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5)
            this.value=opt.value
        },
        methods:{
            upload(){
                let f=document.getElementById(this.id).files[0]
                
                let reader = new FileReader();
                    reader.readAsDataURL(f);
                    reader.onload = (e) => {
                        let src=e.target.result;
                        this.$http.post(
                            BackendBase+'/edit-form/'+this.opt.config+'/'+this.opt.id,
                            {
                              action:'upload_file',
                              name: this.opt.name,
                              value:{
                                orig_name: f.name,
                                src:src
                              },
                            }
                        ).then(
                            r=>{
                              let R=r.data;
                              this.errors=R.errors;
                              if(R.success){
                                this.value=R.value
                              }
                            }
                        )
            }
            }
        }
    }
</script>
<style scoped>
</style>