<script lang="ts">
  // Port 1:1 dari public/examples/templates/dashboard/js/particles.js
  // (sumber read-only). Titik melayang pelan, menghindar dari kursor,
  // terhubung garis tipis, dan mengeluarkan riak saat diklik/disentuh.
  // Dioptimasi: batched canvas pathing, squared-distance checks, dan jumlah partikel proporsional.
  const ENABLED = true

  let canvas: HTMLCanvasElement | undefined = $state()

  interface Dot {
    x: number
    y: number
    vx: number
    vy: number
    ix: number
    iy: number
    r: number
  }

  interface Ripple {
    x: number
    y: number
    r: number
    alpha: number
  }

  $effect(() => {
    if (!ENABLED) return
    const el = canvas
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const ctx = el.getContext('2d')
    if (!ctx) return

    let dots: Dot[] = []
    const ripples: Ripple[] = []
    const pointer = { x: -9999, y: -9999, active: false }
    let raf: number | null = null

    const LINK_DIST = 100
    const LINK_DIST_SQ = LINK_DIST * LINK_DIST
    const POINTER_DIST = 130
    const POINTER_DIST_SQ = POINTER_DIST * POINTER_DIST
    const REPEL_RADIUS = 100
    const REPEL_RADIUS_SQ = REPEL_RADIUS * REPEL_RADIUS
    const REPEL_FORCE = 0.5

    const isDark = () => document.documentElement.classList.contains('dark')
    let color = isDark() ? '244,244,245' : '24,24,27' // zinc-100 / zinc-950

    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ dark?: boolean }>).detail
      color = detail?.dark ? '244,244,245' : '24,24,27'
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      el.width = window.innerWidth * dpr
      el.height = window.innerHeight * dpr
      el.style.width = `${window.innerWidth}px`
      el.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    const seed = () => {
      const area = window.innerWidth * window.innerHeight
      const count = Math.min(50, Math.max(25, Math.round(area / 32000)))
      dots = []
      for (let i = 0; i < count; i++) {
        dots.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          ix: 0,
          iy: 0,
          r: 1 + Math.random() * 1.5,
        })
      }
    }

    const setPointer = (x: number, y: number) => {
      pointer.x = x
      pointer.y = y
      pointer.active = true
    }
    const clearPointer = () => {
      pointer.active = false
      pointer.x = -9999
      pointer.y = -9999
    }

    const burst = (x: number, y: number) => {
      ripples.push({ x, y, r: 0, alpha: 0.5 })
      for (const dot of dots) {
        const dx = dot.x - x
        const dy = dot.y - y
        const distSq = dx * dx + dy * dy
        if (distSq < 22500) { // 150 * 150
          const dist = Math.sqrt(distSq) || 1
          const force = ((150 - dist) / 150) * 3
          dot.ix += (dx / dist) * force
          dot.iy += (dy / dist) * force
        }
      }
    }

    const onMouseMove = (event: MouseEvent) => setPointer(event.clientX, event.clientY)
    const onClick = (event: MouseEvent) => burst(event.clientX, event.clientY)
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) setPointer(touch.clientX, touch.clientY)
    }
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (touch) burst(touch.clientX, touch.clientY)
    }

    const step = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      for (const dot of dots) {
        if (pointer.active) {
          const dx = dot.x - pointer.x
          const dy = dot.y - pointer.y
          const distSq = dx * dx + dy * dy
          if (distSq < REPEL_RADIUS_SQ) {
            const dist = Math.sqrt(distSq) || 1
            const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE
            dot.ix += (dx / dist) * force
            dot.iy += (dy / dist) * force
          }
        }
        dot.ix *= 0.92
        dot.iy *= 0.92
        dot.x += dot.vx + dot.ix
        dot.y += dot.vy + dot.iy

        if (dot.x < 0) { dot.x = 0; dot.vx *= -1 }
        if (dot.x > w) { dot.x = w; dot.vx *= -1 }
        if (dot.y < 0) { dot.y = 0; dot.vy *= -1 }
        if (dot.y > h) { dot.y = h; dot.vy *= -1 }
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i]!
        ripple.r += 3
        ripple.alpha *= 0.94
        if (ripple.alpha < 0.02) ripples.splice(i, 1)
      }
    }

    const draw = () => {
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1

      // Garis antar titik berdekatan
      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]!
        for (let j = i + 1; j < dots.length; j++) {
          const other = dots[j]!
          const dx = dot.x - other.x
          const dy = dot.y - other.y
          const distSq = dx * dx + dy * dy
          if (distSq < LINK_DIST_SQ) {
            const dist = Math.sqrt(distSq)
            const alpha = (1 - dist / LINK_DIST) * 0.14
            ctx.strokeStyle = `rgba(${color},${alpha.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(dot.x, dot.y)
            ctx.lineTo(other.x, other.y)
            ctx.stroke()
          }
        }
      }

      // Garis kursor → titik terdekat
      if (pointer.active) {
        for (const dot of dots) {
          const dx = dot.x - pointer.x
          const dy = dot.y - pointer.y
          const distSq = dx * dx + dy * dy
          if (distSq < POINTER_DIST_SQ) {
            const dist = Math.sqrt(distSq)
            const alpha = (1 - dist / POINTER_DIST) * 0.35
            ctx.strokeStyle = `rgba(${color},${alpha.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(pointer.x, pointer.y)
            ctx.lineTo(dot.x, dot.y)
            ctx.stroke()
          }
        }
      }

      // Batch render titik (single beginPath + fill)
      ctx.fillStyle = `rgba(${color},0.35)`
      ctx.beginPath()
      for (const dot of dots) {
        ctx.moveTo(dot.x + dot.r, dot.y)
        ctx.arc(dot.x, dot.y, dot.r, 0, 6.2832)
      }
      ctx.fill()

      // Riak klik/sentuhan
      if (ripples.length > 0) {
        ctx.lineWidth = 1.5
        for (const ripple of ripples) {
          ctx.strokeStyle = `rgba(${color},${ripple.alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.arc(ripple.x, ripple.y, ripple.r, 0, 6.2832)
          ctx.stroke()
        }
      }
    }

    const loop = () => {
      step()
      draw()
      raf = window.requestAnimationFrame(loop)
    }

    // Hemat baterai: berhenti saat tab tidak terlihat
    const onVisibility = () => {
      if (document.hidden) {
        if (raf) { window.cancelAnimationFrame(raf); raf = null }
      } else if (!raf) {
        raf = window.requestAnimationFrame(loop)
      }
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', clearPointer)
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', clearPointer)
    window.addEventListener('touchcancel', clearPointer)
    window.addEventListener('click', onClick)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('themechange', onThemeChange)

    resize()
    raf = window.requestAnimationFrame(loop)

    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', clearPointer)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', clearPointer)
      window.removeEventListener('touchcancel', clearPointer)
      window.removeEventListener('click', onClick)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('themechange', onThemeChange)
    }
  })
</script>

{#if ENABLED}
  <canvas bind:this={canvas} class="pointer-events-none fixed inset-0" aria-hidden="true"></canvas>
{/if}
