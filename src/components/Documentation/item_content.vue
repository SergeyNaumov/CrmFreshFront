<template>
    <div>
        <a :name="'content'+item.id"></a>
        <template v-if="level==0"><h1>{{item.header}}</h1></template>
        <template v-else-if="level==1"><h2>{{item.header}}</h2></template>
        <template v-else-if="level==2"><h3>{{item.header}}</h3></template>
        <template v-else-if="level==3"><h4>{{item.header}}</h4></template>
        <template v-else-if="level==4"><h5>{{item.header}}</h5></template>
        <template v-else-if="level==5"><h6>{{item.header}}</h6></template>
        <div v-html="item.body"/>
        <item-content
            v-for="c in item.child" :key="'content'+c.id"
            :item="c" :level="level+1"
        />
    </div>
</template>
<script>

export default {
    props:['item','level'],
    name:'item-content',
    data(){
        return {
            
        }
    }    
}
</script>
<style scoped lang="scss">
    @import '@/styles/variables.scss';
    
    h1 {font-size: 36px !important; margin-top: 20px !important; margin-bottom: 10px !important;}
    h2 {font-size: 28px !important; margin-top: 20px !important; color: $primary;}
    h3 {font-size: 22px !important; margin-top: 20px !important; color: $primary;}
    h4 {font-size: 18px !important; margin-top: 20px !important; color: $primary;}
    h5 {font-size: 16px !important; margin-top: 20px !important; color: $primary;}
    h6 {font-size: 15px !important; margin-top: 20px !important; color: $primary;}
</style>