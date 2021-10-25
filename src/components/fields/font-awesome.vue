<template>
        
        <div>
            <p v-if="field.description"  class="v-label theme--light"><small>{{field.description}}:</small></p>
            <div v-if="selected_icon">
              <v-icon v-if="selected_icon" color="primary">{{selected_icon}}</v-icon> {{selected_icon}} 
              <a href="" @click.prevent="load()" v-if="!view_list">выбрать другую</a>
            </div>
            <div v-else>
              иконка не выбрана <a href="" @click.prevent="load()" v-if="!view_list">выбрать</a>
            </div>
            <div ></div>
            <v-progress-linear
              :active="loading"
              :indeterminate="loading"
              absolute
              bottom
              color="deep-purple accent-4"
            ></v-progress-linear>
            
            <div v-show="view_list && list.length>0" style="border: 1px solid gray; padding: 1rem;">
              <v-select

                :items="struct_list"
                v-model="cur_struct"
                label="Набор иконок"
                item-value="v"
                item-text="d"
                @input="list=font_struct[cur_struct];"
              ></v-select>
              <v-text-field v-model="filter" 

                placeholder="введите поисковую фразу, чтобы выбрать иконку"></v-text-field>
              <div style="overflow: scroll; max-height: 500px;">
                <ul>
                  <li v-for="l in filtered_list" :key="l">
                    <!--<a href="" @click.prevent="del(l)">del</a>-->
                    <v-icon color="primary" small>{{full_icon_name(l)}}</v-icon>&nbsp;<a href="" @click.prevent="select(l)">{{l}}</a> 
                  </li>
                </ul>
              </div>
            </div>
        </div>
</template>

<script>
  //import axios from 'axios'
  //import VueCodemirror from 'vue-codemirror';
import { bus } from '../../main'
export default {
  data:function(){
    return {
      filter:'',
      fonts_struct:{},
      struct_list:[],
      cur_struct:'fa',
      list:[],
      view_list:false,
      loading: false,
      selected_icon: ''
    }
  },
  props:['field'],
  watch:{

  },
  created(){

  },
  mounted(){
    if(this.field.value){
      this.selected_icon=this.field.value
    }

  },
  computed:{
    filtered_list(){
      let new_list=[];
      for(let i of this.list){
        if(i.indexOf(this.filter)!=-1)
          new_list.push(i)
      }
      return new_list;
    },


  },
  methods: {
    load(){
      if(!this.list.length){
        this.loading=true;
        this.$http.get(BaseUrl+'dist/json/awesome.json').then(
          response=>{
            //this.list=response.data;

            this.struct_list=response.data.struct_list;
            this.font_struct=response.data.font_struct;
            //console.log(struct_list);
            this.cur_struct=this.struct_list[0].v;
            this.list=this.font_struct[this.cur_struct];

            this.loading=false;
            this.view_list=true;
          }
        ).
        catch(
          function(e){
            //this.loading=false;
            alert('Font awesome error: '+ e)
          }
        )
      }
      else
        this.view_list=true;
      
    },
    full_icon_name(name){
      return this.cur_struct+' fa-'+name
    },
    select(l){
      
      let field=this.field;
      field.value=this.full_icon_name(l);
      this.selected_icon=this.field.value;
      //this.change_field(field);
      bus.$emit('change_field',field);
      this.view_list=false;
    },
    del(l){
      let new_list=[];
      for(let f of this.list){
        if(l!==f)
          new_list.push(f)
      }
      this.list=new_list;
    }
  }
}
</script>
<style scoped>
  ul {list-style-type: none;}
  li {display: inline-block; margin: 5px 10px; margin-right: 20px; padding: 10px; border: 1px solid gray; border-radius: 1rem;}
</style>}
