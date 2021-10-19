<template>
    <div>
        <v-expansion-panels multiple v-model='panel'>
            <v-expansion-panel v-for="item in field.data" :key="item.id"  >
                <v-expansion-panel-header @click="show_links=!show_links">
                  <div v-html="item.header"></div>

                </v-expansion-panel-header >
                <div class="header_links_block" v-if="item.header_links && show_links">
                  <div class="header_link" v-for="l in item.header_links" :key="l.id">
                  <a :href="l.url" :style="l.style" target="_blank">{{l.header}}</a></div>
                </div>
                
                
                <v-expansion-panel-content>
                    <v-container>
                      <v-row>
                      <template v-for="(c,idx) in item.content" >
                        
                        
                        <v-col cols="12" md="12" sm="12" v-if="c.type=='html'" v-html="c.body"/>
                        
                        
                        <v-col v-else-if="c.type=='table'" cols="12" sm="12" md="6">
                          <field-table :field="c"/>
                        </v-col>
                        <v-col v-else-if="c.type=='chart'" xs="12" sm="12" md="6" cols="12">
                          <field-chart :field="c" />
                        </v-col>
                        
                          
                        

                      </template>
                      </v-row>
                    </v-container>
                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>
<script>
export default {
    props:['form','field'],

    mounted(){
      let j=0
      for(let item of this.field.data){
        if(item.open)
          this.panel.push(j)
        j++
        
      }
    },
    data:function(){

       return {
          panel:[],
          show_links: true
       }
    },
    methods:{

    }
}
</script>
<style scoped>
    table.tbl {
        width: 100%;
        border-collapse: collapse;
    }
    table.tbl td {border: 1px solid black; padding: 2px 5px;}
    .header_link {padding-left: 50px; display: block !important;}
    .header_links_block :last-child {margin-bottom: 20px !important;}
</style>
