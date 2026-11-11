<script lang="ts">
  import { Link, router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import Badge from '../../../components/Badge.svelte'

  export interface UserStatusHistoryItem {
    id: number
    userId: number
    fromStatus: string
    toStatus: string
    reason: string | null
    bannedUntil: string | null
    changedBy: number | null
    changedByName?: string | null
    changedByEmail?: string | null
    createdAt: string
  }

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
    user: UserView
    history?: UserStatusHistoryItem[]
    authUser?: { name: string; email: string }
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let {
    appName = '',
    user,
    history = [],
    authUser,
    flash = {},
    errors = {},
  }: Props = $props()

  type StatusAction = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED_TEMP' | 'BANNED_PERM'

  const initialAction = (): StatusAction => {
    if (user.status === 'BANNED') {
      return user.bannedUntil ? 'BANNED_TEMP' : 'BANNED_PERM'
    }
    if (user.status === 'SUSPENDED') return 'SUSPENDED'
    if (!user.isActive || user.status === 'INACTIVE') return 'INACTIVE'
    return 'ACTIVE'
  }

  let selectedAction = $state<StatusAction>('ACTIVE')
  let durationPreset = $state<number>(7) // days: 1, 7, 30, or -1 for custom
  let customDate = $state<string>('')
  let reason = $state<string>('')
  let isSubmitting = $state(false)

  $effect(() => {
    selectedAction = initialAction()
    reason = user.statusReason ?? ''

    const d = new Date()
    d.setDate(d.getDate() + 7)
    customDate = d.toISOString().slice(0, 16)
  })

  const calculateBannedUntil = (): string | null => {
    if (selectedAction !== 'BANNED_TEMP') return null
    if (durationPreset === -1) {
      return customDate ? new Date(customDate).toISOString() : null
    }
    const d = new Date()
    d.setDate(d.getDate() + durationPreset)
    return d.toISOString()
  }

  const submit = () => {
    isSubmitting = true
    let targetStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED' = 'ACTIVE'
    if (selectedAction === 'BANNED_TEMP' || selectedAction === 'BANNED_PERM') {
      targetStatus = 'BANNED'
    } else if (selectedAction === 'SUSPENDED') {
      targetStatus = 'SUSPENDED'
    } else if (selectedAction === 'INACTIVE') {
      targetStatus = 'INACTIVE'
    }

    const bannedUntil = calculateBannedUntil()

    router.post(
      route(ROUTES.WEB.ADMIN.USERS_STATUS, { id: user.id }),
      {
        status: targetStatus,
        reason: reason.trim() || undefined,
        bannedUntil,
      },
      {
        preserveScroll: true,
        onFinish: () => {
          isSubmitting = false
        },
      },
    )
  }

  const formatDateTime = (val: string | null | undefined) => {
    if (!val) return '—'
    return new Date(val.replace(' ', 'T') + (val.includes('Z') ? '' : 'Z')).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatDate = (val: string | null | undefined) => {
    if (!val) return '—'
    return new Date(val.replace(' ', 'T') + (val.includes('Z') ? '' : 'Z')).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
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
  <title>Account Status — {user.name} — {appName || 'AdminPanel'}</title>
</svelte:head>

<AdminLayout user={authUser ?? undefined} current="users">
  <!-- Breadcrumb & Top Bar -->
  <div class="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
    <Link href={route(ROUTES.WEB.ADMIN.USERS)} class="transition-colors hover:text-zinc-900 dark:hover:text-white">
      Users
    </Link>
    <span>/</span>
    <span class="text-zinc-600 dark:text-zinc-300">{user.name}</span>
    <span>/</span>
    <span class="font-medium text-zinc-900 dark:text-white">Account Status</span>
  </div>

  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Account Status & Moderation</h1>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        Manage access restriction levels, penalties, and audit trail for this account.
      </p>
    </div>

    <div>
      <Link href={route(ROUTES.WEB.ADMIN.USERS)}>
        <Button variant="secondary">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back to Users
        </Button>
      </Link>
    </div>
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

  <!-- Section 1: User Identity Card (Boxy) -->
  <section class="card mt-6 p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <span class="grid h-14 w-14 shrink-0 place-items-center bg-zinc-100 text-lg font-bold text-zinc-900 dark:bg-zinc-800 dark:text-white">
          {initials(user.name)}
        </span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2.5">
            <h2 class="text-xl font-bold text-zinc-900 dark:text-white">{user.name}</h2>
            {#if user.status === 'ACTIVE'}
              <Badge tone="emerald">ACTIVE</Badge>
            {:else if user.status === 'BANNED'}
              <Badge tone="rose">{user.bannedUntil ? 'BANNED (TEMPORARY)' : 'BANNED (PERMANENT)'}</Badge>
            {:else if user.status === 'SUSPENDED'}
              <Badge tone="rose">SUSPENDED</Badge>
            {:else}
              <Badge tone="zinc">INACTIVE</Badge>
            {/if}
          </div>
          <p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {user.email} • Registered on {formatDate(user.createdAt)}
          </p>
        </div>
      </div>
    </div>

    {#if user.status === 'BANNED' && user.bannedUntil}
      <div class="mt-4 border-l-2 border-rose-600 bg-zinc-50 p-3 text-xs text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200">
        <strong class="font-semibold text-rose-600 dark:text-rose-400">Active Restriction:</strong>
        Account suspended until <strong>{formatDateTime(user.bannedUntil)}</strong>.
      </div>
    {/if}
    {#if user.statusReason}
      <p class="mt-3 text-xs italic text-zinc-500 dark:text-zinc-400">
        Latest Note: "{user.statusReason}"
      </p>
    {/if}
  </section>

  <!-- Section 2: Manage Status Form (Boxy & Monochromatic) -->
  <section class="card mt-6 p-6 sm:p-8">
    <div class="border-b border-zinc-200 pb-4 dark:border-zinc-800">
      <h3 class="text-lg font-bold text-zinc-900 dark:text-white">Configure Account Status</h3>
      <p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
        Select a target status level and provide an audit justification.
      </p>
    </div>

    <form class="mt-6 space-y-6" onsubmit={(e) => { e.preventDefault(); submit(); }}>
      <div>
        <span class="label mb-3 block text-sm font-semibold text-zinc-900 dark:text-white">Target Status</span>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <!-- Active Card -->
          <label
            class="flex cursor-pointer items-start gap-3 border p-4 transition-colors {selectedAction === 'ACTIVE'
              ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/80'
              : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600'}"
          >
            <input
              type="radio"
              name="statusAction"
              value="ACTIVE"
              bind:group={selectedAction}
              class="mt-1 h-4 w-4 text-zinc-900 focus:ring-zinc-900 dark:text-white dark:focus:ring-white"
            />
            <div>
              <p class="text-sm font-bold text-zinc-900 dark:text-white">Active</p>
              <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Restore full login and dashboard access.</p>
            </div>
          </label>

          <!-- Deactivate Card -->
          <label
            class="flex cursor-pointer items-start gap-3 border p-4 transition-colors {selectedAction === 'INACTIVE'
              ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/80'
              : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600'}"
          >
            <input
              type="radio"
              name="statusAction"
              value="INACTIVE"
              bind:group={selectedAction}
              class="mt-1 h-4 w-4 text-zinc-900 focus:ring-zinc-900 dark:text-white dark:focus:ring-white"
            />
            <div>
              <p class="text-sm font-bold text-zinc-900 dark:text-white">Deactivate</p>
              <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Temporarily deactivate account access.</p>
            </div>
          </label>

          <!-- Temporary Ban Card -->
          <label
            class="flex cursor-pointer items-start gap-3 border p-4 transition-colors {selectedAction === 'BANNED_TEMP'
              ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/80'
              : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600'}"
          >
            <input
              type="radio"
              name="statusAction"
              value="BANNED_TEMP"
              bind:group={selectedAction}
              class="mt-1 h-4 w-4 text-zinc-900 focus:ring-zinc-900 dark:text-white dark:focus:ring-white"
            />
            <div>
              <p class="text-sm font-bold text-zinc-900 dark:text-white">Temporary Ban</p>
              <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Time-bounded penalty. Automatically lifted when expired.</p>
            </div>
          </label>

          <!-- Permanent Ban Card -->
          <label
            class="flex cursor-pointer items-start gap-3 border p-4 transition-colors {selectedAction === 'BANNED_PERM'
              ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/80'
              : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600'}"
          >
            <input
              type="radio"
              name="statusAction"
              value="BANNED_PERM"
              bind:group={selectedAction}
              class="mt-1 h-4 w-4 text-zinc-900 focus:ring-zinc-900 dark:text-white dark:focus:ring-white"
            />
            <div>
              <p class="text-sm font-bold text-zinc-900 dark:text-white">Permanent Ban</p>
              <p class="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Permanently bar this user account from signing in.</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Duration Controls if Temporary Ban (Boxy & Monochromatic) -->
      {#if selectedAction === 'BANNED_TEMP'}
        <div class="border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-800/40">
          <span class="label block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Select Ban Duration
          </span>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              class="border px-4 py-2 text-xs font-semibold transition-colors {durationPreset === 1
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'}"
              onclick={() => (durationPreset = 1)}
            >
              1 Day (24 Hours)
            </button>
            <button
              type="button"
              class="border px-4 py-2 text-xs font-semibold transition-colors {durationPreset === 7
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'}"
              onclick={() => (durationPreset = 7)}
            >
              7 Days (1 Week)
            </button>
            <button
              type="button"
              class="border px-4 py-2 text-xs font-semibold transition-colors {durationPreset === 30
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'}"
              onclick={() => (durationPreset = 30)}
            >
              30 Days (1 Month)
            </button>
            <button
              type="button"
              class="border px-4 py-2 text-xs font-semibold transition-colors {durationPreset === -1
                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'}"
              onclick={() => (durationPreset = -1)}
            >
              Custom Date
            </button>
          </div>

          {#if durationPreset === -1}
            <div class="mt-4">
              <label for="custom-date-input" class="label text-xs">Choose Expiration Date & Time</label>
              <input
                id="custom-date-input"
                type="datetime-local"
                bind:value={customDate}
                class="input text-sm"
                required
              />
            </div>
          {/if}

          <div class="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
            Account will remain restricted until: <strong class="font-semibold text-zinc-900 dark:text-white">{formatDateTime(calculateBannedUntil())}</strong>
          </div>
        </div>
      {/if}

      <!-- Reason Textarea -->
      <div>
        <label for="status-reason-input" class="label">
          Reason / Audit Note {selectedAction !== 'ACTIVE' ? '(Required for Auditing)' : '(Optional)'}
        </label>
        <textarea
          id="status-reason-input"
          rows="3"
          bind:value={reason}
          placeholder="State the reason for deactivation, policy violation, or internal audit reference..."
          class="input text-sm"
        ></textarea>
        <p class="hint">This note will be recorded permanently in the audit trail and displayed on login attempt.</p>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Link href={route(ROUTES.WEB.ADMIN.USERS)}>
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Update Status'}
        </Button>
      </div>
    </form>
  </section>

  <!-- Section 3: History Table (Moved to Bottom, Clean Boxy Table) -->
  <section class="card mt-8 min-w-0">
    <div class="flex flex-col gap-2 border-b border-zinc-200 p-5 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-bold text-zinc-900 dark:text-white">Status History & Audit Trail</h3>
        <p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          Immutable historical log of all account status transitions.
        </p>
      </div>
      <span class="bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {history.length} {history.length === 1 ? 'Event' : 'Events'}
      </span>
    </div>

    <div class="relative overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th class="th">Transition</th>
            <th class="th">Changed By</th>
            <th class="th">Reason / Note</th>
            <th class="th hidden sm:table-cell">Restriction Expiry</th>
            <th class="th text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#each history as item (item.id)}
            <tr class="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <td class="td whitespace-nowrap">
                <div class="flex items-center gap-1.5 font-semibold text-xs">
                  <Badge status={item.fromStatus}>{item.fromStatus}</Badge>
                  <span class="text-zinc-400">→</span>
                  <Badge status={item.toStatus}>{item.toStatus}</Badge>
                </div>
              </td>
              <td class="td whitespace-nowrap">
                <span class="font-medium text-zinc-900 dark:text-white">
                  {item.changedByName ?? 'System'}
                </span>
                {#if item.changedByEmail}
                  <span class="block text-xs text-zinc-500 dark:text-zinc-400">{item.changedByEmail}</span>
                {/if}
              </td>
              <td class="td min-w-[200px]">
                {#if item.reason}
                  <span class="text-zinc-700 dark:text-zinc-300">"{item.reason}"</span>
                {:else}
                  <span class="text-zinc-400">—</span>
                {/if}
              </td>
              <td class="td hidden whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-400 sm:table-cell">
                {#if item.bannedUntil}
                  <span class="font-medium text-rose-600 dark:text-rose-400">{formatDateTime(item.bannedUntil)}</span>
                {:else if item.toStatus === 'BANNED'}
                  <span class="font-medium text-rose-600 dark:text-rose-400">Permanent</span>
                {:else}
                  <span class="text-zinc-400">—</span>
                {/if}
              </td>
              <td class="td tnum whitespace-nowrap text-right text-xs text-zinc-500 dark:text-zinc-400">
                {formatDateTime(item.createdAt)}
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-6 py-12 text-center">
                <p class="text-base font-semibold text-zinc-900 dark:text-white">No status history records found</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Any future status changes will be recorded here.</p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
</AdminLayout>
