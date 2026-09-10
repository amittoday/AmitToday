import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Globe, ArrowRight, ShieldCheck, Scale, DollarSign, PenTool, CheckCircle, HelpCircle } from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "../LanguageContext";

interface Service {
  ID: string;
  Category: string;
  SubCategory: string;
  ServiceName: string; // Service Title
  BasePrice: number; // Total price calculated
  TurnaroundTime: string;
  RequiredDocuments: string;
  RequiredFields: string;
  PdfDownloads: string;
  Status: string; // "Active" | "Inactive"
  Description?: string; // Markdown description
  GovtFee?: number;
  ServiceCharge?: number;
  CourierCharge?: number;
  OfficialPdfUrl?: string; // GR, blank form link
  RequiredDocIDs?: string;
}

export default function OnlineServices() {
  const { lang } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get("/api/services-master")
      .then((res) => {
        if (res.data && res.data.success) {
          const list: Service[] = res.data.data || [];
          // Filter to show only active services in Government Schemes & Services CMS
          const activeServices = list.filter((s) => s.Status !== "Inactive");
          setServices(activeServices);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch services in OnlineServices:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 lg:px-12 py-10 font-sans"
      id="online-services-page"
    >
      {/* હીરો સેક્શન */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 md:p-12 mb-10 shadow-sm relative overflow-hidden" id="online-hero-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl">
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/65 text-emerald-700 dark:text-emerald-400 font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full select-none" id="online-category-tag">
            {lang === "gu" ? "ઈ-ગવર્નન્સ સહાયતા" : "E-Governance Assistance"}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight leading-none animate-fade-in" id="online-main-title">
            {lang === "gu" ? "ઓનલાઇન સરકારી સેવાઓ" : "Online Government Services"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm md:text-base leading-relaxed" id="online-main-subtitle">
            {lang === "gu" 
              ? "જટિલ સરકારી પોર્ટલ, ફોર્મ રિજેક્શન અને ટેકનિકલ સમસ્યાઓથી બચો. અમે તમારા ફોર્મ અને દસ્તાવેજોને પ્રથમ વખતમાં જ સચોટ રીતે ઓનલાઇન સબમિટ કરવા માટે માર્ગદર્શન અને સહાય પૂરી પાડીએ છીએ."
              : "Avoid complex portals, form rejections, and technical issues. We provide expert advice and assistance to ensure your applications and documents are submitted accurately online the very first time."}
          </p>
          <div className="mt-8">
            <Link
              to="/services/gov"
              className="bg-emerald-650 hover:bg-emerald-700 text-white font-sans font-black uppercase tracking-wider text-[11px] px-8 py-4 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none inline-flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
              id="online-hero-cta"
            >
              <span>{lang === "gu" ? "અત્યારે જ ઓર્ડર કરો" : "Order / Apply Now"}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* સ્પષ્ટ ફી વિભાજન વિશે સ્કેલ */}
      <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/90 dark:border-amber-900/60 p-6 md:p-8 rounded-3xl mb-12 flex flex-col md:flex-row items-start gap-4 animate-fade-in" id="transparent-fees-disclaimer">
        <div className="bg-amber-500/10 p-3 rounded-2xl shrink-0">
          <Scale className="text-amber-600 dark:text-amber-400" size={24} />
        </div>
        <div className="space-y-2 text-left">
          <h2 className="text-sm font-black uppercase text-amber-800 dark:text-amber-400 tracking-wider" id="fees-header-title">
            {lang === "gu" ? "સરકારી ફી અને અમારા સર્વિસ ચાર્જ વચ્ચેની સ્પષ્ટ વિગતો" : "Clear Breakdown of Government Fees & Service Charges"}
          </h2>
          <p className="text-slate-705 dark:text-slate-300 text-xs leading-relaxed font-sans" id="fees-header-description">
            {lang === "gu" ? (
              <><strong>અમિત ઓનલાઇન સર્વિસિસ</strong> ખાતે અમે પારદર્શકતામાં માનીએ છીએ. સરકારી ઓનલાઇન ફોર્મ સબમિટ કરતી વખતે અમે ખર્ચની ગણતરી ખૂબ જ પ્રમાણિક અને સ્પષ્ટ રીતે કરીએ છીએ:</>
            ) : (
              <>At <strong>Amit Online Services</strong>, we highly value transparency. When submitting government application forms online, we compute costs cleanly and transparently:</>
            )}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-900/40">
            <div id="gov-official-fee-desc">
              <div className="font-extrabold text-[10px] uppercase text-slate-800 dark:text-amber-300">
                {lang === "gu" ? "૧. અધિકૃત સરકારી ફી (કાયદાકીય)" : "1. Official Government Fees"}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                {lang === "gu" 
                  ? "આ સરકારી પોર્ટલ (જેમ કે ડિજિટલ ગુજરાત, આધાર, આવકવેરો) દ્વારા સીધી ચૂકવવામાં આવતી સત્તાવાર ફી છે. આની સરકારી ચૂકવણીની રસીદ સીધી તમને અપાશે."
                  : "This is the official mandatory fee charged directly by the government portals (e.g., Digital Gujarat, UIDAI, Income Tax). You receive direct official receipt for this pay."}
              </p>
            </div>
            <div id="service-charge-desc">
              <div className="font-extrabold text-[10px] uppercase text-slate-800 dark:text-amber-300">
                {lang === "gu" ? "૨. અમારો સર્વિસ સહાય ચાર્જ" : "2. Our Service Facilitation Charge"}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                {lang === "gu" 
                  ? "આ આપેલા ફોર્મનું ફોર્મેટિંગ અને ચકાસણી કરવા, ઓનલાઇન સબમિશન અને ગ્રાહક સેવા ટ્રેકિંગના સંચાલન માટેનો અમારો ખૂબ જ નજીવો સર્વિસ ચાર્જ છે."
                  : "This is our minimal professional fee for document verification, checking submission requirements, correct portal data entry, and status tracking services."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* સેવાઓ ડિરેક્ટરી */}
      <div className="mb-12" id="online-services-directory">
        <div className="text-center md:text-left mb-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white" id="online-directory-title">
            {lang === "gu" ? "સહાયિત ઈ-ગવર્નન્સ પોર્ટલ ડિરેક્ટરી" : "Assisted E-Governance Portal Directory"}
          </h2>
          <p className="text-slate-505 dark:text-slate-400 text-xs mt-1" id="online-directory-subtitle">
            {lang === "gu" 
              ? "અમે વિવિધ ઓનલાઇન સરકારી સેવાની અરજી પૂરી કરવા માટે તમારા દસ્તાવેજો ચકાસવામાં સ્થાનિક સહાય પૂરી પાડીએ છીએ."
              : "We provide professional assistance to verify your credentials and submit files accurately to various online government portals."}
          </p>
        </div>

        <div className="space-y-6" id="services-cards-list">
          {loading ? (
            <div className="flex justify-center items-center py-24" id="services-loading-spinner">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                  {lang === "gu" ? "માહિતી લોડ થઈ રહી છે..." : "Loading Services..."}
                </p>
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl" id="no-services-notification">
              <HelpCircle className="mx-auto text-slate-300 dark:text-slate-700 mb-2" size={32} />
              <p className="text-slate-500 dark:text-slate-400 text-xs font-sans">
                {lang === "gu" ? "હાલમાં કોઈ સરકારી સેવાઓ એડમીન પેનલ દ્વારા સેટઅપ કરેલ નથી." : "No services configured in the CMS yet."}
              </p>
            </div>
          ) : (
            services.map((svc, i) => (
              <div
                key={svc.ID || i}
                id={`online-service-${svc.ID || i}`}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center hover:border-emerald-100 dark:hover:border-emerald-900/40 transition-colors duration-200"
              >
                <div className="md:col-span-8 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center" id={`badges-container-${svc.ID}`}>
                    <span className="text-[9px] bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-450 font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {svc.Category || (lang === "gu" ? "સરકારી" : "Government")}
                    </span>
                    {svc.SubCategory && (
                      <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                        {svc.SubCategory}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white font-sans" id={`service-title-${svc.ID}`}>
                    {svc.ServiceName}
                  </h3>
                  {svc.Description ? (
                    <div className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-sans prose prose-sm prose-slate dark:prose-invert max-w-none text-[12px]" id={`service-desc-${svc.ID}`}>
                      <ReactMarkdown>{svc.Description}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-sans" id={`service-default-desc-${svc.ID}`}>
                      {lang === "gu" 
                        ? "જણાવેલ સેવાની સચોટ અરજી, દસ્તાવેજ માર્ગદર્શન અને ફાઇલિંગ પ્રક્રિયામાં સંપૂર્ણ મેન્યુઅલ સપોર્ટ."
                        : "Accurate filing support, structured catalog checklists, and manual profile processing assistance."}
                    </p>
                  )}
                </div>

                <div className="md:col-span-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl flex flex-col justify-center space-y-2.5 text-xs border border-slate-150/50 dark:border-slate-850" id={`pricing-box-${svc.ID}`}>
                  <div id={`official-fee-section-${svc.ID}`}>
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                      {lang === "gu" ? "સરકારી સત્તાવાર કાનૂની ફી" : "Official Government Fee"}
                    </span>
                    <span className="text-slate-700 dark:text-slate-350 font-extrabold leading-tight block">
                      {svc.GovtFee !== undefined ? `₹${svc.GovtFee}` : (lang === "gu" ? "દરેક વિભાગ અનુસાર અલગ" : "Variable by department")}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800" id={`service-charge-section-${svc.ID}`}>
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                      {lang === "gu" ? "અમારો સર્વિસ ચાર્જ" : "Our Action/Service Charge"}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black block text-sm font-sans">
                      ₹{svc.ServiceCharge !== undefined ? svc.ServiceCharge : (svc.BasePrice || 150)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center" id={`details-section-${svc.ID}`}>
                    <div>
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                        {lang === "gu" ? "અંદાજિત સમય" : "Estimated Time"}
                      </span>
                      <span className="text-slate-650 dark:text-slate-400 font-extrabold block">
                        {svc.TurnaroundTime || "3-5 Days"}
                      </span>
                    </div>
                    <Link
                      to={`/services/gov?applyForId=${svc.ID}`}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-black uppercase text-[10px] px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ml-auto"
                      id={`apply-button-${svc.ID}`}
                    >
                      <span>{lang === "gu" ? "સેવા મેળવો" : "Get Service"}</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* સુરક્ષા નીતિ પાઠ */}
      <div className="bg-slate-905 dark:bg-slate-950 text-white rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto" id="credentials-security-assurance-policy">
        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400" id="security-header">
          {lang === "gu" ? "ઓળખપત્રો અંગે સખત સુરક્ષા નીતિ" : "Strict Policy Regarding Customer Credentials"}
        </h3>
        <p className="text-slate-350 text-xs md:text-sm mt-3 max-w-2xl mx-auto leading-relaxed" id="security-body">
          {lang === "gu" 
            ? "અમે પ્રાઇવસી અને સુરક્ષા કાયદાનું કડક પાલન કરીએ છીએ. અમે આધાર કાર્ડ નંબર, પાન પ્રોફાઇલ, બાયોમેટ્રિક ડેટા અથવા નાણાકીય પાસવર્ડ્સ ક્યારેય સેવ કે સ્ટોર કરતા નથી. સંબંધિત પોર્ટલ પર અરજી સબમિટ થઈ ગયા પછી તમામ લોકલ ડાઉનલોડ ફાઇલોને અમારી સિસ્ટમમાંથી તરત જ કાયમ માટે ભૂંસી નાખવામાં આવે છે."
            : "We adhere strictly to data privacy guidelines. We do not store citizen credentials (such as Aadhaar, PAN passwords, or payment OTPs). Once your application is securely logged and processed, all supporting temporary download documents are permanently purged from our secure workspaces."}
        </p>
      </div>
    </motion.div>
  );
}
