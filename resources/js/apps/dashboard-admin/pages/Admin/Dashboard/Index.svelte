<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'

  interface Props {
    appName?: string
    authUser?: { name: string; email: string } | null
    totalUsers?: number
    flash?: { success?: string; error?: string }
  }

  let {
    appName = '',
    authUser = null,
    totalUsers = 0,
    flash = {},
  }: Props = $props()
</script>

<svelte:head>
  <title>Dashboard — {appName}</title>
</svelte:head>

<AdminLayout user={authUser ?? undefined} current="dashboard">
  <!-- Header -->
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Hello, {authUser?.name ?? 'Admin'} 👋
      </h1>
      <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
        Welcome back to your administration panel overview.
      </p>
    </div>
    <div class="flex gap-3">
      <Link href={route(ROUTES.WEB.ADMIN.USERS_CREATE_PAGE)}>
        <Button>
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add User
        </Button>
      </Link>
    </div>
  </div>

  <!-- Flash notifications -->
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

  <!-- Welcome banner card -->
  <section class="card mt-6 p-6 sm:p-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Account Overview
        </span>
        <h2 class="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">
          Logged in as <span class="text-primary underline decoration-primary/40 underline-offset-4">{authUser?.email ?? 'Unknown'}</span>
        </h2>
        <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
          You have full administrator privileges to manage users and system settings.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Link href={route(ROUTES.WEB.ADMIN.USERS)}>
          <Button variant="secondary">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            Manage Users
          </Button>
        </Link>
      </div>
    </div>
  </section>

  <!-- Metric Stat Cards -->
  <section class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <!-- Total Users Card -->
    <div class="card p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-base font-medium text-zinc-500 dark:text-zinc-400">Total Users</p>
          <p class="tnum mt-1.5 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {totalUsers}
          </p>
        </div>
        <span class="grid h-12 w-12 place-items-center bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </span>
      </div>
      <div class="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span class="text-xs text-zinc-500 dark:text-zinc-400">Active Admin Accounts</span>
        <Link href={route(ROUTES.WEB.ADMIN.USERS)} class="text-xs font-semibold text-zinc-900 hover:underline dark:text-white">
          View all →
        </Link>
      </div>
    </div>

    <!-- System Health Card -->
    <div class="card p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-base font-medium text-zinc-500 dark:text-zinc-400">System Status</p>
          <div class="mt-1.5 flex items-center gap-2">
            <span class="relative flex h-3 w-3">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
            <p class="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Operational
            </p>
          </div>
        </div>
        <span class="grid h-12 w-12 place-items-center bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      </div>
      <div class="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span class="text-xs text-zinc-500 dark:text-zinc-400">Health Probes</span>
        <span class="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          Healthy
        </span>
      </div>
    </div>

    <!-- Quick Navigation Card -->
    <div class="card p-5">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-base font-medium text-zinc-500 dark:text-zinc-400">Quick Actions</p>
          <p class="mt-1.5 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Shortcuts
          </p>
        </div>
        <span class="grid h-12 w-12 place-items-center bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-100">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </span>
      </div>
      <div class="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <Link href={route(ROUTES.WEB.ADMIN.USERS_CREATE_PAGE)} class="text-xs font-semibold text-zinc-900 hover:underline dark:text-white">
          + Add New User
        </Link>
        <span class="text-zinc-300 dark:text-zinc-700">•</span>
        <Link href={route(ROUTES.WEB.ADMIN.USERS)} class="text-xs font-semibold text-zinc-900 hover:underline dark:text-white">
          User Directory
        </Link>
      </div>
    </div>
  </section>
</AdminLayout>
