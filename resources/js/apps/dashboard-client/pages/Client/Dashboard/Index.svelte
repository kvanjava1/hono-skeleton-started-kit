<script lang="ts">
  import { Link } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import ClientLayout from '../../../components/ClientLayout.svelte'
  import type { WorkspaceItem } from '../../../components/WorkspaceSwitcher.svelte'

  interface ClientData {
    id: number
    name: string
    slug: string
    status: string
  }

  interface UserData {
    id: number
    name: string
    email: string
    status: string
  }

  interface Stats {
    totalApiKeys: number
    totalMembers: number
  }

  interface Props {
    appName?: string
    client?: ClientData | null
    authUser?: UserData | null
    role?: string | null
    workspaces?: WorkspaceItem[]
    stats?: Stats
  }

  let {
    appName = 'API Portal',
    client = null,
    authUser = null,
    role = null,
    workspaces = [],
    stats = { totalApiKeys: 0, totalMembers: 0 },
  }: Props = $props()
</script>

<svelte:head>
  <title>Overview — {client ? client.name : 'Client Portal'} — {appName}</title>
</svelte:head>

<ClientLayout
  auth={{
    client,
    clientUser: authUser,
    currentRole: role,
    workspaces,
  }}
  current="dashboard"
>
  <!-- Welcome Banner Boxy (Matching Admin scale: text-3xl title, text-base text) -->
  <div class="border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div class="flex items-center gap-3">
          <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {client ? client.name : 'Welcome to API Portal'}
          </h1>
          {#if client}
            <span class="border border-zinc-300 px-2.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
              {client.status}
            </span>
          {/if}
        </div>
        <p class="mt-2 text-base text-zinc-500 dark:text-zinc-400">
          Organization Identifier: <code class="font-mono font-bold text-zinc-900 dark:text-zinc-200">{client ? client.slug : 'unselected'}</code>
          {#if role}
            — Your Access Level: <span class="font-semibold text-zinc-900 dark:text-white">{role}</span>
          {/if}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <Link
          href={route(ROUTES.WEB.CLIENT.API_KEYS)}
          class="border border-black bg-black px-4 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90 dark:border-white dark:bg-white dark:text-black"
        >
          Manage API Keys →
        </Link>
      </div>
    </div>
  </div>

  {#if client && client.status !== 'ACTIVE'}
    <div class="mt-6 border-l-4 border-rose-600 bg-rose-50 p-5 text-rose-950 dark:border-rose-500 dark:bg-rose-950/30 dark:text-rose-200">
      <div class="flex items-start gap-3">
        <svg class="h-6 w-6 shrink-0 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div>
          <h3 class="text-base font-bold text-rose-900 dark:text-rose-200">
            Organization Status: {client.status}
          </h3>
          <p class="mt-1 text-sm text-rose-800 dark:text-rose-300">
            API key authorization and webhook events for this organization are currently restricted. Please contact platform support if you require assistance.
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Metric Counters (Boxy Cards, matching Admin metric cards) -->
  <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
    <!-- Card 1: API Keys -->
    <div class="border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div class="text-base font-medium text-zinc-500 dark:text-zinc-400">
        Active API Credentials
      </div>
      <div class="mt-2 flex items-baseline justify-between">
        <div class="font-mono text-3xl font-bold text-zinc-900 dark:text-white">
          {stats.totalApiKeys}
        </div>
        <Link
          href={route(ROUTES.WEB.CLIENT.API_KEYS)}
          class="text-sm font-semibold text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-white"
        >
          View keys →
        </Link>
      </div>
    </div>

    <!-- Card 2: Team Members -->
    <div class="border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div class="text-base font-medium text-zinc-500 dark:text-zinc-400">
        Team Members
      </div>
      <div class="mt-2 flex items-baseline justify-between">
        <div class="font-mono text-3xl font-bold text-zinc-900 dark:text-white">
          {stats.totalMembers}
        </div>
        <Link
          href={route(ROUTES.WEB.CLIENT.TEAM)}
          class="text-sm font-semibold text-zinc-700 underline hover:text-black dark:text-zinc-300 dark:hover:text-white"
        >
          Manage team →
        </Link>
      </div>
    </div>

    <!-- Card 3: Switcher Info -->
    <div class="border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div class="text-base font-medium text-zinc-500 dark:text-zinc-400">
        Connected Workspaces
      </div>
      <div class="mt-2 flex items-baseline justify-between">
        <div class="font-mono text-3xl font-bold text-zinc-900 dark:text-white">
          {workspaces.length}
        </div>
        <span class="text-sm text-zinc-500 dark:text-zinc-400">
          Switch via header
        </span>
      </div>
    </div>
  </div>

  <!-- Documentation & Developer Resources Boxy Section -->
  <div class="mt-6 border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-950">
    <h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
      Developer Integration & Documentation
    </h2>
    <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">
      Integrate your backend services using the Machine-to-Machine (M2M) API keys provisioned for {client?.name ?? 'your organization'}.
    </p>

    <div class="mt-4 border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div class="text-zinc-500 dark:text-zinc-400">// Example API Request with your organization token</div>
      <div class="mt-1.5 text-zinc-900 dark:text-zinc-100">
        curl -X GET "http://localhost:8080/api/v1/resource" \<br />
        &nbsp;&nbsp;-H "Authorization: Bearer <span class="text-zinc-500">&lt;YOUR_API_KEY_SECRET&gt;</span>"
      </div>
    </div>

    <div class="mt-5 flex items-center gap-4">
      <a
        href="/api/docs"
        target="_blank"
        rel="noreferrer"
        class="border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wider text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      >
        Open Interactive API Docs ↗
      </a>
      <a
        href="/api/spec"
        target="_blank"
        rel="noreferrer"
        class="text-sm font-medium text-zinc-500 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        Download OpenAPI Spec (JSON)
      </a>
    </div>
  </div>
</ClientLayout>
