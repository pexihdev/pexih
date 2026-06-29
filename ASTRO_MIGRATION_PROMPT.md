# PROMPT MIGRASI & BRANDING FRONTEND KE ASTRO: PEXIH

Kamu adalah AI Developer ahli di bidang **Astro Framework**, **Tailwind CSS v4**, dan **React** (untuk komponen interaktif client-side). Tugasmu adalah membangun ulang seluruh antarmuka frontend (Mobile & Desktop) menggunakan Astro dengan nama brand baru yaitu **PEXIH**, dengan tema warna baru: **Putih & Orange (Jingga)**, sambil menjaga presisi tata letak, ukuran, dan UX asli.

---

## 🚀 INFORMASI BRAND & TEKNOLOGI
* **Nama Platform**: `PEXIH`
* **Framework**: `Astro` (menggunakan SSR/Hybrid rendering jika diperlukan, atau SSG statis).
* **Tema Warna**: **Clean White & Bold Orange**
  - Background Utama: `bg-white` atau soft off-white `bg-gray-50`
  - Warna Aksen Utama (Brand Color): Orange terang/elegan (misal `#FF6B00` atau Tailwind class `text-orange-600` / `bg-orange-600` / `hover:bg-orange-700` / `border-orange-600`).
  - Teks: Gelap elegan `text-gray-900` atau medium `text-gray-600`.
* **Backend API Terhubung**: `https://sc-ai-analysis-science.vercel.app` (REST API murni). Backend dan Admin Panel tidak mengalami perubahan arsitektur. Astro murni bertindak sebagai client.

---

## 🎨 1. ATURAN TATA LETAK & UKURAN KETAT (SANGAT KRUSIAL)

### A. Pembagian Jalur Tampilan (Segregated Channels)
1. **Mode Mobile (Default `/`)**:
   - Seluruh halaman di luar `/desktop` wajib dibungkus dengan wrapper kontainer mobile-first terpusat:
     `className="fixed inset-0 w-full max-w-[400px] mx-auto flex flex-col bg-white shadow-sm font-sans"`
   - Tidak boleh ada elemen, gambar, teks, maupun popup yang melebar melebihi batas `max-w-[400px]`.
2. **Mode Desktop (`/desktop`)**:
   - Tampilan desktop murni yang melebar penuh (mengabaikan pembatas `max-w-[400px]`).
   - Menggunakan tata letak grid/flex: Sidebar tetap di kiri (`sticky` atau `fixed` dengan lebar `w-64` atau `w-72`) dan area konten utama yang responsif di kanan (`flex-1`).
   - **TIDAK BOLEH ADA** Bottom Navigation di mode Desktop.

### B. Jarak & Ukuran Elemen (Spacing & Sizing Consistency)
- **Top Header (Navbar Atas)**: Padding wajib dan seragam di semua halaman: `h-[52px] px-5`.
- **Bottom Navigation (Menu Bawah Mobile)**:
  - Tinggi mutlak: `h-[52px]`
  - Ukuran Teks Label: `text-[8px]`
  - Ukuran Ikon: `w-4 h-4` (Gunakan library `lucide-astro` atau `lucide-react`)
  - Status Aktif: Menggunakan warna Orange (`text-orange-600` / `bg-orange-50` untuk background item aktif).
- **Hero Banners & Gambar Artikel**:
  - Semua banner utama harus berasio lebar `aspect-[16/9]` (DILARANG menggunakan `aspect-[4/3]`).
  - Letakkan banner di dalam kontainer ber-padding `px-5` dengan sudut membulat halus `rounded-xl` dan `overflow-hidden`.
  - Jika lebar banner tidak memenuhi ruang layar penuh, wajib diletakkan persis di tengah (`mx-auto`).
- **Thumbnails Grid / List**: Gunakan rasio `aspect-[4/3]` atau `aspect-[3/2]`.
- **Borders & Radii**:
  - Kartu / Gambar utama: `rounded-xl`
  - Tombol, badge, atau input field kecil: `rounded-md` atau `rounded-lg`

