import { NormalizedLandmark, BoundingBox, GestureDetectionState, ActiveGesture } from '@/types/photobooth';

/**
 * Calculates Euclidean distance between two 2D/3D points
 */
export function getDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Checks if a specific finger is extended relative to its MCP and Wrist
 */
export function isFingerExtended(
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number,
  wrist: NormalizedLandmark,
  landmarks: NormalizedLandmark[]
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const distWristToTip = getDistance(wrist, tip);
  const distWristToPip = getDistance(wrist, pip);
  const distMcpToTip = getDistance(mcp, tip);
  const distMcpToPip = getDistance(mcp, pip);

  return distWristToTip > distWristToPip * 1.1 && distMcpToTip > distMcpToPip * 1.05;
}

/**
 * Checks if a specific finger is folded towards palm
 */
export function isFingerFolded(
  tipIdx: number,
  pipIdx: number,
  mcpIdx: number,
  wrist: NormalizedLandmark,
  landmarks: NormalizedLandmark[]
): boolean {
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];
  const mcp = landmarks[mcpIdx];

  const distWristToTip = getDistance(wrist, tip);
  const distWristToPip = getDistance(wrist, pip);
  const distMcpToTip = getDistance(mcp, tip);

  return distWristToTip < distWristToPip * 1.05 || distMcpToTip < getDistance(mcp, pip) * 0.95;
}

/**
 * Checks if thumb is extended
 */
export function isThumbExtended(landmarks: NormalizedLandmark[]): boolean {
  const wrist = landmarks[0];
  const thumbMcp = landmarks[2];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];

  const distWristToThumbTip = getDistance(wrist, thumbTip);
  const distWristToThumbMcp = getDistance(wrist, thumbMcp);
  const distThumbTipToIndexMcp = getDistance(thumbTip, indexMcp);

  return distWristToThumbTip > distWristToThumbMcp * 1.15 && distThumbTipToIndexMcp > 0.08;
}

/**
 * Detects Air Draw Gesture (Point index finger only)
 */
export function detectAirDraw(landmarks: NormalizedLandmark[]): { isDrawing: boolean; point: { x: number; y: number } | null } {
  if (!landmarks || landmarks.length < 21) {
    return { isDrawing: false, point: null };
  }

  const wrist = landmarks[0];
  const indexExtended = isFingerExtended(8, 6, 5, wrist, landmarks);
  const middleFolded = isFingerFolded(12, 10, 9, wrist, landmarks);
  const ringFolded = isFingerFolded(16, 14, 13, wrist, landmarks);
  const pinkyFolded = isFingerFolded(20, 18, 17, wrist, landmarks);

  if (indexExtended && middleFolded && ringFolded && pinkyFolded) {
    return {
      isDrawing: true,
      point: {
        x: landmarks[8].x,
        y: landmarks[8].y,
      },
    };
  }

  return { isDrawing: false, point: null };
}

/**
 * Detects Thumbs Up Gesture
 */
export function detectThumbsUp(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];

  const isPointingUp = thumbTip.y < thumbIp.y && thumbIp.y < thumbMcp.y && thumbMcp.y < wrist.y;
  const thumbIsExtended = getDistance(wrist, thumbTip) > getDistance(wrist, thumbMcp) * 1.3;

  const indexFolded = isFingerFolded(8, 6, 5, wrist, landmarks);
  const middleFolded = isFingerFolded(12, 10, 9, wrist, landmarks);
  const ringFolded = isFingerFolded(16, 14, 13, wrist, landmarks);
  const pinkyFolded = isFingerFolded(20, 18, 17, wrist, landmarks);

  return isPointingUp && thumbIsExtended && indexFolded && middleFolded && ringFolded && pinkyFolded;
}

/**
 * Detects Open Palm Gesture (All 5 fingers spread)
 */
