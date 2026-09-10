import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  FileSpreadsheet, 
  Edit, 
  Save, 
  RefreshCw, 
  FileText, 
  Award, 
  Eye, 
  Palette, 
  CheckCircle2, 
  Layout, 
  Sparkles,
  QrCode,
  Building2,
  FileCheck
} from 'lucide-react';

interface AdminInvoiceSettingsProps {
  user: any;
}

export default function AdminInvoiceSettings({ user }: AdminInvoiceSettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'invoice' | 'certificate' | 'fees' | 'preview'>('invoice');
  const [previewDocType, setPreviewDocType] = useState<'invoice' | 'certificate'>('invoice');
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Consolidated Invoice & Certificate Settings State
  const [settings, setSettings] = useState({
    // Business & General Info
    BUSINESS_NAME: 'Amit Online Services',
    BUSINESS_ADDRESS: 'Gopal Chowk, Nava Naroda, Ahmedabad, Gujarat-382330',
    CONTACT_EMAIL: 'amitonlineservice01@gmail.com',
    CONTACT_PHONE: '+91 90000 00000',
    BUSINESS_GSTIN: '24AAACR1234A1Z5',
    UPI_INSTRUCTION: '* SCAN & PAY SECURELY WITH ANY UPI APP *',

    // Tax Invoice Template Settings
    INVOICE_HEADER_TITLE: 'OFFICIAL TAX INVOICE',
    INVOICE_SUBTITLE: 'Facilitation & Digital Document Services',
    INVOICE_PRIMARY_COLOR: '#1e3a8a',
    INVOICE_SECONDARY_COLOR: '#3b82f6',
    INVOICE_TABLE_HEADER_BG: '#1e293b',
    INVOICE_SHOW_LOGO: 'true',
    INVOICE_LOGO_URL: '',
    INVOICE_FOOTER_NOTE: 'This is an official system-generated secure tax receipt. No physical signature is required. All disputes subject to local jurisdiction only.',
    INVOICE_TERMS: '* This is an automated dynamic system generated tax receipt.\n* All disputes are subject to local jurisdiction only.\n* Service charges are fully inclusive of facilitation expenses.\n* No active balance left outstanding.',

    // PDF Certificate Template Settings
    CERTIFICATE_TITLE: 'CERTIFICATE OF ACKNOWLEDGEMENT',
    CERTIFICATE_SUBTITLE: 'Government Application Facilitation & Verification Record',
    CERTIFICATE_ISSUER_NAME: 'Amit Online Services Legal & Facilitation Desk',
    CERTIFICATE_PRIMARY_COLOR: '#1e3a8a',
    CERTIFICATE_ACCENT_COLOR: '#d97706',
    CERTIFICATE_BG_TINT: '#ffffff',
    CERTIFICATE_BORDER_STYLE: 'Double Solid Gold',
    CERTIFICATE_SHOW_WATERMARK: 'true',
    CERTIFICATE_SEAL_URL: '',
    CERTIFICATE_SIGNATORY_NAME: 'Authorized Signatory',
    CERTIFICATE_SIGNATORY_TITLE: 'Central Facilitation Desk Manager',
    CERTIFICATE_FOOTER_VERIFICATION: 'Verified & Digitally Sealed under Amit Online Services Portal. Scan QR Code for live status verification.',
  });

  // Services master list state
  const [services, setServices] = useState<any[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceCharge, setEditServiceCharge] = useState<number>(0);
  const [editGovtFee, setEditGovtFee] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoiceSettings();
    fetchServicesMaster();
  }, []);

  const fetchInvoiceSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await axios.get('/api/invoice-settings');
      if (res.data?.success && res.data?.data) {
        setSettings(prev => ({ ...prev, ...res.data.data }));
      }
    } catch (err: any) {
      console.error("Failed to load invoice settings", err);
      toast.error("Failed to load invoice settings, using defaults.");
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchServicesMaster = async () => {
    setLoadingServices(true);
    try {
      const res = await axios.get('/api/services-master');
      if (res.data?.success && res.data?.data) {
        setServices(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to load services master", err);
      toast.error("Failed to load services master.");
    } finally {
      setLoadingServices(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    const toastId = toast.loading("Saving template settings to backend...");
    try {
      const res = await axios.post('/api/admin/invoice-settings', settings, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (res.data?.success) {
        toast.success("Template & Invoice settings saved successfully!", { id: toastId });
      } else {
        toast.error("Failed to update settings: " + (res.data?.error || "Unknown"), { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Network or authentication error updating settings.", { id: toastId });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleStartEditing = (svc: any) => {
    setEditingServiceId(svc.ID);
    setEditServiceCharge(Number(svc.ServiceCharge || svc.BasePrice || 0));
    setEditGovtFee(Number(svc.GovtFee || 0));
  };

  const handleCancelEditing = () => {
    setEditingServiceId(null);
  };

  const handleUpdateServiceFees = async (ID: string) => {
    if (editServiceCharge < 0 || editGovtFee < 0) {
      toast.error("Service Charge and Government Fee cannot be negative.");
      return;
    }
    const toastId = toast.loading("Saving updated service fees...");
    try {
      const res = await axios.post('/api/admin/services-master/fee-update', {
        ID,
        ServiceCharge: editServiceCharge,
        GovtFee: editGovtFee
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      if (res.data?.success) {
        toast.success("Service fees updated successfully!", { id: toastId });
        setEditingServiceId(null);
        setServices(prev => prev.map(s => {
          if (s.ID === ID) {
            return {
              ...s,
              ServiceCharge: editServiceCharge,
              GovtFee: editGovtFee,
              BasePrice: Number(editServiceCharge) + Number(editGovtFee)
            };
          }
          return s;
        }));
      } else {
        toast.error(res.data?.error || "Failed to update fees", { id: toastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update service fees on the server.", { id: toastId });
    }
  };

  const filteredServices = services.filter((svc: any) => {
    const nameMatch = (svc.ServiceName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const catMatch = (svc.Category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || catMatch;
  });

  // Preset Color Palettes
  const colorPalettes = [
    { name: 'Classic Navy', primary: '#1e3a8a', secondary: '#3b82f6', tableBg: '#1e293b', accent: '#d97706' },
    { name: 'Royal Indigo', primary: '#312e81', secondary: '#4f46e5', tableBg: '#1e1b4b', accent: '#b45309' },
    { name: 'Emerald Trust', primary: '#065f46', secondary: '#10b981', tableBg: '#022c22', accent: '#d97706' },
    { name: 'Deep Crimson', primary: '#991b1b', secondary: '#f43f5e', tableBg: '#450a0a', accent: '#d97706' },
    { name: 'Slate Corporate', primary: '#1e293b', secondary: '#0284c7', tableBg: '#0f172a', accent: '#2563eb' },
    { name: 'Dark Teal', primary: '#115e59', secondary: '#14b8a6', tableBg: '#042f2e', accent: '#eab308' },
  ];

  const applyPalette = (p: typeof colorPalettes[0], target: 'invoice' | 'certificate' | 'both') => {
    setSettings(prev => ({
      ...prev,
      ...(target === 'invoice' || target === 'both' ? {
        INVOICE_PRIMARY_COLOR: p.primary,
        INVOICE_SECONDARY_COLOR: p.secondary,
        INVOICE_TABLE_HEADER_BG: p.tableBg,
      } : {}),
      ...(target === 'certificate' || target === 'both' ? {
        CERTIFICATE_PRIMARY_COLOR: p.primary,
        CERTIFICATE_ACCENT_COLOR: p.accent,
      } : {})
    }));
    toast.success(`Applied ${p.name} color palette`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Layout className="text-blue-600 dark:text-blue-400" size={24} />
            Admin Invoice & Certificate Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize PDF tax invoice layouts, certificate templates, branding colors, terms, and service fees live without redeploying code.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSaveSettings()}
            disabled={savingSettings || loadingSettings}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md select-none disabled:opacity-50"
          >
            <Save size={14} />
            {savingSettings ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Primary Sub-Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('invoice')}
          className={`flex items-center gap-2 px-6 py-3 font-extrabold text-xs uppercase tracking-wide border-b-2 transition-all select-none whitespace-nowrap ${
            activeSubTab === 'invoice'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <FileText size={15} />
          Tax Invoice Template
        </button>
        <button
          onClick={() => setActiveSubTab('certificate')}
          className={`flex items-center gap-2 px-6 py-3 font-extrabold text-xs uppercase tracking-wide border-b-2 transition-all select-none whitespace-nowrap ${
            activeSubTab === 'certificate'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Award size={15} />
          PDF Certificate Template
        </button>
        <button
          onClick={() => setActiveSubTab('fees')}
          className={`flex items-center gap-2 px-6 py-3 font-extrabold text-xs uppercase tracking-wide border-b-2 transition-all select-none whitespace-nowrap ${
            activeSubTab === 'fees'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Database size={15} />
          Service Fee Manager
        </button>
        <button
          onClick={() => setActiveSubTab('preview')}
          className={`flex items-center gap-2 px-6 py-3 font-extrabold text-xs uppercase tracking-wide border-b-2 transition-all select-none whitespace-nowrap ${
            activeSubTab === 'preview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Eye size={15} />
          Live Interactive Preview
        </button>
      </div>

      {/* Sub-Tab 1: Tax Invoice Template Editor */}
      {activeSubTab === 'invoice' && (
        <div className="space-y-6">
          {/* Quick Color Palette Selector */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
              <Palette size={15} className="text-blue-600" />
              Quick Theme & Palette Presets
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {colorPalettes.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPalette(p, 'invoice')}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-1 w-full justify-center">
                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.primary }} />
                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.secondary }} />
                    <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: p.tableBg }} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Header & Layout Settings */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-sm flex items-center gap-2">
                <Building2 size={16} className="text-blue-600" />
                Header Layout & Business Metadata
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Invoice Header Title
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.INVOICE_HEADER_TITLE}
                    onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_HEADER_TITLE: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                    placeholder="e.g. OFFICIAL TAX INVOICE"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Sub-header Description
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.INVOICE_SUBTITLE}
                    onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_SUBTITLE: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                    placeholder="e.g. Facilitation & Digital Document Services"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Registered Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.BUSINESS_NAME}
                    onChange={(e) => setSettings(prev => ({ ...prev, BUSINESS_NAME: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    GSTIN / Business Registration No.
                  </label>
                  <input
                    type="text"
                    value={settings.BUSINESS_GSTIN}
                    onChange={(e) => setSettings(prev => ({ ...prev, BUSINESS_GSTIN: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200 font-mono"
                    placeholder="e.g. 24AAACR1234A1Z5 (Optional)"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Business Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.CONTACT_PHONE}
                    onChange={(e) => setSettings(prev => ({ ...prev, CONTACT_PHONE: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    required
                    value={settings.CONTACT_EMAIL}
                    onChange={(e) => setSettings(prev => ({ ...prev, CONTACT_EMAIL: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Registered Office Address
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={settings.BUSINESS_ADDRESS}
                    onChange={(e) => setSettings(prev => ({ ...prev, BUSINESS_ADDRESS: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Branding Colors & Style Options */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-sm flex items-center gap-2">
                <Palette size={16} className="text-blue-600" />
                Branding Colors & Visual Elements
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Header & Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.INVOICE_PRIMARY_COLOR}
                      onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_PRIMARY_COLOR: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1"
                    />
                    <input
                      type="text"
                      value={settings.INVOICE_PRIMARY_COLOR}
                      onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_PRIMARY_COLOR: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono rounded-xl text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.INVOICE_SECONDARY_COLOR}
                      onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_SECONDARY_COLOR: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1"
                    />
                    <input
                      type="text"
                      value={settings.INVOICE_SECONDARY_COLOR}
                      onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_SECONDARY_COLOR: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono rounded-xl text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Table Header BG Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.INVOICE_TABLE_HEADER_BG}
                      onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_TABLE_HEADER_BG: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1"
                    />
                    <input
                      type="text"
                      value={settings.INVOICE_TABLE_HEADER_BG}
                      onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_TABLE_HEADER_BG: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono rounded-xl text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                  UPI Scan & Pay Text Line
                </label>
                <input
                  type="text"
                  value={settings.UPI_INSTRUCTION}
                  onChange={(e) => setSettings(prev => ({ ...prev, UPI_INSTRUCTION: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Terms & Footer Note */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-sm flex items-center gap-2">
                <FileCheck size={16} className="text-blue-600" />
                Footer Note & Terms & Conditions
              </h3>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                  Invoice Terms & Conditions (One rule per line)
                </label>
                <textarea
                  rows={4}
                  value={settings.INVOICE_TERMS}
                  onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_TERMS: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                  Footer Legal Fineprint Note
                </label>
                <input
                  type="text"
                  value={settings.INVOICE_FOOTER_NOTE}
                  onChange={(e) => setSettings(prev => ({ ...prev, INVOICE_FOOTER_NOTE: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 px-8 py-3.5 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md select-none disabled:opacity-50"
              >
                <Save size={14} />
                Save Invoice Template Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Tab 2: PDF Certificate Template Editor */}
      {activeSubTab === 'certificate' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Certificate Header & Authority */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-sm flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Certificate Header & Title Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Certificate Header Title
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.CERTIFICATE_TITLE}
                    onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_TITLE: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                    placeholder="e.g. CERTIFICATE OF ACKNOWLEDGEMENT"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Certificate Subtitle
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.CERTIFICATE_SUBTITLE}
                    onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_SUBTITLE: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                    placeholder="e.g. Government Application Facilitation Record"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Issuing Authority Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.CERTIFICATE_ISSUER_NAME}
                    onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_ISSUER_NAME: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Frame, Border Style & Colors */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-sm flex items-center gap-2">
                <Palette size={16} className="text-amber-500" />
                Certificate Border Frame & Color Styling
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Border Frame Style
                  </label>
                  <select
                    value={settings.CERTIFICATE_BORDER_STYLE}
                    onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_BORDER_STYLE: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Double Solid Gold">Double Solid Gold Frame</option>
                    <option value="Classic Navy Frame">Classic Navy Solid Frame</option>
                    <option value="Emerald Border">Emerald Green Ornate Border</option>
                    <option value="Minimal Single Line">Minimal Single Line Frame</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Primary Header Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.CERTIFICATE_PRIMARY_COLOR}
                      onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_PRIMARY_COLOR: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1"
                    />
                    <input
                      type="text"
                      value={settings.CERTIFICATE_PRIMARY_COLOR}
                      onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_PRIMARY_COLOR: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono rounded-xl text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Accent / Border Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.CERTIFICATE_ACCENT_COLOR}
                      onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_ACCENT_COLOR: e.target.value }))}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-1"
                    />
                    <input
                      type="text"
                      value={settings.CERTIFICATE_ACCENT_COLOR}
                      onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_ACCENT_COLOR: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono rounded-xl text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Signatory & Verification Footer */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-slate-900 dark:text-slate-100 font-extrabold text-sm flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-500" />
                Digital Signatory & Verification Footer
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Signatory Name
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.CERTIFICATE_SIGNATORY_NAME}
                    onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_SIGNATORY_NAME: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Signatory Designation
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.CERTIFICATE_SIGNATORY_TITLE}
                    onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_SIGNATORY_TITLE: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                    Certificate Footer Verification Note
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.CERTIFICATE_FOOTER_VERIFICATION}
                    onChange={(e) => setSettings(prev => ({ ...prev, CERTIFICATE_FOOTER_VERIFICATION: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-blue-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:brightness-105 px-8 py-3.5 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-md select-none disabled:opacity-50"
              >
                <Save size={14} />
                Save Certificate Template Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Tab 3: Service Fee Manager */}
      {activeSubTab === 'fees' && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-slate-800 dark:text-slate-200 font-bold text-sm mb-2 flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-indigo-600" />
              Live Government Service Pricing Master
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              Every government application (PAN, Income Certificate, Domicile, Caste, Ration Card) calculates invoice subtotals using these live parameters.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Filter services by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-indigo-600 text-slate-800 dark:text-slate-200"
              />
              <button
                onClick={fetchServicesMaster}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold"
                title="Refresh master live sheets list"
              >
                <RefreshCw size={14} className={loadingServices ? "animate-spin" : ""} /> Refresh List
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
            <table className="w-full text-left text-slate-800 dark:text-slate-200">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Service Name</th>
                  <th className="px-5 py-4 text-right">Base Service Charge</th>
                  <th className="px-5 py-4 text-right">Government Fee</th>
                  <th className="px-5 py-4 text-right">Standard Total Price</th>
                  <th className="px-5 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/85 text-xs">
                {loadingServices ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Querying Services_Master from backend...
                    </td>
                  </tr>
                ) : filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No matching government application services found.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map((svc) => (
                    <tr key={svc.ID} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-5 py-4 font-mono text-[10px] text-slate-500">{svc.ID}</td>
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200">{svc.ServiceName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{svc.Category} &gt; {svc.SubCategory || 'Direct'}</div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {editingServiceId === svc.ID ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-slate-400 text-[10px] select-none">₹</span>
                            <input
                              type="number"
                              value={editServiceCharge}
                              onChange={(e) => setEditServiceCharge(parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1.5 text-right border border-blue-500 rounded bg-white dark:bg-slate-950 text-xs focus:outline-none"
                            />
                          </div>
                        ) : (
                          <span>₹{(svc.ServiceCharge || svc.BasePrice || 0)}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {editingServiceId === svc.ID ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-slate-400 text-[10px] select-none">₹</span>
                            <input
                              type="number"
                              value={editGovtFee}
                              onChange={(e) => setEditGovtFee(parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1.5 text-right border border-blue-500 rounded bg-white dark:bg-slate-950 text-xs focus:outline-none"
                            />
                          </div>
                        ) : (
                          <span>₹{(svc.GovtFee || 0)}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-extrabold text-slate-700 dark:text-slate-300">
                        {editingServiceId === svc.ID ? (
                          <span>₹{(Number(editServiceCharge) + Number(editGovtFee)).toFixed(2)}</span>
                        ) : (
                          <span>₹{(Number(svc.ServiceCharge || svc.BasePrice || 0) + Number(svc.GovtFee || 0)).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {editingServiceId === svc.ID ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdateServiceFees(svc.ID)}
                              className="p-1 px-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 select-none"
                            >
                              <Save size={12} /> Save
                            </button>
                            <button
                              onClick={handleCancelEditing}
                              className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs transition-all select-none"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditing(svc)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-all flex items-center justify-center mx-auto select-none"
                            title="Edit Service Fees"
                          >
                            <Edit size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Live Interactive Preview */}
      {activeSubTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl max-w-md mx-auto">
            <button
              onClick={() => setPreviewDocType('invoice')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none flex items-center justify-center gap-2 ${
                previewDocType === 'invoice'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText size={14} /> Tax Invoice Preview
            </button>
            <button
              onClick={() => setPreviewDocType('certificate')}
              className={`flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all select-none flex items-center justify-center gap-2 ${
                previewDocType === 'certificate'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Award size={14} /> Certificate Preview
            </button>
          </div>

          {/* Interactive Document Card rendering configured colors & text */}
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-300 shadow-xl text-slate-800 font-sans space-y-6">
            {previewDocType === 'invoice' ? (
              <>
                {/* Header Banner */}
                <div 
                  className="p-6 rounded-xl text-white flex justify-between items-center transition-all"
                  style={{ backgroundColor: settings.INVOICE_PRIMARY_COLOR }}
                >
                  <div>
                    <h2 className="text-xl font-extrabold uppercase tracking-wide">{settings.BUSINESS_NAME}</h2>
                    <p className="text-xs opacity-80 mt-1">{settings.INVOICE_SUBTITLE}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-sm font-bold uppercase tracking-wider">{settings.INVOICE_HEADER_TITLE}</h3>
                    <p className="text-[10px] opacity-80 mt-1">Order #AOS-SAMPLE</p>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex justify-between text-xs font-medium text-slate-600">
                  <div>Date: <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-IN')}</span></div>
                  <div>GSTIN: <span className="font-mono text-slate-900">{settings.BUSINESS_GSTIN || "N/A"}</span></div>
                  <div>Status: <span className="font-extrabold uppercase" style={{ color: settings.INVOICE_SECONDARY_COLOR }}>PAID</span></div>
                </div>

                {/* Bill To & Provider */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider mb-2" style={{ color: settings.INVOICE_SECONDARY_COLOR }}>Customer Information</h4>
                    <p className="font-bold text-slate-900">Rajesh Patel</p>
                    <p className="text-slate-600">Ahmedabad, Gujarat, India</p>
                    <p className="text-slate-600">Mobile: +91 98765 43210</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                    <h4 className="font-bold text-[10px] uppercase tracking-wider mb-2" style={{ color: settings.INVOICE_SECONDARY_COLOR }}>Service Provider</h4>
                    <p className="font-bold text-slate-900">{settings.BUSINESS_NAME}</p>
                    <p className="text-slate-600">{settings.BUSINESS_ADDRESS}</p>
                    <p className="text-slate-600">Phone: {settings.CONTACT_PHONE}</p>
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: settings.INVOICE_TABLE_HEADER_BG }}>
                      <th className="p-2.5 font-bold uppercase rounded-tl-lg">Description</th>
                      <th className="p-2.5 font-bold uppercase text-center">Qty</th>
                      <th className="p-2.5 font-bold uppercase text-right">Price</th>
                      <th className="p-2.5 font-bold uppercase text-right rounded-tr-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-x border-b border-slate-200">
                    <tr>
                      <td className="p-2.5 font-medium">Government Portal Fee (Income Certificate)</td>
                      <td className="p-2.5 text-center">1 App</td>
                      <td className="p-2.5 text-right">₹ 50.00</td>
                      <td className="p-2.5 text-right font-bold">₹ 50.00</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2.5 font-medium">AOS Professional Facilitation Charge</td>
                      <td className="p-2.5 text-center">1 Service</td>
                      <td className="p-2.5 text-right">₹ 100.00</td>
                      <td className="p-2.5 text-right font-bold">₹ 100.00</td>
                    </tr>
                    <tr className="font-extrabold text-sm" style={{ backgroundColor: `${settings.INVOICE_PRIMARY_COLOR}15`, color: settings.INVOICE_PRIMARY_COLOR }}>
                      <td colSpan={3} className="p-2.5 text-right uppercase">Grand Total Paid:</td>
                      <td className="p-2.5 text-right">₹ 150.00</td>
                    </tr>
                  </tbody>
                </table>

                {/* Terms Box */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                  <h4 className="font-bold text-[10px] uppercase tracking-wider text-slate-700 mb-1">Terms & Conditions</h4>
                  <p className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed">{settings.INVOICE_TERMS}</p>
                </div>

                {/* Footer Note */}
                <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 pt-3">
                  {settings.INVOICE_FOOTER_NOTE}
                </div>
              </>
            ) : (
              /* PDF Certificate Preview */
              <div 
                className="p-8 rounded-2xl border-4 relative text-center space-y-6"
                style={{ 
                  borderColor: settings.CERTIFICATE_ACCENT_COLOR,
                  backgroundColor: settings.CERTIFICATE_BG_TINT
                }}
              >
                {/* Certificate Inner Frame */}
                <div 
                  className="border-2 p-6 rounded-xl space-y-6"
                  style={{ borderColor: settings.CERTIFICATE_PRIMARY_COLOR }}
                >
                  <div className="space-y-2">
                    <Award size={48} className="mx-auto" style={{ color: settings.CERTIFICATE_ACCENT_COLOR }} />
                    <h2 className="text-2xl font-black uppercase tracking-widest" style={{ color: settings.CERTIFICATE_PRIMARY_COLOR }}>
                      {settings.CERTIFICATE_TITLE}
                    </h2>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {settings.CERTIFICATE_SUBTITLE}
                    </p>
                  </div>

                  <div className="w-24 h-0.5 mx-auto" style={{ backgroundColor: settings.CERTIFICATE_ACCENT_COLOR }} />

                  <div className="space-y-2 text-xs text-slate-700 max-w-lg mx-auto">
                    <p>This is to certify that the application submitted under reference <span className="font-bold font-mono">#AOS-2026-9921</span> has been successfully processed and verified by:</p>
                    <p className="text-base font-extrabold" style={{ color: settings.CERTIFICATE_PRIMARY_COLOR }}>
                      {settings.CERTIFICATE_ISSUER_NAME}
                    </p>
                  </div>

                  {/* Stamp & Signatory Block */}
                  <div className="flex justify-between items-end pt-8 px-4 border-t border-slate-200 text-xs">
                    <div className="text-left space-y-1">
                      <QrCode size={40} style={{ color: settings.CERTIFICATE_PRIMARY_COLOR }} />
                      <p className="text-[9px] font-mono text-slate-400">QR Digital Verification</p>
                    </div>

                    <div className="text-right space-y-1">
                      <p className="font-extrabold text-slate-900">{settings.CERTIFICATE_SIGNATORY_NAME}</p>
                      <p className="text-[10px] text-slate-500">{settings.CERTIFICATE_SIGNATORY_TITLE}</p>
                      <div className="w-32 border-b border-dashed border-slate-400 my-1 ml-auto" />
                      <p className="text-[8px] uppercase tracking-widest text-slate-400">Digitally Verified</p>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 italic">
                    {settings.CERTIFICATE_FOOTER_VERIFICATION}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
