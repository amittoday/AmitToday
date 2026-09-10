import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { 
  Activity, 
  Database, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Trash2,
  Sliders,
  Battery,
  BatteryCharging
} from "lucide-react";
import { toast } from "sonner";

interface SystemDiagnosticsProps {
  lang?: string;
}

export default function SystemDiagnostics({ lang = "en" }: SystemDiagnosticsProps) {
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [clearingCache, setClearingCache] = useState(false);
  const [reloadingConfig, setReloadingConfig] = useState(false);
  const [data, setData] = useState<{
    gas: { active: boolean; message: string };
    drive: { active: boolean; details: any };
    logs: any[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [expandedCard, setExpandedCard] = useState<"gas" | "drive" | "battery" | null>(null);
  const [gasHistory, setGasHistory] = useState<{ timestamp: Date; active: boolean; message: string }[]>([]);
  const [driveHistory, setDriveHistory] = useState<{ timestamp: Date; active: boolean; details: any }[]>([]);
  const [batteryHistory, setBatteryHistory] = useState<{ timestamp: Date; level: number; charging: boolean }[]>([]);

  const prevActiveRef = useRef<boolean | null>(null);

  const [battery, setBattery] = useState<{
    level: number;
    charging: boolean;
    supported: boolean;
    health: string;
  }>({
    level: 95,
    charging: false,
    supported: false,
    health: "Excellent"
  });

  // Fetch real battery status if available, with robust fallback
  useEffect(() => {
    const nav = navigator as any;
    let active = true;
    if (nav.getBattery) {
      nav.getBattery().then((batt: any) => {
        if (!active) return;
        const updateBattery = () => {
          setBattery({
            level: Math.round(batt.level * 100),
            charging: batt.charging,
            supported: true,
            health: batt.level > 0.8 ? "Excellent" : batt.level > 0.4 ? "Good" : "Service Recommended"
          });
        };
        updateBattery();
        batt.addEventListener("levelchange", updateBattery);
        batt.addEventListener("chargingchange", updateBattery);
        
        return () => {
          batt.removeEventListener("levelchange", updateBattery);
          batt.removeEventListener("chargingchange", updateBattery);
        };
      }).catch((err: any) => {
        console.warn("Battery status unsupported or blocked in this iframe context:", err);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  // Sync battery history
  useEffect(() => {
    setBatteryHistory(prev => {
      if (prev.length > 0 && prev[0].level === battery.level && prev[0].charging === battery.charging) {
        return prev;
      }
      return [
        { timestamp: new Date(), level: battery.level, charging: battery.charging },
        ...prev.slice(0, 9)
      ];
    });
  }, [battery.level, battery.charging]);

  const fetchDiagnostics = useCallback(async (isAuto = false) => {
    if (!isAuto) setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("aos_token");
      const res = await axios.get("/api/developer/diagnostics", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.data && res.data.success) {
        setData(res.data);
        
        // Append history checkpoints for event expansion
        setGasHistory(prev => [
          { timestamp: new Date(), active: !!res.data.gas?.active, message: res.data.gas?.message || "Active connection" },
          ...prev.slice(0, 9)
        ]);
        setDriveHistory(prev => [
          { timestamp: new Date(), active: !!res.data.drive?.active, details: res.data.drive?.details },
          ...prev.slice(0, 9)
        ]);
      } else {
        setError("Failed to fetch diagnostics details.");
      }
    } catch (err: any) {
      console.error("Diagnostics Fetch Error:", err);
      setError(err.response?.data?.error || err.message || "Failed to contact diagnostics API");
    } finally {
      if (!isAuto) setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  // Toast alert system when Google Apps Script connectivity status changes
  useEffect(() => {
    if (data?.gas) {
      const currentActive = data.gas.active;
      if (prevActiveRef.current === true && currentActive === false) {
        toast.error("Alert: Google Apps Script status changed to UNREACHABLE!", {
          description: "Verify your GAS_WEBAPP_URL and network configurations immediately.",
          duration: 6000
        });
      } else if (prevActiveRef.current === false && currentActive === true) {
        toast.success("Resolved: Google Apps Script status recovered to HEALTHY!", {
          description: "Connectivity with spreadsheet API restored.",
          duration: 4000
        });
      }
      prevActiveRef.current = currentActive;
    }
  }, [data?.gas]);

  // Countdown and Auto-Refresh timer every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDiagnostics(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchDiagnostics]);

  const handleManualRefresh = () => {
    setCountdown(30);
    fetchDiagnostics(false);
  };

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const token = localStorage.getItem("aos_token");
      const res = await axios.post("/api/developer/clear-cache", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success(lang === "en" ? "In-Memory Cache Purged Successfully!" : "ઇન-મેમરી કેશ સાફ થઈ ગઈ છે!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to clear system cache.");
    } finally {
      setClearingCache(false);
    }
  };

  const handleReloadConfig = async () => {
    setReloadingConfig(true);
    try {
      const token = localStorage.getItem("aos_token");
      const res = await axios.post("/api/developer/reload-config", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        toast.success(lang === "en" ? "System Config Synchronized Live!" : "સિસ્ટમ કન્ફિગ રીલોડ થઈ ગઈ છે!");
        fetchDiagnostics(true);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to reload system config.");
    } finally {
      setReloadingConfig(false);
    }
  };

  // Helper to format timestamps to a readable local format
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString(lang === "en" ? "en-US" : "gu-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }) + ` (${date.toLocaleDateString(lang === "en" ? "en-US" : "gu-IN", { month: "short", day: "numeric" })})`;
    } catch {
      return isoString;
    }
  };

  // Helper to format bytes to readable strings
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 text-left font-sans transition-all duration-300">
      {/* Header section with live flashing light and auto-refresh countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600 dark:text-blue-400 animate-pulse" size={20} />
            <h2 className="text-base font-black text-slate-850 dark:text-white uppercase tracking-tight">
              {lang === "en" ? "System Health & Diagnostics" : "સિસ્ટમ હેલ્થ અને ડાયગ્નોસ્ટિક્સ"}
            </h2>
            <span className="relative flex h-2.5 w-2.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed max-w-xl">
            {lang === "en" 
              ? "Real-time monitoring of backend Apps Script connectivity, secure Google Drive storage authorization, and error logs."
              : "રીઅલ-ટાઇમ કનેક્ટિવિટી મોનિટરિંગ, સ્ટોરેજ લખવાની ક્ષમતા અને એરર લોગ એગ્રીગેટર."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 px-3 py-1.5 rounded-xl">
            <Clock size={12} className="text-slate-400" />
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
              Refresh in {countdown}s
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm shadow-blue-500/10"
          >
            <RefreshCw size={11} className={`${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Refreshing..." : "Check Status"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400">Diagnostic Check Encountered an Error</h4>
            <p className="text-[11px] text-rose-600 dark:text-rose-400/80 leading-relaxed font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Connectivity & Storage Check grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Google Apps Script connectivity */}
        <div 
          onClick={() => setExpandedCard(expandedCard === "gas" ? null : "gas")}
          className={`bg-slate-50 dark:bg-slate-950/30 border p-5 rounded-2xl space-y-4 cursor-pointer hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden select-none group ${
            expandedCard === "gas" ? "ring-2 ring-blue-500/20 border-blue-500/30" : "border-slate-100 dark:border-slate-850/50"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Google Apps Script
                <span className="text-[9px] text-slate-400 group-hover:text-blue-500 transition-colors">
                  {expandedCard === "gas" ? "▲" : "▼"}
                </span>
              </h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-450 leading-relaxed">
                Connectivity & RPC status of target spreadsheet microservices.
              </p>
            </div>
            {data?.gas.active ? (
              <span className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1.5 animate-pulse shadow-sm shadow-emerald-500/10">
                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Connected
              </span>
            ) : (
              <span className="bg-rose-50 dark:bg-rose-950/30 border border-rose-150 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1">
                <XCircle size={10} /> Offline
              </span>
            )}
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-400">Response Code:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {loading ? "Pinging..." : data?.gas.active ? "200 OK" : "502 BAD GATEWAY"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-400">RPC Verification:</span>
              <span className="font-mono text-slate-500 dark:text-slate-400 text-right max-w-[180px] truncate">
                {loading ? "Checking..." : data?.gas.message || "No check performed"}
              </span>
            </div>
          </div>

          {expandedCard === "gas" && (
            <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Timestamped Ping Events</div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {gasHistory.length > 0 ? (
                  gasHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-[9px] p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                      <span className="text-slate-500">[{h.timestamp.toLocaleTimeString()}]</span>
                      <span className={h.active ? "text-emerald-600 dark:text-emerald-450 font-bold" : "text-rose-600 dark:text-rose-450 font-bold"}>
                        {h.active ? "HEALTHY" : "OFFLINE"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-400 text-center py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850">
                    No diagnostics logged yet.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 select-none">
            <span>{expandedCard === "gas" ? "Click to collapse details" : "Click to view timestamped events"}</span>
            <span className="font-bold font-mono">⚡ {gasHistory.length} Checks</span>
          </div>
        </div>

        {/* Card 2: Google Drive folder ID validation */}
        <div 
          onClick={() => setExpandedCard(expandedCard === "drive" ? null : "drive")}
          className={`bg-slate-50 dark:bg-slate-950/30 border p-5 rounded-2xl space-y-4 cursor-pointer hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden select-none group ${
            expandedCard === "drive" ? "ring-2 ring-blue-500/20 border-blue-500/30" : "border-slate-100 dark:border-slate-850/50"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Drive ID Authorization
                <span className="text-[9px] text-slate-400 group-hover:text-blue-500 transition-colors">
                  {expandedCard === "drive" ? "▲" : "▼"}
                </span>
              </h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-450 leading-relaxed">
                AOS_DATABASE_FOLDER_ID permissions and secure file write capacity.
              </p>
            </div>
            {data?.drive.active ? (
              <span className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1.5 animate-pulse shadow-sm shadow-emerald-500/10">
                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Writable
              </span>
            ) : (
              <span className="bg-rose-50 dark:bg-rose-950/30 border border-rose-150 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1">
                <XCircle size={10} /> Inaccessible
              </span>
            )}
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-400">Folder Name:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300 max-w-[180px] truncate">
                {loading ? "Verifying..." : data?.drive.active ? data.drive.details?.folderName : (data?.drive.details?.folderName || "N/A")}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-400">Folder ID Check:</span>
              <span className="font-mono text-slate-500 dark:text-slate-400 text-right max-w-[180px] truncate">
                {loading ? "Verifying..." : data?.drive.active ? `${data.drive.details?.folderId?.substring(0,8)}...` : (data?.drive.details?.folderId ? `${data.drive.details.folderId.substring(0,8)}...` : "Failed secure write test")}
              </span>
            </div>
          </div>

          {/* Storage Quota Summary Bar */}
          {!loading && data?.drive.details?.storage && (
            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold text-slate-400">Drive Account Storage:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatBytes(data.drive.details.storage.usedSpace)} / {formatBytes(data.drive.details.storage.totalSpace)} ({(data.drive.details.storage.usedSpace / data.drive.details.storage.totalSpace * 100).toFixed(1)}%)
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${(data.drive.details.storage.usedSpace / data.drive.details.storage.totalSpace * 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                <span>Folder App Usage: {formatBytes(data.drive.details.storage.folderUsage)}</span>
                <span className="font-bold">{data.drive.details.storage.fileCount} Files</span>
              </div>
            </div>
          )}

          {expandedCard === "drive" && (
            <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
              
              {/* Detailed folder size breakdown */}
              {data?.drive.details?.storage?.filesByType && (
                <div className="space-y-2">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Folder Usage Breakdown</div>
                  <div className="grid grid-cols-1 gap-2">
                    {data.drive.details.storage.filesByType.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || '#3b82f6' }} />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{item.type}</span>
                            <span className="text-[8px] font-mono text-slate-400">{item.count} items recorded</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                          {formatBytes(item.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Timestamped Folder Verifications</div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {driveHistory.length > 0 ? (
                  driveHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-[9px] p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                      <span className="text-slate-500">[{h.timestamp.toLocaleTimeString()}]</span>
                      <span className={h.active ? "text-emerald-600 dark:text-emerald-450 font-bold" : "text-rose-600 dark:text-rose-450 font-bold"}>
                        {h.active ? "WRITABLE" : "BLOCKED"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-400 text-center py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850">
                    No write checks logged yet.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 select-none">
            <span>{expandedCard === "drive" ? "Click to collapse details" : "Click to view timestamped events"}</span>
            <span className="font-bold font-mono">⚡ {driveHistory.length} Checks</span>
          </div>
        </div>

        {/* Card 3: Device Battery Health (Field scanning debugger) */}
        <div 
          onClick={() => setExpandedCard(expandedCard === "battery" ? null : "battery")}
          className={`bg-slate-50 dark:bg-slate-950/30 border p-5 rounded-2xl space-y-4 cursor-pointer hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-300 relative overflow-hidden select-none group ${
            expandedCard === "battery" ? "ring-2 ring-blue-500/20 border-blue-500/30" : "border-slate-100 dark:border-slate-850/50"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                Device Battery Health
                <span className="text-[9px] text-slate-400 group-hover:text-blue-500 transition-colors">
                  {expandedCard === "battery" ? "▲" : "▼"}
                </span>
              </h3>
              <p className="text-[10px] text-slate-450 dark:text-slate-450 leading-relaxed">
                Scanner system battery telemetry for field session operations.
              </p>
            </div>
            {battery.level > 50 ? (
              <span className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm shadow-emerald-500/10">
                <span className="relative flex h-1.5 w-1.5 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                {battery.charging ? <BatteryCharging size={10} className="text-emerald-500" /> : <Battery size={10} className="text-emerald-500 animate-pulse" />}
                {battery.charging ? "Charging" : "Healthy"}
              </span>
            ) : battery.level > 20 ? (
              <span className="bg-amber-50 dark:bg-amber-950/30 border border-amber-150 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1">
                {battery.charging ? <BatteryCharging size={10} className="text-amber-500" /> : <Battery size={10} className="text-amber-500" />}
                {battery.charging ? "Charging" : "Moderate"}
              </span>
            ) : (
              <span className="bg-rose-50 dark:bg-rose-950/30 border border-rose-150 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1 animate-pulse">
                <Battery size={10} className="text-rose-500 animate-bounce" /> Low / Critical
              </span>
            )}
          </div>

          <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-400">Battery Level:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-700 dark:text-white">{battery.level}%</span>
                <div className="w-12 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${battery.level > 50 ? 'bg-emerald-500' : battery.level > 20 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${battery.level}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-slate-400">Scanner Health Level:</span>
              <span className="font-mono text-slate-500 dark:text-slate-400 text-right max-w-[180px] truncate font-bold">
                {battery.health}
              </span>
            </div>
          </div>

          {expandedCard === "battery" && (
            <div className="pt-2 border-t border-slate-150 dark:border-slate-800 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200" onClick={(e) => e.stopPropagation()}>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Device Power Telemetry Logs</div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {batteryHistory.length > 0 ? (
                  batteryHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-[9px] p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 font-mono">
                      <span className="text-slate-500">[{h.timestamp.toLocaleTimeString()}]</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {h.level}% {h.charging ? "(⚡ Charging)" : "(🔋 Discharging)"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-400 text-center py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850">
                    No battery logs recorded.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 select-none">
            <span>{expandedCard === "battery" ? "Click to collapse details" : "Click to view power telemetry"}</span>
            <span className="font-bold font-mono">🔋 {batteryHistory.length} Updates</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Row */}
      <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850/50 p-5 rounded-2xl space-y-3">
        <div className="flex items-center gap-1.5">
          <Sliders size={14} className="text-blue-500" />
          <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Developer Quick Actions (Backend Administration)
          </h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleClearCache}
            disabled={clearingCache}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Trash2 size={12} className={clearingCache ? "animate-pulse" : ""} />
            <span>{clearingCache ? "Clearing..." : "Clear Cache"}</span>
          </button>
          <button
            onClick={handleReloadConfig}
            disabled={reloadingConfig}
            className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-bold text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Sliders size={12} className={reloadingConfig ? "animate-spin" : ""} />
            <span>{reloadingConfig ? "Reloading..." : "Reload Config"}</span>
          </button>
        </div>
      </div>

      {/* Log Aggregator */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-slate-500 dark:text-slate-400" />
          <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Latest System Events & Error Stream (Log Aggregator)
          </h3>
        </div>

        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {data?.logs && data.logs.length > 0 ? (
            data.logs.map((log, index) => {
              const orderId = log.OrderID || log["OrderID"] || "N/A";
              const userId = log.UserID || log["UserID"] || "N/A";
              const errMsg = log["Error Message"] || log.errorMessage || log.ErrorMessage || "Unknown anomaly logged";
              const timestamp = log.Timestamp || log.timestamp || new Date().toISOString();

              return (
                <div key={index} className="p-4 bg-slate-50/40 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-950/25 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs leading-relaxed">
                  <div className="space-y-1 sm:max-w-[70%]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-amber-50 dark:bg-amber-950/30 border border-amber-150 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 font-mono text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        SYSTEM_EVENT
                      </span>
                      {orderId !== "N/A" && (
                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded">
                          Order: {orderId}
                        </span>
                      )}
                      {userId !== "N/A" && (
                        <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded">
                          User: {userId}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-650 dark:text-slate-350 font-medium break-all">
                      {errMsg}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 self-end sm:self-center shrink-0">
                    <Clock size={11} />
                    <span>{formatTime(timestamp)}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
              {loading ? "Streaming system records..." : "No recent events or anomalies recorded."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
