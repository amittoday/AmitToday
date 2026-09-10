import React, { useState, useEffect } from "react";
import { Globe, Clock, ChevronRight, BookOpen, Check, RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { toast } from "sonner";
import { parseSeedData } from "../seedData";
import ServiceDetailView from "./ServiceDetailView";
import DynamicGovForm from "./DynamicGovForm";

interface GovernmentServicesCenterProps {
  onFinish: (data: any) => void;
  lang: string;
  geoInfo: any;
  user: any;
  setView?: (view: string) => void;
  ocrTemplateData?: any;
}

export const getServiceStatus = (svc: any): "Active" | "Maintenance" | "Closed" => {
  if (svc.Status) {
    const s = String(svc.Status).toLowerCase();
    if (s.includes("maintenance")) return "Maintenance";
    if (s.includes("closed") || s.includes("inactive")) return "Closed";
    return "Active";
  }
  const code = svc.ID ? svc.ID.charCodeAt(svc.ID.length - 1) : 0;
  if (code % 7 === 0) return "Maintenance";
  if (code % 11 === 0) return "Closed";
  return "Active";
};

export const GovernmentServicesCenter: React.FC<GovernmentServicesCenterProps> = ({
  onFinish,
  lang,
  geoInfo,
  user,
  setView,
  ocrTemplateData,
}) => {
  const [viewMode, setViewMode] = useState<"catalog" | "detail" | "form">("catalog");
  const [servicesMaster, setServicesMaster] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("All");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    // Fetch categorized services from Services_Master
    axios
      .get("/api/services-master")
      .then((res) => {
        if (res.data.success && res.data.data && res.data.data.length > 0) {
          setServicesMaster(res.data.data);
        } else {
          // Fallback to seed data
          try {
            setServicesMaster(parseSeedData());
          } catch {
            setServicesMaster([]);
          }
        }
      })
      .catch((e) => {
        console.warn("Faced issue loading master services, trying seed fallback:", e);
        try {
          setServicesMaster(parseSeedData());
        } catch {
          setServicesMaster([]);
        }
      });
  }, []);

  // Central Funnel Pipeline auto-selector supporting deep linking parameters
  useEffect(() => {
    if (servicesMaster.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const deepLinkId = params.get("applyForId");
      const autoId = deepLinkId || localStorage.getItem("autoSelectServiceId");
      if (autoId) {
        const found = servicesMaster.find((s) => s.ID === autoId);
        if (found) {
          setSelectedService(found);
          setViewMode("form");
          toast.success(`અરજી ફોર્મ શરૂ થઈ ગયું છે: ${found.ServiceName}`);
        }
        localStorage.removeItem("autoSelectServiceId");
      }
    }
  }, [servicesMaster]);

  const categories = ["All", ...Array.from(
    new Set(servicesMaster.map((s) => s.Category))
  ).filter(t => t && t !== "All")];

  const subCategories = ["All", ...Array.from(
    new Set(
      servicesMaster
        .filter((s) => selectedCategory === "All" || s.Category === selectedCategory)
        .map((s) => s.SubCategory)
    )
  ).filter(t => t && t !== "All")];

  useEffect(() => {
    setSelectedSubCategory("All");
  }, [selectedCategory]);

  const filteredServices = servicesMaster.filter((s) => {
    const matchesCategory = selectedCategory === "All" || s.Category === selectedCategory;
    const matchesSubCategory = selectedSubCategory === "All" || s.SubCategory === selectedSubCategory;
    
    return matchesCategory && matchesSubCategory;
  });

  const currency = "INR";
  const rateMultiplier = 1;

  // Formatting Pricing helper
  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto" id="government-services-funnel-root">
      
      <AnimatePresence mode="wait">
        {viewMode === "catalog" && (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-6 sm:p-10 border border-slate-100 dark:border-slate-800"
          >
             {/* Title Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-105 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-full flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Government & Online Services
                  </h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Apply dynamically for schemes, permits & certificates
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {user?.role === "admin" && (
                  <button
                    onClick={async () => {
                      const toastId = toast.loading("Forcing Google Sheets master catalog sync...");
                      try {
                        // Clear server-side cache
                        await axios.post(
                          "/api/admin/refresh-services",
                          {},
                          { headers: { Authorization: `Bearer ${user?.token}` } }
                        );
                        // Fetch fresh list and cache it
                        const res = await axios.post(
                          "/api/services/sync",
                          {},
                          { headers: { Authorization: `Bearer ${user?.token}` } }
                        );
                        if (res.data && res.data.success && Array.isArray(res.data.data)) {
                          setServicesMaster(res.data.data);
                          toast.success(`Successfully synchronized ${res.data.data.length} services from Services_Master Google Sheet!`, { id: toastId });
                        } else {
                          toast.error("Failed to sync from Google Sheet: invalid format", { id: toastId });
                        }
                      } catch (err: any) {
                        toast.error(`Sync failed: ${err.message || 'unknown error'}`, { id: toastId });
                      }
                    }}
                    className="flex items-center gap-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest uppercase py-2.5 px-4 rounded-xl border border-emerald-500 shadow-md cursor-pointer active:scale-95 transition"
                  >
                    <RefreshCw size={12} className="animate-spin-slow" />
                    Force Sync Sheet
                  </button>
                )}
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-extrabold tracking-widest uppercase py-2 px-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40">
                  Live Synced Catalogs
                </span>
              </div>
            </div>

            {/* Category Pills Filter */}
            <div className="space-y-4 text-left">
              {/* Category Select Dropdown */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                <div className="w-full md:w-auto flex flex-col sm:flex-row sm:items-center gap-3">
                  <label htmlFor="category-select" className="text-xs font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Filter by Domain Name:
                  </label>
                  <select
                    id="category-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-extrabold text-xs cursor-pointer min-w-[200px] transition"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "All" ? "All Domains & Sectors" : cat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 select-none items-center">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">Quick Select:</span>
                  {categories.slice(0, 5).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                        selectedCategory === cat
                          ? "bg-blue-650 text-white border-blue-600 shadow-md shadow-blue-500/10"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-750 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  {categories.length > 5 && (
                    <span className="text-[10px] font-semibold text-slate-400">+{categories.length - 5} more</span>
                  )}
                </div>
              </div>

              {/* Sub-Category Filters */}
              {subCategories.length > 2 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 select-none justify-start border-t border-slate-50 dark:border-slate-800/40 pt-2.5 animate-fadeIn">
                  <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 self-center mr-1">
                    Sub-Category:
                  </span>
                  {subCategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubCategory(sub)}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                        selectedSubCategory === sub
                          ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 border-slate-800 dark:border-slate-200 shadow-sm"
                          : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 border-slate-200 dark:border-slate-800/50 hover:bg-slate-50"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {servicesMaster.length === 0 ? (
              <div className="text-center p-12 bg-slate-50/50 dark:bg-slate-850 rounded-3xl border border-slate-150 dark:border-slate-800">
                <Globe size={48} className="mx-auto text-slate-300 mb-4 animate-pulse" />
                <p className="text-slate-550 font-black mb-4 text-sm">
                  No government services synced yet.
                </p>
                {user?.role === "admin" && (
                  <button
                    onClick={async () => {
                      const toastId = toast.loading("Syncing master database catalog...");
                      try {
                        const seed = parseSeedData();
                        await axios.post(
                          "/api/admin/services-master/sync",
                          { services: seed },
                          { headers: { Authorization: `Bearer ${user.token}` } }
                        );
                        toast.success("Synced default list!", { id: toastId });
                        setServicesMaster(seed);
                      } catch {
                        toast.error("Catalog sync failed", { id: toastId });
                      }
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider active:scale-95 shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    Seed Master List
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin text-left">
                {filteredServices.map((svc, idx) => {
                  const govt = Number(svc.GovFee !== undefined ? svc.GovFee : (svc.GovtFee || 0));
                  const agency = Number(svc.ServiceCharge || svc.BasePrice || 150);
                  const courier = Number(svc.OtherCharges !== undefined ? svc.OtherCharges : (svc.CourierCharge || 0));
                  const total = govt + agency + courier;

                  return (
                    <div
                      key={`${svc.ID}-${idx}`}
                      onClick={() => {
                        setSelectedService(svc);
                        setIsDetailModalOpen(true);
                      }}
                      className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-550 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[9px] font-black uppercase text-blue-650 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-md">
                              {svc.Category}
                            </span>
                            {/* Visual Status Indicator */}
                            {(() => {
                              const s = getServiceStatus(svc);
                              const statusStyles = {
                                Active: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100/50",
                                Maintenance: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100/50",
                                Closed: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100/50"
                              };
                              return (
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${statusStyles[s]}`}>
                                  ● {s}
                                </span>
                              );
                            })()}
                          </div>
                          {svc.TurnaroundTime && (
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 flex items-center">
                              <Clock size={10} className="mr-1 inline" /> {svc.TurnaroundTime}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-slate-850 dark:text-slate-100 text-xs sm:text-sm hover:text-blue-500 transition-colors line-clamp-2 leading-snug">
                          {svc.ServiceName}
                        </h4>
                        {svc.SubCategory && (
                          <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1.5 font-bold">
                            {svc.SubCategory}
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[10px] block text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wide text-left">Total Fee</span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                              {formatPrice(total)}
                            </span>
                          </div>
                          {svc.TurnaroundTime && (
                            <span className="text-[10.5px] font-black text-slate-400 dark:text-slate-500 flex items-center">
                              <Clock size={11} className="mr-1 inline" /> {svc.TurnaroundTime}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedService(svc);
                              setIsDetailModalOpen(true);
                            }}
                            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-wider text-center cursor-pointer active:scale-95 transition-all block border border-transparent"
                            id={`view-details-btn-${svc.ID}`}
                          >
                            વિગતો જુઓ (Details)
                          </button>

                          {(() => {
                            const s = getServiceStatus(svc);
                            if (s === "Closed") {
                              return (
                                <div className="w-full py-2 bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400 rounded-xl text-[11px] font-black uppercase tracking-wider text-center flex items-center justify-center">
                                  Closed (બંધ છે)
                                </div>
                              );
                            }
                            if (s === "Maintenance") {
                              return (
                                <div className="w-full py-2 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 rounded-xl text-[11px] font-black uppercase tracking-wider text-center flex items-center justify-center text-amber-700">
                                  Maintenance
                                </div>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedService(svc);
                                  setViewMode("form");
                                }}
                                className="w-full py-2 bg-blue-650 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider text-center cursor-pointer active:scale-95 transition-all block shadow-sm"
                                id={`apply-now-btn-${svc.ID}`}
                              >
                                અરજી કરો (Apply)
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Backwards compatible fallback page detail mode */}
        {viewMode === "detail" && selectedService && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <ServiceDetailView
              service={selectedService}
              lang={lang === "gu" ? "gu" : "en"}
              onBack={() => {
                setSelectedService(null);
                setViewMode("catalog");
              }}
              onApply={() => setViewMode("form")}
            />
          </motion.div>
        )}

        {viewMode === "form" && selectedService && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <DynamicGovForm
              selectedService={selectedService}
              user={user}
              lang={lang === "gu" ? "gu" : "en"}
              onBack={() => setViewMode("catalog")}
              onFinish={(result) => {
                onFinish(result);
              }}
              ocrTemplateData={ocrTemplateData}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal Overlay for Applicant Transparency */}
      <AnimatePresence>
        {isDetailModalOpen && selectedService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800"
            >
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedService(null);
                }}
                className="absolute top-6 right-6 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer transition z-10"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
              
              <div className="pt-2">
                <ServiceDetailView
                  service={selectedService}
                  lang={lang === "gu" ? "gu" : "en"}
                  onBack={() => {
                    setIsDetailModalOpen(false);
                    setSelectedService(null);
                  }}
                  onApply={() => {
                    setIsDetailModalOpen(false);
                    setViewMode("form");
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
