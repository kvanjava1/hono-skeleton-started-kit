<script lang="ts">
  import { Link, page, router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../lib/routes.ts'
  import WorkspaceSwitcher from './WorkspaceSwitcher.svelte'
  import type { WorkspaceItem } from './WorkspaceSwitcher.svelte'
  import type { Snippet } from 'svelte'

  interface AuthData {
    client?: { id: number; name: string; slug: string; status: string } | null
    clientUser?: { id: number; name: string; email: string; status: string } | null
    currentRole?: string | null
    workspaces?: WorkspaceItem[]
  }

  interface Props {
    auth?: AuthData
    current?: 'dashboard' | 'apikeys' | 'team' | 'logs' | 'activity' | 'docs'
    children?: Snippet
  }

  let { auth = {}, current = 'dashboard', children }: Props = $props()

  const clientUser = $derived(auth.clientUser)
  const currentClient = $derived(auth.client)
  const currentRole = $derived(auth.currentRole)
  const workspaces = $derived(auth.workspaces ?? [])

  const flash = $derived((page?.props as any)?.flash ?? {})

  let sidebarOpen = $state(true)

  $effect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('client_sidebar_open')
      if (saved !== null) {
        sidebarOpen = saved === 'true'
      } else if (window.innerWidth < 1024) {
        sidebarOpen = false
      }
    }
  })

  const closeSidebar = () => {
    sidebarOpen = false
    if (typeof window !== 'undefined') {
      localStorage.setItem('client_sidebar_open', 'false')
    }
  }

  const openSidebar = () => {
    sidebarOpen = true
    if (typeof window !== 'undefined') {
      localStorage.setItem('client_sidebar_open', 'true')
    }
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      closeSidebar()
    }
  }

  const handleLogout = () => {
    router.post(route(ROUTES.WEB.CLIENT.LOGOUT))
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="min-h-screen bg-zinc-100 text-zinc-900 antialiased dark:bg-black dark:text-zinc-100 font-sans">
  
  <!-- Sidebar (Dark like Admin) -->
  <aside
    id="client-sidebar"
    class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 text-zinc-100 transition-transform duration-300 ease-in-out {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <!-- Brand / Header -->
    <div class="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-5">
      <Link href={route(ROUTES.WEB.CLIENT.DASHBOARD)} class="flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center border border-zinc-100 bg-zinc-100 text-xs font-mono font-bold tracking-wider text-zinc-950">
          AP
        </span>
        <span class="text-base font-bold tracking-wider font-mono text-white">API PORTAL</span>
      </Link>
      <button
        type="button"
        class="p-1.5 text-zinc-400 hover:text-white transition-colors"
        aria-label="Hide sidebar"
        onclick={closeSidebar}
      >
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="square" stroke-linejoin="miter" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Workspace Switcher Section in Sidebar -->
    <div class="border-b border-zinc-800 p-4">
      <div class="mb-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500">
        Workspace
      </div>
      <WorkspaceSwitcher
        {currentClient}
        {currentRole}
        {workspaces}
      />
    </div>

    <!-- Navigation Menu Items (Sidebar Vertical Menu) -->
    <nav class="flex-1 space-y-6 overflow-y-auto px-4 py-5">
      <div>
        <p class="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Navigation</p>
        <ul class="space-y-1">
          <li>
            <Link
              href={route(ROUTES.WEB.CLIENT.DASHBOARD)}
              class="flex items-center gap-3 px-3 py-2.5 text-base font-medium transition-colors {current === 'dashboard' ? 'bg-zinc-100 font-semibold text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
              preserveScroll
            >
              <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="square" stroke-linejoin="miter" d="M3.75 6h6.75v6.75H3.75V6zm10.5 0H21v12h-6.75V6zm-10.5 10.5h6.75V21H3.75v-4.5z" />
              </svg>
              Overview
            </Link>
          </li>
          <li>
            <Link
              href={route(ROUTES.WEB.CLIENT.API_KEYS)}
              class="flex items-center gap-3 px-3 py-2.5 text-base font-medium transition-colors {current === 'apikeys' ? 'bg-zinc-100 font-semibold text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
              preserveScroll
            >
              <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="square" stroke-linejoin="miter" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              API Keys
            </Link>
          </li>
          <li>
            <Link
              href={route(ROUTES.WEB.CLIENT.TEAM)}
              class="flex items-center gap-3 px-3 py-2.5 text-base font-medium transition-colors {current === 'team' ? 'bg-zinc-100 font-semibold text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
              preserveScroll
            >
              <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="square" stroke-linejoin="miter" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.059 2.772m0 0a5.972 5.972 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              Team Members
            </Link>
          </li>
          <li>
            <Link
              href={route(ROUTES.WEB.CLIENT.LOGS)}
              class="flex items-center gap-3 px-3 py-2.5 text-base font-medium transition-colors {current === 'logs' ? 'bg-zinc-100 font-semibold text-zinc-950' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}"
              preserveScroll
            >
              <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Audit Logs
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <p class="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Developer</p>
        <ul class="space-y-1">
          <li>
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              class="flex items-center gap-3 px-3 py-2.5 text-base font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <svg class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
                <path stroke-linecap="square" stroke-linejoin="miter" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              Documentation ↗
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Bottom User Section -->
    {#if clientUser}
      <div class="border-t border-zinc-800 p-4">
        <div class="flex items-center justify-between">
          <div class="min-w-0 flex-1 pr-2">
            <div class="truncate text-sm font-semibold text-white">
              {clientUser.name}
            </div>
            <div class="truncate text-xs text-zinc-400">
              {clientUser.email}
            </div>
            <Link
              href={route(ROUTES.WEB.CLIENT.ACTIVITY)}
              class="inline-block mt-1 text-[11px] font-mono text-zinc-400 hover:text-white transition-colors"
            >
              Account Security &rarr;
            </Link>
          </div>
          <button
            type="button"
            onclick={handleLogout}
            class="border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
          >
            Log Out
          </button>
        </div>
      </div>
    {/if}
  </aside>

  <!-- Mobile backdrop -->
  {#if sidebarOpen}
    <div
      class="fixed inset-0 z-40 bg-zinc-950/60 lg:hidden"
      aria-hidden="true"
      onclick={closeSidebar}
    ></div>
  {/if}

  <!-- Topbar -->
  <header
    id="client-topbar"
    class="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 transition-all duration-300 ease-in-out {sidebarOpen ? 'lg:pl-64' : 'pl-0'}"
  >
    <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex items-center gap-3">
        {#if !sidebarOpen}
          <button
            type="button"
            class="p-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            aria-label="Open sidebar"
            onclick={openSidebar}
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="square" stroke-linejoin="miter" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        {/if}

        <div class="flex items-center gap-2 text-sm">
          <span class="font-semibold text-zinc-900 dark:text-white">
            {currentClient ? currentClient.name : 'Client Portal'}
          </span>
          <span class="text-zinc-400">/</span>
          <span class="text-zinc-500 dark:text-zinc-400 capitalize">
            {current === 'dashboard' ? 'Overview' : current === 'apikeys' ? 'API Keys' : current === 'team' ? 'Team' : 'Overview'}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        {#if clientUser}
          <div class="hidden text-right sm:block">
            <span class="border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {currentRole ?? 'Member'}
            </span>
          </div>
        {/if}
      </div>
    </div>
  </header>

  <!-- Flash Alerts (Boxy) -->
  <div class="transition-all duration-300 ease-in-out {sidebarOpen ? 'lg:pl-64' : 'pl-0'}">
    {#if flash.success}
      <div class="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div class="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
          {flash.success}
        </div>
      </div>
    {/if}

    {#if flash.error}
      <div class="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div class="border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {flash.error}
        </div>
      </div>
    {/if}
  </div>

  <!-- Main Content Area -->
  <main class="relative transition-all duration-300 ease-in-out {sidebarOpen ? 'lg:pl-64' : 'pl-0'}">
    <div class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {#if children}
        {@render children()}
      {/if}
    </div>
  </main>
</div>