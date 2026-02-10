import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/stockrepo-front/',
  build: {
    // GitHub Pages sometimes serves cached HTML; use stable filenames to avoid 404 on hashed assets
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/chunk-[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss({
      config: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)),
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
