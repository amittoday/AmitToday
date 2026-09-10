import React, { useState } from "react";
import { MessageCircle, Send, X, ShieldCheck, Sparkles, PhoneCall, HelpCircle } from "lucide-react";

interface WhatsAppSupportBubbleProps {
  applicationId?: string;
  supportPhone?: string;
  className?: string;
}

export function WhatsAppSupportBubble({
  applicationId = "",
  supportPhone = "919428123456",
  className = ""
}: WhatsAppSupportBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customAppId, setCustomAppId] = useState(applicationId);
  const [userQuery, setUserQuery] = useState("");

  const formattedAppId = customAppId || applicationId || "N/A";

  const getWhatsAppUrl = () => {
    const text = `Hello Advocate Support Team, I need assistance with my Notary Application ID: ${formattedAppId}.${
      userQuery ? ` Query: ${userQuery}` : ""
    }`;
    return `https://wa.me/${supportPhone}?text=${encodeURIComponent(text)}`;
  };

  const handleOpenWhatsApp = () => {
    window.open(getWhatsAppUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className={`fixed bottom-24 right-4 sm:right-6 z-[100] no-print ${className}`}>
      {/* Expanded Support Popover */}
      {isOpen && (
        <div className="mb-3 w-80 bg-slate-900 border border-slate-700/80 rounded-3xl p-5 shadow-2xl text-slate-100 space-y-4 animate-fadeIn backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <MessageCircle size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                  Advocate WhatsApp Helpdesk
                </h4>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Instant Live Support
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Application Reference ID:
              </label>
              <input
                type="text"
                value={customAppId}
                onChange={(e) => setCustomAppId(e.target.value)}
                placeholder="e.g. NOT-2026-8841"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-amber-400 font-bold outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                Optional Message / Concern:
              </label>
              <textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                rows={2}
                placeholder="Ask about ARN status, notary stamp, fee receipt..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-emerald-500 resize-none text-xs"
              />
            </div>

            <button
              onClick={handleOpenWhatsApp}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Send size={14} /> Open WhatsApp Support
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck size={12} className="text-emerald-400" /> Govt Certified Portal
            </span>
            <span className="font-mono">ID: {formattedAppId}</span>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 p-4 rounded-full shadow-2xl hover:shadow-emerald-500/40 transition-all transform hover:scale-110 cursor-pointer flex items-center justify-center border-2 border-emerald-300/50"
        title="Open WhatsApp Advocate Support"
      >
        <MessageCircle size={26} className="text-slate-950 fill-slate-950" />
        
        {/* Pulsing status ring */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
          <span className="w-2 h-2 bg-slate-950 rounded-full animate-ping" />
        </span>

        {/* Hover Label Pill */}
        <span className="absolute right-full mr-3 bg-slate-900 text-white text-[11px] font-black px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" /> WhatsApp Support ({formattedAppId})
        </span>
      </button>
    </div>
  );
}
