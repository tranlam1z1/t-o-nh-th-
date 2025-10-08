/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image for print sheet: ${src.substring(0, 50)}...`));
        img.src = src;
    });
}

/**
 * Creates a printable sheet of ID photos on a standard 4x6 inch paper layout.
 * @param portraitDataUrl The data URL of the single portrait image to be tiled.
 * @param targetPortraitWidthCm The desired width of a single portrait in centimeters.
 * @param targetPortraitHeightCm The desired height of a single portrait in centimeters.
 * @returns A promise that resolves to a data URL of the generated print sheet (JPEG format).
 */
export async function createPrintSheet(
    portraitDataUrl: string,
    targetPortraitWidthCm: number,
    targetPortraitHeightCm: number
): Promise<string> {
    const DPI = 300; // Standard print resolution
    const PAPER_WIDTH_INCHES = 4;
    const PAPER_HEIGHT_INCHES = 6;
    const CM_TO_INCH = 1 / 2.54;

    // Convert all dimensions to pixels
    const paperWidthPx = PAPER_WIDTH_INCHES * DPI;
    const paperHeightPx = PAPER_HEIGHT_INCHES * DPI;
    const portraitWidthPx = targetPortraitWidthCm * CM_TO_INCH * DPI;
    const portraitHeightPx = targetPortraitHeightCm * CM_TO_INCH * DPI;

    const canvas = document.createElement('canvas');
    canvas.width = paperWidthPx;
    canvas.height = paperHeightPx;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D canvas context for print sheet');
    }

    // Fill background with white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, paperWidthPx, paperHeightPx);

    const portraitImage = await loadImage(portraitDataUrl);

    // Calculate grid layout
    const padding = 0.1 * CM_TO_INCH * DPI; // Small padding between photos
    const cols = Math.floor((paperWidthPx - padding) / (portraitWidthPx + padding));
    const rows = Math.floor((paperHeightPx - padding) / (portraitHeightPx + padding));

    if (cols === 0 || rows === 0) {
        throw new Error('Portrait size is too large to fit on a 4x6 inch paper.');
    }

    // Calculate total grid size to center it on the page
    const totalGridWidth = cols * portraitWidthPx + (cols - 1) * padding;
    const totalGridHeight = rows * portraitHeightPx + (rows - 1) * padding;
    const startX = (paperWidthPx - totalGridWidth) / 2;
    const startY = (paperHeightPx - totalGridHeight) / 2;

    // Draw the images onto the canvas
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = startX + col * (portraitWidthPx + padding);
            const y = startY + row * (portraitHeightPx + padding);
            ctx.drawImage(portraitImage, x, y, portraitWidthPx, portraitHeightPx);
        }
    }

    // Return as a high-quality JPEG
    return canvas.toDataURL('image/jpeg', 0.95);
}