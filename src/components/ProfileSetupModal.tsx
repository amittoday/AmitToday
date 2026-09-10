import React, { useState, useEffect } from "react";
import { 
  User, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Briefcase,
  FileBadge,
  GraduationCap
} from "lucide-react";
import { calculateAge, formatToYYYYMMDD } from "../utils/ageUtils";
import axios from "axios";
import { toast } from "sonner";

interface ProfileSetupModalProps {
  isOpen: boolean;
  currentUser: any;
  onProfileUpdated: (updatedUser: any) => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({
  isOpen,
  currentUser,
  onProfileUpdated,
}) => {
  const initialName = String(currentUser?.name || currentUser?.Name || "").trim();
  const initialMobile = String(currentUser?.mobile || currentUser?.Mobile || "").trim();
  const initialDob = formatToYYYYMMDD(currentUser?.dob || currentUser?.DOB || currentUser?.dateOfBirth || currentUser?.["Date of Birth"] || "");
  const initialAccountType = String(currentUser?.accountType || currentUser?.AccountType || "General").trim();
  const initialSanadNumber = String(currentUser?.sanadNumber || currentUser?.SanadNumber || "").trim();

  const [name, setName] = useState(initialName);
  const [mobile, setMobile] = useState(initialMobile);
  const [dob, setDob] = useState(initialDob);
  const [accountType, setAccountType] = useState<"Student" | "General" | "Advocate" | "">(
    ["Student", "General", "Advocate"].includes(initialAccountType) ? (initialAccountType as any) : "General"
  );
  const [sanadNumber, setSanadNumber] = useState(initialSanadNumber);
  const [parentalConsent, setParentalConsent] = useState(
    currentUser?.parentalConsent === true || currentUser?.ParentalConsent === true
  );
  
  const [calculatedAge, setCalculatedAge] = useState<number>(() => calculateAge(initialDob));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ 
    name?: string; 
    mobile?: string; 
    dob?: string; 
    accountType?: string; 
    sanadNumber?: string; 
    consent?: string;
    advocateAge?: string;
  }>({});

  // Sync internal state when currentUser changes or modal opens
  useEffect(() => {
    if (currentUser) {
      const n = String(currentUser.name || currentUser.Name || "").trim();
      const m = String(currentUser.mobile || currentUser.Mobile || "").trim();
      const rawD = currentUser.dob || currentUser.DOB || currentUser.dateOfBirth || currentUser["Date of Birth"] || "";
      const d = formatToYYYYMMDD(rawD);
      const a = String(currentUser.accountType || currentUser.AccountType || "General").trim();
      const s = String(currentUser.sanadNumber || currentUser.SanadNumber || "").trim();
      setName(n);
      setMobile(m);
      setDob(d);
      setAccountType(["Student", "General", "Advocate"].includes(a) ? (a as any) : "General");
      setSanadNumber(s);
      setParentalConsent(currentUser.parentalConsent === true || currentUser.ParentalConsent === true);
      setCalculatedAge(calculateAge(d));
      setErrors({});
    }
  }, [currentUser, isOpen]);

  // Recalculate age whenever DOB changes
  useEffect(() => {
    if (dob) {
      const standardDob = formatToYYYYMMDD(dob);
      const age = calculateAge(standardDob);
      setCalculatedAge(age);
      if (age >= 18) {
        setParentalConsent(true);
      } else if (age < 18 && age > 0) {
        setParentalConsent(currentUser?.parentalConsent === true);
      }
    } else {
      setCalculatedAge(0);
    }
  }, [dob, currentUser?.parentalConsent]);

  if (!isOpen || !currentUser) return null;

