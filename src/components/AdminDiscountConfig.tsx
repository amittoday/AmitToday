import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar,
  Percent,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Database,
  Sparkles,
  Calculator,
  ShieldCheck,
  Clock,
  ExternalLink,
  Layers
} from "lucide-react";
import { DiscountRule, evaluateDiscount } from "../utils/discountUtils";
import { AddDiscountRuleModal } from "./AddDiscountRuleModal";

interface AdminDiscountConfigProps {
  user: any;
}

export default function AdminDiscountConfig({ user }: AdminDiscountConfigProps) {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Simulator State
  const [simRole, setSimRole] = useState<string>("Student");
  const [simBaseAmount, setSimBaseAmount] = useState<number>(1000);

  const fetchDiscountRules = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/admin/discount-config", {
        headers: { Authorization: `Bearer ${user?.token || ""}` },
      });
      if (res.data && res.data.success && Array.isArray(res.data.discountRules)) {
        setRules(res.data.discountRules);
        localStorage.setItem("business_discount_rules", JSON.stringify(res.data.discountRules));
      } else {
        // Try fallback to public endpoint
        const pubRes = await axios.get("/api/discounts");
        if (pubRes.data && pubRes.data.success && Array.isArray(pubRes.data.discountRules)) {
          setRules(pubRes.data.discountRules);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch discount rules:", err);
      // Fallback from localStorage
      const cached = localStorage.getItem("business_discount_rules");
      if (cached) {
        try {
          setRules(JSON.parse(cached));
        } catch (e) {}
      } else {
        // Initial defaults
        setRules([
          {
            id: "rule_1",
            Rule_Name: "Student Welcome Offer",
            Target_Account_Type: "Student",
            Discount_Percentage: 10,
            Start_Date: "2026-01-01",
            End_Date: "2026-12-31",
            Is_Active: true,
          },
          {
            id: "rule_2",
            Rule_Name: "Advocate Pro Discount",
            Target_Account_Type: "Advocate",
            Discount_Percentage: 15,
            Start_Date: "2026-01-01",
            End_Date: "2026-12-31",
            Is_Active: true,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountRules();
  }, []);

  const handleSaveToBackend = async (rulesToSave = rules) => {
    setSaving(true);
    try {
      const res = await axios.post(
        "/api/admin/discount-config",
        { discountRules: rulesToSave },
        { headers: { Authorization: `Bearer ${user?.token || ""}` } }
      );
      if (res.data && res.data.success) {
        toast.success("Discount rules saved and synced with Google Sheet successfully!");
        localStorage.setItem("business_discount_rules", JSON.stringify(rulesToSave));
      } else {
        toast.error("Failed to save rules: " + (res.data?.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Save discount rules error:", err);
      toast.error("Error saving rules to Google Sheet: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleRuleAddedFromModal = (newRule: DiscountRule) => {
    const updated = [...rules, newRule];
    setRules(updated);
    localStorage.setItem("business_discount_rules", JSON.stringify(updated));
  };

  const handleToggleRuleActive = (index: number) => {
    const updated = [...rules];
    updated[index].Is_Active = !updated[index].Is_Active;
    setRules(updated);
    handleSaveToBackend(updated);
  };

  const handleDeleteRule = (index: number) => {
    if (!confirm(`Are you sure you want to delete rule "${rules[index].Rule_Name}"?`)) return;
    const updated = rules.filter((_, idx) => idx !== index);
    setRules(updated);
    toast.success("Discount rule deleted.");
    handleSaveToBackend(updated);
  };

  const handleUpdateRuleField = (index: number, field: keyof DiscountRule, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  // Evaluate simulation result
  const simResult = evaluateDiscount(rules, simRole, simBaseAmount);

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto pb-12">
      {/* Top Header & Sync Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Tag size={22} />
              </span>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Dynamic Discount Configuration Engine
                </h2>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">
                  Controlled directly via Admin Dashboard &amp; synced with Google Sheet <code className="text-indigo-300 font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded">Business_Config</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fetchDiscountRules()}
              disabled={loading}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-indigo-400" : ""} />
              Refresh from Sheet
            </button>

            <button
              onClick={() => handleSaveToBackend(rules)}
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Syncing with Sheet...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save &amp; Sync to GAS
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync Metadata Badge */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono gap-4">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-emerald-400" />
            <span>Target Sheet: <strong className="text-slate-200">Business_Config</strong> in Spreadsheet</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck size={14} className="text-indigo-400" />
            <span>Role-Based Real-Time Pricing Active</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Rules Management + Live Pricing Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Discount Rules Table & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={18} className="text-indigo-600 dark:text-indigo-400" />
              Configured Discount Rules ({rules.length})
            </h3>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              Add Discount Rule
            </button>
          </div>

          {/* Existing Rules List Table / Cards */}
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                <AlertCircle size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-bold">No discount rules configured yet.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs font-black text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
                >
                  Click here to create the first rule
                </button>
              </div>
            ) : (
              rules.map((rule, index) => {
                const today = new Date().toISOString().slice(0, 10);
                const isExpired = rule.End_Date && today > rule.End_Date;
                const isUpcoming = rule.Start_Date && today < rule.Start_Date;
                const isCurrentlyActive = rule.Is_Active && !isExpired && !isUpcoming;

                return (
                  <div
                    key={rule.id || index}
                    className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 transition-all shadow-sm hover:shadow-md ${
                      isCurrentlyActive
                        ? "border-emerald-500/40 dark:border-emerald-500/30"
                        : "border-slate-200 dark:border-slate-800 opacity-85"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={rule.Rule_Name}
                            onChange={(e) => handleUpdateRuleField(index, "Rule_Name", e.target.value)}
                            onBlur={() => handleSaveToBackend(rules)}
                            className="text-base font-black text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none px-1"
                          />

                          {isCurrentlyActive && (
                            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] rounded-full border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle size={10} /> Live
                            </span>
                          )}
                          {isExpired && (
                            <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] rounded-full border border-rose-500/30">
                              Expired
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] rounded-full border border-amber-500/30">
                              Scheduled
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <span>Target:</span>
                          <select
                            value={rule.Target_Account_Type}
                            onChange={(e) => {
                              handleUpdateRuleField(index, "Target_Account_Type", e.target.value);
                              handleSaveToBackend(rules);
                            }}
                            className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-2 py-1 rounded-lg text-xs outline-none cursor-pointer"
                          >
                            <option value="Student">Student (વિદ્યાર્થી)</option>
                            <option value="Advocate">Advocate (વકીલ)</option>
                            <option value="General">General (સામાન્ય નાગરિક)</option>
                            <option value="Senior Citizen">Senior Citizen (વરિષ્ઠ)</option>
                            <option value="All">All Users (તમામ)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleRuleActive(index)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            rule.Is_Active
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {rule.Is_Active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {rule.Is_Active ? "Enabled" : "Disabled"}
                        </button>

                        <button
                          onClick={() => handleDeleteRule(index)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Percent size={14} className="text-indigo-500 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
                            Discount
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={rule.Discount_Percentage}
                              onChange={(e) => handleUpdateRuleField(index, "Discount_Percentage", Number(e.target.value))}
                              onBlur={() => handleSaveToBackend(rules)}
                              className="w-12 font-black font-mono text-indigo-600 dark:text-indigo-400 bg-transparent border-b border-slate-300 focus:border-indigo-500 outline-none text-center"
                            />
                            <span className="font-black text-indigo-600 dark:text-indigo-400">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
                            Start Date
                          </span>
                          <input
                            type="date"
                            value={rule.Start_Date}
                            onChange={(e) => {
                              handleUpdateRuleField(index, "Start_Date", e.target.value);
                              handleSaveToBackend(rules);
                            }}
                            className="font-bold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-mono">
                            End Date
                          </span>
                          <input
                            type="date"
                            value={rule.End_Date}
                            onChange={(e) => {
                              handleUpdateRuleField(index, "End_Date", e.target.value);
                              handleSaveToBackend(rules);
                            }}
                            className="font-bold text-slate-800 dark:text-slate-200 bg-transparent outline-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 1 Column: Live Pricing Simulator & Test Widget */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 sticky top-6">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              <Calculator size={20} className="text-emerald-500" />
              <div>
                <h4 className="text-sm font-black">Live Rule Simulator</h4>
                <p className="text-[10px] text-slate-400 font-semibold">Test how prices update in real-time</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Simulated User Role
                </label>
                <select
                  value={simRole}
                  onChange={(e) => setSimRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="Student">Student (વિદ્યાર્થી)</option>
                  <option value="Advocate">Advocate (વકીલ / સંનદ ધારક)</option>
                  <option value="General">General User (સામાન્ય)</option>
                  <option value="Senior Citizen">Senior Citizen (વરિષ્ઠ નાગરિક)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Simulated Service Base Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="100"
                  value={simBaseAmount}
                  onChange={(e) => setSimBaseAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono text-slate-900 dark:text-white outline-none"
                />
              </div>

              {/* Simulation Output Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3 font-mono">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Base Price:</span>
                  <span className="font-bold">₹{simBaseAmount.toFixed(2)}</span>
                </div>

                {simResult.applicable ? (
                  <>
                    <div className="flex justify-between items-center text-xs text-emerald-400">
                      <span>Discount ({simResult.percentage}%):</span>
                      <span className="font-bold">-₹{simResult.discountAmount.toFixed(2)}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-slate-300 font-sans font-bold">Final Price:</span>
                      <div className="flex items-center gap-2">
                        <s className="text-slate-500 text-xs">₹{simBaseAmount.toFixed(2)}</s>
                        <span className="text-lg font-black text-emerald-400">₹{simResult.finalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black rounded-full font-sans">
                        <Sparkles size={11} className="animate-pulse" />
                        {simResult.discountBadgeText}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-xs text-slate-300 font-sans font-bold">Final Price:</span>
                    <span className="text-lg font-black text-white">₹{simBaseAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Discount Rule Modal */}
      <AddDiscountRuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRuleAdded={handleRuleAddedFromModal}
        existingRules={rules}
        user={user}
      />
    </div>
  );
}
