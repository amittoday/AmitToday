import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Keyboard, ArrowRight, ShieldCheck, CheckCircle, Flame, Users, Calendar } from "lucide-react";
import { TYPING_RATE_CARD } from "../config/pricingConstants";
import ServicePriceEstimator from "./ServicePriceEstimator";

export default function TypingService() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 lg:px-12 py-10 font-sans"
      id="typing-service-page"
    >
      {/* હીરો સેક્શન */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-8 md:p-12 mb-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/40 dark:bg-blue-950/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-3xl">
          <span className="text-[10px] bg-blue-100 dark:bg-blue-950/65 text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full select-none">
            ઝડપ અને સચોટતા ચકાસાયેલ
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mt-4 tracking-tight leading-none">
            વ્યાવસાયિક દ્વિભાષી ટાઈપિંગ સેવાઓ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-4 text-sm md:text-base leading-relaxed">
            હસ્તલિખિત લખાણો, ભૌતિક ફાઇલો, ચિત્રો અથવા ડિક્ટેશનને સુંદર, સુવ્યવસ્થિત ડિજિટલ દસ્તાવેજોમાં રૂપાંતરિત કરો. અંગ્રેજી, ગુજરાતી, હિન્દી અને સંસ્કૃતમાં અમિત પટેલના કડક મોડલ દ્વારા ચકાસાયેલ.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-sans font-black uppercase tracking-wider text-[11px] px-8 py-4 rounded-xl shadow-lg shadow-blue-200 dark:shadow-none inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>અત્યારે જ ઓર્ડર કરો</span>
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/contact"
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-sans font-black uppercase tracking-wider text-[11px] px-8 py-4 rounded-xl inline-flex items-center justify-center cursor-pointer"
            >
              ખાસ પૂછપરછ કરો
            </Link>
          </div>
        </div>
      </div>

      {/* પારદર્શક ભાવપત્રક */}
      <div className="mb-12">
        <div className="text-center md:text-left mb-8">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            પારદર્શક ભાવપત્રક
          </h2>
          <p className="text-slate-500 dark:text-slate-450 text-xs mt-1">
            અમારી બિલિંગ પ્રક્રિયા સંપૂર્ણપણે પારદર્શક છે અને દસ્તાવેજના શબ્દો દીઠ નક્કી થાય છે.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(TYPING_RATE_CARD || {}).map(([langKey, rateValue]) => (
            <div
              key={langKey}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center"
            >
              <div className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">
                {langKey === "gu" ? "ગુજરાતી" : langKey === "en" ? "અંગ્રેજી" : langKey === "hi" ? "હિન્દી" : "સંસ્કૃત"} લેઆઉટ
              </div>
              <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-mono">
                ₹{Number(rateValue).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 font-extrabold mt-1">
                બેઝિક દર પ્રતિ શબ્દ
              </div>
            </div>
          ))}
        </div>
        
        {/* વહીવટી અતિરિક્ત ચાર્જીસ */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-850 flex flex-col md:flex-row justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Flame className="text-amber-500" size={14} />
            <span className="text-slate-600 dark:text-slate-400">
              ઝડપી વિતરણ જોઈએ છે? <strong>₹૫૦.૦૦</strong> નું એક્સપ્રેસ સરચાર્જ લાગુ થશે.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-500" size={14} />
            <span className="text-slate-600 dark:text-slate-400">
              અસ્પષ્ટ હસ્તલેખન: કીબોર્ડ અનુવાદ અને ચકાસણી ખર્ચ માટે <strong>+૫૦%</strong> સરચાર્જ લાગુ થઈ શકે છે.
            </span>
          </div>
        </div>
      </div>

      {/* આ કેવી રીતે કામ કરે છે ટાઈમલાઈન */}
      <div className="mb-12">
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 text-center">
          આ કેવી રીતે કામ કરે છે
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            {
              step: "ઓર્ડર ૧",
              title: "ફાઇલ અપલોડ કરો",
              desc: "અમારા સુરક્ષિત ઓનલાઇન પોર્ટલ દ્વારા તમારા હસ્તલિખિત પૃષ્ઠો અથવા સ્કેન ફાઈલો અપલોડ કરો.",
            },
            {
              step: "ઓર્ડર ૨",
              title: "મેન્યુઅલ ટાઈપિંગ અને ચકાસણી",
              desc: "અમારા ટાઈપિંગ નિષ્ણાતો દ્વારા સંપૂર્ણ કાર્ય માનવ સંચાલિત (100% Human-Driven) કરવામાં આવે છે, જેમાં કીબોર્ડ લેઆઉટ પ્રોફેશનલ ચોકસાઈ સાથે દરેક લીટી ટાઈપ થાય છે.",
            },
            {
              step: "ઓર્ડર ૩",
              title: "સુરક્ષિત પેમેન્ટ",
              desc: "શબ્દોની ચોક્કસ ગણતરી સાથે ટ્રાન્સપોર્ટ બિલ જોઈ સુરક્ષિત વેબ ગેટવે અથવા યુપીઆઈ દ્વારા ઓનલાઈન ચુકવણી કરો.",
            },
            {
              step: "ઓર્ડર ૪",
              title: "ફાઇનલ ડોક્યુમેન્ટ મેળવો",
              desc: "પોર્ટલ ટ્રેકિંગ મોડ્યુલ દ્વારા ફોર્મ ચકાસ્યા પછી સિક્યોર વર્ડ અથવા પીડીએફ દસ્તાવેજ ડાઉનલોડ કરો.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl relative shadow-sm"
            >
              <span className="absolute right-4 top-4 text-xs font-black font-sans text-slate-350 dark:text-slate-700 select-none bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded-md">
                {item.step}
              </span>
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-300 tracking-wider mb-2 pr-16 font-sans">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* લાભો */}
      <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto">
        <h3 className="text-base font-black uppercase tracking-widest text-blue-400">
          શા માટે વ્યાપારીઓ અમિત ઓનલાઇન સર્વિસિસ પસંદ કરે છે?
        </h3>
        <p className="text-slate-300 text-xs md:text-sm mt-3 max-w-2xl mx-auto leading-relaxed">
          ભારતીય ન્યૂનતમ ધોરણો અનુસાર અમારી ટાઈપિંગ સેવા સંપૂર્ણ સચોટ છે. અમિત પટેલના વ્યક્તિગત માર્ગદર્શન હેઠળ દરેક ફોર્મેટિંગ અને જોડણી સચોટ રીતે ચકાસવામાં આવે છે.
        </p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            "ગુજરાતી સુશા અને રેમિંગ્ટન કીબોર્ડ લેઆઉટ સપોર્ટ",
            "સંસ્કૃત યુનિકોડ અને દેવનાગરી પ્રમાણિતતા",
            "એડિટેબલ એમએસ વર્ડ અને સિક્યોર પીડીએફ ફાઇલો",
          ].map((adv, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10">
              <CheckCircle size={14} className="text-emerald-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{adv}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Price Estimator Card */}
      <ServicePriceEstimator type="typing" />
    </motion.div>
  );
}
