import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileEdit, 
  AlertCircle, 
  Clock, 
  Search, 
  Send, 
  FileCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export interface StatusColorMeta {
  status: string;
  aliases: string[];
  displayName: string;
  category: 'Drafting' | 'Action Required' | 'Intake' | 'Verification' | 'Submitted' | 'Approved' | 'Flagged';
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  pillClass: string;
  cardBg: string;
  cardBorder: string;
  icon: React.ElementType;
  defaultMeaning: string;
  defaultAction: string;
  estDuration: string;
}

export const STATUS_LEGEND_CONFIGS: StatusColorMeta[] = [
  {
    status: 'Pending Admin Draft',
    aliases: ['pending admin draft', 'admin draft', 'docs received - pending admin draft', 'drafting'],
    displayName: 'Pending Admin Draft',
    category: 'Drafting',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/40',
    badgeText: 'text-blue-800 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-700/60',
    dotColor: 'bg-blue-600 dark:bg-blue-400',
    pillClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700/60',
    cardBg: 'bg-blue-50/50 dark:bg-blue-950/20',
    cardBorder: 'border-blue-200 dark:border-blue-900/40',
    icon: FileEdit,
    defaultMeaning: 'Administrative drafting desk is compiling the official legal documentation or notary deed after verifying applicant credentials.',
    defaultAction: 'No applicant action required. The drafting officer will upload the completed draft preview shortly.',
    estDuration: '12–24 Hours'
  },
  {
    status: 'Query Raised',
    aliases: ['query raised', 'query', 'clarification needed', 'document query', 'query pending'],
    displayName: 'Query Raised',
    category: 'Action Required',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-400 dark:border-amber-600/70',
    dotColor: 'bg-amber-500 dark:bg-amber-400',
    pillClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-400 dark:border-amber-600/70 animate-pulse-subtle',
    cardBg: 'bg-amber-50/60 dark:bg-amber-950/25',
    cardBorder: 'border-amber-300 dark:border-amber-800/60',
    icon: AlertCircle,
    defaultMeaning: 'An inquiry or document discrepancy was identified by the verification desk. Processing is temporarily paused until clarification is submitted.',
    defaultAction: 'Immediate action required: Check your email or open the correction panel to upload the missing or clearer document.',
    estDuration: 'Awaiting User Response'
  },
  {
    status: 'Docs Received',
    aliases: ['docs received', 'pending', 'intake', 'order placed'],
    displayName: 'Docs Received / Pending',
    category: 'Intake',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/30',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800/40',
    dotColor: 'bg-amber-400',
    pillClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40',
    cardBg: 'bg-slate-50 dark:bg-slate-950/30',
    cardBorder: 'border-slate-200 dark:border-slate-800',
    icon: Clock,
    defaultMeaning: 'Order successfully ingested into the central queue. Awaiting preliminary biometric and document format checks.',
    defaultAction: 'Queue assigned automatically; verification starts within standard queue SLA.',
    estDuration: '2–6 Hours'
  },
  {
    status: 'Under Review',
    aliases: ['under review', 'review', 'verifying', 'verification in progress'],
    displayName: 'Under Review',
    category: 'Verification',
    badgeBg: 'bg-sky-100 dark:bg-sky-950/40',
    badgeText: 'text-sky-800 dark:text-sky-300',
    badgeBorder: 'border-sky-300 dark:border-sky-700/60',
    dotColor: 'bg-sky-500',
    pillClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60',
    cardBg: 'bg-sky-50/40 dark:bg-sky-950/20',
    cardBorder: 'border-sky-200 dark:border-sky-900/40',
    icon: Search,
    defaultMeaning: 'A documentation officer is thoroughly cross-referencing attachments against official compliance norms.',
    defaultAction: 'Verification in progress. Keep your phone or email accessible in case confirmation is requested.',
    estDuration: '12–24 Hours'
  },
  {
    status: 'Submitted',
    aliases: ['submitted', 'processing', 'department submitted', 'govt filing'],
    displayName: 'Submitted / Processing',
    category: 'Submitted',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/40',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    badgeBorder: 'border-indigo-300 dark:border-indigo-700/60',
    dotColor: 'bg-indigo-500',
    pillClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700/60',
    cardBg: 'bg-indigo-50/40 dark:bg-indigo-950/20',
    cardBorder: 'border-indigo-200 dark:border-indigo-900/40',
    icon: Send,
    defaultMeaning: 'Your finalized dossier has been submitted to the designated governmental or regulatory authority portal.',
    defaultAction: 'Awaiting departmental registry queue response and official seal clearance.',
    estDuration: '24–72 Hours'
  },
  {
    status: 'Draft Generated',
    aliases: ['draft generated', 'draft ready', 'preview generated'],
    displayName: 'Draft Generated',
    category: 'Drafting',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/40',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-700/60',
    dotColor: 'bg-purple-500',
    pillClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60',
    cardBg: 'bg-purple-50/40 dark:bg-purple-950/20',
    cardBorder: 'border-purple-200 dark:border-purple-900/40',
    icon: FileCheck,
    defaultMeaning: 'The official document or affidavit draft has been compiled and is ready for applicant review or digital signature.',
    defaultAction: 'Review document draft via the preview modal and confirm details.',
    estDuration: 'Instant'
  },
  {
    status: 'ARN Generated',
    aliases: ['arn generated', 'completed', 'approved', 'issued'],
    displayName: 'ARN Generated / Completed',
    category: 'Approved',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-700/60',
    dotColor: 'bg-emerald-500',
    pillClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60',
    cardBg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    cardBorder: 'border-emerald-200 dark:border-emerald-900/40',
    icon: CheckCircle2,
    defaultMeaning: 'Success! Government authority has validated and approved the application. Official ARN or certificate is dispatched.',
    defaultAction: 'Download your finalized certificate, invoice, and tracking receipt directly.',
    estDuration: 'Completed'
  },
  {
    status: 'Manual Review Required',
    aliases: ['manual review required', 'manual review', 'anomalous', 'low_confidence', 'flagged'],
    displayName: 'Manual Review Required',
    category: 'Flagged',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/40',
    badgeText: 'text-orange-800 dark:text-orange-300',
    badgeBorder: 'border-orange-300 dark:border-orange-700/60',
    dotColor: 'bg-orange-500',
    pillClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-300 dark:border-orange-700/60',
    cardBg: 'bg-orange-50/40 dark:bg-orange-950/20',
    cardBorder: 'border-orange-200 dark:border-orange-900/40',
    icon: ShieldAlert,
    defaultMeaning: 'An automated OCR scan detected a low-confidence score or mismatch requiring supervisory human verification.',
    defaultAction: 'Senior supervisor is verifying the original physical scan to clear the application.',
    estDuration: '12–24 Hours'
  },
  {
    status: 'Rejected',
    aliases: ['rejected', 'declined', 'cancelled'],
    displayName: 'Rejected / Ineligible',
    category: 'Flagged',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/40',
    badgeText: 'text-rose-800 dark:text-rose-300',
    badgeBorder: 'border-rose-300 dark:border-rose-700/60',
    dotColor: 'bg-rose-600',
    pillClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60',
    cardBg: 'bg-rose-50/40 dark:bg-rose-950/20',
    cardBorder: 'border-rose-200 dark:border-rose-900/40',
    icon: XCircle,
    defaultMeaning: 'The application could not be approved due to statutory criteria or invalid documentation.',
    defaultAction: 'Contact customer support to examine the rejection notice and submit an amended request.',
    estDuration: 'Closed'
  }
];

