<template>
    <div class="codelist">
        <div v-if="field.before_html" v-html="field.before_html"></div>
        <field-buttons :form="form" :field="field" :after_update="update_content"/>

        <div v-if="!field.hide">
            <div v-if="fast_rules.length && !is_read_only" class="codelist_fast_rules">
                <v-select
                    v-model="fast_rule_url"
                    :items="fast_rules"
                    item-title="header"
                    item-value="url"
                    label="быстрое правило"
                    density="compact"
                    variant="outlined"
                    hide-details
                    clearable
                    :loading="fast_rule_loading"
                    :disabled="fast_rule_loading"
                />
                <v-btn
                    color="primary"
                    size="small"
                    :disabled="!fast_rule_url || fast_rule_loading"
                    @click="load_fast_rule(fast_rule_url)"
                >применить</v-btn>
            </div>

            <div class="codelist_head">
                <span class="codelist_label">{{ field.description }}</span>
                <span class="codelist_tools">
                    <v-btn icon size="x-small" variant="text" title="Поиск / замена" @click="cmd_search"><v-icon size="small">mdi-magnify</v-icon></v-btn>
                    <v-btn icon size="x-small" variant="text" title="Отменить" @click="cmd_undo"><v-icon size="small">mdi-undo</v-icon></v-btn>
                    <v-btn icon size="x-small" variant="text" title="Вернуть" @click="cmd_redo"><v-icon size="small">mdi-redo</v-icon></v-btn>
                    <v-btn icon size="x-small" variant="text" title="Свернуть всё" @click="cmd_fold_all"><v-icon size="small">mdi-arrow-collapse-vertical</v-icon></v-btn>
                    <v-btn icon size="x-small" variant="text" title="Развернуть всё" @click="cmd_unfold_all"><v-icon size="small">mdi-arrow-expand-vertical</v-icon></v-btn>
                    <v-btn :icon="true" size="x-small" variant="text" :title="wrap_on ? 'Отключить перенос строк' : 'Перенос строк'" @click="toggle_wrap"><v-icon size="small">{{ wrap_on ? 'mdi-wrap' : 'mdi-wrap-disabled' }}</v-icon></v-btn>
                    <v-btn :icon="true" size="x-small" variant="text" :color="show_whitespace ? 'primary' : undefined" :title="show_whitespace ? 'Скрыть пробелы и табы' : 'Показать пробелы и табы'" @click="toggle_whitespace"><v-icon size="small">mdi-dots-horizontal</v-icon></v-btn>
                    <v-btn :icon="true" size="x-small" variant="text" :color="indent_with_tabs ? 'primary' : undefined" :title="indent_with_tabs ? 'Отступы табами (нажмите для пробелов)' : 'Отступы пробелами (нажмите для табов)'" @click="toggle_indent"><v-icon size="small">mdi-keyboard-tab</v-icon></v-btn>
                    <span class="codelist_lang">{{ lang_title }}</span>
                </span>
            </div>

            <div class="codelist_box" :style="box_style" ref="host"></div>
            <div class="err" v-if="fast_rule_error">{{ fast_rule_error }}</div>
        </div>

        <div class="add_description" v-if="field.add_description">{{ field.add_description }}</div>
        <div class="err" v-if="error_text" v-html="error_text"></div>
        <div v-if="field.after_html" v-html="field.after_html"></div>
    </div>
