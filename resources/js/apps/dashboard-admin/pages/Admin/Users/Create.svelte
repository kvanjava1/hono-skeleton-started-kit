<script lang="ts">
  import { untrack } from 'svelte'
  import { Link, useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import TextInput from '../../../components/TextInput.svelte'
  import PasswordInput from '../../../components/PasswordInput.svelte'

  interface Props {
    appName?: string
    authUser?: { name: string; email: string }
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let { appName = '', authUser, flash = {}, errors = {} }: Props = $props()

  const form = useForm({
    name: '',
    email: '',
    password: '',
  })

  $effect(() => {
    if (Object.keys(errors).length > 0) {
      untrack(() => {
        form.setError(errors)
      })
    }
  })

  const submit = () => form.post(route(ROUTES.WEB.ADMIN.USERS_CREATE))
</script>

<svelte:head>
  <title>Tambah Pengguna — {appName}</title>
</svelte:head>

<AdminLayout user={authUser ?? undefined}>
  {#snippet nav()}
    <li>
      <Link href={route(ROUTES.WEB.ADMIN.USERS)} class="nav-link nav-link-active" preserveScroll>
        <svg class="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
        Pengguna
      </Link>
    </li>
  {/snippet}

  <!-- Breadcrumb & Header -->
  <div class="mb-6">
    <div class="mb-2 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
      <Link href={route(ROUTES.WEB.ADMIN.USERS)} class="transition-colors hover:text-zinc-900 dark:hover:text-white">
        Pengguna
      </Link>
      <span>/</span>
      <span class="font-medium text-zinc-900 dark:text-white">Tambah Pengguna</span>
    </div>
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Tambah Pengguna</h1>
    <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">Buat akun admin baru yang dapat masuk ke panel.</p>
  </div>

  {#if flash?.error}
    <div class="mb-6 border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
      {flash.error}
    </div>
  {/if}

  <div class="card max-w-2xl p-6 sm:p-8">
    <form class="space-y-6" onsubmit={e => { e.preventDefault(); submit() }}>
      <div>
        <label for="create-name" class="label">Nama Lengkap</label>
        <TextInput
          id="create-name"
          bind:value={form.name}
          placeholder="Nama lengkap"
          error={form.errors.name}
          required
        />
      </div>

      <div>
        <label for="create-email" class="label">Alamat Email</label>
        <TextInput
          id="create-email"
          type="email"
          bind:value={form.email}
          placeholder="nama@perusahaan.id"
          error={form.errors.email}
          required
        />
      </div>

      <div>
        <label for="create-password" class="label">Kata Sandi</label>
        <PasswordInput
          id="create-password"
          bind:value={form.password}
          autocomplete="new-password"
          error={form.errors.password}
          required
        />
        <p class="hint">Minimal 8 karakter.</p>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Link href={route(ROUTES.WEB.ADMIN.USERS)}>
          <Button variant="secondary" type="button">Batal</Button>
        </Link>
        <Button type="submit" disabled={form.processing}>
          {form.processing ? 'Menyimpan…' : 'Simpan Pengguna'}
        </Button>
      </div>
    </form>
  </div>
</AdminLayout>
