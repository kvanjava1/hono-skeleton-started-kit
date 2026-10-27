/* ============================================================
   NusaAdmin — partikel interaktif halaman login
   Titik-titik melayang pelan; menghindar dari kursor/sentuhan,
   terhubung garis tipis, dan mengeluarkan riak lembut saat
   layar diklik/disentuh. Monokrom, mengikuti tema lewat event
   "themechange". Tanpa dependensi, di-hentikan saat tab tersembunyi,
   dan dilewati bila pengguna meminta reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('particles');
  if (!canvas || !canvas.getContext) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx = canvas.getContext('2d');
  var dots = [];
  var ripples = [];
  var pointer = { x: -9999, y: -9999, active: false };
  var raf = null;

  var LINK_DIST = 110;    // jarak maksimum garis antar titik
  var POINTER_DIST = 150; // jarak garis kursor → titik
  var REPEL_RADIUS = 120; // radius dorongan kursor
  var REPEL_FORCE = 0.55;

  var dark = document.documentElement.classList.contains('dark');
  var color = dark ? '244,244,245' : '24,24,27'; // zinc-100 / zinc-950

  document.addEventListener('themechange', function (e) {
    color = e.detail && e.detail.dark ? '244,244,245' : '24,24,27';
  });

  /* --- Ukuran kanvas (perhatikan devicePixelRatio) --- */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    var area = window.innerWidth * window.innerHeight;
    var count = Math.min(110, Math.max(40, Math.round(area / 12000)));
    dots = [];
    for (var i = 0; i < count; i++) {
      dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35, // arah dasar
        vy: (Math.random() - 0.5) * 0.35,
        ix: 0, iy: 0,                     // impuls (dari kursor/klik), meluruh
        r: 1 + Math.random() * 1.6,
      });
    }
  }

  /* --- Input: gerak mouse & sentuhan --- */
  function setPointer(x, y) {
    pointer.x = x; pointer.y = y; pointer.active = true;
  }
  function clearPointer() {
    pointer.active = false; pointer.x = -9999; pointer.y = -9999;
  }
  window.addEventListener('mousemove', function (e) { setPointer(e.clientX, e.clientY); });
  window.addEventListener('mouseleave', clearPointer);
  window.addEventListener('touchmove', function (e) {
    var t = e.touches[0];
    if (t) setPointer(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('touchend', clearPointer);
  window.addEventListener('touchcancel', clearPointer);

  /* --- Klik/sentuhan: riak + dorongan keluar --- */
  function burst(x, y) {
    ripples.push({ x: x, y: y, r: 0, alpha: 0.5 });
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var dx = d.x - x, dy = d.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < 160) {
        var f = ((160 - dist) / 160) * 3.2;
        d.ix += (dx / dist) * f;
        d.iy += (dy / dist) * f;
      }
    }
  }
  window.addEventListener('click', function (e) { burst(e.clientX, e.clientY); });
  window.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    if (t) burst(t.clientX, t.clientY);
  }, { passive: true });

  /* --- Simulasi --- */
  function step() {
    var w = window.innerWidth, h = window.innerHeight;
    var i, d, dx, dy, dist, f;

    for (i = 0; i < dots.length; i++) {
      d = dots[i];
      if (pointer.active) {
        dx = d.x - pointer.x; dy = d.y - pointer.y;
        dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < REPEL_RADIUS) {
          f = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
          d.ix += (dx / dist) * f;
          d.iy += (dy / dist) * f;
        }
      }
      d.ix *= 0.92; d.iy *= 0.92;
      d.x += d.vx + d.ix;
      d.y += d.vy + d.iy;

      if (d.x < 0) { d.x = 0; d.vx *= -1; }
      if (d.x > w) { d.x = w; d.vx *= -1; }
      if (d.y < 0) { d.y = 0; d.vy *= -1; }
      if (d.y > h) { d.y = h; d.vy *= -1; }
    }

    for (i = ripples.length - 1; i >= 0; i--) {
      ripples[i].r += 3;
      ripples[i].alpha *= 0.94;
      if (ripples[i].alpha < 0.02) ripples.splice(i, 1);
    }
  }

  /* --- Gambar --- */
  function draw() {
    var w = window.innerWidth, h = window.innerHeight;
    var i, j, d, dx, dy, dist, a;

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;

    // Garis antar titik yang berdekatan
    for (i = 0; i < dots.length; i++) {
      d = dots[i];
      for (j = i + 1; j < dots.length; j++) {
        dx = d.x - dots[j].x; dy = d.y - dots[j].y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          a = (1 - dist / LINK_DIST) * 0.14;
          ctx.strokeStyle = 'rgba(' + color + ',' + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.stroke();
        }
      }
    }

    // Garis kursor → titik terdekat (kesan "merespons")
    if (pointer.active) {
      for (i = 0; i < dots.length; i++) {
        d = dots[i];
        dx = d.x - pointer.x; dy = d.y - pointer.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < POINTER_DIST) {
          a = (1 - dist / POINTER_DIST) * 0.35;
          ctx.strokeStyle = 'rgba(' + color + ',' + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(d.x, d.y);
          ctx.stroke();
        }
      }
    }

    // Titik
    ctx.fillStyle = 'rgba(' + color + ',0.35)';
    for (i = 0; i < dots.length; i++) {
      d = dots[i];
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 6.2832);
      ctx.fill();
    }

    // Riak klik/sentuhan
    ctx.lineWidth = 1.5;
    for (i = 0; i < ripples.length; i++) {
      ctx.strokeStyle = 'rgba(' + color + ',' + ripples[i].alpha.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(ripples[i].x, ripples[i].y, ripples[i].r, 0, 6.2832);
      ctx.stroke();
    }
  }

  function loop() {
    step();
    draw();
    raf = window.requestAnimationFrame(loop);
  }

  // Hemat baterai: berhenti saat tab tidak terlihat
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    } else if (!raf) {
      raf = window.requestAnimationFrame(loop);
    }
  });

  window.addEventListener('resize', resize);
  resize();
  raf = window.requestAnimationFrame(loop);
})();
