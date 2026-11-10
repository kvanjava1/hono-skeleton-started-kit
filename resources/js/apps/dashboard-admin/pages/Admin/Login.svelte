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
  <title>Login — {appName}</title>
</svelte:head>

<div class="grid min-h-screen place-items-center bg-zinc-200/70 px-4 py-10 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
  <!-- Partikel interaktif (dekoratif, tidak menangkap klik — port login.html) -->
  <ParticlesBackground />

  <!-- Toggle tema (pojok kanan atas — port login.html) -->
  <div class="fixed right-4 top-4 z-10">
    <ThemeToggle />
  </div>

  <main class="relative w-full max-w-md">
    <!-- Logo + sambutan (port login.html) -->
    <div class="mb-8 flex flex-col items-center text-center">
      <span class="grid h-14 w-14 place-items-center bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950">
        <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
      </span>
      <h1 class="mt-4 text-3xl font-extrabold tracking-tight">Selamat datang kembali</h1>
      <p class="mt-1.5 text-base text-zinc-500 dark:text-zinc-400">Masuk untuk melanjutkan ke panel admin.</p>
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
          <label for="email" class="label">Email</label>
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
          <label for="password" class="label">Sandi</label>
          <PasswordInput
            id="password"
            bind:value={form.password}
            autocomplete="current-password"
            error={form.errors.password}
            required
          />
        </div>
        <Button type="submit" disabled={form.processing} class="w-full">
          {form.processing ? 'Memproses…' : 'Masuk'}
        </Button>
      </form>
    </div>
  </main>
</div>
