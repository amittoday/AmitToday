import React, { useState, useEffect } from "react";
import {
  FileText,
  Languages,
  Keyboard,
  ShieldCheck,
  Upload,
  CheckCircle,
  AlertCircle,
  Tag,
  Percent,
  Sparkles,
  HelpCircle,
  Clock,
  ExternalLink,
  CreditCard,
  QrCode,
  Globe,
  Lock,
  Loader2,
  Check,
  PenTool,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchActiveDiscountRules,
  evaluateDiscount,
  DiscountRule,
  AppliedDiscount,
} from "../utils/discountUtils";
import {
  TYPING_RATE_CARD,
  TRANSLATION_RATE_CARD,
  EXPRESS_DELIVERY_FEE,
  HARD_TO_READ_MULTIPLIER,
} from "../config/pricingConstants";

interface DocumentServiceCenterProps {
  user?: any;
  lang?: string;
  onFinish?: (orderData: any) => void;
  setShowAuthModal?: (show: boolean) => void;
  selectedService?: "Translation" | "Typing";
}

export const DocumentServiceCenter: React.FC<DocumentServiceCenterProps> = ({
  user,
  lang = "en",
  onFinish,
  setShowAuthModal,
  selectedService = "Translation",
}) => {
  const [activeService, setActiveService] = useState<"Translation" | "Typing">(
    selectedService
  );
  const [sourceLang, setSourceLang] = useState("Auto Detect");
  const [targetLang, setTargetLang] = useState("Gujarati");
  const [typingLanguage, setTypingLanguage] = useState("Gujarati");
  const [files, setFiles] = useState<File[]>([]);
  const [wordCount, setWordCount] = useState<number>(350);
  const [hardToRead, setHardToRead] = useState(false);
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Card" | "Netbanking">("UPI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeclarationAccepted, setIsDeclarationAccepted] = useState(false);
  const [qrTimer, setQrTimer] = useState(300);
  const [orderId, setOrderId] = useState(() => "DSC-" + Date.now().toString().slice(-6));

  // Dynamic Discount State
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(false);

  // Fetch active discount rules on mount
  useEffect(() => {
    let isMounted = true;
    const loadRules = async () => {
      setIsLoadingDiscounts(true);
      try {
        const rules = await fetchActiveDiscountRules();
        if (isMounted) {
          setDiscountRules(rules);
        }
      } catch (err) {
        console.warn("[DocumentServiceCenter] Error loading discount rules:", err);
      } finally {
        if (isMounted) setIsLoadingDiscounts(false);
      }
    };
    loadRules();
    return () => {
      isMounted = false;
    };
  }, []);

  // Timer for UPI QR Code
  useEffect(() => {
    if (paymentMethod !== "UPI" || qrTimer <= 0) return;
    const interval = setInterval(() => {
      setQrTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod, qrTimer]);

  // Rate calculations
  const getRate = () => {
    if (activeService === "Translation") {
      const routeKey = `${sourceLang} To ${targetLang}`;
      return TRANSLATION_RATE_CARD[routeKey] || 0.5;
    }
    return TYPING_RATE_CARD[typingLanguage] || 0.25;
  };

  const currentRate = getRate();
  const basePrice = wordCount * currentRate;
  const readExtra = hardToRead ? basePrice * HARD_TO_READ_MULTIPLIER : 0;
  const expressExtra = expressDelivery ? EXPRESS_DELIVERY_FEE : 0;
  const rawSubtotal = basePrice + readExtra + expressExtra;

  // Evaluate dynamic discount based on user accountType and date validity
  const userAccountType = (user?.accountType || user?.AccountType || user?.role || "General").trim();
  const appliedDiscount: AppliedDiscount = evaluateDiscount(
    discountRules,
    userAccountType,
    rawSubtotal
  );
  const finalAmount = appliedDiscount.applicable ? appliedDiscount.finalPrice : rawSubtotal;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFiles = Array.from(e.target.files);
      setFiles(uploadedFiles);
      // Simulate word count detection
      setWordCount(Math.floor(Math.random() * 400) + 250);
      toast.success(`${uploadedFiles.length} file(s) attached successfully!`);
    }
  };

  const handleProceed = () => {
    if (!user) {
      toast.error(
        lang === "gu"
          ? "ચુકવણી આગળ વધારવા માટે કૃપા કરીને પહેલા લોગિન કરો."
          : "Please login first to proceed with document service order."
      );
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }

    if (!isDeclarationAccepted) {
      toast.error(
        lang === "gu"
          ? "કૃપા કરીને સેવા શરતો અને ઘોષણા સ્વીકારો."
          : "Please accept the verification declaration to proceed."
      );
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success(
        appliedDiscount.applicable
          ? `Order initialized with ${appliedDiscount.discountBadgeText}!`
          : "Order initialized successfully!"
      );
      if (onFinish) {
        onFinish({
          orderId,
          service: activeService,
          rawPrice: rawSubtotal,
          finalAmount,
          discountRule: appliedDiscount.ruleName,
          discountAmount: appliedDiscount.discountAmount,
          paymentMethod,
          billingDetails: {
            originalAmount: rawSubtotal,
            discountApplied: appliedDiscount.applicable ? `${appliedDiscount.ruleName}_${appliedDiscount.percentage}%` : "None",
            discountValue: appliedDiscount.applicable ? appliedDiscount.discountAmount : 0,
            finalAmount: finalAmount,
          },
          originalAmount: rawSubtotal,
          discountApplied: appliedDiscount.applicable ? `${appliedDiscount.ruleName}_${appliedDiscount.percentage}%` : "None",
          discountValue: appliedDiscount.applicable ? appliedDiscount.discountAmount : 0,
        });
      }
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Service Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-black uppercase tracking-wider mb-2">
          <ShieldCheck size={14} className="text-blue-600 dark:text-blue-400" />
          Verified Document Processing
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Document Digitization & Translation Center
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          High-accuracy judicial & certified translations, typing, and OCR digitization.
        </p>
      </div>

      {/* Dynamic Discount Notification Banner (if applied) */}
      {appliedDiscount.applicable && (
        <div className="mb-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm">
              <Percent size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                  {appliedDiscount.ruleName}
                </h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 rounded-full text-[10px] font-black uppercase">
                  <Sparkles size={10} className="animate-pulse" /> Active Offer
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">
                Eligible account type (<strong>{appliedDiscount.targetAccountType}</strong>) — {appliedDiscount.discountBadgeText} is automatically applied!
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1.5 bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-xs">
              {appliedDiscount.percentage}% OFF
            </span>
          </div>
        </div>
      )}

      {/* Service Type Switcher */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setActiveService("Translation")}
          className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${
            activeService === "Translation"
              ? "border-blue-600 bg-blue-50/30 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          <Languages size={18} />
          Certified Translation
        </button>
        <button
          type="button"
          onClick={() => setActiveService("Typing")}
          className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-2 font-black text-sm transition-all ${
            activeService === "Typing"
              ? "border-blue-600 bg-blue-50/30 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          }`}
        >
          <Keyboard size={18} />
          Professional Typing
        </button>
      </div>

      {/* File Upload Zone */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-xs mb-6">
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors relative cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-600 dark:text-blue-400">
            <Upload size={24} />
          </div>
          <p className="font-bold text-slate-800 dark:text-white text-base">
            {files.length > 0
              ? `${files.length} document(s) selected`
              : "Click or Drag & Drop Documents here"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports PDF, JPG, PNG, DOCX up to 25MB per file
          </p>
        </div>

        {/* Add-ons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={() => setHardToRead(!hardToRead)}
            className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
              hardToRead
                ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  hardToRead ? "bg-amber-600 border-amber-600 text-white" : "border-slate-300"
                }`}
              >
                {hardToRead && <Check size={10} strokeWidth={3} />}
              </div>
              <div>
                <p className="text-xs font-bold">Hard to read / Handwritten</p>
                <p className="text-[10px] text-slate-400">+50% handwriting surcharge</p>
              </div>
            </div>
            <PenTool size={16} className={hardToRead ? "text-amber-600" : "text-slate-400"} />
          </button>

          <button
            type="button"
            onClick={() => setExpressDelivery(!expressDelivery)}
            className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
              expressDelivery
                ? "border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  expressDelivery ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300"
                }`}
              >
                {expressDelivery && <Check size={10} strokeWidth={3} />}
              </div>
              <div>
                <p className="text-xs font-bold">Express Delivery</p>
                <p className="text-[10px] text-slate-400">Guaranteed in &lt;4 hours (+₹50)</p>
              </div>
            </div>
            <Zap size={16} className={expressDelivery ? "text-blue-600" : "text-slate-400"} />
          </button>
        </div>
      </div>

      {/* Pricing & Checkout Summary Box */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
          Price Estimation & Dynamic Discount Breakdown
        </h3>

        <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span>Base Quote ({wordCount} words @ ₹{currentRate.toFixed(2)}/word):</span>
            <span className="font-mono">₹{basePrice.toFixed(2)}</span>
          </div>

          {hardToRead && (
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>Handwritten Decipher Surcharge (+50%):</span>
              <span className="font-mono">+₹{readExtra.toFixed(2)}</span>
            </div>
          )}

          {expressDelivery && (
            <div className="flex justify-between text-blue-600 dark:text-blue-400">
              <span>Express Delivery Fee:</span>
              <span className="font-mono">+₹{expressExtra.toFixed(2)}</span>
            </div>
          )}

          {/* Dynamic Discount Line */}
          {appliedDiscount.applicable && (
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-bold border-t border-dashed border-emerald-200 dark:border-emerald-800 pt-2">
              <span className="flex items-center gap-1">
                <Tag size={12} />
                {appliedDiscount.discountBadgeText}:
              </span>
              <span className="font-mono font-black">
                -₹{appliedDiscount.discountAmount.toFixed(2)}
              </span>
            </div>
          )}

          {/* Final Total Row with Strikethrough & Green Badge */}
          <div className="flex justify-between items-center text-base font-black text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-3 mt-2">
            <span>Total Payable Amount:</span>
            <div className="text-right">
              {appliedDiscount.applicable ? (
                <div className="flex items-center gap-2">
                  <s className="text-slate-400 text-sm font-bold line-through">
                    ₹{rawSubtotal.toFixed(2)}
                  </s>
                  <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black">
                    ₹{finalAmount.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-lg font-black">₹{finalAmount.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Green Badge */}
          {appliedDiscount.applicable && (
            <div className="flex justify-end pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-black border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                {appliedDiscount.discountBadgeText}
              </span>
            </div>
          )}
        </div>

        {/* Declaration Checkbox */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <label className="flex items-start gap-3 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={isDeclarationAccepted}
              onChange={(e) => setIsDeclarationAccepted(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
            />
            <span>
              I certify that all uploaded documents are genuine and accurate. I authorize Amit Online Services to process and digitize these records.
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            type="button"
            disabled={isUploading || !isDeclarationAccepted}
            onClick={handleProceed}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing Order Securely...
              </>
            ) : (
              <>
                <CreditCard size={18} />
                Pay ₹{finalAmount.toFixed(2)} & Submit Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentServiceCenter;
