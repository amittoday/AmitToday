import axios from "axios";

interface OrderItem {
  id?: string;
  ID?: string;
  orderId?: string;
  status?: string;
  Status?: string;
  service?: string;
  Type?: string;
}

/**
 * Clean GAS-backed Order Status Listener (No Firebase dependency).
 * Uses background polling against Google Apps Script / DB endpoint to detect status changes.
 */
export const listenToOrderStatusChanges = (
  userEmail: string,
  userToken: string,
  onStatusUpdated: (order: OrderItem, previousStatus: string, currentStatus: string) => void
) => {
  if (!userEmail) return () => {};

  console.log(`[GAS Telemetry] Active order status listener active for client: ${userEmail}`);

  const knownStatuses: Record<string, string> = {};
  let isInitialLoad = true;

  const checkStatusTransition = (ordersList: OrderItem[]) => {
    ordersList.forEach((order) => {
      const orderId = order.id || order.ID || order.orderId;
      if (!orderId) return;

      const rawStatus = order.status || order.Status || "Pending";
      const normStatus = rawStatus.toLowerCase().trim();

      const prevStatus = knownStatuses[orderId];
      knownStatuses[orderId] = normStatus;

      if (isInitialLoad) return;

      if (prevStatus && prevStatus !== normStatus) {
        const isPrevProcessing = prevStatus.includes("proc") || prevStatus.includes("sub") || prevStatus.includes("review") || prevStatus === "pending";
        const isCurrentCompleted = normStatus.includes("complete") || normStatus.includes("approve") || normStatus === "completed";

        if (isPrevProcessing && isCurrentCompleted) {
          console.log(`[GAS Broadcast] Order ${orderId} status changed from '${prevStatus}' to '${normStatus}'`);
          onStatusUpdated(order, rawStatus, "Completed");
        }
      }
    });

    isInitialLoad = false;
  };

  // Seed initial fetch via GAS API
  axios.post(
    "/api/data/collection",
    { tab: "Orders", filterKey: "UserEmail", filterValue: userEmail },
    { headers: { Authorization: `Bearer ${userToken}` } }
  ).then((res) => {
    if (res.data && res.data.data) {
      checkStatusTransition(res.data.data);
    }
  }).catch((e) => console.log("[GAS Telemetry initial fetch skipped]", e));

  // Poll every 5 seconds
  const intervalId = setInterval(async () => {
    try {
      const res = await axios.post(
        "/api/data/collection",
        { tab: "Orders", filterKey: "UserEmail", filterValue: userEmail },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      if (res.data && res.data.data) {
        checkStatusTransition(res.data.data);
      }
    } catch (err) {
      console.warn("[GAS Telemetry poll skipped]", err);
    }
  }, 5000);

  return () => {
    console.log(`[GAS Telemetry] Deactivating listener for client: ${userEmail}`);
    clearInterval(intervalId);
  };
};

/**
 * Browser Web Push & Desktop Notifications setup (Pure Web Standard - No Firebase dependency).
 */
export const setupFCM = async (
  userEmail: string,
  onNotificationReceived?: (title: string, body: string) => void
) => {
  if (!userEmail) return null;

  if ("Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("[Web Push System] Browser notification permission granted!");
        const syntheticToken = `gas_push_${btoa(userEmail)}_${Date.now()}`;
        try {
          localStorage.setItem("aos_fcm_token", syntheticToken);
        } catch (e) {}
        await axios.post("/api/user/fcm-token", { email: userEmail, token: syntheticToken }).catch(() => {});
      }
    } catch (e) {
      console.warn("[Web Push System] Error requesting notification permissions:", e);
    }
  }

  return null;
};
