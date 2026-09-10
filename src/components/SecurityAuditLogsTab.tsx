import React, { useState, useEffect } from "react";
import { Shield, Search, Filter, Download, Trash2, RefreshCw, AlertTriangle, CheckCircle, Clock, User, FileText, Lock, Key, CreditCard, Cpu } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { determineActionCategory, CATEGORY_STYLES, ActionCategory } from "../utils/logCategorizer";

export interface AuditLogEntry {
  id: string;
  action: string;
  actionCategory?: ActionCategory;
  ActionCategory?: ActionCategory;
  adminEmail: string;
  details: string;
  timestamp: string;
  resourceId?: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  ipAddress?: string;
}

const INITIAL_LOGS: AuditLogEntry[] = [
  {
    id: "sec_1001",
    action: "BULK_STATUS_UPDATE",
    actionCategory: "ORDER",
    ActionCategory: "ORDER",
    adminEmail: "admin@amitservices.com",
    details: "Updated 4 orders to status 'Processing' via Bulk Actions panel",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleString(),
    resourceId: "Batch #104",
    status: "SUCCESS",
    ipAddress: "103.211.54.12"
  },
  {
    id: "sec_1002",
    action: "USER_ROLE_CHANGE",
    actionCategory: "AUTH",
    ActionCategory: "AUTH",
    adminEmail: "superadmin@amitservices.com",
    details: "Granted 'Staff' privileges to account staff.gujarat@amitservices.com",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(),
    resourceId: "USR_8892",
    status: "SUCCESS",
    ipAddress: "103.211.54.12"
  },
  {
    id: "sec_1003",
    action: "BATCH_PRINT",
    actionCategory: "ORDER",
    ActionCategory: "ORDER",
    adminEmail: "admin@amitservices.com",
    details: "Compiled and batch-printed consolidated PDF for 6 selected documents",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toLocaleString(),
    resourceId: "Vault Batch",
    status: "SUCCESS",
    ipAddress: "103.211.54.12"
  },
  {
    id: "sec_1004",
    action: "ORDER_ARCHIVE",
    actionCategory: "ORDER",
    ActionCategory: "ORDER",
    adminEmail: "staff.gujarat@amitservices.com",
    details: "Archived Order #AOS-9081 (Completed translation)",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString(),
    resourceId: "AOS-9081",
    status: "SUCCESS",
    ipAddress: "110.227.18.9"
  },
  {
    id: "sec_1005",
    action: "SECURITY_AUTH_FAIL",
    actionCategory: "FAILED",
    ActionCategory: "FAILED",
    adminEmail: "unknown@attempt.org",
    details: "Failed admin authorization code verification attempt",
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toLocaleString(),
    resourceId: "Auth Endpoint",
    status: "FAILED",
    ipAddress: "185.220.101.5"
  }
];

export function logSecurityAction(
  action: string,
  details: string,
  adminEmail = "admin@amitservices.com",
  resourceId = "System",
  status: "SUCCESS" | "WARNING" | "FAILED" = "SUCCESS"
) {
  try {
    const existingStr = localStorage.getItem("security_audit_logs") || "[]";
    let existing: AuditLogEntry[] = JSON.parse(existingStr);
    if (!Array.isArray(existing) || existing.length === 0) {
      existing = INITIAL_LOGS;
    }
    const cat = determineActionCategory({ Action: action, Details: details, Status: status });
    const newEntry: AuditLogEntry = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      actionCategory: cat,
      ActionCategory: cat,
      adminEmail,
      details,
      timestamp: new Date().toLocaleString(),
      resourceId,
      status,
      ipAddress: "103.211.54.12"
    };
    existing.unshift(newEntry);
    localStorage.setItem("security_audit_logs", JSON.stringify(existing));
    window.dispatchEvent(new Event("security_audit_logs_updated"));
  } catch (e) {
    console.warn("Failed to record security audit log:", e);
  }
}

