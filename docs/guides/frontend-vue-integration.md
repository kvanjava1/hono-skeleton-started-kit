# Frontend & Vue Integration Guide

Dokumentasi ini menjelaskan arsitektur Hybrid Fullstack yang menggabungkan **Hono JSX (SSR)** dengan **Vue.js 3 (SPA)**.

## 1. Konsep "The Bridge"

Kita menggunakan pola jembatan di mana Hono bertanggung jawab atas navigasi awal dan SEO, sementara Vue bertanggung jawab atas interaksi kompleks.

### Alur Kerja:
1. Browser meminta halaman (misal: `/welcome`).
2. Hono (Server) merender komponen JSX di `src/views/Welcome.tsx`.
3. Hono menyuntikkan data awal ke dalam `window.__INITIAL_STATE__`.
4. Browser memuat script Vue (`resources/js/app.ts`) yang disediakan oleh Vite.
5. Vue melakukan *hydration* ke elemen `<div id="app"></div>` dan membaca data awal.

## 2. Struktur Direktori UI

- `src/views/`: Rumah bagi komponen Hono JSX (SSR).
- `resources/js/`: Rumah bagi komponen Vue, Router, dan Logic Frontend.
- `resources/css/`: Pusat gaya menggunakan Tailwind CSS v4.

## 3. Tailwind CSS v4

Proyek ini menggunakan Tailwind CSS v4 yang terintegrasi langsung melalui `@tailwindcss/vite`.
- Tidak perlu file `tailwind.config.js`.
- Konfigurasi dilakukan langsung di dalam `resources/css/app.css` menggunakan variabel CSS.

## 4. Berbagi Data (Server to Client)

Untuk mengirim data dari Hono ke Vue tanpa API tambahan:

Di Hono Handler:
```tsx
const data = { user: 'Melode' };
return c.html(<Welcome initialData={data} />);
```

Di Komponen Vue:
```ts
const ssrData = window.__INITIAL_STATE__;
```

## 5. Navigasi & Fallback

Semua rute yang tidak dikenal oleh Hono secara otomatis akan dilemparkan ke "Shell SPA". Ini diatur dalam `src/middlewares/spaFallback.middleware.ts`. Hal ini memungkinkan fitur *refresh* pada rute Vue Router (seperti `/dashboard`) tetap bekerja dengan benar.
