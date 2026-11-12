<script module lang="ts">
  // Shared state: at most one dropdown open at any time
  let activeCloseFn: (() => void) | null = null
</script>

<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte'

  interface Props {
    /** Accessible label for trigger button */
    label: string
    /** Custom width or styling for dropdown panel */
    menuClass?: string
    /** Custom trigger button styling */
    triggerClass?: string
    /** Optional trigger snippet; defaults to three dots icon */
    trigger?: Snippet
    /** Menu content snippet */
    menu: Snippet
  }

  let {
    label,
    menuClass = 'w-48',
    triggerClass = 'icon-btn border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700',
    trigger,
    menu,
  }: Props = $props()

  let open = $state(false)
  let triggerEl: HTMLElement | undefined = $state()
  let menuEl: HTMLElement | undefined = $state()

  const GAP = 6
  const PAD = 8

  // Portals menu to <body> to avoid clipping by table overflow-x-auto
  const portal = (node: HTMLElement) => {
    document.body.appendChild(node)
    return {
      destroy() {
        node.remove()
      },
    }
  }

  const positionFloat = () => {
    const el = menuEl
    const trg = triggerEl
    if (!el || !trg) return

    el.style.visibility = 'hidden'
    el.style.left = '0px'
    el.style.top = '0px'

    const rect = trg.getBoundingClientRect()
    const width = el.offsetWidth
    const height = el.offsetHeight

    let left = Math.min(Math.max(PAD, rect.right - width), window.innerWidth - width - PAD)
    let top = rect.bottom + GAP
    if (top + height > window.innerHeight - PAD) {
      top = Math.max(PAD, rect.top - height - GAP)
    }

    el.style.left = `${left}px`
    el.style.top = `${top}px`
    el.style.visibility = ''
  }

  const close = () => {
    if (activeCloseFn === close) {
      activeCloseFn = null
    }
    open = false
  }

  const toggle = (event: MouseEvent) => {
    event.stopPropagation()
    if (!open) {
      if (activeCloseFn && activeCloseFn !== close) {
        activeCloseFn()
      }
      activeCloseFn = close
      open = true
    } else {
      close()
    }
  }

  onDestroy(() => {
    if (activeCloseFn === close) {
      activeCloseFn = null
    }
  })

  $effect(() => {
    if (open && menuEl) positionFloat()
  })

  $effect(() => {
    if (!open) return

    const onClick = (e: MouseEvent) => {
      if (triggerEl?.contains(e.target as Node)) return
      close()
    }
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onViewportChange = () => close()

    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeydown)
    window.addEventListener('scroll', onViewportChange, true)
    window.addEventListener('resize', onViewportChange)

    return () => {
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKeydown)
      window.removeEventListener('scroll', onViewportChange, true)
      window.removeEventListener('resize', onViewportChange)
    }
  })
</script>

<div class="relative inline-block text-left">
  <button
    bind:this={triggerEl}
    type="button"
    class="{triggerClass} rounded-none transition-colors"
    aria-label={label}
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={toggle}
  >
    {#if trigger}
      {@render trigger()}
    {:else}
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
        />
      </svg>
    {/if}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      bind:this={menuEl}
      use:portal
      class="dropdown-panel {menuClass} rounded-none border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
      style="position: fixed; right: auto; margin-top: 0; z-index: 9999;"
      role="menu"
      tabindex="-1"
      onclick={() => close()}
    >
      {@render menu()}
    </div>
  {/if}
</div>
