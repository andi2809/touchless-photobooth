import { NormalizedLandmark } from '@/types/photobooth';
import { NormalizedGestureType, NormalizedGestureEvent } from '@/types/boothState';

/**
 * Calculates Euclidean distance between two 2D points
 */
export function getDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Checks if a specific finger is extended
 * Rotation-tolerant version
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

  // Primary: distance ratio (rotation-invariant)
  const distWristToTip = getDistance(wrist, tip);
  const distWristToPip = getDistance(wrist, pip);
  const distMcpToTip = getDistance(mcp, tip);
  const distMcpToPip = getDistance(mcp, pip);

  const isFarFromWrist = distWristToTip > distWristToPip * 0.98;
  const isFarFromMcp = distMcpToTip > distMcpToPip * 0.98;

  // Secondary: Alignment check — tip is further along the finger axis from MCP
  // Dot product of (MCP→PIP) and (MCP→TIP) should be positive and tip should overshoot PIP
  const axisX = pip.x - mcp.x;
  const axisY = pip.y - mcp.y;
  const toTipX = tip.x - mcp.x;
  const toTipY = tip.y - mcp.y;
  const axisLen = Math.hypot(axisX, axisY);
  const projection = axisLen > 0.001
    ? (toTipX * axisX + toTipY * axisY) / (axisLen * axisLen)
    : 0;

  // Projection > 0.75 means tip extends reasonably beyond PIP along the finger bone direction
  const isAligned = projection > 0.75;

  // Accept if EITHER (both distance checks pass) OR (aligned + at least one distance check)
  return (isFarFromWrist && isFarFromMcp) || (isAligned && (isFarFromWrist || isFarFromMcp));
}

/**
 * Checks if a specific finger is folded into a fist / towards palm
 * Tightened with AND logic (majority vote)
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
  const distMcpToPip = getDistance(mcp, pip);

  // Distance checks (rotation-invariant)
  const isTuckedNearWrist = distWristToTip < distWristToPip * 1.25;
  const isTuckedNearMcp = distMcpToTip < distMcpToPip * 1.25;

  // Projection check: tip does NOT extend beyond PIP along the finger axis
  const axisX = pip.x - mcp.x;
  const axisY = pip.y - mcp.y;
  const toTipX = tip.x - mcp.x;
  const toTipY = tip.y - mcp.y;
  const axisLen = Math.hypot(axisX, axisY);
  const projection = axisLen > 0.001
    ? (toTipX * axisX + toTipY * axisY) / (axisLen * axisLen)
    : 0;

  const isRetracted = projection < 0.9; 

  // Require at least TWO conditions to agree (prevents slightly bent fingers from triggering)
  const signals = [isTuckedNearWrist, isTuckedNearMcp, isRetracted];
  return signals.filter(Boolean).length >= 2;
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

  return distWristToThumbTip > distWristToThumbMcp * 1.12 && distThumbTipToIndexMcp > 0.055;
}

/**
 * Robust Scale-Invariant Classifier: Detects OK Sign (👌)
 * Thumb tip & Index tip (or DIP) touch to form a circle, other fingers (Middle, Ring, Pinky) are extended
 */
