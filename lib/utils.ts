/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resizes an image to a specific aspect ratio by padding it with black bars (letterboxing/pillarboxing).
 * The output image will have a maximum dimension of 1024px to keep API request sizes reasonable.
 * @param dataUrl The base64 data URL of the source image.
 * @param aspectRatio The target aspect ratio as a string (e.g., "16:9", "1:1").
 * @returns A promise that resolves to the data URL of the resized and padded image.
 */
export function resizeImageToAspectRatio(
  dataUrl: string,
  aspectRatio: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const [wRatio, hRatio] = aspectRatio.split(':').map(Number);
    if (isNaN(wRatio) || isNaN(hRatio) || hRatio === 0) {
      return reject(new Error('Invalid aspect ratio format'));
    }
    const targetRatio = wRatio / hRatio;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const origWidth = img.width;
      const origHeight = img.height;
      const origRatio = origWidth / origHeight;
      
      // If the aspect ratio is already correct (within a small tolerance), do nothing.
      if (Math.abs(targetRatio - origRatio) < 0.01) {
          resolve(dataUrl);
          return;
      }

      let canvasWidth = origWidth;
      let canvasHeight = origHeight;

      if (targetRatio > origRatio) {
        // Target is wider than original -> pillarbox. New width is based on original height.
        canvasWidth = origHeight * targetRatio;
      } else {
        // Target is taller than original -> letterbox. New height is based on original width.
        canvasHeight = origWidth / targetRatio;
      }
      
      const MAX_DIMENSION = 1024;
      let scale = 1;
      if (canvasWidth > MAX_DIMENSION || canvasHeight > MAX_DIMENSION) {
        if (canvasWidth > canvasHeight) {
            scale = MAX_DIMENSION / canvasWidth;
        } else {
            scale = MAX_DIMENSION / canvasHeight;
        }
      }

      const finalCanvasWidth = Math.round(canvasWidth * scale);
      const finalCanvasHeight = Math.round(canvasHeight * scale);
      const finalImgWidth = Math.round(origWidth * scale);
      const finalImgHeight = Math.round(origHeight * scale);

      canvas.width = finalCanvasWidth;
      canvas.height = finalCanvasHeight;

      // Fill background with black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, finalCanvasWidth, finalCanvasHeight);

      // Draw the (scaled) original image centered on the new canvas
      const drawX = (finalCanvasWidth - finalImgWidth) / 2;
      const drawY = (finalCanvasHeight - finalImgHeight) / 2;
      ctx.drawImage(img, 0, 0, origWidth, origHeight, drawX, drawY, finalImgWidth, finalImgHeight);

      // Get the result as a new data URL
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject(new Error('Failed to load image for resizing.'));
    img.src = dataUrl;
  });
}

/**
 * Crops an image to a specific aspect ratio from the center.
 * @param dataUrl The base64 data URL of the source image.
 * @param targetAspectRatio The target aspect ratio as a number (width / height).
 * @returns A promise that resolves to the data URL of the cropped image.
 */
export function cropImageToAspectRatio(
  dataUrl: string,
  targetAspectRatio: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      const origWidth = img.width;
      const origHeight = img.height;
      const origRatio = origWidth / origHeight;

      let cropWidth, cropHeight, cropX, cropY;

      if (origRatio > targetAspectRatio) {
        // Original is wider than target (e.g., landscape src for portrait target)
        // Crop the width to match the target aspect ratio
        cropHeight = origHeight;
        cropWidth = origHeight * targetAspectRatio;
        cropX = (origWidth - cropWidth) / 2;
        cropY = 0;
      } else {
        // Original is taller than target (or same ratio)
        // Crop the height to match the target aspect ratio
        cropWidth = origWidth;
        cropHeight = origWidth / targetAspectRatio;
        cropX = 0;
        cropY = (origHeight - cropHeight) / 2;
      }

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      // Draw the cropped portion of the original image onto the canvas
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      // Get the result as a new data URL
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping.'));
    img.src = dataUrl;
  });
}