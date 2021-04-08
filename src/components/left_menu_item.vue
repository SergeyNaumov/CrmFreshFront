<template>
  <div class="item" >
      <template v-if="item.child.length"> <!-- Родительский пункт меню -->
        <a href="" @click.prevent="show=!show">
        <v-icon class="arrow">fa-{{show?'chevron-down':'chevron-right'}}</v-icon>
        <div class="icon_slot">
          <v-icon color="primary" x-small>{{item.icon}}</v-icon>
        </div>
        
        <span>{{item.header}}</span></a>
        

        <div v-if="show" class="childs">
        <left_menu_item
          v-for="m in item.child"
          :key="m.id"
          :item="m"
          :get_link="get_link"
          :go_link="go_link"
          :manager="manager"
          
        />
        </div>
      </template>
      <template v-else> <!-- дочерний пункт меню -->
        <a :href="get_link(item)" @click.prevent="go_link(item)">
          <div class="icon_slot">
            <v-icon color="primary" x-small>{{item.icon}}</v-icon>
          </div>
          <span>{{item.header}}</span>
        </a>

      </template>
  </div>
</template>
<script>
export default {
  name:'left_menu_item',
  props:["manager","item","get_link","go_link"],
  created(){
    if(this.item.show){
      this.show=true
    }
  },

  data(){
    return {
      show:false
    }
  },
  methods:{

  }
}
</script>
<style scoped lang="scss">

  @import '@/styles/variables.scss';
  a { text-decoration: none; color: black !important;}
  a:hover { color: $primary;}
  a:hover span {text-decoration: underline;}
  .v-icon {font-size: 12px; color: $primary;}
  .v-icon.arrow {padding-right: 10px; font-size: 10px;}
  div {
    font-size: 14px; color: black; 
    margin-top: 5px;
    padding-left: 10px;

  }
  div.icon_slot{
    display: inline-block;
    width: 20px;
    padding: 0
  }
  .childs {padding-bottom: 10px;  border-bottom: 1px dotted gray; padding-left: 20px;}
  .childs div {padding-bottom: 0px;  border-bottom: none;}
</style>