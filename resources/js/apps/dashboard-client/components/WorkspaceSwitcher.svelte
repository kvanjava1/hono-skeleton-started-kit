<script lang="ts">
  import { router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../lib/routes.ts'

  export interface WorkspaceItem {
    clientId: number
    clientName: string
    clientSlug: string
    clientStatus: string
    roleId: number
    roleName: string
    memberStatus: string
  }

  interface Props {
    currentClient?: { id: number; name: string; slug: string; status: string } | null
    currentRole?: string | null
    workspaces?: WorkspaceItem[]
  }

  let { currentClient = null, currentRole = null, workspaces = [] }: Props = $props()

  let isOpen = $state(false)

  const toggleDropdown = () => {
    isOpen = !isOpen
  }

  const closeDropdown = () => {
    isOpen = false
  }

  const handleSwitch = (clientId: number) => {
    if (currentClient && currentClient.id === clientId) {
      closeDropdown()
      return
    }

    closeDropdown()
    router.post(
      route(ROUTES.WEB.CLIENT.SWITCH_WORKSPACE, { id: clientId }),
      {},
      {
        preserveState: false,
      },
    )
  }
</script>

<svelte:window onclick={(e) => {
  const target = e.target as HTMLElement
  if (!target.closest('.workspace-switcher-container')) {
    isOpen = false
  }
}} />

<div class="relative w-full workspace-switcher-container">
  <!-- Trigger Button: Strictly Boxy, No Rounded Edges, Dark Sidebar Optimized -->
  <button
    type="button"
    onclick={toggleDropdown}
    class="flex w-full items-center justify-between gap-2.5 border border-zinc-700/80 bg-zinc-800/90 px-3 py-2 text-left text-sm font-medium text-white transition-colors hover:bg-zinc-800 hover:border-zinc-600"
    aria-expanded={isOpen}
    aria-haspopup="true"
  >
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="flex h-6 w-6 shrink-0 items-center justify-center border border-zinc-600 bg-zinc-900 font-mono text-xs font-bold text-white">
        {currentClient ? currentClient.name.charAt(0).toUpperCase() : 'O'}
      </div>
      
      <div class="flex flex-col min-w-0">
        <span class="truncate text-sm font-semibold leading-tight text-white">
          {currentClient ? currentClient.name : 'Select Workspace'}
        </span>
        {#if currentRole}
          <span class="text-xs uppercase tracking-wider text-zinc-400">
            {currentRole}
          </span>
        {/if}
      </div>
    </div>

    <svg
      class="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 {isOpen ? 'rotate-180' : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- Dropdown Menu Boxy (Dark Monochromatic) -->
  {#if isOpen}
    <div
      class="absolute left-0 right-0 z-50 mt-1.5 w-full border border-zinc-700 bg-zinc-900 text-zinc-100 shadow-2xl"
      role="menu"
    >
      <div class="border-b border-zinc-800 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
        Workspaces ({workspaces.length})
      </div>

      <div class="max-h-60 overflow-y-auto py-1">
        {#each workspaces as ws (ws.clientId)}
          {@const isActive = currentClient && currentClient.id === ws.clientId}
          <button
            type="button"
            onclick={() => handleSwitch(ws.clientId)}
            class="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-zinc-800 {isActive ? 'bg-zinc-800 font-semibold text-white' : 'text-zinc-300'}"
            role="menuitem"
          >
            <div class="flex items-center gap-2.5 truncate">
              <span class="flex h-5 w-5 shrink-0 items-center justify-center border border-zinc-700 bg-zinc-800 font-mono text-xs font-semibold text-white">
                {ws.clientName.charAt(0).toUpperCase()}
              </span>
              <span class="truncate">{ws.clientName}</span>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
              <span class="border border-zinc-700 bg-zinc-800/80 px-1.5 py-0.5 text-xs uppercase tracking-wider text-zinc-300">
                {ws.roleName.replace('Client ', '')}
              </span>
              {#if isActive}
                <svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </div>
          </button>
        {:else}
          <div class="px-3.5 py-3 text-center text-xs text-zinc-400">
            No workspaces available.
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
