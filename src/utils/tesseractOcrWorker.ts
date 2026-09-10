import Tesseract from 'tesseract.js';

/**
 * Multi-Threaded Tesseract OCR Pool Manager
 * Manages parallel worker threads to process batch queues simultaneously
 * without blocking the main UI event loop.
 */
export class MultiThreadedOcrPool {
  private concurrency: number;
  private activeCount = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(concurrency = 3) {
    this.concurrency = concurrency;
  }

  public async runTask<T>(taskFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = async () => {
        this.activeCount++;
        try {
          const res = await taskFn();
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          this.activeCount--;
          this.next();
        }
      };

      if (this.activeCount < this.concurrency) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }

  private next() {
    if (this.queue.length > 0 && this.activeCount < this.concurrency) {
      const nextTask = this.queue.shift();
      if (nextTask) nextTask();
    }
  }

  public getStats() {
    return {
      activeThreads: this.activeCount,
      queuedJobs: this.queue.length,
      maxConcurrency: this.concurrency,
    };
  }
}

export const ocrWorkerPool = new MultiThreadedOcrPool(4);

/**
 * Executes Tesseract OCR recognition off the main UI thread using worker instances
 * to prevent UI freezing/lag during document scanning.
 */
export async function runOcrInWebWorker(
  imageBlob: Blob | File,
  lang = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; confidence: number }> {
  return ocrWorkerPool.runTask(async () => {
    let worker: Tesseract.Worker | null = null;
    try {
      if (onProgress) onProgress(5, "Initializing non-blocking OCR worker thread...");
      await new Promise((resolve) => setTimeout(resolve, 20));

      worker = await Tesseract.createWorker(lang, 1, {
        logger: (m) => {
          if (m && m.status && onProgress) {
            const pct = m.progress ? Math.min(99, Math.round(m.progress * 100)) : 50;
            onProgress(pct, `[Worker Thread Pool] ${m.status}`);
          }
        },
      });

      if (onProgress) onProgress(35, "Scanning document in background worker pool...");
      const ret = await worker.recognize(imageBlob);

      if (onProgress) onProgress(100, "OCR Analysis Complete");
      return {
        text: ret.data.text || '',
        confidence: ret.data.confidence || 0,
      };
    } catch (err: any) {
      console.warn("[OCR Worker Thread Pool] Error during background OCR execution:", err);
      throw err;
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  });
}

/**
 * Executes batch OCR recognition simultaneously using worker pool.
 */
export async function runBatchOcrInParallel(
  files: (Blob | File)[],
  lang = 'eng',
  onBatchProgress?: (completed: number, total: number) => void
): Promise<Array<{ text: string; confidence: number }>> {
  let completedCount = 0;
  const tasks = files.map((file) =>
    runOcrInWebWorker(file, lang, () => {
      // Individual job progress
    }).then((res) => {
      completedCount++;
      if (onBatchProgress) onBatchProgress(completedCount, files.length);
      return res;
    })
  );

  return Promise.all(tasks);
}

/**
 * Assesses document page orientation off the main thread to prevent UI lockup.
 */
export async function detectOrientationInWebWorker(
  imageBlob: Blob | File
): Promise<number | null> {
  return ocrWorkerPool.runTask(async () => {
    let worker: Tesseract.Worker | null = null;
    try {
      await new Promise((resolve) => setTimeout(resolve, 20));
      worker = await Tesseract.createWorker('eng');
      const detectResult = await worker.detect(imageBlob);
      return detectResult?.data?.orientation_degrees ?? null;
    } catch (err) {
      console.warn("[OCR Worker Thread Pool] Orientation detection fallback:", err);
      return null;
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  });
}

