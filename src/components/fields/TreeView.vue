<!-- компонент (замена v-treeview для мультиконнекта -->
<template>
  <div class="tree-view">
    <div v-for="(node, index) in items" :key="index" class="tree-node">
      <div class="node-label" >
        <a href="" @click.prevent="toggleNode(node.id)">
          <fa v-if="node.child.length"  :icon="expanded[node.id] ? 'fa-minus' : 'fa-plus'" small  color="primary" />
        </a>
        <v-checkbox
          v-model="selectedHash[node.id]"
          class="inline"
          :label="node.header"
          hide-details
        />
        
        <!-- <pre>{{ node }}</pre> -->
      </div>
      <div v-if="expanded[node.id]" class="children">
        <tree-view
          :items="node.child"
          :selected-hash="selectedHash"
          @change="$emit('change')"
          :selectedHash="selectedHash"
          :expanded="expanded"
          :toggleNode="toggleNode"
          
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TreeView",
  props: {
    toggleNode:{
      type: Function,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
    selectedHash: {
      type: Object,
      required: true,
    },
    expanded: { // хэш раскрытых веток
      type: Object,
      required: true,
    },
  },
  data(){
    return {
      
    }
  },
  methods: {

  },
};
</script>

<style scoped>
.tree-view {
  margin-left: 20px;
}
.node-label {
  cursor: pointer;
}
.children {
  margin-left: 20px;
}
.node-label {
  display: flex; /* Размещаем элементы в одну строку */
  align-items: center; /* Выравниваем их по центру по вертикали */
  gap: 0px; /* Добавляем расстояние между элементами */
}

.inline {
  margin: 0; /* Убираем отступы по умолчанию */
  padding: 0; /* Убираем лишние отступы */
}
</style>