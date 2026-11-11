<script lang="ts">
  import { Link, router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import Badge from '../../../components/Badge.svelte'
  import Dropdown from '../../../components/Dropdown.svelte'
  import Pagination from '../../../components/Pagination.svelte'
  import SearchModal from '../../../components/SearchModal.svelte'

  interface ClientListItem {
    id: number
    name: string
    slug: string
    status: string
    membersCount: number
    apiKeysCount: number
    createdAt: string
  }

  interface Props {
    appName?: string
    clients?: ClientListItem[]
    q?: string
    status?: string
    page?: number
    perPage?: number
    total?: number
    lastPage?: number
    authUserId?: number
    authUser?: { name: string; email: string } | null
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let {
    appName = '',
    clients = [],
    q = '',
    status = '',
    page = 1,
    perPage = 10,
    total = 0,
    lastPage = 1,
    authUserId = 0,
    authUser = null,
    flash = {},
    errors = {},
  }: Props = $props()

  let searchOpen = $state(false)
  let searchQ = $state('')
  let searchStatus = $state('')
  $effect(() => {
    searchQ = q
    searchStatus = status
  })

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'SUSPENDED', label: 'Suspended' },
  ]

  const applySearch = ({ q: nextQ, status: nextStatus }: { q: string; status: string }) =>
    router.get(
      route(ROUTES.WEB.ADMIN.CLIENTS),
      { q: nextQ || undefined, status: nextStatus || undefined, page: 1 },
      { preserveScroll: true },
    )

  const navigate = (nextPage: number) =>
    router.get(
      route(ROUTES.WEB.ADMIN.CLIENTS),
      { q: q || undefined, status: status || undefined, page: nextPage },
      { preserveScroll: true },
    )

  const toggleStatus = (client: ClientListItem) =>
    router.post(
      route(ROUTES.WEB.ADMIN.CLIENTS_TOGGLE_STATUS, { id: client.id }),
      {},
      { preserveScroll: true },
    )

  const destroy = (client: ClientListItem) => {
    if (!confirm(`Delete client organization "${client.name}"?`)) return
    router.delete(route(ROUTES.WEB.ADMIN.CLIENTS_DELETE, { id: client.id }), {
      preserveScroll: true,
    })
  }

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
</script>

<AdminLayout title="Clients — {appName || 'AdminPanel'}" current="clients" user={authUser ?? undefined}>
  <!-- Page Header -->
  <div>
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Clients</h1>
    <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">Manage registered API organizations and client teams.</p>
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

  <!-- Main Card -->
  <section class="card mt-6 min-w-0">
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <Button variant="secondary" onclick={() => (searchOpen = true)}>
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <span>Search Clients</span>
        {#if q || status}
          <span class="grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">!</span>
        {/if}
      </Button>

      <div class="flex items-center gap-2">
        <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_CREATE_PAGE)}>
          <Button>
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Client
          </Button>
        </Link>
      </div>
    </div>

    <!-- Table -->
    <div class="relative overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th class="th">Organization</th>
            <th class="th hidden sm:table-cell">Status</th>
            <th class="th">Members</th>
            <th class="th">API Keys</th>
            <th class="th hidden md:table-cell">Created</th>
            <th class="th sticky right-0 border-l border-zinc-200 bg-zinc-50 text-right dark:border-zinc-800 dark:bg-zinc-800">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#if clients.length === 0}
            <tr>
              <td colspan="6" class="px-6 py-16 text-center">
                <span class="mx-auto grid h-12 w-12 place-items-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
                <p class="mt-3 text-base font-semibold text-zinc-900 dark:text-white">No clients found</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Try another keyword or status filter.</p>
              </td>
            </tr>
          {:else}
            {#each clients as client (client.id)}
              <tr class="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <td class="td">
                  <div class="min-w-0">
                    <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_SHOW_PAGE, { id: client.id })} class="truncate font-medium text-zinc-900 hover:underline dark:text-white">
                      {client.name}
                    </Link>
                    <p class="truncate text-sm text-zinc-500 dark:text-zinc-400">{client.slug}</p>
                  </div>
                </td>
                <td class="td hidden sm:table-cell">
                  <Badge status={client.status}>
                    {client.status}
                  </Badge>
                </td>
                <td class="td text-zinc-700 dark:text-zinc-300">
                  {client.membersCount} members
                </td>
                <td class="td text-zinc-700 dark:text-zinc-300">
                  {client.apiKeysCount} keys
                </td>
                <td class="td tnum hidden whitespace-nowrap text-zinc-500 dark:text-zinc-400 md:table-cell">
                  {formatDate(client.createdAt)}
                </td>
                <td class="td sticky right-0 border-l border-zinc-100 bg-white text-right group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40">
                  <Dropdown label="Client actions">
                    {#snippet trigger()}
                      <span class="icon-btn">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </span>
                    {/snippet}
                    {#snippet menu()}
                      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_SHOW_PAGE, { id: client.id })} class="dropdown-item">
                        View Details
                      </Link>
                      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_PAGE, { id: client.id })} class="dropdown-item">
                        Manage Members
                      </Link>
                      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_API_KEYS_PAGE, { id: client.id })} class="dropdown-item">
                        Manage Keys
                      </Link>
                      <div class="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800"></div>
                      <button type="button" class="dropdown-item w-full text-left" onclick={() => toggleStatus(client)}>
                        {client.status === 'ACTIVE' ? 'Suspend Client' : 'Activate Client'}
                      </button>
                      <div class="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800"></div>
                      <button type="button" class="dropdown-item w-full text-left !text-rose-600 dark:!text-rose-400" onclick={() => destroy(client)}>
                        Delete
                      </button>
                    {/snippet}
                  </Dropdown>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if total > perPage}
      <div class="border-t border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <Pagination {page} {lastPage} {total} {perPage} {navigate} />
      </div>
    {/if}
  </section>

  <SearchModal
    bind:open={searchOpen}
    bind:q={searchQ}
    bind:status={searchStatus}
    {statusOptions}
    title="Search Clients"
    description="Search by organization name or slug."
    searchLabel="Keyword"
    searchPlaceholder="Company name or slug…"
    statusLabel="Client Status"
    onApply={applySearch}
  />
</AdminLayout>
