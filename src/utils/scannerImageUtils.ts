/**
 * Utility functions for Document Scanner image pre-processing, brightness/contrast adjustments,
 * and automated secondary scan retries for low-confidence or failed OCR reads.
 */

export interface ScannerSettings {
  autoRetryScan: boolean;
  retryBrightness: number; // e.g. 125 (%)
  retryContrast: number;   // e.g. 145 (%)
  confidenceThreshold: number; // e.g. 70 (%)
  autoDetectScanner: boolean;
  autoCapture: boolean;
  torchEnabled: boolean;
  shutterSound: boolean;
  multiPageMode: boolean;
}

export const DEFAULT_SCANNER_SETTINGS: ScannerSettings = {
  autoRetryScan: true,
  retryBrightness: 125,
  retryContrast: 145,
  confidenceThreshold: 70,
  autoDetectScanner: true,
  autoCapture: true,
  torchEnabled: false,
  shutterSound: true,
  multiPageMode: false,
};

/**
 * Loads saved scanner settings from localStorage with safe defaults.
 */
export function getSavedScannerSettings(): ScannerSettings {
  try {
    const autoRetrySaved = localStorage.getItem("scanner_autoRetryScan");
    const autoRetry = autoRetrySaved !== null ? autoRetrySaved === "true" : true;

    const retryBrightness = Number(localStorage.getItem("scanner_retryBrightness")) || 125;
    const retryContrast = Number(localStorage.getItem("scanner_retryContrast")) || 145;
    const confidenceThreshold = Number(localStorage.getItem("scanner_confidenceThreshold")) || 70;
    const autoDetectScanner = localStorage.getItem("camera_autoDetectScanner") !== "false";
    const autoCapture = localStorage.getItem("camera_autoCapture") !== "false";
    const torchEnabled = localStorage.getItem("camera_torchEnabled") === "true";
    const shutterSound = localStorage.getItem("camera_shutterSoundEnabled") !== "false";
    const multiPageMode = localStorage.getItem("camera_multiPageMode") === "true";

    return {
      autoRetryScan: autoRetry,
      retryBrightness,
      retryContrast,
      confidenceThreshold,
      autoDetectScanner,
      autoCapture,
      torchEnabled,
      shutterSound,
      multiPageMode,
    };
  } catch (e) {
    return DEFAULT_SCANNER_SETTINGS;
  }
}

/**
 * Persists scanner settings to localStorage.
 */
export function saveScannerSettings(settings: Partial<ScannerSettings>): void {
  try {
    if (settings.autoRetryScan !== undefined) {
      localStorage.setItem("scanner_autoRetryScan", String(settings.autoRetryScan));
    }
    if (settings.retryBrightness !== undefined) {
      localStorage.setItem("scanner_retryBrightness", String(settings.retryBrightness));
    }
    if (settings.retryContrast !== undefined) {
      localStorage.setItem("scanner_retryContrast", String(settings.retryContrast));
    }
    if (settings.confidenceThreshold !== undefined) {
      localStorage.setItem("scanner_confidenceThreshold", String(settings.confidenceThreshold));
    }
    if (settings.autoDetectScanner !== undefined) {
      localStorage.setItem("camera_autoDetectScanner", String(settings.autoDetectScanner));
    }
    if (settings.autoCapture !== undefined) {
      localStorage.setItem("camera_autoCapture", String(settings.autoCapture));
    }
    if (settings.torchEnabled !== undefined) {
      localStorage.setItem("camera_torchEnabled", String(settings.torchEnabled));
    }
    if (settings.shutterSound !== undefined) {
      localStorage.setItem("camera_shutterSoundEnabled", String(settings.shutterSound));
    }
    if (settings.multiPageMode !== undefined) {
      localStorage.setItem("camera_multiPageMode", String(settings.multiPageMode));
    }
  } catch (e) {
    console.warn("Failed to persist scanner settings to localStorage:", e);
  }
}

/**
 * Adjusts brightness and contrast of a base64 image or File using an off-screen HTML5 Canvas.
 */
export async function enhanceImageBrightnessContrast(
  base64OrDataUrl: string,
  brightnessPercent: number = 125,
  contrastPercent: number = 145
): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    try {
      const src = base64OrDataUrl.startsWith("data:")
        ? base64OrDataUrl
        : `data:image/jpeg;base64,${base64OrDataUrl}`;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 1200;
        canvas.height = img.naturalHeight || img.height || 1600;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          // Fallback to original
          const cleanBase64 = src.includes(",") ? src.split(",")[1] : src;
          resolve({ base64: cleanBase64, dataUrl: src });
          return;
        }

        // Apply visual filter with brightness and contrast adjustments
        ctx.filter = `brightness(${brightnessPercent}%) contrast(${contrastPercent}%)`;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Optional post-processing: slight sharpen / unsharp mask in pixel space if needed
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          // Apply gentle threshold curve to deepen text blacks and brighten page whites
          const factor = (259 * (contrastPercent + 255)) / (255 * (259 - contrastPercent));
          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Normalize
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;

            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (filterErr) {
          // If security or CORS prevents getImageData, canvas.filter draw was already applied
        }

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, dataUrl });
      };

      img.onerror = (err) => {
        console.warn("Image load failed during contrast/brightness enhancement:", err);
        const clean = base64OrDataUrl.includes(",") ? base64OrDataUrl.split(",")[1] : base64OrDataUrl;
        resolve({ base64: clean, dataUrl: base64OrDataUrl });
      };

      img.src = src;
    } catch (err) {
      console.warn("Exception in enhanceImageBrightnessContrast:", err);
      const clean = base64OrDataUrl.includes(",") ? base64OrDataUrl.split(",")[1] : base64OrDataUrl;
      resolve({ base64: clean, dataUrl: base64OrDataUrl });
    }
  });
}

/**
 * Checks whether an OCR response should trigger an automatic secondary scan retry.
 */
export function shouldTriggerAutoRetry(
  ocrResponse: any,
  confidenceThreshold: number = 70
): { shouldRetry: boolean; reason: string; confidence: number } {
  if (!ocrResponse) {
    return { shouldRetry: true, reason: "No scan response returned", confidence: 0 };
  }

  const text = String(ocrResponse.extractedText || ocrResponse.text || "").trim();
  const wordCount = Number(ocrResponse.wordCount || 0) || (text ? text.split(/\s+/).filter(Boolean).length : 0);

  // Confidence extraction
  let confidence = 100;
  if (ocrResponse.confidence !== undefined && ocrResponse.confidence !== null) {
    confidence = Number(ocrResponse.confidence);
  } else if (ocrResponse.ocrConfidence !== undefined) {
    confidence = Number(ocrResponse.ocrConfidence);
  } else if (ocrResponse.score !== undefined) {
    confidence = Number(ocrResponse.score);
  }

  // If text is extremely short or empty (< 4 words)
  if (!text || wordCount < 4) {
    return {
      shouldRetry: true,
      reason: "Extremely low character/word count detected",
      confidence: Math.min(confidence, 35),
    };
  }

  // If confidence is below threshold
  if (confidence < confidenceThreshold) {
    return {
      shouldRetry: true,
      reason: `Confidence score (${confidence}%) is below the required threshold (${confidenceThreshold}%)`,
      confidence,
    };
  }

  // If flagged as low clarity or hard to read
  if (ocrResponse.hardToRead || ocrResponse.isBlurry || ocrResponse.lowClarity) {
    return {
      shouldRetry: true,
      reason: "Document flagged as blurry or low contrast",
      confidence: Math.min(confidence, 50),
    };
  }

  return { shouldRetry: false, reason: "Confidence is satisfactory", confidence };
}
