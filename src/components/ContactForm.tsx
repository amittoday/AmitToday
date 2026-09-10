import React, { useState } from "react";
import { Send, CheckCircle, AlertCircle, Clock, Mail, User, MessageSquare } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export interface ContactFormProps {
  onSuccess?: (data: { Timestamp: string; Name: string; Email: string; Message: string }) => void;
  className?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({ onSuccess, className = "" }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [lastSubmission, setLastSubmission] = useState<{
    timestamp: string;
    name: string;
    email: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim();
    const cleanMsg = formData.message.trim();

    if (!cleanName || !cleanEmail || !cleanMsg) {
      toast.error("Please fill in Name, Email, and Message.");
      return;
    }

    setStatus("sending");
    try {
      const res = await axios.post("/api/contact", {
        name: cleanName,
        email: cleanEmail,
        message: cleanMsg
      });

      if (res.data && res.data.success) {
        setStatus("success");
        const submissionTimestamp = res.data.data?.Timestamp || new Date().toISOString();
        setLastSubmission({
          timestamp: submissionTimestamp,
          name: cleanName,
          email: cleanEmail
        });

        toast.success("Message submitted and logged to ContactMessages sheet successfully!");
        setFormData({ name: "", email: "", message: "" });
        if (onSuccess && res.data.data) {
          onSuccess(res.data.data);
        }
      } else {
        setStatus("error");
        toast.error(res.data?.error || "Failed to submit message.");
      }
    } catch (err: any) {
      setStatus("error");
      const msg = err.response?.data?.error || "Network error. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase mb-3">
          <MessageSquare size={13} />
          <span>Contact Amit Online Services</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Send Us a Message
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Have an inquiry, document question, or special service request? Reach out to us below. Submissions are saved directly to our Google Sheet.
        </p>
      </div>

      {status === "success" && lastSubmission && (
        <div className="mb-6 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100 flex items-start gap-3.5 animate-fadeIn">
          <CheckCircle className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-bold">Thank you, {lastSubmission.name}!</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              Your inquiry has been captured and stored in the <strong>ContactMessages</strong> Google Sheet.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
              <Clock size={12} />
              <span>Timestamp: {new Date(lastSubmission.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-900 dark:text-rose-200 flex items-center gap-3 text-sm">
          <AlertCircle className="text-rose-600 shrink-0" size={18} />
          <span>There was an error saving your message. Please verify your details and try again.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="contact-name" className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <User size={13} className="text-emerald-600" />
            <span>Name <span className="text-rose-500">*</span></span>
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            placeholder="Your full name (e.g. Ramesh Patel)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white text-sm"
          />
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="contact-email" className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Mail size={13} className="text-emerald-600" />
            <span>Email <span className="text-rose-500">*</span></span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="Your email address (e.g. ramesh@example.com)"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white text-sm"
          />
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <label htmlFor="contact-message" className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare size={13} className="text-emerald-600" />
            <span>Message <span className="text-rose-500">*</span></span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            placeholder="Describe your inquiry, documents required, or application support..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {status === "sending" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving Message...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Submit Message</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
