import React, { useState, useEffect } from "react";
import { User, Calendar, FileText, Check, UploadCloud, AlertCircle, CreditCard, ChevronRight, Truck, Info, Upload, Trash2, ArrowLeft, ShieldAlert, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import axios from "axios";
import VoiceDictationButton from "./VoiceDictationButton";

interface FormField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

interface DynamicGovFormProps {
  selectedService: {
    ID: string;
    ServiceName: string;
    BasePrice?: number;
    RequiredDocuments?: string;
    RequiredFields?: string;
    TurnaroundTime?: string;
    Category?: string;
    GovtFee?: number;
    GovFee?: number;
    ServiceCharge?: number;
    CourierCharge?: number;
    OtherCharges?: number;
    RequiredDocIDs?: string;
  };
  user: any;
  lang: "en" | "gu";
  onBack: () => void;
  onFinish: (result: any) => void;
  ocrTemplateData?: any;
}

interface DocumentList {
  ID: string;
  ListName: string;
  Documents: string[];
}

export default function DynamicGovForm({ selectedService, user, lang, onBack, onFinish, ocrTemplateData }: DynamicGovFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [docNames, setDocNames] = useState<string[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  
  // Specific Upload state for each distinct document
  const [uploadedFiles, setUploadedFiles] = useState<{ [docName: string]: { file: File; base64: string } }>({});
  const [formInputs, setFormInputs] = useState<{ [fieldName: string]: string }>({});
  const [draftKey] = useState(`draft_${selectedService?.ID || selectedService?.ServiceName?.replace(/\s+/g, '_') || 'service'}`);
  const [requestPhysical, setRequestPhysical] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formInputs) setFormInputs(parsed.formInputs);
        if (parsed.documents) {
          const restoredUploads: Record<string, { file: File; base64: string }> = {};
          for (const [docName, data] of Object.entries(parsed.documents)) {
            const { fileName, fileType, size, base64 } = data as any;
            if (base64 && fileType && fileName) {
               const bstrParts = base64.split(',');
               const bstr = atob(bstrParts.length > 1 ? bstrParts[1] : bstrParts[0]);
               let n = bstr.length;
               const u8arr = new Uint8Array(n);
               while (n--) {
                   u8arr[n] = bstr.charCodeAt(n);
               }
               const file = new File([u8arr], fileName, { type: fileType });
               restoredUploads[docName] = { file, base64 };
            }
          }
          setUploadedFiles(restoredUploads);
        }
        toast.success(lang === "gu" ? "તમારો પાછલો ડ્રાફ્ટ પુનઃસ્થાપિત કરવામાં આવ્યો છે!" : "Your previous draft has been restored!");
      }
    } catch (e) {
      console.warn("Could not restore draft", e);
    }
  }, [draftKey, lang]);

  const saveDraft = () => {
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
        documents: docsToSave
    }));
    toast.success(lang === "gu" ? "તમારો ડ્રાફ્ટ આ ઉપકરણ પર સાચવવામાં આવ્યો છે!" : "Your draft has been saved successfully to this device!");
  };

  const [lastAutosavedTime, setLastAutosavedTime] = useState<string | null>(null);

  // Automated 3-second interval autosave for Government Service form persistence
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(formInputs).length === 0 && Object.keys(uploadedFiles).length === 0 && !shippingAddress) return;
      
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
        requestPhysical,
        savedAt: new Date().toISOString()
      }));
      
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutosavedTime(nowStr);
    }, 3000);

    return () => clearInterval(interval);
  }, [formInputs, uploadedFiles, draftKey, shippingAddress, requestPhysical, selectedService.ServiceName]);

  // Auto-populate form inputs if OCR template data is available
  useEffect(() => {
    if (ocrTemplateData && fields && fields.length > 0) {
      const initial: { [fieldName: string]: string } = { ...formInputs };
      let matchedCount = 0;
      fields.forEach((field) => {
        const fieldNameLower = (field.name || "").toLowerCase();
        const fieldLabelLower = (field.label || "").toLowerCase();
        
        if (ocrTemplateData[field.name]) {
          initial[field.name] = ocrTemplateData[field.name];
          matchedCount++;
        } else if (fieldNameLower.includes("aadhar") || fieldNameLower.includes("aadhaar") || fieldLabelLower.includes("aadhar") || fieldLabelLower.includes("aadhaar")) {
          const val = ocrTemplateData["Aadhaar Number"] || ocrTemplateData["aadhaar_number"] || ocrTemplateData["Aadhar Number"];
          if (val) {
            initial[field.name] = val;
            matchedCount++;
          }
        } else if (fieldNameLower.includes("pan") || fieldLabelLower.includes("pan")) {
          const val = ocrTemplateData["PAN Number"] || ocrTemplateData["pan_number"] || ocrTemplateData["PAN Card Number"];
          if (val) {
            initial[field.name] = val;
            matchedCount++;
          }
        } else if (fieldNameLower.includes("phone") || fieldNameLower.includes("mobile") || fieldLabelLower.includes("phone") || fieldLabelLower.includes("mobile")) {
          const val = ocrTemplateData["Phone"] || ocrTemplateData["phone_number"] || ocrTemplateData["Mobile Number"];
          if (val) {
            initial[field.name] = val;
            matchedCount++;
          }
        } else if (fieldNameLower.includes("name") || fieldLabelLower.includes("name")) {
          const val = ocrTemplateData["Name"] || ocrTemplateData["name"] || ocrTemplateData["Full Name"];
          if (val) {
            initial[field.name] = val;
            matchedCount++;
          }
        }
      });
      if (matchedCount > 0) {
        setFormInputs(initial);
        toast.success(lang === "gu" ? `ડિજિટલ સ્કેન રેકોર્ડમાંથી ${matchedCount} વિગતો સફળતાપૂર્વક લેવામાં આવી છે!` : `Pre-populated ${matchedCount} fields from secure digital scan record successfully!`);
      }
    }
  }, [ocrTemplateData, selectedService]);

  // Prefill Applicant & Email fields from user context
  useEffect(() => {
    if (user) {
      setFormInputs((prev) => {
        const next = { ...prev };
        if (!next.applicantName) {
          next.applicantName = user.name || user.Name || "";
        }
        if (!next.emailAddress) {
          next.emailAddress = user.email || user.Email || "";
        }
        return next;
      });
    }
  }, [user]);

  const isReadOnlyField = (fieldName: string, fieldLabel: string) => {
    const nameLower = (fieldName || "").toLowerCase();
    const labelLower = (fieldLabel || "").toLowerCase();
    return (
      nameLower === "applicantname" ||
      nameLower === "fullname" ||
      nameLower.includes("fullname") ||
      nameLower === "emailaddress" ||
      nameLower === "email" ||
      nameLower.includes("email") ||
      labelLower.includes("full name") ||
      labelLower.includes("email address") ||
      labelLower.includes("પૂરું નામ") ||
      labelLower.includes("ઈમેઈલ")
    );
  };

  const getPrefilledValue = (fieldName: string, fieldLabel: string) => {
    const nameLower = (fieldName || "").toLowerCase();
    const labelLower = (fieldLabel || "").toLowerCase();
    if (
      nameLower === "applicantname" ||
      nameLower === "fullname" ||
      nameLower.includes("fullname") ||
      labelLower.includes("full name") ||
      labelLower.includes("પૂરું નામ")
    ) {
      return user?.name || user?.Name || "";
    }
    if (
      nameLower === "emailaddress" ||
      nameLower === "email" ||
      nameLower.includes("email") ||
      labelLower.includes("email address") ||
      labelLower.includes("ઈમેઈલ")
    ) {
      return user?.email || user?.Email || "";
    }
    return "";
  };

  // Mailing courier delivery addon options
  const [addressVerified, setAddressVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto pre-fill shipping address from profile when physical copy is selected
  useEffect(() => {
    if (requestPhysical && !shippingAddress) {
      const resAddr = user?.residentialAddress || user?.ResidentialAddress || user?.billingAddress || user?.BillingAddress || user?.address || user?.Address || "";
      if (resAddr) {
        setShippingAddress(resAddr);
      }
    }
  }, [requestPhysical, user, shippingAddress]);

  // Dual-Tier Legal Consent checklists
  const [consentAuthenticity, setConsentAuthenticity] = useState(false);
  const [consentForwarding, setConsentForwarding] = useState(false);

  // Parse fields
  const fields: FormField[] = (() => {
    try {
      if (selectedService.RequiredFields) {
        const parsed = typeof selectedService.RequiredFields === "string"
          ? JSON.parse(selectedService.RequiredFields)
          : selectedService.RequiredFields;
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Error parsing fields", e);
    }
    return [
      { name: "applicantName", label: lang === "gu" ? "અરજદારનું પૂરું નામ" : "Applicant's Full Name", type: "text", required: true },
      { name: "mobileNumber", label: lang === "gu" ? "મોબાઈલ નંબર" : "Mobile Number", type: "tel", required: true },
      { name: "emailAddress", label: lang === "gu" ? "ઈમેઈલ આઈડી" : "Email Address", type: "email", required: false },
      { name: "additionalRemarks", label: lang === "gu" ? "વધારાની નોંધો" : "Additional Notes", type: "textarea", required: false }
    ];
  })();

  // Fetch the checklist of documents (Support new RequiredDocIDs and fallback to old RequiredDocuments list ID)
  useEffect(() => {
    const fetchChecklist = async () => {
      setLoadingChecklist(true);
      try {
        let matchedNames: string[] = [];
        
        // 1. Check new RequiredDocIDs first
        let parsedDocIDs: string[] = [];
        if (selectedService.RequiredDocIDs) {
          const rawIds = selectedService.RequiredDocIDs;
          if (Array.isArray(rawIds)) {
            parsedDocIDs = rawIds.map(id => String(id).trim()).filter(id => id.length > 0);
          } else {
            let parsed = rawIds;
            if (typeof rawIds === "string") {
              try {
                parsed = JSON.parse(rawIds);
              } catch (e) {
                // keep as string
              }
            }

            if (Array.isArray(parsed)) {
              parsedDocIDs = parsed.map(id => String(id).trim()).filter(id => id.length > 0);
            } else {
              const strIds = String(rawIds).trim();
              if (strIds.includes(",") || strIds.includes(";")) {
                parsedDocIDs = strIds.split(/[,;]/).map(i => i.trim()).filter(Boolean);
              } else if (strIds) {
                parsedDocIDs = [strIds];
              }
            }
          }
        }

        if (Array.isArray(parsedDocIDs) && parsedDocIDs.length > 0) {
          const res = await axios.get("/api/documents-master");
          if (res.data && res.data.success) {
            const masterList: any[] = res.data.data || [];
            matchedNames = parsedDocIDs.map(id => {
              const matchedDoc = masterList.find(d => d.ID === id);
              return matchedDoc ? matchedDoc.Name : id;
            });
          }
        }

        // 2. Fall back to old check if names are empty and old list is set
        if (matchedNames.length === 0 && selectedService.RequiredDocuments) {
          const res = await axios.get("/api/document-lists");
          if (res.data && res.data.success) {
            const matchedList = res.data.data.find((item: any) => item.ID === selectedService.RequiredDocuments);
            if (matchedList && Array.isArray(matchedList.Documents)) {
              matchedNames = matchedList.Documents;
            }
          }
        }

        setDocNames(matchedNames);
      } catch (err) {
        console.error("Failed loading checklists inside dynamic application form", err);
      } finally {
        setLoadingChecklist(false);
      }
    };
    fetchChecklist();
  }, [selectedService.RequiredDocuments, selectedService.RequiredDocIDs]);

  const handleInputChange = (name: string, value: string) => {
    setFormInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSlotChange = (docName: string, file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error(lang === "gu" ? "ફાઇલની સાઈઝ 8MB થી ઓછી હોવી જોઈએ." : "File must be under 8MB limit.");
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
      toast.success(`${docName}: ${lang === "gu" ? "સફળતાપૂર્વક લોડ થઈ!" : "loaded successfully!"}`);
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    for (const f of fields) {
      const val = isReadOnlyField(f.name, f.label) ? getPrefilledValue(f.name, f.label) : (formInputs[f.name] || "");
      if (f.required && !val?.trim()) {
        toast.error(lang === "gu" ? `કૃપા કરીને '${f.label}' ભરો.` : `Required field '${f.label}' is empty.`);
        return false;
      }
    }
    return true;
  };

  const validateStep2 = () => {
    for (const doc of docNames) {
      if (!uploadedFiles[doc]) {
        toast.error(lang === "gu" ? `કૃપા કરીને '${doc}' અપલોડ કરો.` : `Please upload supporting document: ${doc}`);
        return false;
      }
    }
    return true;
  };

  // Safe pricing configuration
  const govtFee = Number(selectedService.GovFee !== undefined ? selectedService.GovFee : (selectedService.GovtFee || 0));
  const serviceCharge = Number(selectedService.ServiceCharge !== undefined ? selectedService.ServiceCharge : (selectedService.BasePrice || 150));
  const baseCourier = Number(selectedService.OtherCharges !== undefined ? selectedService.OtherCharges : (selectedService.CourierCharge || 0));
  const courierSurcharge = requestPhysical ? (baseCourier || 100) : 0;
  const grandTotal = govtFee + serviceCharge + courierSurcharge;

  const handleApplyCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentAuthenticity || !consentForwarding) {
      toast.error(
        lang === "gu" 
          ? "કૃપા કરીને બંને કાનૂની સંમતિઓ સ્વીકારો." 
          : "Both legal consent checkmarks must be approved before activating checkout."
      );
      return;
    }

    if (requestPhysical) {
      if (!shippingAddress.trim()) {
        toast.error(lang === "gu" ? "ડિલિવરી સરનામું ભરવું ફરજિયાત છે." : "Kindly specify shipping address.");
        return;
      }
      if (!addressVerified) {
        toast.error(
          lang === "gu" 
            ? "કૃપા કરીને સરનામું ચકાસણી બોક્સ પસંદ કરો." 
            : "Please verify and check the delivery address consent checkbox."
        );
        return;
      }
    }

    setLoading(true);
    try {
      const finalFormInputs = { ...formInputs };
      fields.forEach(f => {
        if (isReadOnlyField(f.name, f.label)) {
          finalFormInputs[f.name] = getPrefilledValue(f.name, f.label);
        }
      });

      const docPackage = {
        serviceID: selectedService.ID,
        serviceName: selectedService.ServiceName,
        ...finalFormInputs,
        timestamp: new Date().toISOString()
      };

      const compiledDocs = Object.keys(uploadedFiles).map(docName => ({
        name: docName,
        fileName: uploadedFiles[docName].file.name,
        fileType: uploadedFiles[docName].file.type,
        type: uploadedFiles[docName].file.type,
        content: uploadedFiles[docName].base64,
      }));

      const appFileBase64 = "data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(docPackage, null, 2))));

      onFinish({
        serviceType: "Online Government Service: " + selectedService.ServiceName,
        categoryId: selectedService.Category || "Online Application",
        formFields: formInputs,
        wordCount: 0,
        amount: grandTotal,
        customerDeclarationAccepted: true,
        shippingAddress: requestPhysical ? shippingAddress : "",
        physicalDelivery: requestPhysical,
        meta: { 
          ...docPackage, 
          govtFee, 
          serviceCharge, 
          courierSurcharge 
        },
        file: {
          name: `GovtApp_${selectedService.ID || Date.now()}.json`,
          type: "application/json",
          content: appFileBase64,
        },
        additionalDocs: compiledDocs,
      });

    } catch (err) {
      console.error(err);
      toast.error("Application processing failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[30px] overflow-hidden shadow-2xl font-sans" id="dynamic-gov-form-wrapper">
      
      {/* Top process header bar */}
      <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4.5 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={onBack}
          className="text-xs font-black text-slate-550 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white uppercase tracking-wider cursor-pointer flex items-center gap-1 shrink-0"
        >
          <ArrowLeft size={14} /> {lang === "gu" ? "પાછા ફરો" : "Back"}
        </button>
        
        {/* Step dots progress indicators */}
        <div className="flex gap-4 items-center select-none flex-wrap hide-on-mobile">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1.5 hidden md:flex">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step === s ? "bg-blue-600 text-white" : step > s ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
              }`}>
                {step > s ? <Check size={10} /> : s}
              </span>
              <span className={`text-[9px] uppercase font-black tracking-wider ${step === s ? "text-blue-600" : "text-slate-400"}`}>
                {s === 1 ? (lang === "gu" ? "વિગતો" : "Form Fields") : s === 2 ? (lang === "gu" ? "દસ્તાવેજો" : "Checklists") : (lang === "gu" ? "ચકાસણી" : "Gateway Print")}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {lastAutosavedTime && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold rounded-lg select-none animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              ⚡ Autosaved ({lastAutosavedTime})
            </span>
          )}
          <button
            onClick={saveDraft}
            className="text-xs font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
          >
            {lang === "gu" ? "ડ્રાફ્ટ સાચવો (Save)" : "Save as Draft"}
          </button>
        </div>
      </div>

      <div className="p-6 sm:p-10 text-left">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="text-[9px] font-mono bg-blue-50 dark:bg-blue-950 border border-blue-100/40 text-blue-650 px-2 py-0.5 rounded">
                SCHEME FORM {selectedService.ID}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1.5">
                {selectedService.ServiceName}
              </h3>
              <p className="text-xs text-slate-400 font-bold uppercase mt-1 leading-normal">
                {lang === "gu" ? "કૃપા કરીને નીચે આપેલ બધી વિગતો ચોકસાઈ પૂર્વક ભરો." : "Fill in all parameters required by portals accurately."}
              </p>
            </div>

            {/* Render form fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {fields.map((f) => {
                const isReadOnly = isReadOnlyField(f.name, f.label);
                const displayValue = isReadOnly ? getPrefilledValue(f.name, f.label) : (formInputs[f.name] || "");
                return (
                  <div key={f.name} className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                    <label className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                      {f.label} {f.required && <span className="text-red-500">*</span>}
                    </label>
                    {f.type === "textarea" ? (
                      <div className="flex gap-2 items-start">
                        <textarea
                          rows={4}
                          value={displayValue}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          placeholder="..."
                          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                        />
                        {!isReadOnly && (
                          <VoiceDictationButton
                            lang={lang}
                            onTranscript={(text) => handleInputChange(f.name, (formInputs[f.name] || "") ? `${formInputs[f.name]} ${text}` : text)}
                            className="mt-1"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <input
                          type={f.type}
                          value={displayValue}
                          readOnly={isReadOnly}
                          onChange={(e) => handleInputChange(f.name, e.target.value)}
                          placeholder="..."
                          className={`flex-1 border px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none ${isReadOnly ? "bg-slate-100 dark:bg-slate-900 cursor-not-allowed text-slate-500 border-slate-200/80 dark:border-slate-800" : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white"}`}
                        />
                        {!isReadOnly && (
                          <VoiceDictationButton
                            lang={lang}
                            onTranscript={(text) => handleInputChange(f.name, (formInputs[f.name] || "") ? `${formInputs[f.name]} ${text}` : text)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between select-none">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-650 dark:text-slate-350 rounded-xl font-bold text-xs uppercase"
              >
                Back
              </button>
              <button
                onClick={() => validateStep1() && setStep(2)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1"
              >
                Next Step: Uploads <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded">
                Required checklists
              </span>
              <h3 className="text-lg font-black text-slate-950 dark:text-white mt-1.5">
                {lang === "gu" ? "અસલી નકલ અપલોડ સ્લોટ્સ" : "Genuine Supporting Photocopies Slots"}
              </h3>
              <p className="text-xs text-slate-450 mt-1">
                {lang === "gu" 
                  ? "દરેક જરૂરી આધારો માટે નીચે આપેલ લિંક પર ક્લિક કરી જેતે વિશિષ્ટ ફાઈલ સ્કેન કરી અપલોડ કરો." 
                  : "Render slot files below. Make sure images/PDFs are highly eligible."}
              </p>
            </div>

            {loadingChecklist ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
                <RefreshCw size={24} className="animate-spin text-rose-500" />
                <span className="text-xs">લોડ થઈ રહ્યું છે, મલેબાની કરીને રાહ જુઓ...</span>
              </div>
            ) : docNames.length > 0 ? (
              <div className="space-y-4 pt-2">
                {docNames.map((docName) => {
                  const hasFile = !!uploadedFiles[docName];
                  return (
                    <div
                      key={docName}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                        hasFile 
                          ? "bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-350 dark:border-emerald-900/30" 
                          : "bg-slate-50 dark:bg-slate-955 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      <div className="space-y-1 font-sans">
                        <span className="text-xs font-black text-slate-850 dark:text-white flex items-center gap-1.5 leading-tight">
                          {hasFile ? <Check className="text-emerald-500 shrink-0" size={14} /> : <FileText className="text-slate-450 shrink-0" size={14} />}
                          {docName} <span className="text-red-500">*</span>
                        </span>
                        {hasFile && (
                          <span className="text-[10px] font-mono text-slate-400 block dark:text-slate-500">
                            Loaded File: {uploadedFiles[docName].file.name} ({(uploadedFiles[docName].file.size / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 select-none">
                        <input
                           type="file"
                           id={`input-file-${docName.replace(/\s+/g, '_')}`}
                           className="hidden"
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) handleFileSlotChange(docName, file);
                           }}
                        />
                        <label
                           htmlFor={`input-file-${docName.replace(/\s+/g, '_')}`}
                           className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-slate-650 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all whitespace-nowrap"
                        >
                          <Upload size={13} /> {hasFile ? (lang === "gu" ? "બદલો" : "Replace file") : (lang === "gu" ? "ફાઈલ મેળવો" : "Select copy")}
                        </label>
                        {hasFile && (
                          <button
                            onClick={() => {
                              const copy = { ...uploadedFiles };
                              delete copy[docName];
                              setUploadedFiles(copy);
                              toast.info(`Removed ${docName}`);
                            }}
                            className="p-2 bg-red-50 text-red-650 rounded-xl hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 bg-slate-50/70 border border-slate-200 rounded-2xl text-xs font-bold text-slate-500">
                Checking generic linkages...
              </div>
            )}

            <div className="pt-4 flex justify-between select-none">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 rounded-xl font-bold text-xs uppercase cursor-pointer"
              >
                Back to inputs
              </button>
              <button
                onClick={() => validateStep2() && setStep(3)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                Next Step: Pricing & Consent <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <span className="text-[9px] bg-emerald-150 text-emerald-750 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                Final validation stage
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
                {lang === "gu" ? "અરજી ચકાસણી અને પ્રમાણીકરણ" : "Application Verification & Checkmarks"}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left col: Invoice & Delivery add on */}
              <div className="lg:col-span-6 space-y-5">
                
                 {/* Physical speed post dispatch */}
                 <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
                   <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800">
                     <div className="flex items-center gap-2">
                       <Truck size={16} className="text-blue-500" />
                       <div>
                         <span className="font-black text-slate-800 dark:text-white block">
                           {lang === "gu" ? "ઓરિજિનલ નકલ સ્પીડ પોસ્ટ દ્વારા મેળવો" : "Receive Original Copy via Speed Post"}
                         </span>
                         <span className="text-[10px] text-slate-450 block font-bold">
                           {lang === "gu" ? "દસ્તાવેજની હાર્ડકોપી સ્પીડ પોસ્ટ ટપાલ દ્વારા મેળવવા (+₹૧૦૦)" : "Receive printed hardcopies securely via Speed Post (+₹100)"}
                         </span>
                       </div>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                       <input
                         type="checkbox"
                         checked={requestPhysical}
                         onChange={(e) => setRequestPhysical(e.target.checked)}
                         className="sr-only peer cursor-pointer"
                       />
                       <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                     </label>
                   </div>
 
                   {requestPhysical && (
                     <div className="mt-3.5 space-y-3">
                       <div className="space-y-1">
                         <label className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-400 block tracking-wider">
                           {lang === "gu" ? "ડિલિવરી સરનામું (Delivery Address)" : "Delivery Address *"}
                         </label>
                         <textarea
                           rows={3}
                           value={shippingAddress}
                           onChange={(e) => setShippingAddress(e.target.value)}
                           placeholder={lang === "gu" ? "તમારું પૂરું નામ અને સરનામું લખો..." : "Write your complete delivery address here..."}
                           className="w-full bg-white dark:bg-slate-900 border border-slate-250 p-3 rounded-xl focus:outline-blue-500 text-xs text-slate-800 dark:text-white"
                           required
                         />
                       </div>
 
                       <label className="flex items-start gap-2.5 cursor-pointer select-none">
                         <input
                           type="checkbox"
                           checked={addressVerified}
                           onChange={(e) => setAddressVerified(e.target.checked)}
                           className="mt-0.5 w-4.5 h-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                         />
                         <span className="text-[10px] font-bold text-slate-650 dark:text-slate-400 leading-normal">
                           {lang === "gu"
                             ? "મેં મારું ડિલિવરી સરનામું ચકાસી લીધું છે અને આ જ સરનામે બિલ/ઈન્વોઈસ પ્રિન્ટ કરવા સંમતિ આપું છું."
                             : "I have verified my delivery address and consent to printing the invoice at this address."} <span className="text-red-500">*</span>
                         </span>
                       </label>
                     </div>
                   )}
                 </div>

                {/* Arithmetic Pricing Details Table */}
                <div className="bg-white dark:bg-slate-950 border border-slate-250 p-5 rounded-2xl space-y-3 text-xs shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-405 uppercase tracking-wider border-b pb-2">
                    {lang === "gu" ? "અરજી ચુકવણી વિગતપત્રક" : "Payment statement overview"}
                  </h4>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-semibold">
                    <span>{lang === "gu" ? "સરકારી પોર્ટલ એડમિન ફી:" : "Government portal admin charge:"}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-300">₹{govtFee}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 font-semibold">
                    <span>{lang === "gu" ? "પ્રમાણીકરણ પ્રોફેશનલ ફી:" : "Administrative agency fee:"}</span>
                    <span className="font-mono text-slate-800 dark:text-slate-300">₹{serviceCharge}</span>
                  </div>
                  {requestPhysical && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400 font-semibold">
                      <span>{lang === "gu" ? "કુરિયર અને રવાનગી ચાર્જ:" : "Courier speed post surcharge:"}</span>
                      <span className="font-mono text-slate-800 dark:text-slate-300">₹{courierSurcharge}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-dashed font-black text-slate-900 dark:text-white text-sm">
                    <span>{lang === "gu" ? "કુલ લાયક ચૂકવવાપાત્ર રકમ:" : "Calculated Grand Total Price:"}</span>
                    <span className="font-mono text-blue-600 dark:text-blue-450 text-base">₹{grandTotal}</span>
                  </div>
                </div>

              </div>

              {/* Right col: Dual-Tier Legal Consent System prior Checkout */}
              <div className="lg:col-span-6 bg-red-500/5 border border-slate-200/90 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-850 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} /> {lang === "gu" ? "બેઝિક કાનૂની સંમતિ (Dual-Tier Legal Consent)" : "Dual-Tier Legal Consensus Verify"}
                </h4>

                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  {lang === "gu" 
                    ? "Razorpay પેમેન્ટ ગેટવે સક્રિય કરતા પહેલાં નાગરિક સંમતિના બંને સ્તરો પૂર્ણપણે ટીક કરવા અનિવાર્ય છે." 
                    : "Both declaration tiers must protect credentials prior to initiating secure checkout payments."}
                </p>

                <div className="space-y-3.5 select-none text-xs">
                  {/* Tier 1 Checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={consentAuthenticity}
                      onChange={(e) => setConsentAuthenticity(e.target.checked)}
                      className="mt-0.5 w-4.5 h-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-700 leading-normal group-hover:text-slate-900">
                      <strong>{lang === "gu" ? "અધિકૃતતા સંમતિ:" : "I. Authenticity Consent:"}</strong> {lang === "gu" ? "હું પ્રમાણિત કરું છું કે મેં સબમિટ કરેલા બધા જ કાગળો અધિકૃત અને સત્ય છે." : "I declare that all scanned files submitted here are authentic reproductions of genuine civil records."}
                    </span>
                  </label>

                  {/* Tier 2 Checkbox */}
                  <label className="flex items-start gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={consentForwarding}
                      onChange={(e) => setConsentForwarding(e.target.checked)}
                      className="mt-0.5 w-4.5 h-4.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-700 leading-normal group-hover:text-slate-900">
                      <strong>{lang === "gu" ? "રજૂઆત મંજૂરી સંમતિ:" : "II. Submission Authorization:"}</strong> {lang === "gu" ? "હું અમિત ઓનલાઇન સર્વિસને મારા વતી અધિકૃત પોર્ટલ પર અરજી કરવાની મંજૂરી આપું છું." : "I authorize Amit Online Services to represent and forward my digital data packages to government offices."}
                    </span>
                  </label>
                </div>

                {/* Gate button enabled only on both checkbox inputs checked */}
                <button
                  disabled={loading || !consentAuthenticity || !consentForwarding}
                  onClick={handleApplyCheckout}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${
                    loading || !consentAuthenticity || !consentForwarding
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 active:scale-95 cursor-pointer"
                  }`}
                >
                  <CreditCard size={15} /> 
                  {loading 
                    ? (lang === "gu" ? "સબમિટ થઈ રહ્યું છે..." : "Processing...") 
                    : (lang === "gu" ? "અરજી પૂરી કરો અને ચૂકવણી કરો" : "Authorize Consent & Pay Now")}
                </button>
              </div>

            </div>

            <div className="pt-4 flex justify-between select-none">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 rounded-xl font-bold text-xs uppercase cursor-pointer"
              >
                Back to uploads
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
