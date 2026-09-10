import React, { useState, useEffect, useRef } from "react";
import { UploadCloud, X, Zap, Trash2, Eye, Copy, RefreshCw, Layers, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { compressAndResizeImage } from "../utils/imageCompressor";

interface QueueItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  base64Data: string;
  status: "idle" | "reading" | "processing" | "completed" | "failed";
  progress: number;
  extractedText?: string;
  wordCount?: number;
  error?: string;
}

interface BatchOcrSidebarProps {
  user: { token: string };
  lang?: string;
}

export default function BatchOcrSidebar({ user, lang = "gu" }: BatchOcrSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedResult, setSelectedResult] = useState<QueueItem | null>(null);
  
  // Persistent queue loading on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aos_batch_ocr_queue");
      if (saved) {
        // We only persist metadata & extracted text to save localStorage space. 
        // Base64 files can be large, so we clean them up or load safely.
        const parsed: QueueItem[] = JSON.parse(saved);
        setQueue(parsed);
      }
    } catch (e) {
      console.warn("Could not load saved batch OCR queue", e);
    }
  }, []);

  // Save changes to localStorage
  const saveQueue = (updatedQueue: QueueItem[]) => {
    setQueue(updatedQueue);
    try {
      // Clean large raw base64 data of completed/failed files to keep storage light and clean
      const sanitized = updatedQueue.map(item => {
        if (item.status === "completed" || item.status === "failed") {
          return { ...item, base64Data: "" }; // free memory
        }
        return item;
      });
      localStorage.setItem("aos_batch_ocr_queue", JSON.stringify(sanitized));
    } catch (e) {
      console.warn("Could not persist queue updates to localStorage", e);
    }
  };

  // Drag listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Convert File to Base64 with canvas-based resizing/compression
  const processFile = async (file: File): Promise<{ base64: string; compressedFile: File }> => {
    const { compressedFile } = await compressAndResizeImage(file);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Str = (reader.result as string).split(",")[1];
        resolve({ base64: base64Str, compressedFile });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(compressedFile);
    });
  };

  // Handle dropped files
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  // Input file handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await addFilesToQueue(Array.from(e.target.files));
    }
  };

  const addFilesToQueue = async (files: File[]) => {
    const loadingToast = toast.loading("લાયબ્રેરી ફાઇલો કન્વર્ટ થઈ રહી છે...");
    const newItems: QueueItem[] = [];

    for (const file of files) {
      try {
        const { base64, compressedFile } = await processFile(file);
        newItems.push({
          id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: compressedFile.name,
          size: compressedFile.size,
          mimeType: compressedFile.type || "image/jpeg",
          base64Data: base64,
          status: "idle",
          progress: 0,
        });
      } catch (err) {
        toast.error(`ફાઇલ વાંચવામાં ભૂલ: ${file.name}`);
      }
    }

    const nextQueue = [...queue, ...newItems];
    saveQueue(nextQueue);
    toast.dismiss(loadingToast);
    toast.success(`${newItems.length} દસ્તાવેજો કતારમાં ઉમેરાયા (Queued successfully!)`);
  };

  const removeItem = (id: string) => {
    const nextQueue = queue.filter(item => item.id !== id);
    saveQueue(nextQueue);
    if (selectedResult?.id === id) {
      setSelectedResult(null);
    }
  };

  const clearQueue = () => {
    saveQueue([]);
    setSelectedResult(null);
    toast.success("ઓસીઆર બેચ કતાર ખાલી કરવામાં આવી.");
  };

  // Execute Batch OCR Sequence
  const runBatchOCR = async () => {
    const pending = queue.filter(item => item.status === "idle");
    if (pending.length === 0) {
      toast.error("નવી ફાઇલો બાકી નથી! (No idle files waiting to process)");
      return;
    }

    setIsProcessing(true);
    let updatedQueue = [...queue];

    for (const item of pending) {
      // Find exact index in updatedQueue
      const idx = updatedQueue.findIndex(q => q.id === item.id);
      if (idx === -1) continue;

      updatedQueue[idx] = { ...updatedQueue[idx], status: "processing", progress: 30 };
      saveQueue([...updatedQueue]);

      try {
        const response = await axios.post(
          "/api/ai/ocr",
          {
            content: item.base64Data,
            mimeType: item.mimeType,
            fileName: item.name,
            documentLanguage: "Gujarati"
          },
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        if (response.data.success) {
          updatedQueue[idx] = {
            ...updatedQueue[idx],
            status: "completed",
            progress: 100,
            extractedText: response.data.extractedText || response.data.markdownText || "",
            wordCount: response.data.wordCount || 0,
            base64Data: "", // Clean Base64 to save storage
          };
          toast.success(`સફળતાપૂર્વક મેળવ્યું: ${item.name}`);
        } else {
          throw new Error(response.data.error || "Unknown extraction error");
        }
      } catch (err: any) {
        console.error("Queue item extract exception:", err);
        updatedQueue[idx] = {
          ...updatedQueue[idx],
          status: "failed",
          progress: 0,
          error: err.response?.data?.error || err.message || "Failed to scan document",
        };
        toast.error(`તપાસવામાં ભૂલ: ${item.name}`);
      }

      saveQueue([...updatedQueue]);
    }

    setIsProcessing(false);
    toast.success("બેચ સ્કેન પ્રક્રિયા પૂર્ણ થઈ!");
  };

  // Clipboard copy
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("ટેક્સ્ટ ક્લિપબોર્ડ પર કોપી કરાયો!");
  };

  const activeCount = queue.filter(i => i.status === "idle").length;

  return (
    <>
      {/* Floating launcher trigger button (glowing badge styled elegantly) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-xl shadow-amber-500/20 px-5 py-3.5 rounded-full font-black text-xs uppercase tracking-widest cursor-pointer transition-transform hover:scale-105 active:scale-95 border border-white/10"
        >
          <Layers size={14} className="animate-pulse" />
          <span>Batch OCR ({queue.length})</span>
          {activeCount > 0 && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Slide-out Sidebar drawer container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end select-none">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
              <div className="flex items-center gap-2.5 text-left">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Layers size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest">
                    Batch OCR Queue
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    પર્સિસ્ટન્ટ દસ્તાવેજ સ્કેનિંગ અને બલ્ક માઇગ્રેશન (Durable client queue)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              {/* Drag and Drop Container */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all min-h-[140px] flex flex-col justify-center items-center ${
                  dragActive
                    ? "border-amber-500 bg-amber-50/20 dark:bg-amber-950/10"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/45 dark:bg-slate-900/10 hover:border-slate-350"
                }`}
              >
                <input
                  type="file"
                  id="sidebar-ocr-file-input"
                  multiple
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <label htmlFor="sidebar-ocr-file-input" className="cursor-pointer block w-full">
                  <UploadCloud size={32} className="text-slate-400 dark:text-slate-500 mx-auto mb-3 animate-bounce" />
                  <p className="text-xs font-black text-slate-700 dark:text-slate-350">
                    અહીં ફાઇલો ખેંચો (Drag documents here or) <span className="text-amber-500 hover:underline">browse files</span>
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">
                    JPEG, PNG, scanned PDFs up to 5MB
                  </p>
                </label>
              </div>

              {/* Status Queue Dashboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Queue Items ({queue.length})
                  </span>
                  {queue.length > 0 && (
                    <button
                      onClick={clearQueue}
                      disabled={isProcessing}
                      className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest flex items-center gap-1 cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 size={10} />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {queue.length === 0 ? (
                  <div className="p-8 border border-slate-100 dark:border-slate-900 rounded-2xl bg-slate-50/20 dark:bg-slate-950/20 text-center">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      તમારી કતાર ખાલી છે (Queue is empty!)
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium px-4 mt-1">
                      Add paperwork to generate automatic transcriptions with Gemini-3.5-Flash
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col gap-2.5 transition-all hover:bg-slate-100/40 dark:hover:bg-slate-850/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h5 className="text-[11.5px] font-bold text-slate-900 dark:text-white truncate">
                              {item.name}
                            </h5>
                            <span className="text-[9px] font-mono text-slate-450 dark:text-slate-500">
                              {(item.size / 1024).toFixed(1)} KB &bull; {item.mimeType.split("/")[1]?.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Action check/view */}
                            {item.status === "completed" && (
                              <button
                                onClick={() => setSelectedResult(item)}
                                className="p-1.5 bg-emerald-50 text-emerald-650 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-450 rounded-lg transition-colors cursor-pointer"
                                title="View OCR Results"
                              >
                                <Eye size={12} />
                              </button>
                            )}
                            <button
                              disabled={isProcessing}
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                              title="Delete Item"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar & Status Line */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                              {item.status === "idle" && (
                                <>
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                  <span className="text-slate-400">Waiting...</span>
                                </>
                              )}
                              {item.status === "processing" && (
                                <>
                                  <Loader2 size={10} className="animate-spin text-amber-500" />
                                  <span className="text-amber-500 text-animate">Extracting OCR data...</span>
                                </>
                              )}
                              {item.status === "completed" && (
                                <>
                                  <CheckCircle2 size={10} className="text-emerald-500" />
                                  <span className="text-emerald-500">Scan Complete</span>
                                </>
                              )}
                              {item.status === "failed" && (
                                <>
                                  <AlertCircle size={10} className="text-rose-500" />
                                  <span className="text-rose-500">Failed</span>
                                </>
                              )}
                            </span>
                            {item.status === "completed" && (
                              <span className="text-slate-400">{item.wordCount || 0} Words</span>
                            )}
                            {item.status === "processing" && (
                              <span className="text-amber-500">{item.progress}%</span>
                            )}
                          </div>

                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${item.status === "completed" ? 100 : item.status === "failed" ? 0 : item.progress}%` }}
                              className={`h-full transition-all duration-300 ${
                                item.status === "completed" ? "bg-emerald-500" :
                                item.status === "failed" ? "bg-rose-500" :
                                "bg-amber-500"
                              }`}
                            />
                          </div>

                          {item.error && (
                            <p className="text-[9px] text-rose-500 font-bold bg-rose-50/50 p-1.5 rounded-lg">
                              Line Fail: {item.error}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Control Panel */}
            {queue.length > 0 && (
              <div className="p-6 border-t border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/20 text-left flex gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={runBatchOCR}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white disabled:opacity-40 disabled:cursor-not-allowed py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all border border-amber-400/20 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Processing Batch...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={12} className="animate-pulse" />
                      <span>Run Batch OCR ({queue.filter(i => i.status === "idle").length})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OCR Result viewer modal overlay */}
      {selectedResult && (
        <div className="fixed inset-0 z-[60] overflow-hidden flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setSelectedResult(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] z-10 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-150 dark:border-slate-800/80 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                  Extracted Document Text (ઑટોમેટિક સ્કેન ડાટા)
                </span>
                <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white truncate max-w-md">
                  {selectedResult.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedResult(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 text-left">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 p-5 rounded-2xl font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap select-text max-h-[50vh] overflow-y-auto">
                {selectedResult.extractedText || "No text could be extracted."}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-150 dark:border-slate-800/80 flex items-center justify-end gap-3.5 bg-slate-50 dark:bg-slate-900/20">
              <button
                type="button"
                onClick={() => copyToClipboard(selectedResult.extractedText || "")}
                className="flex items-center gap-1.5 bg-white hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-all font-sans"
              >
                <Copy size={12} />
                <span>Copy Text</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedResult(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 px-5  py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer active:scale-95 transition-all font-sans"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
