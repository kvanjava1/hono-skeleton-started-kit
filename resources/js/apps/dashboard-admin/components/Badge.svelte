<script lang="ts">
  import type { Snippet } from 'svelte'

  // Palet tone mengikuti pola badge di seluruh dashboard admin:
  // Emerald untuk ACTIVE/Aktif, Rose untuk SUSPENDED/REVOKED, Amber untuk PENDING, Zinc untuk INACTIVE.
  const TONES = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    zinc: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  } as const

  export type BadgeTone = keyof typeof TONES

  const STATUS_MAP: Record<string, BadgeTone> = {
    ACTIVE: 'emerald',
    active: 'emerald',
    SUSPENDED: 'rose',
    suspended: 'rose',
    REVOKED: 'rose',
    revoked: 'rose',
    PENDING: 'amber',
    pending: 'amber',
    INACTIVE: 'zinc',
    inactive: 'zinc',
  }

  interface Props {
    tone?: BadgeTone
    variant?: BadgeTone
    status?: string
    class?: string
    children: Snippet
  }

  let { tone, variant, status, class: cls = '', children }: Props = $props()

  const resolvedTone = $derived<BadgeTone>(
    tone ?? variant ?? (status ? (STATUS_MAP[status] ?? 'zinc') : 'zinc')
  )
</script>

<span class="badge {TONES[resolvedTone]} {cls}">{@render children()}</span>
