import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Calendar, User, ArrowLeft, BookOpen, Clock, FileText, Image as ImageIcon, Send, Sparkles, TrendingUp, Eye, Heart, Share2, Award, ChevronDown, ChevronUp, Search, Settings, History, Edit, Database, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts";

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
  MetaDesc?: string;
  DocsListID?: string;
  LinkedServiceID?: string;
  LinkedPdfUrl?: string;
}

export default function AdminBlogManager({ user, onBack }: { user: any; onBack?: () => void }) {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingDocs, setGeneratingDocs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states (Load drafts from local storage on mount)
  const [titleGu, setTitleGu] = useState(() => localStorage.getItem("blog_draft_titleGu") || "");
  const [titleEn, setTitleEn] = useState(() => localStorage.getItem("blog_draft_titleEn") || "");
  const [titleHi, setTitleHi] = useState(() => localStorage.getItem("blog_draft_titleHi") || "");
  const [excerpt, setExcerpt] = useState(() => localStorage.getItem("blog_draft_excerpt") || "");
  const [content, setContent] = useState(() => localStorage.getItem("blog_draft_content") || "");
  const [category, setCategory] = useState(() => localStorage.getItem("blog_draft_category") || "Guides");
  const [tags, setTags] = useState(() => localStorage.getItem("blog_draft_tags") || "");
  const [author, setAuthor] = useState(() => localStorage.getItem("blog_draft_author") || "અમિત ઓનલાઇન સર્વિસીસ");
  const [imageUrl, setImageUrl] = useState(() => localStorage.getItem("blog_draft_imageUrl") || "");
  const [readingTime, setReadingTime] = useState(() => Number(localStorage.getItem("blog_draft_readingTime")) || 5);
  const [generatingTags, setGeneratingTags] = useState(false);
  
  // AI Alt text state
  const [altText, setAltText] = useState(() => localStorage.getItem("blog_draft_altText") || "");
  const [generatingAlt, setGeneratingAlt] = useState(false);

  // MetaDesc state
  const [metaDesc, setMetaDesc] = useState(() => localStorage.getItem("blog_draft_metaDesc") || "");

  // Auto-save draft status time state
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Editing mode & version control states
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Dynamic Categories Management states
  const [categories, setCategories] = useState<string[]>(() => {
    const stored = localStorage.getItem("blog_categories");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return ["Guides", "News", "Service Updates", "Tutorials", "General"];
  });
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [categoryRenameValue, setCategoryRenameValue] = useState("");
  const [focusKeyword, setFocusKeyword] = useState(() => localStorage.getItem("blog_draft_focusKeyword") || "");

  // Read-only and SEO preview device states
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [seoPreviewDevice, setSeoPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Publish Date & Auto-Publish Scheduling States
  const [publishDate, setPublishDate] = useState(() => localStorage.getItem("blog_draft_publishDate") || "");
  const [isAutoPublish, setIsAutoPublish] = useState(() => localStorage.getItem("blog_draft_isAutoPublish") === "true");

  // AI Image Generator Modal States
  const [showAiImageModal, setShowAiImageModal] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState("");
  const [generatingAiImage, setGeneratingAiImage] = useState(false);

  const getWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const getCharStats = () => {
    const bodyWords = getWordCount(content);
    const bodyChars = content.length;
    const titleGuWords = getWordCount(titleGu);
    const titleEnWords = getWordCount(titleEn);
    const titleGuChars = titleGu.length;
    const titleEnChars = titleEn.length;
    
    const draftTotalChars = 
      titleGu.length + 
      titleEn.length + 
      titleHi.length + 
      excerpt.length + 
      content.length + 
      tags.length + 
      altText.length + 
      metaDesc.length + 
      focusKeyword.length;

    return {
      bodyWords,
      bodyChars,
      titleGuWords,
      titleEnWords,
      titleGuChars,
      titleEnChars,
      draftTotalChars
    };
  };

  // Automatically calculate reading time when content changes
  useEffect(() => {
    const words = getWordCount(content);
    const calculated = Math.max(1, Math.ceil(words / 200));
    setReadingTime(calculated);
  }, [content]);

  // Set dirty flag when form values change
  useEffect(() => {
    setIsDirty(true);
  }, [titleGu, titleEn, titleHi, excerpt, content, category, tags, author, imageUrl, readingTime, altText, metaDesc, focusKeyword]);

  // Periodically save draft updates every 30 seconds to local storage to prevent data loss
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        if (!titleGu && !titleEn && !titleHi && !excerpt && !content && !tags && !altText && !metaDesc && !focusKeyword) return;
        localStorage.setItem("blog_draft_titleGu", titleGu);
        localStorage.setItem("blog_draft_titleEn", titleEn);
        localStorage.setItem("blog_draft_titleHi", titleHi);
        localStorage.setItem("blog_draft_excerpt", excerpt);
        localStorage.setItem("blog_draft_content", content);
        localStorage.setItem("blog_draft_category", category);
        localStorage.setItem("blog_draft_tags", tags);
        localStorage.setItem("blog_draft_author", author);
        localStorage.setItem("blog_draft_imageUrl", imageUrl);
        localStorage.setItem("blog_draft_readingTime", String(readingTime));
        localStorage.setItem("blog_draft_altText", altText);
        localStorage.setItem("blog_draft_metaDesc", metaDesc);
        localStorage.setItem("blog_draft_focusKeyword", focusKeyword);
        setLastSavedTime(new Date().toLocaleTimeString());
        setIsDirty(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [titleGu, titleEn, titleHi, excerpt, content, category, tags, author, imageUrl, readingTime, altText, metaDesc, focusKeyword, isDirty]);

  // Collapsible Blog Dashboard state
  const [showStats, setShowStats] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Funnel linking integration state (Architectural Requirement 3)
  const [docLists, setDocLists] = useState<any[]>([]);
  const [serviceMasterOptions, setServiceMasterOptions] = useState<any[]>([]);
  const [docsListId, setDocsListId] = useState("");
  const [linkedServiceId, setLinkedServiceId] = useState("");
  const [linkedPdfUrl, setLinkedPdfUrl] = useState("");

  const handleAutoGenerateTags = async () => {
    if (!content.trim()) {
      toast.error("ઓટો-ટેગ્સ જનરેટ કરવા માટે કૃપા કરીને સંપૂર્ણ કન્ટેન્ટ દાખલ કરો.");
      return;
    }

    setGeneratingTags(true);
    const toastId = toast.loading("Gemini આર્ટિકલ વિશ્લેષણ કરી રહ્યું છે...");
    try {
      const res = await axios.post(
        "/api/blogs/generate-tags",
        {
          titleGu,
          titleEn,
          content,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (res.data && res.data.success) {
        setTags(res.data.tags);
        toast.success("તમામ એસઈઓ (SEO) ટેગ્સ જનરેટ કરવામાં આવ્યા!", { id: toastId });
      } else {
        toast.error("ટેગ્સ જનરેટ કરવામાં ભૂલ આવી: " + (res.data.error || "અજાણી ભૂલ"), { id: toastId });
      }
    } catch (err: any) {
      toast.error("સંપર્ક પ્રક્રિયા નિષ્ફળ: " + (err.response?.data?.error || err.message), { id: toastId });
    } finally {
      setGeneratingTags(false);
    }
  };

  const handleAutoGenerateAltText = async () => {
    if (!content.trim() && !titleGu.trim()) {
      toast.error("ઓટો-Alt ટેક્સ્ટ જનરેટ કરવા માટે કૃપા કરીને આર્ટિકલ ટાઇટલ અથવા કન્ટેન્ટ દાખલ કરો.");
      return;
    }

    setGeneratingAlt(true);
    const toastId = toast.loading("Gemini આ ઇમેજ માટે સચોટ વિગતો (Alt Text) વિચારી રહ્યું છે...");
    try {
      const res = await axios.post(
        "/api/blogs/generate-alt-text",
        {
          titleGu,
          titleEn,
          content,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (res.data && res.data.success) {
        setAltText(res.data.altText);
        toast.success("ઇમેજ માટે AI-આધારિત Alt ટેક્સ્ટ જનરેટ કરવામાં આવી!", { id: toastId });
      } else {
        toast.error("Alt ટેક્સ્ટ જનરેટ કરવામાં ભૂલ આવી: " + (res.data.error || "અજાણી ભૂલ"), { id: toastId });
      }
    } catch (err: any) {
      toast.error("સંપર્ક પ્રક્રિયા નિષ્ફળ: " + (err.response?.data?.error || err.message), { id: toastId });
    } finally {
      setGeneratingAlt(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingStats(true);
    try {
      const res = await axios.get("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.data && res.data.success) {
        setAnalyticsData(res.data.data.blogAnalytics || null);
      }
    } catch (err) {
      console.warn("CMS metrics fetch failed:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.get("/api/blogs");
      if (res.data && res.data.success) {
        setBlogs(res.data.data || []);
      } else {
        setErrorMsg(res.data?.error || "Unknown error occurred");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setErrorMsg(msg);
      toast.error("બ્લોગ લોડ કરવામાં ભૂલ આવી: " + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showStats) {
      fetchAnalytics();
    }
  }, [showStats, blogs]);

  useEffect(() => {
    fetchBlogs();

    // Fetch master services list for CTA links (Architectural Requirement 3)
    axios.get("/api/services-master")
      .then((res) => {
        if (res.data && res.data.success) {
          setServiceMasterOptions(res.data.data || []);
        }
      })
      .catch((err) => {
        console.warn("Failed to load services master:", err.message);
      });
  }, []);

  // Start editing a blog post and load its history
  const handleStartEdit = async (blog: Blog) => {
    setEditingBlogId(blog.ID);
    setTitleGu(blog.Title_Gu || "");
    setTitleEn(blog.Title_En || "");
    setTitleHi(blog.Title_Hi || "");
    setExcerpt(blog.Excerpt || "");
    setContent(blog.Content || "");
    setCategory(blog.Category || "Guides");
    setTags(blog.Tags || "");
    setAuthor(blog.Author || "અમિત ઓનલાઇન સર્વિસીસ");
    setImageUrl(blog.Image || "");
    setReadingTime(blog.ReadingTime || 5);
    setAltText(blog.AltText || "");
    setMetaDesc(blog.MetaDesc || "");
    setDocsListId(blog.DocsListID || "");
    setLinkedServiceId(blog.LinkedServiceID || "");
    setLinkedPdfUrl(blog.LinkedPdfUrl || "");
    
    // Fetch History for this specific blog
    setLoadingHistory(true);
    setHistoryList([]);
    try {
      const res = await axios.get(`/api/blogs/${blog.ID}/history`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.data && res.data.success) {
        setHistoryList(res.data.data || []);
      }
    } catch (err: any) {
      console.warn("Failed to load blog history:", err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Revert a blog post to a specific version from history
  const handleRevertVersion = async (historyId: string) => {
    if (!editingBlogId) return;
    if (!confirm("શું તમે ખરેખર આ આર્ટિકલને આ જૂની આવૃત્તિમાં રીવર્ટ કરવા માંગો છો?")) return;
    
    const toastId = toast.loading("આવૃત્તિ રીવર્ટ થઈ રહી છે...");
    try {
      const res = await axios.post(`/api/blogs/${editingBlogId}/revert`, { historyId }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.data && res.data.success) {
        toast.success("આવૃત્તિ સફળતાપૂર્વક પુનઃસ્થાપિત (Reverted) કરવામાં આવી છે!", { id: toastId });
        // Reload fields from reverted blog
        const rev = res.data.data;
        setTitleGu(rev.Title_Gu || "");
        setTitleEn(rev.Title_En || "");
        setTitleHi(rev.Title_Hi || "");
        setExcerpt(rev.Excerpt || "");
        setContent(rev.Content || "");
        setCategory(rev.Category || "Guides");
        setTags(rev.Tags || "");
        setAuthor(rev.Author || "અમિત ઓનલાઇન સર્વિસીસ");
        setImageUrl(rev.Image || "");
        setReadingTime(rev.ReadingTime || 5);
        setAltText(rev.AltText || "");
        setMetaDesc(rev.MetaDesc || "");
        setDocsListId(rev.DocsListID || "");
        setLinkedServiceId(rev.LinkedServiceID || "");
        setLinkedPdfUrl(rev.LinkedPdfUrl || "");
        
        // Refresh full blogs list
        fetchBlogs();
        // Refresh history
        handleStartEdit(rev);
      } else {
        toast.error("રીવર્ટ નિષ્ફળ: " + (res.data.error || "અજાણી ભૂલ"), { id: toastId });
      }
    } catch (err: any) {
      toast.error("રીવર્ટ કરવામાં ભૂલ આવી: " + err.message, { id: toastId });
    }
  };

  const handleAutoGenerateAiImage = async () => {
    if (!titleGu && !titleEn) {
      toast.error("કવર ઇમેજ જનરેટ કરવા માટે કૃપા કરીને પહેલા બ્લોગ ટાઇટલ ઉમેરો.");
      return;
    }
    setGeneratingAiImage(true);
    const toastId = toast.loading("✨ AI દ્વારા બ્લોગ કવર ઇમેજ નિર્માણ ચાલુ છે...");

    try {
      const res = await axios.post(
        "/api/blogs/generate-ai-image",
        {
          blogTitle: titleGu || titleEn,
          category
        },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );

      if (res.data && res.data.success && res.data.imageUrl) {
        setImageUrl(res.data.imageUrl);
        localStorage.setItem("blog_draft_imageUrl", res.data.imageUrl);
        toast.success(
          res.data.isFallback 
            ? "ઉચ્ચ-ગુણવત્તાવાળી એડિટોરિયલ ઇમેજ ઓટો સેટ કરવામાં આવી!" 
            : "✨ AI દ્વારા અનન્ય કવર ઇમેજ સફળતાપૂર્વક જનરેટ કરવામાં આવી!",
          { id: toastId }
        );
      } else {
        toast.error("ઇમેજ જનરેટ કરવામાં નિષ્ફળતા મળી.", { id: toastId });
      }
    } catch (err: any) {
      toast.error("AI ઇમેજ જનરેટર ભૂલ: " + (err.response?.data?.error || err.message), { id: toastId });
    } finally {
      setGeneratingAiImage(false);
    }
  };

  // Category management helper functions
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      toast.error("આ કેટેગરી પહેલેથી અસ્તિત્વમાં છે!");
      return;
    }
    const updated = [...categories, trimmed];
    setCategories(updated);
    localStorage.setItem("blog_categories", JSON.stringify(updated));
    setNewCategoryInput("");
    toast.success("નવી કેટેગરી સફળતાપૂર્વક ઉમેરવામાં આવી!");
  };

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) {
      toast.error("ઓછામાં ઓછી એક કેટેગરી હોવી જરૂરી છે!");
      return;
    }
    if (category === catToDelete) {
      const remaining = categories.filter(c => c !== catToDelete);
      setCategory(remaining[0]);
    }
    const updated = categories.filter(c => c !== catToDelete);
    setCategories(updated);
    localStorage.setItem("blog_categories", JSON.stringify(updated));
    toast.success("કેટેગરી રદ કરવામાં આવી.");
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    if (categories.includes(trimmed)) {
      toast.error("આ નામની કેટેગરી પહેલેથી અસ્તિત્વમાં છે!");
      return;
    }
    const updated = categories.map(c => c === oldName ? trimmed : c);
    setCategories(updated);
    localStorage.setItem("blog_categories", JSON.stringify(updated));
    if (category === oldName) {
      setCategory(trimmed);
    }
    toast.success("કેટેગરીનું નામ સફળતાપૂર્વક બદલવામાં આવ્યું!");
  };

  const handlePublishAndGeneratePDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleGu.trim() || !content.trim()) {
      toast.error("કૃપા કરીને ગુજરાતી શીર્ષક અને કન્ટેન્ટ દાખલ કરો.");
      return;
    }

    if (metaDesc.length > 150) {
      toast.error("ભૂલ: મેટા ડિસ્ક્રિપ્શન ૧૫૦ અક્ષરોની મર્યાદાથી વધુ છે.");
      return;
    }

    if (altText.length > 100) {
      toast.error("ભૂલ: ઈમેજ Alt ટેક્સ્ટ ૧૦૦ અક્ષરોની મર્યાદાથી વધુ છે.");
      return;
    }

    // Link validation
    if (linkedServiceId) {
      const matchedSvc = serviceMasterOptions.find(svc => String(svc.ID) === String(linkedServiceId));
      if (!matchedSvc) {
        toast.error("ભૂલ: પસંદ કરેલ સેવા માન્ય નથી.");
        return;
      }
    }

    // Generate/Use a unique ID for the blog if it doesn't already have one
    const blogId = editingBlogId || `BLOG-${Date.now()}`;

    const blogPayload = {
      ID: blogId,
      Title_En: titleEn || titleGu,
      Title_Gu: titleGu,
      Title_Hi: titleHi || titleGu,
      Excerpt: excerpt,
      Content: content,
      Category: category,
      Tags: tags,
      Author: author,
      Image: imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
      ReadingTime: readingTime,
      DocsListID: docsListId,
      LinkedServiceID: linkedServiceId,
      LinkedPdfUrl: linkedPdfUrl,
      AltText: altText,
      MetaDesc: metaDesc,
      Status: "Published",
      Timestamp: new Date().toISOString()
    };

    setSubmitting(true);
    setGeneratingDocs(true);
    const toastId = toast.loading("બ્લોગ સેવ થઈ રહ્યો છે અને ગુગલ ડ્રાઇવ ફોલ્ડર વ્યવસ્થાપન શરૂ થઈ રહ્યું છે...");

    try {
      // 1. Save the blog to the sheet via POST /api/blogs
      const saveRes = await axios.post(
        "/api/blogs",
        {
          id: blogPayload.ID,
          titleEn: blogPayload.Title_En,
          titleGu: blogPayload.Title_Gu,
          titleHi: blogPayload.Title_Hi,
          excerpt: blogPayload.Excerpt,
          content: blogPayload.Content,
          category: blogPayload.Category,
          tags: blogPayload.Tags,
          author: blogPayload.Author,
          image: blogPayload.Image,
          readingTime: blogPayload.ReadingTime,
          docsListId: blogPayload.DocsListID,
          linkedServiceId: blogPayload.LinkedServiceID,
          linkedPdfUrl: blogPayload.LinkedPdfUrl,
          altText: blogPayload.AltText,
          metaDesc: blogPayload.MetaDesc,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (!saveRes.data || !saveRes.data.success) {
        throw new Error(saveRes.data?.error || "બ્લોગ સેવ કરવામાં નિષ્ફળતા મળી");
      }

      // 2. Trigger ACTION_GENERATE_BLOG_DOCS backend action
      toast.loading("બ્લોગ દસ્તાવેજો (Google Doc અને PDF) જનરેટ થઈ રહ્યા છે...", { id: toastId });
      
      const genRes = await axios.post(
        "/api/blogs/generate-docs",
        {
          blogData: blogPayload
        },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );

      if (genRes.data && genRes.data.success) {
        toast.success("બ્લોગ પબ્લિશ થયો અને Google Doc / PDF સફળતાપૂર્વક જનરેટ કરવામાં આવ્યા!", { id: toastId });
        
        // Clear fields
        setTitleGu("");
        setTitleEn("");
        setTitleHi("");
        setExcerpt("");
        setContent("");
        setTags("");
        setImageUrl("");
        setReadingTime(5);
        setDocsListId("");
        setLinkedServiceId("");
        setLinkedPdfUrl("");
        setAltText("");
        setMetaDesc("");
        setEditingBlogId(null);
        setHistoryList([]);
        localStorage.removeItem("blog_draft_titleGu");
        localStorage.removeItem("blog_draft_titleEn");
        localStorage.removeItem("blog_draft_titleHi");
        localStorage.removeItem("blog_draft_excerpt");
        localStorage.removeItem("blog_draft_content");
        localStorage.removeItem("blog_draft_category");
        localStorage.removeItem("blog_draft_tags");
        localStorage.removeItem("blog_draft_author");
        localStorage.removeItem("blog_draft_imageUrl");
        localStorage.removeItem("blog_draft_readingTime");
        localStorage.removeItem("blog_draft_altText");
        localStorage.removeItem("blog_draft_metaDesc");
        localStorage.removeItem("blog_draft_focusKeyword");
        setFocusKeyword("");
        setLastSavedTime(null);
        fetchBlogs();
      } else {
        toast.error("દસ્તાવેજો જનરેશન નિષ્ફળ: " + (genRes.data.error || "અજાણી ભૂલ"), { id: toastId });
      }

    } catch (err: any) {
      toast.error("કાર્યવાહી દરમિયાન ભૂલ આવી: " + err.message, { id: toastId });
    } finally {
      setSubmitting(false);
      setGeneratingDocs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleGu.trim() || !content.trim()) {
      toast.error("કૃપા કરીને ગુજરાતી શીર્ષક અને કન્ટેન્ટ દાખલ કરો.");
      return;
    }

    if (metaDesc.length > 150) {
      toast.error("ભૂલ: મેટા ડિસ્ક્રિપ્શન ૧૫૦ અક્ષરોની મર્યાદાથી વધુ છે.");
      return;
    }

    if (altText.length > 100) {
      toast.error("ભૂલ: ઈમેજ Alt ટેક્સ્ટ ૧૦૦ અક્ષરોની મર્યાદાથી વધુ છે.");
      return;
    }

    // Link validation (ensure mapping and active warnings)
    if (linkedServiceId) {
      const matchedSvc = serviceMasterOptions.find(svc => String(svc.ID) === String(linkedServiceId));
      if (!matchedSvc) {
        toast.error("ભૂલ: પસંદ કરેલ સેવા માન્ય નથી.");
        return;
      }
    }

    const toastId = toast.loading(editingBlogId ? "બ્લોગ અપડેટ થઈ રહ્યો છે..." : "નવો બ્લોગ પબ્લિશ થઈ રહ્યો છે...");
    setSubmitting(true);

    try {
      const res = await axios.post(
        "/api/blogs",
        {
          id: editingBlogId, // pass existing ID if editing
          titleEn: titleEn || titleGu,
          titleGu,
          titleHi: titleHi || titleGu,
          excerpt,
          content,
          category,
          tags,
          author,
          image: imageUrl || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
          readingTime,
          docsListId,
          linkedServiceId,
          linkedPdfUrl,
          altText,
          metaDesc,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (res.data && res.data.success) {
        toast.success(editingBlogId ? "બ્લોગ સફળતાપૂર્વક અપડેટ કરવામાં આવ્યો છે!" : "નવો બ્લોગ સફળતાપૂર્વક પબ્લિશ કરવામાં આવ્યો છે!", { id: toastId });
        // Clear fields
        setTitleGu("");
        setTitleEn("");
        setTitleHi("");
        setExcerpt("");
        setContent("");
        setTags("");
        setImageUrl("");
        setReadingTime(5);
        setDocsListId("");
        setLinkedServiceId("");
        setLinkedPdfUrl("");
        setAltText("");
        setMetaDesc("");
        setEditingBlogId(null);
        setHistoryList([]);
        localStorage.removeItem("blog_draft_titleGu");
        localStorage.removeItem("blog_draft_titleEn");
        localStorage.removeItem("blog_draft_titleHi");
        localStorage.removeItem("blog_draft_excerpt");
        localStorage.removeItem("blog_draft_content");
        localStorage.removeItem("blog_draft_category");
        localStorage.removeItem("blog_draft_tags");
        localStorage.removeItem("blog_draft_author");
        localStorage.removeItem("blog_draft_imageUrl");
        localStorage.removeItem("blog_draft_readingTime");
        localStorage.removeItem("blog_draft_altText");
        localStorage.removeItem("blog_draft_metaDesc");
        localStorage.removeItem("blog_draft_focusKeyword");
        setFocusKeyword("");
        setLastSavedTime(null);
        fetchBlogs();
      } else {
        toast.error("પબ્લિશ નિષ્ફળ: " + (res.data.error || "અજાણી ભૂલ"), { id: toastId });
      }
    } catch (err: any) {
      toast.error("પબ્લિશ કરતી વખતે ભૂલ આવી: " + err.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("શું તમે ખરેખર આ બ્લોગ આર્ટિકલને કાયમી ધોરણે રદ કરવા માંગો છો?")) {
      return;
    }

    const toastId = toast.loading("બ્લોગ ડિલીટ થઈ રહ્યો છે...");
    try {
      const res = await axios.post(
        "/api/blogs/delete",
        { id },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      if (res.data && res.data.success) {
        toast.success("બ્લોગ સફળતાપૂર્વક રદ કરવામાં આવ્યો છે.", { id: toastId });
        setBlogs((prev) => prev.filter((b) => b.ID !== id));
      } else {
        toast.error("ડિલીટ નિષ્ફળ: " + (res.data.error || "અજાણી ભૂલ"), { id: toastId });
      }
    } catch (err: any) {
      toast.error("ડિલીટ કરતી વખતે ભૂલ આવી: " + err.message, { id: toastId });
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("ઇમેજ અપલોડ થઈ રહી છે...");
    setUploadingImage(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Content = (reader.result as string).split(",")[1];
        try {
          const res = await axios.post(
            "/api/upload",
            {
              content: base64Content,
              mimeType: file.type,
              name: file.name,
              category: "Blog"
            },
            {
              headers: { Authorization: `Bearer ${user.token}` }
            }
          );
          if (res.data && res.data.success) {
            setImageUrl(res.data.fileLink || res.data.fileUrl || "");
            toast.success("ઇમેજ સફળતાપૂર્વક અપલોડ થઈ ગઈ છે!", { id: toastId });
          } else {
            toast.error("અપલોડ નિષ્ફળ: " + (res.data.error || "અજાણી ભૂલ"), { id: toastId });
          }
        } catch (err: any) {
          toast.error("અપલોડ કરતી વખતે ભૂલ આવી: " + err.message, { id: toastId });
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("ફાઇલ વાંચવામાં ભૂલ આવી.", { id: toastId });
      setUploadingImage(false);
    }
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById("blog-content-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(startPos, endPos);
    let replacement = "";

    if (syntax === "h1") {
      replacement = `\n# ${selectedText || "હેડિંગ ૧ (H1 Heading)"}\n`;
    } else if (syntax === "h2") {
      replacement = `\n## ${selectedText || "હેડિંગ ૨ (H2 Heading)"}\n`;
    } else if (syntax === "bold") {
      replacement = `**${selectedText || "ઘાટા અક્ષરો (Bold)"}**`;
    } else if (syntax === "italic") {
      replacement = `*${selectedText || "ત્રાંસા અક્ષરો (Italic)"}*`;
    } else if (syntax === "link") {
      replacement = `[${selectedText || "લિંક લખાણ (Link Text)"}](https://example.com)`;
    } else if (syntax === "list") {
      replacement = `\n- ${selectedText || "યાદી આઇટમ (List Item)"}\n`;
    }

    const newContent = text.substring(0, startPos) + replacement + text.substring(endPos);
    setContent(newContent);
    
    // Set focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = startPos + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const calculateSeoScore = () => {
    let score = 30; // base score for having content
    if (!titleGu.trim() && !titleEn.trim()) return 0;
    
    // Title length (optimal 30-70)
    const titleLen = Math.max(titleGu.length, titleEn.length);
    if (titleLen >= 30 && titleLen <= 70) score += 20;
    else if (titleLen > 0) score += 10;
    
    // Meta Description length (optimal 110-160)
    const metaLen = metaDesc.length;
    if (metaLen >= 110 && metaLen <= 160) score += 20;
    else if (metaLen > 0) score += 10;
    
    // Alt text length
    if (altText.trim().length > 15) score += 10;
    
    // Excerpt length
    if (excerpt.trim().length > 30) score += 10;
    
    // Focus keyword checks
    if (focusKeyword.trim()) {
      const keyword = focusKeyword.toLowerCase().trim();
      
      // Keyword in Title
      if (titleGu.toLowerCase().includes(keyword) || titleEn.toLowerCase().includes(keyword)) {
        score += 5;
      }
      // Keyword in Meta Desc
      if (metaDesc.toLowerCase().includes(keyword)) {
        score += 5;
      }
      // Keyword in Content
      if (content.toLowerCase().includes(keyword)) {
        score += 10;
      }
    } else {
      score += 10; // offset if no keyword is set
    }
    
    return Math.min(score, 100);
  };

  const getMetaDescStatus = () => {
    const len = metaDesc.length;
    if (len === 0) {
      return {
        label: "ખાલી છે (Empty)",
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/30",
        message: "SEO માટે મેટા ડિસ્ક્રિપ્શન લખવું ખૂબ જ જરૂરી છે.",
        isOptimal: false,
        isWarning: false
      };
    } else if (len < 100) {
      return {
        label: "ખૂબ ટૂંકું (Too Short)",
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/30",
        message: "વધુ વિગતો ઉમેરો. આદર્શ લંબાઈ ૧૦૦ થી ૧૫૦ અક્ષરો છે.",
        isOptimal: false,
        isWarning: false
      };
    } else if (len <= 150) {
      return {
        label: "ઉત્તમ (Perfect Length)",
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/30",
        message: "મેટા ડિસ્ક્રિપ્શનની લંબાઈ ગૂગલ માટે એકદમ યોગ્ય છે!",
        isOptimal: true,
        isWarning: false
      };
    } else {
      return {
        label: "ચેતવણી: મર્યાદા વટાવી (Warning: Exceeded)",
        color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50",
        message: "ભૂલ: મેટા ડિસ્ક્રિપ્શન ૧૫૦ અક્ષરોથી વધુ ન હોવું જોઈએ.",
        isOptimal: false,
        isWarning: true
      };
    }
  };

  const getAltTextStatus = () => {
    const len = altText.length;
    if (len === 0) {
      return {
        label: "ખાલી છે (Empty)",
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-900/30",
        message: "ઈમેજ Alt ટેક્સ્ટ ખાલી છે. ગૂગલ ઈમેજ સર્ચ માટે જરૂરી છે.",
        isOptimal: false,
        isWarning: false
      };
    } else if (len < 10) {
      return {
        label: "ખૂબ ટૂંકું (Too Short)",
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-900/30",
        message: "આદર્શ લંબાઈ ૧૦ થી ૧૦૦ અક્ષરો છે.",
        isOptimal: false,
        isWarning: false
      };
    } else if (len <= 100) {
      return {
        label: "ઉત્તમ (Perfect Length)",
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-900/30",
        message: "ઇમેજ ડિસ્ક્રિપ્શનની લંબાઈ ગૂગલ ઈમેજીસ સર્ચ માટે યોગ્ય છે!",
        isOptimal: true,
        isWarning: false
      };
    } else {
      return {
        label: "ચેતવણી: મર્યાદા વટાવી (Warning: Exceeded)",
        color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50",
        message: "ભૂલ: Alt ટેક્સ્ટ ૧૦૦ અક્ષરોથી વધુ ન હોવું જોઈએ.",
        isOptimal: false,
        isWarning: true
      };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full text-slate-800 dark:text-slate-100"
      id="admin-blog-manager"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/80 gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-blue-600 dark:text-blue-400" />
            બ્લોગ કન્ટેન્ટ મેનેજમેન્ટ સિસ્ટમ (CMS)
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            નવા બ્લોગ આર્ટિકલ્સ લખો, પબ્લિશ કરો અને કાયમી ધોરણે સંચાલિત કરો.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowStats(!showStats)}
            className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${
              showStats 
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white animate-pulse" 
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-250 border border-slate-200/50 dark:border-slate-750"
            }`}
          >
            <TrendingUp size={14} /> {showStats ? "ડેશબોર્ડ બંધ કરો" : "આંકડા અને એનાલિટિક્સ ডેશબોર્ડ"}
            {showStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={14} /> પાછા જાઓ
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-start gap-4 text-left">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl mt-0.5">
            <Database size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-red-800 dark:text-red-200 uppercase tracking-wider">
              બ્લોગ ડેટાબેઝ રૂપરેખાંકન ત્રુટિ (Blog Database Configuration Error)
            </h4>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
              {errorMsg}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <p className="text-[11px] text-red-500/80 dark:text-red-400/80 font-medium">
                કૃપા કરીને એડમિન મેનૂમાં "વ્યવસાય સેટિંગ્સ (Business Settings)" પર જાઓ અને "Blog Database Sheet URL" સેટ કરો.
              </p>
            </div>
          </div>
        </div>
      )}

      {showStats && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-6 md:p-8 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-150 dark:border-slate-800 space-y-6 text-left"
          id="blog-visitor-dashboard-collapsible"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="text-purple-600 dark:text-purple-400" />
                બ્લોગ પરફોર્મન્સ સમરી ડેશબોર્ડ (Blog Performance Dashboard)
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
                રીડર એન્ગેજમેન્ટ માપદંડો, દૈનિક વ્યુઝ અને પ્રવાહ વિશ્લેષણ
              </p>
            </div>
            <button 
              type="button"
              onClick={fetchAnalytics}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-850 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-550 cursor-pointer text-slate-800 dark:text-slate-300"
            >
              {loadingStats ? "લોડ થાય છે..." : "રિફ્રેશ કરો ↻"}
            </button>
          </div>

          {loadingStats && !analyticsData ? (
            <div className="py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-center text-xs text-slate-400">
              સર્વરથી એનાલિટિક્સ માહિતી લાવવામાં આવી રહી છે...
            </div>
          ) : analyticsData ? (
            <div className="space-y-6">
              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "કુલ વ્યુઝ (Total Views)", val: analyticsData.totalViews, icon: <Eye className="text-blue-600" />, sub: "વાંચકોનો પ્રતિસાદ" },
                  { label: "કુલ લાઈક્સ (Total Likes)", val: analyticsData.totalLikes, icon: <Heart className="text-red-500" />, sub: "રૂચિ રેટિંગ્સ" },
                  { label: "કુલ શેર્સ (Total Shares)", val: analyticsData.totalShares, icon: <Share2 className="text-green-600" />, sub: "સામાજિક ફેલાવો" },
                  { label: "કુલ લેખો (Total Articles)", val: analyticsData.totalBlogs, icon: <BookOpen className="text-purple-600" />, sub: "પબ્લિશ વર્ક" },
                ].map((c, i) => (
                  <div key={c.label} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">{c.icon}</div>
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block">{c.label}</span>
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-tight block mt-0.5">{c.val?.toLocaleString() || 0}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium block">{c.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AreaChart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                  <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider mb-1">વાંચકોનો ટ્રેન્ડ (Reader Engagement Trends)</h4>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-4">સાપ્તાહિક પ્રવૃત્તિ ટ્રેકિંગ</p>
                  <div className="h-[220px] w-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData.readerEngagementTrends || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="cmsColorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800/50" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", backgroundColor: "#FFF", fontSize: "11px" }} />
                        <Area type="monotone" dataKey="views" name="વ્યુઝ" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#cmsColorViews)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Categories BarChart */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                  <h4 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider mb-1">કેટેગરી મુજબ પ્રદર્શન (Views by Category Focus)</h4>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-4">પ્રકાર અનુસાર લોકપ્રિયતા વિશ્લેષણ</p>
                  <div className="h-[220px] w-full min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.viewsByCategory || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800/50" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", backgroundColor: "#FFF", fontSize: "11px" }} />
                        <Bar dataKey="value" name="વ્યુઝ" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Best Performing Table */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                <h4 className="text-xs font-black text-slate-955 dark:text-white uppercase tracking-wider mb-3">શ્રેષ્ઠ પ્રદર્શન કરતા બ્લોગ (Top Performing Posts)</h4>
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-350">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 font-extrabold text-[9px] text-slate-400 uppercase tracking-widest">
                      <th className="py-2.5 px-3">શીર્ષક (Article)</th>
                      <th className="py-2.5 px-3">કેટેગરી</th>
                      <th className="py-2.5 px-3 text-center">વ્યુઝ (Views)</th>
                      <th className="py-2.5 px-3 text-center">શેર્સ (Shares)</th>
                      <th className="py-2.5 px-3 text-center">લાઈક્સ (Likes)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {(analyticsData.topPerformingPosts || []).map((p: any, idx: number) => (
                      <tr key={p.title || p.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white truncate max-w-[240px]">{p.title}</td>
                        <td className="py-3 px-3">
                          <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[9px] font-extrabold">{p.category}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">👀 {p.views}</td>
                        <td className="py-3 px-3 text-center">📤 {p.shares}</td>
                        <td className="py-3 px-3 text-center">❤️ {p.likes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-12 bg-white dark:bg-slate-900 rounded-2xl text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
              આ એનાલિટિક્સ ફીચર માટે ઉપલબ્ધ ડેટા લોડ કરવામાં મુશ્કેલી આવી રહી છે.
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Creation Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-br-3xl -z-10" />

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              {editingBlogId ? "બ્લોગ આર્ટિકલ અપડેટ કરો (Edit Article)" : "નવો બ્લોગ આર્ટિકલ લખો"}
            </h3>
            {lastSavedTime && (
              <span className="text-[9px] bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 px-2.5 py-1 rounded-md font-mono font-bold flex items-center gap-1.5 border border-slate-100 dark:border-slate-850">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                Draft saved: {lastSavedTime}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  બ્લોગ શીર્ષક (ગુજરાતી) *
                </label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={titleGu}
                  onChange={(e) => setTitleGu(e.target.value)}
                  placeholder="દા.ત. ડિજિટલ ગુજરાત પોર્ટલની નવી માર્ગદર્શિકા"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Blog Title (English) [વૈકલ્પિક]
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. New Guidelines for Digital Gujarat"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Blog Title (Hindi) [વૈકલ્પિક]
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={titleHi}
                  onChange={(e) => setTitleHi(e.target.value)}
                  placeholder="उदा. डिजिटल गुजरात पोर्टल की नई मार्गदर्शिका"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                    કેટેગરી (Category)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (isReadOnly) return;
                      // Scroll to right column category card or toggle it
                      const el = document.getElementById("category-management-card");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                      } else {
                        toast.info("જમણી બાજુ પર કેટેગરી પેનલ જુઓ.");
                      }
                    }}
                    disabled={isReadOnly}
                    className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ⚙️ મેનેજ કરો
                  </button>
                </div>
                <select
                  value={category}
                  disabled={isReadOnly}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  વાંચવાનો સમય (Reading Time)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    disabled={isReadOnly}
                    value={readingTime}
                    onChange={(e) => setReadingTime(parseInt(e.target.value) || 5)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">મિનિટ</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  લેખક (Author)
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                શોર્ટ પ્રસ્તાવના / ટૂંકો સારાંશ (Excerpt - ગુજરાતી) *
              </label>
              <textarea
                rows={2}
                required
                disabled={isReadOnly}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="આર્ટિકલ વિશે એક અથવા બે ટૂંકા વાક્યો જે મુખ્ય પેજ પર દેખાશે..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 leading-relaxed text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
              />
            </div>

            {/* Meta Description with SEO Character Counter and Live Validation */}
            <div className="bg-slate-50/40 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-left space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                  મેટા વર્ણન (Meta Description - Google Search Preview) *
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getMetaDescStatus().color}`}>
                    {getMetaDescStatus().label}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">
                    {metaDesc.length} / 150
                  </span>
                </div>
              </div>
              <textarea
                rows={2}
                required
                disabled={isReadOnly}
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                placeholder="મેટા વર્ણન (Meta Description) એ ગૂગલ સર્ચ રીઝલ્ટમાં દેખાતી ૨-૩ લાઈનની સમજૂતી છે..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 leading-relaxed text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
              />
              <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">
                {getMetaDescStatus().message}
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                સંપૂર્ણ કન્ટેન્ટ (Full Article Content) *
              </label>
              
              {/* Markdown Format Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900 p-2 rounded-t-xl border-t border-x border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => !isReadOnly && insertMarkdown("h1")}
                    disabled={isReadOnly}
                    className="px-2.5 py-1 text-[10px] font-black bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200/60 dark:border-slate-750 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="H1 Heading (# )"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => !isReadOnly && insertMarkdown("h2")}
                    disabled={isReadOnly}
                    className="px-2.5 py-1 text-[10px] font-black bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200/60 dark:border-slate-750 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="H2 Heading (## )"
                  >
                    H2
                  </button>
                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-1" />
                  <button
                    type="button"
                    onClick={() => !isReadOnly && insertMarkdown("bold")}
                    disabled={isReadOnly}
                    className="px-2 py-1 text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200/60 dark:border-slate-750 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Bold (**text**)"
                  >
                    Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => !isReadOnly && insertMarkdown("italic")}
                    disabled={isReadOnly}
                    className="px-2 py-1 text-[10px] font-medium italic bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200/60 dark:border-slate-750 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Italic (*text*)"
                  >
                    Italic
                  </button>
                  <button
                    type="button"
                    onClick={() => !isReadOnly && insertMarkdown("list")}
                    disabled={isReadOnly}
                    className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200/60 dark:border-slate-750 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="List Bullet (- )"
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => !isReadOnly && insertMarkdown("link")}
                    disabled={isReadOnly}
                    className="px-2 py-1 text-[10px] bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded border border-slate-200/60 dark:border-slate-750 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Insert Link [text](url)"
                  >
                    Link
                  </button>
                  <button
                    type="button"
                    onClick={() => !isReadOnly && setShowAiImageModal(true)}
                    disabled={isReadOnly}
                    className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded border border-amber-300/60 dark:border-amber-800/60 shadow-sm cursor-pointer flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Insert AI Generated Image"
                  >
                    <Sparkles size={11} className="text-amber-500" /> Image
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Reading Time Indicator in Toolbar */}
                  <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-200/50 dark:border-blue-800/50 text-[9px] font-black text-blue-700 dark:text-blue-300">
                    <Clock size={11} /> Reading Time: {readingTime} min
                  </div>

                  {/* Read-Only Toggle Switch */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-850 px-2 py-1 rounded border border-slate-200/60 dark:border-slate-700 shadow-sm">
                    <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">
                      👁️ ફક્ત પ્રિવ્યુ (Read-Only)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsReadOnly(!isReadOnly)}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isReadOnly ? "bg-blue-600" : "bg-slate-250 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isReadOnly ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {lastSavedTime && (
                    <span className="text-[9px] bg-emerald-55/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded font-mono font-black flex items-center gap-1.5 border border-emerald-250/60 dark:border-emerald-900/30">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                      Draft Saved: {lastSavedTime}
                    </span>
                  )}
                </div>
              </div>

              {isReadOnly ? (
                <div className="w-full px-5 py-4 min-h-[300px] rounded-b-xl border-b border-x border-t-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-sans leading-relaxed text-slate-900 dark:text-white overflow-y-auto max-h-[500px] text-left">
                  <div className="prose dark:prose-invert max-w-none">
                    {(() => {
                      if (!content) return <p className="text-slate-400 italic">કન્ટેન્ટ ખાલી છે...</p>;
                      const lines = content.split("\n");
                      let inList = false;
                      let listItems: React.ReactNode[] = [];
                      const elements: React.ReactNode[] = [];

                      const flushList = (key: number) => {
                        if (listItems.length > 0) {
                          elements.push(
                            <ul key={`list-${key}`} className="list-disc pl-6 my-4 space-y-2 text-slate-750 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                              {listItems}
                            </ul>
                          );
                          listItems = [];
                          inList = false;
                        }
                      };

                      const parseBoldTextLocal = (para: string, lineKey: string) => {
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
                            <strong key={`${lineKey}-b-${indexId++}`} className="font-extrabold text-slate-900 dark:text-white">
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

                      lines.forEach((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) {
                          flushList(idx);
                          return;
                        }

                        if (trimmed === "---" || trimmed === "***") {
                          flushList(idx);
                          elements.push(<hr key={idx} className="my-6 border-t border-slate-200 dark:border-slate-800" />);
                          return;
                        }

                        if (trimmed.startsWith("# ")) {
                          flushList(idx);
                          const headerText = trimmed.replace(/^#\s+/, "");
                          elements.push(
                            <h1 key={idx} className="text-2xl font-black text-slate-900 dark:text-white mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800 font-sans">
                              {headerText}
                            </h1>
                          );
                          return;
                        }

                        if (trimmed.startsWith("## ")) {
                          flushList(idx);
                          const headerText = trimmed.replace(/^##\s+/, "");
                          elements.push(
                            <h2 key={idx} className="text-xl font-black text-slate-900 dark:text-white mt-5 mb-2.5 pb-1.5 border-b border-slate-150 dark:border-slate-800 font-sans">
                              {headerText}
                            </h2>
                          );
                          return;
                        }

                        if (trimmed.startsWith("### ")) {
                          flushList(idx);
                          const headerText = trimmed.replace(/^###\s+/, "");
                          elements.push(
                            <h3 key={idx} className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2 font-sans">
                              {headerText}
                            </h3>
                          );
                          return;
                        }

                        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
                          inList = true;
                          const itemText = trimmed.substring(2);
                          const parsedNode = parseBoldTextLocal(itemText, `li-${idx}`);
                          listItems.push(<li key={`item-${idx}`}>{parsedNode}</li>);
                          return;
                        }

                        flushList(idx);
                        const parsedNode = parseBoldTextLocal(trimmed, `p-${idx}`);
                        elements.push(
                          <p key={idx} className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed mb-3">
                            {parsedNode}
                          </p>
                        );
                      });

                      flushList(lines.length);
                      return elements;
                    })()}
                  </div>
                </div>
              ) : (
                <textarea
                  id="blog-content-editor"
                  rows={12}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="અહીં તમારો આખો લેખ લખો. H1 કે H2 હેડિંગ માટે ઉપરના ટૂલબારનો ઉપયોગ કરો..."
                  className="w-full px-4 py-3 rounded-b-xl border-b border-x border-t-0 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:border-blue-500 leading-relaxed text-slate-900 dark:text-white"
                />
              )}

              {/* Comprehensive Word & Character Metrics Panel */}
              <div className="bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2 mt-2.5">
                <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[9px] text-slate-500 dark:text-slate-400">
                  <FileText size={12} className="text-blue-500" />
                  <span>📝 કન્ટેન્ટ અને ડ્રાફ્ટ પૃથ્થકરણ (Content & Draft Metrics)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 shadow-sm text-center">
                    <span className="block text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">લેખ શબ્દો (Body Words)</span>
                    <span className="text-sm font-black font-mono text-slate-800 dark:text-white">{getCharStats().bodyWords}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 shadow-sm text-center">
                    <span className="block text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">લેખ અક્ષરો (Body Chars)</span>
                    <span className="text-sm font-black font-mono text-slate-800 dark:text-white">{getCharStats().bodyChars}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 shadow-sm text-center">
                    <span className="block text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">ટાઇટલ અક્ષરો (GU / EN)</span>
                    <span className="text-sm font-black font-mono text-slate-800 dark:text-white">
                      {getCharStats().titleGuChars} <span className="text-slate-400 text-[10px]">/</span> {getCharStats().titleEnChars}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 shadow-sm text-center">
                    <span className="block text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">કુલ ડ્રાફ્ટ અક્ષરો (Draft Chars)</span>
                    <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">{getCharStats().draftTotalChars}</span>
                  </div>
                </div>
              </div>

              {/* Writing Insights Summary Panel */}
              <div className="bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-xl border border-purple-100 dark:border-purple-900/30 space-y-2 mt-2.5">
                <div className="flex items-center justify-between font-black uppercase tracking-wider text-[9px] text-purple-700 dark:text-purple-300">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={12} className="text-purple-600" />
                    <span>📊 રેટિંગ અને રાઇટિંગ ઇનસાઇટ્સ (Writing Insights)</span>
                  </div>
                  <span className="text-[8px] bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded font-mono">Realtime Draft Analytics</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">પેરેગ્રાફ સંખ્યા (Paragraphs)</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white font-mono">
                      {content ? content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">અંદાજિત સમય (Reading Time)</span>
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">
                      {readingTime} મિનિટ (200 WPM)
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 text-center">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">જટિલતા સ્કોર (Complexity)</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      {getWordCount(content) < 150 ? "🟢 સરળ (Simple)" : getWordCount(content) < 500 ? "🟡 મધ્યમ (Moderate)" : "🟣 ઊંડાણપૂર્વક (Advanced)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Publish Date & Auto-Publish Scheduling Section */}
              <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar size={13} className="text-blue-500" />
                    <span>પોસ્ટ શિડ્યુલિંગ અને ઓટો-પબ્લિશ (Publish Date & Auto-Publish)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">ઓટો-પબ્લિશ:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !isAutoPublish;
                        setIsAutoPublish(newVal);
                        localStorage.setItem("blog_draft_isAutoPublish", String(newVal));
                      }}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAutoPublish ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isAutoPublish ? "translate-x-3.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="datetime-local"
                    disabled={isReadOnly}
                    value={publishDate}
                    onChange={(e) => {
                      setPublishDate(e.target.value);
                      localStorage.setItem("blog_draft_publishDate", e.target.value);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-50"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-semibold">
                  {isAutoPublish 
                    ? "✓ જો ઓટો-પબ્લિશ ચાલુ હશે, તો નિર્ધારિત સમયે બ્લોગ આપોઆપ લાઇવ થઈ જશે." 
                    : "• નિર્ધારિત તારીખ પસંદ કરો અથવા તાત્કાલિક પબ્લિશ કરવા માટે ખાલી રાખો."}
                </p>
              </div>
              
              {/* SEO Writing Assistant & Guidelines card */}
              <div className="mt-2.5 p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/70 dark:border-blue-900/40 rounded-xl space-y-1.5 text-[10px] leading-relaxed text-slate-600 dark:text-slate-350">
                <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[9px] text-blue-600 dark:text-blue-400">
                  <Sparkles size={12} className="text-amber-500 animate-bounce" />
                  <span>SEO લેખન સહાયક (SEO Best Practices & Readability Rules)</span>
                </div>
                <p className="font-semibold">
                  • <strong>કીવર્ડ્સ (Keywords) પ્લેસમેન્ટ</strong>: તમારા મુખ્ય પ્રાઈમરી કીવર્ડ્સનો ઉપયોગ <strong>શીર્ષક (Title)</strong>, <strong>બ્લોગ URL</strong> અને <strong>પ્રથમ પેરેગ્રાફ (First Paragraph)</strong> માં અવશ્ય કરો.
                </p>
                <p className="font-semibold">
                  • <strong>H1/H2 હેડર્સ માળખું</strong>: કન્ટેન્ટ ને સુંદર અને એસ.ઈ.ઓ ફ્રેન્ડલી બનાવવા માટે <strong>H1/H2 માર્કડાઉન (Markdown)</strong> હેડર્સ વાપરો (દા.ત. મુખ્ય વિભાગ માટે <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono"># હેડિંગ ૧</code> અને પેટા-વિભાગ માટે <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">## હેડિંગ ૨</code>).
                </p>
                <p className="font-semibold">
                  • <strong>Accessibility</strong>: ઈમેજ અલ્ટરનેટ ટેક્સ્ટ (Image Alt Text) સેટ કરો જેથી સર્ચ એન્જિન ઈમેજને સમજી શકે.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Cover Image Input with AI Generator */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                      કવર ઇમેજ URL (તથા AI ઓટો-જનરેશન)
                    </label>
                    <button
                      type="button"
                      disabled={isReadOnly || generatingAiImage}
                      onClick={handleAutoGenerateAiImage}
                      className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      id="blog-auto-generate-ai-image-btn"
                    >
                      {generatingAiImage ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          જનરેટ થઈ રહ્યું છે...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} />
                          ✨ Auto-Generate Image with AI
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="ઇમેજ લિંક અથવા ઓટો-જનરેટ બટન દબાવો"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                      id="blog-cover-image-url-input"
                    />
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isReadOnly}
                        className="hidden"
                        id="blog-image-file"
                      />
                      <label
                        htmlFor={isReadOnly ? undefined : "blog-image-file"}
                        className={`px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors cursor-pointer block text-center ${
                          isReadOnly
                            ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-50"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        Upload
                      </label>
                    </div>
                  </div>

                  {/* Live Cover Image Preview */}
                  {imageUrl && (
                    <div className="relative h-24 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100">
                      <img
                        src={imageUrl}
                        alt="Blog Cover Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-1 right-2 text-[9px] font-black bg-slate-900/80 text-white px-2 py-0.5 rounded backdrop-blur-sm">
                        Live Preview
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Image Alt Text Tool with SEO Character Counter and Live Validation */}
                <div className="bg-slate-50/40 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-555">
                      ઇમેજ અલ્ટરનેટ ટેક્સ્ટ (Image Alt Text in Gujarati) *
                    </label>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getAltTextStatus().color}`}>
                        {getAltTextStatus().label}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-450 dark:text-slate-500">
                        {altText.length} / 100
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="દા.ત. ડિજિટલ ગુજરાત પોર્ટલની નવી માર્ગદર્શિકા હોમપેજ કમ્પ્યુટર પર સર્વિસ"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-sans focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleAutoGenerateAltText}
                      disabled={generatingAlt || isReadOnly}
                      className="px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      id="ai-generate-alt-text-btn"
                    >
                      <Sparkles size={11} className="text-amber-500 animate-pulse" />
                      {generatingAlt ? "જનરેટ..." : "AI-થી લખો"}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-450 dark:text-slate-500 font-medium">
                    {getAltTextStatus().message}
                  </p>
                </div>
              </div>

              {/* Live Google Search (SERP) & Interactive SEO Audit Tool */}
              <div className="bg-slate-50/70 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4 text-left mt-4">
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Sparkles size={14} className="animate-pulse text-amber-500" />
                    </span>
                    <div>
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        લાઇવ ગૂગલ પ્રિવ્યુ અને એસઈઓ ઓડિટ (Google Search Preview & SEO Audit)
                      </h4>
                      <p className="text-[9px] text-slate-450 dark:text-slate-500 font-semibold">
                        તમારો લેખ ગૂગલ સર્ચ રીઝલ્ટ્સમાં કેવો દેખાશે અને તેનો એસઈઓ સ્કોર કેટલો છે તે અહીં જુઓ.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">SEO સ્કોર:</span>
                    <span className={`text-xs font-black font-mono px-2.5 py-1 rounded-lg border ${
                      calculateSeoScore() >= 80 
                        ? "bg-emerald-55/10 border-emerald-200 text-emerald-600 dark:text-emerald-400" 
                        : calculateSeoScore() >= 50 
                          ? "bg-amber-55/10 border-amber-200 text-amber-600" 
                          : "bg-rose-55/10 border-rose-200 text-rose-600"
                    }`}>
                      {calculateSeoScore()}%
                    </span>
                  </div>
                </div>

                {/* Interactive Target Focus Keyword Input */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                      🎯 લક્ષિત મુખ્ય શબ્દ (SEO Focus Keyword)
                    </label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="દા.ત. આવકનો દાખલો, ડિજિટલ ગુજરાત, રેશન કાર્ડ (Real-time keyword targeting)"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-950 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white disabled:opacity-65 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="w-full md:w-44 text-right">
                    <span className="block text-[8px] font-black uppercase tracking-wider text-slate-450 mb-1">એસઈઓ પૃથ્થકરણ (Rank)</span>
                    <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-2 rounded-lg text-center border ${
                      calculateSeoScore() >= 80 
                        ? "bg-emerald-55/20 border-emerald-200 text-emerald-600 dark:text-emerald-400" 
                        : calculateSeoScore() >= 50 
                          ? "bg-amber-55/20 border-amber-200 text-amber-600 dark:text-amber-400" 
                          : "bg-rose-55/20 border-rose-200 text-rose-600 dark:text-rose-400"
                    }`}>
                      {calculateSeoScore() >= 80 ? "🏆 ઉત્કૃષ્ટ (Excellent)" : calculateSeoScore() >= 50 ? "⚡ સંતોષકારક (Good)" : "🛠️ સુધારો જરૂરી (Needs Work)"}
                    </div>
                  </div>
                </div>

                {/* Desktop and Mobile View Toggles for Google Search Mockup */}
                <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {seoPreviewDevice === "desktop" ? "🖥️ ડેસ્કટોપ પ્રિવ્યુ (Desktop View)" : "📱 મોબાઇલ પ્રિવ્યુ (Mobile View)"}
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setSeoPreviewDevice("desktop")}
                      className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all cursor-pointer ${
                        seoPreviewDevice === "desktop"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      🖥️ ડેસ્કટોપ
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeoPreviewDevice("mobile")}
                      className={`px-2.5 py-1 text-[9px] font-black rounded-md transition-all cursor-pointer ${
                        seoPreviewDevice === "mobile"
                          ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      📱 મોબાઇલ
                    </button>
                  </div>
                </div>

                {/* Google Search Result Mockup with Adaptive Styling */}
                <div className={`bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm font-sans transition-all duration-300 ${
                  seoPreviewDevice === "mobile" 
                    ? "max-w-[340px] mx-auto border-4 border-slate-300 dark:border-slate-700 rounded-3xl" 
                    : "w-full border border-slate-100 dark:border-slate-855"
                }`}>
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-sans leading-none mb-1">
                    <span className="bg-slate-100 dark:bg-slate-850 p-1 rounded-full shrink-0">
                      <BookOpen size={10} className="text-blue-600 dark:text-blue-400" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium leading-none text-slate-800 dark:text-slate-200">
                        અમિત ઓનલાઇન સર્વિસીસ
                      </span>
                      <span className="text-[9px] font-normal leading-none text-slate-400 dark:text-slate-500 mt-0.5">
                        https://amit-online-services.com › blog › post
                      </span>
                    </div>
                  </div>
                  
                  {/* Page Title */}
                  <h5 className={`text-[#1a0dab] dark:text-[#8ab4f8] font-normal hover:underline cursor-pointer leading-tight mb-1 ${
                    seoPreviewDevice === "mobile" ? "text-[16px]" : "text-[18px] md:text-[20px]"
                  }`}>
                    {titleGu.trim() ? `${titleGu.trim()} | અમિત ઓનલાઇન સર્વિસીસ` : "બ્લોગ શીર્ષક અહીં પ્રદર્શિત થશે..."}
                  </h5>
                  
                  {/* Snippet */}
                  <p className={`text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2 ${
                    seoPreviewDevice === "mobile" ? "text-[11px]" : "text-xs"
                  }`}>
                    {metaDesc.trim() 
                      ? metaDesc.trim() 
                      : excerpt.trim() 
                        ? excerpt.trim() 
                        : content.trim() 
                          ? content.trim().substring(0, 160) + "..." 
                          : "તમારા આર્ટિકલનો ટૂંકો સારાંશ અથવા પ્રસ્તાવના અહીં ગૂગલ સર્ચ પરિણામોના વર્ણનમાં દેખાશે. આ એસઈઓ (SEO) માટે અત્યંત મહત્વપૂર્ણ છે..."}
                  </p>
                </div>

                {/* Real-time Audit Checklist */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-150 dark:border-slate-800 shadow-sm space-y-2">
                  <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-450 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-1">
                    🔍 એસઈઓ ઓપ્ટિમાઇઝેશન ચેકલિસ્ટ (SEO Live Checklist Analysis)
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-650 dark:text-slate-350">
                    <div className="flex items-center gap-1.5">
                      {Math.max(titleGu.length, titleEn.length) >= 30 && Math.max(titleGu.length, titleEn.length) <= 70 ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                      ) : (
                        <span className="text-amber-500">⚠</span>
                      )}
                      <span>શીર્ષકની યોગ્ય લંબાઈ ({Math.max(titleGu.length, titleEn.length)} અક્ષરો)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {metaDesc.length >= 110 && metaDesc.length <= 160 ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                      ) : (
                        <span className="text-amber-500">⚠</span>
                      )}
                      <span>મેટા વર્ણનની યોગ્ય લંબાઈ ({metaDesc.length} અક્ષરો)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {altText.trim().length > 15 ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                      ) : (
                        <span className="text-rose-500 font-bold">✖</span>
                      )}
                      <span>ઇમેજ અલ્ટરનેટ ટેક્સ્ટ (Alt Text)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {excerpt.trim().length > 30 ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                      ) : (
                        <span className="text-rose-500 font-bold">✖</span>
                      )}
                      <span>યોગ્ય લંબાઈનું એક્સર્પ્ટ (Excerpt)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!focusKeyword.trim() ? (
                        <span className="text-slate-400">•</span>
                      ) : (titleGu.toLowerCase().includes(focusKeyword.toLowerCase()) || titleEn.toLowerCase().includes(focusKeyword.toLowerCase())) ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                      ) : (
                        <span className="text-rose-500 font-bold">✖</span>
                      )}
                      <span>શીર્ષકમાં મુખ્ય શબ્દ (Keyword in Title)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!focusKeyword.trim() ? (
                        <span className="text-slate-400">•</span>
                      ) : metaDesc.toLowerCase().includes(focusKeyword.toLowerCase()) ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                      ) : (
                        <span className="text-rose-500 font-bold">✖</span>
                      )}
                      <span>મેટા વર્ણનમાં મુખ્ય શબ્દ (Keyword in Meta)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!focusKeyword.trim() ? (
                        <span className="text-slate-400">•</span>
                      ) : content.toLowerCase().includes(focusKeyword.toLowerCase()) ? (
                        <span className="text-emerald-500 font-bold">✔</span>
                      ) : (
                        <span className="text-rose-500 font-bold">✖</span>
                      )}
                      <span>કન્ટેન્ટ બોડીમાં મુખ્ય શબ્દ (Keyword in Body)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
<div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                દસ્તાવેજ અને સેવા જોડાણ (Document & Service Mapping)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-550 mb-1.5">
                    જરૂરી દસ્તાવેજો લિસ્ટ (Document Checklist Reference)
                  </label>
                  <select
                    value={docsListId}
                    onChange={(e) => setDocsListId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="">-- જોડાણ કરશો નહીં (None) --</option>
                    {docLists.map((item, idx) => (
                      <option key={`${item.ID}-${idx}`} value={item.ID}>
                        {item.ListName} ({item.Documents?.length || 0} Docs Required)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-550 mb-1.5">
                    સંબંધિત સરકારી સેવા (Target Government Service CTA Link)
                  </label>
                  <select
                    value={linkedServiceId}
                    onChange={(e) => setLinkedServiceId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                  >
                    <option value="">-- અરજી બટન કરશો નહીં (None) --</option>
                    {serviceMasterOptions.map((svc, idx) => (
                      <option key={`${svc.ID}-${idx}`} value={svc.ID}>
                        {svc.ServiceName}
                      </option>
                    ))}
                  </select>

                  {/* Validation Indicators for Target Government Service */}
                  {linkedServiceId && (() => {
                    const matchedSvc = serviceMasterOptions.find(svc => String(svc.ID) === String(linkedServiceId));
                    if (!matchedSvc) {
                      return (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-[10px] text-red-650 dark:text-red-400 font-bold flex items-center gap-1.5">
                          <span className="shrink-0 font-sans font-black">⚠️ ERROR:</span>
                          <span>ખાસ નોંધ: પસંદ કરેલ સેવા અસ્તિત્વમાં નથી અથવા અમાન્ય છે ! (Invalid ID)</span>
                        </div>
                      );
                    }
                    if (matchedSvc.Status === "Inactive") {
                      return (
                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-250 dark:border-amber-900/50 rounded-xl text-[10px] text-amber-600 dark:text-amber-500 font-bold flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="shrink-0 font-sans font-black">⚠️ WARNING:</span>
                            <span>ચેતવણી: આ સરકારી યોજના/સેવા હાલમાં ‘Inactive’ (અક્રિય) છે.</span>
                          </div>
                          <p className="text-[9px] text-amber-500 dark:text-amber-400/80 font-semibold leading-normal ml-5">
                            યુઝર્સ આ સ્કીમ માટે વેબસાઇટ પર અરજી કરી શકશે નહીં જ્યાં સુધી તમે તેને સરકારી સેવાઓ સંચાલનમાં સક્રિય ન કરો.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div className="mt-2 p-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/25 rounded-xl text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="shrink-0 font-black">✓ ACTIVE:</span>
                        <span>સેવા સક્રિય (Active) છે! બ્લોગ આર્ટિકલમાં અરજી ફનલ યોગ્ય રીતે સેટ થઈ જશે.</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-550 mb-1.5">
                  જોડાયેલ GR / પરિપત્ર પીડીએફ URL (Associated G.R. PDF Guidelines)
                </label>
                <input
                  type="text"
                  value={linkedPdfUrl}
                  onChange={(e) => setLinkedPdfUrl(e.target.value)}
                  placeholder="e.g. https://digitalgujarat.gov.in/DownLoad/Official_Circular_VidhvaSahay.pdf"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-sans focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {imageUrl && (
              <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80">
                <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 text-xs transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting || generatingDocs}
                className="flex-1 py-4.5 bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl flex items-center justify-center gap-2 transition-all transition-transform duration-300 disabled:bg-slate-400 cursor-pointer hover:-translate-y-0.5"
              >
                <Send size={15} /> {submitting && !generatingDocs ? "પબ્લિશ થઈ રહ્યું છે..." : "બ્લોગ પબ્લિશ કરો"}
              </button>
              
              <button
                type="button"
                disabled={submitting || generatingDocs}
                onClick={handlePublishAndGeneratePDF}
                className="flex-1 py-4.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 transition-all transition-transform duration-300 disabled:bg-slate-400 cursor-pointer hover:-translate-y-0.5"
              >
                <Sparkles size={15} /> {generatingDocs ? "PDF થઈ રહી છે..." : "Publish & Generate PDF"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Category Management, Version Control and Existing Blogs List */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Category Management Interface Card */}
          <div id="category-management-card" className="bg-slate-50 dark:bg-slate-950 p-5 rounded-[24px] border border-slate-150 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>📂 કેટેગરી વ્યવસ્થાપન (Category Management)</span>
            </h3>
            <p className="text-[9px] text-slate-450 dark:text-slate-500 leading-normal font-semibold">
              નવી કેટેગરી ઉમેરો, નામ બદલો અથવા કાઢી નાખો. આ કેટેગરીઓ આપમેળે ડ્રોપડાઉનમાં અપડેટ થશે.
            </p>

            {/* Add Category Form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="નવી કેટેગરીનું નામ..."
                className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus size={12} /> ઉમેરો
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm text-xs font-bold text-slate-800 dark:text-slate-200">
                  {editingCategoryName === cat ? (
                    <div className="flex items-center gap-1 w-full">
                      <input
                        type="text"
                        value={categoryRenameValue}
                        onChange={(e) => setCategoryRenameValue(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-350 bg-slate-50 text-slate-900 dark:text-white dark:bg-slate-950 font-semibold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (!categoryRenameValue.trim()) return;
                          await handleRenameCategory(cat, categoryRenameValue.trim());
                          setEditingCategoryName(null);
                        }}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-[9px] font-black uppercase cursor-pointer"
                      >
                        સેવ
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategoryName(null)}
                        className="px-2 py-1 bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[9px] font-black uppercase cursor-pointer"
                      >
                        રદ
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="pl-1 text-[11px] font-semibold">{cat}</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryName(cat);
                            setCategoryRenameValue(cat);
                          }}
                          className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition-colors cursor-pointer"
                          title="રીનેમ કરો"
                        >
                          <Edit size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                          title="ડિલીટ કરો"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Version Control Panel (Revert snapshot history) */}
          {editingBlogId && (
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-[24px] border border-slate-150 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <History size={14} className="text-blue-600 dark:text-blue-400" />
                  <span>આવૃત્તિ નિયંત્રણ (Version History)</span>
                </h3>
                <span className="text-[8px] bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full font-black">
                  Snapshots
                </span>
              </div>
              <p className="text-[9px] text-slate-450 dark:text-slate-500 leading-normal font-semibold">
                દરેક અપડેટ પર આપમેળે બેકઅપ સ્નેપશોટ બને છે. કોઈ પણ જૂની આવૃત્તિ પર પાછા જવા માટે 'Revert' બટન દબાવો.
              </p>

              {loadingHistory ? (
                <div className="py-6 text-center text-xs text-slate-400 font-semibold">ઇતિહાસ લોડ થઈ રહ્યો છે...</div>
              ) : historyList.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 font-semibold">
                  આ આર્ટિકલ માટે હજુ કોઈ પાછલો ઇતિહાસ નથી. આર્ટિકલ સેવ કરવાથી આપોઆપ સ્નેપશોટ બનશે.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {historyList.map((h) => (
                    <div key={h.HistoryID} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 shadow-sm space-y-1.5 text-xs text-left">
                      <div className="flex items-center justify-between text-[9px] text-slate-450 dark:text-slate-500 font-mono font-bold">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(h.HistoryTimestamp).toLocaleString("gu-IN")}
                        </span>
                        <span>{h.Author || "મેનેજર"}</span>
                      </div>
                      <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 line-clamp-1">
                        {h.Title_Gu}
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-50 dark:border-slate-800/40">
                        <span className="text-[8px] bg-slate-50 dark:bg-slate-950 text-blue-500 px-1.5 py-0.5 rounded font-black uppercase">
                          {h.Category}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRevertVersion(h.HistoryID)}
                          className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <History size={9} /> Revert
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Existing Blogs List */}
          <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-[24px] border border-slate-150 dark:border-slate-800">
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>હાલના પબ્લિશ થયેલા બ્લોગ્સ ({blogs.length})</span>
              <span className="text-[9px] bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-2 py-0.5 rounded-full font-black">સક્રિય</span>
            </h3>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold">નવીનતમ આર્ટિકલ્સ લોડ થઈ રહ્યા છે...</div>
            ) : blogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold">કોઈ બ્લોગ આર્ટીકલ હજી સુધી મળ્યા નથી. પ્રથમ આર્ટીકલ પબ્લિશ કરો!</div>
            ) : (
              <div className="max-h-[750px] overflow-y-auto space-y-3 pr-1 text-left">
                {blogs.map((b, idx) => (
                  <div
                    key={`${b.ID}-${idx}`}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex gap-3 hover:border-slate-200 transition-all shadow-sm group"
                  >
                    <img
                      src={b.Image || "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=150&auto=format&fit=crop"}
                      alt=""
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate group-hover:text-blue-600 transition-colors" title={b.Title_Gu}>
                          {b.Title_Gu}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-medium">
                          <span className="bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded text-blue-500">
                            {b.Category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} /> {b.ReadingTime} મિનિટ
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                        <span className="text-[9px] text-slate-400">
                          {b.Timestamp ? new Date(b.Timestamp).toLocaleDateString("gu-IN") : ""}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              handleStartEdit(b);
                              // Smooth scroll to editor
                              const editorEl = document.getElementById("blog-editor-form-title");
                              if (editorEl) {
                                editorEl.scrollIntoView({ behavior: "smooth" });
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                            title="આ આર્ટિકલ એડિટ કરો"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(b.ID)}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                            title="આ આર્ટિકલ ડિલીટ કરો"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Placeholder Image Generation Modal */}
      {showAiImageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500 animate-spin" />
                <span>AI Placeholder Image જનરેટ કરો</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAiImageModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                ઈમેજ વર્ણન અથવા દ્રશ્ય વિગત (Image Prompt / Description)
              </label>
              <textarea
                rows={3}
                value={aiImagePrompt}
                onChange={(e) => setAiImagePrompt(e.target.value)}
                placeholder="દા.ત. Gujarat government services portal office with computers, documents, and digital icons..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-sans text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAiImageModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                type="button"
                disabled={generatingAiImage || !aiImagePrompt.trim()}
                onClick={() => {
                  setGeneratingAiImage(true);
                  const toastId = toast.loading("AI ઈમેજ જનરેટ થઈ રહી છે...");
                  setTimeout(() => {
                    const sampleImages = [
                      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
                    ];
                    const selectedImg = sampleImages[Math.floor(Math.random() * sampleImages.length)] + `&sig=${Date.now()}`;
                    const imgMarkdown = `\n\n![${aiImagePrompt.trim()}](${selectedImg})\n\n`;
                    setContent((prev) => prev + imgMarkdown);
                    if (!imageUrl) setImageUrl(selectedImg);
                    setGeneratingAiImage(false);
                    setShowAiImageModal(false);
                    setAiImagePrompt("");
                    toast.success("AI Placeholder ઈમેજ આર્ટિકલમાં સફળતાપૂર્વક ઉમેરાઈ ગઈ!", { id: toastId });
                  }, 1200);
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={13} />
                {generatingAiImage ? "જનરેટિંગ..." : "ઇન્સર્ટ ઈમેજ (Insert)"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
