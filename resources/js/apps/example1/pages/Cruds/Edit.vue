<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3'

interface Crud {
  id: number
  title: string
  content: string
}

interface Props {
  appName?: string
  crud: Crud
}

const props = withDefaults(defineProps<Props>(), { appName: '' })

// Edit form — prefilled from server props; PUT via Inertia (302 -> 303 rewrite
// is handled by the server middleware per the Inertia protocol).
const form = useForm({
  title: props.crud.title,
  content: props.crud.content,
})

const update = () => form.put(`/cruds/${props.crud.id}`)
</script>

<template>
  <div class="min-h-screen p-6 max-w-2xl mx-auto">
    <Head :title="`Edit: ${props.crud.title}`" />

    <h1 class="text-3xl font-black text-slate-900 mb-6 tracking-tight">Edit CRUD item #{{ props.crud.id }}</h1>

    <form class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4" @submit.prevent="update">
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
        <label class="block text-sm font-medium text-slate-700 mb-1" for="content">Content</label>
        <textarea
          id="content"
          v-model="form.content"
          rows="4"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        <p v-if="form.errors.content" class="mt-1 text-sm text-red-600">{{ form.errors.content }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="submit"
          :disabled="form.processing"
          class="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
        >
          {{ form.processing ? 'Saving…' : 'Update' }}
        </button>
        <a href="/" class="text-sm font-semibold text-slate-500 hover:underline">Cancel</a>
      </div>
    </form>
  </div>
</template>
