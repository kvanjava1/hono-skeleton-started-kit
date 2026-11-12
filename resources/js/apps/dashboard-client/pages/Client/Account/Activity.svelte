<script lang="ts">
  import { router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import ClientLayout from '../../../components/ClientLayout.svelte'
  import Pagination from '../../../../dashboard-admin/components/Pagination.svelte'
  import Modal from '../../../../dashboard-admin/components/Modal.svelte'
  import type { WorkspaceItem } from '../../../components/WorkspaceSwitcher.svelte'

  interface ActivityLogItem {
    id: number
    clientId: number | null
    clientName?: string | null
    action: string
    scope: string
    description: string
    ipAddress: string | null
    userAgent: string | null
    metadata: string | null
    createdAt: string
  }

  interface Props {
    client?: { id: number; name: string; slug: string; status: string } | null
    logs?: ActivityLogItem[]
    total?: number
    page?: number
    perPage?: number
    lastPage?: number
    q?: string
    authUser?: { id: number; name: string; email: string; status: string } | null
    role?: string | null
    workspaces?: WorkspaceItem[]
  }

  let {
    client = null,
    logs = [],
    total = 0,
    page = 1,
    perPage = 15,
    lastPage = 1,
    q = '',
    authUser = null,
    role = null,
    workspaces = [],
  }: Props = $props()

  let searchOpen = $state(false)
  let searchQ = $state('')

  $effect(() => {
    searchQ = q
  })

  const handleSearch = () => {
    searchOpen = false
    router.get(
      route(ROUTES.WEB.CLIENT.ACTIVITY),
      { q: searchQ || undefined, page: 1 },
      { preserveScroll: true }
    )
  }

  const resetSearch = () => {
    searchQ = ''
    router.get(route(ROUTES.WEB.CLIENT.ACTIVITY), {}, { preserveScroll: true })
  }

  const navigate = (nextPage: number) => {
    router.get(
      route(ROUTES.WEB.CLIENT.ACTIVITY),
      { q: q || undefined, page: nextPage },
      { preserveScroll: true }
    )
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
</script>

<svelte:head>
  <title>Security Activity — Client Portal</title>
</svelte:head>

<ClientLayout
  auth={{
    client,
    clientUser: authUser,
    currentRole: role,
    workspaces,
  }}
  current="activity"
>
  <!-- Page Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Account Security Activity</h1>
      <p class="mt-2 text-base text-zinc-500 dark:text-zinc-400">
        Personal login sessions, workspace changes, and security events for <span class="font-semibold text-zinc-900 dark:text-white">{authUser?.email}</span>.
      </p>
    </div>
    <div class="tnum font-mono text-sm text-zinc-500 dark:text-zinc-400">
      Total {total} session event{total === 1 ? '' : 's'}
    </div>
  </div>

  <!-- Main Container -->
  <section class="card mt-6 min-w-0">
    <!-- Toolbar -->
    <div class="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onclick={() => (searchOpen = true)}
          class="btn btn-secondary"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span>Search Activity</span>
          {#if q}
            <span class="grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">!</span>
          {/if}
        </button>

        {#if q}
          <button
            type="button"
            onclick={resetSearch}
            class="btn btn-secondary border-dashed"
          >
            Clear Filter
          </button>
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
            <th class="th">Context</th>
            <th class="th">IP Address</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#if logs.length === 0}
            <tr>
              <td colspan="5" class="px-6 py-16 text-center">
                <span class="mx-auto grid h-12 w-12 place-items-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </span>
                <p class="mt-3 text-base font-semibold text-zinc-900 dark:text-white">No security activity found</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">No session events matching your search keyword.</p>
              </td>
            </tr>
          {:else}
            {#each logs as log (log.id)}
              <tr class="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <td class="td tnum whitespace-nowrap font-mono text-sm text-zinc-500 dark:text-zinc-400">
                  {formatTimestamp(log.createdAt)}
                </td>
                <td class="td whitespace-nowrap">
                  <span class="badge border border-zinc-200 bg-zinc-100 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {log.action}
                  </span>
                </td>
                <td class="td font-medium text-zinc-900 dark:text-white">
                  {log.description}
                </td>
                <td class="td whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                  {log.clientName || 'Personal'}
                </td>
                <td class="td tnum whitespace-nowrap font-mono text-sm text-zinc-500 dark:text-zinc-400">
                  {log.ipAddress || 'unknown'}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if total > perPage}
      <Pagination {page} {lastPage} {total} {perPage} label="Security activity pagination" onNavigate={navigate} />
    {/if}
  </section>

  <!-- Search Modal -->
  <Modal bind:open={searchOpen} title="Filter Personal Activity" description="Search your account security and session events.">
    <form onsubmit={(e) => { e.preventDefault(); handleSearch(); }} class="space-y-5">
      <div>
        <label class="label" for="activity-search-q">Keywords</label>
        <div class="relative">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            id="activity-search-q"
            type="search"
            bind:value={searchQ}
            placeholder="Search action or event description..."
            class="input !pl-10"
          />
        </div>
        <p class="hint">Filter events by action keywords like login, workspace, etc.</p>
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
</ClientLayout>
