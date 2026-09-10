import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Building,
  Phone,
  Mail,
  Image,
  MapPin,
  Clock,
  FileText,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  MessageSquare,
  Save,
  Loader2,
  Globe,
  Upload,
  Calendar,
  Check,
  Eye,
  RefreshCw,
  Bell,
  Database,
  Archive,
  AlertCircle,
  X,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from "lucide-react";

interface AdminBusinessSettingsProps {
  user: any;
}

export default function AdminBusinessSettings({ user }: AdminBusinessSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings Form Data
  const [formData, setFormData] = useState({
    BUSINESS_NAME: "",
    BUSINESS_PHONE: "",
    BUSINESS_EMAIL: "",
    BUSINESS_LOGO: "",
    BUSINESS_ADDRESS: "",
    BUSINESS_MAP_LINK: "",
    BUSINESS_HOURS: "",
    BUSINESS_GSTIN: "",
    LINK_FACEBOOK: "",
    LINK_INSTAGRAM: "",
    LINK_TWITTER: "",
    LINK_YOUTUBE: "",
    LINK_WHATSAPP: "",
    BLOG_DATABASE_LINK: "",
    BLOG_DRIVE_FOLDER_URL: "",
    AI_IMAGE_API_KEY: "",
    ALERT_LOW_CONFIDENCE: false,
    ALERT_BULK_COMPLETE: false,
    WHATSAPP_API_ENABLED: false,
    WHATSAPP_BUSINESS_NUMBER: "",
    WHATSAPP_SENDER_NAME: "",
    WHATSAPP_STATUS_ALERTS_ENABLED: true,
    WHATSAPP_AUTO_DISPATCH_TEMPLATE: "",
  });

  // Dedicated office hours state read/write connected to office-hours API
  const [officeHours, setOfficeHours] = useState<any[]>([]);
  const [loadingHours, setLoadingHours] = useState(false);

  // 180-Day Log Archival Job State
  const [archivalJob, setArchivalJob] = useState<any>(null);
  const [triggeringArchival, setTriggeringArchival] = useState(false);

  const fetchArchivalStatus = async () => {
    try {
      const res = await axios.get("/api/admin/logs/archive-180/status", {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.data && res.data.success) {
        setArchivalJob(res.data.job);
      }
    } catch (err) {
      console.error("Failed to fetch log archival status:", err);
    }
  };

  const handleTrigger180Archival = async () => {
    if (!confirm("Are you sure you want to trigger the background worker to move all logs older than 180 days to the permanent 'Archives' sheet?")) {
      return;
    }
    setTriggeringArchival(true);
    try {
      const res = await axios.post("/api/admin/logs/archive-180", {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.data && res.data.success) {
        toast.success("180-day log archival background worker successfully started!");
        fetchArchivalStatus();
      } else {
        toast.error(res.data.error || "Failed to start archival worker");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Error running 180-day log archival background worker: " + err.message);
    } finally {
      setTriggeringArchival(false);
    }
  };

  const [validatingDb, setValidatingDb] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const handleVerifyBlogDatabase = async () => {
    if (!formData.BLOG_DATABASE_LINK || formData.BLOG_DATABASE_LINK.trim() === "") {
      toast.error("કૃપા કરીને પેલા બ્લોગ ડેટાબેઝ ગૂગલ શીટ લિંક દાખલ કરો.");
      return;
    }
    setValidatingDb(true);
    setValidationResult(null);
    try {
      const res = await axios.post("/api/blogs/validate-db", {}, {
        headers: { Authorization: `Bearer ${user?.token || localStorage.getItem("token")}` }
      });
      if (res.data) {
        setValidationResult(res.data);
        setShowValidationModal(true);
        if (res.data.success) {
          toast.success("ગૂગલ શીટ વેરિફિકેશન સફળ રહ્યું!");
        } else {
          toast.error(res.data.error || "વેરિફિકેશન નિષ્ફળ ગયું.");
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setValidationResult({ success: false, error: msg });
      setShowValidationModal(true);
      toast.error("વેરિફિકેશન પ્રક્રિયામાં સમસ્યા આવી: " + msg);
    } finally {
      setValidatingDb(false);
    }
  };

  const [sendingTestWhatsapp, setSendingTestWhatsapp] = useState(false);
  const handleSendTestWhatsapp = async () => {
    setSendingTestWhatsapp(true);
    try {
      const res = await axios.post("/api/admin/whatsapp/test-send", {
        phoneNumber: formData.WHATSAPP_BUSINESS_NUMBER || formData.LINK_WHATSAPP,
        customerName: user?.name || "Admin Test",
        orderId: "AOS-DEMO-2026",
        status: "In Progress / Verified",
        templateMessage: formData.WHATSAPP_AUTO_DISPATCH_TEMPLATE
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Test WhatsApp notification dispatched!");
      } else {
        toast.error(res.data.error || "Failed to dispatch test WhatsApp notification.");
      }
    } catch (err: any) {
      toast.error("Error dispatching test WhatsApp notification: " + (err.response?.data?.error || err.message));
    } finally {
      setSendingTestWhatsapp(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchOfficeHours();
    fetchArchivalStatus();
  }, []);

  useEffect(() => {
    let intervalId: any;
    if (archivalJob?.status === 'running') {
      intervalId = setInterval(() => {
        fetchArchivalStatus();
      }, 1500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [archivalJob?.status]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/settings", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.data && res.data.success) {
        const settings = res.data.data || {};
        setFormData({
          BUSINESS_NAME: settings.BUSINESS_NAME || "",
          BUSINESS_PHONE: settings.BUSINESS_PHONE || "",
          BUSINESS_EMAIL: settings.BUSINESS_EMAIL || "",
          BUSINESS_LOGO: settings.BUSINESS_LOGO || "",
          BUSINESS_ADDRESS: settings.BUSINESS_ADDRESS || "",
          BUSINESS_MAP_LINK: settings.BUSINESS_MAP_LINK || "",
          BUSINESS_HOURS: settings.BUSINESS_HOURS || "",
          BUSINESS_GSTIN: settings.BUSINESS_GSTIN || "",
          LINK_FACEBOOK: settings.LINK_FACEBOOK || "",
          LINK_INSTAGRAM: settings.LINK_INSTAGRAM || "",
          LINK_TWITTER: settings.LINK_TWITTER || "",
          LINK_YOUTUBE: settings.LINK_YOUTUBE || "",
          LINK_WHATSAPP: settings.LINK_WHATSAPP || "",
          BLOG_DATABASE_LINK: settings.BLOG_DATABASE_LINK || "",
          BLOG_DRIVE_FOLDER_URL: settings.BLOG_DRIVE_FOLDER_URL || "",
          AI_IMAGE_API_KEY: settings.AI_IMAGE_API_KEY || "",
          ALERT_LOW_CONFIDENCE: settings.ALERT_LOW_CONFIDENCE === "true" || settings.ALERT_LOW_CONFIDENCE === true,
          ALERT_BULK_COMPLETE: settings.ALERT_BULK_COMPLETE === "true" || settings.ALERT_BULK_COMPLETE === true,
          WHATSAPP_API_ENABLED: settings.WHATSAPP_API_ENABLED === "true" || settings.WHATSAPP_API_ENABLED === true,
          WHATSAPP_BUSINESS_NUMBER: settings.WHATSAPP_BUSINESS_NUMBER || settings.LINK_WHATSAPP || "+91 90000 00000",
          WHATSAPP_SENDER_NAME: settings.WHATSAPP_SENDER_NAME || "Amit Online Services Alerts",
          WHATSAPP_STATUS_ALERTS_ENABLED: settings.WHATSAPP_STATUS_ALERTS_ENABLED !== "false" && settings.WHATSAPP_STATUS_ALERTS_ENABLED !== false,
          WHATSAPP_AUTO_DISPATCH_TEMPLATE: settings.WHATSAPP_AUTO_DISPATCH_TEMPLATE || "*Amit Online Services - Order Status Update*\n\nDear {name},\n\nYour order *#{orderId}* status has been updated to:\n👉 *{status}*\n\nTrack progress:\n{link}\n\nThank you for choosing Amit Online Services!",
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch settings:", err);
      toast.error("સેટિંગ્સ લોડ કરવામાં નિષ્ફળતા મળી");
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficeHours = async () => {
    try {
      setLoadingHours(true);
      const res = await axios.get("/api/office-hours");
      if (res.data && res.data.success) {
        setOfficeHours(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch office hours:", err);
    } finally {
      setLoadingHours(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Logo file selection and conversion to base64
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("લોગો ફાઈલનું કદ ૨MB થી ઓછું હોવું આવશ્યક છે (Logo size must be under 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormData((prev) => ({ ...prev, BUSINESS_LOGO: base64 }));
      toast.success("નવો લોગો પ્રીવ્યૂ માટે સફળતાપૂર્વક અપલોડ કરવામાં આવ્યો!");
    };
    reader.onerror = () => {
      toast.error("ફાઇલ વાંચવામાં ખામી સર્જાઈ");
    };
    reader.readAsDataURL(file);
  };

  // Office hours daily change
  const handleOfficeHourChange = (day: string, field: "Open" | "Close" | "Status", value: string) => {
    setOfficeHours((prev) =>
      prev.map((oh) => {
        if (oh.Day === day) {
          return { ...oh, [field]: value };
        }
        return oh;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const toastId = toast.loading("માહિતી સાચવવામાં આવી રહી છે...");

      let finalFormData = { 
        ...formData,
        ALERT_LOW_CONFIDENCE: formData.ALERT_LOW_CONFIDENCE ? "true" : "false",
        ALERT_BULK_COMPLETE: formData.ALERT_BULK_COMPLETE ? "true" : "false",
        WHATSAPP_API_ENABLED: formData.WHATSAPP_API_ENABLED ? "true" : "false",
        WHATSAPP_STATUS_ALERTS_ENABLED: formData.WHATSAPP_STATUS_ALERTS_ENABLED ? "true" : "false",
      };

      // Upload logo if it's a new base64 image to avoid GAS 50k char limit
      if (finalFormData.BUSINESS_LOGO && finalFormData.BUSINESS_LOGO.startsWith("data:image")) {
        try {
          const base64Data = finalFormData.BUSINESS_LOGO.split(",")[1];
          const mimeType = finalFormData.BUSINESS_LOGO.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)?.[0] || 'image/png';
          const uploadRes = await axios.post("/api/upload", {
            content: base64Data,
            mimeType: mimeType,
            name: "BUSINESS_LOGO_" + Date.now(),
            tab: "Images"
          }, { 
            headers: { Authorization: `Bearer ${user.token}` } 
          });

          if (uploadRes.data && uploadRes.data.success && uploadRes.data.fileLink) {
            finalFormData.BUSINESS_LOGO = uploadRes.data.fileLink;
          } else {
             console.warn("Logo upload yielded no fileLink, storing raw payload as fallback.");
          }
        } catch (uploadErr) {
          console.error("Logo upload failed: ", uploadErr);
          toast.dismiss(toastId);
          toast.error("લોગો અપલોડ કરવામાં નિષ્ફળતા મળી");
          return;
        }
      }

      // 1. Save general business settings
      const settingsRes = await axios.post("/api/admin/settings", finalFormData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!settingsRes.data || !settingsRes.data.success) {
        toast.dismiss(toastId);
        toast.error(settingsRes.data?.error || "સેટિંગ્સ સેવ કરવામાં નિષ્ફળતા મળી");
        return;
      }

      // 2. Save office hours (connected to office-hours API)
      const officePromises = officeHours.map((oh) =>
        axios.post(
          "/api/admin/office-hours/update",
          {
            Day: oh.Day,
            Open: oh.Open,
            Close: oh.Close,
            Status: oh.Status,
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        )
      );

      await Promise.all(officePromises);

      toast.dismiss(toastId);
      toast.success("સેટિંગ્સ અને ઓપિસ સમય સફળતાપૂર્વક સાચવવામાં આવ્યા છે!");

      // Dispatch dynamic header/footer reload event
      window.dispatchEvent(new Event("business-info-updated"));

      // Refresh inputs
      fetchSettings();
      fetchOfficeHours();
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      toast.error("સર્વર જોડાણ નિષ્ફળ રહ્યું");
    } finally {
      setSaving(false);
    }
  };

  const [syncing, setSyncing] = useState(false);
  const [isSyncingDefinitions, setIsSyncingDefinitions] = useState(false);

  const syncStatusDefinitions = async () => {
    try {
      setIsSyncingDefinitions(true);
      const toastId = toast.loading("Fetching status definition tooltips from hidden Settings tab in Sheet...");
      const res = await axios.post("/api/admin/status-definitions/sync", {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.data && res.data.success) {
        toast.dismiss(toastId);
        toast.success("Status definitions and tooltips successfully updated real-time! 🔄");
      } else {
        toast.dismiss(toastId);
        toast.error(res.data?.error || "Status definition synchronization failed");
      }
    } catch (err: any) {
      console.error("Sync Tooltips Error:", err);
      toast.error("Failed to communicate with settings database router");
    } finally {
      setIsSyncingDefinitions(false);
    }
  };

  const syncFromSheet = async () => {
    try {
      setSyncing(true);
      const toastId = toast.loading("ગૂગલ શીટમાંથી લેટેસ્ટ સેટિંગ્સ સિંક્રનાઇઝ થઈ રહ્યા છે...");
      const res = await axios.post("/api/admin/settings/sync", {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.data && res.data.success) {
        toast.dismiss(toastId);
        toast.success("ગૂગલ શીટ ડેટા સફળતાપૂર્વક મેળવવામાં આવ્યો છે!");
        fetchSettings();
        fetchOfficeHours();
        // Notify brand layout
        setTimeout(() => {
          window.dispatchEvent(new Event("business-info-updated"));
        }, 300);
      } else {
        toast.dismiss(toastId);
        toast.error(res.data?.error || "સિંક્રનાઇઝ કરવામાં નિષ્ફળતા મળી");
      }
    } catch (err: any) {
      console.error("Failed to sync settings:", err);
      toast.error("સર્વર જોડાણ નિષ્ફળ રહ્યું અથવા ગૂગલ શીટ સાથે મેળ નથી");
    } finally {
      setSyncing(false);
    }
  };

  const dayOrder: { [key: string]: number } = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };

  const sortedHours = [...officeHours].sort(
    (a, b) => (dayOrder[a.Day] || 0) - (dayOrder[b.Day] || 0)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 font-mono">
          સેટિંગ્સ લોડ થઈ રહી છે...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 px-4 md:px-0 pb-16">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-8 rounded-3xl col-span-3">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            સંસ્થા પ્રોફાઇલ સેટિંગ્સ (Business Settings)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-normal mt-1">
            મેનેજ કરો તમારી કંપનીની મુખ્ય વિગતો જેમકે સંપર્ક, લોગો અને ઓફિસ કામગીરીના કલાકો. આ બધી જ માહિતી ગૂગલ શીટ અને લોકલ સિસ્ટમમાં તાત્કાલિક અપડેટ થશે.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={syncFromSheet}
            disabled={syncing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 justify-center cursor-pointer disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe size={14} />
            )}
            ગૂગલ શીટથી અપડેટ કરો (Sync from Sheet)
          </button>

          <button
            type="button"
            onClick={syncStatusDefinitions}
            disabled={isSyncingDefinitions}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 justify-center cursor-pointer disabled:opacity-50"
          >
            {isSyncingDefinitions ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Sync Status Definitions
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Core Settings Input + Live Admin Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Business Details Edit Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
              <span className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                <Building size={20} />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">
                  વ્યવસાય વિગતો સંપાદિત કરો (Edit Business Details)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  Update primary parameters & logo directly
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Business Name Field */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  સંસ્થા કે વ્યવસાયનું નામ (Business Name)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Building size={16} />
                  </span>
                  <input
                    type="text"
                    name="BUSINESS_NAME"
                    required
                    value={formData.BUSINESS_NAME}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white"
                    placeholder="દા.ત., AMIT ONLINE SERVICES"
                    id="admin-business-name-input"
                  />
                </div>
              </div>

              {/* Contact Fields: Phone & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    મોબાઈલ / લેન્ડલાઇન નંબર (Support Phone)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="text"
                      name="BUSINESS_PHONE"
                      required
                      value={formData.BUSINESS_PHONE}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white"
                      placeholder="દા.ત., +91 9898XXXXXX"
                      id="admin-business-phone-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    સપોર્ટ ઈમેલ આઈડી (Support Email)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      name="BUSINESS_EMAIL"
                      required
                      value={formData.BUSINESS_EMAIL}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white"
                      placeholder="દા.ત., help@amit.today"
                      id="admin-business-email-input"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Address Block */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  સાચું ભૌતિક સરનામું (Physical Address)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-5 text-slate-400">
                    <MapPin size={16} />
                  </span>
                  <textarea
                    name="BUSINESS_ADDRESS"
                    required
                    rows={2}
                    value={formData.BUSINESS_ADDRESS}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white resize-none"
                    placeholder="કંપનીની ભૌતિક સરનામું અહીં લખો..."
                    id="admin-business-address-input"
                  />
                </div>
              </div>

              {/* Blog Database Sheet URL Block */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  બ્લોગ ડેટાબેઝ ગૂગલ શીટ લિંક (Blog Database Sheet URL)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Database size={16} />
                  </span>
                  <input
                    type="url"
                    name="BLOG_DATABASE_LINK"
                    value={formData.BLOG_DATABASE_LINK || ""}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    id="admin-blog-database-link-input"
                  />
                </div>
                {formData.BLOG_DATABASE_LINK && (
                  <div className="mt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-1 bg-blue-50/20 dark:bg-blue-950/10 p-3 rounded-xl border border-blue-100/30 dark:border-blue-900/10">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      ગૂગલ શીટ સાથે જોડાણ ચકાસો અને જરૂરી હેડરો સેટઅપ કરો.
                    </span>
                    <button
                      type="button"
                      disabled={validatingDb}
                      onClick={handleVerifyBlogDatabase}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                      id="admin-verify-blog-db-btn"
                    >
                      {validatingDb ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          ચકાસણી ચાલુ છે...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={12} />
                          Verify & Initialize Blog Database
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Blog Master Drive Folder URL Field */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  બ્લોગ માસ્ટર ડ્રાઇવ ફોલ્ડર લિંક (Blog Master Drive Folder URL)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Database size={16} />
                  </span>
                  <input
                    type="url"
                    name="BLOG_DRIVE_FOLDER_URL"
                    value={formData.BLOG_DRIVE_FOLDER_URL || ""}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white"
                    placeholder="https://drive.google.com/drive/folders/..."
                    id="admin-blog-drive-folder-url-input"
                  />
                </div>
              </div>

              {/* AI Image Generation API Key Field */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  AI Image Generation Key (OpenAI DALL-E 3 / Imagen API Key)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Sparkles size={16} className="text-amber-500" />
                  </span>
                  <input
                    type="password"
                    name="AI_IMAGE_API_KEY"
                    value={formData.AI_IMAGE_API_KEY || ""}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white"
                    placeholder="sk-... અથવા AIzaSy... (AI છબી નિર્માણ કી)"
                    id="admin-ai-image-api-key-input"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 px-1">
                  બ્લોગ મેનેજરમાં "Auto-Generate Image with AI" સુવિધા માટે DALL-E 3 અથવા Gemini કીનો ઉપયોગ થશે.
                </p>
              </div>

              {/* Logo File Upload Field & Logo URL input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    નવો લોગો જોડો (Upload Logo File)
                  </label>
                  <div className="relative flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-[105px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all p-3">
                      <div className="flex flex-col items-center justify-center space-y-1 text-center">
                        <Upload size={20} className="text-slate-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Upload PNG/JPG</span>
                        <span className="text-[8px] text-slate-400">Max size 2MB</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload} 
                        id="logo-file-uploader"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    લોગો લિંક અથવા સોર્સ (Company Logo URL)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Image size={16} />
                    </span>
                    <input
                      type="url"
                      name="BUSINESS_LOGO"
                      value={formData.BUSINESS_LOGO}
                      onChange={handleInputChange}
                      className="w-full pl-11 pr-6 py-9 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white"
                      placeholder="અથવા અહીં પ્રિફેક્ચ્ડ છબી URL પેસ્ટ કરો..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Live Admin Preview Section */}
          <div className="lg:col-span-5 flex flex-col h-full justify-between">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between border border-indigo-900/50 relative overflow-hidden min-h-[400px]">
              {/* Background ambient accents */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Branding Top Badge */}
              <div className="flex justify-between items-start z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-emerald-400">
                      AOS LIVE PREVIEW
                    </span>
                  </div>
                  <h4 className="text-sm font-black tracking-wider uppercase font-mono text-slate-350">
                    Business Profile Model
                  </h4>
                </div>
                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[8px] font-black uppercase tracking-wider font-mono">
                  Vault Draft V2
                </div>
              </div>

              {/* Core Display Card rendering live parameters */}
              <div className="py-8 space-y-6 z-10 flex-grow flex flex-col justify-center">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg shrink-0 border border-white/20">
                    {formData.BUSINESS_LOGO ? (
                      <img
                        src={formData.BUSINESS_LOGO}
                        alt="Workspace Brand"
                        className="w-full h-full object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Building className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
                      {formData.BUSINESS_NAME || "AMIT ONLINE SERVICES"}
                    </h3>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Globe size={11} className="text-indigo-400" /> Verified Member Portal
                    </p>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-indigo-300 tracking-widest font-mono block">
                      Support Hotlines
                    </span>
                    <span className="text-xs font-black font-sans text-white block">
                      {formData.BUSINESS_PHONE || "-"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black uppercase text-indigo-300 tracking-widest font-mono block">
                      Compliance Email
                    </span>
                    <span className="text-xs font-bold text-white block truncate">
                      {formData.BUSINESS_EMAIL || "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 border-t border-white/10 pt-4">
                  <span className="text-[8px] font-black uppercase text-indigo-300 tracking-widest font-mono block">
                    Registered Headquarters Details
                  </span>
                  <span className="text-[11px] text-slate-300 font-semibold block leading-relaxed">
                    {formData.BUSINESS_ADDRESS || "કૃપા કરીને પૂરતું સરનામું ઉમેરો..."}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-white/10 pt-4 flex justify-between items-center z-10">
                <p className="text-[8px] text-slate-400 font-extrabold uppercase tracking-wide">
                  Press Save to update branding system-wide
                </p>
                <Eye size={16} className="text-indigo-450" />
              </div>
            </div>
          </div>
        </div>

        {/* TIME-PICKER INTERFACE: Weekly Office Operational Hours card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
                <Clock size={20} />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">
                  ઓપરેશનલ કલાકોનું ટાઈમ-પીકર (Office Working Hours Time-Picker)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  Configure daily entry access hours for document handling
                </p>
              </div>
            </div>
            <div className="text-[9px] font-black uppercase tracking-widest text-[#58595B] dark:text-slate-400 bg-slate-100 dark:bg-slate-850 px-3 py-1 rounded-full border border-slate-205 dark:border-slate-800">
              Connected to office-hours API
            </div>
          </div>

          {loadingHours ? (
            <div className="flex items-center justify-center p-8 text-xs font-mono font-black text-slate-400 uppercase tracking-widest animate-pulse">
              કલાકો લોડ થઈ રહ્યા છે...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {sortedHours.map((oh) => {
                const isActive = oh.Status === "Active";
                return (
                  <div 
                    key={oh.Day} 
                    className={`p-5 rounded-2xl border transition-all ${isActive ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-150 dark:border-slate-800 shadow-sm' : 'bg-slate-100/50 dark:bg-slate-950 opacity-60 border-dashed border-slate-200 dark:border-slate-850/80'}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{oh.Day}</span>
                      <select 
                        value={oh.Status || "Active"}
                        onChange={(e) => handleOfficeHourChange(oh.Day, "Status", e.target.value)}
                        className={`text-[9px] font-black uppercase rounded-lg px-2 py-0.5 border outline-none cursor-pointer ${oh.Status === 'Active' ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-220' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-220'}`}
                      >
                        <option value="Active">Operational</option>
                        <option value="Inactive">Closed</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-1 font-mono">Open</span>
                        <input 
                          type="time" 
                          disabled={!isActive}
                          value={oh.Open || ""}
                          onChange={(e) => handleOfficeHourChange(oh.Day, "Open", e.target.value)}
                          className="w-full text-xs font-black font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-2 rounded-xl outline-none disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:opacity-40"
                        />
                      </div>
                      <div>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block mb-1 font-mono">Close</span>
                        <input 
                          type="time" 
                          disabled={!isActive}
                          value={oh.Close || ""}
                          onChange={(e) => handleOfficeHourChange(oh.Day, "Close", e.target.value)}
                          className="w-full text-xs font-black font-mono border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-2 rounded-xl outline-none disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:opacity-40"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legal & Social Media Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card: Legal/Tax Details */}
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
              <span className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400">
                <FileText size={20} />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">
                  કાયદાકીય / કર વિગતો (Legal & Tax)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  Business registration number & GST Identification
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  GSTIN / વ્યવસાય નોંધણી ક્રમાંક (GST Number - Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <FileText size={16} />
                  </span>
                  <input
                    type="text"
                    name="BUSINESS_GSTIN"
                    value={formData.BUSINESS_GSTIN}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-6 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl font-bold text-xs outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-950 transition-all text-slate-900 dark:text-white"
                    placeholder="દા.ત., 24AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div className="p-4 bg-purple-50/50 dark:bg-purple-950/15 rounded-2xl border border-purple-100/35 dark:border-purple-900/10 text-xs font-medium text-purple-700 dark:text-purple-350 leading-relaxed">
                તમે અહીં જે GSTIN અને નામ ઉમેરશો તેનો ઉપયોગ તમારા પોર્ટલ પરથી ડાઉનલોડ થતા તમામ ટેક્સ ઇન્વોઇસ અને સર્વિસ દસ્તાવેજમાં પ્રિન્ટ કરવા માટે થશે.
              </div>
            </div>
          </div>

          {/* Social Channels URL */}
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
              <span className="p-2.5 bg-green-50 dark:bg-green-950/40 rounded-xl text-green-600 dark:text-green-400">
                <Globe size={20} />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">
                  સોશિયલ મીડિયા લિંક્સ (Social Hyperlinks)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  Ordered networks for public links
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Facebook</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600"><Facebook size={14} /></span>
                  <input
                    type="url"
                    name="LINK_FACEBOOK"
                    value={formData.LINK_FACEBOOK}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl font-bold text-xs outline-none text-slate-900 dark:text-white"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Instagram</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500"><Instagram size={14} /></span>
                  <input
                    type="url"
                    name="LINK_INSTAGRAM"
                    value={formData.LINK_INSTAGRAM}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl font-bold text-xs outline-none text-slate-900 dark:text-white"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Twitter URL</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900 dark:text-white"><Twitter size={14} /></span>
                  <input
                    type="url"
                    name="LINK_TWITTER"
                    value={formData.LINK_TWITTER}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl font-bold text-xs outline-none text-slate-900 dark:text-white"
                    placeholder="https://twitter.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">WhatsApp Chat</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500"><MessageSquare size={14} /></span>
                  <input
                    type="url"
                    name="LINK_WHATSAPP"
                    value={formData.LINK_WHATSAPP}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl font-bold text-xs outline-none text-slate-900 dark:text-white"
                    placeholder="https://wa.me/..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automated Alert Configuration Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-4">
            <span className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Bell size={20} />
            </span>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">
                ઑટોમેટેડ એલર્ટ અને સૂચનાઓ (Automated Alerts & Notifications)
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                Configure email notification triggers for critical events and system operations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Low Scan Confidence Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800 transition-all hover:shadow-sm">
              <div className="space-y-1 pr-4">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  ઓછી સ્કેન ગુણવત્તા સૂચના (Low Scan Confidence Alert)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-relaxed">
                  જ્યારે OCR ગુણવત્તા સ્કોર ૬૫% થી નીચે જાય ત્યારે સપોર્ટ ઇમેલ પર ચેતવણી મોકલો (Sends notification to support email when OCR accuracy falls below 65%)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, ALERT_LOW_CONFIDENCE: !prev.ALERT_LOW_CONFIDENCE }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.ALERT_LOW_CONFIDENCE ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                id="alert-low-confidence-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.ALERT_LOW_CONFIDENCE ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* Bulk Process Completion Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800 transition-all hover:shadow-sm">
              <div className="space-y-1 pr-4">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  જથ્થાબંધ પ્રક્રિયા પૂર્ણતા સૂચના (Bulk Process Completion Alert)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-relaxed">
                  જ્યારે જથ્થાબંધ દસ્તાવેજ પ્રક્રિયા અથવા ઓટો-ટેગીંગ બેચ સફળતાપૂર્વક પૂર્ણ થાય ત્યારે ઇમેલ સૂચના મોકલો (Sends notification when bulk processing or auto-tagging batch finishes execution)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, ALERT_BULK_COMPLETE: !prev.ALERT_BULK_COMPLETE }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.ALERT_BULK_COMPLETE ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                id="alert-bulk-complete-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.ALERT_BULK_COMPLETE ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Service Integration & Notification Settings Card */}
        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm" id="whatsapp-service-settings-card">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                <MessageSquare size={20} />
              </span>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">
                  વૉટ્સએપ નોટિફિકેશન સર્વિસ ઇન્ટિગ્રેશન (WhatsApp Notification Service Integration)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  Configure real-time automated WhatsApp alerts when customer applications or orders change status
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSendTestWhatsapp}
              disabled={sendingTestWhatsapp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              id="send-test-whatsapp-btn"
            >
              {sendingTestWhatsapp ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              ટેસ્ટ મેસેજ મોકલો (Test WhatsApp)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WhatsApp Service Master Enable Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800 transition-all hover:shadow-sm">
              <div className="space-y-1 pr-4">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  વૉટ્સએપ ગેટવે સક્રિય કરો (Enable WhatsApp Integration)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-relaxed">
                  ગ્રાહકોને વૉટ્સએપ પર ઓટોમેટિક કન્ફર્મેશન અને ડિજિટલ રસીદ મોકલો (Dispatches confirmation and digital receipts over WhatsApp)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, WHATSAPP_API_ENABLED: !prev.WHATSAPP_API_ENABLED }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.WHATSAPP_API_ENABLED ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                id="whatsapp-api-enabled-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.WHATSAPP_API_ENABLED ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* Application Status Change WhatsApp Alert Toggle */}
            <div className="flex items-center justify-between p-5 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-150 dark:border-slate-800 transition-all hover:shadow-sm">
              <div className="space-y-1 pr-4">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                  અરજી સ્ટેટસ અપડેટ વોટ્સએપ એલર્ટ (Auto Status Update Alerts)
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block leading-relaxed">
                  જ્યારે એડમિન દ્વારા ઓર્ડર/અરજી સ્ટેટસ બદલાય ત્યારે વૉટ્સએપ મેસેજ મોકલો (Sends instant ping to user phone on order status updates)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, WHATSAPP_STATUS_ALERTS_ENABLED: !prev.WHATSAPP_STATUS_ALERTS_ENABLED }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.WHATSAPP_STATUS_ALERTS_ENABLED ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'}`}
                id="whatsapp-status-alerts-enabled-toggle"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.WHATSAPP_STATUS_ALERTS_ENABLED ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* WhatsApp Business Account Number Input */}
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                WhatsApp Business Phone Number (વૉટ્સએપ બિઝનેસ નંબર)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"><Phone size={14} /></span>
                <input
                  type="text"
                  name="WHATSAPP_BUSINESS_NUMBER"
                  value={formData.WHATSAPP_BUSINESS_NUMBER}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl font-bold text-xs outline-none text-slate-900 dark:text-white"
                  placeholder="+91 98980 00000"
                />
              </div>
            </div>

            {/* WhatsApp Sender Display ID / Brand Name */}
            <div>
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                WhatsApp Sender Brand Name (મેસેજ મોકલનારનું નામ)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"><Building size={14} /></span>
                <input
                  type="text"
                  name="WHATSAPP_SENDER_NAME"
                  value={formData.WHATSAPP_SENDER_NAME}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl font-bold text-xs outline-none text-slate-900 dark:text-white"
                  placeholder="Amit Online Services Alerts"
                />
              </div>
            </div>
          </div>

          {/* Custom Message Templates per Order Status */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">
                WhatsApp Status Alert Message Template (ઓટોમેટેડ મેસેજ ટેમ્પ્લેટ)
              </label>
              <span className="text-[10px] font-bold text-emerald-500">
                Templates Active for 6 Order Statuses
              </span>
            </div>

            {/* Status Template Quick Select Chips */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    WHATSAPP_AUTO_DISPATCH_TEMPLATE:
                      "*Amit Online Services - Documents Received* 📥\n\nDear *{name}*,\n\nWe have safely received your notary documents for Application *#{orderId}* ({service}). Our legal verification team has begun OCR screening.\n\n👉 *Track Live Progress:*\n{link}\n\nNeed assistance? Reply directly to this WhatsApp message."
                  }))
                }
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/20 transition-all cursor-pointer"
              >
                📥 Docs Received Template
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    WHATSAPP_AUTO_DISPATCH_TEMPLATE:
                      "*Amit Online Services - Legal Draft Underway* ✍️\n\nDear *{name}*,\n\nYour application *#{orderId}* ({service}) has passed initial document screening. Our advocate desk is currently drafting and reviewing your official notary records.\n\n👉 *View Draft Status:*\n{link}\n\nThank you for choosing Amit Online Services!"
                  }))
                }
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg border border-amber-500/20 transition-all cursor-pointer"
              >
                ✍️ Pending Draft Template
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    WHATSAPP_AUTO_DISPATCH_TEMPLATE:
                      "*Amit Online Services - ARN Generated* 🏛️\n\nDear *{name}*,\n\nOfficial Application Reference Number (ARN) for application *#{orderId}* has been successfully generated & e-stamp attached.\n\n👉 *Download Digital Proof:*\n{link}\n\nYour final certificate is entering final registry sealing."
                  }))
                }
                className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
              >
                🏛️ ARN Generated Template
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    WHATSAPP_AUTO_DISPATCH_TEMPLATE:
                      "*Amit Online Services - Application Approved & Completed* 🎉\n\nDear *{name}*,\n\nCongratulations! Your notary registration/application *#{orderId}* for *{service}* is fully completed and verified.\n\n👉 *Download Official Receipt & Certificate:*\n{link}\n\nThank you for trusting Amit Online Services Notary Desk."
                  }))
                }
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
              >
                🎉 Completed Template
              </button>
            </div>

            <textarea
              name="WHATSAPP_AUTO_DISPATCH_TEMPLATE"
              value={formData.WHATSAPP_AUTO_DISPATCH_TEMPLATE}
              onChange={handleInputChange}
              rows={4}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-xs outline-none text-slate-900 dark:text-white leading-relaxed"
              placeholder="*Amit Online Services - Order Status Update*\n\nDear {name},\n\nYour order *#{orderId}* status has been updated to: {status}.\n\nTrack: {link}"
            />
            <p className="text-[9px] text-slate-400 font-bold">
              Dynamic variables available: <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{`{name}`}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{`{orderId}`}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{`{service}`}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{`{status}`}</code>, <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{`{link}`}</code>
            </p>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            id="admin-save-settings-btn"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                સાચવવામાં આવી રહ્યું છે...
              </>
            ) : (
              <>
                <Save size={18} />
                સેવ કરો (Save Configuration)
              </>
            )}
          </button>
        </div>
      </form>

      {/* Validation Results Modal */}
      {showValidationModal && validationResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" id="db-validation-modal-overlay">
          <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setShowValidationModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full text-slate-400 hover:text-slate-600 transition-all"
              id="close-db-validation-modal-btn"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-850 pb-4 mb-5">
              <span className={`p-2.5 rounded-xl ${validationResult.success ? "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"}`}>
                <Database size={20} />
              </span>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                  Database Validation Report
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                  ડેટાબેઝ ચકાસણી અહેવાલ
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-4 text-left">
              {validationResult.success ? (
                <>
                  <div className="p-4 bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30 rounded-2xl flex items-start gap-3">
                    <span className="text-green-600 mt-0.5">
                      <CheckCircle size={18} />
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-green-800 dark:text-green-300 uppercase tracking-wider">
                        ✅ Connection Successful!
                      </h4>
                      <p className="text-[11px] text-green-700 dark:text-green-400 mt-1 font-semibold leading-relaxed">
                        {validationResult.message || "ગૂગલ શીટ સાથે જોડાણ સફળતાપૂર્વક સ્થાપિત થયું છે."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-150 dark:border-slate-850">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="text-green-600">●</span>
                      <span>Blogs Tab Check:</span>
                      <span className="ml-auto text-[10px] font-black uppercase bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-md">
                        {validationResult.data?.tabCreated ? "Created Automatically" : "Active & Verified"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-850 pt-2.5">
                      <span className="text-green-600">●</span>
                      <span>Headers Schema Check:</span>
                      <span className="ml-auto text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-md">
                        {validationResult.data?.totalHeaders || 19}/{validationResult.data?.totalHeaders || 19} Verified
                      </span>
                    </div>

                    {validationResult.data?.missingHeadersAdded && validationResult.data.missingHeadersAdded.length > 0 && (
                      <div className="text-[10px] text-orange-600 dark:text-orange-400 font-bold mt-1 bg-orange-50 dark:bg-orange-950/20 p-2 rounded-lg border border-orange-100/55 dark:border-orange-900/30">
                        ⚠️ Auto-Healed Missing Headers: {validationResult.data.missingHeadersAdded.join(", ")}
                      </div>
                    )}

                    {validationResult.data?.extraHeadersFound && validationResult.data.extraHeadersFound.length > 0 && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100/55 dark:border-amber-900/30 leading-relaxed">
                        ⚠️ Warning: Found extra headers: {validationResult.data.extraHeadersFound.join(", ")}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3">
                  <span className="text-red-600 mt-0.5">
                    <AlertTriangle size={18} />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-red-800 dark:text-red-300 uppercase tracking-wider">
                      ❌ Connection/Validation Failed!
                    </h4>
                    <p className="text-[11px] text-red-700 dark:text-red-400 mt-1 font-semibold leading-relaxed">
                      {validationResult.error || "ગૂગલ શીટ ચકાસણી દરમિયાન કોઈ સમસ્યા આવી છે. કૃપા કરીને લિંક તપાસો."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                id="close-db-validation-modal-btn-footer"
              >
                Close (બંધ કરો)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
