<script lang="ts">
  import { router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Badge from '../../../components/Badge.svelte'
  import Button from '../../../components/Button.svelte'
  import Modal from '../../../components/Modal.svelte'
  import Pagination from '../../../components/Pagination.svelte'

  interface ActivityLogItem {
    id: number
    clientId: number | null
    clientName?: string | null
    actorId: number | null
    actorType: string
    actorName: string | null
    actorEmail: string | null
    action: string
    scope: string
    description: string
    ipAddress: string | null
    userAgent: string | null
    metadata: string | null
    createdAt: string
  }

  interface ClientOption {
    id: number
    name: string
    slug: string
  }

  interface Props {
    logs?: ActivityLogItem[]
    total?: number
    page?: number
    perPage?: number
    lastPage?: number
    clients?: ClientOption[]
    q?: string
    clientId?: string | number
    action?: string
    scope?: string
    authUserId?: number
    authUser?: { name: string; email: string } | null
  }

  let {
    logs = [],
    total = 0,
    page = 1,
    perPage = 15,
    lastPage = 1,
    clients = [],
    q = '',
    clientId = '',
    action = '',
    scope = '',
    authUser = null,
  }: Props = $props()

  let searchOpen = $state(false)
  let filterQ = $state('')
  let filterClientId = $state('')
  let filterScope = $state('')

  let detailOpen = $state(false)
  let selectedLog = $state<ActivityLogItem | null>(null)

  $effect(() => {
    filterQ = q
    filterClientId = clientId ? String(clientId) : ''
    filterScope = scope
  })

  const applyFilters = () => {
    searchOpen = false
    router.get(
      route(ROUTES.WEB.ADMIN.LOGS),
      {
        q: filterQ || undefined,
        clientId: filterClientId || undefined,
        scope: filterScope || undefined,
        page: 1,
      },
      { preserveScroll: true }
    )
  }

  const resetFilters = () => {
    filterQ = ''
    filterClientId = ''
    filterScope = ''
    router.get(route(ROUTES.WEB.ADMIN.LOGS), {}, { preserveScroll: true })
  }

  const navigate = (nextPage: number) => {
    router.get(
      route(ROUTES.WEB.ADMIN.LOGS),
      {
        q: q || undefined,
        clientId: clientId || undefined,
        scope: scope || undefined,
        page: nextPage,
      },
      { preserveScroll: true }
    )
  }

  const actionTone = (act: string): 'emerald' | 'rose' | 'sky' | 'zinc' => {
    if (act.includes('create') || act.includes('login') || act.includes('activate')) return 'emerald'
    if (act.includes('delete') || act.includes('revoke') || act.includes('suspend') || act.includes('failed')) return 'rose'
    if (act.includes('update') || act.includes('switch') || act.includes('status')) return 'sky'
    return 'zinc'
  }

  const formatTimestamp = (iso: string) => {
    try {
      return new Date(iso.replace(' ', 'T')).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        hour12: false,
      })
    } catch {
      return iso
    }
  }

  const parsedMetadata = (metaStr: string | null) => {
    if (!metaStr) return null
    try {
      return JSON.parse(metaStr)
    } catch {
      return metaStr
    }
  }

  const openDetail = (log: ActivityLogItem) => {
    selectedLog = log
    detailOpen = true
  }
</script>

