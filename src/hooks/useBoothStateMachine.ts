'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import {
  BoothState,
  PhotoSession,
  NormalizedGestureEvent,
} from '@/types/boothState';
import {
  getAllFrameTemplates,
  DEFAULT_FRAME_TEMPLATE,
  FrameTemplate,
} from '@/config/frameTemplates';
import { CapturedPhoto } from '@/types/photobooth';
import {
  compositePhotoboothStrip,
  CompositeStripResult,
} from '@/utils/templateCompositor';
import { uploadToGoogleDrive } from '@/utils/googleDriveUploader';
import { useSoundEffects } from './useSoundEffects';
import { useBroadcastGallery } from './useBroadcastGallery';

const COUNTDOWN_SECONDS = 3;
const RESULT_AUTO_RESET_SECONDS = 12;
const TRANSITION_COOLDOWN_MS = 400; // Snappy 400ms transition lock
const BACK_NAVIGATION_COOLDOWN_MS = 1800; // 1.8s dedicated cooldown after THUMBS_DOWN back action

// Static frame templates list
const STATIC_FRAME_TEMPLATES = getAllFrameTemplates();

export function useBoothStateMachine(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isGuideOpen: boolean = false,
  setGuideOpen?: (open: boolean) => void
) {
  const allTemplates = useMemo(() => STATIC_FRAME_TEMPLATES, []);

  const [state, setState] = useState<BoothState>('IDLE');
  const [templateIndex, setTemplateIndex] = useState<number>(0);
  const [session, setSession] = useState<PhotoSession>({
    selectedTemplate: STATIC_FRAME_TEMPLATES[0] || DEFAULT_FRAME_TEMPLATE,
    photos: [],
    currentPhotoIndex: 0,
    finalComposite: null,
    startedAt: Date.now(),
  });

  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastTriggeredGesture, setLastTriggeredGesture] = useState<string>('NONE');

  const stateRef = useRef<BoothState>('IDLE');
  stateRef.current = state;

  const sessionRef = useRef<PhotoSession>(session);
  sessionRef.current = session;

  const templateIndexRef = useRef<number>(0);
  templateIndexRef.current = templateIndex;

  const isGuideOpenRef = useRef<boolean>(false);
  isGuideOpenRef.current = isGuideOpen;

  const guideOpenedAtRef = useRef<number>(0);
  const transitionLockUntilRef = useRef<number>(0);
  const backNavLockUntilRef = useRef<number>(0); // Dedicated THUMBS_DOWN back-navigation cooldown

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio cues and Broadcast integration
  const soundEffects = useSoundEffects();
  const { broadcastPhoto } = useBroadcastGallery();

  // Helper to transition state with 400ms cooldown
  const transitionTo = useCallback((nextState: BoothState) => {
    setState(nextState);
    transitionLockUntilRef.current = Date.now() + TRANSITION_COOLDOWN_MS;
  }, []);

  // Reset Session Helper
  const resetSession = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }

    setCountdown(null);
    setIsFlashing(false);
    setErrorMessage(null);
    setTemplateIndex(0);
    setSession({
      selectedTemplate: STATIC_FRAME_TEMPLATES[0] || DEFAULT_FRAME_TEMPLATE,
      photos: [],
      currentPhotoIndex: 0,
      finalComposite: null,
      startedAt: Date.now(),
    });
    transitionTo('IDLE');
  }, [transitionTo]);

  // Update Template Helper with Infinite 360 Modulo Wrapping
  const updateTemplateIndex = useCallback((newIdx: number) => {
    const len = STATIC_FRAME_TEMPLATES.length;
    const wrapped = ((newIdx % len) + len) % len;
    const tpl = STATIC_FRAME_TEMPLATES[wrapped] || DEFAULT_FRAME_TEMPLATE;
    setTemplateIndex(wrapped);
    setSession((prev) => ({
      ...prev,
      selectedTemplate: tpl,
    }));
  }, []);

  // Capture single photo from video element
  const captureCurrentPhoto = useCallback(async (): Promise<CapturedPhoto | null> => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      console.warn('[useBoothStateMachine] Video stream not ready for capture');
      return null;
    }

    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    let dataUrl = '';
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Draw video mirrored horizontally for natural selfie perspective
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
      ctx.restore();

      dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
    
    const now = new Date();
    const photoId = `PHOTO-${sessionRef.current.currentPhotoIndex + 1}-${Date.now().toString(36).toUpperCase()}`;

    const capturedPhoto: CapturedPhoto = {
      id: photoId,
      imageDataUrl: dataUrl,
      timestamp: now.getTime(),
      formattedTime: now.toLocaleTimeString('id-ID'),
      aspectRatio: width / height,
      tags: [`Photo ${sessionRef.current.currentPhotoIndex + 1}`],
    };

    return capturedPhoto;
  }, [videoRef]);

  // Execute Compositing of all 3 photos with selected frame template
  const runCompositing = useCallback(async (photos: CapturedPhoto[], template: FrameTemplate) => {
    setState('COMPOSITING');
    try {
      const photoUrls = photos.map((p) => p.imageDataUrl);
      const compositeResult: CompositeStripResult = await compositePhotoboothStrip(
        photoUrls,
        template,
        {
          mimeType: 'image/png',
          quality: 0.95,
        }
      );

      soundEffects.playSuccess();

      // Wrap composite in CapturedPhoto object for broadcasting to Monitor 2
      const now = new Date();
      const finalCapturedStrip: CapturedPhoto = {
        id: `STRIP-${Date.now().toString(36).toUpperCase()}`,
        imageDataUrl: compositeResult.dataUrl,
        timestamp: compositeResult.timestamp,
        formattedTime: now.toLocaleTimeString('id-ID'),
        aspectRatio: compositeResult.width / compositeResult.height,
        tags: [template.name, 'Final Strip'],
      };

      setSession((prev) => ({
        ...prev,
        finalComposite: compositeResult,
        uploadStatus: 'PENDING',
      }));

      // Broadcast to Monitor 2
      broadcastPhoto(finalCapturedStrip);

      // Transition to RESULT immediately so user doesn't wait
      transitionTo('RESULT');

      // Schedule Auto-Reset
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = setTimeout(() => {
        resetSession();
      }, RESULT_AUTO_RESET_SECONDS * 1000);

      // Fire and forget upload
      executeUpload(compositeResult, now.getTime());

    } catch (err: any) {
      console.error('[useBoothStateMachine] Compositing error:', err);
      setErrorMessage(err.message || 'Gagal membuat strip foto photobooth.');
      transitionTo('READY');
    }
  }, [soundEffects, broadcastPhoto, resetSession, transitionTo]);

  const executeUpload = useCallback((compositeResult: CompositeStripResult, timestamp: number) => {
    setSession((prev) => ({
      ...prev,
      uploadStatus: 'PENDING',
      uploadError: undefined,
    }));
    
    uploadToGoogleDrive(compositeResult, `PTIK-Photo-${timestamp}.png`)
      .then((response) => {
        if (response.success) {
          setSession((prev) => ({
            ...prev,
            uploadStatus: 'SUCCESS',
            cloudUrl: response.fileUrl,
          }));
        } else {
          setSession((prev) => ({
            ...prev,
            uploadStatus: 'FAILED',
            uploadError: response.error,
          }));
        }
      })
      .catch((err) => {
        setSession((prev) => ({
          ...prev,
          uploadStatus: 'FAILED',
          uploadError: err.message,
        }));
      });
  }, []);

  const retryUploadManually = useCallback(() => {
    if (sessionRef.current.finalComposite && sessionRef.current.uploadStatus === 'FAILED') {
      executeUpload(sessionRef.current.finalComposite, Date.now());
    }
  }, [executeUpload]);

  // Start 3..2..1 Countdown for current photo
  const startCountdown = useCallback(() => {
    setState('COUNTDOWN');
    let currentSec = COUNTDOWN_SECONDS;
    setCountdown(currentSec);
    soundEffects.playCountdownBeep(false);

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    countdownTimerRef.current = setInterval(() => {
      currentSec -= 1;
      if (currentSec > 0) {
        setCountdown(currentSec);
        soundEffects.playCountdownBeep(currentSec === 1);
      } else {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setCountdown(0);

        // Transition to CAPTURE
        setState('CAPTURE');
        setIsFlashing(true);
        soundEffects.playShutter();
        setTimeout(() => setIsFlashing(false), 350);

        // Perform capture
        captureCurrentPhoto().then((newPhoto) => {
          if (!newPhoto) {
            console.error('[useBoothStateMachine] Photo capture failed');
            setErrorMessage('Gagal mengambil foto. Silakan coba pose kembali.');
            transitionTo('READY');
            return;
          }

          const currentIdx = sessionRef.current.currentPhotoIndex;
          const updatedPhotos = [...sessionRef.current.photos, newPhoto];

          setSession((prev) => ({
            ...prev,
            photos: updatedPhotos,
          }));

          // Check if all 3 photos are completed
          if (currentIdx >= 2) {
            // Photo 3 complete -> Immediately run Compositor
            runCompositing(updatedPhotos, sessionRef.current.selectedTemplate);
          } else {
            // Advance to next photo -> Return to READY with 400ms cooldown
            const nextIdx = currentIdx + 1;
            setSession((prev) => ({
              ...prev,
              currentPhotoIndex: nextIdx,
            }));
            transitionTo('READY');
          }
        });
      }
    }, 1000);
  }, [soundEffects, captureCurrentPhoto, runCompositing, transitionTo]);

  // Normalized Gesture Event Dispatcher
  const handleGestureEvent = useCallback(
    (event: NormalizedGestureEvent) => {
      const now = Date.now();
      setLastTriggeredGesture(`${event.type} (${Math.round(event.confidence * 100)}%)`);

      // 1. Lock/Freeze during Photo Process Stages
      const currentState = stateRef.current;
      if (
        currentState === 'COUNTDOWN' ||
        currentState === 'CAPTURE' ||
        currentState === 'COMPOSITING' ||
        currentState === 'UPLOADING'
      ) {
        return; // Complete input freeze during photo capture & processing
      }

      // 2. Inter-State Transition Lock Check (400ms delay)
      if (now < transitionLockUntilRef.current) {
        return; // Ignore gesture while transitioning between major states
      }

      // 2b. Dedicated Back-Navigation Cooldown (1.8s) for THUMBS_DOWN
      // Prevents multi-trigger when user holds thumbs down through state transitions
      if (event.type === 'THUMBS_DOWN' && now < backNavLockUntilRef.current) {
        return; // Back-navigation cooldown still active — ignore this THUMBS_DOWN
      }

      // 3. Gesture Guide Modal Handling
      if (isGuideOpenRef.current) {
        // When Guide is open: Explicit close triggers
        if (
          event.type === 'OK_SIGN' ||
          event.type === 'PEACE' ||
          event.type === 'THUMBS_DOWN'
        ) {
          soundEffects.playFrameLock();
          transitionLockUntilRef.current = now + TRANSITION_COOLDOWN_MS;
          setGuideOpen?.(false);
          return;
        }
        if (event.type === 'L_SIGN') {
          // Allow toggle close only after 1.2s cooldown
          if (now - guideOpenedAtRef.current >= 1200) {
            soundEffects.playClearChime();
            transitionLockUntilRef.current = now + TRANSITION_COOLDOWN_MS;
            setGuideOpen?.(false);
          }
          return;
        }
        return; // Absorb all other gestures while modal is open
      }

      // If Guide is closed, 'L_SIGN' opens the Guide
      if (event.type === 'L_SIGN') {
        guideOpenedAtRef.current = now;
        soundEffects.playFrameLock();
        setGuideOpen?.(true);
        return;
      }

      // 4. State Machine Gesture Mapping
      switch (currentState) {
        case 'IDLE':
          // Start session ONLY with PEACE (✌️) to prevent accidental triggers from random hand movements
          if (event.type === 'PEACE') {
            soundEffects.playFrameLock();
            transitionTo('FRAME_SELECTION');
          }
          break;

        case 'FRAME_SELECTION':
          if (event.type === 'SWIPE_LEFT') {
            soundEffects.playCountdownBeep(false);
            updateTemplateIndex(templateIndexRef.current - 1);
          } else if (event.type === 'SWIPE_RIGHT') {
            soundEffects.playCountdownBeep(false);
            updateTemplateIndex(templateIndexRef.current + 1);
          } else if (event.type === 'OK_SIGN') {
            // Confirm Frame with OK Sign (👌)
            // Always reset captured photos when (re-)entering capture flow
            // This fixes the bug where old photos persist after back-navigating to frame selection
            soundEffects.playFrameLock();
            setSession((prev) => ({
              ...prev,
              photos: [],
              currentPhotoIndex: 0,
              finalComposite: null,
            }));
            transitionTo('READY');
          } else if (event.type === 'THUMBS_DOWN') {
            // Global Back to IDLE
            soundEffects.playClearChime();
            backNavLockUntilRef.current = now + BACK_NAVIGATION_COOLDOWN_MS;
            resetSession();
          }
          break;

        case 'READY': {
          if (event.type === 'PEACE') {
            startCountdown();
          } else if (event.type === 'THUMBS_DOWN') {
            const currentIdx = sessionRef.current.currentPhotoIndex;
            const currentPhotos = sessionRef.current.photos;

            soundEffects.playClearChime();
            backNavLockUntilRef.current = now + BACK_NAVIGATION_COOLDOWN_MS;

            if (currentIdx > 0 && currentPhotos.length > 0) {
              // Step-by-step Undo: remove last photo, go back to retake the previous one
              // e.g. on photo 3 (idx=2) → remove photo 2, set idx=1 → retake photo 2
              const previousIdx = currentIdx - 1;
              const rolledBackPhotos = currentPhotos.slice(0, previousIdx);
              setSession((prev) => ({
                ...prev,
                photos: rolledBackPhotos,
                currentPhotoIndex: previousIdx,
              }));
              // Stay in READY for retake — apply transition cooldown to re-render UI
              transitionLockUntilRef.current = now + TRANSITION_COOLDOWN_MS;
            } else {
              // On photo 1 (idx=0): go back to Frame Selection, reset all photos
              setSession((prev) => ({
                ...prev,
                photos: [],
                currentPhotoIndex: 0,
                finalComposite: null,
              }));
              transitionTo('FRAME_SELECTION');
            }
          }
          break;
        }

        case 'RESULT':
          if (event.type === 'THUMBS_DOWN' || event.type === 'OPEN_PALM') {
            soundEffects.playClearChime();
            if (event.type === 'THUMBS_DOWN') {
              backNavLockUntilRef.current = now + BACK_NAVIGATION_COOLDOWN_MS;
            }
            resetSession();
          }
          break;

        default:
          break;
      }
    },
    [soundEffects, resetSession, startCountdown, updateTemplateIndex, setGuideOpen, transitionTo]
  );

  // Manual trigger actions for development / keyboard fallback
  const startSessionManually = useCallback(() => {
    transitionTo('FRAME_SELECTION');
  }, [transitionTo]);

  const selectNextFrame = useCallback(() => {
    updateTemplateIndex(templateIndexRef.current + 1);
  }, [updateTemplateIndex]);

  const selectPrevFrame = useCallback(() => {
    updateTemplateIndex(templateIndexRef.current - 1);
  }, [updateTemplateIndex]);

  const confirmFrameManually = useCallback(() => {
    if (stateRef.current === 'FRAME_SELECTION') {
      soundEffects.playFrameLock();
      transitionTo('READY');
    }
  }, [soundEffects, transitionTo]);

  const triggerPeaceManually = useCallback(() => {
    if (stateRef.current === 'READY') {
      startCountdown();
    }
  }, [startCountdown]);

  return {
    state,
    session,
    templateIndex,
    allTemplates,
    countdown,
    isFlashing,
    errorMessage,
    lastTriggeredGesture,
    handleGestureEvent,
    resetSession,
    startSessionManually,
    selectNextFrame,
    selectPrevFrame,
    confirmFrameManually,
    triggerPeaceManually,
    retryUploadManually,
    soundEffects,
  };
}
