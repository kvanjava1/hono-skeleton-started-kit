<script lang="ts">
  import { Link, router, useForm } from '@inertiajs/svelte'
  import { ROUTES, route } from '../../../../../lib/routes.ts'
  import AdminLayout from '../../../components/AdminLayout.svelte'
  import Button from '../../../components/Button.svelte'
  import Badge from '../../../components/Badge.svelte'
  import TextInput from '../../../components/TextInput.svelte'
  import PasswordInput from '../../../components/PasswordInput.svelte'
  import Modal from '../../../components/Modal.svelte'
  import Dropdown from '../../../components/Dropdown.svelte'
  import Pagination from '../../../components/Pagination.svelte'
  import SearchModal from '../../../components/SearchModal.svelte'

  interface UserView {
    id: number
    name: string
    email: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }

  interface Props {
    appName?: string
    users?: UserView[]
    q?: string
    status?: string
    page?: number
    perPage?: number
    total?: number
    lastPage?: number
    authUserId?: number
    authUser?: { name: string; email: string } | null
    flash?: { success?: string; error?: string; errors?: Record<string, string> }
    errors?: Record<string, string>
  }

  let {
    appName = '',
    users = [],
    q = '',
    status = '',
    page = 1,
    perPage = 10,
    total = 0,
    lastPage = 1,
    authUserId = 0,
    authUser = null,
    flash = {},
    errors = {},
  }: Props = $props()

  // Modal pencarian — isi form disinkronkan dari filter aktif (paritas
  // template: buka ulang modal mengembalikan filter yang sedang berjalan).
  let searchOpen = $state(false)
  let searchQ = $state('')
  let searchStatus = $state('')
  $effect(() => {
    searchQ = q
    searchStatus = status
  })

  const statusOptions = [
    { value: '', label: 'Semua status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
  ]

  const applySearch = ({ q: nextQ, status: nextStatus }: { q: string; status: string }) =>
    router.get(
      route(ROUTES.WEB.ADMIN.USERS),
      { q: nextQ || undefined, status: nextStatus || undefined, page: 1 },
      { preserveScroll: true },
    )

  const navigate = (nextPage: number) =>
    router.get(
      route(ROUTES.WEB.ADMIN.USERS),
      { q: q || undefined, status: status || undefined, page: nextPage },
      { preserveScroll: true },
    )

  // Form create (modal) — validasi 422 mengisi error bag otomatis.
  const createForm = useForm({ name: '', email: '', password: '' })
  let createOpen = $state(false)

  const openCreate = () => {
    createForm.reset()
    createOpen = true
  }

  const submitCreate = () =>
    createForm.post(route(ROUTES.WEB.ADMIN.USERS_CREATE), {
      onSuccess: () => {
        createOpen = false
        createForm.reset()
      },
    })

  // Form edit (modal) — password kosong berarti "pertahankan sandi lama".
  const editForm = useForm({ name: '', email: '', password: '' })
  let editOpen = $state(false)
  let editing: UserView | null = $state(null)

  const openEdit = (user: UserView) => {
    editing = user
    editForm.reset()
    editForm.name = user.name
    editForm.email = user.email
    editOpen = true
  }

  const submitEdit = () =>
    editForm
      .transform((data) => ({
        name: data.name,
        email: data.email,
        ...(data.password ? { password: data.password } : {}),
      }))
      .put(route(ROUTES.WEB.ADMIN.USERS_UPDATE, { id: editing!.id }), {
        onSuccess: () => {
          editOpen = false
          editing = null
          editForm.reset()
        },
      })

  // Error bag dari alur redirect-back (error level service) mengisi form
  // yang sedang terbuka.
  $effect(() => {
    if (Object.keys(errors).length === 0) return
    if (createOpen) createForm.setError(errors)
    else if (editOpen) editForm.setError(errors)
  })

  const toggleActive = (user: UserView) =>
    router.post(
      route(ROUTES.WEB.ADMIN.USERS_TOGGLE, { id: user.id }),
      {},
      { preserveScroll: true },
    )

  const destroy = (user: UserView) => {
    if (!confirm(`Hapus pengguna "${user.name}"?`)) return
    router.delete(route(ROUTES.WEB.ADMIN.USERS_DELETE, { id: user.id }), {
      preserveScroll: true,
    })
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]!.toUpperCase())
      .join('')

  const formatDate = (value: string) =>
    new Date(value.replace(' ', 'T') + 'Z').toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const isSelf = (user: UserView) => user.id === authUserId
</script>

