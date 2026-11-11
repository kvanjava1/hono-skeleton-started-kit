<script lang="ts">
  import { router, Link } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import Badge from '../../../components/Badge.svelte'
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
    client: ClientInfo
    apiKeys?: ApiKeyItem[]
    authUserId?: number
    authUser?: { name: string; email: string } | null
    flash?: { success?: string; error?: string }
  }

  let {
    appName = '',
    client,
    apiKeys = [],
    authUser = null,
    flash = {},
  }: Props = $props()

  let keyName = $state('')
  let isSubmitting = $state(false)
  let revealedToken = $state('')
  let copied = $state(false)

  $effect(() => {
    if (flash?.success && flash.success.includes('TOKEN:')) {
      const parts = flash.success.split('TOKEN:')
      if (parts[1]) {
        revealedToken = parts[1].trim()
      }
    }
  })

  const submitCreate = () => {
    if (!keyName.trim()) return
    isSubmitting = true
    router.post(
      route(ROUTES.WEB.ADMIN.CLIENTS_API_KEYS_CREATE, { id: client.id }),
      { name: keyName.trim() },
      {
        preserveScroll: true,
        onSuccess: () => {
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
      route(ROUTES.WEB.ADMIN.CLIENTS_API_KEYS_REVOKE, { id: client.id, keyId: key.id }),
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
  <title>API Keys — {client.name} — {appName || 'AdminPanel'}</title>
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
    <span class="font-medium text-zinc-900 dark:text-white">API Keys</span>
  </div>

  <!-- Header -->
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        API Keys
      </h1>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        Manage machine credentials for <span class="font-bold text-zinc-800 dark:text-zinc-200">{client.name}</span>.
      </p>
    </div>

    <div>
      <Link href={route(ROUTES.WEB.ADMIN.CLIENTS_SHOW_PAGE, { id: client.id })}>
        <Button variant="secondary">Back to Details</Button>
      </Link>
    </div>
  </div>

  <!-- Flash Error -->
  {#if flash.error}
    <div class="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}

  <!-- Revealed Token Banner (Show Once on Page) -->
  {#if revealedToken}
    <div class="mt-6 border-2 border-amber-300 bg-amber-50 p-6 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/40">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-bold text-amber-900 dark:text-amber-200">
            ⚠️ Copy your secret API key now
          </h2>
          <p class="mt-1 text-sm text-amber-800 dark:text-amber-300">
            This token will <strong>never be shown again</strong>. Please copy and store it securely in your environment variables.
          </p>
        </div>
        <button
          type="button"
          class="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
          onclick={() => (revealedToken = '')}
        >
          Dismiss
        </button>
      </div>

      <div class="mt-4 flex items-center gap-3">
        <input
          type="text"
          readonly
          value={revealedToken}
          class="input flex-1 font-mono text-sm font-bold text-zinc-900 shadow-inner dark:text-amber-100"
        />
        <Button variant="primary" class="gap-1.5 shrink-0" onclick={copyToken}>
          {#if copied}
            ✓ Copied!
          {:else}
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
            </svg>
            Copy Token
          {/if}
        </Button>
      </div>
    </div>
  {/if}

  <!-- Section 1: Generate Key Form (Inline on Page) -->
  <section class="card mt-6 p-6 sm:p-8">
    <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Generate Secret Key</h2>
    <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
      Create a new Bearer token for server-to-server integrations.
    </p>

    <form onsubmit={(e) => { e.preventDefault(); submitCreate(); }} class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
      <div class="flex-1">
        <label for="key-name" class="label">Key Description</label>
        <TextInput
          id="key-name"
          placeholder="e.g. POS Server Jakarta, Mobile App Prod"
          required
          bind:value={keyName}
        />
      </div>

      <div>
        <Button
          variant="primary"
          type="submit"
          class="w-full sm:w-auto"
          disabled={isSubmitting || !keyName.trim()}
        >
          {isSubmitting ? 'Generating...' : '+ Generate API Key'}
        </Button>
      </div>
    </form>
  </section>

  <!-- Section 2: Active Keys Table -->
  <section class="card mt-6 min-w-0">
    <div class="flex flex-col gap-1 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:p-5">
      <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Active Keys ({apiKeys.length})</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400">Machine credentials authorized for this client.</p>
    </div>

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
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Use the form above to generate your first key.</p>
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
</AdminLayout>
