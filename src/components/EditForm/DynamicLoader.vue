<template>
        {{ field }}
        <component  :is="component"
          :form="form" :field="field" :calc_values="calc_values" :change_field="change_field"
        />
</template>

<script>
  
  export default {
    data:function(){
        return {
            component: null
        }
  },
  props:['form','field','change_field','calc_values'],
  mounted(){
        this.loader()
            .then(() => {
                this.component = () => this.loader()
            });
            /*.catch(() => {
                alert(error)
                //this.component = () => import(`./fields/1_to_m`)
            })*/

  },
  computed:{
        loader() {
            if (!this.field.type) {
                return null
            }
            let filed_type=this.field.type.replace(/^1_to_1_(.+)$/,$1)

            return () => import(`../fields/${filed_type}`)
        },

  },
  methods: {

    }
  }
</script>
<style>
</style>