<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    variant?: 'primary' | 'secondary' | 'danger'
    size?: 'md' | 'sm'
    type?: 'button' | 'submit'
    disabled?: boolean
    title?: string
    class?: string
    onclick?: (event: MouseEvent) => void
    children: Snippet
  }

  let {
    variant = 'primary',
    size = 'md',
    type = 'button',
    disabled = false,
    title,
    class: cls = '',
    onclick,
    children,
  }: Props = $props()
</script>

<button
  {type}
  {disabled}
  {title}
  {onclick}
  class="btn btn-{variant} {size === 'sm' ? 'px-3 py-2 text-sm' : ''} {cls}"
>
  {@render children()}
</button>
