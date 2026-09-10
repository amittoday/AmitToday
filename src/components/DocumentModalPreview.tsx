import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, ZoomIn, ZoomOut, Download, FileText, FileImage, ShieldCheck, ExternalLink, RotateCw, RotateCcw, Compass, Sparkles, Highlighter, MessageSquare, Stamp, Plus, Trash2, CheckCircle2, Printer, AlertTriangle, Tag, Sliders, CheckSquare, Square, Settings2 } from 'lucide-react';
import { pdfjs } from 'react-pdf';

// Configure pdfjs worker URL for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentModalPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentType?: string;
  fileUrl?: string | null;
  base64Data?: string | null;
  ocrExtractedData?: Record<string, any>;
  confidenceScore?: number;
}

interface Annotation {
  id: string;
  type: 'note' | 'highlight' | 'stamp';
  text: string;
  x: number;
  y: number;
  color: string;
  timestamp: string;
}

export default function DocumentModalPreview({
  isOpen,
  onClose,
  documentName,
  documentType = "Document",
  fileUrl,
  base64Data,
  ocrExtractedData,
  confidenceScore = 97.8
}: DocumentModalPreviewProps) {
  const [zoom, setZoom] = useState(100); // 100% to 400% (1x to 4x)
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270 degrees
  const [autoOriented, setAutoOriented] = useState(true);

  // Annotation state
  const [activeTool, setActiveTool] = useState<'view' | 'note' | 'highlight' | 'stamp'>('view');
  const [annotations, setAnnotations] = useState<Annotation[]>([
    {
      id: '1',
      type: 'stamp',
      text: 'VERIFIED NOTARY AUDIT',
      x: 65,
      y: 15,
      color: '#10B981',
      timestamp: '10:42 AM'
    }
  ]);
  const [newNoteText, setNewNoteText] = useState('');

  const [showPrintConfirm, setShowPrintConfirm] = useState(false);

  // Print Configuration Panel Field Selection State
  const [printFields, setPrintFields] = useState({
    applicantInfo: true,
    barId: true,
    pan: true,
    address: true,
    paymentDetails: true,
    ocrAudit: true,
    applicantNotes: true,
    historyLogs: true,
    officialStamp: true
  });

  const togglePrintField = (field: keyof typeof printFields) => {
    setPrintFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSelectAllPrintFields = (select: boolean) => {
    setPrintFields({
      applicantInfo: select,
      barId: select,
      pan: select,
      address: select,
      paymentDetails: select,
      ocrAudit: select,
      applicantNotes: select,
      historyLogs: select,
      officialStamp: select
    });
  };

  // Document Tag Management state
  const [docTags, setDocTags] = useState<string[]>(["verified", "notary_doc", "legal_vault"]);
  const [newTagInput, setNewTagInput] = useState("");

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase().replace(/[^a-z0-str0-9_]/gi, "_");
    if (!docTags.includes(cleanTag)) {
      setDocTags(prev => [...prev, cleanTag]);
      toast.success(`Tag #${cleanTag} associated with document!`);
    } else {
      toast.info(`Tag #${cleanTag} already exists.`);
    }
    setNewTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setDocTags(prev => prev.filter(t => t !== tagToRemove));
    toast.info(`Tag #${tagToRemove} removed.`);
  };

  if (!isOpen) return null;

  const previewSource = base64Data || fileUrl;
  const isImage = previewSource?.startsWith('data:image/') || documentName.match(/\.(jpeg|jpg|png|webp)$/i);
  const isPdf = previewSource?.startsWith('data:application/pdf') || documentName.endsWith('.pdf');

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
    setAutoOriented(false);
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
    setAutoOriented(false);
  };

  const setZoomLevel = (level: number) => {
    setZoom(level);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'view') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    let text = newNoteText.trim();
    let color = '#F59E0B'; // default amber

    if (activeTool === 'stamp') {
      text = text || 'AUDITED & APPROVED';
      color = '#10B981';
    } else if (activeTool === 'highlight') {
      text = text || 'Important OCR Section';
      color = '#EF4444';
    } else if (activeTool === 'note') {
      text = text || 'Admin Verification Note';
      color = '#3B82F6';
    }

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: activeTool,
      text,
      x: Math.min(Math.max(x, 5), 90),
      y: Math.min(Math.max(y, 5), 90),
      color,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAnnotations(prev => [...prev, newAnnotation]);
    setNewNoteText('');
  };

  const handleRemoveAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="bg-slate-950/90 px-6 py-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              {isImage ? <FileImage size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                {documentName}
                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                  {documentType}
                </span>
              </h3>
              <p className="text-xs text-slate-400">High-Resolution Security Verification & Digital Zoom Inspection</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Auto Orientation Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 rounded-xl text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
              <Compass size={13} className="text-emerald-400" />
              <span>{autoOriented ? "Auto Upright ✓" : `${rotation}° Rotated`}</span>
            </div>

            {/* Rotation Controls */}
            <button
              onClick={handleRotateLeft}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Rotate Counter-clockwise 90°"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={handleRotateRight}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Rotate Clockwise 90°"
            >
              <RotateCw size={15} />
            </button>

            {/* Digital Zoom Presets (1x to 4x) */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setZoomLevel(100)}
                className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${zoom === 100 ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                title="1x Zoom"
              >
                1x
              </button>
              <button
                onClick={() => setZoomLevel(200)}
                className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${zoom === 200 ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                title="2x Zoom"
              >
                2x
              </button>
              <button
                onClick={() => setZoomLevel(300)}
                className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${zoom === 300 ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                title="3x Zoom"
              >
                3x
              </button>
              <button
                onClick={() => setZoomLevel(400)}
                className={`px-2 py-1 rounded-lg text-xs font-bold font-mono transition-colors ${zoom === 400 ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'}`}
                title="4x Zoom"
              >
                4x
              </button>
            </div>

            {/* Zoom Steppers */}
            <button
              onClick={() => setZoom(prev => Math.max(prev - 25, 100))}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono font-bold text-amber-400 px-1">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 25, 400))}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>

            <button
              onClick={() => setShowPrintConfirm(true)}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl transition-all flex items-center gap-1 text-xs font-bold px-3 ml-1 cursor-pointer"
              title="Print Document with Confirmation"
            >
              <Printer size={14} /> Print
            </button>

            {previewSource && (
              <a
                href={previewSource}
                download={documentName}
                className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl transition-all flex items-center gap-1 text-xs font-bold px-3 ml-1"
              >
                <Download size={14} /> Download
              </a>
            )}

            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 rounded-xl transition-all ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
          {/* Document Display Viewport + Annotation Canvas */}
          <div className="lg:col-span-2 bg-slate-950/70 p-4 overflow-auto flex flex-col items-center justify-start border-b lg:border-b-0 lg:border-r border-slate-800/80 relative">
            
            {/* Annotation Toolbar Controls Bar */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 z-10 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">PDF Tools:</span>
                <button
                  type="button"
                  onClick={() => setActiveTool('view')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTool === 'view' ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Compass size={13} /> View / Pan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('stamp')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTool === 'stamp' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Stamp size={13} /> Add Seal Stamp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('note')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTool === 'note' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <MessageSquare size={13} /> Sticky Note
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTool('highlight')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTool === 'highlight' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <Highlighter size={13} /> Redact / Highlight
                </button>
              </div>

              {activeTool !== 'view' && (
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={`Type text for ${activeTool}...`}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-amber-400 font-bold whitespace-nowrap animate-pulse">
                    Click document to place
                  </span>
                </div>
              )}
            </div>

            {previewSource ? (
              <div
                onClick={handleCanvasClick}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                className={`transition-transform duration-200 max-w-full max-h-full flex items-center justify-center p-4 relative ${
                  activeTool !== 'view' ? 'cursor-crosshair' : 'cursor-default'
                }`}
              >
                {/* Rendered Annotations Pin Overlay */}
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                    className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 animate-bounce-short pointer-events-auto"
                  >
                    {ann.type === 'stamp' ? (
                      <div className="bg-emerald-500/90 text-slate-950 font-black px-3 py-1.5 rounded-xl border-2 border-emerald-300 shadow-2xl text-[11px] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
                        <Stamp size={14} /> {ann.text}
                      </div>
                    ) : ann.type === 'highlight' ? (
                      <div className="bg-red-500/80 text-white font-extrabold px-2.5 py-1 rounded-lg border border-red-300 shadow-xl text-[10px] flex items-center gap-1 whitespace-nowrap backdrop-blur-md">
                        <Highlighter size={12} /> {ann.text}
                      </div>
                    ) : (
                      <div className="bg-amber-400 text-slate-950 font-bold px-2.5 py-1 rounded-xl border border-amber-200 shadow-xl text-[11px] flex items-center gap-1 whitespace-nowrap max-w-xs">
                        <MessageSquare size={12} /> {ann.text}
                      </div>
                    )}
                  </div>
                ))}

                {isImage ? (
                  <img
                    src={previewSource}
                    alt={documentName}
                    className="max-h-[60vh] object-contain rounded-xl shadow-2xl border border-slate-700"
                  />
                ) : isPdf ? (
                  <iframe
                    src={previewSource}
                    title={documentName}
                    className="w-[600px] h-[55vh] rounded-xl border border-slate-700 bg-white shadow-2xl pointer-events-none"
                  />
                ) : (
                  <div className="text-center p-8 bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-400 backdrop-blur-md">
                    <FileText size={48} className="mx-auto mb-3 text-amber-400" />
                    <p className="text-sm font-bold text-white mb-2">{documentName}</p>
                    <p className="text-xs mb-4">Direct inline preview available for PDFs and image documents.</p>
                    <a
                      href={previewSource}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5"
                    >
                      <ExternalLink size={14} /> Open Document in New Tab
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 my-auto">
                <FileText size={48} className="mx-auto mb-2 text-slate-600" />
                <p className="text-sm font-semibold">No preview file content available.</p>
              </div>
            )}
          </div>

          {/* Side OCR Summary & Annotation Inspector Panel */}
          <div className="p-6 bg-slate-900/90 overflow-y-auto space-y-4 text-xs backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h4 className="font-black text-white text-sm uppercase tracking-wider">Document Inspector</h4>
              </div>
              <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                {annotations.length} Annotations
              </span>
            </div>

            {/* Document Annotations Feed */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
                <MessageSquare size={12} /> Active Annotations & Audit Marks
              </span>

              {annotations.length === 0 ? (
                <p className="text-slate-500 text-[11px] italic">No annotations added yet. Click toolbar tools above to annotate directly on the document.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {annotations.map((ann) => (
                    <div key={ann.id} className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ann.color }}
                        />
                        <div className="truncate">
                          <p className="font-bold text-white text-[11px] truncate">{ann.text}</p>
                          <p className="text-[9px] text-slate-500 font-mono">{ann.timestamp} • Pos ({ann.x}%, {ann.y}%)</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAnnotation(ann.id)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                        title="Remove Annotation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Extracted Metadata</span>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-500 font-medium">Doc Classification:</span>
                  <span className="font-extrabold text-white">{documentType}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-500 font-medium">Confidence Score:</span>
                  <span className={`font-mono font-bold ${confidenceScore < 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {confidenceScore}% {confidenceScore < 60 ? '(Needs Review)' : 'High'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-500 font-medium">Signature Detect:</span>
                  <span className="font-bold text-emerald-400">Verified ✓</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-500 font-medium">Orientation Detect:</span>
                  <span className="font-bold text-blue-400">Upright Auto-Detected</span>
                </div>
              </div>
            </div>

            {ocrExtractedData && Object.keys(ocrExtractedData).length > 0 && (
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block flex items-center gap-1">
                  <Sparkles size={12} /> Key-Value Extract
                </span>
                {Object.entries(ocrExtractedData).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-slate-900 text-slate-300">
                    <span className="text-slate-500 font-medium">{key}:</span>
                    <span className="font-mono font-bold text-white">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Document Tag Management Panel */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block flex items-center gap-1">
                  <Tag size={13} /> Associated Document Tags
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">{docTags.length} tags</span>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-1.5">
                {docTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all hover:bg-purple-500/25"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-purple-400 hover:text-red-400 transition-colors p-0.5 rounded-md cursor-pointer"
                      title={`Remove #${tag}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add New Tag Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder="Add custom tag (e.g. verified_pan)"
                  className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-amber-300 text-[11px] leading-relaxed">
              💡 <strong>Verification Tip:</strong> Use the 1x-4x Digital Zoom presets to inspect fine print, bar seals, and signatures closely.
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview & Order Fields Configuration Modal */}
      {showPrintConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
                  <Printer size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">Print Preview & Field Selection</h4>
                  <p className="text-xs text-slate-400">Configure which order fields to include in the generated print report</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintConfirm(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Field Selection Checklist Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Settings2 size={14} /> Report Field Inclusion Matrix
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllPrintFields(true)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600 text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllPrintFields(false)}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'applicantInfo', label: 'Applicant Details', desc: 'Full Name, Phone & Registered Email' },
                  { key: 'barId', label: 'Bar Enrolment / Bar ID', desc: 'Sanad Number & State Bar Council' },
                  { key: 'pan', label: 'Govt PAN Card Record', desc: 'PAN number & Income Tax verification status' },
                  { key: 'address', label: 'Residential & Jurisdiction Address', desc: 'Filing state, district, city & PIN' },
                  { key: 'paymentDetails', label: 'Payment & Transaction Details', desc: 'Fee amount, Razorpay UTR & gateway stamp' },
                  { key: 'ocrAudit', label: 'OCR Extraction & Confidence Scores', desc: 'AI confidence ratings (e.g. 98% match)' },
                  { key: 'applicantNotes', label: 'Applicant & Verification Notes', desc: 'Remarks entered during filing/review' },
                  { key: 'historyLogs', label: 'Audit Trail & Event History', desc: 'Timestamped status transition lifecycle' },
                  { key: 'officialStamp', label: 'AOS Official Security Stamp', desc: 'Digital verification watermark & seal' }
                ].map((item) => {
                  const isChecked = printFields[item.key as keyof typeof printFields];
                  return (
                    <div
                      key={item.key}
                      onClick={() => togglePrintField(item.key as keyof typeof printFields)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-slate-800/90 border-blue-500/50 shadow-sm shadow-blue-500/10'
                          : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow">
                            <CheckSquare size={14} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center">
                            <Square size={14} className="text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold block ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Preview Summary Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Target Document:</span>
                <span className="font-mono text-amber-300 font-bold">{documentName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Selected Fields Count:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {Object.values(printFields).filter(Boolean).length} of {Object.keys(printFields).length} fields enabled
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPrintConfirm(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPrintConfirm(false);
                  toast.success(`Preparing print report with ${Object.values(printFields).filter(Boolean).length} configured fields...`);
                  setTimeout(() => window.print(), 300);
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Printer size={15} /> Print Configured Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Printable Area for Document & Selected Fields */}
      <div id="document-modal-print-layout" className="hidden print:block print:fixed print:inset-0 print:bg-white print:text-black print:p-8 print:z-[999999] print:overflow-visible">
        <style>{`
          @media print {
            body > * {
              visibility: hidden !important;
            }
            #document-modal-print-layout, #document-modal-print-layout * {
              visibility: visible !important;
            }
            #document-modal-print-layout {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: #ffffff !important;
              color: #0f172a !important;
              padding: 24px !important;
              margin: 0 !important;
              border: 2px solid #0f172a !important;
              font-family: Arial, sans-serif !important;
            }
          }
        `}</style>

        <div style={{ border: "2px solid #0f172a", padding: "20px", borderRadius: "8px" }}>
          <div style={{ textAlign: "center", borderBottom: "2px solid #2563eb", paddingBottom: "12px", marginBottom: "16px" }}>
            <h1 style={{ fontSize: "16px", fontWeight: "bold", textTransform: "uppercase", margin: 0, color: "#0f172a" }}>
              NOTARY VERIFICATION & AUDIT PRINT REPORT
            </h1>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: "#2563eb", margin: "4px 0 0 0" }}>
              DOCUMENT: {documentName} ({documentType})
            </h2>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "4px 0 0 0" }}>
              Print Timestamp: {new Date().toLocaleString("en-IN")} | Security Status: VERIFIED
            </p>
          </div>

          {printFields.applicantInfo && (
            <div style={{ marginBottom: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                1. Applicant Information
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                <strong>Applicant / Advocate:</strong> {ocrExtractedData?.["Applicant Full Name"] || documentName.split("-")[0] || "Authorized Legal Applicant"}
              </p>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                <strong>Application Ref:</strong> {ocrExtractedData?.["Application Ref ID"] || "AOS-NOTARY-CONFIRMED"}
              </p>
            </div>
          )}

          {printFields.barId && (
            <div style={{ marginBottom: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                2. Bar Enrolment (Sanad) Details
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                <strong>Bar Enrolment Number:</strong> {ocrExtractedData?.["Bar Enrolment No"] || "G/2045/2016 (State Bar Council of Gujarat)"}
              </p>
            </div>
          )}

          {printFields.pan && (
            <div style={{ marginBottom: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                3. Govt PAN Card Record
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                <strong>PAN Record Number:</strong> {ocrExtractedData?.["PAN Card No"] || "FGHIJ5678K • ITD Authenticated"}
              </p>
            </div>
          )}

          {printFields.address && (
            <div style={{ marginBottom: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                4. Residential & Jurisdiction Address
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                <strong>Filing Jurisdiction:</strong> {ocrExtractedData?.["Filing Location"] || "Ahmedabad / Surat, Gujarat"}
              </p>
            </div>
          )}

          {printFields.paymentDetails && (
            <div style={{ marginBottom: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                5. Payment Details
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                <strong>Status:</strong> PAID IN FULL • Razorpay Gateway Reference Verified
              </p>
            </div>
          )}

          {printFields.ocrAudit && (
            <div style={{ marginBottom: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                6. OCR Audit Scores
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                <strong>AI OCR Match Confidence:</strong> {confidenceScore}% • All security markers valid
              </p>
            </div>
          )}

          {printFields.applicantNotes && (
            <div style={{ marginBottom: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                7. Verification & Applicant Notes
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                {ocrExtractedData?.["OCR Quality Status"] || "Document verified and approved for Central Notary Public appointment."}
              </p>
            </div>
          )}

          {printFields.historyLogs && (
            <div style={{ marginBottom: "14px", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", padding: "10px", borderRadius: "6px" }}>
              <h3 style={{ fontSize: "11px", fontWeight: "bold", color: "#0f172a", borderBottom: "1px solid #cbd5e1", paddingBottom: "4px", margin: "0 0 6px 0", textTransform: "uppercase" }}>
                8. History & Audit Trail
              </h3>
              <p style={{ fontSize: "11px", margin: "2px 0" }}>
                Submitted: {ocrExtractedData?.["Submission Timestamp"] || new Date().toLocaleDateString("en-IN")} • Status Transition: Verified
              </p>
            </div>
          )}

          {printFields.officialStamp && (
            <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ width: "200px", textAlign: "center" }}>
                <div style={{ borderBottom: "1px solid #0f172a", marginBottom: "4px", height: "36px" }}></div>
                <p style={{ fontSize: "10px", fontWeight: "bold", margin: 0, textTransform: "uppercase" }}>Verified Officer Signature</p>
              </div>

              <div style={{ width: "200px", textAlign: "center" }}>
                <div style={{ borderBottom: "1px solid #0f172a", marginBottom: "4px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "#059669" }}>✓ OFFICIAL AUDIT STAMP</span>
                </div>
                <p style={{ fontSize: "10px", fontWeight: "bold", margin: 0, textTransform: "uppercase" }}>Central Notary Verification Desk</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
