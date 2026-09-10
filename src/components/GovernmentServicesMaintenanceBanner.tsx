import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Hammer, ShieldAlert, ArrowRight, X, Headphones, CheckCircle, RefreshCw } from "lucide-react";

interface StatusDetail {
  system: string;
  systemGu: string;
  status: "active" | "maintenance";
  detail: string;
  detailGu: string;
}

interface GovernmentServicesMaintenanceBannerProps {
  lang: string;
}

export default function GovernmentServicesMaintenanceBanner({ lang }: GovernmentServicesMaintenanceBannerProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [checking, setChecking] = useState(false);

  const systems: StatusDetail[] = [
    {
      system: "Language Translation Center",
      systemGu: "ભાષા ભાષાંતર કેન્દ્ર",
      status: "active",
      detail: "Operational - High speed document scanning is fully active.",
      detailGu: "કાર્યરત - હાઇ સ્પીડ ડોક્યુમેન્ટ સ્કેનિંગ સંપૂર્ણપણે સક્રિય છે."
    },
    {
      system: "Bilingual Typing Services",
      systemGu: "દ્વિભાષીય ટાઈપિંગ સેવાઓ",
      status: "active",
      detail: "Operational - Document generation is fully ready.",
      detailGu: "કાર્યરત - દસ્તાવેજ જનરેશન પ્રક્રિયા સક્રિય છે."
    },
    {
      system: "Government Schemes & Online Forms",
      systemGu: "સરકારી યોજનાઓ અને ઓનલાઇન ફોર્મ્સ",
      status: "maintenance",
      detail: "Undergoing routine scheduled update by authorities.",
      detailGu: "સત્તાવાળાઓ દ્વારા વહીવટી પોર્ટલ પર સુનિશ્ચિત સુધારો ચાલુ છે."
    },
    {
      system: "Payment Verification Gateway",
      systemGu: "ચુકવણી ચકાસણી ગેટવે",
      status: "active",
      detail: "Operational - Auto-sync active.",
      detailGu: "કાર્યરત - સ્વયં-ચાલિત સિંક સક્રિય."
    }
  ];

  const handleContactSupport = () => {
    const contactSection = document.getElementById("contact-form-section");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "#contact-form-section";
    }
  };

  const handleCheckStatusRealtime = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setShowStatusModal(true);
    }, 850);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-gradient-to-r from-amber-500/10 via-amber-600/15 to-amber-500/10 dark:from-amber-950/20 dark:via-amber-800/20 dark:to-amber-950/20 border-b border-amber-500/25 dark:border-amber-500/10 px-4 xl:px-12 py-3.5 flex justify-center items-center transition-all shadow-sm"
        id="gov-maintenance-banner"
      >
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-white p-2 rounded-xl animate-pulse">
              <AlertTriangle size={15} />
            </div>
            <div>
              <p className="font-sans font-black text-amber-800 dark:text-amber-400">
                {lang === "gu" 
                  ? "સરકારી ઓનલાઇન અરજી સેવાઓમાં હંગામી જાળવણી (Maintenance) ચાલુ છે." 
                  : "Government Online Application services are currently undergoing scheduled maintenance."}
              </p>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-400/70 font-medium mt-0.5">
                {lang === "gu" 
                  ? "અન્ય તમામ સેવાઓ (અનુવાદ અને ટાઈપિંગ) સંપૂર્ણપણે કાર્યરત છે. સમયસર પૂર્ણ કરવામાં આવશે." 
                  : "All other translation and typing services are fully operational without any interruptions."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCheckStatusRealtime}
              disabled={checking}
              className="bg-amber-600 hover:bg-amber-700 text-white font-black uppercase text-[9px] tracking-wider px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={10} className={checking ? "animate-spin" : ""} />
              {lang === "gu" ? "સ્ટેટસ તપાસો" : "Check Status"}
            </button>
            <button
              onClick={handleContactSupport}
              className="bg-white/80 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black uppercase text-[9px] tracking-wider px-3.5 py-2 rounded-lg transition-all border border-amber-500/20 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Headphones size={10} />
              {lang === "gu" ? "સપોર્ટ સંપર્ક" : "Contact Support"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Real-time System Status Modal */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-amber-500" size={22} />
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-sans">
                    {lang === "gu" ? "સિસ્ટમ ઓપરેશનલ સ્ટેટસ" : "Detailed System Status"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="p-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {systems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.status === "active"
                        ? "bg-emerald-500/5 border-emerald-500/10 dark:bg-emerald-950/10 dark:border-emerald-500/15"
                        : "bg-amber-500/5 border-amber-500/10 dark:bg-amber-950/15 dark:border-amber-500/15"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                        {lang === "gu" ? item.systemGu : item.system}
                      </h4>
                      <span className={`inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full ${
                        item.status === "active"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400"
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${item.status === "active" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                        {item.status === "active" ? "ONLINE" : "MAINTENANCE"}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                      {lang === "gu" ? item.detailGu : item.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans text-slate-500 dark:text-slate-400">
                <span>
                  {lang === "gu" ? "અપડેટ મેળવેલ છે: લાઈવ" : "Last checked: Just now (Live)"}
                </span>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    handleContactSupport();
                  }}
                  className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline uppercase text-[10px] tracking-wider flex items-center gap-1"
                >
                  {lang === "gu" ? "સહાયક ટીમનો સંપર્ક કરો" : "Contact Support Team"} <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
