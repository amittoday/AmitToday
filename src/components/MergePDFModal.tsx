import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, ArrowUp, ArrowDown, Download, AlertCircle, CheckCircle, Loader2, GripVertical, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { PDFDocument } from 'pdf-lib';
import jsPDF from 'jspdf';

interface PDFItem {
  ID: string;
  orderId?: string;
  FileName: string;
  Category?: string;
  FileLink?: string;
  file?: string;
  Timestamp?: string;
  Status?: string;
  status?: string;
}

export interface MergePDFModalProps {
  isOpen?: boolean;
  selectedDocIds?: string[];
  allDocs?: PDFItem[];
  availableDocuments?: any[];
  onClose: () => void;
  onSuccess?: () => void;
  user?: {
    token?: string;
    email?: string;
  };
}

export function MergePDFModal({
  isOpen = true,
  selectedDocIds = [],
  allDocs = [],
  availableDocuments = [],
  onClose,
  onSuccess = () => {},
  user = { token: "", email: "" },
}: MergePDFModalProps) {
  if (!isOpen) return null;

  // Normalize available documents
  const normalizedDocs: PDFItem[] = React.useMemo(() => {
    const combined: PDFItem[] = [...allDocs];
    if (availableDocuments && availableDocuments.length > 0) {
      availableDocuments.forEach((doc) => {
        if (!combined.some((c) => c.ID === doc.ID)) {
          combined.push({
            ID: doc.ID,
            FileName: doc.Name || doc.FileName || doc.ID,
            Category: (doc.Tags && doc.Tags[0]) || doc.Category || "Vault Document",
            FileLink: doc.FileLink || doc.file || "",
            Timestamp: doc.UploadDate || doc.Timestamp || new Date().toISOString(),
          });
        }
      });
    }
    return combined;
  }, [allDocs, availableDocuments]);

  const [itemsToMerge, setItemsToMerge] = useState<PDFItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedDocIds);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [mergeStatus, setMergeStatus] = useState('');
  const [mergedFileName, setMergedFileName] = useState('AOS_Merged_Vault_Document');
  const [mergeEngine, setMergeEngine] = useState<'pdf-lib' | 'jspdf'>('jspdf');

  // Drag and Drop reordering states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingOverId, setIsDraggingOverId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setIsDraggingOverId(itemsToMerge[index].ID);
  };

  const handleDragLeave = () => {
    setIsDraggingOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setIsDraggingOverId(null);
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newList = [...itemsToMerge];
    const [movedItem] = newList.splice(draggedIndex, 1);
    newList.splice(targetIndex, 0, movedItem);
    setItemsToMerge(newList);
    setDraggedIndex(null);
    toast.success("Document sequence re-ordered!");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setIsDraggingOverId(null);
  };

  // Populate files when selected doc ids change or available documents change
  useEffect(() => {
    if (selectedDocIds && selectedDocIds.length > 0) {
      const list = normalizedDocs.filter(d => selectedDocIds.includes(d.ID));
      setItemsToMerge(list.length > 0 ? list : normalizedDocs.slice(0, 4));
    } else if (normalizedDocs.length > 0) {
      // Default to first 2-4 docs if none selected
      setItemsToMerge(normalizedDocs.slice(0, Math.min(normalizedDocs.length, 3)));
    }
  }, [selectedDocIds, normalizedDocs]);

  // Re-ordering helper handlers
  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === itemsToMerge.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newList = [...itemsToMerge];
    const [movedItem] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, movedItem);
    setItemsToMerge(newList);
  };

  const removeItem = (id: string) => {
    if (itemsToMerge.length <= 2) {
      toast.error("Merging requires at least 2 documents.");
      return;
    }
    setItemsToMerge(prev => prev.filter(item => item.ID !== id));
  };

  const handleAssembleMerge = async () => {
    setIsMerging(true);
    setMergeProgress(10);
    setMergeStatus('Initializing Assembly Engine...');

    try {
      const mergedPdf = await PDFDocument.create();
      let stepIncrement = Math.floor(70 / itemsToMerge.length);

      for (let idx = 0; idx < itemsToMerge.length; idx++) {
        const item = itemsToMerge[idx];
        const fileUrl = item.FileLink || item.file;
        if (!fileUrl) {
          throw new Error(`File link missing for document: ${item.FileName || item.ID}`);
        }

        setMergeStatus(`Downloading: ${item.FileName || 'Document ' + (idx + 1)}...`);
        setMergeProgress(prev => Math.min(prev + 5, 85));

        // Proxy download to guarantee CORS bypass
        let arrayBuffer: ArrayBuffer;
        try {
          const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(fileUrl)}`;
          const response = await axios.get(proxyUrl, { 
            responseType: 'arraybuffer',
            headers: { Authorization: `Bearer ${user.token}` }
          });
          arrayBuffer = response.data;
        } catch (xhrErr) {
          console.warn("Proxy download failed, fallback to direct download path...", xhrErr);
          const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
          arrayBuffer = response.data;
        }

        setMergeStatus(`Processing Pages for ${item.FileName || 'Document'}...`);
        const subPdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          subPdf,
          subPdf.getPageIndices()
        );

        copiedPages.forEach((page) => mergedPdf.addPage(page));
        setMergeProgress(prev => Math.min(prev + stepIncrement, 88));
      }

      setMergeStatus('Finalizing Assembly and Synthesizing PDF Package...');
      setMergeProgress(92);

      const cleanName = mergedFileName.trim().replace(/[/\\?%*:|"<>\s]/g, '_') || 'Merged_AOS_Document';

      if (mergeEngine === 'jspdf') {
        // Build jsPDF Executive Batch Cover Index + Consolidated File Output
        const docJsPdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        // Dark theme header banner
        docJsPdf.setFillColor(15, 23, 42); // slate-900
        docJsPdf.rect(0, 0, 210, 45, 'F');
        
        docJsPdf.setFont('helvetica', 'bold');
        docJsPdf.setTextColor(255, 255, 255);
        docJsPdf.setFontSize(16);
        docJsPdf.text("AMIT ONLINE SERVICES (AOS)", 15, 18);
        
        docJsPdf.setFontSize(10);
        docJsPdf.setFont('helvetica', 'normal');
        docJsPdf.setTextColor(148, 163, 184);
        docJsPdf.text("CONSOLIDATED BATCH DOCUMENT VAULT PACKAGE (jsPDF Engine)", 15, 26);
        
        docJsPdf.setLineWidth(0.4);
        docJsPdf.setDrawColor(51, 65, 85);
        docJsPdf.line(15, 32, 195, 32);

        // Metadata block
        docJsPdf.setFontSize(9);
        docJsPdf.setTextColor(226, 232, 240);
        docJsPdf.text(`Assembly Date: ${new Date().toLocaleString()}`, 15, 38);
        docJsPdf.text(`Total Documents Merged: ${itemsToMerge.length}`, 120, 38);

        // Document Table Header
        docJsPdf.setFillColor(30, 41, 59);
        docJsPdf.rect(15, 50, 180, 8, 'F');
        docJsPdf.setFontSize(8);
        docJsPdf.setFont('helvetica', 'bold');
        docJsPdf.setTextColor(203, 213, 225);
        docJsPdf.text("NO.", 18, 55.5);
        docJsPdf.text("DOCUMENT NAME / FILENAME", 32, 55.5);
        docJsPdf.text("CATEGORY", 130, 55.5);
        docJsPdf.text("DOCUMENT ID", 168, 55.5);

        let yPos = 64;
        itemsToMerge.forEach((item, index) => {
          docJsPdf.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
          docJsPdf.rect(15, yPos - 5, 180, 8, 'F');
          
          docJsPdf.setFont('helvetica', 'normal');
          docJsPdf.setFontSize(8);
          docJsPdf.setTextColor(30, 41, 59);
          
          docJsPdf.text(`${index + 1}`, 18, yPos + 0.5);
          const fname = item.FileName.length > 42 ? item.FileName.slice(0, 39) + '...' : item.FileName;
          docJsPdf.text(fname, 32, yPos + 0.5);
          docJsPdf.text(item.Category || 'General Vault', 130, yPos + 0.5);
          docJsPdf.text(item.ID.slice(0, 12), 168, yPos + 0.5);
          yPos += 9;
        });

        // Certification footer on cover page
        docJsPdf.setFontSize(8);
        docJsPdf.setTextColor(100, 116, 139);
        docJsPdf.text("This consolidated PDF package was generated via AOS jsPDF Batch Document Engine.", 15, 280);
        docJsPdf.text("Official Digital Authenticated Document Vault Export.", 15, 285);

        // Download cover index + merged PDF
        docJsPdf.save(`${cleanName}_SummaryIndex_${Date.now()}.pdf`);

        // Also save vector merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        saveAs(blob, `${cleanName}_${Date.now()}.pdf`);
      } else {
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        saveAs(blob, `${cleanName}_${Date.now()}.pdf`);
      }

      setMergeProgress(100);
      setMergeStatus('Completed Successfully!');
      toast.success("PDFs successfully merged and downloaded!");
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);

    } catch (err: any) {
      console.error("PDF Merge tool execution failure", err);
      toast.error(err.message || "Failed to assemble and merge PDF files. Ensure selected files are valid uncorrupted PDFs.");
      setIsMerging(false);
      setMergeProgress(0);
      setMergeStatus('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      id="merge-pdf-overlay"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Block */}
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">PDF Assembler & Merger Tool</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Combine and restructure multiple digital documents</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isMerging} 
            className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Assembly Panel Body */}
        {isMerging ? (
          <div className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 size={36} className="text-blue-600 animate-spin" />
            
            <div className="space-y-1.5 w-full max-w-sm">
              <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                {mergeStatus}
              </h4>
              <p className="text-[10px] font-black font-mono text-blue-600">
                {mergeProgress}% Completed
              </p>
            </div>

            {/* Custom Linear Progress Bar bar */}
            <div className="w-full max-w-sm bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-205">
              <div 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${mergeProgress}%` }}
              />
            </div>
            
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
              Merging is processed client-side with server routing bypass to protect document confidentiality.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Output File Name Config & Engine Selection */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest block mb-1">
                  Destination File Name (Merged Output)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={mergedFileName}
                    onChange={(e) => setMergedFileName(e.target.value)}
                    placeholder="Enter merged document name..."
                    className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black font-mono text-slate-400 uppercase">
                    .pdf
                  </span>
                </div>
              </div>

              {/* Batch Merge Synthesis Engine Toggle */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-widest block mb-1.5 flex items-center gap-1">
                  <Layers size={12} className="text-blue-500" />
                  PDF Merge Synthesis Engine
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setMergeEngine('jspdf')}
                    className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                      mergeEngine === 'jspdf'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>jsPDF Batch Engine</span>
                    <span className="text-[8px] font-mono bg-blue-700/60 px-1.5 py-0.5 rounded text-white">Recommended</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMergeEngine('pdf-lib')}
                    className={`py-2 px-3 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                      mergeEngine === 'pdf-lib'
                        ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span>Vector PDF-Lib Engine</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Documents Re-ordering Workspace */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-405 dark:text-slate-400 tracking-widest block">
                Assembly Order (Restructure layout sequence)
              </label>
              
              <div className="max-h-52 overflow-y-auto space-y-2 pr-1" id="file-assembly-workspace">
                {itemsToMerge.map((item, index) => {
                  const isDraggingOver = isDraggingOverId === item.ID;
                  const isItemDragged = draggedIndex === index;

                  return (
                    <div 
                      key={item.ID}
                      draggable={!isMerging}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                        isItemDragged ? "opacity-35 bg-slate-100/50 dark:bg-slate-950/20 scale-[0.98]" : ""
                      } ${
                        isDraggingOver 
                          ? "border-dashed border-blue-500 bg-blue-50/15 dark:bg-blue-950/10 scale-[1.01] shadow-md shadow-blue-500/5" 
                          : "bg-slate-50 dark:bg-slate-950 border-slate-150 dark:border-slate-850/80 hover:border-blue-300/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Drag and drop grip handle */}
                        <GripVertical size={14} className="text-slate-400 dark:text-slate-600 cursor-grab" />
                        <FileText size={16} className="text-red-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate pr-2">
                            {item.FileName || item.ID}
                          </p>
                          <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-1 py-0.5 rounded font-black uppercase tracking-wider block mt-0.5 w-max">
                            {item.Category || 'Personal'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 disabled:opacity-40"
                          title="Move Page Up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === itemsToMerge.length - 1}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-550 disabled:opacity-40"
                          title="Move Page Down"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          onClick={() => removeItem(item.ID)}
                          className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 ml-1.5"
                          title="Exclude from merging"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instruction Warning Tag */}
            <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/40 rounded-xl">
              <AlertCircle size={14} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                Notice: Merging will append pages of the documents in the exact sequence configured above. Be sure the files are readable, uncorrupted, and decrypted PDF streams.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssembleMerge}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-105 active:scale-95 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                id="execute-assembly-btn"
              >
                <Download size={13} /> Assemble & Merge
              </button>
            </div>

          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default MergePDFModal;
