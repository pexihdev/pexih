# PEXIH Design System & Layout Rules

## Current UI Phase: Astro Mobile-First & Desktop Split (White & Orange Theme)
The application has two distinct UI channels:
1. **Mode Mobile**: Strictly focused on a mobile-first UI. Must use a wrapper with exactly these classes: `fixed inset-0 w-full max-w-[400px] mx-auto flex flex-col bg-white shadow-sm font-sans overflow-y-auto overflow-x-hidden`. All elements MUST remain within this 400px constraint.
2. **Desktop Channel (`/desktop`)**: Isolated layout tailored for wide desktop viewports. It bypasses the `max-w-[400px]` constraint and uses full-screen layouts. Must feature a sticky responsive sidebar on the left (which can be minimized to show only icons to maximize work area) and a flexible content area on the right. On desktop, the article cards / feed must use a 2-column grid layout, while mobile strictly remains a 1-column layout. Must completely omit the bottom navigation bar. Colors and typography must remain proportional to mobile.

### Layout & Sizing Constraints
- **Color Palette**: Background: `bg-white` or `bg-gray-50`. Primary Accent: `#FF6B00` (Tailwind classes `text-orange-600`, `bg-orange-600`, `border-orange-600`). Accent hover states: `bg-orange-700`.
- **Safe Area Insets (Penting)**: Setiap layout header dan bottom nav WAJIB menggunakan penyesuaian safe area (`safe-area-inset-top` untuk header dan `safe-area-inset-bottom` untuk bottom nav/footer). Aturan ini berlaku mutlak di SEMUA halaman: frontend mobile, frontend desktop, admin panel mobile, dan admin panel desktop. Setiap perubahan atau pembuatan halaman baru yang memerlukan header WAJIB mematuhi jarak ini.
- **Header Actions / Menu Kanan**: Pada setiap halaman baru atau perubahan yang memiliki header, menu di sebelah kanan header (seperti notifikasi, opsi tambahan, dll) WAJIB difungsikan dan dibuat sesuai konteks halaman tersebut.
- **Top Header Navbar**: Every header must use exactly `h-[52px] px-5` with vertically centered items (`flex items-center`) for unified alignment, matching the height and spacing of the bottom navbar. Do not use asymmetric `pt` and `pb` padding.
- **Bottom Navigation Bar**: Height must be exactly `h-[52px]`, with `text-[8px]` labels and `w-4 h-4` icons. Highlight active tabs using Orange color styling.
- **Inner Pages Navigation**: Halaman selain tab navigasi utama (seperti halaman baca artikel, pengaturan, dll) TIDAK BOLEH menampilkan Bottom Navigation. Header halaman dalam harus memiliki tombol Back (icon ChevronLeft) di sebelah kiri, judul di tengah, dan (opsional) tombol action di kanan. Aturan ini berlaku untuk versi mobile frontend dan versi mobile admin panel.
- **Micro-Typography**:
  - Header Titles: `text-[16px]` or `text-[14px]` (bold/black)
  - Card Titles / Subheaders: `text-[12px]` to `text-[11px]`
  - Standard text: `text-[10px]` to `text-[9px]` (gray-600)
  - Micro Metadata: `text-[8px]` to `text-[9px]` (uppercase orange/gray-400)
- **Geometry**: `rounded-xl` for larger cards or hero images, and `rounded-md` or `rounded-lg` for smaller nested elements.
- **Banners & Images**: Hero banners must use `aspect-[16/9]` and be centered (`mx-auto`). Thumbnail items must use `aspect-[4/3]` or `aspect-[3/2]`. Always specify `referrerpolicy="no-referrer"` on images.

## PEXIH Branding Rule
- **Brand Name Coloring**: The brand name "PEXIH" MUST ALWAYS be styled such that the letter "X" is colored orange. This rule applies globally across all interfaces: frontend mobile, frontend desktop, admin panel mobile, and admin panel desktop. 
- Example HTML implementation: `PE<span class="text-orange-600">X</span>IH`
- For Admin Panels, use `PE<span class="text-orange-600">X</span>IH Admin` instead of just "Admin Panel".

