import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Newspaper, 
  ExternalLink, 
  Search, 
  RefreshCw, 
  Tag, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  ChevronRight,
  X,
  Globe
} from "lucide-react";
import { toast } from "sonner";

export interface NewsArticle {
  id: string;
  title: string;
  titleGu?: string;
  summary: string;
  summaryGu?: string;
  portal: string;
  category: "Aadhaar & Identity" | "Tax & Revenue" | "RTO & Licenses" | "Certificates & Schemes" | "Notary & Legal";
  date: string;
  link: string;
  isHot?: boolean;
  badge?: string;
  officialSource: string;
}

interface GovServiceNewsWidgetProps {
  lang?: string;
}

export function GovServiceNewsWidget({ lang = "en" }: GovServiceNewsWidgetProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/news/government-headlines");
      if (res.data && res.data.success && Array.isArray(res.data.articles)) {
        setArticles(res.data.articles);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn("Could not fetch grounded news headlines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const categories = [
    { key: "ALL", labelEn: "All Portal Updates", labelGu: "તમામ સરકારી અપડેટ્સ" },
    { key: "Aadhaar & Identity", labelEn: "Aadhaar & Identity", labelGu: "આધાર અને ઓળખ કાર્ડ" },
    { key: "Tax & Revenue", labelEn: "Tax & Revenue", labelGu: "ટેક્સ અને આવક પત્રક" },
    { key: "RTO & Licenses", labelEn: "RTO & Licenses", labelGu: "આર.ટી.ઓ. અને લાઇસન્સ" },
    { key: "Certificates & Schemes", labelEn: "Certificates & Schemes", labelGu: "પ્રમાણપત્ર અને યોજનાઓ" },
  ];

  const filteredArticles = articles.filter(item => {
    const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || 
      item.title.toLowerCase().includes(term) || 
      (item.titleGu && item.titleGu.includes(term)) ||
      item.portal.toLowerCase().includes(term) ||
      item.summary.toLowerCase().includes(term);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-8 relative overflow-hidden transition-all duration-300" id="gov-news-headlines-widget">
      {/* Widget Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-900/40 shrink-0">
            <Newspaper size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-md">
                Grounded Live Feed
              </span>
              {lastUpdated && (
                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                  <Clock size={10} /> Updated {lastUpdated}
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mt-0.5">
              {lang === "gu" ? "સત્તાવાર સરકારી સેવા સમાચાર અને પોર્ટલ અપડેટ્સ" : "Official Government Service News & Portal Advisories"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === "gu" ? "સમાચાર શોધો..." : "Search official updates..."}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={fetchNews}
            disabled={loading}
            className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh portal updates"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar border-b border-slate-100 dark:border-slate-800/80">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat.key
                ? "bg-slate-900 dark:bg-blue-600 text-white shadow-sm"
                : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {lang === "gu" ? cat.labelGu : cat.labelEn}
          </button>
        ))}
      </div>

      {/* News List */}
      <div className="pt-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-8">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <AlertCircle size={28} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold uppercase tracking-wider">No news articles found for this search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map(article => (
              <div
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="group p-4 bg-slate-50/70 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl transition-all duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/30">
                      {article.portal}
                    </span>
                    {article.badge && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">
                        {article.badge}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {lang === "gu" && article.titleGu ? article.titleGu : article.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {lang === "gu" && article.summaryGu ? article.summaryGu : article.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1 font-mono text-[9.5px]">
                    <Clock size={11} /> {article.date}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 group-hover:underline">
                    View Advisory <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 transition-all"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                {selectedArticle.portal}
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                {selectedArticle.category}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
              {lang === "gu" && selectedArticle.titleGu ? selectedArticle.titleGu : selectedArticle.title}
            </h3>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
              <p>{lang === "gu" && selectedArticle.summaryGu ? selectedArticle.summaryGu : selectedArticle.summary}</p>
              
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Official Source: {selectedArticle.officialSource}</span>
                <span>Date: {selectedArticle.date}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <a
                href={selectedArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Globe size={14} /> Visit Official Portal <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
