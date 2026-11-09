<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    value?: string
    id?: string
    name?: string
    disabled?: boolean
    error?: string
    class?: string
    /** Elemen <option> milik pemanggil. */
    children: Snippet
  }

  let {
    value = $bindable(''),
    id,
    name,
    disabled = false,
    error,
    class: cls = '',
    children,
  }: Props = $props()
</script>

<select
  bind:value
  {id}
  {name}
  {disabled}
  aria-invalid={error ? 'true' : undefined}
  class="input {error ? 'input-error' : ''} {cls}"
>
  {@render children()}
</select>
{#if error}
  <p class="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{error}</p>
{/if}