## Language & Communication
- **App Content**: UI copy, buttons, placeholders, success/error messages, and text must support **15 languages**, with **English** as the default. The languages should be stored and managed via a language switcher and state persistence. Aturan ini berlaku untuk frontend mobile dan desktop, serta admin panel mobile dan desktop.
- **Admin Panel Translation Override**: Khusus untuk **Admin Panel** (Mobile & Desktop), bahasa antarmuka TIDAK BOLEH diterjemahkan secara otomatis mengikuti pengaturan bahasa default browser (auto-translate berdasarkan `navigator.language`). Bahasa di admin panel HANYA boleh berubah jika pengguna mengubahnya secara manual melalui pengaturan atau language switcher. Admin panel menggunakan bahasa Inggris secara default.
- **Frontend Auto-Detect & Header Icon**: Untuk **Frontend** (Mobile & Desktop), bahasa antarmuka HARUS mendeteksi secara otomatis dari bahasa browser pengguna (jika didukung dari 15 bahasa). Ikon bendera negara di header juga HARUS menyesuaikan dengan bahasa yang sedang aktif.
- **Hybrid Translation untuk Frontend**: Khusus untuk **Frontend** (Mobile & Desktop), terjemahan dikombinasikan antara auto-translation (Google Translate) dan file JSON lokal (misal `id.json`, `en.json` di `/public/locales/`). Gunakan atribut `data-i18n="key"` pada elemen UI statis (seperti navigasi dan placeholder) untuk mendukung penggantian teks secara lokal dari file JSON. Fitur JSON ini TIDAK BERLAKU untuk Admin Panel.
- **Agent Responses**: The AI Assistant must respond to user requests in the chat using **Bahasa Indonesia** with professional and concise explanations.
- **State Persistence (Refresh Rules)**: 
  - Jika browser di refresh, jika pengunjung sedang berada di bahasa selain default (misalnya ke bahasa Indonesia), aplikasi **WAJIB** tetap mempertahankan bahasa tersebut (tidak reset ke bahasa Inggris), kecuali diubah secara manual. Hal ini berlaku untuk frontend dan admin panel.
  - Jika pengunjung sedang berada di halaman spesifik (seperti halaman Explore, Baca Artikel, dll), jika browser di refresh aplikasi **WAJIB** tetap berada di halaman tersebut (tidak boleh melakukan redirect secara tidak sengaja ke halaman Home). Hal ini berlaku untuk frontend dan admin panel.

## Animasi & Interaksi
- **Transisi Halaman**: Untuk transisi antar halaman Astro, WAJIB gunakan View Transitions API bawaan Astro (`<ViewTransitions />` di head) agar mulus.
- **Skeleton Loading & Entry**: Gunakan animasi transisi masuk yang lembut (seperti class `animate-fade-in` pada Tailwind) pada kartu artikel, hero section, atau container konten utama agar tidak terlihat kaku saat baru dimuat.
- **Efek Tombol**: Berikan efek interaksi lembut pada tombol (misal `transition-all active:scale-95`).

