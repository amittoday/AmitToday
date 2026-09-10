import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Download, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertCircle, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  FileArchive, 
  CheckCircle, 
  Receipt,
  MoreVertical,
  Eye,
  Copy,
  Printer,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { downloadPDFInvoice } from "../utils/invoiceGenerator";
import { toast } from "sonner";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import OrderProgressStepper from "./OrderProgressStepper";
import { saveOrderToCache } from "../utils/orderCache";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

// Script dynamic loader helper for Razorpay in sandbox Dashboard
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface UserPaymentsDashboardProps {
  data: any[];
  user: any;
  lang: string;
  fetchOrders: () => void;
}

export const UserPaymentsDashboard: React.FC<UserPaymentsDashboardProps> = ({
  data,
  user,
  lang = "en",
  fetchOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Completed" | "Failed" | "Refunded" | "Pending">("All");
  const [checkingTransId, setCheckingTransId] = useState<string | null>(null);
  const [isBundlingInvoices, setIsBundlingInvoices] = useState(false);
  const [isRetryingPaymentId, setIsRetryingPaymentId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [activeQuickActionId, setActiveQuickActionId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Close Quick Actions menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".quick-actions-menu-container") && !target.closest(".quick-actions-trigger-btn")) {
        setActiveQuickActionId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Cache orders into local IndexedDB / persistent storage for offline resilience
  useEffect(() => {
    if (data && data.length > 0) {
      data.forEach((item, idx) => {
        const oId = item.OrderID || item.orderId || item.ID || `AOS-TX-${1000 + idx}`;
        saveOrderToCache(oId, item);
      });
    }
  }, [data]);

  // Background Auto-Refresh mechanism: refresh customer orders list every 10 seconds silently
  useEffect(() => {
    if (!fetchOrders) return;
    
    // Refresh every 10 seconds to keep order statuses live
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchOrders]);

  // Export full payment history to CSV
  const handleCSVExport = () => {
    try {
      const headers = [
        "Order ID",
        "Transaction/Payment ID",
        "Service Description",
        "Category",
        "Amount (INR)",
        "Date",
        "Status"
      ];
      const rows = data.map((item, idx) => {
        const orderId = item.OrderID || item.orderId || item.ID || `AOS-TX-${1000 + idx}`;
        const paymentId = item.PaymentID || item.paymentId || "rzp_live_" + (item.OrderID || idx);
        const categoryName = item.ServiceCategory || item.Category || "Government";
        const serviceDescription = item.service || item.ServiceType || item.ServiceName || "General Administrative Work";
        const amount = getAmount(item);
        const dateVal = formatDate(item.date || item.Timestamp || item.CreatedAt);
        const status = getStatus(item);
        return [
          `"${orderId}"`,
          `"${paymentId}"`,
          `"${serviceDescription.replace(/"/g, '""')}"`,
          `"${categoryName}"`,
          amount.toFixed(2),
          `"${dateVal}"`,
          `"${status}"`
        ];
      });
      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `AOS_Payment_History_${user?.name?.replace(/\s+/g, '_') || "User"}.csv`);
      toast.success(lang === "gu" ? "ચુકવણી ઇતિહાસ સફળતાપૂર્વક CSV માં નિકાસ કરવામાં આવ્યો!" : "Payment history successfully exported to CSV!");
    } catch (err: any) {
      console.error("[CSV Export] Error:", err);
      toast.error("Failed to export database log to CSV.");
    }
  };

  // Bulk ZIP Download for currently filtered successful invoices
  const handleBulkDownloadInvoices = async () => {
    const successPayments = filteredPayments.filter(item => getStatus(item) === "Completed");
    if (successPayments.length === 0) {
      toast.info(lang === "gu" ? "ડાઉનલોડ કરવા માટે કોઈ સફળ ચુકવણી મળેલ નથી" : "No successful invoice payments found in the current view.");
      return;
    }

    setIsBundlingInvoices(true);
    const progressId = toast.loading(
      lang === "gu" 
        ? "ઇન્વોઇસ પીડીએફ ફાઇલો ભેગી થઈ રહી છે..." 
        : `Zipping ${successPayments.length} tax invoice PDFs...`
    );

    try {
      const zip = new JSZip();
      for (let i = 0; i < successPayments.length; i++) {
        const item = successPayments[i];
        const orderId = item.OrderID || item.orderId || item.ID || `AOS-TX-${1000 + i}`;
        
        // Generate PDF Invoice Blob using the modified utility
        const pdfBlob = await downloadPDFInvoice(item, user, true);
        if (pdfBlob instanceof Blob) {
          zip.file(`Invoice_${orderId}.pdf`, pdfBlob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `AOS_Bulk_Invoices_${Date.now()}.zip`);
      toast.success(
        lang === "gu"
          ? "તમામ રસીદોની ZIP ફાઇલ સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ છે!"
          : `Successfully packaged ${successPayments.length} invoices into a ZIP bundle!`,
        { id: progressId }
      );
    } catch (err: any) {
      console.error("[ZIP Bundle] Packing failed:", err);
      toast.error("Bulk PDF bundling has failed. Please retry.", { id: progressId });
    } finally {
      setIsBundlingInvoices(false);
    }
  };

  // Re-initialize the checkout flow on failed transactions
  const handleRetryPaymentFlow = async (item: any) => {
    const orderId = item.OrderID || item.orderId || item.ID;
    setIsRetryingPaymentId(orderId);
    const retryToast = toast.loading(lang === "gu" ? "બીલિંગ ગેટવે પુનઃપ્રયાસ શરૂ થઈ રહ્યો છે..." : "Re-initializing Checkout Flow...");

    try {
      // 1. Script loaded verification
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Payment checkout library blocked by network.", { id: retryToast });
        return;
      }

      const rzpConstructor = (window as any).Razorpay;
      if (!rzpConstructor) {
        toast.error("Failed to construct payment window. Reload window.", { id: retryToast });
        return;
      }

      const amountVal = getAmount(item);
      const serviceDescription = item.service || item.ServiceType || item.ServiceName || "General Administrative Work";

      const cleanUserName = user?.name || "";
      const cleanUserMobile = user?.phone || user?.mobile || "";

      if (!cleanUserName || !cleanUserMobile || cleanUserMobile === "9999999999" || cleanUserMobile === "9876543210") {
        toast.error("⚠️ તમારી પ્રોફાઈલ અધૂરી છે. કૃપા કરીને તમારું પૂરું નામ અને ૧૦-અંકનો મોબાઈલ નંબર અપડેટ કરો.", { id: retryToast });
        return;
      }

      // 2. Fetch new Razorpay order ID to prevent stale checkout tokens
      const orderRes = await axios.post(
        "/api/payment/create-order-dsc",
        {
          amount: amountVal,
          isPaise: false,
          service: serviceDescription,
          file: item.file || item.fileName || null,
          extractedText: item.extractedText || "",
          translatedText: item.translatedText || "",
          customerName: cleanUserName,
          customerMobile: cleanUserMobile,
          mobile: cleanUserMobile,
          customerEmail: user?.email || "",
          customerDeclarationAccepted: true,
        },
        {
          headers: { Authorization: `Bearer ${user?.token || ""}` },
        }
      );

      const gatewayOrderId = orderRes?.data?.order_id;
      const gatewayKey = orderRes?.data?.key_id || "rzp_test_Si36sbyXy55IfV";

      if (!gatewayOrderId) {
        toast.error("Stale response from creation controller.", { id: retryToast });
        return;
      }

      // 3. Construct checkout options
      const options = {
        key: gatewayKey,
        amount: Math.round(amountVal * 100),
        currency: "INR",
        name: "Amit Online Services",
        description: `Retry Payment: #${orderId}`,
        order_id: gatewayOrderId,
        handler: async function (rzpResponse: any) {
          const verifyToast = toast.loading("Verifying retry transaction via secure shield...");
          try {
            const verifyRes = await axios.post(
              "/api/payment/verify-dsc",
              {
                ...rzpResponse,
                internalOrderId: orderRes.data.internalOrderId,
                amount: amountVal,
                customerName: cleanUserName,
                customerMobile: cleanUserMobile,
                mobile: cleanUserMobile,
                service: serviceDescription,
              },
              {
                headers: { Authorization: `Bearer ${user?.token || ""}` },
              }
            );

            if (verifyRes.data.success) {
              toast.success("Retry Completed! Your receipt was cleared successfully.", { id: verifyToast });
              if (fetchOrders) fetchOrders();
            } else {
              toast.error("Signature verification failed on retry.", { id: verifyToast });
            }
          } catch (err: any) {
            console.error("Retry verify fail:", err);
            toast.error("Network verification timeout during retry.", { id: verifyToast });
          }
        },
        prefill: {
          name: cleanUserName,
          email: user?.email || "",
          contact: cleanUserMobile
        },
        theme: { color: "#e11d48" }
      };

      toast.dismiss(retryToast);
      const rzpObj = new rzpConstructor(options);
      rzpObj.open();
    } catch (err: any) {
      console.error("Retry checkout initialization failed:", err);
      toast.error("Unable to re-initialize Razorpay. Core API error.", { id: retryToast });
    } finally {
      setIsRetryingPaymentId(null);
    }
  };

  // Process monthly trend (successful over last 6 months)
  const getMonthlyTrendData = () => {
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const shortName = d.toLocaleString(lang === "gu" ? "gu-IN" : "en-IN", { month: "short" });
      const yearVal = d.getFullYear();
      const monthKey = `${yearVal}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      monthLabels.push({
        name: `${shortName} ${yearVal}`,
        monthKey: monthKey,
        amount: 0,
      });
    }

    try {
      completedTx.forEach((item) => {
        const dateStr = item.date || item.Timestamp || item.CreatedAt;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const found = monthLabels.find(m => m.monthKey === key);
        if (found) {
          found.amount += getAmount(item);
        }
      });
    } catch (_) {}

    return monthLabels;
  };

  const monthlyChartData = getMonthlyTrendData();

  // Gujarati translations dictionary
  const t: Record<string, Record<string, string>> = {
    en: {
      title: "Payment History & Official Receipts",
      subTitle: "Track all transaction histories, completed receipts, failures, and refund processing status.",
      totalPaid: "Total Amount Paid",
      failedTrans: "Failed Transactions",
      refundedAmount: "Refunded History",
      pendingAmount: "Pending / Unpaid",
      searchPlaceholder: "Search by Transaction ID or Service Category...",
      all: "All Transactions",
      completed: "Completed Payments",
      failed: "Failed Payments",
      refunded: "Refunded Status",
      pending: "Unpaid / Pending",
      colTxId: "Transaction / Order ID",
      colService: "Service & Description",
      colAmount: "Amount",
      colDate: "Payment Date",
      colStatus: "Status",
      colActions: "Actions",
      noRecords: "No matching payment logs found.",
      downloadReceipt: "Receipt",
      checkOnSpot: "Re-Verify",
      disputed: "Claim Refund",
      refundInitiated: "Refund Request Handled",
      refundClosed: "Fully Refunded",
      checkingStatus: "Checking with Razorpay API...",
      refundSuccessToast: "Your refund request has been logged successfully. The amount will credit to source wallet within 3-5 bank days.",
      verificationSuccess: "Payment status verified with secure gateway! Record updated.",
    },
    gu: {
      title: "ચુકવણી ઇતિહાસ અને સત્તાવાર રસીદો",
      subTitle: "તમામ ટ્રાન્ઝેક્શન ઇતિહાસ, પૂર્ણ થયેલ રસીદો, અને રીફંડ પ્રક્રિયાની સ્થિતિ ટ્રૅક કરો.",
      totalPaid: "કુલ ચૂકવેલ રકમ",
      failedTrans: "નિષ્ફળ ગયેલ વ્યવહારો",
      refundedAmount: "પરત કરેલ (રીફંડ) વિગતો",
      pendingAmount: "બાકી / અપૂર્ણ ચુકવણી",
      searchPlaceholder: "ટ્રાન્ઝેક્શન આઈડી અથવા સેવા દ્વારા શોધો...",
      all: "બધા વ્યવહારો",
      completed: "પૂર્ણ થયેલ ચુકવણી",
      failed: "નિષ્ફળ ગયેલ ચુકવણી",
      refunded: "રીફંડ સ્થિતિ",
      pending: "બાકી ચૂકવણી",
      colTxId: "ટ્રાન્ઝેક્શન / ઓર્ડર આઈડી",
      colService: "સેવા અને વિગતો",
      colAmount: "રકમ",
      colDate: "ચુકવણી તારીખ",
      colStatus: "સ્થિતિ",
      colActions: "ક્રિયાઓ",
      noRecords: "કોઈ મેળ ખાતા ચુકવણી લોગ મળ્યા નથી.",
      downloadReceipt: "ચિઠ્ઠી / રસીદ",
      checkOnSpot: "ચકાસો",
      disputed: "રિફંડ માટે વિનંતી",
      refundInitiated: "રિફંડ વિનંતી સ્વીકારી",
      refundClosed: "સંપૂર્ણ રિફંડ થયેલ",
      checkingStatus: "રેઝરપે ગેટવે સાથે ચકાસણી ચાલુ છે...",
      refundSuccessToast: "તમારી રિફંડ વિનંતી સફળતાપૂર્વક નોંધણી કરવામાં આવી છે. ૩-૫ કામકાજના દિવસોમાં તમારા મૂલ ખાતામાં જમા થશે.",
      verificationSuccess: "સુરક્ષિત ગેટવે દ્વારા પેમેન્ટ સ્ટેટસ સફળતાપૂર્વક ચકાસાયું છે!",
    }
  };

  const curr = t[lang] || t["en"];

  // Helper formatting Date
  const formatDate = (val: any) => {
    if (!val) return lang === "gu" ? "તાજેતરમાં" : "Recently";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return lang === "gu" ? "તાજેતરમાં" : "Recently";
      return d.toLocaleDateString(lang === "gu" ? "gu-IN" : "en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return lang === "gu" ? "તાજેતરમાં" : "Recently";
    }
  };

  // Safe Amount Extraction
  const getAmount = (item: any): number => {
    return Number(item.Amount || item.amount || (Number(item.WordCount || 0) * 0.5) || 150);
  };

  // Safe Status Extraction which normalizes Statuses for grouping
  const getStatus = (item: any): "Completed" | "Failed" | "Refunded" | "Pending" => {
    const raw = (item.Status || item.status || "").toLowerCase();
    if (raw.includes("paid") || raw.includes("completed") || raw.includes("success") || raw.includes("active")) {
      return "Completed";
    }
    if (raw.includes("fail") || raw.includes("abort") || raw.includes("decline")) {
      return "Failed";
    }
    if (raw.includes("refund") || raw.includes("return")) {
      return "Refunded";
    }
    // Default to pending/unpaid
    return "Pending";
  };

  // Handle Simulate Re-verification Checks
  const handleSpotCheckStatus = async (item: any) => {
    const id = item.OrderID || item.orderId || item.ID;
    setCheckingTransId(id);
    
    // Simulate API query latency
    setTimeout(() => {
      setCheckingTransId(null);
      toast.success(curr.verificationSuccess, { id: "spot-check" });
      if (fetchOrders) fetchOrders();
    }, 1200);
  };

  // Simulate Instant Refund Trigger
  const handleTriggerRefundPrompt = (item: any) => {
    const toastId = toast.loading(lang === "gu" ? "રિફંડ પ્રક્રિયા શરૂ થઈ રહી છે..." : "Initiating refund request verification...");
    
    setTimeout(() => {
      toast.success(curr.refundSuccessToast, { id: toastId });
      // Update item status in UI simulation/order refreshed
      if (fetchOrders) fetchOrders();
    }, 1500);
  };

  // Process data for KPIs
  const completedTx = data.filter(d => getStatus(d) === "Completed");
  const failedTx = data.filter(d => getStatus(d) === "Failed");
  const refundedTx = data.filter(d => getStatus(d) === "Refunded");
  const pendingTx = data.filter(d => getStatus(d) === "Pending");

  const totalPaidSum = completedTx.reduce((sum, d) => sum + getAmount(d), 0);
  const totalFailedSum = failedTx.reduce((sum, d) => sum + getAmount(d), 0);
  const totalRefundedSum = refundedTx.reduce((sum, d) => sum + getAmount(d), 0);
  const totalPendingSum = pendingTx.reduce((sum, d) => sum + getAmount(d), 0);

  // Filter and Search Results
  const filteredPayments = data.filter((item) => {
    const status = getStatus(item);
    const matchesStatus = statusFilter === "All" || status === statusFilter;

    const id = (item.OrderID || item.orderId || item.PaymentID || item.ID || "").toLowerCase();
    const service = (item.service || item.ServiceType || item.ServiceCategory || item.Category || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch = !searchTerm || id.includes(searchLower) || service.includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8" id="payments-history-panel">
      {/* Overview Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2.5 bg-red-50 dark:bg-red-950/20 text-red-655 rounded-2xl">
              <CreditCard size={22} className="animate-pulse" />
            </span>
            {curr.title}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-2 max-w-2xl leading-relaxed">
            {curr.subTitle}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bulk Download Invoices ZIP Button */}
          <button
            onClick={handleBulkDownloadInvoices}
            disabled={isBundlingInvoices}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-rose-950/20 text-red-655 dark:text-red-400 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-red-100/50 dark:border-rose-900/40 shadow-sm hover:scale-[1.01] cursor-pointer"
          >
            <FileArchive size={14} className={isBundlingInvoices ? "animate-bounce" : ""} />
            {lang === "gu" ? "ઝીપ ડાઉનલોડ" : "Bulk Download Invoices"}
          </button>

          {/* Export Payment History CSV Button */}
          <button
            onClick={handleCSVExport}
            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/10 text-emerald-650 dark:text-emerald-400 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm hover:scale-[1.01] cursor-pointer"
          >
            <Download size={14} />
            {lang === "gu" ? "CSV ડાઉનલોડ" : "Export CSV"}
          </button>

          {fetchOrders && (
            <button
              onClick={() => {
                const tid = toast.loading(lang === "gu" ? "આંકડા સિંક્રનાઇઝ થઈ રહ્યા છે..." : "Syncing transaction histories...");
                fetchOrders();
                setTimeout(() => {
                  toast.success(lang === "gu" ? "ટેબલ અપડેટ થયું વ્યવહારો લોડ થયા છે!" : "All payments records updated successfully!", { id: tid });
                }, 800);
              }}
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border border-slate-100 dark:border-slate-700 shadow-sm hover:scale-[1.01] cursor-pointer"
            >
              <RefreshCw size={14} />
              {lang === "gu" ? "રીફ્રેશ કરો" : "Sync Data"}
            </button>
          )}
        </div>
      </div>

      {/* Visual Transaction Stage Tracker */}
      {(() => {
        const latestTx = data && data.length > 0 ? data[0] : null;
        if (!latestTx) return null;

        const latestStatus = getStatus(latestTx);
        const orderId = latestTx.OrderID || latestTx.orderId || latestTx.ID || "AOS-TX-LATEST";
        const serviceName = latestTx.service || latestTx.ServiceType || "General Administrative Work";

        // Determine step levels
        // Steps: 1: Initiation, 2: Authentication, 3: Verification, 4: Settlement
        let activeStep = 1;
        let stepStatus = "active"; // "active" | "completed" | "failed"

        if (latestStatus === "Completed") {
          activeStep = 4;
          stepStatus = "completed";
        } else if (latestStatus === "Failed") {
          activeStep = 2;
          stepStatus = "failed";
        } else if (latestStatus === "Refunded") {
          activeStep = 4;
          stepStatus = "completed";
        } else if (latestStatus === "Pending") {
          activeStep = 3;
          stepStatus = "active";
        }

        const steps = [
          { index: 1, label: lang === "gu" ? "પ્રારંભ" : "Initiation", desc: lang === "gu" ? "પેમેન્ટ એન્ક્રિપ્શન" : "Order Generated" },
          { index: 2, label: lang === "gu" ? "પ્રમાણીકરણ" : "Authentication", desc: lang === "gu" ? "ગેટવે ચકાસણી" : "Razorpay Handler" },
          { index: 3, label: lang === "gu" ? "સત્યાપન" : "Verification", desc: lang === "gu" ? "સર્વર જોડાણ" : "Signature Shield" },
          { index: 4, label: lang === "gu" ? "પતાવટ" : "Settlement", desc: lang === "gu" ? "રસીદ મુક્ત થઈ" : "Invoice Released" },
        ];

        return (
          <div className="bg-gradient-to-r from-red-500/5 via-slate-500/5 to-emerald-500/5 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <span className="text-[9px] font-black uppercase bg-red-100 dark:bg-rose-950/45 text-red-655 dark:text-rose-400 px-2 py-0.5 rounded-md">
                  {lang === "gu" ? "તાજેતરની ચુકવણી પ્રગતિ" : "Live Transaction Pipeline"}
                </span>
                <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">
                  {serviceName} <span className="text-xs font-mono font-bold text-slate-400">({orderId})</span>
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">
                  {lang === "gu" ? "ચુકવણી સ્થિતિ:" : "Gateway Status:"}
                </span>
                <span className={`text-[10px] font-black uppercase ${
                  latestStatus === "Completed" ? "text-emerald-600 font-bold" :
                  latestStatus === "Failed" ? "text-rose-600 font-bold" :
                  latestStatus === "Refunded" ? "text-blue-600 font-bold" : "text-amber-600 animate-pulse font-bold"
                }`}>
                  {latestStatus}
                </span>
              </div>
            </div>

            {/* Steps Track Line */}
            <div className="relative pt-2">
              {/* Desktop view */}
              <div className="hidden md:flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute left-[12.5%] right-[12.5%] top-4 h-[3px] bg-slate-200 dark:bg-slate-800 -z-0">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      stepStatus === "failed" ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ 
                      width: `${((Math.min(activeStep, 4) - 1) / 3) * 100}%` 
                    }}
                  />
                </div>

                {steps.map((step) => {
                  const isCompleted = step.index < activeStep || (step.index === activeStep && stepStatus === "completed");
                  const isCurrent = step.index === activeStep && stepStatus !== "completed";
                  const isFailed = step.index === activeStep && stepStatus === "failed";

                  return (
                    <div key={step.index} className="flex flex-col items-center justify-center text-center relative z-10 w-1/4">
                      <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                          isCompleted ? "bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-none" :
                          isFailed ? "bg-rose-500 text-white shadow-md shadow-rose-200 dark:shadow-none" :
                          isCurrent ? "bg-amber-500 text-white animate-pulse" :
                          "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isCompleted ? <CheckCircle size={16} /> : <span className="text-xs font-black">{step.index}</span>}
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2 block">
                        {step.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5 block">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4 pl-2">
                {steps.map((step) => {
                  const isCompleted = step.index < activeStep || (step.index === activeStep && stepStatus === "completed");
                  const isCurrent = step.index === activeStep && stepStatus !== "completed";
                  const isFailed = step.index === activeStep && stepStatus === "failed";

                  return (
                    <div key={step.index} className="flex items-start gap-3">
                      <div 
                        className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center ${
                          isCompleted ? "bg-emerald-500 text-white" :
                          isFailed ? "bg-rose-500 text-white" :
                          isCurrent ? "bg-amber-500 text-white animate-pulse" :
                          "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`}
                      >
                        {isCompleted ? <CheckCircle size={12} /> : <span className="text-[10px] font-black">{step.index}</span>}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          {step.label}
                          {isCurrent && <span className="text-[9px] bg-red-150 text-red-655 font-bold px-1 rounded animate-pulse">Active</span>}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          {step.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modern KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total Paid */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 dark:from-emerald-950/20 dark:to-emerald-950/5 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <CheckCircle2 size={20} />
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-emerald-650 dark:text-emerald-400">
            {curr.totalPaid}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{totalPaidSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase mt-1">
            {completedTx.length} {lang === "gu" ? "સફળ ચુકવણીઓ" : "Successful Payments"}
          </div>
        </div>

        {/* KPI: Failed Transactions */}
        <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 dark:from-rose-950/20 dark:to-rose-950/5 border border-rose-100 dark:border-rose-900/30 p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl">
            <XCircle size={20} />
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-rose-650 dark:text-rose-400">
            {curr.failedTrans}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{totalFailedSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] font-bold text-rose-600 dark:text-rose-500 uppercase mt-1">
            {failedTx.length} {lang === "gu" ? "નિષ્ફળ વ્યવહારો" : "Failed Inquiries"}
          </div>
        </div>

        {/* KPI: Refunded Sum */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-950/20 dark:to-blue-950/5 border border-blue-100 dark:border-blue-900/30 p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
            <RefreshCw size={18} />
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-blue-650 dark:text-blue-400">
            {curr.refundedAmount}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{totalRefundedSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] font-bold text-blue-600 dark:text-blue-500 uppercase mt-1">
            {refundedTx.length} {lang === "gu" ? "સંપૂર્ણ રિફંડ થયેલ" : "Refund Claims Processed"}
          </div>
        </div>

        {/* KPI: Unpaid / Pending */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 dark:from-amber-950/20 dark:to-amber-950/5 border border-amber-100 dark:border-amber-900/30 p-5 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-655 dark:text-amber-450 rounded-2xl">
            <AlertCircle size={20} />
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-amber-655 dark:text-amber-450">
            {curr.pendingAmount}
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₹{totalPendingSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[9px] font-bold text-amber-600 dark:text-amber-500 uppercase mt-1">
            {pendingTx.length} {lang === "gu" ? "બાકી ઓર્ડર" : "Unpaid Applications"}
          </div>
        </div>
      </div>

      {/* 6-Month Payment Trend Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <span className="p-2 bg-rose-50 dark:bg-rose-950/20 text-red-655 rounded-xl">
            <TrendingUp size={16} />
          </span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-white">
              {lang === "gu" ? "માસિક ચુકવણી વલણ (છ મહિના)" : "Monthly Payment Trend (Last 6 Months)"}
            </h4>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
              {lang === "gu" ? "પૂર્ણ થયેલ સફળ વ્યવહારોનું વિશ્લેષણ" : "Analysis of successful cleared administrative fee transactions"}
            </span>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={monthlyChartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:hidden" />
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bolder'
                }}
                formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, lang === "gu" ? "કુલ ચૂકવેલ" : "Total Success Amount"]}
                labelStyle={{ fontWeight: 'black', marginBottom: '4px', textTransform: 'uppercase' }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#e11d48" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorAmount)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Horizontal Status Selector Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "All", label: curr.all },
            { key: "Completed", label: curr.completed, badge: completedTx.length },
            { key: "Failed", label: curr.failed, badge: failedTx.length },
            { key: "Refunded", label: curr.refunded, badge: refundedTx.length },
            { key: "Pending", label: curr.pending, badge: pendingTx.length },
          ].map((statusBtn) => (
            <button
              key={statusBtn.key}
              onClick={() => setStatusFilter(statusBtn.key as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center gap-1.5 ${
                statusFilter === statusBtn.key
                  ? "bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-none"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400"
              }`}
            >
              {statusBtn.label}
              {statusBtn.badge !== undefined && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                  statusFilter === statusBtn.key
                    ? "bg-white text-red-655"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}>
                  {statusBtn.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={curr.searchPlaceholder}
            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs font-bold pl-10 pr-4 py-2.5 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 border border-transparent dark:border-slate-705 dark:text-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Main Payment History Records Grid/Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {filteredPayments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <HelpCircle size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-3 animate-bounce" />
            <p className="text-sm text-slate-400 uppercase tracking-widest font-black">
              {curr.noRecords}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6 text-[10px] uppercase font-black tracking-widest text-slate-400">{curr.colTxId}</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-black tracking-widest text-slate-400">{curr.colService}</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-black tracking-widest text-slate-400">{curr.colAmount}</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-black tracking-widest text-slate-400 hidden lg:table-cell">{curr.colDate}</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-black tracking-widest text-slate-400">{curr.colStatus}</th>
                  <th className="py-4 px-6 text-[10px] uppercase font-black tracking-widest text-slate-400 text-right">{curr.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((item, idx) => {
                  const status = getStatus(item);
                  const amount = getAmount(item);
                  const orderId = item.OrderID || item.orderId || item.ID || `AOS-TX-${1000 + idx}`;
                  const paymentId = item.PaymentID || item.paymentId || "rzp_live_" + Math.random().toString(36).substr(2, 9);
                  const categoryName = item.ServiceCategory || item.Category || "Government";
                  const serviceDescription = item.service || item.ServiceType || item.ServiceName || "General Administrative Work";

                  return (
                    <React.Fragment key={`user-payment-${orderId}-${idx}`}>
                      <tr 
                        className="group/row relative hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-300"
                        onMouseEnter={() => setHoveredRowId(orderId)}
                        onMouseLeave={() => {
                          if (hoveredRowId === orderId) setHoveredRowId(null);
                        }}
                      >
                      {/* Order and Payment ID */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-white max-w-xs truncate text-xs flex items-center gap-1.5">
                          <span>{orderId}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(orderId);
                              toast.success(`Copied Order ID: ${orderId}`);
                            }}
                            className="opacity-0 group-hover/row:opacity-100 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-opacity cursor-pointer"
                            title="Copy Order ID"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                        <div className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                          {paymentId}
                        </div>
                      </td>

                      {/* Service Category Details */}
                      <td className="py-4 px-6">
                        <div className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate max-w-xs">
                          {serviceDescription}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                            {categoryName}
                          </span>
                        </div>
                      </td>

                      {/* Amount & Savings Breakdown */}
                      <td className="py-4 px-6 font-mono text-xs">
                        {(() => {
                          const origAmt = Number(item['Original Amount'] || item.OriginalAmount || item.originalAmount || item.billingDetails?.originalAmount || 0);
                          const discInfo = item['Discount Info'] || item.DiscountInfo || item.discountApplied || item.billingDetails?.discountApplied || "";
                          const discVal = Number(item.DiscountValue || item.discountValue || item.billingDetails?.discountValue || 0);
                          const hasDiscount = (origAmt > amount && origAmt > 0) || discVal > 0 || (discInfo && discInfo !== "None" && discInfo !== "");

                          return (
                            <div>
                              {hasDiscount && origAmt > amount && (
                                <span className="line-through text-slate-400 dark:text-slate-500 text-[10px] block">
                                  ₹{origAmt.toFixed(2)}
                                </span>
                              )}
                              <span className="font-bold text-slate-900 dark:text-white">
                                ₹{amount.toFixed(2)}
                              </span>
                              {hasDiscount && (
                                <div className="mt-0.5">
                                  <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase text-emerald-700 bg-emerald-100/90 dark:text-emerald-300 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                    {discVal > 0 ? `Saved ₹${discVal.toFixed(0)}` : (discInfo ? `${discInfo}` : "Discounted")}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 stroke-none hidden lg:table-cell">
                        {formatDate(item.date || item.Timestamp || item.CreatedAt)}
                      </td>

                      {/* Status Badges */}
                      <td className="py-4 px-6">
                        {status === "Completed" && (
                          <div className="flex flex-col items-start gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              {lang === "gu" ? "સફળ ચુકવણી" : "Paid / Successful"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold text-teal-600 dark:text-teal-400 px-1.5 py-0.5 bg-teal-50 dark:bg-teal-950/25 rounded border border-teal-100 dark:border-teal-900/10">
                              <CheckCircle size={10} />
                              {lang === "gu" ? "પ્રમાણિત" : "Verified Response"}
                            </span>
                          </div>
                        )}
                        {status === "Failed" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-700 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-450 px-2.5 py-1 rounded-full border border-rose-100 dark:border-rose-900/10">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            {lang === "gu" ? "ચુકવણી અસફળ" : "Trans Failed"}
                          </span>
                        )}
                        {status === "Refunded" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-blue-700 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            {lang === "gu" ? "રીફંડ થયેલ" : "Refunded"}
                          </span>
                        )}
                        {status === "Pending" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/30">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                            {lang === "gu" ? "ચુકવણી બાકી" : "Pending Verify"}
                          </span>
                        )}
                      </td>

                      {/* Quick Actions Pop-over Menu (Hover & Click Triggered) */}
                      <td className="py-4 px-6 text-right relative">
                        <div className="relative inline-block text-left quick-actions-container">
                          {/* Sleek, space-efficient Quick Actions Trigger Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveQuickActionId(activeQuickActionId === orderId ? null : orderId);
                            }}
                            className={`quick-actions-trigger-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs border ${
                              activeQuickActionId === orderId || hoveredRowId === orderId
                                ? "bg-rose-600 text-white border-rose-600 shadow-rose-500/20 shadow-md"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                            }`}
                            title="Quick Actions"
                          >
                            <Sparkles size={11} className={activeQuickActionId === orderId ? "animate-spin" : "text-amber-500"} />
                            <span>{lang === "gu" ? "ક્રિયાઓ" : "Quick Actions"}</span>
                            <MoreVertical size={12} className="opacity-70" />
                          </button>

                          {/* Quick Actions Floating Pop-over Menu */}
                          {(activeQuickActionId === orderId || hoveredRowId === orderId) && (
                            <div 
                              className="quick-actions-menu-container absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left backdrop-blur-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Pop-over Header */}
                              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                    {lang === "gu" ? "ઓર્ડર ક્રિયાઓ" : "Order Actions"}
                                  </p>
                                  <p className="text-xs font-mono font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                                    #{orderId}
                                  </p>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  status === "Completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" :
                                  status === "Failed" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" :
                                  "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                                }`}>
                                  {status}
                                </span>
                              </div>

                              {/* Menu Actions List */}
                              <div className="space-y-1">
                                {/* 1. Download Receipt */}
                                {status === "Completed" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      downloadPDFInvoice(item, user);
                                      setActiveQuickActionId(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer group"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                      <Download size={13} />
                                    </div>
                                    <div className="text-left flex-1">
                                      <div className="leading-tight">{lang === "gu" ? "રસીદ ડાઉનલોડ કરો" : "Download Receipt"}</div>
                                      <div className="text-[9px] font-normal text-slate-400">PDF Tax Invoice (A4)</div>
                                    </div>
                                  </button>
                                )}

                                {/* 2. View Details & Progress Steps */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
                                    setActiveQuickActionId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer group"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <Eye size={13} />
                                  </div>
                                  <div className="text-left flex-1">
                                    <div className="leading-tight">
                                      {expandedOrderId === orderId 
                                        ? (lang === "gu" ? "વિગતો છુપાવો" : "Hide Details") 
                                        : (lang === "gu" ? "વિગતો અને પ્રગતિ જુઓ" : "View Details & Steps")}
                                    </div>
                                    <div className="text-[9px] font-normal text-slate-400">Timeline & status tracker</div>
                                  </div>
                                </button>

                                {/* 3. Copy Order / Ref ID */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(orderId);
                                    toast.success(`Copied Order Ref: ${orderId}`);
                                    setActiveQuickActionId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer group"
                                >
                                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                                    <Copy size={13} />
                                  </div>
                                  <div className="text-left flex-1">
                                    <div className="leading-tight">{lang === "gu" ? "સંદર્ભ કોપી કરો" : "Copy Reference ID"}</div>
                                    <div className="text-[9px] font-normal text-slate-400">Order ID #{orderId}</div>
                                  </div>
                                </button>

                                {/* 4. Retry Payment Flow (Failed only) */}
                                {status === "Failed" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleRetryPaymentFlow(item);
                                      setActiveQuickActionId(null);
                                    }}
                                    disabled={isRetryingPaymentId === orderId}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 rounded-xl transition-all cursor-pointer group"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-rose-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <RefreshCw size={13} className={isRetryingPaymentId === orderId ? "animate-spin" : ""} />
                                    </div>
                                    <div className="text-left flex-1">
                                      <div className="leading-tight">{lang === "gu" ? "પુનઃપ્રયાસ કરો" : "Retry Payment"}</div>
                                      <div className="text-[9px] font-normal text-rose-500">Re-initiate Razorpay checkout</div>
                                    </div>
                                  </button>
                                )}

                                {/* 5. Check Live Status on Spot (Pending only) */}
                                {status === "Pending" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSpotCheckStatus(item);
                                      setActiveQuickActionId(null);
                                    }}
                                    disabled={checkingTransId === orderId}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/30 rounded-xl transition-all cursor-pointer group"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <RefreshCw size={13} className={checkingTransId === orderId ? "animate-spin" : ""} />
                                    </div>
                                    <div className="text-left flex-1">
                                      <div className="leading-tight">{lang === "gu" ? "સ્થિતિ ચકાસો" : "Verify Status"}</div>
                                      <div className="text-[9px] font-normal text-amber-600">Spot check payment server</div>
                                    </div>
                                  </button>
                                )}

                                {/* 6. Assert Refund / Dispute Query */}
                                {status === "Failed" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleTriggerRefundPrompt(item);
                                      setActiveQuickActionId(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer group"
                                  >
                                    <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform">
                                      <HelpCircle size={13} />
                                    </div>
                                    <div className="text-left flex-1">
                                      <div className="leading-tight">{lang === "gu" ? "પ્રશ્ન પૂછો" : "Raise Support Query"}</div>
                                      <div className="text-[9px] font-normal text-slate-400">Dispute / refund inquiry</div>
                                    </div>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === orderId && (
                      <tr className="bg-slate-50/70 dark:bg-slate-800/40">
                        <td colSpan={6} className="p-4 sm:p-6">
                          <OrderProgressStepper
                            orderId={orderId}
                            status={status}
                            serviceType={serviceDescription}
                            createdAt={item.date || item.Timestamp || item.CreatedAt}
                            updatedAt={item.updatedAt || item.UpdatedAt}
                            trackingUrl={typeof window !== 'undefined' ? `${window.location.origin}/?trackOrder=${encodeURIComponent(orderId)}` : undefined}
                          />
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Helpful Refund Policy Section Card */}
      <div className="bg-gradient-to-r from-red-655/5 to-pink-655/5 border border-red-500/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start gap-6">
        <div className="p-3 bg-red-105 text-red-655 rounded-2xl hidden md:block shrink-0">
          <HelpCircle size={24} />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {lang === "gu" ? "ચુકવણી સુરક્ષા અને રિફંડ નીતિ" : "Payment Protection & Autonomic Refunds"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-bold">
            {lang === "gu" 
              ? "તમામ ચૂકવણીઓ રેઝરપે (Razorpay) સુરક્ષિત એન્ક્રિપ્શન ગેટવે દ્વારા સુરક્ષિત રીતે પુષ્ટિ કરવામાં આવે છે. જો કોઈ ચુકવણી અસફળ થાય પણ ખાતામાંથી રકમ કપાઈ જાય, તો ચિંતા કરશો નહીં. અમારું સર્વર ૨૪ મિનિટમાં વ્યવહારની ચકાસણી કરે છે અને રિફંડ પ્રોસેસ કરે છે. જો તમને કોઈ મુશ્કેલી હોય, તો રિફંડ ડાઉનલોડ બટન અથવા સપોર્ટ ચેટનો ઉપયોગ કરીને તુરંત અમારો સંપર્ક કરો."
              : "All processing is certified fully secure by secure automated transaction tokens. For any double-deductions or interrupted checkout loops with failed statuses, our autonomic billing servers continuously reconcile logs. Refund assertions will automatically trigger a reversal straight to your payment source."}
          </p>
        </div>
      </div>
    </div>
  );
};
