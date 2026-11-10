<script lang="ts">
  import type { Snippet } from 'svelte'
  import { fade } from 'svelte/transition'
  import { Link, router } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../lib/routes.ts'
  import ThemeToggle from './ThemeToggle.svelte'
  import Dropdown from './Dropdown.svelte'
  import ParticlesBackground from './ParticlesBackground.svelte'

  // Port shell layout NusaAdmin (index/pelanggan): sidebar gelap w-64 yang
  // selalu gelap di semua tema, topbar sticky h-16 blur, konten lg:pl-64.
  interface Props {
    /** Page title for <title> */
    title?: string
    /** Current active navigation section */
    current?: 'dashboard' | 'users'
    /** Custom sidebar navigation items snippet */
    nav?: Snippet
    /** Logged in user */
    user?: { name: string; email: string }
    children: Snippet
  }

  let { title, current, nav, user, children }: Props = $props()

  let sidebarOpen = $state(true)

  $effect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_open')
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
      localStorage.setItem('sidebar_open', 'false')
    }
  }

  const openSidebar = () => {
    sidebarOpen = true
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_open', 'true')
    }
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024) {
      closeSidebar()
    }
  }

  const logout = () => router.post(route(ROUTES.WEB.ADMIN.LOGOUT))

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join('')
</script>

<svelte:window onkeydown={onKeydown} />

<svelte:head>
  {#if title}<title>{title}</title>{/if}
</svelte:head>

<div class="min-h-screen bg-zinc-200/70 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
  <!-- Interactive particles (decorative) -->
  <ParticlesBackground />

  <!-- Sidebar -->
  <aside
    id="sidebar"
    class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-300 ease-in-out {sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
  >
    <div class="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 px-5">
      <Link href={route(ROUTES.WEB.ADMIN.DASHBOARD)} class="flex items-center gap-2.5">
        <span class="grid h-10 w-10 place-items-center bg-zinc-100 text-zinc-950">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
        </span>
        <span class="text-lg font-extrabold tracking-tight text-white">Admin<span class="text-zinc-400">Panel</span></span>
      </Link>
      <button type="button" class="icon-btn transition-transform hover:scale-105 active:scale-95" aria-label="Hide sidebar" onclick={closeSidebar}>
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>

    <nav class="flex-1 space-y-6 overflow-y-auto px-4 py-5">
      <div>
        <p class="px-3 pb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Main Menu</p>
        <ul class="space-y-1">
          {#if nav}
            {@render nav()}
          {:else}
            <li>
              <Link href={route(ROUTES.WEB.ADMIN.DASHBOARD)} class="nav-link {current === 'dashboard' ? 'nav-link-active' : ''}" preserveScroll>
                <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href={route(ROUTES.WEB.ADMIN.USERS)} class="nav-link {current === 'users' ? 'nav-link-active' : ''}" preserveScroll>
                <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                Users
              </Link>
            </li>
          {/if}
        </ul>
      </div>
    </nav>
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
    id="topbar"
    class="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 transition-all duration-300 ease-in-out {sidebarOpen ? 'lg:pl-64' : 'pl-0'}"
  >
    <div class="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
      {#if !sidebarOpen}
        <button
          transition:fade={{ duration: 200 }}
          type="button"
          class="icon-btn transition-transform hover:scale-105 active:scale-95"
          aria-label="Open sidebar"
          onclick={openSidebar}
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>
      {/if}

      <div class="ml-auto flex items-center gap-1 sm:gap-1.5">
        <ThemeToggle />

        {#if user}
          <Dropdown label="Profile menu" triggerClass="flex items-center gap-2.5 p-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
            {#snippet trigger()}
              <span class="grid h-10 w-10 place-items-center bg-zinc-950 text-base font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">{initials(user.name)}</span>
              <span class="hidden text-left sm:block">
                <span class="block text-base font-semibold leading-tight text-zinc-900 dark:text-white">{user.name}</span>
                <span class="block truncate text-sm leading-tight text-zinc-500 dark:text-zinc-400">{user.email}</span>
              </span>
              <svg class="hidden h-5 w-5 text-zinc-400 sm:block" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            {/snippet}
            {#snippet menu()}
              <div class="px-3 py-2">
                <p class="text-sm font-semibold text-zinc-900 dark:text-white">{user.name}</p>
                <p class="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
              </div>
              <div class="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800"></div>
              <button
                type="button"
                class="dropdown-item w-full !text-rose-600 dark:!text-rose-400"
                onclick={logout}
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
                Sign out
              </button>
            {/snippet}
          </Dropdown>
        {/if}
      </div>
    </div>
  </header>

  <!-- Content -->
  <main class="relative transition-all duration-300 ease-in-out {sidebarOpen ? 'lg:pl-64' : 'pl-0'}">
    <div class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      {@render children()}
    </div>
  </main>
</div>
