export type SlaPriorityLevel = 
  | "BREACHED"     // Deadline passed (Overdue)
  | "CRITICAL"     // < 4 hours remaining
  | "URGENT"       // 4h - 12h remaining
  | "APPROACHING"   // 12h - 24h remaining
  | "ON_TRACK"     // > 24 hours remaining
  | "COMPLETED";   // Order completed / delivered / archived

export interface SlaDeadlineInfo {
  level: SlaPriorityLevel;
  priorityWeight: number; // 1 (highest urgency) to 6 (lowest/completed)
  deadlineDate: Date;
  remainingMs: number;
  isOverdue: boolean;
  isApproaching: boolean;
  isCritical: boolean;
  remainingFormatted: string;
  badgeLabel: string;
  badgeSubtitle: string;
  actionAdvice: string;
  theme: {
    badgeClass: string;
    dotClass: string;
    ringClass: string;
    borderClass: string;
    textClass: string;
    bgClass: string;
    pulse: boolean;
  };
}

/**
 * Robust date parser helper for disparate order date schemas
 */
function parseOrderCreatedTimestamp(order: any): number {
  if (!order) return Date.now();
  const rawDate = 
    order.createdAt || 
    order.CreatedAt || 
    order.timestamp || 
    order.Timestamp || 
    order.date || 
    order.Date;

  if (rawDate) {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  // Check if Order ID contains a unix timestamp (e.g. ORD-1725324567890 or 1725324567890)
  const idStr = String(order.orderId || order.ID || order.ApplicationID || "");
  const numMatch = idStr.match(/\d{10,13}/);
  if (numMatch) {
    const ts = parseInt(numMatch[0], 10);
    const validTs = ts < 10000000000 ? ts * 1000 : ts;
    const testDate = new Date(validTs);
    if (!isNaN(testDate.getTime()) && testDate.getFullYear() >= 2020 && testDate.getFullYear() <= 2030) {
      return validTs;
    }
  }

  return Date.now();
}

/**
 * Computes exact SLA deadline, remaining duration, priority tier, and styling metadata.
 */
export function computeOrderSlaDeadline(order: any, currentStatus?: string): SlaDeadlineInfo {
  const statusStr = String(currentStatus || order?.status || order?.Status || "").trim().toLowerCase();
  const isArchived = Boolean(order?.archived);

  const isCompleted = 
    isArchived ||
    statusStr.includes("complete") || 
    statusStr.includes("done") || 
    statusStr.includes("delivered") || 
    statusStr.includes("verified") ||
    statusStr.includes("cancel") ||
    statusStr.includes("reject");

  // Determine SLA baseline hours based on order urgency & service profile
  const notesStr = String(order?.notes || order?.Notes || "").toLowerCase();
  const priorityStr = String(order?.priority || order?.Priority || "").toLowerCase();
  const serviceStr = String(order?.serviceType || order?.ServiceCategory || order?.ServiceType || "").toLowerCase();
  
  const isUrgent = 
    priorityStr === "urgent" || 
    priorityStr === "high" ||
    order?.isUrgent === true || 
    notesStr.includes("[urgent]") || 
    notesStr.includes("urgent") || 
    notesStr.includes("emergency") || 
    notesStr.includes("tatkal") ||
    notesStr.includes("express") ||
    serviceStr.includes("tatkal") ||
    serviceStr.includes("express");

  const isComplexFiling = 
    serviceStr.includes("affidavit") || 
    serviceStr.includes("notary") || 
    serviceStr.includes("gazette") || 
    serviceStr.includes("deed") || 
    serviceStr.includes("gov");

  // Default SLA time windows: Urgent = 12h, Complex = 48h, Standard = 24h
  const defaultSlaHours = isUrgent ? 12 : isComplexFiling ? 48 : 24;

  const createdMs = parseOrderCreatedTimestamp(order);

  // Check explicit deadline fields
  const explicitDueRaw = 
    order?.due_date || 
    order?.DueDate || 
    order?.dueDate || 
    order?.deadline || 
    order?.deliveryDeadline || 
    order?.SlaDeadline || 
    order?.slaDeadline ||
    order?.due_time ||
    order?.DueTime;

  let deadlineDate: Date;
  if (explicitDueRaw) {
    const parsedExplicit = new Date(explicitDueRaw);
    if (!isNaN(parsedExplicit.getTime())) {
      deadlineDate = parsedExplicit;
    } else {
      deadlineDate = new Date(createdMs + defaultSlaHours * 60 * 60 * 1000);
    }
  } else {
    deadlineDate = new Date(createdMs + defaultSlaHours * 60 * 60 * 1000);
  }

  if (isCompleted) {
    return {
      level: "COMPLETED",
      priorityWeight: 6,
      deadlineDate,
      remainingMs: 0,
      isOverdue: false,
      isApproaching: false,
      isCritical: false,
      remainingFormatted: "SLA Met",
      badgeLabel: "SLA MET",
      badgeSubtitle: "Fulfillment complete",
      actionAdvice: "No further action required. Order fulfilled within SLA window.",
      theme: {
        badgeClass: "bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border-slate-200 dark:border-slate-700",
        dotClass: "bg-emerald-500",
        ringClass: "",
        borderClass: "border-slate-200 dark:border-slate-800",
        textClass: "text-slate-600 dark:text-slate-400",
        bgClass: "bg-slate-50 dark:bg-slate-900/30",
        pulse: false
      }
    };
  }

  const nowMs = Date.now();
  const remainingMs = deadlineDate.getTime() - nowMs;
  const isOverdue = remainingMs <= 0;
  const absMs = Math.abs(remainingMs);

  const totalMinutes = Math.floor(absMs / (1000 * 60));
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const days = Math.floor(totalHours / 24);
  const hoursMod = totalHours % 24;

  let remainingFormatted = "";
  if (isOverdue) {
    if (totalHours >= 24) {
      remainingFormatted = `-${days}d ${hoursMod}h overdue`;
    } else if (totalHours > 0) {
      remainingFormatted = `-${totalHours}h ${remainingMinutes}m overdue`;
    } else {
      remainingFormatted = `-${Math.max(1, remainingMinutes)}m overdue`;
    }
  } else {
    if (totalHours >= 24) {
      remainingFormatted = `${days}d ${hoursMod}h left`;
    } else if (totalHours > 0) {
      remainingFormatted = `${totalHours}h ${remainingMinutes}m left`;
    } else {
      remainingFormatted = `${Math.max(1, remainingMinutes)}m left`;
    }
  }

  // Priority Tiers
  if (isOverdue) {
    return {
      level: "BREACHED",
      priorityWeight: 1,
      deadlineDate,
      remainingMs,
      isOverdue: true,
      isApproaching: true,
      isCritical: true,
      remainingFormatted,
      badgeLabel: "SLA BREACHED",
      badgeSubtitle: `Overdue by ${remainingFormatted.replace('-', '')}`,
      actionAdvice: "⚠️ CRITICAL ESCALATION: Order deadline has passed. Immediate staff processing required!",
      theme: {
        badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-250 border-rose-450 dark:border-rose-700 shadow-[0_0_12px_rgba(244,63,94,0.35)]",
        dotClass: "bg-rose-500",
        ringClass: "ring-2 ring-rose-500/40",
        borderClass: "border-rose-400 dark:border-rose-700/80",
        textClass: "text-rose-600 dark:text-rose-300",
        bgClass: "bg-rose-50/60 dark:bg-rose-950/20",
        pulse: true
      }
    };
  }

  // Critical: < 4 hours remaining
  if (remainingMs <= 4 * 60 * 60 * 1000) {
    return {
      level: "CRITICAL",
      priorityWeight: 2,
      deadlineDate,
      remainingMs,
      isOverdue: false,
      isApproaching: true,
      isCritical: true,
      remainingFormatted,
      badgeLabel: "CRITICAL < 4H",
      badgeSubtitle: "Deadline approaching rapidly",
      actionAdvice: "🔥 URGENT ATTENTION: Less than 4 hours remaining. Prioritize document verification immediately.",
      theme: {
        badgeClass: "bg-red-100 text-red-900 dark:bg-red-950/70 dark:text-red-200 border-red-500 dark:border-red-600 shadow-[0_0_10px_rgba(239,68,68,0.25)]",
        dotClass: "bg-red-500",
        ringClass: "ring-2 ring-red-400/30",
        borderClass: "border-red-400 dark:border-red-700/70",
        textClass: "text-red-600 dark:text-red-300",
        bgClass: "bg-red-50/50 dark:bg-red-950/15",
        pulse: true
      }
    };
  }

  // Urgent: 4h to 12h remaining
  if (remainingMs <= 12 * 60 * 60 * 1000) {
    return {
      level: "URGENT",
      priorityWeight: 3,
      deadlineDate,
      remainingMs,
      isOverdue: false,
      isApproaching: true,
      isCritical: false,
      remainingFormatted,
      badgeLabel: "EXPIRING < 12H",
      badgeSubtitle: "Approaching SLA target",
      actionAdvice: "⚡ EXPEDITE TASK: Approaching deadline within 12h. Assign to staff review queue.",
      theme: {
        badgeClass: "bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border-amber-400 dark:border-amber-600",
        dotClass: "bg-amber-500",
        ringClass: "ring-1 ring-amber-400/30",
        borderClass: "border-amber-300 dark:border-amber-700/60",
        textClass: "text-amber-700 dark:text-amber-300",
        bgClass: "bg-amber-50/40 dark:bg-amber-950/10",
        pulse: false
      }
    };
  }

  // Approaching: 12h to 24h remaining
  if (remainingMs <= 24 * 60 * 60 * 1000) {
    return {
      level: "APPROACHING",
      priorityWeight: 4,
      deadlineDate,
      remainingMs,
      isOverdue: false,
      isApproaching: true,
      isCritical: false,
      remainingFormatted,
      badgeLabel: "DUE TODAY",
      badgeSubtitle: "Due within 24 hours",
      actionAdvice: "⏳ IN SCHEDULE: Due today. Keep on active verification workflow.",
      theme: {
        badgeClass: "bg-yellow-50 text-yellow-850 dark:bg-yellow-950/50 dark:text-yellow-250 border-yellow-400/80 dark:border-yellow-600/70",
        dotClass: "bg-yellow-500",
        ringClass: "",
        borderClass: "border-yellow-200 dark:border-yellow-800/40",
        textClass: "text-yellow-800 dark:text-yellow-300",
        bgClass: "bg-yellow-50/30 dark:bg-yellow-950/10",
        pulse: false
      }
    };
  }

  // On Track: > 24 hours remaining
  return {
    level: "ON_TRACK",
    priorityWeight: 5,
    deadlineDate,
    remainingMs,
    isOverdue: false,
    isApproaching: false,
    isCritical: false,
    remainingFormatted,
    badgeLabel: "ON TRACK",
    badgeSubtitle: "Within standard SLA window",
    actionAdvice: "✓ NORMAL PRIORITY: Order is progressing comfortably within target SLA window.",
    theme: {
      badgeClass: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700",
      dotClass: "bg-emerald-500",
      ringClass: "",
      borderClass: "border-emerald-100 dark:border-emerald-900/30",
      textClass: "text-emerald-700 dark:text-emerald-400",
      bgClass: "bg-emerald-50/20 dark:bg-emerald-950/5",
      pulse: false
    }
  };
}

/**
 * Calculate aggregate counts for all SLA priority buckets
 */
export function getSlaPriorityBreakdown(orders: any[]) {
  const counts = {
    all: orders.length,
    breached: 0,
    critical: 0,
    urgent: 0,
    approaching: 0,
    onTrack: 0,
    completed: 0,
    totalCriticalAndApproaching: 0,
  };

  orders.forEach((o) => {
    const sla = computeOrderSlaDeadline(o);
    switch (sla.level) {
      case "BREACHED":
        counts.breached++;
        counts.totalCriticalAndApproaching++;
        break;
      case "CRITICAL":
        counts.critical++;
        counts.totalCriticalAndApproaching++;
        break;
      case "URGENT":
        counts.urgent++;
        counts.totalCriticalAndApproaching++;
        break;
      case "APPROACHING":
        counts.approaching++;
        break;
      case "ON_TRACK":
        counts.onTrack++;
        break;
      case "COMPLETED":
        counts.completed++;
        break;
    }
  });

  return counts;
}
