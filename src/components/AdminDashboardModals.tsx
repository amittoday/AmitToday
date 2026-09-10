import { useState } from 'react';
import { Printer, Send, MessageCircle, Mail } from 'lucide-react';

export default function AdminDashboardModals() {
  // 1. Notification Toggles State
  const [notifications, setNotifications] = useState({
    whatsapp: true,
    email: true,
    sms: false
  });

  // 2. Print Configuration State
  const [printConfig, setPrintConfig] = useState({
    showNameMobile: true,
    showStatus: true,
    showPan: true,
    showSanad: true,
    showPayment: true
  });

  // સબમિટ ફંક્શન (GAS Backend માટે)
  const handleStatusUpdate = async () => {
    const payload = {
      action: 'ACTION_UPDATE_STATUS',
      status: 'Portal Filing Done',
      notifications: notifications // આ ડેટા સીધો GAS માં જશે
    };
    console.log("Submitting to GAS:", payload);
    // await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload) });
  };

  return (
    <div className="p-8 space-y-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 min-h-screen">
      
      {/* --- STATUS UPDATE MODAL (Snippet) --- */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md">
        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Update Application Status</h3>
        
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Client Notifications</label>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"><MessageCircle size={18} className="text-green-500"/> WhatsApp Alert</div>
            <input type="checkbox" checked={notifications.whatsapp} onChange={(e) => setNotifications({...notifications, whatsapp: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"><Mail size={18} className="text-blue-500"/> Email Alert</div>
            <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({...notifications, email: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"><Send size={18} className="text-purple-500"/> SMS Alert</div>
            <input type="checkbox" checked={notifications.sms} onChange={(e) => setNotifications({...notifications, sms: e.target.checked})} className="w-4 h-4 accent-blue-600 cursor-pointer" />
          </div>
        </div>

        <button onClick={handleStatusUpdate} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-md">
          Update Status
        </button>
      </div>


      {/* --- PRINT CONFIGURATION MODAL (Snippet) --- */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 max-w-md">
        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white flex items-center gap-2">
          <Printer size={20} /> Print Report Configuration
        </h3>
        
        <div className="space-y-3 mb-6">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider font-bold">Select fields to include in PDF/Print:</p>
          
          {Object.keys(printConfig).map((key) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={printConfig[key as keyof typeof printConfig]} 
                onChange={(e) => setPrintConfig({...printConfig, [key]: e.target.checked})}
                className="w-4 h-4 accent-slate-800 rounded cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {key.replace('show', '').replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>

        <button className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md">
          <Printer size={18} /> Generate Print View
        </button>
      </div>

    </div>
  );
}
