/**
 * Browser Image Compression & Multi-Variant Generator
 * Encodes photos directly in the browser into 3 optimized WebP sizes:
 * 1. thumb: max 250px (~15KB) - Cart, wishlist, mini order items
 * 2. preview: max 800px (~70KB) - Shop grid, search results, gallery
 * 3. full: max 1800px (~300KB) - Product details zoom & high-res inspection
 */

export interface ImageClusterVariants {
  thumb: Blob;
  preview: Blob;
  full: Blob;
  previewUrl: string; // Object URL for immediate zero-delay preview in dashboard
  width: number;
  height: number;
}

interface DimensionProfile {
  maxEdge: number;
  quality: number;
}

const PROFILES: Record<'thumb' | 'preview' | 'full', DimensionProfile> = {
  thumb: { maxEdge: 250, quality: 0.75 },
  preview: { maxEdge: 800, quality: 0.82 },
  full: { maxEdge: 1800, quality: 0.86 },
};

function renderToCanvas(
  source: ImageBitmap | HTMLImageElement,
  srcWidth: number,
  srcHeight: number,
  maxEdge: number
): HTMLCanvasElement {
  const scale = Math.min(maxEdge / srcWidth, maxEdge / srcHeight, 1);
  const targetWidth = Math.max(1, Math.round(srcWidth * scale));
  const targetHeight = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  }
  return canvas;
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback to jpeg if WebP conversion fails on legacy browser
          canvas.toBlob(
            (fallbackBlob) => {
              if (fallbackBlob) resolve(fallbackBlob);
              else reject(new Error('Canvas toBlob failed'));
            },
            'image/jpeg',
            quality
          );
        }
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Generates the 3 WebP variants in parallel from a user-selected File
 */
export async function generateImageVariants(file: File): Promise<ImageClusterVariants> {
  let sourceBitmap: ImageBitmap | null = null;
  let sourceImg: HTMLImageElement | null = null;
  let origWidth = 0;
  let origHeight = 0;

  // 1. Asynchronously decode with auto EXIF rotation
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      sourceBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      origWidth = sourceBitmap.width;
      origHeight = sourceBitmap.height;
    } catch {
      // Fall through to HTMLImageElement
      sourceBitmap = null;
    }
  }

  if (!sourceBitmap) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

    sourceImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.src = dataUrl;
    });
    origWidth = sourceImg.naturalWidth || sourceImg.width;
    origHeight = sourceImg.naturalHeight || sourceImg.height;
  }

  const source = sourceBitmap || sourceImg!;

  // 2. Render 3 targeted canvases
  const thumbCanvas = renderToCanvas(source, origWidth, origHeight, PROFILES.thumb.maxEdge);
  const previewCanvas = renderToCanvas(source, origWidth, origHeight, PROFILES.preview.maxEdge);
  const fullCanvas = renderToCanvas(source, origWidth, origHeight, PROFILES.full.maxEdge);

  // 3. Export all 3 to WebP blobs concurrently
  const [thumbBlob, previewBlob, fullBlob] = await Promise.all([
    canvasToWebpBlob(thumbCanvas, PROFILES.thumb.quality),
    canvasToWebpBlob(previewCanvas, PROFILES.preview.quality),
    canvasToWebpBlob(fullCanvas, PROFILES.full.quality),
  ]);

  if (sourceBitmap && typeof sourceBitmap.close === 'function') {
    sourceBitmap.close();
  }

  const previewUrl = URL.createObjectURL(previewBlob);

  return {
    thumb: thumbBlob,
    preview: previewBlob,
    full: fullBlob,
    previewUrl,
    width: origWidth,
    height: origHeight,
  };
}

/**
 * Uploads a 3-variant image cluster directly to the Cloudflare R2 upload endpoint.
 */
export async function uploadImageClusterToR2(
  apiBaseUrl: string,
  variants: { thumb: Blob; preview: Blob; full: Blob },
  token?: string | null
): Promise<{ imageId: string; url: string }> {
  const cleanBase = apiBaseUrl.replace(/\/$/, '');
  const imageId = `img_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;

  const headers: Record<string, string> = {
    'Content-Type': 'image/webp',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const uploadVariant = async (variant: 'thumb' | 'preview' | 'full', blob: Blob) => {
    const res = await fetch(`${cleanBase}/api/upload/${imageId}/${variant}`, {
      method: 'PUT',
      headers,
      body: blob,
      credentials: 'include',
    });
    if (!res.ok) {
      let errMsg = `Upload failed for ${variant} (${res.status})`;
      try {
        const json = await res.json();
        if (json.error) errMsg = json.error;
      } catch {
        // use default errMsg
      }
      throw new Error(errMsg);
    }
    return res.json();
  };

  // Upload all 3 variants in parallel
  await Promise.all([
    uploadVariant('thumb', variants.thumb),
    uploadVariant('preview', variants.preview),
    uploadVariant('full', variants.full),
  ]);

  return {
    imageId,
    url: `${cleanBase}/api/assets/products/${imageId}/preview.webp`,
  };
}

/**
 * Legacy single-file compressor (preserved for backward compatibility)
 */
export async function compressImage(
  file: File,
  maxDimension = 1200,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Failed to parse image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
