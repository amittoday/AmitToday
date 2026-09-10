import React from "react";
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Truck, 
  Sparkles,
  Search
} from "lucide-react";
import { motion } from "motion/react";

export type OrderLifecycleStatus = 
  | "Pending" 
  | "In Review" 
  | "Processing" 
  | "Query Raised" 
  | "Ready for Delivery" 
  | "Completed" 
  | "Cancelled";

interface OrderProgressStepperProps {
  status: string;
  createdAt?: string;
  updatedAt?: string;
  orderId?: string;
  serviceType?: string;
  trackingUrl?: string;
  notes?: string;
  className?: string;
}

interface StepDef {
  key: string;
  titleEn: string;
  titleGu: string;
  descEn: string;
  descGu: string;
  icon: React.ReactNode;
}

const LIFECYCLE_STEPS: StepDef[] = [
  {
    key: "received",
    titleEn: "Order Submitted",
    titleGu: "ઓર્ડર સ્વીકારાયો",
    descEn: "Application logged & payment confirmed",
    descGu: "અરજી અને પેમેન્ટ નોંધાયું છે",
    icon: <FileText size={16} />,
  },
  {
    key: "review",
    titleEn: "Document Verification",
    titleGu: "દસ્તાવેજ ચકાસણી",
    descEn: "Legal staff checking attachments & OCR",
    descGu: "કાગળો અને ઓળખ પુરાવા ચકાસાય છે",
    icon: <Search size={16} />,
  },
  {
    key: "drafting",
    titleEn: "Drafting & Processing",
    titleGu: "ડ્રાફ્ટિંગ અને પ્રોસેસિંગ",
    descEn: "Translation / Notary seal / Govt filing",
    descGu: "ભાષાંતર, નોટરી અથવા સરકારી ફાઇલિંગ",
    icon: <Sparkles size={16} />,
  },
  {
    key: "completed",
    titleEn: "Completed & Dispatched",
    titleGu: "પૂર્ણ અને ઉપલબ્ધ",
    descEn: "Digital download ready / speed post dispatched",
    descGu: "ડાઉનલોડ તૈયાર અથવા સ્પીડ પોસ્ટ રવાના",
    icon: <ShieldCheck size={16} />,
  },
];

export default function OrderProgressStepper({
  status,
  createdAt,
  orderId,
  serviceType,
  notes,
  className = "",
}: OrderProgressStepperProps) {
  const normStatus = (status || "Pending").toLowerCase().trim();

  // Determine active step index (0 to 3)
  let activeStepIndex = 0;
  let isQueryRaised = false;
  let isCancelled = false;

  if (normStatus.includes("cancel") || normStatus.includes("reject")) {
    isCancelled = true;
    activeStepIndex = 0;
  } else if (normStatus.includes("query") || normStatus.includes("issue") || normStatus.includes("clarification")) {
    isQueryRaised = true;
    activeStepIndex = 1;
  } else if (normStatus.includes("complete") || normStatus.includes("deliver") || normStatus.includes("dispatched") || normStatus.includes("ready")) {
    activeStepIndex = 3;
  } else if (normStatus.includes("process") || normStatus.includes("draft") || normStatus.includes("translat") || normStatus.includes("typing") || normStatus.includes("notar")) {
    activeStepIndex = 2;
  } else if (normStatus.includes("review") || normStatus.includes("check") || normStatus.includes("verif")) {
    activeStepIndex = 1;
  } else {
    // Default Pending
    activeStepIndex = 0;
  }

  return (
    <div
      id={`order-progress-stepper-${orderId || "item"}`}
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 sm:p-5 ${className}`}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200/60 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Order Status:
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[11px] ${
              isCancelled
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                : isQueryRaised
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse"
                : activeStepIndex === 3
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
            }`}
          >
            {status || "Pending"}
          </span>
        </div>

        {createdAt && (
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Clock size={13} />
            <span>Initiated: {new Date(createdAt).toLocaleDateString("en-IN")}</span>
          </div>
        )}
      </div>

      {/* Stepper Graphic */}
      <div className="relative">
        {/* Progress Line */}
        <div className="hidden sm:block absolute top-4 left-6 right-6 h-1 bg-slate-200 dark:bg-slate-800 -z-0">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isQueryRaised ? "bg-amber-500" : isCancelled ? "bg-rose-500" : "bg-blue-600"
            }`}
            style={{ width: `${(activeStepIndex / 3) * 100}%` }}
          />
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative z-10">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = idx < activeStepIndex || (idx === 3 && activeStepIndex === 3);
            const isCurrent = idx === activeStepIndex && activeStepIndex !== 3;

            return (
              <div
                key={step.key}
                className="flex sm:flex-col items-center sm:items-center text-left sm:text-center gap-3 sm:gap-2"
              >
                {/* Node icon circle */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                      : isCurrent
                      ? isQueryRaised
                        ? "bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950 shadow-md"
                        : "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950 shadow-md animate-pulse"
                      : "bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : step.icon}
                </div>

                {/* Node labels */}
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold ${
                      isCompleted || isCurrent
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {step.titleEn}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5 leading-snug">
                    {step.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Query Raised / Actionable Alert Box */}
      {isQueryRaised && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Attention Required from Applicant:</span>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300">
              {notes || "Our legal team requires document clarification or higher resolution scan. Please contact support via WhatsApp or email."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
