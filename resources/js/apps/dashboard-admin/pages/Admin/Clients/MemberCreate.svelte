<script lang="ts">
  import { untrack } from 'svelte'
  import { Link, useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import TextInput from '../../../components/TextInput.svelte'
  import PasswordInput from '../../../components/PasswordInput.svelte'
  import SelectInput from '../../../components/SelectInput.svelte'

  interface ClientRole {
    id: number
    name: string
    slug?: string
    type: string
  }

  interface ClientInfo {
    id: number
    name: string
    slug: string
    status: string
  }

  interface Props {
    appName?: string
    client: ClientInfo
    clientRoles?: ClientRole[]
    authUser?: { name: string; email: string }
    flash?: { success?: string; error?: string }
    errors?: Record<string, string>
  }

  let {
    appName = '',
    client,
    clientRoles = [],
    authUser,
    flash = {},
    errors = {},
  }: Props = $props()

  const form = useForm({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    roleId: '',
  })

  $effect(() => {
    if (clientRoles.length > 0 && !form.roleId) {
      form.roleId = String(clientRoles[0].id)
    }
  })

  $effect(() => {
    if (Object.keys(errors).length > 0) {
      untrack(() => {
        form.setError(errors)
      })
    }
  })

  const submit = () => {
    form.post(route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_INVITE, { id: client.id }))
  }
</script>

<svelte:head>
  <title>Add Member — {client.name} — {appName || 'AdminPanel'}</title>
</svelte:head>

<AdminLayout current="clients" user={authUser ?? undefined}>
  <!-- Breadcrumb -->
  <div class="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
    <Link href={route(ROUTES.WEB.ADMIN.CLIENTS)} class="transition-colors hover:text-zinc-900 dark:hover:text-white">
      Clients
    </Link>
    <span>/</span>
    <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_SHOW_PAGE, { id: client.id })} class="transition-colors hover:text-zinc-900 dark:hover:text-white">
      {client.name}
    </Link>
    <span>/</span>
    <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id })} class="transition-colors hover:text-zinc-900 dark:hover:text-white">
      Members
    </Link>
    <span>/</span>
    <span class="font-medium text-zinc-900 dark:text-white">Add Member</span>
  </div>

  <!-- Header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Add Team Member
      </h1>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        Create an account and assign organization access for <span class="font-bold text-zinc-800 dark:text-zinc-200">{client.name}</span>.
      </p>
    </div>

    <div>
      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id })}>
        <Button variant="secondary">Back to Members</Button>
      </Link>
    </div>
  </div>

  <!-- Flash Error -->
  {#if flash?.error}
    <div class="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}

  <!-- Form Card -->
  <section class="card mt-6 p-6 sm:p-8">
    <form class="space-y-6" onsubmit={(e) => { e.preventDefault(); submit(); }}>
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label for="member-name" class="label">Full Name</label>
          <TextInput
            id="member-name"
            bind:value={form.name}
            placeholder="e.g. Jane Doe"
            error={form.errors.name}
            required
          />
        </div>

        <div>
          <label for="member-email" class="label">Email Address</label>
          <TextInput
            id="member-email"
            type="email"
            bind:value={form.email}
            placeholder="e.g. jane@company.com"
            error={form.errors.email}
            required
          />
        </div>

        <div>
          <label for="member-password" class="label">Password</label>
          <PasswordInput
            id="member-password"
            bind:value={form.password}
            placeholder="Minimum 8 characters"
            autocomplete="new-password"
            error={form.errors.password}
            required
          />
          <p class="hint">Minimum 8 characters.</p>
        </div>

        <div>
          <label for="member-password-confirm" class="label">Confirm Password</label>
          <PasswordInput
            id="member-password-confirm"
            bind:value={form.passwordConfirmation}
            placeholder="Repeat password"
            autocomplete="new-password"
            error={form.errors.passwordConfirmation}
            required
          />
        </div>

        <div class="sm:col-span-2">
          <label for="member-role" class="label">Organization Role</label>
          <SelectInput
            id="member-role"
            bind:value={form.roleId}
            error={form.errors.roleId}
            required
          >
            {#each clientRoles as role (role.id)}
              <option value={String(role.id)}>{role.name}</option>
            {/each}
          </SelectInput>
          <p class="hint">Determines what this team member can access and manage in this client account.</p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id })}>
          <Button variant="secondary" type="button">Cancel</Button>
        </Link>
        <Button variant="primary" type="submit" disabled={form.processing}>
          {form.processing ? 'Adding Member...' : 'Add Team Member'}
        </Button>
      </div>
    </form>
  </section>
</AdminLayout>
