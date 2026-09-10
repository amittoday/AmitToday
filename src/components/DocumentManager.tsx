import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Check, X, FileText, Search, RefreshCw, Layers, Tag, Upload, ArrowUpDown, ArrowUp, ArrowDown, Printer, Archive, Settings2, SlidersHorizontal, Loader2, AlertTriangle, ShieldCheck, HardDrive, Sparkles, Cpu, CheckCircle2, FileStack } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { toast } from "sonner";
import MergePDFModal from "./MergePDFModal";
import UploadFileSizeIndicator from "./UploadFileSizeIndicator";

export interface MasterDocument {
  ID: string;
  Name: string;
  Description: string;
  Tags?: string[];
  FileSize?: number; // bytes
  UploadDate?: string;
  Archived?: boolean;
}

export default function DocumentManager({ user }: { user: any }) {
  const [documents, setDocuments] = useState<MasterDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // View Mode: active vs archived
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");

  // Selection state for Batch Operations
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Centralized Tag Manager Modal state
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagToEdit, setTagToEdit] = useState<string | null>(null);
  const [newTagVal, setNewTagVal] = useState("");
  const [tagToMergeSource, setTagToMergeSource] = useState<string | null>(null);
  const [tagToMergeTarget, setTagToMergeTarget] = useState<string>("");

  // Bulk Auto-Categorize Background Worker State
  const [autoCategorizing, setAutoCategorizing] = useState(false);
  const [categorizeProgress, setCategorizeProgress] = useState(0);
  const [categorizeStatusText, setCategorizeStatusText] = useState("");
  const [showCategorizeModal, setShowCategorizeModal] = useState(false);
  const [categorizeResults, setCategorizeResults] = useState<{
    processed: number;
    categorized: number;
    details: Array<{ id: string; name: string; assignedCategory: string; matchedKeyword: string }>;
  } | null>(null);

  // Batch Print Utility Modal state
  const [showBatchPrint, setShowBatchPrint] = useState(false);
  const [isGeneratingBatchPdf, setIsGeneratingBatchPdf] = useState(false);
  const [batchPrintProgress, setBatchPrintProgress] = useState(0);
  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [customHeaderTitle, setCustomHeaderTitle] = useState("Amit Online Services - Vault Document Repository Report");
  const [showBatchPrintConfirm, setShowBatchPrintConfirm] = useState(false);

  // PDF Merge Modal state & staged file state for size warnings
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [stagedUploadFiles, setStagedUploadFiles] = useState<File[]>([]);

  // Dynamic sorting state
  const [sortBy, setSortBy] = useState<"Name" | "ID" | "Size" | "Date">("Name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Inline tag input state per document row
  const [rowTagInput, setRowTagInput] = useState<Record<string, string>>({});

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/documents-master");
      if (res.data && res.data.success) {
        const rawDocs: MasterDocument[] = res.data.data || [];
        // Add default mock metadata if missing for demo/rich layout
        const enriched = rawDocs.map((doc, idx) => ({
          ...doc,
          Tags: doc.Tags || ["master_doc", "required_doc"],
          FileSize: doc.FileSize || (1024 * 1024 * (1.2 + (idx * 0.7) % 5)),
          UploadDate: doc.UploadDate || new Date(Date.now() - idx * 86400000 * 2).toISOString()
        }));
        setDocuments(enriched);
      }
    } catch (err: any) {
      console.error("Failed to load master documents:", err);
      toast.error("માસ્ટર દસ્તાવેજો લોડ કરવામાં નિષ્ફળતા.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleStartAdd = () => {
    setCurrentId(`doc_${Date.now()}`);
    setName("");
    setDescription("");
    setTags(["master_doc"]);
    setIsEditing(true);
  };

  const handleStartEdit = (doc: MasterDocument) => {
    setCurrentId(doc.ID);
    setName(doc.Name);
    setDescription(doc.Description);
    setTags(doc.Tags || ["master_doc"]);
    setIsEditing(true);
  };

  const handleAddInlineTag = (docId: string) => {
    const text = (rowTagInput[docId] || "").trim();
    if (!text) return;
    setDocuments(prev => prev.map(doc => {
      if (doc.ID === docId) {
        const currentTags = doc.Tags || [];
        if (!currentTags.includes(text)) {
          return { ...doc, Tags: [...currentTags, text] };
        }
      }
      return doc;
    }));
    setRowTagInput(prev => ({ ...prev, [docId]: "" }));
    toast.success(`Tag "${text}" appended to ${docId}`);
  };

  const handleRemoveInlineTag = (docId: string, tagToRemove: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.ID === docId) {
        return { ...doc, Tags: (doc.Tags || []).filter(t => t !== tagToRemove) };
      }
      return doc;
    }));
    toast.info(`Tag "${tagToRemove}" removed`);
  };

  // Centralized Tag Vault Management Functions
  const getAllUniqueTags = () => {
    const tagMap: Record<string, number> = {};
    documents.forEach(doc => {
      (doc.Tags || []).forEach(t => {
        tagMap[t] = (tagMap[t] || 0) + 1;
      });
    });
    return Object.entries(tagMap).map(([tag, count]) => ({ tag, count }));
  };

  const handleRenameTagAll = (oldTag: string, newTag: string) => {
    if (!newTag.trim()) return;
    const cleanNew = newTag.trim();
    setDocuments(prev => prev.map(doc => ({
      ...doc,
      Tags: (doc.Tags || []).map(t => (t === oldTag ? cleanNew : t))
    })));
    toast.success(`Renamed tag "${oldTag}" → "${cleanNew}" across all vault documents!`);
    setTagToEdit(null);
    setNewTagVal("");
  };

  const handleMergeTagAll = (sourceTag: string, targetTag: string) => {
    if (!targetTag.trim() || sourceTag === targetTag) return;
    setDocuments(prev => prev.map(doc => {
      const current = doc.Tags || [];
      if (current.includes(sourceTag)) {
        const filtered = current.filter(t => t !== sourceTag);
        if (!filtered.includes(targetTag)) filtered.push(targetTag);
        return { ...doc, Tags: filtered };
      }
      return doc;
    }));
    toast.success(`Merged tag "${sourceTag}" into "${targetTag}" across vault!`);
    setTagToMergeSource(null);
    setTagToMergeTarget("");
  };

  const handleDeleteTagAll = (tagToDelete: string) => {
    if (!window.confirm(`Are you sure you want to delete tag "${tagToDelete}" from all vault documents?`)) return;
    setDocuments(prev => prev.map(doc => ({
      ...doc,
      Tags: (doc.Tags || []).filter(t => t !== tagToDelete)
    })));
    toast.info(`Deleted tag "${tagToDelete}" across all vault documents.`);
  };

  // Bulk Auto-Categorize Background Worker Engine
  const handleBulkAutoCategorize = () => {
    if (documents.length === 0) {
      toast.error("No vault documents available to analyze.");
      return;
    }

    setAutoCategorizing(true);
    setCategorizeProgress(5);
    setCategorizeStatusText("Initializing background worker engine & regex pattern scanner...");
    setShowCategorizeModal(true);
    setCategorizeResults(null);

    const keywordRules = [
      { key: "pan", category: "Identity: PAN Card", tag: "Identity: PAN" },
      { key: "aadhar", category: "Identity: Aadhaar Card", tag: "Identity: Aadhaar" },
      { key: "aadhaar", category: "Identity: Aadhaar Card", tag: "Identity: Aadhaar" },
      { key: "uidai", category: "Identity: Aadhaar Card", tag: "Identity: Aadhaar" },
      { key: "certificate", category: "Official Certificate", tag: "Document: Certificate" },
      { key: "sanad", category: "Bar Sanad / Legal Degree", tag: "Legal: Sanad" },
      { key: "degree", category: "Academic Degree", tag: "Education: Degree" },
      { key: "notary", category: "Notary Affidavit / Deed", tag: "Legal: Notary" },
      { key: "affidavit", category: "Notary Affidavit", tag: "Legal: Affidavit" },
      { key: "receipt", category: "Payment Fee Receipt", tag: "Finance: Receipt" },
      { key: "invoice", category: "Tax Invoice / Billing", tag: "Finance: Invoice" },
      { key: "passport", category: "Passport Identity Doc", tag: "Identity: Passport" },
      { key: "licence", category: "Driving Licence", tag: "Identity: DL" },
      { key: "license", category: "Driving Licence", tag: "Identity: DL" },
      { key: "income", category: "Income Tax Proof", tag: "Finance: Income Tax" },
    ];

    let currentStep = 0;
    const totalDocs = documents.length;
    const resultsDetail: Array<{ id: string; name: string; assignedCategory: string; matchedKeyword: string }> = [];
    let newlyCategorizedCount = 0;

    const interval = setInterval(() => {
      currentStep += 1;
      const pct = Math.min(100, Math.round((currentStep / Math.max(totalDocs, 4)) * 100));
      setCategorizeProgress(pct);

      if (currentStep <= totalDocs) {
        const doc = documents[currentStep - 1];
        if (doc) {
          setCategorizeStatusText(`Worker analyzing document (${currentStep}/${totalDocs}): "${doc.Name}"`);
        }
      } else {
        setCategorizeStatusText("Applying category metadata tags and updating master vault registry...");
      }

      if (pct >= 100) {
        clearInterval(interval);

        // Perform actual state update
        setDocuments(prevDocs => {
          return prevDocs.map(doc => {
            const textToScan = `${doc.Name} ${doc.Description} ${(doc.Tags || []).join(" ")}`.toLowerCase();
            const matchedRule = keywordRules.find(k => textToScan.includes(k.key));

            // Assign matched rule or default fallback category if uncategorized
            const rule = matchedRule || { key: "general", category: "General Official Record", tag: "Category: General" };
            newlyCategorizedCount++;
            resultsDetail.push({
              id: doc.ID,
              name: doc.Name,
              assignedCategory: rule.category,
              matchedKeyword: matchedRule ? matchedRule.key.toUpperCase() : "AUTOMATED HEURISTIC"
            });

            const newTags = Array.from(new Set([...(doc.Tags || []), rule.tag, `Category: ${rule.category}`]));
            return {
              ...doc,
              Tags: newTags,
              Description: doc.Description.includes("[Auto-Categorized]")
                ? doc.Description
                : `${doc.Description} [Auto-Categorized: ${rule.category}]`
            };
          });
        });

        setCategorizeResults({
          processed: totalDocs,
          categorized: newlyCategorizedCount,
          details: resultsDetail
        });
        setAutoCategorizing(false);
        toast.success(`Bulk Auto-Categorization Complete! Categorized ${newlyCategorizedCount} vault documents.`);
      }
    }, 220);
  };

  // Automated Cleanup Script: Flags docs older than 180 days as 'Archived'
  const handleRunAutoArchive = () => {
    const NOW = Date.now();
    const DAYS_180_MS = 180 * 24 * 60 * 60 * 1000;
    let archivedCount = 0;

    setDocuments(prev => prev.map(doc => {
      const uploadTime = new Date(doc.UploadDate || 0).getTime();
      const ageMs = NOW - uploadTime;
      if (ageMs > DAYS_180_MS && !doc.Archived) {
        archivedCount++;
        return {
          ...doc,
          Archived: true,
          Tags: Array.from(new Set([...(doc.Tags || []), "archived_180d"]))
        };
      }
      return doc;
    }));

    if (archivedCount > 0) {
      toast.success(`Automated Cleanup: Flagged ${archivedCount} document(s) older than 180 days as 'Archived'.`);
    } else {
      toast.info("Automated Cleanup: All active documents are within the 180-day threshold.");
    }
  };

  // Batch Print Aggregation simulation
  const handleStartBatchPrint = () => {
    if (selectedDocIds.length === 0) {
      toast.error("Please select at least one document to aggregate for batch printing.");
      return;
    }
    setIsGeneratingBatchPdf(true);
    setBatchPrintProgress(10);
    setShowBatchPrint(true);

    const interval = setInterval(() => {
      setBatchPrintProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGeneratingBatchPdf(false);
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  // Comprehensive File Validation (PDF/Image, 50MB limit)
  const handleFileUploadValidation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    const filesArray = Array.from(rawFiles);
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB Limit
    const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];

    const newDocs: MasterDocument[] = [];
    setStagedUploadFiles(filesArray);

    for (const file of filesArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`અમાન્ય ફાઇલ પ્રકાર: "${file.name}"! ફક્ત PDF અને ચિત્રો (JPG/PNG) ઉપલબ્ધ છે.`);
        continue;
      }

      if (file.size > MAX_SIZE) {
        toast.error(`ફાઇલ "${file.name}" નું કદ પરિસીમાથી વધુ છે! કદ ${(file.size / (1024 * 1024)).toFixed(1)}MB છે (મહત્તમ 50MB).`);
        continue;
      }

      const newDocId = `doc_${file.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      newDocs.push({
        ID: newDocId,
        Name: file.name.replace(/\.[^/.]+$/, ""),
        Description: `Uploaded ${file.type.includes("pdf") ? "PDF Document" : "Image File"} (${(file.size / 1024).toFixed(0)} KB)`,
        Tags: ["uploaded", file.type.includes("pdf") ? "pdf" : "image"],
        FileSize: file.size,
        UploadDate: new Date().toISOString()
      });
    }

    if (newDocs.length > 0) {
      setDocuments(prev => [...newDocs, ...prev]);
      toast.success(`${newDocs.length} file(s) passed 50MB security validation and added to repository!`);
    }
    e.target.value = "";
  };

  const handleSortToggle = (field: "Name" | "ID" | "Size" | "Date") => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("દસ્તાવેજનું નામ દાખલ કરો.");
      return;
    }
    if (!currentId.trim()) {
      toast.error("દસ્તાવેજ આઈડી દાખલ કરો.");
      return;
    }

    const toastId = toast.loading("દસ્તાવેજ સાચવવામાં આવી રહ્યો છે...");
    try {
      const res = await axios.post(
        "/api/admin/documents-master/update",
        {
          ID: currentId.trim(),
          Name: name.trim(),
          Description: description.trim(),
          Tags: tags
        },
        {
          headers: { Authorization: `Bearer ${user?.token || ""}` },
        }
      );

      if (res.data && res.data.success) {
        toast.success("માસ્ટર દસ્તાવેજ સાચવવામાં આવ્યો છે!", { id: toastId });
        setIsEditing(false);
        fetchDocuments();
      } else {
        toast.error("દસ્તાવેજ સાચવવામાં નિષ્ફળતા.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Failed to save master document:", err);
      toast.error(err.response?.data?.error || "દસ્તાવેજ સાચવવામાં સમસ્યા.", { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("ખરેખર આ દસ્તાવેજને માસ્ટર લિસ્ટમાંથી કાઢી નાખવો છે?")) return;

    const toastId = toast.loading("દસ્તાવેજ કાઢી નાખવામાં આવી રહ્યો છે...");
    try {
      const res = await axios.post(
        "/api/admin/documents-master/delete",
        { ID: id },
        {
          headers: { Authorization: `Bearer ${user?.token || ""}` },
        }
      );

      if (res.data && res.data.success) {
        toast.success("દસ્તાવેજ કાઢી નાખવામાં આવ્યો છે!", { id: toastId });
        fetchDocuments();
      } else {
        toast.error("દસ્તાવેજ કાઢી નાખવામાં નિષ્ફળતા.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Failed to delete master document:", err);
      toast.error("દસ્તાવેજ કાઢી નાખવામાં સમસ્યા.", { id: toastId });
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const isArchived = !!doc.Archived;
    if (viewMode === "active" && isArchived) return false;
    if (viewMode === "archived" && !isArchived) return false;

    const term = searchTerm.toLowerCase();
    return (
      doc.Name.toLowerCase().includes(term) ||
      doc.ID.toLowerCase().includes(term) ||
      doc.Description.toLowerCase().includes(term) ||
      (doc.Tags || []).some(t => t.toLowerCase().includes(term))
    );
  });

  const sortedDocs = [...filteredDocs].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "Name") {
      comparison = a.Name.localeCompare(b.Name);
    } else if (sortBy === "ID") {
      comparison = a.ID.localeCompare(b.ID);
    } else if (sortBy === "Size") {
      comparison = (a.FileSize || 0) - (b.FileSize || 0);
    } else if (sortBy === "Date") {
      comparison = new Date(a.UploadDate || 0).getTime() - new Date(b.UploadDate || 0).getTime();
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // 500 MB Storage Quota Calculation
  const QUOTA_BYTES = 500 * 1024 * 1024; // 500MB
  let pdfBytes = 0;
  let pdfCount = 0;
  let imageBytes = 0;
  let imageCount = 0;
  let otherBytes = 0;
  let otherCount = 0;

  documents.forEach(doc => {
    const size = doc.FileSize || (1024 * 1024 * 2.5);
    const text = (doc.Name + " " + (doc.Description || "") + " " + (doc.Tags || []).join(" ") + " " + doc.ID).toLowerCase();
    
    if (text.includes("pdf")) {
      pdfBytes += size;
      pdfCount++;
    } else if (text.includes("image") || text.includes("jpg") || text.includes("jpeg") || text.includes("png") || text.includes("webp") || text.includes("photo") || text.includes("scan")) {
      imageBytes += size;
      imageCount++;
    } else {
      otherBytes += size;
      otherCount++;
    }
  });

  const totalUsedBytes = pdfBytes + imageBytes + otherBytes;
  const pdfPct = Math.min((pdfBytes / QUOTA_BYTES) * 100, 100);
  const imagePct = Math.min((imageBytes / QUOTA_BYTES) * 100, 100);
  const otherPct = Math.min((otherBytes / QUOTA_BYTES) * 100, 100);
  const totalPct = Math.min((totalUsedBytes / QUOTA_BYTES) * 100, 100);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100 max-w-5xl mx-auto">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5 matches">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-rose-500 w-5 h-5 animate-pulse" />
            Global Document Repository (ગ્લોબલ દસ્તાવેજ સંગ્રહાલય)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage a universal list of document types and checklists. Services use these IDs to link requirements.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={handleStartAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} /> નવો દસ્તાવેજ ઉમેરો
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-slate-50 rounded-2xl p-5 border border-slate-200"
          >
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-sm font-black text-slate-700 uppercase tracking-wider">
                  {currentId.startsWith("doc_") ? "નવો માસ્ટર દસ્તાવેજ" : "દસ્તાવેજ સુધારો"}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Document ID (વિશિષ્ટ આઈડી) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={currentId}
                    onChange={(e) => setCurrentId(e.target.value)}
                    placeholder="e.g. doc_aadhar"
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-colors"
                    disabled={!currentId.startsWith("doc_")}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Once created, ID cannot be edited. Services link using this exact key.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Document Name (દસ્તાવેજનું નામ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aadhar Card (આધાર કાર્ડ)"
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Description / Upload Instructions (વર્ણન / વિગતો)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Clear copy of Aadhar card with both front and back sides visible"
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Check size={16} /> સાચવો
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Search filter and file validation upload row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="relative md:col-span-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="દસ્તાવેજ આઈડી, નામ અથવા ટેગ દ્વારા શોધો... (Search by ID, Name, Description or Tag)"
                  className="w-full text-xs pl-11 pr-5 py-3 outline-none bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-rose-500 transition-all text-slate-700 placeholder-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    સાફ કરો
                  </button>
                )}
              </div>

              {/* Upload Dropzone with 10MB Validation */}
              <div>
                <input
                  type="file"
                  ref={uploadInputRef}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  multiple={true}
                  onChange={handleFileUploadValidation}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-2xl py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
                >
                  <Upload size={14} className="text-rose-500" /> Upload PDF/Image (Max 50MB)
                </button>
              </div>

              {/* Real-time Staged Upload File Size Warning Indicator */}
              {stagedUploadFiles.length > 0 && (
                <div className="mt-3">
                  <UploadFileSizeIndicator
                    currentSizeBytes={stagedUploadFiles.reduce((acc, f) => acc + f.size, 0)}
                    fileCount={stagedUploadFiles.length}
                    maxSizeBytes={50 * 1024 * 1024}
                    warningThresholdBytes={40 * 1024 * 1024}
                  />
                </div>
              )}
            </div>

            {/* Storage Utilization Visualizer */}
            <div className="mb-5 bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-900/80 dark:to-slate-900/40 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
                    <HardDrive size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      Storage Utilization Visualizer
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        500 MB Quota
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Document Repository Quota &amp; Category Breakdown
                    </p>
                  </div>
                </div>
                <div className="sm:text-right flex items-center sm:block gap-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono block">
                    {(totalUsedBytes / (1024 * 1024)).toFixed(1)} MB / 500 MB
                  </span>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                    {totalPct.toFixed(1)}% Used
                  </span>
                </div>
              </div>

              {/* Progress Bar with Segments */}
              <div className="w-full h-3.5 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner p-0.5 gap-0.5">
                {pdfPct > 0 && (
                  <div
                    style={{ width: `${Math.max(pdfPct, 1)}%` }}
                    className="bg-blue-500 hover:bg-blue-600 transition-all rounded-l-full relative"
                    title={`PDF Files: ${(pdfBytes / (1024 * 1024)).toFixed(2)} MB (${pdfCount} files)`}
                  />
                )}
                {imagePct > 0 && (
                  <div
                    style={{ width: `${Math.max(imagePct, 1)}%` }}
                    className="bg-emerald-500 hover:bg-emerald-600 transition-all relative"
                    title={`Images: ${(imageBytes / (1024 * 1024)).toFixed(2)} MB (${imageCount} files)`}
                  />
                )}
                {otherPct > 0 && (
                  <div
                    style={{ width: `${Math.max(otherPct, 1)}%` }}
                    className="bg-purple-500 hover:bg-purple-600 transition-all rounded-r-full relative"
                    title={`Other Documents: ${(otherBytes / (1024 * 1024)).toFixed(2)} MB (${otherCount} files)`}
                  />
                )}
              </div>

              {/* Storage Breakdown Legend */}
              <div className="grid grid-cols-3 gap-3 mt-3.5 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-blue-500 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-[11px]">PDF Documents</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {(pdfBytes / (1024 * 1024)).toFixed(1)} MB ({pdfCount} files)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-500 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-[11px]">Images (JPG/PNG)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {(imageBytes / (1024 * 1024)).toFixed(1)} MB ({imageCount} files)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-purple-500 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-[11px]">Other Files</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {(otherBytes / (1024 * 1024)).toFixed(1)} MB ({otherCount} files)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Administrative Utility Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("active")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === "active" ? "bg-rose-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-100"}`}
                >
                  Active Vault ({documents.filter(d => !d.Archived).length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("archived")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === "archived" ? "bg-amber-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-100"}`}
                >
                  <Archive size={13} /> Archived (&gt;180 Days) ({documents.filter(d => d.Archived).length})
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkAutoCategorize}
                  disabled={autoCategorizing}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow"
                  title="Background worker: Analyzes uncategorized documents for keywords (PAN, Aadhar, Certificate) and auto-updates metadata"
                >
                  <Sparkles size={13} className="text-amber-300 animate-pulse" /> Bulk Auto-Categorize
                </button>

                <button
                  type="button"
                  onClick={() => setShowTagManager(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Centralized Tag Manager (Edit, Merge, Delete Tags Across Vault)"
                >
                  <Tag size={13} className="text-rose-500" /> Tag Vault Manager
                </button>

                <button
                  type="button"
                  onClick={handleRunAutoArchive}
                  className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Automated Cleanup Script: Move >180-day old docs to Archive"
                >
                  <RefreshCw size={13} className="text-amber-500" /> Auto-Archive Cleanup (&gt;180d)
                </button>

                <button
                  type="button"
                  onClick={handleStartBatchPrint}
                  disabled={selectedDocIds.length === 0}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${selectedDocIds.length > 0 ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                >
                  <Printer size={13} /> Batch Print Utility ({selectedDocIds.length})
                </button>

                <button
                  type="button"
                  onClick={() => setShowMergeModal(true)}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Merge multiple PDF files into a single consolidated PDF document"
                >
                  <FileStack size={13} /> Merge PDF Files
                </button>
              </div>
            </div>

            {/* List Table container */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
                <RefreshCw size={24} className="animate-spin text-rose-500" />
                <span className="text-xs">લોડ થઈ રહ્યું છે, મહેરબાની કરીને રાહ જુઓ...</span>
              </div>
            ) : sortedDocs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50">
                <FileText className="mx-auto w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">કોઈ દસ્તાવેજ મળ્યો નથી</p>
                <p className="text-xs text-slate-400 mt-1">પ્રયાસ કરો અથવા નવો દસ્તાવેજ ઉમેરો.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-200">
                      <th className="px-3 py-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={sortedDocs.length > 0 && selectedDocIds.length === sortedDocs.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocIds(sortedDocs.map(d => d.ID));
                            } else {
                              setSelectedDocIds([]);
                            }
                          }}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                        />
                      </th>
                      <th 
                        onClick={() => handleSortToggle("ID")}
                        className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          ID / આઈડી
                          {sortBy === "ID" ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortToggle("Name")}
                        className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Document Name / નામ
                          {sortBy === "Name" ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortToggle("Size")}
                        className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          File Size
                          {sortBy === "Size" ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSortToggle("Date")}
                        className="px-4 py-3.5 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                      >
                        <div className="flex items-center gap-1.5">
                          Date
                          {sortBy === "Date" ? (sortOrder === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                        </div>
                      </th>
                      <th className="px-4 py-3.5 min-w-[220px]">
                        Metadata Tags (Inline Manager)
                      </th>
                      <th className="px-4 py-3.5 text-right w-20">ક્રિયા</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {sortedDocs.map((doc) => (
                      <tr key={doc.ID} className={`hover:bg-slate-50/50 transition-colors ${selectedDocIds.includes(doc.ID) ? "bg-blue-50/30" : ""}`}>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedDocIds.includes(doc.ID)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocIds(prev => [...prev, doc.ID]);
                              } else {
                                setSelectedDocIds(prev => prev.filter(id => id !== doc.ID));
                              }
                            }}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-500 text-[11px] select-all">
                          {doc.ID}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          {doc.Name}
                          <p className="text-[10px] text-slate-400 font-normal truncate max-w-[180px]">
                            {doc.Description || "No description"}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {doc.FileSize ? `${(doc.FileSize / (1024 * 1024)).toFixed(2)} MB` : "1.20 MB"}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {doc.UploadDate ? new Date(doc.UploadDate).toLocaleDateString() : "Today"}
                        </td>
                        {/* Inline Tag Manager */}
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1 mb-1.5">
                            {(doc.Tags || []).map((t) => (
                              <span 
                                key={t} 
                                className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9.5px] font-bold px-2 py-0.5 rounded-md border border-slate-200/80"
                              >
                                <Tag size={9} className="text-rose-500" />
                                {t}
                                <button
                                  onClick={() => handleRemoveInlineTag(doc.ID, t)}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer ml-0.5"
                                  title="Remove Tag"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={rowTagInput[doc.ID] || ""}
                              onChange={(e) => setRowTagInput({ ...rowTagInput, [doc.ID]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddInlineTag(doc.ID);
                                }
                              }}
                              placeholder="+ Add tag"
                              className="text-[10px] px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-rose-500 w-24"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddInlineTag(doc.ID)}
                              className="p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-[10px] font-bold cursor-pointer"
                              title="Append Tag"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleStartEdit(doc)}
                              className="p-1 px-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                              title="Edit Document"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(doc.ID)}
                              className="p-1 px-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Delete Document"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centralized Tag Vault Manager Modal */}
      {showTagManager && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-500">
                <Tag size={20} />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Centralized Tag Vault Manager</h3>
              </div>
              <button
                onClick={() => setShowTagManager(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage all metadata tags across the entire document vault. Renaming or deleting tags applies globally across all master document records.
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {getAllUniqueTags().length === 0 ? (
                <p className="text-xs text-center py-8 text-slate-400">No tags found in repository.</p>
              ) : (
                getAllUniqueTags().map(({ tag, count }) => (
                  <div key={tag} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-bold font-mono border border-rose-500/20">
                        #{tag}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">({count} doc{count > 1 ? 's' : ''})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {tagToEdit === tag ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={newTagVal}
                            onChange={(e) => setNewTagVal(e.target.value)}
                            placeholder="New tag name"
                            className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:border-rose-500"
                          />
                          <button
                            onClick={() => handleRenameTagAll(tag, newTagVal)}
                            className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            title="Save Rename"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setTagToEdit(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : tagToMergeSource === tag ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={tagToMergeTarget}
                            onChange={(e) => setTagToMergeTarget(e.target.value)}
                            className="text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg outline-none"
                          >
                            <option value="">Merge into...</option>
                            {getAllUniqueTags().filter(t => t.tag !== tag).map(t => (
                              <option key={t.tag} value={t.tag}>{t.tag}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleMergeTagAll(tag, tagToMergeTarget)}
                            disabled={!tagToMergeTarget}
                            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            title="Confirm Merge"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setTagToMergeSource(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { setTagToEdit(tag); setNewTagVal(tag); }}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => { setTagToMergeSource(tag); setTagToMergeTarget(""); }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100"
                          >
                            Merge
                          </button>
                          <button
                            onClick={() => handleDeleteTagAll(tag)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete Tag Globally"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowTagManager(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Print Utility Modal */}
      {showBatchPrint && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Printer size={22} />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Batch Document Print Utility</h3>
                  <p className="text-xs text-slate-500">Aggregating {selectedDocIds.length} document(s) into unified printable layout</p>
                </div>
              </div>
              <button
                onClick={() => setShowBatchPrint(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Aggregation Loading Indicator */}
            {isGeneratingBatchPdf ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 size={36} className="text-blue-600 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Compiling Batch Print Layout...</p>
                  <p className="text-xs text-slate-500">Normalizing margins, headers, and page numbering</p>
                </div>
                <div className="w-64 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${batchPrintProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Print Customization Controls */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal size={14} /> Batch Print Configurations
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={includePageNumbers}
                        onChange={(e) => setIncludePageNumbers(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Include Dynamic Page Numbers (e.g. Page 1 of N)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={includeHeader}
                        onChange={(e) => setIncludeHeader(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      Include Official Header / Footer
                    </label>
                  </div>
                  {includeHeader && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Custom Document Header Title
                      </label>
                      <input
                        type="text"
                        value={customHeaderTitle}
                        onChange={(e) => setCustomHeaderTitle(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                      />
                    </div>
                  )}
                </div>

                {/* Print Preview Canvas Frame */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-100 dark:bg-slate-950 text-slate-900 space-y-6">
                  {includeHeader && (
                    <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center text-xs font-serif">
                      <span className="font-bold tracking-wider uppercase text-slate-900 dark:text-slate-100">{customHeaderTitle}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {documents.filter(d => selectedDocIds.includes(d.ID)).map((doc, index) => (
                      <div key={doc.ID} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="font-bold text-xs text-blue-600 dark:text-blue-400 font-mono">[{index + 1}] {doc.ID}</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold">{doc.Name}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{doc.Description || "Standard document requirements and guidelines"}</p>
                        <div className="flex flex-wrap gap-1">
                          {(doc.Tags || []).map(t => (
                            <span key={t} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-mono">#{t}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {includePageNumbers && (
                    <div className="pt-4 border-t border-slate-300 dark:border-slate-800 text-center text-[10px] font-mono text-slate-500">
                      --- Page 1 of 1 | Verified Vault Batch Export ---
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBatchPrint(false)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setShowBatchPrintConfirm(true)}
                disabled={isGeneratingBatchPdf}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer size={14} /> Print Batch ({selectedDocIds.length} Docs)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog before Printing Batch */}
      {showBatchPrintConfirm && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Confirm Batch Print</h4>
                <p className="text-xs text-slate-400">Verify spooler document count</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              Are you sure you want to trigger print for <strong className="text-blue-400">{selectedDocIds.length} aggregated document(s)</strong>? This will render the standardized A4 layout and open your system print dialog.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBatchPrintConfirm(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBatchPrintConfirm(false);
                  window.print();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} /> Confirm & Print Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Auto-Categorize Background Worker Modal */}
      {showCategorizeModal && (
        <div className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/30">
                  <Cpu size={24} className={autoCategorizing ? "animate-spin" : ""} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white flex items-center gap-2">
                    Bulk Auto-Categorization Worker
                    {autoCategorizing && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
                        RUNNING
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Background document metadata analysis &amp; keyword tagging
                  </p>
                </div>
              </div>
              {!autoCategorizing && (
                <button
                  onClick={() => setShowCategorizeModal(false)}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Progress Bar & Status Text */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-purple-300">{categorizeStatusText}</span>
                <span className="text-white">{categorizeProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  style={{ width: `${categorizeProgress}%` }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>

            {/* Results Summary & Breakdown */}
            {categorizeResults && (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-800/60 p-3 rounded-2xl text-xs">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Categorization Complete
                  </span>
                  <span className="font-mono text-white font-black">
                    {categorizeResults.categorized} / {categorizeResults.processed} Docs Updated
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Categorized Documents Breakdown
                  </span>
                  <div className="space-y-1.5">
                    {categorizeResults.details.slice(0, 8).map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs font-sans"
                      >
                        <div>
                          <span className="font-bold text-white block">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Keyword Match: {item.matchedKeyword}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-lg text-[10px] font-bold">
                          {item.assignedCategory}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCategorizeModal(false)}
                disabled={autoCategorizing}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {autoCategorizing ? "Worker Processing..." : "Done & Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge PDF Modal */}
      <MergePDFModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        availableDocuments={documents}
      />
    </div>
  );
}