export function detectOkSign(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const indexTip = landmarks[8];
  const indexDip = landmarks[7];
  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // 1. Hand scale reference (wrist to middle MCP distance)
  const handScale = Math.max(0.08, getDistance(wrist, middleMcp));

  // 2. Pinch circle formed between Thumb and Index finger
  const thumbIndexDist = Math.min(
    getDistance(thumbTip, indexTip),
    getDistance(thumbTip, indexDip),
    getDistance(thumbIp, indexTip)
  );

  // Dynamically scaled threshold with NO absolute fallback (generous for ease of use)
  const isCircleFormed = thumbIndexDist < handScale * 0.65;

  // 3. Middle, Ring, and Pinky fingers are extended outwards from wrist
  const middleExtended = getDistance(wrist, middleTip) > getDistance(wrist, middlePip) * 1.0;
  const ringExtended = getDistance(wrist, ringTip) > getDistance(wrist, landmarks[14]) * 1.0;
  const pinkyExtended = getDistance(wrist, pinkyTip) > getDistance(wrist, landmarks[18]) * 1.0;

  const extendedCount = [middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;

  // 4. Middle fingertip is distinctly further/higher than index circle
  // Use distance instead of absolute Y for rotation invariance
  const middleAboveIndex = getDistance(wrist, middleTip) > getDistance(wrist, indexTip) * 1.05;
  
  // 5. Guard: Index tip must be CLOSER to thumb than to its own MCP
  //    (in peace, index tip is far from thumb)
  const indexNearThumb = thumbIndexDist < getDistance(indexTip, landmarks[5]) * 0.95;

  return isCircleFormed && extendedCount >= 1 && middleAboveIndex && indexNearThumb;
}

/**
 * Robust classifier: Detects Peace Sign (✌️)
 * Index & Middle fingers extended up, Ring & Pinky folded into fist
 */
export function detectPeaceSign(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  // 1. Index and Middle are extended and pointing up
  const indexUp = isFingerExtended(8, 6, 5, wrist, landmarks);
  const middleUp = isFingerExtended(12, 10, 9, wrist, landmarks);

  // 2. Ring and Pinky are folded
  const ringFolded = isFingerFolded(16, 14, 13, wrist, landmarks);
  const pinkyFolded = isFingerFolded(20, 18, 17, wrist, landmarks);

  // 3. Index & Middle tips are distinctly further from wrist than Ring & Pinky tips (scale-relative separation)
  const indexFurtherThanRing = getDistance(wrist, indexTip) > getDistance(wrist, ringTip) * 1.05;
  const middleFurtherThanPinky = getDistance(wrist, middleTip) > getDistance(wrist, pinkyTip) * 1.05;

  return indexUp && middleUp && ringFolded && pinkyFolded && indexFurtherThanRing && middleFurtherThanPinky;
}

/**
 * Robust classifier: Detects Thumbs Up Gesture (👍)
 * Thumb extended pointing upwards, other 4 fingers folded into a fist
 */
export function detectThumbsUp(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];

  // 1. Thumb direction vector points "up" (predominantly negative Y relative to wrist)
  const fistCenterY = (landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 4;
  
  const thumbPointingUp = thumbTip.y < fistCenterY;
  const thumbExtended = getDistance(wrist, thumbTip) > getDistance(wrist, thumbMcp) * 1.02;

  // 2. Thumb tip is distinctly further from wrist than the knuckles of index and middle fingers
  const thumbHigherThanKnuckles = getDistance(wrist, thumbTip) > getDistance(wrist, landmarks[5]) * 1.02 && getDistance(wrist, thumbTip) > getDistance(wrist, landmarks[9]) * 1.02;

  // 3. The other 4 fingers are folded into a fist
  const indexFolded = isFingerFolded(8, 6, 5, wrist, landmarks);
  const middleFolded = isFingerFolded(12, 10, 9, wrist, landmarks);
  const ringFolded = isFingerFolded(16, 14, 13, wrist, landmarks);
  const pinkyFolded = isFingerFolded(20, 18, 17, wrist, landmarks);

  const foldedCount = [indexFolded, middleFolded, ringFolded, pinkyFolded].filter(Boolean).length;

  return thumbPointingUp && thumbExtended && thumbHigherThanKnuckles && foldedCount >= 2;
}

/**
 * Robust classifier: Detects Thumbs Down Gesture (👎)
 * Thumb pointing downwards, other 4 fingers folded into a fist
 */
export function detectThumbsDown(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];

  // 1. Thumb direction vector points "down" (predominantly positive Y relative to wrist)
  const fistCenterY = (landmarks[5].y + landmarks[9].y + landmarks[13].y + landmarks[17].y) / 4;
  
  const thumbPointingDown = thumbTip.y > fistCenterY;
  const thumbExtended = getDistance(wrist, thumbTip) > getDistance(wrist, thumbMcp) * 1.02;

  // 2. Thumb tip is distinctly further from wrist than the knuckles of index and middle fingers
  const thumbLowerThanKnuckles = getDistance(wrist, thumbTip) > getDistance(wrist, landmarks[5]) * 1.02 && getDistance(wrist, thumbTip) > getDistance(wrist, landmarks[9]) * 1.02;

  // 3. The other 4 fingers are folded into a fist
  const indexFolded = isFingerFolded(8, 6, 5, wrist, landmarks);
  const middleFolded = isFingerFolded(12, 10, 9, wrist, landmarks);
  const ringFolded = isFingerFolded(16, 14, 13, wrist, landmarks);
  const pinkyFolded = isFingerFolded(20, 18, 17, wrist, landmarks);

  const foldedCount = [indexFolded, middleFolded, ringFolded, pinkyFolded].filter(Boolean).length;

  return thumbPointingDown && thumbExtended && thumbLowerThanKnuckles && foldedCount >= 2;
}

