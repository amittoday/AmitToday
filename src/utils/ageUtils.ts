/**
 * Age calculation and profile completion helpers
 * Enforces strict YYYY-MM-DD ISO date standard for Date of Birth (DOB)
 */

/**
 * Standardize any Date, ISO string, timestamp, or localized date string into strict 'YYYY-MM-DD'
 */
export function formatToYYYYMMDD(val?: string | Date | number | null): string {
  if (!val && val !== 0) return "";

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return "";
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  if (!str) return "";

  // Already standard YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // ISO string with time component (e.g. 1995-05-15T00:00:00.000Z or 1995-05-15 00:00:00)
  if (/^\d{4}-\d{2}-\d{2}[T\s]/.test(str)) {
    return str.substring(0, 10);
  }

  // YYYY/MM/DD or YYYY.MM.DD
  if (/^\d{4}[/.]\d{1,2}[/.]\d{1,2}/.test(str)) {
    const parts = str.split(/[/.]/);
    const y = parts[0];
    const m = parts[1].padStart(2, "0");
    const d = parts[2].substring(0, 2).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (Common in Indian format)
  if (/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{4}/.test(str)) {
    const parts = str.split(/[/\-.]/);
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2].substring(0, 4);
    return `${year}-${month}-${day}`;
  }

  // Fallback to JS Date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return "";
}

export function calculateAge(dob?: string | Date | null): number {
  if (!dob) return 0;
  const standardDob = formatToYYYYMMDD(dob);
  if (!standardDob) return 0;

  const [y, m, d] = standardDob.split("-").map(Number);
  if (!y || !m || !d) return 0;

  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = (today.getMonth() + 1) - m;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age--;
  }

  return age < 0 ? 0 : age;
}

export function isUserProfileComplete(user: any): boolean {
  if (!user || !user.email) return true; // If user is not logged in, don't force modal interceptor
  
  const name = String(user.name || user.Name || "").trim();
  const mobile = String(user.mobile || user.Mobile || "").trim();
  const rawDob = user.dob || user.DOB || user.dateOfBirth || user["Date of Birth"] || "";
  const dob = formatToYYYYMMDD(rawDob);
  const accountType = String(user.accountType || user.AccountType || "").trim();
  const sanadNumber = String(user.sanadNumber || user.SanadNumber || "").trim();
  const parentalConsent = user.parentalConsent === true || user.ParentalConsent === true || user.parentalConsent === "true";

  // Calculate age
  const age = calculateAge(dob);

  // Check if essential fields exist and are valid (Name >= 2 chars, 10-digit mobile, valid YYYY-MM-DD DOB)
  const hasValidName = name.length >= 2 && name !== "Guest_User" && name !== "Customer";
  const hasValidMobile = mobile.replace(/\D/g, "").length >= 10;
  const hasValidDob = Boolean(dob && /^\d{4}-\d{2}-\d{2}$/.test(dob));
  const hasValidAccountType = !accountType || ["Student", "General", "Advocate"].includes(accountType);

  // If underage, must have parental consent
  const hasValidMinorConsent = age >= 18 || parentalConsent;

  // Advocate strict check: must be >= 21 and have a Sanad / Enrollment number if Advocate is chosen
  const hasValidAdvocate = accountType !== "Advocate" || (age >= 21 && sanadNumber.length >= 2);

  // Strict check: Name, Mobile, and Standardized DOB are mandatory
  const isComplete = hasValidName && hasValidMobile && hasValidDob && hasValidAccountType && hasValidMinorConsent && hasValidAdvocate;

  return isComplete;
}

