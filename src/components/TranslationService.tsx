import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Languages, ArrowRight, CheckSquare, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import { TRANSLATION_RATE_CARD } from "../config/pricingConstants";
import ServicePriceEstimator from "./ServicePriceEstimator";

export default function TranslationService() {
  const getRouteLabel = (key: string) => {
    switch (key.toUpperCase()) {
      case "EN_TO_GU":
        return "અંગ્રેજી માંથી ગુજરાતી";
      case "GU_TO_EN":
        return "ગુજરાતી માંથી અંગ્રેજી";
      case "EN_TO_HI":
        return "અંગ્રેજી માંથી હિન્દી";
      case "HI_TO_EN":
        return "હિન્દી માંથી અંગ્રેજી";
      case "GU_TO_HI":
        return "ગુજરાતી માંથી હિન્દી";
      case "HI_TO_GU":
        return "હિન્દી માંથી ગુજરાતી";
      default:
        return key.replace("_", " ");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 lg:px-12 py-10 font-sans"
      id="translation-service-page"
    >
      {/* હીરો સેક્શન */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 md:p-12 mb-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/45 dark:bg-indigo-950/25 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl">
          <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/65 text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full select-none">
            શબ્દાર્થ અને સંદર્ભ સ્થાનીયકરણ
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight leading-none animate-fade-in">
            પ્રમાણિત સ્થાનિક ભાષાંતર સેવાઓ
          </h1>
          <p className="text-slate-605 dark:text-slate-400 mt-4 text-sm md:text-base leading-relaxed">
            કાનૂની દસ્તાવેજો, વ્યાપારી કરારો, જન્મ/લગ્નના દાખલાઓ અને શૈક્ષણિક અરજીઓમાં દ્વિઅર્થી શબ્દો ઓળખી સુધારો કરો. અમારી પ્રીમિયમ દ્વિભાષી પ્રણાલી અંગ્રેજી, ગુજરાતી અને હિન્દી વચ્ચે સચોટ અનુવાદ પ્રદાન કરે છે.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-black uppercase tracking-wider text-[11px] px-8 py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>અત્યારે જ ઓર્ડર કરો</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/contact"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 text-slate-800 dark:text-slate-200 font-sans font-black uppercase tracking-wider text-[11px] px-8 py-4 rounded-xl inline-flex items-center justify-center cursor-pointer"
            >
              અમિત પટેલ સાથે ચર્ચા કરો
            </Link>
          </div>
        </div>
      </div>

      {/* પારદર્શક ભાવપત્રક */}
      <div className="mb-12">
        <div className="text-center md:text-left mb-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            પારદર્શક ભાવપત્રક
          </h2>
          <p className="text-slate-500 dark:text-slate-455 text-xs mt-1">
            છૂપી ફી વગર માત્ર શબ્દો પર આધારિત સચોટ અને પ્રમાણિક ભાવ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(TRANSLATION_RATE_CARD || {}).map(([routeKey, rateValue]) => (
            <div
              key={routeKey}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:border-indigo-400 transition-colors flex items-center justify-between"
            >
              <div className="text-left">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider">
                  અનુવાદનો રૂટ
                </span>
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wide mt-0.5">
                  {getRouteLabel(routeKey)}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-black text-slate-900 dark:text-white">
                  ₹{Number(rateValue).toFixed(2)}
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  પ્રતિ શબ્દ
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* આ કેવી રીતે કામ કરે છે ટાઈમલાઈન */}
      <div className="mb-12">
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 text-center">
          આ કેવી રીતે કામ કરે છે
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "ઓર્ડર ૧",
              title: "ફાઇલ અપલોડ કરો",
              desc: "તમારા સોગંદનામા, કાનૂની દસ્તાવેજો અથવા પ્રમાણપત્રોની સ્કેન કરેલી નકલો સીધી અમારા સુરક્ષિત ગ્રાહકોના ડેશબોર્ડમાં અપલોડ કરો.",
            },
            {
              step: "ઓર્ડર ૨",
              title: "મેન્યુઅલ અનુવાદ વિહંગાવલોકન",
              desc: "અમારા અનુભવી ભાષા નિષ્ણાતો દ્વારા સંપૂર્ણ કાર્ય માનવ સંચાલિત (100% Human-Driven) અને હાઈ-ક્વોલિટી ડબલ-ચેક પ્રક્રિયા સાથે સચોટ અનુવાદિત થાય છે.",
            },
            {
              step: "ઓર્ડર ૩",
              title: "સુરક્ષિત પેમેન્ટ",
              desc: "શબ્દો દીઠ નક્કી કરાયેલા વહીવટી સ્નેપ બિલ અનુસાર સુરક્ષિત યુપીઆઈ કે કાર્ડ પેમેન્ટ દ્વારા ચુકવણી કરો.",
            },
            {
              step: "ઓર્ડર ૪",
              title: "ફાઇનલ ડોક્યુમેન્ટ મેળવો",
              desc: "ડબલ વેરિફિકેશન પ્રક્રિયા પૂરી થયા બાદ સરકારી હેતુઓ માટે તૈયાર ઓટોમેટેડ સહી મહોર વાળું દસ્તાવેજ મેળવો.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl relative shadow-sm"
            >
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md">
                {item.step}
              </span>
              <h3 className="text-xs font-black uppercase text-slate-850 dark:text-slate-200 tracking-wider mb-2 mt-3 font-sans">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* લાભો / કાનૂની પાલન */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-indigo-100 dark:border-indigo-950 p-6 md:p-8">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-850 dark:text-white flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" size={16} /> પ્રમાણપત્ર અને એફિડેવિટ કાનૂની પાલન
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-xs mt-3 leading-relaxed font-sans">
          ગુજરાતમાં સત્તાવાર દસ્તાવેજોના ઉપયોગ માટે સચોટ અનુવાદ અત્યંત જરૂરી છે. અમારા નિયમો હેઠળ, અમે નામો, કોર્ટના આઈડી, પાસપોર્ટ વિગતો અને જમીનના રેકોર્ડ્સને ૧૦૦% સાચી માહિતી સાથે ટ્રાન્સલેટ કરીએ છીએ. અમારી સહી અને મહોર સ્થાનિક સરકારી ગેઝેટ માર્ગદર્શિકા સાથે સંપૂર્ણ રીતે સુસંગત છે.
        </p>
      </div>

      {/* Floating Price Estimator Card */}
      <ServicePriceEstimator type="translation" />
    </motion.div>
  );
}
