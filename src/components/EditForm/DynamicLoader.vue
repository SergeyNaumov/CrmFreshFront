<template>
        {{ field }}
        <component  :is="component"
          :form="form" :field="field" :calc_values="calc_values" :change_field="change_field"
        />
</template>

<script>
  
  const field_modules = import.meta.glob('../fields/*.vue')
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
            let filed_type=this.field.type.replace(/^1_to_1_(.+)$/, '$1')

            return field_modules[`../fields/${filed_type}.vue`]
        },

  },
  methods: {

    }
  }
</script>
<style>
</style>