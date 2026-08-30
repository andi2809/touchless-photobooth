import { FrameTemplate } from '@/config/frameTemplates';
import { CapturedPhoto } from './photobooth';
import { CompositeStripResult } from '@/utils/templateCompositor';

export type NormalizedGestureType =
  | 'IDLE'
  | 'OPEN_PALM'
  | 'PEACE'
  | 'OK_SIGN'
  | 'THUMBS_UP'
  | 'THUMBS_DOWN'
  | 'L_SIGN'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT';

export interface NormalizedGestureEvent {
  type: NormalizedGestureType;
  confidence: number;
  timestamp: number;
  rawLandmarks?: any;
}

export type BoothState =
  | 'IDLE'
  | 'FRAME_SELECTION'
  | 'READY'
  | 'COUNTDOWN'
  | 'CAPTURE'
  | 'COMPOSITING'
  | 'UPLOADING'
  | 'RESULT'
  | 'RESETTING';

export interface PhotoSession {
  selectedTemplate: FrameTemplate;
  photos: CapturedPhoto[];
  currentPhotoIndex: number; // 0 = photo 1, 1 = photo 2, 2 = photo 3
  finalComposite: CompositeStripResult | null;
  cloudUrl?: string;
  startedAt: number;
}

export type BoothAction =
  | { type: 'START_SESSION' }
  | { type: 'SELECT_PREV_FRAME' }
  | { type: 'SELECT_NEXT_FRAME' }
  | { type: 'CONFIRM_FRAME' }
  | { type: 'GESTURE_PEACE' }
  | { type: 'GESTURE_OK_SIGN' }
  | { type: 'GESTURE_THUMBS_DOWN' }
  | { type: 'GESTURE_L_SIGN' }
  | { type: 'COUNTDOWN_TICK'; count: number }
  | { type: 'COUNTDOWN_COMPLETE' }
  | { type: 'START_CAPTURE' }
  | { type: 'PHOTO_CAPTURED'; photo: CapturedPhoto }
  | { type: 'PHOTO_CAPTURE_FAILED'; error: string }
  | { type: 'COMPOSITING_START' }
  | { type: 'COMPOSITING_SUCCESS'; composite: CompositeStripResult }
  | { type: 'COMPOSITING_ERROR'; error: string }
  | { type: 'UPLOAD_START' }
  | { type: 'UPLOAD_SUCCESS'; cloudUrl?: string }
  | { type: 'UPLOAD_ERROR'; error: string }
  | { type: 'RESET_SESSION' };
