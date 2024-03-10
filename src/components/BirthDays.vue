<template>
    <div class="birthdays_component">
        
        <v-expansion-panels>
        <v-expansion-panel>
            <v-expansion-panel-header>
                <v-card-title>
                    Ближайшие дни рождения <v-badge color="red" v-if="near" :content="near" ></v-badge>
                    
                </v-card-title>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
                <div class="table_wrap">
                    <table>
                        <tr v-for="m in list" :class="{'bd':m.days==0, 'ready':m.days<7}">
                            <td>{{ m.date }}</td>
                            <td>{{ m.name }}</td>
                            <td>{{ out_info(m.days) }}</td> 
                        </tr>
                    </table>
                </div>
            </v-expansion-panel-content>
        </v-expansion-panel>
    </v-expansion-panels>

    </div>
</template>
<script>
const get_days_to_date=(day,month)=>{
    day=parseInt(day), month=parseInt(month)
    // вычисляет количество дней до day/month от текущей даты
    let curDate=new Date(), cur_year=curDate.getFullYear()
    curDate=new Date(cur_year, curDate.getMonth(),curDate.getDate());

    let targetDate=new Date(cur_year, month-1,day);
    
    if(targetDate<curDate){
        targetDate.setFullYear(cur_year+1);
    }
    // Разница в миллисекундах
    let diffInMilliseconds = targetDate - curDate;

    // Преобразование миллисекунд в дни
    return Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
}
export default {
    data(){
        return {
            show: false,
            near: 0,
            list:[]
        }
    },
    created(){
        this.init()
    },
    methods:{
        init(){
            let t=this
            t.$http.get(`${BackendBase}/mainpage/birthdays`).then(
                r=>{
                    let D=r.data
                    if(D.success){
                        //t.list=D.list
                        let t=this
                        t.near=0
                        for(let m of D.list){
                            let [day,month]=m.date.split('/')
                            if(month && day){
                                m.days=get_days_to_date(day, month)
                                if(m.days<=7){
                                    t.near++
                                }
                                t.list.push(m)
                            }
                            
                        }
                        t.list.sort(
                            (a,b)=>{
                                return a.days>b.days?1:-1
                            }
                        )
                        
                    }
                }
            )
        },
        out_info(days){
            let r=`осталось дней: ${days}`
            switch (days) {
                case 1:
                    r='сегодня'
                    break;
                case 2:
                    r='завтра'
                    break
                case 3:
                    r='послезавтра'
                default:
                    break;
            }
            return r
        }
    },

}
</script>
<style scoped>
    h2 {color: gray; margin-bottom: 10px;}
    table {
        border-collapse: collapse;
    }
    table td {
        padding: 5px 10px;
        /*border: 1px solid gray;*/
    }
    .table_wrap {
        border: 1px solid gray;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
        max-height: 400px;
        overflow-y: auto;
    }
    tr.bd td { 
        color: red;
    }
    tr:hover {background-color: blanchedalmond;}
    tr.ready td { 
        color: green;
    }
    .v-badge {
        left: 5px;
    }
</style>