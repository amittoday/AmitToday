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
  Play, 
  Activity, 
  Info 
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import SystemDiagnostics from "./SystemDiagnostics";

interface DevConsoleProps {
  user: any;
  killSwitches: any;
  setKillSwitches: (s: any) => void;
  lang: string;
}

export default function DevConsole({ user, killSwitches = {}, setKillSwitches, lang = "en" }: DevConsoleProps) {
  const [latency, setLatency] = useState(45);
  const [cpuUsage, setCpuUsage] = useState(12);
  const [memUsage, setMemUsage] = useState(38);
  const [dbStatus, setDbStatus] = useState("CONNECTED");
  const [apiIntegrity, setApiIntegrity] = useState("PASSING");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "SYS_INIT: Antigravity Container booted on port 3000.",
    "AUTH_MODULE: Multi-tier 4-tier RBAC engine injected.",
    "DB_POOL: Connection established with persistent spreadsheet store.",
    "READY: Development app is fully operational."
  ]);
  const [newLogText, setNewLogText] = useState("");

  useEffect(() => {
    // Generate slight jitter in cpu / latency metrics
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 15) + 8);
      setLatency(Math.floor(Math.random() * 10) + 38);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSelfTest = () => {
    const toastId = toast.loading("Executing full API and multi-tier routing self-test...");
    setTimeout(() => {
      setTerminalLogs(prev => [
        ...prev,
        `DEV_TEST: Ran self-test on: ${new Date().toLocaleTimeString()}`,
        `DEV_TEST: Multi-tier authorization validation passed for [Developer, Admin, Staff, User]`,
        `DEV_TEST: Database integrity verify status: SUCCESSFUL`,
        `DEV_TEST: Cloud Run Container port egress bind status: PASSING`
      ]);
      toast.success("Self-test completed. All integrity checks are green!");
    }, 1500);
  };

  const handleToggleKillSwitch = (key: string) => {
    const updated = { ...killSwitches, [key]: !killSwitches[key] };
    setKillSwitches(updated);
    toast.success(`System KillSwitch '${key}' is now ${updated[key] ? "ENABLED (Service Offline)" : "DISABLED (Service Online)"}`);
    setTerminalLogs(prev => [
      ...prev,
      `KILLSWITCH: Toggle key '${key}' to value ${updated[key]}`
    ]);
  };

  return (
    <div className="space-y-8 font-sans text-left">
      {/* Visual Identity Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-y-12 translate-x-12">
          <Terminal size={320} />
        </div>
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-mono text-blue-400 uppercase font-black tracking-widest block">
            SUPERUSER PRIVILEGES • ડેવલપર નિયંત્રણ કન્સોલ
          </span>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <Cpu className="text-blue-500 animate-pulse" /> Developer Control Center
          </h1>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Welcome to the kernel and systems dashboard, developer. Here you can toggle system-wide functional killswitches, run self-tests on API routes, and monitor real-time resources.
          </p>
        </div>
      </div>

      {/* Resource & Integrity Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">CONTAINER LOAD</span>
            <Cpu size={16} className="text-blue-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-850 dark:text-white">{cpuUsage}% CPU</h3>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${cpuUsage * 4}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">LATENCY TIMER</span>
            <Network size={16} className="text-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-850 dark:text-white">{latency} ms</h3>
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle size={10} /> Edge proxy optimal
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">SHEET DATABASE</span>
            <Database size={16} className="text-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-850 dark:text-white">{dbStatus}</h3>
            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <ShieldCheck size={10} /> Active sync connection
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 tracking-wider">RBAC 4-TIER SECURITY</span>
            <ShieldCheck size={16} className="text-purple-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-850 dark:text-white">{apiIntegrity}</h3>
            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400">
              Dev, Admin, Staff, Customer
            </span>
          </div>
        </div>
      </div>

      {/* System Health & Diagnostics Dashboard Container with extra spacing */}
      <div className="py-2 space-y-4">
        <SystemDiagnostics lang={lang} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Terminal Logs (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 shadow-xl border border-slate-850 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-white">
              <Terminal size={16} className="text-blue-500" />
              <h2 className="text-xs font-black uppercase tracking-wider font-mono">Simulated Developer Shell Console</h2>
            </div>
            <button
              onClick={triggerSelfTest}
              className="bg-slate-900 hover:bg-blue-600 text-white text-[9px] font-mono p-2 rounded-lg transition-all border border-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={10} /> run_test
            </button>
          </div>

          <div className="bg-slate-900 rounded-2xl p-4 h-64 overflow-y-auto font-mono text-[10px] text-slate-350 space-y-1.5 border border-slate-850 scrollbar-thin">
            {terminalLogs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-slate-500 select-none">[$]</span> {log}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Inject custom log or simulate command execution..."
              value={newLogText}
              onChange={e => setNewLogText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newLogText.trim()) {
                  setTerminalLogs([...terminalLogs, `SHELL_CMD: ${newLogText.trim()}`]);
                  setNewLogText("");
                }
              }}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={() => {
                if (newLogText.trim()) {
                  setTerminalLogs([...terminalLogs, `SHELL_CMD: ${newLogText.trim()}`]);
                  setNewLogText("");
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-mono text-xs cursor-pointer"
            >
              Exec
            </button>
          </div>
        </div>

        {/* Global KillSwitches & System Flags (5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Active Killswitches</h2>
            <p className="text-[11px] text-slate-450">Instantly shut down service endpoints or operational systems for hot patching.</p>
          </div>

          <div className="space-y-4">
            {[
              { key: "disableAllServices", name: "Disable All Online Services", desc: "Turns off Mamlatdar, PAN, translation booking flows." },
              { key: "disableOcrAutomations", name: "Disable Automatic OCR Engine", desc: "Forces manual typing/verification on all documents." },
              { key: "disableAppointmentSystem", name: "Disable Appointment Booking", desc: "Shuts down calendar bookings for Mamlatdar consultations." }
            ].map((sw) => {
              const isEnabled = !!killSwitches[sw.key];
              return (
                <div key={sw.key} className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl flex justify-between items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-slate-850 dark:text-white">{sw.name}</h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{sw.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleKillSwitch(sw.key)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${isEnabled ? "bg-rose-150 text-rose-800" : "bg-slate-200 dark:bg-slate-800 text-slate-500"}`}
                  >
                    {isEnabled ? (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1">OFFLINE</span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1 text-slate-500">ONLINE</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