## Notifications & Feedback
- **No Native Dialogs**: Do NOT use `window.alert`, `window.confirm`, or `window.prompt`. Always use customized orange-themed modals or micro-toasts. Notifikasi DILARANG menggunakan alert bawaan (`window.alert`). Gunakan library toast (misal `sonner`) yang muncul dari tengah atas (`top-center`), dengan teks ukuran `text-[9px]` (`text-center`), dan padding sangat kecil. Aturan ini berlaku di frontend mobile, desktop dan admin panel mobile desktop. Jika konten memerlukan popup (dialog modal), DILARANG KERAS menggunakan popup default browser. Selalu buat popup kustom menggunakan Astro atau Vanilla JS. Posisi popup bisa terpusat di layar atau muncul dari bawah sesuai dengan konteks dan desain. Aturan ini berlaku di seluruh platform (admin panel mobile & desktop, frontend mobile & desktop).
- **Micro Toast**: Toasts must render at the `top-center` position with extra-small bold text: `className="!py-1.5 !px-2.5 font-bold !text-[9px] text-center rounded-full !bg-orange-600 !text-white"`.
- **Aksi Pengguna (Toasts)**: Menerapkan notifikasi `window.toast("Pesan")` pada aksi-aksi spesifik pengguna. Karena default aplikasi adalah bahasa Inggris agar fungsi 15 bahasa berjalan optimal, gunakan teks berbahasa Inggris untuk toast, seperti Bookmark ("Article saved"), Share ("Link copied"), Like ("Liked"), atau saat menyimpan pengaturan di Admin Panel ("Settings saved").

## Backend API Configuration
- The separate `/backend` directory uses standard **Node.js with Express**, deployed as Serverless Functions on Vercel.
- **DILARANG KERAS** menggunakan framework **NestJS** (`@nestjs/*`) atau dependensi terkait NestJS di dalam `/backend`. Semua kode backend telah bermigrasi sepenuhnya ke arsitektur Express.js yang lebih ringan.
- Untuk frontend, The backend is integrated into Astro using **Node.js (SSR)** where applicable, but the main external API resides in `/backend`.

## Admin Panel
- The Admin Panel MUST be built with pure Astro and Vanilla JS/TypeScript.
- It MUST follow the same Mobile/Desktop split as the frontend:
  - Mobile Admin Channel: `/admin` (Uses a layout with a `max-w-[400px]` width constraint and a Bottom Navigation Bar).
  - Desktop Admin Channel: `/admin/desktop` (Uses a responsive sidebar, bypasses width constraints).

## Authentication & Separate Logins
- **Frontend Logins**: Login untuk pengguna biasa (Frontend) terpisah antara mobile (`/login`) dan desktop (`/desktop/login`).
- **Admin Panel Logins**: Login untuk admin terpisah antara mobile (`/admin/login`) dan desktop (`/admin/desktop/login`).
- Semua rute login harus diimplementasikan dengan antarmuka yang disesuaikan secara proporsional dengan platformnya.

## Server & Deployment Architecture
Aplikasi ini dipecah menjadi tiga layanan terpisah yang masing-masing di-deploy secara mandiri di Vercel:
1. **Backend Server**: Direktori terpisah (`/backend`) menggunakan Node.js Express. Di-deploy terpisah di Vercel.
2. **Frontend App**: Antarmuka untuk pengguna awam (Mobile & Desktop). Di-deploy terpisah di Vercel.
3. **Admin Panel App**: Antarmuka untuk pengelolaan konten (Mobile & Desktop). Di-deploy terpisah di Vercel.
- Karena Frontend dan Admin Panel di-deploy secara terpisah, masing-masing akan mengambil data dari Backend API URL yang telah ditentukan.

