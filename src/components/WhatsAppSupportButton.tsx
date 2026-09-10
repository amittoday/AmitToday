import React, { useState, useEffect } from "react";
import axios from "axios";
import { MessageCircle, Send, X, ShieldCheck, Sparkles, PhoneCall } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function WhatsAppSupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("+91 90000 00000");
  const [businessName, setBusinessName] = useState("Amit Online Services");
  const [customMsg, setCustomMsg] = useState("Namaste Amit Online Services! I need guidance regarding my application / government services query.");

  useEffect(() => {
    fetch("/api/config/business-info")
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          if (res.data.LINK_WHATSAPP) {
            setWhatsappNumber(res.data.LINK_WHATSAPP);
          } else if (res.data.BUSINESS_PHONE) {
            setWhatsappNumber(res.data.BUSINESS_PHONE);
          }
          if (res.data.BUSINESS_NAME) {
            setBusinessName(res.data.BUSINESS_NAME);
          }
        }
      })
      .catch(err => console.warn("WhatsApp button business info lookup error:", err));
  }, []);

  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, "");
  const formattedPhone = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;

  const handleLaunchWhatsapp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const encoded = encodeURIComponent(customMsg);
    const targetUrl = `https://wa.me/${formattedPhone || "919000000000"}?text=${encoded}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col items-end" id="persistent-whatsapp-support-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-5 relative overflow-hidden"
            id="whatsapp-chat-popover"
          >
            {/* Header Banner */}
            <div className="bg-emerald-600 dark:bg-emerald-700 -mx-5 -mt-5 p-4 text-white flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
                  <MessageCircle size={22} className="fill-white/20" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">{businessName}</h4>
                  <p className="text-[10px] text-emerald-100 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    Help Desk Online | Instant WhatsApp Response
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                title="Close Support Box"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content Body */}
            <form onSubmit={handleLaunchWhatsapp} className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-[11px]">
                  <ShieldCheck size={14} className="text-emerald-500" /> Official Customer Care Details:
                </p>
                <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  WhatsApp: {whatsappNumber}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Connect directly with our document verification experts for application status, query resolution, and digital delivery.
                </p>
              </div>

              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Draft Pre-filled WhatsApp Message:
                </label>
                <textarea
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-98"
                id="whatsapp-direct-send-btn"
              >
                <Send size={14} /> Open Message in WhatsApp
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Circle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="group relative flex items-center gap-2.5 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl shadow-emerald-600/40 border border-emerald-400/30 cursor-pointer transition-all duration-300"
        id="floating-whatsapp-support-trigger"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <MessageCircle size={22} className="fill-white/20" />
        <span className="text-xs font-black uppercase tracking-wider hidden sm:inline-block pr-1">
          WhatsApp Support
        </span>
      </motion.button>
    </div>
  );
}
