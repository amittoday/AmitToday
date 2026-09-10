import React from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { PieChart as PieIcon, TrendingUp, Layers } from "lucide-react";

interface OrderItem {
  serviceType?: string;
  ServiceType?: string;
  ServiceCategory?: string;
  Category?: string;
  service?: string;
  amount?: number;
  Amount?: number;
  [key: string]: any;
}

interface AdminServicesPieChartProps {
  orders: OrderItem[];
  className?: string;
}

const COLORS = [
  "#2563eb", // Blue (Translation)
  "#7c3aed", // Violet (Typing & Drafting)
  "#059669", // Emerald (Notary Services)
  "#d97706", // Amber (Govt Online Applications)
  "#db2777", // Pink (Legal Affidavits)
  "#0891b2", // Cyan (E-Stamping)
  "#475569", // Slate (Other)
];

export default function AdminServicesPieChart({ orders, className = "" }: AdminServicesPieChartProps) {
  // Aggregate orders by service category / type
  const data = React.useMemo(() => {
    const counts: Record<string, { count: number; totalRevenue: number }> = {};

    orders.forEach((o) => {
      let rawType = (
        o.serviceType ||
        o.ServiceType ||
        o.ServiceCategory ||
        o.Category ||
        o.service ||
        "General Document Service"
      ).trim();

      // Normalize into primary categories
      let category = "General Services";
      const lower = rawType.toLowerCase();
      if (lower.includes("translation") || lower.includes("ભાષાંતર") || lower.includes("translate")) {
        category = "Legal Translation";
      } else if (lower.includes("typing") || lower.includes("draft") || lower.includes("લખાણ")) {
        category = "Typing & Drafting";
      } else if (lower.includes("notary") || lower.includes("નોટરી")) {
        category = "Notary Public Filing";
      } else if (lower.includes("affidavit") || lower.includes("સોગંદનામું") || lower.includes("agreement")) {
        category = "Legal Affidavits & Deeds";
      } else if (lower.includes("online") || lower.includes("gov") || lower.includes("સરકારી")) {
        category = "Online Govt Services";
      } else if (lower.includes("stamp") || lower.includes("સ્ટેમ્પ")) {
        category = "E-Stamping & Seals";
      } else {
        category = rawType.length > 24 ? rawType.slice(0, 22) + "..." : rawType;
      }

      const amt = Number(o.amount || o.Amount || 0);

      if (!counts[category]) {
        counts[category] = { count: 0, totalRevenue: 0 };
      }
      counts[category].count += 1;
      counts[category].totalRevenue += amt;
    });

    const list = Object.entries(counts).map(([name, stat]) => ({
      name,
      value: stat.count,
      revenue: stat.totalRevenue,
    }));

    // If empty, provide sample illustrative breakdown
    if (list.length === 0) {
      return [
        { name: "Legal Translation", value: 34, revenue: 17000 },
        { name: "Typing & Drafting", value: 48, revenue: 24000 },
        { name: "Notary Public Filing", value: 26, revenue: 26000 },
        { name: "Online Govt Services", value: 18, revenue: 9000 },
        { name: "Legal Affidavits & Deeds", value: 16, revenue: 8000 },
      ];
    }

    return list.sort((a, b) => b.value - a.value);
  }, [orders]);

  const totalOrders = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const pct = totalOrders > 0 ? ((item.value / totalOrders) * 100).toFixed(1) : "0";
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs z-50">
          <p className="font-bold text-sm text-blue-400">{item.name}</p>
          <div className="mt-1 space-y-0.5 text-slate-200">
            <p>Orders: <span className="font-bold text-white">{item.value}</span> ({pct}%)</p>
            {item.revenue > 0 && (
              <p>Revenue: <span className="font-bold text-emerald-400">₹{item.revenue.toLocaleString("en-IN")}</span></p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="admin-services-pie-chart-card"
      className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <PieIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Service Distribution Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Translation vs. Typing vs. Notary & Online Applications ({totalOrders} Total)
            </p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          Real-Time Volume
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mt-4">
        {/* Chart View */}
        <div className="lg:col-span-7 h-64 sm:h-72 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Breakdown List */}
        <div className="lg:col-span-5 space-y-2 max-h-72 overflow-y-auto pr-1">
          {data.map((item, index) => {
            const color = COLORS[index % COLORS.length];
            const pct = totalOrders > 0 ? ((item.value / totalOrders) * 100).toFixed(0) : "0";
            return (
              <div
                key={item.name}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 dark:bg-slate-950/50 dark:hover:bg-slate-800/60 transition-all border border-slate-200/50 dark:border-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {item.value}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
