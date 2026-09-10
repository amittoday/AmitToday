export type ActionCategory = 'AUTH' | 'PAYMENT' | 'FAILED' | 'ORDER' | 'SYSTEM';

/**
 * Categorizes system logs based on keywords like 'AUTH', 'PAYMENT', or 'FAILED'.
 * Fallbacks to 'ORDER' or 'SYSTEM' when applicable.
 */
export function determineActionCategory(log: any): ActionCategory {
  if (!log) return 'SYSTEM';
  
  // If already explicitly set and valid, respect it
  const existingCat = log.ActionCategory || log.actionCategory;
  if (existingCat && ['AUTH', 'PAYMENT', 'FAILED', 'ORDER', 'SYSTEM'].includes(String(existingCat).toUpperCase())) {
    return String(existingCat).toUpperCase() as ActionCategory;
  }

  const action = String(log.Action || log.action || log.event || log.Message || log.message || '').toUpperCase();
  const details = String(
    typeof log.Details === 'object'
      ? JSON.stringify(log.Details)
      : (typeof log.details === 'object' ? JSON.stringify(log.details) : log.Details || log.details || '')
  ).toUpperCase();
  const status = String(log.Status || log.status || '').toUpperCase();
  const combined = `${action} ${details} ${status}`;

  // 1. FAILED keyword check (highest priority: failures, errors, denials, crashes)
  if (
    combined.includes('FAILED') ||
    combined.includes('FAILURE') ||
    combined.includes('FAIL') ||
    combined.includes('ERROR') ||
    combined.includes('ERR_') ||
    combined.includes('EXCEPTION') ||
    combined.includes('DENIED') ||
    combined.includes('REJECTED') ||
    combined.includes('TIMEOUT') ||
    combined.includes('BLOCKED') ||
    combined.includes('CRASH') ||
    combined.includes('ABORTED') ||
    status === 'FAILED'
  ) {
    return 'FAILED';
  }

  // 2. PAYMENT keyword check (Razorpay, transactions, invoices, billing, refunds)
  if (
    combined.includes('PAYMENT') ||
    combined.includes('PAY') ||
    combined.includes('PAID') ||
    combined.includes('RAZORPAY') ||
    combined.includes('TRANSACTION') ||
    combined.includes('INVOICE') ||
    combined.includes('REFUND') ||
    combined.includes('BILLING') ||
    combined.includes('CHECKOUT') ||
    combined.includes('GATEWAY') ||
    combined.includes('FEE')
  ) {
    return 'PAYMENT';
  }

  // 3. AUTH keyword check (Authentication, login, token, session, OTP, password, credentials, 2FA)
  if (
    combined.includes('AUTH') ||
    combined.includes('LOGIN') ||
    combined.includes('SIGNIN') ||
    combined.includes('LOGOUT') ||
    combined.includes('TOKEN') ||
    combined.includes('PASSWORD') ||
    combined.includes('SESSION') ||
    combined.includes('OTP') ||
    combined.includes('CREDENTIAL') ||
    combined.includes('VERIFY') ||
    combined.includes('OAUTH') ||
    combined.includes('2FA') ||
    combined.includes('PRIVILEGE') ||
    combined.includes('ROLE_CHANGE')
  ) {
    return 'AUTH';
  }

  // 4. ORDER keyword check (Order creation, tracking, printing, typing, affidavits, notarization)
  if (
    combined.includes('ORDER') ||
    combined.includes('NOTARY') ||
    combined.includes('DOCUMENT') ||
    combined.includes('SERVICE') ||
    combined.includes('TYPING') ||
    combined.includes('TRANSLATION') ||
    combined.includes('APPLICATION') ||
    combined.includes('DISPATCH') ||
    combined.includes('UPLOAD') ||
    combined.includes('DOWNLOAD') ||
    combined.includes('PRINT')
  ) {
    return 'ORDER';
  }

  // 5. Default fallback to SYSTEM
  return 'SYSTEM';
}

export const CATEGORY_STYLES: Record<ActionCategory, {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}> = {
  AUTH: {
    label: 'AUTH',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40',
    dotClass: 'bg-indigo-500',
    description: 'Logins, Tokens, Passwords, Sessions, OTPs & 2FA'
  },
  PAYMENT: {
    label: 'PAYMENT',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
    dotClass: 'bg-emerald-500',
    description: 'Razorpay, Invoices, Billing, Transactions & Receipts'
  },
  FAILED: {
    label: 'FAILED',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40',
    dotClass: 'bg-rose-500',
    description: 'System Errors, Rejected Transactions, Auth Failures & Timeouts'
  },
  ORDER: {
    label: 'ORDER',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
    dotClass: 'bg-amber-500',
    description: 'Order Updates, Notary Drafting, Typing & Document Processing'
  },
  SYSTEM: {
    label: 'SYSTEM',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-500',
    description: 'Database Maintenance, Routine Telemetry & Health Checks'
  }
};
