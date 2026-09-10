import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Calendar, User, ArrowLeft, Clock, Tag, BookOpen, AlertCircle, Check, Link, Wrench, Linkedin, Share2, MapPin } from "lucide-react";
import axios from "axios";
import ServiceConversionCard from "./ServiceConversionCard";
import { useAppControl } from "../AppControlContext";
import BlogNewsletter from "./BlogNewsletter";
import RelatedPosts from "./RelatedPosts";

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
  AltText?: string;
  altText?: string;
  DocsListID?: string;
  docsListId?: string;
  LinkedServiceID?: string;
  linkedServiceId?: string;
  LinkedPdfUrl?: string;
  linkedPdfUrl?: string;
}

// Intersection Observer based Lazy Image Loader
function LazyImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [loaded, setLoaded] = React.useState(false);
  const [visible, setVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {visible && (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-700 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          onLoad={() => setLoaded(true)}
          referrerPolicy="no-referrer"
        />
      )}
      {!loaded && <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 animate-pulse" />}
    </div>
  );
}

// Intersection Observer based Lazy load widget wrapper (for PDF IFrame, checklist and conversions)
function LazyLoadWrapper({ children, placeholder }: { children: React.ReactNode; placeholder?: React.ReactNode }) {
  const [isIntersected, setIsIntersected] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isIntersected) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);
        }
      },
      { rootMargin: "150px" }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isIntersected]);

  return (
    <div ref={containerRef} className="w-full">
      {isIntersected ? children : placeholder || <div className="h-40 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 animate-pulse" />}
    </div>
  );
}

