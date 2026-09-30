import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

const bases = {
  default: '/',
  trade: '/CrmFresh/',
  svcms: '/manager/',
}

const preserveDistConfigure = () => {
  let saved = null
  let dest = ''
  return {
    name: 'preserve-dist-configure',
    apply: 'build',
    configResolved(config) {
      dest = path.resolve(config.root, config.build.outDir, 'configure.js')
      try {
        saved = fs.readFileSync(dest, 'utf8')
      } catch (e) {
        saved = null
      }
    },
    closeBundle() {
      if (saved !== null && dest) fs.writeFileSync(dest, saved)
    },
  }
}

export default defineConfig(({ mode }) => ({
  base: bases[mode] || '/',
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    preserveDistConfigure(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js',
    },
    extensions: ['.mjs', '.js', '.jsx', '.json', '.vue'],
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/, /chart\.js/],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || ''
          if (name.endsWith('.css')) return 'css/[name][extname]'
          if (/\.(woff2?|eot|ttf|otf)$/.test(name)) return 'fonts/[name][extname]'
          return 'js/[name][extname]'
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8081,
  },
}))