</template>
<script>
  import { EditorView, keymap, placeholder as cm_placeholder, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLine, highlightWhitespace } from '@codemirror/view'
  import { EditorState, Compartment } from '@codemirror/state'
  import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo } from '@codemirror/commands'
  import { searchKeymap, highlightSelectionMatches, openSearchPanel } from '@codemirror/search'
  import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle, StreamLanguage, foldGutter, foldKeymap, foldAll, unfoldAll, indentUnit } from '@codemirror/language'
  import { closeBrackets, closeBracketsKeymap, autocompletion, completeAnyWord } from '@codemirror/autocomplete'
  import { perl } from '@codemirror/legacy-modes/mode/perl'
  import field_buttons from './frontend/buttons.vue'
  import { field_update, check_fld } from './field_functions'
  import { bus } from '../../main'

  const LANG_TITLES = {
    perl: 'perl', python: 'python', javascript: 'javascript', js: 'javascript',
    sql: 'sql', shell: 'shell', bash: 'shell', css: 'css', xml: 'xml',
    ruby: 'ruby', lua: 'lua', clike: 'C-like', java: 'C-like', c: 'C-like'
  }

  const MODERN_LANG = {
    python: () => import('@codemirror/lang-python').then(m => m.python()),
    javascript: () => import('@codemirror/lang-javascript').then(m => m.javascript()),
    js: () => import('@codemirror/lang-javascript').then(m => m.javascript())
  }

  const LEGACY_LANG = {
    sql: () => import('@codemirror/legacy-modes/mode/sql'),
    shell: () => import('@codemirror/legacy-modes/mode/shell'),
    css: () => import('@codemirror/legacy-modes/mode/css'),
    xml: () => import('@codemirror/legacy-modes/mode/xml'),
    ruby: () => import('@codemirror/legacy-modes/mode/ruby'),
    lua: () => import('@codemirror/legacy-modes/mode/lua'),
    clike: () => import('@codemirror/legacy-modes/mode/clike')
  }

  const LANG_CACHE = {}

  function legacy_support(name, mod) {
    const desc = mod[name]
    return desc ? StreamLanguage.define(desc) : null
  }

  function language_support(name) {
    if (name in LANG_CACHE) return LANG_CACHE[name]
    if (name == 'perl') {
      LANG_CACHE[name] = StreamLanguage.define(perl)
      return LANG_CACHE[name]
    }
    if (name in MODERN_LANG) {
      LANG_CACHE[name] = MODERN_LANG[name]()
      return LANG_CACHE[name]
    }
    if (name in LEGACY_LANG) {
      LANG_CACHE[name] = LEGACY_LANG[name]().then(mod => legacy_support(name, mod))
      return LANG_CACHE[name]
    }
    return null
  }

  const CM_THEME = EditorView.theme({
    '&': {
      height: '100%',
      backgroundColor: 'transparent',
      color: 'rgba(var(--v-theme-on-surface), 1)',
      fontSize: 'var(--app-font-code, 13px)'
    },
    '&.cm-focused': { outline: 'none' },
    '.cm-scroller': {
      fontFamily: 'var(--app-font-mono, monospace)',
      lineHeight: '1.5',
      overflow: 'auto'
    },
    '.cm-content': {
      caretColor: 'rgb(var(--v-theme-primary))',
      padding: '6px 0'
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      color: 'rgba(var(--v-theme-on-surface), .45)',
      border: 'none',
      borderRight: '1px solid rgba(var(--v-theme-on-surface), .12)'
    },
    '.cm-activeLine': { backgroundColor: 'var(--app-tint)' },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: 'rgba(var(--v-theme-on-surface), .8)'
    },
    '.cm-selectionBackground': { backgroundColor: 'rgba(var(--v-theme-primary), .25)' },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'rgb(var(--v-theme-primary))',
      borderLeftWidth: '2px'
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgba(var(--v-theme-primary), .25)',
      outline: '1px solid rgba(var(--v-theme-primary), .5)'
    },
    '.cm-placeholder': { color: 'rgba(var(--v-theme-on-surface), .4)' }
  })

  const CM_EXTENSIONS = [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion({ activateOnTyping: true }),
    EditorState.languageData.of(() => [{ autocomplete: completeAnyWord }]),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true })
  ]

  export default {
    props: ['form', 'field', 'parent', 'refresh', 'error_messages'],
    components: {
      'field-buttons': field_buttons
    },
    data: function () {
      return {
        value: '',
        fast_rule_url: '',
        fast_rule_loading: false,
        fast_rule_error: '',
        wrap_on: true,
        show_whitespace: !!this.field.show_whitespace,
        indent_with_tabs: !!this.field.indent_with_tabs,
        indent_size: (parseInt(this.field.indent_size) > 0) ? parseInt(this.field.indent_size) : 4
      }
    },
    created() {
      this.view = null
      this.silent = false
      this.lang_token = 0
      this.lang_comp = new Compartment()
      this.read_comp = new Compartment()
      this.wrap_comp = new Compartment()
      this.ws_comp = new Compartment()
      this.indent_comp = new Compartment()
      this._field_update = (new_data) => { field_update(new_data, this) }
      if (!this.parent) bus.$on('field-update:' + this.field.name, this._field_update)
      this.value = this.doc_value
    },
    beforeUnmount() {
      if (this.view) {
        this.view.destroy()
        this.view = null
      }
      if (!this.parent) bus.$off('field-update:' + this.field.name, this._field_update)
    },
    computed: {
      doc_value() {
        const v = this.field.value
        return (v === undefined || v === null) ? '' : String(v)
      },
      lang_name() {
        const l = this.field.language || this.field.lang || this.field.mode
        if (l === 'plain' || l === 'text' || l === '') return ''
        return String(l || 'perl').toLowerCase()
      },
      lang_title() {
        return LANG_TITLES[this.lang_name] || this.lang_name
      },
      rows() {
        const r = parseInt(this.field.rows)
        return (r > 0) ? r : 20
      },
      box_style() {
        return { height: `calc(${this.rows} * 1.5em + 14px)` }
      },
      is_read_only() {
        return !!(this.field.read_only || (this.form && this.form.read_only))
      },
      error_text() {
        return this.error_messages || this.field.error_message
      },
      fast_rules() {
        const fr = this.field.fast_rules
        if (!Array.isArray(fr)) return []
        return fr.filter(r => r && r.url && r.header)
      }
    },
    watch: {
      field() {
        this.sync_doc()
        this.apply_language()
        this.apply_read_only()
      },
      refresh() {
        this.sync_doc()
      },
      value(v) {
        this.set_doc(v)
      },
      lang_name() {
        this.apply_language()
      },
      is_read_only() {
        this.apply_read_only()
      }
    },
    mounted() {
      this.build_editor()
    },
    methods: {
      build_editor() {
        if (this.view || !this.$refs.host) return
        const state = EditorState.create({
          doc: this.doc_value,
          extensions: [
            ...CM_EXTENSIONS,
            CM_THEME,
            keymap.of([
              indentWithTab,
              closeBracketsKeymap,
              defaultKeymap,
              historyKeymap,
              foldKeymap,
              searchKeymap
            ]),
            this.field.placeholder ? cm_placeholder(this.field.placeholder) : [],
            this.lang_comp.of([]),
            this.wrap_comp.of(this.wrap_on ? EditorView.lineWrapping : []),
            this.ws_comp.of(this.show_whitespace ? highlightWhitespace() : []),
            this.indent_comp.of(this.indent_ext()),
            EditorState.tabSize.of(this.indent_size),
            this.read_comp.of([]),
            EditorView.updateListener.of(u => {
              if (u.docChanged) this.doc_changed(u.state.doc.toString())
            })
          ]
        })
        this.view = new EditorView({ state, parent: this.$refs.host })
        this.apply_language()
        this.apply_read_only()
      },
      doc_changed(text) {
        if (this.silent) return
        this.value = text
        check_fld(this)
      },
      set_doc(text) {
        if (!this.view) return
        const v = (text === undefined || text === null) ? '' : String(text)
        if (v === this.view.state.doc.toString()) return
        this.silent = true
        this.view.dispatch({ changes: { from: 0, to: this.view.state.doc.length, insert: v } })
        this.silent = false
      },
      sync_doc() {
        this.set_doc(this.field.value)
      },
      update_content() {
        this.sync_doc()
      },
      apply_language() {
        if (!this.view) return
        const token = ++this.lang_token
        const support = language_support(this.lang_name)
        const reconfigure = (ext) => {
          if (this.view && token == this.lang_token) {
            this.view.dispatch({ effects: this.lang_comp.reconfigure(ext) })
          }
        }
        if (!support) {
          reconfigure([])
        } else if (support instanceof Promise) {
          support.then(ext => reconfigure(ext ? [ext] : [])).catch(e => {
            console.error('codelist: не удалось загрузить язык', this.lang_name, e)
          })
        } else {
          reconfigure([support])
        }
      },
      apply_read_only() {
        if (!this.view) return
        this.view.dispatch({
          effects: this.read_comp.reconfigure(
            this.is_read_only
              ? [EditorState.readOnly.of(true), EditorView.editable.of(false)]
              : []
          )
        })
      },
      run_cmd(cmd) {
        if (!this.view) return
        cmd(this.view)
        this.view.focus()
      },
      cmd_search() { this.run_cmd(openSearchPanel) },
      cmd_undo() { this.run_cmd(undo) },
      cmd_redo() { this.run_cmd(redo) },
      cmd_fold_all() { this.run_cmd(foldAll) },
      cmd_unfold_all() { this.run_cmd(unfoldAll) },
      toggle_wrap() {
        this.wrap_on = !this.wrap_on
        if (this.view) {
          this.view.dispatch({
            effects: this.wrap_comp.reconfigure(this.wrap_on ? EditorView.lineWrapping : [])
          })
        }
      },
      indent_ext() {
        return indentUnit.of(this.indent_with_tabs ? '\t' : ' '.repeat(this.indent_size))
      },
      toggle_indent() {
        this.indent_with_tabs = !this.indent_with_tabs
        if (this.view) {
          this.view.dispatch({ effects: this.indent_comp.reconfigure(this.indent_ext()) })
        }
      },
      toggle_whitespace() {
        this.show_whitespace = !this.show_whitespace
        if (this.view) {
          this.view.dispatch({
            effects: this.ws_comp.reconfigure(this.show_whitespace ? highlightWhitespace() : [])
          })
        }
      },
      load_fast_rule(url) {
        if (!url) return
        this.fast_rule_error = ''
        this.fast_rule_loading = true
        this.$http.get(url).then(r => {
          this.fast_rule_loading = false
          const d = r.data
          if (!d || !d.success) {
            this.fast_rule_error = 'не удалось получить быстрое правило'
            return
          }
          this.set_doc(d.data === undefined || d.data === null ? '' : d.data)
          this.value = this.view ? this.view.state.doc.toString() : ''
          check_fld(this)
        }).catch(e => {
          this.fast_rule_loading = false
          this.fast_rule_error = 'ошибка запроса быстрого правила'
          console.error('codelist: fast_rule error', e)
        })
      }
    }
  }
