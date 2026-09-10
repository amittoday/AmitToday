import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, Edit2, Check, X, FileText, ChevronRight, 
  RefreshCw, Search, ArrowLeft, DollarSign, List, ShieldAlert, 
  AlertCircle, Link, Upload, CheckSquare, Square, Folder, LayoutGrid, Layers, HelpCircle, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import axios from "axios";
import { toast } from "sonner";
import Papa from "papaparse";
import DocumentManager, { MasterDocument } from "./DocumentManager";

interface Service {
  ID: string;
  Category: string;
  SubCategory: string;
  ServiceName: string; // Service Title
  BasePrice: number; // Total price calculated
  TurnaroundTime: string;
  RequiredDocuments: string; // Old Document list ID
  RequiredFields: string; // JSON String or Array representing fields
  PdfDownloads: string; // JSON String or Array representing blank forms
  Status: string; // "Active" | "Inactive"
  Description?: string; // Markdown description
  GovtFee?: number;
  ServiceCharge?: number;
  CourierCharge?: number;
  OfficialPdfUrl?: string; // GR, blank form link
  RequiredDocIDs?: string; // JSON Array String of master Document IDs (or comma separated)
}

interface DocumentList {
  ID: string;
  ListName: string;
  Documents: string[];
}

export default function AdminGovServices({ user, onBack }: { user: any; onBack?: () => void }) {
  // Navigation inside Admin CMS
  const [activeTab, setActiveTab2] = useState<"services" | "repository" | "bulk">("services");

  const [services, setServices] = useState<Service[]>([]);
  const [docLists, setDocLists] = useState<DocumentList[]>([]);
  const [masterDocs, setMasterDocs] = useState<MasterDocument[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search and filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Edit/Add modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form inputs
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState(""); // Title
  const [formDescription, setFormDescription] = useState(""); // Markdown
  const [formCategory, setFormCategory] = useState("Online Application");
  const [formSubCategory, setFormSubCategory] = useState("");
  const [formTurnaround, setFormTurnaround] = useState("3-5 Days");
  const [formRequiredDocsId, setFormRequiredDocsId] = useState("");
  
  // Multi-select state for RequiredDocIDs (New Global Repository IDs)
  const [formRequiredDocIDs, setFormRequiredDocIDs] = useState<string[]>([]);

  const [formGovtFee, setFormGovtFee] = useState<number>(0);
  const [formServiceCharge, setFormServiceCharge] = useState<number>(150);
  const [formCourierCharge, setFormCourierCharge] = useState<number>(0);
  const [formOfficialPdfUrl, setFormOfficialPdfUrl] = useState("");
  const [formStatus, setFormStatus] = useState("Active");

  // Delete confirm modal state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // --- Bulk CSV State ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [parsedBulkServices, setParsedBulkServices] = useState<any[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Sync state & handler
  const [syncing, setSyncing] = useState(false);

  const handleSyncFromSheets = async () => {
    setSyncing(true);
    const toastId = toast.loading("માહિતી ગુગલ શીટ થી સિંક થઈ રહી છે... (Syncing with Google Sheets...)");
    try {
      const res = await axios.post("/api/services/sync");
      if (res.data && res.data.success) {
        toast.success("ગુગલ શીટ માથી લેટેસ્ટ માહિતી સફળતાપૂર્વક સિંક થઈ ગઈ છે! (Dynamic services synced successfully!)", { id: toastId });
        await fetchData(); // Refresh parent lists
      } else {
        toast.error(res.data?.error || "સિંક કરવા માં નિષ્ફળતા. (Failed to sync from Sheets.)", { id: toastId });
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error(`Error: ${err.message || "Could not complete metadata sync."}`, { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  // Load All Master Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesRes, docListsRes, masterDocsRes] = await Promise.all([
        axios.get("/api/services-master"),
        axios.get("/api/document-lists"),
        axios.get("/api/documents-master")
      ]);

      if (servicesRes.data && servicesRes.data.success) {
        setServices(servicesRes.data.data || []);
      }
      if (docListsRes.data && docListsRes.data.success) {
        setDocLists(docListsRes.data.data || []);
      }
      if (masterDocsRes.data && masterDocsRes.data.success) {
        setMasterDocs(masterDocsRes.data.data || []);
      }
    } catch (err) {
      console.error("Error loading admin services master lists", err);
      toast.error("Failed to fetch administrative catalogs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    const nextId = "SVC-0" + (Math.floor(Math.random() * 9000) + 1000);
    setEditingService(null);
    setFormId(nextId);
    setFormName("");
    setFormDescription("");
    setFormCategory("Online Application");
    setFormSubCategory("");
    setFormTurnaround("3-5 Days");
    setFormRequiredDocsId("");
    setFormRequiredDocIDs([]); // Start empty
    setFormGovtFee(0);
    setFormServiceCharge(150);
    setFormCourierCharge(0);
    setFormOfficialPdfUrl("");
    setFormStatus("Active");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (svc: Service) => {
    setEditingService(svc);
    setFormId(svc.ID);
    setFormName(svc.ServiceName || "");
    setFormDescription(svc.Description || "");
    setFormCategory(svc.Category || "Online Application");
    setFormSubCategory(svc.SubCategory || "");
    setFormTurnaround(svc.TurnaroundTime || "3-5 Days");
    setFormRequiredDocsId(svc.RequiredDocuments || "");
    
    // Parse master document IDs
    let parsedIDs: string[] = [];
    if (svc.RequiredDocIDs) {
      const rawIds = svc.RequiredDocIDs;
      if (Array.isArray(rawIds)) {
        parsedIDs = rawIds.map(id => String(id).trim()).filter(id => id.length > 0);
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
          parsedIDs = parsed.map(id => String(id).trim()).filter(id => id.length > 0);
        } else {
          const strIds = String(rawIds).trim();
          if (strIds.includes(",") || strIds.includes(";")) {
            parsedIDs = strIds.split(/[,;]/).map(i => i.trim()).filter(Boolean);
          } else if (strIds) {
            parsedIDs = [strIds];
          }
        }
      }
    }
    setFormRequiredDocIDs(parsedIDs);

    setFormGovtFee(svc.GovtFee ? Number(svc.GovtFee) : 0);
    setFormServiceCharge(svc.ServiceCharge ? Number(svc.ServiceCharge) : 0);
    setFormCourierCharge(svc.CourierCharge ? Number(svc.CourierCharge) : 0);
    setFormOfficialPdfUrl(svc.OfficialPdfUrl || "");
    setFormStatus(svc.Status || "Active");
    setIsFormOpen(true);
  };

  const handleToggleRequiredDocID = (id: string) => {
    setFormRequiredDocIDs(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim()) {
      toast.error("Service ID and Service Title are strictly required.");
      return;
    }

    const calculatedTotal = Number(formGovtFee) + Number(formServiceCharge) + Number(formCourierCharge);

    const payload = {
      ID: formId,
      ServiceName: formName,
      Description: formDescription,
      Category: formCategory,
      SubCategory: formSubCategory,
      TurnaroundTime: formTurnaround,
      RequiredDocuments: formRequiredDocsId, // Old fallback checklist list ID
      RequiredDocIDs: JSON.stringify(formRequiredDocIDs), // New dynamic Master IDs list
      BasePrice: calculatedTotal,
      GovtFee: Number(formGovtFee),
      ServiceCharge: Number(formServiceCharge),
      CourierCharge: Number(formCourierCharge),
      OfficialPdfUrl: formOfficialPdfUrl,
      Status: formStatus,
      RequiredFields: editingService?.RequiredFields || JSON.stringify([
        { name: "applicantName", label: "અરજદારનું પૂરું નામ (Applicant Full Name)", type: "text", required: true },
        { name: "mobile", label: "મોબાઈલ નંબર (Mobile Number)", type: "tel", required: true },
        { name: "email", label: "ઈમેઈલ એડ્રેસ (Email Address)", type: "email", required: false },
        { name: "remarks", label: "અરજી વધારાની વિગતો (Remarks)", type: "textarea", required: false },
      ]),
      PdfDownloads: editingService?.PdfDownloads || "[]"
    };

    const toastId = toast.loading("માહિતી અપડેટ થઈ રહી છે...");
    try {
      const res = await axios.post("/api/admin/services-master/update-schema", payload, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.data && res.data.success) {
        toast.success(editingService ? `Scheme "${formName}" updated successfully` : `New Scheme "${formName}" added successfully`, { id: toastId });
        setIsFormOpen(false);
        fetchData();
      } else {
        toast.error("Failed to save service schema details.", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error during save operations.", { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    const toastId = toast.loading("દસ્તાવેજ કાઢી નાખવામાં આવી રહ્યો છે...");
    try {
      const res = await axios.post("/api/admin/services-master/delete", { ID: id }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.data && res.data.success) {
        toast.success("Outdated government service deleted successfully.", { id: toastId });
        setDeleteConfirmId(null);
        fetchData();
      } else {
        toast.error("Unable to execute delete action.", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Error executing deletion.", { id: toastId });
    }
  };

  // --- Bulk CSV Import Logics ---
  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkCsvFile(file);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        console.log("Parsed CSV Rows:", rows);

        // Map parsed columns to our service shape
        // Columns required: Category, Sub-Category, ServiceName, GovFee, ServiceCharge, and RequiredDocIDs
        const formatted = rows.map((row: any, index) => {
          const cat = row["Category"] || row["category"] || "Online Application";
          const sub = row["Sub-Category"] || row["SubCategory"] || row["subcategory"] || "";
          const name = row["ServiceName"] || row["service_name"] || row["ServiceName"] || "Untitled Service";
          const govFee = Number(row["GovFee"] || row["gov_fee"] || row["GovtFee"] || 0);
          const srvCharge = Number(row["ServiceCharge"] || row["service_charge"] || row["ServiceCharge"] || 150);
          const docIDsStr = String(row["RequiredDocIDs"] || row["required_doc_ids"] || "").trim();
          
          let parsedDocIDs: string[] = [];
          if (docIDsStr) {
            parsedDocIDs = docIDsStr.split(",").map((s: string) => s.trim()).filter(Boolean);
          }

          return {
            ID: row["ID"] || `SVC-B${Math.floor(1000 + Math.random() * 9000)}`,
            Category: cat,
            SubCategory: sub,
            ServiceName: name,
            GovtFee: govFee,
            ServiceCharge: srvCharge,
            CourierCharge: 0,
            BasePrice: govFee + srvCharge,
            RequiredDocIDs: JSON.stringify(parsedDocIDs),
            TurnaroundTime: row["TurnaroundTime"] || "3-5 Days",
            Status: "Active",
            Description: row["Description"] || `Service details for ${name}`
          };
        });

        setParsedBulkServices(formatted);
        toast.info(`${formatted.length} services successfully loaded from CSV. Review below and strictly sync.`);
      },
      error: (error) => {
        console.error("CSV Parse error:", error);
        toast.error("Error parsing CSV spreadsheet file.");
      }
    });
  };

  const executeBulkSync = async () => {
    if (parsedBulkServices.length === 0) return;
    setIsBulkUploading(true);
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Uploading bulk catalog (0/${parsedBulkServices.length} saved)...`);

    for (const svc of parsedBulkServices) {
      try {
        const payload = {
          ...svc,
          RequiredFields: JSON.stringify([
            { name: "applicantName", label: "અરજદારનું પૂરું નામ (Applicant Full Name)", type: "text", required: true },
            { name: "mobile", label: "મોબાઈલ નંબર (Mobile Number)", type: "tel", required: true },
            { name: "email", label: "ઈમેઈલ એડ્રેસ (Email Address)", type: "email", required: false },
            { name: "remarks", label: "અરજી વધારાની વિગતો (Remarks)", type: "textarea", required: false },
          ]),
          PdfDownloads: "[]"
        };

        const res = await axios.post("/api/admin/services-master/update-schema", payload, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });

        if (res.data && res.data.success) {
          successCount++;
        } else {
          failCount++;
        }
        
        toast.loading(`Uploading bulk catalog (${successCount}/${parsedBulkServices.length} saved)...`, { id: toastId });
      } catch (e) {
        console.error("Failed to sync service:", svc, e);
        failCount++;
      }
    }

    setIsBulkUploading(false);
    toast.success(`Bulk Ingestion Finished! Successfully imported: ${successCount} services, Failures: ${failCount}`, { id: toastId });
    setParsedBulkServices([]);
    setBulkCsvFile(null);
    fetchData();
  };

  const handleDownloadSampleCSV = () => {
    const csvContent = "Category,Sub-Category,ServiceName,GovFee,ServiceCharge,RequiredDocIDs,Description\n" +
      "Revenue Services,IORA,7/12 land records extract,50,150,\"doc_aadhar,doc_7_12,doc_ration\",\"Use this service to update or request fresh computerized 7/12 land records.\"\n" +
      "eSamaj Kalyan,Widow Support,Vidhva Sahay Yojana,0,250,\"doc_aadhar,doc_ration,doc_husband_death,doc_no_remarriage,doc_pedhinamu\",\"widow pension plan supporting direct transfer in gujarat.\"\n";
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "amit_online_services_catalog_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample CSV format matching parameters downloaded successfully.");
  };

  // --- Filtering / Subcategory Logic ---
  const filteredServices = services.filter(svc => {
    const matchesSearch = 
      (svc.ServiceName || "").toLowerCase().includes(search.toLowerCase()) ||
      (svc.Category || "").toLowerCase().includes(search.toLowerCase()) ||
      (svc.SubCategory || "").toLowerCase().includes(search.toLowerCase()) ||
      (svc.ID || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "All" ? true : svc.Status === statusFilter;
    const matchesCategory = categoryFilter === "All" ? true : svc.Category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Extract list of unique categories
  const categoriesList = Array.from(new Set(services.map(s => s.Category).filter(Boolean)));

  return (
    <div className="space-y-8 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-8 rounded-[36px] border border-slate-100 dark:border-slate-800 font-sans">
      
      {/* Dynamic Tab Switcher Module Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-150 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-150 dark:border-slate-700 transition cursor-pointer"
            >
              <ArrowLeft size={16} className="text-slate-600 dark:text-slate-300" />
            </button>
          )}
          <div>
            <span className="text-[9px] bg-red-100 text-red-600 dark:bg-rose-950/45 dark:text-rose-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              Amit Online Services Hub
            </span>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1.5 matches">
              <Folder size={22} className="text-rose-500 shrink-0" /> Government Schemes & Services CMS
            </h3>
          </div>
        </div>

        {/* Unified Tab Navigator */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl w-full xl:w-auto">
          <button
            onClick={() => setActiveTab2("services")}
            className={`flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "services"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <LayoutGrid size={14} /> Services Catalog
          </button>
          <button
            onClick={() => setActiveTab2("repository")}
            className={`flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "repository"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Layers size={14} /> Document Repository
          </button>
          <button
            onClick={() => setActiveTab2("bulk")}
            className={`flex-1 xl:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "bulk"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Upload size={14} /> Bulk CSV Import
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: Services Catalog view */}
        {activeTab === "services" && (
          <motion.div
            key="tab_services"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Control Filter row (with Category Hierarchy filter added) */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm">
              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ID, Title, Category, Portal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white placeholder-slate-400"
                />
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Category Filtering Dropdown (Hierarchical) */}
                <div className="flex items-center gap-1.5 w-full md:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block whitespace-nowrap">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-350 p-2.5 rounded-xl font-bold outline-none cursor-pointer focus:border-rose-500"
                  >
                    <option value="All">All Categories</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 w-full md:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block whitespace-nowrap">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-350 p-2.5 rounded-xl font-bold outline-none cursor-pointer focus:border-rose-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto">
                  {/* Sync Button */}
                  <button
                    onClick={handleSyncFromSheets}
                    disabled={syncing || loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                    {syncing ? "સિંકિંગ થઈ રહ્યું છે..." : "ગુગલ શીટ થી ડેટા સિંક કરો (Sync Latest)"}
                  </button>

                  {/* Open Spreadsheet Launcher */}
                  <a
                    href="https://docs.google.com/spreadsheets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto text-center whitespace-nowrap"
                  >
                    <ExternalLink size={14} className="text-emerald-400" />
                    સત્તાવાર શીટ ખોલો (Open Google Sheet)
                  </a>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <RefreshCw className="mx-auto text-rose-500 animate-spin mb-3" size={32} />
                <p className="text-slate-450 text-xs font-bold uppercase tracking-wider">Syncing Administrative Ledgers...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <AlertCircle className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-500 text-sm font-bold">No custom government services match your filters.</p>
                <button
                  onClick={handleSyncFromSheets}
                  className="mt-4 px-4 py-2 bg-emerald-100 dark:bg-emerald-950/40 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  સિંક કરો (Trigger Sync Now)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((svc, idx) => {
                  const govt = Number(svc.GovtFee || 0);
                  const agency = Number(svc.ServiceCharge || 0);
                  const courier = Number(svc.CourierCharge || 0);
                  const total = govt + agency + courier;

                  // Find how many documents are linked
                  let linkedDocCount = 0;
                  if (svc.RequiredDocIDs) {
                    try {
                      const parsed = typeof svc.RequiredDocIDs === "string" 
                        ? JSON.parse(svc.RequiredDocIDs) 
                        : svc.RequiredDocIDs;
                      linkedDocCount = Array.isArray(parsed) ? parsed.length : 0;
                    } catch (_) {
                      linkedDocCount = 0;
                    }
                  } else if (svc.RequiredDocuments) {
                    const matchedOldList = docLists.find(d => d.ID === svc.RequiredDocuments);
                    linkedDocCount = matchedOldList ? matchedOldList.Documents?.length || 0 : 0;
                  }

                  return (
                    <motion.div
                      layout
                      key={`${svc.ID}-${idx}`}
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-rose-400 dark:hover:border-rose-500/50 transition-all hover:shadow-md"
                    >
                      <div>
                        {/* Upper category and status tags */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-md font-bold uppercase truncate max-w-[130px]">
                            {svc.Category}
                          </span>
                          <span className={`text-[9px] px-2.5 py-1 rounded-md font-extrabold uppercase border ${
                            svc.Status === "Active"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                              : "bg-red-50 dark:bg-rose-950/20 text-rose-500 border-rose-100 dark:border-rose-900/30"
                          }`}>
                            {svc.Status}
                          </span>
                        </div>

                        {/* Title details */}
                        <div className="mt-4">
                          <span className="text-[10px] font-mono text-slate-400">ID: {svc.ID}</span>
                          {svc.SubCategory && (
                            <span className="text-[10px] text-slate-400 ml-2 border-l border-slate-300 pl-2">
                              {svc.SubCategory}
                            </span>
                          )}
                          <h4 className="text-sm font-black text-slate-800 dark:text-white mt-1 leading-snug tracking-tight hover:text-rose-500 transition-colors">
                            {svc.ServiceName}
                          </h4>
                        </div>

                        {/* Cost distribution */}
                        <div className="mt-5 bg-slate-50 dark:bg-slate-900/40 divide-y divide-slate-100 dark:divide-slate-850 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <div className="flex justify-between py-1.5">
                            <span>Government Fee (પોર્ટલ ફી):</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">₹{govt}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span>Service Charge (એજન્સી ચાર્જ):</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">₹{agency}</span>
                          </div>
                          {courier > 0 && (
                            <div className="flex justify-between py-1.5">
                              <span>Courier Surcharge (ટપાલ ચાર્જ):</span>
                              <span className="font-mono text-slate-800 dark:text-slate-200">₹{courier}</span>
                            </div>
                          )}
                          <div className="flex justify-between py-2 text-slate-800 dark:text-white font-extrabold pb-0">
                            <span>Total Client Price (કુલ રકમ):</span>
                            <span className="font-mono text-rose-600 dark:text-rose-400 text-xs">₹{total}</span>
                          </div>
                        </div>

                        {/* Linked Doc checklist info */}
                        <div className="mt-3.5 flex items-start gap-2 text-xs font-semibold text-slate-550 dark:text-slate-400">
                          <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Linked Documents Checklist:</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {linkedDocCount > 0 
                                ? `${linkedDocCount} specific master documents required`
                                : "No checklist mapped (Requires Aadhar + Basic profile)"
                              }
                            </span>
                          </div>
                        </div>

                        {svc.OfficialPdfUrl && (
                          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                            <Link size={12} />
                            <span className="truncate max-w-[200px] hover:underline cursor-pointer" title={svc.OfficialPdfUrl}>
                              Official GR Form PDF Linked
                            </span>
                          </div>
                        )}

                        {/* Description preview */}
                        {svc.Description && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-900">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Scheme Details:</span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed mt-0.5">
                              {svc.Description}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-805/40 text-center flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Check className="text-emerald-500" size={12} /> Live catalog
                        </span>
                        <span className="text-[9px] font-mono text-slate-350">
                          Google Sheets Managed
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 2: Global Document Repository (Loads separate beautiful sub component) */}
        {activeTab === "repository" && (
          <motion.div
            key="tab_repository"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DocumentManager user={user} />
          </motion.div>
        )}

        {/* TAB 3: Advanced Bulk CSV Import */}
        {activeTab === "bulk" && (
          <motion.div
            key="tab_bulk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-5xl mx-auto rounded-3xl p-6 bg-white border border-slate-200/80 shadow-md space-y-6"
          >
            <div>
              <h4 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                <Upload className="text-rose-500 w-5 h-5" /> Bulk Ingest Services & PDF Schemes
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Upload a spreadsheet with standard columns to dynamically add or replace bulk services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="space-y-3.5">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">1. Requirements & Parameters</h5>
                <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside">
                  <li>CSV must be formatted exactly using comma-separated values.</li>
                  <li>Columns Required: <strong className="text-slate-800">Category, Sub-Category, ServiceName, GovFee, ServiceCharge, and RequiredDocIDs</strong>.</li>
                  <li>The <strong className="text-slate-800">RequiredDocIDs</strong> column should be comma-separated list of Master IDs from the Document Repository (e.g., <code className="bg-slate-200 select-all font-mono px-1">doc_aadhar,doc_ration</code>).</li>
                  <li>Optional columns: ID, Description, TurnaroundTime.</li>
                </ul>
                <button
                  onClick={handleDownloadSampleCSV}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FileText size={14} /> Download Compliant Sample CSV
                </button>
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-white p-6 text-center">
                <Upload className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
                <span className="text-xs font-bold text-slate-600 block">Drag & Drop Spreadsheet here</span>
                <span className="text-[10px] text-slate-400 mt-1 block mb-3">or select select standard CSV files</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv"
                  onChange={handleCsvSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide shadow-md transition-all cursor-pointer"
                >
                  Browse spreadsheet
                </button>
                {bulkCsvFile && (
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-3 py-1 mt-3.5 rounded border">
                    Loaded: {bulkCsvFile.name} ({Math.round(bulkCsvFile.size / 1024)} KB)
                  </span>
                )}
              </div>
            </div>

            {parsedBulkServices.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-widest block">
                    Review Ingestion List ({parsedBulkServices.length} items parsed)
                  </span>
                  <button
                    onClick={executeBulkSync}
                    disabled={isBulkUploading}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wide shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isBulkUploading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Syncing Schemes...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Strictly Sync to Database
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-xl shadow-sm text-xs bg-slate-50/50">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold border-b select-none">
                        <th className="p-3 w-28">Scheme ID</th>
                        <th className="p-3 w-1/4">Category / Portal</th>
                        <th className="p-3 w-1/3">Service Name</th>
                        <th className="p-3 text-right">Govt Fee</th>
                        <th className="p-3 text-right">Service Charge</th>
                        <th className="p-3">Linked Doc IDs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {parsedBulkServices.map((svc: any, idx: number) => {
                        let docsParsed: string[] = [];
                        if (svc.RequiredDocIDs) {
                          if (Array.isArray(svc.RequiredDocIDs)) {
                            docsParsed = svc.RequiredDocIDs;
                          } else {
                            try {
                              const parsed = JSON.parse(String(svc.RequiredDocIDs));
                              docsParsed = Array.isArray(parsed) ? parsed : [];
                            } catch (_) {
                              docsParsed = String(svc.RequiredDocIDs).split(/[,;]/).map(d => d.trim()).filter(Boolean);
                            }
                          }
                        }
                        return (
                          <tr key={idx} className="hover:bg-white transition-colors">
                            <td className="p-3 font-mono font-bold text-slate-400">{svc.ID}</td>
                            <td className="p-3">
                              <span className="font-bold text-slate-700 block">{svc.Category}</span>
                              <span className="text-[10px] text-slate-400 block">{svc.SubCategory}</span>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{svc.ServiceName}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-600">₹{svc.GovtFee}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-600">₹{svc.ServiceCharge}</td>
                            <td className="p-3 font-mono text-[10px] text-indigo-500 max-w-[150px] truncate" title={docsParsed.join(", ")}>
                              {docsParsed.join(", ")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over / Centered Overlaid Form Edit Modal */}
      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative scrollbar-thin max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4 mb-6">
                <div>
                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/45 text-rose-600 dark:text-rose-400 px-3 py-1 rounded font-black uppercase">
                    {editingService ? "Edit Service Mode" : "Generate Dynamic Scheme"}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5 matches">
                    {editingService ? `Modify scheme ${formId}` : "Create Custom Administrative Schema"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 cursor-pointer"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Service ID (Unique identifier) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Service Scheme ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., SVC-0099"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      disabled={!!editingService}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Service Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Scheme Category / Group <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white"
                    >
                      <option value="Online Application">Online Application</option>
                      <option value="Government Schemes">Government Schemes</option>
                      <option value="Digital Gujarat">Digital Gujarat</option>
                      <option value="eSamaj Kalyan">eSamaj Kalyan</option>
                      <option value="Revenue Services">Revenue Services</option>
                      <option value="PAN / Voter Services">PAN / Voter Services</option>
                    </select>
                  </div>

                  {/* Title (ServiceName) */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Service Title / Scheme Name (Gujarati / English) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., આવકનો દાખલો (Income Certificate)"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Detailed Description */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Detailed Description (Rich text / Markdown supported)
                      </label>
                      <span className="text-[9px] font-mono text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 rounded">
                        Markdown enabled
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      placeholder="Specify scheme eligibility details, criteria, instructions, terms using standard markdown tags."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white font-mono"
                    />
                  </div>

                  {/* SubCategory */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                      Sub-Category / Portal Sponsor
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., IORA"
                      value={formSubCategory}
                      onChange={(e) => setFormSubCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Turnaround Time */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                      Estimated Turnaround Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 3-5 Days"
                      value={formTurnaround}
                      onChange={(e) => setFormTurnaround(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Linked Document checklist info */}
                  <div className="sm:col-span-2 space-y-2 border-t border-slate-200/80 dark:border-slate-800/80 pt-4 mt-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Required Documents Checklist Linkage (Global Master IDs)
                    </label>
                    <p className="text-[10px] text-slate-400 mb-2">
                      Check each individual document type that is strictly required for this application:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto bg-slate-50 p-4 border rounded-xl scrollbar-thin">
                      {masterDocs.map((doc, idx) => {
                        const isChecked = formRequiredDocIDs.includes(doc.ID);
                        return (
                          <div
                            key={`${doc.ID}-${idx}`}
                            onClick={() => handleToggleRequiredDocID(doc.ID)}
                            className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-201 hover:border-rose-400 transition-colors cursor-pointer select-none"
                          >
                            <span className="text-rose-500 mt-0.5">
                              {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                            </span>
                            <div className="leading-none">
                              <span className="text-[11px] font-bold text-slate-700 block">{doc.Name}</span>
                              <span className="text-[9px] font-mono text-slate-400 block mt-0.5">{doc.ID}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Official PDF URL Link */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Official Guideline PDF / Scheme Notification URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g., https://example.com/notification-gr.pdf"
                      value={formOfficialPdfUrl}
                      onChange={(e) => setFormOfficialPdfUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Scheme Fee Details - Math Calculation */}
                  <div className="sm:col-span-2 bg-slate-50/70 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs">
                    <h4 className="text-[10px] uppercase font-black text-slate-600 dark:text-slate-400 tracking-wider mb-3.5 flex items-center gap-1.5">
                      <DollarSign size={13} className="text-rose-500" /> Professional Service Charge Audit Breakdown
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-450 block">સરકારી પોર્ટલ ફી (Portal Fee ₹)</span>
                        <input
                          type="number"
                          min={0}
                          value={formGovtFee}
                          onChange={(e) => setFormGovtFee(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 px-3 py-2 rounded-xl focus:outline-rose-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-450 block">એજન્સી ચાર્જ (Agency Charge ₹)</span>
                        <input
                          type="number"
                          min={0}
                          value={formServiceCharge}
                          onChange={(e) => setFormServiceCharge(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 px-3 py-2 rounded-xl focus:outline-rose-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-450 block">કુલ કુરિયર addon (Courier Surcharge ₹)</span>
                        <input
                          type="number"
                          min={0}
                          value={formCourierCharge}
                          onChange={(e) => setFormCourierCharge(Number(e.target.value))}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 px-3 py-2 rounded-xl focus:outline-rose-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-between font-black text-slate-900 dark:text-white">
                      <span>સરવાળો ચૂકવવાપત્ર રકમ (Total User Price):</span>
                      <span className="font-mono text-sm bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 px-3.5 py-1.5 rounded-xl border border-rose-100 dark:border-rose-900/10">
                        ₹{Number(formGovtFee) + Number(formServiceCharge) + Number(formCourierCharge)}
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">
                      Publish Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white"
                    >
                      <option value="Active">Active / Visible on Storefront</option>
                      <option value="Inactive">Inactive / Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-150 dark:border-slate-800 pt-5 mt-8 flex justify-end gap-3 select-none">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-600/15 cursor-pointer active:scale-[0.98]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {false && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-md bg-slate-950/70 text-left font-sans">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-650 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <ShieldAlert size={24} />
                </div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">Strict Double Check</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Are you absolutely sure you want to remove government service scheme <strong className="font-bold text-slate-800 dark:text-slate-200">"{deleteConfirmId}"</strong>? This will permanently erase records from standard administrative synced views.
                </p>
              </div>

              <div className="flex gap-2.5 mt-6 select-none">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-650 rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer"
                >
                  No, Keep it
                </button>
                <button
                  onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer shadow-md shadow-red-650/10"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
