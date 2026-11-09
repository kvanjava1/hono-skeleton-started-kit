<script lang="ts">
  // Port dari js/app.js bagian 1 (template NusaAdmin): localStorage.theme +
  // event dokumen "themechange". Dark-first diinisialisasi oleh script
  // pre-paint di root template (ditambahkan di Step 03).
  const apply = (mode: 'light' | 'dark', persist: boolean) => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    if (persist) localStorage.setItem('theme', mode)
    document.dispatchEvent(
      new CustomEvent('themechange', { detail: { dark: mode === 'dark' } }),
    )
  }

  const toggle = () =>
    apply(
      document.documentElement.classList.contains('dark') ? 'light' : 'dark',
      true,
    )
</script>

<button type="button" class="icon-btn" aria-label="Ganti tema" title="Ganti tema" onclick={toggle}>
  <svg class="h-6 w-6 dark:hidden" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.636-1.591 1.591M21 12h-2.25m-.636 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
  <svg class="hidden h-6 w-6 dark:block" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
</button>