### C. Tipografi Skala Mikro (Micro-Typography Scale)
- **Judul Utama / Header**: `text-[16px]` atau `text-[14px]` (Gunakan `font-black` atau `font-bold`).
- **Subheader / Judul Kartu**: `text-[12px]` hingga `text-[11px]` (Gunakan `font-semibold` atau `font-medium`).
- **Teks Deskripsi / Isi Artikel**: `text-[10px]` hingga `text-[9px]` (`text-gray-600` atau `text-gray-700`).
- **Metadata / Waktu / Kategori**: `text-[8px]` hingga `text-[9px]` dengan uppercase (`text-orange-600` atau `text-gray-400`).

---

## 🔄 2. NAVIGASI HALAMAN DALAM & TRANSISI
- Halaman sekunder/dalam (seperti membaca detail artikel) **TIDAK BOLEH** menampilkan Bottom Navigation.
- Header halaman dalam harus memiliki tombol Back (ikon `ChevronLeft`) di sebelah kiri, judul artikel terpusat di tengah, dan ruang kosong/balanced di kanan.
- Gunakan fitur **Astro View Transitions** (`<ViewTransitions />` di bagian `<head>`) untuk menjamin transisi perpindahan halaman yang sangat halus tanpa reload layar penuh layaknya Single Page Application (SPA).
- Tombol navigasi paginasi wajib diletakkan di tengah (`justify-center`) menggunakan kontrol tanda panah kiri-kanan yang kecil dan elegan (`ChevronLeft` dan `ChevronRight`).

---

## 🛠️ 3. INTEGRASI API BACKEND (PEXIH ENDPOINTS)
Hubungkan Astro secara langsung ke base URL backend: `https://sc-ai-analysis-science.vercel.app`. Gunakan fungsi `fetch()` bawaan dari Astro (di server-side frontmatter) atau client-side fetch jika ada interaksi dinamis.

### Daftar Endpoint Publik yang Siap Dipakai:
1. **Daftar Kategori**: `GET /categories`
2. **Daftar Artikel**: `GET /articles`
   - Mendukung pencarian: `GET /articles/search/query?q={keyword}`
   - Detail artikel berdasarkan ID/Slug: `GET /articles/{id}` (Contoh format slug: `yon-{random_string}`)
   - Komentar artikel: `GET /articles/{id}/comments` -> Tambah komentar: `POST /articles/{id}/comments`
3. **Data Beranda & Banner**:
   - Banner Slider: `GET /slider`
   - Banner Utama Beranda: `GET /home-banner`
   - Informasi Widget: `GET /widget`
   - Pengumuman Berjalan (Announcement): `GET /announcement`
4. **Newsletter & Support**:
   - Langganan Newsletter: `POST /newsletter`
   - Kirim Pesan Bantuan/Hubungi Kami: `POST /support`
5. **Setelan Situs**: `GET /site-settings`

*Catatan Keamanan*: Seluruh endpoint dinamis wajib disetel ke mode SSR di Astro dengan mendeklarasikan `export const prerender = false;` di baris atas file rute Astro Anda.

---

## 🛡️ 4. NOTIFIKASI, TOAST, DAN KEAMANAN GAMBAR
- **Dilarang Keras menggunakan Native Alert**: Jangan pernah memanggil `window.alert`, `window.confirm`, atau `window.prompt`. Anda harus membuat komponen dialog/modal oranye-putih kustom yang cantik dan elegan atau menggunakan library modern seperti `sonner` / `svelte-french-toast`.
- **Spesifikasi Toast**: Letak toast wajib muncul di posisi **top-center** dengan font bold berukuran mikro `text-[9px]` dan padding minimal yang pas di perangkat mobile:
  `toastOptions={{ className: '!py-1.5 !px-2.5 font-bold !text-[9px] text-center rounded-full !bg-orange-600 !text-white' }}`
