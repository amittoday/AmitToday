import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { StickyNote, Check, RefreshCw, AlertCircle, ExternalLink, X } from "lucide-react";

interface AdminNotesRowInputProps {
  order: any;
  onUpdateNotes?: () => void;
  onOpenModal?: (order: any) => void;
  compact?: boolean;
  placeholder?: string;
  className?: string;
}

export const extractAndStripDriveLink = (text?: string | null) => {
  if (!text) return { stripped: "", link: null };
  const urlRegex = /(?:https?:\/\/)?(?:drive|docs)\.google\.com[^\s]+/;
  const match = text.match(urlRegex);
  const link = match ? match[0] : null;
  const stripped = text.replace(/([^\n\s]+:\s*)?(?:https?:\/\/)?(?:drive|docs)\.google\.com[^\s]+/g, "").trim();
  return { stripped, link };
};

export const AdminNotesRowInput: React.FC<AdminNotesRowInputProps> = ({
  order,
  onUpdateNotes,
  onOpenModal,
  compact = false,
  placeholder = "Add internal remark...",
  className = "",
}) => {
  const orderId = order?.orderId || order?.OrderID || order?.ID || "";
  const rawNote = order?.notes || order?.Notes || "";
  const { stripped: originalNote, link: driveLink } = extractAndStripDriveLink(rawNote);

  const [value, setValue] = useState(originalNote);
  const [isFocused, setIsFocused] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with incoming order changes if not currently focused with unsaved edits
  useEffect(() => {
    if (!isFocused && saveStatus !== "dirty") {
      setValue(originalNote);
      setSaveStatus("idle");
    }
  }, [originalNote, isFocused, saveStatus]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleSave = async () => {
    if (!orderId) return;
    const trimmedVal = value.trim();
    if (trimmedVal === originalNote && saveStatus !== "error") {
      setSaveStatus("idle");
      return;
    }

    // Reconstruct full notes preserving drive link if present
    const fullNoteToSave = driveLink
      ? trimmedVal
        ? `${trimmedVal} ${driveLink}`
        : driveLink
      : trimmedVal;

    setSaveStatus("saving");
    try {
      const res = await axios.post("/api/orders/update-notes", {
        orderId,
        notes: fullNoteToSave,
      });

      if (res.data && (res.data.success || res.data.simulated)) {
        // Update order in place
        order.notes = fullNoteToSave;
        order.Notes = fullNoteToSave;
        setSaveStatus("saved");
        toast.success(`Note saved for #${orderId}`);
        if (onUpdateNotes) {
          onUpdateNotes();
        }
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 2200);
      } else {
        setSaveStatus("error");
        toast.error(res.data?.error || "Failed to save note");
      }
    } catch (err: any) {
      setSaveStatus("error");
      toast.error(err.response?.data?.error || err.message || "Failed to save note");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      handleSave();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setValue(originalNote);
      setSaveStatus("idle");
      inputRef.current?.blur();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (value.trim() !== originalNote) {
      handleSave();
    } else {
      setSaveStatus("idle");
    }
  };

  const isDirty = value !== originalNote;

  return (
    <div 
      className={`relative flex items-center group/note ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className={`relative flex items-center w-full transition-all duration-200 rounded-xl border ${
          isFocused 
            ? "border-blue-500 bg-white dark:bg-slate-900 ring-2 ring-blue-500/20 shadow-sm"
            : isDirty
            ? "border-amber-400 bg-amber-50/30 dark:bg-amber-950/20"
            : saveStatus === "saved"
            ? "border-emerald-400 bg-emerald-50/25 dark:bg-emerald-950/20"
            : saveStatus === "error"
            ? "border-rose-400 bg-rose-50/25 dark:bg-rose-950/20"
            : "border-slate-200/90 dark:border-slate-800 bg-slate-50/80 hover:bg-white dark:bg-slate-950/40 dark:hover:bg-slate-900"
        }`}
      >
        {/* Leading Icon */}
        <div className="pl-2.5 pr-1.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <StickyNote 
            size={13} 
            className={`transition-colors ${
              isFocused 
                ? "text-blue-500" 
                : value 
                ? "text-amber-500/80 dark:text-amber-400/80" 
                : "text-slate-400"
            }`} 
          />
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setSaveStatus("dirty");
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          title={value ? `Internal Note: ${value} (Press Enter or click away to save)` : "Type remark & press Enter to save"}
          className={`w-full py-1.5 pr-8 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium outline-none transition-colors ${
            compact ? "text-[11px] py-1" : "text-xs"
          }`}
        />

        {/* Trailing Indicators & Controls */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {/* Status Spinner */}
          {saveStatus === "saving" && (
            <span title="Saving note to system...">
              <RefreshCw size={12} className="animate-spin text-blue-600 dark:text-blue-400" />
            </span>
          )}

          {/* Saved Status Indicator */}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold animate-fadeIn" title="Note saved">
              <Check size={13} className="text-emerald-500" />
            </span>
          )}

          {/* Error Status Indicator */}
          {saveStatus === "error" && (
            <button
              type="button"
              onClick={handleSave}
              className="text-rose-500 hover:text-rose-600 cursor-pointer"
              title="Failed to save. Click to retry."
            >
              <AlertCircle size={13} />
            </button>
          )}

          {/* Quick Clear / Reset if dirty and focused */}
          {isFocused && value && saveStatus !== "saving" && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setValue("");
                setSaveStatus("dirty");
              }}
              className="p-0.5 text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-colors"
              title="Clear text"
            >
              <X size={12} />
            </button>
          )}

          {/* Manual Save Button (shows when modified and not saving) */}
          {isDirty && saveStatus !== "saving" && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
              title="Click or press Enter to save note"
            >
              <Check size={11} strokeWidth={3} />
            </button>
          )}

          {/* Open Modal trigger icon (on hover when idle) */}
          {!isDirty && saveStatus === "idle" && onOpenModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal(order);
              }}
              className="opacity-0 group-hover/note:opacity-100 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-all cursor-pointer"
              title="Open Full Notes Modal"
            >
              <ExternalLink size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotesRowInput;
