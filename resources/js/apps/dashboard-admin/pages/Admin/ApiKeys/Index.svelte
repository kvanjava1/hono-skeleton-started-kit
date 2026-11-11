<script lang="ts">
  import { router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import Badge from '../../../components/Badge.svelte'
  import Modal from '../../../components/Modal.svelte'
  import TextInput from '../../../components/TextInput.svelte'

  interface ApiKeyItem {
    id: number
    name: string
    keyPrefix: string
    status: string
    lastUsedAt: string | null
    createdAt: string
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
    apiKeys?: ApiKeyItem[]
    authUserId?: number
    authUser?: { name: string; email: string } | null
    flash?: { success?: string; error?: string }
  }

  let {
    appName = '',
    client,
    apiKeys = [],
    authUserId = 0,
    authUser = null,
    flash = {},
  }: Props = $props()

  let createModalOpen = $state(false)
  let keyName = $state('')
  let isSubmitting = $state(false)

  // Secret token reveal modal (shown once after generation)
  let tokenModalOpen = $state(false)
  let revealedToken = $state('')
  let copied = $state(false)

  $effect(() => {
    if (flash?.success && flash.success.includes('TOKEN:')) {
      const parts = flash.success.split('TOKEN:')
      if (parts[1]) {
        revealedToken = parts[1].trim()
        tokenModalOpen = true
      }
    }
  })

  const submitCreate = () => {
    if (!keyName.trim()) return
    isSubmitting = true
    router.post(
      route(ROUTES.WEB.ADMIN.API_KEYS_CREATE),
      { name: keyName },
      {
        preserveScroll: true,
        onSuccess: () => {
          createModalOpen = false
          keyName = ''
          isSubmitting = false
        },
        onError: () => {
          isSubmitting = false
        },
      },
    )
  }

  const revoke = (key: ApiKeyItem) => {
    if (!confirm(`Revoke API key "${key.name}"? This action cannot be undone.`)) return
    router.post(
      route(ROUTES.WEB.ADMIN.API_KEYS_REVOKE, { id: key.id }),
      {},
      { preserveScroll: true },
    )
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(revealedToken)
      copied = true
      setTimeout(() => (copied = false), 2000)
    } catch {
      // fallback
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

<svelte:head>
  <title>API Keys — {appName || 'AdminPanel'}</title>
</svelte:head>

<AdminLayout current="apikeys" user={authUser ?? undefined}>
  <!-- Header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">API Keys</h1>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        {#if client}
          Manage machine credentials for <span class="font-bold text-zinc-800 dark:text-zinc-200">{client.name}</span>.
        {:else}
          Manage machine credentials for API access.
        {/if}
      </p>
    </div>

    <div>
      <Button variant="primary" class="gap-1.5" onclick={() => (createModalOpen = true)}>
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Generate Key
      </Button>
    </div>
  </div>

  <!-- Flash Messages -->
  {#if flash.error}
    <div class="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}

  <!-- Main Card -->
  <section class="card mt-6 min-w-0">
    <div class="relative overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th class="th">Name</th>
            <th class="th">Key Prefix</th>
            <th class="th">Status</th>
            <th class="th hidden sm:table-cell">Last Used</th>
            <th class="th hidden md:table-cell">Created</th>
            <th class="th sticky right-0 border-l border-zinc-200 bg-zinc-50 text-right dark:border-zinc-800 dark:bg-zinc-800">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#if apiKeys.length === 0}
            <tr>
              <td colspan="6" class="px-6 py-16 text-center">
                <p class="text-base font-semibold text-zinc-900 dark:text-white">No API keys created yet</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Click "Generate Key" above to generate your first secret key.</p>
              </td>
            </tr>
          {:else}
            {#each apiKeys as key (key.id)}
              <tr class="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <td class="td">
                  <span class="font-medium text-zinc-900 dark:text-white">{key.name}</span>
                </td>
                <td class="td font-mono text-sm text-zinc-600 dark:text-zinc-300">
                  {key.keyPrefix}...
                </td>
                <td class="td">
                  <Badge status={key.status}>
                    {key.status}
                  </Badge>
                </td>
                <td class="td tnum hidden whitespace-nowrap text-zinc-500 dark:text-zinc-400 sm:table-cell">
                  {key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never'}
                </td>
                <td class="td tnum hidden whitespace-nowrap text-zinc-500 dark:text-zinc-400 md:table-cell">
                  {formatDate(key.createdAt)}
                </td>
                <td class="td sticky right-0 border-l border-zinc-100 bg-white text-right group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40">
                  {#if key.status === 'ACTIVE'}
                    <button
                      type="button"
                      class="text-sm font-semibold text-rose-600 hover:underline dark:text-rose-400"
                      onclick={() => revoke(key)}
                    >
                      Revoke
                    </button>
                  {:else}
                    <span class="text-sm text-zinc-400">Revoked</span>
                  {/if}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </section>

  <!-- Modal Generate Key -->
  <Modal bind:open={createModalOpen} title="Generate API Key">
    <div class="space-y-4">
      <p class="text-sm text-zinc-500 dark:text-zinc-400">
        Give your API key a descriptive name to remember where it is deployed (e.g. "Server POS Jakarta" or "Mobile App Prod").
      </p>

      <div>
        <TextInput
          id="key-name"
          label="Key Name"
          placeholder="e.g. Backend Production"
          required
          bind:value={keyName}
        />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onclick={() => (createModalOpen = false)}>Cancel</Button>
        <Button variant="primary" onclick={submitCreate} disabled={isSubmitting || !keyName.trim()}>
          {isSubmitting ? 'Generating...' : 'Generate Secret Key'}
        </Button>
      </div>
    </div>
  </Modal>

  <!-- Modal Reveal Token (Copy Once) -->
  <Modal bind:open={tokenModalOpen} title="API Key Generated Successfully">
    <div class="space-y-4">
      <div class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-200">
        <p class="font-bold">⚠️ Copy your secret token now</p>
        <p class="mt-1 text-xs">
          For your security, this secret token will <strong>never be displayed again</strong>. If you lose it, you will need to revoke it and generate a new one.
        </p>
      </div>

      <div>
        <label for="raw-token" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Your Secret Key
        </label>
        <div class="flex items-center gap-2">
          <input
            id="raw-token"
            type="text"
            readonly
            value={revealedToken}
            class="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <Button variant="primary" class="gap-1" onclick={copyToken}>
            {#if copied}
              ✓ Copied!
            {:else}
              Copy
            {/if}
          </Button>
        </div>
      </div>

      <div class="flex justify-end pt-2">
        <Button variant="secondary" onclick={() => (tokenModalOpen = false)}>Close</Button>
      </div>
    </div>
  </Modal>
</AdminLayout>
