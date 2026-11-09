<script lang="ts">
  // Port pola paginasi pelanggan.html: tombol prev/next + jendela halaman
  // dengan ellipsis, plus teks "Menampilkan X–Y dari Z".
  interface Props {
    page: number
    lastPage: number
    total: number
    perPage: number
    label?: string
    onNavigate: (page: number) => void
  }

  let { page, lastPage, total, perPage, label = 'Paginasi', onNavigate }: Props = $props()

  type Item = number | '…'

  const items = $derived.by<Item[]>(() => {
    if (lastPage <= 1) return []
    if (lastPage <= 7) {
      return Array.from({ length: lastPage }, (_, i) => i + 1)
    }

    const result: Item[] = [1]
    const start = Math.max(2, page - 1)
    const end = Math.min(lastPage - 1, page + 1)
    if (start > 2) result.push('…')
    for (let p = start; p <= end; p++) result.push(p)
    if (end < lastPage - 1) result.push('…')
    result.push(lastPage)
    return result
  })

  const from = $derived(total === 0 ? 0 : (page - 1) * perPage + 1)
  const to = $derived(Math.min(total, page * perPage))

  const pageButton =
    'tnum inline-grid h-9 min-w-9 place-items-center border px-3 text-sm font-semibold transition-colors'
  const idle =
    'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
  const active =
    'border-zinc-950 bg-zinc-950 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
  const arrow =
    'inline-grid h-9 w-9 place-items-center border text-zinc-500 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
</script>

<div class="flex flex-col items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:flex-row">
  <p class="text-sm text-zinc-500 dark:text-zinc-400">
    Menampilkan <span class="tnum font-semibold text-zinc-900 dark:text-white">{from}–{to}</span>
    dari <span class="tnum font-semibold text-zinc-900 dark:text-white">{total}</span> data
  </p>
  <nav class="flex items-center gap-1" aria-label={label}>
    <button
      type="button"
      class="{arrow} border-zinc-200 dark:border-zinc-700"
      disabled={page <= 1}
      aria-label="Halaman sebelumnya"
      onclick={() => onNavigate(page - 1)}
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
    </button>

    {#each items as item, i (i)}
      {#if item === '…'}
        <span class="px-1 text-sm text-zinc-400 dark:text-zinc-500">…</span>
      {:else}
        <button
          type="button"
          class="{pageButton} {item === page ? active : idle}"
          aria-current={item === page ? 'page' : undefined}
          onclick={() => onNavigate(item)}
        >
          {item}
        </button>
      {/if}
    {/each}

    <button
      type="button"
      class="{arrow} border-zinc-200 dark:border-zinc-700"
      disabled={page >= lastPage}
      aria-label="Halaman berikutnya"
      onclick={() => onNavigate(page + 1)}
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
    </button>
  </nav>
</div>
