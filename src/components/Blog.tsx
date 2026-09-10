import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar, User, ArrowRight, Clock, Search, BookOpen, AlertCircle, Wrench, ShieldAlert } from "lucide-react";
import axios from "axios";
import { useAppControl } from "../AppControlContext";
import BlogNewsletter from "./BlogNewsletter";

interface Blog {
  ID: string;
  Title_En: string;
  Title_Gu: string;
  Content: string;
  Status: string;
  Category: string;
  Tags: string;
  Author: string;
  Timestamp: string;
  ReadingTime: number;
  Image: string;
}

const CATEGORY_MAP: Record<string, string> = {
  All: "બધા વિષયો",
  Guides: "માર્ગદર્શિકા (Guides)",
  News: "નવીનતમ સમાચાર (News)",
  "Service Updates": "સર્વિસ અપડેટ્સ (Service Updates)",
  Tutorials: "ટ્યુટોરીયલ્સ (Tutorials)",
  General: "સામાન્ય માહિતી (General)",
};

export default function Blog() {
  const navigate = useNavigate();
  const { isBlogEnabled } = useAppControl();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (!isBlogEnabled) return;
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/blogs");
        if (res.data && res.data.success) {
          setBlogs(res.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, [isBlogEnabled]);

  if (!isBlogEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto"
        id="blog-maintenance-container"
      >
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 border border-blue-100 dark:border-blue-900/30 shadow-sm animate-pulse">
          <BookOpen size={28} />
        </div>
        
        <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-black uppercase tracking-[0.2em] px-4.5 py-1.5 rounded-full select-none mb-4 flex items-center gap-1.5">
          <Wrench size={10} className="animate-spin" /> ટેમ્પરરી મેન્ટેનન્સ / Maintenance
        </span>
        
        <h1 className="text-2xl md:text-3xl font-sans font-black text-slate-900 dark:text-white tracking-tight">
          બ્લોગ સિસ્ટમ અસ્થાયી રૂપે બંધ છે
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-3 leading-relaxed font-semibold">
          અમે યુઝર્સ માટે વધુ સચોટ માહિતી, સરળ ફોર્મેટિંગ અને લેટેસ્ટ સમાચાર ઉપલબ્ધ કરવા માટે કન્ટેન્ટ અપડેટ કરી રહ્યા છીએ. કૃપા કરીને થોડા સમય પછી ફરી પ્રયાસ કરો!
        </p>
        
        <button
          onClick={() => navigate("/")}
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
        >
          મુખ્ય પેજ પર પાછા જાઓ
        </button>
      </motion.div>
    );
  }

  // Filter and search
  const filteredBlogs = blogs.filter((b) => {
    const titleGu = b.Title_Gu || "";
    const titleEn = b.Title_En || "";
    const content = b.Content || "";
    const tags = b.Tags || "";
    const matchesSearch =
      titleGu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tags.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || b.Category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getExcerpt = (b: Blog) => {
    if (!b.Content) return "";
    // If has '---\n\n' or similar, split and take first part, otherwise truncate
    if (b.Content.includes("---")) {
      const parts = b.Content.split("---");
      return parts[0].trim();
    }
    return b.Content.slice(0, 160).trim() + " ...";
  };

  const categories = ["All", ...Array.from(new Set(blogs.map((b) => b.Category).filter(t => t && t !== "All")))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 lg:px-12 py-10 text-slate-800 dark:text-slate-100"
      id="blog-page"
    >
      {/* હેડર સેક્શન / Header Section */}
      <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full select-none">
          નવીનતમ આર્ટિકલ્સ અને માહિતી
        </span>
        <h1 className="text-3xl md:text-4xl font-sans font-black text-slate-900 dark:text-white mt-5 tracking-tight">
          અમારા લેટેસ્ટ બ્લોગ્સ
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 text-xs md:text-sm font-sans">
          અનુવાદ સચોટતા, ઈ-ગવર્નન્સમાં આવતા ફેરફારો, સરકારી પ્રમાણપત્રોની અરજી અને સુરક્ષિત આઈટી ટ્રાન્સલેશન વિશે ઓનલાઇન સચોટ માર્ગદર્શન મેળવો.
        </p>
      </div>

      {/* સર્ચ અને ફિલ્ટર બાર / Search and Filter Panel */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4 max-w-5xl mx-auto bg-slate-55 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="બ્લોગ અથવા વિષય શોધો..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-all font-sans"
          />
        </div>

        {/* કેટેગરી ફિલ્ટર્સ / Categories selection */}
        <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
          {categories.map((cat, cIdx) => (
            <button
              key={`${cat}-${cIdx}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              {CATEGORY_MAP[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* આર્ટિકલ ગ્રીડ અથવા લોડિંગ દર્શક */}
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-xs">માહિતી પ્રક્રિયામાં છે...</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center max-w-sm mx-auto">
          <AlertCircle size={36} className="text-slate-350 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 text-xs font-bold font-sans">આ કેટેગરી અથવા શોધ માટે કોઈ આર્ટિકલ મળ્યો નથી.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="mt-4 text-xs font-bold text-blue-600 dark:text-blue-400 underline"
          >
            શોધ ફરીથી ગોઠવો
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {filteredBlogs.map((article, idx) => (
            <article
              key={`${article.ID}-${idx}`}
              onClick={() => navigate(`/blog/${article.ID}`)}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-[30px] overflow-hidden flex flex-col hover:border-blue-500 dark:hover:border-blue-400/30 group transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            >
              {/* Cover Image */}
              <div className="h-48 w-full overflow-hidden relative">
                <img
                  src={article.Image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"}
                  alt={article.Title_Gu}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded-md">
                    {article.Category}
                  </span>
                </div>
              </div>

              {/* કન્ટેન્ટ બોડી / Content Card Info */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between text-left">
                <div>
                  <h2 className="text-md font-black text-slate-900 dark:text-white font-sans leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                    {article.Title_Gu}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-3 text-xs leading-relaxed font-sans line-clamp-3">
                    {getExcerpt(article)}
                  </p>
                </div>

                {/* ટેગ્સ અને લેખક માહિતી / Tags and Metadata */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                  {article.Tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {article.Tags.split(",").map((tag, idx) => {
                        const t = tag.trim();
                        if (!t) return null;
                        return (
                          <span
                            key={idx}
                            className="text-[9px] font-bold font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded"
                          >
                            #{t}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      <span>{article.Author || "અમિત ઓનલાઇન"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>
                          {article.Timestamp
                            ? new Date(article.Timestamp).toLocaleDateString("gu-IN")
                            : "તાજેતરમાં"}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{article.ReadingTime || 5} મિનિટ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* વધુ વાંચો રીડ મોર બટન બેનર */}
              <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between group-hover:bg-blue-600/5 transition-colors duration-300">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  વધુ વાંચો
                </span>
                <ArrowRight
                  size={13}
                  className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1.5 transition-transform duration-300"
                />
              </div>
            </article>
          ))}
        </div>
      )}
      <BlogNewsletter />
    </motion.div>
  );
}
