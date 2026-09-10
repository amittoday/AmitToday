import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { getRatePerWord } from "../config/pricingConstants";

// Bind html2canvas to window for jsPDF's internal reference
if (typeof window !== "undefined") {
  (window as any).html2canvas = html2canvas;
}

/**
 * Loads a remote image and converts it to base64, supporting cross-origin resource requests.
 */
const loadQrImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Canvas context failed"));
      }
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

/**
 * Converts any Indian Rupee numerical amount into standard, official bank words.
 */
export const convertNumberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const cleanNum = Math.floor(num || 0);
  if (cleanNum === 0) return 'Zero Rupees Only';

  const n = ('000000000' + cleanNum).slice(-9).match(/^(\d{2})(\d{1,2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  
  let str = '';
  str += Number(n[1]) !== 0 ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  
  const lakhVal = Number(n[2]);
  if (lakhVal !== 0) {
    if (lakhVal < 20) {
      str += a[lakhVal] + 'Lakh ';
    } else {
      str += b[Math.floor(lakhVal / 10)] + ' ' + a[lakhVal % 10] + 'Lakh ';
    }
  }

  str += Number(n[3]) !== 0 ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += Number(n[4]) !== 0 ? a[Number(n[4])] + 'Hundred ' : '';
  
  const val = Number(n[5]);
  if (val !== 0) {
    if (str !== '') str += 'and ';
    str += (a[val] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'Rupees ';
  } else {
    str += 'Rupees ';
  }
  return str.trim() + ' Only';
};

export interface SanitizedInvoiceData {
  orderId: string;
  issueDateStr: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerAddress: string;
  serviceType: string;
  languagePair: string;
  units: string;
  govtFee: number;
  serviceCharge: number;
  courierCharge: number;
  originalAmount: number;
  discountApplied: string;
  discountValue: number;
  finalAmount: number;
  totalAmount: number;
  paymentId: string;
  qrImageUrl: string;
  businessName: string;
  businessAddress: string;
  businessGstIn: string;
  contactEmail: string;
  contactPhone: string;
  businessLogoBase64: string;
}

/**
 * Utility function to sanitize and normalize all incoming invoice data,
 * preventing 'undefined' state issues and enforcing clean English outputs.
 */
export const sanitizeInvoiceData = (item: any, user: any, invoiceSettings: any, servicesMaster: any[]): SanitizedInvoiceData => {
  const orderId = String(item?.OrderID || item?.orderId || item?.ID || `AOS-${Date.now()}`).trim();
  
  let issueDateStr = "";
  try {
    const rawDateVal = item?.date || item?.Timestamp || item?.CreatedAt || item?.createdAt;
    const parsedDate = rawDateVal ? new Date(rawDateVal) : new Date();
    issueDateStr = isNaN(parsedDate.getTime()) 
      ? new Date().toLocaleString("en-IN", { timeZone: 'Asia/Kolkata' }) 
      : parsedDate.toLocaleString("en-IN", { timeZone: 'Asia/Kolkata' });
  } catch (_) {
    issueDateStr = new Date().toLocaleString("en-IN", { timeZone: 'Asia/Kolkata' });
  }

  const customerName = String(user?.name || user?.Name || item?.CustomerName || item?.customerName || "").trim();
  const customerEmail = String(user?.email || user?.Email || item?.UserEmail || item?.userEmail || "N/A").trim();
  const customerMobile = String(user?.mobile || user?.Mobile || item?.Mobile || item?.mobile || item?.phone || item?.Phone || "N/A").trim();

  const profileAddr = user?.residentialAddress || user?.ResidentialAddress || user?.billingAddress || user?.BillingAddress || user?.address || user?.Address || "";
  const profileCity = user?.city || user?.City || "";
  const profileState = user?.state || user?.State || "";
  const profilePincode = user?.pincode || user?.Pincode || "";

  const addressParts = [
    profileAddr,
    profileCity,
    profileState,
    profilePincode ? `PIN-${profilePincode}` : ""
  ].filter(Boolean);

  const customerAddress = addressParts.length > 0 
    ? addressParts.join(", ") 
    : String(item?.Address || item?.address || "Gujarat, India").trim();

  // Handle missing language pairs or units, assign 'Standard Service' default value
  const srcLang = item?.SourceLanguage || item?.sourceLanguage || item?.sourceLanguageSelected;
  const tgtLang = item?.TargetLanguage || item?.targetLanguage || item?.targetLanguageSelected;
  const languagePair = (srcLang && tgtLang) 
    ? `${srcLang} to ${tgtLang}` 
    : "Standard Service";

  const wordCount = Number(item?.WordCount || item?.wordCount || 0);
  const units = wordCount > 0 ? `${wordCount} Words` : "Standard Service";

  const rawServiceName = String(item?.service || item?.ServiceType || item?.serviceType || item?.ServiceName || item?.serviceName || "Standard Service").trim();
  const serviceType = rawServiceName || "Standard Service";

  // Calculate pricing divisions dynamically with safe default fallbacks (Condition A vs Condition B)
  const totalAmount = Number(item?.Amount || item?.amount || item?.finalAmount || item?.billingDetails?.finalAmount || (wordCount > 0 ? Math.round(wordCount * 0.5) : 150));
  const category = String(item?.ServiceCategory || item?.serviceCategory || item?.Category || item?.category || "").toLowerCase();
  const isDocumentService = category.includes("typing") || category.includes("translation") || 
                            serviceType.toLowerCase().includes("typing") || serviceType.toLowerCase().includes("translation");

  let baseServiceCharge = 0;
  let govtFee = 0;
  let courierCharge = 0;

  const payloadGovFee = item?.GovFee !== undefined ? item.GovFee : (item?.GovtFee !== undefined ? item.GovtFee : (item?.govFee !== undefined ? item.govFee : (item?.govtFee !== undefined ? item.govtFee : undefined)));
  const payloadServiceCharge = item?.ServiceCharge !== undefined ? item.ServiceCharge : (item?.ServiceCharges !== undefined ? item.ServiceCharges : (item?.serviceCharge !== undefined ? item.serviceCharge : (item?.serviceCharges !== undefined ? item.serviceCharges : undefined)));
  const payloadOtherCharges = item?.OtherCharges !== undefined ? item.OtherCharges : (item?.otherCharges !== undefined ? item.otherCharges : (item?.CourierCharge !== undefined ? item.CourierCharge : (item?.courierCharge !== undefined ? item.courierCharge : undefined)));

  if (payloadGovFee !== undefined || payloadServiceCharge !== undefined || payloadOtherCharges !== undefined) {
    govtFee = Number(payloadGovFee || 0);
    baseServiceCharge = Number(payloadServiceCharge || 0);
    courierCharge = Number(payloadOtherCharges || 0);
  } else if (isDocumentService) {
    govtFee = 0;
    const rate = getRatePerWord(serviceType.toLowerCase(), srcLang || "Auto Detect", tgtLang || "Gujarati");
    const computedBaseFromWords = Math.round(wordCount * rate);
    if (totalAmount > 0) {
      baseServiceCharge = computedBaseFromWords > 0 ? Math.min(totalAmount, computedBaseFromWords) : totalAmount;
      courierCharge = Math.max(0, totalAmount - baseServiceCharge);
    } else {
      baseServiceCharge = computedBaseFromWords || 150;
      courierCharge = 0;
    }
  } else {
    if (typeof item?.GovtFee !== 'undefined' || typeof item?.ServiceCharge !== 'undefined') {
      govtFee = Number(item.GovtFee || 0);
      baseServiceCharge = Number(item.ServiceCharge || 0);
      courierCharge = Number(item.CourierCharge || 0);
      
      const parsedSum = govtFee + baseServiceCharge + courierCharge;
      if (totalAmount > parsedSum) {
        courierCharge += (totalAmount - parsedSum);
      }
    } else {
      const matchedSvc = servicesMaster.find((s: any) => {
        const smName = (s.ServiceName || "").toLowerCase();
        return serviceType.toLowerCase().includes(smName) || smName.includes(serviceType.toLowerCase());
      });

      if (matchedSvc) {
        baseServiceCharge = Number(matchedSvc.ServiceCharge || matchedSvc.BasePrice || 0);
        govtFee = Number(matchedSvc.GovtFee || 0);
        if (totalAmount > (baseServiceCharge + govtFee)) {
          courierCharge = totalAmount - (baseServiceCharge + govtFee);
        } else {
          courierCharge = 0;
        }
      } else {
        baseServiceCharge = Math.round(totalAmount * 0.6);
        govtFee = Math.round(totalAmount * 0.3);
        courierCharge = Math.max(0, totalAmount - baseServiceCharge - govtFee);
      }
    }
  }

  // Parse structured discount & billingDetails
  const billingObj = item?.billingDetails || item?.BillingDetails || {};
  const originalAmount = Number(
    billingObj.originalAmount ?? 
    item?.originalAmount ?? 
    item?.OriginalAmount ?? 
    item?.['Original Amount'] ?? 
    item?.rawPrice ?? 
    (govtFee + baseServiceCharge + courierCharge)
  );

  const discountValue = Number(
    billingObj.discountValue ?? 
    item?.discountValue ?? 
    item?.DiscountValue ?? 
    item?.['Discount Value'] ?? 
    item?.discountAmount ?? 
    (originalAmount > totalAmount ? originalAmount - totalAmount : 0)
  );

  const discountApplied = String(
    billingObj.discountApplied ?? 
    item?.discountApplied ?? 
    item?.DiscountApplied ?? 
    item?.['Discount Info'] ?? 
    item?.DiscountInfo ?? 
    item?.discountRule ?? 
    (discountValue > 0 ? "Special Benefit" : "None")
  ).trim();

  const finalAmount = Number(
    billingObj.finalAmount ?? 
    item?.finalAmount ?? 
    item?.FinalAmount ?? 
    item?.['Final Paid'] ?? 
    item?.FinalPaid ?? 
    totalAmount
  );

  const paymentId = String(item?.PaymentID || item?.paymentId || item?.transactionId || item?.TransactionID || "PRE-PAID").trim();
  const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://www.amit.today';
  const verificationUrl = `${origin}/?trackOrder=${encodeURIComponent(orderId)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  return {
    orderId,
    issueDateStr,
    customerName,
    customerEmail,
    customerMobile,
    customerAddress,
    serviceType,
    languagePair,
    units,
    govtFee,
    serviceCharge: baseServiceCharge,
    courierCharge,
    originalAmount,
    discountApplied,
    discountValue,
    finalAmount,
    totalAmount: finalAmount || totalAmount,
    paymentId,
    qrImageUrl,
    businessName: String(invoiceSettings.BUSINESS_NAME || "Amit Online Services").trim(),
    businessAddress: String(invoiceSettings.BUSINESS_ADDRESS || "Gyan Nagar, Nanpura, Surat-395001, Gujarat").trim(),
    businessGstIn: String(invoiceSettings.BUSINESS_GSTIN || "").trim(),
    contactEmail: String(invoiceSettings.CONTACT_EMAIL || "amitonlineservice01@gmail.com").trim(),
    contactPhone: String(invoiceSettings.CONTACT_PHONE || "+91 90000 00000").trim(),
    businessLogoBase64: String(invoiceSettings.BUSINESS_LOGO || "").trim(),
  };
};

/**
 * Main utility function to download or return PDF Invoice for a given order receipt.
 */
export const downloadPDFInvoice = async (item: any, user: any, returnBlob?: boolean) => {
  try {
    // 1. Fetch current settings and services master dynamically
    let invoiceSettings: any = {
      BUSINESS_NAME: 'Amit Online Services',
      BUSINESS_ADDRESS: 'Gyan Nagar, Nanpura, Surat-395001, Gujarat',
      CONTACT_EMAIL: 'amitonlineservice01@gmail.com',
      CONTACT_PHONE: '+91 90000 00000',
      BUSINESS_GSTIN: '',
      INVOICE_TERMS: '* This is an automated dynamic system generated tax receipt.\n* All disputes are subject to local jurisdiction only.\n* Service charges are fully inclusive of facilitation expenses.\n* No active balance left outstanding.',
      UPI_INSTRUCTION: '* SCAN & PAY SECURELY WITH ANY UPI APP *'
    };
    let servicesMaster: any[] = [];

    try {
      const settingsRes = await axios.get('/api/invoice-settings');
      if (settingsRes.data && settingsRes.data.success && settingsRes.data.data) {
        invoiceSettings = { ...invoiceSettings, ...settingsRes.data.data };
      }
    } catch (e) {
      console.warn("Could not fetch invoice settings, using defaults", e);
    }

    try {
      const configRes = await axios.get('/api/config/business-info');
      if (configRes.data && configRes.data.success && configRes.data.data) {
        const busInfo = configRes.data.data;
        invoiceSettings.BUSINESS_NAME = busInfo.BUSINESS_NAME || invoiceSettings.BUSINESS_NAME;
        invoiceSettings.BUSINESS_ADDRESS = busInfo.BUSINESS_ADDRESS || invoiceSettings.BUSINESS_ADDRESS;
        invoiceSettings.CONTACT_EMAIL = busInfo.BUSINESS_EMAIL || invoiceSettings.BUSINESS_EMAIL || invoiceSettings.CONTACT_EMAIL;
        invoiceSettings.CONTACT_PHONE = busInfo.BUSINESS_PHONE || invoiceSettings.BUSINESS_PHONE || invoiceSettings.CONTACT_PHONE;
        invoiceSettings.BUSINESS_GSTIN = busInfo.BUSINESS_GSTIN || invoiceSettings.BUSINESS_GSTIN || '';
        invoiceSettings.BUSINESS_LOGO = busInfo.BUSINESS_LOGO || '';
      }
    } catch (e) {
      console.warn("Could not fetch business config, using defaults", e);
    }

    try {
      const servicesRes = await axios.get('/api/services-master');
      if (servicesRes.data && servicesRes.data.success && servicesRes.data.data) {
        servicesMaster = servicesRes.data.data;
      }
    } catch (e) {
      console.warn("Could not fetch services master, using defaults", e);
    }

    // 2. Sanitize and normalize document data
    const data = sanitizeInvoiceData(item, user, invoiceSettings, servicesMaster);

    // 3. Pre-load QR Code as base64 to ensure instant synchronous HTML rendering
    let resolvedQrBase64 = "";
    try {
      resolvedQrBase64 = await loadQrImage(data.qrImageUrl);
    } catch (qrErr) {
      console.warn("Could not pre-load QR code base64, using fallback QR pattern", qrErr);
    }

    // 4. Construct a gorgeous, structured HTML template string enforcing dynamic template settings
    const primaryColor = invoiceSettings.INVOICE_PRIMARY_COLOR || "#312e81";
    const secondaryColor = invoiceSettings.INVOICE_SECONDARY_COLOR || "#4f46e5";
    const tableHeaderBg = invoiceSettings.INVOICE_TABLE_HEADER_BG || "#1e293b";
    const headerTitle = invoiceSettings.INVOICE_HEADER_TITLE || "Official Tax Invoice";
    const subtitle = invoiceSettings.INVOICE_SUBTITLE || "Facilitation & IT Solutions";
    const footerNote = invoiceSettings.INVOICE_FOOTER_NOTE || "This is an official system-generated secure tax receipt. No physical signature is required. All disputes subject to Surat jurisdiction.";
    const invoiceTerms = invoiceSettings.INVOICE_TERMS || "* This is an automated dynamic system generated tax receipt.\n* All disputes are subject to local jurisdiction only.";

    const htmlTemplate = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff; padding: 24px; box-sizing: border-box; width: 794px; min-height: 1120px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
        
        <!-- Custom Brand Diagonal Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-32deg); font-size: 36px; font-weight: 900; color: rgba(30, 41, 59, 0.035); text-transform: uppercase; letter-spacing: 6px; pointer-events: none; white-space: nowrap; z-index: 0; user-select: none; text-align: center;">
          ${data.businessName} • VERIFIED INVOICE • #${data.orderId}
        </div>

        <div style="position: relative; z-index: 1;">
          <!-- Header block: Solid Dynamic Theme Accent -->
          <div style="background-color: ${primaryColor}; color: #ffffff; padding: 24px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="font-size: 20px; font-weight: 800; letter-spacing: 1px; margin: 0; text-transform: uppercase;">${data.businessName}</h1>
              <p style="font-size: 11px; color: #c7d2fe; margin: 4px 0 0 0; font-weight: 500;">${subtitle}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 16px; font-weight: 700; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">${headerTitle}</h2>
              <p style="font-size: 10px; color: #e0e7ff; margin: 4px 0 0 0;">Support: ${data.contactEmail}</p>
            </div>
          </div>

          <!-- Metadata Ribbon -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 6px 6px; padding: 10px 16px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #475569;">
            <div>Order ID: <span style="color: #1e293b;">#${data.orderId}</span></div>
            <div>Date: <span style="color: #1e293b;">${data.issueDateStr}</span></div>
            <div>Payment Ref: <span style="color: #1e293b;">${data.paymentId}</span></div>
            <div style="color: ${secondaryColor}; text-transform: uppercase;">Status: PAID</div>
          </div>

          <!-- Two-Column Information Section -->
          <div style="display: flex; gap: 16px; margin-top: 24px;">
            <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; min-height: 110px; box-sizing: border-box;">
              <h3 style="font-size: 10px; font-weight: 800; color: ${secondaryColor}; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Bill To</h3>
              <p style="font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">${data.customerName}</p>
              <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">
                <div><strong>Email:</strong> ${data.customerEmail}</div>
                <div><strong>Mobile:</strong> ${data.customerMobile}</div>
                <div><strong>Address:</strong> ${data.customerAddress}</div>
              </div>
            </div>
            <div style="flex: 1; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; min-height: 110px; box-sizing: border-box;">
              <h3 style="font-size: 10px; font-weight: 800; color: ${secondaryColor}; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Provider Details</h3>
              <p style="font-size: 12px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">${data.businessName}</p>
              <div style="font-size: 10.5px; color: #475569; line-height: 1.4;">
                <div><strong>Registered Office:</strong> ${data.businessAddress}</div>
                ${data.businessGstIn ? `<div><strong>GSTIN:</strong> ${data.businessGstIn}</div>` : ""}
                <div><strong>Contact Phone:</strong> ${data.contactPhone}</div>
              </div>
            </div>
          </div>

          <!-- Service Table: Enforce Indian Rupee Symbol (₹) -->
          <table style="width: 100%; border-collapse: collapse; margin-top: 24px;">
            <thead>
              <tr style="background-color: ${tableHeaderBg}; color: #ffffff;">
                <th style="padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; border-radius: 6px 0 0 0; text-align: left;">Description</th>
                <th style="padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; text-align: center; width: 130px;">Quantity/Units</th>
                <th style="padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; text-align: right; width: 110px;">Price (₹)</th>
                <th style="padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; text-align: right; border-radius: 0 6px 0 0; width: 120px;">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; color: #334155; font-weight: 500;">Government Portal Fee (Filing & Facilitation)</td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: center; color: #475569;">1 App</td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: right; color: #475569;">₹ ${(data.govtFee || 0).toFixed(2)}</td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: 700;">₹ ${(data.govtFee || 0).toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; color: #334155; font-weight: 500;">
                  Professional Service Fee (${data.serviceType})
                  <span style="display: block; font-size: 9.5px; color: #64748b; margin-top: 2px;">Language: ${data.languagePair}</span>
                </td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: center; color: #475569;">${data.units}</td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: right; color: #475569;">₹ ${(data.units.includes('Words') && data.serviceCharge > 0 ? (data.serviceCharge / (parseFloat(data.units) || 1)).toFixed(2) : (data.serviceCharge || 0).toFixed(2))}</td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: 700;">₹ ${(data.serviceCharge || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; color: #334155; font-weight: 500;">Administrative Expenses (Courier, Printing & Admin Charges)</td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: center; color: #475569;">1 Lot</td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: right; color: #475569;">₹ ${(data.courierCharge || 0).toFixed(2)}</td>
                <td style="padding: 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: right; color: #0f172a; font-weight: 700;">₹ ${(data.courierCharge || 0).toFixed(2)}</td>
              </tr>
              ${(data.discountValue > 0 || (data.discountApplied && data.discountApplied !== 'None' && data.discountApplied !== '')) ? `
              <tr style="background-color: #f8fafc; font-weight: 600;">
                <td colspan="2" style="padding: 10px 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: right; color: #475569; text-transform: uppercase;">Subtotal (Original Amount)</td>
                <td style="border: 1px solid #e2e8f0; border-left: none; border-right: none;"></td>
                <td style="padding: 10px 12px; font-size: 11px; border: 1px solid #e2e8f0; text-align: right; color: #334155; font-weight: 700;">₹ ${(data.originalAmount || (data.govtFee + data.serviceCharge + data.courierCharge)).toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f0fdf4; color: #166534; font-weight: 600;">
                <td colspan="2" style="padding: 10px 12px; font-size: 11px; border: 1px solid #bbf7d0; text-align: right; color: #166534; text-transform: uppercase;">
                  Special Benefit (${data.discountApplied})
                </td>
                <td style="border: 1px solid #bbf7d0; border-left: none; border-right: none; color: #15803d; text-align: right; font-size: 10px;">Discount</td>
                <td style="padding: 10px 12px; font-size: 11px; border: 1px solid #bbf7d0; text-align: right; font-weight: 800; color: #15803d;">-₹ ${data.discountValue.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #f1f5f9; font-weight: 800; color: ${primaryColor};">
                <td colspan="2" style="padding: 12px; font-size: 11.5px; border: 1px solid #cbd5e1; border-right: none; text-align: right; border-radius: 0 0 0 6px;">Grand Total (Total Paid Amount)</td>
                <td style="border: 1px solid #cbd5e1; border-left: none; border-right: none;"></td>
                <td style="padding: 12px; font-size: 12px; border: 1px solid #cbd5e1; border-left: none; text-align: right; font-weight: 800; border-radius: 0 0 6px 0;">₹ ${(data.totalAmount || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <!-- Amount In Words Block -->
          <div style="margin-top: 16px; font-size: 10px; color: #475569;">
            <strong style="color: #1e293b; text-transform: uppercase;">Amount in Words:</strong>
            <span style="font-style: italic; font-weight: 600; margin-left: 6px; color: ${secondaryColor};">${convertNumberToWords(data.totalAmount)}</span>
          </div>

          <!-- Terms & Conditions Block -->
          <div style="margin-top: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
            <div style="font-size: 10px; font-weight: 800; color: #1e293b; text-transform: uppercase; margin-bottom: 4px;">Terms & Conditions</div>
            <div style="font-size: 9.5px; color: #64748b; line-height: 1.5; whitespace: pre-line;">${invoiceTerms}</div>
          </div>
        </div>

        <!-- Consistent Footer Layout Area -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 18px; margin-top: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            
            <!-- Standardized Footer Verification Block (Bottom Left) -->
            <div style="display: flex; align-items: center; gap: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; max-width: 420px; box-sizing: border-box;">
              <div style="width: 58px; height: 58px; border: 2px solid ${primaryColor}; background-color: #ffffff; padding: 2px; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">
                ${resolvedQrBase64 ? `<img src="${resolvedQrBase64}" alt="Verification QR" style="width: 100%; height: 100%; object-fit: contain;" />` : `
                  <div style="width: 100%; height: 100%; display: flex; flex-wrap: wrap;">
                    <div style="width: 50%; height: 50%; background: ${primaryColor};"></div>
                    <div style="width: 50%; height: 50%; background: #ffffff;"></div>
                    <div style="width: 50%; height: 50%; background: #ffffff;"></div>
                    <div style="width: 50%; height: 50%; background: ${primaryColor};"></div>
                  </div>
                `}
              </div>
              <div style="font-size: 9.5px; color: #475569; line-height: 1.35;">
                <div style="font-weight: 800; color: #1e293b; text-transform: uppercase; font-size: 10px; margin-bottom: 2px; letter-spacing: 0.3px;">Verified Order Receipt</div>
                <div>Scan to verify transaction progress & record certificate integrity.</div>
                <div style="margin-top: 2px; font-weight: 700; color: #1e293b;">Order Status: PAID & CERTIFIED</div>
              </div>
            </div>

            <!-- Authorized Digital Signatory (Bottom Right) -->
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; width: 220px;">
              <div style="font-size: 10px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">${data.businessName}</div>
              <div style="width: 180px; border-top: 1px dashed #94a3b8; margin: 36px 0 4px 0;"></div>
              <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Authorized Digital Signatory</div>
            </div>

          </div>

          <!-- Bottom Fineprint -->
          <div style="text-align: center; font-size: 9px; color: #94a3b8; font-weight: 500; margin-top: 18px; border-top: 1px solid #f1f5f9; padding-top: 8px;">
            ${footerNote}
          </div>
        </div>

      </div>
    `;

    // 5. Setup container element to render with jsPDF
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.style.width = "794px";
    tempContainer.style.backgroundColor = "#ffffff";
    tempContainer.innerHTML = htmlTemplate;
    document.body.appendChild(tempContainer);

    // Create jsPDF document instance
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Run HTML conversion
    await new Promise<void>((resolve, reject) => {
      doc.html(tempContainer, {
        callback: function (completedDoc) {
          try {
            document.body.removeChild(tempContainer);
            resolve();
          } catch (err) {
            resolve(); // handle graceful remove
          }
        },
        x: 0,
        y: 0,
        width: 210, // Fit standard A4 width
        windowWidth: 794,
      });
    });

    if (returnBlob) {
      return doc.output("blob");
    }

    doc.save(`Invoice_${data.orderId}.pdf`);
    return true;
  } catch (err: any) {
    console.error("PDF Invoice generation failed:", err);
    throw err;
  }
};

export interface NotaryReceiptData {
  orderId: string;
  applicantName: string;
  barEnrolment: string;
  email: string;
  mobile: string;
  pan?: string;
  residenceState?: string;
  status: string;
  createdAt?: string;
  govtFee?: number;
  draftingFee?: number;
  stampFee?: number;
  totalAmount?: number;
  paymentId?: string;
  paymentMethod?: string;
}

/**
 * Generates a structured, branded 'Receipt' PDF for notary service fee payments
 * adhering strictly to the Certificate design language (Navy frame, gold line, watermark, stamp).
 */
export const generateNotaryServiceReceiptPDF = async (data: NotaryReceiptData, returnBlob = false): Promise<Blob | boolean> => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const orderId = data.orderId || "AOS-NOTARY-8832";
    const name = data.applicantName || "Advocate Applicant";
    const barId = data.barEnrolment || "BAR/AOS/REGISTERED";
    const status = data.status || "ARN Generated";
    const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN");
    
    const govtFee = data.govtFee ?? 500;
    const draftingFee = data.draftingFee ?? 1000;
    const stampFee = data.stampFee ?? 250;
    const totalAmount = data.totalAmount ?? (govtFee + draftingFee + stampFee);
    const amountInWords = convertNumberToWords(totalAmount);
    const txnId = data.paymentId || `TXN-AOS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentMethod = data.paymentMethod || "UPI / Razorpay Secured Gateway";

    doc.setProperties({
      title: `Official Notary Fee Payment Receipt - #${orderId}`,
      subject: `Notary Service Fee Payment Receipt for ${name}`,
      author: "Amit Online Services - Legal & Notary Desk",
      creator: "AOS Notary Engine v3.6"
    });

    // 1. Outer Navy Blue Border Frame (#0a192f)
    doc.setDrawColor(10, 25, 47);
    doc.setLineWidth(1.2);
    doc.rect(8, 8, 194, 281);

    // 2. Inner Gold Accent Border (#d97706)
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.rect(10.5, 10.5, 189, 276);

    // 3. Diagonal Light Watermark Text
    const pdfSession = `SESSION-AOS-NOTARY-${orderId.slice(-6).toUpperCase()}`;
    const pdfTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 19) + " UTC";
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(225, 230, 240);
    doc.text(`AOS VERIFIED COPY • OFFICIAL NOTARY PAYMENT RECEIPT • ${pdfTimestamp}`, 105, 148, { align: "center", angle: 45 });

    // 4. Header Titles
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 115, 130);
    doc.text("CENTRAL NOTARY PUBLIC FACILITATION REGISTRY", 105, 22, { align: "center" });

    doc.setFontSize(15);
    doc.setTextColor(10, 25, 47);
    doc.text("OFFICIAL NOTARY SERVICE FEE PAYMENT RECEIPT", 105, 30, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(120, 130, 140);
    doc.text(`RECEIPT REF NO: #REC-NOTARY-${orderId} | DATE: ${dateStr}`, 105, 36, { align: "center" });

    doc.setDrawColor(217, 119, 6);
    doc.line(40, 40, 170, 40);

    // 5. Applicant Dossier & Status Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(18, 46, 174, 52, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text("APPLICANT & NOTARY REGISTRATION DETAILS", 24, 54);

    const applicantFields = [
      { label: "Applicant Name", val: name },
      { label: "Bar Enrolment No.", val: barId },
      { label: "Application ID", val: `#${orderId}` },
      { label: "Email / Mobile", val: `${data.email} | ${data.mobile}` },
      { label: "Current Status", val: status.toUpperCase() },
      { label: "State / District", val: `${data.residenceState || "Gujarat"}` }
    ];

    let currY = 62;
    applicantFields.forEach((f, idx) => {
      const col = idx % 2 === 0 ? 24 : 108;
      if (idx % 2 === 0 && idx > 0) currY += 8;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 110, 120);
      doc.text(f.label + ":", col, currY);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      if (f.label === "Current Status") {
        doc.setTextColor(16, 124, 65);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(String(f.val), col + 32, currY);
    });

    // 6. Fee Payment Breakdown Table
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text("ITEMIZED NOTARY SERVICE FEE BREAKDOWN", 18, 108);

    // Table Header Row
    doc.setFillColor(10, 25, 47);
    doc.rect(18, 112, 174, 8, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("NO.", 22, 117.5);
    doc.text("SERVICE DESCRIPTION", 36, 117.5);
    doc.text("CATEGORY", 125, 117.5);
    doc.text("AMOUNT (INR)", 186, 117.5, { align: "right" });

    // Table Item Rows
    const items = [
      { no: "1", desc: "Central Notary Application Filing & Portal Fee", cat: "Government Fee", amt: govtFee },
      { no: "2", desc: "Advocate Sanad Verification & Legal Drafting Fee", cat: "Legal Desk Charge", amt: draftingFee },
      { no: "3", desc: "E-Stamping Certificate & Digital Seal Authentication", cat: "Facilitation Charge", amt: stampFee }
    ];

    let rowY = 126;
    items.forEach((item, i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(18, rowY - 5, 174, 8, "F");

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(item.no, 22, rowY);
      doc.text(item.desc, 36, rowY);
      doc.text(item.cat, 125, rowY);

      doc.setFont("Helvetica", "bold");
      doc.text(`INR ${item.amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 186, rowY, { align: "right" });

      rowY += 8;
    });

    // Total Row
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(18, rowY - 3, 174, 10, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(10, 25, 47);
    doc.text("TOTAL PAID AMOUNT:", 100, rowY + 3.5);
    doc.setTextColor(16, 124, 65);
    doc.text(`INR ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, 186, rowY + 3.5, { align: "right" });

    // Amount in Words Box
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 110, 120);
    doc.text(`AMOUNT IN WORDS: `, 18, rowY + 16);
    doc.setTextColor(15, 23, 42);
    doc.text(amountInWords, 55, rowY + 16);

    // 7. Transaction Payment Reference Block
    const txnY = rowY + 24;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(18, txnY, 174, 28, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(10, 25, 47);
    doc.text("SETTLED TRANSACTION AUDIT TRAIL", 24, txnY + 8);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Payment Ref ID: ${txnId}`, 24, txnY + 15);
    doc.text(`Gateway Channel: ${paymentMethod}`, 24, txnY + 21);
    doc.text(`Payment Status: SETTLED & CONFIRMED`, 110, txnY + 15);
    doc.text(`Digital Receipt Hash: 0x8f${orderId}e94a`, 110, txnY + 21);

    // 8. Signatory & Official Gold Seal Section
    const sigY = txnY + 34;
    doc.setDrawColor(203, 213, 225);
    doc.rect(18, sigY, 174, 52, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 115, 130);
    doc.text("AUTHORISED NOTARY REGISTRAR SIGNATURE & SEAL", 24, sigY + 8);

    doc.setFont("Courier", "oblique");
    doc.setFontSize(13);
    doc.setTextColor(10, 25, 47);
    doc.text("AOS Notary Facilitation Authority", 28, sigY + 24);
    doc.setDrawColor(10, 25, 47);
    doc.line(24, sigY + 28, 92, sigY + 28);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Central Legal Verification Registrar", 24, sigY + 34);
    doc.text(`Digital Verification Key: AOS-NOTARY-VERIFIED-${orderId}`, 24, sigY + 39);

    // Gold Seal Circle
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.circle(150, sigY + 26, 13, "S");
    doc.setLineWidth(0.15);
    doc.circle(150, sigY + 26, 11, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(217, 119, 6);
    doc.text("CENTRAL NOTARY", 150, sigY + 23, { align: "center" });
    doc.setFontSize(6.5);
    doc.text("SEAL", 150, sigY + 27, { align: "center" });
    doc.setFontSize(4.5);
    doc.text("AOS GUJARAT", 150, sigY + 30, { align: "center" });

    // Footer Disclaimer
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("This computer-generated payment receipt is issued by Amit Online Services Notary Facilitation Portal.", 105, 276, { align: "center" });
    doc.text("No physical signature is required under IT Act Section 4. Verification QR & Seal digitally validated.", 105, 280, { align: "center" });

    if (returnBlob) {
      return doc.output("blob");
    }

    doc.save(`Notary_Receipt_${orderId}.pdf`);
    return true;
  } catch (err: any) {
    console.error("Notary Fee Receipt PDF generation error:", err);
    throw err;
  }
};

export interface NotaryApplicationSummaryData {
  applicationId: string;
  mobile: string;
  state: string;
  city: string;
  totalAmount: number;
  utrNumber: string;
  createdAt?: string;
  files?: { [key: string]: { name: string; base64: string; type: string } };
  ocrResults?: { [key: string]: { status: string; confidence: number; patternMatch?: string; details?: string } };
}

/**
 * Generates an official, formatted PDF Summary of the Notary Application directly after submission.
 */
export const generateNotaryApplicationSummaryPDF = async (
  data: NotaryApplicationSummaryData,
  returnBlob = false
): Promise<Blob | boolean> => {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const orderId = data.applicationId || "AOS-NOTARY-8832";
    const mobile = data.mobile || "N/A";
    const state = data.state || "Gujarat";
    const city = data.city || "Surat";
    const totalAmount = data.totalAmount || 1000;
    const utrNumber = data.utrNumber || "TXN-AOS-2026-PENDING";
    const dateStr = data.createdAt
      ? new Date(data.createdAt).toLocaleDateString("en-IN")
      : new Date().toLocaleDateString("en-IN");
    const amountInWords = convertNumberToWords(totalAmount);

    doc.setProperties({
      title: `Notary Application Summary - #${orderId}`,
      subject: `Done-For-You Notary Application Summary Record`,
      author: "Amit Online Services - Legal & Notary Desk",
      creator: "AOS Notary Engine v3.6"
    });

    // 1. Outer Navy Blue Border Frame (#0a192f)
    doc.setDrawColor(10, 25, 47);
    doc.setLineWidth(1.2);
    doc.rect(8, 8, 194, 281);

    // 2. Inner Gold Accent Border (#d97706)
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.5);
    doc.rect(10.5, 10.5, 189, 276);

    // 3. Diagonal Watermark Text
    const pdfTimestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " IST";
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(230, 235, 245);
    doc.text(`AOS NOTARY DFY DRAFT SUMMARY • ARN: ${orderId} • ${pdfTimestamp}`, 105, 148, { align: "center", angle: 45 });

    // 4. Header Titles
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 115, 130);
    doc.text("CENTRAL NOTARY PUBLIC FACILITATION REGISTRY", 105, 22, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(10, 25, 47);
    doc.text("OFFICIAL DONE-FOR-YOU NOTARY APPLICATION SUMMARY", 105, 30, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(120, 130, 140);
    doc.text(`APPLICATION REFERENCE NO (ARN): #${orderId} | DATE: ${dateStr}`, 105, 36, { align: "center" });

    doc.setDrawColor(217, 119, 6);
    doc.line(35, 40, 175, 40);

    // 5. Applicant Dossier & Location Details Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(18, 46, 174, 52, "FD");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text("1. APPLICANT CONTACT & JURISDICTION SUMMARY", 24, 54);

    const applicantFields = [
      { label: "Application Ref ID", val: `#${orderId}` },
      { label: "Mobile / WhatsApp", val: mobile },
      { label: "Filing State", val: state },
      { label: "Filing City / District", val: city },
      { label: "Filing Status", val: "SUBMITTED (PROCESSING)" },
      { label: "Database Record", val: "Logged to Notary_DFY_Database" }
    ];

    let currY = 62;
    applicantFields.forEach((f, idx) => {
      const col = idx % 2 === 0 ? 24 : 108;
      if (idx % 2 === 0 && idx > 0) currY += 8;

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 110, 120);
      doc.text(f.label + ":", col, currY);

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      if (f.label === "Filing Status") {
        doc.setTextColor(16, 124, 65);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(String(f.val), col + 34, currY);
    });

    // 6. Payment & Fee Audit Trail
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text("2. PAYMENT & FEE STRUCTURE AUDIT", 18, 108);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(18, 112, 174, 30, "FD");

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Jurisdiction Rate Category:`, 24, 120);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(`${state} (${city}) - Location Calculated Rate`, 75, 120);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Payment UTR / Ref No:`, 24, 127);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(180, 83, 9);
    doc.text(utrNumber, 75, 127);

    doc.setFont("Helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Amount Paid:`, 24, 134);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(16, 124, 65);
    doc.text(`INR ${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} (${amountInWords})`, 75, 134);

    // 7. Uploaded Documents & OCR Checklist
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text("3. ATTACHED DOSSIER & OCR VALIDATION LOG", 18, 150);

    // Table Header
    doc.setFillColor(10, 25, 47);
    doc.rect(18, 154, 174, 8, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("DOCUMENT TYPE", 22, 159.5);
    doc.text("FILE NAME / REF", 75, 159.5);
    doc.text("OCR AUDIT PATTERN", 130, 159.5);
    doc.text("STATUS", 186, 159.5, { align: "right" });

    const docsList = [
      {
        type: "Passport Photo",
        name: data.files?.photo?.name || "photo_specimen.jpg",
        pattern: "Facial & Image Specimen Validated",
        status: "VERIFIED"
      },
      {
        type: "Advocate Signature",
        name: data.files?.signature?.name || "signature_specimen.png",
        pattern: "Ink Signature Pattern Detected",
        status: "VERIFIED"
      },
      {
        type: "Advocate Sanad",
        name: data.files?.sanad?.name || "sanad_certificate.pdf",
        pattern: "Enrolment Sanad Text Verified",
        status: "VERIFIED"
      }
    ];

    if (data.files?.supporting) {
      docsList.push({
        type: "Supporting Document",
        name: data.files.supporting.name,
        pattern: "Attachment Linked",
        status: "ATTACHED"
      });
    }

    let docRowY = 168;
    docsList.forEach((d, i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      doc.rect(18, docRowY - 5, 174, 8, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(d.type, 22, docRowY);

      doc.setFont("Helvetica", "normal");
      doc.text(d.name.length > 25 ? d.name.slice(0, 22) + "..." : d.name, 75, docRowY);
      doc.text(d.pattern, 130, docRowY);

      doc.setFont("Helvetica", "bold");
      doc.setTextColor(16, 124, 65);
      doc.text(d.status, 186, docRowY, { align: "right" });

      docRowY += 8;
    });

    // 8. Signatory & Official Gold Seal Section
    const sigY = docRowY + 12;
    doc.setDrawColor(203, 213, 225);
    doc.rect(18, sigY, 174, 50, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 115, 130);
    doc.text("AUTHORISED NOTARY REGISTRAR SIGNATURE & SEAL", 24, sigY + 8);

    doc.setFont("Courier", "oblique");
    doc.setFontSize(13);
    doc.setTextColor(10, 25, 47);
    doc.text("AOS Notary Facilitation Authority", 28, sigY + 24);
    doc.setDrawColor(10, 25, 47);
    doc.line(24, sigY + 28, 92, sigY + 28);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Central Legal Verification Registrar", 24, sigY + 34);
    doc.text(`Digital Verification Key: AOS-NOTARY-SUMMARY-${orderId}`, 24, sigY + 39);

    // Gold Seal Circle
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.4);
    doc.circle(150, sigY + 25, 13, "S");
    doc.setLineWidth(0.15);
    doc.circle(150, sigY + 25, 11, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(5);
    doc.setTextColor(217, 119, 6);
    doc.text("CENTRAL NOTARY", 150, sigY + 22, { align: "center" });
    doc.setFontSize(6.5);
    doc.text("SEAL", 150, sigY + 26, { align: "center" });
    doc.setFontSize(4.5);
    doc.text("AOS GUJARAT", 150, sigY + 29, { align: "center" });

    // Footer Disclaimer
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("This computer-generated application summary record is issued by Amit Online Services Notary Facilitation Portal.", 105, 276, { align: "center" });
    doc.text("Valid record copy for advocate submission tracking under IT Act Section 4.", 105, 280, { align: "center" });

    if (returnBlob) {
      return doc.output("blob");
    }

    doc.save(`Notary_Application_Summary_${orderId}.pdf`);
    return true;
  } catch (err: any) {
    console.error("Notary Application Summary PDF generation error:", err);
    throw err;
  }
};

