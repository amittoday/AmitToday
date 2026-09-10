import { ValidationErrorItem } from "../types/aiLegalAgentTypes";

export const REQUIRED_LEGAL_FIELDS: {
  key: string;
  labelEn: string;
  labelGu: string;
  labelHi: string;
  placeholderPattern: RegExp;
  promptQuestionEn: string;
  promptQuestionGu: string;
  promptQuestionHi: string;
}[] = [
  {
    key: "APPLICANT_NAME",
    labelEn: "Applicant / Deponent Full Name",
    labelGu: "અરજદાર / સોગંદનામું કરનારનું પૂરું નામ",
    labelHi: "आवेदक / शपथकर्ता का पूरा नाम",
    placeholderPattern: /\[APPLICANT_NAME\]/i,
    promptQuestionEn: "Please tell me your Full Legal Name for this application.",
    promptQuestionGu: "કૃપા કરીને આ અરજી માટે તમારું પૂરું કાનૂની નામ જણાવો.",
    promptQuestionHi: "कृपया इस आवेदन के लिए अपना पूरा कानूनी नाम बताएं।"
  },
  {
    key: "TARGET_AUTHORITY",
    labelEn: "Target Authority / Public Officer / Department",
    labelGu: "લક્ષિત સરકારી કચેરી / જાહેર માહિતી અધિકારી (PIO) / વિભાગ",
    labelHi: "संबंधित विभाग / लोक सूचना अधिकारी (PIO)",
    placeholderPattern: /\[TARGET_AUTHORITY\]/i,
    promptQuestionEn: "Which Government Department, Municipal Office, or Authority are you submitting this to?",
    promptQuestionGu: "તમે આ અરજી કયા સરકારી વિભાગ, મામલતદાર, TDO કે મ્યુનિસિપલ કચેરીમાં આપવા માંગો છો?",
    promptQuestionHi: "आप यह आवेदन किस सरकारी विभाग, TDO या अधिकारी को प्रस्तुत कर रहे हैं?"
  },
  {
    key: "KEY_FACTS",
    labelEn: "Subject Matter / Information Sought / Key Facts",
    labelGu: "અરજીનો મુખ્ય વિષય / માંગેલી માહિતીની ચોક્કસ વિગતો",
    labelHi: "आवेदन का मुख्य विषय / मांगी गई जानकारी के तथ्य",
    placeholderPattern: /\[KEY_FACTS\]|\[SUBJECT_TOPIC\]|\[INFO_REQUESTED\]/i,
    promptQuestionEn: "Please specify the key facts, file details, or exact information you are seeking.",
    promptQuestionGu: "કૃપા કરીને તમારે કઈ ફાઈલ, સર્વે નંબર અથવા માહિતીની પ્રમાણિત નકલ જોઈએ છે તે સ્પષ્ટ કરો.",
    promptQuestionHi: "कृपया बताएं कि आपको किस फाइल या जानकारी की प्रमाणित प्रति चाहिए।"
  },
  {
    key: "APPLICANT_ADDRESS",
    labelEn: "Applicant Residential Address & Contact",
    labelGu: "અરજદારનું રહેઠાણનું સરનામું અને મોબાઈલ નંબર",
    labelHi: "आवेदक का आवासीय पता एवं मोबाइल नंबर",
    placeholderPattern: /\[APPLICANT_ADDRESS\]/i,
    promptQuestionEn: "Please provide your residential address and contact phone number for correspondence.",
    promptQuestionGu: "કૃપા કરીને પત્રવ્યવહાર માટે તમારું રહેઠાણનું સરનામું અને મોબાઈલ નંબર જણાવો.",
    promptQuestionHi: "कृपया पत्राचार के लिए अपना पूरा पता और फोन नंबर प्रदान करें।"
  }
];

export function validateLegalDraft(
  entities: Record<string, string>,
  documentDraft: string
): { isValid: boolean; errors: ValidationErrorItem[]; missingFieldCount: number } {
  const errors: ValidationErrorItem[] = [];

  for (const field of REQUIRED_LEGAL_FIELDS) {
    const entityVal = entities[field.key]?.trim();
    const hasUnresolvedPlaceholder = field.placeholderPattern.test(documentDraft);
    
    // An error is flagged if the entity is empty or if the placeholder still exists in draft
    if (!entityVal || entityVal.length < 2 || hasUnresolvedPlaceholder) {
      errors.push({
        fieldKey: field.key,
        labelEn: field.labelEn,
        labelGu: field.labelGu,
        labelHi: field.labelHi,
        missingDetail: !entityVal ? "Field is missing from captured requirements" : "Placeholder tag unresolved in draft text",
        promptQuestionEn: field.promptQuestionEn,
        promptQuestionGu: field.promptQuestionGu,
        promptQuestionHi: field.promptQuestionHi
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    missingFieldCount: errors.length
  };
}
