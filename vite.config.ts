import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  plugins: [
    vue(),
    tailwindcss(),
  ],
  root: 'resources',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      // Kita gunakan app.ts sebagai satu-satunya entry point
      input: path.resolve(__dirname, 'resources/js/app.ts'),
    }
  }
})
