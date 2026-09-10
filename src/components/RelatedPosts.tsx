import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock } from "lucide-react";
import axios from "axios";

interface Blog {
  ID: string;
  Title_En: string;
  Title_Gu: string;
  Title_Hi?: string;
  Excerpt?: string;
  Content: string;
  Status: string;
  Category: string;
  Tags: string;
  Author: string;
  Timestamp: string;
  ReadingTime: number;
  Image: string;
  AltText?: string;
  altText?: string;
}

interface RelatedPostsProps {
  currentBlog: Blog;
}

export default function RelatedPosts({ currentBlog }: RelatedPostsProps) {
  const navigate = useNavigate();
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentBlog) return;

    const fetchRelated = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/blogs");
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          const allBlogs: Blog[] = res.data.data;
          // Filter out current active blog post
          const candidates = allBlogs.filter((b) => b.ID !== currentBlog.ID);
          const currentTags = (currentBlog.Tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);

          const scored = candidates.map((b) => {
            let score = 0;
            if (b.Category && currentBlog.Category && b.Category.toLowerCase() === currentBlog.Category.toLowerCase()) {
              score += 5;
            }
            const bTags = (b.Tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
            const commonTags = bTags.filter(t => currentTags.includes(t));
            score += commonTags.length * 2;
            return { blog: b, score };
          });

          // Sort by score
          const topMatches = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.blog);

          if (topMatches.length < 3) {
            const needed = 3 - topMatches.length;
            const existingIds = new Set(topMatches.map(b => b.ID));
            const fallbacks = candidates.filter(b => !existingIds.has(b.ID)).slice(0, needed);
            setRelatedBlogs([...topMatches, ...fallbacks]);
          } else {
            setRelatedBlogs(topMatches.slice(0, 3));
          }
        }
      } catch (err) {
        console.error("Failed fetching related blogs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentBlog]);

  if (loading || relatedBlogs.length === 0) return null;

  return (
    <div className="max-w-5xl mx-auto mt-16 pt-12 border-t border-slate-150 dark:border-slate-800 text-left" id="related-posts-section">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest block">
            આગળ વાંચો (Next Up)
          </span>
          <h3 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
            સંબંધિત લેખો (Related Articles)
          </h3>
        </div>
        <button
          onClick={() => navigate("/blog")}
          className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer bg-blue-50/50 dark:bg-blue-950/20 px-4 py-2 rounded-xl border border-blue-100/10"
        >
          બધા જુઓ (View All) →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedBlogs.map((b) => {
          const formattedDate = b.Timestamp 
            ? new Date(b.Timestamp).toLocaleDateString("gu-IN", { day: 'numeric', month: 'long', year: 'numeric' })
            : "જાણકારી વગર";
          
          return (
            <div 
              key={b.ID}
              onClick={() => {
                navigate(`/blog/${b.ID}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer flex flex-col h-full"
            >
              <div className="relative h-44 overflow-hidden">
                <img 
                  src={b.Image || "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=500&q=80"} 
                  alt={b.AltText || b.altText || b.Title_Gu} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <span className="absolute top-3 left-3 text-[9px] font-extrabold uppercase bg-blue-600 text-white px-2.5 py-1 rounded-lg shadow-sm">
                  {b.Category}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                    <Calendar size={12} />
                    <span>{formattedDate}</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                    {b.Title_Gu}
                  </h4>
                </div>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50 dark:border-slate-850">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock size={11} /> {b.ReadingTime || 3} મિનિટ વાંચન
                  </span>
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                    વાંચો →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
