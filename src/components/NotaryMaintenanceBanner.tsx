import React from "react";
import { Scale, Hammer, ShieldAlert, Headphones, RefreshCw, CheckCircle2, Clock } from "lucide-react";

interface NotaryMaintenanceBannerProps {
  lang?: string;
  onRefresh?: () => void;
}

export default function NotaryMaintenanceBanner({ lang = "en", onRefresh }: NotaryMaintenanceBannerProps) {
  const content = {
    en: {
      badge: "Maintenance Protocol Active",
      title: "Central Notary Public Portal Under Scheduled Maintenance",
      subtitle: "The Central Notary Public registration module and AI OCR document verification pipeline are temporarily offline for routine legal ledger maintenance and authority portal sync.",
      statusCardTitle: "Active Security & Data Safeguards",
      safeguard1Title: "Submitted Applications Intact",
      safeguard1Desc: "All previously submitted notary applications, ARN records, and uploaded documents remain 100% cryptographically safe and saved.",
      safeguard2Title: "AI OCR Pipeline Upgrading",
      safeguard2Desc: "Our automated bilingual document extraction and digital seal verification engines are being updated with improved accuracy models.",
      safeguard3Title: "Verification Desk On Standby",
      safeguard3Desc: "Administrative and advocate verification desks will resume processing incoming filings immediately upon system reboot.",
      refreshBtn: "Check Portal Status",
      contactSupport: "Contact Help Desk"
    },
    gu: {
      badge: "જાળવણી પ્રોટોકોલ સક્રિય",
      title: "સેન્ટ્રલ નોટરી પબ્લિક પોર્ટલ સુનિશ્ચિત જાળવણી હેઠળ છે",
      subtitle: "સેન્ટ્રલ નોટરી પબ્લિક નોંધણી મોડ્યુલ અને AI OCR દસ્તાવેજ ચકાસણી સિસ્ટમ રૂટિન લીગલ લેજર મેન્ટેનન્સ અને સરકારી પોર્ટલ સિંક માટે ક્ષણિક ધોરણે બંધ છે.",
      statusCardTitle: "સક્રિય સુરક્ષા અને ડેટા સલામતી",
      safeguard1Title: "સબમિટ કરેલી અરજીઓ સંપૂર્ણપણે સુરક્ષિત",
      safeguard1Desc: "તમામ અગાઉ સબમિટ કરેલી નોટરી અરજીઓ, ARN રેકોર્ડ્સ અને અપલોડ કરેલા દસ્તાવેજો ડિજિટલ રીતે સલામત છે.",
      safeguard2Title: "AI OCR પાઇપલાઇન અપગ્રેડેશન",
      safeguard2Desc: "અમારી સ્વયંસંચાલિત દસ્તાવેજ એક્સટ્રેક્શન અને ડિજિટલ સીલ વેરિફિકેશન સિસ્ટમ અપડેટ થઈ રહી છે.",
      safeguard3Title: "વેરિફિકેશન ડેસ્ક સ્ટેન્ડબાય પર",
      safeguard3Desc: "સિસ્ટમ ફરી શરૂ થતાં જ વહીવટી અધિકારીઓ દ્વારા પ્રોસેસિંગ તુરંત પુનઃશરૂ કરવામાં આવશે.",
      refreshBtn: "પોટલ સ્ટેટસ ચકાસો",
      contactSupport: "સપોર્ટ હેલ્પડેસ્કનો સંપર્ક કરો"
    },
    hi: {
      badge: "रखरखाव प्रोटोकॉल सक्रिय",
      title: "सेंट्रल नोटरी पब्लिक पोर्टल अनुसूचित रखरखाव के तहत है",
      subtitle: "सेंट्रल नोटरी पब्लिक पंजीकरण मॉड्यूल और AI OCR दस्तावेज़ सत्यापन पाइपलाइन नियमित कानूनी बहीखाता रखरखाव के लिए अस्थायी रूप से ऑफ़लाइन है।",
      statusCardTitle: "सक्रिय सुरक्षा एवं डेटा सुरक्षा",
      safeguard1Title: "जमा किए गए आवेदन पूरी तरह सुरक्षित",
      safeguard1Desc: "सभी पहले जमा किए गए नोटरी आवेदन, ARN रिकॉर्ड और अपलोड किए गए दस्तावेज़ 100% सुरक्षित हैं।",
      safeguard2Title: "AI OCR पाइपलाइन का उन्नयन",
      safeguard2Desc: "हमारी स्वचालित दस्तावेज़ निष्कर्षण और डिजिटल सील सत्यापन प्रणाली को अपडेट किया जा रहा है।",
      safeguard3Title: "सत्यापन डेस्क स्टैंडबाय पर",
      safeguard3Desc: "सिस्टम रीबूट होते ही प्रशासनिक और वकील सत्यापन डेस्क प्रोसेसिंग तुरंत फिर से शुरू कर देगा।",
      refreshBtn: "पोर्टल स्थिति जांचें",
      contactSupport: "सहायता डेस्क से संपर्क करें"
    }
  };

  const t = content[lang as keyof typeof content] || content.en;

  const handleContactSupport = () => {
    const contactElem = document.getElementById("contact-form-section") || document.getElementById("support-helpdesk-section");
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/contact";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-8 p-6 md:p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-xl space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <Scale size={28} className="animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              {t.badge}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {t.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium mt-2 leading-relaxed max-w-2xl">
              {t.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              if (onRefresh) onRefresh();
              else window.location.reload();
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw size={14} />
            {t.refreshBtn}
          </button>
          <button
            onClick={handleContactSupport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Headphones size={14} />
            {t.contactSupport}
          </button>
        </div>
      </div>

      {/* Security Safeguards Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <ShieldAlert size={16} className="text-amber-500" />
          {t.statusCardTitle}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
              <CheckCircle2 size={16} />
              {t.safeguard1Title}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t.safeguard1Desc}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-xs">
              <Clock size={16} />
              {t.safeguard2Title}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t.safeguard2Desc}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
              <Hammer size={16} />
              {t.safeguard3Title}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t.safeguard3Desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
