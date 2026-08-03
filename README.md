# GDrive Batch Zip Downloader

GDrive Batch Zip Downloader adalah aplikasi web modern, ringan, dan mandiri yang dibangun menggunakan **Next.js 14 (App Router)**, **TypeScript**, dan **Tailwind CSS**. Aplikasi ini memungkinkan pengguna untuk menempelkan banyak tautan Google Drive sekaligus, mengekstrak ID file secara otomatis, mengunduh file tersebut di sisi server, mengompresnya menjadi satu berkas `.zip`, dan mengirimkannya kembali ke peramban secara real-time menggunakan teknik **Zip Streaming**.

---

## Fitur Utama

- **Real-Time Link Extraction**: Mengekstrak ID berkas dari berbagai format tautan Google Drive secara real-time di sisi klien.
- **Dua Mode Operasi**:
  1. **Mode API Key (Wajib)**: Mengunduh berkas publik dengan hak akses *"Anyone with the link"* menggunakan Google Drive API v3 resmi (aman dari perubahan mekanisme unduhan mentah).
  2. **Mode OAuth Login (Fase 2 - Opsional)**: Memungkinkan pengguna masuk dengan akun Google untuk mengunduh berkas privat yang dimiliki oleh akun tersebut.
- **Zip Streaming**: Mengompresi file menggunakan `archiver` dan mengirimkannya langsung ke browser sebagai aliran data (`ReadableStream`) untuk menghemat konsumsi memori server.
- **Google Native Formats Export**: Otomatis mendeteksi dokumen asli Google (Google Docs, Sheets, Slides, Drawings) dan mengekspornya ke format standar (`.docx`, `.xlsx`, `.pptx`, `.png`).
- **Penanganan Nama Duplikat**: Menghindari tumpang tindih nama file di dalam arsip ZIP dengan menambahkan akhiran nomor urut (`_1`, `_2`, dst.) secara cerdas sebelum ekstensi berkas.
- **Pencatatan Kesalahan Komprehensif**: Jika terjadi kegagalan (misalnya berkas privat, folder, atau tidak ditemukan), proses pengemasan tidak akan gagal. Berkas bermasalah dilewati, dicatat, dan daftar kesalahannya disisipkan ke dalam ZIP sebagai file `_errors.txt`.

---

## Format URL yang Didukung

Aplikasi ini dapat mengekstrak ID file dari teks mentah yang berisi pemisah spasi, baris baru, atau tab:
- Tautan buka standar: `https://drive.google.com/open?id=1abcXYZ...`
- Tautan tinjauan: `https://drive.google.com/file/d/1abcXYZ.../view`
- Dokumen asli: `https://docs.google.com/document/d/1abcXYZ.../edit`
- Spreadsheet asli: `https://docs.google.com/spreadsheets/d/1abcXYZ.../edit`
- Presentasi asli: `https://docs.google.com/presentation/d/1abcXYZ.../edit`
- Drawings asli: `https://docs.google.com/drawings/d/1abcXYZ.../edit`
- Tautan direct/uc: `https://drive.google.com/uc?id=1abcXYZ...`
- ID file mentah: `1abcXYZ...` (Berupa string alfanumerik sepanjang 25 hingga 55 karakter)

*Catatan: URL Folder Google Drive (`/drive/folders/`) tidak didukung dan otomatis dilewati demi performa, lalu dicatat ke dalam `_errors.txt`.*

---

## Langkah Setup & Instalasi Lokal

### 1. Kloning Repositori & Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env` dan lengkapi nilainya:
```bash
cp .env.example .env
```

#### Cara Mendapatkan Variabel Lingkungan:

1. **`DRIVE_API_KEY`**:
   - Buka [Google Cloud Console](https://console.cloud.google.com/).
   - Buat atau pilih proyek Anda.
   - Aktifkan **Google Drive API**.
   - Di menu **Credentials**, buat **API Key**.
   - Batasi (restrict) penggunaan API Key tersebut hanya untuk **Google Drive API** guna menjaga keamanan.

2. **`SESSION_SECRET`**:
   - Buat string acak sepanjang 32 karakter atau lebih.
   - Melalui terminal: `openssl rand -base64 32`

3. **`ENABLE_OAUTH_LOGIN`** (Opsional):
   - Set ke `true` untuk mengaktifkan tombol login Google Drive.
   - Daftarkan **OAuth client ID** di Cloud Console dengan tipe aplikasi web.
   - Tambahkan Authorized Redirect URI: `http://localhost:3000/api/auth/callback`.

---

## Jalankan di Lingkungan Lokal

Menjalankan server pengembangan lokal:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di peramban Anda.

Untuk kompilasi produksi dan menjalankan build:
```bash
npm run build
npm start
```

---

## Deployment ke Vercel

Aplikasi ini dirancang untuk dapat dideploy langsung ke **Vercel** dengan langkah mudah:

1. Buat proyek baru di dashboard Vercel dan hubungkan dengan repositori git Anda.
2. Tambahkan semua konfigurasi environment variables (`DRIVE_API_KEY`, `SESSION_SECRET`, dsb.) di pengaturan proyek Vercel.
3. Tambahkan URI Callback produksi ke Google Cloud Console OAuth Client jika fitur OAuth diaktifkan:
   - `https://your-app-domain.vercel.app/api/auth/callback`
4. Deploy!

### Batasan & Konfigurasi Platform (Vercel limits)

- **Batas Durasi Fungsi Serverless (`maxDuration`)**:
  Secara default, aplikasi ini dikonfigurasi dengan durasi maksimum fungsi serverless sebesar **60 detik** (`maxDuration = 60` di route handler). Ini disesuaikan dengan batas maksimum yang diperbolehkan untuk akun **Vercel Hobby** gratis.
  - Jika Anda memiliki akun **Vercel Pro**, batas durasi ini dapat ditingkatkan hingga **300 detik** (5 menit) dengan mengubah nilai variabel `maxDuration` pada file `/app/api/download-zip/route.ts`.
- **Batas Ukuran Respons**:
  Vercel Serverless memiliki batas ukuran payload respons (sekitar 4.5 MB pada akun gratis, dan hingga 50 MB pada akun berbayar). Untuk mengunduh sekumpulan berkas yang sangat besar, disarankan untuk mengunduhnya dalam beberapa kelompok kecil guna menghindari batas memori serverless atau kendala waktu habis.

---

## Struktur Proyek

- `/app/page.tsx` — Halaman utama server component (manajemen sesi).
- `/app/MainClientPage.tsx` — Antarmuka pengguna (klien) dengan real-time link counter.
- `/app/api/download-zip/route.ts` — API Route streaming zip (mode API key & integrasi token OAuth).
- `/app/api/auth/*` — Route Handlers untuk proses login, callback, dan logout Google OAuth.
- `/lib/gdrive.ts` — Logika pembersihan link, ekstraksi ID, dan daftar format ekspor dokumen native Google.
- `/lib/session-helper.ts` — Manajemen penyimpanan sesi menggunakan `iron-session`.
- `/tests/*` — Pengujian unit ekstraksi link dan API route.
