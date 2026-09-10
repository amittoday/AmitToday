import React, { useState } from "react";
import { Mail, Send, CheckCircle, Loader2 } from "lucide-react";
import axios from "axios";

export default function BlogNewsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setMessage({ type: "error", text: "કૃપા કરીને સાચો ઇમેઇલ દાખલ કરો." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post("/api/blogs/subscribe", { email: email.trim() });
      if (res.data && res.data.success) {
        setMessage({ type: "success", text: res.data.message || "સફળતાપૂર્વક ન્યૂઝલેટર સબ્સ્ક્રાઇબ કર્યું!" });
        setEmail("");
      } else {
        setMessage({ type: "error", text: res.data.error || "સબ્સ્ક્રાઇબ કરવામાં કોઈ ભૂલ આવી." });
      }
    } catch (err: any) {
      console.error("Newsletter Subscription Error:", err);
      const errMsg = err.response?.data?.error || err.message || "સર્વર જોડાણમાં ભૂલ આવી.";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 p-8 sm:p-10 rounded-[32px] bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-left relative overflow-hidden" id="blog-newsletter-section">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        <div className="space-y-2 max-w-md">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Mail size={16} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Newsletter / ન્યૂઝલેટર
            </span>
          </div>
          <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white leading-tight">
            અમારા ન્યૂઝલેટર સાથે જોડાઓ
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">
            નવા આર્ટિકલ્સ, સરકારી યોજનાઓની માહિતી, પરિપત્રો અને મહત્વપૂર્ણ સરકારી સેવાઓની અપડેટ્સ મેળવવા માટે સબ્સ્ક્રાઇબ કરો.
          </p>
        </div>

        <div className="w-full md:w-auto min-w-[280px] sm:min-w-[340px]">
          <form onSubmit={handleSubscribe} className="space-y-3">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-850 focus-within:border-blue-500 dark:focus-within:border-blue-400/50 transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="તમારો ઇમેઇલ દાખલ કરો (e.g. name@example.com)..."
                required
                disabled={loading}
                className="flex-1 bg-transparent border-none text-xs text-slate-900 dark:text-white pl-3.5 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    પ્રક્રિયા...
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send size={11} />
                  </>
                )}
              </button>
            </div>

            {message && (
              <div 
                className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex items-center gap-1.5 animate-fade-in ${
                  message.type === "success" 
                    ? "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30" 
                    : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30"
                }`}
              >
                {message.type === "success" && <CheckCircle size={13} className="shrink-0" />}
                <span>{message.text}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
