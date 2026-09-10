import React, { useState, useEffect, useRef } from "react";
import { 
  FileText, Highlighter, Edit2, Download, Trash2, Check, Sparkles, 
  Move, Circle, History, RotateCw, Search, Loader2, Underline as UnderlineIcon, 
  Cloud, CloudOff, Save, MessageSquare, ChevronRight, ChevronLeft, X, HelpCircle, PenTool
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import DigitalSignaturePad from "./DigitalSignaturePad";

interface PdfViewerProps {
  fileUrl: string;
  documentId?: string;
  initialAnnotations?: string | Annotation[];
  onSaveAnnotations?: (annotations: Annotation[]) => void;
  userToken?: string;
}

export const cleanDriveUrl = (url: string): string => {
  if (!url) return "";
  let cleaned = url.trim();
  if (cleaned.includes("drive.google.com")) {
    cleaned = cleaned.replace(/\/view(\?.*)?$/, "/preview");
    cleaned = cleaned.replace(/\/view\?usp=sharing$/, "/preview");
    if (!cleaned.includes("/preview") && cleaned.includes("/d/")) {
      const parts = cleaned.split("/");
      const dIndex = parts.indexOf("d");
      if (dIndex !== -1 && parts[dIndex + 1]) {
        const fileId = parts[dIndex + 1].split(/[?#]/)[0];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
  }
  return cleaned;
};

interface Annotation {
  id: string;
  type: "highlight" | "pen" | "text" | "freehand" | "underline" | "comment" | "signature";
  points?: { x: number; y: number }[];
  text?: string;
  dataUrl?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color: string;
  page?: number;
  timestamp?: string;
}

export default function PdfViewer({ 
  fileUrl, 
  documentId, 
  initialAnnotations, 
  onSaveAnnotations,
  userToken 
}: PdfViewerProps) {
  const embedUrl = cleanDriveUrl(fileUrl);
  const [activeTool, setActiveTool] = useState<"none" | "highlight" | "pen" | "text" | "freehand" | "underline" | "comment">("none");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentVersion, setCurrentVersion] = useState<"original" | "annotated">("annotated");
  const [brushColor, setBrushColor] = useState<string>("#fef08a"); // Default semi-transparent yellow
  const [showSummaryTip, setShowSummaryTip] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "unsaved" | "error">("synced");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  
  // Comment Popup state
  const [commentPopup, setCommentPopup] = useState<{ x: number; y: number } | null>(null);
  const [commentText, setCommentText] = useState("");

  // Digital Signature Modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);
  const lastSaveTime = useRef<number>(Date.now());

  // Load initial annotations if provided
  useEffect(() => {
    if (initialAnnotations) {
      try {
        if (typeof initialAnnotations === "string") {
          setAnnotations(JSON.parse(initialAnnotations));
        } else if (Array.isArray(initialAnnotations)) {
          setAnnotations(initialAnnotations);
        }
        setSyncStatus("synced");
      } catch (err) {
        console.error("Failed to parse initial annotations:", err);
      }
    } else if (documentId) {
      // Try fetching from server first, fallback to localStorage
      const loadAnnotations = async () => {
        try {
          let token = userToken || localStorage.getItem('aos_token');
          const res = await axios.post("/api/data/collection", {
            tab: "Annotations",
            filterKey: "DocumentID",
            filterValue: documentId
          }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });

          if (res.data?.success && res.data.data && res.data.data.length > 0) {
            const row = res.data.data[0];
            if (row.Annotations) {
              setAnnotations(JSON.parse(row.Annotations));
              setSyncStatus("synced");
              return;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch server annotations, falling back to local storage:", e);
        }

        // Fallback
        let saved = null;
        try {
          saved = localStorage.getItem("annotations_" + documentId);
        } catch (err) {
          console.warn("Failed to read from localStorage:", err);
        }
        if (saved) {
          try {
            setAnnotations(JSON.parse(saved));
            setSyncStatus("synced");
          } catch (e) {
            console.error("Failed to load local annotations:", e);
          }
        } else {
          setAnnotations([]);
        }
      };
      loadAnnotations();
    } else {
      setAnnotations([]);
    }
  }, [initialAnnotations, documentId]);

  // Redraw annotations on the canvas overlay
  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentVersion === "original") {
      return; // Hide all annotations in V1 Original view
    }

    annotations.forEach((ann) => {
      // Highlight focused annotation with a pulsing border
      const isFocused = selectedAnnotationId === ann.id;
      if (isFocused) {
        ctx.save();
        ctx.strokeStyle = "#a855f7"; // purple-500
        ctx.lineWidth = 6;
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#a855f7";
      }

      if (ann.type === "highlight" && ann.points && ann.points.length > 1) {
        ctx.strokeStyle = ann.color || "#fef08a";
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = isFocused ? 0.8 : 0.45; // highlight feel
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else if (ann.type === "underline" && ann.points && ann.points.length > 1) {
        ctx.strokeStyle = ann.color || "#ef4444";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = isFocused ? 1.0 : 0.85;
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else if (ann.type === "pen" && ann.points && ann.points.length > 1) {
        ctx.strokeStyle = ann.color || "#ee1d23";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = isFocused ? 1.0 : 0.9;
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      } else if (ann.type === "freehand" && ann.points && ann.points.length > 1) {
        ctx.strokeStyle = ann.color || "#ef4444";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = isFocused ? 1.0 : 0.95;
        ctx.shadowBlur = isFocused ? 8 : 4;
        ctx.shadowColor = ann.color || "#ef4444";
        
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i].x, ann.points[i].y);
        }
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      } else if ((ann.type === "text" || ann.type === "comment") && ann.x !== undefined && ann.y !== undefined && ann.text) {
        // Draw elegant visual comment bubble pin
        ctx.beginPath();
        ctx.arc(ann.x, ann.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = ann.type === "comment" ? "#f59e0b" : "#3b82f6";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ffffff";
        ctx.stroke();

        ctx.fillStyle = ann.color || "#ffffff";
        ctx.font = "bold 11px sans-serif";
        const textWidth = ctx.measureText(ann.text).width;
        
        ctx.beginPath();
        ctx.fillStyle = isFocused ? "rgba(168, 85, 247, 0.95)" : "rgba(15, 23, 42, 0.85)";
        ctx.roundRect(ann.x + 12, ann.y - 12, textWidth + 10, 20, 6);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.fillText(ann.text, ann.x + 17, ann.y + 2);
      } else if (ann.type === "signature" && ann.dataUrl && ann.x !== undefined && ann.y !== undefined) {
        // Draw digital signature transparent PNG overlay onto preview canvas
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, ann.x!, ann.y!, ann.width || 180, ann.height || 70);
          if (isFocused) {
            ctx.strokeStyle = "#8b5cf6";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(ann.x! - 4, ann.y! - 4, (ann.width || 180) + 8, (ann.height || 70) + 8);
            ctx.setLineDash([]);
          }
        };
        img.src = ann.dataUrl;
      }

      if (isFocused) {
        ctx.restore();
      }
    });
  };

  useEffect(() => {
    drawAnnotations();
  }, [annotations, currentVersion, selectedAnnotationId]);

  // Handle canvas mouse operations
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "none") return;
    const pos = getMousePos(e);

    if (activeTool === "text") {
      const promptText = prompt("સંદર્ભ નોંધ ઉમેરો (Enter annotation note text):");
      if (promptText && promptText.trim() !== "") {
        const newAnn: Annotation = {
          id: "ann-" + Date.now(),
          type: "text",
          text: promptText,
          x: pos.x,
          y: pos.y,
          color: "#ffffff",
          page: 1,
          timestamp: new Date().toLocaleTimeString()
        };
        setAnnotations((prev) => [...prev, newAnn]);
        setSyncStatus("unsaved");
        setCurrentVersion("annotated");
        toast.success("સંદર્ભ નોંધ ઉમેરાઈ! (Note marked!)");
      }
      return;
    }

    if (activeTool === "comment") {
      setCommentPopup({ x: pos.x, y: pos.y });
      return;
    }

    isDrawing.current = true;
    currentPoints.current = [pos];
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || activeTool === "none" || activeTool === "text" || activeTool === "comment") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getMousePos(e);
    currentPoints.current.push(pos);

    // Draw active annotation line temporarily
    drawAnnotations();
    ctx.strokeStyle = activeTool === "highlight" ? brushColor : activeTool === "underline" ? "#ef4444" : activeTool === "freehand" ? "#10b981" : "#ee1d23";
    ctx.lineWidth = activeTool === "highlight" ? 14 : activeTool === "underline" ? 3 : activeTool === "freehand" ? 4 : 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = activeTool === "highlight" ? 0.45 : activeTool === "freehand" ? 0.95 : 0.9;
    
    if (activeTool === "freehand") {
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#10b981";
    }

    ctx.beginPath();
    ctx.moveTo(currentPoints.current[0].x, currentPoints.current[0].y);
    for (let i = 1; i < currentPoints.current.length; i++) {
      ctx.lineTo(currentPoints.current[i].x, currentPoints.current[i].y);
    }
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentPoints.current.length > 1) {
      const newAnn: Annotation = {
        id: "ann-" + Date.now(),
        type: activeTool === "highlight" ? "highlight" : activeTool === "underline" ? "underline" : activeTool === "freehand" ? "freehand" : "pen",
        points: [...currentPoints.current],
        color: activeTool === "highlight" ? brushColor : activeTool === "underline" ? "#ef4444" : activeTool === "freehand" ? "#10b981" : "#ee1d23",
        page: 1,
        timestamp: new Date().toLocaleTimeString()
      };
      setAnnotations((prev) => [...prev, newAnn]);
      setSyncStatus("unsaved");
      setCurrentVersion("annotated");
    }
    currentPoints.current = [];
  };

  const handleSaveAnnotations = async (isAutosave = false) => {
    if (annotations.length === 0 && !isAutosave) {
      toast.error("કોઈ હાઇલાઇટ્સ અથવા નોંધો ઉપલબ્ધ નથી! (No annotations to save!)");
      return;
    }
    setSyncStatus("saving");
    let toastId;
    if (!isAutosave) {
      toastId = toast.loading("હાઇલાઇટ્સ અને સંદર્ભ ચિહ્નો સાચવવામાં આવી રહ્યા છે... (Saving annotations...)");
    }

    try {
      // Save locally to localStorage as draft
      try {
        if (documentId) {
          localStorage.setItem("annotations_" + documentId, JSON.stringify(annotations));
        } else if (fileUrl) {
          localStorage.setItem("annotations_" + fileUrl, JSON.stringify(annotations));
        }
      } catch (storageErr) {
        console.warn("Failed to save to localStorage:", storageErr);
      }

      if (documentId) {
        let token = userToken || localStorage.getItem('aos_token');
        if (!token) {
          const authDefault = axios.defaults.headers?.common?.["Authorization"];
          if (authDefault && typeof authDefault === "string" && authDefault.startsWith("Bearer ")) {
            token = authDefault.substring(7);
          }
        }

        // Save to 'Annotations' tab/sheet
        await axios.post(
          "/api/data/upsert",
          {
            tab: "Annotations",
            data: {
              ID: documentId,
              DocumentID: documentId,
              Annotations: JSON.stringify(annotations),
              UpdatedBy: "Staff/Admin",
              Timestamp: new Date().toISOString()
            },
            idKey: "ID"
          },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          }
        );

        setSyncStatus("synced");
        lastSaveTime.current = Date.now();
        
        if (!isAutosave) {
          toast.success("તમામ દસ્તાવેજ હાઇલાઇટ્સ અને સંદર્ભ ચિહ્નો ડેટાબેઝમાં સાચવવામાં આવ્યા છે! (All annotations saved successfully!)", { id: toastId });
        }
        if (onSaveAnnotations) {
          onSaveAnnotations(annotations);
        }
      } else {
        setSyncStatus("synced");
        if (!isAutosave) {
          toast.success("તમામ દસ્તાવેજ હાઇલાઇટ્સ અને સંદર્ભ ચિહ્નો સ્થાનિક રીતે સંગ્રહિત કરવામાં આવ્યા છે! (All document annotations saved locally!)", { id: toastId });
        }
        if (onSaveAnnotations) {
          onSaveAnnotations(annotations);
        }
      }
    } catch (err: any) {
      console.error("Failed to save annotations:", err);
      setSyncStatus("error");
      if (!isAutosave) {
        toast.error("ડેટાબેઝમાં સાચવવામાં ભૂલ આવી: " + (err.response?.data?.error || err.message || "Error saving to database"), { id: toastId });
      }
    }
  };

  // Autosave: Trigger save after 10 seconds of inactivity
  useEffect(() => {
    if (annotations.length === 0) return;
    setSyncStatus("unsaved");

    const timer = setTimeout(() => {
      handleSaveAnnotations(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [annotations]);

  // Resize canvas overlay relative to container sizing
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        drawAnnotations();
      }
    };
    handleResize();

    const observer = new ResizeObserver(handleResize);
    if (canvasRef.current?.parentElement) {
      observer.observe(canvasRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, [fileUrl, isSidebarOpen]);

  // Handle adding text note from popup
  const saveCommentPopup = () => {
    if (!commentPopup || !commentText.trim()) return;
    const newAnn: Annotation = {
      id: "ann-" + Date.now(),
      type: "comment",
      text: commentText.trim(),
      x: commentPopup.x,
      y: commentPopup.y,
      color: "#ffffff",
      page: 1,
      timestamp: new Date().toLocaleTimeString()
    };
    setAnnotations((prev) => [...prev, newAnn]);
    setSyncStatus("unsaved");
    setCurrentVersion("annotated");
    setCommentPopup(null);
    setCommentText("");
    toast.success("ટિપ્પણી ઉમેરાઈ! (Comment anchored!)");
  };

  const deleteAnnotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    setSyncStatus("unsaved");
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
    toast.success("નોંધ રદ કરાઈ! (Annotation deleted!)");
  };

  return (
    <div className="w-full flex flex-col space-y-3.5" id="pdf-viewer-interactive-module">
      
      {/* Version History & Sync Status Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm select-none">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <History size={16} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
              Document Versions (આવૃત્તિ ઇતિહાસ)
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Toggle to compare original versus annotated view
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Sync Status Badge Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold">
            {syncStatus === "synced" && (
              <>
                <Cloud size={14} className="text-green-500 animate-pulse" />
                <span className="text-green-600 dark:text-green-400">Synced to Cloud</span>
              </>
            )}
            {syncStatus === "saving" && (
              <>
                <Loader2 size={14} className="text-blue-500 animate-spin" />
                <span className="text-blue-600 dark:text-blue-400">Autosaving...</span>
              </>
            )}
            {syncStatus === "unsaved" && (
              <>
                <CloudOff size={14} className="text-yellow-500" />
                <span className="text-yellow-600 dark:text-yellow-400">Unsaved Changes (10s auto)</span>
              </>
            )}
            {syncStatus === "error" && (
              <>
                <CloudOff size={14} className="text-red-500" />
                <span className="text-red-600 dark:text-red-400">Sync Failed</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSaveAnnotations(false)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase transition shadow-sm cursor-pointer"
            title="Force Save Annotations now"
          >
            <Save size={13} />
            <span>Force Save</span>
          </button>

          <div className="flex items-center bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-150 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setCurrentVersion("original");
                toast.info("મૂળ દસ્તાવેજ જુઓ (Showing original document without corrections)");
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                currentVersion === "original"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Original
            </button>
            
            <button
              type="button"
              onClick={() => {
                setCurrentVersion("annotated");
                toast.info("ચિહ્નિત દસ્તાવેજ જુઓ (Showing annotated corrections)");
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                currentVersion === "annotated"
                  ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Annotated ({annotations.length})
            </button>
          </div>

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Toggle Annotations Sidebar"
          >
            <MessageSquare size={14} />
            <span>{isSidebarOpen ? "Hide Drawer" : "Show Drawer"}</span>
          </button>
        </div>
      </div>

      {/* Main interactive split container (Sidebar + Viewport Canvas) */}
      <div className="flex flex-col lg:flex-row gap-4 w-full h-[600px] overflow-hidden" id="pdf-viewer-interactive-canvas-container">
        
        {/* Scrollable Annotations Sidebar / Log Drawer */}
        {isSidebarOpen && (
          <div className="w-full lg:w-80 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-500" />
                Annotations Log ({annotations.length})
              </span>
              <button 
                type="button" 
                onClick={() => setIsSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
              {annotations.length === 0 ? (
                <div className="text-center py-12 px-4 flex flex-col items-center justify-center">
                  <Sparkles className="text-slate-300 dark:text-slate-700 mb-2" size={28} />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No Annotations Yet</p>
                  <p className="text-[10px] text-slate-400 mt-1">Use the floating toolbar tools to highlight, draw freehand, underline or comment.</p>
                </div>
              ) : (
                annotations.map((ann, idx) => (
                  <div
                    key={ann.id}
                    onClick={() => {
                      setSelectedAnnotationId(ann.id);
                      toast.info(`Jumping to annotation #${idx + 1} (${ann.type.toUpperCase()})`);
                    }}
                    className={`p-3 rounded-xl border transition-all text-left cursor-pointer ${
                      selectedAnnotationId === ann.id
                        ? "bg-purple-50/70 border-purple-300 dark:bg-purple-950/15 dark:border-purple-800"
                        : "bg-slate-50/60 hover:bg-slate-50 border-slate-200/80 dark:bg-slate-950/40 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full`} style={{ backgroundColor: ann.color }} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          {ann.type === "comment" ? "💬 COMMENT" : ann.type === "text" ? "📝 NOTE" : `✏️ ${ann.type.toUpperCase()}`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => deleteAnnotation(ann.id, e)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-md"
                        title="Delete Annotation"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    {ann.text ? (
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-3">
                        {ann.text}
                      </p>
                    ) : (
                      <p className="text-[10px] italic text-slate-500 dark:text-slate-400">
                        {ann.type === "freehand" ? "Freehand sketch outline" : ann.type === "underline" ? "Underline mark" : "Highlight annotation mark"}
                      </p>
                    )}

                    <div className="mt-2 pt-1.5 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Page {ann.page || 1}</span>
                      <span>{ann.timestamp || "Active Session"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PDF Viewport Sandbox Box with interactive Overlay Drawing Canvas */}
        <div className="flex-1 h-full rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-md bg-slate-100 dark:bg-slate-950 group">
          
          {/* Floating Tool Option Toolbar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl flex items-center gap-2.5 shadow-2xl border border-slate-850">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1.5">
              Annotations Tool:
            </span>

            {/* Highlight Tool */}
            <button
              type="button"
              onClick={() => {
                setActiveTool(activeTool === "highlight" ? "none" : "highlight");
                setCurrentVersion("annotated");
              }}
              className={`p-2 rounded-xl transition ${
                activeTool === "highlight"
                  ? "bg-yellow-500 text-slate-950"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="Highlight Tool"
            >
              <Highlighter size={15} />
            </button>

            {/* Underline Tool */}
            <button
              type="button"
              onClick={() => {
                setActiveTool(activeTool === "underline" ? "none" : "underline");
                setCurrentVersion("annotated");
              }}
              className={`p-2 rounded-xl transition ${
                activeTool === "underline"
                  ? "bg-red-500 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="Underline Tool"
            >
              <UnderlineIcon size={15} />
            </button>

            {/* Freehand Tool */}
            <button
              type="button"
              onClick={() => {
                setActiveTool(activeTool === "freehand" ? "none" : "freehand");
                setCurrentVersion("annotated");
              }}
              className={`p-2 rounded-xl transition ${
                activeTool === "freehand"
                  ? "bg-emerald-500 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="Freehand Pen"
            >
              <Edit2 size={15} />
            </button>

            {/* Add Comment Tool */}
            <button
              type="button"
              onClick={() => {
                setActiveTool(activeTool === "comment" ? "none" : "comment");
                setCurrentVersion("annotated");
                toast.info("દસ્તાવેજ પર ક્લિક કરીને ટિપ્પણી નોંધો ઉમેરો (Click anywhere on document canvas to anchor comment popup)");
              }}
              className={`p-2 rounded-xl transition ${
                activeTool === "comment"
                  ? "bg-amber-500 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="Anchor Comment / Note"
            >
              <MessageSquare size={15} />
            </button>

            {/* Draw Digital Signature Tool */}
            <button
              type="button"
              onClick={() => {
                setShowSignatureModal(true);
                setCurrentVersion("annotated");
              }}
              className="p-2 rounded-xl transition bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 flex items-center gap-1"
              title="Draw Digital Signature Pad"
            >
              <PenTool size={15} />
              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Sign</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-700 mx-1" />

            {/* Brush Colors */}
            <div className="flex items-center gap-1">
              {["#fef08a", "#93c5fd", "#86efac", "#fca5a5"].map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setBrushColor(col)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    brushColor === col ? "scale-125 ring-2 ring-indigo-500" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <iframe
            src={embedUrl}
            className="w-full h-full border-none rounded-2xl relative z-10"
            title="Safe Sandbox Document Guidelines Inspector"
            allow="autoplay"
            allowFullScreen
            id="embedded-gsc-pdf-viewer"
          />

          {/* Interactive Annotation overlay Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`absolute inset-0 w-full h-full z-20 ${
              activeTool !== "none" ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
            }`}
          />

          {/* Comment popup form anchored on canvas click */}
          {commentPopup && (
            <div 
              className="absolute z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-2xl w-60 text-left"
              style={{ 
                left: `${(commentPopup.x / (canvasRef.current?.width || 1)) * 100}%`, 
                top: `${(commentPopup.y / (canvasRef.current?.height || 1)) * 100}%`,
                transform: "translate(-50%, -100%)"
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">Anchor New Comment</span>
                <button type="button" onClick={() => setCommentPopup(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={12} />
                </button>
              </div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="ટિપ્પણી નોંધો દાખલ કરો (Add comment content...)"
                rows={3}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="mt-2.5 flex justify-end gap-1.5">
                <button 
                  type="button" 
                  onClick={() => setCommentPopup(null)}
                  className="px-2.5 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={saveCommentPopup}
                  className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-bold"
                >
                  Anchor Comment
                </button>
              </div>
            </div>
          )}

          {/* Tooltip helper overlays */}
          {showSummaryTip && activeTool !== "none" && (
            <div className="absolute bottom-4 left-4 right-4 z-30 bg-yellow-50 dark:bg-yellow-950/90 border border-yellow-200/40 text-[10px] text-yellow-800 dark:text-yellow-400 p-2.5 rounded-xl flex items-center justify-between shadow-lg">
              <p className="font-semibold leading-relaxed">
                ✏️ <strong>સક્રિય સાધન ചિહ્ન:</strong> {
                  activeTool === "freehand" ? "માઉસ વડે ખેંચીને (ડ્રેગ કરીને) ભૂલભરેલા વિસ્તારો અથવા ફીલ્ડ્સની આસપાસ મુક્ત ચિત્ર દોરો." : 
                  activeTool === "underline" ? "શબ્દો અથવા વિગતોને અંડરલાઈન (નીચે રેખા) કરવા ડ્રેગ કરો." :
                  activeTool === "comment" ? "PDF પર ગમે ત્યાં ક્લિક કરો અને ટિપ્પણી પૉપઅપ એન્કર કરવા વિગતો લખો." :
                  "હવે PDF ડિસ્પ્લે વિસ્તારમાં માઉસ દ્વારા ક્લિક અથવા ડ્રેગ કરીને હાઇલાઇટ્સ અથવા નોંધો દોરો અને ચિહ્નિત કરો."
                }
              </p>
              <button type="button" onClick={() => setShowSummaryTip(false)} className="text-yellow-750 font-bold hover:underline px-1.5">✕</button>
            </div>
          )}
          
          {/* Loading display background */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 pointer-events-none z-0">
            <FileText className="text-slate-300 animate-pulse mb-3" size={44} />
            <p className="text-xs text-slate-500 font-bold">સત્તાવાર પીડીએફ દસ્તાવેજ લોડ થઈ રહ્યો છે...</p>
            <p className="text-[10px] text-slate-400 max-w-xs mt-1.5 leading-relaxed">
              If the Google Drive document restrictions block standard rendering, click the "Open in target" button top-right to inspect.
            </p>
          </div>
        </div>
      </div>

      {/* Digital Signature Pad Modal */}
      <DigitalSignaturePad
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onApplySignature={(sigDataUrl) => {
          const newSigAnn: Annotation = {
            id: "sig-" + Date.now(),
            type: "signature",
            dataUrl: sigDataUrl,
            x: 80,
            y: 80,
            width: 180,
            height: 70,
            color: "#1d4ed8",
            page: 1,
            timestamp: new Date().toLocaleTimeString()
          };
          setAnnotations((prev) => [...prev, newSigAnn]);
          setSyncStatus("unsaved");
          setCurrentVersion("annotated");
        }}
      />
    </div>
  );
}
