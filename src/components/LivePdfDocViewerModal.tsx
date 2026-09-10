import React, { useState } from "react";
import { 
  X, Eye, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, 
  FileText, File, Image as ImageIcon, ShieldCheck, Maximize2, Minimize2 
} from "lucide-react";

export interface CustomerUploadedFile {
  name: string;
  url: string;
  type: "pdf" | "image" | "doc" | "sheet" | "drive" | "generic";
  embedUrl: string;
  isCustomerOriginal?: boolean;
  isFinalDeliverable?: boolean;
  categoryLabel?: string;
}

export const isOcrDraft = (name: string = "", url: string = ""): boolean => {
  const combined = `${name} ${url}`.toLowerCase();
  return (
    combined.includes("draft_ocr") ||
    combined.includes("ocr_") ||
    combined.includes("_ocr") ||
    combined.includes("ocr draft") ||
    combined.includes("draft ocr") ||
    combined.includes("extracted_typing") ||
    combined.includes("typing_content") ||
    combined.includes("gemini_processed") ||
    combined.includes("translated_output") ||
    combined.includes("original_source.docx") ||
    combined.includes("original source.docx") ||
    combined.includes("order_summary") ||
    combined.includes("ocr generated") ||
    combined.includes("ocr_draft") ||
    combined.includes("gemini processed")
  );
};

