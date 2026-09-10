import React from "react";
import { QueueRecord } from "../services/api";
import { RefreshCw, CheckCircle2, Clock, AlertTriangle, Database } from "lucide-react";

interface EntryQueueManagerProps {
  records: QueueRecord[];
  loading: boolean;
  onRefresh?: () => void;
  lastSyncedTime?: string | null;
}

export const getStatusBadgeClass = (status: string): string => {
  const normalized = (status || "").toLowerCase().trim();
  if (normalized === "pending" || normalized === "queued" || normalized === "processing") {
    return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60";
  }
  if (normalized === "completed" || normalized === "success" || normalized === "approved" || normalized === "done") {
    return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60";
  }
  if (normalized === "failed" || normalized === "rejected" || normalized === "error" || normalized === "cancelled") {
    return "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60";
  }
  return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60";
};

export const getStatusIcon = (status: string) => {
  const normalized = (status || "").toLowerCase().trim();
  if (normalized === "pending" || normalized === "queued" || normalized === "processing") {
    return <Clock size={12} className="text-amber-600 dark:text-amber-400 animate-pulse" />;
  }
  if (normalized === "completed" || normalized === "success" || normalized === "approved" || normalized === "done") {
    return <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" />;
  }
  if (normalized === "failed" || normalized === "rejected" || normalized === "error" || normalized === "cancelled") {
    return <AlertTriangle size={12} className="text-rose-600 dark:text-rose-400" />;
  }
  return <Database size={12} className="text-blue-600 dark:text-blue-400" />;
};

export default function EntryQueueManager({
  records,
  loading,
  onRefresh,
  lastSyncedTime,
}: EntryQueueManagerProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm text-left space-y-4" id="entry-queue-manager-container">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Database size={16} className="text-blue-600 dark:text-blue-400" />
            <span>Google Sheets Entry Queue Manager</span>
            <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-800">
              Live Polling Active
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time synchronization with Google Apps Script Web App dataset
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastSyncedTime && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Last Synced: {lastSyncedTime}
            </span>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              title="Sync with Google Sheets Now"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th className="py-2.5 px-3">Record ID</th>
              <th className="py-2.5 px-3">Applicant Name</th>
              <th className="py-2.5 px-3">Service Name</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading && records.length === 0 ? (
              // Skeleton Loading State
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse">
                  <td className="py-3 px-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-36" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
                  </td>
                  <td className="py-3 px-3">
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                  </td>
                </tr>
              ))
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                  No queue records found in Google Sheets data stream.
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {rec.id}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {rec.applicantName}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {rec.serviceName}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${getStatusBadgeClass(
                        rec.status
                      )}`}
                    >
                      {getStatusIcon(rec.status)}
                      {rec.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                    {rec.timestamp}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
