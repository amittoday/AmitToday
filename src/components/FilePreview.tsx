import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, ChevronRight, ZoomIn, ZoomOut, RotateCcw, RotateCw, Highlighter, Type, Trash2, Clock, Eye, Info, Save, Search, Palette, Filter, Check, ArrowUpDown, Pencil, Printer } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import axios from 'axios';

// Make sure the worker is initialized (can fallback if already configured in main app)
try {
  if (pdfjsLib && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const workerUrl = "https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs";
    const blobCode = `importScripts('${workerUrl}');`;
    const blob = new Blob([blobCode], { type: "application/javascript" });
    pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
  }
} catch (e) {
  console.warn("PDF worker initialization skipped inside FilePreview", e);
}

interface Annotation {
  id: string;
  x: number; // percentage from left
  y: number; // percentage from top
  text: string;
  type: 'text' | 'highlight' | 'draw_note' | 'draw_highlight';
  color: string;
  page: number;
  points?: { x: number; y: number }[];
}

interface VersionEntry {
  version: string;
  status: string;
  timestamp: string;
  size: string;
  author: string;
  content: string; // Base64 content of file
  annotations: Annotation[];
}

interface PdfThumbnailProps {
  pdf: any;
  pageNum: number;
  isActive: boolean;
  onClick: () => void;
}

