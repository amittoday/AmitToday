import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Keyboard, ArrowRight, Languages, Globe, Shield, CreditCard, Activity, HelpCircle, CheckCircle, Scale, FileText } from "lucide-react";
import { useAppControl } from "../AppControlContext";

const categoryDetails: { [key: string]: { description: string; services: string[]; duration: string } } = {
  "ટાઈપિંગ સેવાઓ": {
    description: "તમારી જુદી જુદી ફાઇલો, લેખિત પેપર અથવા કાનૂની પત્રોના અતિ-ચોક્કસ અને વ્યવસાયિક સ્તરના ટાઇપિંગ માટેની સેવા.",
    services: [
      "હસ્તલિખિત દસ્તાવેજોનું ડિજિટાઈલેશન (Handwritten to Word/Excel)",
      "ગુજરાતી, હિન્દી અને અંગ્રેજી બહુભાષીય ટાઈપિંગ (Multi-language fast typing)",
      "કાનૂની સોગંદનામું અને કાગળોનું ટાઇપિંગ (Legal drafts & affidavit formats)"
    ],
    duration: "૧-૨ દિવસ (1-2 Days turnaround time)"
  },
  "ભાષાંતર સેવાઓ": {
    description: "તમામ કાનૂની, પ્રમાણપત્ર અને શૈક્ષણિક દસ્તાવેજોના એક ભાષામાંથી બીજી ભાષામાં અતિ સચોટ ભાષાંતર માટેની શ્રેષ્ઠ વ્યવસ્થા.",
    services: [
      "જન્મ / મરણ / લગ્ન પ્રમાણપત્રોના સત્તાવાર અનુવાદ (Birth/Death/Marriage certificate translation)",
      "સરકારી ગેઝેટ અને કાનૂની એફિડેવિટોના સચોટ અનુવાદ (Govt Gazettes & Affidavits translation)",
      "શૈક્ષણિક માર્કશીટ અને ડિગ્રી દસ્તાવેજના પ્રમાણિત અનુવાદ (Certified marksheets translation)"
    ],
    duration: "૨-૩ દિવસ (2-3 Days certified translation)"
  },
  "ઓનલાઈન સરકારી સેવાઓ": {
    description: "તમામ સરકારી ઓનલાઇન પોર્ટલ પર સહાયભૂત અરજી કરવા, સરકારી યોજનાઓનો લાભ મેળવવા અને ફોર્મ્સ સબમિટ કરવા માટેની સહાયક સેવા.",
    services: [
      "આવક, જાતિ અને ડોમિસાઇલ દાખલાઓ (Digital Gujarat & eSamaj Kalyan)",
      "૭/૧૨ નો ઉતારો અને જમીન મહેસૂલ અરજીઓ (Revenue IORA Portal)",
      "નવા પાન કાર્ડ, મતદાર ઓળખપત્રમાં સુધારાઓ (New PAN Card & Voter ID modifications)"
    ],
    duration: "૩-૫ દિવસ (3-5 Days assisted process time)"
  },
  "સેન્ટ્રલ નોટરી એપ્લિકેશન": {
    description: "કેન્દ્રીય નોટરી પોર્ટલ દ્વારા કાયદાકીય વકીલો અને એડવોકેટ્સ માટે સનદ રજિસ્ટ્રેશન અને નોટરી પ્રોસેસિંગ મોડ્યુલ.",
    services: [
      "૬-તબક્કાનું સંપૂર્ણ ડિજિટલ અરજી ફોર્મ (6-Step Notary Portal Wizard)",
      "ઓટોમેટેડ ઓસીઆર અને ભાષાંતર એકીકરણ (OCR & Gujarati-English translation)",
      "ગૂગલ ડ્રાઇવ ઓટો-ફોલ્ડર સંચાલન અને પાયમેન્ટ ઇન્ટિગ્રેશન (AOS Drive System)"
    ],
    duration: "ત્વરિત ડિજિટલ અરજી સ્વીકૃતિ (Instant Digital Submission)"
  }
};

