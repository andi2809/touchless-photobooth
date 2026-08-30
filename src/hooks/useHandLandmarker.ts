'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { NormalizedLandmark } from '@/types/photobooth';

interface UseHandLandmarkerOptions {
  numHands?: number;
  minDetectionConfidence?: number;
  minTrackingConfidence?: number;
  autoStartCamera?: boolean;
}

interface CameraDevice {
  deviceId: string;
  label: string;
}

export function useHandLandmarker(options: UseHandLandmarkerOptions = {}) {
  const {
    numHands = 4,
    minDetectionConfidence = 0.5,
    minTrackingConfidence = 0.5,
    autoStartCamera = true,
  } = options;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [fps, setFps] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 1280, height: 720 });

  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(performance.now());

  // Enumerate connected cameras
  const refreshCameraDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1} (${d.deviceId.slice(0, 5)}...)`,
        }));

      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn('[useHandLandmarker] Failed to enumerate camera devices:', err);
    }
  }, [selectedCameraId]);

  // Initialize MediaPipe HandLandmarker with offline & CDN fallback
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        let visionResolver;
        // Attempt 1: Load from local public/wasm directory
        try {
          visionResolver = await FilesetResolver.forVisionTasks('/wasm');
        } catch (localWasmErr) {
          console.warn('[useHandLandmarker] Local WASM load failed, falling back to CDN:', localWasmErr);
          // Attempt 2: Fallback to official CDN
          visionResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
          );
        }

        if (!isMounted) return;

        // Model path: local public/models/hand_landmarker.task with fallback
        const modelAssetPath = '/models/hand_landmarker.task';

        const handLandmarker = await HandLandmarker.createFromOptions(visionResolver, {
          baseOptions: {
            modelAssetPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands,
          minHandDetectionConfidence: minDetectionConfidence,
          minHandPresenceConfidence: minDetectionConfidence,
          minTrackingConfidence: minTrackingConfidence,
        });

        if (isMounted) {
          landmarkerRef.current = handLandmarker;
          setIsModelReady(true);
          setIsLoading(false);
          console.log('[useHandLandmarker] MediaPipe HandLandmarker GPU initialized successfully.');
        }
      } catch (err: any) {
        console.error('[useHandLandmarker] Failed to initialize HandLandmarker:', err);
        if (isMounted) {
          setErrorMessage(
            err?.message || 'Gagal memuat model MediaPipe AI. Pastikan browser mendukung WebGL & WebAssembly.'
          );
          setIsLoading(false);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {
          // ignore cleanup errors
        }
        landmarkerRef.current = null;
      }
    };
  }, [numHands, minDetectionConfidence, minTrackingConfidence]);

  // Start Camera
  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        setErrorMessage(null);

        // Stop existing stream if any
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const targetDeviceId = deviceId || selectedCameraId;

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: targetDeviceId ? { exact: targetDeviceId } : undefined,
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 60, min: 30 },
            facingMode: 'user',
          },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise<void>((resolve) => {
            if (!videoRef.current) return resolve();
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                setVideoDimensions({
                  width: videoRef.current.videoWidth || 1280,
                  height: videoRef.current.videoHeight || 720,
                });
              }
              resolve();
            };
          });
          await videoRef.current.play();
        }

        setIsCameraActive(true);
        await refreshCameraDevices();
      } catch (err: any) {
        console.error('[useHandLandmarker] Camera access error:', err);
        let msg = 'Izin kamera ditolak atau kamera tidak dapat diakses.';
        if (err.name === 'NotAllowedError') {
          msg = 'Izin akses kamera ditolak. Silakan izinkan kamera pada browser Anda.';
        } else if (err.name === 'NotFoundError') {
          msg = 'Kamera tidak ditemukan. Hubungkan webcam dan muat ulang halaman.';
        }
        setErrorMessage(msg);
        setIsCameraActive(false);
      }
    },
    [selectedCameraId, refreshCameraDevices]
  );

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Switch camera device
  const switchCamera = useCallback(
    async (deviceId: string) => {
      setSelectedCameraId(deviceId);
      if (isCameraActive) {
        await startCamera(deviceId);
      }
    },
    [isCameraActive, startCamera]
  );

  // Auto start camera if enabled and model is ready
  useEffect(() => {
    if (autoStartCamera && isModelReady && !isCameraActive) {
      startCamera();
    }
  }, [autoStartCamera, isModelReady, isCameraActive, startCamera]);

  // Execute single detection frame
  const detectHands = useCallback(
    (videoEl: HTMLVideoElement, timestamp: number): NormalizedLandmark[][] => {
      if (!landmarkerRef.current || !videoEl || videoEl.readyState < 2) {
        return [];
      }

      try {
        if (videoEl.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = videoEl.currentTime;
          const result: HandLandmarkerResult = landmarkerRef.current.detectForVideo(videoEl, timestamp);

          // Update FPS counter every 500ms
          frameCountRef.current += 1;
          const now = performance.now();
          if (now - lastFpsUpdateRef.current >= 500) {
            const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
            setFps(currentFps);
            frameCountRef.current = 0;
            lastFpsUpdateRef.current = now;
          }

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
        }
      } catch (err) {
        // Skip occasional frame drop errors
      }

      return [];
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    isLoading,
    isModelReady,
    isCameraActive,
    errorMessage,
    availableCameras,
    selectedCameraId,
    videoDimensions,
    fps,
    videoRef,
    streamRef,
    startCamera,
    stopCamera,
    switchCamera,
    detectHands,
    refreshCameraDevices,
  };
}
