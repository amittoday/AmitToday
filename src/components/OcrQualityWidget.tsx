import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Fingerprint, Sliders, AlertTriangle, ShieldCheck, Sun, Info } from "lucide-react";

interface ScannerMetric {
  id: string;
  name: string;
  location: string;
  avgConfidence: number;
  scanCount: number;
  status: "optimal" | "warning" | "critical";
  lastActive: string;
}

export function OcrQualityWidget() {
  // Generate beautiful, realistic daily OCR confidence data over the last 30 days
  const confidenceData = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    // Simulate a subtle degradation trend or fluctuation (e.g. slight dip mid-month due to a dusty scanner)
    const baseValue = 88;
    const fluctuation = Math.sin(day / 2.5) * 4;
    const degradation = day > 15 ? -((day - 15) * 0.2) : 0;
    const finalValue = Math.min(100, Math.max(0, baseValue + fluctuation + degradation));

    return {
      day: `Day ${day}`,
      "Avg Confidence": parseFloat(finalValue.toFixed(1)),
      "Target Threshold": 85,
    };
  });

  const scanners: ScannerMetric[] = [
    {
      id: "SCN-01",
      name: "Canon imageFORMULA",
      location: "Front Desk Admin A",
      avgConfidence: 94.8,
      scanCount: 142,
      status: "optimal",
      lastActive: "Just now",
    },
    {
      id: "SCN-02",
      name: "HP ScanJet Enterprise",
      location: "Processing Center B",
      avgConfidence: 91.2,
      scanCount: 98,
      status: "optimal",
      lastActive: "15m ago",
    },
    {
      id: "SCN-03",
      name: "Fujitsu ScanSnap",
      location: "Backoffice Desk C",
      avgConfidence: 83.5,
      scanCount: 76,
      status: "warning",
      lastActive: "2h ago",
    },
    {
      id: "SCN-04",
      name: "Mobile Scan Feed (In-App)",
      location: "Customer Portal API",
      avgConfidence: 74.3,
      scanCount: 215,
      status: "critical",
      lastActive: "1m ago",
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-8 text-left mt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div>
          <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
            Scanner Hardware Diagnostics
          </span>
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-2">
            📊 Quality Metrics: OCR Confidence & Calibration Trends
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
            Track average scan fidelity over the last 30 days to preemptively diagnose dirty glass or faulty scanner setups.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Sun size={14} className="text-amber-500 animate-spin" style={{ animationDuration: "10s" }} />
          Ambient Lighting Check: Stable
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Area Chart (Left) */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            30-Day Aggregate OCR Confidence Curve
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={confidenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} domain={[60, 100]} tickFormatter={(v) => `${v}%`} />
                <RechartsTooltip
                  formatter={(value) => [`${value}%`, "Aggregate Accuracy"]}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Avg Confidence"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Target Threshold"
                  stroke="#EF4444"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scanner breakdown / quality status (Right) */}
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Scanner Fleet Quality & Calibration Status
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {scanners.map((sc) => (
              <div
                key={sc.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate">
                      {sc.name}
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 shrink-0">
                      {sc.id}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                    {sc.location} • Last active: {sc.lastActive}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                      sc.status === "optimal"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : sc.status === "warning"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 animate-pulse"
                    }`}
                  >
                    {sc.avgConfidence}% Avg
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Actionable Diagnostic Alert Block */}
      <div className="bg-rose-50 dark:bg-rose-950/20 rounded-3xl border border-rose-100 dark:border-rose-900/30 p-5 flex flex-col sm:flex-row items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-rose-600 dark:text-rose-400 shadow-sm shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h5 className="text-xs font-black uppercase text-rose-800 dark:text-rose-400 tracking-wider">
            Critical Calibration Alerts Found
          </h5>
          <p className="text-xs text-rose-600 dark:text-rose-300 font-bold mt-1 leading-normal">
            <strong>Customer Portal API Scanner (SCN-04)</strong> has fallen below the 85% target threshold (Current: 74.3%). Ambient shadows or low-light capture by customer smartphones are corrupting OCR read cycles.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="bg-white dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 px-3 py-1 rounded-lg shadow-sm">
              Action Required: Enable Low-light auto-contrast enhancement
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
