<script lang="ts">
  import { Link, router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import Badge from '../../../components/Badge.svelte'
  import Dropdown from '../../../components/Dropdown.svelte'
  import Pagination from '../../../components/Pagination.svelte'
  import SearchModal from '../../../components/SearchModal.svelte'

  interface UserView {
    id: number
    name: string
    email: string
    status: string
    isActive: boolean
    bannedUntil?: string | null
    statusReason?: string | null
    createdAt: string
    updatedAt: string
  }

  interface Props {
    appName?: string
    users?: UserView[]
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
    users = [],
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

  // Modal pencarian — isi form disinkronkan dari filter aktif (paritas
  // template: buka ulang modal mengembalikan filter yang sedang berjalan).
  let searchOpen = $state(false)
  let searchQ = $state('')
  let searchStatus = $state('')
  $effect(() => {
    searchQ = q
    searchStatus = status
  })

  const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'banned', label: 'Banned' },
    { value: 'suspended', label: 'Suspended' },
  ]

  const applySearch = ({ q: nextQ, status: nextStatus }: { q: string; status: string }) =>
    router.get(
      route(ROUTES.WEB.ADMIN.USERS),
      { q: nextQ || undefined, status: nextStatus || undefined, page: 1 },
      { preserveScroll: true },
    )

  const navigate = (nextPage: number) =>
    router.get(
      route(ROUTES.WEB.ADMIN.USERS),
      { q: q || undefined, status: status || undefined, page: nextPage },
      { preserveScroll: true },
    )

  const toggleActive = (user: UserView) =>
    router.post(
      route(ROUTES.WEB.ADMIN.USERS_TOGGLE, { id: user.id }),
      {},
      { preserveScroll: true },
    )

  const destroy = (user: UserView) => {
    if (!confirm(`Delete user "${user.name}"?`)) return
    router.delete(route(ROUTES.WEB.ADMIN.USERS_DELETE, { id: user.id }), {
      preserveScroll: true,
    })
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join('')

  const formatDate = (value: string) =>
    new Date(value.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const isSelf = (user: UserView) => user.id === authUserId
</script>

<svelte:head>
  <title>Users — {appName}</title>
</svelte:head>

<AdminLayout user={authUser ?? undefined} current="users">
  <div>
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Users</h1>
    <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">Manage admin accounts that can access the panel.</p>
  </div>

  {#if flash?.success}
    <div class="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
      {flash.success}
    </div>
  {/if}
  {#if flash?.error}
    <div class="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}

  <section class="card mt-6 min-w-0">
    <!-- Toolbar: search via modal + add user -->
    <div class="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <Button variant="secondary" onclick={() => (searchOpen = true)}>
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        Search Users
      </Button>

      <Link href={route(ROUTES.WEB.ADMIN.USERS_CREATE_PAGE)}>
        <Button>
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add User
        </Button>
      </Link>
    </div>

    <!-- Users table -->
    <div class="relative overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th class="th">User</th>
            <th class="th hidden sm:table-cell">Status</th>
            <th class="th hidden md:table-cell">Created</th>
            <th class="th sticky right-0 border-l border-zinc-200 bg-zinc-50 text-right dark:border-zinc-800 dark:bg-zinc-800">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#each users as user (user.id)}
            <tr class="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <td class="td">
                <div class="flex items-center gap-2.5">
                  <span class="grid h-10 w-10 shrink-0 place-items-center bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{initials(user.name)}</span>
                  <div class="min-w-0">
                    <p class="truncate font-medium text-zinc-900 dark:text-white">{user.name}</p>
                    <p class="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                  </div>
                </div>
              </td>
              <td class="td hidden sm:table-cell">
                {#if user.status === 'ACTIVE'}
                  <Badge tone="emerald">Active</Badge>
                {:else if user.status === 'BANNED'}
                  <Badge tone="rose">{user.bannedUntil ? 'Banned (Temp)' : 'Banned'}</Badge>
                {:else if user.status === 'SUSPENDED'}
                  <Badge tone="rose">Suspended</Badge>
                {:else}
                  <Badge tone="zinc">Inactive</Badge>
                {/if}
              </td>
              <td class="td tnum hidden whitespace-nowrap text-zinc-500 dark:text-zinc-400 md:table-cell">{formatDate(user.createdAt)}</td>
              <td class="td sticky right-0 border-l border-zinc-100 bg-white text-right group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40">
                <Dropdown label="Actions for {user.name}">
                  {#snippet trigger()}
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                  {/snippet}
                  {#snippet menu()}
                    <Link href={route(ROUTES.WEB.ADMIN.USERS_EDIT_PAGE, { id: user.id })} class="dropdown-item w-full">
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      Edit User
                    </Link>
                    {#if !isSelf(user)}
                      <Link href={route(ROUTES.WEB.ADMIN.USERS_STATUS_PAGE, { id: user.id })} class="dropdown-item w-full">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-2.48 8.74A9 9 0 1121 12a9 9 0 01-8.23 8.74" /></svg>
                        Account Status
                      </Link>
                      <div class="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800"></div>
                      <button type="button" class="dropdown-item w-full !text-rose-600 dark:!text-rose-400" onclick={() => destroy(user)}>
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        Delete User
                      </button>
                    {/if}
                  {/snippet}
                </Dropdown>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="4" class="px-6 py-16 text-center">
                <span class="mx-auto grid h-12 w-12 place-items-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                </span>
                <p class="mt-3 text-base font-semibold text-zinc-900 dark:text-white">No users found</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Try another keyword or status filter.</p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <Pagination {page} {lastPage} {total} {perPage} label="User pagination" onNavigate={navigate} />
  </section>
</AdminLayout>

<!-- Search modal (q + status filter) -->
<SearchModal
  bind:open={searchOpen}
  bind:q={searchQ}
  bind:status={searchStatus}
  {statusOptions}
  title="Search Users"
  description="Search by name or email address."
  searchLabel="Keyword"
  searchPlaceholder="Name or email…"
  statusLabel="User Status"
  onApply={applySearch}
/>
