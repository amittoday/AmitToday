import React, { useState } from "react";
import { 
  AlertTriangle, 
  AlertOctagon, 
  Clock, 
  Flame, 
  Hourglass, 
  CheckCircle2, 
  Zap, 
  Info,
  Calendar
} from "lucide-react";
import { computeOrderSlaDeadline, SlaDeadlineInfo } from "../utils/slaPriorityUtils";

interface SlaPriorityBadgeProps {
  order: any;
  currentStatus?: string;
  variant?: "badge" | "compact" | "pill" | "banner";
  showTooltip?: boolean;
  className?: string;
}

export default function SlaPriorityBadge({
  order,
  currentStatus,
  variant = "badge",
  showTooltip = true,
  className = ""
}: SlaPriorityBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);
  const sla: SlaDeadlineInfo = computeOrderSlaDeadline(order, currentStatus);

  // Render appropriate Lucide icon based on level
  const renderIcon = (iconSize = 11) => {
    switch (sla.level) {
      case "BREACHED":
        return <AlertOctagon size={iconSize} className="text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />;
      case "CRITICAL":
        return <Flame size={iconSize} className="text-red-600 dark:text-red-400 shrink-0 animate-pulse" />;
      case "URGENT":
        return <Zap size={iconSize} className="text-amber-600 dark:text-amber-400 shrink-0" />;
      case "APPROACHING":
        return <Hourglass size={iconSize} className="text-yellow-700 dark:text-yellow-400 shrink-0" />;
      case "ON_TRACK":
        return <Clock size={iconSize} className="text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case "COMPLETED":
        return <CheckCircle2 size={iconSize} className="text-slate-400 dark:text-slate-500 shrink-0" />;
    }
  };

  // Tooltip content
  const tooltipContent = (
    <div 
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white rounded-2xl p-3 text-[10px] shadow-2xl border border-slate-700/80 z-[150] text-left animate-fadeIn pointer-events-none font-sans"
    >
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/80">
        <span className="font-black uppercase tracking-wider text-[9px] flex items-center gap-1.5">
          {renderIcon(12)}
          <span className={sla.theme.textClass}>{sla.badgeLabel}</span>
        </span>
        <span className="font-mono text-[9px] text-slate-400 font-bold">
          {sla.remainingFormatted}
        </span>
      </div>

      <div className="space-y-1.5 font-sans">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Calendar size={11} className="text-slate-400 shrink-0" />
          <span><strong>Deadline:</strong> {sla.deadlineDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
        </div>

        <div className="text-slate-300 pt-1 border-t border-slate-800 leading-snug">
          <p className="text-slate-300 font-medium">{sla.actionAdvice}</p>
        </div>
      </div>
    </div>
  );

  // Compact variant for dense tables
  if (variant === "compact") {
    return (
      <div 
        className={`relative inline-flex items-center ${className}`}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <div 
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border select-none transition-all ${sla.theme.badgeClass} ${sla.theme.ringClass}`}
          title={`SLA Deadline: ${sla.deadlineDate.toLocaleString()} (${sla.remainingFormatted})`}
        >
          {sla.theme.pulse && (
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sla.theme.dotClass}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${sla.theme.dotClass}`}></span>
            </span>
          )}
          {renderIcon(10)}
          <span className="font-mono tracking-tight font-extrabold">{sla.remainingFormatted}</span>
        </div>
        {showTooltip && showDetails && tooltipContent}
      </div>
    );
  }

  // Pill variant
  if (variant === "pill") {
    return (
      <div 
        className={`relative inline-flex items-center ${className}`}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <span 
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest border ${sla.theme.badgeClass} ${sla.theme.ringClass}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sla.theme.dotClass} ${sla.theme.pulse ? "animate-ping" : ""}`} />
          <span>{sla.badgeLabel}</span>
        </span>
        {showTooltip && showDetails && tooltipContent}
      </div>
    );
  }

  // Full banner variant (for modals or top-of-card notice)
  if (variant === "banner") {
    return (
      <div className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${sla.theme.bgClass} ${sla.theme.borderClass} ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${sla.theme.badgeClass}`}>
            {renderIcon(16)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                SLA Status:
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${sla.theme.badgeClass}`}>
                {sla.badgeLabel}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {sla.actionAdvice}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-mono shrink-0">
          <div className="flex flex-col text-right">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Target Deadline</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {sla.deadlineDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
          <div className="flex flex-col text-right">
            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Remaining</span>
            <span className={`font-black ${sla.theme.textClass}`}>
              {sla.remainingFormatted}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default "badge" variant: Complete visual priority badge with icon, label, and countdown
  return (
    <div 
      className={`relative inline-flex items-center cursor-help ${className}`}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase tracking-wider border transition-all select-none ${sla.theme.badgeClass} ${sla.theme.ringClass} ${sla.theme.pulse ? "animate-pulse" : ""}`}
      >
        {/* Pulsing beacon indicator for critical & breached */}
        {sla.theme.pulse ? (
          <span className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${sla.theme.dotClass}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${sla.theme.dotClass}`}></span>
          </span>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sla.theme.dotClass}`} />
        )}

        {renderIcon(11)}

        <span className="font-black tracking-wide">{sla.badgeLabel}</span>

        <span className="text-slate-300 dark:text-slate-600 font-normal">|</span>

        <span className="font-mono font-bold tracking-tight">{sla.remainingFormatted}</span>
      </div>

      {showTooltip && showDetails && tooltipContent}
    </div>
  );
}
