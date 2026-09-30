<template>
  <div v-if="!field.hide">
    <div v-if="field.before_html" v-html="field.before_html"></div>
    <div v-if="field.description" class="description">{{ field.description }}</div>
    <div class="options" :class="{'options--grid': field.values && field.values.length > 6}">
      <v-checkbox
        v-for="opt in field.values"
        :key="opt.v"
        :model-value="is_checked(opt.v)"
        :disabled="disabled"
        color="primary"
        hide-details
        density="compact"
        @update:model-value="toggle(opt.v, $event)"
      >
        <template #label>
          <span v-html="opt.d"></span>
        </template>
      </v-checkbox>
    </div>
    <div v-if="field.add_description" class="add_description">{{ field.add_description }}</div>
    <div class="err" v-if="field.error_message" v-html="field.error_message"></div>
    <div class="warn" v-if="field.warning_message" v-html="field.warning_message"></div>
    <div v-if="field.after_html" v-html="field.after_html"></div>
  </div>
</template>

<script>
  export default {
    props: ['form', 'field', 'parent', 'refresh'],
    computed: {
      disabled() {
        return (this.field.read_only || this.form.read_only) ? true : false
      }
    },
    watch: {
      refresh() {
        this.selected = this.parse(this.field.value)
      }
    },
    data() {
      return {
        selected: []
      }
    },
    created() {
      this.selected = this.parse(this.field.value)
    },
    methods: {
      parse(val) {
        if (!val) return []
        let out = []
        let re = /;([^;]+);/g
        let m
        while ((m = re.exec(val)) !== null) out.push(m[1])
        return out
      },
      join(keys) {
        return keys.map(k => ';' + k + ';').join('')
      },
      is_checked(v) {
        return this.selected.indexOf(v) !== -1
      },
      toggle(v, on) {
        let i = this.selected.indexOf(v)
        if (on && i === -1) this.selected.push(v)
        if (!on && i !== -1) this.selected.splice(i, 1)
        this.field.value = this.join(this.selected)
        if (this.parent) {
          this.parent({ value: this.field.value, error: this.field.error, name: this.field.name })
        } else {
          this.emitChange(this.field)
        }
      }
    }
  }
</script>

<style scoped>
  .description {
    margin-top: 5px;
    margin-bottom: 4px;
    font-weight: 700;
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-size: 12px;
  }
  .options {
    display: block;
  }
  .options--grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 16px;
    align-items: start;
  }
  .options :deep(.v-selection-control) {
    align-items: flex-start;
    min-height: 28px;
    margin-top: 0;
  }
  .options :deep(.v-selection-control__wrapper) {
    margin-inline-start: 0;
    margin-top: 0;
  }
  .options :deep(.v-label) {
    font-size: var(--app-font-label, 12px) !important;
    opacity: 1;
    line-height: 1.4;
  }
  @media (max-width: 959.98px) {
    .options--grid {
      grid-template-columns: 1fr;
    }
  }
</style>
