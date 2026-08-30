'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FRAME_TEMPLATES,
  getAllFrameTemplates,
  FrameTemplate,
} from '@/config/frameTemplates';
import {
  compositePhotoboothStrip,
  CompositeStripResult,
  computeCoverCrop,
} from '@/utils/templateCompositor';
import {
  Layers,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Sliders,
  Sparkles,
  Info,
  UploadCloud,
  FileCheck,
} from 'lucide-react';
import Link from 'next/link';

type PresetPresetType = '16_9' | '4_3' | '1_1' | 'high_res' | 'low_res';

// Helper to generate clear calibration test pattern images on an in-memory canvas
function generateCalibrationPattern(
  text: string,
  bgColor: string,
  width: number,
  height: number
): string {
  if (typeof window === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = Math.max(1, Math.round(width / 600));
  const step = Math.round(width / 16);
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Outer Border Box
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(4, Math.round(width / 200));
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Center Crosshairs
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Edge Labels
  const fontSize = Math.max(14, Math.round(height * 0.05));
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // TOP
  ctx.fillText('▲ [ TOP EDGE ] ▲', width / 2, fontSize * 1.5);
  // BOTTOM
  ctx.fillText('▼ [ BOTTOM EDGE ] ▼', width / 2, height - fontSize * 1.5);
  // LEFT
  ctx.save();
  ctx.translate(fontSize * 1.5, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('◄ [ LEFT EDGE ] ◄', 0, 0);
  ctx.restore();
  // RIGHT
  ctx.save();
  ctx.translate(width - fontSize * 1.5, height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText('► [ RIGHT EDGE ] ►', 0, 0);
  ctx.restore();

  // Center Main Banner
  const bannerW = Math.min(width * 0.7, 500);
  const bannerH = fontSize * 3;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillRect(width / 2 - bannerW / 2, height / 2 - bannerH / 2, bannerW, bannerH);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(width / 2 - bannerW / 2, height / 2 - bannerH / 2, bannerW, bannerH);

  ctx.fillStyle = '#00f0ff';
  ctx.font = `bold ${fontSize * 1.3}px monospace`;
  ctx.fillText(text, width / 2, height / 2 - fontSize * 0.4);

  ctx.fillStyle = '#ffe600';
  ctx.font = `600 ${Math.max(11, fontSize * 0.75)}px monospace`;
  ctx.fillText(`${width}x${height} px (AR ${(width / height).toFixed(3)})`, width / 2, height / 2 + fontSize * 0.7);

  return canvas.toDataURL('image/png');
}

export default function CompositorDebugPage() {
  const allTemplates = getAllFrameTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('mood-booster');
  const [presetType, setPresetType] = useState<PresetPresetType>('16_9');

  // 3 Photos (either dataURL string or custom upload)
  const [photo1, setPhoto1] = useState<string>('');
  const [photo2, setPhoto2] = useState<string>('');
  const [photo3, setPhoto3] = useState<string>('');

  // Options
  const [showDebugOverlay, setShowDebugOverlay] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg'>('image/png');

  // Result state
  const [compositeResult, setCompositeResult] = useState<CompositeStripResult | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderDurationMs, setRenderDurationMs] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTemplate = FRAME_TEMPLATES[selectedTemplateId] || allTemplates[0];

  // Generate test preset photos based on selected preset type
  const loadPresetPhotos = useCallback((type: PresetPresetType) => {
    setPresetType(type);
    let w = 1920;
    let h = 1080;

    switch (type) {
      case '16_9':
        w = 1920;
        h = 1080;
        break;
      case '4_3':
        w = 1440;
        h = 1080;
        break;
      case '1_1':
        w = 1080;
        h = 1080;
        break;
      case 'high_res':
        w = 3840;
        h = 2160;
        break;
      case 'low_res':
        w = 640;
        h = 360;
        break;
    }

    const p1 = generateCalibrationPattern('PHOTO 1 (TOP)', '#d92638', w, h);
    const p2 = generateCalibrationPattern('PHOTO 2 (MID)', '#1877f2', w, h);
    const p3 = generateCalibrationPattern('PHOTO 3 (BTM)', '#00994d', w, h);

    setPhoto1(p1);
    setPhoto2(p2);
    setPhoto3(p3);
  }, []);

  // Initial load
  useEffect(() => {
    loadPresetPhotos('16_9');
  }, [loadPresetPhotos]);

  // Handle custom file upload
  const handleFileUpload = (slotIndex: 1 | 2 | 3, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (slotIndex === 1) setPhoto1(dataUrl);
      if (slotIndex === 2) setPhoto2(dataUrl);
      if (slotIndex === 3) setPhoto3(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Run Compositor Pipeline
  const runCompositor = useCallback(async () => {
    if (!photo1 || !photo2 || !photo3) return;

    setIsRendering(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const result = await compositePhotoboothStrip(
        [photo1, photo2, photo3],
        selectedTemplate,
        {
          mimeType: exportFormat,
          quality: 0.95,
          debugOverlay: showDebugOverlay,
        }
      );

      const duration = Math.round(performance.now() - startTime);
      setCompositeResult(result);
      setRenderDurationMs(duration);
    } catch (err: any) {
      console.error('[DebugCompositor] Error running compositor:', err);
      setErrorMessage(err.message || 'Gagal melakukan compositing strip photobooth.');
    } finally {
      setIsRendering(false);
    }
  }, [photo1, photo2, photo3, selectedTemplate, exportFormat, showDebugOverlay]);

  // Re-composite whenever inputs change
  useEffect(() => {
    if (photo1 && photo2 && photo3) {
      runCompositor();
    }
  }, [photo1, photo2, photo3, selectedTemplateId, exportFormat, showDebugOverlay, runCompositor]);

  // Download Handler
  const handleDownload = () => {
    if (!compositeResult) return;
    const link = document.createElement('a');
    const ext = exportFormat === 'image/jpeg' ? 'jpg' : 'png';
    link.download = `photobooth-${selectedTemplate.id}-${Date.now()}.${ext}`;
    link.href = compositeResult.dataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              PHASE 1 POC
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-7 h-7 text-cyan-400" />
              <span>Frame Compositor Test Harness</span>
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Pixel-accurate validation & testing tool untuk 5 original frame templates Touchless Photobooth PTIK UNJ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
          >
            ← Kembali ke Photobooth
          </Link>
          <button
            onClick={runCompositor}
            disabled={isRendering}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
            <span>Re-render Composite</span>
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Slot Inspector (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          {/* 1. Template Selector */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>1. Pilih Frame Template ({allTemplates.length} Tersedia)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3 rounded-xl text-left border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-sm text-white flex items-center justify-between">
                      <span>{tpl.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 mt-1">
                      {tpl.width} × {tpl.height} px
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Template Slot Details */}
            <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-mono">
              <div className="text-slate-300 font-bold mb-2 flex items-center justify-between">
                <span>📍 Konfigurasi Slot ({selectedTemplate.name}):</span>
                <span className="text-[10px] text-cyan-400">{selectedTemplate.fileName}</span>
              </div>
              <div className="space-y-1.5 text-slate-400">
                {selectedTemplate.slots.map((s, idx) => {
                  const ar = (s.width / s.height).toFixed(3);
                  return (
                    <div key={s.id} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
                      <span className="text-cyan-300 font-bold">Slot {idx + 1}:</span>
                      <span>
                        x:{s.x}, y:{s.y} • {s.width}×{s.height} px (AR: {ar})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Test Presets (Aspect Ratios) */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>2. Preset Calibration Image (Test Aspect Ratio)</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              {[
                { id: '16_9', label: '16:9 Standard (1920x1080)' },
                { id: '4_3', label: '4:3 Standard (1440x1080)' },
                { id: '1_1', label: '1:1 Square (1080x1080)' },
                { id: 'high_res', label: '4K High-Res (3840x2160)' },
                { id: 'low_res', label: 'Low-Res (640x360)' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadPresetPhotos(p.id as PresetPresetType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    presetType === p.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Custom Upload for Individual Slots */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>3. Upload Custom Photo per Slot</span>
            </h2>

            <div className="space-y-3">
              {[1, 2, 3].map((slotNum) => {
                const currentPhoto = slotNum === 1 ? photo1 : slotNum === 2 ? photo2 : photo3;
                return (
                  <div key={slotNum} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      {currentPhoto ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={currentPhoto}
                          alt={`Slot ${slotNum}`}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-slate-500" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-white">Photo {slotNum}</div>
                        <div className="text-[10px] text-slate-400">Custom image atau calibration pattern</div>
                      </div>
                    </div>

                    <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition">
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(slotNum as 1 | 2 | 3, file);
                        }}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Rendering & Debug Settings */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>4. Opsi Output & Debug Visualizer</span>
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Debug Slot Bounding Box Overlay</span>
                  <span className="text-[11px] text-slate-400">Tampilkan garis batas dan badge koordinat slot pada canvas</span>
                </div>
                <button
                  onClick={() => setShowDebugOverlay(!showDebugOverlay)}
                  className={`p-2 rounded-xl border transition ${
                    showDebugOverlay
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {showDebugOverlay ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-200">Format Ekspor:</span>
                <div className="flex gap-2">
                  {(['image/png', 'image/jpeg'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition ${
                        exportFormat === fmt
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {fmt === 'image/png' ? 'PNG (Lossless)' : 'JPEG (95%)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Live Composite Display & Full-Res Inspector (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col items-center">
            {/* Top Bar above Preview */}
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold text-white">Live Composite Preview</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedTemplate.width} × {selectedTemplate.height} px
                </span>
              </div>

              <div className="flex items-center gap-2">
                {renderDurationMs > 0 && (
                  <span className="text-[11px] font-mono text-cyan-400">Render: {renderDurationMs}ms</span>
                )}
                {compositeResult && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Output</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error banner if any */}
            {errorMessage && (
              <div className="w-full p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs mb-4">
                {errorMessage}
              </div>
            )}

            {/* Live Render Canvas View */}
            <div className="relative w-full max-w-[420px] aspect-[941/1672] rounded-2xl overflow-hidden border-2 border-slate-700 bg-black shadow-2xl flex items-center justify-center">
              {compositeResult ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={compositeResult.dataUrl}
                  alt="Photobooth Composite Result"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                  <span>Memproses composite...</span>
                </div>
              )}
            </div>

            {/* Validation Checklist Card */}
            <div className="w-full mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
              <div className="text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kriteria Validasi Phase 1:</span>
              </div>
              <ul className="space-y-1 text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Object-Fit Cover:</strong> Foto otomatis di-crop tengah tanpa distorsi / stretching.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Frame Overlay:</strong> Artwork & dekorasi frame berada di layer teratas di atas foto.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Zero Leakage:</strong> Seluruh area slot terisi penuh tanpa bocor ke tepi frame.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Resolusi Asli:</strong> Ekspor kanvas tetap pada ukuran penuh 941 × 1672 px.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
