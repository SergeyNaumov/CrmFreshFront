<template>
    <div>
                <div class="description">{{field.description}}:</div>
                <v-flex xs12>
                    <v-menu 
                        v-model="menu_from"
                        :close-on-content-click="true"
                        transition="scale-transition"
                        offset-y
                        readonly
                        min-width="290px"
                    >
                            <template v-slot:activator="{ on }">
                            <v-text-field
                                v-model="field.registered_low"
                                label="С"
                                prepend-icon="event"
                                readonly
                                clearable
                                v-on="on"
                            ></v-text-field>
                            
                            
                            </template>
                            <v-date-picker
                                first-day-of-week="1" 
                                locale="ru-Ru"
                                v-model="field.registered_low"
                            />
                            
                        
                    </v-menu>
                            
                    <v-menu
                        v-model="menu_to"
                        :close-on-content-click="true"
                        transition="scale-transition"
                        offset-y
                        readonly
                        min-width="290px"
                    >
                            <template v-slot:activator="{ on }">
                            <v-text-field
                                v-model="field.registered_hi"
                                label="По"
                                prepend-icon="event"
                                readonly
                                v-on="on"
                                clearable
                            ></v-text-field>
                            
                            
                            </template>
                            <v-date-picker
                                first-day-of-week="1" 
                                locale="ru-Ru"
                                v-model="field.registered_hi"
                            />
                    </v-menu>
                    <v-flex xs12>
                      <v-text-field label="текст комментария" v-model="field.message" clearable></v-text-field>
                    </v-flex>
                    <v-flex xs12>
                      <v-select v-if="0"
                          label="Комментарий оставил" 
                          v-model="field.user_id" :items="field.users" item-value="v" item-text="d"
                          class="input-group--focused"
                          multiple :autocomplete="field.users.length>10" clearable
                      ></v-select>
                      <v-autocomplete
                        label="Комментарий оставил" 
                        v-model="field.user_id" :items="field.users" item-value="v" item-text="d"
                        multiple :autocomplete="field.users.length>10" clearable
                      ></v-autocomplete>
                    </v-flex>
                </v-flex>
    </div>
</template>
<script>
export default {
    props:["field"],
    data(){
        return {
            menu_from: false,
            menu_to: false,
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