<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50">
    <div class="p-8 text-center bg-white rounded-xl shadow-lg max-w-md w-full border border-gray-100">
      <h1 class="text-3xl font-bold text-primary mb-4">Vue SPA is Alive!</h1>
      <p class="text-gray-600 mb-6 font-medium">Rendered via Vite Dev Server + Tailwindcss v4</p>

      <!-- SSR Data Display -->
      <div v-if="ssrData?.message" class="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 italic">
        "{{ ssrData.message }}"
        <p class="mt-2 text-xs font-bold">— {{ ssrData.user?.name }} ({{ ssrData.user?.role }})</p>
      </div>
      
      <div v-if="apiResponse" class="mb-6 p-4 bg-gray-50 rounded-lg text-left border border-gray-100">
        <p class="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Live from Hono API (/api/examples):</p>
        <pre class="text-[10px] overflow-auto text-pink-600 font-mono bg-gray-100 p-2 rounded">{{ apiResponse }}</pre>
      </div>

      <div class="flex flex-col gap-3">
        <router-link to="/dashboard" class="w-full px-4 py-2 bg-slate-800 text-white font-medium rounded hover:bg-slate-700 transition">
          Go to Dashboard
        </router-link>
        <a href="/welcome" class="w-full px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded hover:bg-slate-50 transition">
          Test SSR JSX Route
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const apiResponse = ref<any>(null)
const ssrData = ref<any>((window as any).__INITIAL_STATE__ || {})

// Let's fetch the /api endpoint seamlessly to test the proxy!
onMounted(async () => {
  try {
    const res = await fetch('/api/examples')
    const json = await res.json()
    apiResponse.value = json
  } catch (error) {
    apiResponse.value = { error: 'Failed to fetch the Hono API' }
  }
})
</script>