export function extractCustomerUploadedFiles(
  order: any,
  options?: { allowOcrDrafts?: boolean; includeFinalFiles?: boolean }
): CustomerUploadedFile[] {
  if (!order || typeof order !== "object") return [];

  const allowOcr = !!options?.allowOcrDrafts; // STRICT DEFAULT: false! Customer must never see OCR drafts
  const includeFinal = options?.includeFinalFiles !== false; // Allow including final file

  const customerOriginalFiles: CustomerUploadedFile[] = [];
  const ocrDraftFiles: CustomerUploadedFile[] = [];
  const finalDeliverableFiles: CustomerUploadedFile[] = [];
  const seenUrls = new Set<string>();

  const sanitizeEmbedUrl = (rawUrl: string): { embedUrl: string; type: CustomerUploadedFile["type"] } => {
    let url = rawUrl.trim();
    if (!url) return { embedUrl: "", type: "generic" };

    // Google Docs
    if (url.includes("docs.google.com/document/d/")) {
      const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return {
          embedUrl: `https://docs.google.com/document/d/${match[1]}/preview`,
          type: "doc"
        };
      }
    }

    // Google Spreadsheets
    if (url.includes("docs.google.com/spreadsheets/d/")) {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return {
          embedUrl: `https://docs.google.com/spreadsheets/d/${match[1]}/preview`,
          type: "sheet"
        };
      }
    }

    // Google Drive File
    if (url.includes("drive.google.com/file/d/")) {
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return {
          embedUrl: `https://drive.google.com/file/d/${match[1]}/preview`,
          type: "drive"
        };
      }
    }

    // Drive open?id=
    if (url.includes("drive.google.com/open?id=")) {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return {
          embedUrl: `https://drive.google.com/file/d/${idMatch[1]}/preview`,
          type: "drive"
        };
      }
    }

    // PDF files
    if (/\.pdf($|\?)/i.test(url) || url.startsWith("data:application/pdf")) {
      return { embedUrl: url, type: "pdf" };
    }

    // Images
    if (/\.(jpg|jpeg|png|webp|gif|bmp|svg)($|\?)/i.test(url) || url.startsWith("data:image/")) {
      return { embedUrl: url, type: "image" };
    }

    // Fallback for general web documents: Use Google Docs Viewer
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return {
        embedUrl: `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`,
        type: "generic"
      };
    }

    return { embedUrl: url, type: "generic" };
  };

  const addFile = (
    name: string, 
    rawVal: any, 
    forceCategory?: "original" | "ocr" | "final" | "other"
  ) => {
    if (!rawVal) return;
    let url = "";
    let cleanFileName = name;

    if (typeof rawVal === "string") {
      url = rawVal.trim();
    } else if (typeof rawVal === "object") {
      url = String(rawVal.content || rawVal.url || rawVal.dataUrl || rawVal.link || rawVal.fileData || rawVal.src || "").trim();
      if (rawVal.name || rawVal.fileName) {
        cleanFileName = rawVal.name || rawVal.fileName;
      }
    }

    if (!url || url === "N/A" || url === "null" || url === "undefined") return;
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    const { embedUrl, type } = sanitizeEmbedUrl(url);
    const displayName = cleanFileName.replace(/_/g, " ").replace(/([A-Z])/g, " $1").trim() || "Uploaded Document";

    const isOcr = forceCategory === "ocr" ? true : forceCategory === "original" ? false : isOcrDraft(cleanFileName, url);

    if (forceCategory === "final") {
      finalDeliverableFiles.push({
        name: displayName,
        url,
        type,
        embedUrl,
        isCustomerOriginal: false,
        isFinalDeliverable: true,
        categoryLabel: "🎉 ફાઇનલ એડિટેડ ફાઇલ (Final Approved Document / Result)"
      });
      return;
    }

    if (isOcr) {
      if (allowOcr) {
        ocrDraftFiles.push({
          name: displayName,
          url,
          type,
          embedUrl,
          isCustomerOriginal: false,
          categoryLabel: "OCR તૈયાર કરેલ ડ્રાફ્ટ (OCR Generated Draft)"
        });
      }
      return;
    }

    // Valid Customer Original File
    customerOriginalFiles.push({
      name: displayName,
      url,
      type,
      embedUrl,
      isCustomerOriginal: true,
      categoryLabel: "ગ્રાહકે આપેલ મૂળ દસ્તાવેજ (Customer's Original Document)"
    });
  };

  // 1. Direct Customer Original File properties (HIGHEST PRIORITY)
  const customerOriginalDirect = 
    order.CustomerOriginalFile || 
    order.customerOriginalFile || 
    order.OriginalFile || 
    order.originalFile || 
    order.CustomerFile || 
    order.customerFile || 
    order.customer_file || 
    order.original_file || 
    order.sourceFile || 
    order.SourceFile || 
    order.rawFile || 
    order.RawFile || 
    order.CustomerDocument || 
    order.customerDocument || 
    order.CustomerUploadedFile || 
    order.customerUploadedFile || 
    order.CustomerFileLink || 
    order.customerFileLink;

  if (customerOriginalDirect) {
    addFile(
      order.CustomerFileName || order.FileName || order.fileName || "Customer Original Document (ગ્રાહકે આપેલ મૂળ દસ્તાવેજ)", 
      customerOriginalDirect, 
      "original"
    );
  }

  // 2. Client Browser LocalStorage Cache for the order's uploaded original file
  if (typeof window !== "undefined") {
    try {
      const orderIdKey = order.orderId || order.OrderID || order.ID || order.id;
      if (orderIdKey) {
        const cachedRaw = localStorage.getItem(`aos_customer_file_${orderIdKey}`);
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            if (parsed && (parsed.url || parsed.content)) {
              addFile(parsed.name || "Customer Original File", parsed.url || parsed.content, "original");
            }
          } catch {
            if (cachedRaw.startsWith("data:") || cachedRaw.startsWith("http")) {
              addFile("Customer Original File", cachedRaw, "original");
            }
          }
        }
      }
    } catch {}
  }

  // 3. Main Order File / FileLink (Ensure it's NOT an OCR draft before adding as original)
  const directLink = order.file || order.FileLink || order.fileLink || order.DocumentLink || order.documentLink || order.file_link;
  if (directLink) {
    const rawName = (typeof directLink === "object" && (directLink.name || directLink.fileName)) 
      ? (directLink.name || directLink.fileName)
      : (order.FileName || order.fileName || order.name || order.documentName || "Customer Uploaded Document");
    
    // Check if it's OCR draft
    if (!isOcrDraft(rawName, typeof directLink === "string" ? directLink : (directLink.url || directLink.content || ""))) {
      addFile(rawName, directLink, "original");
    } else if (allowOcr) {
      addFile(rawName, directLink, "ocr");
    }
  }

  // 4. Additional Customer Attached Documents
  const additionalDocs = order.additionalDocs || order.additional_docs || order.documents || order.AttachedDocuments || order.attachedDocs;
  if (additionalDocs && Array.isArray(additionalDocs)) {
    additionalDocs.forEach((doc: any, idx: number) => {
      if (doc) {
        addFile(
          doc.name || doc.fileName || `Customer Document #${idx + 1}`, 
          doc.content || doc.url || doc.dataUrl || doc, 
          "original"
        );
      }
    });
  }

  // 5. Extract Customer Links inside Notes (e.g. Google Drive original files)
  const notesStr = String(order.notes || order.Notes || order.remarks || order.Remarks || "");
  if (notesStr) {
    const urlRegex = /(?:([^\n\r\t:]+):\s*)?(https?:\/\/[^\s"'<>]+)/g;
    let match;
    while ((match = urlRegex.exec(notesStr)) !== null) {
      const docLabel = match[1]?.trim() || "Attached Document";
      const matchedUrl = match[2]?.trim();
      if (matchedUrl) {
        const isOcr = isOcrDraft(docLabel, matchedUrl);
        if (
          docLabel.toLowerCase().includes("customer original") || 
          docLabel.toLowerCase().includes("original file") || 
          docLabel.toLowerCase().includes("original document") ||
          docLabel.toLowerCase().includes("customer uploaded") ||
          docLabel.toLowerCase().includes("મૂળ") ||
          docLabel.toLowerCase().includes("ગ્રાહક")
        ) {
          addFile(docLabel, matchedUrl, "original");
        } else if (isOcr) {
          if (allowOcr) {
            addFile(docLabel, matchedUrl, "ocr");
          }
        } else {
          // General non-OCR customer link
          addFile(docLabel, matchedUrl, "original");
        }
      }
    }
  }

  // 6. FilesJSON / DataJSON parsing
  const tryParseJSON = (data: any) => {
    if (!data) return null;
    if (typeof data === "object") return data;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const filesJson = tryParseJSON(order.FilesJSON || order.filesJson || order.files_json);
  if (filesJson) {
    if (Array.isArray(filesJson)) {
      filesJson.forEach((f: any, idx: number) => {
        if (typeof f === "string") {
          addFile(`Customer Document #${idx + 1}`, f);
        } else if (f && typeof f === "object") {
          addFile(f.name || f.fileName || `Customer Document #${idx + 1}`, f.url || f.link || f.content || f.dataUrl);
        }
      });
    } else if (typeof filesJson === "object") {
      Object.entries(filesJson).forEach(([key, val]: [string, any]) => {
        if (typeof val === "string") {
          addFile(key, val);
        } else if (val && typeof val === "object" && (val.url || val.content || val.link)) {
          addFile(val.name || key, val.url || val.content || val.link);
        }
      });
    }
  }

  const dataJson = tryParseJSON(order.DataJSON || order.dataJson || order.data_json);
  if (dataJson) {
    if (dataJson.documents && typeof dataJson.documents === "object") {
      Object.entries(dataJson.documents).forEach(([docName, docData]: [string, any]) => {
        if (typeof docData === "string") {
          addFile(docName, docData);
        } else if (docData && typeof docData === "object" && (docData.url || docData.content || docData.dataUrl)) {
          addFile(docData.name || docName, docData.url || docData.content || docData.dataUrl);
        }
      });
    }
  }

  // 7. Output / Final deliverable link
  const finalLink = order.FinalFileLink || order.finalFileLink || order.finalLink || order.ResultFileLink;
  if (finalLink && includeFinal) {
    addFile(order.FinalFileName || "Final Service Deliverable / Approved Certificate (પરિણામ)", finalLink, "final");
  }

  // 8. Fallback: If no customer original file found yet, check customer Drive FolderLink
  if (customerOriginalFiles.length === 0 && (order.FolderLink || order.folderLink)) {
    const fLink = String(order.FolderLink || order.folderLink).trim();
    if (fLink && !isOcrDraft("", fLink)) {
      addFile("Customer Submission Folder (ગ્રાહક ડ્રાઇવ ફોલ્ડર)", fLink, "original");
    }
  }

  // Combine: Customer Original Files FIRST, then Final Files, NEVER OCR if allowOcr is false!
  const finalFiles: CustomerUploadedFile[] = [
    ...customerOriginalFiles,
    ...finalDeliverableFiles,
    ...(allowOcr ? ocrDraftFiles : [])
  ];

  return finalFiles;
}

interface LivePdfDocViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: CustomerUploadedFile[];
  title?: string;
  orderId?: string | number;
  lang?: string;
}

export function LivePdfDocViewerModal({
  isOpen,
  onClose,
  files,
  title = "ગ્રાહકે અપલોડ કરેલ દસ્તાવેજ / ફાઇલ લાઇવ દર્શક",
  orderId,
  lang = "gu"
}: LivePdfDocViewerModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !files || files.length === 0) return null;

  const currentFile = files[selectedIndex] || files[0];
  const isImg = currentFile.type === "image";
  const isDirectPdf = currentFile.type === "pdf";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left">
      <div 
        className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen 
            ? "w-full h-full rounded-none" 
            : "w-full max-w-5xl h-[90vh] max-h-[900px]"
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${
              currentFile.isFinalDeliverable
                ? "bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/50"
                : currentFile.isCustomerOriginal
                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50"
            }`}>
              {isImg ? <ImageIcon size={20} /> : <FileText size={20} />}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                {currentFile.isFinalDeliverable ? (
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 bg-teal-100/90 dark:bg-teal-950/70 border border-teal-300 dark:border-teal-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>🎉 ફાઇનલ તૈયાર ફાઇલ (Final Approved Document)</span>
                  </span>
                ) : currentFile.isCustomerOriginal ? (
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>⭐ ગ્રાહકે આપેલ મૂળ દસ્તાવેજ (Original Document)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950/70 border border-blue-300 dark:border-blue-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>📁 સબમિટ કરેલ ફાઈલ (Submitted File)</span>
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-full font-bold">
                  {isImg ? "Image Document" : isDirectPdf ? "PDF Document" : "Digital Document"}
                </span>
                {orderId && (
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">
                    #{orderId}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate mt-0.5" title={currentFile.name}>
                {currentFile.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls for Images */}
            {isImg && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 px-1">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(250, zoom + 25))}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer ml-1"
                  title="Rotate 90°"
                >
                  <RotateCw size={16} />
                </button>
              </div>
            )}

            {/* External Open Button */}
            <a
              href={currentFile.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              title="Open in new window / tab"
            >
              <ExternalLink size={14} />
              <span className="hidden md:inline">{lang === "gu" ? "નવી ટેબમાં ખોલો" : "Open Original"}</span>
            </a>

            {/* Download Button */}
            <a
              href={currentFile.url}
              download={currentFile.name}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              title="Download File"
            >
              <Download size={14} />
              <span className="hidden sm:inline">{lang === "gu" ? "ડાઉનલોડ" : "Download"}</span>
            </a>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 rounded-xl transition-all cursor-pointer ml-1"
              title="Close Viewer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Multi-file tabs selector if more than 1 file exists */}
        {files.length > 1 && (
          <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 overflow-x-auto shrink-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
              {lang === "gu" ? "ફાઇલો:" : "Files:"} ({files.length})
            </span>
            {files.map((f, i) => (
              <button
                key={`${f.name}-${i}`}
                onClick={() => {
                  setSelectedIndex(i);
                  setZoom(100);
                  setRotation(0);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedIndex === i
                    ? f.isFinalDeliverable
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-200 dark:shadow-none"
                      : f.isCustomerOriginal
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200 dark:shadow-none"
                      : "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {f.isFinalDeliverable ? <span>🎉</span> : f.isCustomerOriginal ? <span className="text-amber-300">⭐</span> : <File size={13} />}
                <span className="truncate max-w-[200px]">
                  {f.isFinalDeliverable
                    ? `${f.name} [🎉 ફાઇનલ]`
                    : f.isCustomerOriginal 
                    ? `${f.name} [મૂળ ફાઈલ]` 
                    : `${f.name}`}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Live Viewer Canvas Container */}
        <div className="flex-1 bg-slate-900/90 dark:bg-black relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {isImg ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
              <img
                src={currentFile.embedUrl}
                alt={currentFile.name}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800/40 relative">
              <iframe
                src={currentFile.embedUrl}
                title={currentFile.name}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
              />
            </div>
          )}
        </div>

        {/* Footer Info & Verification Badge */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck size={16} className={currentFile.isCustomerOriginal ? "text-emerald-500" : "text-blue-500"} />
            <span>
              {currentFile.isCustomerOriginal
                ? (lang === "gu" 
                    ? "ગ્રાહક દ્વારા ટાઈપિંગ અથવા ભાષાંતર કરવા આપેલ મૂળ દસ્તાવેજ (અધિકૃત સ્કેન/ફાઈલ)" 
                    : "Customer's original source document uploaded for typing/translation")
                : (lang === "gu" 
                    ? "સિસ્ટમ OCR દ્વારા તૈયાર થયેલ ડ્રાફ્ટ દસ્તાવેજ (માત્ર સંદર્ભ માટે)" 
                    : "System generated OCR draft document (for reference)")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {currentFile.type.toUpperCase()} PREVIEW
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
