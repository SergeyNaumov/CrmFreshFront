<template>
    <div class="menu" >
         <a href="" :class="'s'+level" @click.prevent="go_to_ankor(item.id)">{{item.header}}</a><br>
        
        
        <template v-if="item.child.length">
            <item-menu 
                v-for="m in item.child" :key="m.id"
                :item="m"
                :level="level+1"
            />
        </template>
    
    </div>
</template>
<script>
import item_menu from './item_menu';
export default {
    name:"item-menu",
    components:{'item-menu':item_menu},
    props:[ 'item','level', 'go_to_ankor'],
    data(){
        return {
            
        }
    },
    methods:{
    },

}
</script>
<style scoped>
    .menu {margin-left: 10px; margin-bottom: 15px; }
    a {padding-top: 20px; }
    a.s0 {font-size: 18px;}
    a.s1 {font-size: 16px;}
    a.s2 {font-size: 14px;}
    a.s3 {font-size: 12px;}
    a.s4 {font-size: 10px;}
    a.s5 {font-size: 8px;}
    @media only screen and (max-width: 800px) {
        a {padding-top: 20px; }
        a.s0 {font-size: 16px;}
        a.s1 {font-size: 14px;}
        a.s2 {font-size: 12px;}
        a.s3 {font-size: 10px;}
        a.s4 {font-size: 8px;}
        a.s5 {font-size: 8px;}
    }
</style>