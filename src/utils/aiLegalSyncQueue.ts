import axios from "axios";
import { QueuedOrderPayload } from "../types/aiLegalAgentTypes";

const QUEUE_STORAGE_KEY = "order_sync_queue";

export function getOfflineSyncQueue(): QueuedOrderPayload[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("Failed to load offline sync queue:", e);
    return [];
  }
}

export function enqueueOfflineOrder(payload: Omit<QueuedOrderPayload, "queueId" | "retryCount" | "status">): QueuedOrderPayload {
  const queue = getOfflineSyncQueue();
  const newEntry: QueuedOrderPayload = {
    ...payload,
    queueId: "QUEUE-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    retryCount: 0,
    status: "pending"
  };

  queue.push(newEntry);
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn("Failed to save to offline sync queue:", e);
  }
  return newEntry;
}

export function removeOfflineOrder(queueId: string): void {
  const queue = getOfflineSyncQueue().filter((item) => item.queueId !== queueId);
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {}
}

export async function processOfflineSyncQueue(
  onSuccessItem?: (syncedOrder: QueuedOrderPayload, responseData: any) => void,
  onFailedItem?: (queueId: string, errorMsg: string) => void
): Promise<{ total: number; succeeded: number; failed: number }> {
  const queue = getOfflineSyncQueue();
  if (queue.length === 0) return { total: 0, succeeded: 0, failed: 0 };

  let succeeded = 0;
  let failed = 0;
  const remainingQueue: QueuedOrderPayload[] = [];

  for (const item of queue) {
    try {
      item.status = "syncing";
      item.lastAttempt = new Date().toISOString();
      item.retryCount += 1;

      const res = await axios.post("/api/ai-agent/finalize-order", {
        applicantName: item.applicantName,
        applicantPhone: item.applicantPhone,
        applicantEmail: item.applicantEmail,
        docType: item.docType,
        content: item.content,
        wordCount: item.wordCount,
        paymentRef: item.paymentRef,
        paymentStatus: item.paymentStatus,
        pdfBase64: item.pdfBase64,
        docxBase64: item.docxBase64
      });

      if (res.data && res.data.success) {
        succeeded++;
        if (onSuccessItem) {
          onSuccessItem(item, res.data);
        }
      } else {
        throw new Error(res.data?.error || "GAS Sync rejected order");
      }
    } catch (err: any) {
      failed++;
      item.status = "failed";
      remainingQueue.push(item);
      if (onFailedItem) {
        onFailedItem(item.queueId, err.message || "Network/Server sync failure");
      }
    }
  }

  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
  } catch (e) {}

  return { total: queue.length, succeeded, failed };
}
