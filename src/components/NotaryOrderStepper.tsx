import React from "react";
import { Check, Clock, FileText, Stamp, CheckCircle2 } from "lucide-react";

interface NotaryOrderStepperProps {
  status: string;
  className?: string;
}

export function NotaryOrderStepper({ status, className = "" }: NotaryOrderStepperProps) {
  const normalizedStatus = String(status || "").trim().toLowerCase();

  // Determine current active step index:
  // 0: Docs Received
  // 1: Pending Admin Draft
  // 2: ARN Generated
  // 3: Completed
  let currentStep = 0;
  if (
    normalizedStatus.includes("completed") ||
    normalizedStatus.includes("verified") ||
    normalizedStatus.includes("approved") ||
    normalizedStatus.includes("issued")
  ) {
    currentStep = 3;
  } else if (
    normalizedStatus.includes("arn") ||
    normalizedStatus.includes("ready") ||
    normalizedStatus.includes("generated")
  ) {
    currentStep = 2;
  } else if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("draft") ||
    normalizedStatus.includes("review")
  ) {
    currentStep = 1;
  } else {
    currentStep = 0; // Docs Received
  }

  const steps = [
    { label: "Docs Received", icon: FileText, desc: "OCR Scanned" },
    { label: "Pending Admin Draft", icon: Clock, desc: "Drafting Review" },
    { label: "ARN Generated", icon: Stamp, desc: "Stamp & ARN" },
    { label: "Completed", icon: CheckCircle2, desc: "Final Certificate" },
  ];

  return (
    <div className={`w-full py-3 px-2 bg-slate-900/40 dark:bg-slate-950/60 rounded-xl border border-slate-700/50 my-3 font-sans ${className}`}>
      <div className="flex items-center justify-between w-full relative max-w-xl mx-auto px-2">
        {/* Background track line */}
        <div className="absolute top-[18px] left-6 right-6 h-1 bg-slate-700/80 rounded-full z-0" />

        {/* Active progress track line */}
        <div
          className="absolute top-[18px] left-6 h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500 rounded-full z-0 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, (currentStep / (steps.length - 1)) * 88))}%` }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          const StepIcon = step.icon;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-md ${
                  isDone
                    ? "bg-emerald-500 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400/40"
                    : isCurrent
                    ? "bg-amber-400 text-slate-950 ring-4 ring-amber-400/30 scale-110 shadow-amber-400/20 font-black animate-pulse"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {isDone ? (
                  <Check size={16} className="stroke-[3]" />
                ) : (
                  <StepIcon size={14} />
                )}
              </div>

              <span
                className={`text-[10px] sm:text-[11px] font-black mt-2 text-center transition-colors tracking-tight whitespace-nowrap ${
                  isDone
                    ? "text-emerald-400"
                    : isCurrent
                    ? "text-amber-300 font-extrabold"
                    : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
