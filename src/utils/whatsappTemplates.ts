export interface WhatsAppStatusTemplate {
  statusKey: string;
  label: string;
  emoji: string;
  defaultTemplate: string;
}

export const WHATSAPP_STATUS_TEMPLATES: Record<string, WhatsAppStatusTemplate> = {
  DOCS_RECEIVED: {
    statusKey: "DOCS_RECEIVED",
    label: "Docs Received / Application Submitted",
    emoji: "📥",
    defaultTemplate:
      "*Amit Online Services - Documents Received* 📥\n\nDear *{name}*,\n\nWe have safely received your notary documents for Application *#{orderId}* ({service}). Our legal verification team has begun OCR screening.\n\n👉 *Track Live Progress:*\n{link}\n\nNeed assistance? Reply directly to this WhatsApp message."
  },
  PENDING_ADMIN_DRAFT: {
    statusKey: "PENDING_ADMIN_DRAFT",
    label: "Pending Legal / Admin Draft",
    emoji: "✍️",
    defaultTemplate:
      "*Amit Online Services - Legal Draft Underway* ✍️\n\nDear *{name}*,\n\nYour application *#{orderId}* ({service}) has passed initial document screening. Our advocate desk is currently drafting and reviewing your official notary records.\n\n👉 *View Draft Status:*\n{link}\n\nThank you for choosing Amit Online Services!"
  },
  ARN_GENERATED: {
    statusKey: "ARN_GENERATED",
    label: "ARN Generated & E-Stamp Attached",
    emoji: "🏛️",
    defaultTemplate:
      "*Amit Online Services - ARN Generated* 🏛️\n\nDear *{name}*,\n\nOfficial Application Reference Number (ARN) for application *#{orderId}* has been successfully generated & e-stamp attached.\n\n👉 *Download Digital Proof:*\n{link}\n\nYour final certificate is entering final registry sealing."
  },
  COMPLETED: {
    statusKey: "COMPLETED",
    label: "Completed & Certificate Issued",
    emoji: "🎉",
    defaultTemplate:
      "*Amit Online Services - Application Approved & Completed* 🎉\n\nDear *{name}*,\n\nCongratulations! Your notary registration/application *#{orderId}* for *{service}* is fully completed and verified.\n\n👉 *Download Official Receipt & Certificate:*\n{link}\n\nThank you for trusting Amit Online Services Notary Desk."
  },
  FLAGGED: {
    statusKey: "FLAGGED",
    label: "Flagged / Action Required (Re-upload)",
    emoji: "⚠️",
    defaultTemplate:
      "*Amit Online Services - Action Required* ⚠️\n\nDear *{name}*,\n\nAttention needed for application *#{orderId}* ({service}). One or more uploaded documents require re-uploading due to clarity requirements.\n\n👉 *Re-upload Documents Now:*\n{link}"
  },
  REJECTED: {
    statusKey: "REJECTED",
    label: "Application Rejected / Cancelled",
    emoji: "❌",
    defaultTemplate:
      "*Amit Online Services - Application Notice* ❌\n\nDear *{name}*,\n\nNotice regarding application *#{orderId}* ({service}): The application status has been set to REJECTED/CANCELLED.\n\n👉 *Review Details:*\n{link}"
  }
};

export function getWhatsAppTemplateForStatus(
  status: string,
  params: {
    name: string;
    orderId: string;
    service?: string;
    link?: string;
    customTemplate?: string;
  }
): string {
  const norm = String(status || "").toLowerCase().trim();
  const name = params.name || "Valued Advocate";
  const orderId = params.orderId || "AOS-NOTARY-8832";
  const service = params.service || "Notary Application";
  const link = params.link || `https://www.amit.today/?track=${orderId}`;

  let matchedTemplate = WHATSAPP_STATUS_TEMPLATES.DOCS_RECEIVED.defaultTemplate;

  if (params.customTemplate) {
    matchedTemplate = params.customTemplate;
  } else if (norm.includes("completed") || norm.includes("verified") || norm.includes("approved")) {
    matchedTemplate = WHATSAPP_STATUS_TEMPLATES.COMPLETED.defaultTemplate;
  } else if (norm.includes("arn") || norm.includes("generated") || norm.includes("stamp")) {
    matchedTemplate = WHATSAPP_STATUS_TEMPLATES.ARN_GENERATED.defaultTemplate;
  } else if (norm.includes("draft") || norm.includes("pending") || norm.includes("review")) {
    matchedTemplate = WHATSAPP_STATUS_TEMPLATES.PENDING_ADMIN_DRAFT.defaultTemplate;
  } else if (norm.includes("flagged") || norm.includes("re-upload") || norm.includes("revision")) {
    matchedTemplate = WHATSAPP_STATUS_TEMPLATES.FLAGGED.defaultTemplate;
  } else if (norm.includes("reject") || norm.includes("cancel")) {
    matchedTemplate = WHATSAPP_STATUS_TEMPLATES.REJECTED.defaultTemplate;
  } else {
    matchedTemplate = WHATSAPP_STATUS_TEMPLATES.DOCS_RECEIVED.defaultTemplate;
  }

  return matchedTemplate
    .replace(/{name}/g, name)
    .replace(/{orderId}/g, orderId)
    .replace(/{service}/g, service)
    .replace(/{status}/g, status)
    .replace(/{link}/g, link);
}

export function buildWhatsAppClickToChatUrl(phone: string, text: string): string {
  const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