export default function ServicesHub() {
  const { isGovernmentServicesActive } = useAppControl();
  const [activeTooltipId, setActiveTooltipId] = useState<number | null>(null);

  const primaryServices = [
    {
      title: "ટાઈપિંગ સેવાઓ",
      tagline: "અતિ-ઝડપી દ્વિભાષી ટ્રાન્સક્રિપ્શન",
      desc: "અંગ્રેજી, ગુજરાતી, હિન્દી અને સંસ્કૃતમાં ઝડપી અને સચોટ ટાઇપિંગ. હસ્તલિખિત પૃષ્ઠો, સ્કેન કરેલી ફાઇલોના ડિજિટાઈલેશન અને કાનૂની દસ્તાવેજોના આયોજન માટે આદર્શ.",
      icon: <Keyboard className="text-blue-600" size={28} />,
      link: "/services/typing",
      bgStyle: "border-blue-100 hover:border-blue-400 shadow-blue-50/50",
    },
    {
      title: "ભાષાંતર સેવાઓ",
      tagline: "પ્રમાણિત સેમેન્ટિક દસ્તાવેજ સ્થાનિકીકરણ",
      desc: "અંગ્રેજી, ગુજરાતી અને હિન્દી ભાષાઓ વચ્ચે સચોટ અનુવાદ. સોગંદનામું, વ્યાપારી સમજૂતીઓ, જન્મ/લગ્ન પ્રમાણપત્રોના ચોક્કસ સરકારી નિયમો અનુસાર અનુવાદ.",
      icon: <Languages className="text-indigo-600" size={28} />,
      link: "/services/translation",
      bgStyle: "border-indigo-100 hover:border-indigo-400 shadow-indigo-50/50",
    },
    {
      title: "ઓનલાઈન સરકારી સેવાઓ",
      tagline: "સહાયિત ઈ-ગવર્નન્સ પોર્ટલ સેવાઓ",
      desc: "સરકારી વિવિધ પોર્ટલ અને સેવાઓ સાથે અરજી સબમિટ કરવામાં ઓનલાઇન સહાય. સરકારી સત્તાવાર શુલ્ક અને અમારી ખૂબ જ સામાન્ય સેવા ચાર્જ વચ્ચેની સ્પષ્ટ વિગતો.",
      icon: <Globe className="text-emerald-600" size={28} />,
      link: "/services/online",
      bgStyle: "border-emerald-100 hover:border-emerald-400 shadow-emerald-50/50",
    },
    {
      title: "સેન્ટ્રલ નોટરી એપ્લિકેશન",
      tagline: "સત્તાવાર નોટરી પબ્લિક કાનૂની પોર્ટલ",
      desc: "એડવોકેટ્સ અને કાયદાકીય વકીલો માટે કેન્દ્રીય નોટરી પબ્લિક એપ્લિકેશન, સનદ ચકાસણી, ઓસીઆર ટ્રાન્સલેશન અને સુરક્ષિત અરજી મોડ્યુલ.",
      icon: <Scale className="text-amber-600" size={28} />,
      link: "/notary-application",
      bgStyle: "border-amber-100 hover:border-amber-400 shadow-amber-50/50",
    },
    {
      title: "🏛️ AI કાનૂની અને સરકારી પોર્ટલ",
      tagline: "17 AI મોડ્યુલ - RTI, સોગંદનામું, નોટિસ, 7/12",
      desc: "Gemini AI દ્વારા સંચાલિત સત્તાવાર RTI અરજીઓ, લીગલ નોટિસ, સોગંદનામા અને સરકારી રજૂઆતોનું આપમેળે લેખન અને A4 પ્રિન્ટ ડ્રાફ્ટિંગ.",
      icon: <FileText className="text-blue-600" size={28} />,
      link: "/ai-legal-portal",
      bgStyle: "border-blue-100 hover:border-blue-400 shadow-blue-50/50",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 lg:px-12 py-10"
      id="services-hub-page"
    >
      {/* હેડર સેક્શન */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full select-none">
          દસ્તાવેજ અને આઈટી સોલ્યુશન્સ
        </span>
        <h1 className="text-3xl md:text-5xl font-sans font-black text-slate-900 dark:text-white mt-4 tracking-tight">
          અમારી મુખ્ય સેવાઓ
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm md:text-base leading-relaxed font-sans">
          તમારા કાચા લખાણોને સુવ્યવસ્થિત ડિજિટલ દસ્તાવેજોમાં રૂપાંતરિત કરવાથી લઈને દસ્તાવેજોના સચોટ અનુવાદ અને સરકારી ફોર્મ્સ સંપૂર્ણ ચોકસાઈથી સબમિટ કરવામાં અમે તમારી મદદ કરીએ છીએ.
        </p>
      </div>

      {/* સેવાઓ ગ્રીડ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {primaryServices.map((service, idx) => {
          const tooltipInfo = categoryDetails[service.title];
          return (
            <div
              key={idx}
              className={`bg-white dark:bg-slate-900 border ${service.bgStyle} p-8 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all duration-300 group shadow-sm relative`}
              onMouseEnter={() => setActiveTooltipId(idx)}
              onMouseLeave={() => setActiveTooltipId(null)}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-slate-50 dark:bg-slate-950 w-14 h-14 rounded-2xl flex items-center justify-center">
                    {service.icon}
                  </div>
                  {/* Tooltip trigger indicator */}
                  <span className="text-slate-400 hover:text-blue-500 transition-colors cursor-help p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <HelpCircle size={18} />
                  </span>
                </div>
                
                <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                  {service.tagline}
                </span>
                
                <div className="flex items-center gap-2 mt-2">
                  <h2 className="text-xl font-sans font-black text-slate-900 dark:text-white-800">
                    {service.title}
                  </h2>
                  {idx === 2 && (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${isGovernmentServicesActive ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isGovernmentServicesActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                      {isGovernmentServicesActive ? "Online" : "Maintenance"}
                    </span>
                  )}
                </div>
                
                <p className="text-slate-650 dark:text-slate-400 mt-4 text-xs leading-relaxed font-sans">
                  {service.desc}
                </p>
              </div>

              {/* Hover-based Tooltip popup card with Framer motion */}
              <AnimatePresence>
                {activeTooltipId === idx && tooltipInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-4 right-4 -top-36 md:-top-40 bg-slate-950 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 z-30 pointer-events-none"
                  >
                    <div className="text-[10px] font-black tracking-wider text-rose-500 uppercase mb-1">
                      સેવા માર્ગદર્શિકા (Service details)
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      {tooltipInfo.description}
                    </p>
                    <div className="mt-2 space-y-1">
                      {tooltipInfo.services.map((subSvc, subIdx) => (
                        <div key={subIdx} className="flex items-start gap-1 text-[9px] text-slate-450">
                          <CheckCircle size={10} className="text-rose-500 shrink-0 mt-0.5" />
                          <span>{subSvc}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-between items-center text-[8px] font-mono text-slate-555">
                      <span>AVERAGE TURNAROUND:</span>
                      <strong className="text-white">{tooltipInfo.duration}</strong>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to={service.link}
                  className="w-full flex items-center justify-between bg-slate-50 hover:bg-blue-600 dark:bg-slate-950 text-slate-800 dark:text-slate-200 hover:text-white dark:hover:text-white px-5 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest border border-slate-150 dark:border-slate-850 hover:border-blue-600 transition-colors shadow-sm cursor-pointer"
                >
                  <span>વધુ જાણો</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* વિશેષ હાઇલાઇટ્સ */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Shield className="text-blue-400" size={24} />,
              title: "સંપૂર્ણ સુરક્ષા અને એન્ક્રિપ્શન",
              desc: "તમામ ફાઇલ અપલોડ અને દસ્તાવેજો સંપૂર્ણ ડેટા ગુપ્તતા ધોરણો અને સુરક્ષિત સ્થાનિક વ્યવસ્થા હેઠળ રાખવામાં આવે છે.",
            },
            {
              icon: <CreditCard className="text-indigo-400" size={24} />,
              title: "૧૦૦% પારદર્શક ભાવપત્રક",
              desc: "અમે સરકારી પોર્ટલની સત્તાવાર ફી અને અમારી એજન્સીના વહીવટી સ્કેનિંગ અને પ્રોસેસિંગ મોડ્યુલર ચાર્જને સંપૂર્ણપણે જૂદા અને સ્પષ્ટ દર્શાવીએ છીએ.",
            },
            {
              icon: <Activity className="text-emerald-400" size={24} />,
              title: "ડબલ વેરિફિકેશન સિસ્ટમ",
              desc: "કોઈપણ પ્રોસેસમાં ભૂલ ન થાય તે માટે સંપૂર્ણ માનવ સંચાલિત ચકાસણી અને અમિત પટેલ દ્વારા વ્યક્તિગત આખરી સમીક્ષા હાથ ધરાય છે.",
            },
          ].map((hl, i) => (
            <div key={i} className="space-y-3" id={`benefit-${i}`}>
              <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center">
                {hl.icon}
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider">{hl.title}</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{hl.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
