import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calculator, X, ChevronUp, ChevronDown, Check, HelpCircle, AlertCircle, Tag, Sparkles } from "lucide-react";
import {
  TYPING_RATE_CARD,
  TRANSLATION_RATE_CARD,
  EXPRESS_DELIVERY_FEE,
  HARD_TO_READ_MULTIPLIER,
} from "../config/pricingConstants";
import {
  fetchActiveDiscountRules,
  evaluateDiscount,
  DiscountRule,
  AppliedDiscount,
} from "../utils/discountUtils";

interface ServicePriceEstimatorProps {
  type: "translation" | "typing";
}

export default function ServicePriceEstimator({ type }: ServicePriceEstimatorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Inputs
  const [inputType, setInputType] = useState<"words" | "pages">("words");
  const [wordCount, setWordCount] = useState<number>(500);
  const [pageCount, setPageCount] = useState<number>(2);
  
  // Specific selects
  const [translationRoute, setTranslationRoute] = useState<string>("English To Gujarati");
  const [typingLanguage, setTypingLanguage] = useState<string>("Gujarati");
  
  // Options
  const [isExpress, setIsExpress] = useState<boolean>(false);
  const [isHardToRead, setIsHardToRead] = useState<boolean>(false);

  // Calculate final words
  const computedWords = inputType === "pages" ? pageCount * 250 : wordCount;

  // Calculate rate
  let baseRate = 0;
  if (type === "translation") {
    baseRate = TRANSLATION_RATE_CARD[translationRoute] || 0.50;
  } else {
    baseRate = TYPING_RATE_CARD[typingLanguage] || 0.25;
  }

  // Calculate base cost
  const baseCost = computedWords * baseRate;
  
  // Hand written surcharge (+50%)
  const handwrittenSurcharge = isHardToRead ? baseCost * HARD_TO_READ_MULTIPLIER : 0;
  
  // Express delivery surcharge
  const expressSurcharge = isExpress ? EXPRESS_DELIVERY_FEE : 0;
  
  // Total cost
  const rawTotalCost = baseCost + handwrittenSurcharge + expressSurcharge;

  // Dynamic Discount
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  useEffect(() => {
    fetchActiveDiscountRules()
      .then((rules) => setDiscountRules(rules))
      .catch((e) => console.warn("Estimator discounts failed", e));
  }, []);

  const storedUserStr = localStorage.getItem("aos_user") || localStorage.getItem("user");
  const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;
  const userAccountType = (storedUser?.accountType || storedUser?.AccountType || storedUser?.role || "General").trim();
  const appliedDiscount: AppliedDiscount = evaluateDiscount(discountRules, userAccountType, rawTotalCost);
  const totalCost = appliedDiscount.applicable ? appliedDiscount.finalPrice : rawTotalCost;

  // Sync page count and word count roughly
  useEffect(() => {
    if (inputType === "words") {
      setPageCount(Math.max(1, Math.ceil(wordCount / 250)));
    }
  }, [wordCount, inputType]);

  useEffect(() => {
    if (inputType === "pages") {
      setWordCount(pageCount * 250);
    }
  }, [pageCount, inputType]);

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className="fixed bottom-20 left-4 sm:left-6 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-all duration-300 font-black uppercase tracking-widest text-[10px] border border-blue-500/20"
        id="reopen-price-estimator-button"
      >
        <Calculator size={18} className="animate-bounce" />
        <span>કિંમત અંદાજક (Price Estimator)</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-20 left-4 sm:left-6 z-50 bg-white dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-3xl shadow-2xl transition-all duration-300 max-w-sm w-full overflow-hidden ${isMinimized ? "h-14" : "h-auto"}`}
      id="service-price-estimator-card"
    >
      {/* Header Bar */}
      <div className="flex justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850 select-none">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white">
          <Calculator size={16} className="text-blue-600" />
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">
            {type === "translation" ? "Translation Estimator" : "Typing Estimator"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            title={isMinimized ? "Expand Estimator" : "Minimize Estimator"}
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            title="Close Estimator"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Estimator Body (Hidden when minimized) */}
      {!isMinimized && (
        <div className="p-6 space-y-4">
          
          {/* Document Unit Type */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100/60 dark:bg-slate-900/60 p-1 rounded-xl text-[9px] font-black uppercase tracking-wider font-mono">
            <button
              onClick={() => setInputType("words")}
              className={`py-1.5 rounded-lg transition-all ${inputType === "words" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
            >
              Words (શબ્દો)
            </button>
            <button
              onClick={() => setInputType("pages")}
              className={`py-1.5 rounded-lg transition-all ${inputType === "pages" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"}`}
            >
              Pages (પૃષ્ઠો)
            </button>
          </div>

          {/* Sizing input details */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
              {inputType === "words" ? "Estimated Word Count (અંદાજીત શબ્દો)" : "Estimated Page Count (અંદાજીત પાના)"}
            </label>
            {inputType === "words" ? (
              <div className="space-y-2">
                <input
                  type="number"
                  min="50"
                  max="10000"
                  step="50"
                  value={wordCount}
                  onChange={(e) => setWordCount(Math.max(50, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none text-slate-800 dark:text-white font-mono"
                />
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={pageCount}
                  onChange={(e) => setPageCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none text-slate-800 dark:text-white font-mono"
                />
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
                />
              </div>
            )}
          </div>

          {/* Dynamic Language Options */}
          {type === "translation" ? (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                Translation Route (અનુવાદ રૂટ)
              </label>
              <select
                value={translationRoute}
                onChange={(e) => setTranslationRoute(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white cursor-pointer"
              >
                {Object.keys(TRANSLATION_RATE_CARD).map((route) => (
                  <option key={route} value={route}>
                    {route} (₹{TRANSLATION_RATE_CARD[route].toFixed(2)}/wd)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
                Typing Language (ટાઈપીંગ ભાષા)
              </label>
              <select
                value={typingLanguage}
                onChange={(e) => setTypingLanguage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold outline-none text-slate-800 dark:text-white cursor-pointer"
              >
                {Object.keys(TYPING_RATE_CARD).map((lang) => (
                  <option key={lang} value={lang}>
                    {lang} (₹{TYPING_RATE_CARD[lang].toFixed(2)}/wd)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Surcharges Section */}
          <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
            <label className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-wider">
              Additional Requirements (વધારાની જરૂરિયાતો)
            </label>

            <div className="space-y-1.5">
              {/* Hard to read text */}
              <label className="flex items-center justify-between p-2 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer select-none">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    Hard Handwriting
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase">
                    +50% Surcharge (+૫૦% ચાર્જ)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isHardToRead}
                  onChange={(e) => setIsHardToRead(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
              </label>

              {/* Express delivery */}
              <label className="flex items-center justify-between p-2 rounded-xl border border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer select-none">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    Express 24h Delivery
                  </span>
                  <span className="text-[8px] text-slate-500 font-bold uppercase">
                    Flat +₹{EXPRESS_DELIVERY_FEE.toFixed(2)} (+₹૫૦ સરચાર્જ)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isExpress}
                  onChange={(e) => setIsExpress(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Pricing Calculation Display */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-2">
            <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-bold">
              <span>Base Cost ({computedWords} words)</span>
              <span className="font-mono">₹{baseCost.toFixed(2)}</span>
            </div>
            {isHardToRead && (
              <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                <span>Handwriting Surcharge</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">+₹{handwrittenSurcharge.toFixed(2)}</span>
              </div>
            )}
            {isExpress && (
              <div className="flex justify-between items-center text-[9px] text-slate-500 dark:text-slate-400 font-bold">
                <span>Express Surcharge</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">+₹{expressSurcharge.toFixed(2)}</span>
              </div>
            )}
            
            {appliedDiscount.applicable && (
              <div className="flex justify-between items-center text-[9px] text-emerald-600 dark:text-emerald-400 font-bold border-t border-dashed border-emerald-200 dark:border-emerald-800 pt-1.5">
                <span className="flex items-center gap-1">
                  <Tag size={10} />
                  {appliedDiscount.discountBadgeText}
                </span>
                <span className="font-mono font-black">-₹{appliedDiscount.discountAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center border-t border-slate-200/50 dark:border-slate-800 pt-2 text-slate-900 dark:text-white">
              <span className="text-[10px] font-black uppercase tracking-wider">Estimated Total</span>
              <div className="text-right">
                {appliedDiscount.applicable ? (
                  <div className="flex items-center gap-1.5">
                    <s className="text-[10px] font-mono text-slate-400 line-through">
                      ₹{rawTotalCost.toFixed(2)}
                    </s>
                    <span className="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₹{totalCost.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xl font-mono font-black text-blue-600 dark:text-blue-400">
                    ₹{totalCost.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {appliedDiscount.applicable && (
              <div className="flex justify-end pt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full text-[9px] font-black border border-emerald-300 dark:border-emerald-700">
                  <Sparkles size={9} className="text-emerald-600 animate-pulse" />
                  {appliedDiscount.discountBadgeText}
                </span>
              </div>
            )}
          </div>

          {/* Order Placement Call-to-action */}
          <Link
            to="/dashboard"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase tracking-wider text-[10px] py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>Proceed to Upload & Submit</span>
          </Link>
          
          <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 justify-center">
            <AlertCircle size={10} />
            <span>Note: Final cost is verified upon upload.</span>
          </div>

        </div>
      )}
    </div>
  );
}
