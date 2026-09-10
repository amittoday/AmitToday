import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  MicOff,
  Activity,
  Power,
  ShieldAlert,
  ShieldCheck,
  Languages,
  Zap,
  Volume2,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Radio,
  FileText
} from "lucide-react";
import { toast } from "sonner";

interface LiveVoiceSession {
  id: string;
  userName: string;
  language: "Gujarati" | "Hindi" | "English";
  docType: string;
  status: "Active" | "Idle" | "Terminated";
  lastTranscript: string;
  confidence: number;
  durationSeconds: number;
  startedAt: string;
}

export default function AdminVoiceAgentMonitor() {
  const [isMasterKillSwitchActive, setIsMasterKillSwitchActive] = useState<boolean>(() => {
    return localStorage.getItem("aos_voice_agent_kill_switch") === "true";
  });

  const [voiceSessions, setVoiceSessions] = useState<LiveVoiceSession[]>([
    {
      id: "VOX-9201",
      userName: "Ramesh Patel",
      language: "Gujarati",
      docType: "Right to Information (RTI)",
      status: "Active",
      lastTranscript: "મને તાલુકા વિકાસ અધિકારી (TDO) ની ફાઈલ નોટિંગ જોઈએ છે.",
      confidence: 0.96,
      durationSeconds: 142,
      startedAt: new Date(Date.now() - 142000).toLocaleTimeString()
    },
    {
      id: "VOX-9202",
      userName: "Priya Sharma",
      language: "Hindi",
      docType: "Legal Notice for Money Recovery",
      status: "Active",
      lastTranscript: "मैंने 15 लाख का चेक दिया था जो 12 जनवरी को बाउंस हो गया।",
      confidence: 0.98,
      durationSeconds: 88,
      startedAt: new Date(Date.now() - 88000).toLocaleTimeString()
    },
    {
      id: "VOX-9203",
      userName: "Amit Kumar",
      language: "English",
      docType: "Name Change Affidavit",
      status: "Idle",
      lastTranscript: "My name was misspelled as Amit Kumar Sharma in government voter ID.",
      confidence: 0.99,
      durationSeconds: 215,
      startedAt: new Date(Date.now() - 215000).toLocaleTimeString()
    }
  ]);

  const [metrics, setMetrics] = useState({
    totalQueriesHandled: 1248,
    avgRecognitionLatencyMs: 240,
    activeTranscribers: 2,
    accuracyRate: 98.4,
    ttsLatencyMs: 310
  });

  // Toggle Master Kill Switch
  const toggleMasterKillSwitch = () => {
    const nextState = !isMasterKillSwitchActive;
    setIsMasterKillSwitchActive(nextState);
    localStorage.setItem("aos_voice_agent_kill_switch", String(nextState));

    if (nextState) {
      toast.error("⚠️ Master Voice Kill Switch ENGAGED: All real-time Web Speech & AI Voice listeners have been halted across the platform!");
      setVoiceSessions(prev => prev.map(s => ({ ...s, status: "Terminated" })));
      setMetrics(m => ({ ...m, activeTranscribers: 0 }));
    } else {
      toast.success("✅ Master Voice Services RESTORED: Speech Recognition & Audio Feedback are now operational.");
      setMetrics(m => ({ ...m, activeTranscribers: 2 }));
    }
  };

  const handleSimulateNewVoicePulse = () => {
    toast.info("Refreshed live voice agent telemetry streams.");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Master Kill Switch */}
      <div className={`p-6 rounded-3xl border transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        isMasterKillSwitchActive
          ? "bg-red-950/30 border-red-800 text-red-100"
          : "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/50 text-white"
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className={`h-5 w-5 ${isMasterKillSwitchActive ? "text-red-400" : "text-emerald-400 animate-pulse"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
              Live AI Voice Telemetry & Control
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Real-Time Voice Agent Monitoring Console
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Live Web Speech API transcription auditing, speech synthesis telemetry, multilingual voice recognition stats, and platform kill switch.
          </p>
        </div>

        {/* Master Kill Switch Button */}
        <button
          type="button"
          onClick={toggleMasterKillSwitch}
          className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2.5 shadow-lg transition transform active:scale-95 cursor-pointer shrink-0 ${
            isMasterKillSwitchActive
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
              : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30 animate-pulse"
          }`}
        >
          <Power size={18} />
          <span>{isMasterKillSwitchActive ? "RESTORE VOICE SERVICES" : "MASTER KILL SWITCH (HALT VOICE)"}</span>
        </button>
      </div>

      {/* Real-time KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Transcriptions</span>
            <Mic className={`h-4 w-4 ${metrics.activeTranscribers > 0 ? "text-emerald-500" : "text-slate-400"}`} />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.activeTranscribers} Channels
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isMasterKillSwitchActive ? "Disabled by Kill Switch" : "Gujarati & Hindi Active"}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Latency (STT)</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.avgRecognitionLatencyMs} ms
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Web Speech streaming latency</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Recognition Accuracy</span>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.accuracyRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Legal entity extraction score</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Audio TTS Feedback</span>
            <Volume2 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.ttsLatencyMs} ms
          </div>
          <p className="text-[11px] text-slate-400 mt-1">SpeechSynthesis utterance delay</p>
        </div>
      </div>

      {/* Live Stream Transcription Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600 dark:text-blue-400" size={18} />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Live Voice Recognition Stream & Logs
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Streaming (3 Languages)
            </span>
            <button
              onClick={handleSimulateNewVoicePulse}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {voiceSessions.map((session) => (
            <div key={session.id} className="p-4 sm:p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {session.id}
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {session.userName}
                  </span>
                  <span className="text-xs text-slate-400">• {session.docType}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                    <Languages size={12} /> {session.language}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    session.status === "Active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : session.status === "Idle"
                      ? "bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-red-50 text-red-700 border border-red-300 dark:bg-red-950/60 dark:text-red-300"
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>

              {/* Real-time transcribed text */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 mb-2 font-sans">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Latest Real-Time Transcription
                </span>
                "{session.lastTranscript}"
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Confidence Score: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{(session.confidence * 100).toFixed(1)}%</strong></span>
                <span>Active Duration: {session.durationSeconds}s • Started at {session.startedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
