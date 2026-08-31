'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CapturedPhoto, BroadcastPayload } from '@/types/photobooth';
import { saveGalleryPhotos, loadGalleryPhotos, clearGalleryPhotos } from '@/utils/idbStorage';

const CHANNEL_NAME = 'booth_gallery';
const MAX_PHOTOS_LIMIT = 48;

export function useBroadcastGallery() {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [latestPhoto, setLatestPhoto] = useState<CapturedPhoto | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Load photos from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    loadGalleryPhotos().then((storedPhotos) => {
      if (mounted && Array.isArray(storedPhotos) && storedPhotos.length > 0) {
        setPhotos(storedPhotos);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Save photos to IndexedDB on change
  const savePhotosToStorage = useCallback((updatedPhotos: CapturedPhoto[]) => {
    saveGalleryPhotos(updatedPhotos.slice(0, MAX_PHOTOS_LIMIT));
  }, []);

  // Setup BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      console.warn('[useBroadcastGallery] BroadcastChannel is not supported by this browser.');
      return;
    }

    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;
    setIsConnected(true);

    channel.onmessage = (event: MessageEvent<BroadcastPayload>) => {
      const payload = event.data;
      if (!payload || !payload.type) return;

      switch (payload.type) {
        case 'PHOTO_CAPTURED':
          if (payload.photo) {
            const newPhoto = payload.photo;
            setLatestPhoto(newPhoto);
            setPhotos((prev) => {
              const exists = prev.some((p) => p.id === newPhoto.id);
              if (exists) return prev;
              const next = [newPhoto, ...prev].slice(0, MAX_PHOTOS_LIMIT);
              savePhotosToStorage(next);
              return next;
            });
          }
          break;

        case 'REQUEST_GALLERY_SYNC':
          // Respond with current photos if we have any
          setPhotos((currentPhotos) => {
            if (currentPhotos.length > 0) {
              channel.postMessage({
                type: 'GALLERY_SYNC_RESPONSE',
                photos: currentPhotos,
                timestamp: Date.now(),
              });
            }
            return currentPhotos;
          });
          break;

        case 'GALLERY_SYNC_RESPONSE':
          if (payload.photos && Array.isArray(payload.photos)) {
            setPhotos((prev) => {
              const combined = [...payload.photos!, ...prev];
              // Remove duplicates
              const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
              const sorted = unique.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_PHOTOS_LIMIT);
              savePhotosToStorage(sorted);
              return sorted;
            });
          }
          break;

        case 'DELETE_SINGLE_PHOTO':
          if (payload.photoId) {
            setPhotos((prev) => {
              const next = prev.filter((p) => p.id !== payload.photoId);
              savePhotosToStorage(next);
              return next;
            });
            setLatestPhoto((prev) => (prev?.id === payload.photoId ? null : prev));
          }
          break;

        case 'CLEAR_ALL_PHOTOS':
          setPhotos([]);
          setLatestPhoto(null);
          clearGalleryPhotos();
          break;
      }
    };

    // Ask other open tabs for photo history
    channel.postMessage({
      type: 'REQUEST_GALLERY_SYNC',
      timestamp: Date.now(),
    });

    return () => {
      channel.close();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [savePhotosToStorage]);

  // Broadcast newly captured photo
  const broadcastPhoto = useCallback(
    (photo: CapturedPhoto) => {
      setLatestPhoto(photo);
      setPhotos((prev) => {
        const next = [photo, ...prev].slice(0, MAX_PHOTOS_LIMIT);
        savePhotosToStorage(next);
        return next;
      });

      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: 'PHOTO_CAPTURED',
            photo,
            timestamp: Date.now(),
          });
        } catch (e) {
          console.error('[useBroadcastGallery] Failed to post message to BroadcastChannel:', e);
        }
      }
    },
    [savePhotosToStorage]
  );

  // Clear all photos across all synced tabs
  const clearAllPhotos = useCallback(() => {
    setPhotos([]);
    setLatestPhoto(null);
    clearGalleryPhotos();

    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'CLEAR_ALL_PHOTOS',
        timestamp: Date.now(),
      });
    }
  }, []);

  // Delete single photo
  const deletePhoto = useCallback(
    (id: string) => {
      setPhotos((prev) => {
        const next = prev.filter((p) => p.id !== id);
        savePhotosToStorage(next);
        return next;
      });
      setLatestPhoto((prev) => (prev?.id === id ? null : prev));

      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: 'DELETE_SINGLE_PHOTO',
            photoId: id,
            timestamp: Date.now(),
          });
        } catch (e) {
          console.error('[useBroadcastGallery] Failed to post DELETE_SINGLE_PHOTO:', e);
        }
      }
    },
    [savePhotosToStorage]
  );

  // Dismiss latest photo popup
  const dismissLatestPhoto = useCallback(() => {
    setLatestPhoto(null);
  }, []);

  return {
    photos,
    latestPhoto,
    isConnected,
    broadcastPhoto,
    clearAllPhotos,
    deletePhoto,
    dismissLatestPhoto,
  };
}
