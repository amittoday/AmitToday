/**
 * Centralized date and amount parsing utilities for AOS application.
 * Safely parses dates from Google Sheets, ISO strings, timestamps, and various header formats.
 */

export interface ParsedAosDateResult {
  dateObj: Date | null;
  formatted: string;
  iso: string;
}

export function parseAosDate(rawInput: any): ParsedAosDateResult {
  let val: any = rawInput;

  // If a full object (like an order) is passed, extract raw date field
  if (rawInput && typeof rawInput === "object" && !(rawInput instanceof Date)) {
    val =
      rawInput.createdAt ||
      rawInput.CreatedAt ||
      rawInput["Created At"] ||
      rawInput["created at"] ||
      rawInput.created_at ||
      rawInput.date ||
      rawInput.Date ||
      rawInput.timestamp ||
      rawInput.Timestamp ||
      rawInput["Filing Date"] ||
      rawInput["Submitted Date"] ||
      rawInput.createdDate ||
      rawInput.CreatedDate ||
      null;

    if (!val) {
      for (const key of Object.keys(rawInput)) {
        const kClean = key.toLowerCase().replace(/[\s_\-]/g, "");
        if (kClean.includes("date") || kClean.includes("time") || kClean.includes("created")) {
          if (rawInput[key]) {
            val = rawInput[key];
            break;
          }
        }
      }
    }
  }

  if (val === null || val === undefined || val === "") {
    return { dateObj: null, formatted: "Recently", iso: "" };
  }

  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return {
        dateObj: val,
        formatted: val.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        iso: val.toISOString(),
      };
    }
    return { dateObj: null, formatted: "Recently", iso: "" };
  }

  let parsed: Date | null = null;

  if (typeof val === "number") {
    if (val > 30000 && val < 60000) {
      // Google Sheets serial date number
      parsed = new Date((val - 25569) * 86400 * 1000);
    } else {
      parsed = new Date(val);
    }
  } else if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed) {
      const d1 = new Date(trimmed);
      if (!isNaN(d1.getTime())) {
        parsed = d1;
      } else {
        // Match DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
        if (dmyMatch) {
          const day = parseInt(dmyMatch[1], 10);
          const month = parseInt(dmyMatch[2], 10) - 1;
          let year = parseInt(dmyMatch[3], 10);
          if (year < 100) year += 2000;
          const d2 = new Date(year, month, day);
          if (!isNaN(d2.getTime())) {
            parsed = d2;
          }
        }
      }
    }
  }

  if (parsed && !isNaN(parsed.getTime())) {
    return {
      dateObj: parsed,
      formatted: parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      iso: parsed.toISOString(),
    };
  }

  return { dateObj: null, formatted: "Recently", iso: "" };
}

export function parseAosAmount(rawInput: any): number {
  if (typeof rawInput === "number") return isNaN(rawInput) ? 0 : rawInput;

  if (rawInput && typeof rawInput === "object") {
    const val =
      rawInput.paidAmount ??
      rawInput.PaidAmount ??
      rawInput.amountPaid ??
      rawInput.AmountPaid ??
      rawInput.amount ??
      rawInput.Amount ??
      rawInput["Fee Paid"] ??
      rawInput["fee paid"] ??
      rawInput["Fee"] ??
      rawInput["fee"] ??
      rawInput["Total"] ??
      rawInput["total"] ??
      rawInput.totalAmount ??
      rawInput.TotalAmount ??
      rawInput.price ??
      rawInput.Price ??
      rawInput.rate ??
      rawInput.Rate;

    if (val !== undefined && val !== null) {
      return parseAosAmount(val);
    }

    for (const k of Object.keys(rawInput)) {
      const kClean = k.toLowerCase().replace(/[\s_\-]/g, "");
      if (kClean.includes("amount") || kClean.includes("paid") || kClean.includes("fee") || kClean.includes("total") || kClean.includes("price") || kClean.includes("rate")) {
        const parsed = parseAosAmount(rawInput[k]);
        if (parsed > 0) return parsed;
      }
    }
    return 0;
  }

  if (typeof rawInput === "string") {
    const cleaned = rawInput.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}
