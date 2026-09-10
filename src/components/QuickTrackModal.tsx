import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Search, X, Loader2, AlertTriangle } from 'lucide-react';

interface QuickTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickTrackModal({ isOpen, onClose }: QuickTrackModalProps) {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast.error('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setError(null);
    setTrackedOrder(null);

    try {
      const res = await axios.get(`/api/orders/track/${orderId.trim()}`);
      if (res.data.success && res.data.data) {
        setTrackedOrder(res.data.data);
        toast.success(`Found active track details for Order ID: ${orderId.trim()}`);
      } else {
        setError(res.data.error || 'No active service application found with this Order ID.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setError('No active service application found with this Order ID.');
      } else {
        setError('Server lookup timed out. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Safe fallback finally
  const getStepProgress = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed') || s.includes('approved')) return { step: 3, percent: 100 };
    if (s.includes('submitted')) return { step: 2, percent: 75 };
    if (s.includes('under review') || s.includes('query') || s.includes('processing')) return { step: 1, percent: 50 };
    return { step: 0, percent: 25 };
  };

  const currentStatus = trackedOrder ? (trackedOrder.Status || trackedOrder.status || 'Pending') : 'Pending';
  const { step: stepIndex, percent: progressPercentage } = getStepProgress(currentStatus);

  const trackerSteps = [
    { title: 'Registered', desc: 'Dossier Prepared' },
    { title: 'In Verification', desc: 'AOS Desk Audit' },
    { title: 'Filed', desc: 'Government Dept Review' },
    { title: 'Issued', desc: 'Deliverables Ready' }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 rounded-full bg-blue-600 animate-pulse"></div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Track Service Application Progress
            </h3>
          </div>
          <p className="text-xs text-slate-450 mt-1 font-bold">
            Enter your transaction application Order ID to see a real-time progress bar.
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleTrackSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter ID... (e.g., ORD-20260617-9876)"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-xs font-bold pl-10 text-slate-900 dark:text-white placeholder-slate-450 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-blue-100 dark:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Querying Core Registry...
                </>
              ) : (
                'Track Progress'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400 font-bold">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {trackedOrder && (
            <div className="mt-8 space-y-6">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black tracking-widest text-slate-450 uppercase">
                    Application ID
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                    #{trackedOrder.orderId || trackedOrder.ID}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black tracking-widest text-slate-450 uppercase">
                    Service Type
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {trackedOrder.service || trackedOrder.Type || 'GST Registration'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black tracking-widest text-slate-450 uppercase">
                    Current Status
                  </span>
                  <span className="text-xs font-extrabold uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-md">
                    {currentStatus}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Stepper */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-450 uppercase tracking-widest">
                  <span>Application Progress</span>
                  <span className="text-blue-600 dark:text-blue-400">{progressPercentage}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-4 gap-1 pt-2">
                  {trackerSteps.map((step, idx) => {
                    const isDone = idx <= stepIndex;
                    const isCurrent = idx === stepIndex;
                    return (
                      <div key={idx} className="text-center space-y-1">
                        <div
                          className={`mx-auto w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold border transition-colors ${
                            isDone 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <p className={`text-[8.5px] font-black uppercase tracking-tight ${isCurrent ? 'text-blue-600 dark:text-blue-400' : isDone ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
                            {step.title}
                          </p>
                          <p className="text-[7px] text-slate-400 dark:text-slate-550 font-medium leading-none">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
