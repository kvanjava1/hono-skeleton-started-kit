<script lang="ts">
  import { router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import Badge from '../../../components/Badge.svelte'
  import Modal from '../../../components/Modal.svelte'
  import TextInput from '../../../components/TextInput.svelte'
  import SelectInput from '../../../components/SelectInput.svelte'

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
    client: ClientInfo | null
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

  let inviteModalOpen = $state(false)
  let inviteName = $state('')
  let inviteEmail = $state('')
  let inviteRoleId = $state<string>('')
  let isSubmitting = $state(false)

  // Pre-select first client role when opening modal or roles loaded
  $effect(() => {
    if (clientRoles.length > 0 && !inviteRoleId) {
      inviteRoleId = String(clientRoles[0].id)
    }
  })

  const submitInvite = () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !inviteRoleId) return
    isSubmitting = true
    router.post(
      route(ROUTES.WEB.ADMIN.TEAM_INVITE),
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

  const removeMember = (member: MemberItem) => {
    if (!confirm(`Are you sure you want to remove "${member.name}" from the team?`)) return
    router.delete(
      route(ROUTES.WEB.ADMIN.TEAM_REMOVE, { id: member.id }),
      { preserveScroll: true },
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
  <title>Team Members — {appName || 'AdminPanel'}</title>
</svelte:head>

<AdminLayout current="team" user={authUser ?? undefined}>
  <!-- Header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Team Members</h1>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        {#if client}
          Manage organization members and roles for <span class="font-bold text-zinc-800 dark:text-zinc-200">{client.name}</span>.
        {:else}
          Manage members and roles for your client organization.
        {/if}
      </p>
    </div>

    <div>
      <Button variant="primary" class="gap-1.5" onclick={() => (inviteModalOpen = true)}>
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
        </svg>
        Invite Member
      </Button>
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

  <!-- Main Card -->
  <section class="card mt-6 min-w-0">
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
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Click "Invite Member" above to add your colleagues.</p>
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
                  {#if member.userId !== authUserId}
                    <button
                      type="button"
                      class="text-sm font-semibold text-rose-600 hover:underline dark:text-rose-400"
                      onclick={() => removeMember(member)}
                    >
                      Remove
                    </button>
                  {:else}
                    <span class="text-sm text-zinc-400">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Modal Invite Member -->
  <Modal bind:open={inviteModalOpen} title="Invite Team Member">
    <form onsubmit={(e) => { e.preventDefault(); submitInvite(); }} class="space-y-4">
      <p class="text-sm text-zinc-500 dark:text-zinc-400">
        Add a colleague to your organization and grant them specific access permissions.
      </p>

      <div>
        <TextInput
          id="member-name"
          label="Full Name"
          placeholder="e.g. Jane Doe"
          required
          bind:value={inviteName}
        />
      </div>

      <div>
        <TextInput
          id="member-email"
          label="Email Address"
          type="email"
          placeholder="e.g. jane@company.com"
          required
          bind:value={inviteEmail}
        />
      </div>

      <div>
        <label for="member-role" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Role
        </label>
        <SelectInput id="member-role" bind:value={inviteRoleId}>
          {#each clientRoles as role (role.id)}
            <option value={String(role.id)}>{role.name}</option>
          {/each}
        </SelectInput>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onclick={() => (inviteModalOpen = false)}>Cancel</Button>
        <Button variant="primary" type="submit" disabled={isSubmitting || !inviteName.trim() || !inviteEmail.trim() || !inviteRoleId}>
          {isSubmitting ? 'Inviting...' : 'Add Team Member'}
        </Button>
      </div>
    </form>
  </Modal>
</AdminLayout>
