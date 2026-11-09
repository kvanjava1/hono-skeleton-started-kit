<script lang="ts">
  import type { Snippet } from 'svelte'

  // Port dari js/app.js bagian 7 (modal generik) ke idiom Svelte:
  // buka/tutup via `bind:open`, Escape, klik latar, body scroll lock,
  // fokus awal ke [data-autofocus] (fallback elemen interaktif pertama),
  // dan focus-trap Tab sederhana.
  interface Props {
    open: boolean
    title: string
    description?: string
    children: Snippet
  }

  let { open = $bindable(false), title, description = '', children }: Props = $props()

  let panel: HTMLElement | undefined = $state()
  let lastFocused: HTMLElement | null = null

  $effect(() => {
    if (!open) return
    lastFocused = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const target =
      panel?.querySelector<HTMLElement>('[data-autofocus]') ??
      panel?.querySelector<HTMLElement>('input, select, textarea, button')
    target?.focus()

    return () => {
      document.body.style.overflow = ''
      lastFocused?.focus()
      lastFocused = null
    }
  })

  const onKeydown = (event: KeyboardEvent) => {
    if (!open) return
    if (event.key === 'Escape') {
      open = false
      return
    }
    if (event.key !== 'Tab' || !panel) return

    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    )
    if (focusables.length === 0) return

    const first = focusables[0]!
    const last = focusables[focusables.length - 1]!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-[60]"
    role="dialog"
    aria-modal="true"
    aria-label={title}
  >
    <div
      class="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
      aria-hidden="true"
      onclick={() => (open = false)}
    ></div>
    <div class="relative flex min-h-full items-center justify-center p-4">
      <div
        bind:this={panel}
        class="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <div class="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 class="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>
            {#if description}
              <p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
            {/if}
          </div>
          <button
            type="button"
            class="icon-btn shrink-0"
            aria-label="Tutup modal"
            onclick={() => (open = false)}
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-5">
          {@render children()}
        </div>
      </div>
    </div>
  </div>
{/if}
