import { FrameTemplate, FrameSlot } from '@/config/frameTemplates';

export type PhotoInput = HTMLCanvasElement | HTMLImageElement | HTMLVideoElement | string;

export interface CoverCropResult {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

export interface CompositorOptions {
  mimeType?: 'image/png' | 'image/jpeg';
  quality?: number; // 0.0 to 1.0 (for image/jpeg)
  debugOverlay?: boolean;
  backgroundColor?: string;
}

export interface CompositeStripResult {
  dataUrl: string;
  width: number;
  height: number;
  mimeType: string;
  timestamp: number;
}

/**
 * Loads an image from a URL or DataURL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('loadImage can only be executed in a browser environment'));
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image at src: ${src.substring(0, 100)}...`));
    img.src = src;
  });
}

/**
 * Resolves any PhotoInput (Image, Video, Canvas, or string URL) to an HTMLImageElement,
 * HTMLCanvasElement, or HTMLVideoElement with confirmed dimensions.
 */
async function resolvePhotoElement(
  photo: PhotoInput
): Promise<{ element: CanvasImageSource; width: number; height: number; cleanup: () => void }> {
  if (typeof photo === 'string') {
    const img = await loadImage(photo);
    return { 
      element: img, 
      width: img.naturalWidth || img.width, 
      height: img.naturalHeight || img.height,
      cleanup: () => { img.src = ''; } // Aggressively free decoded bitmap memory
    };
  }

  if (photo instanceof HTMLVideoElement) {
    const width = photo.videoWidth || photo.width || 1280;
    const height = photo.videoHeight || photo.height || 720;
    return { element: photo, width, height, cleanup: () => {} };
  }

  if (photo instanceof HTMLCanvasElement) {
    return { element: photo, width: photo.width, height: photo.height, cleanup: () => {} };
  }

  if (photo instanceof HTMLImageElement) {
    if (!photo.complete) {
      await new Promise<void>((resolve, reject) => {
        photo.onload = () => resolve();
        photo.onerror = reject;
      });
    }
    const width = photo.naturalWidth || photo.width;
    const height = photo.naturalHeight || photo.height;
    return { element: photo, width, height, cleanup: () => {} };
  }

  throw new Error('Unsupported photo input type for template compositor');
}

/**
 * Calculates centered `object-fit: cover` crop geometry from a source image
 * to match the exact aspect ratio of the destination slot without distortion.
 */
export function computeCoverCrop(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number
): CoverCropResult {
  if (srcWidth <= 0 || srcHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return { sx: 0, sy: 0, sWidth: srcWidth, sHeight: srcHeight };
  }

  const srcRatio = srcWidth / srcHeight;
  const targetRatio = targetWidth / targetHeight;

  if (srcRatio > targetRatio) {
    // Source is wider than target slot -> crop left & right
    const sWidth = Math.round(srcHeight * targetRatio);
    const sHeight = srcHeight;
    const sx = Math.round((srcWidth - sWidth) / 2);
    const sy = 0;
    return { sx, sy, sWidth, sHeight };
  } else {
    // Source is taller than target slot -> crop top & bottom
    const sWidth = srcWidth;
    const sHeight = Math.round(srcWidth / targetRatio);
    const sx = 0;
    const sy = Math.round((srcHeight - sHeight) / 2);
    return { sx, sy, sWidth, sHeight };
  }
}

/**
 * Renders a single photo into its designated frame slot on a canvas context
 */
export async function renderPhotoToSlot(
  ctx: CanvasRenderingContext2D,
  photoInput: PhotoInput,
  slot: FrameSlot
): Promise<void> {
  const { element, width: srcW, height: srcH, cleanup } = await resolvePhotoElement(photoInput);
  
  try {
    const { sx, sy, sWidth, sHeight } = computeCoverCrop(srcW, srcH, slot.width, slot.height);

    ctx.save();
    ctx.beginPath();
    if (slot.borderRadius && slot.borderRadius > 0 && typeof ctx.roundRect === 'function') {
      ctx.roundRect(slot.x, slot.y, slot.width, slot.height, slot.borderRadius);
    } else {
      ctx.rect(slot.x, slot.y, slot.width, slot.height);
    }
    ctx.clip();

    ctx.drawImage(
      element,
      sx,
      sy,
      sWidth,
      sHeight,
      slot.x,
      slot.y,
      slot.width,
      slot.height
    );

    ctx.restore();
  } finally {
    // Free image memory immediately after drawing, even if an error occurred
    cleanup();
  }
}

/**
 * Renders a visual debug overlay showing slot bounding boxes, coordinates, and aspect ratios.
 */
function renderDebugSlotOverlay(
  ctx: CanvasRenderingContext2D,
  template: FrameTemplate
): void {
  ctx.save();

  // Canvas Dimension indicator
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(10, 10, 260, 42);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 260, 42);

  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = '#00f0ff';
  ctx.fillText(`CANVAS: ${template.width} x ${template.height} px`, 20, 36);

