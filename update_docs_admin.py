import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add state variables
state_target = """  const [isBulkPreviewOpen, setIsBulkPreviewOpen] = useState(false);"""
state_repl = """  const [isBulkPreviewOpen, setIsBulkPreviewOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [tagManagerEditName, setTagManagerEditName] = useState("");
  const [tagManagerSelectedTag, setTagManagerSelectedTag] = useState("");
  
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  const [batchPrintMeta, setBatchPrintMeta] = useState({ title: "Batch Export", author: "AOS Admin", subject: "Vault Documents" });"""
content = content.replace(state_target, state_repl)


# 2. Add handleUpdateVaultTag and handleBatchPrintPDF after handleAdminBulkEditSubmit
handlers_target = """  const handleAdminBulkEditSubmit = async (e: React.FormEvent) => {"""
handlers_repl = """  const handleUpdateVaultTag = async (action: "edit" | "merge" | "delete", oldTag: string, newTag?: string) => {
    if (!oldTag) return;
    const docsToUpdate = docs.filter(d => {
      const tags = (d.Tags || d.tags || "").split(/[,;\\s]+/).map((t: string) => t.trim()).filter(Boolean);
      return tags.includes(oldTag);
    });

    if (docsToUpdate.length === 0) {
      toast.info(`No documents found with tag "${oldTag}".`);
      return;
    }

    const toastId = toast.loading(`Updating ${docsToUpdate.length} documents...`);
    let successCount = 0;

    for (const doc of docsToUpdate) {
      const tagsList = (doc.Tags || doc.tags || "").split(/[,;\\s]+/).map((t: string) => t.trim()).filter(Boolean);
      let updatedTagsList = [...tagsList];

      if (action === "delete") {
        updatedTagsList = updatedTagsList.filter(t => t !== oldTag);
      } else if (action === "edit" || action === "merge") {
        if (newTag) {
          updatedTagsList = updatedTagsList.map(t => t === oldTag ? newTag : t);
          updatedTagsList = Array.from(new Set(updatedTagsList));
        }
      }

      const updatedTagsStr = updatedTagsList.join(", ");
      
      try {
        await axios.post(
          "/api/data/upsert",
          {
            tab: "Documents",
            data: {
              ...doc,
              Tags: updatedTagsStr,
              tags: updatedTagsStr
            },
            idKey: "ID"
          },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        successCount++;
      } catch (err) {
        console.error("Failed to update doc", doc.ID, err);
      }
    }

    toast.success(`Successfully updated tags for ${successCount} documents!`, { id: toastId });
    setIsTagManagerOpen(false);
    fetchDocs();
  };

  const handleBatchPrintPDF = async () => {
    if (selectedDocIds.length === 0) return;
    const toastId = toast.loading("Generating printable batch PDF...");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const selectedItems = docs.filter(d => selectedDocIds.includes(d.ID));
      
      doc.setProperties({
        title: batchPrintMeta.title || 'Batch Documents',
        author: batchPrintMeta.author || 'Admin',
        subject: batchPrintMeta.subject || 'Vault Export',
      });

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        if (i > 0) doc.addPage();
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Document ID: ${item.ID} | Category: ${item.Category || item.Type || 'N/A'}`, 10, 10);
        
        doc.setFontSize(12);
        doc.setTextColor(0);
        
        let y = 20;
        doc.text(`File Name: ${item.FileName || 'Unknown'}`, 10, y);
        y += 10;
        doc.text(`Upload Date: ${item.Timestamp || item.date || 'N/A'}`, 10, y);
        y += 10;
        doc.text(`Tags: ${item.Tags || item.tags || 'None'}`, 10, y);
        
        y += 15;
        const extracted = item.ExtractedText || item.extractedText;
        if (extracted) {
          const text = doc.splitTextToSize(extracted.substring(0, 3000), 190);
          doc.setFontSize(9);
          doc.text(text, 10, y);
        } else {
          doc.text("No OCR text available for this document.", 10, y);
        }
        
        doc.setFontSize(8);
        doc.text(`Page ${i + 1} of ${selectedItems.length}`, 105, 290, { align: "center" });
      }

      doc.save(`Batch_Print_${new Date().getTime()}.pdf`);
      toast.success("Batch PDF generated successfully!", { id: toastId });
      setIsBatchPrintOpen(false);
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + err.message, { id: toastId });
    }
  };

  const handleAdminBulkEditSubmit = async (e: React.FormEvent) => {"""
content = content.replace(handlers_target, handlers_repl)

# 3. Update the sort Order
sort_target = """  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");"""
sort_repl = """  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "size-asc" | "size-desc" | "alpha-asc" | "alpha-desc">("newest");"""
content = content.replace(sort_target, sort_repl)


filtered_target = """    return matchesSearch && matchesCategory && matchesDate && matchesTag;
  }).sort((a, b) => {
    const timeA = new Date(a.Timestamp || a.date || a.UploadedDate || 0).getTime();
    const timeB = new Date(b.Timestamp || b.date || b.UploadedDate || 0).getTime();
    return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
  });"""
