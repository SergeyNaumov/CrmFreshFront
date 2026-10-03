<template>
  <div class="pc_theme">
    <div v-if="title" class="pc_theme__title">{{ title }}</div>
    <div class="pc_theme__grid">
      <div
        v-for="a in axes"
        :key="a.axis"
        class="pc_axis"
        :class="{ 'is-saving': saving === a.axis }"
      >
        <div class="pc_axis__head">
          <span class="pc_axis__ico" :class="'pc_axis__ico--' + a.axis">
            <v-icon size="20">{{ a.icon }}</v-icon>
          </span>
          <span class="pc_axis__label">{{ a.title }}</span>
          <span v-if="saving === a.axis" class="pc_axis__state">сохранение…</span>
        </div>
        <div class="pc_axis__row">
          <v-select
            :model-value="(theme[a.axis] || {}).name"
            :items="scheme_items(a.axis)"
            item-title="label"
            item-value="name"
            density="compact"
            variant="outlined"
            hide-details
            class="pc_axis__select"
            @update:model-value="$emit('set-axis', a.axis, $event)"
          />
          <v-btn
            icon
            size="small"
            variant="text"
            class="pc_axis__edit"
            title="Открыть редактор оси"
            @click="$emit('edit-axis', a.axis)"
          >
            <v-icon>mdi-tune</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
const AXES = [
  { axis: 'color', title: 'Цвет', icon: 'mdi-palette' },
  { axis: 'style', title: 'Стиль', icon: 'mdi-shape' },
  { axis: 'layout', title: 'Компоновка', icon: 'mdi-view-dashboard-variant' },
  { axis: 'font', title: 'Шрифт', icon: 'mdi-format-font' }
]

export default {
  props: {
    theme: { type: Object, default: () => ({}) },
    schemeLists: { type: Object, default: () => ({ color: [], style: [], layout: [], font: [] }) },
    saving: { type: String, default: '' },
    title: { type: String, default: 'Тема шаблона' }
  },
  emits: ['set-axis', 'edit-axis'],
  computed: {
    axes() { return AXES }
  },
  methods: {
    scheme_items(axis) {
      return (this.schemeLists[axis] || []).map(s => ({ name: s.header, label: s.label || s.header }))
    }
  }
}
</script>
<style scoped lang="scss">
  .pc_theme {margin-bottom: 18px; padding: 14px 16px; border: 1px solid rgba(var(--v-theme-on-surface), .12); border-radius: var(--app-radius-card); background: var(--app-tint);}
  .pc_theme__title {font-size: var(--app-font-label); text-transform: uppercase; letter-spacing: .5px; color: rgba(var(--v-theme-on-surface), .6); margin-bottom: 12px;}
  .pc_theme__grid {display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;}
  .pc_axis {padding: 10px 12px; border: 1px solid rgba(var(--v-theme-on-surface), .12); border-radius: var(--app-radius-field); background: rgb(var(--v-theme-surface)); transition: box-shadow .15s, border-color .15s;}
  .pc_axis:hover {border-color: rgba(var(--v-theme-primary), .5); box-shadow: 0 2px 10px rgba(var(--v-theme-primary), .12);}
  .pc_axis.is-saving {opacity: .7;}
  .pc_axis__head {display: flex; align-items: center; gap: 8px; margin-bottom: 8px;}
  .pc_axis__ico {display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 8px; background: rgba(var(--v-theme-primary), .12); color: rgb(var(--v-theme-primary));}
  .pc_axis__ico--style {background: rgba(var(--v-theme-secondary), .16); color: rgb(var(--v-theme-secondary));}
  .pc_axis__ico--layout {background: rgba(var(--v-theme-info), .16); color: rgb(var(--v-theme-info));}
  .pc_axis__ico--font {background: rgba(var(--v-theme-warning), .18); color: rgb(var(--v-theme-warning));}
  .pc_axis__label {font-weight: 600; font-size: var(--app-font-value);}
  .pc_axis__state {margin-left: auto; font-size: var(--app-font-desc); color: rgba(var(--v-theme-on-surface), .6);}
  .pc_axis__row {display: flex; align-items: center; gap: 6px;}
  .pc_axis__select {flex: 1 1 auto; min-width: 0;}
  .pc_axis__edit {color: rgb(var(--v-theme-primary));}
  .pc_axis__edit:hover {background: rgba(var(--v-theme-primary), .12);}
  @media (max-width: 1100px) { .pc_theme__grid {grid-template-columns: repeat(2, minmax(0, 1fr));} }
  @media (max-width: 640px) { .pc_theme__grid {grid-template-columns: 1fr;} }
</style>