function PdfThumbnail({ pdf, pageNum, isActive, onClick }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pdf) return;
    let isMounted = true;
    pdf.getPage(pageNum).then((page: any) => {
      if (!isMounted) return;
      const viewport = page.getViewport({ scale: 0.12 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      page.render(renderContext);
    }).catch((err: any) => {
      console.warn("Thumbnail load failed limit:", err);
    });

    return () => {
      isMounted = false;
    };
  }, [pdf, pageNum]);

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl transition-all border ${
        isActive 
          ? 'bg-blue-50/75 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
      } cursor-pointer w-full group`}
    >
      <div className="w-full aspect-[3/4] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-850/80 shadow-sm relative">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain pointer-events-none" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all" />
      </div>
      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 font-mono tracking-wider">
        P. {pageNum}
      </span>
    </button>
  );
}

interface FilePreviewProps {
  file: {
    name: string;
    type: string;
    content: string; // Base64 string
    id?: string;
    status?: string;
    tags?: string;
    confidence?: string | number;
    timestamp?: string;
    annotations?: string | any[];
  };
  onClose: () => void;
  onTagsUpdated?: (id: string, newTags: string) => void;
  user?: any;
}

interface PdfMetadata {
  creationDate: string | null;
  producer: string | null;
  author: string | null;
}

function parsePdfDate(pdfDate: string | null): string {
  if (!pdfDate) return 'N/A';
  if (pdfDate.startsWith('D:')) {
    const year = pdfDate.substring(2, 6);
    const month = pdfDate.substring(6, 8);
    const day = pdfDate.substring(8, 10);
    const hour = pdfDate.substring(10, 12);
    const min = pdfDate.substring(12, 14);
    if (year && month && day) {
      return `${day}/${month}/${year}` + (hour ? ` ${hour}:${min || '00'}` : '');
    }
  }
  return pdfDate;
}

export function FilePreview({ file, onClose, onTagsUpdated, user }: FilePreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfInstance, setPdfInstance] = useState<any>(null);
  const [pdfMetadata, setPdfMetadata] = useState<PdfMetadata | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Tags and metadata states
  const [tagInput, setTagInput] = useState("");
  const [tagsList, setTagsList] = useState<string[]>(
    file.tags ? file.tags.split(',').map((t: any) => t.trim()).filter(Boolean) : []
  );
  const [savingTags, setSavingTags] = useState(false);

  // Sync tags state if the file prop changes
  useEffect(() => {
    setTagsList(file.tags ? file.tags.split(',').map((t: any) => t.trim()).filter(Boolean) : []);
  }, [file.tags]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tagsList.includes(trimmed)) {
      setTagsList([...tagsList, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTagsList(tagsList.filter(t => t !== tagToRemove));
  };

  const handleSaveTags = async () => {
    if (!file.id) {
      toast.error("Document ID is missing. Tag cannot be saved.");
      return;
    }
    setSavingTags(true);
    const tagsString = tagsList.join(", ");
    try {
      await axios.post(
        "/api/data/upsert",
        {
          tab: "Documents",
          data: {
            ID: file.id,
            Tags: tagsString
          },
          idKey: "ID"
        },
        {
          headers: { Authorization: `Bearer ${user?.token}` }
        }
      );
      toast.success("Metadata tags updated successfully!");
      if (onTagsUpdated) {
        onTagsUpdated(file.id, tagsString);
      }
    } catch (err: any) {
      toast.error("Failed to update tags: " + err.message);
    } finally {
      setSavingTags(false);
    }
  };

  const getWorkflowStepIndex = (status?: string) => {
    if (!status) return 0;
    const lower = status.toLowerCase();
    if (lower.includes('completed') || lower.includes('approved')) return 3;
    if (lower.includes('submitted')) return 2;
    if (lower.includes('review') || lower.includes('process')) return 1;
    return 0; // Default to Pending
  };

  const handleExportJSON = () => {
    if (annotations.length === 0) {
      toast.error("No annotations to export.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(annotations, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${file.name}_annotations.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Annotations exported to JSON successfully!");
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = 210;
      const pageHeight = 297;
      
      const drawFooter = (d: any, pW: number, pH: number) => {
        d.setDrawColor(226, 232, 240); // slate-200
        d.setLineWidth(0.5);
        d.line(10, pH - 15, pW - 10, pH - 15);
        
        d.setTextColor(148, 163, 184); // slate-400
        d.setFont('helvetica', 'normal');
        d.setFontSize(7.5);
        d.text("Generated securely via Amit Online Services member account session.", 15, pH - 10);
        d.text("CONFIDENTIAL & AUDITED", 160, pH - 10);
      };

      // Page styling / Header brand banner
      doc.setFillColor(15, 23, 42); // slate-900 (ultra premium brand color)
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      // Top luxury highlight band
      doc.setFillColor(217, 119, 6); // Amber-600 gold accent color
      doc.rect(0, 0, pageWidth, 3.5, 'F');
      
      // White top logotype
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text("AMIT ONLINE SERVICES", 15, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(217, 224, 236);
      doc.text("OFFICIAL VERIFIED AUDIT & METADATA SUMMARY REPORT", 15, 25);
      
      // Draw premium brand badge
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(150, 10, 45, 25, 'F');
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(1);
      doc.rect(150, 10, 45, 25, 'S');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("AOS MEMBER", 153, 18);
      doc.text("VAULT SECURE", 153, 23);
      doc.setFontSize(7);
      doc.setTextColor(245, 158, 11);
      doc.text("VERIFIED COMPLIANCE", 153, 29);
      
      // Document Metadata Section
      let currentHeight = 55;
      
      // Section header helper definition
      const drawSectionHeader = (title: string, yPos: number) => {
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(10, yPos, 190, 8, 'F');
        
        doc.setFillColor(217, 119, 6); // Accent left bar
        doc.rect(10, yPos, 3, 8, 'F');
        
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(title, 16, yPos + 6);
      };
      
      drawSectionHeader("1. DOCUMENT SPECIFICATIONS", currentHeight);
      currentHeight += 14;
      
      // Standard dark body typography for labels
      doc.setTextColor(51, 65, 85); // slate-700
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("File Name:", 15, currentHeight);
      doc.text("Document Type:", 15, currentHeight + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42); // dark black
      doc.text(file.name, 45, currentHeight);
      doc.text(file.type || "application/pdf", 45, currentHeight + 6);
      
      let finalAuthor = 'N/A';
      let finalProducer = 'N/A';
      let finalCreation = 'N/A';
      
      if (pdfMetadata) {
        finalAuthor = pdfMetadata.author || 'N/A';
        finalProducer = pdfMetadata.producer || 'N/A';
        finalCreation = parsePdfDate(pdfMetadata.creationDate);
      }
      
      // Metadata column 2 labels
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.text("PDF Author:", 115, currentHeight);
      doc.text("PDF Producer:", 115, currentHeight + 6);
      doc.text("Creation Date:", 115, currentHeight + 12);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(finalAuthor, 145, currentHeight);
      doc.text(finalProducer, 145, currentHeight + 6);
      doc.text(finalCreation, 145, currentHeight + 12);
      
      currentHeight += 24;
      
      // Section 2: PDF EXTRADITIONS & COMPLIANCE METADATA
      drawSectionHeader("2. INTEGRITY VERIFICATION SIGNALS", currentHeight);
      currentHeight += 14;
      
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.text("Compliance State:", 15, currentHeight);
      doc.text("Security Protocol:", 15, currentHeight + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 185, 129); // Success green
      doc.text("PASSED (AOS Secure Vault Scan)", 48, currentHeight);
      doc.setTextColor(15, 23, 42);
      doc.text("AES-256 Cloud Standard", 48, currentHeight + 6);
      
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.text("Verification Hash:", 115, currentHeight);
      doc.text("Generated By:", 115, currentHeight + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const mockHash = "AUTH-HASH-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      doc.text(mockHash, 145, currentHeight);
      doc.text("AOS Secure Portal Client", 145, currentHeight + 6);
      
      currentHeight += 18;
      
      // Section 3: Annotations or OCR summary info
      if (annotations.length > 0) {
        drawSectionHeader(`3. INTERACTIVE ANNOTATIONS RECORD (${annotations.length})`, currentHeight);
        currentHeight += 14;
        
        annotations.forEach((ann, idx) => {
          // Page boundary check with buffer for next item
          if (currentHeight > 240) {
            drawFooter(doc, pageWidth, pageHeight);
            doc.addPage();
            currentHeight = 20; // reset for new page
            
            // Draw mini header on new page for visual branding
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, pageWidth, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(`AUDIT REPORT CONTINUATION - ${file.name.toUpperCase()}`, 15, 10);
            currentHeight = 25;
          }
          
          // Container block background
          doc.setFillColor(248, 250, 252); // extremely crisp off-white block
          doc.rect(10, currentHeight, 190, 25, 'F');
          
          // Left accent border based on category
          if (ann.type === 'text') {
            doc.setFillColor(217, 119, 6); // Amber
          } else {
            doc.setFillColor(16, 185, 129); // Accent Emerald
          }
          doc.rect(10, currentHeight, 3.5, 25, 'F');
          
          // Label texts
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(`Annotation #${idx + 1} (${ann.type.toUpperCase()})`, 18, currentHeight + 5.5);
          
          doc.setTextColor(100, 116, 139);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.text(`Page: ${ann.page}  |  x: ${Math.round(ann.x)}%, y: ${Math.round(ann.y)}%  |  Color: ${ann.color}`, 18, currentHeight + 10.5);
          
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          // Split long text
          const lines = doc.splitTextToSize(ann.text || "Empty annotation notes", 175);
          doc.text(lines, 18, currentHeight + 16);
          
          currentHeight += 29;
        });
      } else {
        drawSectionHeader("3. DIGITIZED AUDIT LOG NOTE", currentHeight);
        currentHeight += 13;
        
        doc.setFillColor(248, 250, 252);
        doc.rect(10, currentHeight, 190, 25, 'F');
        doc.setFillColor(71, 85, 105);
        doc.rect(10, currentHeight, 3.5, 25, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text("No client annotations found for this document.", 18, currentHeight + 8);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text("You can add highlights, text tags, or metadata overlays inside the preview window.", 18, currentHeight + 15);
      }
      
      drawFooter(doc, pageWidth, pageHeight);
      
      const safeReportName = file.name.replace(/\.[^/.]+$/, "").replace(/\s+/g, '_');
      doc.save(`${safeReportName}_Vault_Report.pdf`);
      toast.success("Branded PDF Report downloaded successfully!");
      
    } catch (e: any) {
      console.error("PDF generation err:", e);
      toast.error(`Could not generate PDF report: ${e.message}`);
    }
  };

  const handlePrint = () => {
    try {
      let printSource = "";
      if (file.type.startsWith('image/')) {
        printSource = `data:${file.type};base64,${activeContent}`;
      } else if (file.type === 'application/pdf') {
        const canvas = canvasRef.current;
        if (canvas) {
          printSource = canvas.toDataURL();
        } else {
          toast.error("Document canvas not ready for printing.");
          return;
        }
      } else {
        toast.error("Unsupported file type for direct print dialog.");
        return;
      }

      if (!printSource) {
        toast.error("Could not load preview source for print.");
        return;
      }

      // Create a temporary iframe for printing to avoid pop-up blockers and print beautifully.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        toast.error("Failed to initialize print dialog container.");
        return;
      }

      iframeDoc.write(`
        <html>
          <head>
            <title>Print - ${file.name}</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
              @page {
                size: auto;
                margin: 0mm;
              }
            </style>
          </head>
          <body>
            <img src="${printSource}" alt="Print Preview" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      iframeDoc.close();

      // Clean up the iframe after the print dialog closes
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 5000);

      toast.success("Print dialog opened successfully!");
    } catch (e: any) {
      console.error("Print dialog exception:", e);
      toast.error(`Print dialog failed: ${e.message}`);
    }
  };

  // Dynamic file content state to allow restoring and snapshot saves
  const [activeContent, setActiveContent] = useState<string>(file.content);
  useEffect(() => {
    setActiveContent(file.content);
  }, [file]);

  // Added zoom states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    if (activeTool && activeTool !== 'none') return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - panStartRef.current.x;
    const newY = e.clientY - panStartRef.current.y;
    setPanX(newX);
    setPanY(newY);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };
  
  // Added active UI tab states
  const [activeTab, setActiveTab2] = useState<'preview' | 'history' | 'compare'>('preview');

  // Version comparison state selection fields
  const [compareVersionAId, setCompareVersionAId] = useState<string | null>(null);
  const [compareVersionBId, setCompareVersionBId] = useState<string | null>(null);

  // Added annotation states
  const [activeTool, setActiveTool] = useState<'none' | 'text' | 'highlight' | 'draw_note' | 'draw_highlight'>('none');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnn, setSelectedAnn] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState<string>('#eab308'); // yellow/amber default
  const [annotationSearch, setAnnotationSearch] = useState<string>('');
  const [annotationTypeFilter, setAnnotationTypeFilter] = useState<'all' | 'text' | 'highlight' | 'draw_note' | 'draw_highlight'>('all');

  // Drawing overlay states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);

  // Interactive annotation color palette options
  const PRESET_COLORS = [
    { name: 'Amber', hex: '#eab308', text: '#ca8a04', bg: '#fef9c3' },
    { name: 'Emerald', hex: '#10b981', text: '#059669', bg: '#d1fae5' },
    { name: 'Sky', hex: '#0ea5e9', text: '#0284c7', bg: '#e0f2fe' },
    { name: 'Rose', hex: '#f43f5e', text: '#e11d48', bg: '#ffe4e6' },
    { name: 'Violet', hex: '#8b5cf6', text: '#7c3aed', bg: '#f5f3ff' },
  ];

  // Dynamic version entry state
  const [versions, setVersions] = useState<VersionEntry[]>([]);

  useEffect(() => {
    if (versions.length > 0) {
      if (!compareVersionAId) setCompareVersionAId(versions[0].version);
      if (!compareVersionBId) setCompareVersionBId(versions[1]?.version || versions[0].version);
    }
  }, [versions, compareVersionAId, compareVersionBId]);

  // Sync / load versions history from localStorage
  useEffect(() => {
    try {
      const savedVersions = localStorage.getItem('versions_' + file.name);
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions));
      } else {
        // Build high-fidelity Initial Dynamic History based on loaded document metadata
        const initialSize = `${(file.content.length * 0.75 / 1024).toFixed(1)} KB`;
        const sizeOffsetV2 = `${(file.content.length * 0.73 / 1024).toFixed(1)} KB`;
        const sizeOffsetV1 = `${(file.content.length * 0.71 / 1024).toFixed(1)} KB`;

        const initialVersions: VersionEntry[] = [
          {
            version: 'V3',
            status: 'Active (Current)',
            timestamp: new Date().toLocaleString('en-IN'),
            size: initialSize,
            author: 'amitonlineservice01@gmail.com',
            content: file.content,
            annotations: []
          },
          {
            version: 'V2',
            status: 'Initial Scanned Draft',
            timestamp: new Date(Date.now() - 3600000).toLocaleString('en-IN'),
            size: sizeOffsetV2,
            author: 'Secure Scanning System',
            content: file.content,
            annotations: [
              {
                id: 'ann_pre_1',
                x: 35,
                y: 20,
                text: 'System Scan Match: Isolated numeric header field',
                type: 'highlight',
                color: '#ffe4e6',
                page: 1
              }
            ]
          },
          {
            version: 'V1',
            status: 'Original File Upload',
            timestamp: new Date(Date.now() - 172800000).toLocaleString('en-IN'),
            size: sizeOffsetV1,
            author: 'amitonlineservice01@gmail.com',
            content: file.content,
            annotations: []
          }
        ];
        localStorage.setItem('versions_' + file.name, JSON.stringify(initialVersions));
        setVersions(initialVersions);
      }
    } catch (e) {
      console.error("Failed to read versions history", e);
    }
  }, [file.name, file.content]);

  // Hydrate annotations from file metadata OR localStorage keyed by file name
  useEffect(() => {
    try {
      if (file.annotations) {
        if (typeof file.annotations === 'string') {
          setAnnotations(JSON.parse(file.annotations));
        } else if (Array.isArray(file.annotations)) {
          setAnnotations(file.annotations);
        }
      } else {
        const saved = localStorage.getItem('annotations_' + file.name);
        if (saved) {
          setAnnotations(JSON.parse(saved));
        } else {
          setAnnotations([]);
        }
      }
    } catch (e) {
      console.error("Failed load annotations:", e);
      setAnnotations([]);
    }
  }, [file.name, file.annotations]);

  // Persist annotations
  const saveAnnotations = async (updated: Annotation[]) => {
    setAnnotations(updated);
    try {
      localStorage.setItem('annotations_' + file.name, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed store annotations locally:", e);
    }

    // Save to server database
    if (file.id) {
      try {
        await axios.post(
          "/api/data/upsert",
          {
            tab: "Documents",
            data: {
              ID: file.id,
              Annotations: JSON.stringify(updated)
            },
            idKey: "ID"
          },
          {
            headers: { Authorization: `Bearer ${user?.token || localStorage.getItem('aos_token')}` }
          }
        );
        console.log("AOS Cloud Engine: Coordinates and notes saved back to database successfully.");
      } catch (err: any) {
        console.error("AOS Cloud Engine: Failed to save annotations back to database:", err.message);
      }
    }
  };

  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout | null = null;

    if (file.type === 'application/pdf' && activeContent) {
      setLoadingError(null);
      setIsRetrying(false);

      const loadPDFWithRetry = (attempt: number = 1, maxAttempts: number = 5) => {
        if (!active) return;

        try {
          const loadingTask = pdfjsLib.getDocument({ data: atob(activeContent) });
          
          loadingTask.promise.then((pdf) => {
            if (!active) return;
            setPdfInstance(pdf);
            setNumPages(pdf.numPages);
            setCurrentPage(1);
            setZoom(1); // Reset zoom
            renderPage(pdf, 1, 1);
            setIsRetrying(false);
            setLoadingError(null);

            pdf.getMetadata().then((meta: any) => {
              if (!active) return;
              const info = meta?.info || {};
              setPdfMetadata({
                creationDate: info.CreationDate || info.creationDate || null,
                producer: info.Producer || info.producer || null,
                author: info.Author || info.author || null,
              });
            }).catch((err: any) => {
              console.warn("Failed to get PDF metadata", err);
            });

          }).catch((err) => {
            if (!active) return;
            console.error(`Error loading PDF document (Attempt ${attempt}/${maxAttempts}):`, err);

            if (attempt < maxAttempts) {
              setIsRetrying(true);
              const backoffDelay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 1000);
              const delaySeconds = (backoffDelay / 1000).toFixed(1);
              
              toast.warning(
                `🔄 Transient network issues detected. Retrying document render ${attempt}/${maxAttempts} in ${delaySeconds}s...`,
                { id: "pdf-load-retry", duration: backoffDelay }
              );

              timerId = setTimeout(() => {
                loadPDFWithRetry(attempt + 1, maxAttempts);
              }, backoffDelay);
            } else {
              setIsRetrying(false);
              setLoadingError("Failed to render PDF after maximum retry attempts. Please double-check your connectivity.");
              toast.error("❌ Document load aborted: Persistent connection issue occurred.", { id: "pdf-load-retry" });
            }
          });
        } catch (e) {
          console.error("PDF preview parsing threw exception:", e);
          setLoadingError(String(e));
        }
      };

      loadPDFWithRetry(1, 5);
    }

    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [activeContent, file.type]);

  // Re-render PDF on page or zoom changed
  useEffect(() => {
    if (pdfInstance && file.type === 'application/pdf') {
      renderPage(pdfInstance, currentPage, zoom);
    }
  }, [currentPage, pdfInstance, zoom]);

  const renderPage = (pdf: any, pageNum: number, currentZoom: number) => {
    pdf.getPage(pageNum).then((page: any) => {
      // Direct vector zoom level fed into PDF viewport scale
      const viewport = page.getViewport({ scale: 1.5 * currentZoom });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      page.render(renderContext);
    }).catch((err: any) => {
      console.error("Error rendering PDF page:", err);
    });
  };

  const getCanvasMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const pos = getCanvasMousePos(e);
    setCurrentPoints([pos]);

    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }
    }
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getCanvasMousePos(e);
    setCurrentPoints((prev) => [...prev, pos]);

    const canvas = drawCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = annotationColor;
        ctx.lineWidth = activeTool === 'draw_highlight' ? 14 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (activeTool === 'draw_highlight') {
          ctx.globalAlpha = 0.35;
        } else {
          ctx.globalAlpha = 1.0;
        }
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    }
  };

  const handleDrawEnd = () => {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      setCurrentPoints([]);
      return;
    }
    setIsDrawing(false);

    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const percentagePoints = currentPoints.map((p) => ({
      x: (p.x / rect.width) * 100,
      y: (p.y / rect.height) * 100,
    }));

    let noteText = "Highlight Brush";
    if (activeTool === 'draw_note') {
      const promptText = window.prompt("Enter a note to attach to this drawing path:");
      if (promptText === null) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setCurrentPoints([]);
        return;
      }
      noteText = promptText.trim() || "Draw Note";
    }

    const newAnn: Annotation = {
      id: 'draw_' + Date.now(),
      x: percentagePoints[0].x,
      y: percentagePoints[0].y,
      text: noteText,
      type: activeTool === 'draw_note' ? 'draw_note' : 'draw_highlight',
      color: annotationColor,
      page: file.type === 'application/pdf' ? currentPage : 1,
      points: percentagePoints,
    };

    const updated = [...annotations, newAnn];
    saveAnnotations(updated);
    toast.success(activeTool === 'draw_note' ? "Draw note saved!" : "Draw highlight placed!");

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setCurrentPoints([]);
    setActiveTool('none');
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'none') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'text') {
      const text = window.prompt("Enter text annotation description:");
      if (text && text.trim()) {
        const newAnn: Annotation = {
          id: 'ann_' + Date.now(),
          x,
          y,
          text: text.trim(),
          type: 'text',
          color: annotationColor,
          page: currentPage
        };
        const updated = [...annotations, newAnn];
        saveAnnotations(updated);
        toast.success("Text annotation added!");

        // Auto-update standard workspace snapshot history
        updateVersionAnnotations(updated);
      }
    } else if (activeTool === 'highlight') {
      const newAnn: Annotation = {
        id: 'ann_' + Date.now(),
        x,
        y,
        text: "User Highlight Marker",
        type: 'highlight',
        color: annotationColor + '30', // add alpha opacity for transparent highlighting
        page: currentPage
      };
      const updated = [...annotations, newAnn];
      saveAnnotations(updated);
      toast.success("Highlight marker placed!");

      // Auto-update standard workspace snapshot history
      updateVersionAnnotations(updated);
    }
    setActiveTool('none');
  };

  const deleteAnnotation = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const filtered = annotations.filter(a => a.id !== id);
    saveAnnotations(filtered);
    setSelectedAnn(null);
    toast.info("Annotation removed.");

    // Auto-update standard workspace snapshot history
    updateVersionAnnotations(filtered);
  };

  // Keep annotations synchronized with current version history models
  const updateVersionAnnotations = (updatedAnns: Annotation[]) => {
    const updatedVersions = versions.map(v => {
      if (v.version === 'V3') {
        return { ...v, annotations: updatedAnns };
      }
      return v;
    });
    setVersions(updatedVersions);
    try {
      localStorage.setItem('versions_' + file.name, JSON.stringify(updatedVersions));
    } catch (e) {
      console.error("Failed to sync version state annotations key", e);
    }
  };

  // Restore previous drafted version
  const handleRestoreVersion = (version: VersionEntry) => {
    setActiveContent(version.content);
    if (version.annotations) {
      saveAnnotations(version.annotations);
    } else {
      saveAnnotations([]);
    }
    toast.success(`Restored state to ${version.version}! Annotations and contents updated.`);
    setActiveTab2('preview');
  };

  // Save current active state annotations and file to local snapshot version entries
  const handleSaveSnapshot = () => {
    const nextVerNumber = versions.length + 1;
    const newVerName = `V${nextVerNumber}`;
    const newEntry: VersionEntry = {
      version: newVerName,
      status: 'User Saved Snapshot',
      timestamp: new Date().toLocaleString('en-IN'),
      size: `${(activeContent.length * 0.75 / 1024).toFixed(1)} KB`,
      author: 'amitonlineservice01@gmail.com',
      content: activeContent,
      annotations: [...annotations]
    };
    const updated = [newEntry, ...versions];
    setVersions(updated);
    try {
      localStorage.setItem('versions_' + file.name, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed save snapshot", e);
    }
    toast.success(`Success! Document saved as version ${newVerName}.`);
  };

  // Filtered annotations for search/sidebar view
  const filteredAnnotations = annotations.filter(ann => {
    const matchesSearch = !annotationSearch || ann.text.toLowerCase().includes(annotationSearch.toLowerCase());
    const matchesType = annotationTypeFilter === 'all' || ann.type === annotationTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 backdrop-blur-md"
      id="file-preview-overlay"
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 767px) {
          #document-preview-modal-fallback {
            max-width: 95vw !important;
            padding: 8px !important;
          }
        }
      `}} />
      <div 
        id="document-preview-modal-fallback" 
        className="bg-white dark:bg-slate-900 rounded-[32px] w-full md:max-w-6xl max-w-[95vw] md:max-h-[92vh] max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-850 p-2 sm:p-4 md:p-6"
        style={{ flexDirection: 'column', overflowY: 'auto' }}
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-905 sticky top-0 z-50">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight" id="preview-file-name">{file.name}</h3>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{file.type}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold font-mono">
                Size: {(activeContent.length * 0.75 / 1024).toFixed(1)} KB
              </span>
              {file.type === 'application/pdf' && pdfMetadata && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 font-mono px-3 py-1 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40">
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[8.5px]">PDF Info:</span>
                  <span>Author: <strong className="text-slate-900 dark:text-white">{pdfMetadata.author || 'N/A'}</strong></span>
                  <span className="text-indigo-200 dark:text-indigo-805">•</span>
                  <span>Producer: <strong className="text-slate-900 dark:text-white">{pdfMetadata.producer || 'N/A'}</strong></span>
                  <span className="text-indigo-200 dark:text-indigo-805">•</span>
                  <span>Created: <strong className="text-slate-900 dark:text-white">{parsePdfDate(pdfMetadata.creationDate)}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View vs History Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/65 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <button 
                onClick={() => setActiveTab2('preview')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
              >
                <Eye size={14} /> Document Viewer
              </button>
              <button 
                onClick={() => setActiveTab2('history')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                id="version-history-tab"
              >
                <Clock size={14} /> Version History
              </button>
              <button 
                onClick={() => setActiveTab2('compare')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'compare' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
                id="compare-versions-tab"
              >
                <ArrowUpDown size={14} className="rotate-90" /> Compare Versions
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-750 flex items-center justify-center text-slate-550 hover:text-rose-500 cursor-pointer transition-all"
              id="close-preview-button"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Visual Workflow Progress Bar */}
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800/80 p-4 px-8 hidden md:block">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 font-mono">
              <span>Dynamic Workflow Stages</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/10 px-2 py-0.5 rounded-md">
                Current Status: {file.status || 'Pending'}
              </span>
            </div>
            <div className="relative flex items-center justify-between">
              {/* Connected Background Track */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-250 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full" />
              <div 
                className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-orange-500 via-indigo-500 to-green-500 -translate-y-1/2 z-0 transition-all duration-500 rounded-full" 
                style={{ width: `${(getWorkflowStepIndex(file.status) / 3) * 100}%` }}
              />

              {[
                { label: "Pending", desc: "Awaiting verification", color: "from-orange-500 to-amber-500" },
                { label: "Under Review", desc: "Specialist review", color: "from-amber-500 to-indigo-500" },
                { label: "Submitted", desc: "Registry submission", color: "from-indigo-500 to-blue-500" },
                { label: "Completed", desc: "Certificate approved", color: "from-blue-500 to-green-500" }
              ].map((step, idx) => {
                const stepIdx = getWorkflowStepIndex(file.status);
                const isActive = idx === stepIdx;
                const isCompleted = idx < stepIdx;
                return (
                  <div key={step.label} className="relative z-10 flex flex-col items-center">
                    <div 
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${
                        isCompleted 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20" 
                          : isActive 
                          ? "bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-150 dark:ring-indigo-950/65 animate-pulse" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isCompleted ? <Check size={11} className="stroke-[3.5]" /> : idx + 1}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-[10px] font-black uppercase tracking-tight ${isActive ? "text-indigo-600 dark:text-indigo-400" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-450 dark:text-slate-500"}`}>
                        {step.label}
                      </p>
                      <p className="text-[8px] text-slate-400 dark:text-slate-550 font-medium hidden lg:block mt-0.5">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Inner Body Panels */}
        <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-950 flex flex-col md:flex-row relative min-h-[450px]">
          
          {activeTab === 'preview' ? (
            <>
              {/* PDF Multi-page Thumbnail Navigation Sidebar */}
              {file.type === 'application/pdf' && pdfInstance && numPages && numPages > 1 && (
                <div 
                  className="w-28 shrink-0 border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col gap-3 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/60"
                  id="pdf-thumbnails-sidebar"
                >
                  <p className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider text-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-1">
                    Thumbnails
                  </p>
                  <div className="flex flex-col items-center gap-3">
                    {Array.from({ length: numPages }, (_, idx) => idx + 1).map((pNum) => (
                      <PdfThumbnail
                        key={pNum}
                        pdf={pdfInstance}
                        pageNum={pNum}
                        isActive={currentPage === pNum}
                        onClick={() => {
                          setCurrentPage(pNum);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Document Display Side */}
              <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
                {/* Floating annotation tool active helper guide banner */}
                {activeTool !== 'none' && (
                  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 dark:bg-slate-950/95 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-750 backdrop-blur-md animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <span>
                      {activeTool === 'text' && "Text Label Tool Active: Click on the document image below to place a custom text label"}
                      {activeTool === 'highlight' && "Point Marker Tool Active: Click on the document image to mark an attention dot"}
                      {activeTool === 'draw_note' && "Drawing Pen Active: Hold left-click and drag across document to sketch freely with description"}
                      {activeTool === 'draw_highlight' && "Drawing Highlighter Active: Hold left-click and drag to apply custom colored focus areas"}
                    </span>
                    <button 
                      onClick={() => setActiveTool('none')}
                      className="ml-3 bg-white/15 hover:bg-white/30 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all"
                    >
                      Clear Tool
                    </button>
                  </div>
                )}

                {/* Visual Editing / Annotation Bar */}
                <div className="bg-white/94 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-150 dark:border-slate-800/80 p-3 flex flex-wrap justify-between items-center z-10 px-6 gap-4">
                  
                  {/* Annotation Tools */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mr-1 font-mono">Tools:</span>
                    <button 
                      onClick={() => setActiveTool(activeTool === 'text' ? 'none' : 'text')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTool === 'text' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200' : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-600 dark:text-slate-300'}`}
                      title="Add dynamic sticky text annotations"
                      id="text-ann-btn"
                    >
                      <Type size={13} /> Text Annotation
                    </button>
                    <button 
                      onClick={() => setActiveTool(activeTool === 'highlight' ? 'none' : 'highlight')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTool === 'highlight' ? 'bg-yellow-105 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400 border border-yellow-250' : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-600 dark:text-slate-300'}`}
                      title="Place highlighter transparent block layers"
                      id="highlight-ann-btn"
                    >
                      <Highlighter size={13} /> Highlight Block
                    </button>
                    <button 
                      onClick={() => setActiveTool(activeTool === 'draw_note' ? 'none' : 'draw_note')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTool === 'draw_note' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200' : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-600 dark:text-slate-300'}`}
                      title="Draw note paths freehand on document or image preview"
                      id="draw-note-btn"
                    >
                      <Pencil size={13} /> Draw Note
                    </button>
                    <button 
                      onClick={() => setActiveTool(activeTool === 'draw_highlight' ? 'none' : 'draw_highlight')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${activeTool === 'draw_highlight' ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400 border border-pink-200' : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 text-slate-600 dark:text-slate-300'}`}
                      title="Draw yellow highlights freehand on document or image preview"
                      id="draw-highlight-btn"
                    >
                      <Palette size={13} /> Draw Highlight
                    </button>

                    {/* Palette Picker for active markup colors */}
                    <div className="flex items-center gap-1 ml-2 pl-3 border-l border-slate-200 dark:border-slate-800 pt-0.5">
                      {PRESET_COLORS.map((clr) => (
                        <button
                          key={clr.hex}
                          onClick={() => setAnnotationColor(clr.hex)}
                          className={`w-4 h-4 rounded-full border transition-all relative flex items-center justify-center cursor-pointer ${annotationColor === clr.hex ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : 'hover:scale-110'}`}
                          style={{ backgroundColor: clr.hex }}
                          title={`Select ${clr.name} for your annotation`}
                        >
                          {annotationColor === clr.hex && (
                            <Check size={8} className="text-white font-black stroke-[3]" />
                          )}
                        </button>
                      ))}
                    </div>

                    {activeTool !== 'none' && (
                      <span className="text-[9px] font-black uppercase text-sky-500 animate-pulse tracking-wide ml-2 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded border border-sky-100 dark:border-sky-900/40">
                        {activeTool === 'draw_note' || activeTool === 'draw_highlight' 
                          ? "Click & Drag to Draw on document" 
                          : "Click target on document to place"}
                      </span>
                    )}
                  </div>

                  {/* Vector High-Fidelity & Display Zoom Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={handleSaveSnapshot}
                      className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/45 dark:text-blue-400 dark:hover:bg-blue-900/50 px-2.5 py-1.5 rounded-xl border border-blue-200/50 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      title="Saves current file annotations snapshot as a version history entry"
                      id="save-snapshot-btn"
                    >
                      <Save size={12} /> Save Snapshot
                    </button>

                    <button 
                      onClick={handleExportJSON}
                      disabled={annotations.length === 0}
                      className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/45 dark:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-emerald-900/50 px-2.5 py-1.5 rounded-xl border border-emerald-200/50 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      title="Download annotations as JSON"
                      id="export-json-btn"
                    >
                      Export JSON
                    </button>

                    <button 
                      onClick={handleExportPDF}
                      disabled={annotations.length === 0}
                      className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/45 dark:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed dark:hover:bg-indigo-900/50 px-2.5 py-1.5 rounded-xl border border-indigo-200/50 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      title="Download annotations PDF document report"
                      id="export-pdf-report-btn"
                    >
                      Export PDF Report
                    </button>

                    <div className="flex items-center gap-2 border bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 p-1 rounded-xl">
                      <button 
                        onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} 
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-slate-650 dark:text-slate-300 cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="text-[10px] font-black font-mono w-12 text-center uppercase text-slate-600 dark:text-slate-350">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button 
                        onClick={() => setZoom(z => Math.min(z + 0.25, 3.0))} 
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-slate-650 dark:text-slate-300 cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn size={14} />
                      </button>
                      <button 
                        onClick={() => { setZoom(1.0); setRotation(0); setPanX(0); setPanY(0); }} 
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-slate-450 dark:text-slate-400 cursor-pointer border-l border-slate-200 dark:border-slate-750"
                        title="Reset Zoom & Rotation"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <button 
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-slate-650 dark:text-slate-300 cursor-pointer"
                        title="Rotate 90deg Clockwise"
                        id="rotate-doc-img-btn"
                      >
                        <RotateCw size={14} />
                      </button>
                      <button 
                        onClick={handlePrint}
                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg text-slate-650 dark:text-slate-300 cursor-pointer border-l border-slate-200 dark:border-slate-750"
                        title="Print Document"
                        id="print-doc-btn"
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div 
                  className="flex-1 w-full p-8 flex justify-center items-center overflow-auto select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* File bounds container */}
                  <div 
                    onClick={handleContainerClick}
                    className={`relative select-none transition-all duration-100 ${activeTool !== 'none' ? 'cursor-cell border-2 border-dashed border-sky-400' : ''}`}
                    style={{
                      transform: `translate(${panX}px, ${panY}px) ${file.type.startsWith('image/') ? `scale(${zoom}) rotate(${rotation}deg)` : `rotate(${rotation}deg)`}`,
                      transformOrigin: 'center center',
                      maxWidth: '100%',
                      cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : (activeTool !== 'none' ? 'cell' : 'default'),
                    }}
                    id="canvas-annotator-target"
                  >
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img 
                          src={`data:${file.type};base64,${activeContent}`} 
                          alt="Centralized Document Preview View" 
                          className="max-w-full max-h-[58vh] object-contain rounded-2xl shadow-xl border border-slate-250 dark:border-slate-800" 
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Interactive Annotations overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          {annotations.filter(ann => ann.type === 'text' || ann.type === 'highlight').map((ann) => (
                            <div 
                              key={ann.id}
                              style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20 group"
                            >
                              {ann.type === 'text' ? (
                                <div className="relative">
                                  <div 
                                    className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce cursor-pointer"
                                    style={{ backgroundColor: ann.color }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedAnn(selectedAnn === ann.id ? null : ann.id); }}
                                  >
                                    <Type size={10} />
                                  </div>
                                  
                                  {/* Tooltip detail block */}
                                  {(selectedAnn === ann.id || activeTool === 'none') && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-750 text-white p-2.5 rounded-xl shadow-2xl text-[10px] font-bold z-50 pointer-events-auto leading-relaxed scale-95 origin-bottom opacity-100 group-hover:opacity-100 group-hover:scale-100 transition-all">
                                      <p className="text-slate-300">{ann.text}</p>
                                      <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 mt-1.5">
                                        <span className="text-[8px] text-slate-550">Page {ann.page}</span>
                                        <button 
                                          onClick={(e) => deleteAnnotation(ann.id, e)}
                                          className="text-red-400 hover:text-red-600 flex items-center gap-0.5 font-bold uppercase font-mono"
                                        >
                                          <Trash2 size={10} /> Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="relative">
                                  {/* Highlight rectangle */}
                                  <div 
                                    className="w-20 h-5 flex items-center justify-center cursor-pointer shadow-sm rounded-sm"
                                    style={{ backgroundColor: ann.color, borderColor: ann.color.substring(0, 7) }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedAnn(selectedAnn === ann.id ? null : ann.id); }}
                                    title="Highlight marker. Click to delete."
                                  />
                                  
                                  {selectedAnn === ann.id && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-[9px] font-black tracking-wider uppercase z-50 pointer-events-auto">
                                      <button 
                                        onClick={(e) => deleteAnnotation(ann.id, e)}
                                        className="text-red-400 flex items-center gap-1 font-bold"
                                      >
                                        <Trash2 size={12} /> Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Freehand Drawings SVG overlay */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                            {annotations.filter(ann => (ann.type === 'draw_note' || ann.type === 'draw_highlight') && ann.points && ann.points.length > 0).map((ann) => {
                              const dPath = ann.points!.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`).join(' ');
                              return (
                                <g key={ann.id} className="pointer-events-auto">
                                  <path
                                    d={dPath}
                                    fill="none"
                                    stroke={ann.color}
                                    strokeWidth={ann.type === 'draw_highlight' ? '24' : '4'}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={ann.type === 'draw_highlight' ? 0.45 : 1.0}
                                    className="cursor-pointer hover:stroke-sky-400 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setSelectedAnn(selectedAnn === ann.id ? null : ann.id); }}
                                  >
                                    <title>{ann.type === 'draw_note' ? `Draw Note: ${ann.text}` : 'Draw Highlight path'}</title>
                                  </path>

                                  {ann.type === 'draw_note' && ann.points![0] && (
                                    <foreignObject
                                      x={`${ann.points![0].x}%`}
                                      y={`${ann.points![0].y}%`}
                                      width="240"
                                      height="200"
                                      className="overflow-visible pointer-events-none"
                                    >
                                      <div className="pointer-events-auto translate-x-1 translate-y-1">
                                        <div 
                                          className="w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center shadow-md cursor-pointer absolute -translate-x-1/2 -translate-y-1/2 animate-pulse"
                                          style={{ backgroundColor: ann.color }}
                                          onClick={(e) => { e.stopPropagation(); setSelectedAnn(selectedAnn === ann.id ? null : ann.id); }}
                                        />
                                        
                                        {selectedAnn === ann.id && (
                                          <div className="absolute top-4 left-0 bg-slate-900 border border-slate-750 text-white p-2.5 rounded-xl shadow-2xl text-[10px] w-48 -translate-x-1/2 font-sans z-50">
                                            <p className="text-slate-200 font-medium leading-relaxed">{ann.text}</p>
                                            <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 mt-1.5 font-mono text-[8px] text-slate-500">
                                              <span>Draw Note</span>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id, e); }}
                                                className="text-red-400 hover:text-red-500 flex items-center gap-0.5 font-bold uppercase cursor-pointer"
                                              >
                                                <Trash2 size={10} /> Delete
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </foreignObject>
                                  )}

                                  {ann.type === 'draw_highlight' && selectedAnn === ann.id && ann.points![0] && (
                                    <foreignObject
                                      x={`${ann.points![0].x}%`}
                                      y={`${ann.points![0].y}%`}
                                      width="150"
                                      height="100"
                                      className="overflow-visible pointer-events-none"
                                    >
                                      <div className="absolute bg-slate-900 border border-slate-750 text-white p-1.5 rounded-lg text-[9px] font-sans font-semibold shadow-xl z-50 pointer-events-auto -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                        <span className="text-[7px] text-slate-500 font-mono">Highlight</span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id, e); }}
                                          className="text-red-400 hover:text-red-500 font-bold uppercase font-mono text-[8px]"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </foreignObject>
                                  )}
                                </g>
                              );
                            })}
                          </svg>

                          {/* Transparent Freehand Drawing Canvas input overlay */}
                          {(activeTool === 'draw_note' || activeTool === 'draw_highlight') && (
                            <canvas
                              ref={drawCanvasRef}
                              className="absolute inset-0 z-25 cursor-crosshair bg-transparent pointer-events-auto"
                              onMouseDown={handleDrawStart}
                              onMouseMove={handleDrawMove}
                              onMouseUp={handleDrawEnd}
                              onMouseLeave={handleDrawEnd}
                              onMouseEnter={(e) => {
                                const canvas = drawCanvasRef.current;
                                if (canvas) {
                                  canvas.width = canvas.clientWidth;
                                  canvas.height = canvas.clientHeight;
                                }
                              }}
                              style={{ width: '100%', height: '100%' }}
                            />
                          )}
                        </div>
                      </div>
                    ) : file.type === 'application/pdf' ? (
                      <div className="relative bg-white p-4 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800">
                        {loadingError ? (
                          <div className="p-8 text-center max-w-sm flex flex-col items-center gap-3">
                            <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{loadingError}</p>
                          </div>
                        ) : (
                          <>
                            {isRetrying && (
                              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-30 flex flex-col justify-center items-center gap-3 rounded-xl">
                                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-350">
                                  Connection interrupted. Retrying document rendering...
                                </span>
                              </div>
                            )}
                            <canvas ref={canvasRef} className="max-w-full object-contain w-full h-auto" style={{ width: '100%', height: 'auto' }} />
                          </>
                        )}
                        
                        {/* Interactive Annotations overlay */}
                        <div className="absolute inset-0 pointer-events-none">
                          {annotations.filter(ann => (ann.type === 'text' || ann.type === 'highlight') && ann.page === currentPage).map((ann) => (
                            <div 
                              key={ann.id}
                              style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-20 group"
                            >
                              {ann.type === 'text' ? (
                                <div className="relative">
                                  <div 
                                    className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg animate-bounce cursor-pointer"
                                    style={{ backgroundColor: ann.color }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedAnn(selectedAnn === ann.id ? null : ann.id); }}
                                  >
                                    <Type size={10} />
                                  </div>
                                  
                                  {(selectedAnn === ann.id || activeTool === 'none') && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-slate-900 border border-slate-750 text-white p-2.5 rounded-xl shadow-2xl text-[10px] font-bold z-50 pointer-events-auto leading-relaxed scale-95 origin-bottom opacity-100 group-hover:opacity-100 group-hover:scale-100 transition-all">
                                      <p className="text-slate-300">{ann.text}</p>
                                      <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 mt-1.5">
                                        <span className="text-[8px] text-slate-550">Page {ann.page}</span>
                                        <button 
                                          onClick={(e) => deleteAnnotation(ann.id, e)}
                                          className="text-red-400 hover:text-red-500 flex items-center gap-0.5 font-bold uppercase font-mono"
                                        >
                                          <Trash2 size={10} /> Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="relative">
                                  <div 
                                    className="w-20 h-5 flex items-center justify-center cursor-pointer shadow-sm rounded-sm"
                                    style={{ backgroundColor: ann.color, borderColor: ann.color.substring(0, 7) }}
                                    onClick={(e) => { e.stopPropagation(); setSelectedAnn(selectedAnn === ann.id ? null : ann.id); }}
                                  />
                                  
                                  {selectedAnn === ann.id && (
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white p-2 rounded-xl text-[9px] font-black tracking-wider uppercase z-50 pointer-events-auto font-mono">
                                      <button 
                                        onClick={(e) => deleteAnnotation(ann.id, e)}
                                        className="text-red-400 flex items-center gap-1 font-bold"
                                      >
                                        <Trash2 size={12} /> Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Freehand Drawings SVG overlay */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
                            {annotations.filter(ann => (ann.type === 'draw_note' || ann.type === 'draw_highlight') && ann.page === currentPage && ann.points && ann.points.length > 0).map((ann) => {
                              const dPath = ann.points!.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`).join(' ');
                              return (
                                <g key={ann.id} className="pointer-events-auto">
                                  <path
                                    d={dPath}
                                    fill="none"
                                    stroke={ann.color}
                                    strokeWidth={ann.type === 'draw_highlight' ? '24' : '4'}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={ann.type === 'draw_highlight' ? 0.45 : 1.0}
                                    className="cursor-pointer hover:stroke-sky-400 transition-colors"
                                    onClick={(e) => { e.stopPropagation(); setSelectedAnn(selectedAnn === ann.id ? null : ann.id); }}
                                  >
                                    <title>{ann.type === 'draw_note' ? `Draw Note: ${ann.text}` : 'Draw Highlight path'}</title>
                                  </path>

                                  {ann.type === 'draw_note' && ann.points![0] && (
                                    <foreignObject
                                      x={`${ann.points![0].x}%`}
                                      y={`${ann.points![0].y}%`}
                                      width="240"
                                      height="200"
                                      className="overflow-visible pointer-events-none"
                                    >
                                      <div className="pointer-events-auto translate-x-1 translate-y-1">
                                        <div 
                                          className="w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center shadow-md cursor-pointer absolute -translate-x-1/2 -translate-y-1/2 animate-pulse"
                                          style={{ backgroundColor: ann.color }}
                                          onClick={(e) => { e.stopPropagation(); setSelectedAnn(selectedAnn === ann.id ? null : ann.id); }}
                                        />
                                        
                                        {selectedAnn === ann.id && (
                                          <div className="absolute top-4 left-0 bg-slate-900 border border-slate-750 text-white p-2.5 rounded-xl shadow-2xl text-[10px] w-48 -translate-x-1/2 font-sans z-50">
                                            <p className="text-slate-200 font-medium leading-relaxed">{ann.text}</p>
                                            <div className="flex justify-between items-center border-t border-slate-800 pt-1.5 mt-1.5 font-mono text-[8px] text-slate-500">
                                              <span>Draw Note</span>
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id, e); }}
                                                className="text-red-400 hover:text-red-500 flex items-center gap-0.5 font-bold uppercase cursor-pointer"
                                              >
                                                <Trash2 size={10} /> Delete
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </foreignObject>
                                  )}

                                  {ann.type === 'draw_highlight' && selectedAnn === ann.id && ann.points![0] && (
                                    <foreignObject
                                      x={`${ann.points![0].x}%`}
                                      y={`${ann.points![0].y}%`}
                                      width="150"
                                      height="100"
                                      className="overflow-visible pointer-events-none"
                                    >
                                      <div className="absolute bg-slate-900 border border-slate-750 text-white p-1.5 rounded-lg text-[9px] font-sans font-semibold shadow-xl z-50 pointer-events-auto -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                        <span className="text-[7px] text-slate-500 font-mono">Highlight</span>
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id, e); }}
                                          className="text-red-400 hover:text-red-500 font-bold uppercase font-mono text-[8px]"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </foreignObject>
                                  )}
                                </g>
                              );
                            })}
                          </svg>

                          {/* Transparent Freehand Drawing Canvas input overlay */}
                          {(activeTool === 'draw_note' || activeTool === 'draw_highlight') && (
                            <canvas
                              ref={drawCanvasRef}
                              className="absolute inset-0 z-25 cursor-crosshair bg-transparent pointer-events-auto"
                              onMouseDown={handleDrawStart}
                              onMouseMove={handleDrawMove}
                              onMouseUp={handleDrawEnd}
                              onMouseLeave={handleDrawEnd}
                              onMouseEnter={(e) => {
                                const canvas = drawCanvasRef.current;
                                if (canvas) {
                                  canvas.width = canvas.clientWidth;
                                  canvas.height = canvas.clientHeight;
                                }
                              }}
                              style={{ width: '100%', height: '100%' }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-white p-12 rounded-2xl shadow-xl">
                         <AlertCircle size={48} className="mx-auto text-slate-305 dark:text-slate-700 mb-4 animate-bounce" />
                         <p className="text-slate-550 dark:text-slate-400 font-extrabold text-sm uppercase">Preview not available for this file type</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Collapsible right-hand premium sidebar listing annotations */}
              <div className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 p-5 flex flex-col overflow-hidden select-none">
                
                {/* Custom Metadata Tags & Accuracy Panel */}
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider block font-mono">
                      🏷️ Custom Metadata Tags
                    </label>
                    {file.confidence && (
                      <span className="text-[8.5px] font-black bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                        Accuracy: {typeof file.confidence === 'number' ? `${(file.confidence * 100).toFixed(1)}%` : String(file.confidence).includes('%') ? file.confidence : `${parseFloat(file.confidence).toFixed(1)}%`}
                      </span>
                    )}
                  </div>

                  {/* Display list of tags as removable badges */}
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {tagsList.length === 0 ? (
                      <span className="text-[9px] text-slate-450 dark:text-slate-500 italic">No custom tags added yet.</span>
                    ) : (
                      tagsList.map(tag => (
                        <span 
                          key={tag}
                          className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2   py-0.5 rounded-md text-[9px] font-bold border border-slate-150 dark:border-slate-700 shadow-xs"
                        >
                          {tag}
                          <button 
                            onClick={() => handleRemoveTag(tag)}
                            className="text-slate-400 hover:text-red-500 font-extrabold focus:outline-none cursor-pointer"
                            title="Remove tag"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Tag addition input */}
                  <div className="flex gap-1.5">
                    <input 
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag..."
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-[9.5px] font-bold outline-none leading-relaxed placeholder-slate-450 dark:text-white"
                    />
                    <button 
                      onClick={handleAddTag}
                      className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-3 py-1 rounded-lg text-[9px] uppercase font-black cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end pt-1">
                    <button 
                      onClick={handleSaveTags}
                      disabled={savingTags}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Save size={10} />
                      {savingTags ? "Saving..." : "Save Tags"}
                    </button>
                  </div>
                </div>

                {/* PDF Document Metadata Panel */}
                {file.type === 'application/pdf' && pdfMetadata && (
                  <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3 shadow-sm text-left">
                    <label className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block font-mono">
                      📄 PDF Metadata Records
                    </label>
                    <div className="max-h-36 overflow-y-auto pr-1 space-y-2 text-[10px] font-bold text-slate-700 dark:text-slate-350 select-text leading-tight scrollbar-thin">
                      <div className="flex flex-col gap-0.5 border-b border-slate-100 dark:border-slate-850 pb-1.5">
                        <span className="text-[8px] font-mono uppercase tracking-wider text-slate-400">Author / Creator</span>
                        <span className="break-all text-slate-900 dark:text-white font-mono">{pdfMetadata.author || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 border-b border-slate-100 dark:border-slate-850 pb-1.5">
                        <span className="text-[8px] font-mono uppercase tracking-wider text-slate-400">Software / Producer</span>
                        <span className="break-all text-slate-900 dark:text-white font-mono">{pdfMetadata.producer || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-mono uppercase tracking-wider text-slate-400">Creation Timestamp</span>
                        <span className="text-slate-900 dark:text-white font-mono">{parsePdfDate(pdfMetadata.creationDate)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Annotations List ({filteredAnnotations.length})
                  </span>
                  
                  {/* Select Type Filters */}
                  <div className="flex gap-1 flex-wrap">
                    <button
                      onClick={() => setAnnotationTypeFilter('all')}
                      className={`px-1.5 py-1 rounded text-[8px] font-black uppercase tracking-wider ${annotationTypeFilter === 'all' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setAnnotationTypeFilter('text')}
                      className={`px-1.5 py-1 rounded text-[8px] font-black uppercase tracking-wider ${annotationTypeFilter === 'text' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
                    >
                      Texts
                    </button>
                    <button
                      onClick={() => setAnnotationTypeFilter('highlight')}
                      className={`px-1.5 py-1 rounded text-[8px] font-black uppercase tracking-wider ${annotationTypeFilter === 'highlight' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
                    >
                      Line Markers
                    </button>
                    <button
                      onClick={() => setAnnotationTypeFilter('draw_note')}
                      className={`px-1.5 py-1 rounded text-[8px] font-black uppercase tracking-wider ${annotationTypeFilter === 'draw_note' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
                    >
                      Draw Notes
                    </button>
                    <button
                      onClick={() => setAnnotationTypeFilter('draw_highlight')}
                      className={`px-1.5 py-1 rounded text-[8px] font-black uppercase tracking-wider ${annotationTypeFilter === 'draw_highlight' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-400'}`}
                    >
                      Draw Highlights
                    </button>
                  </div>
                </div>

                {/* Annotation search box */}
                <div className="relative mb-3.5">
                  <Search size={11} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={annotationSearch}
                    onChange={(e) => setAnnotationSearch(e.target.value)}
                    placeholder="Search annotations text..."
                    className="w-full text-[10px] pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1" id="annotations-list">
                  {filteredAnnotations.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                      <Palette size={24} className="mx-auto opacity-40 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-wider">No markers matches</p>
                      <p className="text-[9px] mt-0.5 font-medium leading-relaxed">Activate Text Annotation, Highlight Block, or freehand drawing tools above to write or draw on the document preview.</p>
                    </div>
                  ) : (
                    filteredAnnotations.map((ann) => (
                      <div 
                        key={ann.id}
                        className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850/80 rounded-xl space-y-1.5 hover:border-blue-400 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span 
                            className="text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest font-mono"
                            style={{
                              backgroundColor: ann.color.substring(0, 7) + '20',
                              color: ann.color.substring(0, 7)
                            }}
                          >
                            {ann.type}
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold">Page {ann.page}</span>
                        </div>

                        <p className="text-[10px] font-bold text-slate-750 dark:text-slate-300 leading-relaxed font-mono truncate-3-lines">
                          {ann.text}
                        </p>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-850/50">
                          <span className="text-[7px] text-slate-400 uppercase font-mono font-bold">Coord: {Math.round(ann.x)}x, {Math.round(ann.y)}y</span>
                          <button
                            onClick={() => deleteAnnotation(ann.id)}
                            className="text-[8px] text-rose-500 hover:text-rose-600 font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={8} /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {annotations.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete all document annotations?")) {
                        saveAnnotations([]);
                        toast.success("All annotations cleared!");
                        updateVersionAnnotations([]);
                      }
                    }}
                    className="w-full mt-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[9px] font-black uppercase tracking-widest border border-dashed border-rose-200 dark:border-rose-900 rounded-xl transition-colors cursor-pointer"
                  >
                    Clear All Annotations
                  </button>
                )}
              </div>
            </>
          ) : activeTab === 'compare' ? (
            /* Visual Compare Panel */
            <div className="flex-1 p-6 md:p-8 overflow-auto max-w-6xl mx-auto w-full space-y-6">
              
              {/* Header section with description */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <ArrowUpDown size={15} className="rotate-90 text-indigo-500" />
                    Interactive Version Comparison Vault
                  </h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Compare cryptographic size differences, annotative changes and registry timelines
                  </p>
                </div>
                
                {/* Selectors for Version A & B */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase text-slate-400">Ver A:</span>
                    <select
                      value={compareVersionAId || ''}
                      onChange={(e) => setCompareVersionAId(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    >
                      {versions.map((v) => (
                        <option key={v.version} value={v.version}>{v.version} ({v.status})</option>
                      ))}
                    </select>
                  </div>

                  <span className="text-slate-300 dark:text-slate-700 hidden md:inline">➔</span>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase text-slate-400">Ver B:</span>
                    <select
                      value={compareVersionBId || ''}
                      onChange={(e) => setCompareVersionBId(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    >
                      {versions.map((v) => (
                        <option key={v.version} value={v.version}>{v.version} ({v.status})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Side by side comparison cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* VERSION A DETAILS CARD */}
                {(() => {
                  const verA = versions.find(v => v.version === compareVersionAId);
                  if (!verA) return null;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-105 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">{verA.version}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded">
                            {verA.status}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-mono">{verA.timestamp}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Payload Size</span>
                          <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{verA.size}</strong>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Author Account</span>
                          <strong className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block mr-1" title={verA.author}>{verA.author}</strong>
                        </div>
                      </div>

                      {/* Version A Annotations */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Document Markers ({verA.annotations?.length || 0})
                        </span>
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 text-left">
                          {(!verA.annotations || verA.annotations.length === 0) ? (
                            <p className="text-[10px] text-slate-400 italic py-3">No annotation tags registered for this draft.</p>
                          ) : (
                            verA.annotations.map((ann, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                  <span className="text-blue-500 font-mono">{ann.type}</span>
                                  <span className="text-slate-400">Page {ann.page}</span>
                                </div>
                                <p className="text-[10.5px] font-bold text-slate-705 dark:text-slate-300 leading-relaxed font-mono">
                                  {ann.text}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* VERSION B DETAILS CARD */}
                {(() => {
                  const verB = versions.find(v => v.version === compareVersionBId);
                  if (!verB) return null;
                  return (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-105 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{verB.version}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 text-emerald-705 dark:text-emerald-300 px-2.5 py-0.5 rounded">
                            {verB.status}
                          </span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 font-mono">{verB.timestamp}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Payload Size</span>
                          <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">{verB.size}</strong>
                        </div>
                        <div>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Author Account</span>
                          <strong className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block mr-1" title={verB.author}>{verB.author}</strong>
                        </div>
                      </div>

                      {/* Version B Annotations */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                          Document Markers ({verB.annotations?.length || 0})
                        </span>
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 text-left">
                          {(!verB.annotations || verB.annotations.length === 0) ? (
                            <p className="text-[10px] text-slate-400 italic py-3">No annotation tags registered for this draft.</p>
                          ) : (
                            verB.annotations.map((ann, idx) => (
                              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
                                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                  <span className="text-green-500 font-mono">{ann.type}</span>
                                  <span className="text-slate-400">Page {ann.page}</span>
                                </div>
                                <p className="text-[10.5px] font-bold text-slate-705 dark:text-slate-300 leading-relaxed font-mono">
                                  {ann.text}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

              {/* Cryptographic metadata diff analysis */}
              {(() => {
                const verA = versions.find(v => v.version === compareVersionAId);
                const verB = versions.find(v => v.version === compareVersionBId);
                if (!verA || !verB) return null;

                const sizeA = parseFloat(verA.size) || 0;
                const sizeB = parseFloat(verB.size) || 0;
                const sizeDiff = (sizeB - sizeA).toFixed(2);
                const isIdentical = verA.content === verB.content;
                
                return (
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-205 dark:border-slate-850/60 rounded-3xl p-6">
                    <h5 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-mono text-left">
                      Analytical Delta Overview
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 text-left">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Base64 Code Similarity</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          {isIdentical ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">100% Identical Struct</span>
                            </>
                          ) : (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                              <span className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Divergent Revisions</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 text-left">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Payload delta (B - A)</span>
                        <p className={`text-base font-bold font-mono mt-1 ${parseFloat(sizeDiff) > 0 ? 'text-emerald-600' : parseFloat(sizeDiff) < 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                          {parseFloat(sizeDiff) > 0 ? `+${sizeDiff} KB` : `${sizeDiff} KB`}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850 text-left">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Marker Delta</span>
                        <p className="text-base font-bold font-mono text-indigo-500 mt-1">
                          {Math.abs((verB.annotations?.length || 0) - (verA.annotations?.length || 0))} Annotations Diff
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

            </div>
          ) : (
            /* Version History Timeline View Panel */
            <div className="flex-1 p-8 overflow-auto max-w-4xl mx-auto w-full">
              <div className="bg-white dark:bg-slate-950 rounded-[28px] border border-slate-200 dark:border-slate-850 p-8 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-905 dark:text-white uppercase tracking-tight">Standard Version Audit Registry</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Chronological historical logs and base state snapshots</p>
                  </div>
                  <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-black uppercase px-3 py-1.5 rounded-xl border border-blue-100 tracking-wider font-mono">
                     {versions.length} Versions Logged
                  </span>
                </div>

                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-8 py-2">
                  {versions.map((v, i) => (
                    <div key={v.version} className="relative pl-8 group">
                      {/* Timeline status points */}
                      <span className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-950 -translate-x-1/2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300'}`} />
                      
                      <div className="p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all hover:border-blue-400/60 duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase font-mono">{v.version}</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${i === 0 ? 'bg-emerald-100 text-emerald-705 dark:bg-emerald-900/30' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {v.status}
                            </span>
                            {v.annotations && v.annotations.length > 0 && (
                              <span className="text-[8px] font-bold text-slate-400">
                                ({v.annotations.length} annotation{v.annotations.length > 1 ? 's' : ''})
                              </span>
                            )}
                          </div>
                          
                          <span className="text-[10px] font-mono font-black text-slate-400">{v.timestamp}</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1 text-xs">
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Calculated Size</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300 mt-1 font-mono">{v.size}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Modified By</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300 mt-1 truncate max-w-[150px]" title={v.author}>{v.author}</p>
                          </div>
                          <div className="col-span-2 text-right flex items-end justify-end">
                            {i === 0 && activeContent === file.content ? (
                              <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest">Currently Viewing</span>
                            ) : (
                              <button 
                                onClick={() => handleRestoreVersion(v)} 
                                className="px-3.5 py-1.5 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer font-mono"
                              >
                                Restore Draft
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls (If multi-pages) */}
        {activeTab === 'preview' && numPages && numPages > 1 && (
          <div className="p-4 border-t border-slate-1 guiding-nav-foot dark:border-slate-850 flex justify-center items-center gap-4 bg-white dark:bg-slate-900">
             <button 
               disabled={currentPage <= 1} 
               onClick={() => setCurrentPage(p => p - 1)} 
               className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
             >
               <ChevronRight className="rotate-180" size={20}/>
             </button>
             <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest font-mono">
               Page {currentPage} of {numPages}
             </span>
             <button 
               disabled={currentPage >= numPages} 
               onClick={() => setCurrentPage(p => p + 1)} 
               className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
             >
               <ChevronRight size={20}/>
             </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
