<template>
    <div>

        <errors :errors="errors"/>
        <component v-if="ready" :is="object"></component>
    </div>
    
</template>
<script>
let component=''
const load_file=(file,type)=>{

}
export default {
    props:['form','field'],
    created(){

        this.load_template()
    },
    data(){
        return {
            errors:[],
            ready:false,
            object:false,
            template:false,
            methods:false
        }
    },
    methods:{
        load_template(){
            console.log('load_template: ',this.field.template)
            if(this.field.template){
                this.load_file('template', ()=>{
                    this.load_methods()
                }) 
            }
            else{
                this.load_methods()
            }
            
        },
        load_methods(){
            console.log('load_methods')
            
            if(this.field.methods){
                this.load_file('methods', ()=>{
                    this.load_object()
                }) 
            }
            else{
                this.load_object()
            }
        },
        load_object(){
            console.log('load_object')
            if(this.field.object){
                this.load_file('object', ()=>{
                    // компонент загружен последним, поэтому если он загружен, то всё готово
                    
                    if(this.template){
                        this.object.template=this.template
                    }
                    if(this.methods){
                        this.object.methods=this.methods
                    }
                    this.ready=true
                })
            }
            
            this.ready=true
                        
        },


        load_file(type, loopback){
            console.log('load_file: ',type)
            let t=this, field=t.field
            let load_url=''
            
            t.$http.get(field[type]).then(
                r=>{
                    console.log('loaded:',type, r.data)
                    let obj
                    if(type=='template'){
                        obj=r.data
                    }
                    else{
                        eval(`obj=${r.data}`)
                        
                    }
                    console.log('obj:',obj)
                    t[type]=obj
                    loopback()
                }
            ).catch(
                e=>{
                    t.errors=['Ошибка при загрузке '+type+': '+e]
                }
            )
        },
        

    },
    computed:{

    }
}
</script>
