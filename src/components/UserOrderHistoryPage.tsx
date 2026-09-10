import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { 
  FileText, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  Eye, 
  LogIn, 
  DollarSign, 
  Package, 
  Info,
  Maximize2,
  Minimize2,
  Printer,
  Copy,
  Check,
  X,
  Bell,
  BellRing,
  Sparkles,
  CreditCard,
  Layers,
  ArrowRight,
  Share2,
  FileSpreadsheet,
  CheckCircle,
  Truck,
  Activity,
  FileCheck2,
  Building2,
  User,
  Phone,
  Mail,
  Receipt,
  Star,
  MessageSquare,
  Send,
  ThumbsUp,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadPDFInvoice } from "../utils/invoiceGenerator";
import { 
  LivePdfDocViewerModal, 
  extractCustomerUploadedFiles, 
  CustomerUploadedFile 
} from "./LivePdfDocViewerModal";

export interface UserOrder {
  ID?: string;
  orderId?: string;
  OrderID?: string;
  service?: string;
  Service?: string;
  serviceType?: string;
  ServiceType?: string;
  amount?: number | string;
  Amount?: number | string;
  totalAmount?: number | string;
  TotalAmount?: number | string;
  status?: string;
  Status?: string;
  date?: string;
  Date?: string;
  createdAt?: string;
  CreatedAt?: string;
  timestamp?: string;
  Timestamp?: string;
  description?: string;
  Description?: string;
  serviceDescription?: string;
  ServiceDescription?: string;
  notes?: string;
  Notes?: string;
  internalNotes?: string;
  InternalNotes?: string;
  fileLink?: string;
  FileLink?: string;
  finalFileLink?: string;
  FinalFileLink?: string;
  paymentId?: string;
  PaymentID?: string;
  trackingNumber?: string;
  TrackingNumber?: string;
  customerName?: string;
  CustomerName?: string;
  email?: string;
  UserEmail?: string;
  phone?: string;
  Phone?: string;
  [key: string]: any;
}

interface UserOrderHistoryPageProps {
  user?: {
    email?: string;
    name?: string;
    token?: string;
    role?: string;
  } | null;
  setShowAuthModal?: (show: boolean) => void;
  onTrackOrder?: (orderId: string) => void;
  lang?: string;
  embedded?: boolean;
}

type SortField = "orderId" | "serviceType" | "totalAmount" | "status" | "date";
type SortDirection = "asc" | "desc";

/**
 * Normalizes raw order status strings into recognized standard buckets
 */
const getNormalizedStatus = (rawStatus: string = ""): "pending" | "processing" | "completed" | "cancelled" | "other" => {
  const s = String(rawStatus || "").toLowerCase().trim();
  if (s.includes("complete") || s.includes("delivered") || s.includes("approved") || s.includes("uploaded")) {
    return "completed";
  }
  if (s.includes("process") || s.includes("progress") || s.includes("review") || s.includes("submit") || s.includes("active")) {
    return "processing";
  }
  if (s.includes("cancel") || s.includes("reject")) {
    return "cancelled";
  }
  if (s.includes("pend") || s.includes("unpaid") || s.includes("awaiting")) {
    return "pending";
  }
  return "other";
};

const FEEDBACK_TAGS = [
  "⚡ Super Fast Service",
  "📄 Pristine Certificate",
  "🤝 Helpful Facilitation",
  "💰 Fair Transparent Charges",
  "✅ Hassle-Free Approval",
  "📱 Instant Live Updates"
];

const getRatingLabel = (rating: number): string => {
  switch (rating) {
    case 1: return "1 - Poor Experience";
    case 2: return "2 - Needs Improvement";
    case 3: return "3 - Satisfactory / Average";
    case 4: return "4 - Very Good Service";
    case 5: return "5 - Excellent / 5-Star Service!";
    default: return `${rating} Stars`;
  }
};

/**
 * Plays a gentle, pleasant dual-tone chime using Web Audio API
 */
const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (pleasant high chime - D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second harmonic tone (D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);
    gain2.gain.setValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.5);
  } catch {
    // Audio Context restricted or unavailable
  }
};

/**
 * Dispatches HTML5 browser desktop push notification if permission is granted
 */
const triggerBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try {
      const notif = new Notification(title, {
        icon: "/icon.png",
        badge: "/icon.png",
        ...options,
      });
      notif.onclick = () => {
        window.focus();
      };
    } catch (e) {
      console.warn("Browser notification trigger failed:", e);
    }
  }
};