</script>
<style scoped lang="scss">
  .codelist {
    width: 100%;
  }
  .codelist_head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--app-space-inline);
    margin-bottom: 4px;
  }
  .codelist_label {
    font-size: var(--app-font-label);
    color: rgba(var(--v-theme-on-surface), .7);
    font-weight: bold;
  }
  .codelist_lang {
    font-size: var(--app-font-desc);
    color: rgba(var(--v-theme-on-surface), .5);
    font-family: var(--app-font-mono, monospace);
  }
  .codelist_tools {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    white-space: nowrap;
  }
  .codelist_tools .v-btn {
    margin: 0;
    min-width: 0;
  }
  .codelist_box {
    border: 1px solid rgba(var(--v-theme-on-surface), .24);
    border-radius: var(--app-radius-field);
    background-color: var(--app-tint);
    overflow: hidden;
  }
  .codelist_fast_rules {
    display: flex;
    align-items: center;
    gap: var(--app-space-inline);
    margin-bottom: 8px;
  }
  .codelist_fast_rules .v-input {max-width: 460px;}
  .add_description {
    font-size: var(--app-font-desc);
    color: rgba(var(--v-theme-on-surface), .6);
    margin-top: 4px;
  }
  .err {
    color: rgb(var(--v-theme-error));
    font-size: var(--app-font-desc);
    margin-top: 4px;
  }
</style>
