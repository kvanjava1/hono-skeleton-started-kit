<script setup lang="ts">
import { Head, Link, router, useForm } from '@inertiajs/vue3'

interface Crud {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

interface Props {
  appName?: string
  cruds: Crud[]
}

const props = withDefaults(defineProps<Props>(), { appName: '' })

// Create form — server replies 422 + { errors } on validation failure and
// Inertia fills this error bag automatically. Success redirects to "/".
const form = useForm({ title: '', content: '' })

const create = () => form.post('/cruds')

const destroy = (crud: Crud) => {
  if (!confirm(`Delete "${crud.title}"?`)) return
  router.delete(`/cruds/${crud.id}`)
}

const formatDate = (value: string) => new Date(value.replace(' ', 'T') + 'Z').toLocaleString()
</script>

<template>
  <div class="min-h-screen p-6 max-w-3xl mx-auto">
    <Head title="Cruds — Inertia + Vue" />

    <div class="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
      {{ props.appName }} — CRUD via Inertia (same service as /api/example/cruds)
    </div>

    <h1 class="text-3xl font-black text-slate-900 mb-6 tracking-tight">Example CRUD</h1>

    <!-- Create -->
    <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-8 space-y-3" @submit.prevent="create">
      <h2 class="text-lg font-bold text-slate-900">Create new item</h2>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="title">Title</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
        <p v-if="form.errors.title" class="mt-1 text-sm text-red-600">{{ form.errors.title }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1" for="content">Content (optional)</label>
        <textarea
          id="content"
          v-model="form.content"
          rows="2"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <p v-if="form.errors.content" class="mt-1 text-sm text-red-600">{{ form.errors.content }}</p>
      </div>
      <button
        type="submit"
        :disabled="form.processing"
        class="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
      >
        {{ form.processing ? 'Saving…' : 'Create' }}
      </button>
    </form>

    <!-- List -->
    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
      <p v-if="props.cruds.length === 0" class="p-6 text-slate-500">
        No items yet — create the first one above.
      </p>
      <div v-for="crud in props.cruds" :key="crud.id" class="p-5 flex items-start justify-between gap-4">
        <div>
          <h3 class="font-bold text-slate-900">{{ crud.title }}</h3>
          <p v-if="crud.content" class="text-sm text-slate-600 mt-1 whitespace-pre-line">{{ crud.content }}</p>
          <p class="text-xs text-slate-400 mt-2">#{{ crud.id }} · created {{ formatDate(crud.createdAt) }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <Link
            :href="`/cruds/${crud.id}/edit`"
            class="px-3 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
          >
            Edit
          </Link>
          <button
            type="button"
            class="px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
            @click="destroy(crud)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <div class="mt-8 flex gap-4 text-sm">
      <Link href="/spa-demo" class="font-semibold text-indigo-600 hover:underline">SPA demo page →</Link>
      <a href="/api/docs" class="font-semibold text-slate-500 hover:underline">API documentation</a>
    </div>
  </div>
</template>
