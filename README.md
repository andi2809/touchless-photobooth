# 📸 Touchless Interactive Photobooth & Dual-Display Live Showcase

> **Produksi untuk Pameran BEMP Pendidikan Teknik Informatika (PTI) Universitas Negeri Jakarta 2026**  
> Aplikasi Photobooth Interaktif Berbasis AI Computer Vision (*Touchless Gesture Control*) dengan Arsitektur Local-First, Zero-Backend, dan Sinkronisasi Layar Ganda (*Dual-Monitor*) secara Real-Time.

---

## ✨ Fitur Utama

1. **⚡ Zero-Backend & 100% Offline-Resilient**
   - MediaPipe Tasks Vision WebAssembly (`.wasm`) dan model AI (`hand_landmarker.task`) berjalan sepenuhnya di memori browser lokal (*in-browser GPU acceleration*).
   - Tidak memerlukan server eksternal untuk pengenalan gestur, filter canvas, maupun sinkronisasi tampilan.

2. **🖐️ Deteksi Gestur Matematika Murni (21 Landmark Tangan)**
   - **📐 Frame Capture (2 Tangan):** Membentuk kotak bingkai dengan jempol & telunjuk. Tahan selama 3 detik untuk memicu countdown & shutter foto otomatis dengan efek kedalaman **"Foto Kita Blur"** (latar belakang blur bokeh, subjek dalam frame super tajam!).
   - **✏️ Air Drawing (1 Jari Telunjuk):** Melukis garis neon bercahaya (*glow neon*) di udara secara real-time dengan kurva bezier mulus.
   - **✋ Wipe Canvas (Telapak Terbuka):** Menghapus seluruh coretan neon di layar dan mereset timer.
   - **✌️ Peace Sign & 👍 Thumbs Up:** Pose klasik pameran PTI BEMP.

3. **🖥️ Sinkronisasi Layar Ganda (*Dual-Monitor Showcase*) via Native BroadcastChannel API**
   - **Monitor 1 (`/`):** Layar photobooth interaktif menghadap pengunjung (Webcam mirror + Air Canvas + Focus Frame Layer + Glassmorphism HUD).
   - **Monitor 2 (`/gallery`):** Layar pameran menghadap audiens (*Audience Display Wall*) dengan pop-up polaroid instan, animasi konfeti (*canvas-confetti*), galeri masonry interaktif, dan banner QR Code download `s.id/foto-maba-pti`.

4. **🔊 Synthesizer Audio Mandiri (Web Audio API)**
   - Suara klik mekanis shutter kamera (*dual-click*), beep hitung mundur digital, chime frame lock, dan audio selebrasi tanpa ketergantungan file MP3 eksternal.

5. **☁️ Integrasi Google Apps Script (Google Drive Auto-Sync)**
   - Webhook mandiri untuk menyimpan otomatis hasil foto HD ke folder Google Drive publik.

---

## 🛠️ Panduan Instalasi & Menjalankan Aplikasi

### 1. Inisialisasi & Instalasi Dependensi
Jalankan perintah berikut di terminal:

```bash
# Masuk ke direktori project
cd /Users/revzly/Documents/dev/project/Pameran/touchless-photobooth

# Install dependensi
npm install

# Siapkan aset model AI lokal offline (WASM & hand_landmarker.task)
npm run download-models
```

### 2. Jalankan Mode Pengembangan (Local Dev)
```bash
npm run dev
```
Buka browser di **http://localhost:3000**

---

## 🖥️ Konfigurasi Layar Ganda (Dual-Monitor Setup di macOS)

1. Hubungkan MacBook Air M4 ke monitor eksternal / proyektor pameran.
2. Di macOS **System Settings -> Displays**, atur sebagai **Stop Mirroring / Extended Desktop**.
3. Buka Google Chrome atau Arc Browser:
   - **Layar Utama (Laptop / Monitor 1):** Buka `http://localhost:3000` (Photobooth Interaktif).
   - **Layar Eksternal (Monitor 2):** Buka `http://localhost:3000/gallery` dan tekan tombol **Fullscreen (F11 / Maximize)**.
4. Setiap foto yang diambil di Monitor 1 akan langsung terpampang dengan ledakan konfeti di Monitor 2 secara otomatis dalam hitungan milidetik!

---

## 📁 Struktur Direktori Project

```
Pameran/
├── google-apps-script/
│   └── Code.gs               # Standalone Google Apps Script untuk Google Drive Upload
├── public/
│   ├── models/
│   │   └── hand_landmarker.task # Model MediaPipe AI Offline
│   └── wasm/                 # MediaPipe WebAssembly Binaries
├── scripts/
│   └── download-models.mjs   # Script otomasi download model & copy wasm
├── src/
│   ├── app/
│   │   ├── gallery/
│   │   │   └── page.tsx      # Route 2: Monitor 2 Live Gallery Showcase
│   │   ├── globals.css       # Global styles & keyframe animations
│   │   ├── layout.tsx        # Next.js Root Layout
│   │   └── page.tsx          # Route 1: Main Photobooth Screen
│   ├── components/
│   │   ├── Gallery/
│   │   │   ├── PhotoGrid.tsx
│   │   │   ├── PolaroidPopup.tsx
│   │   │   └── QRCodeDisplay.tsx
│   │   └── Photobooth/
│   │       ├── AirCanvas.tsx
│   │       ├── BlurFocusLayer.tsx
│   │       ├── CameraView.tsx
│   │       ├── ControlHeader.tsx
│   │       ├── CountdownOverlay.tsx
│   │       ├── FlashOverlay.tsx
│   │       ├── GestureGuideModal.tsx
│   │       └── PhotoPreviewModal.tsx
│   ├── hooks/
│   │   ├── useBroadcastGallery.ts # Native BroadcastChannel API Sync
│   │   ├── useHandLandmarker.ts   # MediaPipe GPU HandLandmarker Hook
│   │   └── useSoundEffects.ts     # Web Audio API Synthesizer
│   ├── types/
│   │   └── photobooth.ts          # TypeScript Definitions & Types
│   └── utils/
│       ├── canvasRenderer.ts      # Neon stroke & HUD bracket routines
│       ├── frameComposite.ts      # Watermark & bokeh snapshot generator
│       └── gestureMath.ts         # Pure 21-landmark mathematical engine
├── next.config.mjs
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## ☁️ Pengaturan Google Drive Webhook

1. Buka [script.google.com](https://script.google.com) dan buat project baru.
2. Salin isi file `google-apps-script/Code.gs` ke editor.
3. Ubah `var FOLDER_ID = "..."` dengan ID Folder Google Drive Anda.
4. Klik **Deploy -> New deployment**, pilih jenis **Web app**, set akses ke **"Anyone"**, lalu klik **Deploy**.
5. Salin URL Web App yang didapat, lalu pada Photobooth dapat disimpan ke `localStorage.setItem('pti_gas_webhook_url', 'URL_ANDA')`.

---

## ⚡ Shortcut Keyboard (Pameran Stand)
- `Space`: Ambil foto manual (Manual Shutter).
- `C`: Hapus semua coretan udara (*Clear Canvas*).
- `G`: Buka modal panduan gestur (*Gesture Guide*).
- `F11`: Masuk / keluar mode layar penuh (*Fullscreen*).
