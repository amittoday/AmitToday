import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, Check, RotateCcw, PenTool, Sparkles, Move } from "lucide-react";
import { toast } from "sonner";

interface DigitalSignaturePadProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySignature: (signatureDataUrl: string) => void;
  title?: string;
}

export default function DigitalSignaturePad({
  isOpen,
  onClose,
  onApplySignature,
  title = "Draw Digital Signature"
}: DigitalSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState<string>("#1d4ed8"); // Default Royal Blue
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set high display density
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
    }
  }, [isOpen]);

  // Update context properties when color or width changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
    }
  }, [strokeColor, lineWidth]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.closePath();
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    toast.info("Signature pad cleared");
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      toast.error("Please draw your signature first!");
      return;
    }

    // Convert canvas content to transparent PNG Data URL
    const dataUrl = canvas.toDataURL("image/png");
    onApplySignature(dataUrl);
    toast.success("Digital signature applied successfully onto document preview!");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PenTool size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {title}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                Draw smooth signature stroke using mouse or touch pad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs">
          {/* Stroke Colors */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Ink Color:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { name: "Royal Blue", hex: "#1d4ed8" },
                { name: "Black", hex: "#0f172a" },
                { name: "Emerald", hex: "#047857" },
                { name: "Crimson", hex: "#b91c1c" }
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setStrokeColor(c.hex)}
                  title={c.name}
                  className={`w-5 h-5 rounded-full transition-all cursor-pointer border ${
                    strokeColor === c.hex ? "ring-2 ring-offset-1 ring-blue-500 scale-110" : "border-slate-300 dark:border-slate-700"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Stroke Thickness */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Width:
            </span>
            <div className="flex items-center gap-1">
              {[
                { label: "Fine", val: 2 },
                { label: "Medium", val: 3.5 },
                { label: "Bold", val: 5 }
              ].map((w) => (
                <button
                  key={w.val}
                  type="button"
                  onClick={() => setLineWidth(w.val)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-colors cursor-pointer ${
                    lineWidth === w.val
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Signature Drawing Canvas Pad */}
        <div className="relative w-full h-52 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 overflow-hidden shadow-inner flex items-center justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
          />

          {!hasDrawn && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 space-y-1">
              <PenTool size={32} className="opacity-40" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400/80 dark:text-slate-600">
                Sign Here
              </p>
              <div className="w-48 h-[1px] bg-slate-300/80 dark:bg-slate-700/80 my-2" />
              <p className="text-[9px] font-semibold text-slate-400/60">
                X __________________________________________
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            Clear
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!hasDrawn}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              <Check size={14} />
              Overlay Signature
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
