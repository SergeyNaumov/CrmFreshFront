<template>
  <iframe class="theme_preview_frame" :srcdoc="doc"></iframe>
</template>
<script>
import { SHOWCASE_CSS, SHOWCASE_HTML } from './theme_defs'

function abs(base, path) {
  const b = base || '/'
  return (b.charAt(b.length - 1) === '/' ? b : b + '/') + path
}

export default {
  props: {
    templateBase: { type: String, default: '' },
    styles: { type: Array, default: () => [] }
  },
  computed: {
    doc() {
      const base = this.templateBase || ''
      const bust = '?t=' + Date.now()
      const css = p => abs(base, p) + bust
      const showcase = SHOWCASE_HTML.replace(/src="images\//g, 'src="' + abs(base, 'images/'))
      const inline = (this.styles || []).filter(Boolean).map(s => '<style>' + s + '</style>').join('')
      return '<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8">'
        + '<meta name="viewport" content="width=device-width, initial-scale=1">'
        + '<link rel="stylesheet" href="' + css('css/fonts.css') + '">'
        + '<link rel="stylesheet" href="' + css('css/tokens/_tokens-base.css') + '">'
        + '<link rel="stylesheet" href="' + css('css/style.css') + '">'
        + '<link rel="stylesheet" href="' + css('css/forms.css') + '">'
        + '<style>html,body{margin:0}body{padding:18px;background:var(--body-bg);color:var(--body-color)}</style>'
        + '<style>' + SHOWCASE_CSS + '</style>'
        + inline
        + '</head><body>' + showcase + '</body></html>'
    }
  }
}
</script>
<style scoped>
  .theme_preview_frame {width: 100%; height: 100%; min-height: 520px; border: 1px solid rgba(var(--v-theme-on-surface), .18); border-radius: var(--app-radius-card); background: #fff;}
</style>
