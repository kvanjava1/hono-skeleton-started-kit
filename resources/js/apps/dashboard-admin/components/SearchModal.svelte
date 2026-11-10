<script lang="ts">
  import Modal from './Modal.svelte'
  import TextInput from './TextInput.svelte'
  import SelectInput from './SelectInput.svelte'
  import type { Snippet } from 'svelte'

  // Port pola "modal cari pelanggan" di pelanggan.html: form pencarian +
  // filter status di dalam modal; submit memanggil onApply lalu menutup.
  interface StatusOption {
    value: string
    label: string
  }

  interface Props {
    open: boolean
    q: string
    status: string
    statusOptions?: StatusOption[]
    title?: string
    description?: string
    searchLabel?: string
    searchPlaceholder?: string
    statusLabel?: string
    onApply: (query: { q: string; status: string }) => void
    children?: Snippet
  }

  let {
    open = $bindable(false),
    q = $bindable(''),
    status = $bindable(''),
    statusOptions = [],
    title = 'Search',
    description = '',
    searchLabel = 'Keywords',
    searchPlaceholder = 'Search…',
    statusLabel = 'Status',
    onApply,
    children,
  }: Props = $props()

  const apply = (event: SubmitEvent) => {
    event.preventDefault()
    onApply({ q: q.trim(), status })
    open = false
  }
</script>

<Modal bind:open {title} {description}>
  <form class="space-y-5" onsubmit={apply}>
    <div>
      <label class="label" for="search-modal-q">{searchLabel}</label>
      <div class="relative">
        <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <TextInput
          id="search-modal-q"
          type="search"
          bind:value={q}
          placeholder={searchPlaceholder}
          autocomplete="off"
          class="!pl-10"
        />
      </div>
      <p class="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Leave blank to display all results.</p>
    </div>

    {#if statusOptions.length > 0}
      <div>
        <label class="label" for="search-modal-status">{statusLabel}</label>
        <SelectInput id="search-modal-status" bind:value={status}>
          {#each statusOptions as option (option.value)}
            <option value={option.value}>{option.label}</option>
          {/each}
        </SelectInput>
      </div>
    {/if}

    {#if children}
      {@render children()}
    {/if}

    <div class="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:justify-end">
      <button type="button" class="btn btn-secondary w-full sm:w-auto" onclick={() => (open = false)}>
        Cancel
      </button>
      <button type="submit" class="btn btn-primary w-full sm:w-auto">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        Search
      </button>
    </div>
  </form>
</Modal>
