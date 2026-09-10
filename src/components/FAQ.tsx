import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  ChevronDown,
  Search,
  ArrowRight,
  MessageSquare,
  Info,
  X
} from "lucide-react";

interface FAQItem {
  category: "General" | "Payments" | "Services" | "Orders & Deliveries" | "Online Government Services";
  categoryGu: string;
  question: string;
  questionGu: string;
  answer: string;
  answerGu: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "Online Government Services",
    categoryGu: "સરકારી સેવાઓ ઓનલાઇન",
    question: "How can I track my government document application status?",
    questionGu: "મારી સરકારી દસ્તાવેજ અરજીની સ્થિતિ (સ્ટેટસ) હું કેવી રીતે ચેક કરી શકું?",
    answer: "You can track your application directly inside our dashboard under 'My Applications' section. Once we review and submit your document to the portal, you will see real-time updates and can enter your tracking reference ID directly.",
    answerGu: "તમે અમારા ડેશબોર્ડ પર 'My Applications' સેક્શનમાં સીધી તમારી અરજીનું ટ્રેકિંગ જોઈ શકો છો. દસ્તાવેજ મેળવ્યા પછી દરેક પ્રક્રિયાના પ્રોગ્રેસ સ્ટેટસ અને સરકારી રેફરન્સ આઈડી રિયલ-ટાઇમમાં અહીં જ મળી જશે."
  },
  {
    category: "Online Government Services",
    categoryGu: "સરકારી સેવાઓ ઓનલાઇન",
    question: "What are the common documents required for applying to online schemes like PAN card or Income Certificate?",
    questionGu: "પાન કાર્ડ અથવા આવકના દાખલા માટે કયા કયા સામાન્ય આઘારો જરૂરી છે?",
    answer: "Usually, Aadhaar Card, PAN Card, electricity bill, and photo proofs are required. Each service card in our Government Services Center has a 'Required Documents' tab with full, verifiable checklists so you know exactly what is needed.",
    answerGu: "સામાન્ય રીતે આધાર કાર્ડ, પાન કાર્ડ, લાઇટ બિલ અને પાસપોર્ટ બિલ જરૂરી છે. અમારા ગવર્મેન્ટ સર્વિસીસ સેન્ટરમાં દરેક સેવા પર ક્લિક કરતાં જ કયા દસ્તાવેજો કઈ સાઈઝ માં અપલોડ કરવા તેની ચોક્કસ ચેકલિસ્ટ મળી જશે."
  },
  {
    category: "Services",
    categoryGu: "સેવાઓ",
    question: "What file types can I upload for translation/typing?",
    questionGu: "ટ્રાન્સલેશન/ટાઇપિંગ સેવાઓ માટે હું કયા પ્રકારની ફાઈલો અપલોડ કરી શકું?",
    answer: "We securely accept image files (JPG, PNG) and PDF documents up to 50MB in size.",
    answerGu: "અમે સુરક્ષિત રીતે ૫૦ MB સુધીની ઇમેજ ફાઇલ (JPG, PNG) અને PDF દસ્તાવેજો સ્વીકારીએ છીએ."
  },
  {
    category: "Payments",
    categoryGu: "ચૂકવણીઓ",
    question: "Are government fees included in the typing and translation services?",
    questionGu: "શું ટાઇપિંગ અને ટ્રાન્સલેશન સેવાના ચાર્જમાં સરકારી સરકારી ફીનો સમાવેશ થાય છે?",
    answer: "No. Typing and Translation services are charged purely based on the word count. Government fees are only applicable to specific 'Government & Online Services' like PAN card or Income Certificates.",
    answerGu: "ના. ટાઇપિંગ અને ટ્રાન્સલેશન સેવાઓનો ચાર્જ સંપૂર્ણપણે શબ્દોની સંખ્યાના આધારે લેવામાં આવે છે. સરકારી ફી માત્ર પાન કાર્ડ અથવા આવકના પ્રમાણપત્રો જેવી સત્તાવાર સરકારી ઓનલાઇન સેવાઓ માટે જ અલગથી ચૂકવવાની રહે છે."
  },
  {
    category: "Payments",
    categoryGu: "ચૂકવણીઓ",
    question: "How secure is my payment and document?",
    questionGu: "મારી સીધી ચુકવણી અને અપલોડ કરેલા દસ્તાવેજો કેટલા સુરક્ષિત છે?",
    answer: "We use Razorpay for 100% secure payments. Your documents are processed using enterprise-grade Google Drive architecture and temporary files are strictly auto-deleted.",
    answerGu: "અમે ચૂકવણી માટે ૧૦૦% સેફ Razorpay ગેટવેનો ઉપયોગ કરીએ છીએ. તમારા દસ્તાવેજો એન્ટરપ્રાઇઝ-ગ્રેડ ગૂગલ ડ્રાઇવ સિસ્ટમ દ્વારા રન થાય છે અને કામચલાઉ ફાઇલો પ્રોગ્રામ દ્વારા તાત્કાલિક આપોઆપ ડિલીટ થઈ જાય છે."
  },
  {
    category: "Orders & Deliveries",
    categoryGu: "ઓર્ડર અને ડિલિવરી",
    question: "Where can I download my final document and invoice?",
    questionGu: "હું મારો ફાઇનલ તૈયાર દસ્તાવેજ અને ટેક્સ ઇન્વૉઇસ ક્યાંથી ડાઉનલોડ કરી શકું?",
    answer: "Once your order status is 'Completed', you can download both the finalized document and the Tax Invoice directly from the 'My Applications' tab in your user dashboard.",
    answerGu: "એકવાર ઓર્ડર સ્ટેટસ 'Completed' થઈ જાય એટલે તમે યુઝર ડેશબોર્ડમાં રહેલા 'My Applications' સેક્શનમાંથી ફાઇનલ પીડીએફ ફાઇલ અને ટેક્સ બિલ ડાયરેક્ટ ડાઉનલોડ કરી શકો છો."
  },
  {
    category: "Services",
    categoryGu: "સેવાઓ",
    question: "What language pairs do you support for translation or typing?",
    questionGu: "કઈ કઈ ભાષાઓમાં તમે ટ્રાન્સલેશન કે ફાસ્ટ ટાઇપિંગ સપોર્ટ પૂરો પાડો છો?",
    answer: "We offer high-fidelity translation and bilingual fast typing services primarily supporting English, Gujarati, and Hindi, along with official government document language formats.",
    answerGu: "અમે ખાસ કરીને ગુજરાતી, અંગ્રેજી અને હિન્દી ભાષામાં હાઇ-ક્વોલિટી ટ્રાન્સલેશન અને સ્પીડ બાયલિંગ્યુઅલ ટાઇપિંગ સર્વિસ પ્રોવાઇડ કરીએ છીએ."
  },
  {
    category: "General",
    categoryGu: "સામાન્ય માહિતી",
    question: "How can I track the real-time progress of my application?",
    questionGu: "મારો ઓર્ડર અત્યારે કયા સ્ટેજ પર પહોંચ્યો છે તે કઈ રીતે જોવું?",
    answer: "Our direct ledger and secure SMS pipeline provide automated updates. You can also view granular, state-by-state timelines and download updates in real-time from the 'Track Order' option.",
    answerGu: "અમારી ડાયરેક્ટ રિયલ-ટાઇમ લેજર કનેક્ટિવિટી અને ઓટોમેટેડ SMS ચેનલ દ્વારા સ્ટેપ-બાય-સ્ટેપ અપડેટ્સ મળતા રહે છે. ઉપરાંત 'Track Order' વિકલ્પમાંથી તમે ક્યાંય પણ લાઈવ પ્રોગ્રેસ જોઈ શકો છો."
  }
];