export function detectOpenPalm(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const thumbExtended = isThumbExtended(landmarks);
  const indexExtended = isFingerExtended(8, 6, 5, wrist, landmarks);
  const middleExtended = isFingerExtended(12, 10, 9, wrist, landmarks);
  const ringExtended = isFingerExtended(16, 14, 13, wrist, landmarks);
  const pinkyExtended = isFingerExtended(20, 18, 17, wrist, landmarks);

  const spreadThumbIndex = getDistance(landmarks[4], landmarks[8]) > 0.06;
  const spreadIndexMiddle = getDistance(landmarks[8], landmarks[12]) > 0.035;
  const spreadMiddleRing = getDistance(landmarks[12], landmarks[16]) > 0.035;
  const spreadRingPinky = getDistance(landmarks[16], landmarks[20]) > 0.035;

  return (
    thumbExtended &&
    indexExtended &&
    middleExtended &&
    ringExtended &&
    pinkyExtended &&
    spreadThumbIndex &&
    spreadIndexMiddle &&
    spreadMiddleRing &&
    spreadRingPinky
  );
}

/**
 * Detects Peace Sign Gesture (Index and Middle extended, Ring and Pinky folded)
 */
export function detectPeaceSign(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const indexExtended = isFingerExtended(8, 6, 5, wrist, landmarks);
  const middleExtended = isFingerExtended(12, 10, 9, wrist, landmarks);
  const ringFolded = isFingerFolded(16, 14, 13, wrist, landmarks);
  const pinkyFolded = isFingerFolded(20, 18, 17, wrist, landmarks);

  const spreadIndexMiddle = getDistance(landmarks[8], landmarks[12]) > 0.04;

  return indexExtended && middleExtended && ringFolded && pinkyFolded && spreadIndexMiddle;
}

/**
 * Detects 2-Hand Frame Gesture (Forms a rectangle/box with two hands)
 */
export function detectFrameGesture(allHands: NormalizedLandmark[][]): {
  isFraming: boolean;
  box: BoundingBox | null;
  confidence: number;
} {
  if (!allHands || allHands.length < 2) {
    return { isFraming: false, box: null, confidence: 0 };
  }

  for (let i = 0; i < allHands.length; i++) {
    for (let j = i + 1; j < allHands.length; j++) {
      const handA = allHands[i];
      const handB = allHands[j];

      const handAThumb = handA[4];
      const handAIndex = handA[8];
      const handBThumb = handB[4];
      const handBIndex = handB[8];

      const distAtoB = getDistance(handAIndex, handBThumb);
      const distBtoA = getDistance(handBIndex, handAThumb);

      const cornerPoints = [handAThumb, handAIndex, handBThumb, handBIndex];
      const minX = Math.min(...cornerPoints.map((p) => p.x));
      const maxX = Math.max(...cornerPoints.map((p) => p.x));
      const minY = Math.min(...cornerPoints.map((p) => p.y));
      const maxY = Math.max(...cornerPoints.map((p) => p.y));

      const boxWidth = maxX - minX;
      const boxHeight = maxY - minY;

      const isInterlocked = distAtoB < 0.14 && distBtoA < 0.14;
      const handAOpenCorner = getDistance(handAThumb, handAIndex) > 0.08;
      const handBOpenCorner = getDistance(handBThumb, handBIndex) > 0.08;
      const validBoxDimensions = boxWidth >= 0.12 && boxHeight >= 0.10 && boxWidth <= 0.95 && boxHeight <= 0.95;

      if ((isInterlocked || (handAOpenCorner && handBOpenCorner)) && validBoxDimensions) {
        const padX = boxWidth * 0.08;
        const padY = boxHeight * 0.08;

        const paddedMinX = Math.max(0, minX - padX);
        const paddedMaxX = Math.min(1, maxX + padX);
        const paddedMinY = Math.max(0, minY - padY);
        const paddedMaxY = Math.min(1, maxY + padY);

        const finalWidth = paddedMaxX - paddedMinX;
        const finalHeight = paddedMaxY - paddedMinY;

        return {
          isFraming: true,
          box: {
            minX: paddedMinX,
            maxX: paddedMaxX,
            minY: paddedMinY,
            maxY: paddedMaxY,
            width: finalWidth,
            height: finalHeight,
            centerX: paddedMinX + finalWidth / 2,
            centerY: paddedMinY + finalHeight / 2,
          },
          confidence: Math.min(1, (boxWidth * boxHeight) / 0.2),
        };
      }
    }
  }

  return { isFraming: false, box: null, confidence: 0 };
}

