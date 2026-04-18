<template>
  <div class="p-8">
    <header class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">User Management</h1>
        <p class="text-slate-500">Managing your project users in a sub-route.</p>
      </div>
      <router-link to="/" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold transition-all">
        Back to Dashboard
      </router-link>
    </header>

    <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <table class="w-full text-left">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Name</th>
            <th class="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Role</th>
            <th class="px-6 py-4 font-bold text-slate-600 uppercase text-xs">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="user in users" :key="user.name" class="hover:bg-slate-50">
            <td class="px-6 py-4 font-medium text-slate-900">{{ user.name }}</td>
            <td class="px-6 py-4 text-slate-600">{{ user.role }}</td>
            <td class="px-6 py-4">
              <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Active</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const users = [
  { name: 'Melode', role: 'Super Admin' },
  { name: 'Antigravity', role: 'Lead Architect' },
  { name: 'Hono Dev', role: 'Backend Dev' }
];
</script>