export default function SecurityAuditLogsTab({ user }: { user?: any }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadLogs = () => {
    try {
      const stored = localStorage.getItem("security_audit_logs");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLogs(parsed);
          return;
        }
      }
      localStorage.setItem("security_audit_logs", JSON.stringify(INITIAL_LOGS));
      setLogs(INITIAL_LOGS);
    } catch (e) {
      setLogs(INITIAL_LOGS);
    }
  };

  useEffect(() => {
    loadLogs();
    const handleUpdate = () => loadLogs();
    window.addEventListener("security_audit_logs_updated", handleUpdate);
    return () => window.removeEventListener("security_audit_logs_updated", handleUpdate);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(query) ||
      log.adminEmail.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(query));

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;

    return matchesSearch && matchesAction && matchesStatus;
  });

  const handleExportPDF = () => {
    if (filteredLogs.length === 0) {
      toast.error("No security logs to export.");
      return;
    }

    try {
      const doc = new jsPDF();

      // Header
      doc.setFillColor(15, 23, 42); // Dark Slate
      doc.rect(0, 0, 210, 36, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("AMIT ONLINE SERVICES - SECURITY AUDIT LOGS", 14, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(226, 232, 240);
      doc.text(`Official Platform Security Compliance Audit Report`, 14, 22);
      doc.text(`Generated On: ${new Date().toLocaleString()} | Administrator: ${user?.email || "Admin"}`, 14, 28);

      const tableData = filteredLogs.map((log, index) => [
        String(index + 1),
        log.timestamp,
        log.action,
        log.adminEmail,
        log.resourceId || "N/A",
        log.details,
        log.status
      ]);

      autoTable(doc, {
        startY: 42,
        margin: { left: 14, right: 14 },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 32 },
          2: { cellWidth: 30 },
          3: { cellWidth: 35 },
          4: { cellWidth: 20 },
          5: { cellWidth: 40 },
          6: { cellWidth: 15 },
        },
        head: [["#", "Timestamp", "Action", "Admin Email", "Resource", "Details", "Status"]],
        body: tableData,
      });

      doc.save(`Security_Audit_Logs_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Security audit logs exported to PDF successfully!");
    } catch (err: any) {
      toast.error("Failed to export security logs PDF: " + err.message);
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error("No security logs to export.");
      return;
    }

    try {
      const headers = ["#", "ID", "Timestamp", "Action Type", "Administrator", "Resource ID", "Details", "Status", "IP Address"];
      const rows = filteredLogs.map((log, index) => [
        String(index + 1),
        `"${log.id.replace(/"/g, '""')}"`,
        `"${log.timestamp.replace(/"/g, '""')}"`,
        `"${log.action.replace(/"/g, '""')}"`,
        `"${log.adminEmail.replace(/"/g, '""')}"`,
        `"${(log.resourceId || "N/A").replace(/"/g, '""')}"`,
        `"${log.details.replace(/"/g, '""')}"`,
        `"${log.status}"`,
        `"${(log.ipAddress || "").replace(/"/g, '""')}"`
      ]);

      const csvString = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Activity_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Security activity logs exported to CSV successfully!");
    } catch (err: any) {
      toast.error("Failed to export activity logs CSV: " + err.message);
    }
  };

  const handleClearLogs = () => {
    if (window.confirm("Are you sure you want to clear all security audit logs? This action is logged for compliance.")) {
      localStorage.setItem("security_audit_logs", "[]");
      setLogs([]);
      logSecurityAction("AUDIT_LOGS_CLEARED", "Administrator cleared historical security audit logs", user?.email || "Admin");
      toast.success("Security audit logs cleared.");
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Tab Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  Security Audit Logs Dashboard
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Real-time compliance ledger tracking sensitive admin operations, bulk updates, and role modifications.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportCSV}
              id="export-activity-logs-csv"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Download size={14} /> Export Activity Log (CSV)
            </button>
            <button
              onClick={handleExportPDF}
              id="export-security-logs-pdf"
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Download size={14} /> Export Audit PDF
            </button>
            <button
              onClick={handleClearLogs}
              id="clear-security-logs-btn"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer"
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, email or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Quick Filter: All | Error Only | Info Only */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setActionFilter("ALL");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "ALL" && actionFilter === "ALL"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("FAILED");
                setActionFilter("ALL");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "FAILED"
                  ? "bg-red-500 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-red-500"
              }`}
            >
              Error Only
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("SUCCESS");
                setActionFilter("ALL");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "SUCCESS"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-500"
              }`}
            >
              Info Only
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white outline-none cursor-pointer"
            >
              <option value="ALL">All Action Types</option>
              <option value="BULK_STATUS_UPDATE">Bulk Status Updates</option>
              <option value="USER_ROLE_CHANGE">User Role Changes</option>
              <option value="BATCH_PRINT">Batch Print Jobs</option>
              <option value="ORDER_ARCHIVE">Order Archival</option>
              <option value="AUDIT_LOGS_CLEARED">System Audit Changes</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white outline-none cursor-pointer"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">Success Only (Info)</option>
            <option value="FAILED">Failures Only (Errors)</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-500 cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Lock size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-xs font-bold uppercase tracking-wider">No matching security audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Action Type</th>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {filteredLogs.map((log) => {
                  const category = log.ActionCategory || log.actionCategory || determineActionCategory(log);
                  const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES.SYSTEM;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${catStyle.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dotClass}`} />
                          {category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold">
                        <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg text-[10px] uppercase font-black border border-blue-200 dark:border-blue-900/40">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {log.adminEmail}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {log.resourceId || "System"}
                      </td>
                      <td className="py-3.5 px-4 font-medium max-w-xs text-slate-600 dark:text-slate-400">
                        {log.details}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {log.status === "SUCCESS" ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle size={11} /> SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <AlertTriangle size={11} /> FAILED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
