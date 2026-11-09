<script lang="ts">
  import { Link, router, useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../lib/routes.ts'

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
    cruds?: Crud[]
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let { appName = '', cruds = [], flash = {}, errors = {} }: Props = $props()

  // Create form — server replies 422 + { errors } on validation failure and
  // Inertia fills this error bag automatically. On success the server
  // redirects back to "/" and the fields are reset explicitly.
  const form = useForm({ title: '', content: '' })

  // Validation errors that arrive via the session flash (redirect-back flow
  // for service-level errors) are surfaced through the shared `errors` prop.
  $effect(() => {
    if (Object.keys(errors).length > 0) form.setError(errors)
  })

  const create = () =>
    form.post(route(ROUTES.WEB.EXAMPLE_CRUD.CREATE), { onSuccess: () => form.reset() })

  const destroy = (crud: Crud) => {
    if (!confirm(`Delete "${crud.title}"?`)) return
    router.delete(route(ROUTES.WEB.EXAMPLE_CRUD.DELETE, { id: crud.id }))
  }

  const formatDate = (value: string) => new Date(value.replace(' ', 'T') + 'Z').toLocaleString()
</script>

<svelte:head>
  <title>Cruds — {appName}</title>
</svelte:head>

<div class="min-h-screen p-6 max-w-3xl mx-auto">
  <div class="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 rounded-full">
    {appName} — CRUD via Inertia (same service as /api/example/cruds)
  </div>

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

  <h1 class="text-3xl font-black text-slate-900 mb-6 tracking-tight">Example CRUD</h1>

  <!-- Create -->
  <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-8 space-y-3" onsubmit={e => { e.preventDefault(); create() }}>
    <h2 class="text-lg font-bold text-slate-900">Create new item</h2>
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
      <label class="block text-sm font-medium text-slate-700 mb-1" for="content">Content (optional)</label>
      <textarea
        id="content"
        bind:value={form.content}
        rows="2"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      ></textarea>
      {#if form.errors.content}
        <p class="mt-1 text-sm text-red-600">{form.errors.content}</p>
      {/if}
    </div>
    <button
      type="submit"
      disabled={form.processing}
      class="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
    >
      {form.processing ? 'Saving…' : 'Create'}
    </button>
  </form>

  <!-- List -->
  <div class="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
    {#if cruds.length === 0}
      <p class="p-6 text-slate-500">No items yet — create the first one above.</p>
    {:else}
      {#each cruds as crud (crud.id)}
        <div class="p-5 flex items-start justify-between gap-4">
          <div>
            <h3 class="font-bold text-slate-900">{crud.title}</h3>
            {#if crud.content}
              <p class="text-sm text-slate-600 mt-1 whitespace-pre-line">{crud.content}</p>
            {/if}
            <p class="text-xs text-slate-400 mt-2">#{crud.id} · created {formatDate(crud.createdAt)}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <Link
              href={route(ROUTES.WEB.EXAMPLE_CRUD.EDIT, { id: crud.id })}
              class="px-3 py-2 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
            >
              Edit
            </Link>
            <button
              type="button"
              class="px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              onclick={() => destroy(crud)}
            >
              Delete
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <a href="/api/docs" class="mt-8 inline-block text-sm font-semibold text-slate-500 hover:underline">API documentation</a>
</div>
