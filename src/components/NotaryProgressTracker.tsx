import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Stamp, 
  ShieldCheck, 
  AlertCircle, 
  Download, 
  Sparkles, 
  RefreshCw, 
  ChevronRight,
  Info,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { NotaryApplicationRecord } from "./NotaryVerificationDashboard";

interface Props {
  applications: NotaryApplicationRecord[];
  onRefresh?: () => void;
  onFetchReceipt?: (orderId: string) => void;
}

export default function NotaryProgressTracker({ applications, onRefresh, onFetchReceipt }: Props) {
  const [selectedAppId, setSelectedAppId] = useState<string>(
    applications[0]?.applicationId || "AOS-NOTARY-8942"
  );

  const currentApp = applications.find(a => a.applicationId === selectedAppId) || applications[0] || {
    applicationId: "AOS-NOTARY-8942",
    applicantName: "Adv. Rajesh P. Mehta",
    email: "rajesh.advocate@gmail.com",
    status: "Pending Admin Draft",
    barEnrolment: "G/1084/2012",
    createdAt: new Date().toISOString()
  };

  const status = currentApp.status || "Docs Received";

  // Calculate active step number (1 to 5)
  const getActiveStep = (): number => {
    switch (status) {
      case "Docs Received":
        return 2; // Step 1 complete, Step 2/3 active
      case "Pending Admin Draft":
        return 3; // Step 1 & 2 complete, Step 3 active
      case "Draft Generated":
        return 4;
      case "ARN Generated":
      case "Completed":
        return 5;
      default:
        return 1;
    }
  };

  const activeStep = getActiveStep();

  const trackerSteps = [
    {
      num: 1,
      title: "Docs Received",
      guTitle: "દસ્તાવેજ મળ્યા",
      description: "Form I, Bar Certificate, Identity proofs & photo submitted.",
      statusText: activeStep > 1 ? "Completed" : activeStep === 1 ? "In Progress" : "Pending"
    },
    {
      num: 2,
      title: "AI OCR Extraction",
      guTitle: "AI OCR ચકાસણી",
      description: "Automated PAN, Bar ID & English-Gujarati translation audit.",
      statusText: activeStep > 2 ? "Completed" : activeStep === 2 ? "In Progress" : "Pending"
    },
    {
      num: 3,
      title: "Pending Admin Draft",
      guTitle: "એડમિન ડ્રાફ્ટ પેન્ડિંગ",
      description: "Staff/Admin verified OCR data & compiling official Notary Draft.",
      statusText: activeStep > 3 ? "Completed" : activeStep === 3 ? "In Progress" : "Pending"
    },
    {
      num: 4,
      title: "Notary Register Seal",
      guTitle: "નોટરી રજિસ્ટર સીલ",
      description: "Entry into Central Notary Register & Digital Seal placement.",
      statusText: activeStep > 4 ? "Completed" : activeStep === 4 ? "In Progress" : "Pending"
    },
    {
      num: 5,
      title: "ARN & Sanad Completed",
      guTitle: "સનદ અને રસીદ પૂર્ણ",
      description: "Application Registration Number issued with downloadable PDF receipt.",
      statusText: activeStep === 5 ? "Completed" : "Pending"
    }
  ];

  const progressPercent = activeStep === 1 ? 20 : activeStep === 2 ? 40 : activeStep === 3 ? 65 : activeStep === 4 ? 85 : 100;

  const handleDownloadSummary = () => {
    toast.info("Generating Application Summary Report...");
    window.print();
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F7FA] text-[#0A192F] text-xs font-black uppercase tracking-wider rounded-lg mb-2">
            <Sparkles size={13} className="text-[#0A192F]" /> Verification Progress Tracker
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Application Verification Status</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Real-time status tracking for Central Notary Public Portal filings.</p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh Tracker
          </button>
        )}
      </div>

      {/* Application Selector Tabs */}
      {applications.length > 1 && (
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Select Application to Track:</label>
          <div className="flex flex-wrap gap-2">
            {applications.map(app => (
              <button
                key={app.applicationId}
                onClick={() => setSelectedAppId(app.applicationId)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedAppId === app.applicationId
                    ? "bg-[#0A192F] text-white shadow-md shadow-slate-900/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {app.applicationId} ({app.status})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Active Application Summary Card */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-800 text-lg">{currentApp.applicationId}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              status === "Docs Received" ? "bg-amber-100 text-amber-800 border border-amber-300" :
              status === "Pending Admin Draft" ? "bg-blue-100 text-blue-800 border border-blue-300" :
              "bg-emerald-100 text-emerald-800 border border-emerald-300"
            }`}>
              {status}
            </span>
          </div>
          <p className="text-xs text-slate-600 font-semibold mt-1">
            Applicant: <strong className="text-slate-800">{currentApp.applicantName}</strong> ({currentApp.barEnrolment})
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-right">
          <div>
            <p className="text-xs text-slate-500 font-bold">Estimated Turnaround:</p>
            <p className="text-sm font-black text-[#0A192F] flex items-center justify-end gap-1 mt-0.5">
              <Clock size={14} /> 2 to 4 Business Hours
            </p>
          </div>
          <button
            onClick={handleDownloadSummary}
            className="px-4 py-2.5 bg-[#0A192F] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center gap-1.5 cursor-pointer no-print shrink-0"
            title="Download PDF Application Summary Report"
          >
            <Download size={14} /> Download Application Summary
          </button>
        </div>
      </div>

      {/* Real-time Alert Box */}
      <div className={`p-4 rounded-2xl mb-8 border flex items-start gap-3 ${
        status === "Pending Admin Draft"
          ? "bg-blue-50 border-blue-200 text-blue-900"
          : status === "Docs Received"
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-emerald-50 border-emerald-200 text-emerald-900"
      }`}>
        <Info size={20} className="mt-0.5 shrink-0" />
        <div className="text-xs">
          {status === "Pending Admin Draft" && (
            <>
              <p className="font-extrabold text-sm mb-1">🎉 OCR Verified! Application in 'Pending Admin Draft' Phase</p>
              <p className="opacity-90 leading-relaxed">
                Great news! Our administrative team has reviewed and verified your document OCR checks. Your application is now in the <strong>Pending Admin Draft</strong> phase, where our official legal drafting desk compiles your Notary draft.
              </p>
            </>
          )}

          {status === "Docs Received" && (
            <>
              <p className="font-extrabold text-sm mb-1">📋 Documents Received & OCR Scan Complete</p>
              <p className="opacity-90 leading-relaxed">
                Your application and uploaded PDF attachments have been received and scanned by our AI OCR engine. Staff/Admin is currently conducting manual verification before approving it to <strong>Pending Admin Draft</strong>.
              </p>
            </>
          )}

          {(status === "ARN Generated" || status === "Completed") && (
            <>
              <p className="font-extrabold text-sm mb-1">✅ Notary Application Finalized & Sanad Issued</p>
              <p className="opacity-90 leading-relaxed">
                Your Application Registration Number (ARN) has been officially recorded in the Central Notary Public Ledger. You can download your official tax receipt below.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between items-center text-xs font-extrabold text-slate-700 mb-2">
          <span>Overall Verification Progress</span>
          <span className="text-[#0A192F]">{progressPercent}% Completed</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200 p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#0A192F] to-blue-600 rounded-full"
          />
        </div>
      </div>

      {/* Vertical / Grid Step Timeline */}
      <div className="space-y-4">
        {trackerSteps.map((s) => {
          const isDone = s.num < activeStep || (s.num === 5 && activeStep === 5);
          const isCurrent = s.num === activeStep && activeStep !== 5;
          const isPending = s.num > activeStep;

          return (
            <div 
              key={s.num}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                isCurrent 
                  ? "bg-blue-50/60 border-blue-300 shadow-md shadow-blue-500/5 ring-1 ring-blue-300"
                  : isDone 
                  ? "bg-slate-50/80 border-slate-200" 
                  : "bg-white border-slate-100 opacity-60"
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 ${
                isDone 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                  : isCurrent 
                  ? "bg-[#0A192F] text-white shadow-md shadow-slate-900/20" 
                  : "bg-slate-100 text-slate-400 border border-slate-200"
              }`}>
                {isDone ? <Check size={18} /> : s.num}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                    {s.title}
                    <span className="text-xs text-slate-400 font-normal">({s.guTitle})</span>
                  </h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isDone ? "bg-emerald-100 text-emerald-800" :
                    isCurrent ? "bg-blue-100 text-blue-800 animate-pulse" :
                    "bg-slate-100 text-slate-400"
                  }`}>
                    {s.statusText}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      {(status === "ARN Generated" || status === "Completed") && onFetchReceipt && (
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button
            onClick={() => onFetchReceipt(currentApp.applicationId)}
            className="px-6 py-3 bg-[#0A192F] hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Download size={16} /> Download Official Notary Receipt & Certificate
          </button>
        </div>
      )}
    </div>
  );
}
