import React, { useState, useEffect } from "react";
import axios from "axios";
import { Mail, Phone, Calendar, Search, RefreshCw, HelpCircle, User } from "lucide-react";
import { toast } from "sonner";

export default function ContactsAdmin({ user, lang }: { user: any; lang: string }) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const t = {
    en: {
      title: "Support Tickets & Queries",
      sub: "Review and manage inquiries posted via the contact form.",
      refresh: "Refresh Tickets",
      searchPlaceholder: "Search tickets by subject, name or email...",
      noTickets: "No support tickets found.",
      name: "Sender Name",
      phone: "Phone Number",
      email: "Email Address",
      subject: "Subject",
      message: "Message",
      date: "Date Submitted",
    },
    gu: {
      title: "સપોર્ટ ટિકિટો અને પ્રશ્નો",
      sub: "સંપર્ક ફોર્મ દ્વારા મોકલેલ પૂછપરછોની સમીક્ષા અને સંચાલન કરો.",
      refresh: "ટિકિટો તાજી કરો",
      searchPlaceholder: "વિષય, નામ અથવા ઇમેઇલ દ્વારા ટિકિટ શોધો...",
      noTickets: "કોઈ સપોર્ટ ટિકિટો મળી નથી.",
      name: "મોકલનારનું નામ",
      phone: "ફોન નંબર",
      email: "ઇમેઇલ સરનામું",
      subject: "વિષય",
      message: "સંદેશ",
      date: "તારીખ",
    },
  }[lang === "gu" ? "gu" : "en"];

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/contacts", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.data.success) {
        setContacts(res.data.data || []);
      } else {
        toast.error("Failed to load support tickets");
      }
    } catch (err: any) {
      console.error("Error fetching admin contacts:", err);
      toast.error("Error loading support tickets: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const filteredContacts = contacts
    .filter((c) => {
      const term = searchTerm.toLowerCase();
      return (
        (c.Name || c.name || "").toLowerCase().includes(term) ||
        (c.Email || c.email || "").toLowerCase().includes(term) ||
        (c.Subject || c.subject || "").toLowerCase().includes(term) ||
        (c.Message || c.message || "").toLowerCase().includes(term)
      );
    })
    .sort(
      (a, b) =>
        new Date(b.Timestamp || b.timestamp || Date.now()).getTime() -
        new Date(a.Timestamp || a.timestamp || Date.now()).getTime()
    );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" id="support-tickets-admin-panel">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tight flex items-center gap-2">
            <HelpCircle className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {t.sub}
          </p>
        </div>
        <button
          onClick={fetchContacts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-55 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {t.refresh}
        </button>
      </div>

      <div className="p-6">
        {/* Search box */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-12 pr-4 py-3.5 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
          />
        </div>

        {/* Content list */}
        {filteredContacts.length === 0 ? (
          <div className="text-center text-slate-400 py-20 font-medium">
            {t.noTickets}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredContacts.map((ticket, index) => {
              const dateVal = ticket.Timestamp || ticket.timestamp;
              const formattedDate = dateVal
                ? new Date(dateVal).toLocaleString()
                : "N/A";
              return (
                <div
                  key={ticket.ID || index}
                  className="p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-800 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Subject */}
                    <div className="flex justify-between items-start gap-2 mb-4 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                      <div>
                        <span className="text-[9px] font-mono font-black px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 rounded-full uppercase">
                          {ticket.ID || "QUERY"}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 mt-2 uppercase tracking-wide">
                          {ticket.Subject || ticket.subject || "No Subject"}
                        </h3>
                      </div>
                    </div>

                    {/* Sender Specs */}
                    <div className="space-y-2 mb-4 text-xs font-bold text-slate-600 dark:text-slate-405">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-blue-500" />
                        <span className="text-slate-805 dark:text-slate-300 font-black">{ticket.Name || ticket.name || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-blue-500" />
                        <span>{ticket.Email || ticket.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-blue-500" />
                        <span>{ticket.Phone || ticket.phone || "N/A"}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-150 dark:border-slate-805 text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed mb-4 whitespace-pre-wrap">
                      {ticket.Message || ticket.message || "No content provided."}
                    </div>
                  </div>

                  {/* Footing: Date */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="flex items-center gap-1.5 uppercase">
                      <Calendar size={12} className="text-blue-400" /> {formattedDate}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