interface FAQProps {
  onContactClick?: () => void;
  lang?: "en" | "gu" | "hi";
}

export function FAQ({ onContactClick, lang = "en" }: FAQProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, "yes" | "no">>({});

  const isGu = lang === "gu";

  const handleFeedback = (idx: number, type: "yes" | "no") => {
    setFeedback((prev) => ({ ...prev, [idx]: type }));
  };

  const categories = isGu
    ? ["બધા", "સામાન્ય માહિતી", "ચૂકવણીઓ", "સેવાઓ", "ઓર્ડર અને ડિલિવરી", "સરકારી સેવાઓ ઓનલાઇન"]
    : ["All", "General", "Payments", "Services", "Orders & Deliveries", "Online Government Services"];

  const getCategoryFromGu = (catGu: string): string => {
    switch (catGu) {
      case "સામાન્ય માહિતી": return "General";
      case "ચૂકવણીઓ": return "Payments";
      case "સેવાઓ": return "Services";
      case "ઓર્ડર અને ડિલિવરી": return "Orders & Deliveries";
      case "સરકારી સેવાઓ ઓનલાઇન": return "Online Government Services";
      default: return "All";
    }
  };

  const filteredFAQ = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      let matchesCategory = true;
      if (selectedCategory !== "All" && selectedCategory !== "બધા") {
        const catEnglish = isGu ? getCategoryFromGu(selectedCategory) : selectedCategory;
        matchesCategory = item.category === catEnglish;
      }
      
      const targetQuestion = isGu ? item.questionGu : item.question;
      const targetAnswer = isGu ? item.answerGu : item.answer;

      const matchesSearch =
        targetQuestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        targetAnswer.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, isGu]);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqSchema = useMemo(() => {
    const list = FAQ_DATA.map((item) => ({
      "@type": "Question",
      "name": isGu ? item.questionGu : item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": isGu ? item.answerGu : item.answer
      }
    }));
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": list
    };
  }, [isGu]);

  return (
    <section className="py-24 bg-slate-50/55 dark:bg-slate-950/40 relative overflow-hidden transition-colors duration-300">
      {/* Dynamic JSON-LD SEO FAQ Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>

      {/* Decorative ambient background spots */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/30 dark:bg-blue-950/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-100/30 dark:bg-indigo-950/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-6 sm:px-12 max-w-5xl relative z-10" id="faq-section-container">
        {/* Header Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 mb-4 shadow-xs">
            <HelpCircle size={14} className="text-blue-600 dark:text-blue-450" />
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-405 tracking-wider font-sans">
              {isGu ? "મદદ કેન્દ્ર અને સહાય" : "Help Center & Support"}
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {isGu ? "વારંવાર પૂછાતા પ્રશ્નો (FAQ)" : "Frequently Asked Questions"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto mt-3">
            {isGu
              ? "દસ્તાવેજ અપલોડ, સાનિધ્ય પ્રાઈઝિંગ, સેફ Razorpay પેમેન્ટ ગેટવે અને સ્ટેપ-બાય-સ્ટેપ ઓર્ડર ટ્રેકિંગ વિશેના જવાબો અહીથી જુઓ."
              : "Find immediate answers on document uploads, pricing structures, secure payments, and turnaround updates."}
          </p>
        </div>

        {/* Search and Category Quick Filters */}
        <div className="max-w-2xl mx-auto mb-10 space-y-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-455 dark:text-slate-500"
            />
            <input
              type="text"
              id="faq-search-filter"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isGu ? "મદદરૂપ પ્રશ્નો અથવા કીવર્ડ દ્વારા સીધું શોધો..." : "Search active support logs, criteria, or keyword..."}
              className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-250 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Clear Search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Categories Tab Buttons */}
          <div className="flex flex-wrap gap-2 justify-center pt-1" id="faq-categories-tab-bar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setOpenIndex(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-[1.02]"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3" id="faq-accordion-container">
          <AnimatePresence mode="popLayout">
            {filteredFAQ.length > 0 ? (
              filteredFAQ.map((item, idx) => {
                const isOpen = openIndex === idx;
                const catLabel = isGu ? item.categoryGu : item.category;
                const qLabel = isGu ? item.questionGu : item.question;
                const aLabel = isGu ? item.answerGu : item.answer;

                return (
                  <motion.div
                    key={item.question}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs transition-all"
                  >
                    <button
                      type="button"
                      id={`faq-btn-${idx}`}
                      onClick={() => handleToggle(idx)}
                      className="w-full py-5 px-6 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase leading-none tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded shrink-0">
                          {catLabel}
                        </span>
                        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {qLabel}
                        </h3>
                      </div>
                      <span className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors shrink-0 ml-4">
                        <ChevronDown
                          size={16}
                          className={`transform transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-blue-500" : ""
                          }`}
                        />
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 pt-1 text-xs leading-relaxed font-semibold text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/10">
                            <div>{aLabel}</div>
                            {/* Was this helpful binary feedback section */}
                            <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                              <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                                {isGu ? "શું આ માહિતી ઉપયોગી હતી?" : "Was this helpful?"}
                              </span>
                              <div className="flex items-center gap-2">
                                {feedback[idx] ? (
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse whitespace-nowrap">
                                    🎉 {isGu ? "આભાર!" : "Thanks for your feedback!"}
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleFeedback(idx, "yes")}
                                      className="px-2.5 py-1 rounded bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-500 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      {isGu ? "હા" : "Yes"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleFeedback(idx, "no")}
                                      className="px-2.5 py-1 rounded bg-white hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-800/50 hover:border-red-300 dark:hover:border-red-900/50 hover:text-red-600 dark:hover:text-red-400 text-slate-500 font-black text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      {isGu ? "ના" : "No"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Info className="text-slate-400" size={20} />
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isGu ? "કોઈ મેળ ખાતા પ્રશ્નો મળ્યા નથી" : "No matching questions found"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {isGu ? "કૃપા કરીને સર્ચ બોક્સમાં બીજો કોઈ કીવર્ડ સેટ કરો." : "Try widening your search terms or checking another category."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CTA Contact Column */}
        <div className="max-w-2xl mx-auto mt-20 pt-10 border-t border-slate-200/60 dark:border-slate-850 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-slate-900 border border-blue-100/60 dark:border-blue-900/30 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="space-y-1">
              <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <MessageSquare className="text-blue-500 shrink-0" size={18} />
                {isGu ? "હજી કોઈ પ્રશ્ન અણઉકેલાયેલ છે?" : "Still Have Questions?"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                {isGu
                  ? "નવી ડાયરેક્ટ રિકવેસ્ટ આપવા અથવા તાત્કાલિક અન્ય સ્પાર્ક ક્વોટેલેશન માટે સીધો સંપર્ક કરો."
                  : "Connect directly with Amit Online Services for precise quotes & customized assistance."}
              </p>
            </div>
            <button
              onClick={onContactClick}
              type="button"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 select-none shadow-md shrink-0 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isGu ? "અમારો સંપર્ક કરો" : "Contact Us Now"} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
