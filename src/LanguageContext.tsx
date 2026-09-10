import React, { createContext, useContext, useState, useEffect } from "react";

export type LanguageCode = "en" | "gu" | "hi";

export interface TranslationDictionary {
  home: string;
  services: string;
  blog: string;
  aboutUs: string;
  dashboard: string;
  admin: string;
  contact: string;
  bookAppointment: string;
  orderNow: string;
  heroHeading: string;
  heroProfessional: string;
  heroSubtext: string;
  trustedBadge: string;
  myAccount: string;
  secure: string;
  fast: string;
  support: string;
  lookingFor: string;
  contactUs: string;
  contactSub: string;
  sendInquiry: string;
  fillForm: string;
  fullName: string;
  emailAddr: string;
  phoneNum: string;
  subject: string;
  message: string;
  sendMessage: string;
  messageUs: string;
  messageUsSub: string;
  callUs: string;
  callUsSub: string;
  appointmentTitle: string;
  appointmentSub: string;
  bookNow: string;
  sentSuccess: string;
  allFieldsReq: string;
  officeHoursTitle: string;
  liveClock: string;
  checkAvailability: string;
  openNow: string;
  closedNow: string;
  adminSettings: string;
  findUsOnMap: string;
  workHours: string;
  address: string;
  unavailable: string;
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    home: "Home",
    services: "Services",
    blog: "Blog",
    aboutUs: "About Us",
    dashboard: "Dashboard",
    admin: "Admin",
    contact: "Contact",
    bookAppointment: "Book Appointment",
    orderNow: "Order Now",
    heroHeading: "Fast, Reliable &",
    heroProfessional: "Professional",
    heroSubtext:
      "Your one-stop solution for government applications, legal translations, typing services, and business registrations. We handle the paperwork so you don't have to.",
    trustedBadge: "Trusted Government & Online Services",
    myAccount: "My Account",
    secure: "100% Secure",
    fast: "Fast Processing",
    support: "Expert Support",
    lookingFor: "Looking for a service?",
    contactUs: "Contact Us",
    contactSub: "Have a question or need assistance? We're here to help.",
    sendInquiry: "Send us your inquiry",
    fillForm:
      "Fill out the form below and we'll get back to you as soon as possible.",
    fullName: "Full Name",
    emailAddr: "Email Address",
    phoneNum: "Phone Number",
    subject: "Subject",
    message: "Message",
    sendMessage: "Send Message",
    messageUs: "Message Us",
    messageUsSub: "We're here to help you with any questions or concerns.",
    callUs: "Call Us",
    callUsSub: "Mon-Sat from 10am to 8pm.",
    appointmentTitle: "Book an Appointment",
    appointmentSub:
      "Skip the wait! Schedule a professional consultation at your preferred time.",
    bookNow: "Book Now",
    sentSuccess: "Message sent successfully!",
    allFieldsReq: "All fields are required",
    officeHoursTitle: "Professional Office Hours",
    liveClock: "Live Clock",
    checkAvailability:
      "Check our availability and visit us during working hours.",
    openNow: "Open Now",
    closedNow: "Closed Now",
    adminSettings: "Admin Settings",
    findUsOnMap: "Find Us on Map",
    workHours: "Work Hours",
    address:
      "Amit Online Services, Office No. 9 Gyan Nagar, Near Old Suda Bhavan, Behind Old Bahumali Building, Nanpura, Surat, Gujarat 395001",
    unavailable: "Unavailable",
  },
  gu: {
    home: "હોમ",
    services: "સેવાઓ",
    blog: "બ્લોગ",
    aboutUs: "અમારા વિશે",
    dashboard: "ડેશબોર્ડ",
    admin: "એડમિન",
    contact: "સંપર્ક",
    bookAppointment: "એપોઈન્ટમેન્ટ બુક કરો",
    orderNow: "ઓર્ડર કરો",
    heroHeading: "ઝડપી, ભરોસાપાત્ર અને",
    heroProfessional: "વ્યાવસાયિક",
    heroSubtext:
      "સરકારી અરજીઓ, કાયદાકીય અનુવાદો, ટાઈપિંગ સેવાઓ અને વ્યવસાય નોંધણી માટે તમારું વન-સ્ટોપ સોલ્યુશન. અમે કાગળનું કામ સંભાળીએ છીએ તેથી તમારે કરવાની જરૂર નથી.",
    trustedBadge: "વિશ્વાસપાત્ર સરકારી અને ઓનલાઈન સેવાઓ",
    myAccount: "મારું એકાઉન્ટ",
    secure: "100% સુરક્ષિત",
    fast: "ઝડપી પ્રોસેસિંગ",
    support: "નિષ્ણાત સપોર્ટ",
    lookingFor: "સેવા શોધી રહ્યા છો?",
    contactUs: "અમારો સંપર્ક કરો",
    contactSub: "પ્રશ્ન છે કે સહાયની જરૂર છે? અમે મદદ કરવા માટે અહીં છીએ.",
    sendInquiry: "અમને તમારી પૂછપરછ મોકલો",
    fillForm: "કે નીચેનું ફોર્મ ભરો અને અમે વહેલી તકે તમારો સંપર્ક કરીશું.",
    fullName: "પૂરું નામ",
    emailAddr: "ઇમેઇલ સરનામું",
    phoneNum: "ફોન નંબર",
    subject: "વિષય",
    message: "સંદેશ",
    sendMessage: "સંદેશ મોકલો",
    messageUs: "અમને મેસેજ કરો",
    messageUsSub:
      "અમે તમને કોઈપણ પ્રશ્નો અથવા ચિંતાઓ સાથે મદદ કરવા માટે અહીં છીએ.",
    callUs: "અમને કોલ કરો",
    callUsSub: "સોમ-શનિ સવારે ૧૦ થી રાત્રે ૮ સુધી.",
    appointmentTitle: "એપોઈન્ટમેન્ટ બુક કરો",
    appointmentSub:
      "રાહ જોવાનું છોડો! તમારા મનપસંદ સમયે વ્યાવસાયિક પરામર્શ સુનિશ્ચિત કરો.",
    bookNow: "હમણાં બુક કરો",
    sentSuccess: "સંદેશ સફળતાપૂર્વક મોકલ્યો!",
    allFieldsReq: "બધા ફીલ્ડ્સ જરૂરી છે",
    officeHoursTitle: "વ્યાવસાયિક ઓફિસ સમય",
    liveClock: "લાઇવ ઘડિયાળ",
    checkAvailability:
      "અમારી ઉપલબ્ધતા તપાસો અને કામકાજના કલાકો દરમિયાન અમારી મુલાકાત લો.",
    openNow: "હમણાં ખુલ્લું છે",
    closedNow: "હમણાં બંધ છે",
    adminSettings: "એડમિન સેટિંગ્સ",
    findUsOnMap: "અમને નકશા પર શોધો",
    workHours: "ઓફિસ સમય",
    address:
      "અમિત ઓનલાઈન સર્વિસીસ, ઓફિસ નં. ૯ જ્ઞાન નગર, જૂના સુડા ભવન પાસે, જૂની બહુમાળી બિલ્ડિંગ પાછળ, નાનપુરા, સુરત, ગુજરાત ૩૯૫૦૦૧",
    unavailable: "અનુપલબ્ધ",
  },
  hi: {
    home: "होम",
    services: "सेवाएं",
    blog: "ब्लॉग",
    aboutUs: "हमारे बारे में",
    dashboard: "डैशबोर्ड",
    admin: "एडमिन",
    contact: "संपर्क",
    bookAppointment: "अपॉइंटमेंट बुक करें",
    orderNow: "अभी ऑर्डर करें",
    heroHeading: "तेज़, विश्वसनीय और",
    heroProfessional: "पेशेवर",
    heroSubtext: "सरकारी आवेदनों, कानूनी अनुवादों, टाइपिंग सेवाओं और व्यावसायिक पंजीकरण के लिए आपका वन-स्टॉप समाधान। हम कागजी कार्रवाई संभालते हैं ताकि आपको ऐसा न करना पड़े।",
    trustedBadge: "विश्वसनीय सरकारी और ऑनलाइन सेवाएं",
    myAccount: "मेरा खाता",
    secure: "100% सुरक्षित",
    fast: "तेज़ प्रसंस्करण",
    support: "विशेषज्ञ सहायता",
    lookingFor: "एक सेवा की तलाश है?",
    contactUs: "हमसे संपर्क करें",
    contactSub: "कोई प्रश्न है या सहायता की आवश्यकता है? हम मदद के लिए यहाँ हैं।",
    sendInquiry: "हमें अपनी पूछताछ भेजें",
    fillForm: "नीचे दिया गया फॉर्म भरें और हम जल्द से जल्द आपसे संपर्क करेंगे।",
    fullName: "पूरा नाम",
    emailAddr: "ईमेल पता",
    phoneNum: "फ़ोन नंबर",
    subject: "विषय",
    message: "संदेश",
    sendMessage: "संदेश भेजें",
    messageUs: "हमें संदेश भेजें",
    messageUsSub: "हम आपकी किसी भी समस्या या प्रश्न में सहायता के लिए यहाँ हैं।",
    callUs: "हमें कॉल करें",
    callUsSub: "सोमवार-शनिवार सुबह 10 से रात 8 तक।",
    appointmentTitle: "अपॉइंटमेंट बुक करें",
    appointmentSub: "लंबी लाइनों से बचें! अपने पसंदीदा समय पर परामर्श निर्धारित करें।",
    bookNow: "अभी बुक करें",
    sentSuccess: "संदेश सफलतापूर्वक भेजा गया!",
    allFieldsReq: "सभी फ़ील्ड आवश्यक हैं",
    officeHoursTitle: "पेशेवर कार्य समय",
    liveClock: "लाइव घड़ी",
    checkAvailability: "हमारी उपलब्धता की जाँच करें और कार्य समय के दौरान हमसे मिलें।",
    openNow: "अभी खुला है",
    closedNow: "अभी बंद है",
    adminSettings: "एडमिन सेटिंग्स",
    findUsOnMap: "हमें मानचित्र पर खोजें",
    workHours: "कार्य समय",
    address: "अमित ऑनलाइन सर्विसेज, ऑफिस नंबर 9 ज्ञान नगर, पुराना सूडा भवन के पास, पुरानी बहुमंजिला इमारत के पीछे, नानपुरा, सूरत, गुजरात 395001",
    unavailable: "अनुपलब्ध",
  },
};

