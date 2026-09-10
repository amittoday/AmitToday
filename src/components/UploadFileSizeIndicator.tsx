import React from "react";
import { AlertTriangle, HardDrive, CheckCircle2, ShieldAlert } from "lucide-react";

interface UploadFileSizeIndicatorProps {
  currentSizeBytes: number;
  maxSizeBytes?: number; // default 50MB
  warningThresholdBytes?: number; // default 40MB (80%)
  fileCount?: number;
  className?: string;
  showDetails?: boolean;
}

export default function UploadFileSizeIndicator({
  currentSizeBytes,
  maxSizeBytes = 50 * 1024 * 1024, // 50MB
  warningThresholdBytes = 40 * 1024 * 1024, // 40MB
  fileCount = 0,
  className = "",
  showDetails = true,
}: UploadFileSizeIndicatorProps) {
  const currentMB = currentSizeBytes / (1024 * 1024);
  const maxMB = maxSizeBytes / (1024 * 1024);
  const percentage = Math.min(100, Math.round((currentSizeBytes / maxSizeBytes) * 100));

  const isWarning = currentSizeBytes >= warningThresholdBytes && currentSizeBytes < maxSizeBytes;
  const isOverLimit = currentSizeBytes >= maxSizeBytes;

  const barColor = isOverLimit
    ? "bg-rose-500"
    : isWarning
    ? "bg-amber-500"
    : percentage > 50
    ? "bg-blue-500"
    : "bg-emerald-500";

  const badgeColor = isOverLimit
    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
    : isWarning
    ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
    : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  return (
    <div
      id="upload-file-size-indicator"
      className={`rounded-2xl border p-3 sm:p-4 transition-all duration-300 ${
        isOverLimit
          ? "border-rose-300 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/30"
          : isWarning
          ? "border-amber-300 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/30 shadow-sm"
          : "border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isOverLimit
                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400"
                : isWarning
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
                : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
            }`}
          >
            {isOverLimit ? (
              <ShieldAlert size={16} />
            ) : isWarning ? (
              <AlertTriangle size={16} />
            ) : (
              <HardDrive size={16} />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Package Size Indicator</span>
              {fileCount > 0 && (
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  ({fileCount} {fileCount === 1 ? "file" : "files"} staged)
                </span>
              )}
            </div>
            {showDetails && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentMB.toFixed(2)} MB of {maxMB} MB limit ({percentage}%)
              </div>
            )}
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${badgeColor}`}>
          {isOverLimit ? (
            <>
              <ShieldAlert size={12} />
              <span>Limit Exceeded</span>
            </>
          ) : isWarning ? (
            <>
              <AlertTriangle size={12} />
              <span>Nearing 50MB Limit</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span>Safe Size</span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden relative">
        <div
          className={`h-full transition-all duration-300 rounded-full ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Warning Alert Note when nearing or exceeding 50MB */}
      {isWarning && !isOverLimit && (
        <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium bg-amber-100/70 dark:bg-amber-950/60 p-2 rounded-xl border border-amber-200 dark:border-amber-800/80">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Warning:</strong> You are approaching the 50MB single-upload ceiling ({currentMB.toFixed(1)}MB / 50MB). Please compress large PDF/scans or upload in separate batches to prevent transmission timeout.
          </span>
        </div>
      )}

      {isOverLimit && (
        <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-rose-800 dark:text-rose-300 font-medium bg-rose-100/70 dark:bg-rose-950/60 p-2 rounded-xl border border-rose-200 dark:border-rose-800/80">
          <ShieldAlert size={14} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <span>
            <strong>Upload Blocked:</strong> Total package size ({currentMB.toFixed(1)}MB) exceeds the 50MB maximum allowable server limit. Remove non-essential files or compress images before submitting.
          </span>
        </div>
      )}
    </div>
  );
}
