import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, FileText, ChevronRight, RefreshCw, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { toast } from "sonner";

interface DocumentList {
  ID: string;
  ListName: string;
  Documents: string[];
}

export default function DocumentListManager({ user }: { user: any }) {
  const [lists, setLists] = useState<DocumentList[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string>("");
  const [listName, setListName] = useState<string>("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [newDocItem, setNewDocItem] = useState<string>("");

  const fetchLists = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/document-lists");
      if (res.data && res.data.success) {
        setLists(res.data.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load document lists:", err);
      toast.error("દસ્તાવેજ યાદી લોડ કરવામાં નિષ્ફળતા.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleStartAdd = () => {
    setCurrentId(`doc_list_${Date.now()}`);
    setListName("");
    setDocuments([]);
    setNewDocItem("");
    setIsEditing(true);
  };

  const handleStartEdit = (list: DocumentList) => {
    setCurrentId(list.ID);
    setListName(list.ListName);
    setDocuments([...list.Documents]);
    setNewDocItem("");
    setIsEditing(true);
  };

  const handleAddDocItem = () => {
    if (!newDocItem.trim()) return;
    if (documents.includes(newDocItem.trim())) {
      toast.warning("આ દસ્તાવેજ પહેલેથી યાદીમાં છે.");
      return;
    }
    setDocuments([...documents, newDocItem.trim()]);
    setNewDocItem("");
  };

  const handleRemoveDocItem = (index: number) => {
    setDocuments(documents.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listName.trim()) {
      toast.error("કૃપા કરીને યાદીનું નામ દાખલ કરો.");
      return;
    }
    if (documents.length === 0) {
      toast.error("કૃપા કરીને ઓછામાં ઓછો એક દસ્તાવેજ ઉમેરો.");
      return;
    }

    const toastId = toast.loading("માહિતી અપડેટ થઈ રહી છે...");
    try {
      const res = await axios.post(
        "/api/admin/document-lists/update",
        {
          ID: currentId,
          ListName: listName,
          Documents: documents,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (res.data && res.data.success) {
        toast.success("કેન્દ્રીય દસ્તાવેજ યાદી સફળતાપૂર્વક સાચવવામાં આવી!", { id: toastId });
        setIsEditing(false);
        fetchLists();
      } else {
        toast.error("ભૂલ આવી: " + (res.data.error || "અજાણી ભૂલ"), { id: toastId });
      }
    } catch (err: any) {
      toast.error("સબમિશન નિષ્ફળ: " + (err.response?.data?.error || err.message), { id: toastId });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`શું તમે ખરેખર "${name}" દસ્તાવેજ યાદીને સંપૂર્ણપણે ડિલીટ કરવા માંગો છો?`)) {
      return;
    }

    const toastId = toast.loading("ડિલીટ થઈ રહ્યું છે...");
    try {
      const res = await axios.post(
        "/api/admin/document-lists/delete",
        { ID: id },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      if (res.data && res.data.success) {
        toast.success("દસ્તાવેજ યાદી સફળતાપૂર્વક ડિલીટ કરાઈ.", { id: toastId });
        fetchLists();
      } else {
        toast.error("ડિલીટ અસફળ: " + (res.data.error || "અજાણી ભૂલ"), { id: toastId });
      }
    } catch (err: any) {
      toast.error("ડિલીટ પ્રક્રિયા નિષ્ફળ: " + err.message, { id: toastId });
    }
  };

  return (
    <div className="space-y-8 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm" id="document-list-manager-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-full flex items-center justify-center">
            <Layers size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Centralized Document Checklists
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">
              Create Standard arrays of required documents for Blogs & Schemes
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchLists}
            className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-750 transition-all cursor-pointer border border-transparent dark:border-slate-700"
            title="Refresh Lists"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          {!isEditing && (
            <button
              onClick={handleStartAdd}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <Plus size={16} /> New Document Group
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing-pane"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-slate-50/50 dark:bg-slate-850/30 p-6 rounded-2xl border border-slate-150 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {listName ? "Edit Document List Schema" : "Design New Document Checklist Array"}
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 px-3 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest block">
                    Checklist Name / Identifier (બિલ્ડર શીર્ષક)<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    placeholder="e.g. Income Proofs (આવકના પુરાવાઓ)"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-150 outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    This name will appear as the category grouping title in client application drop zones.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-widest block">
                    Unique System ID key
                  </label>
                  <input
                    type="text"
                    value={currentId}
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-400 dark:text-slate-450 font-mono select-none outline-none"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    Assigned ID to reference inside Service Schema builder or Blogs.
                  </p>
                </div>
              </div>

              {/* Documents Elements Editor */}
              <div className="border-t border-slate-200/50 dark:border-slate-800 pt-6 space-y-4">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-455 uppercase tracking-widest block mb-2">
                  Document slots in this group (આ ગ્રુપમાં શામેલ દસ્તાવેજો)
                </label>

                {/* Inline item adder */}
                <div className="flex gap-2 max-w-xl">
                  <input
                    type="text"
                    value={newDocItem}
                    onChange={(e) => setNewDocItem(e.target.value)}
                    placeholder="e.g. Talati Letter (તલાટીનો દાખલો)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddDocItem();
                      }
                    }}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-slate-150 outline-none focus:ring-2 focus:ring-indigo-550"
                  />
                  <button
                    type="button"
                    onClick={handleAddDocItem}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer active:scale-95"
                  >
                    Add Slot
                  </button>
                </div>

                {/* Slots display */}
                <div className="space-y-2 max-w-2xl mt-4">
                  {documents.length === 0 ? (
                    <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                      No document slots defined in this checklist yet. Add one above!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-4 py-3 rounded-xl shadow-sm text-xs"
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate pr-2 flex items-center gap-2">
                            <span className="w-5 h-5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-full flex items-center justify-center text-[9px] font-black select-none shrink-0">{idx + 1}</span>
                            {doc}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="Remove Document Slot"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800">
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-755 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-indigo-500/10 cursor-pointer"
                >
                  Save Checklist Group
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-755 transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="grid-pane"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {loading ? (
              <div className="col-span-full py-16 text-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest-md">Loading Checklists...</p>
              </div>
            ) : lists.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-150 dark:border-slate-850 rounded-[28px]">
                <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">No central checklists created yet</p>
                <button
                  onClick={handleStartAdd}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 hover:bg-indigo-100 text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Create List A or List B Now
                </button>
              </div>
            ) : (
              lists.map((item) => (
                <div
                  key={item.ID}
                  className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-6 rounded-[24px] flex flex-col justify-between hover:border-indigo-500/40 dark:hover:border-indigo-550/40 transition-all hover:shadow-lg group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <span className="text-[8px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                          {item.ID}
                        </span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-105 text-sm leading-tight mt-1 group-hover:text-indigo-600 transition-colors">
                          {item.ListName}
                        </h4>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-4 min-h-[95px]">
                      <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block mb-2">Document requirements ({item.Documents.length})</span>
                      {item.Documents.slice(0, 4).map((doc, dIdx) => (
                        <div key={dIdx} className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2 truncate">
                          <ChevronRight size={10} className="text-indigo-500 shrink-0" />
                          {doc}
                        </div>
                      ))}
                      {item.Documents.length > 4 && (
                        <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 pl-4">
                          + {item.Documents.length - 4} more documents
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-2 border border-slate-150 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-500 dark:hover:border-indigo-500/50 text-slate-400 rounded-lg transition-all cursor-pointer"
                      title="Edit Checklist Group"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.ID, item.ListName)}
                      className="p-2 border border-slate-150 dark:border-slate-700 hover:border-red-500 hover:text-red-500 dark:hover:border-red-500/50 text-slate-400 rounded-lg transition-all cursor-pointer"
                      title="Delete Checklist Group"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