export function getOrderStatusConfig(
  rawStatus?: string,
  dynamicDefinitions?: Record<string, { tooltip: string; definition: string }>
): StatusColorMeta {
  const norm = (rawStatus || '').toLowerCase().trim();
  
  // Look up in configured statuses
  const found = STATUS_LEGEND_CONFIGS.find(cfg => 
    cfg.aliases.some(alias => norm.includes(alias) || alias.includes(norm))
  );

  const base = found || {
    status: rawStatus || 'Pending',
    aliases: [norm],
    displayName: rawStatus || 'Pending',
    category: 'Intake' as const,
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-300 dark:border-slate-700',
    dotColor: 'bg-slate-400',
    pillClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
    cardBg: 'bg-slate-50 dark:bg-slate-950/30',
    cardBorder: 'border-slate-200 dark:border-slate-800',
    icon: Clock,
    defaultMeaning: 'Application is processing through the workflow stages.',
    defaultAction: 'Check back regularly for status progression.',
    estDuration: 'Standard SLA'
  };

  // Enrich with dynamic definitions if available
  if (dynamicDefinitions && dynamicDefinitions[norm]) {
    const dyn = dynamicDefinitions[norm];
    return {
      ...base,
      defaultMeaning: dyn.definition || base.defaultMeaning,
      defaultAction: dyn.tooltip || base.defaultAction
    };
  }

  return base;
}

