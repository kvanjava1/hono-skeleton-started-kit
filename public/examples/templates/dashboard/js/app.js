/* ============================================================
   NusaAdmin — perilaku UI bersama
   Tema (light/dark), sidebar mobile, dropdown, toggle sandi.
   Vanilla JS, tanpa dependensi.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* ----------------------------------------------------------
   * 1. Tema — light / dark
   *    - Tersimpan di localStorage.theme
   *    - Menyebarkan event "themechange" (dipakai Chart.js, dll.)
   * -------------------------------------------------------- */
  function applyTheme(mode, persist) {
    var dark = mode === 'dark';
    root.classList.toggle('dark', dark);
    if (persist) localStorage.setItem('theme', mode);
    document.dispatchEvent(new CustomEvent('themechange', { detail: { dark: dark } }));
  }

  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyTheme(root.classList.contains('dark') ? 'light' : 'dark', true);
    });
  });

  /* ----------------------------------------------------------
   * 2. Sidebar — geser masuk/keluar di layar kecil
   * -------------------------------------------------------- */
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('-translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  }

  document.querySelectorAll('[data-sidebar-toggle]').forEach(function (btn) {
    btn.addEventListener('click', openSidebar);
  });
  document.querySelectorAll('[data-sidebar-close]').forEach(function (btn) {
    btn.addEventListener('click', closeSidebar);
  });
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  /* ----------------------------------------------------------
   * 3. Dropdown generik
   *    Struktur:
   *    <div data-dropdown>
   *      <button data-dropdown-trigger>…</button>
   *      <div data-dropdown-menu class="hidden">…</div>
   *    </div>
   *    Khusus menu di dalam container ber-overflow (mis. tabel),
   *    tambahkan data-dropdown-float agar diposisikan fixed dan
   *    tidak terpotong oleh overflow-x-auto.
   * -------------------------------------------------------- */
  function closeAllDropdowns() {
    document.querySelectorAll('[data-dropdown-menu]').forEach(function (menu) {
      menu.classList.add('hidden');
    });
    document.querySelectorAll('[data-dropdown-trigger]').forEach(function (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function positionFloatingMenu(trigger, menu) {
    var gap = 6;
    var pad = 8;
    var rect = trigger.getBoundingClientRect();

    menu.style.position = 'fixed';
    menu.style.right = 'auto';
    menu.style.marginTop = '0';
    menu.style.visibility = 'hidden';
    menu.style.left = '0px';
    menu.style.top = '0px';

    var width = menu.offsetWidth;
    var height = menu.offsetHeight;
    var left = Math.min(Math.max(pad, rect.right - width), window.innerWidth - width - pad);
    var top = rect.bottom + gap;

    // Bila tidak muat ke bawah, buka ke atas tombol.
    if (top + height > window.innerHeight - pad) {
      top = Math.max(pad, rect.top - height - gap);
    }

    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    menu.style.visibility = '';
  }

  document.querySelectorAll('[data-dropdown]').forEach(function (dd) {
    var trigger = dd.querySelector('[data-dropdown-trigger]');
    var menu = dd.querySelector('[data-dropdown-menu]');
    if (!trigger || !menu) return;

    // Menu floating dipindahkan ke <body>. Jika tetap di dalam <td> sticky,
    // menu terjebak di stacking context sel tabel dan tertimpa baris lain.
    if (menu.hasAttribute('data-dropdown-float')) {
      document.body.appendChild(menu);
    }

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = menu.classList.contains('hidden');
      closeAllDropdowns();
      if (willOpen) {
        menu.classList.remove('hidden');
        trigger.setAttribute('aria-expanded', 'true');
        if (menu.hasAttribute('data-dropdown-float')) {
          positionFloatingMenu(trigger, menu);
        }
      }
    });
  });

  document.addEventListener('click', closeAllDropdowns);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeSidebar();
    }
  });

  // Menu floating tidak bisa mengikuti trigger saat di-scroll, jadi tutup.
  ['scroll', 'resize'].forEach(function (eventName) {
    window.addEventListener(eventName, function () {
      document.querySelectorAll('[data-dropdown-float]:not(.hidden)').forEach(function (menu) {
        menu.classList.add('hidden');
      });
      document.querySelectorAll('[data-dropdown-trigger][aria-expanded="true"]').forEach(function (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
      });
    }, true);
  });

  /* ----------------------------------------------------------
   * 4. Toggle tampil/sembunyi kata sandi (halaman login)
   *    <button data-password-toggle="#password">
   *      <svg data-eye="show">  → tampil saat sandi tersembunyi
   *      <svg data-eye="hide">  → tampil saat sandi terlihat
   * -------------------------------------------------------- */
  document.querySelectorAll('[data-password-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.querySelector(btn.getAttribute('data-password-toggle'));
      if (!input) return;

      var masked = input.type === 'password';
      input.type = masked ? 'text' : 'password';
      var nowMasked = !masked;

      btn.querySelectorAll('[data-eye]').forEach(function (icon) {
        var wantHidden = (icon.dataset.eye === 'show') !== nowMasked;
        icon.classList.toggle('hidden', wantHidden);
      });
    });
  });
  /* ----------------------------------------------------------
   * 5. Submenu sidebar — buka/tutup menu dengan anak
   *    Struktur:
   *    <button data-submenu-toggle="#submenu-id">…</button>
   *    <ul id="submenu-id">…daftar anak…</ul>
   *    Chevron di dalam tombol diberi atribut data-submenu-chevron.
   * -------------------------------------------------------- */
  document.querySelectorAll('[data-submenu-toggle]').forEach(function (btn) {
    var panel = document.querySelector(btn.getAttribute('data-submenu-toggle'));
    if (!panel) return;

    btn.addEventListener('click', function () {
      var willOpen = panel.classList.contains('hidden');
      panel.classList.toggle('hidden', !willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
      var chevron = btn.querySelector('[data-submenu-chevron]');
      if (chevron) chevron.classList.toggle('rotate-180', willOpen);
    });
  });

  /* ----------------------------------------------------------
   * 6. Output nilai slider range
   *    <input type="range" data-range-output="#output-id">
   * -------------------------------------------------------- */
  document.querySelectorAll('input[type="range"][data-range-output]').forEach(function (input) {
    var out = document.querySelector(input.getAttribute('data-range-output'));
    if (!out) return;
    var update = function () { out.textContent = input.value + '%'; };
    input.addEventListener('input', update);
    update();
  });

  /* ----------------------------------------------------------
   * 7. Modal generik
   *    Pemicu: <button data-modal-open="#id-modal">…</button>
   *    Wadah:  <div id="id-modal" data-modal class="hidden">…
   *              <div data-modal-panel>…isi modal…</div>
   *            </div>
   *    Tutup:  [data-modal-close], klik latar, atau Escape.
   *    Form dengan data-modal-close-on-submit otomatis menutup
   *    modal setelah submit.
   * -------------------------------------------------------- */
  var lastFocused = null;

  function openModal(modal) {
    if (!modal || !modal.classList.contains('hidden')) return;
    lastFocused = document.activeElement;
    closeAllDropdowns();
    closeSidebar();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    var target = modal.querySelector('[data-modal-autofocus]') ||
      modal.querySelector('input, select, textarea, button, [href]');
    if (target) target.focus();
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    if (!document.querySelector('[data-modal]:not(.hidden)')) {
      document.body.style.overflow = '';
    }
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
      lastFocused = null;
    }
  }

  document.querySelectorAll('[data-modal-open]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(document.querySelector(btn.getAttribute('data-modal-open')));
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      closeModal(btn.closest('[data-modal]'));
    });
  });

  document.querySelectorAll('[data-modal]').forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      var panel = modal.querySelector('[data-modal-panel]');
      if (panel && !panel.contains(e.target)) closeModal(modal);
    });
  });

  document.querySelectorAll('[data-modal-close-on-submit]').forEach(function (form) {
    form.addEventListener('submit', function () {
      closeModal(form.closest('[data-modal]'));
    });
  });

  document.addEventListener('keydown', function (e) {
    var open = document.querySelector('[data-modal]:not(.hidden)');
    if (!open) return;

    if (e.key === 'Escape') {
      closeModal(open);
      return;
    }

    if (e.key !== 'Tab') return;

    var focusables = Array.prototype.slice.call(open.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusables.length) return;

    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();
