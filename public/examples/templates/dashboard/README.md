# NusaAdmin — Template Dashboard Admin (HTML + Tailwind CSS)

Template dashboard admin statis sebagai **dasar/contoh** untuk proyek
`hono-dashboard-admin-v1`. Tidak butuh build step — cukup buka `index.html`
di browser.

## Style: "Clean Modern SaaS"

| Aspek          | Keputusan desain                                                                 |
| -------------- | -------------------------------------------------------------------------------- |
| Layout         | Sidebar gelap permanen di kiri (`w-64`) + topbar sticky (`h-16`) dengan blur      |
| Warna primary  | Monokrom — aksi primer hitam (`zinc-950`) di light, putih (`zinc-100`) di dark    |
| Warna netral   | `zinc` — hitam `zinc-950`, abu tua `zinc-800/900`, abu muda `zinc-100/200`, putih |
| Warna semantik | `emerald`/`amber`/`rose`/`sky`/`violet` — untuk status, tren, dan visualisasi data, bukan dekorasi |
| Dark mode      | Dark-first (default gelap), toggle di topbar, tersimpan di `localStorage`. Sidebar selalu gelap di kedua mode |
| Tipografi      | Inter (Google Fonts), ukuran font besar (teks dasar 16px) agar mudah dibaca, angka memakai `tabular-nums` (class `.tnum`) |
| Bentuk         | Boxy — sudut tajam tanpa `border-radius`, border `slate-200`/`slate-800`, soft shadow (`shadow-card`) |
| Komponen       | Stat card, grafik Chart.js, tabel data, badge status, form, toggle, dropdown      |

## Struktur File

```
dashboard/
├── index.html      Dashboard — stat card, grafik pendapatan & trafik,
│                   tabel pesanan terbaru, feed aktivitas
├── pelanggan.html  Pelanggan — tabel data dengan pencarian via modal,
│                   filter status, aksi baris (dropdown 3 titik), dan
│                   paginasi
├── login.html      Halaman masuk — form email & kata sandi dengan
│                   toggle tampil/sembunyi + partikel interaktif
├── settings.html   Pengaturan — showcase semua komponen form umum
│                   (input, addon, select, radio, checkbox, switch,
│                   tanggal, range, file, state error & disabled)
├── settings-boxy.html  Varian pengaturan bergaya boxy — ringkasan
│                   metrik, sel form bergaris, navigasi bagian dengan
│                   scrollspy, dan panel samping
├── css/app.css     Scrollbar, transisi tema, helper kecil, grid tabel,
│                   perbaikan ikon date-picker & centang mode gelap
├── js/app.js       Tema, sidebar mobile, dropdown, submenu,
│                   toggle sandi, output slider range, modal
├── js/particles.js Partikel interaktif latar halaman login & dashboard
└── README.md       Dokumen ini
```

### Varian pengaturan

- `settings.html` — versi standar satu kolom; fokus pada showcase komponen form.
- `settings-boxy.html` — varian grid modular: ringkasan toko, sel form bergaris,
  navigasi bagian dengan scrollspy, serta panel samping. Halaman ini tertaut
  balik ke versi standar.

## Menjalankan

Buka `index.html` langsung di browser, atau jalankan server statis agar
rapi:

```bash
# dari folder plans/templates/dashboard
bunx serve .
# atau
python3 -m http.server 8080
```

## Dependensi (semuanya via CDN)

- **Tailwind CSS** — Play CDN `cdn.tailwindcss.com?plugins=forms`
- **Chart.js 4** — grafik garis & donat di `index.html`
- **Inter** — Google Fonts

## Kustomisasi

1. **Ganti skema warna** — template memakai skala netral `zinc` bawaan
   Tailwind (monokrom). Untuk menambah warna aksen, daftarkan objek
   `colors` baru di blok `tailwind.config` pada `<head>` (atau di config
   Tailwind CLI saat produksi), lalu ganti class `zinc-*` yang diinginkan.
2. **Ganti font** — ubah link Google Fonts + `fontFamily.sans` di config.
3. **Komponen ulang** — class `.card`, `.btn-*`, `.input`, `.badge`,
   `.nav-link`, dll. didefinisikan di `<style type="text/tailwindcss">`
   pada tiap halaman. Untuk produksi, pindahkan blok itu ke file CSS
   proyek Tailwind-mu.
4. **Tambah halaman baru** — salin `index.html` sebagai shell (sidebar +
   topbar), ganti isi `<main>`, lalu pindahkan class `nav-link-active`
   ke item menu halaman barunya.
5. **Tabel lebar di dalam grid** — selalu bungkus tabel dengan
   `div.relative.overflow-x-auto`, beri `min-w-0` pada kartu (grid item),
   dan pakai `grid-cols-1` eksplisit sebagai base grid. Tanpa tiga hal
   ini, `min-w-[…]` pada tabel bisa memaksa halaman melebar di layar
   kecil (horizontal scroll phantom). Garis grid vertikal/horizontal
   semua tabel diatur global di `css/app.css` (bagian "Grid tabel").
6. **Submenu (menu dengan anak)** — tombol induk memakai
   `data-submenu-toggle="#id-daftar"` (plus `aria-expanded` dan chevron
   `data-submenu-chevron`), daftar anaknya `<ul id="id-daftar">` dengan
   class `.nav-sublink`. Logika buka/tutup ada di `js/app.js` (bagian 5).
7. **Dropdown di dalam tabel** — menu aksi baris diberi atribut
   `data-dropdown-float`. `js/app.js` memindahkannya ke `<body>` dan
   memposisikannya dengan `position: fixed`, sehingga tidak terpotong
   oleh `overflow-x-auto` maupun tertimpa kolom aksi `sticky` di baris
   lain. Menu ditutup saat halaman di-scroll atau di-resize.
8. **Modal** — tombol pemicu memakai `data-modal-open="#id-modal"`,
   wadahnya `data-modal` (dengan `data-modal-panel` pada kotak dialog),
   dan penutupnya `data-modal-close`. Klik latar atau tombol Escape juga
   menutup modal. Form dengan `data-modal-close-on-submit` akan menutup
   modal otomatis setelah submit. Logika ada di `js/app.js` (bagian 7).

## Catatan Produksi

Play CDN hanya untuk prototipe/demo. Untuk produksi:

- Ganti ke **Tailwind CLI** (`bun add -D tailwindcss`) dengan content
  scan ke file HTML/templatenya.
- Grafik: pastikan Chart.js dirender ulang saat tema berubah — di
  template ini sudah ditangani lewat event `themechange` (lihat script
  di bagian bawah `index.html`).
