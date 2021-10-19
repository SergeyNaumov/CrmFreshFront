<template>
    <div class="links" >
        <template v-for="(l,idx) in links">
            <a   :key="idx" :href="l.link" target="_blank">{{l.description}}</a>
            <template v-if="idx < links.length -1 ">&nbsp;|&nbsp;</template>
        </template>
    </div>
</template>
<script>

export default {
    props:['links'],
    name:'links',
    data(){
        return {}
    }    
}
</script>
<style scoped>
    .links {font-size:  13px; margin-bottom:  20px;}
</style>