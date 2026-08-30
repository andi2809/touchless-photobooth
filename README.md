# 📸 Touchless Interactive Photobooth & Dual-Display Live Showcase

- Gesture peace (untuk mengambil gambar)
- Gesture Tunjuk Kiri untuk menggangi frame ke kiri
- Gesture Tunjuk Kanan untuk menggangi frame ke kanan
- Gesture Jempol untuk setuju memilih frame
- Gesture L untuk menampilkan tutorial / panduan penggunaan gesture

---

> **Aplikasi Photobooth Interaktif Berbasis AI Computer Vision (_Touchless
> Gesture Control_)**  
> Dibangun dengan arsitektur **Local-First**, **Zero-Backend**, dan
> **Sinkronisasi Layar Ganda (_Dual-Monitor Showcase_)** secara real-time untuk
> kebutuhan pameran, booth interaktif, dan event publik.

---

## 🚀 Daftar Teknologi yang Digunakan (Tech Stack)

Aplikasi ini dirancang untuk performa tinggi, latency ultra-rendah, dan
keandalan penuh saat offline (_offline-resilient_). Berikut adalah teknologi
utama yang digunakan:

### 1. **Core & Framework**

- **[Next.js 16 (16.3.3 - Turbopack)](https://nextjs.org/)**: Framework React
  modern dengan Turbopack bundler berkecepatan tinggi, routing modular (`/`
  untuk photobooth & `/gallery` untuk display wall), dan arsitektur komponen
  terisolasi.
- **[React 19](https://react.dev/)**: Versi React terbaru dengan compiler &
  runtime otomatis, state management berbasis hook modern, _client-side
  rendering_ interaktif, dan sinkronisasi event loop.
- **[TypeScript 5](https://www.typescriptlang.org/)**: Menjamin keamanan tipe
  data (_type safety_), autocompletion, dan arsitektur kode yang terstruktur
  (landmark AI, gesture types, broadcast payloads).

### 2. **Artificial Intelligence & Computer Vision**

- **[@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision)
  (v0.10.14)**: Google MediaPipe Vision AI runtime yang berjalan 100% di browser
  pengunjung menggunakan akselerasi **WebAssembly (WASM)** dan **WebGL/GPU**.
- **Model `hand_landmarker.task`**: Model deteksi 21 titik sendi (_landmarks_)
  3D tangan manusia secara real-time tanpa pengiriman data video ke server
  eksternal.

### 3. **Grafis, Rendering & Audio**

- **HTML5 Canvas API**: Rendering garis gambar neon udara (_glow effects_),
  interpolasi kurva Bezier, efek filter bokeh/blur latar belakang, rendering
  framing overlay, serta _watermark/frame composite_ saat snapshot diekspor.
- **HTML5 Web Audio API**: _Audio Synthesizer_ mandiri berbasis oscillator node
  untuk menghasilkan efek suara shutter mekanis, beep countdown digital, chime
  frame lock, dan audio selebrasi tanpa ketergantungan file MP3 eksternal.
- **[canvas-confetti](https://www.npmjs.com/package/canvas-confetti)**: Efek
  animasi ledakan konfeti partikel saat foto baru berhasil diambil dan
  ditampilkan di monitor pameran.

### 4. **Komunikasi Real-Time & Antarmuka**

- **Native Web BroadcastChannel API**: Jalur komunikasi _peer-to-peer_
  antar-tab/layar monitor secara lokal pada perangkat yang sama tanpa memerlukan
  WebSocket server ataupun database.
- **[Tailwind CSS 3](https://tailwindcss.com/) & PostCSS**: Framework CSS
  utility-first untuk desain modern bertema _Cyberpunk/Neon Dark Mode_ dan efek
  Glassmorphism.
- **[Lucide React](https://lucide.dev/)**: Koleksi ikon antarmuka modern yang
  ringan dan responsif.
- **[Google Apps Script](https://developers.google.com/apps-script)**: Webhook
  mandiri _serverless_ untuk mengunggah otomatis hasil foto resolusi tinggi ke
  folder Google Drive publik.

---

## 📁 Struktur Direktori Project & Penjelasan Folder/File

Berikut adalah representasi pohon direktori lengkap dari project ini:

```
touchless-photobooth/
├── google-apps-script/
│   └── Code.gs                      # Script webhook Google Drive auto-uploader
├── public/
│   ├── assets/
│   │   ├── frames/                  # Aset grafis bingkai overlay foto (.png / .svg)
│   │   └── stickers/                # Aset stiker virtual (.png / .svg)
│   ├── models/
│   │   └── hand_landmarker.task     # Binary model AI MediaPipe Hand Landmark
│   └── wasm/                        # Binary WebAssembly MediaPipe Vision runtime
├── scripts/
│   ├── download-models.mjs          # Script otomasi download model & copy file WASM
│   └── generate-assets.mjs          # Generator template frame & sticker SVG/PNG
├── src/
│   ├── app/
│   │   ├── gallery/
│   │   │   └── page.tsx             # Halaman Route 2: Live Gallery Showcase (Monitor 2)
│   │   ├── globals.css              # Styling global, animasi neon, & keyframe effects
│   │   ├── layout.tsx               # Root Layout Next.js (Font & Metadata)
│   │   └── page.tsx                 # Halaman Route 1: Main Interactive Photobooth (Monitor 1)
│   ├── components/
│   │   ├── Gallery/                 # Komponen khusus untuk layar pameran audiens
│   │   │   ├── PhotoGrid.tsx        # Grid galeri masonry foto interaktif
│   │   │   ├── PolaroidPopup.tsx    # Modal pop-up animasi foto polaroid instan
│   │   │   └── QRCodeDisplay.tsx    # Banner QR Code untuk download foto audiens
│   │   └── Photobooth/              # Komponen utama antarmuka photobooth
│   │       ├── AirCanvas.tsx        # Canvas untuk melukis di udara (Air Drawing)
│   │       ├── BlurFocusLayer.tsx   # Efek filter kedalaman (bokeh blur luar frame)
│   │       ├── CameraView.tsx       # Layer feed webcam real-time (mirror view)
│   │       ├── ControlHeader.tsx    # Bar kontrol atas (palet warna neon, frame, action)
│   │       ├── CountdownOverlay.tsx # Overlay hitung mundur visual & audio (3..2..1)
│   │       ├── FlashOverlay.tsx     # Efek flash putih saat shutter ditekan
│   │       ├── GestureGuideModal.tsx# Modal petunjuk cara menggunakan gestur tangan
│   │       ├── PhotoPreviewModal.tsx# Modal pratinjau hasil foto, filter, & download
│   │       └── VirtualCursor.tsx    # Kursor melayang dengan dwell-selection (touchless UI)
│   ├── hooks/
│   │   ├── useBroadcastGallery.ts   # Custom hook sinkronisasi data via BroadcastChannel
│   │   ├── useHandLandmarker.ts     # Custom hook integrasi AI MediaPipe & GPU loop
│   │   └── useSoundEffects.ts       # Custom hook synthesizer audio (Web Audio API)
│   ├── types/
│   │   └── photobooth.ts            # Definisi tipe data TypeScript & interface project
│   └── utils/
│       ├── canvasRenderer.ts        # Helper fungsi rendering neon canvas & bracket HUD
│       ├── frameComposite.ts        # Helper pemrosesan export foto HD, frame, & watermark
│       └── gestureMath.ts           # Engine perhitungan vektor & matematika 21 landmark
├── .gitignore                       # Konfigurasi file yang diabaikan oleh Git
├── next-env.d.ts                    # Tipe deklarasi lingkungan Next.js
├── next.config.mjs                  # Konfigurasi Next.js (WASM loader & asset headers)
├── package.json                     # Konfigurasi dependensi & script project
├── postcss.config.mjs               # Konfigurasi PostCSS untuk Tailwind CSS
├── tailwind.config.ts               # Konfigurasi tema Tailwind (warna neon, glow, shadows)
├── tsconfig.json                    # Konfigurasi kompilasi TypeScript
└── README.md                        # Dokumentasi utama project
```

---

## 🔍 Penjelasan Rinci Setiap File & Tujuannya

### 📂 Root Project Configuration

- **`package.json`**: Berisi daftar dependensi NPM (`@mediapipe/tasks-vision`,
  `canvas-confetti`, `lucide-react`, `next`, `react`, `tailwindcss`) dan
  perintah eksekusi script (`npm run dev`, `npm run build`,
  `npm run download-models`).
- **`next.config.mjs`**: Mengonfigurasi bundler Next.js agar dapat menyajikan
  file biner WebAssembly (`.wasm`) dan model MediaPipe dari folder `public/`
  dengan header yang tepat.
- **`tailwind.config.ts`**: Menentukan palet warna tema neon (_cyan, pink,
  yellow, lime, purple_), efek drop-shadow bercahaya (_neon glow_), serta
  animasi kustom (_pulse-glow, scanning-line_).
- **`tsconfig.json`**: Menentukan aturan kompilasi TypeScript, target ESNext,
  konfigurasi JSX, dan path alias (`@/*` mengarah ke `./src/*`).
- **`postcss.config.mjs`**: Menghubungkan Tailwind CSS dan Autoprefixer ke
  pipeline build Next.js.
- **`.gitignore`**: Mengabaikan file log, cache Next.js (`.next/`), modul
  `node_modules/`, dan file lokal yang tidak perlu masuk ke repository Git.

---

### 📂 `google-apps-script/`

- **`Code.gs`**:
  - **Tujuan**: Backend serverless gratis berbasis Google Apps Script untuk
    menerima payload gambar base64 dari photobooth via HTTP POST request.
  - **Fungsi**: Mengonversi base64 menjadi file PNG, menyimpannya di folder
    Google Drive publik yang ditentukan, dan mengembalikan URL download
    langsung.

---

### 📂 `public/`

- **`public/models/hand_landmarker.task`**: File model machine learning
  MediaPipe Vision (TensorFlow Lite task) untuk mendeteksi 21 titik anatomi
  tangan dalam koordinat 3D.
- **`public/wasm/`**: File biner WebAssembly (`vision_wasm_internal.wasm`,
  `.js`) yang mengeksekusi model AI di dalam browser pengunjung dengan
  akselerasi GPU/SIMD secara offline.
- **`public/assets/frames/`**: Template grafis bingkai bertema _Cyberpunk_,
  _Retro VHS_, dan _Comic Pop-Art_ yang dapat dipilih pengunjung untuk menghiasi
  hasil foto.
- **`public/assets/stickers/`**: Aset stiker lucu dan aksesoris virtual (seperti
  kacamata piksel, telinga kucing, bintang berkilau).

---

### 📂 `scripts/`

- **`download-models.mjs`**: Script Node.js otomatis untuk mendownload model
  `hand_landmarker.task` resmi dari Google Storage dan menyalin runtime WASM
  dari `node_modules/@mediapipe/tasks-vision/wasm/` ke folder `public/`.
- **`generate-assets.mjs`**: Script pembantu untuk men-generate aset SVG dan PNG
  frame photobooth serta stiker dekoratif beresolusi tinggi.

---

### 📂 `src/app/` (Next.js App Router)

- **`layout.tsx`**: Layout utama pembungkus aplikasi; memuat font, metadata
  aplikasi, dan struktur HTML dasar.
- **`globals.css`**: Berisi styling global CSS, utility class kustom untuk efek
  Glassmorphism (`backdrop-blur`), scanline CRT, animasi glow, dan reset
  scrollbar.
- **`page.tsx` (Monitor 1 - Interactive Photobooth)**:
  - **Tujuan**: Antarmuka utama yang berhadapan langsung dengan pengunjung
    photobooth.
  - **Fungsi**: Mengelola alur kamera, pemrosesan deteksi AI per-frame
    (_requestAnimationFrame_), interaksi gestur (menggambar di udara, trigger
    snapshot, pemilihan filter frame), countdown, dan broadcast data foto.
- **`gallery/page.tsx` (Monitor 2 - Audience Showcase Wall)**:
  - **Tujuan**: Antarmuka layar kedua yang menghadap ke penonton/pameran.
  - **Fungsi**: Menerima sinyal foto baru via `BroadcastChannel`, menampilkan
    animasi pop-up polaroid instan, memicu ledakan konfeti, menampilkan galeri
    foto masonry, dan banner QR code untuk pengunjung mengambil foto mereka.

---

### 📂 `src/components/Photobooth/`

- **`CameraView.tsx`**: Menampilkan feed video webcam langsung dengan
  transformasi _mirror_ horizontal dan rasio aspek responsif.
- **`AirCanvas.tsx`**: Layer canvas transparan di atas video untuk menggambar di
  udara (_Air Drawing_) dengan warna neon, ketebalan dinamis, dan interpolasi
  garis halus.
- **`BlurFocusLayer.tsx`**: Layer visual dinamis yang memberikan efek bokeh blur
  pada area di luar kotak gestur frame tangan (menciptakan efek fokus subjek).
- **`VirtualCursor.tsx`**: Kursor hover interaktif berbasis jari telunjuk dengan
  lingkaran _dwell-progress_ (memungkinkan pemilihan tombol/menu UI tanpa
  menyentuh layar).
- **`ControlHeader.tsx`**: Bilah navigasi atas yang berisi indikator FPS/AI
  status, pemilih palet warna neon, pemilih bingkai/frame foto, tombol panduan
  gestur, dan tombol shutter manual.
- **`CountdownOverlay.tsx`**: Tampilan hitung mundur animasi 3D besar di tengah
  layar (3, 2, 1, SMILE!) yang sinkron dengan efek suara beep.
- **`FlashOverlay.tsx`**: Animasi kilatan cahaya putih terang di seluruh layar
  pada saat shutter foto terpicu.
- **`PhotoPreviewModal.tsx`**: Modal pratinjau instan setelah foto diambil untuk
  melihat hasil, memilih filter/frame ulang, menyimpan secara lokal, atau
  mengunggah ke Google Drive.
- **`GestureGuideModal.tsx`**: Modal pop-up visual yang menjelaskan cara
  melakukan gestur tangan (Frame Photo, Air Draw, Clear Canvas, Peace Sign,
  Thumbs Up).

---

### 📂 `src/components/Gallery/`

- **`PhotoGrid.tsx`**: Tampilan galeri interaktif dengan layout kartu foto
  modern yang menampilkan seluruh riwayat foto yang telah diambil pada sesi
  pameran.
- **`PolaroidPopup.tsx`**: Efek pop-up animasi kartu foto bergaya polaroid besar
  yang muncul secara otomatis begitu pengunjung selesai mengambil foto di
  Monitor 1.
- **`QRCodeDisplay.tsx`**: Banner elegan yang menampilkan QR Code dan tautan
  singkat agar penonton pameran dapat langsung memindai dan mendownload foto
  dari smartphone.

---

### 📂 `src/hooks/`

- **`useHandLandmarker.ts`**:
  - Menginisialisasi model MediaPipe Vision WebAssembly secara offline dari
    folder `public/`.
  - Menjalankan loop deteksi video berkecepatan tinggi (30-60 FPS) menggunakan
    `requestAnimationFrame`.
  - Meneruskan koordinat 21 titik landmark tangan ke engine matematika gestur.
- **`useBroadcastGallery.ts`**:
  - Mengenkapsulasi `BroadcastChannel API` browser dengan nama channel
    `PTI_PHOTOBOOTH_CHANNEL`.
  - Menghandle sinkronisasi event antar-layar: `PHOTO_CAPTURED`,
    `REQUEST_GALLERY_SYNC`, `GALLERY_SYNC_RESPONSE`, dan `CLEAR_ALL_PHOTOS`.
- **`useSoundEffects.ts`**:
  - Memanfaatkan Web Audio API (`AudioContext`, `OscillatorNode`, `GainNode`)
    untuk menciptakan efek suara instan tanpa latensi (shutter mekanis, beep
    countdown, suara klik menu, dan chime).

---

### 📂 `src/utils/`

- **`gestureMath.ts`**:
  - **Tujuan**: Engine kalkulasi matematika berbasis vektor murni untuk
    mendeteksi gestur tangan secara akurat dari 21 titik koordinat MediaPipe.
  - **Algoritma yang Dijalankan**:
    - `FRAME_CAPTURE`: Menghitung orientasi 2 tangan di mana jempol dan telunjuk
      saling berhadapan membentuk kotak persegi (_Bounding Box_).
    - `AIR_DRAW`: Mendeteksi jari telunjuk teracung lurus sementara jari tengah,
      manis, dan kelingking ditekuk ke dalam telapak tangan.
    - `OPEN_PALM` (Clear Canvas): Mendeteksi seluruh jari terbuka lebar untuk
      menghapus coretan di layar.
    - `PEACE` & `THUMBS_UP`: Mendeteksi pose jari V-sign dan jempol terangkat.
- **`canvasRenderer.ts`**:
  - Menggambar jejak garis kuas bercahaya (_glow shadow_) pada canvas 2D.
  - Menggambar bracket/sudut kotak bidik neon pada area wajah/frame deteksi.
- **`frameComposite.ts`**:
  - Merender komposisi akhir gambar HD: menggabungkan frame video webcam,
    coretan Air Canvas, efek blur bokeh latar belakang, bingkai dekoratif
    SVG/PNG, stiker, dan watermark logo pameran ke format data PNG/JPEG.

---

### 📂 `src/types/`

- **`photobooth.ts`**:
  - Menyediakan definisi antarmuka TypeScript untuk `NormalizedLandmark`,
    `BoundingBox`, `ActiveGesture`, `CaptureStage`, `PhotoboothFrame`,
    `CapturedPhoto`, `BroadcastPayload`, dan `VirtualCursorState`.

---

## 🖐️ Daftar Gestur Tangan & Fungsinya

| Gestur                             | Visual / Cara Melakukan                                                              | Aksi yang Terjadi                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| **📐 Frame Capture (2 Tangan)**    | Bentuk sudut siku-siku dengan jempol & telunjuk kedua tangan membentuk kotak bingkai | Mengunci area foto, memberikan efek fokus bokeh, dan memulai hitung mundur 3 detik |
| **✏️ Air Drawing (1 Jari)**        | Acungkan hanya jari telunjuk ke arah kamera                                          | Melukis coretan neon di udara secara real-time                                     |
| **✋ Open Palm (Telapak Terbuka)** | Buka seluruh telapak tangan menghadap kamera                                         | Menghapus seluruh coretan di canvas (_Clear Canvas_) & mereset timer               |
| **👆 Virtual Cursor / Dwell**      | Arahkan ujung jari telunjuk ke tombol menu & tahan selama 1 detik                    | Melakukan klik otomatis pada tombol tanpa menyentuh layar (_Touchless Click_)      |
| **✌️ Peace Sign & 👍 Thumbs Up**   | Pose dua jari (V) atau angkat jempol                                                 | Pose foto interaktif                                                               |

---

## 🛠️ Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat Sistem

- **Node.js** v18.17.0 atau versi lebih baru.
- **NPM** atau **Yarn** / **PNPM**.
- Kamera Web (Webcam built-in atau USB Webcam).
- Browser modern berbasis Chromium (Google Chrome, Microsoft Edge, Arc, atau
  Brave).

### 2. Instalasi Dependensi & Model AI

```bash
# Clone atau masuk ke direktori project
cd /path/to/touchless-photobooth

# Install paket dependensi
npm install

# Download binary model AI MediaPipe & aset WASM offline
npm run download-models
```

### 3. Menjalankan Mode Development

```bash
npm run dev
```

Aplikasi akan aktif di `http://localhost:3000`.

---

## 🖥️ Panduan Konfigurasi Layar Ganda (_Dual-Monitor Setup_)

Untuk pameran dengan 2 layar (misalnya Laptop + Monitor Eksternal/TV):

1. Hubungkan komputer ke monitor eksternal / proyektor via HDMI / Type-C.
2. Atur konfigurasi display di OS menjadi **Extended Desktop** (Bukan
   Mirroring).
3. Buka browser:
   - **Layar 1 (Menghadap Pengunjung):** Buka `http://localhost:3000`
     (Photobooth Interaktif).
   - **Layar 2 (Menghadap Penonton/Display Wall):** Buka
     `http://localhost:3000/gallery` dan tekan **F11** untuk layar penuh
     (_Fullscreen_).
4. Setiap foto yang diambil di Layar 1 akan langsung terpampang secara otomatis
   dengan efek animasi polaroid dan konfeti di Layar 2 secara real-time via
   `BroadcastChannel`.

---

## ⌨️ Shortcut Keyboard Cepat (Booth Operator)

- `Space`: Mengambil foto seketika (_Manual Shutter_).
- `C`: Membersihkan seluruh coretan gambar (_Clear Canvas_).
- `G`: Membuka / menutup panduan gestur (_Gesture Guide_).
- `F11`: Masuk / keluar mode layar penuh (_Fullscreen_).

---

## ☁️ Integrasi Google Apps Script (Google Drive Auto-Sync)

1. Buka [Google Apps Script Editor](https://script.google.com) dan buat project
   baru.
2. Salin seluruh isi file
   [`google-apps-script/Code.gs`](google-apps-script/Code.gs) ke dalam editor
   script.
3. Ubah variabel `FOLDER_ID` dengan ID Folder Google Drive publik Anda.
4. Klik **Deploy -> New deployment**, pilih jenis **Web app**, ubah akses **Who
   has access** menjadi **"Anyone"**, lalu klik **Deploy**.
5. Salin URL Web App yang dihasilkan.
6. Pada browser Photobooth, simpan URL ke penyimpanan lokal browser melalui
   console:
   ```javascript
   localStorage.setItem("pti_gas_webhook_url", "URL_WEB_APP_ANDA_DISINI");
   ```
   Foto yang diambil akan otomatis terunggah ke Google Drive dan siap diakses
   melalui QR Code.
