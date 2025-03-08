<template>
    <span>  
        
        <template v-if="1">
            <template v-if="/^(textarea|text)$/.test(cur_field.type)">
                <field-text :refresh="cur_refresh" :field="cur_field" :parent="parent_sub"></field-text>
            </template>
            <field-checkbox v-if="/^(checkbox|switch)$/.test(cur_field.type)" :field="cur_field" :parent="parent_sub" />
        </template>
        <template v-if="cur_field.after_html">
            {{cur_field.after_html}}
        </template>
        <div class="saved" v-show="view_saved" style="position: relative; top: 0px;">
            <v-icon small color="green" >fa fa-save</v-icon>
        </div>
        <div class="errors">
            <div v-for="(e,idx) in errors" :key="'error'+idx">{{e}}</div>
        </div>

    </span>
</template>
<script>

let go_save=0;
export default {
    name:'change_in_slide',
    props:["form","field","name","field","cur_id","values","refresh"],

    computed:{
        value_for_parent(){
            return '1_to_m:'+this.field.name+':'+this.name+':'+this.cur_id
        },
        id_for_saved(){
            return '1_to_m_'+this.field.name+'_'+this.name+'_'+this.cur_id
        }
    },
    created(){
        this.update_cur_value();
        this.$bus.$on(
            '1_to_m:change_in_slide:'+this.field.name+':'+this.name+':'+this.cur_id,
            data=>{

                if(data.errors)
                    this.errors=data.errors

                if(data.save_ok){ // показываем сообщение, что сохранено
                    this.errors=[];
                    this.view_saved=true;
                    setTimeout(()=>{this.view_saved=false},500)
                }

            }
        )
    },
    watch:{
        refresh(){            
            this.update_cur_value();
        }
    },
    data:function(){
        return {
            cur_field:{
                value:''
            },
            errors:[],
            cur_refresh:0,
            view_saved:false,
        }
    },
    methods:{
        update_cur_value(){ // если обновили через форму 1_to_m, то без этого не подтягивается
            let cur_field={};
            for(let f of this.field.fields)
                if(f.name == this.name){
                    
                    for(let k in f){
                        this.cur_field[k]=f[k];
                    }
                    
                    this.cur_field.value=this.values[this.name];
                    
                }
            this.cur_refresh++;
        },
        parent_sub(obj){
            let value=obj.value
            if(obj.error) return;
            
            if(/^(checkbox|switch)$/.test(this.type)){
                value=value?1:0;
            }
            this.cur_field.value=value;
            go_save++;
            setTimeout(
              ()=>{
                    go_save--;
                    if(go_save==0){
                        this.$bus.$emit('save_field_1_to_m',{
                            field:this.field.name,
                            subfield:this.name,
                            id:this.cur_id,
                            value:value
                        })
                  }
              },
              400 // интервал сохранения
            );
          
        }
    }
}
</script>
<style scoped>
    .errors {color: red;}
</style>