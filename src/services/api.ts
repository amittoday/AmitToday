import axios from "axios";

export interface QueueRecord {
  id: string;
  applicantName: string;
  serviceName: string;
  status: "Pending" | "Completed" | "Failed" | string;
  timestamp: string;
  details?: string;
  amount?: number;
  phone?: string;
}

const GOOGLE_APPS_SCRIPT_WEB_APP_URL =
  import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || "/api/queue-records";

export async function fetchLiveQueueData(): Promise<QueueRecord[]> {
  try {
    const response = await axios.get(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
      timeout: 8000,
    });
    if (response.data && Array.isArray(response.data.records)) {
      return response.data.records;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
  } catch (err) {
    console.warn("Falling back to local queue records proxy API:", err);
  }

  // Fallback endpoint if direct GAS URL fails or is not provided
  try {
    const res = await axios.get("/api/queue-records");
    if (res.data && res.data.success && Array.isArray(res.data.records)) {
      return res.data.records;
    }
  } catch (e) {
    console.warn("Backend queue records endpoint unavailable:", e);
  }

  return [];
}
