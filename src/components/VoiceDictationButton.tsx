import React, { useState, useEffect } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  lang?: "en" | "gu" | "hi";
  className?: string;
  size?: "sm" | "md";
}

export default function VoiceDictationButton({
  onTranscript,
  lang = "en",
  className = "",
  size = "md"
}: VoiceDictationButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;

    // Set recognition language
    if (lang === "gu") {
      rec.lang = "gu-IN";
    } else if (lang === "hi") {
      rec.lang = "hi-IN";
    } else {
      rec.lang = "en-IN"; // English (India) works great
    }

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
        toast.success(
          lang === "gu"
            ? `વાણીથી લખાયેલ: "${transcript}"`
            : `Transcribed: "${transcript}"`
        );
      }
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error(
          lang === "gu"
            ? "માઇક્રોફોન પરવાનગી નકારી કાઢવામાં આવી છે."
            : "Microphone permission was denied. Please allow mic access."
        );
      } else if (event.error === "no-speech") {
        // Silent timeout, no need to spam error toast
      } else {
        toast.error(
          lang === "gu"
            ? "વાણી ઓળખ નિષ્ફળ ગઈ. ફરી પ્રયાસ કરો."
            : "Speech dictation timed out or failed. Please try again."
        );
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);

    return () => {
      if (rec) {
        try {
          rec.abort();
        } catch (e) {}
      }
    };
  }, [lang, onTranscript]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!supported || !recognition) {
      toast.error(
        lang === "gu"
          ? "તમારા બ્રાઉઝરમાં વોઈસ ટાઇપિંગ સપોર્ટેડ નથી. કૃપા કરીને ક્રોમનો ઉપયોગ કરો."
          : "Voice dictation is not fully supported in this browser. Please try Google Chrome or Edge."
      );
      return;
    }

    if (isListening) {
      try {
        recognition.stop();
      } catch (err) {}
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.warn("Could not start recognition:", err);
      }
    }
  };

  if (!supported) {
    return null;
  }

  const iconSize = size === "sm" ? 11 : 14;

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`flex items-center justify-center shrink-0 transition-all cursor-pointer rounded-xl ${
        isListening
          ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]"
          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
      } ${size === "sm" ? "p-1.5" : "p-2.5"} ${className}`}
      title={
        isListening
          ? lang === "gu"
            ? "સાંભળી રહ્યું છે... બંધ કરવા ક્લિક કરો"
            : "Listening... Click to stop"
          : lang === "gu"
          ? "વોઈસ ડિક્ટેશન શરૂ કરો"
          : "Dictate hands-free"
      }
    >
      {isListening ? (
        <span className="relative flex h-3.5 w-3.5 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <MicOff size={iconSize} className="relative" />
        </span>
      ) : (
        <Mic size={iconSize} />
      )}
    </button>
  );
}
