import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Clock, 
  Hourglass, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  TrendingUp,
  Activity
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface Order {
  orderId?: string;
  ID?: string;
  service?: string;
  Type?: string;
  status?: string;
  Status?: string;
  date?: string;
  Timestamp?: string;
  Notes?: string;
  notes?: string;
}

interface DashboardWidgetProps {
  orders: Order[];
  user: any;
}

interface StatusDef {
  Status: string;
  definition?: string;
  tooltip?: string;
  ProgressPercent?: number; // Custom field we fallback to
}

export function DashboardWidget({ orders, user }: DashboardWidgetProps) {
  const [statusDefs, setStatusDefs] = useState<StatusDef[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDefs() {
      try {
        setLoading(true);
        const res = await axios.get("/api/status-definitions");
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setStatusDefs(res.data.data);
        }
      } catch (err) {
        console.warn("Could not load status definitions", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDefs();
  }, []);

  // Standard pipeline fallback
  const getStatusProgress = (status: string): { percent: number; color: string; icon: React.ReactNode; label: string } => {
    const s = String(status || "Pending").toLowerCase().trim();
    
    if (s.includes("pending")) {
      return { 
        percent: 20, 
        color: "bg-amber-500", 
        icon: <Hourglass className="text-amber-500 shrink-0" size={14} />,
        label: "Processing Received Application" 
      };
    }
    if (s.includes("under review") || s.includes("review")) {
      return { 
        percent: 45, 
        color: "bg-blue-500", 
        icon: <Activity className="text-blue-500 shrink-0 animate-pulse" size={14} />,
        label: "Document Verification In-Progress" 
      };
    }
    if (s.includes("query raised") || s.includes("query") || s.includes("attention")) {
      return { 
        percent: 60, 
        color: "bg-rose-500 animate-pulse", 
        icon: <AlertTriangle className="text-rose-500 shrink-0" size={14} />,
        label: "Clarification/Correction Requested" 
      };
    }
    if (s.includes("submitted")) {
      return { 
        percent: 80, 
        color: "bg-indigo-500", 
        icon: <Send className="text-indigo-500 shrink-0" size={14} />,
        label: "Submitted to Government Ministry/Registry" 
      };
    }
    if (s.includes("completed") || s.includes("approved") || s.includes("ready")) {
      return { 
        percent: 100, 
        color: "bg-emerald-500", 
        icon: <CheckCircle2 className="text-emerald-500 shrink-0" size={14} />,
        label: "Dossier Issued Successfully" 
      };
    }
    
    // Attempt dynamic lookup from spreadsheet status definitions
    const matchedDef = statusDefs.find(d => d.Status.toLowerCase().trim() === s);
    if (matchedDef) {
      return {
        percent: 50,
        color: "bg-blue-600",
        icon: <Clock className="text-blue-550 shrink-0" size={14} />,
        label: matchedDef.definition || "In evaluation cycle"
      };
    }

    return { 
      percent: 30, 
      color: "bg-slate-500", 
      icon: <Clock className="text-slate-505 shrink-0" size={14} />,
      label: "Application Queued" 
    };
  };

  // Restrict to pending or in-progress orders (not fully completed)
  const activeOrders = orders.filter(o => {
    const s = (o.status || o.Status || "").toLowerCase();
    return s !== "" && !s.includes("completed") && !s.includes("approved");
  });

  if (activeOrders.length === 0) {
    return (
      <div className="bg-slate-55 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl mb-8 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest">
              Platform Workflow Clear
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              All your submitted orders have been fully issued and processed.
            </p>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-lg">
          0 Active Jobs
        </div>
      </div>
    );
  }

  // Showcase the first active order with rich details and list the others
  const topOrder = activeOrders[0];
  const topOrderId = topOrder.orderId || topOrder.ID || "N/A";
  const topOrderService = topOrder.service || topOrder.Type || "Document Service";
  const { percent, color, icon, label } = getStatusProgress(topOrder.status || topOrder.Status || "Pending");
  const definitionObj = statusDefs.find(d => String(d.Status || "").toLowerCase().trim() === String(topOrder.status || topOrder.Status || "Pending").toLowerCase().trim());
  const statusDetailsText = definitionObj?.definition || definitionObj?.tooltip || label;

  return (
    <div className="bg-slate-55 bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-[28px] text-white border border-slate-800 shadow-xl mb-8 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl hover:border-slate-700" id="dashboard-tracker-widget">
      {/* Absolute grid vector decorations */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/10 animate-pulse">
                <TrendingUp size={16} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-450 block">Real-time tracker widget</span>
                <h3 className="text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                  Job Progress Panel
                </h3>
              </div>
            </div>
            <div className="text-[9px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              {activeOrders.length} {activeOrders.length === 1 ? "Active Job" : "Active Jobs"} Under AOS Control
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  {topOrderService}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  ID: #{topOrderId}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                {icon}
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  {topOrder.status || topOrder.Status || "Pending"}
                </span>
              </div>
            </div>

            {/* Pipeline Progress Ring/Line */}
            <div>
              <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                <span className="flex items-center gap-1">Status Step Definition: <b className="text-slate-300 normal-case font-medium">{statusDetailsText}</b></span>
                <span className="font-mono text-white text-xs">{percent}%</span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-[2px] border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`${color} h-full rounded-full`}
                />
              </div>
            </div>

            {/* Pipeline Stage Labels */}
            <div className="relative flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-450 pt-1">
              <span className={percent >= 20 ? "text-amber-400 font-bold" : ""}>Pending</span>
              <span className={percent >= 45 ? "text-blue-400 font-bold" : ""}>Verified</span>
              <span className={percent >= 80 ? "text-indigo-400 font-bold" : ""}>Submitted</span>
              <span className={percent >= 100 ? "text-emerald-400 font-bold" : ""}>Issued</span>
            </div>
          </div>
        </div>

        {activeOrders.length > 1 && (
          <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 pt-5 lg:pt-0 lg:pl-6 space-y-3 shrink-0">
            <h5 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              Other Pending Submissions ({activeOrders.length - 1})
            </h5>
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
              {activeOrders.slice(1, 4).map((order) => {
                const subId = order.orderId || order.ID || "N/A";
                const subSvc = order.service || order.Type || "DSC";
                return (
                  <div key={subId} className="bg-white/5 border border-white/5 p-2.5 rounded-xl flex items-center justify-between text-[10px] hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate max-w-[150px]">{subSvc}</p>
                      <p className="text-[8px] text-slate-450 font-black">#{subId}</p>
                    </div>
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-white/10 text-slate-300 border border-white/5 uppercase tracking-wider shrink-0">
                      {order.status || order.Status || "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
