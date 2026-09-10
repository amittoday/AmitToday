/**
 * Client-side canvas-based image resizing and compression utility
 * Resizes images to max dimensions and compresses before submission to reduce payload size and speed up OCR processing.
 */
export async function compressAndResizeImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<{ compressedFile: File; originalSize: number; compressedSize: number; ratio: number }> {
  const originalSize = file.size;

  // If file is not an image (e.g., PDF or raw document), return original
  if (!file.type.startsWith("image/")) {
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      ratio: 1.0,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio scaling
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve({ compressedFile: file, originalSize, compressedSize: originalSize, ratio: 1.0 });
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({ compressedFile: file, originalSize, compressedSize: originalSize, ratio: 1.0 });
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            const compressedSize = compressedFile.size;
            const ratio = Number((compressedSize / originalSize).toFixed(2));

            console.log(`[Image Compress] Original: ${(originalSize / 1024).toFixed(1)}KB, Compressed: ${(compressedSize / 1024).toFixed(1)}KB (${(100 - ratio * 100).toFixed(0)}% saved)`);

            resolve({
              compressedFile,
              originalSize,
              compressedSize,
              ratio,
            });
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        resolve({ compressedFile: file, originalSize, compressedSize: originalSize, ratio: 1.0 });
      };
    };

    reader.onerror = () => {
      resolve({ compressedFile: file, originalSize, compressedSize: originalSize, ratio: 1.0 });
    };
  });
}