  const isUnderage = dob ? calculatedAge < 18 : false;

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "પૂરું નામ જરૂરી છે (Full name is required, min 2 chars)";
    }

    const cleanMobile = mobile.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10) {
      newErrors.mobile = "10 આંકડાનો મોબાઇલ નંબર દાખલ કરો (Valid 10-digit mobile number required)";
    }

    const standardDob = formatToYYYYMMDD(dob);
    if (!standardDob) {
      newErrors.dob = "જન્મ તારીખ પસંદ કરો (Date of Birth is required in YYYY-MM-DD format)";
    } else {
      const selectedDate = new Date(standardDob);
      const today = new Date();
      if (isNaN(selectedDate.getTime()) || selectedDate >= today) {
        newErrors.dob = "અમાન્ય જન્મ તારીખ (Valid past birth date required)";
      }
    }

    if (!accountType) {
      newErrors.accountType = "એકાઉન્ટ પ્રકાર પસંદ કરો (Please select an Account Type)";
    }

    // Advocate validation: Age >= 21 & mandatory Sanad number
    if (accountType === "Advocate") {
      if (!sanadNumber.trim() || sanadNumber.trim().length < 2) {
        newErrors.sanadNumber = "સનદ / નોંધણી નંબર જરૂરી છે (Sanad / Enrollment Number is required)";
      }
      if (dob && calculatedAge < 21) {
        newErrors.advocateAge = "Invalid age for Advocate profile. Advocates must be at least 21 years of age.";
      }
    }

    // Minor consent check
    if (isUnderage && !parentalConsent) {
      newErrors.consent = "You must accept the legal parental consent checkbox before submitting.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const cleanMobile = mobile.replace(/\D/g, "");
    const standardizedDob = formatToYYYYMMDD(dob);
    const ageVal = calculateAge(standardizedDob);

    const payload = {
      name: name.trim(),
      mobile: cleanMobile,
      dob: standardizedDob,
      DOB: standardizedDob,
      age: ageVal,
      calculatedAge: ageVal,
      accountType: accountType || "General",
      sanadNumber: accountType === "Advocate" ? sanadNumber.trim() : "",
      isProfileComplete: true,
      IsProfileComplete: true,
      parentalConsent: ageVal < 18 ? parentalConsent : true,
    };

    try {
      const savedToken = localStorage.getItem("aos_token") || currentUser.token;
      
      if (savedToken) {
        await axios.post(
          "/api/user/update-profile",
          payload,
          { headers: { Authorization: `Bearer ${savedToken}` } }
        ).catch((err) => {
          console.warn("[ProfileSetupModal] Backend save warning:", err.message);
        });
      }

      // Sync updated user state locally with standardized DOB format
      const updatedUser = {
        ...currentUser,
        ...payload,
        Name: payload.name,
        Mobile: payload.mobile,
        DOB: standardizedDob,
        dob: standardizedDob,
        Age: ageVal,
        AccountType: payload.accountType,
        SanadNumber: payload.sanadNumber,
        IsProfileComplete: true,
        isProfileComplete: true,
        ParentalConsent: payload.parentalConsent,
        parentalConsent: payload.parentalConsent,
      };

      localStorage.setItem("aos_user", JSON.stringify(updatedUser));
      if (localStorage.getItem("user")) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      toast.success("પ્રોફાઇલ સફળતાપૂર્વક સાચવવામાં આવી! (Profile setup completed successfully!)");
      
      onProfileUpdated(updatedUser);
    } catch (err: any) {
      console.error("Error updating user profile:", err);
      toast.error("પ્રોફાઇલ અપડેટ કરવામાં નિષ્ફળતા. (Failed to save profile.)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-300 transform scale-100 my-auto">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white relative">
          <div className="absolute top-4 right-4 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-xs font-bold tracking-wide flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Mandatory Setup</span>
          </div>

          <div className="flex items-center gap-3.5 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                પ્રોફાઇલ અને ખાતાનો પ્રકાર
              </h2>
              <p className="text-blue-100 text-xs font-medium">
                Complete Your Mandatory Legal Profile Setup
              </p>
            </div>
          </div>

          <p className="text-xs text-blue-50/90 leading-relaxed mt-3 bg-black/15 p-2.5 rounded-xl border border-white/10">
            અમારી સેવાઓ (Typing, Translation, Notary) નો ઉપયોગ કરવા માટે તમારી વિગતો, એકાઉન્ટ પ્રકાર અને જન્મ તારીખ દાખલ કરવી ફરજિયાત છે.
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Account Type Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>એકાઉન્ટ પ્રકાર (Account Type) *</span>
            </label>
            <div className="relative">
              <select
                required
                value={accountType}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setAccountType(val);
                  if (errors.accountType) setErrors((prev) => ({ ...prev, accountType: undefined }));
                  if (errors.advocateAge) setErrors((prev) => ({ ...prev, advocateAge: undefined }));
                  if (errors.sanadNumber) setErrors((prev) => ({ ...prev, sanadNumber: undefined }));
                }}
                className={`w-full px-4 py-3 text-sm font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border ${
                  errors.accountType
                    ? "border-red-500 focus:ring-2 focus:ring-red-400"
                    : "border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                } outline-none text-slate-900 dark:text-white transition-all cursor-pointer`}
              >
                <option value="General">General (સામાન્ય નાગરિક)</option>
                <option value="Student">Student (વિદ્યાર્થી)</option>
                <option value="Advocate">Advocate (વકીલ / એડવોકેટ)</option>
              </select>
            </div>
            {errors.accountType && (
              <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" /> {errors.accountType}
              </p>
            )}
          </div>

          {/* Full Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>પૂરું નામ (Full Name) *</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="દા.ત. અમિતકુમાર પટેલ (e.g. Amit Patel)"
                className={`w-full px-4 py-3 text-sm font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border ${
                  errors.name
                    ? "border-red-500 focus:ring-2 focus:ring-red-400"
                    : "border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                } outline-none text-slate-900 dark:text-white transition-all`}
              />
            </div>
            {errors.name && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
          </div>

          {/* Mobile Number Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>મોબાઇલ નંબર (10-Digit Mobile) *</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                +91
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setMobile(val);
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
                }}
                placeholder="9876543210"
                className={`w-full pl-16 pr-4 py-3 text-sm font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border ${
                  errors.mobile
                    ? "border-red-500 focus:ring-2 focus:ring-red-400"
                    : "border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                } outline-none text-slate-900 dark:text-white transition-all`}
              />
            </div>
            {errors.mobile && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.mobile}</p>}
          </div>

          {/* Date of Birth Picker & Real-time Age */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>જન્મ તારીખ (Date of Birth) *</span>
              </label>

              {dob && calculatedAge > 0 && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  isUnderage 
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/50" 
                    : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50"
                }`}>
                  {isUnderage ? <ShieldAlert className="w-3 h-3 text-amber-600" /> : <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  <span>{calculatedAge} વર્ષ ({isUnderage ? "ઉંમર < 18" : "18+ પુખ્ત"})</span>
                </span>
              )}
            </div>

            <input
              type="date"
              required
              max={new Date().toISOString().split("T")[0]}
              value={dob || ""}
              onChange={(e) => {
                const formatted = formatToYYYYMMDD(e.target.value);
                setDob(formatted || e.target.value);
                if (errors.dob) setErrors((prev) => ({ ...prev, dob: undefined }));
                if (errors.advocateAge) setErrors((prev) => ({ ...prev, advocateAge: undefined }));
              }}
              className={`w-full px-4 py-3 text-sm font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border ${
                errors.dob || errors.advocateAge
                  ? "border-red-500 focus:ring-2 focus:ring-red-400"
                  : "border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              } outline-none text-slate-900 dark:text-white transition-all cursor-pointer`}
            />
            {errors.dob && <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.dob}</p>}
            {errors.advocateAge && (
              <p className="text-xs font-black text-red-600 dark:text-red-400 flex items-center gap-1 mt-1 bg-red-50 dark:bg-red-950/50 p-2 rounded-xl border border-red-200 dark:border-red-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.advocateAge}</span>
              </p>
            )}
          </div>

          {/* Advocate Specific Field: Sanad / Enrollment Number */}
          {accountType === "Advocate" && (
            <div className="space-y-1.5 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-4 rounded-2xl transition-all animate-fadeIn">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <FileBadge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>સનદ / નોંધણી નંબર (Sanad / Enrollment Number) *</span>
              </label>
              <input
                type="text"
                required={accountType === "Advocate"}
                value={sanadNumber}
                onChange={(e) => {
                  setSanadNumber(e.target.value);
                  if (errors.sanadNumber) setErrors((prev) => ({ ...prev, sanadNumber: undefined }));
                }}
                placeholder="G/1234/2020 (Sanad Number)"
                className={`w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-slate-800 border ${
                  errors.sanadNumber
                    ? "border-red-500 focus:ring-2 focus:ring-red-400"
                    : "border-blue-300 dark:border-blue-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                } outline-none text-slate-900 dark:text-white transition-all`}
              />
              {errors.sanadNumber && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.sanadNumber}
                </p>
              )}
            </div>
          )}

          {/* Under 18 Dynamic Legal Consent Checkbox */}
          {dob && isUnderage && (
            <div className="bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400/80 dark:border-amber-700/80 rounded-2xl p-4 transition-all animate-fadeIn">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="parentalConsentCheck"
                  checked={parentalConsent}
                  onChange={(e) => {
                    setParentalConsent(e.target.checked);
                    if (errors.consent) setErrors((prev) => ({ ...prev, consent: undefined }));
                  }}
                  className="mt-1 w-5 h-5 text-blue-600 rounded-md border-amber-400 focus:ring-amber-500 cursor-pointer shrink-0"
                />
                <label htmlFor="parentalConsentCheck" className="text-xs font-bold text-amber-950 dark:text-amber-200 leading-snug cursor-pointer">
                  "I am under 18 years of age. I confirm that I am using this platform and authorizing payments under the direct supervision and consent of my parent or legal guardian."
                </label>
              </div>
              {errors.consent && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mt-2.5 pl-8">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.consent}
                </p>
              )}
            </div>
          )}

          {/* Save Profile Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || (isUnderage && !parentalConsent) || (accountType === "Advocate" && calculatedAge > 0 && calculatedAge < 21)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>સાચવી રહ્યા છીએ... (Saving Profile...)</span>
                </>
              ) : (
                <>
                  <span>પ્રોફાઇલ સાચવો અને આગળ વધો (Save Profile & Continue)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupModal;