/**
 * Natural & Scale-Invariant Classifier: Detects "L" Sign Gesture (👆 L)
 * - Index finger is extended upwards
 * - Thumb is extended outwards away from the palm
 * - Thumb and Index tips are clearly separated
 * - Middle, Ring, and Pinky are folded towards palm
 */
export function detectLSign(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbMcp = landmarks[2];
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];

  const handScale = Math.max(0.08, getDistance(wrist, middleMcp));

  // 1. Index finger is extended upwards (using distance to avoid Y-bias)
  const isIndexExtended = getDistance(wrist, indexTip) > getDistance(wrist, indexPip) * 1.0;

  if (!isIndexExtended) return false;

  // 2. Thumb is extended outwards
  const isThumbExtendedOutward =
    getDistance(thumbTip, thumbMcp) > handScale * 0.20 ||
    getDistance(thumbTip, indexMcp) > handScale * 0.25;

  if (!isThumbExtendedOutward) return false;

  // 3. Thumb and Index tips are clearly spread apart forming L-shape
  const thumbIndexSpread = getDistance(thumbTip, indexTip);
  if (thumbIndexSpread < handScale * 0.35) {
    return false;
  }

  // 4. Middle, Ring, and Pinky must be folded into palm (using standard tighten folded logic)
  const middleFolded = isFingerFolded(12, 10, 9, wrist, landmarks);
  const ringFolded = isFingerFolded(16, 14, 13, wrist, landmarks);
  const pinkyFolded = isFingerFolded(20, 18, 17, wrist, landmarks);

  return middleFolded && ringFolded && pinkyFolded;
}

/**
 * Robust classifier: Detects Open Palm Gesture (🖐️)
 * All 5 fingers extended and spread
 */
export function detectOpenPalm(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) return false;

  const wrist = landmarks[0];
  const thumbExtended = isThumbExtended(landmarks);
  const indexExtended = isFingerExtended(8, 6, 5, wrist, landmarks);
  const middleExtended = isFingerExtended(12, 10, 9, wrist, landmarks);
  const ringExtended = isFingerExtended(16, 14, 13, wrist, landmarks);
  const pinkyExtended = isFingerExtended(20, 18, 17, wrist, landmarks);

  return thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended;
}

/**
 * Classifies raw single-hand landmarks into an instant candidate static gesture
 * Uses score-based classification to handle priority and ambiguity
 */
export function classifyInstantStaticGesture(landmarks: NormalizedLandmark[]): {
  gesture: NormalizedGestureType;
  confidence: number;
} {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'IDLE', confidence: 0 };
  }

  type Candidate = { gesture: NormalizedGestureType; confidence: number; priority: number };
  const candidates: Candidate[] = [];

  // Evaluate ALL detectors; collect passing ones with confidence and priority
  if (detectPeaceSign(landmarks)) {
    candidates.push({ gesture: 'PEACE', confidence: 0.93, priority: 1 });
  }
  if (detectOkSign(landmarks)) {
    candidates.push({ gesture: 'OK_SIGN', confidence: 0.92, priority: 2 });
  }
  if (detectThumbsDown(landmarks)) {
    candidates.push({ gesture: 'THUMBS_DOWN', confidence: 0.91, priority: 3 });
  }
  if (detectThumbsUp(landmarks)) {
    candidates.push({ gesture: 'THUMBS_UP', confidence: 0.90, priority: 4 });
  }
  if (detectLSign(landmarks)) {
    candidates.push({ gesture: 'L_SIGN', confidence: 0.88, priority: 5 });
  }
  if (detectOpenPalm(landmarks)) {
    candidates.push({ gesture: 'OPEN_PALM', confidence: 0.85, priority: 6 });
  }

  // If exactly one candidate: confident detection
  if (candidates.length === 1) {
    return { gesture: candidates[0].gesture, confidence: candidates[0].confidence };
  }

  // If multiple candidates: pick the one with highest priority (lowest number)
  // but REDUCE confidence to signal ambiguity
  if (candidates.length > 1) {
    candidates.sort((a, b) => a.priority - b.priority);
    return {
      gesture: candidates[0].gesture,
      confidence: candidates[0].confidence * 0.75, // Reduced due to ambiguity
    };
  }

  return { gesture: 'IDLE', confidence: 0.4 };
}

