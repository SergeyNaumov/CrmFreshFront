<template>
  <div class="const">
    <v-card>
    <h1 class="title">Константы системы</h1>
    <p>(сохранение происходит сразу после изменения значений)</p>

    <v-tabs v-model="cur_tab" bg-color="primary" v-if="tabs.length">
          <v-tab v-for="(t, i) in tabs" :key="`tab${t.name}`" :value="i">{{ t.description }}</v-tab>
    </v-tabs>

    <div>
      <!-- Вывод ошибок -->
      <template v-if="errors.length">
        <div v-for="(e,idx) in errors" class="error" :key="'e'+idx">{{e}}</div>
      </template>

      <div >
        <pre v-if=0>{{list}}</pre>
          <table>
          <template v-for="(l, idx) in list" :key="'l'+idx">
            <template v-if="show_field(l)">
                <template v-if="l.type=='header'">
                  <!-- <tr><td colspan="2"><b>{{l.header}}</b></td></tr> -->
                  <div class="header"><b>{{l.header}}</b></div>
                </template>
                <template v-else>
                  <div class="item">
                        <template v-if="l.type=='text'">
                          {{l.header}}:
                          <input type="text" v-model="l.value" @keyup="change(l)">
                        </template>
                        <template v-if="l.type=='textarea'">
                          {{l.header}}:
                          <textarea
                            v-model="l.value"
                            @keyup="change(l)"
                          />
                        </template>
                        <template v-if="l.type=='wysiwyg'">
                          {{l.header}}:
                          <field-wysiwyg
                            :field="l"
                          />
                        </template>
                        <template v-if="l.type=='file'">
                          {{l.header}}:
                          <input type="file"
                          :id="'const_file_'+l.name"
                          @change="file_upload(l)"
                          />
                          <div v-if="l.value">
                            <a :href="filedir+'/'+l.value" target="_blank">открыть в браузере</a> |
                            <a :href="filedir+'/'+l.value" :download="l.value">загрузить</a>
                          </div>

                        </template>
                        <template v-if="l.type=='checkbox'">
                            <input type="checkbox"   v-model="l.value" @change="change(l)"> {{l.header}}
                        </template>
                        <template v-if="l.type=='switch'">
                            <v-switch   v-model="l.value" @update:model-value="change(l)"/>
                        </template>
                        <template v-if="l.type=='select'">
                            {{l.header}}:
                        <field-select :form="form" v-if="l.type=='select'" :field="l"
                        />

                        </template>
                        <!-- Карта выбора координат (Leaflet + OpenStreetMap) -->
                        <template v-if="l.name=='map_lon'">
                          <div class="addr-map">
                            <div id="addr-map" class="addr-map__canvas"></div>
                            <p class="addr-map__hint">
                              Клик по карте или перетаскивание маркера — координаты
                              подставятся в «Широта»/«Долгота» и сохранятся.
                            </p>
                          </div>
                        </template>
                        <div v-if="l.saved" class="saved">
                            сохранено
                        </div>
                  </div>
<!--                       <tr :key="l.name">
                        <td class="label">{{l.header}}:</td>
                        <td>
                        <template v-if="l.type=='text'">
                          <input type="text" v-model="l.value" @keyup="change(l)">
                        </template>
                        <template v-if="l.type=='textarea'">
                          <textarea
                            v-model="l.value"
                            @keyup="change(l)"
                          />
                        </template>
                        <template v-if="l.type=='wysiwyg'">
                          <field-wysiwyg
                            :field="l"
                          />
                        </template>
                        <template v-if="l.type=='file'">

                          <input type="file"
                          :id="'const_file_'+l.name"
                          @change="file_upload(l)"
                          />
                          <div v-if="l.value">
                            <a :href="filedir+'/'+l.value" target="_blank">открыть в браузере</a> |
                            <a :href="filedir+'/'+l.value" :download="l.value">загрузить</a>
                          </div>

                        </template>
                        <template v-if="l.type=='checkbox'">
                            <input type="checkbox"   v-model="l.value" @change="change(l)">
                        </template>
                        <template v-if="l.type=='switch'">
                            <v-switch   v-model="l.value" @update:model-value="change(l)"/>
                        </template>
                        <template v-if="l.type=='select'">
                            <select v-model="l.value">
                              <option v-for="v in values" :value="v.v">{{v.d}}</option>
                            </select>
                        </template>
                        <field-select :form="form" v-if="l.type=='select'" :field="l"
                        />
                        <div class="add_description" v-if="l.add_description">
                          {{l.add_description}}
                        </div>


                      </td>
                    </tr> -->
              </template>
            </template>
        </template>
      </table>
      </div>


    </div>
    </v-card>
  </div>          
