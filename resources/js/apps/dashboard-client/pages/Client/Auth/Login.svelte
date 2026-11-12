<script lang="ts">
  import { untrack } from 'svelte'
  import { useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'

  interface Props {
    appName?: string
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let { appName = 'API Portal', flash = {}, errors = {} }: Props = $props()

  const form = useForm({ email: '', password: '' })

  $effect(() => {
    if (Object.keys(errors).length > 0) {
      untrack(() => {
        form.setError(errors)
      })
    }
  })

  const formError = $derived(
    ((form.errors as Record<string, string | undefined>).form) || errors.form
  )

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    form.post(route(ROUTES.WEB.CLIENT.LOGIN_SUBMIT))
  }
</script>

<svelte:head>
  <title>Client Portal Login — {appName}</title>
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-zinc-200/70 py-12 sm:px-6 lg:px-8 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <!-- Brand Pill Boxy -->
    <div class="mx-auto flex h-12 w-fit items-center border border-black bg-black px-5 text-sm font-mono font-bold tracking-widest text-white dark:border-white dark:bg-white dark:text-black">
      CLIENT PORTAL
    </div>

    <h2 class="mt-6 text-center text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
      Sign in to your organization
    </h2>
    <p class="mt-2 text-center text-base text-zinc-500 dark:text-zinc-400">
      Access your API credentials, manage team members, and inspect analytics.
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <!-- Boxy Card (matching Admin Login .card styling & font size) -->
    <div class="border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      
      {#if formError}
        <div class="mb-5 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {formError}
        </div>
      {/if}

      {#if flash?.error}
        <div class="mb-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          {flash.error}
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-5">
        <div>
          <label for="email" class="mb-1.5 block text-base font-medium text-zinc-700 dark:text-zinc-300">
            Email Address
          </label>
          <div class="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autocomplete="email"
              required
              bind:value={form.email}
              class="block w-full border border-zinc-200 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
              placeholder="developer@company.com"
            />
          </div>
          {#if form.errors.email}
            <p class="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{form.errors.email}</p>
          {/if}
        </div>

        <div>
          <label for="password" class="mb-1.5 block text-base font-medium text-zinc-700 dark:text-zinc-300">
            Password
          </label>
          <div class="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              bind:value={form.password}
              class="block w-full border border-zinc-200 bg-white px-3.5 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-950/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10"
              placeholder="••••••••"
            />
          </div>
          {#if form.errors.password}
            <p class="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{form.errors.password}</p>
          {/if}
        </div>

        <div>
          <button
            type="submit"
            disabled={form.processing}
            class="inline-flex w-full items-center justify-center border border-zinc-950 bg-zinc-950 px-4 py-2.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {form.processing ? 'Verifying...' : 'Sign In'}
          </button>
        </div>
      </form>

      <div class="mt-6 border-t border-zinc-200 pt-5 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Platform Administrator?
        <a href="/admin/login" class="font-semibold text-zinc-900 underline hover:text-black dark:text-white">
          Access Admin Backoffice →
        </a>
      </div>

    </div>
  </div>
</div>
