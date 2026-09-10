import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, X, ChevronRight, Volume2, HelpCircle, Settings } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface VoiceDictationWidgetProps {
  lang: "en" | "gu" | "hi" | any;
}

export default function VoiceDictationWidget({ lang: appLang }: VoiceDictationWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeElement, setActiveElement] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [activeFieldName, setActiveFieldName] = useState<string>("");
  const [dictationLang, setDictationLang] = useState<"en" | "gu" | "hi">(appLang === "gu" ? "gu" : "en");
  const [recognition, setRecognition] = useState<any>(null);
  const [supported, setSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");

  const recognitionRef = useRef<any>(null);

  // Synchronize dictation language with app language when app language changes
  useEffect(() => {
    setDictationLang(appLang === "gu" ? "gu" : "en");
  }, [appLang]);

  // Track currently active input field
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA") &&
        !(el as HTMLInputElement).readOnly &&
        !(el as HTMLInputElement).disabled &&
        (el as HTMLInputElement).type !== "file" &&
        (el as HTMLInputElement).type !== "checkbox" &&
        (el as HTMLInputElement).type !== "radio"
      ) {
        setActiveElement(el as HTMLInputElement | HTMLTextAreaElement);

        // Try to get a human-readable name or label
        const id = el.id;
        let labelText = "";
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) labelText = label.textContent || "";
        }
        if (!labelText) {
          labelText = el.getAttribute("placeholder") || el.getAttribute("name") || el.getAttribute("aria-label") || "Text Field";
        }
        setActiveFieldName(labelText.trim().replace(/\s*:\s*$/, "").replace(/\s*\*$/, ""));
      }
    };

    const handleBlur = () => {
      // Small delay to check if another element got focus
      setTimeout(() => {
        const el = document.activeElement;
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
          // Still in an input, will be handled by focus
        } else {
          // No input active
        }
      }, 100);
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    // Initial check
    handleFocus(new FocusEvent("focusin"));

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, []);

  // Initialize Speech Recognition when language changes
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;

    if (dictationLang === "gu") {
      rec.lang = "gu-IN";
    } else if (dictationLang === "hi") {
      rec.lang = "hi-IN";
    } else {
      rec.lang = "en-IN";
    }

    rec.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };

    rec.onresult = (event: any) => {
      let finalSpeech = "";
      let interimSpeech = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalSpeech += event.results[i][0].transcript;
        } else {
          interimSpeech += event.results[i][0].transcript;
        }
      }

      setInterimTranscript(interimSpeech);

      if (finalSpeech) {
        // Retrieve latest active element in case it shifted
        const currentActive = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
        const target = currentActive && (currentActive.tagName === "INPUT" || currentActive.tagName === "TEXTAREA") 
          ? currentActive 
          : activeElement;

        if (target) {
          injectTextIntoInput(target, finalSpeech);
        } else {
          toast.info(
            dictationLang === "gu"
              ? `વાંચેલ લખાણ: "${finalSpeech}" (કૃપા કરીને લખાણવાળા ખાના પર ક્લિક કરો)`
              : `Recognized: "${finalSpeech}" (Please click inside any input field first)`
          );
        }
      }
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition widget error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Microphone access is blocked. Please allow mic permissions in your browser.");
        setIsListening(false);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = rec;
    setRecognition(rec);

    return () => {
      if (rec) {
        try {
          rec.abort();
        } catch (e) {}
      }
    };
  }, [dictationLang, activeElement]);

  // Bulletproof React input injection helper
  const injectTextIntoInput = (el: HTMLInputElement | HTMLTextAreaElement, text: string) => {
    try {
      el.focus();
      const start = el.selectionStart || 0;
      const end = el.selectionEnd || 0;
      const currentValue = el.value;

      // Clean spacing
      const prefix = currentValue.substring(0, start);
      const suffix = currentValue.substring(end);
      const separator = start > 0 && !prefix.endsWith(" ") ? " " : "";
      const textToInsert = separator + text;

      const newValue = prefix + textToInsert + suffix;

      // Programmatic dispatch to trigger React state binding
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

      const setter = el.tagName === "TEXTAREA" ? nativeTextareaValueSetter : nativeInputValueSetter;
      if (setter) {
        setter.call(el, newValue);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        el.value = newValue;
        el.dispatchEvent(new Event("change", { bubbles: true }));
      }

      // Restore cursor position
      const newCursorPos = start + textToInsert.length;
      el.setSelectionRange(newCursorPos, newCursorPos);

      // Flash highlight to show success
      el.classList.add("ring-2", "ring-indigo-500", "duration-150");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-indigo-500");
      }, 400);

    } catch (err) {
      console.error("Failed to inject text:", err);
    }
  };

  const toggleListening = () => {
    if (!supported || !recognition) {
      toast.error("Speech recognition is not supported in this browser. Please try Google Chrome.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        toast.success(
          dictationLang === "gu"
            ? "માઇક્રોફોન ચાલુ છે, બોલવાનું શરૂ કરો..."
            : "Dictation active! Speak naturally..."
        );
      } catch (err) {
        console.warn("Could not start:", err);
      }
    }
  };

  if (!supported) return null;

  return (
    <div className="fixed bottom-[8.5rem] right-4 sm:right-6 z-[100] flex flex-col items-end select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="mb-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl p-4 border border-indigo-500/30 text-left"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20">
                <Sparkles size={11} className="animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest">Hands-Free Dictator</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Target Field Info */}
            <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 mb-3">
              <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-0.5">
                Target Input Field
              </div>
              {activeElement ? (
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{activeFieldName || "Active Input"}</span>
                </div>
              ) : (
                <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <HelpCircle size={12} className="text-indigo-400" />
                  <span>Click inside any form input</span>
                </div>
              )}
            </div>

            {/* Language Selector */}
            <div className="mb-3">
              <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">
                Speech Language
              </div>
              <div className="flex gap-1.5">
                {[
                  { code: "en", label: "English", flag: "🇬🇧" },
                  { code: "gu", label: "ગુજરાતી", flag: "🇮🇳" },
                  { code: "hi", label: "हिन्दी", flag: "🇮🇳" }
                ].map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      if (isListening) {
                        toast.info("Please stop recording before changing language.");
                        return;
                      }
                      setDictationLang(l.code as any);
                    }}
                    className={`flex-1 py-1 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer text-center ${
                      dictationLang === l.code
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                        : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span>{l.flag} {l.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mic Button Block */}
            <div className="flex flex-col items-center justify-center py-4 bg-slate-950/40 border border-slate-800/40 rounded-xl relative overflow-hidden">
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-24 h-24 bg-rose-500 rounded-full animate-ping"></div>
                </div>
              )}

              <button
                onClick={toggleListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all cursor-pointer relative z-10 ${
                  isListening
                    ? "bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                }`}
                title={isListening ? "Stop Dictation" : "Start Dictation"}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              <span className="text-[10px] font-bold uppercase tracking-widest mt-3">
                {isListening ? (
                  <span className="text-rose-400 flex items-center gap-1 animate-pulse">
                    <Volume2 size={12} className="animate-bounce" />
                    Listening... Speak Now
                  </span>
                ) : (
                  <span className="text-slate-400">Press button to dictate</span>
                )}
              </span>

              {/* Live transcript preview */}
              {isListening && (
                <div className="mt-2.5 px-3 max-h-16 overflow-y-auto text-center w-full">
                  <p className="text-[11px] text-slate-300 italic font-medium leading-relaxed">
                    {interimTranscript || "..."}
                  </p>
                </div>
              )}
            </div>

            {/* Tip */}
            <div className="mt-3 text-[9px] text-slate-400 italic text-center font-medium leading-normal">
              💡 Highlight any textbox and your voice will write text directly into it hands-free!
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 cursor-pointer z-40 border ${
          isListening
            ? "bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)] border-rose-400"
            : isOpen
            ? "bg-slate-900 text-white border-indigo-500/40"
            : "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-500/30"
        }`}
        id="global-voice-assistant-btn"
        title="Voice Dictation Assistant (Hands-Free Typing)"
      >
        <Mic size={18} />
      </button>
    </div>
  );
}
