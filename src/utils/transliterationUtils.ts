/**
 * Multilingual Phonetic Transliteration Utility for Gujarati and Hindi
 * Integrates Google Input Tools API with instant client-side phonetic fallback
 */

const transliterationCache = new Map<string, string>();

// Common Legal & Vernacular Gujarati Dictionary for instant zero-latency translation
const GUJARATI_DICTIONARY: Record<string, string> = {
  arji: "અરજી",
  aavedan: "આવેદન",
  namaste: "નમસ્તે",
  namaskar: "નમસ્કાર",
  shree: "શ્રી",
  shri: "શ્રી",
  shriman: "શ્રીમાન",
  sahab: "સાહેબ",
  saheb: "સાહેબ",
  patel: "પટેલ",
  shah: "શાહ",
  joshi: "જોશી",
  dave: "દવે",
  desai: "દેસાઈ",
  parmar: "પરમાર",
  solanki: "સોલંકી",
  ahmedabad: "અમદાવાદ",
  surat: "સુરત",
  vadodara: "વડોદરા",
  rajkot: "રાજકોટ",
  bhavnagar: "ભાવનગર",
  jamnagar: "જામનગર",
  gandhinagar: "ગાંધીનગર",
  gujarat: "ગુજરાત",
  bharat: "ભારત",
  sarpanch: "સરપંચ",
  talati: "તલાટી",
  mamlatdar: "મામલતદાર",
  collector: "કલેક્ટર",
  police: "પોલીસ",
  court: "કોર્ટ",
  adhikari: "અધિકારી",
  mahiti: "માહિતી",
  adhikar: "અધિકાર",
  tarikh: "તારીખ",
  tariqh: "તારીખ",
  arjidar: "અરજદાર",
  saujan: "સૌજન્ય",
  sarkar: "સરકાર",
  sarkari: "સરકારી",
  karyalay: "કાર્યાલય",
  vibhag: "વિભાગ",
  dakhal: "દાખલ",
  dakhlo: "દાખલો",
  pramanpatra: "પ્રમાણપત્ર",
  sogandnamu: "સોગંદનામું",
  notis: "નોટિસ",
  notice: "નોટિસ",
  rupya: "રૂપિયા",
  rupiya: "રૂપિયા",
  paisa: "પૈસા",
  kharch: "ખર્ચ",
  aabhar: "આભાર",
  dhanyavad: "ધન્યવાદ",
  li: "લિ.",
  jay: "જય",
  hind: "હિન્દ",
  bharatmataki: "ભારતમાતાકી",
  gram: "ગ્રામ",
  panchayat: "પંચાયત",
  nagar: "નગર",
  palika: "પાલિકા",
  sevak: "સેવક",
  mantri: "મંત્રી",
  pramukh: "પ્રમુખ",
  nondhni: "નોંધણી",
  dastavej: "દસ્તાવેજ",
  jamin: "જમીન",
  makan: "મકાન",
  plot: "પ્લોટ",
  survey: "સર્વે",
  khata: "ખાતા",
  nambar: "નંબર",
  vishe: "વિષય",
  sandarbh: "સંદર્ભ",
  savina: "સવિનય",
  nivedan: "નિવેદન",
  mananiya: "માનનીય",
  jayhind: "જય હિન્દ",
  vandematram: "વંદે માતરમ"
};

// Common Legal & Vernacular Hindi Dictionary
const HINDI_DICTIONARY: Record<string, string> = {
  arji: "अर्जी",
  aavedan: "आवेदन",
  namaste: "नमस्ते",
  namaskar: "नमस्कार",
  shree: "श्री",
  shri: "श्री",
  shriman: "श्रीमान",
  sahab: "साहब",
  patel: "पटेल",
  sharma: "शर्मा",
  verma: "वर्मा",
  singh: "सिंह",
  kumar: "कुमार",
  delhi: "दिल्ली",
  dilli: "दिल्ली",
  mumbai: "मुंबई",
  lucknow: "लखनऊ",
  jaipur: "जयपुर",
  bharat: "भारत",
  suchna: "सूचना",
  adhikar: "अधिकार",
  adhikari: "अधिकारी",
  karyalay: "कार्यालय",
  vibhag: "विभाग",
  sarkar: "सरकार",
  sarkari: "सरकारी",
  pramanpatra: "प्रमाणपत्र",
  shapathpatra: "शपथपत्र",
  notice: "नोटिस",
  tarikh: "तारीख",
  rupaye: "रुपये",
  paisa: "पैसा",
  dhanyawad: "धन्यवाद",
  dhanyavad: "धन्यवाद",
  aabhar: "आभार",
  prarthna: "प्रार्थना",
  kripya: "कृपया",
  mahoday: "महोदय",
  sevame: "सेवा में",
  vishay: "विषय",
  sandarbh: "संदर्भ",
  savinay: "सविनय",
  nivedan: "निवेदन",
  aavedak: "आवेदक",
  bhavdiya: "भवदीय",
  pranali: "प्रणाली",
  nyayalaya: "न्यायालय",
  kanun: "कानून",
  kanuni: "कानूनी"
};

// Gujarati Phonetic Character Conversion Rules
const GU_CONSONANTS: Record<string, string> = {
  k: "ક", kh: "ખ", g: "ગ", gh: "ઘ", ng: "ઙ",
  ch: "ચ", chh: "છ", j: "જ", jh: "ઝ", z: "ઝ",
  t: "ત", th: "થ", d: "દ", dh: "ધ", n: "ન",
  T: "ટ", Th: "ઠ", D: "ડ", Dh: "ઢ", N: "ણ",
  p: "પ", ph: "ફ", f: "ફ", b: "બ", bh: "ભ", m: "મ",
  y: "ય", r: "ર", l: "લ", v: "વ", w: "વ",
  sh: "શ", Sh: "ષ", s: "સ", h: "હ", L: "ળ", ksh: "ક્ષ", gn: "જ્ઞ", gy: "જ્ઞ"
};

