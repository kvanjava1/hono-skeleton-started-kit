import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  base: '/build/',
  server: {
    port: 5173,
    strictPort: true,
  },
  plugins: [tailwindcss(), svelte({ configFile: path.resolve(__dirname, 'svelte.config.js') })],
  root: 'resources',
  publicDir: false,
  build: {
    outDir: path.resolve(__dirname, 'public/build'),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: [
        path.resolve(__dirname, 'resources/css/app.css'),
        path.resolve(__dirname, 'resources/js/apps/dashboard-admin/app.ts'),
        path.resolve(__dirname, 'resources/js/apps/dashboard-client/app.ts'),
      ],
    },
  }
})
