<script lang="ts">
  import type { Snippet } from 'svelte'

  // Palet tone mengikuti pola badge di pelanggan.html:
  // `bg-<warna>-50 text-<warna>-700 dark:bg-<warna>-500/10 dark:text-<warna>-400`
  // (zinc memakai versi nonaktif: bg-zinc-100 / dark:bg-zinc-800).
  const TONES = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  } as const

  interface Props {
    tone?: keyof typeof TONES
    class?: string
    children: Snippet
  }

  let { tone = 'zinc', class: cls = '', children }: Props = $props()
</script>

<span class="badge {TONES[tone]} {cls}">{@render children()}</span>