  // Slots
  const slotColors = ['#ff0055', '#00ff66', '#00aaff'];

  template.slots.forEach((slot, idx) => {
    const color = slotColors[idx % slotColors.length];

    // Bounding box outline
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 6]);
    ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
    ctx.setLineDash([]);

    // Badge
    const badgeText = `${slot.id.toUpperCase()}: x=${slot.x}, y=${slot.y}, ${slot.width}x${slot.height} (AR ${(slot.width / slot.height).toFixed(3)})`;
    ctx.font = 'bold 14px monospace';
    const textMetrics = ctx.measureText(badgeText);
    const badgeW = textMetrics.width + 16;
    const badgeH = 26;

    ctx.fillStyle = color;
    ctx.fillRect(slot.x, slot.y - badgeH, badgeW, badgeH);

    ctx.fillStyle = '#000000';
    ctx.fillText(badgeText, slot.x + 8, slot.y - 8);
  });

  ctx.restore();
}

/**
 * Core Photobooth Strip Compositor.
 *
 * Combines 3 captured photos into their designated slots and overlays
 * the original portrait frame artwork on top.
 *
 * Output: Full resolution (941 x 1672 px) DataURL.
 */
export async function compositePhotoboothStrip(
  photos: PhotoInput[],
  template: FrameTemplate,
  options: CompositorOptions = {}
): Promise<CompositeStripResult> {
  const {
    mimeType = 'image/png',
    quality = 0.95,
    debugOverlay = false,
    backgroundColor = '#FFFFFF',
  } = options;

  if (!template) {
    throw new Error('Frame template configuration is required for compositing.');
  }

  if (!photos || photos.length < 3) {
    throw new Error(`Compositor expects at least 3 photos, received ${photos?.length || 0}.`);
  }

  // 1. Create native-resolution offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = template.width;
  canvas.height = template.height;

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Failed to create 2D canvas context for photobooth compositor.');
    }

    // 2. Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, template.width, template.height);

    // 3. Render each of the 3 photos into their respective slots (Bottom layer)
    for (let i = 0; i < 3; i++) {
      const photo = photos[i];
      const slot = template.slots[i];
      if (photo && slot) {
        await renderPhotoToSlot(ctx, photo, slot);
      }
    }

    // 4. Load & Overlay Frame Template Artwork (Top layer)
    let frameImg: HTMLImageElement | null = null;
    try {
      frameImg = await loadImage(template.assetPath);
      ctx.drawImage(frameImg, 0, 0, template.width, template.height);
    } catch (err) {
      console.error(`[templateCompositor] Failed to load frame overlay ${template.assetPath}:`, err);
      throw new Error(`Failed to load frame asset: ${template.fileName}`);
    } finally {
      if (frameImg) {
        frameImg.src = ''; // Aggressive memory release for frame asset
      }
    }

    // 5. Optional Debug Overlay
    if (debugOverlay) {
      renderDebugSlotOverlay(ctx, template);
    }

    // 6. Export full-resolution image
    const dataUrl = canvas.toDataURL(mimeType, quality);

    return {
      dataUrl,
      width: template.width,
      height: template.height,
      mimeType,
      timestamp: Date.now(),
    };
  } finally {
    // Free main compositor canvas memory immediately, regardless of success or error
    canvas.width = 0;
    canvas.height = 0;
  }
}
