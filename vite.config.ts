//vite.config
import { fileURLToPath, URL } from 'node:url'
import path from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'



export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router']
}
}
}
},
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
},
},
server: {
    host: '0.0.0.0',
    port: 5173,        // Mobil cihazdan erişim için önemli!
    
  }
})