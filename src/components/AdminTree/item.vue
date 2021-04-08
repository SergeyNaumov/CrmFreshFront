<template>
    <span>
    <div class="li_header" >
        <v-icon small v-if="!shows[item.id] && form.tree_use" @click="show_this(item)">fa fa-plus</v-icon>
        <v-icon small v-if="shows[item.id]" @click="shows[item.id]=false">fa fa-minus</v-icon>
            {{ item.header }} 
                <template v-if="item.childs && form.tree_use">({{item.childs.length}})</template>
                <v-icon color="primary" small @click="go_to_edit(item.id)">edit</v-icon> 
                <v-icon v-if="form.make_delete" small style="font-size: 10pt;" color="primary" @click="del(parent.id,item)">fa fa-trash</v-icon>
    </div>

    <template v-if="shows[item.id]">
        <branch v-if="item.childs"
            :form="form"
            :level="(level+1)"
            :list="item.childs"
            :parent="item"
            :add="add" :del="del" :move_end="move_end"
        />

    </template>
    </span>
</template>
<script>
export default {
  props: {
    shows:{},
    list: {type: Array,required:false},
    form:{type:Object,required:false},
    level:{type:Number,required:false},
    parent:{required:true}, // вышестоящий элемент
    add:{required:true},
    del:{required:true},
    item:{},
    
  },
  name: "item"
}
</script>