export default function BlogPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isBlogEnabled } = useAppControl();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState<{ListName: string; Documents: string[]} | null>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeId, setActiveId] = useState("");
  const [headers, setHeaders] = useState<{ id: string; text: string; level: number }[]>([]);

  // Hook up automatic redirection funnel (Information-to-Application Pipeline via deep link)
  const handleApplyClick = () => {
    if (!blog) return;
    const targetServiceId = blog.LinkedServiceID || blog.linkedServiceId;
    if (targetServiceId) {
      navigate(`/services/gov?applyForId=${targetServiceId}`);
    }
  };

  useEffect(() => {
    if (!isBlogEnabled) return;
  }, [isBlogEnabled]);

  useEffect(() => {
    if (!isBlogEnabled) return;
    if (blog) {
      const docListId = blog.DocsListID || blog.docsListId;
      if (docListId) {
        axios.get("/api/document-lists")
          .then((res) => {
            if (res.data && res.data.success) {
              const matched = res.data.data.find((item: any) => item.ID === docListId);
              if (matched) {
                setChecklist(matched);
              }
            }
          })
          .catch((err) => console.warn("Failed loading linked checklist:", err));
      }
    }
  }, [blog, isBlogEnabled]);

  const getShareUrl = () => {
    return `${window.location.protocol}//${window.location.host}/blog/${blog?.ID}`;
  };

  // Dynamic Open Graph Meta Tag Injector
  useEffect(() => {
    if (!isBlogEnabled || !blog) return;

    const setMetaTag = (property: string, content: string) => {
      let element = document.querySelector(`meta[property="${property}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("property", property);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    const setTwitterTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute("name", name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    const titleStr = blog.Title_Gu || blog.Title_En || "અમિત ઓનલાઇન સર્વિસીસ";
    const rawContent = blog.Content || "";
    const cleanContent = rawContent.replace(/[#*`_-]/g, "").trim();
    const descStr = cleanContent.length > 165 ? cleanContent.slice(0, 162) + "..." : cleanContent;
    const imageStr = blog.Image || `${window.location.protocol}//${window.location.host}/favicon.ico`;
    const urlStr = getShareUrl();

    document.title = `${titleStr} | અમિત ઓનલાઇન સર્વિસીસ`;

    // Inject og: tags
    setMetaTag("og:title", titleStr);
    setMetaTag("og:description", descStr || "અમિત ઓનલાઇન સર્વિસીસ બ્લોગ");
    setMetaTag("og:image", imageStr);
    setMetaTag("og:url", urlStr);
    setMetaTag("og:type", "article");

    // Inject twitter: tags
    setTwitterTag("twitter:card", "summary_large_image");
    setTwitterTag("twitter:title", titleStr);
    setTwitterTag("twitter:description", descStr || "અમિત ઓનલાઇન સર્વિસીસ બ્લોગ");
    setTwitterTag("twitter:image", imageStr);

    return () => {
      document.title = "અમિત ઓનલાઇન સર્વિસીસ | Government Services Center";
    };
  }, [blog, isBlogEnabled]);

  const handleSocialShare = async (platform: string) => {
    if (!blog) return;
    const shareUrl = getShareUrl();
    const targetServiceId = blog.LinkedServiceID || blog.linkedServiceId;
    const serviceDeepLink = targetServiceId ? `${window.location.protocol}//${window.location.host}/services/gov?applyForId=${targetServiceId}` : "";

    const shareTitle = blog.Title_Gu + " | અમિત ઓનલાઇન સર્વિસીસ";
    let textToShare = `${shareTitle}\nઆર્ટિકલ લિંક: ${shareUrl}`;
    if (serviceDeepLink) {
      textToShare += `\nઓનલાઈન અરજી કરવા માટે અહી ક્લિક કરો: ${serviceDeepLink}`;
    }

    let shareLink = "";

    try {
      await axios.post(`/api/blogs/${blog.ID}/share`);
    } catch (err) {
      console.error("Failed to increment share count", err);
    }

    if (platform === "whatsapp") {
      shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    } else if (platform === "facebook") {
      shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === "twitter") {
      shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
    } else if (platform === "linkedin") {
      shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleCopyLink = () => {
    if (!blog) return;
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => {
    if (!isBlogEnabled) return;
    const fetchBlog = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`/api/blogs/${id}`);
        if (res.data && res.data.success) {
          setBlog(res.data.data);
        } else {
          setError("આર્ટિકલ મળ્યો નથી.");
        }
      } catch (err: any) {
        console.error("Error fetching blog:", err);
        setError("આર્ટિકલ મેળવવામાં મુશ્કેલી પડી રહી છે.");
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id, isBlogEnabled]);

  // Scroll tracker state
  useEffect(() => {
    if (!isBlogEnabled) return;
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isBlogEnabled]);

  // Header extraction and intersection tracking
  useEffect(() => {
    if (!isBlogEnabled) return;
    if (blog && blog.Content) {
      // Extract headers starting with ## or ###
      const lines = blog.Content.split("\n");
      const foundHeaders: { id: string; text: string; level: number }[] = [];
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("## ") || trimmed.startsWith("### ")) {
          const level = trimmed.startsWith("## ") ? 2 : 3;
          const headerText = trimmed.replace(/^##+\s+/, "");
          const id = headerText
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");
          foundHeaders.push({ id, text: headerText, level });
        }
      });
      setHeaders(foundHeaders);
    }
  }, [blog, isBlogEnabled]);

  useEffect(() => {
    if (!isBlogEnabled || headers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -40% 0px", threshold: 0.1 }
    );

    const headingElements = document.querySelectorAll("#blog-content h2, #blog-content h3");
    headingElements.forEach((el) => observer.observe(el));

    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, [headers, blog, isBlogEnabled]);

  if (!isBlogEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3 }}
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto"
        id="blogpost-maintenance-container"
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 lg:px-12 py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-sans text-sm font-bold">આર્ટિકલ લોડ થઈ રહ્યો છે, કૃપા કરીને પ્રતીક્ષા કરો...</p>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 lg:px-12 py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2 font-sans">ભૂલ આવી!</h2>
        <p className="text-slate-500 text-xs mb-6 font-sans">{error || "આ લેખ ઉપલબ્ધ નથી અથવા કાઢી નાખવામાં આવ્યો છે."}</p>
        <button
          onClick={() => navigate("/blog")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft size={14} /> બ્લોગ યાદી પર પાછા ફરો
        </button>
      </div>
    );
  }

  // Parse bold markdown format
  const parseBoldText = (para: string, lineKey: string) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let indexId = 0;
    
    while ((match = boldRegex.exec(para)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        parts.push(para.substring(lastIndex, index));
      }
      parts.push(
        <strong key={`${lineKey}-b-${indexId++}`} className="font-extrabold text-slate-1000 dark:text-white">
          {match[1]}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < para.length) {
      parts.push(para.substring(lastIndex));
    }

    return parts.length > 0 ? parts : para;
  };

  // Format the text content for paragraphs, headers (H2/H3 with IDs), and lists
  const formatContent = (text: string) => {
    if (!text) return "";
    
    const lines = text.split("\n");
    let inList = false;
    let listItems: React.ReactNode[] = [];
    const elements: React.ReactNode[] = [];

    const flushList = (key: number) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className="list-disc pl-6 my-4 space-y-2 text-slate-700 dark:text-slate-350 text-xs sm:text-sm leading-relaxed">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList(idx);
        return;
      }

      // Horizontal lines
      if (trimmed === "---" || trimmed === "***") {
        flushList(idx);
        elements.push(<hr key={idx} className="my-8 border-t border-slate-150 dark:border-slate-800" />);
        return;
      }

      // H1 Headings
      if (trimmed.startsWith("# ")) {
        flushList(idx);
        const headerText = trimmed.replace(/^#\s+/, "");
        const id = headerText
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        elements.push(
          <h1
            key={idx}
            id={id}
            className="text-2xl md:text-3xl font-black text-slate-1000 dark:text-white mt-12 mb-5 pb-3 border-b-2 border-slate-200 dark:border-slate-800 scroll-mt-24 font-sans headline-anchor"
          >
            {headerText}
          </h1>
        );
        return;
      }

      // H2 Headings
      if (trimmed.startsWith("## ")) {
        flushList(idx);
        const headerText = trimmed.replace(/^##\s+/, "");
        const id = headerText
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        elements.push(
          <h2
            key={idx}
            id={id}
            className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-10 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 scroll-mt-24 font-sans headline-anchor"
          >
            {headerText}
          </h2>
        );
        return;
      }

      // H3 Headings
      if (trimmed.startsWith("### ")) {
        flushList(idx);
        const headerText = trimmed.replace(/^###\s+/, "");
        const id = headerText
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        elements.push(
          <h3
            key={idx}
            id={id}
            className="text-base md:text-lg font-black text-slate-850 dark:text-slate-200 mt-8 mb-3 scroll-mt-24 font-sans"
          >
            {headerText}
          </h3>
        );
        return;
      }

      // Bullet List Items
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
        inList = true;
        const itemText = trimmed.substring(2);
        const parsedNode = parseBoldText(itemText, `li-${idx}`);
        listItems.push(<li key={`item-${idx}`}>{parsedNode}</li>);
        return;
      }

      // Standard paragraphs
      flushList(idx);
      const parsedNode = parseBoldText(trimmed, `p-${idx}`);
      elements.push(
        <p key={idx} className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
          {parsedNode}
        </p>
      );
    });

    flushList(lines.length);
    return elements;
  };

  const formattedDate = blog.Timestamp 
    ? new Date(blog.Timestamp).toLocaleDateString("gu-IN", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 lg:px-12 py-10"
      id="blog-post-reader"
    >
      {/* Dynamic Reading Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-500 z-50 transition-all duration-100 ease-out" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Back Button */}
      <div className="mb-6 flex justify-start">
        <button
          onClick={() => navigate("/blog")}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft size={14} /> પાછા જાવ
        </button>
      </div>

      {/* Structured Content Metadata / SEO JSON-LD explicitly labeling Reading Time */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": blog.Title_Gu,
          "image": blog.Image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
          "author": {
            "@type": "Organization",
            "name": blog.Author || "અમિત ઓનલાઇન સર્વિસીસ"
          },
          "publisher": {
            "@type": "Organization",
            "name": "અમિત ઓનલાઇન સર્વિસીસ",
            "logo": {
              "@type": "ImageObject",
              "url": `${window.location.protocol}//${window.location.host}/favicon.ico`
            }
          },
          "datePublished": blog.Timestamp,
          "dateModified": blog.Timestamp,
          "description": blog.Title_Gu,
          "timeRequired": `PT${Math.max(1, Math.ceil((blog.Content?.trim().split(/\s+/).length || 0) / 200))}M`
        })}
      </script>

      {/* 2-Column Grid Layout: Main Article (8 cols) & Sidebar Widgets (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        {/* MAIN CONTENT AREA (8 Columns) */}
        <main className="lg:col-span-8 space-y-8">
          <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Responsive Hero Image wrapped in semantic <header> tag */}
            <header className="h-[250px] md:h-[380px] w-full relative overflow-hidden">
              <LazyImage
                src={blog.Image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop"}
                alt={blog.AltText || blog.altText || blog.Title_Gu}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 text-left space-y-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-white bg-blue-600 px-3 py-1.5 rounded-md shadow-sm">
                  {blog.Category}
                </span>
                <h1 className="text-2xl md:text-4xl font-black text-white font-sans leading-tight">
                  {blog.Title_Gu}
                </h1>
              </div>
            </header>

            {/* Article Meta Details and Content */}
            <div className="p-6 md:p-10 text-left">
              {/* Metadata Bar */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pb-6 border-b border-slate-100 dark:border-slate-800 mb-8 justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                    <User size={12} className="text-blue-500" />
                    {blog.Author || "અમિત ઓનલાઇન સર્વિસીસ"}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 font-sans" id="blog-reading-time-data" data-min-read={Math.max(1, Math.ceil((blog.Content?.trim().split(/\s+/).length || 0) / 200))}>
                    <Calendar size={12} className="text-blue-500" />
                    {formattedDate || "તાજેતરમાં"}
                  </span>
                  <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                    <Clock size={12} className="text-blue-500" />
                    {Math.max(1, Math.ceil((blog.Content?.trim().split(/\s+/).length || 0) / 200))} મિનિટ વાંચન ({Math.max(1, Math.ceil((blog.Content?.trim().split(/\s+/).length || 0) / 200))} min read)
                  </span>
                </div>
              </div>

              {/* Accordion / Table of Contents box if headings exist */}
              {headers.length > 0 && (
                <div className="mb-8 p-5 bg-slate-50/80 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3">
                    <BookOpen size={14} className="text-blue-600" /> Table of Contents / વિષય-સૂચિ
                  </div>
                  <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    {headers.map((h) => (
                      <a
                        key={h.id}
                        href={`#${h.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(h.id);
                          if (element) {
                            const yOffset = -96;
                            const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                            window.scrollTo({ top: y, behavior: "smooth" });
                          }
                        }}
                        className={`text-xs font-bold leading-snug transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 ${
                          activeId === h.id ? "text-blue-600 dark:text-blue-400 font-extrabold" : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">{h.text}</span>
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Main Text Content inside Tailwind Prose optimized for Gujarati script */}
              <div className="prose prose-base max-w-none dark:prose-invert prose-headings:font-black prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed font-sans" id="blog-content">
                {formatContent(blog.Content)}
              </div>

              {/* Centered Document checklist CTA */}
              {checklist && (
                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-blue-50/50 dark:bg-slate-950 p-6 md:p-8 rounded-[28px] border border-blue-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="text-left space-y-2 flex-1">
                      <span className="text-[9px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded uppercase tracking-wider">
                        અરજી માટે જરૂરી દસ્તાવેજો (Required Application Checklist)
                      </span>
                      <h3 className="text-md font-black text-slate-900 dark:text-white mt-1.5">
                        જરૂરી પ્રમાણપત્રોની યાદી: {checklist.ListName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                        {checklist.Documents.map((doc, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <span>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Service Conversion Widget */}
              {(blog.LinkedServiceID || blog.linkedServiceId) && (
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <LazyLoadWrapper>
                    <ServiceConversionCard serviceId={blog.LinkedServiceID || blog.linkedServiceId} />
                  </LazyLoadWrapper>
                </div>
              )}

              {/* Government Circular PDF Guidelines Viewer */}
              {(blog.LinkedPdfUrl || blog.linkedPdfUrl) && (
                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 text-left">
                    <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-3 py-1 rounded font-black uppercase tracking-wider block w-max">
                      સત્તાવાર માર્ગદર્શિકા પરિપત્ર (G.R. Circular)
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2.5 mb-4 leading-snug">
                      સરકારી GR અથવા સત્તાવાર ફોર્મેટ દર્શક (GR guidelines Circular PDF Guidelines)
                    </h4>
                    
                    <div className="w-full h-[450px] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-white">
                      <LazyLoadWrapper>
                        <iframe
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(blog.LinkedPdfUrl || blog.linkedPdfUrl || "")}&embedded=true`}
                          title="Official Circular Guidelines Previewer"
                          className="w-full h-full border-0"
                          referrerPolicy="no-referrer"
                        />
                      </LazyLoadWrapper>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-[10px] text-slate-400 font-bold">પીડીએફ લોડ ન થાય તો ગુગલ ડ્રાઈવ પર દર્શાવી શકો છો.</p>
                      <a
                        href={blog.LinkedPdfUrl || blog.linkedPdfUrl}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="text-xs font-black text-red-650 hover:text-red-750 dark:text-red-400 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
                      >
                        Open Official Link (પીડીએફ લિન્ક) →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media Sharing Panel */}
              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-left">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4">
                  અત્યારે જ શેર કરો (Share Now):
                </h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleSocialShare("whatsapp")}
                    className="flex items-center gap-2 text-white bg-[#25D366] hover:bg-[#20ba5a] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.263 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.631 2.016 14.16 1.001 11.997 1.001 6.561 1.001 2.137 5.371 2.134 10.8c-.001 1.701.453 3.361 1.314 4.816l-.989 3.606 3.702-.968z" />
                    </svg>
                    WhatsApp
                  </button>

                  <button
                    onClick={() => handleSocialShare("facebook")}
                    className="flex items-center gap-2 text-white bg-[#1877F2] hover:bg-[#166fe5] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </button>

                  <button
                    onClick={() => handleSocialShare("linkedin")}
                    className="flex items-center gap-2 text-white bg-[#0077B5] hover:bg-[#005a8a] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Linkedin size={14} />
                    LinkedIn
                  </button>

                  <button
                    onClick={() => handleSocialShare("twitter")}
                    className="flex items-center gap-2 text-white bg-black hover:bg-zinc-900 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 transition-all duration-300 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm active:scale-95 cursor-pointer ${
                      copied 
                        ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200/10" 
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-green-600 dark:text-green-400" />
                        લિંક કોપી થઈ ગઈ!
                      </>
                    ) : (
                      <>
                        <Link size={14} />
                        લિંક કોપી કરો
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tag Chips */}
              {blog.Tags && (
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Tag size={12} /> ટેગ્સ:
                    </span>
                    {blog.Tags.split(",").map((tag, idx) => {
                      const t = tag.trim();
                      if (!t) return null;
                      return (
                        <span
                          key={idx}
                          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1.5 rounded-xl border border-blue-100/10"
                        >
                          #{t}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </article>
        </main>

        {/* SIDEBAR WIDGETS AREA (4 Columns - Stack cleanly on mobile) */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Widget 1: Related Articles ("સંબંધિત લેખો") */}
          <SidebarRelatedArticles currentBlog={blog} />

          {/* Widget 2: Office Hours & Realtime Digital Clock */}
          <LiveClockAndOfficeHours />

          {/* Widget 3: Location / Map Card */}
          <LocationWidget />
        </aside>
      </div>

      {/* Related Articles Section */}
      {blog && <RelatedPosts currentBlog={blog} />}
      
      <BlogNewsletter />

      {/* Persistent Social Media Share Toolbar */}
      {blog && (
        <>
          {/* Desktop Left-Side Floating Share Toolbar */}
          <div className="fixed left-6 top-1/3 z-40 hidden lg:flex flex-col gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl">
            <div className="text-[9px] font-black uppercase text-slate-400 text-center tracking-wider mb-1 border-b border-slate-100 dark:border-slate-850 pb-1 flex items-center justify-center gap-1">
              <Share2 size={10} />
              <span>Share</span>
            </div>
            {/* WhatsApp */}
            <button
              onClick={() => handleSocialShare("whatsapp")}
              title="Share on WhatsApp"
              className="p-2.5 rounded-xl text-[#25D366] hover:bg-[#25D366]/10 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.263 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.631 2.016 14.16 1.001 11.997 1.001 6.561 1.001 2.137 5.371 2.134 10.8c-.001 1.701.453 3.361 1.314 4.816l-.989 3.606 3.702-.968z" />
              </svg>
            </button>
            {/* Twitter */}
            <button
              onClick={() => handleSocialShare("twitter")}
              title="Share on Twitter"
              className="p-2.5 rounded-xl text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            {/* LinkedIn */}
            <button
              onClick={() => handleSocialShare("linkedin")}
              title="Share on LinkedIn"
              className="p-2.5 rounded-xl text-[#0077B5] hover:bg-[#0077B5]/10 transition-all active:scale-90 cursor-pointer flex items-center justify-center"
            >
              <Linkedin size={20} />
            </button>
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              title="Copy link"
              className={`p-2.5 rounded-xl transition-all active:scale-90 cursor-pointer flex items-center justify-center ${copied ? "text-green-600 bg-green-50 dark:bg-green-950/40" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              {copied ? <Check size={20} /> : <Link size={20} />}
            </button>
          </div>

          {/* Mobile Bottom Floating Share Toolbar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden flex items-center justify-around bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-150 dark:border-slate-800 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
            {/* WhatsApp */}
            <button
              onClick={() => handleSocialShare("whatsapp")}
              className="flex flex-col items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer bg-transparent border-none"
            >
              <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.263 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.631 2.016 14.16 1.001 11.997 1.001 6.561 1.001 2.137 5.371 2.134 10.8c-.001 1.701.453 3.361 1.314 4.816l-.989 3.606 3.702-.968z" />
              </svg>
              <span>WhatsApp</span>
            </button>
            {/* Twitter */}
            <button
              onClick={() => handleSocialShare("twitter")}
              className="flex flex-col items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer bg-transparent border-none"
            >
              <svg className="w-5 h-5 fill-slate-800 dark:fill-white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </button>
            {/* LinkedIn */}
            <button
              onClick={() => handleSocialShare("linkedin")}
              className="flex flex-col items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer bg-transparent border-none"
            >
              <Linkedin size={20} className="text-[#0077B5]" />
              <span>LinkedIn</span>
            </button>
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1.5 text-[10px] font-black uppercase text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer bg-transparent border-none"
            >
              {copied ? (
                <>
                  <Check size={20} className="text-green-600" />
                  <span className="text-green-600">Copied</span>
                </>
              ) : (
                <>
                  <Link size={20} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}

function LiveClockAndOfficeHours() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const currentHour = currentTime.getHours();
  
  const isOpen = (dayOfWeek !== 'Sunday' && currentHour >= 9 && currentHour < 20) ||
                 (dayOfWeek === 'Sunday' && currentHour >= 10 && currentHour < 14);

  const schedule = [
    { day: "સોમવાર (Mon)", hours: "09:00 AM - 08:00 PM" },
    { day: "મંગળવાર (Tue)", hours: "09:00 AM - 08:00 PM" },
    { day: "બુધવાર (Wed)", hours: "09:00 AM - 08:00 PM" },
    { day: "ગુરુવાર (Thu)", hours: "09:00 AM - 08:00 PM" },
    { day: "શુક્રવાર (Fri)", hours: "09:00 AM - 08:00 PM" },
    { day: "શનિવાર (Sat)", hours: "09:00 AM - 08:00 PM" },
    { day: "રવિવાર (Sun)", hours: "10:00 AM - 02:00 PM" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
            ઓફિસ સમય અને લાઇવ ઘડિયાળ
          </h4>
        </div>
        <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
          isOpen
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50"
            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50"
        }`}>
          {isOpen ? "• ઓપન છે (Open Now)" : "• અત્યારે બંધ છે (Closed)"}
        </span>
      </div>

      <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
          વર્તમાન સમય (Current Time)
        </span>
        <div className="text-xl font-black font-mono tracking-wider text-blue-600 dark:text-blue-400">
          {timeString}
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {schedule.map((item, idx) => {
          const isToday = item.day.toLowerCase().includes(dayOfWeek.toLowerCase().substring(0, 3));
          return (
            <div
              key={idx}
              className={`flex justify-between items-center py-1.5 px-2.5 rounded-lg transition-colors ${
                isToday
                  ? "bg-blue-50/70 dark:bg-blue-950/40 font-bold text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <span className="text-[11px] font-medium">{item.day}</span>
              <span className="text-[10px] font-mono font-semibold">{item.hours}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LocationWidget() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
          સ્થળ / નકશો (Our Location)
        </h4>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
        અમિત ઓનલાઇન સર્વિસીસ, સ્ટેશન રોડ, સર્કિટ હાઉસ સામે, અમરેલી, ગુજરાત - 365601
      </p>

      <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 relative bg-slate-100">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14828.182449013063!2d71.216667!3d21.600000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395880c555555555%3A0x123456789abcdef!2sAmreli%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          title="Google Maps Location"
          referrerPolicy="no-referrer"
        />
      </div>

      <a
        href="https://maps.google.com/?q=Amreli,Gujarat"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-950/40 py-2 rounded-xl border border-blue-100 dark:border-blue-900/30"
      >
        ગૂગલ મેપ પર જુઓ (Get Directions) →
      </a>
    </div>
  );
}

function SidebarRelatedArticles({ currentBlog }: { currentBlog: any }) {
  const navigate = useNavigate();
  const [related, setRelated] = useState<any[]>([]);

  useEffect(() => {
    if (!currentBlog) return;
    axios.get("/api/blogs").then((res) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        const candidates = res.data.data.filter((b: any) => b.ID !== currentBlog.ID);
        setRelated(candidates.slice(0, 4));
      }
    }).catch(() => {});
  }, [currentBlog]);

  if (related.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all text-left space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 tracking-wider">
          સંબંધિત લેખો (Related Articles)
        </h4>
      </div>

      <div className="space-y-3">
        {related.map((item, idx) => (
          <div
            key={`${item.ID}-${idx}`}
            onClick={() => {
              navigate(`/blog/${item.ID}`);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3 group cursor-pointer p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
          >
            <img
              src={item.Image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=200&auto=format&fit=crop"}
              alt={item.Title_Gu || item.Title_En}
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-800"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-extrabold uppercase text-blue-600 dark:text-blue-400 block mb-0.5">
                {item.Category}
              </span>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
                {item.Title_Gu || item.Title_En}
              </h5>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
