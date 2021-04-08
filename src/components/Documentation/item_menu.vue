<template>
    <div :style="{'margin-left': 10*level+'px'}">
        <a :href="'#content'+item.id" :class="'s'+level">{{item.header}}</a>
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
    props:['item','level'],
    data(){
        return {
            
        }
    }    
}
</script>
<style scoped>
    a {padding-top: 20px; }
    a.s0 {font-size: 18px;}
    a.s1 {font-size: 16px;}
    a.s2 {font-size: 14px;}
    a.s3 {font-size: 12px;}
    a.s4 {font-size: 10px;}
    a.s5 {font-size: 8px;}
</style>