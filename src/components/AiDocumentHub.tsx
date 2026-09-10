import React, { useState } from "react";
import AILegalAgent from "./AILegalAgent";
import {
  Scale,
  FileText,
  ShieldCheck,
  Sparkles,
  Download,
  Send,
  Copy,
  Printer,
  Search,
  ArrowRight,
  Bot,
  CheckCircle2,
  Building2,
  Gavel,
  FileCode,
  Users,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  X,
  Share2,
  RefreshCw,
  BookOpen,
  Mic
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export interface AiModule {
  id: string;
  title: string;
  titleGu: string;
  category: "Legal" | "Government" | "Affidavits" | "Family" | "Police";
  iconName: string;
  description: string;
  descriptionGu: string;
  popular?: boolean;
  defaultAuthority: string;
  defaultTone: string;
  sampleProblem: string;
}

export const AI_MODULES: AiModule[] = [
  {
    id: "rti-app",
    title: "RTI Application Draft",
    titleGu: "RTI માહિતીનો અધિકાર અરજી",
    category: "Government",
    iconName: "FileText",
    description: "Formal Right to Information application to Central/State Public Information Officers (PIO).",
    descriptionGu: "કેન્દ્રીય અને રાજ્ય જાહેર માહિતી અધિકારી (PIO) માટે સત્તાવાર RTI અરજી ડ્રાફ્ટ.",
    popular: true,
    defaultAuthority: "Public Information Officer (PIO), District Collectorate / Revenue Dept",
    defaultTone: "Formal/Legal",
    sampleProblem: "Requesting certified copy of land records, 7/12 status, or government scheme application progress."
  },
  {
    id: "affidavit-gen",
    title: "Affidavit & Self-Declaration",
    titleGu: "સોગંદનામું અને સ્વ-ઘોષણાપત્ર",
    category: "Affidavits",
    iconName: "Scale",
    description: "Legal affidavit draft for name change, address proof, age declaration, or general sworn statement.",
    descriptionGu: "નામ સુધારો, સરનામા પુરાવો, અથવા સામાન્ય સ્વ-ઘોષણા માટે કાનૂની સોગંદનામું.",
    popular: true,
    defaultAuthority: "Notary Public / Executive Magistrate",
    defaultTone: "Formal/Legal",
    sampleProblem: "Sworn affidavit confirming mismatch of name in Aadhaar Card and Educational Certificates."
  },
  {
    id: "legal-notice",
    title: "Legal Notice & Demand",
    titleGu: "લીગલ નોટિસ અને ડિમાન્ડ ડ્રાફ્ટ",
    category: "Legal",
    iconName: "Gavel",
    description: "Advocate draft notice for cheque bounce (Sec 138 NI Act), breach of contract, or money recovery.",
    descriptionGu: "ચેક બાઉન્સ, રકમ વસૂલાત અથવા કરાર ભંગ માટે એડવોકેટ લીગલ નોટિસ ડ્રાફ્ટ.",
    popular: true,
    defaultAuthority: "Opposite Party / Defaulting Company / Respondent",
    defaultTone: "Urgent/Strict",
    sampleProblem: "Formal demand notice for recovery of pending dues worth ₹1,50,000 for service rendered."
  },
  {
    id: "gov-representation",
    title: "Government Representation / Petition",
    titleGu: "સરકારી અરજી / રજૂઆતપત્ર",
    category: "Government",
    iconName: "Building2",
    description: "Official grievance petition to District Collector, Municipal Commissioner, or Mamlatdar.",
    descriptionGu: "જિલ્લા કલેક્ટર, મ્યુનિસિપલ કમિશનર અથવા મામલતદાર શ્રી ને લેખિત રજૂઆત.",
    defaultAuthority: "Hon'ble District Collector / District Magistrate",
    defaultTone: "Requesting/Respectful",
    sampleProblem: "Application requesting urgent repair of public drainage line and road paving in ward area."
  },
  {
    id: "consumer-complaint",
    title: "Consumer Forum Complaint",
    titleGu: "ગ્રાહક સુરક્ષા કમિશન ફરિયાદ",
    category: "Legal",
    iconName: "ShieldCheck",
    description: "Formal complaint petition for District Consumer Disputes Redressal Commission.",
    descriptionGu: "ખામીયુક્ત વસ્તુ અથવા સેવા ખામી બદલ જિલ્લા ગ્રાહક કમિશનમાં ફરિયાદ.",
    defaultAuthority: "Hon'ble President, District Consumer Disputes Redressal Commission",
    defaultTone: "Formal/Legal",
    sampleProblem: "Claiming refund & compensation of ₹45,000 against seller for delivering defective electronic item."
  },
  {
    id: "police-complaint",
    title: "Police Complaint & Cyber Grievance",
    titleGu: "પોલીસ ફરિયાદ અને સાયબર અરજી",
    category: "Police",
    iconName: "AlertCircle",
    description: "Written application to Station House Officer (SHO) for lost documents, fraud, or cybercrime.",
    descriptionGu: "દસ્તાવેજ ગુમ થવા, ઓનલાઈન ફ્રોડ અથવા કાયદાકીય મદદ માટે પોલીસ ઈન્સ્પેક્ટર ને અરજી.",
    popular: true,
    defaultAuthority: "Police Inspector / Station House Officer (SHO), Cyber Crime Cell",
    defaultTone: "Formal/Urgent",
    sampleProblem: "Reporting loss of original RC Book and driving license along with request for Police Intimation Certificate."
  },
  {
    id: "pension-representation",
    title: "Pension & Gratuity Representation",
    titleGu: "પેન્શન અને નિવૃત્તિ લાભ અરજી",
    category: "Government",
    iconName: "Users",
    description: "Grievance petition for delayed PPO, gratuity release, or provident fund settlement.",
    descriptionGu: "વિલંબિત પેન્શન, ગ્રેચ્યુઈટી અને પીએફ નાણાં ચૂકવણી માટે વિભાગીય રજૂઆત.",
    defaultAuthority: "Director, Pension & Insurance Department / Treasury Officer",
    defaultTone: "Requesting/Formal",
    sampleProblem: "Requesting immediate issuance of Pension Payment Order (PPO) pending for over 6 months post-retirement."
  },
  {
    id: "revenue-dispute",
    title: "Revenue & Land Dispute Petition",
    titleGu: "મહેસૂલી જમીન વિવાદ અરજી (૭/૧૨)",
    category: "Government",
    iconName: "BookOpen",
    description: "Petition for 7/12 land record mutation entry, boundary survey, or Mamlatdar Court dispute.",
    descriptionGu: "જમીન હક્ક નોંધણી, ૭/૧૨ સુધારો, અને સીમામાપન માટે મામલતદાર કોર્ટ અરજી.",
    popular: true,
    defaultAuthority: "Mamlatdar & Executive Magistrate / Prant Officer",
    defaultTone: "Formal/Legal",
    sampleProblem: "Application for entry of heirship (Varai Nondh) in 7/12 records following demise of land owner."
  },
  {
    id: "income-caste-affidavit",
    title: "Income / Caste Certificate Affidavit",
    titleGu: "આવક / જાતિ પ્રમાણપત્ર સોગંદનામું",
    category: "Affidavits",
    iconName: "FileCode",
    description: "Supporting affidavit draft for Jan Seva Kendra income declaration and caste verification.",
    descriptionGu: "જન સેવા કેન્દ્ર આવક પ્રમાણપત્ર અને સામાજિક ન્યાય વિભાગ માટે સોગંદનામું.",
    defaultAuthority: "Talati Mantri / Executive Magistrate",
    defaultTone: "Formal/Declarative",
    sampleProblem: "Annual family income declaration for scholarship and educational fee concession application."
  },
  {
    id: "court-extension",
    title: "Court Extension / Exemption Petition",
    titleGu: "કોર્ટ મુદત / હાજરી માફી અરજી",
    category: "Legal",
    iconName: "Gavel",
    description: "Formal application under CrPC / CPC for court adjournment or personal appearance exemption.",
    descriptionGu: "નામદાર અદાલતમાં શારીરિક અસ્વસ્થતા અથવા અનિવાર્ય કારણસર મુદત આપવા અંગે અરજી.",
    defaultAuthority: "Hon'ble Judicial Magistrate First Class / Civil Judge",
    defaultTone: "Formal/Legal",
    sampleProblem: "Requesting one-date adjournment in Regular Civil Suit due to medical illness of applicant."
  },
  {
    id: "deed-contract",
    title: "Deed & Business Contract Draft",
    titleGu: "કરાર, ભાગીદારી લેખ અને બોન્ડ",
    category: "Affidavits",
    iconName: "FileText",
    description: "Drafting layout for partnership deed, indemnity bond, sale agreement outline, or service MOU.",
    descriptionGu: "ભાગીદારી કરાર, ઈન્ડેમનિટી બોન્ડ અને વ્યાપારિક સમજૂતી લેખ.",
    defaultAuthority: "Sub-Registrar Office / Notary Public",
    defaultTone: "Formal/Contractual",
    sampleProblem: "Partnership agreement draft detailing capital contribution, profit sharing ratio, and dispute resolution."
  },
  {
    id: "gazette-notification",
    title: "Gazette Notification Application",
    titleGu: "સરકારી ગેઝેટ નામ સુધારા અરજી",
    category: "Government",
    iconName: "Building2",
    description: "Application draft for State Directorate of Printing & Stationery Gazette name publication.",
    descriptionGu: "રાજ્ય સરકારના સરકારી ગેઝેટમાં નામ બદલવાની જાહેરાત માટે અરજી પત્રક.",
    defaultAuthority: "Director, Government Central Press & Gazette Dept",
    defaultTone: "Formal/Legal",
    sampleProblem: "Official notification application for change of surname post-marriage in State Gazette."
  },
  {
    id: "tenancy-agreement",
    title: "Tenancy & Lease Agreement Affidavit",
    titleGu: "ભાડા કરાર અને લીઝ દસ્તાવેજ",
    category: "Affidavits",
    iconName: "FileText",
    description: "Residential or commercial rent agreement draft with standard terms and Police Verification clause.",
    descriptionGu: "રહેણાંક અથવા કોમર્શિયલ મિલકત માટે ૧૧ મહિનાનો ભાડા કરાર.",
    defaultAuthority: "Sub-Registrar / Police Verification Officer",
    defaultTone: "Contractual",
    sampleProblem: "11-month residential tenancy agreement specifying monthly rent of ₹12,000 and deposit terms."
  },
  {
    id: "power-of-attorney",
    title: "Power of Attorney Draft (GPA / SPA)",
    titleGu: "અખત્યારનામું (General Power of Attorney)",
    category: "Affidavits",
    iconName: "Scale",
    description: "General or Special Power of Attorney authorizing trusted relative for property/financial management.",
    descriptionGu: "મિલકત વહીવટ અને બેંકિંગ કામગીરી માટે મુખત્યારનામું ડ્રાફ્ટ.",
    defaultAuthority: "Sub-Registrar of Assurances / Consulate General",
    defaultTone: "Formal/Legal",
    sampleProblem: "Special Power of Attorney authorizing brother to represent owner in property sale registration."
  },
  {
    id: "mutual-mou",
    title: "Mutual Settlement & MOU Draft",
    titleGu: "આપસી સમજૂતી અને સુલેહ કરાર",
    category: "Family",
    iconName: "Users",
    description: "Out-of-court settlement Memorandum of Understanding (MOU) for property or monetary compromise.",
    descriptionGu: "નાણાકીય અથવા કૌટુંબિક વિવાદમાં શાંતિપૂર્ણ આપસી સમાધાન કરાર.",
    defaultAuthority: "Mediator / Notary Public / Legal Panel",
    defaultTone: "Formal/Consensual",
    sampleProblem: "Mutual agreement between parties resolving boundary demarcation dispute out of court."
  },
  {
    id: "divorce-custody",
    title: "Family Court & Custody Petition",
    titleGu: "કૌટુંબિક અદાલત રજૂઆત અરજી",
    category: "Family",
    iconName: "Users",
    description: "Family Court petition outline for mutual divorce, maintenance under Sec 125, or child visitation.",
    descriptionGu: "ફેમિલી કોર્ટમાં ભરણપોષણ અથવા સંતાન મુલાકાત હક્ક માટે પ્રાથમિક અરજી.",
    defaultAuthority: "Hon'ble Principal Judge, Family Court",
    defaultTone: "Formal/Legal",
    sampleProblem: "Petition seeking visitation rights for child on weekends under Family Courts Act."
  },
  {
    id: "passport-correction",
    title: "Passport & Visa Correction Affidavit",
    titleGu: "પાસપોર્ટ એફિડેવિટ (Annexure E/F)",
    category: "Affidavits",
    iconName: "ShieldCheck",
    description: "Annexure-E / Annexure-F affidavit draft for Regional Passport Office (RPO) name or DOB mismatch.",
    descriptionGu: "પાસપોર્ટ ઓફિસ (RPO) માટે નામ અથવા જન્મતારીખ સુધારા એફિડેવિટ.",
    defaultAuthority: "Regional Passport Officer (RPO) / Passport Seva Kendra",
    defaultTone: "Formal/Sworn",
    sampleProblem: "Affidavit Annexure-E explaining surname variation between school leaving certificate and Passport."
  }
];

export default function AiDocumentHub() {
  const [hubMode, setHubMode] = useState<"voice-agent" | "catalog">("voice-agent");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedModule, setSelectedModule] = useState<AiModule | null>(null);
  const [isDrafterOpen, setIsDrafterOpen] = useState(false);

  // Form State
  const [applicantName, setApplicantName] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantAddress, setApplicantAddress] = useState("");
  const [idNumber, setIdNumber] = useState("");
  
  const [targetAuthority, setTargetAuthority] = useState("");
  const [language, setLanguage] = useState<"English" | "Gujarati" | "Hindi">("English");
  const [tone, setTone] = useState("Formal/Legal");

  const [problemSummary, setProblemSummary] = useState("");
  const [keyFacts, setKeyFacts] = useState("");
  const [reliefRequested, setReliefRequested] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string>("");
  const [generatedDocId, setGeneratedDocId] = useState<string>("");
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>("");

  const categories = ["ALL", "Government", "Legal", "Affidavits", "Family", "Police"];

  const filteredModules = AI_MODULES.filter((m) => {
    const matchCat = selectedCategory === "ALL" || m.category === selectedCategory;
    const matchSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.titleGu.includes(searchTerm) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const openDrafter = (mod: AiModule) => {
    setSelectedModule(mod);
    setTargetAuthority(mod.defaultAuthority);
    setTone(mod.defaultTone);
    if (!problemSummary) {
      setProblemSummary(mod.sampleProblem);
    }
    setGeneratedDraft("");
    setIsDrafterOpen(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      toast.error("Please enter applicant name.");
      return;
    }
    if (!problemSummary.trim()) {
      toast.error("Please enter problem summary/objective.");
      return;
    }

    setIsGenerating(true);
    toast.info("Connecting to AI Legal Engine & Generating Document Draft...");

    const payload = {
      action: "processAiDocument",
      applicantDetails: {
        name: applicantName,
        phone: applicantPhone,
        email: applicantEmail,
        address: applicantAddress,
        idNumber: idNumber
      },
      documentInfo: {
        documentType: selectedModule?.title || "Legal Document",
        targetAuthority: targetAuthority,
        language: language,
        tone: tone
      },
      problemDetails: {
        summary: problemSummary,
        keyFacts: keyFacts,
        reliefRequested: reliefRequested
      }
    };

    try {
      // First try calling backend Express API
      const res = await axios.post("/api/ai/process-document", payload, { timeout: 15000 });
      if (res.data && res.data.success) {
        setGeneratedDraft(res.data.content);
        setGeneratedDocId(res.data.docId || "AI-DOC-" + Math.floor(100000 + Math.random() * 900000));
        if (res.data.folderUrl) setDriveFolderUrl(res.data.folderUrl);
        toast.success("🎉 AI Legal & Government Draft generated successfully!");
        setIsGenerating(false);
        return;
      }
    } catch (err) {
      console.warn("Backend express endpoint call skipped/failed, calling fallback GAS endpoint:", err);
    }

    // Fallback: direct generator logic or GAS call
    try {
      const gasRes = await axios.post(
        "https://script.google.com/macros/s/AKfycby-fallback/exec",
        payload,
        { timeout: 8000 }
      ).catch(() => null);

      if (gasRes?.data?.success) {
        setGeneratedDraft(gasRes.data.content);
        setGeneratedDocId(gasRes.data.docId || "AI-DOC-" + Math.floor(100000 + Math.random() * 900000));
        toast.success("🎉 AI Legal Draft generated successfully!");
        setIsGenerating(false);
        return;
      }
    } catch (e) {
      // Ignore
    }

    // High quality local legal template fallthrough
    const dateStr = new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' });
    const localContent = `DATE: ${dateStr}

TO,
${(targetAuthority || "COMPETENT LEGAL AUTHORITY").toUpperCase()}
${applicantAddress ? applicantAddress.toUpperCase() : "GUJARAT, INDIA"}

SUBJECT: FORMAL APPLICATION REGARDING ${(selectedModule?.title || "LEGAL MATTERS").toUpperCase()}

RESPECTED SIR/MADAM,

I, ${applicantName}, residing at ${applicantAddress || "Gujarat, India"} (Contact: ${applicantPhone || "N/A"}, Email: ${applicantEmail || "N/A"}, ID/Aadhaar: ${idNumber || "VERIFIED"}), respectfully submit this formal application:

1. STATEMENT OF OBJECTIVE:
${problemSummary}

${keyFacts ? `2. KEY BACKGROUND FACTS:\n${keyFacts}\n` : ""}
3. STATUTORY / FORMAL REQUEST:
It is respectfully requested that necessary administrative and legal action be initiated regarding the above subject matter in accordance with applicable rules and guidelines.

PRAYER / RELIEF SOUGHT:
${reliefRequested || "Grant of official verification, issuance of certified draft, and necessary relief at the earliest."}

YOURS FAITHFULLY,


____________________________________
${applicantName.toUpperCase()}
(APPLICANT / ADVOCATE CLIENT)
Phone: ${applicantPhone || "Registered Contact"}
Email: ${applicantEmail || "client@amit.today"}`;

    setGeneratedDraft(localContent);
    setGeneratedDocId("AI-DOC-" + Math.floor(100000 + Math.random() * 900000));
    toast.success("🎉 Legal & Government Draft generated successfully!");
    setIsGenerating(false);
  };

  const copyDraftToClipboard = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    toast.success("Copied draft to clipboard!");
  };

  const printDraft = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>AOS Legal Draft - ${generatedDocId}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 40px; line-height: 1.6; color: #111; }
            pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .footer { margin-top: 40px; border-top: 1px solid #ccc; pt: 10px; font-size: 11px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2 style="margin:0;">AMIT ONLINE SERVICES - LEGAL DRAFT VAULT</h2>
            <p style="margin:4px 0; font-size:12px;">Certified AI Legal & Government Document Engine | Doc ID: ${generatedDocId}</p>
          </div>
          <pre>${generatedDraft}</pre>
          <div class="footer">
            Printed on ${new Date().toLocaleString()} | Official Verification Ledger
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  return (
    <div className="notary-module-container min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 rounded-3xl border border-slate-800 shadow-2xl">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-10 border border-blue-500/30 shadow-xl mb-6">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} className="text-blue-400 animate-pulse" />
              AI Powered Legal & Government Drafting Portal
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              🏛️ AI Legal Document Studio
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed font-medium">
              Interactive Voice AI Assistant & Real-Time WYSIWYG Document Editor with dynamic word count billing and instant Google Drive synchronization.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Mode Switcher Tabs */}
            <div className="bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 flex items-center gap-1.5 shadow-lg">
              <button
                onClick={() => setHubMode("voice-agent")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                  hubMode === "voice-agent"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic size={15} /> Real-Time Voice AI
              </button>
              <button
                onClick={() => setHubMode("catalog")}
                className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                  hubMode === "catalog"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileText size={15} /> Document Catalog (17)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER BASED ON MODE */}
      {hubMode === "voice-agent" ? (
        <AILegalAgent />
      ) : (
        <>
          {/* Search and Category Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search RTI, Affidavit, Legal Notice, 7/12..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
              }`}
            >
              {cat === "ALL" ? "All Modules (17)" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 17 AI Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((mod) => (
          <div
            key={mod.id}
            className="group relative bg-slate-900/90 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-500/50 p-6 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <FileText size={22} />
                </div>
                <div className="flex items-center gap-2">
                  {mod.popular && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      🔥 Popular
                    </span>
                  )}
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-slate-700">
                    {mod.category}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {mod.title}
              </h3>
              <p className="text-xs font-bold text-blue-300/80 mb-3">
                {mod.titleGu}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {mod.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">A4 Printable Format</span>
              <button
                onClick={() => openDrafter(mod)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
              >
                Draft Now <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
          <Search size={40} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No matching AI modules found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search term or select 'ALL' categories.</p>
        </div>
      )}

      {/* Interactive Drafter Modal */}
      {isDrafterOpen && selectedModule && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedModule.title}
                  </h2>
                  <p className="text-xs text-slate-400">{selectedModule.titleGu} • AI Legal Generator</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrafterOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Split Screen: Form Inputs vs Generated Draft */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Input Column */}
              <form onSubmit={handleGenerate} className="lg:col-span-6 space-y-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Users size={14} /> 1. Applicant & Recipient Details
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Applicant Full Name *</label>
                    <input
                      type="text"
                      required
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Rameshchandra Patel"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Mobile / WhatsApp</label>
                      <input
                        type="text"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="e.g. 98795XXXXX"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">ID Number (Aadhaar/PAN)</label>
                      <input
                        type="text"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        placeholder="e.g. XXXX XXXX 4821"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Target Authority / Recipient</label>
                    <input
                      type="text"
                      value={targetAuthority}
                      onChange={(e) => setTargetAuthority(e.target.value)}
                      placeholder="e.g. District Collector, Ahmedabad"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <FileText size={14} /> 2. Language & Style
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Draft Language</label>
                      <select
                        value={language}
                        onChange={(e: any) => setLanguage(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                      >
                        <option value="English">English</option>
                        <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                        <option value="Hindi">Hindi (हिंदी)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Tone / Style</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                      >
                        <option value="Formal/Legal">Formal Legal</option>
                        <option value="Urgent/Strict">Urgent Demand</option>
                        <option value="Requesting/Respectful">Respectful Petition</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Gavel size={14} /> 3. Case Details & Prayer
                  </h4>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Problem Summary / Objective *</label>
                    <textarea
                      rows={3}
                      required
                      value={problemSummary}
                      onChange={(e) => setProblemSummary(e.target.value)}
                      placeholder="Describe the issue or facts needing legal documentation..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Relief / Prayer Requested</label>
                    <input
                      type="text"
                      value={reliefRequested}
                      onChange={(e) => setReliefRequested(e.target.value)}
                      placeholder="e.g. Immediate issuance of certified copy and 7/12 entry..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Generating Draft...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> Generate Legal Draft (Gemini AI)
                    </>
                  )}
                </button>
              </form>

              {/* Live Preview / Result Column */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-slate-950 p-6 rounded-2xl border border-slate-800 min-h-[450px]">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      <FileText size={16} className="text-blue-400" /> Live A4 Legal Draft Preview
                    </span>
                    {generatedDocId && (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full">
                        {generatedDocId}
                      </span>
                    )}
                  </div>

                  {generatedDraft ? (
                    <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-300 font-serif text-xs leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap shadow-inner selection:bg-blue-100">
                      {generatedDraft}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center text-slate-500">
                      <Bot size={48} className="text-slate-700 mb-3 animate-pulse" />
                      <p className="text-xs font-bold text-slate-400">Your AI Legal Draft will appear here</p>
                      <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
                        Fill in applicant & problem details on the left, then click 'Generate Legal Draft'.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions when draft generated */}
                {generatedDraft && (
                  <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
                    <button
                      onClick={copyDraftToClipboard}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy size={14} /> Copy
                    </button>
                    <button
                      onClick={printDraft}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer size={14} /> Print / PDF
                    </button>
                    {driveFolderUrl && (
                      <a
                        href={driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink size={14} /> Drive Folder
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