## Migration to Astro
- **Gradual Migration**: The project is being migrated from Next.js to Astro. The migration must preserve the exact same UI, layout, and functionality.
- **PageSpeed Optimization (100/100 Target)**: All frontend code MUST be optimized to achieve a perfect 100 score on Google PageSpeed Insights (Performance, Accessibility, Best Practices, SEO). This includes: ensuring proper `alt` tags on all images, using semantic HTML, minimizing layout shifts (CLS) by providing explicit image dimensions, using `priority` and `fetchpriority="high"` for LCP images, adding `aria-labels` for icon-only buttons, and setting proper meta tags (description, theme-color, etc).
- **Full Astro Migration**: Semua kode frontend WAJIB menggunakan murni Astro (`.astro`) dan Vanilla JS/TypeScript. DILARANG KERAS menggunakan React (`.tsx`, `.jsx`) atau komponen Next.js. Jangan sertakan `@astrojs/react` atau integrasi React lainnya. Semua komponen interaktif harus dibuat menggunakan vanilla JS (client-side script `<script>`) di dalam file `.astro`.
- **Strict File Management & Anti-Overwrite Protocol**:
- **Wajib Baca Sebelum Edit (Read Before Edit)**: Sebelum memodifikasi kode apapun, kamu DIWAJIBKAN untuk menjalankan perintah `view_file` untuk melihat isi asli file tersebut. DILARANG KERAS berasumsi mengenai isi file atau menimpa seluruh file secara membabi buta.
- **Larangan Overwrite File Eksisting**: DILARANG KERAS menggunakan alat `create_file` dengan opsi `overwrite: true` untuk file yang sudah ada di dalam proyek. Kamu HANYA BOLEH menggunakan `edit_file` atau `multi_edit_file` untuk menyisipkan atau mengubah baris kode yang spesifik.
- **Validasi Struktur Folder (No Duplicates)**: Sebelum membuat komponen, rute, atau halaman baru, kamu WAJIB memverifikasi isi direktori menggunakan `list_dir`. Jangan pernah membuat file duplikat dengan nama yang mirip. Gunakan ulang (re-use) komponen yang sudah eksis.
- **Larangan Penghapusan Massal (No Destructive Actions)**: DILARANG KERAS menggunakan alat penghapusan direktori (`delete_dir` secara rekursif) pada direktori utama seperti `/app`, `/src`, `/components`, `/lib`, atau `/backend`. Penghapusan hanya boleh dilakukan secara sangat spesifik pada level file.

## STRICT ARCHITECTURE & BOUNDARIES (TOLERANSI NOL)
- **Backend Murni API**: Direktori `/backend` HANYA BOLEH berisi kode Node.js + Express yang merespons dengan JSON (API). DILARANG KERAS membuat, menyisipkan, menyajikan, atau menyimpan file antarmuka (HTML, CSS, UI) di dalam backend.
- **Pemisahan Astro yang Ketat**: Semua antarmuka pengguna (Frontend Mobile/Desktop dan Admin Panel Mobile/Desktop) MUTLAK menggunakan framework Astro (`.astro`). DILARANG KERAS mencampur atau berasumsi file antarmuka ada di backend.
- **Dilarang Berasumsi (No Hallucinated Features)**: AI HANYA BOLEH membuat fitur, file, halaman, atau endpoint yang diminta secara eksplisit oleh pengguna. DILARANG KERAS menambahkan file/folder baru sebagai "inisiatif" tanpa instruksi.
- **Stop dan Tanyakan**: Jika instruksi ambigu, terutama menyangkut perubahan struktural/pembuatan folder baru, AI WAJIB berhenti dan bertanya kepada pengguna.

## CLEAN WORKSPACE & GITHUB EXPORT SAFETY
- **Dilarang Membuat Skrip Sampah (No Junk Scripts)**: DILARANG KERAS membuat file skrip perbaikan sementara (seperti `fix-app.js`, `delete-html.js`, `test.js`) di root direktori atau di mana pun. Hal ini akan mengotori workspace dan menyebabkan kegagalan saat mengekspor (push) project ke GitHub melalui pengaturan AI Studio.
- **Gunakan Tools Bawaan**: Jika ingin memodifikasi atau menghapus file, gunakan tools bawaan AI (`edit_file`, `multi_edit_file`, `delete_file`) alih-alih membuat dan menjalankan script Node.js secara manual.
- **Jaga Kebersihan Root Directory**: Root direktori hanya boleh berisi file konfigurasi standar (`package.json`, `astro.config.mjs`, `tsconfig.json`, dll). File-file sampah, skrip sementara, atau duplikasi file yang tidak relevan akan merusak repository dan menggagalkan integrasi/push ke GitHub dari AI Studio.