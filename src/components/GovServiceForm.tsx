import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Calendar, FileText, Check, UploadCloud, AlertCircle, Download, CreditCard, ChevronRight, Truck, Info } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import VoiceDictationButton from "./VoiceDictationButton";

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface PdfDownloadItem {
  title: string;
  url: string;
}

interface GovServiceFormProps {
  selectedService: {
    ID: string;
    ServiceName: string;
    BasePrice: number;
    RequiredDocuments?: string;
    RequiredFields?: string;
    PdfDownloads?: string;
    TurnaroundTime?: string;
    Category?: string;
  };
  user: any;
  lang: "en" | "gu";
  onBack: () => void;
  onFinish: (result: any) => void;
}

export default function GovServiceForm({ selectedService, user, lang, onBack, onFinish }: GovServiceFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Parse schemas
  const fields: FormField[] = (() => {
    try {
      if (selectedService.RequiredFields) {
        const parsed = typeof selectedService.RequiredFields === "string" 
          ? JSON.parse(selectedService.RequiredFields)
          : selectedService.RequiredFields;
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error parsing RequiredFields schema", e);
    }
    // Fallback standard fields if no schema defined
    return [
      { name: "applicantName", label: lang === "gu" ? "અરજદારનું પૂરું નામ" : "Applicant's Full Name", type: "text", required: true },
      { name: "mobileNumber", label: lang === "gu" ? "મોબાઈલ નંબર" : "Mobile Number", type: "tel", required: true },
      { name: "emailAddress", label: lang === "gu" ? "ઈમેઈલ આઈડી" : "Email Address", type: "email", required: false },
      { name: "additionalRemarks", label: lang === "gu" ? "વધારાની વિગતો / નોંધ" : "Additional Remarks", type: "textarea", required: false }
    ];
  })();

  const downloads: PdfDownloadItem[] = (() => {
    try {
      if (selectedService.PdfDownloads) {
        const parsed = typeof selectedService.PdfDownloads === "string"
          ? JSON.parse(selectedService.PdfDownloads)
          : selectedService.PdfDownloads;
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error parsing PdfDownloads schema", e);
    }
    return [];
  })();

  // Central Checklist State
  const [docGroup, setDocGroup] = useState<{ ListName: string; Documents: string[] } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: { file: File; base64: string } }>({});
  const [formInputs, setFormInputs] = useState<{ [key: string]: string }>({});
  
  // Physical shipping options
  const [physicalDelivery, setPhysicalDelivery] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  const [draftKey] = useState(`gov_service_draft_${selectedService?.ID || selectedService?.ServiceName?.replace(/\s+/g, '_') || 'service'}`);
  const [lastAutosavedTime, setLastAutosavedTime] = useState<string | null>(null);

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formInputs) setFormInputs(parsed.formInputs);
        if (parsed.shippingAddress) setShippingAddress(parsed.shippingAddress);
        if (typeof parsed.physicalDelivery === 'boolean') setPhysicalDelivery(parsed.physicalDelivery);
      }
    } catch (e) {
      console.warn("Could not restore draft in GovServiceForm", e);
    }
  }, [draftKey]);

  // Automated 3-second interval autosave for Government Service form
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(formInputs).length === 0 && !shippingAddress) return;
      
      const docsToSave: any = {};
      for (const [docName, data] of Object.entries(uploadedFiles)) {
        docsToSave[docName] = {
          fileName: data.file.name,
          fileType: data.file.type,
          size: data.file.size,
          base64: data.base64
        };
      }
      
      localStorage.setItem(draftKey, JSON.stringify({
        formInputs,
        documents: docsToSave,
        shippingAddress,
        physicalDelivery,
        savedAt: new Date().toISOString()
      }));
      
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutosavedTime(nowStr);
    }, 3000);

    return () => clearInterval(interval);
  }, [formInputs, uploadedFiles, draftKey, shippingAddress, physicalDelivery, selectedService.ServiceName]);

  // Load centralized document checklists in real time
  useEffect(() => {
    const fetchLinkedChecklists = async () => {
      const docListId = selectedService.RequiredDocuments;
      if (!docListId) return;

      try {
        const res = await axios.get("/api/document-lists");
        if (res.data && res.data.success) {
          const list = res.data.data.find((item: any) => item.ID === docListId);
          if (list) {
            setDocGroup(list);
          } else {
            console.warn(`Referenced Document Group ID '${docListId}' not found in database.`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch documents checklist linkage:", err);
      }
    };
    fetchLinkedChecklists();
  }, [selectedService.RequiredDocuments]);

  const handleInputChange = (name: string, value: string) => {
    setFormInputs({ ...formInputs, [name]: value });
  };

  const handleFileChange = (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error(lang === "gu" ? "ફાઇલ 8MB થી નાની હોવી જોઈએ." : "File size must be less than 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedFiles(prev => ({
        ...prev,
        [docName]: {
          file,
          base64: reader.result as string
        }
      }));
      toast.success(`${docName} ${lang === "gu" ? "અપલોડ થયું!" : "uploaded successfully!"}`);
    };
    reader.readAsDataURL(file);
  };

  // Validations per step
  const validateStep1 = () => {
    for (const f of fields) {
      if (f.required && !formInputs[f.name]?.trim()) {
        toast.error(lang === "gu" ? `કૃપા કરીને '${f.label}' દાખલ કરો.` : `${f.label} is required.`);
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    if (!docGroup) return true;
    for (const doc of docGroup.Documents) {
      if (!uploadedFiles[doc]) {
        toast.error(lang === "gu" ? `કૃપા કરીને '${doc}' નકલ અપલોડ કરો.` : `Please upload copy of ${doc}.`);
        return false;
      }
    }
    return true;
  };

  const calculateTotal = () => {
    let total = Number(selectedService.BasePrice || 150);
    if (physicalDelivery) total += 50; // extra charge for speed post delivery
    return total;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) {
      toast.error(lang === "gu" ? "કૃપા કરીને સરકારી દસ્તાવેજ સબમિશન માટે તમારી સંમતિ આપો." : "Please check authorization consent to proceed.");
      return;
    }

    // Compile base document package
    const docMeta = {
      serviceID: selectedService.ID,
      serviceName: selectedService.ServiceName,
      ...formInputs,
    };

    // Format files into the compiled attachments payload
    const compiledDocs = Object.keys(uploadedFiles).map(docName => ({
      name: docName,
      fileName: uploadedFiles[docName].file.name,
      fileType: uploadedFiles[docName].file.type,
      type: uploadedFiles[docName].file.type,
      content: uploadedFiles[docName].base64,
    }));

    const appFileBase64 = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(docMeta, null, 2))));

    onFinish({
      serviceType: "Online Government Service: " + selectedService.ServiceName,
      categoryId: selectedService.Category || "Online Application",
      formFields: formInputs,
      wordCount: 0,
      amount: calculateTotal(),
      customerDeclarationAccepted: true,
      shippingAddress: physicalDelivery ? shippingAddress : "",
      physicalDelivery: physicalDelivery,
      meta: docMeta,
      file: {
        name: `GovtApp_${selectedService.ID || Date.now()}.json`,
        type: "application/json",
        content: appFileBase64,
      },
      additionalDocs: compiledDocs,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl" id="gov-service-form-widget">
      {/* Dynamic Upper Bar indicating state progression */}
      <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex gap-2 items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <button onClick={onBack} className="text-xs font-black text-slate-500 hover:text-slate-700 dark:hover:text-white uppercase tracking-widest cursor-pointer">
          ← પાછા જાવ
        </button>
        <div className="flex gap-4 items-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === s ? "bg-blue-600 text-white" : step > s ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                {step > s ? <Check size={10} /> : s}
              </span>
              <span className={`text-[10px] uppercase font-black tracking-wider hidden sm:inline ${step === s ? "text-blue-600 font-black" : "text-slate-400"}`}>
                {s === 1 ? (lang === "gu" ? "અરજી ફોર્મ" : "Form inputs") : s === 2 ? (lang === "gu" ? "અપલોડ" : "Uploads") : (lang === "gu" ? "પેમેન્ટ" : "Payment")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-10 text-left">
        {/* Step 1: Input Fields */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <span className="text-[9px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-3 py-1 font-black uppercase rounded tracking-wider">
                SERVICE ID: {selectedService.ID}
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-1.5 font-sans leading-tight">
                {selectedService.ServiceName}
              </h2>
              {selectedService.TurnaroundTime && (
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                  અંદાજિત સમય: {selectedService.TurnaroundTime}
                </p>
              )}
            </div>

            {/* PDFs Download Blocks if provided in schema */}
            {downloads.length > 0 && (
              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-5 rounded-2xl space-y-3">
                <div className="flex gap-2">
                  <Info className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-black uppercase text-amber-805 dark:text-amber-400 tracking-wider">અહીંથી સોગંદનામું/ફોર્મેટ ડાઉનલોડ કરો (Forms download)</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">કૃપા કરીને નીચે આપેલ સત્તાવાર પત્રક પ્રિન્ટ કરી, વિગતો ભરી અને તેના સહીવાળી નકલ બીજા ચરણમાં સ્કેન/અપલોડ કરો.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {downloads.map((dl, idx) => (
                    <a
                      key={idx}
                      href={dl.url}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/50 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-all shadow-sm"
                    >
                      <span className="truncate pr-2">{dl.title}</span>
                      <Download size={14} className="shrink-0 text-amber-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Input dynamic builder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="dynamic-inputs-panel">
              {fields.map((f, i) => (
                <div key={i} className={`space-y-2 ${f.type === "textarea" ? "md:col-span-2" : ""}`}>
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-405 uppercase tracking-widest block">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  {f.type === "textarea" ? (
                    <div className="flex gap-2 items-start">
                      <textarea
                        rows={3}
                        value={formInputs[f.name] || ""}
                        onChange={(e) => handleInputChange(f.name, e.target.value)}
                        placeholder="..."
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                        required={f.required}
                      />
                      <VoiceDictationButton
                        lang={lang}
                        onTranscript={(text) => handleInputChange(f.name, (formInputs[f.name] || "") ? `${formInputs[f.name]} ${text}` : text)}
                        className="mt-1"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <input
                        type={f.type}
                        value={formInputs[f.name] || ""}
                        onChange={(e) => handleInputChange(f.name, e.target.value)}
                        placeholder="..."
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                        required={f.required}
                      />
                      <VoiceDictationButton
                        lang={lang}
                        onTranscript={(text) => handleInputChange(f.name, (formInputs[f.name] || "") ? `${formInputs[f.name]} ${text}` : text)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition shadow-md active:scale-95"
              >
                આગળ દસ્તાવેજો અપલોડ કરો <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Document Dropzones */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">સરકારી નિયમાનુસાર જરૂરી નકલો (Required Documents Upload)</h3>
              <p className="text-xs text-slate-500 mt-1">The uploads are restricted exactly to the standard central document requirement checklist groups linked to this scheme.</p>
            </div>

            {docGroup ? (
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                  Linked Standard Checklist: {docGroup.ListName}
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {docGroup.Documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col justify-between ${uploadedFiles[doc] ? "border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-800 bg-slate-50/50 dark:bg-slate-900/40"}`}
                    >
                      <div className="mb-4">
                        <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-451 px-2.5 py-1 rounded">
                          Doc #{idx + 1} Required
                        </span>
                        <h4 className="font-extrabold text-slate-805 dark:text-white text-xs mt-2.5 leading-snug">
                          {doc}
                        </h4>
                      </div>

                      <div className="relative">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          id={`file-input-${idx}`}
                          className="hidden"
                          onChange={(e) => handleFileChange(doc, e)}
                        />
                        <label
                          htmlFor={`file-input-${idx}`}
                          className={`flex items-center gap-2 justify-center py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border ${uploadedFiles[doc] ? "bg-emerald-600 text-white border-transparent" : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-650 dark:text-slate-300 hover:border-slate-300"}`}
                        >
                          {uploadedFiles[doc] ? (
                            <>
                              <Check size={14} />
                              ફાઇલ અપલોડ થઈ ગઈ (Done)
                            </>
                          ) : (
                            <>
                              <UploadCloud size={14} className="text-slate-400" />
                              સ્કૅન નકલ પસંદ કરો
                            </>
                          )}
                        </label>
                      </div>

                      {uploadedFiles[doc] && (
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate mt-1.5 text-center">
                          {uploadedFiles[doc].file.name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-2xl">
                <AlertCircle className="text-amber-500 mx-auto mb-2" size={28} />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">No document checklists linked. System will proceed without uploads.</p>
              </div>
            )}

            <div className="pt-6 border-t border-slate-105 dark:border-slate-800/80 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer"
              >
                પાછળ
              </button>
              <button
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition shadow-md active:scale-95"
              >
                આગળ વધો (Payment) <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Checkout Pricing Breakdown and Razorpay Flow Verification */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-950 dark:text-white">ખર્ચ પત્રક અને સબમિશન (Pricing & Checkouts)</h3>
              <p className="text-xs text-slate-500 mt-1">Please authorize document reviews and choose physical speed-post preference.</p>
            </div>

            {/* Price breakdown */}
            <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 font-bold">
                <span className="uppercase tracking-wide">ઓનલાઇન અરજી અને વેરીફીકેશન ફી:</span>
                <span>₹{selectedService.BasePrice || 150}</span>
              </div>

              {/* Physical Delivery options */}
              <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={physicalDelivery}
                    onChange={(e) => setPhysicalDelivery(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5 shrink-0"
                  />
                  <div>
                    <span>ઝડપી સ્પીડ આર્ટિફિશિયલ પ્રિન્ટ પહોંચ (Physical Speed-Post Courier Delivery)</span>
                    <p className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">અધિકૃત સરકારી ડિજિટલ રસીદ સાથેનું કાગળ સીધું તમારા ઘરઆંગણે સ્પીડ પોસ્ટથી મોકલવામાં આવશે (+ ₹૫૦ સર્વિસ ચાર્જ)</p>
                  </div>
                </label>

                {physicalDelivery && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-405 dark:text-slate-505 tracking-wider block">મોકલવાનું સરનામું (Shipping Address)<span className="text-red-500">*</span></label>
                    <textarea
                      rows={2}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="e.g. 104, Sunrise Residency, Sector-21, Gandhinagar, Gujarat - 382021"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </motion.div>
                )}
              </div>

              {/* Grand Total */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center text-sm font-black text-slate-850 dark:text-white">
                <span className="uppercase tracking-widest text-[10px]">કુલ રકમ (Total Charge Payable):</span>
                <span className="text-lg text-blue-600">₹{calculateTotal()}</span>
              </div>
            </div>

            {/* Legal consent strictly required */}
            <div className="bg-red-50/50 dark:bg-red-950/20 p-5 rounded-2xl border border-red-100/50 dark:border-red-900/30 text-left">
              <label className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded border-slate-300 focus:focus-within:ring-red-500 mt-0.5 shrink-0 cursor-pointer"
                />
                <span className="leading-relaxed select-none">
                  હું પ્રમાણિત કરું છું કે મેં અપલોડ કરેલા દસ્તાવેજો અને આપેલી માહિતી સંપૂર્ણપણે સાચી છે. હું સમજું છું કે બતાવવામાં આવેલી કુલ રકમમાં સરકારી ફી (જો લાગુ પડતી હોય તો) ઉપરાંત સંસ્થાનો ફેસિલિટેશન/સર્વિસ ચાર્જ સામેલ છે. હું અમિત ઓનલાઇન સર્વિસિસને મારા વતી આ પ્રક્રિયા પૂરી કરવા માટે અધિકૃત (Authorize) કરું છું.
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="pt-6 border-t border-slate-105 dark:border-slate-800 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer"
              >
                પાછળ
              </button>
              <button
                onClick={handleSubmit}
                disabled={!consentChecked}
                className={`px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer transition shadow-md active:scale-95 ${!consentChecked ? "bg-slate-300 text-slate-500 opacity-50 cursor-not-allowed" : "bg-teal-600 hover:bg-teal-700 text-white"}`}
              >
                <CreditCard size={14} /> પેમેન્ટ અને ઓર્ડર સબમિટ કરો (Pay via Razorpay)
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