/**
 * Motion History point for tracking dynamic Swipe gestures
 */
interface MotionSample {
  x: number;
  y: number;
  time: number;
}

/**
 * Directional Dynamic Motion Tracker with High-Sensitivity & Responsive Tracking
 */
export class SwipeTracker {
  private samples: MotionSample[] = [];
  private readonly windowMs = 400;
  private readonly minDisplacement = 0.10; // 10% screen width
  private readonly minVelocity = 0.18; // Responsive velocity threshold
  private readonly cooldownMs = 350; // Fast repeatable swiping
  private lastTriggerTime = 0;

  public update(
    landmarks: NormalizedLandmark[] | null,
    timestamp: number
  ): 'SWIPE_LEFT' | 'SWIPE_RIGHT' | null {
    if (timestamp - this.lastTriggerTime < this.cooldownMs) {
      return null;
    }

    if (!landmarks || landmarks.length < 21) {
      if (this.samples.length > 0 && timestamp - this.samples[this.samples.length - 1].time > 150) {
        this.samples = [];
      }
      return null;
    }

    // Compute palm center
    const palmX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[17].x) / 4;
    const palmY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[17].y) / 4;

    // Convert to mirrored screen X
    const screenX = 1 - palmX;
    const screenY = palmY;

    this.samples.push({ x: screenX, y: screenY, time: timestamp });
    this.samples = this.samples.filter((s) => timestamp - s.time <= this.windowMs);

    if (this.samples.length < 3) {
      return null;
    }

    const oldest = this.samples[0];
    const newest = this.samples[this.samples.length - 1];
    const dt = (newest.time - oldest.time) / 1000;

    if (dt < 0.05) return null;

    const dx = newest.x - oldest.x;
    const dy = newest.y - oldest.y;
    const vx = dx / dt;

    // Strict dominant-axis check (prevent diagonal or mostly-vertical phantom swipes)
    const isHorizontal = Math.abs(dy) < Math.abs(dx) * 0.70;

    if (isHorizontal) {
      // Check Swipe Right
      if (dx > this.minDisplacement && vx > this.minVelocity) {
        this.lastTriggerTime = timestamp;
        this.samples = [];
        return 'SWIPE_RIGHT';
      }

      // Check Swipe Left
      if (dx < -this.minDisplacement && vx < -this.minVelocity) {
        this.lastTriggerTime = timestamp;
        this.samples = [];
        return 'SWIPE_LEFT';
      }
    }

    return null;
  }

  public reset(): void {
    this.samples = [];
    this.lastTriggerTime = 0;
  }
}

/**
 * Sliding Window Majority Voting & Debounce Stabilizer
 */
export class GestureStabilizer {
  private readonly windowSize = 5; // Fast response
  private readonly majorityThreshold = 3; // 3 of 5 votes
  private readonly staticCooldownMs = 350;

  private gestureHistory: NormalizedGestureType[] = [];
  private currentStableGesture: NormalizedGestureType = 'IDLE';
  private lastEmittedGesture: NormalizedGestureType = 'IDLE';
  private lastEmittedTime = 0;
  private swipeTracker = new SwipeTracker();

  // ── Release-to-Rearm: prevents navigation gestures from rapid re-triggering ──
  // After THUMBS_DOWN fires, the user MUST return to a neutral/different gesture
  // for at least REARM_NEUTRAL_MS before THUMBS_DOWN can fire again.
  private static readonly REARM_GESTURES: ReadonlySet<NormalizedGestureType> = new Set([
    'THUMBS_DOWN',
  ]);
  private static readonly REARM_NEUTRAL_MS = 600; // Must hold non-THUMBS_DOWN for 600ms to rearm
  private rearmLockedGesture: NormalizedGestureType | null = null;
  private rearmNeutralSince = 0; // Timestamp when stable gesture first diverged from locked gesture

