<template>
    <div>
                <div class="description">{{field.description}}:</div>
                <v-col cols="12">
                    <v-menu 
                        v-model="menu_from"
                        :close-on-content-click="true"
                        transition="scale-transition"
                        offset-y
                        readonly
                        min-width="290px"
                    >
                            <template v-slot:activator="{ props }">
                            <v-text-field
                                v-model="field.registered_low"
                                label="С"
                                prepend-icon="event"
                                readonly
                                clearable
                                v-bind="props"
                            ></v-text-field>
                            
                            
                            </template>
                            <v-date-picker
                                first-day-of-week="1" 
                                locale="ru-Ru"
                                :model-value="$toDate(field.registered_low)" @update:model-value="field.registered_low=$toIso($event)"
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
                            <template v-slot:activator="{ props }">
                            <v-text-field
                                v-model="field.registered_hi"
                                label="По"
                                prepend-icon="event"
                                readonly
                                v-bind="props"
                                clearable
                            ></v-text-field>
                            
                            
                            </template>
                            <v-date-picker
                                first-day-of-week="1" 
                                locale="ru-Ru"
                                :model-value="$toDate(field.registered_hi)" @update:model-value="field.registered_hi=$toIso($event)"
                            />
                    </v-menu>
                    <v-col cols="12">
                      <v-text-field label="текст комментария" v-model="field.message" clearable></v-text-field>
                    </v-col>
                    <v-col cols="12">
                      <v-select v-if="0"
                          label="Комментарий оставил" 
                          v-model="field.user_id" :items="field.users" item-value="v" item-title="d"
                          class="input-group--focused"
                          multiple :autocomplete="field.users.length>10" clearable
                      ></v-select>
                      <v-autocomplete
                        label="Комментарий оставил" 
                        v-model="field.user_id" :items="field.users" item-value="v" item-title="d"
                        multiple :autocomplete="field.users.length>10" clearable
                      ></v-autocomplete>
                    </v-col>
                </v-col>
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
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-size: 12px;
    font-weight: 700;
    
}
</style>