/**
 * Evaluates all hands and determines the top active gesture + extracts index fingertip
 */
export function evaluateGestures(allHands: NormalizedLandmark[][]): GestureDetectionState {
  if (!allHands || allHands.length === 0) {
    return {
      gesture: 'IDLE',
      confidence: 0,
      frameBox: null,
      drawPoint: null,
      detectedHandsCount: 0,
      landmarks: [],
      indexFingerTip: null,
    };
  }

  // Extract primary index fingertip point for virtual cursor
  const primaryIndexTip = allHands[0] && allHands[0][8] ? { x: allHands[0][8].x, y: allHands[0][8].y } : null;

  // Priority 1: Check 2-hand framing gesture
  if (allHands.length >= 2) {
    const frameResult = detectFrameGesture(allHands);
    if (frameResult.isFraming && frameResult.box) {
      return {
        gesture: 'FRAME_CAPTURE',
        confidence: frameResult.confidence,
        frameBox: frameResult.box,
        drawPoint: null,
        detectedHandsCount: allHands.length,
        landmarks: allHands,
        indexFingerTip: primaryIndexTip,
      };
    }
  }

  // Priority 2: Check single hand gestures
  for (const hand of allHands) {
    const drawResult = detectAirDraw(hand);
    if (drawResult.isDrawing && drawResult.point) {
      return {
        gesture: 'AIR_DRAW',
        confidence: 0.95,
        frameBox: null,
        drawPoint: drawResult.point,
        detectedHandsCount: allHands.length,
        landmarks: allHands,
        indexFingerTip: drawResult.point,
      };
    }

    if (detectOpenPalm(hand)) {
      return {
        gesture: 'OPEN_PALM',
        confidence: 0.9,
        frameBox: null,
        drawPoint: null,
        detectedHandsCount: allHands.length,
        landmarks: allHands,
        indexFingerTip: primaryIndexTip,
      };
    }

    if (detectPeaceSign(hand)) {
      return {
        gesture: 'PEACE',
        confidence: 0.9,
        frameBox: null,
        drawPoint: null,
        detectedHandsCount: allHands.length,
        landmarks: allHands,
        indexFingerTip: primaryIndexTip,
      };
    }

    if (detectThumbsUp(hand)) {
      return {
        gesture: 'THUMBS_UP',
        confidence: 0.9,
        frameBox: null,
        drawPoint: null,
        detectedHandsCount: allHands.length,
        landmarks: allHands,
        indexFingerTip: primaryIndexTip,
      };
    }
  }

  return {
    gesture: 'IDLE',
    confidence: 0.5,
    frameBox: null,
    drawPoint: null,
    detectedHandsCount: allHands.length,
    landmarks: allHands,
    indexFingerTip: primaryIndexTip,
  };
}

export function smoothBoundingBox(
  currentBox: BoundingBox,
  prevBox: BoundingBox | null,
  smoothingFactor = 0.35
): BoundingBox {
  if (!prevBox) return currentBox;

  const smooth = (curr: number, prev: number) => prev + (curr - prev) * smoothingFactor;

  const minX = smooth(currentBox.minX, prevBox.minX);
  const maxX = smooth(currentBox.maxX, prevBox.maxX);
  const minY = smooth(currentBox.minY, prevBox.minY);
  const maxY = smooth(currentBox.maxY, prevBox.maxY);

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export function smoothPoint(
  current: { x: number; y: number },
  prev: { x: number; y: number } | null,
  factor = 0.4
): { x: number; y: number } {
  if (!prev) return current;
  return {
    x: prev.x + (current.x - prev.x) * factor,
    y: prev.y + (current.y - prev.y) * factor,
  };
}
