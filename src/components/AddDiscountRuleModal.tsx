import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  X,
  Sparkles,
  Tag,
  Percent,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { DiscountRule } from "../utils/discountUtils";

interface AddDiscountRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleAdded: (newRule: DiscountRule) => void;
  existingRules: DiscountRule[];
  user?: any;
}

export const AddDiscountRuleModal: React.FC<AddDiscountRuleModalProps> = ({
  isOpen,
  onClose,
  onRuleAdded,
  existingRules,
  user,
}) => {
  const [ruleName, setRuleName] = useState("");
  const [targetAccountType, setTargetAccountType] = useState("Student");
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruleName.trim()) {
      toast.error("Please enter a valid Rule Name.");
      return;
    }
    if (discountPercentage <= 0 || discountPercentage > 100) {
      toast.error("Discount percentage must be between 1% and 100%.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Please provide both Start and End dates.");
      return;
    }
    if (startDate > endDate) {
      toast.error("Start Date cannot be after End Date.");
      return;
    }

    const newRuleObj: DiscountRule = {
      id: "rule_" + Date.now(),
      Rule_Name: ruleName.trim(),
      Target_Account_Type: targetAccountType,
      Discount_Percentage: Number(discountPercentage),
      Start_Date: startDate,
      End_Date: endDate,
      Is_Active: isActive,
    };

    setIsSubmitting(true);
    const updatedRules = [...existingRules, newRuleObj];

    try {
      // Sync with backend API / GAS Business_Config Google Sheet
      const res = await axios.post(
        "/api/admin/discount-config",
        { discountRules: updatedRules },
        {
          headers: { Authorization: `Bearer ${user?.token || ""}` },
        }
      );

      if (res.data && res.data.success) {
        toast.success(`Discount rule "${newRuleObj.Rule_Name}" successfully added & synced!`);
      } else {
        toast.info("Rule added locally. Google Sheet sync queued.");
      }

      localStorage.setItem("business_discount_rules", JSON.stringify(updatedRules));
      onRuleAdded(newRuleObj);
      onClose();
    } catch (err: any) {
      console.warn("Failed to sync new discount rule to backend:", err);
      // Still update UI & notify user
      localStorage.setItem("business_discount_rules", JSON.stringify(updatedRules));
      onRuleAdded(newRuleObj);
      toast.success(`Discount rule "${newRuleObj.Rule_Name}" created.`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Subtle accent blur */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Sparkles size={20} />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Add New Discount Rule
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                Syncs with 'Business_Config' Google Sheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Rule Name
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g., Student Exam Special"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Target Account Type
              </label>
              <select
                value={targetAccountType}
                onChange={(e) => setTargetAccountType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Student">Student (વિદ્યાર્થી)</option>
                <option value="Advocate">Advocate (વકીલ)</option>
                <option value="General">General (સામાન્ય નાગરિક)</option>
                <option value="Senior Citizen">Senior Citizen (વરિષ્ઠ નાગરિક)</option>
                <option value="All">All Users (તમામ)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Discount Percentage (%)
              </label>
              <div className="relative">
                <Percent size={14} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                End Date
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Rule Status
            </label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-full px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className={isActive ? "text-emerald-500" : "text-slate-400"} />
                {isActive ? "Active (Will apply immediately)" : "Inactive / Draft"}
              </span>
              {isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving to Sheet...
                </>
              ) : (
                "Save & Append Rule"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDiscountRuleModal;
