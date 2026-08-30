import { BoundingBox, DrawingStroke, CapturedPhoto, PhotoboothFrameId } from '@/types/photobooth';
import { drawNeonStroke } from './canvasRenderer';

interface CompositeOptions {
  video: HTMLVideoElement;
  strokes: DrawingStroke[];
  frameBox?: BoundingBox | null;
  frameId?: PhotoboothFrameId;
  watermarkText?: string;
  eventName?: string;
  applyBlurEffect?: boolean;
}

/**
 * Loads an image from URL into an HTMLImageElement promise
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image at ${src}`));
    img.src = src;
  });
}

/**
 * Generates a high-definition composite photo combining the video stream,
 * selective blur bokeh effect, neon air drawings, and generated frame overlays.
 */
export async function createCompositePhoto(options: CompositeOptions): Promise<CapturedPhoto> {
  const {
    video,
    strokes,
    frameBox = null,
    frameId = 'none',
    watermarkText = 'PTI BEMP PHOTOBOOTH',
    eventName = 'FOTO KITA BLUR • PTI BEMP 2026',
    applyBlurEffect = true,
  } = options;

  const width = video.videoWidth || 1920;
  const height = video.videoHeight || 1080;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Gagal menginisialisasi canvas context.');
  }

  // 1. Draw Base Video (Mirrored horizontally for natural selfie perspective)
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);

  if (applyBlurEffect && frameBox) {
    // Foto Kita Blur Effect:
    // A. Blurred background
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offCtx = offscreenCanvas.getContext('2d');

    if (offCtx) {
      offCtx.filter = 'blur(20px) brightness(0.85)';
      offCtx.drawImage(video, 0, 0, width, height);
      ctx.drawImage(offscreenCanvas, 0, 0, width, height);
    } else {
      ctx.drawImage(video, 0, 0, width, height);
    }

    // B. Sharp focused box
    const minX = frameBox.minX * width;
    const minY = frameBox.minY * height;
    const boxW = frameBox.width * width;
    const boxH = frameBox.height * height;
    const cornerRadius = 16;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(minX, minY, boxW, boxH, cornerRadius);
    ctx.clip();

    ctx.filter = 'contrast(1.05) saturate(1.1)';
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // C. Glowing highlight border
    ctx.save();
    ctx.strokeStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 24;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(minX, minY, boxW, boxH, cornerRadius);
    ctx.stroke();
    ctx.restore();
  } else {
    // Standard sharp video
    ctx.drawImage(video, 0, 0, width, height);
  }

  ctx.restore(); // Restores normal coordinates

  // 2. Render All Air Drawing Neon Strokes (Continuous bezier paths)
  if (strokes && strokes.length > 0) {
    strokes.forEach((stroke) => {
      drawNeonStroke(ctx, stroke, true, width, height);
    });
  }

  // 3. Render Generated Overlay Frame if selected
  if (frameId && frameId !== 'none') {
    try {
      const frameImg = await loadImage(`/assets/frames/frame-${frameId}.png`);
      ctx.drawImage(frameImg, 0, 0, width, height);
    } catch (err) {
      console.warn(`[frameComposite] Could not load frame overlay /assets/frames/frame-${frameId}.png:`, err);
      // Fallback to default branding overlay if custom frame fails
      renderBrandingOverlay(ctx, width, height, watermarkText, eventName);
    }
  } else {
    // Render default holographic header & footer if no custom frame is chosen
    renderBrandingOverlay(ctx, width, height, watermarkText, eventName);
  }

  // 4. Export as High-Quality JPEG DataURL
  const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const now = new Date();
  const id = 'PTI-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  const formattedTime =
    now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ' • ' +
    now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) +
    ' WIB';

  return {
    id,
    imageDataUrl,
    timestamp: now.getTime(),
    formattedTime,
    aspectRatio: width / height,
    frameId,
    tags: [frameBox ? 'Focus Locked' : 'Full Frame', frameId !== 'none' ? `Frame: ${frameId}` : 'Default Frame'],
  };
}

function renderBrandingOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermarkText: string,
  eventName: string
) {
  ctx.save();

  // Top Header Bar
  const headerHeight = Math.max(48, height * 0.06);
  const headerGrad = ctx.createLinearGradient(0, 0, 0, headerHeight * 1.5);
  headerGrad.addColorStop(0, 'rgba(10, 15, 30, 0.75)');
  headerGrad.addColorStop(1, 'rgba(10, 15, 30, 0)');

  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, width, headerHeight * 1.5);

  ctx.font = `bold ${Math.round(height * 0.024)}px "Geist Sans", -apple-system, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;
  ctx.fillText('⚡ ' + eventName, 32, headerHeight * 0.6);

  ctx.font = `600 ${Math.round(height * 0.016)}px "Geist Mono", monospace`;
  ctx.fillStyle = '#00f0ff';
  ctx.textAlign = 'right';
  ctx.fillText('TOUCHLESS INTERACTIVE BOOTH', width - 32, headerHeight * 0.6);

  // Bottom Footer Bar
  const footerHeight = Math.max(64, height * 0.08);
  const footerY = height - footerHeight;
  const footerGrad = ctx.createLinearGradient(0, footerY - footerHeight * 0.5, 0, height);
  footerGrad.addColorStop(0, 'rgba(10, 15, 30, 0)');
  footerGrad.addColorStop(0.4, 'rgba(10, 15, 30, 0.85)');
  footerGrad.addColorStop(1, 'rgba(10, 15, 30, 0.95)');

  ctx.fillStyle = footerGrad;
  ctx.fillRect(0, footerY - footerHeight * 0.5, width, footerHeight * 1.5);

  ctx.strokeStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, footerY);
  ctx.lineTo(width - 24, footerY);
  ctx.stroke();

  const now = new Date();
  const dateStr =
    now
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .toUpperCase() +
    ' • ' +
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
    ' WIB';

  ctx.font = `600 ${Math.round(height * 0.018)}px "Geist Mono", monospace`;
  ctx.fillStyle = '#ffe600';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 6;
  ctx.fillText('📅 ' + dateStr, 32, footerY + footerHeight * 0.5);

  ctx.font = `bold ${Math.round(height * 0.02)}px "Geist Sans", sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;
  ctx.fillText('📂 Akses & Unduh Foto: s.id/ptik-photobooth', width / 2, footerY + footerHeight * 0.5);

  ctx.font = `bold ${Math.round(height * 0.018)}px "Geist Sans", sans-serif`;
  ctx.fillStyle = '#00f0ff';
  ctx.textAlign = 'right';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  ctx.fillText('BEMP PTI UNJ © 2026', width - 32, footerY + footerHeight * 0.5);

  ctx.restore();
}
