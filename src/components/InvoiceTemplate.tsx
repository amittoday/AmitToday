import React from 'react';
import { Download, Printer, Share2 } from 'lucide-react';

interface BillingDetails {
  originalAmount?: number;
  discountApplied?: string;
  discountValue?: number;
  finalAmount?: number;
}

interface InvoiceProps {
  orderId: string;
  date: string;
  customerName: string;
  serviceType: string;
  govtFee: number;
  serviceCharge: number;
  total: number;
  billingDetails?: BillingDetails;
  originalAmount?: number;
  discountApplied?: string;
  discountValue?: number;
  finalAmount?: number;
}

export const InvoiceTemplate: React.FC<InvoiceProps> = ({
  orderId,
  date,
  customerName,
  serviceType,
  govtFee,
  serviceCharge,
  total,
  billingDetails,
  originalAmount: propOriginalAmount,
  discountApplied: propDiscountApplied,
  discountValue: propDiscountValue,
  finalAmount: propFinalAmount
}) => {
  const origAmount = billingDetails?.originalAmount ?? propOriginalAmount ?? (govtFee + serviceCharge);
  const discValue = billingDetails?.discountValue ?? propDiscountValue ?? 0;
  const discApplied = billingDetails?.discountApplied ?? propDiscountApplied ?? (discValue > 0 ? "Discount Applied" : "None");
  const paidTotal = billingDetails?.finalAmount ?? propFinalAmount ?? total;
  const hasDiscount = discValue > 0 || (discApplied !== "None" && discApplied !== "");

  return (
    <div className="space-y-4">
      {/* Non-printable action toolbar */}
      <div className="no-print flex justify-end gap-2 pb-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
        >
          <Printer size={14} /> Print Official Invoice (A4 Layout)
        </button>
      </div>

      <div className="bg-white p-8 max-w-2xl mx-auto border border-slate-200 rounded-3xl shadow-sm font-sans printable-invoice-active" id="printable-invoice-container">
        <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">AMIT ONLINE SERVICES</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Facilitation Center • Gujarat, India</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice / Bill</p>
            <p className="text-lg font-black text-slate-900">#{orderId}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
            <p className="text-sm font-bold text-slate-900">{customerName}</p>
            <p className="text-xs text-slate-500 mt-1">Date: {date}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Service</p>
            <p className="text-sm font-bold text-slate-900">{serviceType}</p>
          </div>
        </div>

        {hasDiscount && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-black text-emerald-800 uppercase tracking-wide">
                Special Benefit Applied: <span className="font-extrabold underline">{discApplied}</span>
              </p>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              -₹{discValue.toFixed(2)} Savings
            </span>
          </div>
        )}

        <table className="w-full mb-10">
          <thead>
            <tr className="border-b border-slate-100 pb-4">
              <th className="text-left text-[10px] font-black text-slate-400 uppercase py-4">Description</th>
              <th className="text-right text-[10px] font-black text-slate-400 uppercase py-4">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr>
              <td className="py-4 text-sm font-medium text-slate-600">Government Fee (સરકારી ફી - જો લાગુ પડતી હોય તો)</td>
              <td className="py-4 text-right text-sm font-bold text-slate-900">₹{govtFee}</td>
            </tr>
            <tr>
              <td className="py-4 text-sm font-medium text-slate-600">Professional Service Charge (પ્રોફેશનલ ચાર્જ - સ્કેનિંગ, ડેટા એન્ટ્રી)</td>
              <td className="py-4 text-right text-sm font-bold text-slate-900">₹{serviceCharge}</td>
            </tr>
            {hasDiscount && (
              <>
                <tr className="bg-slate-50/70 font-semibold">
                  <td className="py-3 text-xs font-bold text-slate-700 uppercase tracking-wider">Subtotal (મૂળ રકમ)</td>
                  <td className="py-3 text-right text-sm font-bold text-slate-800">₹{origAmount}</td>
                </tr>
                <tr className="bg-emerald-50/50 text-emerald-700">
                  <td className="py-3 text-sm font-bold">
                    Special Discount ({discApplied})
                  </td>
                  <td className="py-3 text-right text-sm font-black text-emerald-600">-₹{discValue}</td>
                </tr>
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td className="py-6 text-sm font-black text-slate-900 uppercase tracking-widest">Total Paid (ચૂકવેલ કુલ રકમ)</td>
              <td className="py-6 text-right text-xl font-black text-blue-600">₹{paidTotal}</td>
            </tr>
          </tfoot>
        </table>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Terms & Notes</p>
          <p className="text-[10px] text-slate-500 leading-relaxed italic">
            * This is a service facilitation receipt. Once processing starts, the service fee is non-refundable. 
            Government approvals are subject to department discretion.
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Thank you for choosing amit.today</p>
        </div>
      </div>
    </div>
  );
};
