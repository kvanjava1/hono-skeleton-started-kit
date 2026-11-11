<script lang="ts">
  import { Link, router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Badge from '../../../components/Badge.svelte'
  import Button from '../../../components/Button.svelte'

  interface MemberItem {
    id: number
    userId: number
    name: string
    email: string
    roleName: string
    status: string
    createdAt: string
  }

  interface ApiKeyItem {
    id: number
    name: string
    keyPrefix: string
    status: string
    lastUsedAt: string | null
    createdAt: string
    creatorName: string
  }

  interface ClientDetail {
    id: number
    name: string
    slug: string
    status: string
    createdAt: string
    updatedAt: string
    members: MemberItem[]
    apiKeys: ApiKeyItem[]
  }

  interface Props {
    appName?: string
    client: ClientDetail
    authUser?: { name: string; email: string }
    flash?: { success?: string; error?: string }
  }

  let { appName = '', client, authUser, flash = {} }: Props = $props()

  const badgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'emerald'
      case 'SUSPENDED':
        return 'rose'
      case 'PENDING':
        return 'amber'
      default:
        return 'zinc'
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    } catch {
      return iso
    }
  }

  const toggleStatus = () => {
    const action = client.status === 'ACTIVE' ? 'suspend' : 'activate'
    if (!confirm(`Are you sure you want to ${action} client "${client.name}"?`)) return

    router.post(
      route(ROUTES.WEB.ADMIN.CLIENTS_TOGGLE_STATUS, { id: client.id }),
      {},
      { preserveScroll: true },
    )
  }

  const destroyClient = () => {
    if (
      !confirm(
        `Permanently delete client "${client.name}" and all associated data? This action cannot be undone.`,
      )
    )
      return

    router.delete(route(ROUTES.WEB.ADMIN.CLIENTS_DELETE, { id: client.id }), {
      preserveScroll: true,
    })
  }

  const activeMembersCount = $derived(
    client.members.filter((m) => m.status === 'ACTIVE').length,
  )
  const activeKeysCount = $derived(
    client.apiKeys.filter((k) => k.status === 'ACTIVE').length,
  )
</script>

<svelte:head>
  <title>{client.name} — {appName || 'AdminPanel'}</title>
</svelte:head>

<AdminLayout user={authUser ?? undefined} current="clients">
  <!-- Breadcrumb -->
  <div class="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
    <Link href={route(ROUTES.WEB.ADMIN.CLIENTS)} class="transition-colors hover:text-zinc-900 dark:hover:text-white">
      Clients
    </Link>
    <span>/</span>
    <span class="font-medium text-zinc-900 dark:text-white">{client.name}</span>
  </div>

  <!-- Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {client.name}
        </h1>
        <Badge status={client.status}>
          {client.status}
        </Badge>
      </div>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        Organization profile and management overview.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2.5">
      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS)}>
        <Button variant="secondary">Back to Clients</Button>
      </Link>
      {#if client.status === 'ACTIVE'}
        <Button variant="secondary" onclick={toggleStatus}>
          Suspend Client
        </Button>
      {:else}
        <Button variant="primary" onclick={toggleStatus}>
          Activate Client
        </Button>
      {/if}
    </div>
  </div>

  <!-- Flash Messages -->
  {#if flash.success}
    <div class="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
      {flash.success}
    </div>
  {/if}
  {#if flash.error}
    <div class="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}

  <!-- Summary Stat & Management Shortcut Cards -->
  <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
    <!-- Team Members Stat Card -->
    <div class="card flex flex-col justify-between p-6">
      <div>
        <div class="flex items-center justify-between">
          <div class="grid h-10 w-10 place-items-center bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.059 2.772m0 0a5.972 5.972 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <span class="bg-zinc-100 px-2.5 py-0.5 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Personnel
          </span>
        </div>

        <p class="mt-5 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {client.members.length} {client.members.length === 1 ? 'Member' : 'Members'}
        </p>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {activeMembersCount} active personnel authorized to access this organization's portal.
        </p>
      </div>

      <div class="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Link
          href={route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id })}
          class="flex items-center justify-between text-base font-semibold text-zinc-900 transition-colors hover:text-zinc-600 dark:text-white dark:hover:text-zinc-300"
        >
          <span>Manage Members</span>
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>

    <!-- API Keys Stat Card -->
    <div class="card flex flex-col justify-between p-6">
      <div>
        <div class="flex items-center justify-between">
          <div class="grid h-10 w-10 place-items-center bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <span class="bg-zinc-100 px-2.5 py-0.5 text-sm font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            Tokens
          </span>
        </div>

        <p class="mt-5 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          {client.apiKeys.length} {client.apiKeys.length === 1 ? 'API Key' : 'API Keys'}
        </p>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {activeKeysCount} active machine-to-machine credentials currently issued.
        </p>
      </div>

      <div class="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Link
          href={route(ROUTES.WEB.ADMIN.CLIENTS_API_KEYS_PAGE, { id: client.id })}
          class="flex items-center justify-between text-base font-semibold text-zinc-900 transition-colors hover:text-zinc-600 dark:text-white dark:hover:text-zinc-300"
        >
          <span>Manage API Keys</span>
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  </div>

  <!-- Detail Si Client Itu Sendiri -->
  <section class="card mt-6 p-6 sm:p-8">
    <div class="border-b border-zinc-200 pb-5 dark:border-zinc-800">
      <h2 class="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
        Client Information
      </h2>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Organization entity details and technical configuration.
      </p>
    </div>

    <dl class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <dt class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Organization Name
        </dt>
        <dd class="mt-1.5 text-base font-medium text-zinc-900 dark:text-white">
          {client.name}
        </dd>
      </div>

      <div>
        <dt class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Slug / Vanity URL
        </dt>
        <dd class="mt-1.5 font-mono text-base text-zinc-800 dark:text-zinc-200">
          <span class="bg-zinc-100 px-2.5 py-1 text-sm dark:bg-zinc-800">
            {client.slug}
          </span>
        </dd>
      </div>

      <div>
        <dt class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Account Status
        </dt>
        <dd class="mt-1.5">
          <Badge status={client.status}>
            {client.status}
          </Badge>
        </dd>
      </div>

      <div>
        <dt class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Registered Date
        </dt>
        <dd class="mt-1.5 text-base font-medium text-zinc-700 dark:text-zinc-300">
          {formatDate(client.createdAt)}
        </dd>
      </div>

      <div>
        <dt class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Last Updated
        </dt>
        <dd class="mt-1.5 text-base font-medium text-zinc-700 dark:text-zinc-300">
          {formatDate(client.updatedAt)}
        </dd>
      </div>

      <div>
        <dt class="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Organization ID
        </dt>
        <dd class="mt-1.5 font-mono text-base text-zinc-500">
          #CL-{client.id.toString().padStart(4, '0')}
        </dd>
      </div>
    </dl>
  </section>

  <!-- Danger Zone -->
  <section class="card mt-6 border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/50 dark:bg-rose-950/20">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-base font-bold text-rose-900 dark:text-rose-300">
          Delete Organization
        </h3>
        <p class="mt-1 text-sm text-rose-700 dark:text-rose-400">
          Permanently delete this organization, unlinking all members and invalidating all issued API keys.
        </p>
      </div>

      <Button variant="danger" onclick={destroyClient}>
        Delete Client
      </Button>
    </div>
  </section>
</AdminLayout>