interface LanguageContextType {
  lang: LanguageCode;
  t: TranslationDictionary;
  setLang: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem("aos_lang") as LanguageCode;
    return (saved === "en" || saved === "gu" || saved === "hi") ? saved : "gu";
  });

  const setLang = (newLang: LanguageCode) => {
    localStorage.setItem("aos_lang", newLang);
    setLangState(newLang);
    // Standard trigger custom event for synchronizing in case non-React triggers it
    window.dispatchEvent(new Event("languagechange"));
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "aos_lang" && e.newValue) {
        const val = e.newValue as LanguageCode;
        if (val === "en" || val === "gu" || val === "hi") {
          setLangState(val);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const t = translations[lang] || translations.gu;

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// --- Native Language Context & Translation Dictionary (useTranslation i18n system) ---
export const TRANSLATIONS = {
  en: {
    // Header navigation
    nav_home: "Home",
    nav_services: "Services",
    nav_account: "Account",
    nav_admin: "Admin",
    nav_login: "Login",
    nav_logout: "Logout",
    nav_gov_services: "Government Services",
    nav_blog: "Blog",
    nav_about: "About Us",
    nav_faq: "FAQs",
    nav_contact: "Contact",

    // Home Page
    home_title: "Fast, Reliable & Professional Online Services",
    home_subtitle: "Your one-stop solution for government applications, legal translations, typing services, and business registrations. We handle the paperwork so you don't have to.",
    why_choose_us: "Why Choose Us",
    card_secure_title: "100% Secure",
    card_secure_desc: "Your documents and private information are protected by bank-grade security protocols.",
    card_fast_title: "Fast Processing",
    card_fast_desc: "We ensure rapid turnaround times with constant status tracking and updates.",
    card_support_title: "Expert Support",
    card_support_desc: "Our team offers dedicated support for your complicated applications and legal processes.",

    // Generic Buttons
    btn_apply: "Apply",
    btn_view_details: "View Details",
    btn_track_order: "Track Order",
    btn_cancel: "Cancel",
    btn_order_now: "Order Now",
    btn_book_appointment: "Book Appointment",

    // Tracking Widget
    track_title: "Track Your Order Status",
    track_placeholder: "Enter your Order ID (e.g., AOS-1001)",
    track_btn: "Track Status",
    track_help_text: "Hold your physical transaction token receipt QR level with the camera aperture box for auto tracking.",
  },
  gu: {
    // Header navigation
    nav_home: "હોમ",
    nav_services: "સેવાઓ",
    nav_account: "એકાઉન્ટ",
    nav_admin: "એડમિન",
    nav_login: "લોગિન",
    nav_logout: "લોગઆઉટ",
    nav_gov_services: "સરકારી સેવાઓ",
    nav_blog: "બ્લોગ",
    nav_about: "અમારા વિશે",
    nav_faq: "સામાન્ય પ્રશ્નો (FAQ)",
    nav_contact: "સંપર્ક",

    // Home Page
    home_title: "ઝડપી, ભરોસાપાત્ર અને વ્યાવસાયિક ઓનલાઇન સેવાઓ",
    home_subtitle: "સરકારી અરજીઓ, કાયદાકીય અનુવાદો, ટાઈપિંગ સેવાઓ અને વ્યવસાય નોંધણી માટે તમારું વન-સ્ટોપ સોલ્યુશન. અમે કાગળનું કામ સંભાળીએ છીએ તેથી તમારે કરવાની જરૂર નથી.",
    why_choose_us: "શા માટે અમને પસંદ કરો",
    card_secure_title: "100% સુરક્ષિત",
    card_secure_desc: "તમારા દસ્તાવેજો અને ખાનગી માહિતી બેંક-ગ્રેડ સુરક્ષા પ્રોટોકોલ દ્વારા સુરક્ષિત છે.",
    card_fast_title: "ઝડપી પ્રોસેસિંગ",
    card_fast_desc: "અમે સતત સ્ટેટસ ટ્રેકિંગ અને અપડેટ્સ સાથે ઝડપી ટર્નઅરાઉન્ડ સમય સુનિશ્ચિત કરીએ છીએ.",
    card_support_title: "નિષ્ણાત સપોર્ટ",
    card_support_desc: "અમારી ટીમ તમારી જટિલ અરજીઓ અને કાનૂની પ્રક્રિયાઓ માટે સમર્પિત સપોર્ટ આપે છે.",

    // Generic Buttons
    btn_apply: "અરજી કરો",
    btn_view_details: "વિગતો જુઓ",
    btn_track_order: "ઓર્ડર ટ્રેક કરો",
    btn_cancel: "રદ કરો",
    btn_order_now: "ઓર્ડર કરો",
    btn_book_appointment: "એપોઇન્ટમેન્ટ બુક કરો",

    // Tracking Widget
    track_title: "તમારા ઓર્ડરનું સ્ટેટસ ટ્રેક કરો",
    track_placeholder: "તમારો ઓર્ડર આઈડી દાખલ કરો (દા.ત., AOS-1001)",
    track_btn: "સ્ટેટસ ટ્રેક કરો",
    track_help_text: "સ્વચાલિત ટ્રેકિંગ માટે તમારા ભૌતિક ટ્રાન્ઝેક્શન ટોકન રસીદ ક્યુઆરને કૅમેરા સાથે સંરેખિત કરો.",
  },
  hi: {
    // Header navigation
    nav_home: "होम",
    nav_services: "सेवाएं",
    nav_account: "खाता",
    nav_admin: "एडमिन",
    nav_login: "लॉगिन",
    nav_logout: "लॉगआउट",
    nav_gov_services: "सरकारी सेवाएं",
    nav_blog: "ब्लॉग",
    nav_about: "हमारे बारे में",
    nav_faq: "सामान्य प्रश्न (FAQ)",
    nav_contact: "संपर्क",

    // Home Page
    home_title: "तेज़, विश्वसनीय और पेशेवर ऑनलाइन सेवाएं",
    home_subtitle: "सरकारी आवेदनों, कानूनी अनुवादों, टाइपिंग सेवाओं और व्यावसायिक पंजीकरण के लिए आपका वन-स्टॉप समाधान। हम कागजी कार्रवाई संभालते हैं ताकि आपको ऐसा न करना पड़े।",
    why_choose_us: "हमें क्यों चुनें",
    card_secure_title: "100% सुरक्षित",
    card_secure_desc: "आपके दस्तावेज़ और निजी जानकारी बैंक-ग्रेड सुरक्षा प्रोटोकॉल द्वारा सुरक्षित हैं।",
    card_fast_title: "तेज़ प्रसंस्करण",
    card_fast_desc: "हम निरंतर स्थिति ट्रैकिंग और अपडेट के साथ त्वरित बदलाव समय सुनिश्चित करते हैं।",
    card_support_title: "विशेषज्ञ सहायता",
    card_support_desc: "हमारी टीम आपके जटिल आवेदनों और कानूनी प्रक्रियाओं के लिए समर्पित सहायता प्रदान करती है.",

    // Generic Buttons
    btn_apply: "आवेदन करें",
    btn_view_details: "विवरण देखें",
    btn_track_order: "ऑर्डर ट्रैक करें",
    btn_cancel: "रद्द करें",
    btn_order_now: "ऑर्डर करें",
    btn_book_appointment: "अपॉइंटमेंट बुक करें",

    // Tracking Widget
    track_title: "अपने ऑर्डर की स्थिति ट्रैक करें",
    track_placeholder: "अपना ऑर्डर आईडी दर्ज करें (जैसे, AOS-1001)",
    track_btn: "स्थिति ट्रैक करें",
    track_help_text: "स्वचालित ट्रैकिंग के लिए अपने भौतिक लेनदेन टोकन रसीद क्यूआर को कैमरे के साथ संरेखित करें.",
  }
};

export const useTranslation = () => {
  const { lang, setLang } = useLanguage();
  return {
    language: lang,
    setLanguage: setLang,
    t: (key: keyof typeof TRANSLATIONS.en): string => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.gu;
      return dict[key] || TRANSLATIONS.en[key] || String(key);
    }
  };
};
