import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, X, Send, Phone, Mail, ArrowRight, MessageSquare, Clock, ShieldCheck } from "lucide-react";
import { catalog, servicesList, businessProfile } from "../AppControlContext";

interface Message {
  role: "bot" | "user";
  text: string;
  isAction?: boolean;
  actionType?: "track" | "contact";
}

export const SmartChatbot: React.FC<{ lang: string }> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message based on language
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "bot",
          text: lang === "gu"
            ? "નમસ્તે! હું અમિત ઓનલાઈન સર્વિસીસનો સ્માર્ટ આસિસ્ટન્ટ છું. હું તમને લાઈવ ઓર્ડર ટ્રેકિંગ, સરકારી યોજનાઓ, ડોક્યુમેન્ટ અને ફીની માહિતી આપી શકું છું. હું તમારી શું મદદ કરી શકું?"
            : "Hello! I am the Smart Assistant of Amit Online Services. I can help you with live order tracking, government schemes, fees, and document information. How can I assist you today?"
        }
      ]);
    }
  }, [lang]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Handle opening support chat externally with specific trackingId
  useEffect(() => {
    const handleOpenSupportChat = (e: any) => {
      const trackingId = e.detail?.trackingId;
      setIsOpen(true);
      if (trackingId) {
        setMessages((prev) => [
          ...prev,
          {
            role: "user",
            text: lang === "gu" ? `મને ઓર્ડર ${trackingId} માટે મદદ જોઈએ છે` : `I need help with order ${trackingId}`
          },
          {
            role: "bot",
            text: lang === "gu"
              ? `ઓર્ડર ID: ${trackingId} માટે સપોર્ટ પૂછપરછ શરૂ કરવામાં આવી છે. અમારા એસોસિએટ ટૂંક સમયમાં તમારો સંપર્ક કરશે.`
              : `A support query has been initiated for Order ID: ${trackingId}. Our associate will get back to you shortly.`
          }
        ]);
      }
    };

    window.addEventListener("open-support-chat", handleOpenSupportChat);
    return () => {
      window.removeEventListener("open-support-chat", handleOpenSupportChat);
    };
  }, [lang]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    if (!textToSend) {
      setInput("");
    }

    // Add user message
    const newMessages = [...messages, { role: "user", text } as Message];
    setMessages(newMessages);

    // Generate response
    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      setMessages((prev) => [...prev, botResponse]);
    }, 600);
  };

  const generateBotResponse = (userText: string): Message => {
    const cleanText = userText.toLowerCase().trim();

    // 1. Contact Info check
    if (
      cleanText.includes("contact") ||
      cleanText.includes("phone") ||
      cleanText.includes("email") ||
      cleanText.includes("સંપર્ક") ||
      cleanText.includes("મોબાઈલ") ||
      cleanText.includes("નંબર") ||
      cleanText.includes("ઇમેઇલ") ||
      cleanText.includes("નંબર")
    ) {
      return {
        role: "bot",
        text: lang === "gu"
          ? `📞 સંપર્ક વિગતો:\n\n• ફોન નંબર: ${businessProfile.phone}\n• ઇમેઇલ: ${businessProfile.email}\n• ઓફિસ સરનામું: ${businessProfile.address}\n\nતમે ગમે ત્યારે અમને સંપર્ક કરી શકો છો!`
          : `📞 Contact Information:\n\n• Phone: ${businessProfile.phone}\n• Email: ${businessProfile.email}\n• Address: ${businessProfile.address}\n\nFeel free to reach out to us anytime!`,
        isAction: true,
        actionType: "contact"
      };
    }

    // 2. Order Tracking check
    if (
      cleanText.includes("order") ||
      cleanText.includes("track") ||
      cleanText.includes("ટ્રેક") ||
      cleanText.includes("ઓર્ડર") ||
      cleanText.includes("સ્ટેટસ")
    ) {
      return {
        role: "bot",
        text: lang === "gu"
          ? "🔍 ઓર્ડર ટ્રેકિંગ વિજેટ હોમ પેજ પર ઉપલબ્ધ છે. તમે તમારા રજીસ્ટર્ડ મોબાઈલ નંબર અથવા ઓર્ડર આઈડી વડે લાઈવ સ્ટેટસ ચેક કરી શકો છો. નીચેના બટન પર ક્લિક કરીને સીધા ટ્રેકિંગ વિભાગ પર જાઓ."
          : "🔍 Live tracking is available on the home page. You can check your status using your registered mobile number or Order ID. Click the button below to go directly to the tracking section.",
        isAction: true,
        actionType: "track"
      };
    }

    // 3. Service / Catalog inquiries
    // If asking for list of services/schemes
    if (
      cleanText.includes("scheme") ||
      cleanText.includes("services") ||
      cleanText.includes("યોજનાઓ") ||
      cleanText.includes("લિસ્ટ") ||
      cleanText.includes("યાદી") ||
      cleanText.includes("સેવાઓ") ||
      cleanText.includes("કામ")
    ) {
      const listStr = servicesList
        .map((s, idx) => `${idx + 1}. ${s.ServiceName} (સરકારી ફી: ${s.GovFee}, ચાર્જ: ${s.ServiceCharge})`)
        .join("\n");

      return {
        role: "bot",
        text: lang === "gu"
          ? `📋 લોકપ્રિય સેવાઓ અને ફીની યાદી:\n\n${listStr}\n\nવધુ માહિતી માટે સેવાનું નામ લખો!`
          : `📋 Popular Services & Fees:\n\n${listStr}\n\nType a service name for more specific details!`
      };
    }

    // Search specifically in servicesList
    const matchedServices = servicesList.filter((s) => {
      const serviceNameLower = s.ServiceName.toLowerCase();
      // Look for matches of keywords
      return (
        cleanText.split(" ").some(word => word.length > 2 && serviceNameLower.includes(word)) ||
        serviceNameLower.includes(cleanText) ||
        (cleanText.includes("jamin") && serviceNameLower.includes("jamin")) ||
        (cleanText.includes("આવક") && serviceNameLower.includes("income")) ||
        (cleanText.includes("નકશા") && serviceNameLower.includes("map")) ||
        (cleanText.includes("જમીન") && serviceNameLower.includes("jamin")) ||
        (cleanText.includes("scholarship") && serviceNameLower.includes("scholarship")) ||
        (cleanText.includes("caste") && serviceNameLower.includes("caste")) ||
        (cleanText.includes("ration") && serviceNameLower.includes("ration"))
      );
    });

    if (matchedServices.length > 0) {
      const matchDetails = matchedServices
        .map(
          (s) =>
            `📌 **${s.ServiceName}**\n• સરકારી ફી (Gov Fee): ${s.GovFee}\n• સર્વિસ ચાર્જ (Service Charge): ${s.ServiceCharge}\n• કેટેગરી: ${s.Category}`
        )
        .join("\n\n");

      return {
        role: "bot",
        text: lang === "gu"
          ? `🔍 અમને નીચેની માહિતી મળી છે:\n\n${matchDetails}\n\nતમે હોમ પેજ પર આ સેવાની અરજી શરૂ કરી શકો છો.`
          : `🔍 Here is what we found:\n\n${matchDetails}\n\nYou can apply for this service directly from the home page.`
      };
    }

    // Default Fallback Response
    return {
      role: "bot",
      text: lang === "gu"
        ? "હું તમારી પૂછપરછ સમજી રહ્યો છું, પણ તેના વિશે ચોક્કસ માહિતી મળી નથી. કૃપા કરીને નીચે આપેલા ક્વિક એક્શન ચિપ્સમાંથી કોઈ એક પસંદ કરો અથવા સંપર્ક, યોજનાઓ અથવા ઓર્ડર ટ્રેકિંગ વિશે પૂછો."
        : "I understand your query, but couldn't find specific details. Please use one of the quick action buttons below or ask about contact details, services catalog, or order tracking."
    };
  };

  const handleAction = (type: "track" | "contact") => {
    if (type === "track") {
      setIsOpen(false);
      const el = document.getElementById("advanced-order-tracking-widget");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Flash visual highlight
        el.classList.add("ring-4", "ring-blue-500", "ring-opacity-50");
        setTimeout(() => {
          el.classList.remove("ring-4", "ring-blue-500", "ring-opacity-50");
        }, 2000);
      }
    } else {
      // scroll to footer contact info
      setIsOpen(false);
      const el = document.getElementById("footer-contact-info") || document.getElementById("footer");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer border border-white/20"
        aria-label="Smart Assistant Chatbot"
        id="smart-chatbot-fab"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Bot size={24} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-blue-600 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-blue-600 rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 w-[360px] md:w-[400px] h-[520px] bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-150 dark:border-slate-800 flex flex-col z-50 overflow-hidden"
            id="smart-chatbot-panel"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <Bot size={22} className="text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight">
                    {lang === "gu" ? "સ્માર્ટ આસિસ્ટન્ટ" : "Smart Assistant"}
                  </h3>
                  <p className="text-[10px] text-blue-100 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse" />
                    {lang === "gu" ? "ઓનલાઈન (મદદ માટે તૈયાર)" : "Online (Ready to Help)"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body & Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 dark:bg-slate-950 scrollbar-thin">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 max-w-[85%] ${
                    msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  {msg.role === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-50/50">
                      <Bot size={14} />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed font-bold shadow-sm whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-850 rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.isAction && msg.actionType === "track" && (
                      <button
                        onClick={() => handleAction("track")}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 dark:text-blue-400 text-[11px] font-black tracking-wider uppercase py-2 px-4 rounded-xl border border-blue-100 dark:border-blue-900/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-102"
                      >
                        <Clock size={12} />
                        {lang === "gu" ? "ઓર્ડર ટ્રેકિંગ પર જાઓ" : "Go to Tracking"}
                        <ArrowRight size={12} />
                      </button>
                    )}

                    {msg.isAction && msg.actionType === "contact" && (
                      <button
                        onClick={() => handleAction("contact")}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 dark:text-emerald-400 text-[11px] font-black tracking-wider uppercase py-2 px-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-102"
                      >
                        <Phone size={12} />
                        {lang === "gu" ? "અમારો સંપર્ક કરો" : "Contact Us Now"}
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Chips Wrapper */}
            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-850 overflow-x-auto flex gap-2 scrollbar-none shrink-0">
              <button
                onClick={() => handleSend(lang === "gu" ? "યોજનાઓ જાણો" : "Popular Services")}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] font-extrabold text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                {lang === "gu" ? "📋 યોજનાઓ જાણો" : "📋 Learn Schemes"}
              </button>
              <button
                onClick={() => handleSend(lang === "gu" ? "મારો ઓર્ડર" : "Track My Order")}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] font-extrabold text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                {lang === "gu" ? "🔍 મારો ઓર્ડર" : "🔍 Track Order"}
              </button>
              <button
                onClick={() => handleSend(lang === "gu" ? "સંપર્ક વિગત" : "Contact Details")}
                className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[11px] font-extrabold text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                {lang === "gu" ? "📞 સંપર્ક વિગત" : "📞 Contact Details"}
              </button>
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-4 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 flex gap-2 items-center shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === "gu" ? "પ્રશ્ન પૂછો અહીં..." : "Ask a question here..."}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-600 dark:text-white transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
