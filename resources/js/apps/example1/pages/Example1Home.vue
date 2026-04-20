<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
      <p class="text-slate-500 text-lg">Welcome to the Vue-powered SPA section.</p>
    </header>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 class="font-bold text-xl mb-4 text-indigo-600">Navigation</h3>
        <div class="space-y-3 flex flex-col">
          <router-link to="/user" class="text-slate-700 hover:text-indigo-600 font-medium">
            → Go to User Management (/dashboard/user)
          </router-link>
          <a href="/" class="text-slate-700 hover:text-red-600 font-medium">
            ← Exit to Home (Pure SSR)
          </a>
        </div>
      </div>

      <div class="p-6 bg-indigo-600 text-white rounded-2xl shadow-lg">
        <h3 class="font-bold text-xl mb-2 text-white">Server Data</h3>
        <p class="text-indigo-100 mb-4 text-sm">Data injected from Hono SSR:</p>
        <pre class="bg-indigo-700/50 p-4 rounded-xl text-xs overflow-auto">{{ serverData }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
const serverData = window.__INITIAL_STATE__ || {};
</script>
