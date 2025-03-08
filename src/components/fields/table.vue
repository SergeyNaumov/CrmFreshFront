<template>
    <div>

        <v-simple-table>
            <template v-slot:default>
                <thead>
                    <tr>

                        <th v-for="(header,idx) in field.table.headers" >
                            <a href="" @click.prevent="go_sort(idx)" v-html="header.h"/>
                            <span style="padding-left: 8px; padding-bottom: 5px;" v-if="header.tooltip">
                                <a href="" style="text-decoration: none; " @click.prevent="show_tooltip(header.tooltip);"><v-icon style="font-size: 8pt;" small color="primary">fa fa-question</v-icon></a>
                            </span>
                            <div>
                                <a href="#" @click.prevent="go_sort(idx,'asc')" class="sort_desc"><v-icon color="green" small>keyboard_arrow_down</v-icon></a>
                                  <a href="#" @click.prevent="go_sort(idx,'desc')" class="sort_asc"><v-icon color="red" small>keyboard_arrow_up</v-icon></a>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                      v-for="(tr,idx) in field.table.data"
                      :key="'tr'+idx"
                    >  

                        <td v-for="td in tr">
                            {{td}}
                        </td>
                    </tr>
                </tbody>
            </template>
        </v-simple-table>

    </div>
</template>
<script>
    function is_Numeric(num) {
      return !isNaN(parseFloat(num)) && isFinite(num);
    }
    export default {
        props:['form','field'],

        mounted(){
            if(this.field.sort)
                this.sort=this.field.sort
            
            if(this.field.sort_desc)
                this.sort_desc=this.field.sort_desc
            
            this.sorted()  
        },
        data:function(){
           return {
            sort:1,
            sort_desc: false
           }
        },
        methods:{
            go_sort(idx,order){
                if(order=='asc'){
                    this.sort_desc=false
                }
                else if(order=='desc'){
                    this.sort_desc=true
                }
                else if(this.sort==idx){
                    this.sort_desc=!this.sort_desc 
                }
                else{
                    this.sort_desc=false
                }
                this.sort=idx
                 
                
                this.sorted()
            },
            show_tooltip(tooltip){
                window.EditForm.popup={
                    show:true,
                    header:tooltip.header,
                    body: tooltip.body
                }
            },

            sorted(){
                this.field.table.data.sort(
                                    (a,b)=>{
                                        let v1=a[this.sort], v2=b[this.sort]
                                        if(is_Numeric(v1) && is_Numeric(v2) ){
                                            v1=parseInt(v1)
                                            v2=parseInt(v2)
                                            
                                        }
                                        
                                        if(this.sort_desc){
                                            if(v1<v2){
                                                return 1
                                            }
                                        }
                                        else{
                                            if(v1>v2){
                                                return 1
                                            }
                                        }

                                        return -1
                                    }
                                )
            }
        }
    }
</script>
<style scoped>
    table th {vertical-align: top;}
    .sort_desc, .sort_asc {text-decoration: none;}
    
</style>