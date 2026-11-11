<script module lang="ts">
  // Shared state across all Dropdown instances: hanya 1 dropdown yang boleh terbuka di seluruh halaman
  let activeCloseFn: (() => void) | null = null
</script>

<script lang="ts">
  import { onDestroy, type Snippet } from 'svelte'

  // Port dari js/app.js bagian 3 (dropdown generik + data-dropdown-float):
  // menu di-render portal ke <body> dengan position: fixed agar tidak
  // terpotong container overflow-x-auto / tertimpa sel tabel sticky.
  interface Props {
    /** aria-label tombol pemicu. */
    label: string
    /** Lebar panel, default w-56 (mengikuti template). */
    menuClass?: string
    /** Class tombol pemicu, default icon-btn (mengikuti template). */
    triggerClass?: string
    trigger: Snippet
    menu: Snippet
  }

  let { label, menuClass = 'w-56', triggerClass = 'icon-btn', trigger, menu }: Props = $props()

  let open = $state(false)
  let triggerEl: HTMLElement | undefined = $state()
  let menuEl: HTMLElement | undefined = $state()

  const GAP = 6
  const PAD = 8

  // Menu dipindahkan ke <body> agar lepas dari stacking context sel tabel.
  const portal = (node: HTMLElement) => {
    document.body.appendChild(node)
    return {
      destroy() {
        node.remove()
      },
    }
  }

  // Padanan positionFloatingMenu() template; bila tak muat di bawah, buka ke atas.
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

  // Posisi dihitung SETELAH menu ter-mount: menu dirender di dalam {#if open},
  // jadi saat toggle() berjalan `menuEl` belum ada — $effect ini menunggu
  // DOM flush (bug ditemukan lewat smoke test browser di Step 05).
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
    // Menu floating tidak mengikuti scroll/resize — tutup (paritas template).
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

<div class="relative inline-block">
  <button
    bind:this={triggerEl}
    type="button"
    class={triggerClass}
    aria-label={label}
    aria-haspopup="menu"
    aria-expanded={open}
    onclick={toggle}
  >
    {@render trigger()}
  </button>

  {#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      bind:this={menuEl}
      use:portal
      class="dropdown-panel {menuClass}"
      style="position: fixed; right: auto; margin-top: 0;"
      role="menu"
      tabindex="-1"
      onclick={() => close()}
    >
      {@render menu()}
    </div>
  {/if}
</div>
