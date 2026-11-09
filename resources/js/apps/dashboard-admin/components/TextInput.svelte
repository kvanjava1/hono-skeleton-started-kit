<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements'

  interface Props {
    value?: string
    type?: 'text' | 'email' | 'search' | 'password' | 'number'
    id?: string
    name?: string
    placeholder?: string
    autocomplete?: HTMLInputAttributes['autocomplete']
    required?: boolean
    disabled?: boolean
    /** Pesan error validasi — menampilkan .input-error + pesan di bawah input. */
    error?: string
    class?: string
  }

  let {
    value = $bindable(''),
    type = 'text',
    id,
    name,
    placeholder,
    autocomplete,
    required = false,
    disabled = false,
    error,
    class: cls = '',
  }: Props = $props()
</script>

<input
  bind:value
  {type}
  {id}
  {name}
  {placeholder}
  {autocomplete}
  {required}
  {disabled}
  aria-invalid={error ? 'true' : undefined}
  class="input {error ? 'input-error' : ''} {cls}"
/>
{#if error}
  <p class="mt-1.5 text-sm text-rose-600 dark:text-rose-400">{error}</p>
{/if}
