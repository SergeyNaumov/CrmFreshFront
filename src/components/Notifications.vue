<template>
    <div>
        
    <v-expansion-panels>
        <v-expansion-panel>
            <v-expansion-panel-header>
                <v-card-title>
                    Сообщения от системы<v-badge color="red" v-if="not_read" :content="not_read" ></v-badge>
                    
                </v-card-title>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
                <v-dialog v-model="dialog">
                    <v-card v-if="message">
                        <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn
                                color="green darken-1"
                                text
                                @click="set_readed(message,0); dialog=false"
                            >
                                Сделать не прочитанным
                            </v-btn>
                            <v-btn color="primary" text @click="dialog = false">
                                Закрыть
                            </v-btn>
                        </v-card-actions>
                        <v-card-text >
                            <div><b>Кому:</b> {{ message.to_addr }}</div>
                            <div><b>Тема:</b> {{ message.subject }}</div>
                            <hr>
                            <div v-html="message.message"></div>
                        </v-card-text>

                    </v-card>
                </v-dialog>
                <div class="search-panel" >
                    <v-icon color="primary" style="width: 50px;">fa fa-search</v-icon>
                    <input type="text" v-model="search">
                </div>
                <table>
                    <tr v-for="l in filtered_list" :class="{'not_read':!readed[l.id]}">
                        <td nowrap>{{ show_date(l.registered) }}</td>
                        <td class="sbj">
                           <a href="" @click.prevent="show_message(l)">{{ l.subject }}</a>
                        </td>
                    </tr>
                </table>

            </v-expansion-panel-content>
        </v-expansion-panel>
    </v-expansion-panels>

            
            


        
    </div>
</template>
<script>
export default{
    data(){
        return {
            max_id:0,
            search: '',
            list:[],
            dialog:false,
            message:{},
            readed:{}
            //not_read: 110
            
        }
        
    },
    created(){
        this.init()
        // setInterval(
        //     ()=>{
        //         this.update()
        //     },2000
        // )
    },
    watch:{
        message(v){
            if(v){
                this.dialog=true
                this.set_readed(v)
            }
                
        }
    },
    computed:{
        not_read(){
            let r=0
            for(let l of this.list){
                if(!l.readed)
                    r++
                
            }
            return r
        },
        filtered_list(){
            let search=this.search.toLowerCase()

            return this.list.filter( 
                (l)=>{
                    let s=l.subject.toLowerCase()
                    return s.includes(search)
                } 
            )
        }

    },
    methods:{
        init(){
            let t=this
            t.$http.get(`${BackendBase}/mainpage/notifications`).then(
                r=>{
                    let D=r.data
                    if(D.success){
                        t.list=D.list
                        for(let l of t.list){
                            t.readed[l.id]=l.readed
                            if(t.max_id<l.id)
                                t.max_id=l.id
                        }
                        t.update()
                        
                    }
                }
            )
        },
        update(){
            let t=this
            t.$http.get(`${BackendBase}/mainpage/notifications/update/${t.max_id}`).then(
                r=>{
                    let D=r.data
                    if(D.success){
                        for(let l of D.list){
                            t.list.unshift(l)
                            t.readed[l.id]=l.readed
                            if(t.max_id<l.id)
                                t.max_id=l.id
                        }
                        setTimeout(
                            ()=>{t.update()},
                            30000
                        )
                    }
                }
            )
        },
        show_message(message){
            this.message=message, this.dialog=true
        },
        show_date(d){
            return d.replace(/^(\d{4})-(\d{2})-(\d{2})T?/,'$3.$2.$1 ')
            
        },
        set_readed(message, readed=1){
            
            this.$http.get(
                `${BackendBase}/mainpage/notifications/set-readed/${message.id}/${readed}`,
            ).then(
                r=>{
                    let d=r.data
                    if(d.success){
                        message.readed=readed
                        this.message.readed=readed
                        this.readed[message.id]=readed
                        console.log('readed:',readed)
                    }
                }
            )
        }
    }
        
    
}
</script>
<style scoped>
    .v-card__text {padding: 20px !important;}
    td {
        font-size: 0.8rem;
        vertical-align: top;
        padding-right: 10px;
    }
    .sbj {
        border-left: 1px solid gray;
        padding-left: 10px;
    }
    tr.not_read {
        font-weight: bold;
    }
    .search-panel {margin-bottom: 20px;}
    .search-panel input[type=text] {
        border: 1px solid gray;
        border-radius: 5px;
        padding: 5px;
        margin-left: 10px;
        width: calc(100% - 60px);
    }
    .v-badge {
        left: 5px;
    }

</style>