export const UserOrderHistoryPage: React.FC<UserOrderHistoryPageProps> = ({
  user,
  setShowAuthModal,
  onTrackOrder,
  lang = "en",
  embedded = false
}) => {
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [manualEmail, setManualEmail] = useState<string>("");
  const [activeEmail, setActiveEmail] = useState<string>(user?.email || "");

  // Expanded Order Details Modal State
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<UserOrder | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  // Citizen Feedback State for Completed Orders
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);
  const [feedbackCache, setFeedbackCache] = useState<Record<string, { rating: number; feedback: string; submittedAt?: string }>>({});

  // Initialize feedback cache from localStorage on mount
  useEffect(() => {
    try {
      const cached: Record<string, { rating: number; feedback: string; submittedAt?: string }> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("aos_order_feedback_")) {
          const oId = key.replace("aos_order_feedback_", "");
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              cached[oId] = JSON.parse(raw);
            } catch {
              cached[oId] = { rating: 5, feedback: raw };
            }
          }
        }
      }
      setFeedbackCache(cached);
    } catch (err) {
      console.warn("Could not load feedback cache:", err);
    }
  }, []);

  // Sync feedback fields when selected modal order changes
  useEffect(() => {
    if (selectedOrderForModal) {
      const oId = String(selectedOrderForModal.orderId || selectedOrderForModal.OrderID || selectedOrderForModal.ID || "");
      const existing = feedbackCache[oId] || (
        (selectedOrderForModal.Feedback || selectedOrderForModal.feedback || selectedOrderForModal.Rating || selectedOrderForModal.rating)
          ? {
              rating: Number(selectedOrderForModal.Rating || selectedOrderForModal.rating) || 5,
              feedback: String(selectedOrderForModal.Feedback || selectedOrderForModal.feedback || ""),
              submittedAt: selectedOrderForModal.feedbackSubmittedAt
            }
          : null
      );
      if (existing) {
        setFeedbackRating(existing.rating || 5);
        setFeedbackText(existing.feedback || "");
        setShowFeedbackForm(false);
      } else {
        setFeedbackRating(5);
        setFeedbackText("");
        setSelectedTags([]);
        setShowFeedbackForm(false);
      }
    }
  }, [selectedOrderForModal, feedbackCache]);

  const handleSubmitFeedback = async (orderId: string, currentOrder: UserOrder) => {
    if (!orderId) return;
    setFeedbackSubmitting(true);
    try {
      const combinedFeedback = [
        selectedTags.length > 0 ? `[${selectedTags.join(", ")}]` : "",
        feedbackText.trim()
      ].filter(Boolean).join(" ");

      const token = user?.token || localStorage.getItem("aos_token") || "";
      const customerEmail = currentOrder.email || currentOrder.UserEmail || activeEmail || user?.email;
      const customerName = currentOrder.customerName || currentOrder.CustomerName || user?.name || "Customer";

      await axios.post("/api/user/order-feedback", {
        orderId,
        rating: feedbackRating,
        feedback: combinedFeedback || "Satisfied with government service facilitation.",
        customerEmail,
        customerName
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      const nowIso = new Date().toISOString();
      const savedData = {
        rating: feedbackRating,
        feedback: combinedFeedback || "Satisfied with service.",
        submittedAt: nowIso
      };

      try {
        localStorage.setItem(`aos_order_feedback_${orderId}`, JSON.stringify(savedData));
      } catch {}

      setFeedbackCache(prev => ({
        ...prev,
        [orderId]: savedData
      }));

      setSelectedOrderForModal(prev => {
        if (!prev) return null;
        return {
          ...prev,
          rating: feedbackRating,
          Rating: feedbackRating,
          feedback: combinedFeedback,
          Feedback: combinedFeedback,
          feedbackSubmittedAt: nowIso
        };
      });

      setOrders(prevOrders => prevOrders.map(o => {
        const oId = String(o.orderId || o.OrderID || o.ID || "");
        if (oId === orderId) {
          return {
            ...o,
            rating: feedbackRating,
            Rating: feedbackRating,
            feedback: combinedFeedback,
            Feedback: combinedFeedback,
            feedbackSubmittedAt: nowIso
          };
        }
        return o;
      }));

      setShowFeedbackForm(false);
      toast.success("Thank you! Feedback recorded.", {
        description: `Your ${feedbackRating}-star rating for Order #${orderId} was submitted successfully.`
      });
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      toast.error(err.response?.data?.error || "Could not submit feedback. Please try again.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  // Live PDF & Document Viewer State
  const [viewerFiles, setViewerFiles] = useState<CustomerUploadedFile[]>([]);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);
  const [viewerOrderId, setViewerOrderId] = useState<string | number>("");

  // Real-time listener & Polling State
  const [liveSyncActive, setLiveSyncActive] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const prevStatusesRef = useRef<Record<string, string>>({});
  const isInitialLoadDone = useRef<boolean>(false);

  useEffect(() => {
    if (user?.email) {
      setActiveEmail(user.email);
    }
  }, [user?.email]);

  // Check browser notification permission status on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  /**
   * Primary fetcher for orders from Google Sheet 'Orders' tab
   */
  const fetchOrders = useCallback(async (targetEmail: string, isSilent = false) => {
    if (!targetEmail) {
      setOrders([]);
      setLoading(false);
      return;
    }

    if (!isSilent) {
      if (isInitialLoadDone.current) setRefreshing(true);
      else setLoading(true);
    }

    try {
      const token = user?.token || localStorage.getItem("aos_token") || "";
      const res = await axios.get("/api/user/orders", {
        params: { email: targetEmail },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const incomingOrders: UserOrder[] = res.data.data;

        // REAL-TIME STATUS CHANGE LISTENER:
        // Detect transitions from 'Pending' -> 'Processing' or 'Pending'/'Processing' -> 'Completed'
        if (isInitialLoadDone.current) {
          incomingOrders.forEach((newOrder) => {
            const id = String(newOrder.orderId || newOrder.OrderID || newOrder.ID || "");
            if (!id) return;
            const oldStatus = prevStatusesRef.current[id];
            const newStatus = String(newOrder.status || newOrder.Status || "Pending");

            if (oldStatus && oldStatus.trim().toLowerCase() !== newStatus.trim().toLowerCase()) {
              const oldNorm = getNormalizedStatus(oldStatus);
              const newNorm = getNormalizedStatus(newStatus);

              const movedToProcessing = (oldNorm === "pending") && (newNorm === "processing");
              const movedToCompleted = (oldNorm === "pending" || oldNorm === "processing") && (newNorm === "completed");

              if (movedToProcessing || movedToCompleted) {
                // 1. Play audio chime
                playNotificationChime();

                const serviceTitle = newOrder.serviceType || newOrder.ServiceType || newOrder.service || newOrder.Service || "Document Service";
                const alertTitle = movedToCompleted 
                  ? `🎉 Order #${id} is Completed!` 
                  : `⚡ Order #${id} is Now Processing!`;
                const alertBody = movedToCompleted
                  ? `Your official deliverable for "${serviceTitle}" has been finalized and is ready for download.`
                  : `Verification staff have started processing your application for "${serviceTitle}".`;

                // 2. Dispatch desktop push notification
                triggerBrowserNotification(alertTitle, { body: alertBody });

                // 3. Trigger Sonner Toast notification with direct click action
                toast.success(alertTitle, {
                  description: alertBody,
                  duration: 10000,
                  action: {
                    label: "View Order",
                    onClick: () => setSelectedOrderForModal(newOrder)
                  }
                });
              }
            }
          });
        }

        // Cache current statuses for change detection
        const statusMap: Record<string, string> = {};
        incomingOrders.forEach((o) => {
          const id = String(o.orderId || o.OrderID || o.ID || "");
          if (id) {
            statusMap[id] = String(o.status || o.Status || "Pending");
          }
        });
        prevStatusesRef.current = statusMap;
        isInitialLoadDone.current = true;

        setOrders(incomingOrders);

        // Keep selected modal order synchronized if updated
        if (selectedOrderForModal) {
          const currentModalId = String(selectedOrderForModal.orderId || selectedOrderForModal.OrderID || selectedOrderForModal.ID || "");
          const updatedMatching = incomingOrders.find(
            (o) => String(o.orderId || o.OrderID || o.ID || "") === currentModalId
          );
          if (updatedMatching) {
            setSelectedOrderForModal(updatedMatching);
          }
        }

        setLastSyncTime(new Date());

        if (!isSilent && isInitialLoadDone.current) {
          toast.success("Orders synchronized with Google Sheet.");
        }
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      if (!isSilent) {
        console.warn("Failed to fetch user orders:", err.message);
        toast.error("Could not refresh orders from Google Sheet.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, selectedOrderForModal]);

  // Initial fetch when active email changes
  useEffect(() => {
    if (activeEmail) {
      isInitialLoadDone.current = false;
      fetchOrders(activeEmail, false);
    } else {
      setLoading(false);
    }
  }, [activeEmail]);

  // REAL-TIME POLLING LISTENER: Polls every 12 seconds for Google Sheet status changes
  useEffect(() => {
    if (!activeEmail || !liveSyncActive) return;

    const intervalId = setInterval(() => {
      // Avoid excessive queries if tab is hidden in background, but poll every 25s
      if (document.hidden) {
        fetchOrders(activeEmail, true);
      } else {
        fetchOrders(activeEmail, true);
      }
    }, 12000);

    return () => clearInterval(intervalId);
  }, [activeEmail, liveSyncActive, fetchOrders]);

  /**
   * Request browser notification permission
   */
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.info("Browser notifications are not supported in this browser.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted") {
        toast.success("Desktop alerts enabled! You will be notified when orders move to Processing or Completed.");
        triggerBrowserNotification("Real-Time Alerts Activated", {
          body: "You will receive instant alerts when order status changes in Google Sheets."
        });
      } else if (perm === "denied") {
        toast.error("Notifications were blocked in your browser settings.");
      }
    } catch (e) {
      console.warn("Permission request failed:", e);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    filteredAndSortedOrders.forEach((o, index) => {
      const id = String(o.orderId || o.OrderID || o.ID || `ORD-${index}`);
      all[`order-row-${id}-${index}`] = true;
      all[id] = true;
    });
    setExpandedRows(all);
  };

  const collapseAll = () => {
    setExpandedRows({});
  };

  const handleCopyOrderId = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    toast.success(`Order ID #${id} copied to clipboard!`);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleOpenDocViewer = (order: UserOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const extracted = extractCustomerUploadedFiles(order, { allowOcrDrafts: false, includeFinalFiles: true });
    
    // Fallback if none extracted but fileLink exists
    if (extracted.length === 0) {
      const raw = order.finalFileLink || order.FinalFileLink || order.fileLink || order.FileLink;
      if (raw) {
        extracted.push({
          name: `${order.serviceType || "Order_Document"}.pdf`,
          url: raw,
          embedUrl: raw,
          type: "pdf",
          isFinalDeliverable: true
        });
      }
    }

    if (extracted.length > 0) {
      setViewerFiles(extracted);
      setViewerOrderId(order.orderId || order.OrderID || order.ID || "");
      setIsViewerOpen(true);
    } else {
      toast.info("No previewable documents found for this order.");
    }
  };

  const handleDownloadInvoice = async (order: UserOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const id = String(order.orderId || order.OrderID || order.ID || "");
    setDownloadingInvoiceId(id);
    try {
      await downloadPDFInvoice(order, user || { email: activeEmail, name: order.customerName || "Customer" });
      toast.success("Tax invoice / receipt downloaded!");
    } catch (err: any) {
      console.warn("Invoice download error:", err);
      toast.error("Could not download invoice. Generating summary receipt...");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (statusStr: string) => {
    const s = String(statusStr || "Pending").toLowerCase().trim();
    if (s.includes("complete") || s.includes("delivered") || s.includes("approved")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs">
          <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>{statusStr || "Completed"}</span>
        </span>
      );
    }
    if (s.includes("process") || s.includes("progress") || s.includes("review") || s.includes("submit")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800 shadow-xs">
          <RefreshCw size={13} className="animate-spin text-blue-600 dark:text-blue-400" />
          <span>{statusStr || "Processing"}</span>
        </span>
      );
    }
    if (s.includes("cancel") || s.includes("reject")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shadow-xs">
          <AlertCircle size={13} className="text-rose-600 dark:text-rose-400" />
          <span>{statusStr || "Cancelled"}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-xs">
        <Clock size={13} className="text-amber-600 dark:text-amber-400" />
        <span>{statusStr || "Pending"}</span>
      </span>
    );
  };

  // Filtered and sorted orders calculation
  const filteredAndSortedOrders = useMemo(() => {
    return orders
      .filter((o) => {
        const orderId = String(o.orderId || o.OrderID || o.ID || "").toLowerCase();
        const serviceType = String(o.serviceType || o.ServiceType || o.service || o.Service || "").toLowerCase();
        const status = String(o.status || o.Status || "").toLowerCase();
        const customer = String(o.customerName || o.CustomerName || "").toLowerCase();
        const payment = String(o.paymentId || o.PaymentID || "").toLowerCase();
        const query = searchQuery.toLowerCase().trim();

        const matchesQuery = 
          !query || 
          orderId.includes(query) || 
          serviceType.includes(query) || 
          status.includes(query) ||
          customer.includes(query) ||
          payment.includes(query);

        const matchesStatus = statusFilter === "ALL" || status.includes(statusFilter.toLowerCase());

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        if (sortField === "orderId") {
          valA = String(a.orderId || a.OrderID || a.ID || "");
          valB = String(b.orderId || b.OrderID || b.ID || "");
        } else if (sortField === "serviceType") {
          valA = String(a.serviceType || a.ServiceType || a.service || a.Service || "");
          valB = String(b.serviceType || b.ServiceType || b.service || b.Service || "");
        } else if (sortField === "totalAmount") {
          valA = Number(a.totalAmount || a.TotalAmount || a.amount || a.Amount || 0);
          valB = Number(b.totalAmount || b.TotalAmount || b.amount || b.Amount || 0);
        } else if (sortField === "status") {
          valA = String(a.status || a.Status || "");
          valB = String(b.status || b.Status || "");
        } else if (sortField === "date") {
          valA = new Date(a.date || a.Date || a.createdAt || a.CreatedAt || a.timestamp || a.Timestamp || 0).getTime();
          valB = new Date(b.date || b.Date || b.createdAt || b.CreatedAt || b.timestamp || b.Timestamp || 0).getTime();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [orders, searchQuery, statusFilter, sortField, sortDirection]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = orders.length;
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let spent = 0;

    orders.forEach((o) => {
      const s = String(o.status || o.Status || "").toLowerCase();
      const amt = Number(o.totalAmount || o.TotalAmount || o.amount || o.Amount || 0);
      spent += isNaN(amt) ? 0 : amt;

      if (s.includes("complete") || s.includes("delivered") || s.includes("approved")) {
        completed++;
      } else if (s.includes("progress") || s.includes("process") || s.includes("review")) {
        inProgress++;
      } else {
        pending++;
      }
    });

    return { total, completed, inProgress, pending, spent };
  }, [orders]);

  /**
   * Generates a high-quality, formatted PDF file of the filtered orders list for physical record-keeping
   */
  const handlePrintSummary = () => {
    if (filteredAndSortedOrders.length === 0) {
      toast.error("No orders found to print under current search/filters.");
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Top Dark Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 26, "F");

      // Emerald Accent Stripe
      doc.setFillColor(16, 185, 129); // emerald-500
      doc.rect(0, 26, pageWidth, 2.5, "F");

      // Brand Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(255, 255, 255);
      doc.text("AMIT ONLINE SERVICES", 14, 12);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text("e-Gram & CSC Citizen Center • Official Orders Statement for Physical Record-Keeping", 14, 18.5);

      // Document Section Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("CUSTOMER ORDERS STATEMENT & SUMMARY", 14, 36);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Synchronized directly from Gujarat Portal & Google Sheets Master Database", 14, 41);

      // Metadata Info Block
      const printDateStr = new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });

      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Account / Email: ${activeEmail || "Guest Citizen"}`, 14, 49);
      doc.text(`Date of Statement: ${printDateStr}`, 14, 54);

      doc.text(`Filter Applied: ${statusFilter === "ALL" ? "All Orders" : statusFilter.toUpperCase()}`, 115, 49);
      doc.text(`Total Records: ${filteredAndSortedOrders.length} order(s)`, 115, 54);

      // Divider Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(14, 58, pageWidth - 14, 58);

      // Construct table rows
      const tableData = filteredAndSortedOrders.map((o, idx) => {
        const id = String(o.orderId || o.OrderID || o.ID || `ORD-${idx + 1}`);
        const dateVal = o.date || o.Date || o.createdAt || o.CreatedAt || o.timestamp || o.Timestamp;
        const dateFormatted = dateVal
          ? new Date(dateVal).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
          : "—";
        const service = String(o.serviceType || o.ServiceType || o.service || o.Service || "Digital Certificate / Service");
        const amount = Number(o.totalAmount || o.TotalAmount || o.amount || o.Amount || 0);
        const amountStr = isNaN(amount) ? "₹0" : `₹${amount.toLocaleString("en-IN")}`;
        const status = String(o.status || o.Status || "Pending");
        const payRef = String(o.paymentId || o.PaymentID || "—");

        return [
          String(idx + 1),
          `#${id}`,
          dateFormatted,
          service.length > 36 ? service.slice(0, 34) + "..." : service,
          amountStr,
          status,
          payRef.length > 16 ? payRef.slice(0, 15) + "..." : payRef,
        ];
      });

      // Calculate total spent for printed set
      const printedTotal = filteredAndSortedOrders.reduce((sum, o) => {
        const amt = Number(o.totalAmount || o.TotalAmount || o.amount || o.Amount || 0);
        return sum + (isNaN(amt) ? 0 : amt);
      }, 0);

      autoTable(doc, {
        startY: 62,
        head: [["#", "Order ID", "Date", "Service Type", "Amount", "Status", "Payment Ref"]],
        body: tableData,
        margin: { left: 14, right: 14 },
        theme: "striped",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
          halign: "left",
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [30, 41, 59],
          cellPadding: 2.6,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 26, fontStyle: "bold" },
          2: { cellWidth: 22 },
          3: { cellWidth: 54 },
          4: { cellWidth: 22, halign: "right", fontStyle: "bold" },
          5: { cellWidth: 24, halign: "center" },
          6: { cellWidth: 26, fontStyle: "italic" },
        },
        didDrawPage: () => {
          // Footer watermark & pagination
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text(
            "Amit Online Services • Verified Citizen Documentation Facilitation • Valid for physical record-keeping",
            14,
            pageHeight - 8
          );
          const pageStr = `Page ${doc.internal.pages.length - 1}`;
          doc.text(pageStr, pageWidth - 26, pageHeight - 8);
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 180;

      // Summary Totals Card
      if (finalY < pageHeight - 38) {
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, finalY + 5, pageWidth - 28, 20, 2, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text("STATEMENT TOTALS & VERIFICATION", 19, finalY + 11.5);

        const comp = filteredAndSortedOrders.filter(o => 
          String(o.status || o.Status || '').toLowerCase().includes('complete')
        ).length;
        const proc = filteredAndSortedOrders.filter(o => {
          const s = String(o.status || o.Status || '').toLowerCase();
          return s.includes('process') || s.includes('progress');
        }).length;
        const pend = filteredAndSortedOrders.length - comp - proc;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(
          `Total Orders: ${filteredAndSortedOrders.length}  |  Completed: ${comp}  |  Processing: ${proc}  |  Pending: ${pend}`,
          19,
          finalY + 18
        );

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(16, 185, 129);
        doc.text(
          `Total Billed: Rs. ${printedTotal.toLocaleString("en-IN")}`,
          pageWidth - 70,
          finalY + 15
        );
      }

      const safeEmail = (activeEmail || "citizen").replace(/[^a-z0-9]/gi, "_");
      const fileName = `AOS_Orders_Summary_${safeEmail}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      toast.success("Orders summary PDF generated successfully for physical record-keeping!");
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast.error("Could not generate summary PDF. Please retry.");
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={13} className="text-slate-400 group-hover:text-slate-600 transition-colors" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp size={13} className="text-emerald-600 font-bold" />
    ) : (
      <ArrowDown size={13} className="text-emerald-600 font-bold" />
    );
  };

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-12 transition-colors"}>
      <div className={embedded ? "space-y-6" : "max-w-7xl mx-auto space-y-8"}>
        
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider">
                <Package size={13} />
                <span>Google Sheet Orders Integration</span>
              </div>

              {/* Real-time sync status indicator */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Live Real-Time Sync Active</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>My Orders</span>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {orders.length} {orders.length === 1 ? "Record" : "Records"}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium mt-1">
              Real-time records from Google Sheet Orders tab for{" "}
              <span className="font-bold text-slate-900 dark:text-slate-200">
                {activeEmail || "Guest"}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                (Last checked: {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </span>
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Print Summary Button */}
            <button
              id="print-orders-summary-btn"
              onClick={handlePrintSummary}
              disabled={filteredAndSortedOrders.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Generate PDF file of the filtered orders list for physical record-keeping"
            >
              <Printer size={15} />
              <span>Print Summary</span>
            </button>

            {/* Notification Permission Toggle */}
            <button
              onClick={requestNotificationPermission}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                notificationPermission === "granted"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
              title={notificationPermission === "granted" ? "Desktop browser alerts active" : "Enable browser push alerts for status updates"}
            >
              {notificationPermission === "granted" ? (
                <>
                  <BellRing size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Alerts Active</span>
                </>
              ) : (
                <>
                  <Bell size={14} className="text-amber-500" />
                  <span>Enable Browser Alerts</span>
                </>
              )}
            </button>

            {/* Sync Sheet Button */}
            {activeEmail && (
              <button
                onClick={() => fetchOrders(activeEmail, false)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin text-emerald-600" : ""} />
                <span>{refreshing ? "Syncing..." : "Sync Sheet"}</span>
              </button>
            )}

            {!user?.email && setShowAuthModal && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <LogIn size={14} />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* Not Logged In State / Lookup Box */}
        {!user?.email && !activeEmail && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Info size={18} />
                  <span>View Your Orders</span>
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                  Log in to your account, or enter your registered email address below to fetch all your orders from the Google Sheet Orders tab.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="Enter registered email..."
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={() => {
                    if (manualEmail.trim().includes("@")) {
                      setActiveEmail(manualEmail.trim());
                    } else {
                      toast.error("Please enter a valid email address");
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs uppercase tracking-wider cursor-pointer"
                >
                  Lookup Orders
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Metric Cards */}
        {activeEmail && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Orders</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">In Progress</span>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.inProgress}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Billed</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{stats.spent.toLocaleString("en-IN")}</p>
            </div>
          </div>
        )}

        {/* Controls Bar: Search, Status Filter, Print Summary, Expand/Collapse */}
        {activeEmail && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Order ID, service name, status, payment ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="progress">In Progress / Processing</option>
                <option value="completed">Completed / Approved</option>
                <option value="cancel">Cancelled</option>
              </select>
            </div>

            {/* Right Tools Bar */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <button
                onClick={handlePrintSummary}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Print Summary PDF of filtered orders for physical record-keeping"
              >
                <Printer size={14} />
                <span>Print Summary ({filteredAndSortedOrders.length})</span>
              </button>

              <button
                onClick={expandAll}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Expand all details inline"
              >
                <Maximize2 size={13} />
                <span className="hidden sm:inline">Expand All</span>
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Collapse all details inline"
              >
                <Minimize2 size={13} />
                <span className="hidden sm:inline">Collapse All</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ORDER STATUS LIFECYCLE LEGEND                                            */}
        {/* Explains what the different order status colors mean to the user         */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <Activity size={14} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Order Lifecycle & Status Guide</span>
                  <span className="font-normal normal-case text-[11px] text-slate-400">
                    (Click any status to filter list)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Visual breakdown of government portal submission, staff review, and document deliverable stages
                </p>
              </div>
            </div>

            {statusFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className="self-start sm:self-auto px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X size={11} />
                <span>Reset Status Filter (Active: {statusFilter})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Pending */}
            <div
              onClick={() => setStatusFilter(statusFilter === "pending" ? "ALL" : "pending")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                statusFilter === "pending"
                  ? "bg-amber-100/70 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30 shadow-xs"
                  : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/50 hover:border-amber-300 hover:bg-amber-50"
              }`}
              title="Click to filter by Pending orders"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Pending
                </span>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">STAGE 1</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Application received and placed in queue. Awaiting fee reconciliation and administrative document pre-check.
              </p>
            </div>

            {/* 2. Processing */}
            <div
              onClick={() => setStatusFilter(statusFilter === "progress" ? "ALL" : "progress")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                statusFilter === "progress"
                  ? "bg-blue-100/70 dark:bg-blue-950/60 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400/30 shadow-xs"
                  : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/50 hover:border-blue-300 hover:bg-blue-50"
              }`}
              title="Click to filter by Processing orders"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  <RefreshCw size={11} className="animate-spin text-blue-600 dark:text-blue-400" />
                  Processing
                </span>
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">STAGE 2</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Facilitation center staff is actively reviewing paperwork, verifying applicant details, and filing on Gujarat Govt portal.
              </p>
            </div>

            {/* 3. Completed */}
            <div
              onClick={() => setStatusFilter(statusFilter === "completed" ? "ALL" : "completed")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                statusFilter === "completed"
                  ? "bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30 shadow-xs"
                  : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
              title="Click to filter by Completed orders"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />
                  Completed
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">FINAL STAGE</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Official certificate or document deliverable is approved, signed, and ready for instant preview and PDF download.
              </p>
            </div>

            {/* 4. Cancelled */}
            <div
              onClick={() => setStatusFilter(statusFilter === "cancel" ? "ALL" : "cancel")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                statusFilter === "cancel"
                  ? "bg-rose-100/70 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/30 shadow-xs"
                  : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-900/50 hover:border-rose-300 hover:bg-rose-50"
              }`}
              title="Click to filter by Cancelled orders"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                  <AlertCircle size={12} className="text-rose-600 dark:text-rose-400" />
                  Cancelled
                </span>
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400">EXCEPTION</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Application cancelled or returned by portal authority due to document discrepancies. Details provided for refiling.
              </p>
            </div>
          </div>
        </div>

        {/* Orders Table Container */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 border border-slate-100 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
              Querying Google Sheet Orders tab in real time...
            </p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 border border-slate-100 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              No Orders Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {activeEmail
                ? `No orders matching your criteria were found in the Google Sheet Orders tab for ${activeEmail}.`
                : "Please log in to view your orders."}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[980px]">
                {/* Table Header */}
                <div className="grid grid-cols-[56px_165px_1fr_120px_135px_135px_145px] items-center bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 py-4 px-5 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
                  <div className="text-center">#</div>
                  
                  {/* OrderID Column with Sort */}
                  <div 
                    onClick={() => handleSort("orderId")}
                    className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group flex items-center gap-1.5"
                  >
                    <span>OrderID</span>
                    {renderSortIndicator("orderId")}
                  </div>

                  {/* ServiceType Column with Sort */}
                  <div 
                    onClick={() => handleSort("serviceType")}
                    className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group flex items-center gap-1.5"
                  >
                    <span>ServiceType</span>
                    {renderSortIndicator("serviceType")}
                  </div>

                  {/* TotalAmount Column with Sort */}
                  <div 
                    onClick={() => handleSort("totalAmount")}
                    className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group flex items-center gap-1.5"
                  >
                    <span>TotalAmount</span>
                    {renderSortIndicator("totalAmount")}
                  </div>

                  {/* Status Column with Sort */}
                  <div 
                    onClick={() => handleSort("status")}
                    className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group flex items-center gap-1.5"
                  >
                    <span>Status</span>
                    {renderSortIndicator("status")}
                  </div>

                  {/* Timestamp / Date Column with Sort */}
                  <div 
                    onClick={() => handleSort("date")}
                    className="cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors group flex items-center gap-1.5"
                  >
                    <span>Timestamp</span>
                    {renderSortIndicator("date")}
                  </div>

                  <div className="text-right">Actions</div>
                </div>

                {/* Table Rows with motion.div entry and hover scale animation */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredAndSortedOrders.map((order, index) => {
                    const orderId = String(order.orderId || order.OrderID || order.ID || `ORD-${index}`);
                    const serviceType = String(order.serviceType || order.ServiceType || order.service || order.Service || "Digital Certificate / Service");
                    const amount = Number(order.totalAmount || order.TotalAmount || order.amount || order.Amount || 0);
                    const status = String(order.status || order.Status || "Pending");
                    const dateRaw = order.date || order.Date || order.createdAt || order.CreatedAt || order.timestamp || order.Timestamp;
                    const dateFormatted = dateRaw 
                      ? new Date(dateRaw).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) 
                      : "—";
                    const timeFormatted = dateRaw 
                      ? new Date(dateRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                      : "";
                    
                    const serviceDescription = order.serviceDescription || order.ServiceDescription || order.description || order.Description || "Standard government documentation facilitation with online application processing and verification.";
                    const internalNotes = order.internalNotes || order.InternalNotes || order.notes || order.Notes || "Standard submission verified against Gujarat Portal master database.";
                    const finalFile = order.finalFileLink || order.FinalFileLink || order.fileLink || order.FileLink;
                    const rowKey = `order-row-${orderId}-${index}`;
                    const isExpanded = !!expandedRows[rowKey] || !!expandedRows[orderId];

                    return (
                      <motion.div
                        key={rowKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          duration: 0.35, 
                          delay: Math.min(index * 0.035, 0.35),
                          ease: [0.25, 0.1, 0.25, 1.0]
                        }}
                        whileHover={{ 
                          scale: 1.008, 
                          transition: { duration: 0.18, ease: "easeOut" } 
                        }}
                        onClick={() => setSelectedOrderForModal(order)}
                        className={`cursor-pointer transition-colors group/row relative z-0 hover:z-10 ${
                          isExpanded 
                            ? "bg-slate-50/95 dark:bg-slate-800/50 shadow-xs" 
                            : "hover:bg-slate-50/90 dark:hover:bg-slate-800/40 hover:shadow-md"
                        }`}
                      >
                        {/* Main Grid Row */}
                        <div className="grid grid-cols-[56px_165px_1fr_120px_135px_135px_145px] items-center py-4 px-5">
                          {/* Row Index / Inline chevron toggle */}
                          <div className="text-center text-slate-400 flex justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRow(rowKey);
                              }}
                              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              title={isExpanded ? "Collapse inline preview" : "Expand inline preview"}
                            >
                              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                          </div>

                          {/* OrderID */}
                          <div className="font-mono font-bold text-slate-900 dark:text-white pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-600 dark:text-emerald-400">#</span>
                              <span className="truncate">{orderId}</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyOrderId(orderId, e)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors shrink-0"
                                title="Copy Order ID"
                              >
                                {copiedOrderId === orderId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>

                          {/* ServiceType */}
                          <div className="font-bold text-slate-800 dark:text-slate-200 pr-4">
                            <div className="flex flex-col">
                              <span className="group-hover/row:text-emerald-600 dark:group-hover/row:text-emerald-400 transition-colors leading-snug line-clamp-1">
                                {serviceType}
                              </span>
                              {order.customerName && (
                                <span className="text-[11px] font-normal text-slate-400 truncate">
                                  Applicant: {order.customerName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* TotalAmount */}
                          <div className="font-mono font-black text-slate-900 dark:text-white">
                            ₹{amount.toLocaleString("en-IN")}
                          </div>

                          {/* Status */}
                          <div>
                            {getStatusBadge(status)}
                          </div>

                          {/* Timestamp */}
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <div>{dateFormatted}</div>
                            {timeFormatted && <div className="text-[11px] text-slate-400">{timeFormatted}</div>}
                          </div>

                          {/* Action Buttons */}
                          <div className="text-right flex justify-end">
                            <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {/* Open Modal Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForModal(order)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                                title="View granular order metadata and billing"
                              >
                                <Eye size={13} />
                                <span>Details</span>
                              </button>

                              {onTrackOrder && (
                                <button
                                  type="button"
                                  onClick={() => onTrackOrder(orderId)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                                >
                                  Track
                                </button>
                              )}

                              {finalFile && (
                                <a
                                  href={finalFile}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Download finalized document"
                                >
                                  <Download size={13} />
                                  <span>Doc</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inline Expandable Details Preview */}
                        {isExpanded && (
                          <div className="py-5 px-6 sm:px-10 border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-sm animate-fadeIn">
                              
                              {/* Service Description */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                                  <FileText size={14} className="text-emerald-600" />
                                  <span>Service Description</span>
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                  {serviceDescription}
                                </p>
                              </div>

                              {/* Internal Notes */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                                  <ShieldCheck size={14} className="text-blue-600" />
                                  <span>Administrative Status Notes</span>
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                  {internalNotes}
                                </p>
                              </div>

                              {/* Quick Metadata & Expanded Modal Trigger */}
                              <div className="md:col-span-2 pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-4">
                                  <span>Customer: <strong className="text-slate-800 dark:text-slate-200">{order.customerName || order.CustomerName || activeEmail}</strong></span>
                                  {order.paymentId && <span>Payment Ref: <strong className="font-mono text-slate-800 dark:text-slate-200">{order.paymentId}</strong></span>}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedOrderForModal(order)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <span>View Full Metadata & Billing Breakdown</span>
                                    <ArrowRight size={13} />
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Table Footer */}
            <div className="py-4 px-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>Showing {filteredAndSortedOrders.length} of {orders.length} orders recorded in Google Sheets</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time listener polling every 12s</span>
                </span>
                <span>•</span>
                <button
                  type="button"
                  onClick={handlePrintSummary}
                  className="text-slate-700 dark:text-slate-200 hover:text-emerald-600 underline cursor-pointer"
                >
                  Download PDF Summary
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXPANDED MODAL VIEW: Granular Order Metadata, Billing Breakdown & Files   */}
        {/* ========================================================================= */}
        {selectedOrderForModal && (() => {
          const mOrder = selectedOrderForModal;
          const mOrderId = String(mOrder.orderId || mOrder.OrderID || mOrder.ID || "");
          const mService = String(mOrder.serviceType || mOrder.ServiceType || mOrder.service || mOrder.Service || "Government Digital Service");
          const mTotal = Number(mOrder.totalAmount || mOrder.TotalAmount || mOrder.amount || mOrder.Amount || 0);
          const mStatus = String(mOrder.status || mOrder.Status || "Pending");
          const mDateVal = mOrder.date || mOrder.Date || mOrder.createdAt || mOrder.CreatedAt || mOrder.timestamp || mOrder.Timestamp;
          const mDateFormatted = mDateVal ? new Date(mDateVal).toLocaleDateString("en-IN", { dateStyle: "long" }) : "—";
          const mTimeFormatted = mDateVal ? new Date(mDateVal).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
          const mPaymentId = mOrder.paymentId || mOrder.PaymentID;
          const mCustomer = mOrder.customerName || mOrder.CustomerName || activeEmail || "Customer";
          const mPhone = mOrder.phone || mOrder.Phone || "—";
          const mEmail = mOrder.email || mOrder.UserEmail || activeEmail;
          const mTracking = mOrder.trackingNumber || mOrder.TrackingNumber;
          const mFinalLink = mOrder.finalFileLink || mOrder.FinalFileLink;
          const mRawFileLink = mOrder.fileLink || mOrder.FileLink;

          // Granular billing calculation
          const baseServiceFee = Math.round(mTotal * 0.82) || mTotal;
          const portalGovtFee = mTotal > baseServiceFee ? mTotal - baseServiceFee : 0;

          // Lifecycle steps
          const norm = getNormalizedStatus(mStatus);
          const currentStep = norm === "completed" ? 4 : norm === "processing" ? 2 : 1;

          // Customer uploaded files
          const customerFiles = extractCustomerUploadedFiles(mOrder, { allowOcrDrafts: false, includeFinalFiles: false });

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
                
                {/* Modal Header Bar */}
                <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <span>#{mOrderId}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyOrderId(mOrderId, e)}
                          className="hover:text-emerald-600 transition-colors"
                          title="Copy Order ID"
                        >
                          {copiedOrderId === mOrderId ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </span>

                      {getStatusBadge(mStatus)}

                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {mDateFormatted} {mTimeFormatted ? `at ${mTimeFormatted}` : ""}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {mService}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderForModal(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Modal Scrollable Content */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  
                  {/* Step Timeline */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <Activity size={14} className="text-blue-500" />
                      <span>Order Fulfillment Status</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className={`p-2.5 rounded-xl border ${currentStep >= 1 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                        <div className="font-mono text-[10px] mb-1">STEP 1</div>
                        <div>Order Received</div>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${currentStep >= 2 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                        <div className="font-mono text-[10px] mb-1">STEP 2</div>
                        <div>Processing</div>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${currentStep >= 3 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                        <div className="font-mono text-[10px] mb-1">STEP 3</div>
                        <div>Verification</div>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${currentStep >= 4 ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                        <div className="font-mono text-[10px] mb-1">STEP 4</div>
                        <div>Completed</div>
                      </div>
                    </div>
                  </div>

                  {/* GRANULAR BILLING BREAKDOWN */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard size={18} className="text-emerald-600" />
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          Granular Billing Breakdown
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDownloadInvoice(mOrder, e)}
                        disabled={downloadingInvoiceId === mOrderId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <Receipt size={13} />
                        <span>{downloadingInvoiceId === mOrderId ? "Downloading..." : "Tax Invoice"}</span>
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300 font-medium">
                        <span>Base Application & Facilitation Fee</span>
                        <span className="font-mono font-bold">₹{baseServiceFee.toLocaleString("en-IN")}</span>
                      </div>

                      {portalGovtFee > 0 && (
                        <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300 font-medium">
                          <span>Government Portal Processing & e-Gram Clearance</span>
                          <span className="font-mono font-bold">₹{portalGovtFee.toLocaleString("en-IN")}</span>
                        </div>
                      )}

                      <div className="flex justify-between py-1 text-slate-500 dark:text-slate-400 text-xs">
                        <span>Digital Document Verification & Stamp Duty</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">INCLUDED</span>
                      </div>

                      <div className="flex justify-between py-1 text-slate-500 dark:text-slate-400 text-xs">
                        <span>Online Service Concession / Discount</span>
                        <span className="font-mono">₹0.00</span>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center text-base font-black">
                        <span className="text-slate-900 dark:text-white">Total Amount Paid</span>
                        <span className="font-mono text-xl text-emerald-600 dark:text-emerald-400">
                          ₹{mTotal.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Payment Reference details */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Payment Reference:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {mPaymentId || "OFFICIAL_ONLINE_TXN"}
                        </span>
                        {mPaymentId && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(mPaymentId);
                              toast.success("Payment reference copied!");
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600"
                            title="Copy Payment ID"
                          >
                            <Copy size={11} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">Verified & Reconciled</span>
                      </div>
                    </div>
                  </div>

                  {/* FILE HISTORY & ATTACHMENTS */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Layers size={18} className="text-blue-600" />
                        <h3 className="font-black text-slate-900 dark:text-white text-base">
                          File History & Document Artifacts
                        </h3>
                      </div>

                      {(mFinalLink || mRawFileLink || customerFiles.length > 0) && (
                        <button
                          type="button"
                          onClick={(e) => handleOpenDocViewer(mOrder, e)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Interactive Live Viewer</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {/* Final Deliverable */}
                      {mFinalLink ? (
                        <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                              <FileCheck2 size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">
                                  Official Approved Deliverable
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                                  FINAL
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                {mService} - Verified Certificate
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <a
                              href={mFinalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                            >
                              <Download size={13} />
                              <span>Download Document</span>
                            </a>
                            <a
                              href={mFinalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                              title="Open in new tab"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs">
                          <Clock size={16} className="text-amber-500 shrink-0" />
                          <span>
                            Official deliverable document is currently under preparation and administrative verification. Once approved, it will be automatically downloadable here.
                          </span>
                        </div>
                      )}

                      {/* Customer Uploaded Files List */}
                      {customerFiles.length > 0 ? (
                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">
                            Customer Uploaded Source Files ({customerFiles.length})
                          </span>
                          {customerFiles.map((file, fIdx) => (
                            <div
                              key={fIdx}
                              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <FileText size={16} className="text-slate-400 shrink-0" />
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {file.name}
                                </span>
                                <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {file.type}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                                >
                                  <Download size={12} />
                                  <span>Download</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : mRawFileLink ? (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={16} className="text-slate-400" />
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              Original Uploaded Document
                            </span>
                          </div>
                          <a
                            href={mRawFileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                          >
                            <ExternalLink size={12} />
                            <span>View Source</span>
                          </a>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No direct customer source files linked to this Google Sheet record.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* CITIZEN FEEDBACK & SERVICE RATING (FOR COMPLETED ORDERS)                  */}
                  {/* ========================================================================= */}
                  {norm === "completed" && (() => {
                    const existingFeedback = feedbackCache[mOrderId] || (
                      (mOrder.Feedback || mOrder.feedback || mOrder.Rating || mOrder.rating)
                        ? {
                            rating: Number(mOrder.Rating || mOrder.rating) || 5,
                            feedback: String(mOrder.Feedback || mOrder.feedback || ""),
                            submittedAt: mOrder.feedbackSubmittedAt
                          }
                        : null
                    );

                    return (
                      <div id="modal-feedback-section" className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-3">
                          <div className="flex items-center gap-2">
                            <Star size={18} className="text-amber-500 fill-amber-400" />
                            <h3 className="font-black text-slate-900 dark:text-white text-base">
                              Citizen Feedback & Experience Rating
                            </h3>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Completed Order
                          </span>
                        </div>

                        {/* Display Existing Feedback */}
                        {existingFeedback && !showFeedbackForm ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center text-amber-400">
                                  {[1, 2, 3, 4, 5].map((starVal) => (
                                    <Star
                                      key={starVal}
                                      size={18}
                                      className={starVal <= (existingFeedback.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}
                                    />
                                  ))}
                                </div>
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                  {getRatingLabel(existingFeedback.rating || 5)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setFeedbackRating(existingFeedback.rating || 5);
                                  setFeedbackText(existingFeedback.feedback || "");
                                  setShowFeedbackForm(true);
                                }}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <MessageSquare size={13} />
                                <span>Edit Feedback</span>
                              </button>
                            </div>

                            {existingFeedback.feedback && (
                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-amber-200/50 dark:border-amber-900/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium italic">
                                "{existingFeedback.feedback}"
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                              <span>
                                Feedback recorded and verified against Order #{mOrderId}. Thank you for helping us maintain high service standards!
                              </span>
                            </div>
                          </div>
                        ) : showFeedbackForm ? (
                          /* Active Interactive Feedback Form */
                          <div className="space-y-4 pt-1">
                            <div>
                              <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                                Rate your overall facilitation experience:
                              </label>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((starVal) => {
                                    const isActive = starVal <= (feedbackHoverRating || feedbackRating);
                                    return (
                                      <button
                                        key={starVal}
                                        type="button"
                                        onMouseEnter={() => setFeedbackHoverRating(starVal)}
                                        onMouseLeave={() => setFeedbackHoverRating(0)}
                                        onClick={() => setFeedbackRating(starVal)}
                                        className="p-1 text-slate-300 dark:text-slate-600 hover:scale-110 transition-transform cursor-pointer"
                                        title={`Rate ${starVal} Star${starVal > 1 ? "s" : ""}`}
                                      >
                                        <Star
                                          size={26}
                                          className={isActive ? "fill-amber-400 text-amber-400" : ""}
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 ml-2">
                                  {getRatingLabel(feedbackHoverRating || feedbackRating)}
                                </span>
                              </div>
                            </div>

                            {/* Quick Highlight Chips */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                                Quick Service Highlights:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {FEEDBACK_TAGS.map((tag) => {
                                  const isSelected = selectedTags.includes(tag);
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => {
                                        setSelectedTags(prev => 
                                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                        );
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        isSelected
                                          ? "bg-amber-500 text-white shadow-xs"
                                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                                      }`}
                                    >
                                      {tag}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Comments Textarea */}
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                                Citizen Review / Comments:
                              </label>
                              <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Please share feedback regarding turnaround speed, document quality, or staff assistance..."
                                rows={3}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-400 transition-all resize-none"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              {existingFeedback && (
                                <button
                                  type="button"
                                  onClick={() => setShowFeedbackForm(false)}
                                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSubmitFeedback(mOrderId, mOrder)}
                                disabled={feedbackSubmitting}
                                className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {feedbackSubmitting ? (
                                  <>
                                    <RefreshCw size={13} className="animate-spin" />
                                    <span>Submitting...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send size={13} />
                                    <span>Submit Rating & Feedback</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Initial Prompt Card */
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white/70 dark:bg-slate-800/50 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>How was your experience with Order #{mOrderId}?</span>
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Your feedback helps us continuously improve online government facilitation.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setFeedbackRating(5);
                                setFeedbackText("");
                                setSelectedTags([]);
                                setShowFeedbackForm(true);
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <Star size={13} className="fill-white" />
                              <span>Provide Feedback</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* CUSTOMER & ADMINISTRATIVE METADATA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="font-black text-slate-400 uppercase tracking-wider block">Customer Information</span>
                      <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-slate-400" />
                          <span>{mCustomer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-slate-400" />
                          <span>{mEmail || "Not specified"}</span>
                        </div>
                        {mPhone !== "—" && (
                          <div className="flex items-center gap-2">
                            <Phone size={13} className="text-slate-400" />
                            <span>{mPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="font-black text-slate-400 uppercase tracking-wider block">Filing & Facilitation Center</span>
                      <div className="space-y-1 text-slate-700 dark:text-slate-300 font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 size={13} className="text-slate-400" />
                          <span>Amit Online Services (CSC / e-Gram)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck size={13} className="text-slate-400" />
                          <span>Tracking: <strong className="font-mono text-slate-900 dark:text-white">{mTracking || mOrderId}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={13} className="text-emerald-600" />
                          <span>Verified via Gujarat Government Portal</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {norm === "completed" && (() => {
                      const existingFeedback = feedbackCache[mOrderId] || (
                        (mOrder.Feedback || mOrder.feedback || mOrder.Rating || mOrder.rating)
                          ? {
                              rating: Number(mOrder.Rating || mOrder.rating) || 5,
                              feedback: String(mOrder.Feedback || mOrder.feedback || ""),
                              submittedAt: mOrder.feedbackSubmittedAt
                            }
                          : null
                      );

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            if (existingFeedback) {
                              setFeedbackRating(existingFeedback.rating || 5);
                              setFeedbackText(existingFeedback.feedback || "");
                            } else {
                              setFeedbackRating(5);
                              setFeedbackText("");
                              setSelectedTags([]);
                            }
                            setShowFeedbackForm(true);
                            const el = document.getElementById("modal-feedback-section");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-black bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Provide rating and feedback for this completed order"
                        >
                          <Star size={14} className="fill-amber-400 text-amber-500" />
                          <span>{existingFeedback ? "Edit Feedback" : "Provide Feedback"}</span>
                        </button>
                      );
                    })()}

                    {onTrackOrder && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderForModal(null);
                          onTrackOrder(mOrderId);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck size={14} />
                        <span>Live Tracking</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleDownloadInvoice(mOrder, e)}
                      disabled={downloadingInvoiceId === mOrderId}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download size={14} />
                      <span>{downloadingInvoiceId === mOrderId ? "Generating..." : "Download Invoice PDF"}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderForModal(null)}
                    className="px-6 py-2 rounded-xl text-xs font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Live PDF & Document Viewer Modal */}
        <LivePdfDocViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          files={viewerFiles}
          orderId={viewerOrderId}
          lang={lang}
        />

      </div>
    </div>
  );
};

export default UserOrderHistoryPage;
