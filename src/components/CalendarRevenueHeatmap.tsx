import React, { useMemo, useState } from "react";
import { Flame, Info, TrendingUp, Calendar as CalendarIcon } from "lucide-react";

interface CalendarRevenueHeatmapProps {
  orders: any[];
}

export default function CalendarRevenueHeatmap({ orders }: CalendarRevenueHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ dateStr: string; revenue: number; count: number } | null>(null);

  // Parse orders for the last 365 days
  const heatmapData = useMemo(() => {
    const revenueMap = new Map<string, { revenue: number; count: number }>();
    const now = new Date();
    
    // Clear hours to start date boundary
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // 365 days ago inclusive

    // Populate all 365 days with 0 initial values
    const daysArray: { date: Date; dateStr: string; revenue: number; count: number }[] = [];
    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      daysArray.push({
        date: d,
        dateStr,
        revenue: 0,
        count: 0,
      });
      revenueMap.set(dateStr, { revenue: 0, count: 0 });
    }

    // Populate active revenue from actual orders (ignore cancelled ones)
    (orders || []).forEach((o: any) => {
      const status = String(o.status || o.Status || "").toLowerCase();
      if (status === "cancelled" || status === "rejected") return;

      const dateVal = o.Timestamp || o.timestamp || o.CreatedDate || o.Date || o.date;
      if (!dateVal) return;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return;

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      if (revenueMap.has(dateStr)) {
        const current = revenueMap.get(dateStr)!;
        const amtStr = o.amount || o.Amount || o.Rate || o.rate || "0";
        const amt = parseFloat(amtStr) || 0;
        
        revenueMap.set(dateStr, {
          revenue: current.revenue + amt,
          count: current.count + 1,
        });
      }
    });

    // Merge map back to sorted day structures
    let maxRevenueDay = { dateStr: "N/A", revenue: 0 };
    let totalRevenueSum = 0;
    let daysWithTransactions = 0;

    const populatedDays = daysArray.map((day) => {
      const stats = revenueMap.get(day.dateStr) || { revenue: 0, count: 0 };
      totalRevenueSum += stats.revenue;
      if (stats.count > 0) {
        daysWithTransactions += 1;
      }
      if (stats.revenue > maxRevenueDay.revenue) {
        maxRevenueDay = { dateStr: day.dateStr, revenue: stats.revenue };
      }
      return {
        ...day,
        revenue: parseFloat(stats.revenue.toFixed(2)),
        count: stats.count,
      };
    });

    // Group columns by week for contribution view
    // Create an array list representing the Sunday-Saturday rows
    const cols: { weekLabel: string | null; cells: typeof populatedDays }[] = [];
    let currentWeek: typeof populatedDays = [];

    populatedDays.forEach((day, index) => {
      const dayOfWeek = day.date.getDay(); // 0: Sun, 1: Mon, etc.

      // If it's Sunday and we already have some cells, push current week
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        // Label the first week of a month
        let weekLabel: string | null = null;
        if (currentWeek[0].date.getDate() <= 7) {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          weekLabel = monthNames[currentWeek[0].date.getMonth()];
        }
        cols.push({ weekLabel, cells: currentWeek });
        currentWeek = [];
      }

      currentWeek.push(day);

      // On final item, push remaining
      if (index === populatedDays.length - 1) {
        cols.push({ weekLabel: null, cells: currentWeek });
      }
    });

    // Month headers
    const monthHeaders: { label: string; colSpan: number }[] = [];
    let currentMonth = -1;
    let currentSpan = 0;

    cols.forEach((col) => {
      if (col.cells.length > 0) {
        const m = col.cells[0].date.getMonth();
        if (m !== currentMonth) {
          if (currentSpan > 0) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            monthHeaders.push({
              label: monthNames[currentMonth],
              colSpan: currentSpan,
            });
          }
          currentMonth = m;
          currentSpan = 1;
        } else {
          currentSpan += 1;
        }
      }
    });
    if (currentSpan > 0) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthHeaders.push({
        label: monthNames[currentMonth],
        colSpan: currentSpan,
      });
    }

    return {
      cols,
      monthHeaders,
      maxRevenueDay,
      totalRevenueSum: parseFloat(totalRevenueSum.toFixed(2)),
      daysWithTransactions,
      avgDailyRevenue: parseFloat((totalRevenueSum / 365).toFixed(2)),
    };
  }, [orders]);

  // Determine color base on revenue volume
  const getCellClassName = (revenue: number) => {
    if (revenue === 0) return "bg-slate-100 dark:bg-slate-800/40 border-slate-200/20";
    if (revenue <= 500) return "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200/30 text-emerald-800 dark:text-emerald-300";
    if (revenue <= 1500) return "bg-emerald-250 dark:bg-emerald-900/50 border-emerald-350/40 text-emerald-900 dark:text-emerald-200";
    if (revenue <= 5000) return "bg-emerald-400 dark:bg-emerald-700/60 border-emerald-500/50 text-white";
    return "bg-emerald-600 dark:bg-emerald-500 border-emerald-650 text-white animate-pulse";
  };

  const getWeekDayLabel = (rowIdx: number) => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return labels[rowIdx];
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 rounded-[2rem] shadow-sm text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100/60 dark:border-slate-800/60 pb-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest">
              Revenue Heatmap (લાસ્ટ ૩૬૫ દિવસ રેવન્યુ હીટમેપ)
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Visualizing daily transaction peaks, workflow seasonal density, and revenue concentrations
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 border border-slate-100 dark:border-slate-850 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <Flame size={12} className="text-amber-500" /> Peak Day: {heatmapData.maxRevenueDay.dateStr !== "N/A" ? `${heatmapData.maxRevenueDay.dateStr} (₹${heatmapData.maxRevenueDay.revenue})` : "N/A"}
        </div>
      </div>

      {/* Grid container with responsive horizontal scroll wrapper */}
      <div className="relative overflow-x-auto pb-4 pt-2 select-none scrollbar-thin">
        <div className="flex flex-col min-w-[760px] pb-2">
          {/* Month headers row */}
          <div className="flex pl-10 mb-2">
            {heatmapData.monthHeaders.map((hdr, idx) => {
              // Calculate width based on column span
              const colWidth = hdr.colSpan * 14.5; // col is roughly 14px wide
              return (
                <span
                  key={idx}
                  style={{ width: `${colWidth}px` }}
                  className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block shrink-0 text-left truncate"
                >
                  {hdr.label}
                </span>
              );
            })}
          </div>

          {/* Grid Rows (Days 0 to 6) */}
          <div className="flex flex-col gap-[3.5px]">
            {[0, 1, 2, 3, 4, 5, 6].map((rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-[3.5px]">
                {/* Weekday prefix label every other row */}
                <span className="w-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right pr-2 shrink-0">
                  {rowIdx % 2 === 1 ? getWeekDayLabel(rowIdx) : ""}
                </span>

                {/* Day Blocks */}
                {heatmapData.cols.map((col, colIdx) => {
                  const cell = col.cells.find((c) => c.date.getDay() === rowIdx);
                  if (!cell) {
                    // Empty spacer cell where calendar doesn't align
                    return (
                      <span
                        key={colIdx}
                        className="w-[11px] h-[11px] rounded-[3px] bg-transparent opacity-0 shrink-0"
                      />
                    );
                  }

                  return (
                    <div
                      key={colIdx}
                      onMouseEnter={() => setHoveredCell({ dateStr: cell.dateStr, revenue: cell.revenue, count: cell.count })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`w-[11px] h-[11px] rounded-[3px] border border-transparent transition-all duration-150 relative shrink-0 cursor-crosshair hover:scale-125 hover:border-slate-400 dark:hover:border-slate-500 z-10 ${getCellClassName(cell.revenue)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Absolute Floating Tooltip matching the premium styling of the portal */}
        {hoveredCell && (
          <div className="absolute top-0 right-4 bg-slate-900 border border-slate-750 dark:bg-black/95 dark:border-slate-850 px-4 py-2.5 rounded-xl text-white text-xs z-50 shadow-xl flex flex-col gap-0.5 animate-fadeIn max-w-[200px]">
            <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">
              {new Date(hoveredCell.dateStr).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="font-extrabold text-[12px] flex items-center justify-between gap-4">
              <span>Revenue:</span>
              <span className="text-emerald-400">₹{hoveredCell.revenue.toLocaleString()}</span>
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              {hoveredCell.count === 0 ? "No Transactions" : `${hoveredCell.count} Successful Order(s)`}
            </span>
          </div>
        )}
      </div>

      {/* Heatmap Legend and Performance Summary Section */}
      <div className="mt-6 pt-5 border-t border-slate-100/60 dark:border-slate-800/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Colors Legend */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-1">Less</span>
          <div className="w-3 h-3 bg-slate-100 dark:bg-slate-800/40 rounded-[2.5px]" />
          <div className="w-3 h-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-[2.5px]" />
          <div className="w-3 h-3 bg-emerald-250 dark:bg-emerald-900/50 rounded-[2.5px]" />
          <div className="w-3 h-3 bg-emerald-400 dark:bg-emerald-700/60 rounded-[2.5px]" />
          <div className="w-3 h-3 bg-emerald-600 dark:bg-emerald-500 rounded-[2.5px]" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">More</span>
        </div>

        {/* Heatmap mini insights list */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-left shrink-0">
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Annual Business Vol</span>
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase">₹{heatmapData.totalRevenueSum.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Active Service Days</span>
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase">{heatmapData.daysWithTransactions} of 365 Days</span>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Avg Daily Revenue</span>
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase">₹{heatmapData.avgDailyRevenue.toLocaleString()} / Day</span>
          </div>
        </div>
      </div>
    </div>
  );
}
