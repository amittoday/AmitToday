// Pricing constants defined exactly according to Translation_Rate.jpg and Typing_Rate.jpg
export const TYPING_RATE_CARD: Record<string, number> = {
  English: 0.25,
  Gujarati: 0.30,
  Hindi: 0.35,
  Sanskrit: 0.45,
};

// Default baseline rates
export const TYPING_RATE_PER_WORD = 0.25;
export const TRANSLATION_RATE_PER_WORD = 0.50;

export const TRANSLATION_RATE_CARD: Record<string, number> = {
  "English To Gujarati": 0.50,
  "English To Hindi": 0.90,
  "Gujarati To English": 0.70,
  "Gujarati To Hindi": 0.60,
  "Hindi To Gujarati": 0.50,
  "Hindi To English": 0.90,
};

// Surcharge additions
export const EXPRESS_DELIVERY_FEE = 50.00; // Flat surcharge
export const HARD_TO_READ_MULTIPLIER = 0.50; // +50% surcharge

/**
 * Gets the standardized rate per word for typing/translation based on language selections.
 */
export const getRatePerWord = (serviceType: string, sourceLang: string, targetLang?: string): number => {
  const service = (serviceType || "").toLowerCase();
  if (service.includes("typing")) {
    const lang = sourceLang === "Auto Detect" ? "English" : sourceLang;
    return TYPING_RATE_CARD[lang] || 0.25;
  } else if (service.includes("translation")) {
    const src = sourceLang === "Auto Detect" ? "English" : sourceLang;
    const tgt = targetLang || "Gujarati";
    const key = `${src} To ${tgt}`;
    return TRANSLATION_RATE_CARD[key] || 0.50;
  }
  return 0.50; // Generic fallback
};
