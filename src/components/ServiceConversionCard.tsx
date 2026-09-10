import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle, ArrowRight, Info, ShieldCheck, Clock } from "lucide-react";
import axios from "axios";

interface Service {
  ID: string;
  ServiceName: string;
  Category: string;
  GovtFee?: number | string;
  ServiceCharge?: number | string;
  BasePrice?: number | string;
  CourierCharge?: number | string;
  TurnaroundTime?: string;
}

interface ServiceConversionCardProps {
  serviceId: string;
}

export default function ServiceConversionCard({ serviceId }: ServiceConversionCardProps) {
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) return;

    setLoading(true);
    axios
      .get("/api/services-master")
      .then((res) => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          const matched = res.data.data.find((s: any) => String(s.ID) === String(serviceId));
          if (matched) {
            setService(matched);
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch service details for conversion widget:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [serviceId]);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl animate-pulse flex flex-col gap-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
      </div>
    );
  }

  if (!service) return null;

  const govtFee = Number(service.GovtFee || 0);
  const serviceCharge = Number(service.ServiceCharge || service.BasePrice || 150);
  const courierCharge = Number(service.CourierCharge || 0);
  const total = govtFee + serviceCharge + courierCharge;

  const handleApplyNow = () => {
    navigate(`/services/gov?applyForId=${service.ID}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-2xl mx-auto my-10 bg-gradient-to-br from-rose-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 border-2 border-rose-100/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-rose-100/10"
      id={`service-widget-${serviceId}`}
    >
      <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="text-left flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-950/40 px-2.5 py-1 rounded-md">
              આ યોજના માટે અરજી કરવા માંગો છો?
            </span>
            <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-100 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">
              Want to apply for this scheme?
            </span>
          </div>

          <div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white leading-tight">
              {service.ServiceName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {service.Category} • {service.TurnaroundTime || "3-5 Days assisted process"}
            </p>
          </div>

          {/* Pricing breakdown */}
          <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 grid grid-cols-3 gap-2 text-center text-[10px] md:text-xs">
            <div>
              <span className="text-slate-400 block font-semibold mb-0.5">સરકારી ફી</span>
              <span className="font-extrabold text-slate-800 dark:text-slate-200">₹{govtFee}</span>
            </div>
            <div className="border-x border-slate-100 dark:border-slate-805">
              <span className="text-slate-400 block font-semibold mb-0.5">સર્વિસ ચાર્જ</span>
              <span className="font-extrabold text-slate-850 dark:text-slate-200">₹{serviceCharge}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold mb-0.5">કુલ સરવાળો</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">₹{total}</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
          <button
            onClick={handleApplyNow}
            className="w-full md:w-auto px-6 py-4.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-rose-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            અરજી કરો (Apply Now)
            <ArrowRight size={14} className="animate-pulse" />
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
            <ShieldCheck size={12} className="text-emerald-500" />
            100% Secure Submission
          </div>
        </div>
      </div>
    </motion.div>
  );
}