filtered_repl = """    return matchesSearch && matchesCategory && matchesDate && matchesTag;
  }).sort((a, b) => {
    if (sortOrder === "newest" || sortOrder === "oldest") {
      const timeA = new Date(a.Timestamp || a.date || a.UploadedDate || 0).getTime();
      const timeB = new Date(b.Timestamp || b.date || b.UploadedDate || 0).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    } else if (sortOrder === "size-asc" || sortOrder === "size-desc") {
      const sizeA = a.FileSize || 0;
      const sizeB = b.FileSize || 0;
      return sortOrder === "size-asc" ? sizeA - sizeB : sizeB - sizeA;
    } else {
      const nameA = (a.FileName || a.ID || "").toLowerCase();
      const nameB = (b.FileName || b.ID || "").toLowerCase();
      if (nameA < nameB) return sortOrder === "alpha-asc" ? -1 : 1;
      if (nameA > nameB) return sortOrder === "alpha-asc" ? 1 : -1;
      return 0;
    }
  });"""
content = content.replace(filtered_target, filtered_repl)


# 4. Modify UI controls
buttons_target = """          {selectedDocIds.length > 0 && (
            <>
              <button
                id="doc-admin-bulk-preview"
                onClick={handleBulkPreview}"""
buttons_repl = """          {selectedDocIds.length > 0 && (
            <>
              <button
                onClick={() => setIsBatchPrintOpen(true)}
                className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all border border-amber-100/50 dark:border-amber-900 cursor-pointer"
              >
                <Printer size={14} /> Batch Print PDF ({selectedDocIds.length})
              </button>
              <button
                id="doc-admin-bulk-preview"
                onClick={handleBulkPreview}"""
content = content.replace(buttons_target, buttons_repl)


sort_ui_target = """          {/* Sort Order Toggle */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSortOrder("newest")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                sortOrder === "newest"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Sort records by newest upload timestamp"
            >
              <ArrowDown size={14} /> Newest
            </button>
            <button
              type="button"
              onClick={() => setSortOrder("oldest")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                sortOrder === "oldest"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Sort records by oldest upload timestamp"
            >
              <ArrowUp size={14} /> Oldest
            </button>
          </div>"""
sort_ui_repl = """          <button
            onClick={() => setIsTagManagerOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <Tag size={14} /> Tag Manager
          </button>
          {/* Sort Order Dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2.5 rounded-xl text-xs font-bold outline-none border border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="size-desc">Largest File Size</option>
            <option value="size-asc">Smallest File Size</option>
            <option value="alpha-asc">Alphabetical (A-Z)</option>
            <option value="alpha-desc">Alphabetical (Z-A)</option>
          </select>"""
content = content.replace(sort_ui_target, sort_ui_repl)


modal_target = """      {/* Status Definitions Modal */}"""
modal_repl = """      {/* Tag Manager Modal */}
      {isTagManagerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Tag size={20} className="text-blue-500" />
                Central Tag Manager
              </h3>
              <button
                onClick={() => setIsTagManagerOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  Target Tag
                </label>
                <select
                  value={tagManagerSelectedTag}
                  onChange={(e) => setTagManagerSelectedTag(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="">Select a tag to manage...</option>
                  {allVaultTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              
              {tagManagerSelectedTag && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                      Rename / Merge Into
                    </label>
                    <input
                      type="text"
                      placeholder="New tag name (or leave empty to just delete)"
                      value={tagManagerEditName}
                      onChange={(e) => setTagManagerEditName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleUpdateVaultTag("edit", tagManagerSelectedTag, tagManagerEditName)}
                      disabled={!tagManagerEditName}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Rename / Merge
                    </button>
                    <button
                      onClick={() => handleUpdateVaultTag("delete", tagManagerSelectedTag)}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 text-xs font-bold transition-all cursor-pointer"
                    >
                      Delete Tag (All Docs)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Batch Print PDF Config Modal */}
      {isBatchPrintOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Printer size={20} className="text-amber-500" />
                Configure Batch Print PDF
              </h3>
              <button
                onClick={() => setIsBatchPrintOpen(false)}
                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  PDF Meta Title
                </label>
                <input
                  type="text"
                  value={batchPrintMeta.title}
                  onChange={(e) => setBatchPrintMeta({...batchPrintMeta, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  PDF Meta Author
                </label>
                <input
                  type="text"
                  value={batchPrintMeta.author}
                  onChange={(e) => setBatchPrintMeta({...batchPrintMeta, author: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                  PDF Meta Subject
                </label>
                <input
                  type="text"
                  value={batchPrintMeta.subject}
                  onChange={(e) => setBatchPrintMeta({...batchPrintMeta, subject: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={handleBatchPrintPDF}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-3 text-xs font-bold transition-all cursor-pointer"
                >
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Definitions Modal */}"""
content = content.replace(modal_target, modal_repl)

with open("src/App.tsx", "w") as f:
    f.write(content)
