import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

// TypeScript support inside <script lang="ts"> blocks of .svelte files.
export default {
  preprocess: vitePreprocess(),
}
