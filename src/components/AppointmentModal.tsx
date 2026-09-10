import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, User, Mail, Phone, Briefcase, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'gu' | 'en' | 'hi';
}

const servicesList = {
  en: [
    "Legal Translation",
    "Driving License / RTO Services",
    "PAN Card Application",
    "Passport Services",
    "GST Registration & Filing",
    "Digital Signature Certificate (DSC)",
    "Garvi 2.0 / Land Registration",
    "Business/Company Registration"
  ],
  gu: [
    "કાયદાકીય અનુવાદ",
    "ડ્રાઇવિંગ લાઇસન્સ / RTO સેવાઓ",
    "પાન કાર્ડ અરજી",
    "પાસપોર્ટ સેવાઓ",
    "GST નોંધણી અને ફાઇલિંગ",
    "ડિજિટલ સિગ્નેચર સર્ટિફિકેટ (DSC)",
    "ગરવી ૨.૦ / જમીન નોંધણી",
    "વ્યવસાય/કંપની નોંધણી"
  ]
};

const modalTranslations = {
  en: {
    title: "Book an Appointment",
    subtitle: "Schedule a professional consultation with our legal & digital service experts.",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    prefDate: "Preferred Date",
    prefTime: "Preferred Time Slot",
    service: "Service Required",
    notes: "Additional Details / Special Request",
    namePlaceholder: "Enter your full name",
    emailPlaceholder: "Enter your email address",
    phonePlaceholder: "Enter 10-digit mobile number",
    notesPlaceholder: "Write specific concerns or details here...",
    cancel: "Cancel",
    confirm: "Confirm Appointment",
    booking: "Booking slot...",
    successTitle: "Appointment Registered!",
    successSub: "Your appointment request has been recorded. Our team will verify and dispatch a confirmation receipt via Email & SMS shortly.",
    close: "Close Dialog",
    slots: [
      "Morning (10:00 AM - 12:00 PM)",
      "Afternoon (12:00 PM - 03:00 PM)",
      "Late Afternoon (03:00 PM - 06:00 PM)",
      "Evening (06:00 PM - 08:00 PM)"
    ],
    selectService: "Select service",
    selectSlot: "Select preferred slot"
  },
  gu: {
    title: "એપોઈન્ટમેન્ટ બુક કરો",
    subtitle: "અમારા કાયદાકીય અને ડિજિટલ સેવા નિષ્ણાતો સાથે વ્યાવસાયિક પરામર્શ સુનિશ્ચિત કરો.",
    fullName: "પૂરું નામ",
    email: "ઇમેઇલ સરનામું",
    phone: "ફોન નંબર",
    prefDate: "પસંદગીની તારીખ",
    prefTime: "પસંદગીનો સમય સ્લોટ",
    service: "જરૂરી સેવા",
    notes: "વધારાની વિગતો / વિશેષ વિનંતી",
    namePlaceholder: "તમારું પૂરું નામ લખો",
    emailPlaceholder: "તમારો ઇમેઇલ લખો",
    phonePlaceholder: "૧૦-આંકડાનો મોબાઇલ નંબર લખો",
    notesPlaceholder: "તમારી વિશિષ્ટ ચિંતાઓ અથવા વિગતો અહીં લખો...",
    cancel: "રદ કરો",
    confirm: "પુષ્ટિ કરો અને બુક કરો",
    booking: "બુકિંગ થઈ રહ્યું છે...",
    successTitle: "એપોઇન્ટમેન્ટ નોંધાઈ ગઈ છે!",
    successSub: "તમારી એપોઇન્ટમેન્ટ વિનંતી સફળતાપૂર્વક નોંધવામાં આવી છે. અમારી ટીમ ટૂંક સમયમાં ઇમેઇલ અને SMS દ્વારા પુષ્ટિની રસીદ મોકલશે.",
    close: "બંધ કરો",
    slots: [
      "સવાર (૧૦:૦૦ AM - ૧૨:૦૦ PM)",
      "બપોર (૧૨:૦૦ PM - ૦૩:૦૦ PM)",
      "મોડી બપોર (૦૩:૦૦ PM - ૦૬:૦૦ PM)",
      "સાંજ (૦૬:૦૦ PM - ૦૮:૦૦ PM)"
    ],
    selectService: "સેવા પસંદ કરો",
    selectSlot: "સમય સ્લોટ પસંદ કરો"
  }
};

