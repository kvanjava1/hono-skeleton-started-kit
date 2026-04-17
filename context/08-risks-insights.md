# 08 Risks Insights

## Technical Debt Signals

### Docs vs implementation mismatch

Dokumentasi menjelaskan skeleton seolah semua layer domain sudah hadir, tetapi implementasi default masih fokus pada fondasi. Ini bisa menyesatkan jika orang baru membaca docs tanpa membaca source.

### Limited test baseline

Repo sekarang sudah memiliki test dasar untuk config parsing dan validasi target migration, tetapi baseline test-nya masih terbatas. Dampaknya:

- integration bug lintas database masih bisa lolos
- perubahan fondasi tetap bisa menimbulkan regresi diam-diam bila tidak diuji end-to-end
- safety net belum cukup untuk refactor agresif

### Convention ambiguity

Ada ambiguity pada:

- struktur folder service/repository
- gaya route modular
- style formatting

Ini bukan kerusakan, tetapi akan menjadi sumber inkonsistensi jika tidak segera distandardkan lewat modul nyata pertama.

## Fragile Areas

### Startup dependency coupling

`src/index.ts` menghubungkan startup aplikasi langsung dengan keberhasilan koneksi database yang aktif. Jika satu dependency aktif gagal, startup gagal total.

Ini aman untuk strict startup validation, tetapi mengurangi fleksibilitas partial mode.

### In-memory rate limiter

Rate limiter saat ini hanya valid per process. Risiko:

- tidak konsisten pada multi-instance deployment
- reset state saat process restart

### Logger filesystem dependency

Logger menulis ke filesystem lokal. Ini baik untuk local/dev sederhana, tetapi bisa bermasalah pada:

- immutable container
- ephemeral filesystem
- platform dengan volume write terbatas

## Hidden Coupling

### Env-driven behavior

Banyak perilaku runtime tersembunyi di env toggle. Ini membuat codebase fleksibel, tetapi coupling ke konfigurasi menjadi tinggi.

### Named connection expansion

Setelah seluruh engine utama mendukung named connections, ada coupling baru yang sehat tetapi penting:

- `sqlite1`
- `mysql1/mysql2`
- `mongo1/mongo2`
- `redis1/redis2`
- `pg1/pg2`

Ini membuat explicit targeting lebih aman, tetapi juga menaikkan kebutuhan konsistensi docs, stub, dan migration runner.

### Reference module can be mistaken as real domain

Karena repo sekarang menyertakan modul `example`, ada risiko orang baru menganggapnya sebagai domain bawaan yang harus dipertahankan.

Yang benar:

- `example` adalah reference module
- project turunan boleh menghapus atau menggantinya
- domain bisnis nyata tidak seharusnya diwariskan dari nama `example`

### First real business module will still define the standard

Walaupun reference module sudah ada, modul bisnis nyata pertama tetap akan menjadi template de facto untuk:

- struktur folder
- naming
- level abstractions
- penggunaan queue/cache
- testing approach

Ini coupling sosial-teknis yang penting untuk disadari.

## Risky Assumptions to Avoid

- menganggap docs selalu sama dengan source aktual
- menganggap service/repository structure sudah final
- menganggap multi-database berarti satu feature harus mendukung semua database sekaligus
- menganggap default connection compatibility path adalah pola terbaik untuk kode baru
- menganggap worker system sudah lengkap hanya karena queue infra sudah ada

## Migration and Refactor Hazards

- perubahan pada util dasar bisa mempengaruhi seluruh skeleton
- perubahan pada startup atau middleware bisa mempengaruhi semua endpoint
- perubahan pada logger atau error handler berpotensi mengubah observability dan response behavior secara global
- perubahan pada generator stub bisa mempengaruhi bentuk module berikutnya
- perubahan pada connection registry atau config naming bisa mempengaruhi semua database engine sekaligus

## Recommended Guardrails

Saat mengerjakan task berikutnya, guardrail yang paling masuk akal adalah:

1. mulai dari impact analysis ke area yang benar-benar disentuh
2. cek reuse sebelum membuat helper baru
3. pilih satu target database per feature bila memungkinkan
4. jangan refactor fondasi sambil menambah feature kecuali memang disetujui
5. bila ada ambiguity convention, putuskan lebih dulu sebelum menyebarkan pattern baru

## Final Insight

Repo ini punya fondasi teknis yang cukup baik, dan sekarang juga sudah punya contoh end-to-end netral lewat modul `example`. Karena itu, risiko terbesar bukan lagi “tidak ada contoh”, tetapi salah membaca reference module sebagai domain bisnis permanen atau menerapkan polanya secara inkonsisten.

Sekarang repo juga sudah punya fondasi multi-connection yang cukup kuat untuk semua engine utama. Karena itu, risiko barunya bergeser dari “belum ada capability” menjadi “capability sudah ada, tetapi bisa dipakai secara inkonsisten bila tim tidak disiplin pada explicit targeting dan convention.”
