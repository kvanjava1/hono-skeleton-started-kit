<script lang="ts">
  import { router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import ClientLayout from '../../../components/ClientLayout.svelte'
  import Dropdown from '../../../components/Dropdown.svelte'
  import type { WorkspaceItem } from '../../../components/WorkspaceSwitcher.svelte'

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

  interface UserInfo {
    id: number
    name: string
    email: string
    status: string
  }

  interface Props {
    appName?: string
    client: ClientInfo | null
    members?: MemberItem[]
    clientRoles?: ClientRole[]
    authUser?: UserInfo | null
    role?: string | null
    workspaces?: WorkspaceItem[]
    flash?: { success?: string; error?: string }
  }

  let {
    appName = 'API Portal',
    client = null,
    members = [],
    clientRoles = [],
    authUser = null,
    role = null,
    workspaces = [],
    flash = {},
  }: Props = $props()

  let inviteModalOpen = $state(false)
  let inviteName = $state('')
  let inviteEmail = $state('')
  let inviteRoleId = $state<string>('')
  let isSubmitting = $state(false)

  // Remove confirmation modal
  let removeModalOpen = $state(false)
  let memberToRemove = $state<MemberItem | null>(null)
  let isRemoving = $state(false)

  // Pre-select first client role
  $effect(() => {
    if (clientRoles.length > 0 && !inviteRoleId) {
      inviteRoleId = String(clientRoles[0].id)
    }
  })

  const submitInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !inviteRoleId) return
    isSubmitting = true
    router.post(
      route(ROUTES.WEB.CLIENT.TEAM_INVITE),
      {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        roleId: Number.parseInt(inviteRoleId, 10),
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          inviteModalOpen = false
          inviteName = ''
          inviteEmail = ''
          isSubmitting = false
        },
        onError: () => {
          isSubmitting = false
        },
      },
    )
  }

  const promptRemove = (member: MemberItem) => {
    memberToRemove = member
    removeModalOpen = true
  }

  const confirmRemove = () => {
    if (!memberToRemove) return
    isRemoving = true
    router.delete(
      route(ROUTES.WEB.CLIENT.TEAM_REMOVE, { id: memberToRemove.id }),
      {
        preserveScroll: true,
        onSuccess: () => {
          removeModalOpen = false
          memberToRemove = null
          isRemoving = false
        },
        onError: () => {
          isRemoving = false
        },
      },
    )
  }

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // fallback
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'medium',
      })
    } catch {
      return dateStr
    }
  }
</script>

<svelte:head>
  <title>Team Members — {client ? client.name : 'Client Portal'} — {appName}</title>
</svelte:head>

<ClientLayout
  auth={{
    client,
    clientUser: authUser,
    currentRole: role,
    workspaces,
  }}
  current="team"
