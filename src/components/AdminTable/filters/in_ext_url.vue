<template>
    <div>
        <template>
            <v-text-field 
                  v-bind:label="field.description"
                  v-model="field.value"
                  class="input-group--focused"
                  clearable
                  hide-details
            />
        </template>
    </div>
</template>
<script>
export default {
    props:["field"],
    data(){
        return {

        }
    }

}
</script>
<style scoped>

</style>