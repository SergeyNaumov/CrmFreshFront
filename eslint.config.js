import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      globals: {
        __API_URL__: "readonly"  // Объявляем глобальную переменную как доступную только для чтения
      }
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/html-indent': ['error', 2, { // 2 пробела для отступов
        'attribute': 1,
        'baseIndent': 1,
        'closeBracket': 0,
        'alignAttributesVertically': false,
        'ignores': []
      }],
      'vue/first-attribute-linebreak': ['error', {
        'singleline': 'ignore', // Разрешить любой стиль для однострочных элементов
        'multiline': 'below'    // Требовать перенос строки перед первым атрибутом для многострочных элементов
      }],
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off'
      // 'vue/html-self-closing': ['error', {
      //   'html': {
      //     // always / never
      //     'void': 'never', // Всегда требовать самозакрытие для пустых элементов (например, <img />, <br />)
      //     'normal': 'never', // Запретить самозакрытие для непустых элементов (например, <div></div>)
      //     'component': 'never' // Всегда требовать самозакрытие для Vue-компонентов
      //   },
      //   'svg': 'never', // Всегда требовать самозакрытие для SVG-элементов
      //   'math': 'never' // Всегда требовать самозакрытие для MathML-элементов
      // }]
    },
  }
]