interface OrderStatusLegendTooltipProps {
  currentStatus?: string;
  dynamicDefinitions?: Record<string, { tooltip: string; definition: string }>;
  onOpenFullDirectory?: () => void;
}

export function OrderStatusLegendTooltip({
  currentStatus,
  dynamicDefinitions,
  onOpenFullDirectory
}: OrderStatusLegendTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = currentStatus ? getOrderStatusConfig(currentStatus, dynamicDefinitions) : null;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-xs"
        aria-label="View Order Status Color Legend"
        id="status-color-legend-tooltip-trigger"
      >
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>Status Legend</span>
        <Info size={11} className="opacity-70 ml-0.5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 md:left-auto md:right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-[999] text-left"
            id="status-color-legend-tooltip-popover"
          >
            {/* Popover triangle caret */}
            <div className="absolute top-0 right-6 w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-white dark:border-b-slate-900 -mt-2 filter drop-shadow-xs" />

            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-150 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                  🎨
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Status Color Guide
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold">Dynamic color-coding meanings</p>
                </div>
              </div>
              <span className="text-[9px] font-black font-mono text-slate-400 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                SLA Codes
              </span>
            </div>

            {/* Current Status Highlight if active */}
            {currentConfig && (
              <div className="mb-3 p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 font-mono">Your Order Status</span>
                  <span className="text-[8px] font-bold text-slate-400">Est. {currentConfig.estDuration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${currentConfig.pillClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentConfig.dotColor}`} />
                    {currentConfig.displayName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-1.5 leading-snug">
                  {currentConfig.defaultMeaning}
                </p>
              </div>
            )}

            {/* Highlighted Critical Statuses: Pending Admin Draft & Query Raised */}
            <div className="space-y-2">
              <div className="text-[9px] font-black uppercase text-slate-400 tracking-wider font-mono">
                Key Processing Indicators
              </div>

              {/* Pending Admin Draft Item */}
              <div className="p-2 rounded-xl border bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                  <FileEdit size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wide text-blue-700 dark:text-blue-300">
                      Pending Admin Draft
                    </span>
                    <span className="text-[8px] font-bold text-blue-600/80 dark:text-blue-400/80 font-mono bg-blue-100/60 dark:bg-blue-900/30 px-1.5 py-0.2 rounded">
                      Blue
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                    <strong>Administrative Drafting:</strong> OCR passed; staff legal desk is actively drafting the document or affidavit.
                  </p>
                </div>
              </div>

              {/* Query Raised Item */}
              <div className="p-2 rounded-xl border bg-amber-50/50 dark:bg-amber-950/25 border-amber-300/80 dark:border-amber-800/50 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle size={11} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wide text-amber-800 dark:text-amber-300">
                      Query Raised
                    </span>
                    <span className="text-[8px] font-bold text-amber-700/90 dark:text-amber-400 font-mono bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.2 rounded">
                      Amber / Orange
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-600 dark:text-slate-300 leading-snug mt-0.5">
                    <strong>Action Required:</strong> Inconsistency or unreadable upload flagged. User must provide clarification or re-upload.
                  </p>
                </div>
              </div>

              {/* Other Key Color Badges in a compact row */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <div className="p-1.5 rounded-lg border bg-sky-50/40 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[8.5px] font-bold text-sky-800 dark:text-sky-300 truncate">Under Review</div>
                    <div className="text-[7.5px] text-slate-500 dark:text-slate-400">Verifying docs</div>
                  </div>
                </div>

                <div className="p-1.5 rounded-lg border bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[8.5px] font-bold text-emerald-800 dark:text-emerald-300 truncate">Completed</div>
                    <div className="text-[7.5px] text-slate-500 dark:text-slate-400">Ready to download</div>
                  </div>
                </div>
              </div>
            </div>

            {onOpenFullDirectory && (
              <div className="mt-3 pt-2.5 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[8px] font-bold text-slate-400">
                  Detailed explanations available
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFullDirectory();
                  }}
                  className="text-[9px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Legend & Directory</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface OrderStatusLegendSectionProps {
  currentStatus?: string;
  dynamicDefinitions?: Record<string, { tooltip: string; definition: string }>;
  defaultExpanded?: boolean;
}

export function OrderStatusLegendSection({
  currentStatus,
  dynamicDefinitions,
  defaultExpanded = false
}: OrderStatusLegendSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const currentNorm = (currentStatus || '').toLowerCase().trim();

  const categories = ['ALL', 'Action Required', 'Drafting', 'Verification', 'Approved'];

  const filteredConfigs = STATUS_LEGEND_CONFIGS.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.defaultMeaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section 
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-xs overflow-hidden transition-all"
      id="order-status-legend-section"
      aria-label="Order Status Color-Coding Legend"
    >
      {/* Header bar with expand toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-base shadow-xs">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm md:text-base text-slate-900 dark:text-white tracking-tight">
                Order Status Color-Coding Legend
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono">
                Interactive Guide
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
              Understand the meaning of each workflow badge color and what actions are required
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Collapse Legend' : 'Expand All Statuses'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Quick summary strip always visible */}
      <div className="py-3 flex flex-wrap items-center gap-2">
        <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 font-mono mr-1">
          Quick Color Reference:
        </span>

        {/* Pending Admin Draft Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span>Pending Admin Draft</span>
          <span className="text-[8px] opacity-75 font-mono">(Drafting)</span>
        </div>

        {/* Query Raised Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Query Raised</span>
          <span className="text-[8px] opacity-80 font-mono">(Action Required)</span>
        </div>

        {/* Under Review Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          <span className="w-2 h-2 rounded-full bg-sky-500" />
          <span>Under Review</span>
          <span className="text-[8px] opacity-75 font-mono">(Verifying)</span>
        </div>

        {/* Completed Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Completed</span>
          <span className="text-[8px] opacity-75 font-mono">(Ready)</span>
        </div>
      </div>

      {/* Expanded detailed cards */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4"
          >
            {/* Filter tags & search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter statuses or meanings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Grid of status cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
              {filteredConfigs.map(item => {
                const isCurrent = currentNorm !== '' && 
                  item.aliases.some(alias => currentNorm.includes(alias) || alias.includes(currentNorm));

                const IconComponent = item.icon;
                const dynamicDefinition = dynamicDefinitions && dynamicDefinitions[item.status.toLowerCase()] 
                  ? dynamicDefinitions[item.status.toLowerCase()].definition 
                  : item.defaultMeaning;
                const dynamicTooltip = dynamicDefinitions && dynamicDefinitions[item.status.toLowerCase()] 
                  ? dynamicDefinitions[item.status.toLowerCase()].tooltip 
                  : item.defaultAction;

                return (
                  <div
                    key={item.status}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${item.cardBg} ${item.cardBorder} ${
                      isCurrent ? 'ring-2 ring-blue-500 shadow-md scale-[1.01]' : 'hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Badge and Active Indicator */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider ${item.pillClass}`}>
                          <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                          <IconComponent size={12} className="shrink-0" />
                          <span>{item.displayName}</span>
                        </span>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs animate-pulse">
                            <Sparkles size={9} />
                            Your Order Stage
                          </span>
                        )}
                      </div>

                      {/* Color-Coding Meaning */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-2">
                        {dynamicDefinition}
                      </p>
                    </div>

                    {/* Action Hint & Timeline */}
                    <div className="pt-2 mt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1">
                      <div className="flex items-start gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="font-black uppercase text-[8px] font-mono text-slate-400 shrink-0 mt-0.5">
                          Action:
                        </span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                          {dynamicTooltip}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono pt-1 text-slate-400">
                        <span>Expected Turnaround:</span>
                        <span className="font-black text-slate-600 dark:text-slate-300">{item.estDuration}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredConfigs.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-xs">
                No statuses match your search. Clear the filter to see all status color meanings.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
