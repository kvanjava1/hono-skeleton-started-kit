<script lang="ts">
  import { router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import ClientLayout from '../../../components/ClientLayout.svelte'
  import Dropdown from '../../../components/Dropdown.svelte'
  import type { WorkspaceItem } from '../../../components/WorkspaceSwitcher.svelte'

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

  interface UserInfo {
    id: number
    name: string
    email: string
    status: string
  }

  interface Props {
    appName?: string
    client: ClientInfo | null
    apiKeys?: ApiKeyItem[]
    authUser?: UserInfo | null
    role?: string | null
    workspaces?: WorkspaceItem[]
    flash?: { success?: string; error?: string }
  }

  let {
    appName = 'API Portal',
    client = null,
    apiKeys = [],
    authUser = null,
    role = null,
    workspaces = [],
    flash = {},
  }: Props = $props()

  let createModalOpen = $state(false)
  let keyName = $state('')
  let isSubmitting = $state(false)

  // Revoke modal
  let revokeModalOpen = $state(false)
  let keyToRevoke = $state<ApiKeyItem | null>(null)
  let isRevoking = $state(false)

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
      route(ROUTES.WEB.CLIENT.API_KEYS_CREATE),
      { name: keyName.trim() },
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

  const promptRevoke = (key: ApiKeyItem) => {
    keyToRevoke = key
    revokeModalOpen = true
  }

  const confirmRevoke = () => {
    if (!keyToRevoke) return
    isRevoking = true
    router.post(
      route(ROUTES.WEB.CLIENT.API_KEYS_REVOKE, { id: keyToRevoke.id }),
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          revokeModalOpen = false
          keyToRevoke = null
          isRevoking = false
        },
        onError: () => {
          isRevoking = false
        },
      },
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

  const copyPrefix = async (prefix: string) => {
    try {
      await navigator.clipboard.writeText(prefix)
    } catch {
      // fallback
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return dateStr
    }
  }
</script>

<svelte:head>
  <title>API Keys — {client ? client.name : 'Client Portal'} — {appName}</title>
</svelte:head>

<ClientLayout
  auth={{
    client,
    clientUser: authUser,
    currentRole: role,
    workspaces,
  }}
  current="apikeys"
>
  <!-- Page Header -->
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        API Credentials
      </h1>
      <p class="mt-2 text-base text-zinc-500 dark:text-zinc-400">
        Generate and manage Machine-to-Machine (M2M) secret tokens for <span class="font-semibold text-zinc-900 dark:text-white">{client?.name ?? 'your organization'}</span>.
      </p>
    </div>

    <div>
      <button
        type="button"
        onclick={() => (createModalOpen = true)}
        class="inline-flex items-center gap-2 border border-black bg-black px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 dark:border-white dark:bg-white dark:text-black"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="square" stroke-linejoin="miter" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Generate New Key
      </button>
    </div>
  </div>

  <!-- API Keys Table (Boxy Monochromatic) -->
  <div class="mt-6 border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-base border-collapse">
        <thead>
          <tr class="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Key Name</th>
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Token Prefix</th>
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Status</th>
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Last Used</th>
            <th class="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Created</th>
            <th class="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800">
          {#if apiKeys.length === 0}
            <tr>
              <td colspan="6" class="px-5 py-12 text-center text-base text-zinc-500 dark:text-zinc-400">
                <div class="mx-auto max-w-sm">
                  <p class="font-semibold text-zinc-900 dark:text-white">No API credentials yet</p>
                  <p class="mt-1 text-sm">Click "Generate New Key" above to create machine-to-machine tokens for automated services.</p>
                </div>
              </td>
            </tr>
          {:else}
            {#each apiKeys as key (key.id)}
              <tr class="transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                <td class="px-5 py-4 font-semibold text-zinc-900 dark:text-white">
                  {key.name}
                </td>
                <td class="px-5 py-4">
                  <code class="border border-zinc-300 bg-zinc-100 px-2.5 py-1 font-mono text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {key.keyPrefix}••••••••
                  </code>
                </td>
                <td class="px-5 py-4">
                  {#if key.status === 'ACTIVE'}
                    <span class="border border-zinc-300 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                      ACTIVE
                    </span>
                  {:else}
                    <span class="border border-rose-300 bg-rose-50 px-2 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400">
                      {key.status}
                    </span>
                  {/if}
                </td>
                <td class="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(key.lastUsedAt)}
                </td>
                <td class="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDate(key.createdAt)}
                </td>
                <td class="px-5 py-4 text-right">
                  <Dropdown label="Actions for {key.name}">
                    {#snippet menu()}
                      <button
                        type="button"
                        class="dropdown-item w-full text-left"
                        onclick={() => copyPrefix(key.keyPrefix)}
                      >
                        <svg class="h-4 w-4 shrink-0 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                        </svg>
                        <span>Copy Prefix</span>
                      </button>
                      {#if key.status === 'ACTIVE'}
                        <div class="my-1 border-t border-zinc-100 dark:border-zinc-800"></div>
                        <button
                          type="button"
                          class="dropdown-item w-full text-left !text-rose-600 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/30"
                          onclick={() => promptRevoke(key)}
                        >
                          <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          <span>Revoke Key</span>
                        </button>
                      {:else}
                        <div class="my-1 border-t border-zinc-100 dark:border-zinc-800"></div>
                        <span class="dropdown-item w-full opacity-50 cursor-not-allowed text-xs text-zinc-400">
                          Revoked (No actions)
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

  <!-- Generate Key Modal (Boxy) -->
  {#if createModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="fixed inset-0 bg-zinc-950/60"
        onclick={() => (createModalOpen = false)}
        aria-hidden="true"
      ></div>

      <div class="relative w-full max-w-md border border-zinc-300 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <h3 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Generate API Key
        </h3>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Provide a memorable identifier for where this credential will be used.
        </p>

        <form onsubmit={(e) => { e.preventDefault(); submitCreate() }} class="mt-5 space-y-4">
          <div>
            <label for="key-name" class="mb-1.5 block text-sm font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Key Name / Purpose
            </label>
            <input
              id="key-name"
              type="text"
              required
              bind:value={keyName}
              placeholder="e.g. Production Backend Service"
              class="w-full border border-zinc-300 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
            />
          </div>

          <div class="mt-6 flex justify-end gap-3 pt-3">
            <button
              type="button"
              onclick={() => (createModalOpen = false)}
              class="border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !keyName.trim()}
              class="border border-black bg-black px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:border-white dark:bg-white dark:text-black"
            >
              {isSubmitting ? 'Generating…' : 'Generate Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  <!-- One-Time Secret Key Reveal Modal (Boxy) -->
  {#if tokenModalOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="fixed inset-0 bg-zinc-950/70"
        onclick={() => (tokenModalOpen = false)}
        aria-hidden="true"
      ></div>

      <div class="relative w-full max-w-lg border border-black bg-white p-6 shadow-2xl dark:border-white dark:bg-zinc-950">
        <div class="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <span class="flex h-6 w-6 items-center justify-center border border-black bg-black text-xs font-bold text-white dark:border-white dark:bg-white dark:text-black">
            !
          </span>
          <h3 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Save Your Secret Token
          </h3>
        </div>

        <div class="mt-4 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          <strong>Important:</strong> This secret key will <em>never</em> be displayed again. Please copy and store it safely in your environment variables or vault.
        </div>

        <div class="mt-4">
          <label for="raw-token-input" class="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Raw API Key Secret
          </label>
          <div class="flex items-center gap-2">
            <input
              id="raw-token-input"
              type="text"
              readonly
              value={revealedToken}
              class="w-full border border-zinc-300 bg-zinc-100 px-3.5 py-2 font-mono text-sm font-bold text-zinc-900 select-all dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
            <button
              type="button"
              onclick={copyToken}
              class="shrink-0 border border-black bg-black px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 dark:border-white dark:bg-white dark:text-black"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            type="button"
            onclick={() => (tokenModalOpen = false)}
            class="border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold uppercase tracking-wider text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            I Have Saved This Key
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Revoke Key Confirmation Modal (Boxy) -->
  {#if revokeModalOpen && keyToRevoke}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        class="fixed inset-0 bg-zinc-950/60"
        onclick={() => (revokeModalOpen = false)}
        aria-hidden="true"
      ></div>

      <div class="relative w-full max-w-md border border-zinc-300 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <h3 class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Revoke API Credential
        </h3>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Are you sure you want to revoke <strong class="text-zinc-900 dark:text-white">{keyToRevoke.name}</strong> (<code class="font-mono text-xs">{keyToRevoke.keyPrefix}••••••••</code>)? This action is permanent and any systems using this key will immediately be rejected.
        </p>

        <div class="mt-6 flex justify-end gap-3 pt-3">
          <button
            type="button"
            onclick={() => (revokeModalOpen = false)}
            class="border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wider text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isRevoking}
            onclick={confirmRevoke}
            class="border border-rose-600 bg-rose-600 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isRevoking ? 'Revoking…' : 'Confirm Revoke'}
          </button>
        </div>
      </div>
    </div>
  {/if}
</ClientLayout>
