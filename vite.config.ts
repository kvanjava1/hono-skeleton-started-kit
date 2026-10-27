import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  plugins: [tailwindcss()],
  root: 'resources',
  publicDir: false,
  build: {
    outDir: path.resolve(__dirname, 'public/build'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'resources/css/app.css'),
    },
  }
})
