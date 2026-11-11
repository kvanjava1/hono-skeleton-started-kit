<script lang="ts">
  import { untrack } from 'svelte'
  import { Link, useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import TextInput from '../../../components/TextInput.svelte'
  import PasswordInput from '../../../components/PasswordInput.svelte'

  interface Props {
    appName?: string
    authUser?: { name: string; email: string }
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let { appName = '', authUser, flash = {}, errors = {} }: Props = $props()

  const form = useForm({
    name: '',
    email: '',
    password: '',
    isActive: true,
  })

  $effect(() => {
    if (Object.keys(errors).length > 0) {
      untrack(() => {
        form.setError(errors)
      })
    }
  })

  const submit = () => form.post(route(ROUTES.WEB.ADMIN.USERS_CREATE))
</script>

<svelte:head>
  <title>Add User — {appName}</title>
</svelte:head>

<AdminLayout user={authUser ?? undefined} current="users">
  <!-- Breadcrumb & Header -->
  <div>
    <div class="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      <Link href={route(ROUTES.WEB.ADMIN.USERS)} class="transition-colors hover:text-zinc-900 dark:hover:text-white">
        Users
      </Link>
      <span>/</span>
      <span class="font-medium text-zinc-900 dark:text-white">Add User</span>
    </div>
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Add User</h1>
    <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">Create a new admin account that can access the panel.</p>
  </div>

  {#if flash?.error}
    <div class="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}

  <section class="card mt-6 p-6 sm:p-8">
    <form class="space-y-6" onsubmit={e => { e.preventDefault(); submit() }}>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label for="create-name" class="label">Full Name</label>
          <TextInput
            id="create-name"
            bind:value={form.name}
            placeholder="Full name"
            error={form.errors.name}
            required
          />
        </div>

        <div>
          <label for="create-email" class="label">Email Address</label>
          <TextInput
            id="create-email"
            type="email"
            bind:value={form.email}
            placeholder="name@company.com"
            error={form.errors.email}
            required
          />
        </div>

        <div>
          <label for="create-password" class="label">Password</label>
          <PasswordInput
            id="create-password"
            bind:value={form.password}
            autocomplete="new-password"
            error={form.errors.password}
            required
          />
          <p class="hint">Minimum 8 characters.</p>
        </div>

        <div>
          <label for="create-status" class="label">Initial Status</label>
          <select
            id="create-status"
            class="input"
            bind:value={form.isActive}
          >
            <option value={true}>Active (Can log in immediately)</option>
            <option value={false}>Inactive (Deactivated / Draft)</option>
          </select>
          <p class="hint">Initial account state. Only Active or Inactive accounts can be created.</p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Link href={route(ROUTES.WEB.ADMIN.USERS)}>
          <Button variant="secondary" type="button">Cancel</Button>
        </Link>
        <Button type="submit" disabled={form.processing}>
          {form.processing ? 'Saving…' : 'Create User'}
        </Button>
      </div>
    </form>
  </section>
</AdminLayout>
