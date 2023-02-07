<template>
  <div class="is_headapp">
    this is text_page
  </div>
</template>

<script>
let t
export default {
        props:['params','is_headapp'],
        data(){
          return {
          
          }
        },

        mounted () {
          t=this
          t.init()
        },

        created(){
          
        },
        watch:{

        },
        methods: {
        }


        
        
}
</script>
<style scoped>
  .auth .err{ color: red; background-color: white;}
  body {margin-top: 10%;}
  .sort_asc, .sort_desc {text-decoration: none !important;}
  .links {margin-left: 20px; border-bottom: 1px dotted black; padding-bottom: 20px;}
</style>



