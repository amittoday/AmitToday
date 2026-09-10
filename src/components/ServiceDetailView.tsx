import React, { useState, useEffect } from "react";
import { ChevronRight, FileText, Download, Check, AlertCircle, ShoppingBag, ShieldCheck, ArrowLeft, Maximize2, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import PdfViewer from "./PdfViewer";

interface Service {
  ID: string;
  Category: string;
  SubCategory: string;
  ServiceName: string;
  BasePrice?: number;
  TurnaroundTime?: string;
  RequiredDocuments?: string;
  Status: string;
  Description?: string;
  GovtFee?: number;
  GovFee?: number;
  ServiceCharge?: number;
  CourierCharge?: number;
  OtherCharges?: number;
  OfficialPdfUrl?: string;
  Guidelines?: string;
  PDF_URL?: string;
  RequiredDocIDs?: string;
}

interface DocumentList {
  ID: string;
  ListName: string;
  Documents: string[];
}

const DOC_DICTIONARY: { [key: string]: { gu: string; en: string } } = {
  "DOC-AADHAAR": { gu: "આધાર કાર્ડ નકલ", en: "Aadhaar Card Copy" },
  "DOC-PAN": { gu: "પાન કાર્ડ નકલ", en: "PAN Card Copy" },
  "DOC-VOTER": { gu: "ચૂંટણી કાર્ડ નકલ", en: "Voter ID Card Copy" },
  "DOC-LIGHT-BILL": { gu: "લાઇટ બિલ નકલ", en: "Electricity Bill Copy" },
  "DOC-RATION-CARD": { gu: "રેશન કાર્ડ નકલ", en: "Ration Card Copy" },
  "DOC-INCOME": { gu: "આવકનો દાખલો", en: "Income Certificate" },
  "DOC-CASTE": { gu: "જાતિનો દાખલો", en: "Caste Certificate" },
  "DOC-SCHOOL-LC": { gu: "શાળા છોડ્યાનું પ્રમાણપત્ર (L.C.)", en: "School Leaving Certificate" },
  "DOC-PASSPORT-PHOTO": { gu: "પાસપોર્ટ સાઇઝ ફોટો", en: "Passport Size Photograph" },
  "DOC-SIGNATURE": { gu: "સહી નમૂનો", en: "Signature Sample" },
  "DOC-SELF-DEC": { gu: "સ્વ-ઘોષણા પત્રક", en: "Self Declaration Form" },
  "DOC-DRIVING-LICENSE": { gu: "ડ્રાઇવિંગ લાયસન્સ", en: "Driving License Copy" },
  "DOC-MARKSHEET": { gu: "માર્કશીટ નકલ", en: "Academic Marksheet" },
  "DOC-NON-CREMY": { gu: "નોન-ક્રીમીલેયર પ્રમાણપત્ર", en: "Non-Creamy Layer Certificate" },
  "DOC-PASSPORT": { gu: "પાસપોર્ટ નકલ", en: "Passport Copy" }
};

interface ServiceDetailViewProps {
  service: Service;
  lang: "en" | "gu";
  onBack: () => void;
  onApply: () => void;
}

export default function ServiceDetailView({ service, lang, onBack, onApply }: ServiceDetailViewProps) {
  const [checklist, setChecklist] = useState<DocumentList | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedDocs, setCheckedDocs] = useState<{ [key: string]: boolean }>({});

  const parsedDocIds = (() => {
    const rawIds = service.RequiredDocIDs;
    if (!rawIds) return [];
    if (Array.isArray(rawIds)) {
      return rawIds.map(id => String(id).trim()).filter(id => id.length > 0);
    }
    
    let parsed: any = rawIds;
    if (typeof rawIds === "string") {
      try {
        parsed = JSON.parse(rawIds);
      } catch (e) {
        // Not a JSON string, keep as string
      }
    }

    if (Array.isArray(parsed)) {
      return parsed.map(id => String(id).trim()).filter(id => id.length > 0);
    }

    const strIds = String(rawIds).trim();
    if (strIds.includes(",") || strIds.includes(";")) {
      return strIds.split(/[,;]/).map(id => id.trim()).filter(id => id.length > 0);
    }
    return strIds ? [strIds] : [];
  })();

  const toggleDocChecked = (id: string) => {
    setCheckedDocs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Convert prices to numbers safely
  const govtFee = Number(service.GovFee !== undefined ? service.GovFee : (service.GovtFee || 0));
  const serviceCharge = Number(service.ServiceCharge !== undefined ? service.ServiceCharge : (service.BasePrice || 150));
  const courierCharge = Number(service.OtherCharges !== undefined ? service.OtherCharges : (service.CourierCharge || 0));
  const totalPayable = govtFee + serviceCharge + courierCharge;

  useEffect(() => {
    const fetchDocumentsChecklist = async () => {
      // Find by RequiredDocuments or RequiredDocIDs
      const searchId = service.RequiredDocuments || (service.RequiredDocIDs ? String(service.RequiredDocIDs) : "");
      if (!searchId) return;
      setLoading(true);
      try {
        const res = await axios.get("/api/document-lists");
        if (res.data && res.data.success) {
          const found = res.data.data.find((item: any) => item.ID === searchId || item.ListName === searchId);
          if (found) {
            setChecklist(found);
          }
        }
      } catch (err) {
        console.error("Error fetching linked documents checklist details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocumentsChecklist();
  }, [service.RequiredDocuments, service.RequiredDocIDs]);

  const getEmbeddablePdfUrl = (url: string) => {
    if (!url) return "";
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  const hasPdf = typeof service.PDF_URL === "string" && service.PDF_URL.trim().length > 0;
  const rawPdfUrl = hasPdf ? service.PDF_URL!.trim() : "";
  const pdfUrl = getEmbeddablePdfUrl(rawPdfUrl);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-2xl p-6 sm:p-10 text-left font-sans max-w-5xl mx-auto space-y-8" id="service-detail-funnel">
      
      {/* Detail upper navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-500 hover:text-slate-700 dark:hover:text-white tracking-widest cursor-pointer select-none"
        >
          <ArrowLeft size={14} /> {lang === "gu" ? "યાદી પર પાછા ફરો" : "Back to catalog"}
        </button>
        <span className="text-[10px] uppercase font-black tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-xl">
          {service.Category}
        </span>
      </div>

      {/* Main scheme metadata header layout */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono text-slate-400 font-black tracking-widest uppercase">
          SERVICE CODE: {service.ID}
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
          {service.ServiceName}
        </h2>
        {service.TurnaroundTime && (
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-indigo-505 bg-indigo-650 rounded-full animate-ping mr-1" />
            {lang === "gu" ? "અંદાજીત નિકાલ સમય" : "Estimated Release Time"}: {service.TurnaroundTime}
          </p>
        )}
      </div>

      {/* Split layout: PDF viewer & Scheme details */}
      <div className={`grid grid-cols-1 ${hasPdf ? "lg:grid-cols-12" : "lg:grid-cols-1"} gap-8`}>
        
        {/* Left pane: Details, pricing and checklists */}
        <div className={hasPdf ? "lg:col-span-6 space-y-6" : "lg:col-span-12 space-y-6"}>
          
          {/* Detailed description supporting Markdown */}
          <div className="bg-slate-50/50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-150/80 dark:border-slate-800/80 space-y-3 prose dark:prose-invert">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">
              {lang === "gu" ? "યોજના વિશે માહિતી (Scheme Guidelines)" : "Detailed Scheme Memo"}
            </h4>
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed parse-desc-p space-y-2">
              {service.Guidelines ? (
                <ReactMarkdown>{service.Guidelines}</ReactMarkdown>
              ) : service.Description ? (
                <ReactMarkdown>{service.Description}</ReactMarkdown>
              ) : (
                <p>
                  {lang === "gu" 
                    ? "આ સત્તાવાર સરકારી યોજના અંતર્ગત સંબંધિત નાગરિકો માટે ડિજિટલ રજીસ્ટ્રેશન ફોર્મ ઉપલબ્ધ કરાવવામાં આવેલ છે. વિગતવાર દસ્તાવેજી પાત્રતા ચકાસીને વિગતો સબમિટ કરો." 
                    : "Official administrative online service registration is now facilitated dynamically. Please cross-reference checklists and submit forms below."}
                </p>
              )}
            </div>
          </div>

          {/* Pricing Arithmetic [સરકારી ફી (₹X) + સર્વિસ ચાર્જ (₹Y) + અન્ય ચાર્જ (₹Z) = કુલ ચૂકવવાપાત્ર રકમ (₹Total)] */}
          <div className="border border-emerald-100 dark:border-emerald-900/30 bg-emerald-500/5 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
              <ShoppingBag size={14} /> {lang === "gu" ? "ખર્ચ અને ફી પૃથ્થકરણ (Pricing Breakdown)" : "Dynamic Fee Breakdown"}
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-slate-650 dark:text-slate-400 pb-1.5 border-b border-dashed border-slate-150 dark:border-slate-800">
                <span className="font-semibold">{lang === "gu" ? "૧. સરકારી પોર્ટલ ફી (Govt Fee):" : "1. Government Portal Fee:"}</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200">₹{govtFee}</span>
              </div>
              <div className="flex justify-between items-center text-slate-650 dark:text-slate-400 pb-1.5 border-b border-dashed border-slate-150 dark:border-slate-800">
                <span className="font-semibold">{lang === "gu" ? "૨. સર્વિસ ચાર્જ (Service Charge):" : "2. Dynamic Service Charge:"}</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200">₹{serviceCharge}</span>
              </div>
              <div className="flex justify-between items-center text-slate-650 dark:text-slate-400 pb-1.5 border-b border-dashed border-slate-150 dark:border-slate-800">
                <span className="font-semibold">{lang === "gu" ? "૩. કુરિયર અને અન્ય ચાર્જ (Courier Charge):" : "3. Courier & Postage Charge:"}</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200">₹{courierCharge}</span>
              </div>
              <div className="flex justify-between items-center pt-3 font-black text-slate-900 dark:text-white text-sm">
                <span>{lang === "gu" ? "કુલ ચૂકવવાપાત્ર રકમ (Total Payable):" : "Total Calculation Sum:"}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-lg">₹{totalPayable}</span>
              </div>
            </div>
            
            <div className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-xl text-center font-bold">
              {lang === "gu" ? "★ કોઈ ગુપ્ત ચાર્જ લાગુ નથી. સચોટ ગણતરી રસીદ સાથે મેળવો ★" : "★ All prices fully verified with zero hidden administrative overhead ★"}
            </div>
          </div>

          {/* Checklist Area based on Linked Document List ID */}
          <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-805 dark:text-white flex items-center gap-1.5">
              <FileText size={14} className="text-blue-500" /> {lang === "gu" ? "જરૂરી આધારોની યાદી (Checklist)" : "Required Documents Checklist"}
            </h4>

            {parsedDocIds.length > 0 ? (
              <div className="space-y-3.5">
                <p className="text-[10px] text-indigo-500 uppercase font-black tracking-wide">
                  {lang === "gu" ? "દસ્તાવેજ ચકાસણી યાદી" : "STRUCTURED DOCUMENT VERIFICATION CHECKLIST"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {parsedDocIds.map((id, idx) => {
                    const docInfo = DOC_DICTIONARY[id] || { gu: id.replace("DOC-", "").replace(/-/g, " "), en: id.replace("DOC-", "").replace(/-/g, " ") };
                    const isChecked = !!checkedDocs[id];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleDocChecked(id)}
                        className={`flex items-start gap-2 text-xs font-semibold p-2.5 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-805 dark:text-emerald-300"
                            : "border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // toggled by parent div click
                          className="rounded text-emerald-500 focus:ring-emerald-450 shrink-0 mt-0.5 cursor-pointer accent-emerald-500"
                        />
                        <span className="leading-tight">{lang === "gu" ? docInfo.gu : docInfo.en}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : loading ? (
              <p className="text-[11px] text-slate-400 font-bold animate-pulse">Syncing checklist database...</p>
            ) : checklist ? (
              <div className="space-y-3">
                <p className="text-[10px] text-indigo-500 uppercase font-black tracking-wide">
                  LIST ID: {checklist.ListName}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {checklist.Documents?.map((doc, idx) => {
                    const isChecked = !!checkedDocs[doc];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleDocChecked(doc)}
                        className={`flex items-start gap-2 text-xs font-semibold p-2.5 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-805 dark:text-emerald-305"
                            : "border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-500 focus:ring-emerald-450 shrink-0 mt-0.5 cursor-pointer accent-emerald-500"
                        />
                        <span className="leading-tight">{doc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex gap-2 p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/40 text-amber-800 dark:text-amber-400 rounded-xl text-xs">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p className="font-semibold">
                  {lang === "gu" 
                    ? "નિયત દસ્તાવેજ જુથ સંલગ્ન નથી. કૃપા કરીને ઓળખ અને સરનામાના સામાન્ય પુરાવા સ્કેન કોપી તૈયાર રાખો." 
                    : "No structured document group linked. Keep general identity and residence proofs ready."}
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={onApply}
            className="w-full flex items-center justify-center gap-2 bg-blue-650 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest py-4.5 rounded-2xl cursor-pointer select-none shadow-xl shadow-blue-600/10 active:scale-[0.98] transition-all"
          >
            {lang === "gu" ? "અરજી કરો (Apply Now)" : "Apply & Fill Form"} <ChevronRight size={18} />
          </button>

        </div>

        {/* Right pane: PDF viewer Integration Embed */}
        {hasPdf && (
          <div className="lg:col-span-6 flex flex-col space-y-3">
            <div className="flex justify-between items-center select-none">
              <span className="text-[10px] uppercase tracking-wider font-mono text-slate-405 font-bold">
                {lang === "gu" ? "સત્તાવાર માહિતી પત્રક (Official GR File)" : "Official GR / Guide Documents"}
              </span>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open in target <ExternalLink size={12} />
              </a>
            </div>

            <div className="w-full">
              <PdfViewer fileUrl={pdfUrl} />
            </div>
            
            <div className="flex items-center gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/15 rounded-xl text-[10px] text-indigo-900/80 dark:text-indigo-400 font-semibold leading-relaxed">
              <ShieldCheck size={14} className="indigo-600 shrink-0" />
              <span>
                {lang === "gu" 
                  ? "આ દસ્તાવેજ સત્તાવાર ગેઝેટ (GR) અથવા અરજી પત્રક છે, જે સચોટ માર્ગદર્શન પૂરું પાડે છે." 
                  : "This PDF contains verified administrative guidelines or empty legal formats for accurate submissions."}
              </span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