- **Keamanan Referrer Gambar**: Setiap kali memanggil tag `<img>`, wajib menambahkan atribut `referrerpolicy="no-referrer"` agar CDN gambar eksternal (seperti Cloudinary) dapat di-load dengan aman dan stabil.

---

# 📝 FILE KONFIGURASI `AGENTS.md` UNTUK PROYEK BARU

Salin dan tempel (copy-paste) konten di bawah ini ke dalam file bernama `AGENTS.md` di root folder proyek baru Anda agar AI Studio Builder selalu mematuhi instruksi ini secara otomatis:

```markdown
# PEXIH Design System & Layout Rules

## Current UI Phase: Astro Mobile-First & Desktop Split (White & Orange Theme)
The application has two distinct UI channels:
1. **Mobile Channel (Default / `/`)**: Strictly focused on a mobile-first UI wrapped in a `max-w-[400px]` centered grid. Styled with a crisp White background and vibrant Orange accents.
2. **Desktop Channel (`/desktop`)**: Isolated layout tailored for wide desktop viewports. It bypasses the `max-w-[400px]` constraint, features a sticky responsive sidebar on the left, and omits the bottom navigation bar.

### Layout & Sizing Constraints
- **Color Palette**: Background: `bg-white` or `bg-gray-50`. Primary Accent: `#FF6B00` (Tailwind classes `text-orange-600`, `bg-orange-600`, `border-orange-600`). Accent hover states: `bg-orange-700`.
- **Top Header Navbar**: Every header must use exactly `pt-3 pb-2 px-5` padding for unified alignment.
- **Bottom Navigation Bar**: Height must be exactly `h-[52px]`, with `text-[8px]` labels and `w-4 h-4` icons. Highlight active tabs using Orange color styling.
- **Micro-Typography**:
  - Header Titles: `text-[16px]` or `text-[14px]` (bold/black)
  - Card Titles / Subheaders: `text-[12px]` to `text-[11px]`
  - Standard text: `text-[10px]` to `text-[9px]` (gray-600)
  - Micro Metadata: `text-[8px]` to `text-[9px]` (uppercase orange/gray-400)
- **Geometry**: `rounded-xl` for larger cards or hero images, and `rounded-md` or `rounded-lg` for smaller nested elements.
- **Banners & Images**: Hero banners must use `aspect-[16/9]` and be centered (`mx-auto`). Thumbnail items must use `aspect-[4/3]` or `aspect-[3/2]`. Always specify `referrerpolicy="no-referrer"` on images.

## Language & Communication
- **App Content**: All UI copy, buttons, place holders, success/error messages, and text MUST be strictly in **English**. No other languages are permitted.
- **Agent Responses**: The AI Assistant must respond to user requests in the chat using **Bahasa Indonesia** with professional and concise explanations.

## Notifications & Feedback
- **No Native Dialogs**: Do NOT use `window.alert`, `window.confirm`, or `window.prompt`. Always use customized orange-themed modals or micro-toasts.
- **Micro Toast**: Toasts must render at the `top-center` position with extra-small bold text: `className="!py-1.5 !px-2.5 font-bold !text-[9px] text-center rounded-full !bg-orange-600 !text-white"`.

## Backend API Configuration
- Base URL Endpoint: `https://sc-ai-analysis-science.vercel.app`
- Do not make any direct changes to the backend codebase or the isolated Admin Panel structure. Ensure Astro acts as the pure client-side consumer of this API.
```

---

## 🎯 INSTRUKSI EKSEKUSI UNTUK AI:
Mulai sekarang, gunakan aturan di atas sebagai fondasi mutlak untuk memandu, membuat, atau memodifikasi file Astro. Lakukan transisi visual dengan menerapkan warna latar belakang putih bersih, aksen warna oranye modern `#FF6B00`, nama aplikasi **PEXIH**, dengan tetap mempertahankan presisi ukuran tata letak mobile-first (`max-w-[400px]`) dan desktop (`/desktop`) secara sempurna.
