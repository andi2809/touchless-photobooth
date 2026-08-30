# 🔍 GESTURE DETECTION & HAND TRACKING — COMPREHENSIVE TECHNICAL AUDIT

**Project**: Touchless Photobooth PTIK UNJ  
**Auditor**: Antigravity AI  
**Tanggal Audit**: 30 Agustus 2026  
**Scope**: Seluruh pipeline deteksi gesture tangan dari MediaPipe hingga State Machine  

---

## Daftar Isi

1. [Arsitektur Pipeline & File yang Diaudit](#1-arsitektur-pipeline--file-yang-diaudit)
2. [Ringkasan Temuan Utama (Root Causes)](#2-ringkasan-temuan-utama-root-causes)
3. [Tabel Analisis Gestur](#3-tabel-analisis-gestur)
4. [Detail Temuan & Analisis Matematis](#4-detail-temuan--analisis-matematis)
5. [Rekomendasi Kode & Refactoring](#5-rekomendasi-kode--refactoring)
6. [Rencana Verifikasi](#6-rencana-verifikasi)

---

## 1. Arsitektur Pipeline & File yang Diaudit

### Flow Diagram Pipeline

```
┌──────────────────┐     ┌──────────────────────┐     ┌───────────────────────────┐
│  Webcam Stream   │────▶│  useHandLandmarker    │────▶│  MediaPipe HandLandmarker │
│  (1920x1080)     │     │  hooks/               │     │  GPU + WASM               │
└──────────────────┘     └──────────────────────┘     └─────────┬─────────────────┘
                                                                │
                                                    NormalizedLandmark[][]
                                                                │
                                                                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  page.tsx — requestAnimationFrame Detection Loop (60 FPS)                    │
│  ┌─────────────────────┐    ┌────────────────────────────────────────────┐  │
│  │ detectHands()       │───▶│ GestureStabilizer.processFrame()           │  │
│  │ (raw landmarks)     │    │                                            │  │
│  └─────────────────────┘    │  ┌──────────────────────────────────────┐  │  │
│                             │  │ SwipeTracker.update()                │  │  │
│                             │  │ (dynamic motion detection)           │  │  │
│                             │  └──────────────────────────────────────┘  │  │
│                             │                                            │  │
│                             │  ┌──────────────────────────────────────┐  │  │
│                             │  │ classifyInstantStaticGesture()       │  │  │
│                             │  │  ├─ detectOkSign()                  │  │  │
│                             │  │  ├─ detectPeaceSign()               │  │  │
│                             │  │  ├─ detectLSign()                   │  │  │
│                             │  │  ├─ detectThumbsDown()              │  │  │
│                             │  │  ├─ detectThumbsUp()                │  │  │
│                             │  │  └─ detectOpenPalm()                │  │  │
│                             │  └──────────────────────────────────────┘  │  │
│                             │                                            │  │
│                             │  ┌──────────────────────────────────────┐  │  │
│                             │  │ Sliding Window Majority Vote         │  │  │
│                             │  │ (7-frame window, 5/7 threshold)     │  │  │
│                             │  └──────────────────────────────────────┘  │  │
│                             │                                            │  │
│                             │  ┌──────────────────────────────────────┐  │  │
│                             │  │ Edge-Triggered Event Emission        │  │  │
│                             │  │ (350ms cooldown, change detection)   │  │  │
│                             │  └──────────────────────────────────────┘  │  │
│                             └────────────────────────────┬───────────────┘  │
└──────────────────────────────────────────────────────────┼──────────────────┘
                                                           │
                                               NormalizedGestureEvent
                                                           │
                                                           ▼
                                            ┌──────────────────────────┐
                                            │ useBoothStateMachine     │
                                            │ handleGestureEvent()     │
                                            │ (2.0s transition lock)   │
                                            └──────────────────────────┘
```

### File yang Diaudit

| # | File | Baris | Peran |
|---|------|-------|-------|
| 1 | `src/utils/gestureDetector.ts` | 542 | **Core classifier** — semua fungsi deteksi gestur & stabilizer |
| 2 | `src/utils/gestureMath.ts` | 373 | **DEAD CODE** — duplikat divergen, tidak pernah diimport |
| 3 | `src/hooks/useHandLandmarker.ts` | 295 | MediaPipe init, kamera, `detectHands()` |
| 4 | `src/hooks/useBoothStateMachine.ts` | 428 | State machine, gesture event handler, cooldown |
| 5 | `src/app/page.tsx` | 488 | Detection loop (rAF), landmark refs |
| 6 | `src/components/Photobooth/HandLandmarkCanvas.tsx` | 304 | Skeleton rendering (EMA smoothing) |
| 7 | `src/types/boothState.ts` | 64 | Type definitions untuk gestur & state |
| 8 | `src/types/photobooth.ts` | 125 | Type definitions untuk landmark & data |

---

## 2. Ringkasan Temuan Utama (Root Causes)

### RC-1: 🔴 Absolute Y-Coordinate Assumptions (Orientation Blindness)

**Lokasi**: `gestureDetector.ts` — `isFingerExtended()` baris 30, `detectThumbsUp()` baris 166, `detectThumbsDown()` baris 196

**Deskripsi**: 
Semua gesture classifier menggunakan `tip.y < pip.y` sebagai sinyal utama "jari terangkat ke atas." Ini **hanya benar jika tangan tegak lurus sempurna**. Dalam koordinat MediaPipe, `y=0` adalah atas layar, `y=1` adalah bawah layar. Ketika tangan dimiringkan 45° ke samping, perbandingan Y menjadi tidak bermakna karena ujung jari bisa memiliki Y yang sama dengan sendi PIP meskipun jari sepenuhnya terentang.

**Dampak**:
- ✌️ Peace Sign gagal terdeteksi saat tangan miring >30°
- 👍 Thumbs Up gagal saat pergelangan tangan dirotasi
- 👆 L-Sign tidak konsisten pada orientasi miring
- 🖐️ Open Palm gagal saat tangan rileks dengan sedikit kemiringan

**Bukti Kode**:
```typescript
// gestureDetector.ts baris 30
const isHigherThanPip = tip.y < pip.y;  // ❌ Asumsi orientasi tegak

// gestureDetector.ts baris 166
const thumbPointingUp = thumbTip.y < thumbIp.y && thumbTip.y < thumbMcp.y; // ❌

// gestureDetector.ts baris 196  
const thumbPointingDown = thumbTip.y > thumbIp.y && thumbTip.y > thumbMcp.y; // ❌
```

---

### RC-2: 🔴 Non-Scale-Invariant Absolute Thresholds

**Lokasi**: Tersebar di seluruh `gestureDetector.ts`

**Deskripsi**:
Beberapa threshold menggunakan nilai absolut dalam koordinat ternormalisasi (0-1), bukan relatif terhadap `handScale`. Nilai-nilai ini dikalibrasi untuk jarak tertentu dari webcam. Saat user berdiri lebih jauh (tangan tampak kecil) atau lebih dekat (tangan tampak besar), threshold absolut mendominasi dan menghasilkan hasil yang salah.

**Contoh Threshold Absolut Bermasalah**:

| Lokasi | Kode | Masalah |
|--------|------|---------|
| `detectOkSign()` L108 | `thumbIndexDist < 0.095` | Fallback absolut: false positive di jarak dekat |
| `isThumbExtended()` L76 | `distThumbTipToIndexMcp > 0.055` | Threshold absolut: false negative di jarak jauh |
| `detectPeaceSign()` L147-148 | `indexTip.y < ringTip.y - 0.035` | Gap absolut: terlalu ketat di jarak jauh, terlalu longgar di dekat |
| `isFingerFolded()` L56 | `tip.y >= pip.y - 0.025` | Toleransi absolut: marking finger as folded terlalu mudah |
| `SwipeTracker` L346 | `minDisplacement = 0.07` | 7% layar: terlalu sensitif untuk swipe |

**Ilustrasi Skala**:
```
Tangan Jauh (handScale ≈ 0.08):
  thumbIndexDist aktual saat OK = 0.03
  threshold absolut 0.095 >>> 0.03 → ✅ terlalu mudah pass

Tangan Dekat (handScale ≈ 0.25):
  thumbIndexDist aktual saat jari terpisah = 0.08
  threshold absolut 0.095 > 0.08 → ❌ false positive!
```

---

### RC-3: 🔴 `isFingerFolded()` Over-Permissive OR Logic

**Lokasi**: `gestureDetector.ts` baris 40-61

**Deskripsi**:
Fungsi `isFingerFolded()` menggunakan logika `||` (OR) di antara tiga kondisi. Artinya jika **satu saja** kondisi terpenuhi, jari dianggap terlipat. Dikombinasikan dengan threshold longgar `tip.y >= pip.y - 0.025` (yang hampir selalu true saat tangan sedikit miring), bahkan jari setengah terentang bisa terklasifikasi sebagai "folded."

**Kode Bermasalah**:
```typescript
// gestureDetector.ts baris 56-60
const isLowerThanPip = tip.y >= pip.y - 0.025;           // ❌ Toleransi 0.025 terlalu besar
const isTuckedNearWrist = distWristToTip < distWristToPip * 1.12; // ❌ Rasio 1.12 terlalu longgar
const isTuckedNearMcp = distMcpToTip < distMcpToPip * 1.05;

return isLowerThanPip || isTuckedNearWrist || isTuckedNearMcp;  // ❌ OR = terlalu permisif
```

**Analisis Kasus Gagal**:
Jika tangan sedikit miring 15° ke bawah:
- `tip.y` akan hampir sama dengan `pip.y` → `isLowerThanPip = true` (padahal jari terentang!)
- Karena `||`, langsung return `true` → jari dianggap terlipat
- Akibatnya: Peace Sign, Thumbs Up, dan Thumbs Down bisa false-positive trigger

**Dampak Cascading**:
Karena hampir semua gesture detector memanggil `isFingerFolded()`:
- `detectPeaceSign()` → cek ring & pinky folded → false positive
- `detectThumbsUp()` → cek 4 jari folded → false positive  
- `detectThumbsDown()` → cek 4 jari folded → false positive
- `detectLSign()` → cek middle, ring, pinky folded → false positive (paling parah)

---

### RC-4: 🟡 Priority Ordering Creates Systematic Gesture Masking

**Lokasi**: `gestureDetector.ts` baris 290-329 (`classifyInstantStaticGesture()`)

**Deskripsi**:
Classifier menggunakan strict if-else cascade dengan urutan prioritas tetap:

```
1. OK_SIGN   (👌) — diperiksa PERTAMA
2. PEACE     (✌️) — diperiksa KEDUA
3. L_SIGN    (👆L) — diperiksa KETIGA
4. THUMBS_DOWN (👎)
5. THUMBS_UP   (👍)
6. OPEN_PALM   (🖐️) — diperiksa TERAKHIR
```

**Masalah Masking**:

| Skenario | Harapan User | Hasil Aktual | Penyebab |
|----------|-------------|--------------|----------|
| Peace ✌️ dengan ibu jari dekat ke telapak | PEACE | OK_SIGN | Jarak thumb-index cukup kecil untuk trigger OK circle check, dan OK diperiksa sebelum Peace |
| Thumbs Down 👎 | THUMBS_DOWN | L_SIGN | L-Sign hanya butuh index extended + thumb out + jari lain "folded" (terlalu loose). Karena L_SIGN diperiksa sebelum THUMBS_DOWN, L-Sign selalu menang |
| Pointing (telunjuk) | Seharusnya IDLE | L_SIGN | Detector L-Sign terlalu longgar sehingga pointing finger sering diidentifikasi sebagai L |

**Kode**:
```typescript
// classifyInstantStaticGesture() — strict cascade
if (detectOkSign(landmarks)) return { gesture: 'OK_SIGN', ... };  // ← PERTAMA
if (detectPeaceSign(landmarks)) return { gesture: 'PEACE', ... }; // ← KEDUA (terblokir OK)
if (detectLSign(landmarks)) return { gesture: 'L_SIGN', ... };    // ← KETIGA (memblokir Thumbs)
if (detectThumbsDown(landmarks)) ...                               // ← KEEMPAT (terblokir L)
```

---

### RC-5: 🟡 Dead Code & Divergent Duplicate Logic

**Lokasi**: `src/utils/gestureMath.ts` (373 baris)

**Deskripsi**:
File `gestureMath.ts` berisi **salinan independen lengkap** dari fungsi-fungsi deteksi gesture (`isFingerExtended`, `isFingerFolded`, `isThumbExtended`, `detectPeaceSign`, `detectOpenPalm`, `detectThumbsUp`) dengan **threshold yang BERBEDA** dari `gestureDetector.ts`.

**Tidak pernah diimport oleh file manapun dalam project.**

Konfirmasi via grep:
```
$ grep -r "gestureMath" src/
→ (0 results)

$ grep -r "from '@/utils/gestureDetector'" src/
→ src/app/page.tsx: import { GestureStabilizer } from '@/utils/gestureDetector';
```

**Perbedaan Threshold (Contoh)**:

| Fungsi | `gestureDetector.ts` | `gestureMath.ts` |
|--------|---------------------|-----------------|
| `isFingerExtended` wrist ratio | `1.05` | `1.1` |
| `isFingerFolded` wrist ratio | `1.12` | `1.05` |
| `isThumbExtended` distance | `0.055` | `0.08` |
| `isThumbExtended` wrist ratio | `1.12` | `1.15` |
| `detectThumbsUp` extension ratio | `1.08` | `1.3` |
| `detectOpenPalm` spread checks | Tidak ada | `> 0.06`, `> 0.035` |
| `detectPeaceSign` spread check | Tidak ada | `> 0.04` |

**Risiko**: Developer di masa depan mungkin mengedit `gestureMath.ts` dengan asumsi itu file yang aktif, padahal tidak ada efeknya.

---

## 3. Tabel Analisis Gestur

| # | Gesture | Tipe Issue | Flaw yang Ditemukan | Penyebab Matematis/Logika | Severity |
|---|---------|-----------|---------------------|---------------------------|----------|
| 1 | ✌️ Peace Sign | False Negative | Gagal terdeteksi saat tangan miring >30° | `isFingerExtended()` membutuhkan `tip.y < pip.y` (perbandingan Y absolut), gagal pada tangan miring | 🔴 Critical |
| 2 | ✌️ Peace Sign | False Negative | Gagal di jarak jauh dari kamera | `indexTip.y < ringTip.y - 0.035` threshold absolut; pada jarak jauh 0.035 bisa melebihi gap antar jari sebenarnya | 🟡 Medium |
| 3 | 👌 OK Sign | False Positive | Masking/memblokir Peace Sign | `thumbIndexDist < 0.095` fallback absolut: saat thumb & index tips kebetulan berdekatan selama peace, OK trigger duluan karena prioritas | 🔴 Critical |
| 4 | 👌 OK Sign | False Positive | Trigger terlalu mudah di jarak dekat | `handScale * 0.45` threshold circle terlalu generous; di jarak dekat handScale besar sehingga `0.45 * handScale` bisa sampai 5cm — terlalu lebar | 🟡 Medium |
| 5 | 👍 Thumbs Up | False Negative | Gagal dengan kemiringan tangan natural | `thumbTip.y < thumbIp.y && thumbTip.y < thumbMcp.y` membutuhkan ibu jari tepat vertikal ke atas — gagal dengan rotasi pergelangan 20° | 🔴 Critical |
| 6 | 👍 Thumbs Up | Misclassification | Tertukar dengan L-Sign | Detector L-Sign memiliki pengecekan fold jari tengah terlalu longgar (`middleTip.y > indexTip.y + 0.02`) yang overlap dengan postur thumbs-up. L-Sign diperiksa lebih dulu. | 🟡 Medium |
| 7 | 👎 Thumbs Down | False Negative | Gagal saat tangan miring | Masalah Y absolut sama dengan Thumbs Up (`thumbTip.y > thumbIp.y`) | 🟡 Medium |
| 8 | 👆 L-Sign | False Positive | Trigger terlalu sering / tidak semestinya | Kondisi fold menggunakan `\|\|` dengan threshold sangat longgar; hampir semua tangan dengan telunjuk terangkat + ibu jari sedikit keluar memicu L-Sign. `middleFolded` mengizinkan `getDistance(wrist, middleTip) < getDistance(wrist, middleMcp) * 1.45` — rasio 1.45 sangat generous | 🔴 Critical |
| 9 | 🖐️ Open Palm | False Negative | Gagal saat jari sedikit melengkung (rileks) | `isFingerExtended()` membutuhkan SEMUA 5 jari pass `tip.y < pip.y` — telapak tangan terbuka rileks dengan jari manis sedikit melengkung gagal | 🟡 Medium |
| 10 | 👈👉 Swipe | False Positive | Phantom swipe saat tangan diam | `isHorizontal` memiliki fallback `Math.abs(dy) < 0.08` absolut — artinya drift horizontal kecil saat tangan diam statis bisa memicu swipe | 🟡 Medium |
| 11 | Semua Gestur | Systemic | `isFingerFolded()` over-permisif | `return isLowerThanPip \|\| isTuckedNearWrist \|\| isTuckedNearMcp` — **satu saja** kondisi true = jari "terlipat". `isLowerThanPip = tip.y >= pip.y - 0.025` artinya jari pada ketinggian yang sama dengan PIP sudah dianggap terlipat | 🔴 Critical |
| 12 | Semua Gestur | Design Flaw | Hardcoded confidence (tidak pernah dihitung) | `classifyInstantStaticGesture()` selalu return `confidence: 0.95` tanpa mempertimbangkan seberapa marginal deteksinya — tidak ada metrik confidence sejati | 🟡 Medium |
| 13 | Semua Gestur | Missing Feature | Data `handedness` dibuang — tidak ada pembedaan kiri/kanan | MediaPipe menyediakan `result.handedness` tapi `detectHands()` meng-stripnya. Orientasi ibu jari berbeda antara tangan kiri dan kanan. | 🟡 Medium |
| 14 | Semua Gestur | Missing Feature | Kedalaman Z sepenuhnya diabaikan | MediaPipe menyediakan `z` per-landmark (kedalaman relatif terhadap wrist). Ini bisa membedakan jari melengkung vs terentang dari orientasi apapun, tapi tidak pernah digunakan. | 🟡 Medium |

---

## 4. Detail Temuan & Analisis Matematis

### 4.1 Analisis `isFingerExtended()` — Baris 14-35

```typescript
export function isFingerExtended(
  tipIdx: number, pipIdx: number, mcpIdx: number,
  wrist: NormalizedLandmark, landmarks: NormalizedLandmark[]
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const distWristToTip = getDistance(wrist, tip);
  const distWristToPip = getDistance(wrist, pip);
  const distMcpToTip = getDistance(mcp, tip);
  const distMcpToPip = getDistance(mcp, pip);

  const isHigherThanPip = tip.y < pip.y;                      // ← MASALAH 1
  const isFarFromWrist = distWristToTip > distWristToPip * 1.05;  // ← MASALAH 2
  const isFarFromMcp = distMcpToTip > distMcpToPip * 1.05;       // ← MASALAH 2

  return isHigherThanPip && isFarFromWrist && isFarFromMcp;       // ← MASALAH 3
}
```

**MASALAH 1 — `tip.y < pip.y` Orientation Dependent**:

Dalam koordinat MediaPipe normalized (0,0 = kiri-atas, 1,1 = kanan-bawah):
- Tangan tegak: ujung jari memiliki Y lebih kecil dari PIP → `true` ✅
- Tangan miring 90° horizontal: ujung jari memiliki Y ≈ PIP → `false` ❌
- Tangan terbalik: ujung jari memiliki Y lebih besar dari PIP → `false` ❌

Ini berarti gestur Peace, Thumbs Up, dan Open Palm **hanya bekerja saat tangan tegak sempurna**.

**MASALAH 2 — Multiplier `1.05` Terlalu Ketat**:

Rasio `1.05` berarti ujung jari harus 5% lebih jauh dari wrist dibanding PIP. Untuk jari yang terentang normal, rasio tipikal adalah 1.15-1.30. Namun saat jari sedikit rileks (bengkok alami), rasio bisa turun ke 1.03-1.08. Threshold `1.05` berada tepat di zona ambigu.

**MASALAH 3 — Semua Kondisi Harus True (AND)**:

Karena menggunakan `&&`, kondisi Y absolut (`isHigherThanPip`) menjadi veto — jika gagal, seluruh fungsi gagal meskipun kedua distance check pass.

---

### 4.2 Analisis `isFingerFolded()` — Baris 40-61

```typescript
const isLowerThanPip = tip.y >= pip.y - 0.025;
const isTuckedNearWrist = distWristToTip < distWristToPip * 1.12;
const isTuckedNearMcp = distMcpToTip < distMcpToPip * 1.05;

return isLowerThanPip || isTuckedNearWrist || isTuckedNearMcp;
```

**Analisis Probabilistik**:

Untuk jari yang terentang sempurna:
- `isLowerThanPip`: Dengan toleransi `0.025`, jari dengan kemiringan tangan >15° → **~50% chance true**
- `isTuckedNearWrist`: Rasio `1.12` generous → **~20% chance true** pada jari yang terentang
- `isTuckedNearMcp`: Rasio `1.05` tight → **~15% chance true** pada jari yang terentang

Probabilitas setidaknya satu true (asumsi independen):
```
P(folded | extended) = 1 - (1-0.50)(1-0.20)(1-0.15) = 1 - 0.34 = 0.66 = 66%
```

**Artinya jari yang sebenarnya terentang memiliki ~66% peluang salah diklasifikasi sebagai "folded"!**

---

### 4.3 Analisis `detectOkSign()` — Baris 83-123

```typescript
const isCircleFormed = thumbIndexDist < handScale * 0.45 || thumbIndexDist < 0.095;
```

**Masalah Fallback Absolut `0.095`**:

| Jarak User | handScale | Threshold Relatif | Threshold Absolut | Yang Berlaku |
|------------|-----------|-------------------|-------------------|-------------|
| Jauh (2m) | 0.08 | 0.036 | 0.095 | **0.095** (absolut dominan) |
| Normal (1m) | 0.15 | 0.068 | 0.095 | **0.095** (absolut dominan) |
| Dekat (0.3m) | 0.30 | 0.135 | 0.095 | **0.135** (relatif dominan) |

Di jarak jauh, threshold absolut `0.095` sangat besar relatif terhadap ukuran tangan (`handScale ≈ 0.08`). Ini berarti **hampir semua posisi jari** memenuhi circle check → false positive masif.

---

### 4.4 Analisis `detectLSign()` — Baris 220-268

```typescript
const middleFolded =
  getDistance(wrist, middleTip) < getDistance(wrist, middleMcp) * 1.45 ||  // ❌
  middleTip.y > indexTip.y + 0.02;                                        // ❌
```

**Rasio 1.45 Sangat Longgar**:

Pada tangan normal, rasio jarak wrist-ke-middleTip vs wrist-ke-middleMcp saat jari terentang penuh ≈ 1.5-1.7. Threshold `1.45` artinya jari tengah yang **hampir sepenuhnya terentang** (hanya sedikit melengkung) sudah dianggap "folded."

Ditambah `||` dengan `middleTip.y > indexTip.y + 0.02` yang hanya butuh jari tengah 0.02 lebih rendah dari telunjuk — ini hampir selalu true karena jari tengah secara alami sedikit lebih rendah dari telunjuk saat menunjuk.

**Hasil**: L-Sign detector menjadi sangat agresif dan fire pada hampir semua postur "menunjuk."

---

### 4.5 Analisis `SwipeTracker` — Baris 343-417

```typescript
const isHorizontal = Math.abs(dy) < Math.abs(dx) * 0.95 || Math.abs(dy) < 0.08;
```

**Masalah `dy < 0.08` Absolut**:

Ini berarti bahkan gerakan vertikal sampai 8% tinggi layar masih dianggap "horizontal." Saat user memegang tangan diam tapi landmark bergeser sedikit akibat jitter MediaPipe (yang tipikal ~0.02-0.05 per frame), akumulasi displacement bisa mencapai `0.07` (threshold swipe) dalam 400ms window.

```
Jitter per frame ≈ 0.015
Akumulasi 400ms (24 frames) ≈ drift random walk √24 × 0.015 ≈ 0.073
minDisplacement = 0.07

→ Phantom swipe terpicu!
```

---

### 4.6 Analisis `GestureStabilizer` Event Re-fire — Baris 502-520

```typescript
if (this.currentStableGesture !== 'IDLE') {
  const isNewGesture = this.currentStableGesture !== this.lastEmittedGesture;
  const passedCooldown = timestamp - this.lastEmittedTime >= this.staticCooldownMs;

  if (isNewGesture || passedCooldown) {  // ← MASALAH: "|| passedCooldown"
    // emit event
  }
}
```

**Masalah Re-fire**:

Kondisi `|| passedCooldown` berarti gestur yang SAMA akan terus di-emit ulang setiap 350ms selama user mempertahankan posisi tangan. Ini menyebabkan:

- Dalam state `READY`: menahan Peace → countdown dimulai, selesai, **lalu mulai lagi** karena re-fire
- Dalam state `FRAME_SELECTION`: menahan OK Sign → frame terkonfirmasi, tapi 350ms kemudian mungkin trigger aksi lain

State machine di `useBoothStateMachine.ts` memiliki cooldown `TRANSITION_COOLDOWN_MS = 2000ms` yang mengurangi dampak ini, tapi tidak menghilangkannya sepenuhnya.

---

### 4.7 Analisis Dual requestAnimationFrame Loop

```
Loop 1: page.tsx (baris 90-124) — Detection + Gesture Processing
Loop 2: HandLandmarkCanvas.tsx (baris 44-286) — Skeleton Rendering
```

Kedua loop berjalan independen pada 60fps. Loop 2 melakukan EMA smoothing pada landmark untuk rendering visual, tapi **smoothed landmarks tidak digunakan untuk gesture detection**. Gesture detection menggunakan raw unsmoothed landmarks dari Loop 1.

**Implikasi**: Jitter landmark dari MediaPipe langsung masuk ke gesture classifier tanpa peredaman temporal. Hanya sliding window voting (7 frame) yang meredam, tapi jitter **di dalam satu frame** tidak di-smooth.

---

### 4.8 Data MediaPipe yang Dibuang

**`handedness`** — Tidak diekstrak:
```typescript
// useHandLandmarker.ts baris 250-258
if (result && result.landmarks) {
  return result.landmarks.map((hand) =>
    hand.map((pt) => ({
      x: pt.x,
      y: pt.y,
      z: pt.z,
      visibility: pt.visibility,
    }))
  );
}
// result.handedness TIDAK diambil!
```

**`z` coordinate** — Diekstrak tapi tidak pernah digunakan:
```typescript
// Seluruh gestureDetector.ts: 0 referensi ke .z
// getDistance() hanya menghitung 2D: Math.hypot(p1.x - p2.x, p1.y - p2.y)
```

Koordinat `z` dari MediaPipe menunjukkan kedalaman landmark relatif terhadap wrist. Jari yang terlipat ke dalam memiliki `z` yang berbeda dari jari yang terentang — informasi ini bisa sangat membantu klasifikasi tapi sepenuhnya diabaikan.

---

## 5. Rekomendasi Kode & Refactoring

### 5.1 Fix `isFingerExtended()` — Rotation-Tolerant Projection

**Sebelum**:
```typescript
export function isFingerExtended(
  tipIdx: number, pipIdx: number, mcpIdx: number,
  wrist: NormalizedLandmark, landmarks: NormalizedLandmark[]
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const distWristToTip = getDistance(wrist, tip);
  const distWristToPip = getDistance(wrist, pip);
  const distMcpToTip = getDistance(mcp, tip);
  const distMcpToPip = getDistance(mcp, pip);

  const isHigherThanPip = tip.y < pip.y;
  const isFarFromWrist = distWristToTip > distWristToPip * 1.05;
  const isFarFromMcp = distMcpToTip > distMcpToPip * 1.05;

  return isHigherThanPip && isFarFromWrist && isFarFromMcp;
}
```

**Sesudah**:
```typescript
export function isFingerExtended(
  tipIdx: number, pipIdx: number, mcpIdx: number,
  wrist: NormalizedLandmark, landmarks: NormalizedLandmark[]
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  // Primary: distance ratio (rotation-invariant)
  const distWristToTip = getDistance(wrist, tip);
  const distWristToPip = getDistance(wrist, pip);
  const distMcpToTip = getDistance(mcp, tip);
  const distMcpToPip = getDistance(mcp, pip);

  const isFarFromWrist = distWristToTip > distWristToPip * 1.02;
  const isFarFromMcp = distMcpToTip > distMcpToPip * 1.02;

  // Secondary: Axis-projection — tip extends beyond PIP along the finger bone direction
  const axisX = pip.x - mcp.x;
  const axisY = pip.y - mcp.y;
  const toTipX = tip.x - mcp.x;
  const toTipY = tip.y - mcp.y;
  const axisLen = Math.hypot(axisX, axisY);
  const projection = axisLen > 0.001
    ? (toTipX * axisX + toTipY * axisY) / (axisLen * axisLen)
    : 0;

  // projection > 1.0 = tip extends beyond PIP along finger bone direction
  const isAligned = projection > 0.95;

  // Accept if EITHER (both distance checks) OR (aligned + at least one distance check)
  return (isFarFromWrist && isFarFromMcp) || (isAligned && (isFarFromWrist || isFarFromMcp));
}
```

**Penjelasan Matematis**:

Projection method menghitung seberapa jauh ujung jari (tip) terproyeksi sepanjang sumbu tulang jari (vektor MCP→PIP). Nilai proyeksi:
- `< 1.0`: tip belum melewati PIP → jari belum terentang
- `≈ 1.0`: tip tepat di posisi PIP → ambang batas
- `> 1.0`: tip melewati PIP → jari terentang

Metode ini bekerja di **orientasi tangan apapun** karena mengukur ekstensi sepanjang sumbu jari itu sendiri, bukan sumbu Y global.

---

### 5.2 Fix `isFingerFolded()` — Majority Vote

**Sebelum**:
```typescript
export function isFingerFolded(
  tipIdx: number, pipIdx: number, mcpIdx: number,
  wrist: NormalizedLandmark, landmarks: NormalizedLandmark[]
): boolean {
  // ...
  const isLowerThanPip = tip.y >= pip.y - 0.025;
  const isTuckedNearWrist = distWristToTip < distWristToPip * 1.12;
  const isTuckedNearMcp = distMcpToTip < distMcpToPip * 1.05;

  return isLowerThanPip || isTuckedNearWrist || isTuckedNearMcp;
}
```

**Sesudah**:
```typescript
export function isFingerFolded(
  tipIdx: number, pipIdx: number, mcpIdx: number,
  wrist: NormalizedLandmark, landmarks: NormalizedLandmark[]
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const distWristToTip = getDistance(wrist, tip);
  const distWristToPip = getDistance(wrist, pip);
  const distMcpToTip = getDistance(mcp, tip);
  const distMcpToPip = getDistance(mcp, pip);

  // Distance checks (rotation-invariant)
  const isTuckedNearWrist = distWristToTip < distWristToPip * 1.05;
  const isTuckedNearMcp = distMcpToTip < distMcpToPip * 1.0;

  // Projection check: tip does NOT extend beyond PIP along finger axis
  const axisX = pip.x - mcp.x;
  const axisY = pip.y - mcp.y;
  const toTipX = tip.x - mcp.x;
  const toTipY = tip.y - mcp.y;
  const axisLen = Math.hypot(axisX, axisY);
  const projection = axisLen > 0.001
    ? (toTipX * axisX + toTipY * axisY) / (axisLen * axisLen)
    : 0;
  const isRetracted = projection < 0.85;

  // Majority voting: at least 2 of 3 signals must agree
  const signals = [isTuckedNearWrist, isTuckedNearMcp, isRetracted];
  const trueCount = signals.filter(Boolean).length;
  return trueCount >= 2;
}
```

---

### 5.3 Fix `detectOkSign()` — Remove Absolute Fallback & Add Peace Guard

```diff
- const isCircleFormed = thumbIndexDist < handScale * 0.45 || thumbIndexDist < 0.095;
+ const isCircleFormed = thumbIndexDist < handScale * 0.40;

  // ... existing middle/ring/pinky checks ...

+ // Guard: Index tip must be CLOSER to thumb than to its own MCP
+ const indexNearThumb = thumbIndexDist < getDistance(indexTip, landmarks[5]) * 0.7;

- return isCircleFormed && extendedCount >= 2 && middleAboveIndex;
+ return isCircleFormed && extendedCount >= 2 && middleAboveIndex && indexNearThumb;
```

---

### 5.4 Fix `detectPeaceSign()` — Scale-Relative Separation

```diff
- const indexAboveRing = indexTip.y < ringTip.y - 0.035;
- const middleAbovePinky = middleTip.y < pinkyTip.y - 0.035;
+ const indexFurtherThanRing = getDistance(wrist, indexTip) > getDistance(wrist, ringTip) * 1.15;
+ const middleFurtherThanPinky = getDistance(wrist, middleTip) > getDistance(wrist, pinkyTip) * 1.15;

- return indexUp && middleUp && ringFolded && pinkyFolded && indexAboveRing && middleAbovePinky;
+ return indexUp && middleUp && ringFolded && pinkyFolded && indexFurtherThanRing && middleFurtherThanPinky;
```

---

### 5.5 Fix `detectThumbsUp()` & `detectThumbsDown()` — Direction Vector

**Thumbs Up — Sebelum**:
```typescript
const thumbPointingUp = thumbTip.y < thumbIp.y && thumbTip.y < thumbMcp.y;
```

**Thumbs Up — Sesudah**:
```typescript
const thumbDirY = thumbTip.y - wrist.y;
const fistCenterY = (landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 4;
const thumbPointingUp = thumbDirY < -0.02 && thumbTip.y < fistCenterY;
```

**Thumbs Down — Sebelum**:
```typescript
const thumbPointingDown = thumbTip.y > thumbIp.y && thumbTip.y > thumbMcp.y;
```

**Thumbs Down — Sesudah**:
```typescript
const thumbDirY = thumbTip.y - wrist.y;
const fistCenterY = (landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 4;
const thumbPointingDown = thumbDirY > 0.02 && thumbTip.y > fistCenterY;
```

---

### 5.6 Fix `detectLSign()` — Tighten Fold Checks & Add Angle Verification

```diff
- const middleFolded =
-   getDistance(wrist, middleTip) < getDistance(wrist, middleMcp) * 1.45 ||
-   middleTip.y > indexTip.y + 0.02;
+ const middleFolded = isFingerFolded(12, 10, 9, wrist, landmarks);

- if (thumbIndexSpread < handScale * 0.38 && thumbIndexSpread < 0.08) {
+ if (thumbIndexSpread < handScale * 0.45) {
    return false;
  }
+
+ // Verify L-angle: thumb and index must form roughly 60-120 degree angle
+ const thumbVecX = thumbTip.x - wrist.x;
+ const thumbVecY = thumbTip.y - wrist.y;
+ const indexVecX = indexTip.x - wrist.x;
+ const indexVecY = indexTip.y - wrist.y;
+ const dot = thumbVecX * indexVecX + thumbVecY * indexVecY;
+ const mag = Math.hypot(thumbVecX, thumbVecY) * Math.hypot(indexVecX, indexVecY);
+ const cosAngle = mag > 0.001 ? dot / mag : 1;
+ const angleDeg = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
+ if (angleDeg < 40 || angleDeg > 140) return false;
```

---

### 5.7 Fix `classifyInstantStaticGesture()` — Reorder Priority & Add Ambiguity Detection

**Sebelum** (strict cascade OK → Peace → L → Thumbs):
```typescript
if (detectOkSign(landmarks)) return { gesture: 'OK_SIGN', confidence: 0.95 };
if (detectPeaceSign(landmarks)) return { gesture: 'PEACE', confidence: 0.95 };
if (detectLSign(landmarks)) return { gesture: 'L_SIGN', confidence: 0.95 };
// ...
```

**Sesudah** (evaluate all → pick best → reduce confidence on ambiguity):
```typescript
export function classifyInstantStaticGesture(landmarks: NormalizedLandmark[]): {
  gesture: NormalizedGestureType;
  confidence: number;
} {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'IDLE', confidence: 0 };
  }

  type Candidate = { gesture: NormalizedGestureType; confidence: number; priority: number };
  const candidates: Candidate[] = [];

  // Evaluate ALL detectors — higher priority number = lower priority
  if (detectPeaceSign(landmarks))  candidates.push({ gesture: 'PEACE',       confidence: 0.93, priority: 1 });
  if (detectOkSign(landmarks))     candidates.push({ gesture: 'OK_SIGN',     confidence: 0.92, priority: 2 });
  if (detectThumbsDown(landmarks)) candidates.push({ gesture: 'THUMBS_DOWN', confidence: 0.91, priority: 3 });
  if (detectThumbsUp(landmarks))   candidates.push({ gesture: 'THUMBS_UP',   confidence: 0.90, priority: 4 });
  if (detectLSign(landmarks))      candidates.push({ gesture: 'L_SIGN',      confidence: 0.88, priority: 5 });
  if (detectOpenPalm(landmarks))   candidates.push({ gesture: 'OPEN_PALM',   confidence: 0.85, priority: 6 });

  if (candidates.length === 1) {
    return { gesture: candidates[0].gesture, confidence: candidates[0].confidence };
  }

  if (candidates.length > 1) {
    candidates.sort((a, b) => a.priority - b.priority);
    return {
      gesture: candidates[0].gesture,
      confidence: candidates[0].confidence * 0.75, // Reduced: ambiguity detected
    };
  }

  return { gesture: 'IDLE', confidence: 0.4 };
}
```

**Perubahan Kunci**:
1. **Peace sekarang prioritas TERTINGGI** (sebelumnya OK_SIGN) — mencegah OK masking Peace
2. **L-Sign diturunkan ke prioritas terendah** — mencegah masking Thumbs gestures
3. **Deteksi ambiguitas**: jika >1 gestur terdeteksi bersamaan, confidence dikurangi 25%

---

### 5.8 Fix `GestureStabilizer` — Remove Re-fire & Enlarge Window

```diff
- private readonly windowSize = 7;
- private readonly majorityThreshold = 5;
+ private readonly windowSize = 9;
+ private readonly majorityThreshold = 6;

  // ... di dalam event emission logic ...
- if (isNewGesture || passedCooldown) {
+ if (isNewGesture) {
```

---

### 5.9 Fix `SwipeTracker` — Stricter Horizontal Dominance

```diff
- private readonly minDisplacement = 0.07;
+ private readonly minDisplacement = 0.10;

- const isHorizontal = Math.abs(dy) < Math.abs(dx) * 0.95 || Math.abs(dy) < 0.08;
+ const isHorizontal = Math.abs(dy) < Math.abs(dx) * 0.70;
```

---

### 5.10 Hapus Dead Code `gestureMath.ts`

```bash
rm src/utils/gestureMath.ts
```

File ini 373 baris dead code yang tidak diimport di manapun dan memiliki threshold divergen dari `gestureDetector.ts`.

---

## 6. Rencana Verifikasi

### Build & Type Check

```bash
npm run build          # Pastikan compile tanpa error
npx tsc --noEmit       # Pastikan type safety
```

### Manual Testing Matrix

| # | Skenario Test | Gesture | Hasil yang Diharapkan |
|---|--------------|---------|----------------------|
| 1 | Peace sign, tangan tegak | ✌️ | Terdeteksi dalam 0.5s |
| 2 | Peace sign, tangan miring 45° | ✌️ | Masih terdeteksi |
| 3 | Peace sign, jarak jauh (~1m) | ✌️ | Masih terdeteksi |
| 4 | Peace sign, jarak dekat (~30cm) | ✌️ | Terdeteksi, BUKAN OK_SIGN |
| 5 | OK sign, tangan tegak | 👌 | Terdeteksi, BUKAN Peace |
| 6 | Thumbs up, tangan miring 30° | 👍 | Terdeteksi |
| 7 | Thumbs down, sudut pergelangan natural | 👎 | Terdeteksi |
| 8 | L-sign, telunjuk atas + ibu jari keluar | 👆L | Terdeteksi |
| 9 | Menunjuk (telunjuk saja) | - | TIDAK boleh trigger L-Sign |
| 10 | Open palm, jari rileks | 🖐️ | Terdeteksi |
| 11 | Tangan diam (tanpa gestur) | - | TIDAK boleh trigger swipe |
| 12 | Swipe horizontal kiri/kanan | 👈👉 | Trigger dalam 400ms |
| 13 | Menahan Peace di state READY | ✌️ | Countdown mulai SEKALI (tidak berulang) |
| 14 | Peace dengan tangan kiri | ✌️ | Harus sama akuratnya dengan tangan kanan |

---

*Dokumen ini dihasilkan melalui code review mendalam terhadap 8 file sumber (total ~2,623 baris kode) dalam pipeline gesture detection Touchless Photobooth PTIK UNJ.*