export default function AppointmentModal({ isOpen, onClose, lang }: AppointmentModalProps) {
  const t = modalTranslations[lang] || modalTranslations.en;
  const services = servicesList[lang] || servicesList.en;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    timeSlot: '',
    service: '',
    notes: ''
  });
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.date || !formData.timeSlot || !formData.service) {
      toast.error(lang === 'gu' ? "કૃપા કરીને બધી માહિતી ભરો." : "Please fill in all required fields.");
      return;
    }

    setStatus('submitting');
    try {
      const response = await axios.post('/api/appointments/book', formData);
      if (response.data.success) {
        setStatus('success');
        toast.success(lang === 'gu' ? "એપોઇન્ટમેન્ટ બુકિંગ સફળ!" : "Appointment successfully registered!");
      } else {
        setStatus('idle');
        toast.error(lang === 'gu' ? "બુકિંગ કરવામાં નિષ્ફળતા. કૃપા કરીને ફરી ટ્રાય કરો." : "Failed to book appointment. Please try again.");
      }
    } catch (error: any) {
      setStatus('idle');
      console.error("Booking error:", error);
      toast.error(lang === 'gu' ? "કનેક્શન એરર. કૃપા કરીને ફરીથી પ્રયાસ કરો." : "Network connection error. Please try again.");
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      date: '',
      timeSlot: '',
      service: '',
      notes: ''
    });
    setStatus('idle');
    onClose();
  };

  // Get current date string in YYYY-MM-DD for min date calculation
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-850 p-6 md:p-8 relative"
        >
          {/* Close button */}
          <button
            onClick={handleReset}
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-20 cursor-pointer"
          >
            <X size={20} />
          </button>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 flex flex-col items-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center shadow-inner animate-bounce">
                <CheckCircle2 size={44} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t.successTitle}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-3 max-w-sm mx-auto leading-relaxed">
                  {t.successSub}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                {t.close}
              </button>
            </motion.div>
          ) : (
            <div className="flex flex-col">
              <div className="mb-6 pb-4 border-b border-slate-150/40 dark:border-slate-800/65">
                <h3 className="font-black text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span className="w-2.5 h-6 rounded-full bg-blue-600 block"></span>
                  {t.title}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">{t.subtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <User size={12} className="text-blue-600 shrink-0" />
                      {t.fullName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t.namePlaceholder}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-slate-800 dark:text-white transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Phone size={12} className="text-blue-600 shrink-0" />
                      {t.phone} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder={t.phonePlaceholder}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-slate-800 dark:text-white transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Mail size={12} className="text-blue-600 shrink-0" />
                      {t.email} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={t.emailPlaceholder}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-slate-800 dark:text-white transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Date field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={12} className="text-blue-600 shrink-0" />
                      {t.prefDate} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-slate-800 dark:text-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Time slot selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Clock size={12} className="text-blue-600 shrink-0" />
                      {t.prefTime} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-slate-800 dark:text-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="text-slate-400 dark:bg-slate-900">{t.selectSlot}</option>
                        {t.slots.map((slot, index) => (
                          <option key={index} value={slot} className="text-slate-800 dark:bg-slate-900">{slot}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Required service */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Briefcase size={12} className="text-blue-600 shrink-0" />
                      {t.service} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-slate-800 dark:text-white transition-all appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="text-slate-400 dark:bg-slate-900">{t.selectService}</option>
                        {services.map((srv, index) => (
                          <option key={index} value={srv} className="text-slate-800 dark:bg-slate-900">{srv}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <FileText size={12} className="text-blue-600 shrink-0" />
                    {t.notes}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t.namePlaceholder}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 focus:border-blue-500 px-4 py-3 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold text-xs text-slate-800 dark:text-white transition-all placeholder:text-slate-400 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-150/40 dark:border-slate-800/65 mt-6">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={status === 'submitting'}
                    className="px-5 py-3 border border-slate-250 dark:border-slate-755 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 min-w-[150px] flex items-center justify-center gap-1 cursor-pointer shadow-md"
                  >
                    {status === 'submitting' && (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></span>
                    )}
                    {status === 'submitting' ? t.booking : t.confirm}
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
