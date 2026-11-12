<script lang="ts">
  import { untrack } from 'svelte'
  import { useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../lib/routes.ts'
  import TextInput from '../../components/TextInput.svelte'
  import PasswordInput from '../../components/PasswordInput.svelte'
  import Button from '../../components/Button.svelte'
  import ThemeToggle from '../../components/ThemeToggle.svelte'
  import ParticlesBackground from '../../components/ParticlesBackground.svelte'

  interface Props {
    appName?: string
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let { appName = '', flash = {}, errors = {} }: Props = $props()

  const form = useForm({ email: '', password: '' })

  // Validation errors that arrive via the session flash (redirect-back flow)
  // are surfaced through the shared `errors` prop.
  // Gunakan untrack() di Svelte 5 agar form.setError tidak memicu infinite update loop.
  $effect(() => {
    if (Object.keys(errors).length > 0) {
      untrack(() => {
        form.setError(errors)
      })
    }
  })

  // The generic credential failure is stored under the form-level `form` key
  // (anti user-enumeration) which is outside the typed form fields.
  const formError = $derived(
    ((form.errors as Record<string, string | undefined>).form) || errors.form
  )

  const login = () => form.post(route(ROUTES.WEB.ADMIN.LOGIN_SUBMIT))
</script>

<svelte:head>
  <title>Admin Login — {appName || 'Administration'}</title>
</svelte:head>

<div class="grid min-h-screen place-items-center bg-zinc-200/70 px-4 py-10 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
  <!-- Partikel interaktif (dekoratif, tidak menangkap klik — port login.html) -->
  <ParticlesBackground />

  <!-- Toggle tema (pojok kanan atas — port login.html) -->
  <div class="fixed right-4 top-4 z-10">
    <ThemeToggle />
  </div>

  <main class="relative w-full max-w-md">
    <!-- Brand Pill Boxy & Title -->
    <div class="mb-8 flex flex-col items-center text-center">
      <div class="mx-auto flex h-12 w-fit items-center border border-black bg-black px-5 text-sm font-mono font-bold tracking-widest text-white dark:border-white dark:bg-white dark:text-black">
        ADMIN BACKOFFICE
      </div>
      <h1 class="mt-6 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
        Sign in to Administration
      </h1>
      <p class="mt-2 text-base text-zinc-500 dark:text-zinc-400">
        Manage platform resources, clients, roles, and system configurations.
      </p>
    </div>

    <div class="card p-6 sm:p-8">
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

      <form class="space-y-5" onsubmit={e => { e.preventDefault(); login() }}>
        <div>
          <label for="email" class="label">Email Address</label>
          <TextInput
            id="email"
            type="email"
            bind:value={form.email}
            autocomplete="email"
            placeholder="admin@example.com"
            error={form.errors.email}
            required
          />
        </div>
        <div>
          <label for="password" class="label">Password</label>
          <PasswordInput
            id="password"
            bind:value={form.password}
            autocomplete="current-password"
            error={form.errors.password}
            required
          />
        </div>
        <Button type="submit" disabled={form.processing} class="w-full">
          {form.processing ? 'Verifying…' : 'Sign In'}
        </Button>
      </form>

      <div class="mt-6 border-t border-zinc-200 pt-5 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Client or API Consumer?
        <a href={route(ROUTES.WEB.CLIENT.LOGIN)} class="font-semibold text-zinc-900 underline hover:text-black dark:text-white">
          Access Client Portal →
        </a>
      </div>
    </div>
  </main>
</div>
