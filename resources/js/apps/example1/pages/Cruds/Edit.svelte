<script lang="ts">
  import { useForm } from '@inertiajs/svelte'

  interface Crud {
    id: number
    title: string
    content: string
  }

  interface Props {
    appName?: string
    crud: Crud
  }

  let { appName = '', crud }: Props = $props()

  // Edit form — prefilled once from the initial server props (the closure
  // intentionally captures the first render's values); PUT via Inertia
  // (302 -> 303 rewrite is handled by the server middleware per the
  // Inertia protocol).
  const form = useForm(() => ({
    title: crud.title,
    content: crud.content,
  }))

  const update = () => form.put(`/cruds/${crud.id}`)
</script>

<svelte:head>
  <title>Edit: {crud.title} — {appName}</title>
</svelte:head>

<div class="min-h-screen p-6 max-w-2xl mx-auto">
  <h1 class="text-3xl font-black text-slate-900 mb-6 tracking-tight">Edit CRUD item #{crud.id}</h1>

  <form class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4" onsubmit={e => { e.preventDefault(); update() }}>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1" for="title">Title</label>
      <input
        id="title"
        bind:value={form.title}
        type="text"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
      {#if form.errors.title}
        <p class="mt-1 text-sm text-red-600">{form.errors.title}</p>
      {/if}
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1" for="content">Content</label>
      <textarea
        id="content"
        bind:value={form.content}
        rows="4"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      ></textarea>
      {#if form.errors.content}
        <p class="mt-1 text-sm text-red-600">{form.errors.content}</p>
      {/if}
    </div>
    <div class="flex items-center gap-3">
      <button
        type="submit"
        disabled={form.processing}
        class="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
      >
        {form.processing ? 'Saving…' : 'Update'}
      </button>
      <a href="/" class="text-sm font-semibold text-slate-500 hover:underline">Cancel</a>
    </div>
  </form>
</div>
