export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface HandLandmarkResult {
  landmarks: NormalizedLandmark[];
  handedness?: string;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export type ActiveGesture = 
  | 'IDLE'
  | 'FRAME_CAPTURE'
  | 'AIR_DRAW'
  | 'THUMBS_UP'
  | 'OPEN_PALM'
  | 'PEACE';

export type CaptureStage =
  | 'IDLE'
  | 'FRAMING'              // Stage 1: Hand frame detected, holding to lock
  | 'LOCKED_COUNTDOWN'     // Stage 2: Box locked, hands free, 3..2..1 pose countdown
  | 'CAPTURING'            // Shutter flash & snapshot rendering
  | 'SAVED_PREVIEW';       // Modal preview / broadcasting

export type PhotoboothFrameId = 'none' | 'cyber' | 'retro' | 'comic';

export interface PhotoboothFrame {
  id: PhotoboothFrameId;
  name: string;
  thumbnail: string;
  imageSrc: string;
  tag: string;
  accentColor: string;
}

export interface StickerProp {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface GestureDetectionState {
  gesture: ActiveGesture;
  confidence: number;
  frameBox: BoundingBox | null;
  drawPoint: { x: number; y: number } | null;
  detectedHandsCount: number;
  landmarks: NormalizedLandmark[][];
  indexFingerTip?: { x: number; y: number } | null;
}

export interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  size: number;
  isNewStroke?: boolean;
}

export interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  size: number;
}

export interface CapturedPhoto {
  id: string;
  imageDataUrl: string;
  timestamp: number;
  formattedTime: string;
  aspectRatio: number;
  frameId?: PhotoboothFrameId;
  tags?: string[];
  cloudSynced?: boolean;
  cloudUrl?: string;
}

export type BroadcastMessageType = 
  | 'PHOTO_CAPTURED'
  | 'REQUEST_GALLERY_SYNC'
  | 'GALLERY_SYNC_RESPONSE'
  | 'CLEAR_ALL_PHOTOS';

export interface BroadcastPayload {
  type: BroadcastMessageType;
  photo?: CapturedPhoto;
  photos?: CapturedPhoto[];
  timestamp: number;
}

export type NeonColor = {
  name: string;
  hex: string;
  glow: string;
  tailwindClass: string;
};

export interface VirtualCursorState {
  x: number;
  y: number;
  isActive: boolean;
  hoveredTargetId: string | null;
  dwellProgress: number; // 0 to 1
}