<AdminLayout title="Audit Logs — Admin" current="logs" user={authUser ?? undefined}>
  <!-- Page Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Audit Logs</h1>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        Global audit trail of all platform, tenant, and security activities.
      </p>
    </div>
    <div class="tnum font-mono text-sm text-zinc-500 dark:text-zinc-400">
      Total {total} event{total === 1 ? '' : 's'} recorded
    </div>
  </div>

  <!-- Main Container -->
  <section class="card mt-6 min-w-0">
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onclick={() => (searchOpen = true)}>
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span>Search Logs</span>
          {#if q || clientId || scope}
            <span class="grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">!</span>
          {/if}
        </Button>

        {#if q || clientId || scope}
          <Button variant="ghost" onclick={resetFilters}>
            Clear Filters
          </Button>
        {/if}
      </div>
    </div>

    <!-- Table -->
    <div class="relative overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th class="th">Timestamp</th>
            <th class="th">Action</th>
            <th class="th">Description</th>
            <th class="th">Actor</th>
            <th class="th">Organization</th>
            <th class="th">IP Address</th>
            <th class="th text-right">Details</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#if logs.length === 0}
            <tr>
              <td colspan="7" class="px-6 py-16 text-center">
                <span class="mx-auto grid h-12 w-12 place-items-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
                <p class="mt-3 text-base font-semibold text-zinc-900 dark:text-white">No logs found</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Try another keyword, organization, or scope filter.</p>
              </td>
            </tr>
          {:else}
            {#each logs as log (log.id)}
              <tr class="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <td class="td tnum whitespace-nowrap font-mono text-sm text-zinc-500 dark:text-zinc-400">
                  {formatTimestamp(log.createdAt)}
                </td>
                <td class="td whitespace-nowrap">
                  <Badge tone={actionTone(log.action)} class="font-mono text-xs">
                    {log.action}
                  </Badge>
                </td>
                <td class="td font-medium text-zinc-900 dark:text-white">
                  {log.description}
                </td>
                <td class="td whitespace-nowrap">
                  {#if log.actorName}
                    <div class="font-semibold text-zinc-900 dark:text-zinc-100">{log.actorName}</div>
                    <div class="font-mono text-xs text-zinc-500">{log.actorType}</div>
                  {:else}
                    <span class="italic text-zinc-400">System / Unknown</span>
                  {/if}
                </td>
                <td class="td whitespace-nowrap">
                  {#if log.clientName}
                    <span class="font-medium text-zinc-800 dark:text-zinc-200">{log.clientName}</span>
                  {:else}
                    <span class="font-mono text-zinc-400">-</span>
                  {/if}
                </td>
                <td class="td tnum whitespace-nowrap font-mono text-sm text-zinc-500 dark:text-zinc-400">
                  {log.ipAddress || 'unknown'}
                </td>
                <td class="td whitespace-nowrap text-right">
                  {#if log.metadata}
                    <button
                      type="button"
                      class="border border-zinc-200 bg-white px-2.5 py-1 font-mono text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      onclick={() => openDetail(log)}
                    >
                      View JSON
                    </button>
                  {:else}
                    <span class="font-mono text-sm text-zinc-400">-</span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if total > perPage}
      <Pagination {page} {lastPage} {total} {perPage} label="Audit logs pagination" onNavigate={navigate} />
    {/if}
  </section>

  <!-- Search Modal -->
  <Modal bind:open={searchOpen} title="Search Audit Logs" description="Filter audit trail events by keyword, organization, or scope.">
    <form onsubmit={(e) => { e.preventDefault(); applyFilters(); }} class="space-y-5">
      <div>
        <label class="label" for="search-modal-q">Keywords</label>
        <div class="relative">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            id="search-modal-q"
            type="search"
            bind:value={filterQ}
            placeholder="Search action, actor, description..."
            class="input !pl-10"
          />
        </div>
        <p class="hint">Search by action keyword, actor name/email, or description.</p>
      </div>

      <div>
        <label class="label" for="search-modal-client">Organization</label>
        <select id="search-modal-client" bind:value={filterClientId} class="input">
          <option value="">All Organizations</option>
          {#each clients as client (client.id)}
            <option value={client.id}>{client.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="label" for="search-modal-scope">Scope</label>
        <select id="search-modal-scope" bind:value={filterScope} class="input">
          <option value="">All Scopes</option>
          <option value="global">Global Platform</option>
          <option value="organization">Organization</option>
          <option value="personal">Personal / Security</option>
        </select>
      </div>

      <div class="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:justify-end">
        <button type="button" class="btn btn-secondary w-full sm:w-auto" onclick={() => (searchOpen = false)}>
          Cancel
        </button>
        <button type="submit" class="btn btn-primary w-full sm:w-auto">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Search
        </button>
      </div>
    </form>
  </Modal>

  <!-- Metadata JSON Detail Modal -->
  {#if selectedLog}
    <Modal bind:open={detailOpen} title={`Log Event #${selectedLog.id} Details`}>
      <div class="space-y-4 text-base">
        <div>
          <span class="label mb-0.5">Action</span>
          <div class="font-mono text-sm font-semibold text-zinc-900 dark:text-white">{selectedLog.action}</div>
        </div>
        <div>
          <span class="label mb-0.5">Timestamp</span>
          <div class="font-mono text-sm text-zinc-600 dark:text-zinc-300">{formatTimestamp(selectedLog.createdAt)}</div>
        </div>
        <div>
          <span class="label mb-0.5">Description</span>
          <div class="text-base text-zinc-900 dark:text-white">{selectedLog.description}</div>
        </div>
        {#if selectedLog.userAgent}
          <div class="break-all">
            <span class="label mb-0.5">User Agent</span>
            <div class="font-mono text-xs text-zinc-500">{selectedLog.userAgent}</div>
          </div>
        {/if}
        <div>
          <span class="label mb-1">Metadata Payload</span>
          <pre class="overflow-x-auto border border-zinc-200 bg-zinc-50 p-4 font-mono text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
{JSON.stringify(parsedMetadata(selectedLog.metadata), null, 2)}
          </pre>
        </div>
      </div>
      <div class="mt-6 flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <button type="button" class="btn btn-secondary" onclick={() => (detailOpen = false)}>
          Close
        </button>
      </div>
    </Modal>
  {/if}
</AdminLayout>