  public processFrame(
    allHands: NormalizedLandmark[][],
    timestamp: number
  ): {
    activeContinuousGesture: NormalizedGestureType;
    confidence: number;
    triggeredEvent: NormalizedGestureEvent | null;
  } {
    // 1. Dynamic Swipe takes absolute priority
    const primaryHand = allHands && allHands.length > 0 ? allHands[0] : null;
    const swipe = this.swipeTracker.update(primaryHand, timestamp);

    if (swipe) {
      this.currentStableGesture = 'IDLE';
      this.gestureHistory = [];
      this.lastEmittedGesture = swipe;
      this.lastEmittedTime = timestamp;
      // Swipe clears any navigation rearm lock since user is clearly doing something different
      this.rearmLockedGesture = null;
      this.rearmNeutralSince = 0;
      return {
        activeContinuousGesture: swipe,
        confidence: 0.95,
        triggeredEvent: {
          type: swipe,
          confidence: 0.95,
          timestamp,
        },
      };
    }

    // 2. Classify raw instantaneous static gesture from incoming hands
    let rawCandidate: NormalizedGestureType = 'IDLE';
    let candidateConfidence = 0;

    if (allHands && allHands.length > 0) {
      for (const hand of allHands) {
        const instant = classifyInstantStaticGesture(hand);
        if (instant.gesture !== 'IDLE' && instant.confidence > candidateConfidence) {
          rawCandidate = instant.gesture;
          candidateConfidence = instant.confidence;
        }
      }
    }

    // 3. Sliding Window Majority Voting Filter
    this.gestureHistory.push(rawCandidate);
    if (this.gestureHistory.length > this.windowSize) {
      this.gestureHistory.shift();
    }

    // Count frequency in window
    const counts: Partial<Record<NormalizedGestureType, number>> = {};
    for (const g of this.gestureHistory) {
      counts[g] = (counts[g] || 0) + 1;
    }

    // Find dominant candidate
    let dominantGesture: NormalizedGestureType = 'IDLE';
    let maxVotes = 0;
    for (const [g, count] of Object.entries(counts)) {
      if (count && count > maxVotes) {
        maxVotes = count;
        dominantGesture = g as NormalizedGestureType;
      }
    }

    // 4. Update stable gesture if majority consensus reached
    if (maxVotes >= this.majorityThreshold) {
      this.currentStableGesture = dominantGesture;
    }

    // 5. Release-to-Rearm: manage navigation gesture lockout
    if (this.rearmLockedGesture) {
      if (this.currentStableGesture !== this.rearmLockedGesture) {
        // User has moved away from the locked gesture — start/continue neutral timer
        if (this.rearmNeutralSince === 0) {
          this.rearmNeutralSince = timestamp;
        }
        if (timestamp - this.rearmNeutralSince >= GestureStabilizer.REARM_NEUTRAL_MS) {
          // Sufficient neutral hold time — unlock the gesture for rearming
          this.rearmLockedGesture = null;
          this.rearmNeutralSince = 0;
        }
      } else {
        // User is still showing the locked gesture — reset neutral timer
        this.rearmNeutralSince = 0;
      }
    }

    // 6. Edge-Triggered Event Emission
    if (this.currentStableGesture !== 'IDLE') {
      const isNewGesture = this.currentStableGesture !== this.lastEmittedGesture;

      // Block emission if this gesture is currently locked by the rearm system
      const isRearmLocked =
        GestureStabilizer.REARM_GESTURES.has(this.currentStableGesture) &&
        this.rearmLockedGesture === this.currentStableGesture;

      // ONLY emit on gesture CHANGE, never on re-hold, and never while rearm-locked
      if (isNewGesture && !isRearmLocked) {
        this.lastEmittedGesture = this.currentStableGesture;
        this.lastEmittedTime = timestamp;

        // Lock navigation gestures after emission to require release-to-rearm
        if (GestureStabilizer.REARM_GESTURES.has(this.currentStableGesture)) {
          this.rearmLockedGesture = this.currentStableGesture;
          this.rearmNeutralSince = 0;
        }

        return {
          activeContinuousGesture: this.currentStableGesture,
          confidence: candidateConfidence || 0.95,
          triggeredEvent: {
            type: this.currentStableGesture,
            confidence: candidateConfidence || 0.95,
            timestamp,
          },
        };
      }
    } else {
      if (timestamp - this.lastEmittedTime > 200) {
        this.lastEmittedGesture = 'IDLE';
      }
    }

    return {
      activeContinuousGesture: this.currentStableGesture,
      confidence: candidateConfidence,
      triggeredEvent: null,
    };
  }

  public reset(): void {
    this.gestureHistory = [];
    this.currentStableGesture = 'IDLE';
    this.lastEmittedGesture = 'IDLE';
    this.lastEmittedTime = 0;
    this.rearmLockedGesture = null;
    this.rearmNeutralSince = 0;
    this.swipeTracker.reset();
  }
}
