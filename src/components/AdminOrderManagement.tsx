import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, RotateCcw, Clock, AlertTriangle, StickyNote } from 'lucide-react';
import SlaPriorityBadge from './SlaPriorityBadge';
import AdminNotesRowInput from './AdminNotesRowInput';

export default function AdminOrderManagement() {
  // Modal ના ઓપન/ક્લોઝ સ્ટેટને હેન્ડલ કરવા માટે
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusColWidth, setStatusColWidth] = useState<number>(200);
  const [isDraggingStatusCol, setIsDraggingStatusCol] = useState(false);
  const statusThRef = useRef<HTMLTableCellElement>(null);

  const handleStatusResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingStatusCol(true);
    const startX = e.clientX;
    const startWidth = statusThRef.current ? statusThRef.current.getBoundingClientRect().width : statusColWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      let newWidth = startWidth + deltaX;
      if (newWidth < 150) {
        newWidth = 150;
      } else if (newWidth > 300) {
        newWidth = 300;
      }
      setStatusColWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDraggingStatusCol(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleResetStatusColWidth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusColWidth(200);
    if (statusThRef.current) {
      statusThRef.current.style.width = "";
    }
  };

  useEffect(() => {
    const el = statusThRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w < 150 && w > 0) {
          if (el) el.style.width = "150px";
          setStatusColWidth(150);
        } else if (w > 0) {
          setStatusColWidth(Math.round(w));
        }
      }
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-screen">
      
      {/* --- ૧. Resizable Status Column Header --- */}
      <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm">
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">Order ID</th>
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">Advocate Name</th>
              
              {/* અહીં .admin-order-table-th-status અને resize-x લાગુ કરવામાં આવ્યું છે */}
              <th 
                ref={statusThRef}
                style={{ width: `${statusColWidth}px` }}
                className={`admin-order-table-th-status p-4 border-b border-slate-200 dark:border-slate-700 resize-x overflow-auto min-w-[150px] max-w-[300px] font-semibold relative group transition-all duration-300 border-r-2 ${
                  isDraggingStatusCol 
                    ? "border-blue-600 dark:border-blue-600 bg-blue-100/40 dark:bg-blue-900/40 shadow-[0_0_15px_rgba(37,99,235,0.45)]" 
                    : "border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-[0_0_12px_rgba(59,130,246,0.35)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    {/* Visual Reset Button */}
                    <button
                      type="button"
                      onClick={handleResetStatusColWidth}
                      className="opacity-0 group-hover:opacity-100 ml-1 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full transition-all cursor-pointer shadow-sm"
                      title="Reset Column Width (200px)"
                      aria-label="Reset column width to default"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                  {/* Enhanced Drag Handle Indicator */}
                  <div 
                    onMouseDown={handleStatusResizeStart}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-l transition-all cursor-col-resize ${
                      isDraggingStatusCol 
                        ? "w-2 h-8 bg-blue-600 dark:bg-blue-500 shadow-[0_0_12px_#2563eb] opacity-100" 
                        : "w-1.5 h-6 bg-slate-300 dark:bg-slate-600 hover:bg-blue-500 hover:w-2 hover:h-8 opacity-0 group-hover:opacity-100"
                    }`}
                    title="Drag to resize column width"
                    aria-hidden="true"
                  ></div>
                </div>
              </th>
              
              {/* SLA Timer Indicator Column */}
              <th className="admin-order-table-th-sla p-4 border-b border-slate-200 dark:border-slate-700 font-semibold min-w-[140px]">
                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="text-slate-400" />
                  <span>SLA Timer</span>
                </div>
              </th>

              {/* Admin Notes Column */}
              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold min-w-[200px]">
                <div className="flex items-center gap-1.5">
                  <StickyNote size={15} className="text-amber-500" />
                  <span>Admin Notes</span>
                </div>
              </th>

              <th className="p-4 border-b border-slate-200 dark:border-slate-700 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {/* Table rows ડેટા અહીં આવશે */}
            <tr className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
              <td className="p-4 text-sm text-slate-600 dark:text-slate-300">#ORD-1024</td>
              <td className="p-4 text-sm text-slate-600 dark:text-slate-200 font-medium">Rajesh Kumar</td>
              <td className="p-4 text-sm">
                <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-md font-semibold text-xs">OCR Pending</span>
              </td>
              <td className="p-4 text-sm">
                <SlaPriorityBadge 
                  order={{ 
                    orderId: "ORD-1024", 
                    status: "OCR Pending", 
                    createdAt: new Date(Date.now() - 52 * 3600000).toISOString() 
                  }} 
                  currentStatus="OCR Pending"
                  variant="badge" 
                />
              </td>
              <td className="p-4 min-w-[200px] max-w-[300px]">
                <AdminNotesRowInput
                  order={{
                    orderId: "ORD-1024",
                    notes: "Verified identity via DigiLocker",
                  }}
                  placeholder="Add internal remark..."
                />
              </td>
              <td className="p-4 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">View</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* --- ૨. Status Dropdown & Help Button --- */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-sm">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Update Application Status
        </label>
        <div className="flex items-center">
          <select className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-700 dark:text-slate-200 transition-shadow">
            <option>Docs Received</option>
            <option>OCR Verification</option>
            <option>Query Raised</option>
            <option>Portal Filing Done</option>
          </select>
          
          {/* Help Button */}
          <button 
            id="status-definitions-guide-btn" 
            onClick={() => setIsStatusModalOpen(true)}
            className="ml-3 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:animate-pulse rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer"
            title="Understanding Workflow Statuses"
            aria-label="Open status definitions guide"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {/* --- ૩. Status Definitions Modal --- */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <HelpCircle size={18} className="text-blue-600 dark:text-blue-400"/> 
                Status Definitions Guide
              </h3>
              <button 
                onClick={() => setIsStatusModalOpen(false)} 
                className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto text-sm">
              <div className="border-l-4 border-blue-500 pl-3">
                <span className="inline-block font-bold text-slate-800 dark:text-slate-100 mb-1">Docs Received</span>
                <p className="text-slate-500 dark:text-slate-300 leading-relaxed">The advocate has successfully uploaded all base documents and completed payment. Awaiting initial admin review.</p>
              </div>
              
              <div className="border-l-4 border-amber-500 pl-3">
                <span className="inline-block font-bold text-slate-800 dark:text-slate-100 mb-1">OCR Verification</span>
                <p className="text-slate-500 dark:text-slate-300 leading-relaxed">The system or admin is currently extracting text details (PAN, Sanad Number) from the uploaded images.</p>
              </div>
              
              <div className="border-l-4 border-rose-500 pl-3">
                <span className="inline-block font-bold text-slate-800 dark:text-slate-100 mb-1">Query Raised</span>
                <p className="text-slate-500 dark:text-slate-300 leading-relaxed">An issue was found with the documents (e.g., blurry image, missing signature). Requires follow-up with the advocate.</p>
              </div>
              
              <div className="border-l-4 border-emerald-500 pl-3">
                <span className="inline-block font-bold text-slate-800 dark:text-slate-100 mb-1">Portal Filing Done</span>
                <p className="text-slate-500 dark:text-slate-300 leading-relaxed">The application has been successfully auto-filled and filed on the central notary.gov.in portal via the Chrome Extension.</p>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 text-right">
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
