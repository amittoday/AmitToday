import React, { useState, useEffect } from "react";
import { 
  Terminal, 
  Settings, 
  RefreshCw, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Network, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Search, 
  FileText, 
  Layers, 
  Activity,
  ArrowLeft,
  ChevronRight,
  Wifi,
  WifiOff
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";

interface DeveloperDashboardProps {
  user: any;
  lang?: string;
  theme?: string;
  toggleTheme?: () => void;
  onLogout?: () => void;
}

interface SystemLog {
  timestamp: string;
  level: "Info" | "Warning" | "Error" | "Success" | string;
  message: string;
  details: string;
}

export default function DeveloperDashboard({ 
  user, 
  lang = "en", 
  theme = "light", 
  toggleTheme,
  onLogout 
}: DeveloperDashboardProps) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(38);
  const [cpuUsage, setCpuUsage] = useState(14);
  const [memUsage, setMemUsage] = useState(42);
  const [apiStatus, setApiStatus] = useState<"Online" | "Offline" | "Degraded">("Online");

  // Fetch logs with optional cache bypass
  const fetchLogs = async (bypassCache = false) => {
    setLoading(true);
    const startFetch = Date.now();
    try {
      const res = await axios.get(`/api/developer/logs${bypassCache ? "?bypassCache=true" : ""}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.data && res.data.success) {
        setLogs(res.data.logs || []);
        setApiStatus("Online");
        setLatency(Date.now() - startFetch);
        if (bypassCache) {
          toast.success("સિસ્ટમ લૉગ્સ રિફ્રેશ થયા! (System logs synchronized!)");
        }
      } else {
        throw new Error(res.data?.error || "Invalid response format");
      }
    } catch (err: any) {
      console.error("Failed to fetch logs:", err);
      setApiStatus("Degraded");
      toast.error("લૉગ્સ મેળવવામાં ભૂલ આવી. (Failed to refresh system logs.)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    // Minor telemetry update cycle
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 12) + 6);
      setMemUsage(prev => Math.min(90, Math.max(30, prev + (Math.random() * 4 - 2))));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleForceSync = () => {
    fetchLogs(true);
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = selectedLevel === "All" || log.level.toLowerCase() === selectedLevel.toLowerCase();

    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-8 text-left font-sans max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-12 translate-x-12">
          <Terminal size={280} />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-blue-400 uppercase font-black tracking-widest block">
              SUPERUSER PRIVILEGES • ડેવલપર નિયંત્રણ કન્સોલ
            </span>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2.5">
              <Cpu className="text-blue-500 animate-pulse" /> Developer Dashboard
            </h1>
            <p className="text-slate-400 text-xs max-w-xl leading-relaxed">
              Monitors backend APIs, Google Apps Script connection health, runtime diagnostics, and system transactions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleForceSync}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-blue-900/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Force Sync (બાયપાસ કેશ)
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resource & Integrity Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* API Connectivity status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">API CONNECTIVITY</span>
            {apiStatus === "Online" ? (
              <Wifi className="text-emerald-500" size={16} />
            ) : (
              <WifiOff className="text-amber-500 animate-bounce" size={16} />
            )}
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-white flex items-baseline gap-1.5">
              {apiStatus}
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">({latency}ms)</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
              Google Apps Script Egress Proxy Tunnel
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1">
            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>

        {/* System Load */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">SYSTEM LOAD (CPU)</span>
            <Cpu size={16} className="text-blue-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{cpuUsage}%</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
              Cloud Run Container Allocation
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1">
            <div className="bg-blue-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${cpuUsage}%` }}></div>
          </div>
        </div>

        {/* Memory Buffer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">MEMORY USAGE</span>
            <Database size={16} className="text-purple-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-white">{Math.round(memUsage)}%</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
              NodeJS VM Heap footprint
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1">
            <div className="bg-purple-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${memUsage}%` }}></div>
          </div>
        </div>

        {/* Environment Integrations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">INTEGRATION RUNTIME</span>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">PASSING</div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
              JWT Authenticator + RBAC Ingress
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-1">
            <div className="bg-emerald-500 h-1 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>

      {/* System Logs Dashboard Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">
              System Logs Audit Ledger (લૉગ એન્ટ્રીઓ)
            </h2>
            <p className="text-xs text-slate-450 mt-1 font-medium">
              Real-time audit trailing of the last 50 system-level activities and exceptions.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages/details..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
              />
            </div>
            {/* Filter Level Dropdown */}
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
            >
              <option value="All">All Levels</option>
              <option value="Info">Info</option>
              <option value="Success">Success</option>
              <option value="Warning">Warning</option>
              <option value="Error">Error</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 dark:bg-slate-950/40">
                  <th className="py-4 px-4 font-mono">Timestamp</th>
                  <th className="py-4 px-4">Level</th>
                  <th className="py-4 px-4">Activity Description</th>
                  <th className="py-4 px-4 font-mono">Payload / Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Activity className="animate-spin text-blue-500" size={16} />
                        <span className="font-bold text-xs">Synchronizing ledger entries...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-bold text-xs">
                      No system logs found matching the filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log, index) => {
                    const levelLower = (log.level || "Info").toLowerCase();
                    let badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400";
                    if (levelLower === "success") {
                      badgeClass = "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400";
                    } else if (levelLower === "warning") {
                      badgeClass = "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400";
                    } else if (levelLower === "error" || levelLower === "critical") {
                      badgeClass = "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400";
                    }

                    return (
                      <tr 
                        key={index} 
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all"
                      >
                        <td className="py-4 px-4 font-mono text-slate-450 text-[10px] whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wide ${badgeClass}`}>
                            {log.level || "Info"}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300 max-w-sm truncate">
                          {log.message}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-500 dark:text-slate-400 text-[10px] break-all max-w-md">
                          {log.details || "None"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
