import React, { useState } from "react";
import {
  X,
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Camera,
  Crop,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
} from "lucide-react";
import { ScannerSettings, DEFAULT_SCANNER_SETTINGS } from "../utils/scannerImageUtils";

interface ScannerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ScannerSettings;
  onUpdateSettings: (newSettings: Partial<ScannerSettings>) => void;
  lang?: string;
}

export const ScannerSettingsModal: React.FC<ScannerSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  lang = "en",
}) => {
  const [activeTab, setActiveTab] = useState<"auto-retry" | "capture" | "preview">("auto-retry");
  const [testSampleType, setTestSampleType] = useState<"dim" | "faded" | "standard">("dim");

  if (!isOpen) return null;

  const handleToggleAutoRetry = () => {
    onUpdateSettings({ autoRetryScan: !settings.autoRetryScan });
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SCANNER_SETTINGS);
  };

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
      id="scanner-settings-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] text-left transform transition-all animate-scale-up"
        id="scanner-settings-modal"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 shadow-sm">
              <Sliders size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  {lang === "gu" ? "દસ્તાવેજ સ્કેનર સેટિંગ્સ" : "Document Scanner Settings"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50">
                  AI OCR v2.5
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === "gu"
                  ? "ઑપ્ટિકલ કૅમેરા અને ઑટો-રીટ્રાય સ્કેન પરિમાણો કસ્ટમાઇઝ કરો."
                  : "Configure optical auto-capture, secondary scan retries, and contrast boosts."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              title="Reset to defaults"
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline text-[11px]">Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-100 dark:border-slate-800 gap-2 bg-slate-50/40 dark:bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab("auto-retry")}
            className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "auto-retry"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Sparkles size={14} />
            {lang === "gu" ? "ઑટો-રીટ્રાય સ્કેન" : "Auto-Retry Scan"}
            {settings.autoRetryScan && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("capture")}
            className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "capture"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Camera size={14} />
            {lang === "gu" ? "કૅમેરા અને ક્રોપિંગ" : "Camera & Viewfinder"}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`pb-3 px-3 text-xs font-black transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Eye size={14} />
            {lang === "gu" ? "લાઇવ પૂર્વાવલોકન" : "Live Simulation"}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {activeTab === "auto-retry" && (
            <div className="space-y-5">
              {/* PRIMARY FEATURE TOGGLE: Auto-Retry Scan */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  settings.autoRetryScan
                    ? "bg-gradient-to-br from-indigo-50/90 via-blue-50/50 to-emerald-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-emerald-950/30 border-indigo-300 dark:border-indigo-700/60 shadow-md"
                    : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {lang === "gu" ? "ઑટો-રીટ્રાય સ્કેન સિસ્ટમ" : "Auto-Retry Scan"}
                      </span>
                      {settings.autoRetryScan ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 size={10} /> Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          Disabled
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {lang === "gu"
                        ? "જ્યારે આ સુવિધા સક્રિય હોય, જો દસ્તાવેજ સ્કેન ઓછો વિશ્વાસ અથવા નિષ્ફળતા આપે, તો સિસ્ટમ આપમેળે એડજસ્ટ કરેલ બ્રાઇટનેસ અને કોન્ટ્રાસ્ટ પરિમાણો સાથે સેકન્ડરી સ્કેન કરે છે."
                        : "When enabled, if a document scan returns low confidence or failure, the system automatically performs a secondary scan with adjusted brightness and contrast parameters."}
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <ShieldCheck size={13} className="text-indigo-600 dark:text-indigo-400" />
                        Zero User Retakes Needed
                      </span>
                      <span className="flex items-center gap-1">
                        <Sparkles size={13} className="text-amber-500" />
                        Adaptive Dynamic Boost
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.autoRetryScan}
                    onClick={handleToggleAutoRetry}
                    id="auto-retry-scan-primary-toggle"
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      settings.autoRetryScan ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        settings.autoRetryScan ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* SECONDARY SCAN PARAMETER CONFIGURATION */}
              {settings.autoRetryScan && (
                <div className="space-y-4 bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-2.5">
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                        <Sliders size={13} />
                        Secondary Scan Adjusted Parameters
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Adjust optical filters applied during automatic fallback scanning
                      </p>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Optimization Presets:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ retryBrightness: 125, retryContrast: 145, confidenceThreshold: 70 })
                        }
                        className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border transition text-center ${
                          settings.retryBrightness === 125 && settings.retryContrast === 145
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                        }`}
                      >
                        ⚖️ Balanced (+25% / +45%)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ retryBrightness: 135, retryContrast: 165, confidenceThreshold: 75 })
                        }
                        className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border transition text-center ${
                          settings.retryBrightness === 135 && settings.retryContrast === 165
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                        }`}
                      >
                        💡 High Boost (+35% / +65%)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ retryBrightness: 150, retryContrast: 185, confidenceThreshold: 80 })
                        }
                        className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border transition text-center ${
                          settings.retryBrightness === 150 && settings.retryContrast === 185
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400"
                        }`}
                      >
                        📄 Dim Rescue (+50% / +85%)
                      </button>
                    </div>
                  </div>

                  {/* Brightness Adjustment Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        🔆 Secondary Scan Brightness Level
                      </span>
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                        {settings.retryBrightness}%{" "}
                        <span className="text-[10px] font-medium text-slate-400">
                          (+{settings.retryBrightness - 100}%)
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="180"
                      step="5"
                      value={settings.retryBrightness}
                      onChange={(e) => onUpdateSettings({ retryBrightness: Number(e.target.value) })}
                      id="scanner-retry-brightness-slider"
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>100% (Neutral)</span>
                      <span>125% (Recommended)</span>
                      <span>180% (Extreme)</span>
                    </div>
                  </div>

                  {/* Contrast Adjustment Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        🎚️ Secondary Scan Contrast Intensity
                      </span>
                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
                        {settings.retryContrast}%{" "}
                        <span className="text-[10px] font-medium text-slate-400">
                          (+{settings.retryContrast - 100}%)
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="220"
                      step="5"
                      value={settings.retryContrast}
                      onChange={(e) => onUpdateSettings({ retryContrast: Number(e.target.value) })}
                      id="scanner-retry-contrast-slider"
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>100% (Neutral)</span>
                      <span>145% (Recommended)</span>
                      <span>220% (Sharp B&W)</span>
                    </div>
                  </div>

                  {/* Confidence Trigger Threshold Slider */}
                  <div className="space-y-1 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        🎯 Minimum Confidence Threshold for Auto-Retry
                      </span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                        &lt; {settings.confidenceThreshold}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="85"
                      step="5"
                      value={settings.confidenceThreshold}
                      onChange={(e) => onUpdateSettings({ confidenceThreshold: Number(e.target.value) })}
                      id="scanner-retry-threshold-slider"
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      Scans scoring below {settings.confidenceThreshold}% accuracy will immediately trigger the adjusted secondary scan automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "capture" && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Optical Viewfinder & Framing Preferences
              </h4>

              {/* Auto Detect Scanner Crop */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Crop size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Auto-Detect Document Boundaries
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Scans document perimeter and straightens page perspective
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ autoDetectScanner: !settings.autoDetectScanner })}
                  className={`h-6 w-11 rounded-full transition-colors relative ${
                    settings.autoDetectScanner ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      settings.autoDetectScanner ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Auto Capture Stability Timer */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Camera size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Auto-Capture on Steady Framing
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Snaps photograph automatically when document is held still for 2 seconds
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ autoCapture: !settings.autoCapture })}
                  className={`h-6 w-11 rounded-full transition-colors relative ${
                    settings.autoCapture ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      settings.autoCapture ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Torch Flash Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Camera Torch Flash by Default
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Illuminates paper documents in dim room conditions
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ torchEnabled: !settings.torchEnabled })}
                  className={`h-6 w-11 rounded-full transition-colors relative ${
                    settings.torchEnabled ? "bg-amber-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      settings.torchEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Shutter Sound Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    {settings.shutterSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Audible Shutter Click Sound
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Plays audio confirmation chime on successful scan capture
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ shutterSound: !settings.shutterSound })}
                  className={`h-6 w-11 rounded-full transition-colors relative ${
                    settings.shutterSound ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      settings.shutterSound ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Secondary Scan Parameter Simulator
                </h4>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTestSampleType("dim")}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                      testSampleType === "dim"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    Dim Feed
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestSampleType("faded")}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                      testSampleType === "faded"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    Faded Ink
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1st Scan (Raw Image - Low Contrast) */}
                <div className="p-3.5 bg-slate-100 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
                      <AlertTriangle size={12} /> Primary Scan (Raw)
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">Score: 48% (Low)</span>
                  </div>
                  <div className={`h-28 rounded-xl p-3 flex flex-col justify-center text-[10px] font-serif border ${
                    testSampleType === "dim" ? "bg-stone-800/80 text-stone-500 border-stone-700" : "bg-stone-200 text-stone-400 border-stone-300"
                  }`}>
                    <p className="font-bold">GOVERNMENT IDENTITY CARD</p>
                    <p>Name: AMIT PATEL (Blurry sample)</p>
                    <p>DOB: 14/08/1992 &bull; Reg: 84920482</p>
                  </div>
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
                    ⚠️ Triggered auto-retry (&lt; {settings.confidenceThreshold}%)
                  </p>
                </div>

                {/* 2nd Scan (Adjusted Brightness & Contrast) */}
                <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Secondary Scan (Enhanced)
                    </span>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Score: 98% (Sharp)</span>
                  </div>
                  <div
                    className="h-28 bg-white dark:bg-slate-900 rounded-xl p-3 flex flex-col justify-center text-[10px] font-serif text-slate-900 dark:text-white border border-indigo-200 dark:border-indigo-700 shadow-inner"
                    style={{
                      filter: `brightness(${settings.retryBrightness}%) contrast(${settings.retryContrast}%)`,
                    }}
                  >
                    <p className="font-bold tracking-wide">GOVERNMENT IDENTITY CARD</p>
                    <p className="font-black">Name: AMIT PATEL</p>
                    <p className="font-mono">DOB: 14/08/1992 &bull; Reg: 84920482</p>
                  </div>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-2 font-black flex items-center gap-1">
                    ✨ Auto-Enhanced with +{settings.retryBrightness - 100}% Brightness & +{settings.retryContrast - 100}% Contrast
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <HelpCircle size={13} />
            Settings automatically sync to client storage
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95"
          >
            Done & Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
export default ScannerSettingsModal;
