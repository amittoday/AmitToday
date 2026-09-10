import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, FileText, Info, Loader2, AlertTriangle } from "lucide-react";
import axios from "axios";

interface DocumentItem {
  ID: string;
  FileName?: string;
  FileLink?: string;
  file?: string;
  Type?: string;
  Category?: string;
}

interface BulkDownloadConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  items: DocumentItem[];
  user: {
    token: string;
    email: string;
  };
}

export function BulkDownloadConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  user,
}: BulkDownloadConfirmModalProps) {
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);
  const [fileSizes, setFileSizes] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    let active = true;
    const calculateSizes = async () => {
      setLoading(true);
      let total = 0;
      const detectedSizes: Record<string, number> = {};

      try {
        await Promise.all(
          items.map(async (item) => {
            const url = item.FileLink || item.file;
            if (!url) {
              detectedSizes[item.ID] = 200000; // default estimate
              total += 200000;
              return;
            }

            try {
              // Perform a quiet HEAD request via the secure proxy
              const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(url)}`;
              const res = await axios.head(proxyUrl, {
                headers: { Authorization: `Bearer ${user.token}` },
                timeout: 3500 // fast timeout
              });

              const contentLengthHeader = res.headers ? res.headers["content-length"] : undefined;
              const bytes = parseInt(contentLengthHeader ? String(contentLengthHeader) : "0", 10);
              if (bytes > 0) {
                detectedSizes[item.ID] = bytes;
                total += bytes;
              } else {
                detectedSizes[item.ID] = 220000; // estimate (avg PDF size)
                total += 220000;
              }
            } catch (err) {
              // fallback gracefully on network, CORS, or proxy errors
              detectedSizes[item.ID] = 225000;
              total += 225000;
            }
          })
        );

        if (active) {
          setFileSizes(detectedSizes);
          setTotalSize(total);
        }
      } catch (err) {
        if (active) {
          const defaults: Record<string, number> = {};
          items.forEach((it) => {
            defaults[it.ID] = 220000;
          });
          setFileSizes(defaults);
          setTotalSize(items.length * 220000);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    calculateSizes();
    return () => {
      active = false;
    };
  }, [isOpen, items, user.token]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "Estimating...";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-150 dark:border-slate-800 p-8 flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
            id="bulk-download-confirm-dialog"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="text-left">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="text-red-600 animate-bounce" size={18} />
                  Bulk Archive Download Confirmation
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Confirm ZIP compilation parameters & memory payload
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Sizes & Summary */}
            <div className="my-2 bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Total File Package Size
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white leading-tight font-mono">
                  {loading ? (
                    <span className="flex items-center gap-1.5 text-xs font-black uppercase text-blue-600 animate-pulse mt-1">
                      <Loader2 size={13} className="animate-spin" /> Calculating Payload...
                    </span>
                  ) : (
                    formatSize(totalSize)
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  Documents Included
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {items.length} Files
                </span>
              </div>
            </div>

            {/* List of Files */}
            <div className="space-y-2 text-left mb-6">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">
                Source Document manifest
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 dark:border-slate-800/60 p-3 rounded-2xl bg-white dark:bg-slate-900">
                {items.map((item, idx) => {
                  const size = fileSizes[item.ID] || 0;
                  return (
                    <div
                      key={`${item.ID || 'item'}-${idx}`}
                      className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-50/50 dark:bg-slate-950/40 rounded-lg hover:bg-slate-50 border border-transparent dark:border-transparent hover:border-slate-150 transition-all font-medium text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-red-500 shrink-0" />
                        <span className="truncate max-w-[240px] font-bold">
                          {item.FileName || `${item.Type || "Document"}_${item.ID}`}
                        </span>
                      </div>
                      <span className="text-[10px] font-black font-mono text-slate-400 dark:text-slate-500 shrink-0">
                        {size > 0 ? formatSize(size) : "Estimating..."}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Warning Info Box */}
            <div className="flex gap-2.5 p-4 bg-blue-50 dark:bg-blue-950/15 border border-blue-100 dark:border-blue-900/40 rounded-2xl text-left mb-6">
              <Info size={16} className="text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                Memory Warning: Downloading high-density PDF packages requires Client RAM for in-memory JSZip compiling. Ensure your current browser tab behaves normal under high throughput loads.
              </p>
            </div>

            {/* Dialog Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-820 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-350 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Abort Download
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-6 py-3 bg-red-655 hover:bg-red-700 hover:shadow-lg text-white font-black uppercase text-xs tracking-wider rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                id="bulk-download-execute-confirm-btn"
              >
                <Download size={14} /> Begin Archive Download
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
