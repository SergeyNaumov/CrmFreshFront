// vite.config.mjs
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath } from 'url';
import path from 'path';

// Получаем абсолютный путь к директории
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __API_URL__: JSON.stringify(env.API_URL || 'https://fallback.api.url'),
    },
    plugins: [
      vue(),
      vuetify({
        autoImport: true,
      }),
      visualizer({
        open: true,
      }),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/styles/variables.scss" as *;
            @use "@/styles/main.scss" as *;
            @use "@/styles/vuetify_addon.scss" as *;
          `,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.js', '.vue'],
    },
    server: {
      port: 8081,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('vuetify')) {
                return 'vendor-vuetify';
              }
              if (id.includes('vue-router')) {
                return 'vendor-vue-router';
              }
              if (id.includes('vuex')) {
                return 'vendor-vuex';
              }
              return 'vendor';
            }
          },
        },
      },
    },
  };
});