import { NormalizedLandmark, BoundingBox, DrawingStroke, ActiveGesture, CaptureStage } from '@/types/photobooth';

export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm base
  [5, 9], [9, 13], [13, 17]
];

/**
 * Draws smooth continuous glowing neon stroke using quadratic bezier midpoint smoothing
 */
export function drawNeonStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  isMirrored = true,
  canvasWidth = 1280,
  canvasHeight = 720
) {
  const points = stroke.points;
  if (!points || points.length === 0) return;

  const mapX = (x: number) => (isMirrored ? (1 - x) * canvasWidth : x * canvasWidth);
  const mapY = (y: number) => y * canvasHeight;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Single Point: Draw glowing circle
  if (points.length === 1) {
    const x = mapX(points[0].x);
    const y = mapY(points[0].y);

    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = stroke.color;
    ctx.beginPath();
    ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(x, y, stroke.size / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    return;
  }

  // Continuous Line Pass 1: Outer Neon Glow
  ctx.shadowColor = stroke.color;
  ctx.shadowBlur = 18;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size || 8;

  ctx.beginPath();
  ctx.moveTo(mapX(points[0].x), mapY(points[0].y));

  for (let i = 0; i < points.length - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    const xc = (mapX(pCurrent.x) + mapX(pNext.x)) / 2;
    const yc = (mapY(pCurrent.y) + mapY(pNext.y)) / 2;
    ctx.quadraticCurveTo(mapX(pCurrent.x), mapY(pCurrent.y), xc, yc);
  }
  const pLast = points[points.length - 1];
  ctx.lineTo(mapX(pLast.x), mapY(pLast.y));
  ctx.stroke();

  // Continuous Line Pass 2: Bright White Core
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(2.5, (stroke.size || 8) * 0.35);

  ctx.beginPath();
  ctx.moveTo(mapX(points[0].x), mapY(points[0].y));

  for (let i = 0; i < points.length - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    const xc = (mapX(pCurrent.x) + mapX(pNext.x)) / 2;
    const yc = (mapY(pCurrent.y) + mapY(pNext.y)) / 2;
    ctx.quadraticCurveTo(mapX(pCurrent.x), mapY(pCurrent.y), xc, yc);
  }
  ctx.lineTo(mapX(pLast.x), mapY(pLast.y));
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws futuristic hand landmarks and skeleton
 */
export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  allHands: NormalizedLandmark[][],
  canvasWidth: number,
  canvasHeight: number,
  activeGesture: ActiveGesture,
  isMirrored = true
) {
  if (!allHands || allHands.length === 0) return;

  const mapX = (x: number) => (isMirrored ? (1 - x) * canvasWidth : x * canvasWidth);
  const mapY = (y: number) => y * canvasHeight;

  ctx.save();

  allHands.forEach((hand) => {
    // 1. Skeleton lines
    ctx.strokeStyle = activeGesture === 'AIR_DRAW' ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;

    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = hand[startIdx];
      const p2 = hand[endIdx];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(mapX(p1.x), mapY(p1.y));
        ctx.lineTo(mapX(p2.x), mapY(p2.y));
        ctx.stroke();
      }
    });

    // 2. Joints
    hand.forEach((pt, idx) => {
      const x = mapX(pt.x);
      const y = mapY(pt.y);
      const isIndexTip = idx === 8;

      if (isIndexTip && activeGesture === 'AIR_DRAW') {
        // Glowing target reticle for drawing finger
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 4;
        ctx.fillStyle = isIndexTip ? '#ffe600' : 'rgba(255, 255, 255, 0.75)';
        ctx.beginPath();
        ctx.arc(x, y, idx === 0 ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  });

  ctx.restore();
}

/**
 * Draws Two-Stage Framing HUD (Locking Progress vs Locked State)
 */
export function drawTwoStageFrameHUD(
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  canvasWidth: number,
  canvasHeight: number,
  stage: CaptureStage,
  lockProgress: number, // 0 to 1 (for 2-second hold)
  isMirrored = true
) {
  const minX = isMirrored ? (1 - box.maxX) * canvasWidth : box.minX * canvasWidth;
  const width = box.width * canvasWidth;
  const minY = box.minY * canvasHeight;
  const height = box.height * canvasHeight;
  const maxX = minX + width;
  const maxY = minY + height;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  ctx.save();

  const isLocked = stage === 'LOCKED_COUNTDOWN';
  const cornerLen = Math.min(width, height) * 0.18;
  const cornerRadius = 14;
  const themeColor = isLocked ? '#00ff66' : '#00f0ff';

  // 1. Neon Glowing Cyber Brackets
  ctx.strokeStyle = themeColor;
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = isLocked ? 24 : 16;
  ctx.lineWidth = isLocked ? 4 : 3;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(minX, minY + cornerLen);
  ctx.lineTo(minX, minY + cornerRadius);
  ctx.arcTo(minX, minY, minX + cornerRadius, minY, cornerRadius);
  ctx.lineTo(minX + cornerLen, minY);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(maxX - cornerLen, minY);
  ctx.lineTo(maxX - cornerRadius, minY);
  ctx.arcTo(maxX, minY, maxX, minY + cornerRadius, cornerRadius);
  ctx.lineTo(maxX, minY + cornerLen);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(minX, maxY - cornerLen);
  ctx.lineTo(minX, maxY - cornerRadius);
  ctx.arcTo(minX, maxY, minX + cornerRadius, maxY, cornerRadius);
  ctx.lineTo(minX + cornerLen, maxY);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(maxX - cornerLen, maxY);
  ctx.lineTo(maxX - cornerRadius, maxY);
  ctx.arcTo(maxX, maxY, maxX, maxY - cornerRadius, cornerRadius);
  ctx.lineTo(maxX, maxY - cornerLen);
  ctx.stroke();

  // 2. Dashed Inner Frame
  ctx.strokeStyle = isLocked ? 'rgba(0, 255, 102, 0.4)' : 'rgba(0, 240, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.strokeRect(minX + 8, minY + 8, width - 16, height - 16);
  ctx.setLineDash([]);

  // 3. Center Target Reticle
  const reticleSize = 14;
  ctx.strokeStyle = isLocked ? '#00ff66' : '#ffe600';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - reticleSize, centerY);
  ctx.lineTo(centerX + reticleSize, centerY);
  ctx.moveTo(centerX, centerY - reticleSize);
  ctx.lineTo(centerX, centerY + reticleSize);
  ctx.stroke();

  // 4. Lock Progress Meter (Stage 1: Holding for 2s)
  if (!isLocked && lockProgress > 0) {
    const ringRadius = 32;
    const ringY = Math.max(minY + 45, centerY);

    // Background circle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.arc(centerX, ringY, ringRadius + 4, 0, Math.PI * 2);
    ctx.fill();

    // Track
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, ringY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Active arc
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(
      centerX,
      ringY,
      ringRadius,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * lockProgress,
      false
    );
    ctx.stroke();

    // Lock text
    ctx.font = 'bold 12px "Geist Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOCKING', centerX, ringY);
  }

  // 5. Header Status Tag
  ctx.font = 'bold 13px "Geist Sans", sans-serif';
  ctx.fillStyle = themeColor;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.shadowColor = themeColor;
  ctx.shadowBlur = 8;
  const statusText = isLocked ? '🔒 AREA FOKUS TERKUNCI • SILAKAN BERPOSE BEBAS' : '✨ FOTO KITA BLUR (TAHAN 2 DETIK)';
  ctx.fillText(statusText, minX + 6, minY - 8);

  ctx.restore();
}