const GU_MATRAS: Record<string, string> = {
  aa: "ા", a: "", ii: "ી", ee: "ી", i: "િ",
  uu: "ૂ", oo: "ો", u: "ુ", e: "ે", ai: "ૈ",
  o: "ો", au: "ૌ", am: "ં", an: "ં", ah: "ઃ"
};

const GU_VOWELS: Record<string, string> = {
  a: "અ", aa: "આ", i: "ઇ", ii: "ઈ", ee: "ઈ",
  u: "ઉ", uu: "ઊ", e: "એ", ai: "ઐ", o: "ઓ", au: "ઔ",
  am: "અં", an: "અં", ah: "અઃ"
};

/**
 * Phonetic Transliteration Fallback Converter
 */
function phoneticConvert(word: string, targetLang: "gu" | "hi"): string {
  const lower = word.toLowerCase();
  
  if (targetLang === "gu") {
    if (GUJARATI_DICTIONARY[lower]) {
      return GUJARATI_DICTIONARY[lower];
    }
  } else if (targetLang === "hi") {
    if (HINDI_DICTIONARY[lower]) {
      return HINDI_DICTIONARY[lower];
    }
  }

  // Basic rule-based phonetic generator for Gujarati
  if (targetLang === "gu") {
    let result = "";
    let i = 0;
    const len = word.length;

    while (i < len) {
      // 3-char consonants
      const three = word.substring(i, i + 3).toLowerCase();
      if (GU_CONSONANTS[three]) {
        result += GU_CONSONANTS[three];
        i += 3;
        continue;
      }

      // 2-char consonants/vowels
      const two = word.substring(i, i + 2).toLowerCase();
      if (GU_CONSONANTS[two]) {
        result += GU_CONSONANTS[two];
        i += 2;
        continue;
      }
      if (i === 0 && GU_VOWELS[two]) {
        result += GU_VOWELS[two];
        i += 2;
        continue;
      }
      if (GU_MATRAS[two]) {
        result += GU_MATRAS[two];
        i += 2;
        continue;
      }

      // 1-char
      const one = word[i].toLowerCase();
      if (i === 0 && GU_VOWELS[one]) {
        result += GU_VOWELS[one];
        i++;
        continue;
      }
      if (GU_CONSONANTS[one]) {
        result += GU_CONSONANTS[one];
        i++;
        continue;
      }
      if (GU_MATRAS[one]) {
        result += GU_MATRAS[one];
        i++;
        continue;
      }

      // Default character
      result += word[i];
      i++;
    }
    return result || word;
  }

  return word;
}

/**
 * Transliterates a single phonetic word to Gujarati or Hindi using Google Input Tools API with local fallback
 */
export async function transliterateWord(
  word: string,
  targetLang: "gu" | "hi" | "en"
): Promise<string> {
  const clean = word.trim();
  if (!clean || targetLang === "en") return word;

  const cacheKey = `${targetLang}:${clean.toLowerCase()}`;
  if (transliterationCache.has(cacheKey)) {
    return transliterationCache.get(cacheKey)!;
  }

  // Check direct local dictionary first for instantaneous response
  const lower = clean.toLowerCase();
  if (targetLang === "gu" && GUJARATI_DICTIONARY[lower]) {
    const res = GUJARATI_DICTIONARY[lower];
    transliterationCache.set(cacheKey, res);
    return res;
  }
  if (targetLang === "hi" && HINDI_DICTIONARY[lower]) {
    const res = HINDI_DICTIONARY[lower];
    transliterationCache.set(cacheKey, res);
    return res;
  }

  // Google Input Tools API
  const itc = targetLang === "gu" ? "gu-t-i0-und" : "hi-t-i0-und";
  const url = `https://inputtools.google.com/request?text=${encodeURIComponent(
    clean
  )}&itc=${itc}&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1800) });
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] === "SUCCESS" && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
        const transliterated = data[1][0][1][0];
        transliterationCache.set(cacheKey, transliterated);
        return transliterated;
      }
    }
  } catch {
    // Fallback to local rule-based transliterator on timeout or offline
  }

  const fallback = phoneticConvert(clean, targetLang);
  transliterationCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * Process text input on word boundary (space, enter, punctuation)
 * Replaces the last word before cursor if typed phonetically
 */
export async function processTransliterationOnInput(
  text: string,
  cursorPosition: number,
  targetLang: "gu" | "hi" | "en"
): Promise<{ newText: string; newCursor: number } | null> {
  if (targetLang === "en") return null;

  // Find the word directly preceding the cursor
  const textBeforeCursor = text.substring(0, cursorPosition);
  const match = textBeforeCursor.match(/([a-zA-Z]+)(\s|[,।!?\n])$/);

  if (!match) return null;

  const englishWord = match[1];
  const trailingChar = match[2];
  const wordStartPos = cursorPosition - match[0].length;

  const transliterated = await transliterateWord(englishWord, targetLang);

  if (transliterated === englishWord) return null;

  const newBefore = text.substring(0, wordStartPos) + transliterated + trailingChar;
  const newText = newBefore + text.substring(cursorPosition);
  const newCursor = newBefore.length;

  return { newText, newCursor };
}
