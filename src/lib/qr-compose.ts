/**
 * QRTags — QR Code + Design Composition Engine
 * 
 * Composites a QR code onto a circular sticker template using sharp.
 * Supports multiple physical sizes (cm) with proper DPI scaling.
 */

import sharp from 'sharp';
import { Buffer } from 'buffer';
import { promises as fs } from 'fs';
import path from 'path';

// ─── Constants ─────────────────────────────────────────────────────

const TEMPLATE_SIZE_PX = 1024; // Source template is 1024x1024

// QR zone position on the template (as % of template size)
const QR_ZONE = {
  x: 0.235,      // 23.5% from left
  y: 0.245,      // 24.5% from top
  width: 0.53,   // 53% width
  height: 0.47,  // 47% height
};

// Reference text position (below "Objet trouvé ?", near bottom of circle)
const REF_TEXT = {
  x: 0.5,   // centered
  y: 0.87,  // 87% from top
  fontSize: 0.032, // 3.2% of template size
};

// Available sticker sizes in cm
export const STICKER_SIZES = [
  { label: '2 × 2 cm', value: 2 },
  { label: '4 × 4 cm', value: 4 },
  { label: '7 × 7 cm', value: 7 },
] as const;

// DPI for high-resolution output
export const EXPORT_DPI = 600;

// ─── Types ─────────────────────────────────────────────────────────

export interface ComposeOptions {
  reference: string;       // e.g. "QRT26-MLQGY7"
  scanUrl: string;        // e.g. "https://qrtags.com/scan/QRT26-MLQGY7"
  templatePath: string;   // Path to the PNG template
  sizeCm: number;         // Physical size in cm (2, 4, or 7)
  dpi?: number;           // Output DPI (default 600)
}

export interface ComposedQR {
  reference: string;
  buffer: Buffer;
  sizePx: number;
  sizeCm: number;
  filename: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

function cmToPx(cm: number, dpi: number): number {
  return Math.round((cm / 2.54) * dpi);
}

async function loadQRCode(): Promise<typeof import('qrcode')> {
  return await import('qrcode');
}

/**
 * Generate a QR code buffer at the exact pixel size needed for the template zone.
 */
async function generateQRBuffer(
  url: string,
  width: number,
  height: number,
): Promise<Buffer> {
  const QRCode = await loadQRCode();

  // Generate QR at the needed size with high error correction
  const qrBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: Math.min(width, height), // QR is square, use the smaller dimension
    margin: 1,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  // Resize to fit the exact QR zone (maintain aspect ratio, pad if needed)
  const resized = await sharp(qrBuffer)
    .resize(width, height, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  return resized;
}

// ─── Main Composition Function ─────────────────────────────────────

/**
 * Compose a QR code onto the design template.
 * 
 * 1. Loads the template
 * 2. Resizes it to the target physical size (at given DPI)
 * 3. Generates a QR code matching the QR zone dimensions
 * 4. Composites the QR onto the template
 * 5. Draws the reference text below "Objet trouvé ?"
 * 6. Returns the final PNG buffer
 */
export async function composeQRWithDesign(
  options: ComposeOptions,
): Promise<ComposedQR> {
  const {
    reference,
    scanUrl,
    templatePath,
    sizeCm,
    dpi = EXPORT_DPI,
  } = options;

  // Calculate output size in pixels
  const outputSize = cmToPx(sizeCm, dpi);

  // QR zone dimensions in output pixels
  const qrZoneX = Math.round(QR_ZONE.x * outputSize);
  const qrZoneY = Math.round(QR_ZONE.y * outputSize);
  const qrZoneW = Math.round(QR_ZONE.width * outputSize);
  const qrZoneH = Math.round(QR_ZONE.height * outputSize);

  // Step 1: Load and resize template
  let templateBuffer: Buffer;
  try {
    templateBuffer = await fs.readFile(templatePath);
  } catch {
    throw new Error(`Template not found at ${templatePath}. Please upload a design template first.`);
  }

  const resizedTemplate = await sharp(templateBuffer)
    .resize(outputSize, outputSize, {
      fit: 'cover',
    })
    .png()
    .toBuffer();

  // Step 2: Generate QR code
  const qrBuffer = await generateQRBuffer(scanUrl, qrZoneW, qrZoneH);

  // Step 3: Create reference text SVG
  const fontSize = Math.round(REF_TEXT.fontSize * outputSize);
  const textX = Math.round(REF_TEXT.x * outputSize);
  const textY = Math.round(REF_TEXT.y * outputSize);

  const textSvg = Buffer.from(`
    <svg width="${outputSize}" height="${outputSize}">
      <text
        x="${textX}"
        y="${textY}"
        text-anchor="middle"
        dominant-baseline="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="white"
      >${reference}</text>
    </svg>
  `);

  // Step 4: Composite everything
  const finalBuffer = await sharp(resizedTemplate)
    .composite([
      {
        input: qrBuffer,
        left: qrZoneX,
        top: qrZoneY,
      },
      {
        input: textSvg,
        left: 0,
        top: 0,
      },
    ])
    .png({ quality: 100 })
    .toBuffer();

  const filename = `QRTags-${sizeCm}cm-${reference}.png`;

  return {
    reference,
    buffer: finalBuffer,
    sizePx: outputSize,
    sizeCm,
    filename,
  };
}

// ─── Batch Composition ─────────────────────────────────────────────

/**
 * Compose multiple QR codes with design in batches.
 */
export async function composeBatch(
  items: Array<{ reference: string; scanUrl: string }>,
  templatePath: string,
  sizeCm: number,
  dpi: number = EXPORT_DPI,
  progressCallback?: (completed: number, total: number) => void,
): Promise<ComposedQR[]> {
  const results: ComposedQR[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((item) =>
        composeQRWithDesign({
          reference: item.reference,
          scanUrl: item.scanUrl,
          templatePath,
          sizeCm,
          dpi,
        }),
      ),
    );
    results.push(...batchResults);
    progressCallback?.(Math.min(i + BATCH_SIZE, items.length), items.length);
  }

  return results;
}

// ─── Template Helpers ──────────────────────────────────────────────

export const TEMPLATE_DIR = path.join(process.cwd(), 'public', 'templates');
export const DEFAULT_TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'qr-design.png');

/**
 * Check if a design template exists
 */
export async function templateExists(): Promise<boolean> {
  try {
    await fs.access(DEFAULT_TEMPLATE_PATH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save uploaded template
 */
export async function saveTemplate(buffer: Buffer): Promise<void> {
  await fs.mkdir(TEMPLATE_DIR, { recursive: true });
  await fs.writeFile(DEFAULT_TEMPLATE_PATH, buffer);
}

/**
 * Get template info (dimensions, format)
 */
export async function getTemplateInfo(): Promise<{
  exists: boolean;
  width: number;
  height: number;
  format: string;
  size: number;
} | null> {
  try {
    const buffer = await fs.readFile(DEFAULT_TEMPLATE_PATH);
    const metadata = await sharp(buffer).metadata();
    const stat = await fs.stat(DEFAULT_TEMPLATE_PATH);
    return {
      exists: true,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stat.size,
    };
  } catch {
    return null;
  }
}