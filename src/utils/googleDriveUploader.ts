import { CompositeStripResult } from './templateCompositor';

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  fileUrl?: string;
  downloadUrl?: string;
  id?: string;
}

export async function uploadToGoogleDrive(
  composite: CompositeStripResult,
  filenameOverride?: string
): Promise<UploadResponse> {
  // Use existing environment variable for the script URL
  // If not set, use a fallback mechanism or error out gracefully
  const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    return {
      success: false,
      error: 'Google Apps Script URL is not configured in NEXT_PUBLIC_GOOGLE_SCRIPT_URL.',
    };
  }

  try {
    const timestamp = new Date().getTime();
    const filename = filenameOverride || `PTIK-Photobooth-${timestamp}.png`;

    // Ensure we only send the pure base64 string without the data URL prefix if needed, 
    // but the existing Code.gs handles replacing /^data:image\/(png|jpeg|jpg);base64,/ automatically.
    const payload = {
      image: composite.dataUrl,
      filename: filename,
    };

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Use text/plain to avoid CORS preflight issues with Google Apps Script
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as UploadResponse;
  } catch (err: any) {
    console.error('[GoogleDriveUploader] Upload failed:', err);
    return {
      success: false,
      error: err.message || 'Unknown network error occurred during upload',
    };
  }
}
