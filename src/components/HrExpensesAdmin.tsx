import React, { useState, useEffect } from "react";
import { 
  Users, 
  DollarSign, 
  PlusCircle, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Filter, 
  Search, 
  TrendingDown, 
  ArrowDownCircle, 
  Award, 
  Clock, 
  ShieldAlert, 
  Briefcase, 
  ToggleLeft, 
  ToggleRight, 
  Plus 
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface HrExpensesAdminProps {
  user: any;
  lang: string;
}

export default function HrExpensesAdmin({ user, lang = "en" }: HrExpensesAdminProps) {
  // State for Staff List
  const [staffList, setStaffList] = useState<any[]>(() => {
    const saved = localStorage.getItem("admin_staff_list");
    if (saved) return JSON.parse(saved);
    return [
      { id: "STF-001", name: "Ankit Panchal", email: "ankit.staff@aos.com", role: "Staff", status: "Active", salaryRate: 28000, department: "PAN Operations", joinDate: "2025-01-10" },
      { id: "STF-002", name: "Pooja Trivedi", email: "pooja.staff@aos.com", role: "Staff", status: "Active", salaryRate: 28000, department: "Government Schemes", joinDate: "2025-04-15" },
      { id: "STF-003", name: "Keyur Patel", email: "keyur.admin@aos.com", role: "Admin", status: "Active", salaryRate: 45000, department: "Management", joinDate: "2024-06-01" },
      { id: "STF-004", name: "Vijay Shah", email: "vijay.dev@aos.com", role: "Developer", status: "Active", salaryRate: 55000, department: "IT Systems", joinDate: "2024-11-20" }
    ];
  });

  // State for Expenses Ledger
  const [expenses, setExpenses] = useState<any[]>(() => {
    const saved = localStorage.getItem("admin_expenses_ledger");
    if (saved) return JSON.parse(saved);
    return [
      { id: "TXN-901", title: "Ankit Panchal May Salary", type: "Salary", staffId: "STF-001", amount: 28000, date: "2026-06-01", status: "Paid", notes: "Monthly bank dispatch complete." },
      { id: "TXN-902", title: "Office Rent Surat Branch", type: "Rent", staffId: "None", amount: 15000, date: "2026-06-05", status: "Paid", notes: "Sent directly to landlord." },
      { id: "TXN-903", title: "Pooja Trivedi May Salary", type: "Salary", staffId: "STF-002", amount: 28000, date: "2026-06-01", status: "Paid", notes: "Monthly bank dispatch complete." },
      { id: "TXN-904", title: "High-speed Office Broadband", type: "Utilities", staffId: "None", amount: 1850, date: "2026-06-10", status: "Paid", notes: "Internet fiber primary link." },
      { id: "TXN-905", title: "Broadband Reimbursement (Ankit)", type: "Utilities", staffId: "STF-001", amount: 799, date: "2026-06-18", status: "Paid", notes: "Approved home office claim." },
      { id: "TXN-906", title: "Stapler and Document Folders", type: "Stationery", staffId: "None", amount: 2400, date: "2026-06-22", status: "Pending", notes: "Bulk order for registry cupboard." }
    ];
  });

  // State filtering & search
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState("All");

  // Modals state
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddTxnModal, setShowAddTxnModal] = useState(false);

  // Add Staff form state
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "Staff",
    salaryRate: "",
    department: "PAN Operations",
  });

  // Add Transaction form state
  const [newTxn, setNewTxn] = useState({
    title: "",
    type: "Salary",
    staffId: "None",
    amount: "",
    status: "Paid",
    notes: "",
  });

  // Sync state with localstorage
  useEffect(() => {
    localStorage.setItem("admin_staff_list", JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem("admin_expenses_ledger", JSON.stringify(expenses));
  }, [expenses]);

  // Actions
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim() || !newStaff.salaryRate.trim()) {
      toast.error("Please fill in all mandatory fields.");
      return;
    }
    const sal = parseFloat(newStaff.salaryRate);
    if (isNaN(sal) || sal <= 0) {
      toast.error("Please enter a valid salary amount.");
      return;
    }

    const emailLower = newStaff.email.trim().toLowerCase();
    // Validate if staff email already exists
    if (staffList.some(s => s.email.toLowerCase() === emailLower)) {
      toast.error("Staff member with this email is already registered.");
      return;
    }

    const staffRecord = {
      id: `STF-0${staffList.length + 10}`,
      name: newStaff.name.trim(),
      email: emailLower,
      role: newStaff.role,
      status: "Active",
      salaryRate: sal,
      department: newStaff.department,
      joinDate: new Date().toISOString().split('T')[0]
    };

    setStaffList([...staffList, staffRecord]);
    toast.success(`${newStaff.name} successfully registered as ${newStaff.role}!`);
    setNewStaff({ name: "", email: "", role: "Staff", salaryRate: "", department: "PAN Operations" });
    setShowAddStaffModal(false);
  };

  const handleAddTxnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTxn.title.trim() || !newTxn.amount.trim()) {
      toast.error("Please fill in transaction title and amount.");
      return;
    }
    const amt = parseFloat(newTxn.amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid transaction amount.");
      return;
    }

    const txnRecord = {
      id: `TXN-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: newTxn.title.trim(),
      type: newTxn.type,
      staffId: newTxn.staffId,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      status: newTxn.status,
      notes: newTxn.notes.trim()
    };

    setExpenses([txnRecord, ...expenses]);
    toast.success("Ledger entry added successfully.");
    setNewTxn({ title: "", type: "Salary", staffId: "None", amount: "", status: "Paid", notes: "" });
    setShowAddTxnModal(false);
  };

  const handleToggleStaffStatus = (id: string) => {
    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === "Active" ? "Suspended" : "Active";
        toast.info(`Staff ${s.name} is now ${nextStatus}`);
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const handleDeleteStaff = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove staff member ${name}? This action is irreversible.`)) {
      setStaffList(prev => prev.filter(s => s.id !== id));
      toast.success(`${name} has been removed from staff records.`);
    }
  };

  const handlePaySalary = (staff: any) => {
    // Generate a quick transaction record to pay salary
    const txnRecord = {
      id: `TXN-${Math.floor(Math.random() * 9000 + 1000)}`,
      title: `${staff.name} Salary - ${new Date().toLocaleString('default', { month: 'long' })} 2026`,
      type: "Salary",
      staffId: staff.id,
      amount: staff.salaryRate,
      date: new Date().toISOString().split('T')[0],
      status: "Paid",
      notes: `Direct administrative salary release.`
    };

    setExpenses([txnRecord, ...expenses]);
    toast.success(`Disbursed ₹${staff.salaryRate.toLocaleString()} salary to ${staff.name}!`);
  };

  // Calculations
  const totalSalariesPaid = expenses.filter(e => e.type === "Salary" && e.status === "Paid").reduce((a, b) => a + b.amount, 0);
  const totalOperationalCosts = expenses.filter(e => e.type !== "Salary" && e.status === "Paid").reduce((a, b) => a + b.amount, 0);
  const totalPendingBills = expenses.filter(e => e.status === "Pending").reduce((a, b) => a + b.amount, 0);
  const totalExpenditures = expenses.filter(e => e.status === "Paid").reduce((a, b) => a + b.amount, 0);

  // Filtered views
  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(staffSearchQuery.toLowerCase())
  );

  const filteredLedger = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) ||
                          e.notes.toLowerCase().includes(ledgerSearchQuery.toLowerCase()) ||
                          e.id.toLowerCase().includes(ledgerSearchQuery.toLowerCase());
    const matchesType = ledgerTypeFilter === "All" || e.type === ledgerTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 font-sans text-left">
      {/* Metrics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex justify-between items-center shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Payroll Released</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">₹{totalSalariesPaid.toLocaleString()}</h3>
            <span className="text-[9px] font-bold text-emerald-500 block">All staff runs processed</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex justify-between items-center shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Utilities & Operations</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">₹{totalOperationalCosts.toLocaleString()}</h3>
            <span className="text-[9px] font-bold text-slate-450 block">Rent, server, internet Bills</span>
          </div>
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <TrendingDown size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl flex justify-between items-center shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Unpaid Claims & Bills</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-white">₹{totalPendingBills.toLocaleString()}</h3>
            <span className="text-[9px] font-bold text-rose-500 block animate-pulse">{expenses.filter(e => e.status === "Pending").length} Pending approval</span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-slate-950 p-6 rounded-3xl flex justify-between items-center text-white shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Gross Expenditure Ledger</span>
            <h3 className="text-xl font-black text-emerald-400">₹{totalExpenditures.toLocaleString()}</h3>
            <span className="text-[9px] font-bold text-slate-400 block">Total operating debit flow</span>
          </div>
          <div className="p-3 bg-white/10 text-white rounded-2xl">
            <ArrowDownCircle size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Staff List (5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Staff List & Access Control</h2>
              <p className="text-[11px] text-slate-400">Authorize operations access and manage base salary pay scale.</p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <Plus size={10} /> Add Staff
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search staff by name, email, department..."
              value={staffSearchQuery}
              onChange={e => setStaffSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredStaff.map((stf) => (
              <div key={stf.id} className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${stf.status === "Active" ? "bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-850" : "bg-rose-50/10 border-rose-100 dark:border-rose-950/20"}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                      {stf.name}
                      <span className="text-[8px] font-black uppercase bg-slate-200 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                        {stf.role}
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-450 mt-0.5">{stf.email}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Dept: <span className="font-bold">{stf.department}</span></p>
                  </div>

                  <div className="text-right">
                    <span className="text-[8px] text-slate-400 font-bold block">BASE SALARY RATE</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white">₹{stf.salaryRate.toLocaleString()} / Mo</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-850/50 text-[10px]">
                  <button
                    onClick={() => handleToggleStaffStatus(stf.id)}
                    className={`flex items-center gap-1.5 font-black uppercase tracking-wider cursor-pointer ${stf.status === "Active" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}
                  >
                    {stf.status === "Active" ? (
                      <><ToggleRight size={16} /> Status: Active</>
                    ) : (
                      <><ToggleLeft size={16} /> Status: Suspended</>
                    )}
                  </button>

                  <div className="flex gap-2">
                    {stf.status === "Active" && (
                      <button
                        onClick={() => handlePaySalary(stf)}
                        className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white px-2 py-1 rounded font-black uppercase text-[8px] transition-colors cursor-pointer"
                        title="Release this month salary"
                      >
                        Pay Salary
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteStaff(stf.id, stf.name)}
                      className="text-slate-350 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                      title="Remove Staff Access"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Ledger / Expenses (7 Columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Ledger & Operational Expenditures</h2>
              <p className="text-[11px] text-slate-400">Track and log office rents, utility disbursements, and individual staff reimbursements.</p>
            </div>
            <button
              onClick={() => setShowAddTxnModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-black uppercase tracking-widest p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            >
              <PlusCircle size={12} /> Add Expense Entry
            </button>
          </div>

          {/* Filtering row */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search ledger by transaction ID, item details..."
                value={ledgerSearchQuery}
                onChange={e => setLedgerSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <select
              value={ledgerTypeFilter}
              onChange={e => setLedgerTypeFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Salary">Salaries</option>
              <option value="Rent">Office Rents</option>
              <option value="Utilities">Utilities & Tech</option>
              <option value="Stationery">Stationery</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-3 px-2">Transaction ID</th>
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Item details</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2 text-right">Debit amount</th>
                  <th className="py-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredLedger.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all">
                    <td className="py-3.5 px-2 font-mono font-bold text-slate-800 dark:text-white">{txn.id}</td>
                    <td className="py-3.5 px-2 text-slate-400 font-medium">{txn.date}</td>
                    <td className="py-3.5 px-2 font-bold text-slate-700 dark:text-slate-300">
                      <div>{txn.title}</div>
                      {txn.notes && <div className="text-[9.5px] text-slate-450 italic mt-0.5 font-medium">{txn.notes}</div>}
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[8px] font-black uppercase text-slate-500">
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-black text-right text-slate-800 dark:text-white">₹{txn.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-2 text-center">
                      <button
                        onClick={() => {
                          if (txn.status === "Pending") {
                            // Let admin approve the pending staff reimbursement claim
                            setExpenses(prev => prev.map(e => e.id === txn.id ? { ...e, status: "Paid" } : e));
                            toast.success(`Expense reimbursement ${txn.id} approved and marked Paid!`);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all ${
                          txn.status === "Paid" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-amber-100 text-amber-800 hover:bg-emerald-500 hover:text-white cursor-pointer"
                        }`}
                        title={txn.status === "Pending" ? "Click to Approve claim" : "Paid transaction"}
                      >
                        {txn.status === "Pending" ? "Approve Claim" : txn.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-left">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-8 shadow-2xl space-y-6"
          >
            <div>
              <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest block">REGISTER SERVICE REPRESENTATIVE</span>
              <h3 className="text-lg font-black text-slate-800 dark:text-white mt-1">Add Staff Access</h3>
              <p className="text-slate-450 text-xs mt-1">Register new employee to access assigned processing and OCR verification workspace.</p>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                  placeholder="E.g., Ankit Panchal"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Official Email ID</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                  placeholder="ankit.staff@aos.com"
                />
                <span className="text-[9px] text-slate-400 mt-1 block italic">Note: Staff emails should contain 'staff' to auto-route during verification.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Enterprise Role</label>
                  <select
                    value={newStaff.role}
                    onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                  >
                    <option value="Staff">Staff Operator</option>
                    <option value="Admin">Co-Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Base Monthly Salary (INR)</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={newStaff.salaryRate}
                    onChange={e => setNewStaff({ ...newStaff, salaryRate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                    placeholder="28000"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Assigned Department</label>
                <select
                  value={newStaff.department}
                  onChange={e => setNewStaff({ ...newStaff, department: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                >
                  <option value="PAN Operations">PAN Card & Aadhaar</option>
                  <option value="Government Schemes">Mamlatdar Certifications</option>
                  <option value="Translation Hub">Language Translation</option>
                  <option value="Billing Admin">Accounts & Billing</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest py-3.5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest py-3.5 transition-all cursor-pointer shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  Confirm Staff
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTxnModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-4 text-left">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-8 shadow-2xl space-y-6"
          >
            <div>
              <span className="text-[9px] font-bold text-slate-400 font-mono tracking-widest block">OFFICIAL EXPENDITURE RECORD</span>
              <h3 className="text-lg font-black text-slate-800 dark:text-white mt-1">Add Ledger Entry</h3>
              <p className="text-slate-450 text-xs mt-1">Log office rent payments, utility bills, computer setups, software licenses, or custom payouts.</p>
            </div>

            <form onSubmit={handleAddTxnSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Transaction Title</label>
                <input
                  type="text"
                  required
                  value={newTxn.title}
                  onChange={e => setNewTxn({ ...newTxn, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                  placeholder="E.g., Surat Branch Office Rent June"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Expense Category</label>
                  <select
                    value={newTxn.type}
                    onChange={e => setNewTxn({ ...newTxn, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                  >
                    <option value="Salary">Salary Payroll Run</option>
                    <option value="Rent">Office Rents</option>
                    <option value="Utilities">Utilities & broadband</option>
                    <option value="Stationery">Stationery & papers</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Debit Amount (INR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTxn.amount}
                    onChange={e => setNewTxn({ ...newTxn, amount: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                    placeholder="15000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Associated Staff Member</label>
                  <select
                    value={newTxn.staffId}
                    onChange={e => setNewTxn({ ...newTxn, staffId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                  >
                    <option value="None">No Specific Staff (Company Expense)</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Initial Status</label>
                  <select
                    value={newTxn.status}
                    onChange={e => setNewTxn({ ...newTxn, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                  >
                    <option value="Paid">Disbursed (Paid)</option>
                    <option value="Pending">Pending Audit (Unpaid)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Remarks / Ledger Notes</label>
                <textarea
                  value={newTxn.notes}
                  onChange={e => setNewTxn({ ...newTxn, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 shadow-inner resize-none leading-relaxed"
                  placeholder="Describe recipient, bill numbers, or bank transaction reference codes."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTxnModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest py-3.5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest py-3.5 transition-all cursor-pointer shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
