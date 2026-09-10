import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  RefreshCw, 
  Loader2, 
  Archive, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Printer,
  Eye,
  FileText,
  Table as TableIcon,
  LayoutGrid,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Truck,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Info,
  Tag,
  CreditCard,
  Copy,
  Check,
  Sparkles,
  User,
  Mail
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { OrderTracking } from "./OrderTracking";
import { LivePdfDocViewerModal, extractCustomerUploadedFiles, CustomerUploadedFile } from "./LivePdfDocViewerModal";

const getStatusDefinition = (status: string, defs: any[] = []) => {
  const norm = String(status || "").toLowerCase().trim();
  
  const matched = (defs || []).find(d => {
    const sName = String(d.Status || d.status || "").toLowerCase().trim();
    return norm.includes(sName) || sName.includes(norm);
  });
  
  if (matched) {
    return matched.Definition || matched.definition || matched.Description || matched.description;
  }
  
  if (norm.includes("pend")) {
    return "Your order has been placed and is waiting for payment verification or initial review.";
  }
  if (norm.includes("process")) {
    return "Work is actively being worked on by our digital administrative experts.";
  }
  if (norm.includes("review") || norm.includes("verify")) {
    return "Your application details are undergoing quality checks and administrative validation.";
  }
  if (norm.includes("submitt")) {
    return "The application details have been prepared and uploaded/submitted securely to the government portal.";
  }
  if (norm.includes("complet") || norm.includes("approv") || norm.includes("upload") || norm.includes("issue")) {
    return "The document or service is fully completed, approved, and available for download.";
  }
  if (norm.includes("revis")) {
    return "Corrections or clarifications are actively being incorporated into your document/order.";
  }
  if (norm.includes("cancel") || norm.includes("reject")) {
    return "The order has been cancelled or rejected. Contact support for assistance.";
  }
  return "Your request is currently undergoing active administration phases. Click to learn more.";
};

const getServiceCatalogMeta = (serviceName: string, item?: any) => {
  const customDesc = 
    item?.serviceDescription || 
    item?.ServiceDescription || 
    item?.description || 
    item?.Description || 
    item?.serviceDesc || 
    item?.details || 
    item?.Details ||
    item?.serviceDetails;

  const customCategory = item?.category || item?.Category;
  const customDeliverable = item?.deliverable || item?.Deliverable;
  const customSla = item?.sla || item?.turnaroundTime || item?.EstimatedDelivery;

  const s = String(serviceName || "").toLowerCase();

  let defaultDesc = "Official government liaison, digital documentation digitization, e-KYC validation, and administrative filing processed by certified CSC & e-Gram staff.";
  let category = "Government Digital Service";
  let deliverable = "Official Verified Document / e-Certificate";
  let sla = "3 - 5 Working Days";

  if (s.includes("dsc") || s.includes("digital signature")) {
    defaultDesc = "Class-3 Digital Signature Certificate (DSC) cryptographic signing token with encryption for MCA portal filings, GST return filing, e-Tendering, and legal e-Sign compliance.";
    category = "Digital Identity & Security";
    deliverable = "FIPS Compliant USB Crypto Token + e-Pass Certificate";
    sla = "24 - 48 Hours";
  } else if (s.includes("pan")) {
    defaultDesc = "Permanent Account Number (PAN) application with NSDL/UTIITSL, handling biometric e-KYC validation, correction filings, minor/major transitions, and physical tamper-proof PVC card dispatch.";
    category = "Taxation & Financial Identity";
    deliverable = "Physical PVC Smart Card + Verified e-PAN PDF";
    sla = "5 - 7 Working Days";
  } else if (s.includes("income") || s.includes("aavak")) {
    defaultDesc = "Official Revenue Department Income Certificate (Aavak no Dakhlo) with Tehsildar verification, QR-coded digital stamp, and social welfare scholarship eligibility.";
    category = "Revenue & Social Welfare";
    deliverable = "Digital Revenue Barcoded Certificate (Valid for 3 Yrs)";
    sla = "2 - 4 Working Days";
  } else if (s.includes("domicile") || s.includes("residence")) {
    defaultDesc = "State domicile and continuous residency certificate under Revenue Department for college admission, competitive exam reservations, and government quota verification.";
    category = "Legal Residency";
    deliverable = "Gazetted Officer Verified Domicile Certificate";
    sla = "3 - 5 Working Days";
  } else if (s.includes("gst")) {
    defaultDesc = "Comprehensive GSTIN registration / return filing compliance, composition schemes, business premise verification, and jurisdictional tax office liaison.";
    category = "Commercial Taxation";
    deliverable = "GSTIN Certificate (Form GST REG-06) + ARN Docket";
    sla = "3 - 5 Working Days";
  } else if (s.includes("aadhar") || s.includes("aadhaar")) {
    defaultDesc = "UIDAI biometric and demographic update assistance, address proof validation, mobile linkage, and official PVC card ordering.";
    category = "National Identity";
    deliverable = "UIDAI Verified e-Aadhaar & Enrolment Docket";
    sla = "1 - 3 Working Days";
  } else if (s.includes("voter") || s.includes("epic")) {
    defaultDesc = "Election Commission of India (ECI) Form 6/8 submission, constituency assembly shift, name correction, and colored EPIC voter card issuance.";
    category = "Electoral Verification";
    deliverable = "Official National Voter ID (EPIC) + Form Receipt";
    sla = "7 - 10 Working Days";
  } else if (s.includes("driving") || s.includes("license") || s.includes("dl") || s.includes("rto")) {
    defaultDesc = "Sarathi Parivahan RTO driving license slot booking, medical fitness Form 1-A processing, learning license issuance, and smart card dispatch.";
    category = "Transport & RTO";
    deliverable = "RTO Chip-Embedded Smart Driving License";
    sla = "5 - 7 Working Days";
  } else if (s.includes("passport")) {
    defaultDesc = "Passport Seva Kendra (PSK) appointment scheduling, police verification report (PVR) coordination, documentation vetting, and Tatkal/Normal filing.";
    category = "Ministry of External Affairs";
    deliverable = "Govt of India Biometric Passport Book";
    sla = "7 - 15 Working Days";
  } else if (s.includes("gumasta") || s.includes("shop")) {
    defaultDesc = "Municipal Corporation Shop & Establishment Act registration (Gumasta Dhara), labor inspection compliance, and commercial entity legal recognition.";
    category = "Business Compliance";
    deliverable = "Municipal Trade License Certificate";
    sla = "2 - 3 Working Days";
  } else if (s.includes("ration")) {
    defaultDesc = "Food & Civil Supplies Department ration card addition/deletion of family members, bifurcation, and NFSA subsidy entitlement updates.";
    category = "Civil Supplies & NFSA";
    deliverable = "Barcoded Digital Ration Booklet / NFSA Slip";
    sla = "5 - 8 Working Days";
  } else if (s.includes("non-creamy") || s.includes("creamy") || s.includes("obc")) {
    defaultDesc = "OBC Non-Creamy Layer Certificate verifying annual parental income limits for central/state educational admissions and job recruitments.";
    category = "Affirmative Action / Caste";
    deliverable = "Magistrate Authorized Non-Creamy Layer Certificate";
    sla = "3 - 5 Working Days";
  } else if (s.includes("police") || s.includes("pcc")) {
    defaultDesc = "Police Clearance Certificate (PCC) criminal record verification for overseas employment, visa immigration, and sensitive security jobs.";
    category = "Law & Order Clearance";
    deliverable = "Police Commissioner Authorized Clearance Certificate";
    sla = "3 - 7 Working Days";
  }

  return {
    description: customDesc || defaultDesc,
    category: customCategory || category,
    deliverable: customDeliverable || deliverable,
    sla: customSla || sla
  };
};
import { downloadPDFInvoice } from "../utils/invoiceGenerator";
import { jsPDF } from "jspdf";

interface Order {
  orderId?: string;
  ID?: string;
  service?: string;
  Type?: string;
  status?: string;
  Status?: string;
  date?: string;
  Timestamp?: string;
  amount?: string | number;
  Amount?: string | number;
  paymentId?: string;
  PaymentID?: string;
  Notes?: string;
  notes?: string;
}

interface OrderHistorySectionProps {
  user: {
    token: string;
    email: string;
  };
}

