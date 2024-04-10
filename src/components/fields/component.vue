<template>
    <div>
        <pre v-if="field.name=='default_component'">
            {{field}}
        </pre>
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
            //console.log('load_template: ',this.field.template)
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
            //console.log('load_methods')
            
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
            let t=this
            if(t.field.object){
                t.load_file('object', ()=>{
                    // компонент загружен последним, поэтому если он загружен, то всё готово
                    if(t.field.data && typeof(t.field.data)=='object'){
                        let object_data=t.object.data()

                        for(let k in t.field.data){
                            object_data[k]=t.field.data[k]
                        }
                        t.object.data=()=>{
                            return object_data
                        }

                    }

                    if(t.template){
                        t.object.template=t.template
                    }
                    if(t.methods){
                        t.object.methods=t.methods
                    }
                    t.ready=true
                })
            }
            
            t.ready=true
                        
        },


        load_file(type, loopback){
            //console.log('load_file: ',type)
            let t=this, field=t.field
            let load_url=''
            
            t.$http.get(field[type]).then(
                r=>{
                    //console.log('loaded:',type, r.data)
                    let obj
                    if(type=='template'){
                        obj=r.data
                    }
                    else{
                        try {
                            eval(`obj=${r.data}`)
                        }
                        catch (e){
                            console.error(`Ошибка при загрузке компонента ${t.field.name}: ${e}`);
                        }
                        
                    }
                    //console.log('obj:',obj)
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
