import React from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAppControl } from "../AppControlContext";
import { Languages, BookOpen, Volume2, MessageSquareCode, MessageCircle, Cpu, ShieldAlert, CheckCircle, HelpCircle, Clock, Sparkles, Stamp, AlertTriangle, Mic, Scale, CreditCard, HardDrive, Power } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import BlogAnalytics from "./BlogAnalytics";

interface AdminAppControlProps {
  killSwitches?: {
    orderTrackingWidget: boolean;
  };
  setKillSwitches?: React.Dispatch<React.SetStateAction<{
    orderTrackingWidget: boolean;
  }>>;
}

export const AdminAppControl: React.FC<AdminAppControlProps> = ({ killSwitches, setKillSwitches }) => {
  const {
    isDocumentServiceEnabled,
    isGovernmentServicesActive,
    isVoiceTypingEnabled,
    isAiComplaintEnabled,
    isAiLegalAgentEnabled,
    isBlogEnabled,
    isNotaryEnabled,
    whatsappNotifications,
    isMasterKillSwitchActive,
    isAiVoiceAgentEnabled,
    isRtiModuleEnabled,
    isPaymentGatewayEnabled,
    isGoogleDriveUploadEnabled,
    setDocumentServiceEnabled,
    setGovernmentServicesActive,
    setVoiceTypingEnabled,
    setAiComplaintEnabled,
    setAiLegalAgentEnabled,
    setBlogEnabled,
    setNotaryEnabled,
    setWhatsappNotifications,
    setMasterKillSwitchActive,
    setAiVoiceAgentEnabled,
    setRtiModuleEnabled,
    setPaymentGatewayEnabled,
    setGoogleDriveUploadEnabled,
  } = useAppControl();

  const [blogs, setBlogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await axios.get("/api/blogs");
        if (res.data && Array.isArray(res.data.data)) {
          setBlogs(res.data.data);
        } else if (res.data && Array.isArray(res.data)) {
          setBlogs(res.data);
        }
      } catch (err) {
        console.error("Failed to load blogs for analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    if (isBlogEnabled) {
      fetchBlogs();
    } else {
      setLoading(false);
    }
  }, [isBlogEnabled]);

  const totalViews = blogs.reduce((sum, b) => sum + (Number(b.Views) || 0), 0);
  const totalLikes = blogs.reduce((sum, b) => sum + (Number(b.Likes) || 0), 0);
  const totalShares = blogs.reduce((sum, b) => sum + (Number(b.Shares) || 0), 0);
  
  // Sort by views to get popular posts
  const sortedByViews = [...blogs].sort((a, b) => (Number(b.Views) || 0) - (Number(a.Views) || 0));
  const mostPopularPost = sortedByViews[0] ? (sortedByViews[0].Title_Gu || sortedByViews[0].Title_En) : "હાલ કોઈ પોસ્ટ ઉપલબ્ધ નથી";
  const mostPopularViews = sortedByViews[0] ? (Number(sortedByViews[0].Views) || 0) : 0;

  // Prepare chart data for top 5 blogs
  const chartData = sortedByViews.slice(0, 5).map(b => ({
    name: (b.Title_Gu || b.Title_En || b.ID).slice(0, 15) + "...",
    "વાંચકો (Views)": Number(b.Views) || 0,
    "લાઇક્સ (Likes)": Number(b.Likes) || 0,
  }));

  const trackingWidgetStatus = killSwitches ? killSwitches.orderTrackingWidget : true;

  const modules = [
    {
      id: "master-kill-switch",
      title: "🚨 Master Kill Switch (SYSTEM MAINTENANCE MODE)",
      description: "When ACTIVE, immediately places the entire application into SYSTEM MAINTENANCE MODE. Blocks new document creation, file uploads, and payments across client flows, while retaining access to view past orders.",
      icon: Power,
      status: !isMasterKillSwitchActive, // Active state means system is OPERATIONAL; toggling off enters maintenance
      isDanger: true,
      toggle: async () => {
        const nextVal = !isMasterKillSwitchActive;
        setMasterKillSwitchActive(nextVal);
        try {
          await axios.post("/api/admin/update-setting", {
            key: "APP_STATUS_MASTER_KILL",
            value: String(nextVal)
          });
        } catch (e) {
          console.error("Failed to sync APP_STATUS_MASTER_KILL to backend:", e);
        }
        if (nextVal) {
          toast.error("🚨 SYSTEM MAINTENANCE MODE ACTIVATED across entire platform!");
        } else {
          toast.success("✅ System Maintenance Mode DEACTIVATED. Platform fully operational.");
        }
      },
      badge: "Critical Master Switch",
      upcoming: false,
      statusLabel: isMasterKillSwitchActive ? "MAINTENANCE ACTIVE (LOCKED)" : "SYSTEM NORMAL (ONLINE)"
    },
    {
      id: "ai-legal-studio",
      title: "Real-Time Voice AI Legal Studio",
      description: "Interactive voice-driven legal drafter with live WYSIWYG dual-pane document synthesis, word-count dynamic pricing, and automated Drive synchronization.",
      icon: Sparkles,
      status: isAiLegalAgentEnabled,
      toggle: async () => {
        const nextVal = !isAiLegalAgentEnabled;
        setAiLegalAgentEnabled(nextVal);
        try {
          await axios.post("/api/admin/update-setting", {
            key: "APP_STATUS_AI_STUDIO",
            value: String(nextVal)
          });
        } catch (e) {
          console.error("Failed to sync APP_STATUS_AI_STUDIO to backend:", e);
        }
        toast.success(`Voice AI Legal Studio ${nextVal ? "ACTIVATED" : "DEACTIVATED"}`);
      },
      badge: "AI Core Service",
      upcoming: false,
    },
    {
      id: "ai-voice-agent",
      title: "AI Voice Agent (Microphone / Web Speech API)",
      description: "Real-time speech-to-text voice recognition and audio synthesized questions for interactive drafting in Gujarati, Hindi, and English.",
      icon: Mic,
      status: isAiVoiceAgentEnabled,
      toggle: async () => {
        const nextVal = !isAiVoiceAgentEnabled;
        setAiVoiceAgentEnabled(nextVal);
        try {
          await axios.post("/api/admin/update-setting", {
            key: "APP_STATUS_AI_VOICE",
            value: String(nextVal)
          });
        } catch (e) {
          console.error("Failed to sync APP_STATUS_AI_VOICE to backend:", e);
        }
        toast.success(`AI Voice Agent ${nextVal ? "ACTIVATED" : "DEACTIVATED (Text Mode Only)"}`);
      },
      badge: "Voice Agent Subsystem",
      upcoming: false,
    },
    {
      id: "rti-module",
      title: "RTI Application Master Module",
      description: "Specialized Right to Information Act Section 6(1) drafting workflow with auto-fill for Taluka Development Officer (TDO) and Mamlatdar offices.",
      icon: Scale,
      status: isRtiModuleEnabled,
      toggle: async () => {
        const nextVal = !isRtiModuleEnabled;
        setRtiModuleEnabled(nextVal);
        try {
          await axios.post("/api/admin/update-setting", {
            key: "APP_STATUS_RTI",
            value: String(nextVal)
          });
        } catch (e) {
          console.error("Failed to sync APP_STATUS_RTI to backend:", e);
        }
        toast.success(`RTI Module ${nextVal ? "ACTIVATED" : "DEACTIVATED"}`);
      },
      badge: "Document Module",
      upcoming: false,
    },
    {
      id: "payment-gateway",
      title: "Payment Gateway & UPI Checkout",
      description: "Controls online payment verification and automatic checkout flows for document generation. When disabled, enables direct bypass/offline payment fallback.",
      icon: CreditCard,
      status: isPaymentGatewayEnabled,
      toggle: async () => {
        const nextVal = !isPaymentGatewayEnabled;
        setPaymentGatewayEnabled(nextVal);
        try {
          await axios.post("/api/admin/update-setting", {
            key: "APP_STATUS_PAYMENT_GATEWAY",
            value: String(nextVal)
          });
        } catch (e) {
          console.error("Failed to sync APP_STATUS_PAYMENT_GATEWAY to backend:", e);
        }
        toast.success(`Payment Gateway ${nextVal ? "ACTIVATED" : "DEACTIVATED (Offline Bypass Active)"}`);
      },
      badge: "Billing Infrastructure",
      upcoming: false,
    },
    {
      id: "google-drive-sync",
      title: "Google Drive Upload & Auto-Archive",
      description: "Automated hierarchical storage sync (ORDERS/YEAR/MONTH/ORDER_ID). When disabled, documents are stored securely in local fail-safe storage and downloaded directly.",
      icon: HardDrive,
      status: isGoogleDriveUploadEnabled,
      toggle: async () => {
        const nextVal = !isGoogleDriveUploadEnabled;
        setGoogleDriveUploadEnabled(nextVal);
        try {
          await axios.post("/api/admin/update-setting", {
            key: "APP_STATUS_DRIVE_UPLOAD",
            value: String(nextVal)
          });
        } catch (e) {
          console.error("Failed to sync APP_STATUS_DRIVE_UPLOAD to backend:", e);
        }
        toast.success(`Google Drive Sync ${nextVal ? "ACTIVATED" : "DEACTIVATED (Local Safe Mode)"}`);
      },
      badge: "Cloud Storage",
      upcoming: false,
    },
    {
      id: "notary",
      title: "Central Notary Public Portal (AI Registration)",
      description: "Manage official advocate notary applications, AI OCR document verification, digital seals, and central ledger registration.",
      icon: Stamp,
      status: isNotaryEnabled,
      toggle: async () => {
        const nextVal = !isNotaryEnabled;
        setNotaryEnabled(nextVal);
        // Also update setting in Google Sheets backend
        try {
          await axios.post("/api/admin/update-setting", {
            key: "APP_STATUS_NOTARY",
            value: String(nextVal)
          });
        } catch (e) {
          console.error("Failed to sync APP_STATUS_NOTARY to backend sheet:", e);
        }
      },
      badge: "Core Service",
      upcoming: false,
    },
    {
      id: "blog",
      title: "Blog & Content System",
      description: "Manage public blogs, updates, news, and SEO-optimized contents with multi-language and funnel mapping features.",
      icon: BookOpen,
      status: isBlogEnabled,
      toggle: async () => {
        const nextVal = !isBlogEnabled;
        setBlogEnabled(nextVal);
        // Also update setting in Google Sheets backend
        try {
          await axios.post("/api/admin/update-setting", {
            key: "APP_STATUS_BLOG",
            value: String(nextVal)
          });
        } catch (e) {
          console.error("Failed to sync APP_STATUS_BLOG to backend sheet:", e);
        }
      },
      badge: "Core Service",
      upcoming: false,
    },
    {
      id: "dsc",
      title: "Document Service Center",
      description: "Professional translation and typing services (High-fidelity scanning, word verification, and dynamic pricing).",
      icon: Languages,
      status: isDocumentServiceEnabled,
      toggle: () => setDocumentServiceEnabled(!isDocumentServiceEnabled),
      badge: "Core Service",
      upcoming: false,
    },
    {
      id: "gov",
      title: "Government & Online Services",
      description: "Apply for official government schemes, forms filling, permits, and dynamic category-wise charges.",
      icon: BookOpen,
      status: isGovernmentServicesActive,
      toggle: () => setGovernmentServicesActive(!isGovernmentServicesActive),
      badge: "Services Subsystem",
      upcoming: false,
    },
    {
      id: "tracking",
      title: "એડવાન્સ ઓર્ડર ટ્રેકિંગ (Advanced Order Tracking)",
      description: "હોમ પેજ પર ગ્રાહકો માટે લાઈવ ઓર્ડર ટ્રેકિંગ વિજેટ બતાવો. (Show live order tracking widget on the home page for customers.)",
      icon: Clock,
      status: trackingWidgetStatus,
      toggle: () => {
        if (setKillSwitches) {
          setKillSwitches((prev: any) => ({
            ...prev,
            orderTrackingWidget: !prev.orderTrackingWidget
          }));
        }
      },
      badge: "User Interface Widget",
      upcoming: false,
    },
    {
      id: "voice",
      title: "Voice Typing / Translation",
      description: "Real-time speech-to-text typing and automatic translation powered by advanced voice processing.",
      icon: Volume2,
      status: isVoiceTypingEnabled,
      toggle: () => setVoiceTypingEnabled(!isVoiceTypingEnabled),
      badge: "Upcoming Smart Feature",
      upcoming: true,
    },
    {
      id: "complaint",
      title: "Executive Grievance Generator",
      description: "Assistive legal and official grievance drafter for quick standard form creations.",
      icon: MessageSquareCode,
      status: isAiComplaintEnabled,
      toggle: () => setAiComplaintEnabled(!isAiComplaintEnabled),
      badge: "Upcoming Smart Feature",
      upcoming: true,
    },
    {
      id: "whatsapp",
      title: "WhatsApp Notification Service",
      description: "Automated instant confirmation messages, status update pings, and digital receipts sent over WhatsApp API.",
      icon: MessageCircle,
      status: whatsappNotifications,
      toggle: () => {
        const next = !whatsappNotifications;
        setWhatsappNotifications(next);
        toast.success(`WhatsApp Notification Service ${next ? "ACTIVATED" : "DEACTIVATED"}`);
      },
      badge: "Realtime Messaging Service",
      upcoming: false,
      disabled: false,
      subText: "Active: Dispatches instant WhatsApp status notifications when application status updates."
    }
  ];

  return (
    <div className="space-y-8 bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-100 dark:border-slate-800" id="admin-app-control-container">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Cpu className="text-blue-600 animate-spin" size={28} /> Global System Kill Switches
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-2">
            Dynamically toggle main client modules On/Off. If toggled off, clients will see a elegant maintenance fallback screen.
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-3 max-w-sm">
          <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-400 font-semibold">
            <strong className="font-extrabold block mb-0.5">Architect Caution:</strong> 
            Disabling core modules acts instantly across all active client frames and active browser sessions.
          </div>
        </div>
      </div>

      {/* Grid of Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              className={`flex flex-col justify-between p-6 rounded-[24px] border transition-all duration-300 relative overflow-hidden group ${
                mod.status
                  ? "bg-slate-50/50 dark:bg-slate-800/40 border-blue-500/20 shadow-sm"
                  : "bg-slate-100/40 dark:bg-slate-950/25 border-slate-200 dark:border-slate-800 opacity-80"
              }`}
            >
              {mod.upcoming && (
                <div className="absolute top-0 right-0 bg-blue-100 dark:bg-blue-900/40 border-b border-l border-blue-200 dark:border-blue-800/50 px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase text-blue-600 tracking-wider">
                  Upcoming
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    mod.status 
                      ? "bg-blue-650 text-white shadow-lg shadow-blue-500/20 dark:bg-blue-600" 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-850 dark:text-white text-base">
                        {mod.title}
                      </h3>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {mod.badge}
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium mb-6">
                  {mod.description}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-auto">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
                  {mod.status ? (
                    <>
                      <CheckCircle size={14} className="text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Live & Active</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                      <span className="text-slate-500 dark:text-slate-400 ml-1.5">Offline / Maintenance Mode</span>
                    </>
                  )}
                </span>

                <button
                  onClick={mod.toggle}
                  disabled={mod.disabled}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none select-none ${
                    mod.status ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  } ${mod.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  role="switch"
                  aria-checked={mod.status}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      mod.status ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {mod.subText && (
                <div className="mt-3.5 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-normal text-left sm:text-center italic shadow-inner">
                  🎯 {mod.subText}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Blog Analytics Card (SEO & Engagement metrics) */}
      {isBlogEnabled && (
        <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-6 rounded-[24px] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-850 dark:text-white flex items-center gap-2">
                📊 બ્લોગ કન્ટેન્ટ એનાલિટિક્સ (Blog CMS Engagement Analytics)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                ગૂગલ સર્ચ એન્જિન ટ્રાફિક, આર્ટિકલ લોકપ્રિયતા અને વાંચકોની સગાઈના આંકડા.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
              <span>લાઇવ ડેટા (Live Metrics)</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-500 ml-2">એનાલિટિક્સ લોડ થઈ રહ્યું છે...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grid of Key Performance Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">કુલ માસિક મુલાકાતો (Total Monthly Views)</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-sans">
                    {totalViews.toLocaleString("gu-IN")}
                  </div>
                  <span className="text-[9px] text-green-500 font-bold block">↑ ૧૨% ગત અઠવાડિયા કરતા</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">સૌથી લોકપ્રિય લેખ (Most Popular Post)</span>
                  <div className="text-xs font-black text-blue-600 dark:text-blue-400 truncate" title={mostPopularPost}>
                    {mostPopularPost}
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold block">{mostPopularViews} મુલાકાતીઓ (Views)</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">કુલ પ્રતિક્રિયાઓ (Total Likes & Shares)</span>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-sans">
                    {(totalLikes + totalShares).toLocaleString("gu-IN")}
                  </div>
                  <span className="text-[9px] text-slate-500 font-bold block">{totalLikes} લાઇક્સ • {totalShares} શેર્સ</span>
                </div>
              </div>

              {/* Advanced Blog CMS Analytics Component */}
              <BlogAnalytics blogs={blogs} />
            </div>
          )}
        </div>
      )}

      {/* Info Warning Bar */}
      <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-4 flex items-center gap-3">
        <HelpCircle size={18} className="text-blue-500 shrink-0" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          Need custom system integrations or further sub-module kill switches? Please contact your Senior React Architect/System Admin to build dedicated routes.
        </p>
      </div>
    </div>
  );
};
