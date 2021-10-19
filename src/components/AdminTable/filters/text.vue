<template>
    <div>
        
        <template v-if="field.range">
            <div class="description">{{field.description}}:</div>
            <v-flex xs6>
                <v-text-field 
                    prepend-icon="done"
                    label="От"
                    v-model="field.value_low"
                    hide-details
                    clearable
                ></v-text-field>
            </v-flex>
            <v-flex xs6>
                <v-text-field
                    prepend-icon="done_all"
                    label="До"
                    v-model="field.value_hi"
                    hide-details
                    clearable
                ></v-text-field>
            </v-flex>
              
        </template>
        <template v-else>
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
    wathch:{
        field(){

        }
    },
    data(){
        return {

        }
    }

}
</script>
<style scoped>
.description {
    margin-top: 5px;
    color: rgba(0, 0, 0, 0.54);
    font-size: 12px;
    font-weight: 700; 
}
</style>