>
  <!-- Page Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Team Members
      </h1>
      <p class="mt-2 text-base text-zinc-500 dark:text-zinc-400">
        Manage collaborators, engineers, and access permissions for <span class="font-semibold text-zinc-900 dark:text-white">{client?.name ?? 'your organization'}</span>.
      </p>
    </div>

    <div>
      <button
        type="button"
        onclick={() => (inviteModalOpen = true)}
        class="inline-flex items-center gap-2 border border-black bg-black px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 dark:border-white dark:bg-white dark:text-black"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="square" stroke-linejoin="miter" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Invite Member
      </button>
    </div>
  </div>

  <!-- Team Members Table (Boxy Monochromatic) -->
  <div class="mt-6 border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-base border-collapse">
        <thead>
          <tr class="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Member</th>
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Role</th>
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status</th>
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Joined</th>
            <th class="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
          {#if members.length === 0}
            <tr>
              <td colspan="5" class="px-5 py-12 text-center text-base text-zinc-500 dark:text-zinc-400">
                <div class="mx-auto max-w-sm">
                  <p class="font-semibold text-zinc-900 dark:text-white">No members found</p>
                  <p class="mt-1 text-sm">Click "Invite Member" above to add developers or teammates to this organization.</p>
                </div>
              </td>
            </tr>
          {:else}
            {#each members as member (member.id)}
              {@const isSelf = authUser && authUser.id === member.userId}
              <tr class="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <span class="flex h-9 w-9 items-center justify-center border border-zinc-300 bg-zinc-100 font-mono text-xs font-bold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-zinc-900 dark:text-white">{member.name}</span>
                        {#if isSelf}
                          <span class="border border-zinc-400 bg-zinc-100 px-1.5 py-0.2 font-mono text-[10px] font-bold uppercase text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            You
                          </span>
                        {/if}
                      </div>
                      <div class="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span class="border border-zinc-300 bg-zinc-50 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                    {member.roleName}
                  </span>
                </td>
                <td class="px-5 py-4">
                  {#if member.status === 'ACTIVE'}
                    <span class="border border-zinc-300 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                      ACTIVE
                    </span>
                  {:else}
                    <span class="border border-zinc-400 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-600 dark:text-zinc-400">
                      {member.status}
                    </span>
                  {/if}
                </td>
                <td class="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(member.createdAt)}
                </td>
                <td class="px-5 py-4 text-right">
                  <Dropdown label="Actions for {member.name}">
                    {#snippet menu()}
                      <button
                        type="button"
                        class="dropdown-item w-full text-left"
                        onclick={() => copyEmail(member.email)}
                      >
                        <svg class="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <span>Copy Email</span>
                      </button>
                      {#if !isSelf}
                        <div class="my-1 border-t border-zinc-100 dark:border-zinc-800"></div>
                        <button
                          type="button"
                          class="dropdown-item w-full text-left !text-rose-600 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/30"
                          onclick={() => promptRemove(member)}
                        >
                          <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          <span>Remove Member</span>
                        </button>
                      {:else}
                        <div class="my-1 border-t border-zinc-100 dark:border-zinc-800"></div>
                        <span class="dropdown-item w-full opacity-50 cursor-not-allowed text-xs text-zinc-400">
                          Current User (You)
                        </span>
                      {/if}
                    {/snippet}
                  </Dropdown>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Invite Member Modal (Boxy) -->
  {#if inviteModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="fixed inset-0 bg-zinc-950/60"
        onclick={() => (inviteModalOpen = false)}
        aria-hidden="true"
      ></div>

      <div class="relative w-full max-w-md border border-zinc-300 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <h3 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Invite Team Member
        </h3>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Add an existing or new user to <span class="font-semibold text-zinc-900 dark:text-white">{client?.name}</span>.
        </p>

        <form onsubmit={(e) => { e.preventDefault(); submitInvite() }} class="mt-5 space-y-4">
          <div>
            <label for="member-name" class="mb-1.5 block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Full Name
            </label>
            <input
              id="member-name"
              type="text"
              required
              bind:value={inviteName}
              placeholder="e.g. Jane Developer"
              class="w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            />
          </div>

          <div>
            <label for="member-email" class="mb-1.5 block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Email Address
            </label>
            <input
              id="member-email"
              type="email"
              required
              bind:value={inviteEmail}
              placeholder="developer@company.com"
              class="w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            />
          </div>

          <div>
            <label for="member-role" class="mb-1.5 block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Access Role
            </label>
            <select
              id="member-role"
              required
              bind:value={inviteRoleId}
              class="w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            >
              {#each clientRoles as r (r.id)}
                <option value={String(r.id)}>{r.name}</option>
              {/each}
            </select>
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-3">
            <button
              type="button"
              onclick={() => (inviteModalOpen = false)}
              class="border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inviteName.trim() || !inviteEmail.trim()}
              class="border border-black bg-black px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:border-white dark:bg-white dark:text-black"
            >
              {isSubmitting ? 'Inviting…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- Remove Member Confirmation Modal (Boxy) -->
  {#if removeModalOpen && memberToRemove}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="fixed inset-0 bg-zinc-950/60"
        onclick={() => (removeModalOpen = false)}
        aria-hidden="true"
      ></div>

      <div class="relative w-full max-w-md border border-zinc-300 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <h3 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Remove Team Member
        </h3>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Are you sure you want to remove <strong class="text-zinc-900 dark:text-white">{memberToRemove.name}</strong> ({memberToRemove.email}) from <strong class="text-zinc-900 dark:text-white">{client?.name}</strong>? They will immediately lose access to this organization.
        </p>

        <div class="mt-6 flex justify-end gap-3 pt-3">
          <button
            type="button"
            onclick={() => (removeModalOpen = false)}
            class="border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isRemoving}
            onclick={confirmRemove}
            class="border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isRemoving ? 'Removing…' : 'Confirm Remove'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</ClientLayout>
