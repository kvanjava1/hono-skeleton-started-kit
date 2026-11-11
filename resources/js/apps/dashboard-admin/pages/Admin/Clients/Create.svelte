<script lang="ts">
  import { untrack } from 'svelte'
  import { Link, useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import TextInput from '../../../components/TextInput.svelte'
  import SelectInput from '../../../components/SelectInput.svelte'

  interface Props {
    appName?: string
    authUser?: { name: string; email: string }
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let { appName = '', authUser, flash = {}, errors = {} }: Props = $props()

  const form = useForm({
    name: '',
    slug: '',
    status: 'ACTIVE',
  })

  $effect(() => {
    if (Object.keys(errors).length > 0) {
      untrack(() => {
        form.setError(errors)
      })
    }
  })

  const submit = () => form.post(route(ROUTES.WEB.ADMIN.CLIENTS_CREATE))
</script>

<svelte:head>
  <title>Add Client — {appName || 'AdminPanel'}</title>
</svelte:head>

<AdminLayout user={authUser ?? undefined} current="clients">
  <!-- Breadcrumb & Header -->
  <div>
    <div class="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS)} class="transition-colors hover:text-zinc-900 dark:hover:text-white">
        Clients
      </Link>
      <span>/</span>
      <span class="font-medium text-zinc-900 dark:text-white">Add Client</span>
    </div>
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Add Client</h1>
    <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">Register a new client organization profile.</p>
  </div>

  {#if flash?.error}
    <div class="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}

  <section class="card mt-6 p-6 sm:p-8">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <!-- Context & Guidance Column -->
      <div class="lg:col-span-1">
        <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Organization Profile</h2>
        <p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Register an organization profile. Once created, team members and API credentials can be managed inside the client organization view.
        </p>

        <div class="mt-6 border-l-2 border-zinc-300 pl-4 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <p class="font-semibold text-zinc-700 dark:text-zinc-300">Status Lookup</p>
          <p class="mt-1">Active organizations have immediate access to API endpoints and portal capabilities.</p>
        </div>
      </div>

      <!-- Form Column -->
      <div class="lg:col-span-2">
        <form onsubmit={(e) => { e.preventDefault(); submit(); }} class="space-y-6">
          <div>
            <label for="client-name" class="label">Organization Name</label>
            <TextInput
              id="client-name"
              placeholder="e.g. PT Sukses Makmur"
              required
              bind:value={form.name}
              error={form.errors.name}
            />
          </div>

          <div>
            <label for="client-slug" class="label">Slug (Optional)</label>
            <TextInput
              id="client-slug"
              placeholder="e.g. pt-sukses-makmur (auto-generated if empty)"
              bind:value={form.slug}
              error={form.errors.slug}
            />
            <p class="hint">Unique identifier used for vanity URLs and tenant matching.</p>
          </div>

          <div>
            <label for="client-status" class="label">Initial Status</label>
            <SelectInput
              id="client-status"
              bind:value={form.status}
              error={form.errors.status}
            >
              <option value="ACTIVE">ACTIVE — Normal active state</option>
              <option value="INACTIVE">INACTIVE — Temporarily inactive</option>
              <option value="SUSPENDED">SUSPENDED — Blocked</option>
            </SelectInput>
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
            <Link href={route(ROUTES.WEB.ADMIN.CLIENTS)}>
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" disabled={form.processing}>
              {form.processing ? 'Saving...' : 'Save Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </section>
</AdminLayout>
