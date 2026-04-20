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
  publicDir: path.resolve(__dirname, 'public'),
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      // Multiple Entry Points for different SPAs
      input: {
        example1: path.resolve(__dirname, 'resources/js/apps/example1/main.ts'),
        example2: path.resolve(__dirname, 'resources/js/apps/example2/main.ts'),
      },
    }
  }
})