</template>

<script>
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { bus } from '../main'

// Leaflet по умолчанию ищет иконки маркера по относительному пути — в сборке
// Vite подставляем адреса, которые возвращает бандлер (иначе маркер не видно).
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

let t
export default {
        props:["params"],
        provide(){
          return {
            formController:{
              changeField:(field)=>this.change(field)
            }
          }
        },
        data: () => ({
          cur_tab:0,
          addr_map:null,     // экземпляр карты Leaflet (вкладка «Адрес и карта»)
          addr_marker:null,  // маркер выбранной точки
          tabs:[],
          form:{},
          config:'',
          filedir:'',
          list:[], // список типов констант
          errors:[]
        }),

        mounted () {
           
        },

        created(){
          t=this
          t._change_field=(field,not_frontend_process)=>{
            //console.log('field: ',field)
            t.change(field)
          },
          bus.$on('change_field', t._change_field);
          if(t.params && t.params.config){
            t.config=t.params.config
          }
          t.get_list()
          
        },
        beforeUnmount(){
          bus.$off('change_field',t._change_field);
          this.destroy_map();
        },
        watch:{
          // Переключили вкладку — создаём карту на «Адрес и карта», иначе убираем.
          cur_tab(){
            this.$nextTick(()=>this.init_map())
          }
        },
        methods: {
          _change_field(){

          },
          file_upload(l){
            
            let file = document.getElementById('const_file_'+l.name).files[0];
            if(file){
              
            
              
              let reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = (e) => {
                let orig_name=file.name, fileSrc=e.target.result;
                //this.field_error_check();
                

                t.$http.post(
                  BackendBase+'/const/save_value',
                  {
                    config: t.config,
                    name: l.name,
                    value: orig_name,
                    src: fileSrc
                  }
                ).then(
                  r=>{
                    let d=r.data;
                    if(d.success){ 
                        l.value=d.value || ''
                        t.mark_success(l);
                    }
                  }
                ).catch(
                  e=>{
                    t.errors=[e]
                  }
                );
              }
            }

          },
          get_list(){
            this.$http.post(BackendBase+'/const/get',{config: this.config}).then(
              r=>{
                let d=r.data;
                this.errors=d.errors
                if(d.success){
                  for(let l of d.list){
                    if(l.type=='checkbox' || l.type=='switch')
                        l.value=l.value?true:false;

                    else if(!l.value)
                      if(l.type=='text' || l.type=='textarea')
                        l.value=''                      
                    
                    l.begin_value=l.value,
                    l.saved=false;
                    
                  }
                  t.list=d.list
                  t.filedir=d.filedir

                  // табы
                  if(d.tabs && d.tabs.length){
                    t.tabs=d.tabs


                  }
                  // карта выбора координат (создаётся, если активна «Адрес и карта»)
                  t.$nextTick(()=>t.init_map())
                }
              }
            )
          },
          change(l){
            if(l.before_value==l.value) // если значение не поменялось -- ничего не делаем
              return

            if(!l.cnt_ajax) l.cnt_ajax=0;
            l.cnt_ajax++;
            setTimeout( // оборачиваем в setTimeout, чтобы не долбить постоянно ajax-ом
              ()=>{
                l.cnt_ajax--;
                if(l.cnt_ajax>0)
                  return
                let value=l.value;
                
                if(l.type=='checkbox' || l.type=='switch'){
                  value=value?1:0
                }

                this.$http.post(
                  BackendBase+'/const/save_value',
                  {
                    config: this.config,
                    name: l.name,
                    value: value
                  }
                ).then(
                  r=>{
                    let d=r.data;
                    if(d.success){ 
                        this.mark_success(l);
                    }
                  }
                ).catch(
                  e=>{
                    this.errors=[e]
                  }
                );
               
              },
              500
            );
          },
          mark_success(l){ // выводим сообщение "сохранено", затем гасим его
            l.saved=true; l.before_value=l.value
            setTimeout(
              ()=>{ 
                
                l.saved=false
              },
              500
            )
          },
          // --- Карта выбора координат (Leaflet + OpenStreetMap, вкладка addr) ---
          // Карта и поля «Широта»/«Долгота» синхронизированы: клик по карте или
          // перетаскивание маркера записывает координаты в константы map_lat/map_lon.
          init_map(){
            let el=document.getElementById('addr-map')
            if(!el){
              // вкладка «Адрес и карта» не активна — карта не нужна
              this.destroy_map()
              return
            }
            if(this.addr_map){ // уже создана — пересчитываем размеры
              this.addr_map.invalidateSize()
              return
            }
            let lat=parseFloat(this.field_value('map_lat')),
                lon=parseFloat(this.field_value('map_lon'))
            if(!isFinite(lat) || !isFinite(lon)){
              lat=55.751244; lon=37.618423 // Москва, если координаты не заданы
            }
            let map=L.map(el,{center:[lat,lon],zoom:14,scrollWheelZoom:true})
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
              maxZoom:19,
              attribution:'© OpenStreetMap contributors'
            }).addTo(map)
            let marker=L.marker([lat,lon],{draggable:true}).addTo(map)
            map.on('click',(e)=>{
              marker.setLatLng(e.latlng)
              this.set_point(e.latlng.lat,e.latlng.lng)
            })
            marker.on('dragend',()=>{
              let p=marker.getLatLng()
              this.set_point(p.lat,p.lng)
            })
            this.addr_map=map
            this.addr_marker=marker
            this.$nextTick(()=>map.invalidateSize())
          },
          destroy_map(){
            if(this.addr_map){
              this.addr_map.remove()
              this.addr_map=null
              this.addr_marker=null
            }
          },
          field_value(name){ // текущее значение поля из списка констант
            let f=t.list.find(f=>f.name==name)
            return f ? f.value : ''
          },
          set_point(lat,lon){ // точка на карте -> поля «Широта»/«Долгота»
            let lat_f=t.list.find(f=>f.name=='map_lat'),
                lon_f=t.list.find(f=>f.name=='map_lon')
            if(lat_f){
              lat_f.value=lat.toFixed(6)
              this.change(lat_f)
            }
            if(lon_f){
              lon_f.value=lon.toFixed(6)
              this.change(lon_f)
            }
          },
          show_field(field){
            // для табов: условие отображения поля
            return !field.hide && (!t.tabs.length || t.tabs[t.cur_tab].name == field.tab)

          },


        },

        computed: {

        }
}
</script>
<style scoped>
  .const {margin: 20px; width: 100%; max-width: 1280px;}
  .saved {color: green; padding-bottom: 15px;}
  /* Карта выбора координат (вкладка «Адрес и карта») */
  .addr-map {margin-top: 10px; max-width: 640px;}
  .addr-map__canvas {height: 360px; width: 100%;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.24); border-radius: 4px;}
  .addr-map__hint {margin: 6px 0 0; font-size: 10pt;
    color: rgba(var(--v-theme-on-surface), 0.6);}
  /* Leaflet-атрибуция в правом нижнем углу: скрываем флаг-иконку (сине-жёлтый
     SVG Leaflet — читается как украинский флаг). Текст «Leaflet | © OSM»
     остаётся, ссылка на leafletjs.com сохраняется. */
  /* Leaflet сам задаёт display:inline !important — перебиваем !important'ом. */
  :deep(.leaflet-attribution-flag) { display: none !important; }
  table {
    width: 100%;
    border-left: 1px solid gray;
    border-right: 1px solid gray;
  }
  td.label {width: 200px; }
  table {width: calc(100% - 35px); border-collapse: collapse;}
  table td {vertical-align: top; padding: 10px; 
    font-size: 11pt;
    border-top: 1px solid gray;
    border-bottom: 1px solid gray;
  }
  table tr:nth-child(odd) td {background-color: #f1f1f1;}
  div.item{
    vertical-align: top; padding: 10px;
    font-size: 11pt;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.24);
    border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.24);
  }
  div.item:nth-child(odd) {background-color: rgba(var(--v-theme-on-surface), 0.04);}
  div.header {text-align: center;
    padding: 20px;
  }
  div.item input[type=text] {
    display: block;
    margin-top: 4px;
    padding: 5px;
    border-radius: var(--app-radius-field);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.24);
    max-width: 720px;
    width: 100%;
  }
  div.item textarea {
    display: block;
    margin-top: 4px;
    padding: 5px;
    width: 100%;
    max-width: 720px;
    border-radius: var(--app-radius-field);
    height: 100px;
    border: 1px solid rgba(var(--v-theme-on-surface), 0.24) !important;
  }
  div.item .v-field,
  div.item .v-file-input,
  div.item .tox-tinymce {
    max-width: 720px;
  }
  .add_description {
    margin-top: 10px;
    color: gray;
    font-size: 0.8rem;
  }
  .saved {
    height: 10px; position: relative; top: -1px; font-size: 9pt;
    z-index: 1000;
  }
</style>



