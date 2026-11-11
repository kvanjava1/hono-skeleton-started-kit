<script lang="ts">
  import { router, Link } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import Badge from '../../../components/Badge.svelte'
  import Dropdown from '../../../components/Dropdown.svelte'

  interface MemberItem {
    id: number
    userId: number
    name: string
    email: string
    roleName: string
    status: string
    createdAt: string
  }

  interface ClientRole {
    id: number
    name: string
    slug: string
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
    members?: MemberItem[]
    clientRoles?: ClientRole[]
    authUserId?: number
    authUser?: { name: string; email: string } | null
    flash?: { success?: string; error?: string }
  }

  let {
    appName = '',
    client,
    members = [],
    clientRoles = [],
    authUserId = 0,
    authUser = null,
    flash = {},
  }: Props = $props()

  let copiedEmail = $state<string | null>(null)

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
      copiedEmail = email
      setTimeout(() => {
        if (copiedEmail === email) copiedEmail = null
      }, 2000)
    } catch {
      // fallback if clipboard api fails
    }
  }

  const toggleMemberStatus = (member: MemberItem) => {
    const actionText = member.status === 'ACTIVE' ? 'suspend' : 'activate'
    if (!confirm(`Are you sure you want to ${actionText} member "${member.name}"?`)) return

    router.post(
      route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_TOGGLE_STATUS, {
        id: client.id,
        memberId: member.id,
      }),
      {},
      {
        preserveScroll: true,
      },
    )
  }

  const removeMember = (member: MemberItem) => {
    if (!confirm(`Are you sure you want to remove "${member.name}" from ${client.name}?`)) return

    router.delete(
      route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_REMOVE, {
        id: client.id,
        memberId: member.id,
      }),
      {
        preserveScroll: true,
      },
    )
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

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join('')
</script>

<svelte:head>
  <title>Team Members — {client.name} — {appName || 'AdminPanel'}</title>
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
    <span class="font-medium text-zinc-900 dark:text-white">Members</span>
  </div>

  <!-- Header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Team Members
      </h1>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        Manage personnel and access roles for <span class="font-bold text-zinc-800 dark:text-zinc-200">{client.name}</span>.
      </p>
    </div>

    <div class="flex items-center gap-2.5">
      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_SHOW_PAGE, { id: client.id })}>
        <Button variant="secondary">Back to Details</Button>
      </Link>
      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_CREATE_PAGE, { id: client.id })}>
        <Button variant="primary">+ Add Member</Button>
      </Link>
    </div>
  </div>

  <!-- Flash Messages -->
  {#if flash.error}
    <div class="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}
  {#if flash.success}
    <div class="mt-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
      {flash.success}
    </div>
  {/if}

  <!-- Members List -->
  <section class="card mt-6 min-w-0">
    <div class="flex flex-col gap-1 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:p-5">
      <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Current Members ({members.length})</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400">Authorized personnel for this client organization.</p>
    </div>

    <div class="relative overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th class="th">Member</th>
            <th class="th">Role</th>
            <th class="th hidden sm:table-cell">Status</th>
            <th class="th hidden md:table-cell">Joined</th>
            <th class="th sticky right-0 border-l border-zinc-200 bg-zinc-50 text-right dark:border-zinc-800 dark:bg-zinc-800">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#if members.length === 0}
            <tr>
              <td colspan="5" class="px-6 py-16 text-center">
                <p class="text-base font-semibold text-zinc-900 dark:text-white">No team members found</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Use the "+ Add Member" button above to add personnel.</p>
              </td>
            </tr>
          {:else}
            {#each members as member (member.id)}
              <tr class="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <td class="td">
                  <div class="flex items-center gap-2.5">
                    <span class="grid h-10 w-10 shrink-0 place-items-center bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {initials(member.name)}
                    </span>
                    <div class="min-w-0">
                      <p class="truncate font-medium text-zinc-900 dark:text-white">
                        {member.name}
                        {#if member.userId === authUserId}
                          <span class="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">You</span>
                        {/if}
                      </p>
                      <p class="truncate text-sm text-zinc-500 dark:text-zinc-400">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td class="td">
                  <span class="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {member.roleName}
                  </span>
                </td>
                <td class="td hidden sm:table-cell">
                  <Badge status={member.status}>
                    {member.status}
                  </Badge>
                </td>
                <td class="td tnum hidden whitespace-nowrap text-zinc-500 dark:text-zinc-400 md:table-cell">
                  {formatDate(member.createdAt)}
                </td>
                <td class="td sticky right-0 border-l border-zinc-100 bg-white text-right group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40">
                  <Dropdown label="Member actions">
                    {#snippet trigger()}
                      <span class="icon-btn">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                        </svg>
                      </span>
                    {/snippet}
                    {#snippet menu()}
                      <Link
                        href={route(ROUTES.WEB.ADMIN.CLIENTS_MEMBERS_EDIT_PAGE, {
                          id: client.id,
                          memberId: member.id,
                        })}
                        class="dropdown-item"
                      >
                        Edit Member
                      </Link>
                      <button
                        type="button"
                        class="dropdown-item w-full text-left"
                        onclick={() => toggleMemberStatus(member)}
                      >
                        {member.status === 'ACTIVE' ? 'Suspend Member' : 'Activate Member'}
                      </button>
                      <button
                        type="button"
                        class="dropdown-item w-full text-left"
                        onclick={() => copyEmail(member.email)}
                      >
                        {copiedEmail === member.email ? '✓ Email Copied' : 'Copy Email'}
                      </button>
                      <div class="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800"></div>
                      <button
                        type="button"
                        class="dropdown-item w-full text-left !text-rose-600 dark:!text-rose-400"
                        onclick={() => removeMember(member)}
                      >
                        Remove from Client
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
  </section>
</AdminLayout>