<svelte:head>
  <title>Pengguna — {appName}</title>
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

  <div>
    <h1 class="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Pengguna</h1>
    <p class="mt-1 text-base text-zinc-500 dark:text-zinc-400">Kelola akun admin yang dapat masuk ke panel.</p>
  </div>

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

  <section class="card mt-6 min-w-0">
    <!-- Toolbar: pencarian via modal + tambah pengguna -->
    <div class="flex flex-col gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <Button variant="secondary" onclick={() => (searchOpen = true)}>
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        Cari Pengguna
      </Button>

      <Button onclick={openCreate}>
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
        Tambah Pengguna
      </Button>
    </div>

    <!-- Tabel pengguna -->
    <div class="relative overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-800">
          <tr>
            <th class="th">Pengguna</th>
            <th class="th hidden sm:table-cell">Status</th>
            <th class="th hidden md:table-cell">Dibuat</th>
            <th class="th sticky right-0 border-l border-zinc-200 bg-zinc-50 text-right dark:border-zinc-800 dark:bg-zinc-800">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          {#each users as user (user.id)}
            <tr class="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
              <td class="td">
                <div class="flex items-center gap-2.5">
                  <span class="grid h-10 w-10 shrink-0 place-items-center bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{initials(user.name)}</span>
                  <div class="min-w-0">
                    <p class="truncate font-medium text-zinc-900 dark:text-white">{user.name}</p>
                    <p class="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
                  </div>
                </div>
              </td>
              <td class="td hidden sm:table-cell">
                {#if user.isActive}
                  <Badge tone="emerald">Aktif</Badge>
                {:else}
                  <Badge tone="zinc">Nonaktif</Badge>
                {/if}
              </td>
              <td class="td tnum hidden whitespace-nowrap text-zinc-500 dark:text-zinc-400 md:table-cell">{formatDate(user.createdAt)}</td>
              <td class="td sticky right-0 border-l border-zinc-100 bg-white text-right group-hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40">
                <Dropdown label="Aksi untuk {user.name}">
                  {#snippet trigger()}
                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" /></svg>
                  {/snippet}
                  {#snippet menu()}
                    <button type="button" class="dropdown-item w-full" onclick={() => openEdit(user)}>
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      Edit Pengguna
                    </button>
                    {#if !isSelf(user)}
                      <button type="button" class="dropdown-item w-full" onclick={() => toggleActive(user)}>
                        {#if user.isActive}
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          Nonaktifkan
                        {:else}
                          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Aktifkan
                        {/if}
                      </button>
                      <div class="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800"></div>
                      <button type="button" class="dropdown-item w-full !text-rose-600 dark:!text-rose-400" onclick={() => destroy(user)}>
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        Hapus Pengguna
                      </button>
                    {/if}
                  {/snippet}
                </Dropdown>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="4" class="px-6 py-16 text-center">
                <span class="mx-auto grid h-12 w-12 place-items-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                </span>
                <p class="mt-3 text-base font-semibold text-zinc-900 dark:text-white">Pengguna tidak ditemukan</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Coba kata kunci atau filter status lain.</p>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <Pagination {page} {lastPage} {total} {perPage} label="Paginasi pengguna" onNavigate={navigate} />
  </section>
</AdminLayout>

<!-- Modal cari pengguna (q + filter status) -->
<SearchModal
  bind:open={searchOpen}
  bind:q={searchQ}
  bind:status={searchStatus}
  {statusOptions}
  title="Cari Pengguna"
  description="Cari berdasarkan nama atau email."
  searchLabel="Kata Kunci"
  searchPlaceholder="Nama atau email…"
  statusLabel="Status Pengguna"
  onApply={applySearch}
/>

<!-- Modal tambah pengguna -->
<Modal bind:open={createOpen} title="Tambah Pengguna" description="Buat akun admin baru yang dapat masuk ke panel.">
  <form class="space-y-5" onsubmit={e => { e.preventDefault(); submitCreate() }}>
    <div>
      <label class="label" for="create-name">Nama</label>
      <TextInput id="create-name" bind:value={createForm.name} placeholder="Nama lengkap" error={createForm.errors.name} required />
    </div>
    <div>
      <label class="label" for="create-email">Email</label>
      <TextInput id="create-email" type="email" bind:value={createForm.email} autocomplete="off" placeholder="nama@perusahaan.id" error={createForm.errors.email} required />
    </div>
    <div>
      <label class="label" for="create-password">Sandi</label>
      <PasswordInput id="create-password" bind:value={createForm.password} autocomplete="new-password" error={createForm.errors.password} required />
      <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Minimal 8 karakter.</p>
    </div>
    <div class="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:justify-end">
      <Button variant="secondary" class="w-full sm:w-auto" onclick={() => (createOpen = false)}>Batal</Button>
      <Button type="submit" class="w-full sm:w-auto" disabled={createForm.processing}>
        {createForm.processing ? 'Menyimpan…' : 'Simpan'}
      </Button>
    </div>
  </form>
</Modal>

<!-- Modal edit pengguna -->
<Modal bind:open={editOpen} title="Edit Pengguna" description="Perbarui data akun. Biarkan sandi kosong untuk mempertahankan sandi lama.">
  <form class="space-y-5" onsubmit={e => { e.preventDefault(); submitEdit() }}>
    <div>
      <label class="label" for="edit-name">Nama</label>
      <TextInput id="edit-name" bind:value={editForm.name} error={editForm.errors.name} required />
    </div>
    <div>
      <label class="label" for="edit-email">Email</label>
      <TextInput id="edit-email" type="email" bind:value={editForm.email} autocomplete="off" error={editForm.errors.email} required />
    </div>
    <div>
      <label class="label" for="edit-password">Sandi Baru (opsional)</label>
      <PasswordInput id="edit-password" bind:value={editForm.password} autocomplete="new-password" error={editForm.errors.password} />
    </div>
    <div class="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:justify-end">
      <Button variant="secondary" class="w-full sm:w-auto" onclick={() => (editOpen = false)}>Batal</Button>
      <Button type="submit" class="w-full sm:w-auto" disabled={editForm.processing}>
        {editForm.processing ? 'Menyimpan…' : 'Simpan'}
      </Button>
    </div>
  </form>
</Modal>
