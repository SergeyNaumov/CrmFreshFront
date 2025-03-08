<!-- компонент (замена v-treeview для мультиконнекта -->
<template>
  <div class="tree-view">
    <div v-for="(node, index) in items" :key="index" class="tree-node">
      <div class="node-label" @click="toggleNode(node)">
        <v-icon v-if="node.children && node.children.length" size="small">
          {{ node.expanded ? 'mdi-minus' : 'mdi-plus' }}
        </v-icon>
        <v-checkbox
          v-model="selectedHash[node.id]"
          @change="$emit('change')"
        />
        {{ node.header }}
      </div>
      <div v-if="node.expanded" class="children">
        <tree-view
          :items="node.children"
          :selected-hash="selectedHash"
          @change="$emit('change')"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TreeView",
  props: {
    items: {
      type: Array,
      required: true,
    },
    selectedHash: {
      type: Object,
      required: true,
    },
  },
  methods: {
    toggleNode(node) {
      if (node.children && node.children.length) {
        node.expanded = !node.expanded;
      }
    },
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
</style>