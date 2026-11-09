<script lang="ts">
  import { Link, useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../lib/routes.ts'

  interface Crud {
    id: number
    title: string
    content: string
  }

  interface Props {
    appName?: string
    crud: Crud
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let { appName = '', crud, flash = {}, errors = {} }: Props = $props()

  // Edit form — prefilled once from the initial server props (the closure
  // intentionally captures the first render's values); PUT via Inertia
  // (302 -> 303 rewrite is handled by the server middleware per the
  // Inertia protocol).
  const form = useForm(() => ({
    title: crud.title,
    content: crud.content,
  }))

  // Validation errors that arrive via the session flash (redirect-back flow
  // for service-level errors) are surfaced through the shared `errors` prop.
  $effect(() => {
    if (Object.keys(errors).length > 0) form.setError(errors)
  })

  const update = () => form.put(route(ROUTES.WEB.EXAMPLE_CRUD.UPDATE, { id: crud.id }))
</script>

<svelte:head>
  <title>Edit: {crud.title} — {appName}</title>
</svelte:head>

<div class="min-h-screen p-6 max-w-2xl mx-auto">
  <h1 class="text-3xl font-black text-slate-900 mb-6 tracking-tight">Edit CRUD item #{crud.id}</h1>

  {#if flash?.success}
    <div class="mb-6 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
      {flash.success}
    </div>
  {/if}
  {#if flash?.error}
    <div class="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
      {flash.error}
    </div>
  {/if}

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
      <Link href="/" class="text-sm font-semibold text-slate-500 hover:underline">Cancel</Link>
    </div>
  </form>
</div>
