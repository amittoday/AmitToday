import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MessageSquare, Send, Search, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";

export default function ChatsAdmin({ user, lang }: { user: any; lang: string }) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const t = {
    en: {
      title: "Live Support Chats",
      sub: "View and respond to customer live support chat sessions.",
      noChats: "No support chats found yet.",
      searchPlaceholder: "Search user emails...",
      selectUser: "Select a chat from the list to start responding",
      replyPlaceholder: "Type your official reply...",
      send: "Send Reply",
      loading: "Loading chats...",
      refresh: "Refresh Chats",
    },
    gu: {
      title: "લાઇવ સપોર્ટ ચેટ્સ",
      sub: "ગ્રાહકોની લાઇવ સપોર્ટ ચેટ સેશન્સ જુઓ અને તેનો જવાબ આપો.",
      noChats: "હજી સુધી કોઈ સપોર્ટ ચેટ્સ મળી નથી.",
      searchPlaceholder: "વપરાશકર્તા ઇમેઇલ શોધો...",
      selectUser: "પ્રતિસાદ આપવાનું શરૂ કરવા માટે સૂચિમાંથી ચેટ પસંદ કરો",
      replyPlaceholder: "તમારો સત્તાવાર જવાબ લખો...",
      send: "જવાબ મોકલો",
      loading: "ચેટ્સ લોડ થઈ રહી છે...",
      refresh: "ચેટ તાજી કરો",
    },
  }[lang === "gu" ? "gu" : "en"];

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/chats", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.data.success) {
        setChats(res.data.data || []);
      } else {
        toast.error("Failed to load live chats");
      }
    } catch (err: any) {
      console.error("Error fetching chats:", err);
      toast.error("Error fetching support chats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, chats]);

  // Group chats by customer UserEmail
  const userEmails = Array.from(
    new Set(chats.map((m) => m.UserEmail || m.userEmail).filter(Boolean))
  ) as string[];

  const filteredEmails = userEmails.filter((email) =>
    email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserMessages = chats
    .filter(
      (m) =>
        (m.UserEmail || m.userEmail || "").toLowerCase() ===
        (selectedUser || "").toLowerCase()
    )
    .sort((a, b) => {
      const timeA = new Date(a.Timestamp || a.timestamp || a.Time || a.time || 0).getTime();
      const timeB = new Date(b.Timestamp || b.timestamp || b.Time || b.time || 0).getTime();
      if (isNaN(timeA) || isNaN(timeB)) return 0;
      return timeA - timeB;
    });

  const handleSendReply = async () => {
    if (!replyInput.trim() || !selectedUser) return;
    const text = replyInput.trim();
    const time = new Date().toLocaleTimeString();

    // Optimistic local state update to keep UI ultra responsive
    const localNewMsg = {
      ID: "MSG-TEMP-" + Date.now(),
      UserEmail: selectedUser,
      Role: "ai",
      Text: text,
      Time: time,
      Timestamp: new Date().toISOString(),
    };

    setChats((prev) => [...prev, localNewMsg]);
    setReplyInput("");

    try {
      const res = await axios.post(
        "/api/chat/add",
        {
          role: "ai",
          text,
          time,
          targetEmail: selectedUser,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (!res.data.success) {
        toast.error("Failed to deliver message to server");
      }
    } catch (err: any) {
      toast.error("Send reply error: " + err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden" id="live-chats-admin-panel">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tight flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> {t.title}
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
            {t.sub}
          </p>
        </div>
        <button
          onClick={fetchChats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-55 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {t.refresh}
        </button>
      </div>

      <div className="flex h-[600px] divide-x divide-slate-100 dark:divide-slate-800">
        {/* Left Side: Users list */}
        <div className="w-1/3 flex flex-col bg-slate-50/50 dark:bg-slate-950/20">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredEmails.length === 0 ? (
              <p className="text-center text-slate-400 py-10 text-xs font-medium">
                {t.noChats}
              </p>
            ) : (
              filteredEmails.map((email, eIdx) => {
                const count = chats.filter((m) => (m.UserEmail || m.userEmail) === email).length;
                return (
                  <button
                    key={`${email || 'user'}-${eIdx}`}
                    onClick={() => setSelectedUser(email)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center gap-3 group relative cursor-pointer ${
                      selectedUser === email
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/45 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className={`p-2 rounded-full shrink-0 ${selectedUser === email ? "bg-white/10" : "bg-slate-150 dark:bg-slate-800"}`}>
                      <User size={16} className={selectedUser === email ? "text-white" : "text-blue-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-xs truncate uppercase tracking-tight">{email.split("@")[0]}</p>
                      <p className={`text-[10px] truncate mt-0.5 ${selectedUser === email ? "text-blue-100" : "text-slate-400"}`}>{email}</p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${selectedUser === email ? "bg-white text-blue-600" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active conversation thread */}
        <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-900/10">
          {selectedUser ? (
            <>
              {/* Receiver Info Bar */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                    {selectedUser.split("@")[0]}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedUser}</span>
                </div>
              </div>

              {/* Msg Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50 dark:bg-slate-950/20">
                {selectedUserMessages.map((m, i) => {
                  const isUserSender = m.Role === "user" || m.role === "user";
                  return (
                    <div
                      key={m.ID || i}
                      className={`flex flex-col ${isUserSender ? "items-start" : "items-end"}`}
                    >
                      <div
                        className={`max-w-[75%] p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                          isUserSender
                            ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-none font-bold"
                            : "bg-blue-600 text-white rounded-tr-none font-bold"
                        }`}
                      >
                        {m.Text || m.text}
                      </div>
                      <span className="text-[9px] font-black tracking-wider text-slate-400 mt-1 uppercase">
                        {isUserSender ? "CUSTOMER" : "SUPPORT"} • {m.Time || m.time}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Send Controls */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-center">
                <input
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                  placeholder={t.replyPlaceholder}
                  className="flex-1 bg-slate-55 bg-slate-100 dark:bg-slate-800 border-none px-4 py-3.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 dark:text-white"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyInput.trim()}
                  className="bg-blue-600 text-white px-5 py-3.5 rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors flex items-center gap-2 font-black text-[10px] uppercase tracking-wider shrink-0 cursor-pointer"
                >
                  <Send size={12} /> {t.send}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 mb-4 animate-pulse">
                <MessageSquare size={32} />
              </div>
              <p className="font-extrabold uppercase text-xs tracking-widest text-slate-600 dark:text-slate-405 mb-1">{t.title}</p>
              <p className="text-xs text-slate-404 max-w-sm">{t.selectUser}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
