<template>
      
    <div>
        <template v-if="errors.length>0">
            <div class="err" v-for="e in errors" :key="e" >{{e}}</div> <!--v-html="e"-->
        </template>
    </div>
</template>

<script>
  //import axios from 'axios'
  //import VueCodemirror from 'vue-codemirror';
  export default {
  // опции
  data:function(){
    return {
     
    }
  },
  props:['errors'],
  
  methods: {

    }
  }
</script>
<style score>
    .err {color: red; }
</style>
