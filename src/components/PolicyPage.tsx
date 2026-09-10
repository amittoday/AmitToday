import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useLanguage } from "../LanguageContext";
import { POLICY_CONTENT } from "../data/legalPolicies";
import { ChevronRight, Shield, Calendar, ArrowLeft } from "lucide-react";

export default function PolicyPage() {
  const { policyName } = useParams<{ policyName: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const policy = useMemo(() => {
    if (!policyName) return null;
    return POLICY_CONTENT[policyName] || null;
  }, [policyName]);

  const fallbackPolicy = useMemo(() => {
    return {
      title: "Policy Not Found",
      titleGu: "નીતિ મળી નથી",
      date: "June 2026",
      icon: <Shield size={24} />,
      sections: [
        {
          num: 1,
          title: "Select a Valid Legal Policy",
          titleGu: "કૃપા કરીને યોગ્ય નીતિ પસંદ કરો",
          content: "The policy document you are looking for does not exist or has been moved. Please navigate using the links available in the footer.",
          contentGu: "તમે જે નીતિ દસ્તાવેજ શોધી રહ્યા છો તે અસ્તિત્વમાં નથી અથવા તેને ખસેડવામાં આવ્યો છે. કૃપા કરીને ફૂટરમાં ઉપલબ્ધ લિંક્સનો ઉપયોગ કરો."
        }
      ]
    };
  }, []);

  const activePolicy = policy || fallbackPolicy;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 pt-28 px-4"
    >
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 mb-8 text-xs font-black uppercase tracking-widest transition-all group cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {lang === "gu" ? "પાછા હોમ પેજ પર" : "Back to Home"}
        </button>

        {/* Professional Document Style Container */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-xl border border-slate-100 dark:border-slate-800 p-8 md:p-14 relative overflow-hidden transition-colors duration-300">
          
          {/* Header Section */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-8 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                {activePolicy.icon || <Shield size={28} />}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-sans">
                  {lang === "gu" ? activePolicy.titleGu : activePolicy.title}
                </h1>
                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                  <Calendar size={12} /> {lang === "gu" ? "આખરી સુધારો:" : "Last Updated:"} {activePolicy.date}
                </p>
              </div>
            </div>
            
            {/* Stamp badge */}
            <div className="self-start md:self-center border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              {lang === "gu" ? "સત્તાવાર નીતિ" : "Official Policy"}
            </div>
          </div>

          {/* Document Sections Content */}
          <div className="space-y-12">
            {activePolicy.sections.map((section: any, idx: number) => (
              <div key={idx} className="group flex gap-4 md:gap-6 items-start">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-black shrink-0">
                  {section.num || idx + 1}
                </div>
                <div className="space-y-3 pt-1">
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                    {lang === "gu" ? section.titleGu : section.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    {lang === "gu" ? section.contentGu : section.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 mt-14 pt-8 text-center">
            <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold tracking-widest leading-relaxed">
              {lang === "gu" 
                ? "જો તમને આ નીતિઓ અંગે કોઈ પ્રશ્ન હોય, તો તમે અમારા સંપર્ક વિભાગ દ્વારા અમારો સંપર્ક કરી શકો છો."
                : "If you have any questions regarding these policies, feel free to contact us through our official support center."}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
