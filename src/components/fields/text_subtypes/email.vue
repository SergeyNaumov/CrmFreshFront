<template>
<span>

    <span v-for="(e,idx) in splitted" :key="`email-${idx}`" style="padding-left: 3px;">
        <a :href="'mailto:'+e" >{{ e }}</a>
        <template v-if="idx!=splitted.length-1"> | </template>
    </span>
</span>
</template>
<script>
export default {
    props:['field','value','for_slide'],
    created(){


    },
    computed:{
        splitted(){
            let splitted=[]
            for(let p of this.value.split(/,\s*/)){
                if(/@/.test(p)){
                    splitted.push(p)
                }
            }
            return splitted
        }
    }

}
</script>