export function OrderHistorySection({ user }: OrderHistorySectionProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(() => {
    try {
      return localStorage.getItem("aos_user_order_status_filter") || "all";
    } catch {
      return "all";
    }
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem("aos_user_order_sort_by") || "date_desc";
    } catch {
      return "date_desc";
    }
  });
  const [statusDefinitions, setStatusDefinitions] = useState<any[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [liveDocViewerState, setLiveDocViewerState] = useState<{
    isOpen: boolean;
    files: CustomerUploadedFile[];
    orderId?: string | number;
    title?: string;
  }>({
    isOpen: false,
    files: []
  });

  // Sync preference changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("aos_user_order_status_filter", selectedStatus);
    } catch (e) {
      console.warn("Failed to persist user order status filter preference", e);
    }
  }, [selectedStatus]);

  useEffect(() => {
    try {
      localStorage.setItem("aos_user_order_sort_by", sortBy);
    } catch (e) {
      console.warn("Failed to persist user order sort preference", e);
    }
  }, [sortBy]);

  // View Mode: Table (default) vs Cards
  const [viewMode, setViewMode] = useState<"table" | "cards">(() => {
    try {
      return (localStorage.getItem("aos_user_order_view_mode") as "table" | "cards") || "table";
    } catch {
      return "table";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("aos_user_order_view_mode", viewMode);
    } catch (e) {}
  }, [viewMode]);

  // Interactive Table Column Sorting
  const [sortColumn, setSortColumn] = useState<string>(() => {
    try {
      return localStorage.getItem("aos_user_order_sort_col") || "date";
    } catch {
      return "date";
    }
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => {
    try {
      return (localStorage.getItem("aos_user_order_sort_dir") as "asc" | "desc") || "desc";
    } catch {
      return "desc";
    }
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      const nextDir = sortDirection === "asc" ? "desc" : "asc";
      setSortDirection(nextDir);
      try {
        localStorage.setItem("aos_user_order_sort_dir", nextDir);
      } catch (e) {}
    } else {
      setSortColumn(column);
      const defaultDir = (column === "date" || column === "amount") ? "desc" : "asc";
      setSortDirection(defaultDir);
      try {
        localStorage.setItem("aos_user_order_sort_col", column);
        localStorage.setItem("aos_user_order_sort_dir", defaultDir);
      } catch (e) {}
    }
  };

  // Expandable Table Rows State
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([]);

  const toggleRowExpansion = (orderId: string | number) => {
    const idStr = String(orderId);
    setExpandedRowIds((prev) => 
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  const handleExpandAll = () => {
    const allIds = filteredOrders.map((o) => String(o.orderId || o.ID));
    const allExpanded = allIds.length > 0 && allIds.every((id) => expandedRowIds.includes(id));
    if (allExpanded) {
      setExpandedRowIds([]);
      toast.success("Collapsed all order rows.");
    } else {
      setExpandedRowIds(allIds);
      toast.success(`Expanded details for all ${allIds.length} orders.`);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyToClipboard = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      toast.success(`Copied ${label} to clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Tracker Modal States
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingModalId, setTrackingModalId] = useState("");
  const [focusedOrderId, setFocusedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedOrder) {
      setOrderHistory([]);
      return;
    }
    const orderId = selectedOrder.orderId || selectedOrder.ID;
    if (!orderId) return;

    const fetchOrderHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await axios.get(`/api/orders/track/${orderId}`);
        if (res.data && res.data.success && res.data.data) {
          setOrderHistory(res.data.data.history || []);
        }
      } catch (err) {
        console.error("Failed to load tracking logs:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchOrderHistory();
  }, [selectedOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl+P (or Cmd+P) is pressed
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        if (focusedOrderId) {
          e.preventDefault(); // Prevent standard browser print dialog
          
          // Print only the focused order
          setSelectedOrderIds([focusedOrderId]);
          toast.info(`Shortcut Ctrl+P triggers print receipt for focused Order #${focusedOrderId}!`);
          setTimeout(() => {
            window.print();
          }, 250);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [focusedOrderId]);

  useEffect(() => {
    const fetchStatusDefsKey = async () => {
      try {
        const res = await axios.get("/api/status-definitions");
        if (res.data.success && Array.isArray(res.data.data)) {
          setStatusDefinitions(res.data.data);
        }
      } catch (err) {
        console.warn("Failed to fetch status definitions for history section");
      }
    };
    fetchStatusDefsKey();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Direct call to the dedicated /api/user/orders endpoint
      const res = await axios.get("/api/user/orders", {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { email: user.email }
      });

      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setOrders(res.data.data);
      } else {
        // Fallback to /api/data/collection if custom endpoint returned no data or needs fallback
        const fallbackRes = await axios.post(
          "/api/data/collection",
          {
            tab: "Orders",
            filterKey: "UserEmail",
            filterValue: user.email,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setOrders(fallbackRes.data?.data || []);
      }
    } catch (err: any) {
      console.warn("Direct /api/user/orders call had error, using fallback:", err.message);
      try {
        const fallbackRes = await axios.post(
          "/api/data/collection",
          {
            tab: "Orders",
            filterKey: "UserEmail",
            filterValue: user.email,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setOrders(fallbackRes.data?.data || []);
      } catch (fallbackErr) {
        toast.error("Failed to load your order archive.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user.email]);

  // Filter and Sort Logic
  const filteredOrders = orders
    .filter((order) => {
      const orderId = String(order.orderId || order.ID || "").toLowerCase();
      const service = String(order.service || order.Type || "").toLowerCase();
      const status = String(order.status || order.Status || "").toLowerCase();
      const refId = String(order.paymentId || order.PaymentID || "").toLowerCase();
      const notes = String(order.notes || order.Notes || "").toLowerCase();
      
      // Search filter
      const matchesSearch = 
        !searchQuery ||
        orderId.includes(searchQuery.toLowerCase()) || 
        service.includes(searchQuery.toLowerCase()) ||
        refId.includes(searchQuery.toLowerCase()) ||
        notes.includes(searchQuery.toLowerCase()) ||
        status.includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = 
        selectedStatus === "all" || 
        status === selectedStatus.toLowerCase() ||
        (selectedStatus === "completed" && (status.includes("completed") || status.includes("approved")));

      // Date filter
      const orderDateVal = (order as any).createdAt || (order as any).CreatedAt || (order as any).timestamp || (order as any).Timestamp || (order as any).date || (order as any).Date;
      let matchesDate = true;
      if (orderDateVal) {
        const orderTime = new Date(orderDateVal).getTime();
        if (startDate) {
          const start = new Date(`${startDate}T00:00:00`).getTime();
          if (orderTime < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(`${endDate}T23:59:59`).getTime();
          if (orderTime > end) matchesDate = false;
        }
      } else if (startDate || endDate) {
        matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      // Explicit Column Sorting
      if (sortColumn === "orderId") {
        const idA = String(a.orderId || a.ID || "");
        const idB = String(b.orderId || b.ID || "");
        return sortDirection === "asc"
          ? idA.localeCompare(idB, undefined, { numeric: true })
          : idB.localeCompare(idA, undefined, { numeric: true });
      }

      if (sortColumn === "service") {
        const sA = String(a.service || a.Type || "");
        const sB = String(b.service || b.Type || "");
        return sortDirection === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
      }

      if (sortColumn === "amount") {
        const amtA = parseFloat(String(a.amount || a.Amount || 0)) || 0;
        const amtB = parseFloat(String(b.amount || b.Amount || 0)) || 0;
        return sortDirection === "asc" ? amtA - amtB : amtB - amtA;
      }

      if (sortColumn === "paymentId") {
        const pA = String(a.paymentId || a.PaymentID || "");
        const pB = String(b.paymentId || b.PaymentID || "");
        return sortDirection === "asc" ? pA.localeCompare(pB) : pB.localeCompare(pA);
      }

      if (sortColumn === "status") {
        const statusOrder: Record<string, number> = {
          pending: 1,
          "under review": 2,
          submitted: 3,
          query: 4,
          completed: 5,
          approved: 5,
          cancelled: 6,
          rejected: 6,
        };
        const statusA = String(a.status || a.Status || "pending").toLowerCase().trim();
        const statusB = String(b.status || b.Status || "pending").toLowerCase().trim();
        const rankA = statusOrder[statusA] || 99;
        const rankB = statusOrder[statusB] || 99;
        return sortDirection === "asc" ? rankA - rankB : rankB - rankA;
      }

      // Default: Date sorting
      const timeA = new Date((a as any).createdAt || (a as any).CreatedAt || (a as any).timestamp || (a as any).Timestamp || (a as any).date || (a as any).Date || 0).getTime();
      const timeB = new Date((b as any).createdAt || (b as any).CreatedAt || (b as any).timestamp || (b as any).Timestamp || (b as any).date || (b as any).Date || 0).getTime();

      if (sortDirection === "asc" || sortBy === "date_asc") {
        return timeA - timeB;
      } else {
        // Default: Newest first
        return timeB - timeA;
      }
    });

  // Receipt CSV Exporter
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No transactions to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Service Requested",
      "Filing Date",
      "Status",
      "Transaction / G-Pay Reference ID",
      "Service Fee (INR)"
    ];

    const rows = filteredOrders.map((o) => {
      const orderId = o.orderId || o.ID || "N/A";
      const service = o.service || o.Type || "Miscellaneous Document Service";
      const dateVal = (o as any).createdAt || (o as any).CreatedAt || (o as any).timestamp || (o as any).Timestamp || (o as any).date || (o as any).Date ? new Date((o as any).createdAt || (o as any).CreatedAt || (o as any).timestamp || (o as any).Timestamp || (o as any).date || (o as any).Date).toLocaleDateString() : "N/A";
      const status = o.status || o.Status || "Pending";
      const refId = o.paymentId || o.PaymentID || "Completed Direct";
      const amount = o.amount || o.Amount || "250.00";

      return [
        `"${orderId}"`,
        `"${service.replace(/"/g, '""')}"`,
        `"${dateVal}"`,
        `"${status}"`,
        `"${refId}"`,
        `"${amount}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AOS_Transaction_Receipts_Dossier_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredOrders.length} transaction receipts successfully!`);
  };

  // Receipt Excel (.xlsx) Exporter using 'xlsx' library
  const handleExportExcel = async () => {
    if (filteredOrders.length === 0) {
      toast.error("No transactions to export.");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      
      const dataToExport = filteredOrders.map((o) => {
        const orderId = o.orderId || o.ID || "N/A";
        const service = o.service || o.Type || "Miscellaneous Document Service";
        const dateVal = (o as any).createdAt || (o as any).CreatedAt || (o as any).timestamp || (o as any).Timestamp || (o as any).date || (o as any).Date ? new Date((o as any).createdAt || (o as any).CreatedAt || (o as any).timestamp || (o as any).Timestamp || (o as any).date || (o as any).Date).toLocaleString() : "N/A";
        const status = o.status || o.Status || "Pending";
        const refId = o.paymentId || o.PaymentID || "Completed Direct";
        const amount = parseFloat(String(o.amount || o.Amount || "250.00"));

        return {
          "Order ID": orderId,
          "Service Requested": service,
          "Filing Date": dateVal,
          "Status": status,
          "Transaction / G-Pay Reference ID": refId,
          "Service Fee (INR)": amount
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Order History");
      
      // Auto-fit columns
      const maxLenMap = dataToExport.reduce((acc: any, row: any) => {
        Object.keys(row).forEach((key) => {
          const valLen = String(row[key]).length;
          acc[key] = Math.max(acc[key] || key.length, valLen);
        });
        return acc;
      }, {});
      worksheet["!cols"] = Object.keys(maxLenMap).map((key) => ({
        wch: maxLenMap[key] + 3
      }));

      XLSX.writeFile(workbook, `AOS_Order_History_${Date.now()}.xlsx`);
      toast.success(`Exported ${filteredOrders.length} records to Excel (.xlsx) successfully!`);
    } catch (err: any) {
      console.error("Failed to export Excel file:", err);
      toast.error("Excel export failed: " + err.message);
    }
  };

  const handleToggleUrgent = async (orderId: string | number) => {
    try {
      const res = await axios.post("/api/orders/toggle-urgent", { orderId });
      if (res.data && res.data.success) {
        if (res.data.isUrgent) {
          toast.success("Order tagged as Urgent. Admin will prioritize your query! 🚨");
        } else {
          toast.success("Urgent query cleared successfully.");
        }
        fetchHistory();
      } else {
        toast.error("Urgency action failed.");
      }
    } catch (err) {
      toast.error("Failed to tag order as urgent.");
    }
  };

  // jsPDF printable Order Summary Report with Timeline
  const downloadOrderSummaryPDF = (order: any) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Background accent
      doc.setFillColor(15, 23, 42); // Navy Dark
      doc.rect(0, 0, 210, 45, "F");

      // Brand Title
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("AMIT ONLINE SERVICES", 15, 18);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text("Official Facilitation Facilitator Receipt & Status Digest", 15, 24);

      doc.setFontSize(8);
      doc.setTextColor(209, 213, 219);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 30);

      // Section Header: Order Core Details
      doc.setTextColor(15, 23, 42);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("ORDER SUMMARY REPORT", 15, 58);
      doc.line(15, 60, 195, 60);

      // Core details table
      const details = [
        ["Order Identifier:", `#${order.orderId || order.ID || "N/A"}`],
        ["Service Classification:", order.service || order.Type || "N/A"],
        ["Filing / Record Date:", order.createdAt || order.CreatedAt || order.timestamp || order.Timestamp || order.date || order.Date ? new Date(order.createdAt || order.CreatedAt || order.timestamp || order.Timestamp || order.date || order.Date).toLocaleString() : "Recently"],
        ["Facilitation Fee:", `INR ${parseFloat(String(order.amount || order.Amount || 250)).toFixed(2)}`],
        ["Transaction Ref ID:", order.paymentId || order.PaymentID || "Completed Direct"],
        ["Primary Workflow Status:", (order.status || order.Status || "Pending").toUpperCase()],
      ];

      let currY = 70;
      details.forEach(([lbl, val]) => {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        doc.text(lbl, 15, currY);

        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(String(val), 65, currY);
        
        currY += 8;
      });

      // Status Progression History Timeline Section
      if (orderHistory && orderHistory.length > 0) {
        currY += 5;
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("WORKFLOW PROGRESS TIMELINE", 15, currY);
        doc.line(15, currY + 2, 195, currY + 2);

        currY += 10;
        orderHistory.forEach((hist: any, index: number) => {
          // Point indicator
          doc.setFillColor(59, 130, 246);
          doc.circle(18, currY - 1, 1.5, "F");
          if (index < orderHistory.length - 1) {
            doc.setDrawColor(226, 232, 240);
            doc.line(18, currY, 18, currY + 12);
          }

          doc.setFont("Helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          doc.text((hist.Status || hist.status || "Pending").toUpperCase(), 24, currY);

          doc.setFont("Helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.text(hist.Timestamp ? new Date(hist.Timestamp).toLocaleString() : "", 135, currY);

          if (hist.Notes || hist.notes) {
            doc.setFont("Helvetica", "italic");
            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            doc.text(hist.Notes || hist.notes, 24, currY + 4);
          }

          currY += 12;
        });
      }

      // Add elegant footer
      doc.setFillColor(248, 250, 252);
      doc.rect(15, 260, 180, 22, "F");
      
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(7.5);
      doc.text("This is an official system-generated summary. Facilitated securely by Amit Online Services.", 20, 267);
      doc.text("If you have any questions or require revisions, kindly initiate a Live Chat with AOS Support officers.", 20, 271);

      doc.save(`AOS_Order_Summary_${order.orderId || order.ID}.pdf`);
      toast.success("Order Summary PDF downloaded successfully!");
    } catch (err: any) {
      console.error("Error generating order summary:", err);
      toast.error("Failed to generate summary PDF: " + err.message);
    }
  };

  const ordersToPrint = selectedOrderIds.length > 0
    ? filteredOrders.filter((o) => selectedOrderIds.includes(String(o.orderId || o.ID)))
    : filteredOrders;

  const handlePrintSelected = () => {
    if (selectedOrderIds.length === 0) {
      toast.error("Please select at least one order to print.");
      return;
    }

    toast.success(`Print job compiled! Dispatching ${selectedOrderIds.length} select orders to system printer... 🖨️`);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6" id="order-history-tab-panel">
      {/* PRINT-ONLY BRANDED HEADER AND STAMP */}
      <div className="hidden print:flex flex-col border-b-2 border-slate-900 pb-6 mb-8 w-full text-left">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">AMIT ONLINE SERVICES</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Official Transaction Dossier & Certified Logs Record</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Report generated for {user.email} on {new Date().toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right flex flex-col items-end">
              <span className="text-[8px] font-black uppercase text-indigo-600 tracking-wider">AOS CERTIFIED RECORD</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Scan to Verify Portal</span>
              <span className="text-[8px] font-mono text-slate-400 leading-none">ID: AOS-{(() => {
                let id = "";
                const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                for (let i = 0; i < 9; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
                return id;
              })()}</span>
            </div>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`https://www.amit.today/track?email=${user.email}`)}`} 
              alt="AOS Verification QR" 
              className="w-16 h-16 border border-slate-950 p-1 bg-white rounded-lg shrink-0" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Tab Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 md:p-8 rounded-[2rem] border border-slate-800 text-white relative overflow-hidden shadow-xl text-left print:hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Archive className="text-rose-500" size={22} />
              Comprehensive Order Archive & History
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Search, audit, and compile historic receipts from your personal digital dossier
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setTrackingModalId("");
                setShowTrackingModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
              id="track-order-modal-trigger-btn"
            >
              🎯 Track Order Live
            </button>
            <button
              onClick={fetchHistory}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black uppercase text-[10px] tracking-widest px-5 py-3 rounded-2xl transition-all shadow-sm active:scale-95 cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Refresh transaction archives from Google Sheets"
              id="refresh-history-btn"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh Feed
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredOrders.length === 0}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
              id="export-csv-receipts-btn"
            >
              <FileSpreadsheet size={15} />
              Export (CSV)
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filteredOrders.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-widest px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
              id="export-excel-receipts-btn"
            >
              <FileSpreadsheet size={15} />
              Export (Excel)
            </button>
            {selectedOrderIds.length > 0 && (
              <button
                onClick={handlePrintSelected}
                className="flex items-center gap-2 bg-indigo-650 hover:bg-indigo-750 text-white font-black uppercase text-[10px] tracking-widest px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer border border-indigo-700"
                id="print-selected-history-btn"
              >
                <Printer size={15} />
                Print Selected ({selectedOrderIds.length})
              </button>
            )}
            <button
              onClick={() => {
                toast.success("Print job compiled! Dispatching all filtered history dossier items to system printer... 🖨️");
                setTimeout(() => {
                  window.print();
                }, 150);
              }}
              disabled={filteredOrders.length === 0}
              className="flex items-center gap-2 bg-slate-850 hover:bg-slate-750 text-white font-black uppercase text-[10px] tracking-widest px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer border border-slate-700"
              id="print-history-receipts-btn"
            >
              <Printer size={15} />
              Print Dossier
            </button>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-150 dark:border-slate-800/80 shadow-sm flex flex-col gap-4 text-left print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Text Search */}
          <div className="space-y-1.5 col-span-1 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-550 block tracking-wider">
              Search by Order ID or Service Category
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: DSC Certificate, ORD-123..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-600 dark:text-white transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Status Select */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-550 block tracking-wider">
              Filter by Lifecycle Status
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-600 dark:text-slate-200 transition-all cursor-pointer shadow-sm appearance-none"
              >
                <option value="all">📁 All States (Archive)</option>
                <option value="pending">⏳ Pending/Queued</option>
                <option value="under review">🔍 Under Review</option>
                <option value="submitted">🏛️ Submitted to Gov</option>
                <option value="completed">✅ Completed & Issued</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-2">
                <Filter size={12} />
              </div>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="space-y-1.5 col-span-1">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-550 block tracking-wider">
              Sort Orders By
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  const val = e.target.value;
                  setSortBy(val);
                  if (val === "date_desc") { setSortColumn("date"); setSortDirection("desc"); }
                  else if (val === "date_asc") { setSortColumn("date"); setSortDirection("asc"); }
                  else if (val === "amount_desc") { setSortColumn("amount"); setSortDirection("desc"); }
                  else if (val === "amount_asc") { setSortColumn("amount"); setSortDirection("asc"); }
                  else if (val === "status") { setSortColumn("status"); setSortDirection("asc"); }
                  else if (val === "orderId_asc") { setSortColumn("orderId"); setSortDirection("asc"); }
                  else if (val === "service_asc") { setSortColumn("service"); setSortDirection("asc"); }
                }}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-600 dark:text-slate-200 transition-all cursor-pointer shadow-sm appearance-none"
                id="user-history-sort-select"
              >
                <option value="date_desc">📅 Date: Newest First</option>
                <option value="date_asc">📅 Date: Oldest First</option>
                <option value="amount_desc">💰 Fee: High to Low</option>
                <option value="amount_asc">💰 Fee: Low to High</option>
                <option value="status">🚦 Status Lifecycle</option>
                <option value="orderId_asc">🔢 Order ID (A-Z)</option>
                <option value="service_asc">🗂️ Service Name (A-Z)</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-2">
                <Filter size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* Date Filters Row */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-550 block tracking-wider flex items-center gap-1">
              <Calendar size={12} /> From filing date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-600 dark:text-white transition-all shadow-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-550 block tracking-wider flex items-center gap-1">
              <Calendar size={12} /> To filing date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-600 dark:text-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Selection Summary Banner */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-850 dark:text-indigo-300 p-5 rounded-[2rem] border border-indigo-150 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left print:hidden animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-600 text-white font-black text-xs px-3.5 py-1.5 rounded-full select-none shrink-0 h-8 flex items-center">
              {selectedOrderIds.length} Selected
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Compile Order Dossier</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wide">
                Selected checkout transactions are compiled into an official single printable tax audit ledger statement.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrintSelected}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest px-5 py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Printer size={14} />
              Print Selected Document
            </button>
            <button
              onClick={() => {
                setSelectedOrderIds([]);
                toast.success("Selection cleared successfully.");
              }}
              className="text-slate-550 dark:text-slate-450 hover:text-indigo-600 dark:hover:text-indigo-300 font-black uppercase text-[10px] tracking-widest px-4 py-3 transition-all cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Results Header with View Mode Switcher (Table vs Cards) and Select All option */}
      {!loading && filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2 print:hidden">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
              Showing {filteredOrders.length} Order Records
            </p>
            {/* View Mode Toggle */}
            <div className="inline-flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="Sortable Data Table"
                id="view-mode-table-btn"
              >
                <TableIcon size={12} />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                title="Card Layout"
                id="view-mode-cards-btn"
              >
                <LayoutGrid size={12} />
                <span>Cards</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-400 font-bold hidden md:inline">
              Sorted by: <strong className="text-slate-700 dark:text-slate-300 uppercase">{sortColumn}</strong> ({sortDirection === "asc" ? "Ascending ▲" : "Descending ▼"})
            </span>
            {viewMode === "table" && (
              <button
                type="button"
                onClick={handleExpandAll}
                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors tracking-widest cursor-pointer select-none inline-flex items-center gap-1"
                id="toggle-all-expand-rows-btn"
              >
                {filteredOrders.length > 0 && filteredOrders.every((o) => expandedRowIds.includes(String(o.orderId || o.ID)))
                  ? "▲ Collapse All Rows"
                  : "▼ Expand All Rows"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const allIds = filteredOrders.map((o) => String(o.orderId || o.ID));
                const allSelected = allIds.every((id) => selectedOrderIds.includes(id));
                if (allSelected) {
                  setSelectedOrderIds((prev) => prev.filter((id) => !allIds.includes(id)));
                  toast.success("Deselected all matching orders.");
                } else {
                  setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...allIds])));
                  toast.success(`Selected all ${filteredOrders.length} matching orders!`);
                }
              }}
              className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors tracking-widest cursor-pointer select-none"
              id="toggle-all-search-orders-btn"
            >
              {filteredOrders.every((o) => selectedOrderIds.includes(String(o.orderId || o.ID)))
                ? "☑ Deselect All Matching"
                : "☐ Select All Matching"}
            </button>
          </div>
        </div>
      )}

      {/* Main Results Board */}
      {loading ? (
        <div className="p-20 text-center flex flex-col items-center justify-center gap-3 print:hidden">
          <Loader2 className="text-rose-500 animate-spin" size={36} />
          <p className="text-xs font-black uppercase text-slate-404 tracking-widest">
            Synchronizing database records...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-[2rem] shadow-sm print:hidden">
          <Archive size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-pulse" />
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            No Historical Records Found
          </h4>
          <p className="text-xs text-slate-404 mt-1">
            Try resetting your filters or keying in a different search parameters.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden text-left print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="user-orders-sortable-table">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
                  <th className="py-3.5 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleExpandAll}
                      className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title={filteredOrders.length > 0 && filteredOrders.every((o) => expandedRowIds.includes(String(o.orderId || o.ID))) ? "Collapse all rows" : "Expand all rows"}
                    >
                      {filteredOrders.length > 0 && filteredOrders.every((o) => expandedRowIds.includes(String(o.orderId || o.ID))) ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && filteredOrders.every((o) => selectedOrderIds.includes(String(o.orderId || o.ID)))}
                      onChange={() => {
                        const allIds = filteredOrders.map((o) => String(o.orderId || o.ID));
                        const allSelected = allIds.every((id) => selectedOrderIds.includes(id));
                        if (allSelected) {
                          setSelectedOrderIds((prev) => prev.filter((id) => !allIds.includes(id)));
                        } else {
                          setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...allIds])));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="py-3.5 px-4 font-black">
                    <button
                      type="button"
                      onClick={() => handleSort("orderId")}
                      className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase cursor-pointer"
                    >
                      <span>Order ID</span>
                      {sortColumn === "orderId" ? (
                        sortDirection === "asc" ? <ArrowUp size={13} className="text-indigo-600 dark:text-indigo-400" /> : <ArrowDown size={13} className="text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-black">
                    <button
                      type="button"
                      onClick={() => handleSort("service")}
                      className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase cursor-pointer"
                    >
                      <span>Service / Document</span>
                      {sortColumn === "service" ? (
                        sortDirection === "asc" ? <ArrowUp size={13} className="text-indigo-600 dark:text-indigo-400" /> : <ArrowDown size={13} className="text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-black">
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase cursor-pointer"
                    >
                      <span>Filing Date</span>
                      {sortColumn === "date" ? (
                        sortDirection === "asc" ? <ArrowUp size={13} className="text-indigo-600 dark:text-indigo-400" /> : <ArrowDown size={13} className="text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-black text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("amount")}
                      className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase cursor-pointer ml-auto"
                    >
                      <span>Amount</span>
                      {sortColumn === "amount" ? (
                        sortDirection === "asc" ? <ArrowUp size={13} className="text-indigo-600 dark:text-indigo-400" /> : <ArrowDown size={13} className="text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-black">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase cursor-pointer"
                    >
                      <span>Status</span>
                      {sortColumn === "status" ? (
                        sortDirection === "asc" ? <ArrowUp size={13} className="text-indigo-600 dark:text-indigo-400" /> : <ArrowDown size={13} className="text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-black">
                    <button
                      type="button"
                      onClick={() => handleSort("paymentId")}
                      className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase cursor-pointer"
                    >
                      <span>Payment Ref</span>
                      {sortColumn === "paymentId" ? (
                        sortDirection === "asc" ? <ArrowUp size={13} className="text-indigo-600 dark:text-indigo-400" /> : <ArrowDown size={13} className="text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 text-center font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((item, idx) => {
                  const orderId = item.orderId || item.ID;
                  const idStr = String(orderId);
                  const isExpanded = expandedRowIds.includes(idStr);
                  const service = item.service || item.Type || "Digital Signature Certificate (DSC)";
                  const status = String(item.status || item.Status || "Pending");
                  const refId = item.paymentId || item.PaymentID || "Direct Checkout";
                  const amount = item.amount || item.Amount || "250";
                  const notes = item.notes || item.Notes || "";
                  const isSelected = selectedOrderIds.includes(idStr);
                  const isFocused = focusedOrderId === idStr;
                  const isUrgent = notes.startsWith("[URGENT]");
                  const uploadedDocs = extractCustomerUploadedFiles(item);
                  const statusDef = getStatusDefinition(status, statusDefinitions);
                  const serviceMeta = getServiceCatalogMeta(service, item);

                  const filingDate = (item as any).createdAt || (item as any).CreatedAt || (item as any).timestamp || (item as any).Timestamp || (item as any).date || (item as any).Date 
                    ? new Date((item as any).createdAt || (item as any).CreatedAt || (item as any).timestamp || (item as any).Timestamp || (item as any).date || (item as any).Date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })
                    : "Ongoing";

                  const filingDateFull = (item as any).createdAt || (item as any).CreatedAt || (item as any).timestamp || (item as any).Timestamp || (item as any).date || (item as any).Date 
                    ? new Date((item as any).createdAt || (item as any).CreatedAt || (item as any).timestamp || (item as any).Timestamp || (item as any).date || (item as any).Date).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      })
                    : "Standard Operational Timeline";

                  const numAmount = parseFloat(String(amount));
                  const origAmt = Number((item as any)['Original Amount'] || (item as any).OriginalAmount || (item as any).originalAmount || (item as any).billingDetails?.originalAmount || 0);
                  const discInfo = (item as any)['Discount Info'] || (item as any).DiscountInfo || (item as any).discountApplied || (item as any).billingDetails?.discountApplied || "";
                  const discVal = Number((item as any).DiscountValue || (item as any).discountValue || (item as any).billingDetails?.discountValue || 0);
                  const hasDiscount = (origAmt > numAmount && origAmt > 0) || discVal > 0 || (discInfo && discInfo !== "None" && discInfo !== "");

                  const getStatusClass = (st: string) => {
                    const s = st.toLowerCase();
                    if (s.includes("completed") || s.includes("approved")) {
                      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
                    }
                    if (s.includes("review") || s.includes("submitted")) {
                      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
                    }
                    if (s.includes("cancel") || s.includes("reject")) {
                      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
                    }
                    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
                  };

                  return (
                    <React.Fragment key={`table-group-${orderId}-${idx}`}>
                      <tr
                        onClick={() => toggleRowExpansion(orderId)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-xs ${
                          isExpanded 
                            ? "bg-indigo-50/40 dark:bg-indigo-950/30 border-l-2 border-indigo-600 dark:border-indigo-500" 
                            : isFocused 
                            ? "bg-amber-50/30 dark:bg-amber-950/20" 
                            : isSelected 
                            ? "bg-indigo-50/30 dark:bg-indigo-950/20" 
                            : ""
                        }`}
                        title="Click row to expand or collapse additional details"
                      >
                        {/* Expand / Collapse Chevron */}
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleRowExpansion(orderId)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isExpanded
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                                : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                            title={isExpanded ? "Collapse row details" : "Expand to view Service Description & Internal Notes"}
                            id={`table-row-expand-btn-${orderId}`}
                          >
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </td>

                        {/* Checkbox */}
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedOrderIds((prev) => prev.filter((id) => id !== idStr));
                              } else {
                                setSelectedOrderIds((prev) => [...prev, idStr]);
                              }
                            }}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Order ID */}
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                              #{orderId}
                            </span>
                            {isUrgent && (
                              <span className="bg-red-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded animate-pulse" title="Flagged as Urgent Query">
                                🚨 Urgent
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Service / Document */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 dark:text-white truncate" title={service}>
                              {service}
                            </p>
                            <span className="hidden sm:inline-block text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate shrink-0">
                              {serviceMeta.category.split(" ")[0]}
                            </span>
                          </div>
                          {notes && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5" title={notes}>
                              {notes}
                            </p>
                          )}
                        </td>

                        {/* Filing Date */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">
                          {filingDate}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono">
                          <div className="inline-flex flex-col items-end">
                            {hasDiscount && origAmt > numAmount && (
                              <span className="line-through text-slate-400 text-[10px]">
                                ₹{origAmt.toLocaleString()}
                              </span>
                            )}
                            <span className="font-black text-slate-900 dark:text-white">
                              ₹{numAmount.toLocaleString()}
                            </span>
                            {hasDiscount && (
                              <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400">
                                {discVal > 0 ? `Saved ₹${discVal.toLocaleString()}` : "Discount"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span 
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusClass(status)}`}
                            title={statusDef?.Meaning || statusDef?.ClientAction || status}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {status}
                          </span>
                        </td>

                        {/* Payment Ref */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {String(refId).substring(0, 14)}...
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            {/* Track Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTrackingModalId(String(orderId));
                                setShowTrackingModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                              title="Live Order Tracking"
                              id={`table-track-btn-${orderId}`}
                            >
                              <Truck size={13} />
                            </button>

                            {/* Uploaded Docs Viewer */}
                            {uploadedDocs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setLiveDocViewerState({
                                    isOpen: true,
                                    files: uploadedDocs,
                                    orderId: orderId,
                                    title: `${service} - Uploaded Documents`
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                                title={`View Customer Uploaded Files (${uploadedDocs.length})`}
                                id={`table-docs-btn-${orderId}`}
                              >
                                <Eye size={13} />
                              </button>
                            )}

                            {/* Invoice PDF */}
                            <button
                              type="button"
                              onClick={() => downloadPDFInvoice(item, user)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                              title="Download PDF Invoice"
                              id={`table-invoice-btn-${orderId}`}
                            >
                              <Download size={13} />
                            </button>

                            {/* Order Summary */}
                            <button
                              type="button"
                              onClick={() => downloadOrderSummaryPDF(item)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                              title="Download Order Summary PDF"
                              id={`table-summary-btn-${orderId}`}
                            >
                              <FileText size={13} />
                            </button>

                            {/* Urgent Tag Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleUrgent(orderId)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isUrgent 
                                  ? "bg-red-500 text-white hover:bg-red-600" 
                                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-red-500"
                              }`}
                              title={isUrgent ? "Remove Urgent Tag" : "Mark as Urgent"}
                              id={`table-urgent-btn-${orderId}`}
                            >
                              <AlertCircle size={13} />
                            </button>

                            {/* Expand / Collapse In-table Toggle */}
                            <button
                              type="button"
                              onClick={() => toggleRowExpansion(orderId)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isExpanded 
                                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300" 
                                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                              }`}
                              title={isExpanded ? "Collapse Table Row" : "Expand Row (Service Description & Notes)"}
                              id={`table-inline-expand-btn-${orderId}`}
                            >
                              <ChevronDown size={13} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                            </button>

                            {/* View Full Modal */}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              title="View Full Order Modal"
                              id={`table-details-btn-${orderId}`}
                            >
                              <Maximize2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Row */}
                      {isExpanded && (
                        <tr
                          key={`table-expanded-row-${orderId}-${idx}`}
                          className="bg-indigo-50/15 dark:bg-indigo-950/20 border-b-2 border-slate-200 dark:border-slate-800 transition-all"
                        >
                          <td colSpan={9} className="p-0">
                            <div className="p-5 sm:p-7 border-l-4 border-l-indigo-600 dark:border-l-indigo-500 bg-linear-to-b from-indigo-50/40 via-white dark:via-slate-900 to-slate-50/80 dark:to-slate-950/80 text-left space-y-5 shadow-inner">
                              {/* Top Banner */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-black">
                                    <span>Order #{orderId}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(String(orderId), "Order ID");
                                      }}
                                      className="hover:text-indigo-900 dark:hover:text-white transition-colors cursor-pointer ml-0.5"
                                      title="Copy Order ID"
                                    >
                                      {copiedId === String(orderId) ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                                    </button>
                                  </span>
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    🏷️ {serviceMeta.category}
                                  </span>
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                    ⏱️ Turnaround: {serviceMeta.sla}
                                  </span>
                                  {isUrgent && (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500 text-white animate-pulse flex items-center gap-1">
                                      🚨 Priority Flagged
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrder(item);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    <Maximize2 size={12} />
                                    <span>Full Modal</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpansion(orderId);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-2xs cursor-pointer"
                                  >
                                    <ChevronUp size={13} />
                                    <span>Collapse Details</span>
                                  </button>
                                </div>
                              </div>

                              {/* 3-Column Content */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                {/* Column 1: Service Description & Scope (5 cols) */}
                                <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                      Service Description & Scope
                                    </h4>
                                  </div>

                                  <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                                      {service}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-2 bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850">
                                      {serviceMeta.description}
                                    </p>
                                  </div>

                                  <div className="space-y-2 pt-1 text-xs">
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-slate-400 font-bold uppercase text-[10px]">Deliverable Format:</span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{serviceMeta.deliverable}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-slate-400 font-bold uppercase text-[10px]">Government Portal:</span>
                                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{serviceMeta.category}</span>
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-slate-400 font-bold uppercase text-[10px]">Filing Timestamp:</span>
                                      <span className="font-mono text-slate-700 dark:text-slate-300 text-right">{filingDateFull}</span>
                                    </div>
                                  </div>

                                  {/* Status Lifecycle Note */}
                                  <div className="mt-2 p-3 rounded-xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60">
                                    <div className="flex items-start gap-2">
                                      <Info size={14} className="text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                                      <div>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 block">
                                          Current Status: {status}
                                        </span>
                                        <p className="text-[11px] text-sky-700 dark:text-sky-300/90 leading-relaxed mt-0.5">
                                          {statusDef}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Column 2: Internal Notes & Administrative Remarks (4 cols) */}
                                <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                      <Tag size={16} className="text-amber-600 dark:text-amber-400" />
                                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                        Internal Notes & Remarks
                                      </h4>
                                    </div>
                                    {isUrgent && (
                                      <span className="bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                                        Urgent
                                      </span>
                                    )}
                                  </div>

                                  {(() => {
                                    const rawNotes = (item as any).internalNotes || (item as any).InternalNotes || item.notes || item.Notes || (item as any).adminNotes || (item as any).AdminNotes || (item as any).remarks || (item as any).Remarks || "";
                                    const cleanNotes = String(rawNotes).replace(/^\[URGENT\]\s*/i, "").trim();

                                    return (
                                      <div className="space-y-3">
                                        {isUrgent && (
                                          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl text-xs">
                                            <p className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                                              <AlertCircle size={13} className="shrink-0" />
                                              <span>Flagged as Urgent Query</span>
                                            </p>
                                            <p className="text-[11px] text-red-700 dark:text-red-300/90 mt-1">
                                              Our administrative desk has prioritized your application for same-day review and government liaison.
                                            </p>
                                          </div>
                                        )}

                                        {cleanNotes ? (
                                          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                              Officer / Internal Remarks:
                                            </span>
                                            {cleanNotes}
                                          </div>
                                        ) : (
                                          <div className="p-4 bg-slate-50/60 dark:bg-slate-950/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center py-5">
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">
                                              No internal office notes or administrative remarks recorded for this order.
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                              Application is proceeding via automated digital validation.
                                            </p>
                                          </div>
                                        )}

                                        <div className="pt-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleToggleUrgent(orderId);
                                            }}
                                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                              isUrgent
                                                ? "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/40 dark:hover:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800"
                                                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                            }`}
                                          >
                                            <AlertCircle size={14} className={isUrgent ? "text-red-600" : "text-slate-400"} />
                                            <span>{isUrgent ? "Clear Urgent Priority Flag" : "🚨 Flag as Urgent Query"}</span>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                {/* Column 3: Applicant & Payment Profile (3 cols) */}
                                <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
                                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                                    <CreditCard size={16} className="text-emerald-600 dark:text-emerald-400" />
                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                      Applicant & Payment
                                    </h4>
                                  </div>

                                  <div className="space-y-2.5 text-xs">
                                    <div>
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Applicant</span>
                                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {(item as any).customerName || (item as any).ApplicantName || (item as any).Name || (item as any).name || (user as any).name || "Registered Citizen"}
                                      </p>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Registered Email</span>
                                      <p className="font-medium text-slate-600 dark:text-slate-350 truncate font-mono text-[11px]">
                                        {(item as any).userEmail || (item as any).UserEmail || (item as any).customerEmail || (item as any).email || user.email}
                                      </p>
                                    </div>

                                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Payment Reference</span>
                                      <div className="flex items-center justify-between gap-1 mt-0.5">
                                        <span className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" title={String(refId)}>
                                          {String(refId).substring(0, 16)}...
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipboard(String(refId), "Payment Reference");
                                          }}
                                          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
                                          title="Copy Reference ID"
                                        >
                                          {copiedId === String(refId) ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                        </button>
                                      </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                                      <div className="flex justify-between items-center text-slate-500">
                                        <span className="text-[10px] uppercase font-bold">Paid Fee:</span>
                                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                                          ₹{numAmount.toLocaleString()}
                                        </span>
                                      </div>
                                      {hasDiscount && (
                                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                          <span>Benefit Applied:</span>
                                          <span>{discVal > 0 ? `Saved ₹${discVal}` : "Discount"}</span>
                                        </div>
                                      )}
                                      <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                        <CheckCircle size={10} className="text-emerald-500" />
                                        <span>Settled & Receipt Generated</span>
                                      </div>
                                    </div>

                                    {uploadedDocs.length > 0 && (
                                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                                          Uploaded Files ({uploadedDocs.length})
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLiveDocViewerState({
                                              isOpen: true,
                                              files: uploadedDocs,
                                              orderId: orderId,
                                              title: `${service} - Customer Documents`
                                            });
                                          }}
                                          className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors cursor-pointer"
                                        >
                                          <Eye size={13} />
                                          <span>View {uploadedDocs.length} Attachment{uploadedDocs.length > 1 ? "s" : ""}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Quick Action Dock inside Expanded Panel */}
                              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 dark:border-slate-800">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTrackingModalId(String(orderId));
                                      setShowTrackingModal(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer shadow-xs"
                                    id={`expanded-track-btn-${orderId}`}
                                  >
                                    <Truck size={14} />
                                    <span>Live Order Tracking</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadPDFInvoice(item, user);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition-colors cursor-pointer"
                                    id={`expanded-invoice-btn-${orderId}`}
                                  >
                                    <Download size={14} />
                                    <span>Download Tax Invoice (PDF)</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadOrderSummaryPDF(item);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs transition-colors cursor-pointer"
                                    id={`expanded-summary-btn-${orderId}`}
                                  >
                                    <FileText size={14} />
                                    <span>Order Summary Dossier (PDF)</span>
                                  </button>

                                  {uploadedDocs.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLiveDocViewerState({
                                          isOpen: true,
                                          files: uploadedDocs,
                                          orderId: orderId,
                                          title: `${service} - Uploaded Documents`
                                        });
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs transition-colors cursor-pointer"
                                      id={`expanded-docs-btn-${orderId}`}
                                    >
                                      <Eye size={14} />
                                      <span>Uploaded Documents ({uploadedDocs.length})</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpansion(orderId);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer px-2 py-1"
                                  >
                                    <span>Close Details</span>
                                    <ChevronUp size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Table summary footer */}
          <div className="bg-slate-50/90 dark:bg-slate-950/60 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <span>Showing: <strong className="text-slate-900 dark:text-white font-mono">{filteredOrders.length}</strong> orders</span>
              {selectedOrderIds.length > 0 && (
                <span>Selected: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{selectedOrderIds.length}</strong></span>
              )}
              {expandedRowIds.length > 0 && (
                <span>Expanded: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{expandedRowIds.length}</strong></span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider">Total Value:</span>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white bg-slate-200/70 dark:bg-slate-800 px-3 py-1 rounded-xl">
                ₹{filteredOrders.reduce((acc, o) => acc + (parseFloat(String(o.amount || o.Amount || 0)) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 print:hidden">
          {filteredOrders.map((item, idx) => {
            const orderId = item.orderId || item.ID;
            const service = item.service || item.Type || "Digital Signature Certificate (DSC)";
            const status = String(item.status || item.Status || "Pending");
            const refId = item.paymentId || item.PaymentID || "Direct Checkout";
            const amount = item.amount || item.Amount || "250";
            const notes = item.notes || item.Notes || "";
            
            const isCompleted = status.toLowerCase().includes("completed") || status.toLowerCase().includes("approved");
            const isCancelled = status.toLowerCase().includes("cancelled") || status.toLowerCase().includes("rejected");

            const filingDate = (item as any).createdAt || (item as any).CreatedAt || (item as any).timestamp || (item as any).Timestamp || (item as any).date || (item as any).Date 
              ? new Date((item as any).createdAt || (item as any).CreatedAt || (item as any).timestamp || (item as any).Timestamp || (item as any).date || (item as any).Date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })
              : "Ongoing";

            const isSelected = selectedOrderIds.includes(String(orderId));
            const isFocused = focusedOrderId === String(orderId);

            return (
              <div 
                key={`${orderId}-${idx}`} 
                tabIndex={0}
                onFocus={() => setFocusedOrderId(String(orderId))}
                onClick={() => setSelectedOrder(item)}
                className={`bg-white dark:bg-slate-900 border p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-all text-left outline-none cursor-pointer group/history-card ${
                  isFocused
                    ? "border-amber-500 dark:border-amber-400 ring-2 ring-amber-550/20 bg-amber-50/5 dark:bg-amber-950/5"
                    : isSelected
                    ? "border-indigo-550 dark:border-indigo-800 ring-2 ring-indigo-500/10 bg-indigo-50/5 dark:bg-indigo-950/5"
                    : notes.startsWith("[URGENT]")
                    ? "border-rose-400 dark:border-rose-900 bg-rose-50/5 dark:bg-rose-950/5"
                    : "border-slate-150 dark:border-slate-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 focus:border-amber-550"
                }`}
              >
                <div className="flex items-center shrink-0 border-r border-slate-100 dark:border-slate-800/60 pr-4 print:hidden gap-2.5 self-start md:self-auto min-h-[24px]">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => {
                      const strId = String(orderId);
                      setSelectedOrderIds((prev) =>
                        prev.includes(strId) ? prev.filter((id) => id !== strId) : [...prev, strId]
                      );
                    }}
                    className="w-4 h-4 rounded border-slate-350 dark:border-slate-700 text-indigo-600 focus:ring-indigo-550 cursor-pointer"
                    id={`select-history-order-chk-${orderId}`}
                  />
                  <span className="text-[10px] font-black uppercase text-slate-400 md:hidden">Select Order</span>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-xl text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                      ID: #{orderId}
                    </span>
                    {isFocused && (
                      <span className="text-[9px] bg-amber-550 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                        ⌨️ Focused Receipt (Ctrl+P to Print)
                      </span>
                    )}
                    <div className="relative group inline-block">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-help transition-all ${
                        isCompleted ? "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 hover:bg-green-200 animate-completed-pulse" :
                        isCancelled ? "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 hover:bg-red-200" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 hover:bg-blue-200"
                      }`}>
                        {status}
                      </span>
                      <div className="absolute z-[99] bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-slate-900 border border-slate-800 text-white text-[11px] rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 text-left">
                        <p className="font-extrabold uppercase tracking-wide text-[9px] text-rose-450 dark:text-rose-400 mb-1 flex justify-between items-center select-none">
                          <span>{status} Status Guide</span>
                          <span className="text-[7px] text-slate-400 font-mono">Definition</span>
                        </p>
                        <p className="text-slate-300 font-medium leading-relaxed">
                          {getStatusDefinition(status, statusDefinitions)}
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-r border-b border-slate-800 rotate-45 -mt-1" />
                      </div>
                    </div>

                    {/* Urgent Query Toggle Option */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const res = await axios.post("/api/orders/toggle-urgent", { orderId });
                          if (res.data.success) {
                            if (res.data.isUrgent) {
                              toast.success("Order tagged as Urgent. Admin will prioritize your query! 🚨");
                            } else {
                              toast.success("Urgent query cleared successfully.");
                            }
                            fetchHistory();
                          } else {
                            toast.error("Urgency action failed.");
                          }
                        } catch (err) {
                          toast.error("Failed to tag order as urgent.");
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 border ${
                        notes.startsWith("[URGENT]")
                          ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900 animate-pulse hover:bg-rose-200"
                          : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850"
                      }`}
                      title={notes.startsWith("[URGENT]") ? "Click to clear Urgent priority tag" : "Mark Urgent if you have a pending query / issue on this order"}
                      id={`tag-urgent-btn-${orderId}`}
                    >
                      <span>🚨</span>
                      <span>{notes.startsWith("[URGENT]") ? "Urgent Query" : "Tag Urgent"}</span>
                    </button>

                    {/* Inline Tracker Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTrackingModalId(String(orderId));
                        setShowTrackingModal(true);
                      }}
                      className="px-3 py-1 rounded-full text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      title="Track the live progress of this order"
                      id={`track-order-individual-btn-${orderId}`}
                    >
                      🎯 Track Status
                    </button>

                    {/* View Uploaded File Button (Live PDF Viewer) */}
                    {(() => {
                      const uploadedDocs = extractCustomerUploadedFiles(item);
                      if (uploadedDocs.length === 0) return null;
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLiveDocViewerState({
                              isOpen: true,
                              files: uploadedDocs,
                              orderId: orderId,
                              title: `${service} - ગ્રાહકે અપલોડ કરેલ દસ્તાવેજ`
                            });
                          }}
                          className="px-3 py-1 rounded-full text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                          title="ગ્રાહકે અપલોડ કરેલ ફાઈલ લાઇવ જુઓ (Live PDF Viewer)"
                          id={`view-order-doc-btn-${orderId}`}
                        >
                          <Eye size={12} />
                          <span>ફાઇલ જુઓ ({uploadedDocs.length})</span>
                        </button>
                      );
                    })()}
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white leading-normal uppercase group-hover/history-card:text-blue-600 dark:group-hover/history-card:text-blue-400 transition-colors">
                      {service}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                      <Clock size={12} /> Filed on: {filingDate}
                    </p>
                  </div>
                </div>

                {/* Amount / Action panel */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-4 md:pt-0 gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block">
                      FEE PAID (INR)
                    </span>
                    {(() => {
                      const numAmount = parseFloat(String(amount));
                      const origAmt = Number((item as any)['Original Amount'] || (item as any).OriginalAmount || (item as any).originalAmount || (item as any).billingDetails?.originalAmount || 0);
                      const discInfo = (item as any)['Discount Info'] || (item as any).DiscountInfo || (item as any).discountApplied || (item as any).billingDetails?.discountApplied || "";
                      const discVal = Number((item as any).DiscountValue || (item as any).discountValue || (item as any).billingDetails?.discountValue || 0);
                      const hasDiscount = (origAmt > numAmount && origAmt > 0) || discVal > 0 || (discInfo && discInfo !== "None" && discInfo !== "");

                      return (
                        <>
                          {hasDiscount && origAmt > numAmount && (
                            <span className="line-through text-slate-400 dark:text-slate-500 text-[10px] block">
                              ₹{origAmt.toLocaleString()}
                            </span>
                          )}
                          <span className="text-base font-black text-slate-950 dark:text-white font-mono">
                            ₹{numAmount.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <div className="mt-0.5">
                              <span className="inline-flex items-center text-[8px] font-black uppercase text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                {discVal > 0 ? `Saved ₹${discVal.toLocaleString()}` : (discInfo ? `${discInfo}` : "Discount")}
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">
                    Ref: {String(refId).substring(0, 16)}...
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRINT-ONLY COMPILED DOSSIER SECTION */}
      <div className="hidden print:block w-full text-left font-sans text-slate-900 mt-4">
        <div className="border-t border-slate-300 mt-2 pt-4">
          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider mb-4">
            {selectedOrderIds.length > 0 
              ? `COMPILED STATEMENT OF ${selectedOrderIds.length} SELECTED TRANSACTIONS` 
              : "COMPLETE ACCOUNT TRANSACTION DOSSIER"}
          </p>
          
          <table className="w-full text-[11px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-400 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2 pr-2 w-8">#</th>
                <th className="py-2 pr-4 w-28">Order ID</th>
                <th className="py-2">Service Description</th>
                <th className="py-2 w-28">Filing Date</th>
                <th className="py-2 w-28">Status</th>
                <th className="py-2 w-36">Payment Trans ID</th>
                <th className="py-2 text-right w-24">Fee (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ordersToPrint.map((o, index) => {
                const orderId = o.orderId || o.ID || "N/A";
                const service = o.service || o.Type || "Miscellaneous Document Service";
                const dateVal = (o as any).createdAt || (o as any).CreatedAt || (o as any).timestamp || (o as any).Timestamp || (o as any).date || (o as any).Date ? new Date((o as any).createdAt || (o as any).CreatedAt || (o as any).timestamp || (o as any).Timestamp || (o as any).date || (o as any).Date).toLocaleDateString() : "Ongoing";
                const status = o.status || o.Status || "Pending";
                const refId = o.paymentId || o.PaymentID || "Direct Checkout";
                const amount = o.amount || o.Amount || "250";

                return (
                  <tr key={`print-row-${orderId}-${index}`} className="align-top">
                    <td className="py-2.5 pr-2 font-mono font-medium">{index + 1}</td>
                    <td className="py-2.5 pr-4 font-mono font-bold">#{orderId}</td>
                    <td className="py-2.5">
                      <p className="font-bold text-slate-950 uppercase text-[10px]">{service}</p>
                      {(o.notes || o.Notes) && <p className="text-[9px] text-slate-500 italic mt-0.5">{o.notes || o.Notes}</p>}
                    </td>
                    <td className="py-2.5">{dateVal}</td>
                    <td className="py-2.5 uppercase font-bold text-slate-750 text-[9px]">{status}</td>
                    <td className="py-2.5 font-mono text-[9px] text-slate-500 break-all">{String(refId)}</td>
                    <td className="py-2.5 text-right font-mono font-bold">₹{parseFloat(String(amount)).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border-t border-slate-400 mt-6 pt-4 flex justify-between items-start">
            <div className="text-[9px] text-slate-400 italic max-w-lg leading-relaxed">
              * This printed output is a dynamically compiled transaction dossier produced automatically for the authenticated client account records. Generated securely on {new Date().toLocaleString()}.
            </div>
            <div className="text-right bg-slate-50 border border-slate-200 p-3 rounded-lg min-w-[200px]">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">GRAND TOTAL AUDITED</span>
              <span className="text-base font-black font-mono text-slate-950">
                ₹{ordersToPrint.reduce((acc, o) => acc + parseFloat(String(o.amount || o.Amount || 0)), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic interactive Live Order Tracker Modal */}
      <AnimatePresence>
        {showTrackingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur screen */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTrackingModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer animate-fade-in"
            />
            {/* Modal Body card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-4xl max-h-[85vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setShowTrackingModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-extrabold p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer select-none"
              >
                ✕ Close
              </button>
              
              <OrderTracking 
                initialOrderId={trackingModalId} 
                onClose={() => setShowTrackingModal(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Order Metadata & Service Specifics Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-2xl max-h-[85vh] overflow-y-auto text-left"
            >
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-extrabold p-2 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-all cursor-pointer select-none"
              >
                ✕
              </button>

              <div className="mb-6">
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Order Metadata Summary
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                  {selectedOrder.service || selectedOrder.Type || "Service Request"}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: #{selectedOrder.orderId || selectedOrder.ID}
                </p>
              </div>

              {/* Grid metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Filing Date</span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                    {(selectedOrder as any).createdAt || (selectedOrder as any).CreatedAt || (selectedOrder as any).timestamp || (selectedOrder as any).Timestamp || (selectedOrder as any).date || (selectedOrder as any).Date ? new Date((selectedOrder as any).createdAt || (selectedOrder as any).CreatedAt || (selectedOrder as any).timestamp || (selectedOrder as any).Timestamp || (selectedOrder as any).date || (selectedOrder as any).Date).toLocaleString() : "Recently"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Status</span>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-sky-100 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 animate-completed-pulse">
                      {selectedOrder.status || selectedOrder.Status || "Pending"}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Paid Amount</span>
                  {(() => {
                    const numAmount = parseFloat(String(selectedOrder.amount || selectedOrder.Amount || 250));
                    const origAmt = Number((selectedOrder as any)['Original Amount'] || (selectedOrder as any).OriginalAmount || (selectedOrder as any).originalAmount || (selectedOrder as any).billingDetails?.originalAmount || 0);
                    const discInfo = (selectedOrder as any)['Discount Info'] || (selectedOrder as any).DiscountInfo || (selectedOrder as any).discountApplied || (selectedOrder as any).billingDetails?.discountApplied || "";
                    const discVal = Number((selectedOrder as any).DiscountValue || (selectedOrder as any).discountValue || (selectedOrder as any).billingDetails?.discountValue || 0);
                    const hasDiscount = (origAmt > numAmount && origAmt > 0) || discVal > 0 || (discInfo && discInfo !== "None" && discInfo !== "");

                    return (
                      <div className="mt-1">
                        {hasDiscount && origAmt > numAmount && (
                          <span className="line-through text-slate-400 text-[10px] block font-mono">
                            ₹{origAmt.toLocaleString()}
                          </span>
                        )}
                        <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                          ₹{numAmount.toLocaleString()}
                        </p>
                        {hasDiscount && (
                          <span className="inline-flex items-center text-[8px] font-black uppercase text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded mt-0.5">
                            {discVal > 0 ? `Saved ₹${discVal.toLocaleString()} (${discInfo || "Discount"})` : (discInfo ? `${discInfo}` : "Special Benefit")}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Transaction ID</span>
                  <p className="text-xs font-mono font-bold text-slate-500 mt-1 truncate" title={String(selectedOrder.paymentId || selectedOrder.PaymentID)}>
                    {selectedOrder.paymentId || selectedOrder.PaymentID || "Completed Direct"}
                  </p>
                </div>
              </div>

              {selectedOrder.notes || selectedOrder.Notes ? (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Office / Admin Notes
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-350 font-bold whitespace-pre-wrap leading-relaxed">
                    {selectedOrder.notes || selectedOrder.Notes}
                  </p>
                </div>
              ) : null}

              {/* Chronological status progression timeline */}
              <div className="mb-6 p-5 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-850">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3 font-mono">
                  ⏱️ Chronological Status History Timeline
                </span>
                {loadingHistory ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-2">
                    <Loader2 size={14} className="animate-spin text-blue-600" />
                    Fetching tracking events from Order_History logs...
                  </div>
                ) : orderHistory && orderHistory.length > 0 ? (
                  <div className="space-y-4">
                    {orderHistory.map((hist, idx) => (
                      <div key={`hist-row-${idx}`} className="flex gap-3 text-left">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                          {idx < orderHistory.length - 1 && (
                            <div className="w-0.5 bg-slate-200 dark:bg-slate-800 flex-grow my-1 min-h-[16px]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                              { (hist.Status || hist.status) === "UNPAID" && (selectedOrder.paymentId || selectedOrder.PaymentID) ? "PAID" : (hist.Status || hist.status || "Update") }
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {hist.Timestamp ? new Date(hist.Timestamp).toLocaleString() : ""}
                            </span>
                          </div>
                          {(hist.Notes || hist.notes) && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed italic">
                              {hist.Notes || hist.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-bold py-2">
                    No timeline logs found for this request.
                  </p>
                )}
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex flex-wrap gap-3 mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                {(() => {
                  const modalDocs = extractCustomerUploadedFiles(selectedOrder);
                  if (modalDocs.length === 0) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        setLiveDocViewerState({
                          isOpen: true,
                          files: modalDocs,
                          orderId: selectedOrder.orderId || selectedOrder.ID,
                          title: `${selectedOrder.service || selectedOrder.Type || "Order"} - Uploaded Documents`
                        });
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5"
                    >
                      <Eye size={14} /> 📄 ગ્રાહકની ફાઇલ જુઓ ({modalDocs.length})
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => {
                    downloadPDFInvoice(selectedOrder, user);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                >
                  📄 Download Tax Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadOrderSummaryPDF(selectedOrder);
                  }}
                  className="flex-1 bg-teal-650 bg-teal-600 hover:bg-teal-700 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-center"
                >
                  📝 Download Summary
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrackingModalId(String(selectedOrder.orderId || selectedOrder.ID));
                    setSelectedOrder(null);
                    setShowTrackingModal(true);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition-all active:scale-95 cursor-pointer text-center"
                >
                  🎯 Live Progress Tracker
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full md:w-auto bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-550 dark:text-slate-450 font-black uppercase text-[10px] tracking-widest px-6 py-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live PDF & Document Viewer Modal */}
      <LivePdfDocViewerModal
        isOpen={liveDocViewerState.isOpen}
        onClose={() => setLiveDocViewerState(prev => ({ ...prev, isOpen: false }))}
        files={liveDocViewerState.files}
        orderId={liveDocViewerState.orderId}
        title={liveDocViewerState.title}
      />
    </div>
  );
}
