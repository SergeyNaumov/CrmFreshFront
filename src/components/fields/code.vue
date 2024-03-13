<template>
    <div>
        <div v-html="field.before_html"></div>
        <div v-html="field.html" :style="field.style"></div>
        <div v-html="field.after_html"></div>
    </div>
</template>
<script>
export default {
    props:['form','field','change_field'],
    computed:{

    },
    mounted(){
      
    },
    data:function(){
       return {}
    },
    methods:{

    }
}
</script>
