# KarierKu — Biografi, Karier, Peluang, dan Pembuat CV Cepat

Aplikasi web untuk membantu pengembangan karier pribadi:
- **Biografi & Karier** — catat latar belakang, posisi saat ini, keahlian, pengalaman, dan pendidikan.
- **Peluang Karier** — catat lowongan incaranmu sendiri, cari lowongan dari sumber eksternal (contoh: API publik Remotive), dan baca tips memilih arah karier.
- **Pembuat CV Cepat** — hasilkan CV yang disesuaikan untuk posisi tertentu, lalu salin sebagai teks, unduh sebagai PDF, atau unduh sebagai Word (.docx) — kamu bisa pilih formatnya.
- **Belajar & Kembangkan Diri** — kumpulan tips ringkas seputar CV, wawancara kerja, personal branding, dan perencanaan karier.

## Dua mode pemakaian

1. **Mode Tamu (tanpa login)** — semua data (biografi, peluang karier) disimpan lokal di browser (localStorage). Tidak butuh server sama sekali, jadi folder `public/` bisa langsung di-deploy sebagai situs statis (misalnya lewat **GitHub Pages**). Fitur Pembuat CV sepenuhnya berfungsi di mode ini.
2. **Mode Akun (login dengan email & password)** — data tersimpan di server lewat backend Node.js + database SQLite, dengan verifikasi email sebelum bisa login. Mode ini butuh backend berjalan (lihat panduan di bawah), karena **GitHub Pages hanya bisa menghosting file statis, tidak bisa menjalankan server**.

Kamu bebas memilih memakai salah satu atau menyediakan keduanya untuk penggunamu.

## Struktur proyek

```
career-dev-app/
├── server.js              # Entry point backend (Express)
├── db/database.js         # Setup SQLite (otomatis dibuat saat server pertama jalan)
├── routes/                # auth.js, profile.js, opportunities.js
├── middleware/authMiddleware.js
├── utils/email.js         # Kirim email verifikasi (fallback: dicetak di console jika SMTP belum diatur)
└── public/                # Frontend statis (HTML, CSS, JS vanilla — tanpa proses build)
    ├── index.html, login.html, register.html, verify.html
    ├── profile.html, opportunities.html, cv-builder.html, learn.html
    ├── css/style.css
    ├── js/                # config.js, api.js, storage.js, auth.js, nav.js, dan logic tiap halaman
    └── data/career-tips.json
```

## Menjalankan secara lokal

Butuh [Node.js](https://nodejs.org) versi 18 ke atas (karena memakai `fetch` bawaan Node untuk pencarian lowongan eksternal).

```bash
npm install
cp .env.example .env
# Buka .env, minimal ganti JWT_SECRET dengan string acak yang panjang
npm start
```

Buka `http://localhost:4000`. Server ini otomatis menyajikan frontend (`public/`) dan API (`/api/...`) dari origin yang sama, jadi kamu tidak perlu mengubah `public/js/config.js`.

Karena `SMTP_HOST` di `.env.example` masih kosong, saat mendaftar akun baru, link verifikasi email akan **dicetak di terminal server**, bukan dikirim sungguhan — cukup salin link itu ke browser untuk mencoba fitur verifikasi. Untuk mengirim email sungguhan, isi `SMTP_HOST`, `SMTP_USER`, `SMTP_PORT`, `SMTP_SECURE`, dan `SMTP_PASS` di `.env` (mis. dengan Gmail App Password, Mailtrap, atau Resend SMTP).

## Deploy ke GitHub

1. Buat repository baru di GitHub, lalu:
   ```bash
   git init
   git add .
   git commit -m "Rilis awal KarierKu"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
2. `.env` **tidak ikut ter-commit** (sudah ada di `.gitignore`) — jangan pernah commit rahasia seperti `JWT_SECRET` atau password SMTP.

### Opsi A — Hanya mode tamu (murni statis, paling mudah)

Kalau kamu cukup memakai mode tamu (tanpa akun/login), kamu bisa deploy folder `public/` saja ke **GitHub Pages**:
1. Di repo GitHub, buka **Settings → Pages**.
2. Pilih source dari branch `main`, folder `/public` (atau salin isi `public/` ke branch `gh-pages`/folder root sesuai preferensimu).
3. Aplikasi akan bisa diakses lewat `https://USERNAME.github.io/NAMA-REPO/`.

Fitur biografi, peluang karier (manual), dan pembuat CV tetap berfungsi penuh — hanya fitur akun (login/verifikasi email) dan pencarian lowongan eksternal yang tidak aktif karena keduanya butuh backend.

### Opsi B — Mode akun aktif (frontend + backend)

GitHub sendiri tidak menjalankan server backend, jadi backend perlu dihosting terpisah di layanan yang mendukung Node.js, misalnya **Render**, **Railway**, atau **Fly.io** (semuanya punya paket gratis/murah):

1. Hubungkan repo GitHub-mu ke layanan tersebut, set **Build command**: `npm install`, **Start command**: `npm start`.
2. Di pengaturan environment variable layanan tersebut, isi semua nilai dari `.env.example` (terutama `JWT_SECRET`, `APP_BASE_URL` = URL backend kamu, dan SMTP jika ingin email verifikasi asli).
3. Setelah backend berjalan (misalnya di `https://karierku-api.onrender.com`), kamu punya dua pilihan:
   - **Termudah:** biarkan backend juga menyajikan frontend (karena `server.js` sudah menyajikan folder `public/`). Cukup buka URL backend itu langsung — semuanya jalan dari satu tempat.
   - **Terpisah:** deploy folder `public/` ke GitHub Pages seperti Opsi A, lalu edit `public/js/config.js` dan isi:
     ```js
     window.API_BASE_URL = "https://karierku-api.onrender.com";
     ```
     supaya frontend statis di GitHub Pages memanggil backend yang terpisah itu.

## Mengganti sumber lowongan eksternal

Contoh bawaan di `routes/opportunities.js` (endpoint `/api/opportunities/search`) memakai API publik [Remotive](https://remotive.com/api-documentation) yang tidak butuh API key, sebagai contoh saja. Untuk memakai sumber lain yang butuh API key (misalnya Adzuna, Jooble, dsb.):

1. Simpan API key di `.env` (jangan pernah taruh langsung di kode frontend).
2. Ganti isi fungsi di route tersebut agar memanggil API pilihanmu dan hasilnya dipetakan ke bentuk `{ title, company, sourceUrl, location }`.

## Catatan keamanan

- Password di-hash dengan bcrypt sebelum disimpan.
- Sesi login memakai token JWT yang kedaluwarsa dalam 30 hari.
- Ada pembatasan jumlah percobaan login/registrasi (`express-rate-limit`) untuk mengurangi risiko brute-force.
- Untuk penggunaan produksi sungguhan, pertimbangkan menambah: reset password, kebijakan kekuatan password yang lebih ketat, dan HTTPS (otomatis tersedia di Render/Railway/GitHub Pages).
