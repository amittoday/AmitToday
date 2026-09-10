const fs = require('fs');
const appFile = fs.readFileSync('src/App.tsx', 'utf-8');

const regexAdminBlog = /function BlogAdmin\(\{ user \}: any\) \{[\s\S]*?(?=function SettingsPage)/;

const newCode = `function BlogAdmin({ user }: any) {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAuthor, setFilterAuthor] = useState('');
  const [sortBy, setSortBy] = useState('Newest');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSeoPreview, setShowSeoPreview] = useState(false);
  
  const blogCategories = ['News', 'Tutorials', 'Features', 'Announcements', 'Guides'];

  const fetchBlogs = async () => {
    const res = await axios.post('/api/data/collection', { tab: 'Blogs' }, { headers: { Authorization: \`Bearer \${user.token}\` } });
    setBlogs(res.data.data || []);
  };

  useEffect(() => { 
    fetchBlogs();
    const draft = localStorage.getItem('blog_draft');
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      if (confirm("Restore your saved unsaved draft?")) {
        setEditing(parsedDraft);
      }
      localStorage.removeItem('blog_draft');
    }
  }, []);

  const handleManualSaveDraft = () => {
    if (!editing) return;
    localStorage.setItem('blog_draft', JSON.stringify(editing));
    toast.success('Draft saved successfully to local storage');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const readingTime = calculateReadingTime(editing.Content);
      const data = { 
        ...editing, 
        ID: editing?.ID || "BLOG-" + Date.now(), 
        Timestamp: editing?.Timestamp || new Date().toISOString(),
        Status: editing?.Status || 'Active',
        Author: editing?.Author || user.name || 'Admin',
        ReadingTime: readingTime
      };
      await axios.post('/api/data/upsert', { tab: 'Blogs', data, idKey: 'ID' }, { headers: { Authorization: \`Bearer \${user.token}\` } });
      toast.success('Blog post saved successfully');
      localStorage.removeItem('blog_draft');
      setEditing(null);
      fetchBlogs();
    } catch (err) { toast.error("Save failed"); }
    finally { setLoading(false); }
  };

  const handleImageUrlBlur = () => {
    if (editing?.Image && !editing.Image.startsWith('http') && !editing.Image.startsWith('data:')) {
      const imageUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(editing.Image)}?width=1200&height=630&nologo=true\`;
      setEditing({ ...editing, Image: imageUrl });
    }
  };

  const generateImg = async () => {
    if (!editing?.Title_En) return toast.error("Enter a title first");
    setIsGeneratingImage(true);
    try {
      const response = await axios.post('/api/ai/generate', {
        prompt: \`Generate a highly descriptive, artistic AI image prompt (2 sentences) for a blog post titled: "\${editing.Title_En}". Focus on minimalist, professional, high-quality digital aesthetic.\`
      }, { headers: { Authorization: \`Bearer \${user.token}\` } });
      const generatedPrompt = response.data.text.trim();
      const imageUrl = \`https://image.pollinations.ai/prompt/\${encodeURIComponent(generatedPrompt)}?width=1200&height=630&nologo=true\`;
      setEditing({ ...editing, Image: imageUrl });
      toast.success('AI Image prompt and URL generated');
    } catch { toast.error("AI Generation failed"); }
    finally { setIsGeneratingImage(false); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const res = await axios.post('/api/upload', {
          content: base64,
          mimeType: file.type,
          name: file.name
        }, { headers: { Authorization: \`Bearer \${user.token}\` } });
        setEditing({ ...editing, Image: res.data.fileLink });
      } catch {
        toast.error("Upload failed");
      } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const generateMetaAndTags = async () => {
    if (!editing?.Content) return toast.error("Please add content first.");
    setLoading(true);
    try {
      const response = await axios.post('/api/ai/generate', {
        prompt: \`Based on the following blog content, generate a concise SEO meta description (max 150 characters) and 3-5 comma-separated relevant tags. Return them strictly as a JSON object with keys "metaDesc" and "tags", nothing else.\\n\\nContent: \${editing.Content.substring(0, 2000)}\`
      }, { headers: { Authorization: \`Bearer \${user.token}\` } });
      const text = response.data.text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      const parsed = JSON.parse(text);
      setEditing({ ...editing, MetaDesc: parsed.metaDesc || parsed.MetaDesc, Tags: parsed.tags || parsed.Tags });
      toast.success('Meta info generated via AI');
    } catch (e) { 
      toast.error("AI Generation failed"); 
    }
    finally { setLoading(false); }
  };

  const calculateReadingTime = (text: string = '') => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\\s+/).length;
    return Math.ceil(words / wordsPerMinute).toString();
  };

  const translateAllTitles = async () => {
    setLoading(true);
    let updatedCount = 0;
    try {
      for (const blog of blogs) {
        let updated = false;
        const newBlog = { ...blog };

        if (blog.Title_En && (!blog.Title_Gu || !blog.Title_Hi)) {
           if (!blog.Title_Gu) {
             try {
               const resGu = await axios.post('/api/ai/translate', { text: blog.Title_En, targetLang: 'Gujarati' }, { headers: { Authorization: \`Bearer \${user.token}\` } });
               if (resGu.data.success) { newBlog.Title_Gu = resGu.data.translatedText; updated = true; }
             } catch (e) {}
           }
           if (!blog.Title_Hi) {
             try {
               const resHi = await axios.post('/api/ai/translate', { text: blog.Title_En, targetLang: 'Hindi' }, { headers: { Authorization: \`Bearer \${user.token}\` } });
               if (resHi.data.success) { newBlog.Title_Hi = resHi.data.translatedText; updated = true; }
             } catch (e) {}
           }
        }
        if (updated) {
          await axios.post('/api/data/upsert', { tab: 'Blogs', data: newBlog, idKey: 'ID' }, { headers: { Authorization: \`Bearer \${user.token}\` } });
          updatedCount++;
        }
      }
      if (updatedCount > 0) { toast.success(\`Translated titles for \${updatedCount} posts\`); fetchBlogs(); } 
      else { toast.info(\`No missing translations found\`); }
    } catch (err) { toast.error('Bulk translation encountered an error'); } 
    finally { setLoading(false); }
  };

  const filteredBlogs = blogs.filter(blog => {
    if (searchQuery && !blog.Title_En?.toLowerCase().includes(searchQuery.toLowerCase()) && !blog.Content?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterCategory && blog.Category !== filterCategory) return false;
    if (filterStatus && blog.Status !== filterStatus) return false;
    if (filterAuthor && (!blog.Author || !blog.Author.toLowerCase().includes(filterAuthor.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'Newest') return new Date(b.Timestamp || 0).getTime() - new Date(a.Timestamp || 0).getTime();
    if (sortBy === 'Oldest') return new Date(a.Timestamp || 0).getTime() - new Date(b.Timestamp || 0).getTime();
    return 0;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">Content Management</h3>
        <div className="flex gap-2">
          <button onClick={translateAllTitles} disabled={loading} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"><Globe size={16}/> {loading ? 'Translating...' : 'Bulk Translate (AI)'}</button>
          <button onClick={() => setEditing({})} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all"><Plus size={16}/> New Post</button>
        </div>
      </div>

      {!editing && (
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input placeholder="Search blogs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 dark:text-white" />
          </div>
          <div className="w-full md:w-auto">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 dark:text-white">
              <option value="">All Categories</option>
              {blogCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-full md:w-auto">
            <input placeholder="Filter by Author" value={filterAuthor} onChange={(e) => setFilterAuthor(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 dark:text-white" />
          </div>
          <div className="w-full md:w-auto">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 dark:text-white">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="w-full md:w-auto">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 dark:text-white">
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </select>
          </div>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSave} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Title (EN)</label>
              <input placeholder="English Title" value={editing.Title_En || ''} onChange={e => setEditing({...editing, Title_En: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all dark:text-white" required />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Title (GU)</label>
              <input placeholder="Gujarati Title" value={editing.Title_Gu || ''} onChange={e => setEditing({...editing, Title_Gu: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Title (HI)</label>
              <input placeholder="Hindi Title" value={editing.Title_Hi || ''} onChange={e => setEditing({...editing, Title_Hi: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all dark:text-white" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap justify-between items-end mb-2 px-1 gap-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Content (Rich Text / Markdown)</label>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-600 transition-all dark:text-white min-h-[300px] text-black">
              <ReactQuill theme="snow" value={editing.Content || ''} onChange={(val) => setEditing({...editing, Content: val})} className="h-full border-none dark:text-white" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Category</label>
              <select value={editing.Category || ''} onChange={e => setEditing({...editing, Category: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all dark:text-white">
                <option value="">Select Category</option>
                {blogCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tags (Comma Separated)</label>
              <input placeholder="technology, webdev, ai" value={editing.Tags || ''} onChange={e => setEditing({...editing, Tags: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Reading Time (Min)</label>
              <input readOnly value={calculateReadingTime(editing.Content)} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none font-bold dark:text-white" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 px-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Description (SEO)</label>
                <button type="button" onClick={generateMetaAndTags} className="flex flex-row items-center gap-1 text-[10px] uppercase font-black tracking-widest text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 dark:bg-blue-900/40 p-1.5 px-3 rounded-xl">
                  <Zap size={12} /> Auto AI Generation
                </button>
              </div>
              <input placeholder="Short summary for Google" value={editing.MetaDesc || ''} onChange={e => setEditing({...editing, MetaDesc: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cover Image URL / Upload</label>
              <div className="flex gap-4">
                <div className="flex-1 relative group">
                  <input placeholder="Select file or enter topic for AI Placeholder" value={editing.Image || ''} onBlur={handleImageUrlBlur} onChange={e => setEditing({...editing, Image: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none group-hover:border-blue-400 transition-all dark:text-white pr-10" />
                  <label className="absolute right-2 top-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-500">
                    <Upload size={14}/>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                <button type="button" onClick={generateImg} disabled={isGeneratingImage} className="bg-slate-900 dark:bg-blue-600 text-white px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black dark:hover:bg-blue-700 transition-all shrink-0">{isGeneratingImage ? '...' : 'AI Image'}</button>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Author</label>
                <input placeholder="Author Name" value={editing.Author || ''} onChange={e => setEditing({...editing, Author: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all dark:text-white" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Status</label>
                <select value={editing.Status || 'Active'} onChange={e => setEditing({...editing, Status: e.target.value as any})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all dark:text-white">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black shadow-xl hover:bg-blue-700 transition-all">{loading ? 'Saving...' : 'Save Post'}</button>
            <button type="button" onClick={handleManualSaveDraft} className="bg-amber-500 text-white px-8 py-3 rounded-xl font-black shadow-xl hover:bg-amber-600 transition-all">Save Draft (Local)</button>
            <button type="button" onClick={() => setShowPreview(true)} className="bg-slate-900 dark:bg-slate-800 text-white px-6 py-3 rounded-xl font-black shadow-xl hover:bg-black dark:hover:bg-slate-700 transition-all">Full Preview</button>
            <button type="button" onClick={() => setShowSeoPreview(true)} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-black shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-2"><Globe size={16}/> SEO Preview</button>
            <button type="button" onClick={() => setEditing(null)} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-6 py-3 rounded-xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 transition-all ml-auto">Cancel</button>
          </div>

          {/* SEO Preview Modal */}
          {showSeoPreview && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-8">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-950 max-w-2xl w-full rounded-[40px] shadow-2xl p-8 overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Google Search Preview</h3>
                  <button onClick={() => setShowSeoPreview(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full dark:text-white"><X size={20}/></button>
                </div>
                
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-2 mb-1 text-[12px] text-slate-500 font-medium">
                      <span>amit.today</span>
                      <span>›</span>
                      <span>blog</span>
                      <span>›</span>
                      <span className="truncate max-w-[200px]">{editing.Title_En?.toLowerCase().replace(/\\s+/g, '-')}</span>
                   </div>
                   <h3 className="text-[#1a0dab] dark:text-[#8ab4f8] text-xl font-medium hover:underline cursor-pointer mb-2 line-clamp-1">{editing.Title_En || 'Blog Post Title'}</h3>
                   <div className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                      <span className="text-slate-400 font-medium mr-2">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} —</span>
                      {editing.MetaDesc || 'Please provide a meta description to see how it appears in Google search results. A good description increases click-through rates.'}
                   </div>
                </div>
              </motion.div>
            </div>
          )}

          {showPreview && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-8">
              <div className="bg-white dark:bg-slate-900 max-w-4xl w-full h-[80vh] rounded-[40px] shadow-2xl p-12 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Live Preview</h3>
                  <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full dark:text-white"><X size={24}/></button>
                </div>
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden mb-8 relative">
                  <img src={editing.Image} className="w-full h-full object-cover" />
                  {editing.Author && (
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold">
                      By {editing.Author}
                    </div>
                  )}
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">{editing.Title_En}</h1>
                <div className="prose prose-slate dark:prose-invert max-w-none font-medium text-slate-600 dark:text-slate-400 leading-relaxed markdown-body">
                  <ReactMarkdown>{editing.Content || ''}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBlogs.map(blog => (
            <div key={blog.ID} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex gap-6 items-center hover:shadow-xl hover:shadow-blue-50 dark:hover:shadow-blue-900/10 transition-all cursor-pointer group">
              <img src={blog.Image} className="w-24 h-24 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 flex-shrink-0 group-hover:scale-105 transition-transform" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={\`w-2 h-2 rounded-full \${blog.Status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}\`} />
                  <span className="text-[10px] font-black uppercase text-slate-400">{blog.Status}</span>
                  {blog.Author && <span className="text-[10px] items-center text-slate-400 font-bold ml-2">by {blog.Author}</span>}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1 truncate">{blog.Title_En}</h4>
                <div className="flex gap-2">
                   {blog.Category && <span className="text-[8px] font-black uppercase text-blue-500">{blog.Category}</span>}
                   {blog.Tags && <span className="text-[8px] font-bold text-slate-400">#{blog.Tags.split(',')[0]}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                 <button onClick={(e) => { e.stopPropagation(); setEditing(blog); }} className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-1 hover:underline"><Edit size={12}/> Edit</button>
                 <button onClick={async (e) => {
                   e.stopPropagation();
                   if (confirm("Permanently delete this blog post?")) {
                     try {
                       await axios.post('/api/data/delete', { tab: 'Blogs', id: blog.ID }, { headers: { Authorization: \`Bearer \${user.token}\` } });
                       fetchBlogs();
                       toast.success("Blog post deleted");
                     } catch {
                       await axios.post('/api/data/upsert', { tab: 'Blogs', data: { ...blog, Status: 'Deleted' }, idKey: 'ID' }, { headers: { Authorization: \`Bearer \${user.token}\` } });
                       fetchBlogs();
                       toast.success("Blog marked as deleted");
                     }
                   }
                 }} className="text-[10px] font-black uppercase text-red-500 flex items-center gap-1 hover:underline"><Trash2 size={12}/> Trash</button>
              </div>
            </div>
          ))}
          {filteredBlogs.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-12 text-center text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              No matching blog posts found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
`

const updatedAppFile = appFile.replace(regexAdminBlog, newCode + '\n\n');
fs.writeFileSync('src/App.tsx', updatedAppFile);
console.log('BlogAdmin fully replaced!');
