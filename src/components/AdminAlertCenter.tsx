import React, { useState, useMemo } from "react";
import { AlertTriangle, ShieldAlert, Sparkles, X, MessageSquare, ChevronDown, ChevronUp, Bell, ExternalLink, Clock, Flame, AlertOctagon } from "lucide-react";
import SlaPriorityBadge from "./SlaPriorityBadge";
import { computeOrderSlaDeadline } from "../utils/slaPriorityUtils";

interface Order {
  orderId: string;
  ID?: string;
  email?: string;
  UserEmail?: string;
  serviceType?: string;
  ServiceCategory?: string;
  status: string;
  Status?: string;
  amount?: number;
  Amount?: number;
  createdAt?: string;
  CreatedAt?: string;
  Timestamp?: string;
  notes?: string;
  Notes?: string;
  FolderLink?: string;
  folderLink?: string;
  due_date?: string;
  DueDate?: string;
  deadline?: string;
  priority?: string;
  Priority?: string;
  isUrgent?: boolean;
}

interface AdminAlertCenterProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export default function AdminAlertCenter({ orders, onSelectOrder }: AdminAlertCenterProps) {
  const [filterType, setFilterType] = useState<"all" | "query" | "rejected" | "urgent_note" | "sla_deadline">("all");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Parse and identify alert items
  const alertItems = useMemo(() => {
    const alerts: {
      order: Order;
      type: "query" | "rejected" | "urgent_note" | "sla_deadline";
      reason: string;
      level: "critical" | "warning";
      timestamp: string;
    }[] = [];

    (orders || []).forEach((o) => {
      const oid = o.orderId || o.ID || "N/A";
      const statusStr = String(o.status || o.Status || "").trim().toLowerCase();
      const notesStr = String(o.notes || o.Notes || "").trim().toLowerCase();
      const createdStr = o.createdAt || o.CreatedAt || o.Timestamp || "N/A";

      // Check SLA status first
      const sla = computeOrderSlaDeadline(o);
      if (sla.level === "BREACHED") {
        alerts.push({
          order: o,
          type: "sla_deadline",
          reason: `⚠️ SLA સમયમર્યાદા સમાપ્ત થઈ ગઈ છે! (${sla.remainingFormatted}) - તાત્કાલિક પૂર્ણ કરો (SLA Breached: Immediate Staff Action Required)`,
          level: "critical",
          timestamp: createdStr,
        });
      } else if (sla.level === "CRITICAL") {
        alerts.push({
          order: o,
          type: "sla_deadline",
          reason: `🔥 SLA સમયમર્યાદા નજીક છે: ફક્ત ${sla.remainingFormatted} બાકી છે! (Critical SLA: Less than 4 hours remaining)`,
          level: "critical",
          timestamp: createdStr,
        });
      } else if (sla.level === "URGENT") {
        alerts.push({
          order: o,
          type: "sla_deadline",
          reason: `⚡ SLA સમયમર્યાદા નજીક છે (${sla.remainingFormatted}) (Approaching SLA Deadline: Expedite Processing)`,
          level: "warning",
          timestamp: createdStr,
        });
      }

      // 1. Check for Query Raised
      if (statusStr.includes("query") || statusStr.includes("revision")) {
        alerts.push({
          order: o,
          type: "query",
          reason: "આગળની કાર્યવાહી માટે અરજદારની પૂર્તિની જરૂર છે (Query Raised/Revision Requested)",
          level: "warning",
          timestamp: createdStr,
        });
      }

      // 2. Check for Rejection
      else if (statusStr.includes("reject") || statusStr.includes("fail") || statusStr.includes("cancel")) {
        // Skip normal cancelled unless it needs alert
        if (statusStr.includes("reject")) {
          alerts.push({
            order: o,
            type: "rejected",
            reason: "અરજી નામંજૂર થઈ છે (Order Rejected - Immediate Admin Audit Needed)",
            level: "critical",
            timestamp: createdStr,
          });
        }
      }

      // 3. Check for Hand-written Urgent client notes or admin comments
      const urgentKeywords = ["urgent", "emergency", "asap", "ખૂબ જ જરૂરી", "જરૂરી", "error", "missing", "delay", "તાત્કાલિક", "ભૂલ"];
      const isUrgentNote = urgentKeywords.some(kw => notesStr.includes(kw));

      if (isUrgentNote && !statusStr.includes("query") && !statusStr.includes("reject")) {
        alerts.push({
          order: o,
          type: "urgent_note",
          reason: `અહીં અરજી સાથે ગ્રાહકની ખાસ નોંધ છે: "${o.notes || o.Notes}"`,
          level: "warning",
          timestamp: createdStr,
        });
      }
    });

    // Sort by timestamp desc
    return alerts.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return isNaN(timeA) || isNaN(timeB) ? 0 : timeB - timeA;
    });
  }, [orders]);

  // Breakdown metrics
  const counts = useMemo(() => {
    return {
      all: alertItems.length,
      sla_deadline: alertItems.filter(a => a.type === "sla_deadline").length,
      query: alertItems.filter(a => a.type === "query").length,
      rejected: alertItems.filter(a => a.type === "rejected").length,
      urgent_note: alertItems.filter(a => a.type === "urgent_note").length,
    };
  }, [alertItems]);

  // Filter items based on active selection
  const filteredAlerts = useMemo(() => {
    if (filterType === "all") return alertItems;
    return alertItems.filter(a => a.type === filterType);
  }, [alertItems, filterType]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] shadow-sm overflow-hidden text-left transition-all duration-300">
      {/* Header Block */}
      <div className="p-6 flex items-center justify-between bg-gradient-to-r from-red-500/10 via-amber-500/5 to-transparent border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-100 dark:bg-rose-955/40 text-rose-600 dark:text-rose-400 rounded-2xl animate-pulse">
            <Bell size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest">
                Admin Alert Center (એડમિન એલર્ટ સેન્ટર)
              </h4>
              {counts.all > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full select-none">
                  {counts.all} Alerts
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Aggregated critical items requiring urgent manual intervention, correction, or audit
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
        >
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-6 space-y-6">
          {/* Triage Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                filterType === "all"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-500 hover:text-slate-700 dark:bg-slate-950 dark:text-slate-400 hover:bg-slate-100"
              }`}
            >
              📋 All Alerts ({counts.all})
            </button>
            <button
              onClick={() => setFilterType("sla_deadline")}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                filterType === "sla_deadline"
                  ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/20"
                  : "bg-rose-100/40 text-rose-700 hover:text-rose-900 dark:bg-rose-955/20 dark:text-rose-300"
              }`}
            >
              <Flame size={12} className={counts.sla_deadline > 0 ? "animate-pulse" : ""} />
              <span>SLA Deadlines ({counts.sla_deadline})</span>
            </button>
            <button
              onClick={() => setFilterType("query")}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                filterType === "query"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-amber-100/40 text-amber-600 hover:text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
              }`}
            >
              ⚠️ Queries Raised ({counts.query})
            </button>
            <button
              onClick={() => setFilterType("rejected")}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                filterType === "rejected"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-rose-100/40 text-rose-600 hover:text-rose-800 dark:bg-rose-955/20 dark:text-rose-450"
              }`}
            >
              🚫 Rejections ({counts.rejected})
            </button>
            <button
              onClick={() => setFilterType("urgent_note")}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                filterType === "urgent_note"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-blue-100/40 text-blue-600 hover:text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              }`}
            >
              💬 Urgent Notes ({counts.urgent_note})
            </button>
          </div>

          {/* List Feed */}
          {filteredAlerts.length === 0 ? (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-950/25">
              <Sparkles className="w-8 h-8 text-green-500 mx-auto mb-3 animate-pulse" />
              <h5 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                All Systems Clear!
              </h5>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                પોરટલ પર કોઈ પેન્ડિંગ કવેરી કે રીજેક્ટેડ એપ્લિકેશન નથી (No urgent issues detected)
              </p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredAlerts.map(({ order, type, reason, level, timestamp }, idx) => {
                const isCritical = level === "critical";
                return (
                  <div
                    key={`alert-${order.orderId || order.ID || 'ord'}-${type}-${idx}`}
                    onClick={() => onSelectOrder(order)}
                    className={`p-4 rounded-2xl border transition-all duration-200 hover:translate-x-1 hover:shadow-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 text-left ${
                      isCritical
                        ? "bg-rose-50/50 border-rose-100 hover:border-rose-350 dark:bg-rose-955/10 dark:border-rose-900/30"
                        : type === "query"
                        ? "bg-amber-50/50 border-amber-100 hover:border-amber-350 dark:bg-amber-950/15 dark:border-amber-900/30"
                        : "bg-indigo-50/20 border-indigo-100/60 hover:border-indigo-350 dark:bg-indigo-950/10 dark:border-indigo-900/30"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Left icon wrapper */}
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isCritical
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400"
                          : type === "query"
                          ? "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-450"
                      }`}>
                        {type === "sla_deadline" && <Flame size={16} className="animate-pulse" />}
                        {type === "rejected" && <ShieldAlert size={16} />}
                        {type === "query" && <AlertTriangle size={16} />}
                        {type === "urgent_note" && <MessageSquare size={16} />}
                      </div>

                      {/* Main explanation content */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {order.orderId || order.ID}
                          </span>
                          <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {order.serviceType || order.ServiceCategory || "General Service"}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            isCritical
                              ? "bg-rose-600 text-white"
                              : type === "query"
                              ? "bg-amber-500 text-white"
                              : "bg-indigo-600 text-white"
                          }`}>
                            {order.status || order.Status || "Flagged"}
                          </span>
                          <SlaPriorityBadge order={order} variant="compact" />
                        </div>

                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-1.5 leading-normal">
                          {reason}
                        </p>
                        
                        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center mt-2.5 text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                          <span>User: {order.email || order.UserEmail || "Guest"}</span>
                          <span>•</span>
                          <span>Logged: {timestamp && timestamp !== "N/A" ? new Date(timestamp).toLocaleString() : "Recently"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick navigation handle */}
                    <button
                      type="button"
                      className="flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-blue-600 border border-slate-200 dark:border-slate-750 px-3.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors cursor-pointer shrink-0"
                    >
                      <span>Action Gate</span>
                      <ExternalLink size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
